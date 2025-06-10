import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { ComprehensiveScoringService, EvidenceItem } from '../lib/scoring/comprehensive-scoring'
import { getAllAnalysisPrompts, type AnalysisPrompt } from '../lib/prompts/analysis-prompts'
import Anthropic from '@anthropic-ai/sdk'
// import { GoogleGenerativeAI } from '@google/generative-ai' // Not needed for report generation

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

interface AnalysisTrace {
  timestamp: string
  phase: string
  action: string
  tool?: string
  input?: any
  output?: any
  confidence?: number
  duration?: number
  error?: string
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

// Load API keys from environment
async function loadAPIKeys() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const geminiKey = process.env.GOOGLE_AI_API_KEY
  
  if (!anthropicKey) {
    console.error('❌ No ANTHROPIC_API_KEY found in environment')
  }
  if (!geminiKey) {
    console.error('❌ No GOOGLE_AI_API_KEY found in environment')
  }
  
  return { anthropicKey, geminiKey }
}

// Initialize AI models (will be set after loading keys)
let anthropic: Anthropic

class AnalysisOrchestrator {
  private trace: AnalysisTrace[] = []
  
  constructor(
    private company: string,
    private domain: string,
    private investmentThesis: string,
    private evidence: any[]
  ) {}

  // Add trace entry
  private addTrace(phase: string, action: string, data?: any) {
    const entry: AnalysisTrace = {
      timestamp: new Date().toISOString(),
      phase,
      action,
      ...data
    }
    this.trace.push(entry)
    console.log(`[${phase}] ${action}`, data?.tool || '')
  }

  // Phase 1: Structure evidence data (no external API calls needed)
  async parseEvidence(): Promise<any> {
    const startTime = Date.now()
    this.addTrace('evidence_structuring', 'Structuring evidence data locally', {
      evidenceCount: this.evidence.length
    })

    try {
      // Structure the evidence data without external API calls
      const parsedData = {
        companyInfo: {
          name: this.company,
          domain: this.domain,
          headquarters: null,
          founded: null,
          employeeCount: null,
          fundingTotal: null,
          lastValuation: null,
          revenue: null,
          businessModel: null
        },
        technologies: {
          frontend: [],
          backend: [],
          databases: [],
          infrastructure: [],
          tools: [],
          languages: []
        },
        metrics: {
          performance: {},
          scale: {},
          growth: {}
        },
        team: {
          size: null,
          keyPeople: [],
          culture: [],
          hiring: null
        },
        market: {
          competitors: [],
          marketSize: null,
          customers: [],
          position: null
        },
        security: {
          certifications: [],
          practices: [],
          incidents: []
        },
        financial: {
          revenue: null,
          growth: null,
          profitability: null,
          burnRate: null,
          runway: null
        }
      }

      // Extract structured data from evidence items
      this.evidence.forEach(item => {
        const content = item.content_data?.processed || item.content_data?.summary || ''
        const type = item.evidence_type || item.type || ''
        
        // Extract key information based on evidence type
        if (type.includes('business') || type.includes('company')) {
          // Extract business info
          const revenueMatch = content.match(/revenue.*?(\$[\d.]+[MBK]?)/i)
          if (revenueMatch) parsedData.financial.revenue = revenueMatch[1]
          
          const employeeMatch = content.match(/(\d+)\s*employees/i)
          if (employeeMatch) parsedData.companyInfo.employeeCount = employeeMatch[1]
          
          const foundedMatch = content.match(/founded.*?(\d{4})/i)
          if (foundedMatch) parsedData.companyInfo.founded = foundedMatch[1]
        }
        
        if (type.includes('technology') || type.includes('tech')) {
          // Extract technology mentions
          const techKeywords = {
            frontend: ['react', 'vue', 'angular', 'javascript', 'typescript'],
            backend: ['python', 'java', 'node', 'ruby', 'go', 'scala'],
            databases: ['postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch'],
            infrastructure: ['aws', 'gcp', 'azure', 'kubernetes', 'docker']
          }
          
          Object.entries(techKeywords).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
              if (content.toLowerCase().includes(keyword)) {
                const techArray = parsedData.technologies[category as keyof typeof parsedData.technologies]
                if (Array.isArray(techArray)) {
                  techArray.push(keyword)
                }
              }
            })
          })
        }
        
        if (type.includes('market')) {
          // Extract market data
          const tamMatch = content.match(/TAM.*?(\$[\d.]+[BTM])/i)
          if (tamMatch) parsedData.market.marketSize = tamMatch[1]
          
          // Extract competitor mentions
          const competitorKeywords = ['competes with', 'competitors include', 'vs', 'alternative to']
          competitorKeywords.forEach(keyword => {
            const match = content.match(new RegExp(`${keyword}.*?([A-Z][a-zA-Z]+)`, 'i'))
            if (match && Array.isArray(parsedData.market?.competitors)) {
              parsedData.market.competitors.push(match[1])
            }
          })
        }
        
        if (type.includes('team')) {
          // Extract team info
          const sizeMatch = content.match(/team.*?(\d+)/i)
          if (sizeMatch) parsedData.team.size = sizeMatch[1]
        }
        
        if (type.includes('security')) {
          // Extract security certifications
          const certs = ['SOC2', 'ISO27001', 'HIPAA', 'GDPR']
          certs.forEach(cert => {
            if (content.includes(cert)) {
              if (Array.isArray(parsedData.security?.certifications)) {
                parsedData.security.certifications.push(cert)
              }
            }
          })
        }
      })
      
      // Deduplicate arrays
      Object.keys(parsedData.technologies).forEach(key => {
        parsedData.technologies[key as keyof typeof parsedData.technologies] = 
          [...new Set(parsedData.technologies[key as keyof typeof parsedData.technologies])]
      })
      parsedData.market.competitors = [...new Set(parsedData.market.competitors)]
      parsedData.security.certifications = [...new Set(parsedData.security.certifications)]
      
      this.addTrace('evidence_structuring', 'Completed structuring', {
        tool: 'local-parser',
        duration: Date.now() - startTime,
        dataPoints: Object.keys(parsedData).length
      })
      
      return parsedData
    } catch (error) {
      this.addTrace('evidence_structuring', 'Error structuring evidence', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  // Phase 2: Claude orchestrates the analysis
  async analyzeWithClaude(parsedData: any): Promise<any> {
    if (!anthropic) {
      throw new Error('Anthropic client not initialized')
    }
    const startTime = Date.now()
    this.addTrace('claude_orchestration', 'Starting Claude analysis orchestration')

    try {
      // First, have Claude plan the analysis approach
      const planningMessage = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        system: `You are an expert investment analyst orchestrating a comprehensive due diligence analysis. 
Your role is to coordinate the analysis of evidence for ${this.company} and ensure all aspects are thoroughly evaluated.`,
        messages: [
          {
            role: 'user',
            content: `Plan the analysis approach for ${this.company} (${this.investmentThesis} thesis).

Parsed evidence summary:
${JSON.stringify(parsedData, null, 2)}

Evidence distribution:
- Technology evidence: ${this.evidence.filter(e => e.type?.includes('tech')).length} items
- Market evidence: ${this.evidence.filter(e => e.type?.includes('market')).length} items
- Team evidence: ${this.evidence.filter(e => e.type?.includes('team')).length} items
- Financial evidence: ${this.evidence.filter(e => e.type?.includes('financial')).length} items
- Security evidence: ${this.evidence.filter(e => e.type?.includes('security')).length} items

Identify:
1. Which areas have strong evidence coverage
2. Which areas need deeper analysis
3. Key questions that must be answered
4. Confidence level in the data (0-100%)
5. Recommended analysis focus areas`
          }
        ]
      })

      const planText = planningMessage.content[0].type === 'text' ? planningMessage.content[0].text : ''
      this.addTrace('claude_orchestration', 'Analysis plan created', {
        tool: 'claude-3-opus',
        plan: planText.slice(0, 200) + '...'
      })

      // Now perform the detailed analysis for each section
      const analyses = await this.performSectionAnalyses(parsedData, planText)
      
      this.addTrace('claude_orchestration', 'Completed all section analyses', {
        duration: Date.now() - startTime,
        sectionsAnalyzed: Object.keys(analyses).length
      })
      
      return analyses
    } catch (error) {
      this.addTrace('claude_orchestration', 'Error in Claude orchestration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  // Perform analysis for each section using the prompts
  private async performSectionAnalyses(parsedData: any, analysisplan: string): Promise<any> {
    const prompts = getAllAnalysisPrompts()
    const analyses: any = {}

    // Group evidence by type
    const groupedEvidence = this.groupEvidenceByType()

    // Analyze each section in parallel
    const analysisPromises = [
      { key: 'technology', promptId: 'tech-stack-analysis', evidence: groupedEvidence.technology },
      { key: 'market', promptId: 'market-position-analysis', evidence: groupedEvidence.market },
      { key: 'team', promptId: 'team-culture-analysis', evidence: groupedEvidence.team },
      { key: 'financial', promptId: 'financial-analysis', evidence: groupedEvidence.financial },
      { key: 'security', promptId: 'security-compliance-analysis', evidence: groupedEvidence.security }
    ].map(async ({ key, promptId, evidence }) => {
      const prompt = prompts.find(p => p.id === promptId)
      if (!prompt) return null

      try {
        const analysis = await this.analyzeSection(prompt, evidence, parsedData, analysisplan)
        analyses[key] = analysis
        return { key, analysis }
      } catch (error) {
        console.error(`Failed to analyze ${key}:`, error)
        analyses[key] = { error: 'Analysis failed', summary: 'Unable to complete analysis' }
        return null
      }
    })

    await Promise.all(analysisPromises)

    // Final synthesis
    const synthesis = await this.synthesizeInvestmentRecommendation(analyses, parsedData)
    analyses.synthesis = synthesis

    return analyses
  }

  // Analyze a specific section
  private async analyzeSection(
    prompt: AnalysisPrompt,
    evidence: any[],
    parsedData: any,
    analysisPlan: string
  ): Promise<any> {
    const startTime = Date.now()
    this.addTrace('section_analysis', `Analyzing ${prompt.name}`, {
      tool: 'claude-3-opus',
      evidenceCount: evidence.length
    })

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        temperature: 0.3,
        system: prompt.systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${prompt.taskDescription}

Company: ${this.company}
Domain: ${this.domain}
Investment Thesis: ${this.investmentThesis}

Analysis Context:
${analysisPlan}

Parsed Data Summary:
${JSON.stringify(parsedData, null, 2)}

Relevant Evidence (${evidence.length} items):
${evidence.slice(0, 15).map(e => 
  `- [${e.type}] ${e.content_data?.summary || e.summary || ''} (confidence: ${e.confidence_score || 0.7})`
).join('\n')}

${prompt.methodology.map(m => `- ${m}`).join('\n')}

IMPORTANT: Provide your analysis in the following JSON format:
${prompt.outputFormat}`
          }
        ]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/({[\s\S]*})/)
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText
      const analysis = JSON.parse(jsonStr)
      
      this.addTrace('section_analysis', `Completed ${prompt.name}`, {
        duration: Date.now() - startTime,
        hasErrors: !!analysis.error
      })
      
      return analysis
    } catch (error) {
      this.addTrace('section_analysis', `Error analyzing ${prompt.name}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      return {
        error: error instanceof Error ? error.message : 'Analysis failed',
        summary: 'Unable to complete analysis due to an error'
      }
    }
  }

  // Synthesize final investment recommendation
  private async synthesizeInvestmentRecommendation(analyses: any, parsedData: any): Promise<any> {
    const startTime = Date.now()
    this.addTrace('synthesis', 'Synthesizing investment recommendation')

    try {
      // Calculate comprehensive score
      const evidenceItems: EvidenceItem[] = this.evidence.map(item => ({
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
        { type: this.investmentThesis, name: this.investmentThesis }
      )

      // Get synthesis prompt
      const prompts = getAllAnalysisPrompts()
      const synthesisPrompt = prompts.find(p => p.id === 'investment-synthesis')!

      const message = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        temperature: 0.3,
        system: synthesisPrompt.systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Synthesize the analysis for ${this.company} into a comprehensive investment recommendation.

Investment Thesis: ${this.investmentThesis}

Technology Analysis:
${JSON.stringify(analyses.technology, null, 2)}

Market Analysis:
${JSON.stringify(analyses.market, null, 2)}

Team Analysis:
${JSON.stringify(analyses.team, null, 2)}

Financial Analysis:
${JSON.stringify(analyses.financial, null, 2)}

Security Analysis:
${JSON.stringify(analyses.security, null, 2)}

Comprehensive Scoring:
- Investment Score: ${comprehensiveScore.confidenceAdjustedScore}
- Technical Score: ${comprehensiveScore.technicalScore}
- Confidence Level: ${comprehensiveScore.confidenceBreakdown.overallConfidence}%
- Evidence Quality: ${comprehensiveScore.confidenceBreakdown.evidenceQuality * 100}%
- Evidence Coverage: ${comprehensiveScore.confidenceBreakdown.evidenceCoverage * 100}%

Provide the final investment recommendation in JSON format with the following structure:
{
  "recommendation": "STRONG BUY | BUY | HOLD | PASS",
  "investmentScore": <number 0-100>,
  "confidenceLevel": <number 0-100>,
  "executiveSummary": "<detailed summary>",
  "keyStrengths": [{"strength": "...", "impact": "..."}],
  "keyRisks": [{"risk": "...", "severity": "HIGH|MEDIUM|LOW", "mitigation": "..."}],
  "valueCreationPlan": [{"initiative": "...", "timeline": "...", "returnMultiple": "..."}],
  "nextSteps": ["...", "..."]
}`
          }
        ]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/({[\s\S]*})/)
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText
      const synthesis = JSON.parse(jsonStr)
      
      this.addTrace('synthesis', 'Completed investment synthesis', {
        tool: 'claude-3-opus',
        duration: Date.now() - startTime,
        recommendation: synthesis.recommendation,
        investmentScore: synthesis.investmentScore
      })
      
      return { ...synthesis, comprehensiveScore }
    } catch (error) {
      this.addTrace('synthesis', 'Error in synthesis', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      })
      throw error
    }
  }

  // Generate the final report structure
  async generateReport(parsedData: any, analyses: any): Promise<any> {
    const startTime = Date.now()
    this.addTrace('report_generation', 'Generating final report structure')

    const reportData = {
      // Required top-level fields for constraint
      company_name: this.company,
      investment_score: Math.round(analyses.synthesis?.investmentScore || analyses.synthesis?.comprehensiveScore?.confidenceAdjustedScore || 75),
      
      // Company Information
      companyInfo: {
        name: this.company,
        website: `https://${this.domain}`,
        ...parsedData.companyInfo
      },
      
      // Executive Summary
      executiveSummary: {
        title: 'Executive Summary',
        content: analyses.synthesis?.executiveSummary || this.generateExecutiveSummary(analyses)
      },
      
      // Report sections as object (constraint requires object, not array)
      sections: {
        technology: {
          title: 'Technology Stack & Architecture',
          content: this.formatTechnologyContent(analyses.technology),
          score: Math.round((analyses.technology?.scalabilityScore || 0.75) * 100),
          subsections: this.generateTechSubsections(analyses.technology, parsedData)
        },
        market: {
          title: 'Market Position & Competition',
          content: this.formatMarketContent(analyses.market),
          score: Math.round((analyses.market?.marketPositionScore || this.calculateMarketScore(analyses.market) / 100 || 0.7) * 100),
          subsections: this.generateMarketSubsections(analyses.market, parsedData)
        },
        team: {
          title: 'Team & Organizational Strength',
          content: this.formatTeamContent(analyses.team),
          score: Math.round((analyses.team?.leadershipScore || 0.65) * 10),
          subsections: this.generateTeamSubsections(analyses.team, parsedData)
        },
        financial: {
          title: 'Financial Health & Unit Economics',
          content: this.formatFinancialContent(analyses.financial),
          score: Math.round((analyses.financial?.healthScore || this.calculateFinancialScore(analyses.financial) / 100 || 0.8) * 100),
          subsections: this.generateFinancialSubsections(analyses.financial, parsedData)
        },
        security: {
          title: 'Security & Compliance',
          content: this.formatSecurityContent(analyses.security),
          score: Math.round((analyses.security?.securityScore || 0.7) * 10),
          subsections: this.generateSecuritySubsections(analyses.security, parsedData)
        },
        investment: {
          title: 'Investment Recommendation',
          content: this.formatInvestmentContent(analyses.synthesis),
          score: Math.round(analyses.synthesis?.investmentScore || 75),
          subsections: this.generateInvestmentSubsections(analyses.synthesis)
        }
      },
      
      // Metadata with comprehensive trace
      metadata: {
        comprehensiveScore: analyses.synthesis?.comprehensiveScore,
        analysisTimestamp: new Date().toISOString(),
        evidenceCount: this.evidence.length,
        aiModels: {
          parsing: 'gemini-1.5-pro',
          orchestration: 'claude-3-opus',
          analysis: 'claude-3-opus'
        },
        analysisDepth: 'comprehensive',
        trace: this.trace,
        parsedDataPoints: parsedData
      },
      
      // Top-level metrics for the reports table
      // investment_score already defined above, removed duplicate
      tech_health_score: Math.round((analyses.technology?.scalabilityScore || 0.75) * 100),
      tech_health_grade: this.calculateGrade(analyses.synthesis?.investmentScore || 75),
      investment_rationale: analyses.synthesis?.executiveSummary || ''
    }

    this.addTrace('report_generation', 'Report structure complete', {
      duration: Date.now() - startTime,
      sectionCount: Object.keys(reportData.sections).length
    })

    return reportData
  }

  // Helper methods for formatting content
  private formatTechnologyContent(analysis: any): string {
    if (!analysis || analysis.error) return 'Technology analysis pending.'
    
    return `## Technology Assessment

${analysis.summary || ''}

### Stack Overview
${analysis.primaryStack ? `The technology stack includes: ${Object.entries(analysis.primaryStack).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')}` : 'Technology stack analysis in progress.'}

### Technical Strengths
${analysis.technicalStrengths?.map((s: any) => `- **${s.strength}**: ${s.impact}`).join('\n') || 'Identifying technical strengths...'}

### Key Metrics
- **Technical Debt Score**: ${analysis.technicalDebtScore || 'N/A'}/10 (lower is better)
- **Scalability Score**: ${analysis.scalabilityScore || 'N/A'}/10
- **Security Posture**: ${analysis.securityPosture || 'Not assessed'}

${analysis.investmentPerspective?.keyTakeaway || ''}`
  }

  private formatMarketContent(analysis: any): string {
    if (!analysis || analysis.error) return 'Market analysis pending.'
    
    return `## Market Position Analysis

${analysis.summary || ''}

### Market Opportunity
- **Total Addressable Market (TAM)**: ${analysis.marketSize?.tam || 'Not determined'}
- **Serviceable Addressable Market (SAM)**: ${analysis.marketSize?.sam || 'Not determined'}
- **Growth Rate**: ${analysis.marketSize?.growthRate || 'Not determined'}

### Competitive Position
${analysis.competitivePosition ? `The company holds ${analysis.competitivePosition.marketShare || 'an undetermined'} market share with a ${analysis.competitivePosition.trajectory?.toLowerCase() || 'stable'} trajectory.` : 'Competitive analysis in progress.'}

### Key Differentiators
${analysis.differentiators?.map((d: any) => `- **${d.factor}**: Uniqueness: ${d.uniqueness}, Defensibility: ${d.defensibility}`).join('\n') || 'Analyzing competitive advantages...'}

${analysis.investmentPerspective?.keyTakeaway || ''}`
  }

  private formatTeamContent(analysis: any): string {
    if (!analysis || analysis.error) return 'Team analysis pending.'
    
    return `## Team & Organizational Assessment

${analysis.summary || ''}

### Leadership Quality
- **Leadership Score**: ${analysis.leadershipScore || 'N/A'}/10
- **Team Size**: ${analysis.teamComposition?.totalSize || 'Not determined'}
- **Employee Satisfaction**: ${analysis.culturalIndicators?.employeeSatisfaction || 'Not measured'}/5

### Key Leaders
${analysis.keyLeaders?.map((l: any) => `- **${l.role}**: ${l.name} - ${l.background}`).join('\n') || 'Leadership information being compiled...'}

### Execution Capability
${analysis.executionCapability ? `The team demonstrates ${analysis.executionCapability.productVelocity?.toLowerCase() || 'moderate'} execution velocity with ${analysis.executionCapability.releaseFrequency || 'regular deployments'}.` : 'Assessing execution capability...'}

${analysis.investmentPerspective?.keyTakeaway || ''}`
  }

  private formatFinancialContent(analysis: any): string {
    if (!analysis || analysis.error) return 'Financial analysis pending.'
    
    return `## Financial Health Assessment

${analysis.summary || ''}

### Revenue Metrics
- **Estimated ARR**: ${analysis.revenueEstimates?.currentARR || 'Not disclosed'}
- **Growth Rate**: ${analysis.revenueEstimates?.growthRate || 'Not determined'}
- **Revenue per Employee**: ${analysis.revenueEstimates?.revenuePerEmployee || 'Not calculated'}

### Unit Economics
- **CAC:LTV Ratio**: ${analysis.unitEconomics?.ltcCacRatio || 'Not determined'}
- **Payback Period**: ${analysis.unitEconomics?.paybackPeriod || 'Not calculated'}
- **Gross Margin**: ${analysis.unitEconomics?.grossMargin || 'Not disclosed'}

### Financial Health Indicators
${analysis.fundingEfficiency ? `- **Capital Efficiency**: ${analysis.fundingEfficiency.capitalEfficiency}
- **Runway Estimate**: ${analysis.fundingEfficiency.runwayEstimate}` : 'Financial indicators being analyzed...'}

${analysis.investmentPerspective?.keyTakeaway || ''}`
  }

  private formatSecurityContent(analysis: any): string {
    if (!analysis || analysis.error) return 'Security analysis pending.'
    
    return `## Security & Compliance Assessment

${analysis.summary || ''}

### Security Score: ${analysis.securityScore || 'N/A'}/10

### Current Certifications
${analysis.compliance?.currentCertifications?.map((cert: string) => `- ${cert}`).join('\n') || '- Compliance status being verified...'}

### Security Practices
${analysis.securityPractices ? `- **DevSecOps Maturity**: ${analysis.securityPractices.devSecOps}
- **Incident Response**: ${analysis.securityPractices.incidentResponse}
- **Security Team**: ${analysis.securityPractices.securityTeam}` : 'Security practices being assessed...'}

### Enterprise Readiness
- **Current State**: ${analysis.enterpriseReadiness?.currentState || 'Not assessed'}
- **Time to Enterprise**: ${analysis.enterpriseReadiness?.timeToEnterprise || 'Not estimated'}
- **Investment Required**: ${analysis.enterpriseReadiness?.investmentRequired || 'Not calculated'}

${analysis.investmentPerspective?.keyTakeaway || ''}`
  }

  private formatInvestmentContent(synthesis: any): string {
    if (!synthesis || synthesis.error) return 'Investment recommendation pending.'
    
    return `## Investment Recommendation

### Recommendation: ${synthesis.recommendation || 'PENDING ANALYSIS'}
### Investment Score: ${synthesis.investmentScore || 0}/100
### Confidence Level: ${synthesis.confidenceLevel || 0}%

${synthesis.executiveSummary || 'Detailed investment analysis in progress...'}

### Key Strengths
${synthesis.keyStrengths?.map((s: any) => `- **${s.strength}**: ${s.impact}`).join('\n') || '- Strengths being evaluated...'}

### Key Risks
${synthesis.keyRisks?.map((r: any) => `- **${r.risk}** (${r.severity}): ${r.mitigation}`).join('\n') || '- Risks being assessed...'}

### Value Creation Opportunities
${synthesis.valueCreationPlan?.map((v: any) => `- **${v.initiative}**: ${v.timeline} (Expected ROI: ${v.returnMultiple})`).join('\n') || '- Value creation opportunities being identified...'}

### Next Steps
${synthesis.nextSteps?.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n') || 'Next steps being formulated...'}`
  }

  // Generate subsections
  private generateTechSubsections(analysis: any, parsedData: any): any[] {
    return [
      {
        title: 'Core Technologies',
        content: this.formatTechStack(analysis?.primaryStack, parsedData?.technologies)
      },
      {
        title: 'Architecture Highlights',
        content: this.formatArchitectureHighlights(analysis?.architectureHighlights)
      },
      {
        title: 'Technical Risks & Opportunities',
        content: this.formatTechRisks(analysis?.technicalRisks, analysis?.technicalStrengths)
      }
    ]
  }

  private generateMarketSubsections(analysis: any, parsedData: any): any[] {
    return [
      {
        title: 'Market Size & Growth',
        content: this.formatMarketSize(analysis?.marketSize)
      },
      {
        title: 'Competitive Landscape',
        content: this.formatCompetitors(analysis?.competitors, parsedData?.market?.competitors)
      },
      {
        title: 'Growth Drivers',
        content: this.formatGrowthDrivers(analysis?.growthDrivers)
      }
    ]
  }

  private generateTeamSubsections(analysis: any, parsedData: any): any[] {
    return [
      {
        title: 'Leadership Team',
        content: this.formatLeadership(analysis?.keyLeaders, parsedData?.team?.keyPeople)
      },
      {
        title: 'Culture & Values',
        content: this.formatCulture(analysis?.culturalIndicators)
      },
      {
        title: 'Scaling Readiness',
        content: this.formatScaleReadiness(analysis?.scaleReadiness)
      }
    ]
  }

  private generateFinancialSubsections(analysis: any, parsedData: any): any[] {
    return [
      {
        title: 'Revenue & Growth',
        content: this.formatRevenue(analysis?.revenueEstimates, parsedData?.financial)
      },
      {
        title: 'Unit Economics',
        content: this.formatUnitEconomics(analysis?.unitEconomics)
      },
      {
        title: 'Path to Profitability',
        content: this.formatProfitability(analysis?.profitabilityPath)
      }
    ]
  }

  private generateSecuritySubsections(analysis: any, parsedData: any): any[] {
    return [
      {
        title: 'Security Infrastructure',
        content: this.formatSecurityInfra(analysis?.technicalSecurity)
      },
      {
        title: 'Compliance Status',
        content: this.formatCompliance(analysis?.compliance, parsedData?.security?.certifications)
      },
      {
        title: 'Security Roadmap',
        content: this.formatSecurityRoadmap(analysis?.enterpriseReadiness)
      }
    ]
  }

  private generateInvestmentSubsections(synthesis: any): any[] {
    return [
      {
        title: 'Value Creation Plan',
        content: this.formatValueCreation(synthesis?.valueCreationPlan)
      },
      {
        title: 'Risk Mitigation Strategy',
        content: this.formatRiskMitigation(synthesis?.keyRisks)
      },
      {
        title: 'Deal Structure & Terms',
        content: this.formatDealTerms(synthesis?.dealConditions)
      }
    ]
  }

  // Format helpers
  private formatTechStack(stack: any, technologies: any): string {
    const sections = []
    if (stack?.frontend) sections.push(`**Frontend**: ${stack.frontend.join(', ')}`)
    if (stack?.backend) sections.push(`**Backend**: ${stack.backend.join(', ')}`)
    if (stack?.database) sections.push(`**Databases**: ${stack.database.join(', ')}`)
    if (stack?.infrastructure) sections.push(`**Infrastructure**: ${stack.infrastructure.join(', ')}`)
    
    if (technologies && sections.length === 0) {
      if (technologies.frontend?.length) sections.push(`**Frontend**: ${technologies.frontend.join(', ')}`)
      if (technologies.backend?.length) sections.push(`**Backend**: ${technologies.backend.join(', ')}`)
      if (technologies.databases?.length) sections.push(`**Databases**: ${technologies.databases.join(', ')}`)
    }
    
    return sections.join('\n\n') || 'Technology stack details being compiled...'
  }

  private formatArchitectureHighlights(highlights: string[]): string {
    if (!highlights?.length) return 'Architecture analysis in progress...'
    return highlights.map(h => `- ${h}`).join('\n')
  }

  private formatTechRisks(risks: any[], strengths: any[]): string {
    const sections = []
    
    if (strengths?.length) {
      sections.push('### Technical Strengths\n' + 
        strengths.map(s => `- **${s.strength}** (Impact: ${s.impact})`).join('\n'))
    }
    
    if (risks?.length) {
      sections.push('### Technical Risks\n' + 
        risks.map(r => `- **${r.risk}** (Severity: ${r.severity}, Mitigation Effort: ${r.mitigationEffort})`).join('\n'))
    }
    
    return sections.join('\n\n') || 'Risk assessment in progress...'
  }

  private formatMarketSize(marketSize: any): string {
    if (!marketSize) return 'Market size analysis pending...'
    return `- **TAM**: ${marketSize.tam || 'TBD'}
- **SAM**: ${marketSize.sam || 'TBD'}
- **SOM**: ${marketSize.som || 'TBD'}
- **Growth Rate**: ${marketSize.growthRate || 'TBD'}
- **Market Maturity**: ${marketSize.marketMaturity || 'TBD'}`
  }

  private formatCompetitors(competitors: any[], additionalCompetitors?: string[]): string {
    let content = ''
    
    if (competitors?.length) {
      content = competitors.map(c => 
        `**${c.name}**: ${c.marketShare || 'N/A'} market share\n` +
        `- Strengths: ${c.strengths?.join(', ') || 'N/A'}\n` +
        `- Weaknesses: ${c.weaknesses?.join(', ') || 'N/A'}\n` +
        `- Position: ${c.relativePosition || 'N/A'}`
      ).join('\n\n')
    }
    
    if (additionalCompetitors?.length) {
      content += '\n\n**Other Competitors Identified**: ' + additionalCompetitors.join(', ')
    }
    
    return content || 'Competitive analysis in progress...'
  }

  private formatGrowthDrivers(drivers: string[]): string {
    if (!drivers?.length) return 'Growth driver analysis pending...'
    return drivers.map(d => `- ${d}`).join('\n')
  }

  private formatLeadership(leaders: any[], additionalPeople?: any[]): string {
    let content = ''
    
    if (leaders?.length) {
      content = leaders.map(l => 
        `**${l.role}**: ${l.name}\n` +
        `- Background: ${l.background}\n` +
        `- Strengths: ${l.strengths?.join(', ') || 'N/A'}\n` +
        `- Retention Risk: ${l.retentionRisk || 'N/A'}`
      ).join('\n\n')
    }
    
    if (additionalPeople?.length) {
      content += '\n\n**Additional Key Personnel**:\n' +
        additionalPeople.map(p => `- ${p.name} (${p.role}): ${p.background || 'Details pending'}`).join('\n')
    }
    
    return content || 'Leadership analysis in progress...'
  }

  private formatCulture(culture: any): string {
    if (!culture) return 'Culture assessment pending...'
    
    return `- **Employee Satisfaction**: ${culture.employeeSatisfaction || 'N/A'}/5
- **Glassdoor Rating**: ${culture.glassdoorRating || 'N/A'}
- **Turnover Rate**: ${culture.turnoverRate || 'N/A'}
- **Core Values**: ${culture.coreValues?.join(', ') || 'N/A'}
- **Work Style**: ${culture.workStyle || 'N/A'}`
  }

  private formatScaleReadiness(readiness: any): string {
    if (!readiness) return 'Scale readiness assessment pending...'
    
    return `- **Current Capacity**: ${readiness.currentCapacity || 'TBD'}
- **Hiring Needs**: ${readiness.hiringNeeds || 'TBD'}
- **Management Depth**: ${readiness.managementDepth || 'TBD'}
- **Process Maturity**: ${readiness.processMaturity || 'TBD'}`
  }

  private formatRevenue(revenue: any, financialData?: any): string {
    const arr = revenue?.currentARR || financialData?.revenue || 'Not disclosed'
    const growth = revenue?.growthRate || financialData?.growth || 'Not determined'
    const rpe = revenue?.revenuePerEmployee || 'Not calculated'
    
    return `- **Current ARR**: ${arr}
- **Growth Rate**: ${growth}
- **Revenue per Employee**: ${rpe}
- **Confidence Level**: ${revenue?.confidenceLevel || 'Moderate'}`
  }

  private formatUnitEconomics(economics: any): string {
    if (!economics) return 'Unit economics analysis pending...'
    
    return `- **CAC**: ${economics.estimatedCAC || 'TBD'}
- **ACV**: ${economics.estimatedACV || 'TBD'}
- **LTV**: ${economics.impliedLTV || 'TBD'}
- **LTV:CAC Ratio**: ${economics.ltcCacRatio || 'TBD'}
- **Payback Period**: ${economics.paybackPeriod || 'TBD'}
- **Gross Margin**: ${economics.grossMargin || 'TBD'}`
  }

  private formatProfitability(path: any): string {
    if (!path) return 'Profitability analysis pending...'
    
    return `- **Current State**: ${path.currentState || 'TBD'}
- **Break-even Timeline**: ${path.breakEvenTimeline || 'TBD'}
- **Required Scale**: ${path.requiredScale || 'TBD'}
- **Key Levers**: ${path.keyLevers?.join(', ') || 'TBD'}`
  }

  private formatSecurityInfra(security: any): string {
    if (!security) return 'Security infrastructure assessment pending...'
    
    return `- **Infrastructure**: ${security.infrastructure || 'TBD'}
- **Encryption**: ${security.encryption || 'TBD'}
- **Authentication**: ${security.authentication || 'TBD'}
- **Vulnerabilities**: ${security.vulnerabilities?.map((v: any) => `${v.type} (${v.severity})`).join(', ') || 'None identified'}`
  }

  private formatCompliance(compliance: any, certifications?: string[]): string {
    const current = compliance?.currentCertifications || certifications || []
    const inProgress = compliance?.inProgress || []
    const required = compliance?.required || []
    
    return `**Current Certifications**: ${current.join(', ') || 'None'}
**In Progress**: ${inProgress.join(', ') || 'None'}
**Required for Enterprise**: ${required.join(', ') || 'None'}

${compliance?.complianceGaps?.map((gap: any) => 
  `**${gap.requirement}**: ${gap.effort} effort, $${gap.cost} cost`
).join('\n') || ''}`
  }

  private formatSecurityRoadmap(roadmap: any): string {
    if (!roadmap) return 'Security roadmap pending...'
    
    return `- **Current State**: ${roadmap.currentState || 'TBD'}
- **Enterprise Timeline**: ${roadmap.timeToEnterprise || 'TBD'}
- **Investment Required**: ${roadmap.investmentRequired || 'TBD'}
- **Key Gaps**: ${roadmap.enterpriseGaps?.join(', ') || 'TBD'}`
  }

  private formatValueCreation(plan: any[]): string {
    if (!plan?.length) return 'Value creation plan being developed...'
    
    return plan.map(p => 
      `**${p.initiative}**\n` +
      `- Timeline: ${p.timeline}\n` +
      `- Investment: ${p.investment || 'TBD'}\n` +
      `- Expected Return: ${p.returnMultiple || 'TBD'}`
    ).join('\n\n')
  }

  private formatRiskMitigation(risks: any[]): string {
    if (!risks?.length) return 'Risk mitigation strategy being developed...'
    
    return risks.map(r => 
      `**${r.risk}** (Severity: ${r.severity})\n` +
      `- Mitigation: ${r.mitigation}\n` +
      `- Cost: ${r.cost || 'TBD'}\n` +
      `- Timeline: ${r.timeline || 'Immediate'}`
    ).join('\n\n')
  }

  private formatDealTerms(conditions: string[]): string {
    if (!conditions?.length) return 'Deal structure being formulated...'
    
    return '**Key Deal Conditions**:\n' + conditions.map((c, i) => `${i + 1}. ${c}`).join('\n')
  }

  // Utility methods
  private groupEvidenceByType(): Record<string, any[]> {
    const grouped: Record<string, any[]> = {
      technology: [],
      market: [],
      team: [],
      financial: [],
      security: [],
      general: []
    }

    this.evidence.forEach(item => {
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

    // Add general evidence to categories with low counts
    Object.keys(grouped).forEach(key => {
      if (key !== 'general' && grouped[key].length < 5) {
        grouped[key] = [...grouped[key], ...grouped.general.slice(0, 5)]
      }
    })

    return grouped
  }

  private generateExecutiveSummary(analyses: any): string {
    const techSummary = analyses.technology?.summary || 'Technology assessment in progress'
    const marketSummary = analyses.market?.summary || 'Market analysis in progress'
    const investmentRec = analyses.synthesis?.recommendation || 'Pending'
    
    return `${this.company} is being evaluated for ${this.investmentThesis} investment thesis. ${techSummary} ${marketSummary} Overall investment recommendation: ${investmentRec}.`
  }

  private calculateMarketScore(analysis: any): number {
    if (!analysis) return 0
    if (analysis.marketSize?.tam && analysis.competitivePosition?.marketShare) return 80
    if (analysis.marketSize?.tam || analysis.competitivePosition) return 60
    return 40
  }

  private calculateFinancialScore(analysis: any): number {
    if (!analysis) return 0
    if (analysis.unitEconomics?.ltcCacRatio && analysis.revenueEstimates?.currentARR) return 85
    if (analysis.unitEconomics || analysis.revenueEstimates) return 65
    return 45
  }

  // Calculate grade from score
  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Get trace for storage
  getTrace(): AnalysisTrace[] {
    return this.trace
  }
}

// Generate citations from evidence
function generateCitations(evidence: any[]): any[] {
  const citations: any[] = []
  let citationNumber = 1
  
  // Map evidence to report sections based on type
  evidence.forEach(item => {
    if (!item.content_data) return
    
    const section = determineSectionForEvidence(item)
    citations.push({
      citation_number: citationNumber++,
      evidence_item_id: item.id,
      section: section,
      claim_text: item.content_data.summary || item.content_data.processed || '',
      confidence: item.confidence_score || 0.8,
      source_url: item.source_url || '',
      evidence_type: item.evidence_type || item.type
    })
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
    
    console.log(`Starting Claude-orchestrated report generation for ${company} (${scanRequestId})`)
    
    try {
      // Load API keys from environment
      const apiKeys = await loadAPIKeys()
      if (!apiKeys.anthropicKey) {
        throw new Error('Failed to load Anthropic API key')
      }
      
      // Initialize Claude client only
      anthropic = new Anthropic({ apiKey: apiKeys.anthropicKey })
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
      
      console.log(`Loaded ${evidence.length} evidence items for Claude orchestration`)
      
      // Initialize orchestrator
      const orchestrator = new AnalysisOrchestrator(company, domain, investmentThesis, evidence)
      
      // Phase 1: Parse evidence with Gemini
      await job.updateProgress(20)
      const parsedData = await orchestrator.parseEvidence()
      
      // Phase 2: Analyze with Claude
      await job.updateProgress(40)
      const analyses = await orchestrator.analyzeWithClaude(parsedData)
      
      // Phase 3: Generate report
      await job.updateProgress(70)
      const reportData = await orchestrator.generateReport(parsedData, analyses)
      
      // Generate citations
      const citations = generateCitations(evidence)
      
      await job.updateProgress(80)
      
      // Store trace
      const trace = orchestrator.getTrace()
      await supabase
        .from('analysis_traces')
        .insert({
          scan_request_id: scanRequestId,
          trace_data: trace,
          created_at: new Date().toISOString()
        })
      
      // Create report record
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: Math.round(reportData.investment_score),
          investment_rationale: reportData.investment_rationale,
          tech_health_score: Math.round(reportData.tech_health_score),
          tech_health_grade: reportData.tech_health_grade,
          report_data: reportData,
          evidence_count: evidence.length,
          citation_count: citations.length,
          executive_summary: reportData.executiveSummary.content,
          report_version: 'claude-orchestrated',
          ai_model_used: 'claude-3-opus + gemini-1.5-pro',
          quality_score: Math.min(reportData.investment_score * 0.01, 1.0),
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
          ai_confidence: Math.round(reportData.investment_score),
          tech_health_score: Math.round(reportData.tech_health_score)
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`Claude-orchestrated report generation complete! Score: ${reportData.investment_score}`)
      
      return {
        success: true,
        reportId: report?.id,
        investmentScore: reportData.investment_score,
        citationCount: citations.length,
        analysisDepth: 'comprehensive',
        aiModels: 'claude-orchestrated',
        traceLength: trace.length
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
  console.log(`Job ${job.id} completed successfully with Claude orchestration`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await reportGenerationWorker.close()
  process.exit(0)
})

console.log('Report generation worker (Claude-orchestrated) started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)