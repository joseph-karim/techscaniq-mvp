import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { ComprehensiveScoringService, EvidenceItem } from '../lib/scoring/comprehensive-scoring'
import { getAllAnalysisPrompts, type AnalysisPrompt } from '../lib/prompts/analysis-prompts'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load environment variables
config()

interface ReportGenerationJob {
  scanRequestId: string
  company: string
  domain: string
  investmentThesis: string
  evidenceJobId?: string
  investorProfile?: any
}

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const scoringService = new ComprehensiveScoringService()

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

// Group evidence by type for analysis
function groupEvidenceByType(evidence: any[]) {
  const grouped: Record<string, any[]> = {
    technology: [],
    market: [],
    team: [],
    financial: [],
    security: [],
    general: []
  }

  evidence.forEach(item => {
    const type = item.evidence_type || item.type || 'general'
    
    if (type.includes('tech') || type.includes('stack') || type.includes('architecture')) {
      grouped.technology.push(item)
    } else if (type.includes('market') || type.includes('competitor') || type.includes('customer')) {
      grouped.market.push(item)
    } else if (type.includes('team') || type.includes('culture') || type.includes('employee')) {
      grouped.team.push(item)
    } else if (type.includes('financial') || type.includes('pricing') || type.includes('revenue')) {
      grouped.financial.push(item)
    } else if (type.includes('security') || type.includes('compliance')) {
      grouped.security.push(item)
    } else {
      grouped.general.push(item)
    }
  })

  return grouped
}

// Apply analysis prompt to evidence
async function analyzeWithPrompt(
  prompt: AnalysisPrompt,
  evidence: any[],
  context: {
    companyName: string
    companyDomain: string
    investmentThesis: string
  }
): Promise<any> {
  try {
    // Build the full prompt
    const systemMessage = prompt.systemPrompt
    const taskMessage = prompt.taskDescription
    
    // Replace variables in input context
    const inputContext = prompt.inputContext.map(input => 
      input
        .replace('${companyName}', context.companyName)
        .replace('${companyDomain}', context.companyDomain)
        .replace('${investmentThesis}', context.investmentThesis)
        .replace('${techEvidence}', JSON.stringify(evidence))
        .replace('${marketEvidence}', JSON.stringify(evidence))
        .replace('${teamEvidence}', JSON.stringify(evidence))
        .replace('${financialData}', JSON.stringify(evidence))
        .replace('${securityData}', JSON.stringify(evidence))
    ).join('\n')
    
    const methodology = prompt.methodology.map(m => `- ${m}`).join('\n')
    
    const fullPrompt = `${systemMessage}

${taskMessage}

# Input Context
${inputContext}

# Methodology & Constraints
${methodology}

# Output Format
Provide only the formatted output as described below. Do not include any introductory text, greetings, or commentary.
${prompt.outputFormat}`

    // Call Gemini AI
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON response
    try {
      // Extract JSON from the response (sometimes wrapped in markdown code blocks)
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/)
      const jsonStr = jsonMatch ? jsonMatch[1] : text
      return JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw response:', text)
      
      // Return a fallback structure
      return {
        summary: text.slice(0, 500),
        error: 'Failed to parse structured response',
        rawResponse: text
      }
    }
  } catch (error) {
    console.error(`Analysis failed for ${prompt.name}:`, error)
    return {
      error: error instanceof Error ? error.message : 'Analysis failed',
      summary: 'Unable to complete analysis due to an error'
    }
  }
}

// Generate comprehensive report with real analysis
async function generateAnalyzedReport(
  company: string,
  domain: string,
  investmentThesis: string,
  evidence: any[],
  investorProfile: any
) {
  console.log(`Starting AI analysis for ${company} with ${evidence.length} evidence items`)
  
  // Group evidence by type
  const groupedEvidence = groupEvidenceByType(evidence)
  
  // Get analysis prompts (from DB or defaults)
  const prompts = getAllAnalysisPrompts()
  
  // Perform parallel analysis for each section
  const [
    techAnalysis,
    marketAnalysis,
    teamAnalysis,
    financialAnalysis,
    securityAnalysis
  ] = await Promise.all([
    analyzeWithPrompt(
      prompts.find(p => p.id === 'tech-stack-analysis')!,
      groupedEvidence.technology,
      { companyName: company, companyDomain: domain, investmentThesis }
    ),
    analyzeWithPrompt(
      prompts.find(p => p.id === 'market-position-analysis')!,
      groupedEvidence.market,
      { companyName: company, companyDomain: domain, investmentThesis }
    ),
    analyzeWithPrompt(
      prompts.find(p => p.id === 'team-culture-analysis')!,
      groupedEvidence.team,
      { companyName: company, companyDomain: domain, investmentThesis }
    ),
    analyzeWithPrompt(
      prompts.find(p => p.id === 'financial-analysis')!,
      groupedEvidence.financial,
      { companyName: company, companyDomain: domain, investmentThesis }
    ),
    analyzeWithPrompt(
      prompts.find(p => p.id === 'security-compliance-analysis')!,
      groupedEvidence.security,
      { companyName: company, companyDomain: domain, investmentThesis }
    )
  ])

  // Calculate comprehensive scoring
  const evidenceItems: EvidenceItem[] = evidence.map(item => ({
    id: item.id,
    type: item.evidence_type || item.type || 'general',
    category: item.category || 'general',
    content: item.content_data?.summary || item.content_data?.processed || item.summary || '',
    source: item.source_url || item.source || '',
    confidence: item.confidence_score || 0.7,
    timestamp: item.created_at || new Date().toISOString(),
    metadata: item.metadata || {}
  }))

  const comprehensiveScore = scoringService.calculateComprehensiveScore(
    evidenceItems,
    investorProfile?.investmentThesisData || { type: investmentThesis }
  )

  // Generate investment synthesis with all analysis
  const synthesisPrompt = prompts.find(p => p.id === 'investment-synthesis')!
  const investmentSynthesis = await analyzeWithPrompt(
    synthesisPrompt,
    evidence,
    {
      companyName: company,
      companyDomain: domain,
      investmentThesis,
      techAnalysis: JSON.stringify(techAnalysis),
      marketAnalysis: JSON.stringify(marketAnalysis),
      teamAnalysis: JSON.stringify(teamAnalysis),
      financialAnalysis: JSON.stringify(financialAnalysis),
      securityAnalysis: JSON.stringify(securityAnalysis),
      evidenceMetrics: JSON.stringify({
        total: evidence.length,
        quality: comprehensiveScore.confidenceBreakdown.evidenceQuality,
        coverage: comprehensiveScore.confidenceBreakdown.evidenceCoverage
      })
    } as any
  )

  // Build the report structure with actual content in sections
  const reportData = {
    // Company Information
    companyInfo: {
      name: company,
      website: `https://${domain}`,
      description: techAnalysis.summary || `${company} operating in ${investmentThesis} space`,
      ...extractCompanyInfo(evidence, techAnalysis, marketAnalysis)
    },
    
    // Executive Summary from synthesis
    executiveSummary: {
      title: 'Executive Summary',
      content: investmentSynthesis.executiveSummary || generateExecutiveSummary(
        company, 
        comprehensiveScore, 
        investmentSynthesis
      )
    },
    
    // Report sections with full content
    sections: [
      {
        title: 'Technology Stack & Architecture',
        content: formatTechnologyAnalysis(techAnalysis),
        score: techAnalysis.scalabilityScore || comprehensiveScore.technicalScore,
        subsections: [
          {
            title: 'Core Technologies',
            content: formatTechStack(techAnalysis.primaryStack)
          },
          {
            title: 'Architecture Assessment',
            content: formatArchitecture(techAnalysis.architectureHighlights)
          },
          {
            title: 'Technical Risks & Opportunities',
            content: formatTechRisks(techAnalysis.technicalRisks, techAnalysis.technicalStrengths)
          }
        ]
      },
      {
        title: 'Market Position & Competition',
        content: formatMarketAnalysis(marketAnalysis),
        score: marketAnalysis.competitivePosition?.marketShare ? 80 : 70,
        subsections: [
          {
            title: 'Market Size & Growth',
            content: formatMarketSize(marketAnalysis.marketSize)
          },
          {
            title: 'Competitive Landscape',
            content: formatCompetitors(marketAnalysis.competitors)
          },
          {
            title: 'Growth Opportunities',
            content: formatGrowthDrivers(marketAnalysis.growthDrivers)
          }
        ]
      },
      {
        title: 'Team & Organizational Strength',
        content: formatTeamAnalysis(teamAnalysis),
        score: teamAnalysis.leadershipScore || comprehensiveScore.teamScore,
        subsections: [
          {
            title: 'Leadership Assessment',
            content: formatLeadership(teamAnalysis.keyLeaders)
          },
          {
            title: 'Culture & Execution',
            content: formatCulture(teamAnalysis.culturalIndicators)
          },
          {
            title: 'Scaling Readiness',
            content: formatScaleReadiness(teamAnalysis.scaleReadiness)
          }
        ]
      },
      {
        title: 'Financial Health & Unit Economics',
        content: formatFinancialAnalysis(financialAnalysis),
        score: calculateFinancialScore(financialAnalysis),
        subsections: [
          {
            title: 'Revenue & Growth',
            content: formatRevenue(financialAnalysis.revenueEstimates)
          },
          {
            title: 'Unit Economics',
            content: formatUnitEconomics(financialAnalysis.unitEconomics)
          },
          {
            title: 'Path to Profitability',
            content: formatProfitability(financialAnalysis.profitabilityPath)
          }
        ]
      },
      {
        title: 'Security & Compliance',
        content: formatSecurityAnalysis(securityAnalysis),
        score: securityAnalysis.securityScore || 70, // Default security score
        subsections: [
          {
            title: 'Security Posture',
            content: formatSecurityPosture(securityAnalysis.technicalSecurity)
          },
          {
            title: 'Compliance Status',
            content: formatCompliance(securityAnalysis.compliance)
          },
          {
            title: 'Enterprise Readiness',
            content: formatEnterpriseReadiness(securityAnalysis.enterpriseReadiness)
          }
        ]
      },
      {
        title: 'Investment Recommendation',
        content: formatInvestmentRecommendation(investmentSynthesis),
        score: investmentSynthesis.investmentScore || comprehensiveScore.confidenceAdjustedScore,
        subsections: [
          {
            title: 'Value Creation Plan',
            content: formatValueCreation(investmentSynthesis.valueCreationPlan)
          },
          {
            title: 'Risk Mitigation',
            content: formatRiskMitigation(investmentSynthesis.keyRisks)
          },
          {
            title: 'Next Steps',
            content: formatNextSteps(investmentSynthesis.nextSteps)
          }
        ]
      }
    ],
    
    // Additional report metadata
    metadata: {
      comprehensiveScore,
      analysisTimestamp: new Date().toISOString(),
      evidenceCount: evidence.length,
      aiModel: 'gemini-1.5-pro',
      analysisDepth: 'comprehensive'
    },
    
    // Investment metrics
    investment_score: investmentSynthesis.investmentScore || comprehensiveScore.confidenceAdjustedScore,
    tech_health_score: techAnalysis.scalabilityScore * 10 || comprehensiveScore.technicalScore,
    tech_health_grade: comprehensiveScore.finalGrade,
    investment_rationale: investmentSynthesis.executiveSummary || 'See detailed analysis in report sections'
  }

  return {
    reportData,
    investmentScore: reportData.investment_score,
    grade: reportData.tech_health_grade,
    citations: generateCitations(evidence, reportData)
  }
}

// Helper functions to format analysis results into readable content
function formatTechnologyAnalysis(analysis: any): string {
  if (analysis.error) return `Analysis incomplete: ${analysis.error}`
  
  return `## Technology Assessment

${analysis.summary || 'Technology analysis pending.'}

### Stack Overview
The technology foundation demonstrates ${analysis.scalabilityScore > 7 ? 'strong' : 'moderate'} scalability potential with a ${analysis.securityPosture?.toLowerCase() || 'developing'} security posture.

### Key Findings
- **Technical Debt Score**: ${analysis.technicalDebtScore}/10 (lower is better)
- **Scalability Score**: ${analysis.scalabilityScore}/10
- **Security Posture**: ${analysis.securityPosture}

${analysis.investmentPerspective?.keyTakeaway || ''}`
}

function formatMarketAnalysis(analysis: any): string {
  if (analysis.error) return `Analysis incomplete: ${analysis.error}`
  
  return `## Market Position Analysis

${analysis.summary || 'Market analysis pending.'}

### Market Opportunity
- **Total Addressable Market**: ${analysis.marketSize?.tam || 'Not determined'}
- **Growth Rate**: ${analysis.marketSize?.growthRate || 'Not determined'}
- **Market Position**: ${analysis.competitivePosition?.ranking || 'Not determined'}

### Competitive Standing
The company holds ${analysis.competitivePosition?.marketShare || 'an undetermined'} market share with a ${analysis.competitivePosition?.trajectory?.toLowerCase() || 'stable'} trajectory.

${analysis.investmentPerspective?.keyTakeaway || ''}`
}

function formatTeamAnalysis(analysis: any): string {
  if (analysis.error) return `Analysis incomplete: ${analysis.error}`
  
  return `## Team & Organizational Assessment

${analysis.summary || 'Team analysis pending.'}

### Leadership Quality
- **Leadership Score**: ${analysis.leadershipScore}/10
- **Team Size**: ${analysis.teamComposition?.totalSize || 'Not determined'}
- **Employee Satisfaction**: ${analysis.culturalIndicators?.employeeSatisfaction || 'Not measured'}/5

### Execution Capability
The team demonstrates ${analysis.executionCapability?.productVelocity?.toLowerCase() || 'moderate'} execution velocity with ${analysis.executionCapability?.releaseFrequency || 'regular'}.

${analysis.investmentPerspective?.keyTakeaway || ''}`
}

function formatFinancialAnalysis(analysis: any): string {
  if (analysis.error) return `Analysis incomplete: ${analysis.error}`
  
  return `## Financial Health Assessment

${analysis.summary || 'Financial analysis pending.'}

### Revenue Metrics
- **Estimated ARR**: ${analysis.revenueEstimates?.currentARR || 'Not disclosed'}
- **Growth Rate**: ${analysis.revenueEstimates?.growthRate || 'Not determined'}
- **Revenue per Employee**: ${analysis.revenueEstimates?.revenuePerEmployee || 'Not calculated'}

### Unit Economics
- **CAC:LTV Ratio**: ${analysis.unitEconomics?.ltcCacRatio || 'Not determined'}
- **Payback Period**: ${analysis.unitEconomics?.paybackPeriod || 'Not calculated'}
- **Gross Margin**: ${analysis.unitEconomics?.grossMargin || 'Not disclosed'}

${analysis.investmentPerspective?.keyTakeaway || ''}`
}

function formatSecurityAnalysis(analysis: any): string {
  if (analysis.error) return `Analysis incomplete: ${analysis.error}`
  
  return `## Security & Compliance Assessment

${analysis.summary || 'Security analysis pending.'}

### Security Score: ${analysis.securityScore || 'N/A'}/10

### Current Certifications
${analysis.compliance?.currentCertifications?.map((cert: string) => `- ${cert}`).join('\n') || '- None identified'}

### Enterprise Readiness
- **Current State**: ${analysis.enterpriseReadiness?.currentState || 'Not assessed'}
- **Time to Enterprise**: ${analysis.enterpriseReadiness?.timeToEnterprise || 'Not estimated'}
- **Investment Required**: ${analysis.enterpriseReadiness?.investmentRequired || 'Not calculated'}

${analysis.investmentPerspective?.keyTakeaway || ''}`
}

function formatInvestmentRecommendation(synthesis: any): string {
  if (synthesis.error) return `Analysis incomplete: ${synthesis.error}`
  
  return `## Investment Recommendation

### Recommendation: ${synthesis.recommendation || 'PENDING ANALYSIS'}
### Investment Score: ${synthesis.investmentScore || 0}/100
### Confidence Level: ${synthesis.confidenceLevel || 0}%

${synthesis.executiveSummary || 'Detailed investment analysis pending.'}

### Key Strengths
${synthesis.keyStrengths?.map((s: any) => `- **${s.strength}**: ${s.impact}`).join('\n') || '- Analysis pending'}

### Key Risks
${synthesis.keyRisks?.map((r: any) => `- **${r.risk}** (${r.severity}): ${r.mitigation}`).join('\n') || '- Analysis pending'}

### Financial Projections
- **Entry Valuation**: ${synthesis.financialProjection?.entryValuation || 'TBD'}
- **5-Year Revenue Target**: ${synthesis.financialProjection?.['5YearRevenue'] || 'TBD'}
- **Estimated Return**: ${synthesis.financialProjection?.estimatedReturn || 'TBD'}`
}

// Additional helper functions for formatting subsections
function formatTechStack(stack: any): string {
  if (!stack) return 'Technology stack details not available.'
  
  const sections = []
  if (stack.frontend?.length) sections.push(`**Frontend**: ${stack.frontend.join(', ')}`)
  if (stack.backend?.length) sections.push(`**Backend**: ${stack.backend.join(', ')}`)
  if (stack.database?.length) sections.push(`**Database**: ${stack.database.join(', ')}`)
  if (stack.infrastructure?.length) sections.push(`**Infrastructure**: ${stack.infrastructure.join(', ')}`)
  
  return sections.join('\n\n')
}

function formatArchitecture(highlights: string[]): string {
  if (!highlights?.length) return 'Architecture details not available.'
  
  return highlights.map(h => `- ${h}`).join('\n')
}

function formatTechRisks(risks: any[], strengths: any[]): string {
  const sections = []
  
  if (strengths?.length) {
    sections.push('### Technical Strengths\n' + 
      strengths.map(s => `- **${s.strength}** (Impact: ${s.impact})`).join('\n'))
  }
  
  if (risks?.length) {
    sections.push('### Technical Risks\n' + 
      risks.map(r => `- **${r.risk}** (Severity: ${r.severity}, Effort: ${r.mitigationEffort})`).join('\n'))
  }
  
  return sections.join('\n\n') || 'Risk assessment pending.'
}

// ... (continue with other formatting functions)

function generateCitations(evidence: any[], _reportData: any): any[] {
  const citations: any[] = []
  let citationNumber = 1
  
  // Map evidence to report sections
  evidence.forEach(item => {
    const section = determineSectionForEvidence(item)
    if (section && item.content_data) {
      citations.push({
        citation_number: citationNumber++,
        evidence_item_id: item.id,
        section: section,
        claim_text: item.content_data.summary || item.content_data.processed || '',
        confidence: item.confidence_score || 0.8
      })
    }
  })
  
  return citations
}

function determineSectionForEvidence(item: any): string {
  const type = item.evidence_type || item.type || ''
  
  if (type.includes('tech') || type.includes('stack')) return 'technology-stack-architecture'
  if (type.includes('market') || type.includes('competitor')) return 'market-position-competition'
  if (type.includes('team') || type.includes('culture')) return 'team-organizational-strength'
  if (type.includes('financial') || type.includes('pricing')) return 'financial-health-unit-economics'
  if (type.includes('security') || type.includes('compliance')) return 'security-compliance'
  
  return 'executive-summary'
}

// Stub functions for remaining formatters
function extractCompanyInfo(_evidence: any[], _techAnalysis: any, _marketAnalysis: any): any {
  return {
    headquarters: 'Location from evidence analysis',
    founded: 'Year from evidence',
    employeeCount: 'Size from analysis',
    fundingTotal: 'Funding from evidence',
    lastValuation: 'Valuation from evidence'
  }
}

function generateExecutiveSummary(company: string, _score: any, synthesis: any): string {
  return synthesis.executiveSummary || `${company} demonstrates strong potential...`
}

function calculateFinancialScore(analysis: any): number {
  return analysis.unitEconomics ? 75 : 60
}

function formatMarketSize(marketSize: any): string {
  return `TAM: ${marketSize?.tam || 'TBD'}, SAM: ${marketSize?.sam || 'TBD'}, SOM: ${marketSize?.som || 'TBD'}`
}

function formatCompetitors(competitors: any[]): string {
  return competitors?.map(c => `**${c.name}**: ${c.marketShare} market share`).join('\n') || 'Competitor analysis pending'
}

function formatGrowthDrivers(drivers: string[]): string {
  return drivers?.map(d => `- ${d}`).join('\n') || 'Growth driver analysis pending'
}

function formatLeadership(leaders: any[]): string {
  return leaders?.map(l => `**${l.role}**: ${l.background}`).join('\n') || 'Leadership analysis pending'
}

function formatCulture(culture: any): string {
  return `Employee satisfaction: ${culture?.employeeSatisfaction || 'N/A'}/5, Glassdoor: ${culture?.glassdoorRating || 'N/A'}`
}

function formatScaleReadiness(readiness: any): string {
  return `Current capacity: ${readiness?.currentCapacity || 'TBD'}, Hiring needs: ${readiness?.hiringNeeds || 'TBD'}`
}

function formatRevenue(revenue: any): string {
  return `Current ARR: ${revenue?.currentARR || 'Not disclosed'}, Growth: ${revenue?.growthRate || 'Not determined'}`
}

function formatUnitEconomics(economics: any): string {
  return `CAC: ${economics?.estimatedCAC || 'TBD'}, LTV: ${economics?.impliedLTV || 'TBD'}, Payback: ${economics?.paybackPeriod || 'TBD'}`
}

function formatProfitability(path: any): string {
  return `Current: ${path?.currentState || 'TBD'}, Break-even: ${path?.breakEvenTimeline || 'TBD'}`
}

function formatSecurityPosture(security: any): string {
  return `Infrastructure: ${security?.infrastructure || 'TBD'}, Encryption: ${security?.encryption || 'TBD'}`
}

function formatCompliance(compliance: any): string {
  return `Current: ${compliance?.currentCertifications?.join(', ') || 'None'}, In Progress: ${compliance?.inProgress?.join(', ') || 'None'}`
}

function formatEnterpriseReadiness(readiness: any): string {
  return `State: ${readiness?.currentState || 'TBD'}, Timeline: ${readiness?.timeToEnterprise || 'TBD'}`
}

function formatValueCreation(plan: any[]): string {
  return plan?.map(p => `**${p.initiative}**: ${p.timeline} (${p.returnMultiple} ROI)`).join('\n') || 'Value creation plan pending'
}

function formatRiskMitigation(risks: any[]): string {
  return risks?.map(r => `**${r.risk}**: ${r.mitigation} (Cost: ${r.cost || 'TBD'})`).join('\n') || 'Risk mitigation plan pending'
}

function formatNextSteps(steps: string[]): string {
  return steps?.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'Next steps pending'
}

// Main worker
export const reportGenerationWorker = new Worker<ReportGenerationJob>(
  'report-generation',
  async (job: Job<ReportGenerationJob>) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`Starting v4 report generation with AI analysis for ${company} (${scanRequestId})`)
    
    try {
      // Update scan request status
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'generating_report'
        })
        .eq('id', scanRequestId)
      
      // Find the evidence collection
      await job.updateProgress(10)
      const { data: collection } = await supabase
        .from('evidence_collections')
        .select('*')
        .contains('metadata', { scan_request_id: scanRequestId })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      // Load evidence items
      let evidence = []
      if (collection?.id) {
        const result = await supabase
          .from('evidence_items')
          .select('*')
          .eq('collection_id', collection.id)
          .order('confidence_score', { ascending: false })
        evidence = result.data || []
      }
      
      console.log(`Loaded ${evidence.length} evidence items for analysis`)
      
      // Generate analyzed report
      await job.updateProgress(30)
      const { reportData, investmentScore, grade, citations } = await generateAnalyzedReport(
        company,
        domain,
        investmentThesis,
        evidence,
        job.data.investorProfile
      )
      
      await job.updateProgress(80)
      
      // Create report record
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: Math.round(investmentScore),
          investment_rationale: reportData.investment_rationale,
          tech_health_score: Math.round(reportData.tech_health_score),
          tech_health_grade: grade,
          report_data: reportData,
          evidence_count: evidence.length,
          citation_count: citations.length,
          executive_summary: reportData.executiveSummary.content,
          report_version: '4.0',
          ai_model_used: 'gemini-1.5-pro',
          quality_score: Math.min(investmentScore * 0.01, 1.0),
          human_reviewed: false,
          metadata: reportData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (reportError) throw reportError
      
      await job.updateProgress(90)
      
      // Store citations
      if (citations.length > 0 && report) {
        const citationRecords = citations.map(c => ({
          ...c,
          report_id: report.id,
          created_at: new Date().toISOString()
        }))
        
        await supabase
          .from('report_citations')
          .insert(citationRecords)
      }
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          status: 'completed',
          ai_workflow_status: 'completed',
          latest_report_id: report?.id,
          ai_confidence: Math.round(investmentScore),
          tech_health_score: Math.round(reportData.tech_health_score)
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`AI-powered report generation complete! Score: ${investmentScore}`)
      
      return {
        success: true,
        reportId: report?.id,
        investmentScore,
        citationCount: citations.length,
        analysisDepth: 'comprehensive'
      }
      
    } catch (error) {
      console.error('Report generation failed:', error)
      
      // Update scan request with error
      await supabase
        .from('scan_requests')
        .update({
          status: 'failed',
          ai_workflow_status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', scanRequestId)
      
      throw error
    }
  },
  {
    connection,
    concurrency: 1, // Process 1 report at a time due to AI API limits
  }
)

// Error handling
reportGenerationWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err)
})

reportGenerationWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully with AI analysis`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await reportGenerationWorker.close()
  process.exit(0)
})

console.log('Report generation worker v4 (AI-powered) started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)