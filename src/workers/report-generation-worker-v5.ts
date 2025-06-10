import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { ComprehensiveScoringService, EvidenceItem } from '../lib/scoring/comprehensive-scoring'
import { getAllAnalysisPrompts, type AnalysisPrompt } from '../lib/prompts/analysis-prompts'
import Anthropic from '@anthropic-ai/sdk'
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

// Initialize AI models
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

// Evidence parsing with Gemini (better at structured data extraction)
async function parseEvidenceWithGemini(evidence: any[]): Promise<Record<string, any>> {
  const prompt = `Extract structured information from this evidence collection. 
  Focus on factual data points, metrics, and specific details.
  
  Evidence items:
  ${JSON.stringify(evidence.map(e => ({
    type: e.type,
    content: e.content_data?.summary || e.content_data?.processed || '',
    source: e.source_url
  })), null, 2)}
  
  Extract and return as JSON:
  {
    "technologies": ["list of specific technologies found"],
    "metrics": {
      "employees": "number or range",
      "revenue": "amount or estimate",
      "growth": "percentage or description",
      "customers": "count or description"
    },
    "competitorMentions": ["list of competitors mentioned"],
    "fundingInfo": {
      "totalRaised": "amount",
      "lastRound": "details",
      "valuation": "amount"
    },
    "securityCertifications": ["list of certifications"],
    "keyPeople": [{"name": "...", "role": "...", "background": "..."}],
    "productFeatures": ["key features mentioned"],
    "businessModel": "description",
    "challenges": ["mentioned challenges or complaints"],
    "strengths": ["mentioned strengths or praise"]
  }`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON from response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? jsonMatch[1] : text
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('Gemini parsing error:', error)
    return {}
  }
}

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

// Claude for orchestrating analysis and synthesis
async function analyzeWithClaude(
  prompt: AnalysisPrompt,
  evidence: any[],
  parsedData: any,
  context: {
    companyName: string
    companyDomain: string
    investmentThesis: string
  }
): Promise<any> {
  try {
    // Build the context for Claude
    const systemMessage = prompt.systemPrompt
    
    // Enhanced context with parsed data
    const enhancedContext = `
${prompt.taskDescription}

# Input Context
Company: ${context.companyName}
Domain: ${context.companyDomain}
Investment Thesis: ${context.investmentThesis}

# Parsed Evidence Summary (from Gemini):
${JSON.stringify(parsedData, null, 2)}

# Raw Evidence Items (${evidence.length} total):
${evidence.slice(0, 10).map(e => `- [${e.type}] ${e.content_data?.summary || ''}`).join('\n')}

# Methodology & Constraints
${prompt.methodology.map(m => `- ${m}`).join('\n')}

# Output Format
You must provide your analysis in the following JSON format. Be specific and detailed in your analysis.
${prompt.outputFormat}`

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0.3,
      system: systemMessage,
      messages: [
        {
          role: 'user',
          content: enhancedContext
        }
      ]
    })

    // Extract JSON from Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    try {
      // Claude is better at returning clean JSON, but still check for code blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/({[\s\S]*})/)
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText
      return JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      console.error('Raw response:', responseText)
      
      return {
        summary: responseText.slice(0, 500),
        error: 'Failed to parse structured response',
        rawResponse: responseText
      }
    }
  } catch (error) {
    console.error(`Claude analysis failed for ${prompt.name}:`, error)
    return {
      error: error instanceof Error ? error.message : 'Analysis failed',
      summary: 'Unable to complete analysis due to an error'
    }
  }
}

// Claude orchestrates the entire analysis process
async function orchestrateAnalysisWithClaude(
  company: string,
  domain: string,
  investmentThesis: string,
  evidence: any[],
  investorProfile: any
) {
  console.log(`Starting AI-orchestrated analysis for ${company} with ${evidence.length} evidence items`)
  
  // Step 1: Parse evidence with Gemini (better at extraction)
  console.log('Step 1: Parsing evidence with Gemini...')
  const parsedData = await parseEvidenceWithGemini(evidence)
  
  // Step 2: Group evidence by type
  const groupedEvidence = groupEvidenceByType(evidence)
  
  // Step 3: Get analysis prompts
  const prompts = getAllAnalysisPrompts()
  
  // Step 4: Claude orchestrates parallel analysis
  console.log('Step 2: Claude orchestrating comprehensive analysis...')
  
  // Create a planning prompt for Claude
  const planningMessage = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1000,
    temperature: 0.5,
    system: 'You are an investment analysis orchestrator. Plan the analysis approach based on available evidence.',
    messages: [
      {
        role: 'user',
        content: `Plan the analysis approach for ${company} (${investmentThesis}).
        
Available evidence types and counts:
- Technology: ${groupedEvidence.technology.length} items
- Market: ${groupedEvidence.market.length} items  
- Team: ${groupedEvidence.team.length} items
- Financial: ${groupedEvidence.financial.length} items
- Security: ${groupedEvidence.security.length} items

Parsed key data points:
- Technologies: ${parsedData.technologies?.join(', ') || 'Unknown'}
- Employee count: ${parsedData.metrics?.employees || 'Unknown'}
- Revenue: ${parsedData.metrics?.revenue || 'Unknown'}

Which areas need deeper analysis? What are the key questions to answer?`
      }
    ]
  })
  
  console.log('Analysis plan:', planningMessage.content[0])
  
  // Step 5: Perform parallel analysis with Claude for each section
  const [
    techAnalysis,
    marketAnalysis,
    teamAnalysis,
    financialAnalysis,
    securityAnalysis
  ] = await Promise.all([
    analyzeWithClaude(
      prompts.find(p => p.id === 'tech-stack-analysis')!,
      groupedEvidence.technology.concat(groupedEvidence.general),
      parsedData,
      { companyName: company, companyDomain: domain, investmentThesis }
    ),
    analyzeWithClaude(
      prompts.find(p => p.id === 'market-position-analysis')!,
      groupedEvidence.market.concat(groupedEvidence.general),
      parsedData,
      { companyName: company, companyDomain: domain, investmentThesis }
    ),
    analyzeWithClaude(
      prompts.find(p => p.id === 'team-culture-analysis')!,
      groupedEvidence.team.concat(groupedEvidence.general),
      parsedData,
      { companyName: company, companyDomain: domain, investmentThesis }
    ),
    analyzeWithClaude(
      prompts.find(p => p.id === 'financial-analysis')!,
      groupedEvidence.financial.concat(groupedEvidence.general),
      parsedData,
      { companyName: company, companyDomain: domain, investmentThesis }
    ),
    analyzeWithClaude(
      prompts.find(p => p.id === 'security-compliance-analysis')!,
      groupedEvidence.security.concat(groupedEvidence.general),
      parsedData,
      { companyName: company, companyDomain: domain, investmentThesis }
    )
  ])

  // Step 6: Calculate comprehensive scoring
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

  // Step 7: Final synthesis with Claude
  console.log('Step 3: Claude synthesizing final investment recommendation...')
  
  const synthesisMessage = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4000,
    temperature: 0.3,
    system: prompts.find(p => p.id === 'investment-synthesis')!.systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Synthesize the analysis for ${company} into a comprehensive investment recommendation.

Investment Thesis: ${investmentThesis}

Technology Assessment:
${JSON.stringify(techAnalysis, null, 2)}

Market Analysis:
${JSON.stringify(marketAnalysis, null, 2)}

Team Analysis:
${JSON.stringify(teamAnalysis, null, 2)}

Financial Analysis:
${JSON.stringify(financialAnalysis, null, 2)}

Security Analysis:
${JSON.stringify(securityAnalysis, null, 2)}

Comprehensive Scoring:
- Investment Score: ${comprehensiveScore.investmentScore}
- Technical Score: ${comprehensiveScore.technicalScore}
- Confidence Level: ${comprehensiveScore.confidenceBreakdown.overallConfidence}%
- Evidence Quality: ${comprehensiveScore.confidenceBreakdown.evidenceQuality * 100}%

Provide the final investment recommendation in the specified JSON format.`
      }
    ]
  })

  let investmentSynthesis = {}
  try {
    const synthesisText = synthesisMessage.content[0].type === 'text' ? synthesisMessage.content[0].text : ''
    const jsonMatch = synthesisText.match(/```json\n([\s\S]*?)\n```/) || synthesisText.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? jsonMatch[1] : synthesisText
    investmentSynthesis = JSON.parse(jsonStr)
  } catch (error) {
    console.error('Failed to parse synthesis:', error)
    investmentSynthesis = {
      recommendation: 'ANALYSIS_ERROR',
      executiveSummary: synthesisMessage.content[0].type === 'text' ? synthesisMessage.content[0].text : ''
    }
  }

  // Build the final report structure
  const reportData = {
    // Company Information (enhanced with parsed data)
    companyInfo: {
      name: company,
      website: `https://${domain}`,
      description: techAnalysis.summary || `${company} operating in ${investmentThesis} space`,
      headquarters: parsedData.metrics?.headquarters || 'Location not determined',
      founded: parsedData.metrics?.founded || 'Year not determined',
      employeeCount: parsedData.metrics?.employees || 'Size not determined',
      fundingTotal: parsedData.fundingInfo?.totalRaised || 'Funding not disclosed',
      lastValuation: parsedData.fundingInfo?.valuation || 'Valuation not disclosed',
      revenue: parsedData.metrics?.revenue || 'Revenue not disclosed'
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
    
    // Report sections with full Claude-generated content
    sections: [
      {
        title: 'Technology Stack & Architecture',
        content: formatTechnologyAnalysis(techAnalysis),
        score: techAnalysis.scalabilityScore || comprehensiveScore.technicalScore,
        subsections: [
          {
            title: 'Core Technologies',
            content: formatTechStack(techAnalysis.primaryStack, parsedData.technologies)
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
            content: formatCompetitors(marketAnalysis.competitors, parsedData.competitorMentions)
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
            content: formatLeadership(teamAnalysis.keyLeaders, parsedData.keyPeople)
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
            content: formatRevenue(financialAnalysis.revenueEstimates, parsedData.metrics)
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
        score: securityAnalysis.securityScore || comprehensiveScore.dimensions.security.score,
        subsections: [
          {
            title: 'Security Posture',
            content: formatSecurityPosture(securityAnalysis.technicalSecurity)
          },
          {
            title: 'Compliance Status',
            content: formatCompliance(securityAnalysis.compliance, parsedData.securityCertifications)
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
        score: investmentSynthesis.investmentScore || comprehensiveScore.investmentScore,
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
    
    // Metadata showing AI collaboration
    metadata: {
      comprehensiveScore,
      analysisTimestamp: new Date().toISOString(),
      evidenceCount: evidence.length,
      aiModels: {
        parsing: 'gemini-1.5-pro',
        analysis: 'claude-3-opus',
        orchestration: 'claude-3-opus'
      },
      analysisDepth: 'comprehensive',
      parsedDataPoints: Object.keys(parsedData).length
    },
    
    // Investment metrics
    investment_score: investmentSynthesis.investmentScore || comprehensiveScore.investmentScore,
    tech_health_score: techAnalysis.scalabilityScore ? techAnalysis.scalabilityScore * 10 : comprehensiveScore.technicalScore,
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

// Helper functions remain the same but enhanced with parsed data
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

function formatTechStack(stack: any, parsedTechnologies?: string[]): string {
  if (!stack && !parsedTechnologies) return 'Technology stack details not available.'
  
  const sections = []
  if (stack?.frontend?.length) sections.push(`**Frontend**: ${stack.frontend.join(', ')}`)
  if (stack?.backend?.length) sections.push(`**Backend**: ${stack.backend.join(', ')}`)
  if (stack?.database?.length) sections.push(`**Database**: ${stack.database.join(', ')}`)
  if (stack?.infrastructure?.length) sections.push(`**Infrastructure**: ${stack.infrastructure.join(', ')}`)
  
  if (parsedTechnologies?.length && sections.length === 0) {
    sections.push(`**Identified Technologies**: ${parsedTechnologies.join(', ')}`)
  }
  
  return sections.join('\n\n')
}

function formatCompetitors(competitors: any[], parsedCompetitors?: string[]): string {
  let content = competitors?.map(c => `**${c.name}**: ${c.marketShare} market share`).join('\n') || ''
  
  if (parsedCompetitors?.length) {
    content += '\n\n**Additional Competitors Identified**: ' + parsedCompetitors.join(', ')
  }
  
  return content || 'Competitor analysis pending'
}

function formatLeadership(leaders: any[], parsedPeople?: any[]): string {
  let content = leaders?.map(l => `**${l.role}**: ${l.background}`).join('\n') || ''
  
  if (parsedPeople?.length) {
    content += '\n\n**Key People Identified**:\n'
    content += parsedPeople.map(p => `- ${p.name} (${p.role}): ${p.background || 'Details pending'}`).join('\n')
  }
  
  return content || 'Leadership analysis pending'
}

function formatRevenue(revenue: any, parsedMetrics?: any): string {
  const revenueStr = revenue?.currentARR || parsedMetrics?.revenue || 'Not disclosed'
  const growthStr = revenue?.growthRate || parsedMetrics?.growth || 'Not determined'
  
  return `Current ARR: ${revenueStr}, Growth: ${growthStr}`
}

function formatCompliance(compliance: any, parsedCertifications?: string[]): string {
  const current = compliance?.currentCertifications || parsedCertifications || []
  const inProgress = compliance?.inProgress || []
  
  return `Current: ${current.join(', ') || 'None'}, In Progress: ${inProgress.join(', ') || 'None'}`
}

// All other helper functions remain the same...
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

// Additional formatting functions remain the same...
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

function generateExecutiveSummary(company: string, score: any, synthesis: any): string {
  return synthesis.executiveSummary || `${company} demonstrates strong potential...`
}

function calculateFinancialScore(analysis: any): number {
  return analysis.unitEconomics ? 75 : 60
}

function formatMarketSize(marketSize: any): string {
  return `TAM: ${marketSize?.tam || 'TBD'}, SAM: ${marketSize?.sam || 'TBD'}, SOM: ${marketSize?.som || 'TBD'}`
}

function formatGrowthDrivers(drivers: string[]): string {
  return drivers?.map(d => `- ${d}`).join('\n') || 'Growth driver analysis pending'
}

function formatCulture(culture: any): string {
  return `Employee satisfaction: ${culture?.employeeSatisfaction || 'N/A'}/5, Glassdoor: ${culture?.glassdoorRating || 'N/A'}`
}

function formatScaleReadiness(readiness: any): string {
  return `Current capacity: ${readiness?.currentCapacity || 'TBD'}, Hiring needs: ${readiness?.hiringNeeds || 'TBD'}`
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

function generateCitations(evidence: any[], reportData: any): any[] {
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

// Main worker
export const reportGenerationWorker = new Worker<ReportGenerationJob>(
  'report-generation',
  async (job: Job<ReportGenerationJob>) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`Starting v5 report generation with Claude orchestration + Gemini parsing for ${company} (${scanRequestId})`)
    
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
      
      console.log(`Loaded ${evidence.length} evidence items for AI analysis`)
      
      // Orchestrate analysis with Claude + Gemini
      await job.updateProgress(30)
      const { reportData, investmentScore, grade, citations } = await orchestrateAnalysisWithClaude(
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
          report_version: '5.0',
          ai_model_used: 'claude+gemini',
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
      console.log(`AI-orchestrated report generation complete! Score: ${investmentScore}`)
      
      return {
        success: true,
        reportId: report?.id,
        investmentScore,
        citationCount: citations.length,
        analysisDepth: 'comprehensive',
        aiModels: 'claude+gemini'
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
  console.log(`Job ${job.id} completed successfully with Claude+Gemini collaboration`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await reportGenerationWorker.close()
  process.exit(0)
})

console.log('Report generation worker v5 (Claude orchestration + Gemini parsing) started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)