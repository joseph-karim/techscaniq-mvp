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

// LangGraph-inspired state management
interface AnalysisState {
  // Input state
  scanRequestId: string
  company: string
  domain: string
  investmentThesis: string
  evidence: any[]
  
  // Processing state
  currentNode: string
  completedNodes: string[]
  iterationCount: number
  maxIterations: number
  
  // Analysis results
  parsedData?: any
  technologyAnalysis?: any
  marketAnalysis?: any
  teamAnalysis?: any
  financialAnalysis?: any
  securityAnalysis?: any
  investmentSynthesis?: any
  
  // Knowledge gaps and reflections
  knowledgeGaps: string[]
  followUpQuestions: string[]
  confidenceLevel: number
  
  // Final outputs
  reportData?: any
  citations?: any[]
  score?: any
  
  // Trace for audit
  trace: TraceEntry[]
}

interface TraceEntry {
  timestamp: string
  node: string
  action: string
  input?: any
  output?: any
  duration?: number
  error?: string
}

// Node definitions following LangGraph pattern
const GraphNodes = {
  PARSE_EVIDENCE: 'parse_evidence',
  IDENTIFY_GAPS: 'identify_gaps',
  ANALYZE_TECHNOLOGY: 'analyze_technology',
  ANALYZE_MARKET: 'analyze_market',
  ANALYZE_TEAM: 'analyze_team',
  ANALYZE_FINANCIAL: 'analyze_financial',
  ANALYZE_SECURITY: 'analyze_security',
  REFLECTION: 'reflection',
  SYNTHESIZE: 'synthesize',
  GENERATE_REPORT: 'generate_report'
} as const

// Initialize connections and services
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

// Trace helper
function addTrace(state: AnalysisState, node: string, action: string, data?: any): TraceEntry {
  const entry: TraceEntry = {
    timestamp: new Date().toISOString(),
    node,
    action,
    ...data
  }
  state.trace.push(entry)
  return entry
}

// Node implementations
async function parseEvidenceNode(state: AnalysisState): Promise<AnalysisState> {
  const startTime = Date.now()
  addTrace(state, GraphNodes.PARSE_EVIDENCE, 'Starting evidence parsing', {
    evidenceCount: state.evidence.length
  })

  try {
    const prompt = `Extract structured information from this evidence collection. 
    Focus on factual data points, metrics, and specific details.
    
    Evidence items:
    ${JSON.stringify(state.evidence.map(e => ({
      type: e.type,
      content: e.content_data?.summary || e.content_data?.processed || '',
      source: e.source_url
    })), null, 2)}
    
    Extract and return as JSON with these fields:
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
      "strengths": ["mentioned strengths or praise"],
      "dataQuality": {
        "missingCritical": ["what key data is missing"],
        "lowConfidence": ["what data has low confidence"]
      }
    }`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? jsonMatch[1] : text
    const parsedData = JSON.parse(jsonStr)
    
    state.parsedData = parsedData
    state.completedNodes.push(GraphNodes.PARSE_EVIDENCE)
    
    addTrace(state, GraphNodes.PARSE_EVIDENCE, 'Completed parsing', {
      output: { dataPointsExtracted: Object.keys(parsedData).length },
      duration: Date.now() - startTime
    })
    
    return state
  } catch (error) {
    addTrace(state, GraphNodes.PARSE_EVIDENCE, 'Error parsing evidence', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })
    throw error
  }
}

async function identifyGapsNode(state: AnalysisState): Promise<AnalysisState> {
  const startTime = Date.now()
  addTrace(state, GraphNodes.IDENTIFY_GAPS, 'Identifying knowledge gaps')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      temperature: 0.5,
      system: 'You are an investment analyst identifying critical missing information for due diligence.',
      messages: [
        {
          role: 'user',
          content: `Based on this parsed data for ${state.company} (${state.investmentThesis}), identify critical knowledge gaps:

Parsed Data:
${JSON.stringify(state.parsedData, null, 2)}

Evidence Types Available:
- Technology: ${state.evidence.filter(e => e.type?.includes('tech')).length} items
- Market: ${state.evidence.filter(e => e.type?.includes('market')).length} items
- Financial: ${state.evidence.filter(e => e.type?.includes('financial')).length} items
- Team: ${state.evidence.filter(e => e.type?.includes('team')).length} items

Identify:
1. Critical missing information for investment decision
2. Low confidence areas needing verification
3. Follow-up questions to answer
4. Overall confidence level (0-100%)

Format as JSON:
{
  "knowledgeGaps": ["list of critical missing info"],
  "lowConfidenceAreas": ["areas needing verification"],
  "followUpQuestions": ["specific questions to investigate"],
  "confidenceLevel": 75,
  "recommendation": "proceed" | "gather_more" | "insufficient"
}`
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const gapAnalysis = JSON.parse(responseText)
    
    state.knowledgeGaps = gapAnalysis.knowledgeGaps || []
    state.followUpQuestions = gapAnalysis.followUpQuestions || []
    state.confidenceLevel = gapAnalysis.confidenceLevel || 50
    state.completedNodes.push(GraphNodes.IDENTIFY_GAPS)
    
    addTrace(state, GraphNodes.IDENTIFY_GAPS, 'Gaps identified', {
      output: {
        gapCount: state.knowledgeGaps.length,
        confidenceLevel: state.confidenceLevel,
        recommendation: gapAnalysis.recommendation
      },
      duration: Date.now() - startTime
    })
    
    return state
  } catch (error) {
    addTrace(state, GraphNodes.IDENTIFY_GAPS, 'Error identifying gaps', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })
    // Continue without gap analysis
    state.completedNodes.push(GraphNodes.IDENTIFY_GAPS)
    return state
  }
}

async function analyzeWithClaudeNode(
  state: AnalysisState,
  nodeType: string,
  promptId: string
): Promise<AnalysisState> {
  const startTime = Date.now()
  addTrace(state, nodeType, `Starting ${promptId} analysis`)

  try {
    const prompts = getAllAnalysisPrompts()
    const prompt = prompts.find(p => p.id === promptId)
    if (!prompt) throw new Error(`Prompt ${promptId} not found`)

    // Filter relevant evidence
    const relevantEvidence = state.evidence.filter(e => {
      const type = e.type || ''
      switch (promptId) {
        case 'tech-stack-analysis':
          return type.includes('tech') || type.includes('stack') || type.includes('architecture')
        case 'market-position-analysis':
          return type.includes('market') || type.includes('competitor') || type.includes('customer')
        case 'team-culture-analysis':
          return type.includes('team') || type.includes('culture') || type.includes('employee')
        case 'financial-analysis':
          return type.includes('financial') || type.includes('pricing') || type.includes('revenue')
        case 'security-compliance-analysis':
          return type.includes('security') || type.includes('compliance')
        default:
          return true
      }
    })

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0.3,
      system: prompt.systemPrompt,
      messages: [
        {
          role: 'user',
          content: `${prompt.taskDescription}

# Input Context
Company: ${state.company}
Domain: ${state.domain}
Investment Thesis: ${state.investmentThesis}

# Parsed Evidence Summary:
${JSON.stringify(state.parsedData, null, 2)}

# Relevant Evidence Items (${relevantEvidence.length} items):
${relevantEvidence.slice(0, 10).map(e => `- [${e.type}] ${e.content_data?.summary || ''}`).join('\n')}

# Known Knowledge Gaps:
${state.knowledgeGaps.join('\n')}

# Methodology & Constraints
${prompt.methodology.map(m => `- ${m}`).join('\n')}

# Output Format
Provide analysis in this JSON format:
${prompt.outputFormat}`
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText
    const analysis = JSON.parse(jsonStr)
    
    // Store analysis result
    switch (promptId) {
      case 'tech-stack-analysis':
        state.technologyAnalysis = analysis
        break
      case 'market-position-analysis':
        state.marketAnalysis = analysis
        break
      case 'team-culture-analysis':
        state.teamAnalysis = analysis
        break
      case 'financial-analysis':
        state.financialAnalysis = analysis
        break
      case 'security-compliance-analysis':
        state.securityAnalysis = analysis
        break
    }
    
    state.completedNodes.push(nodeType)
    
    addTrace(state, nodeType, `Completed ${promptId} analysis`, {
      output: { analysisComplete: true, hasErrors: !!analysis.error },
      duration: Date.now() - startTime
    })
    
    return state
  } catch (error) {
    addTrace(state, nodeType, `Error in ${promptId} analysis`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })
    
    // Store error state
    const errorAnalysis = {
      error: error instanceof Error ? error.message : 'Analysis failed',
      summary: 'Unable to complete analysis due to an error'
    }
    
    switch (promptId) {
      case 'tech-stack-analysis':
        state.technologyAnalysis = errorAnalysis
        break
      case 'market-position-analysis':
        state.marketAnalysis = errorAnalysis
        break
      case 'team-culture-analysis':
        state.teamAnalysis = errorAnalysis
        break
      case 'financial-analysis':
        state.financialAnalysis = errorAnalysis
        break
      case 'security-compliance-analysis':
        state.securityAnalysis = errorAnalysis
        break
    }
    
    state.completedNodes.push(nodeType)
    return state
  }
}

async function reflectionNode(state: AnalysisState): Promise<AnalysisState> {
  const startTime = Date.now()
  addTrace(state, GraphNodes.REFLECTION, 'Reflecting on analysis completeness')

  try {
    // Check if we should do another iteration
    const analysisComplete = [
      state.technologyAnalysis,
      state.marketAnalysis,
      state.teamAnalysis,
      state.financialAnalysis,
      state.securityAnalysis
    ].every(a => a && !a.error)
    
    const highConfidence = state.confidenceLevel >= 70
    const belowMaxIterations = state.iterationCount < state.maxIterations
    
    if (!analysisComplete && belowMaxIterations) {
      // Need another iteration
      state.iterationCount++
      
      addTrace(state, GraphNodes.REFLECTION, 'Analysis incomplete, starting new iteration', {
        iteration: state.iterationCount,
        confidenceLevel: state.confidenceLevel,
        duration: Date.now() - startTime
      })
      
      // Reset for next iteration
      state.currentNode = GraphNodes.IDENTIFY_GAPS
      return state
    }
    
    // Analysis is complete or max iterations reached
    state.completedNodes.push(GraphNodes.REFLECTION)
    
    addTrace(state, GraphNodes.REFLECTION, 'Analysis complete, proceeding to synthesis', {
      finalConfidence: state.confidenceLevel,
      iterations: state.iterationCount,
      duration: Date.now() - startTime
    })
    
    return state
  } catch (error) {
    addTrace(state, GraphNodes.REFLECTION, 'Error in reflection', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })
    state.completedNodes.push(GraphNodes.REFLECTION)
    return state
  }
}

async function synthesizeNode(state: AnalysisState): Promise<AnalysisState> {
  const startTime = Date.now()
  addTrace(state, GraphNodes.SYNTHESIZE, 'Synthesizing investment recommendation')

  try {
    // Calculate comprehensive score
    const evidenceItems: EvidenceItem[] = state.evidence.map(item => ({
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
      { type: state.investmentThesis }
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
          content: `Synthesize the analysis for ${state.company} into a comprehensive investment recommendation.

Investment Thesis: ${state.investmentThesis}

Technology Assessment:
${JSON.stringify(state.technologyAnalysis, null, 2)}

Market Analysis:
${JSON.stringify(state.marketAnalysis, null, 2)}

Team Analysis:
${JSON.stringify(state.teamAnalysis, null, 2)}

Financial Analysis:
${JSON.stringify(state.financialAnalysis, null, 2)}

Security Analysis:
${JSON.stringify(state.securityAnalysis, null, 2)}

Comprehensive Scoring:
- Investment Score: ${comprehensiveScore.investmentScore}
- Technical Score: ${comprehensiveScore.technicalScore}
- Confidence Level: ${comprehensiveScore.confidenceBreakdown.overallConfidence}%
- Evidence Quality: ${comprehensiveScore.confidenceBreakdown.evidenceQuality * 100}%

Knowledge Gaps Identified:
${state.knowledgeGaps.join('\n')}

Analysis Iterations: ${state.iterationCount}
Final Confidence: ${state.confidenceLevel}%

Provide the final investment recommendation in the specified JSON format.`
        }
      ]
    })

    const synthesisText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = synthesisText.match(/```json\n([\s\S]*?)\n```/) || synthesisText.match(/({[\s\S]*})/)
    const jsonStr = jsonMatch ? jsonMatch[1] : synthesisText
    state.investmentSynthesis = JSON.parse(jsonStr)
    
    state.score = comprehensiveScore
    state.completedNodes.push(GraphNodes.SYNTHESIZE)
    
    addTrace(state, GraphNodes.SYNTHESIZE, 'Synthesis complete', {
      output: {
        recommendation: state.investmentSynthesis.recommendation,
        investmentScore: state.investmentSynthesis.investmentScore,
        confidenceLevel: state.investmentSynthesis.confidenceLevel
      },
      duration: Date.now() - startTime
    })
    
    return state
  } catch (error) {
    addTrace(state, GraphNodes.SYNTHESIZE, 'Error in synthesis', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })
    throw error
  }
}

async function generateReportNode(state: AnalysisState): Promise<AnalysisState> {
  const startTime = Date.now()
  addTrace(state, GraphNodes.GENERATE_REPORT, 'Generating final report')

  try {
    // Build the report structure
    const reportData = {
      // Company Information
      companyInfo: {
        name: state.company,
        website: `https://${state.domain}`,
        description: state.technologyAnalysis?.summary || `${state.company} operating in ${state.investmentThesis} space`,
        ...extractCompanyInfo(state.parsedData)
      },
      
      // Executive Summary
      executiveSummary: {
        title: 'Executive Summary',
        content: state.investmentSynthesis?.executiveSummary || 'Executive summary pending.'
      },
      
      // Report sections with full content
      sections: [
        {
          title: 'Technology Stack & Architecture',
          content: formatTechnologyAnalysis(state.technologyAnalysis),
          score: state.technologyAnalysis?.scalabilityScore || state.score?.technicalScore || 0,
          subsections: generateTechSubsections(state.technologyAnalysis, state.parsedData)
        },
        {
          title: 'Market Position & Competition',
          content: formatMarketAnalysis(state.marketAnalysis),
          score: calculateMarketScore(state.marketAnalysis),
          subsections: generateMarketSubsections(state.marketAnalysis, state.parsedData)
        },
        {
          title: 'Team & Organizational Strength',
          content: formatTeamAnalysis(state.teamAnalysis),
          score: state.teamAnalysis?.leadershipScore || state.score?.teamScore || 0,
          subsections: generateTeamSubsections(state.teamAnalysis, state.parsedData)
        },
        {
          title: 'Financial Health & Unit Economics',
          content: formatFinancialAnalysis(state.financialAnalysis),
          score: calculateFinancialScore(state.financialAnalysis),
          subsections: generateFinancialSubsections(state.financialAnalysis, state.parsedData)
        },
        {
          title: 'Security & Compliance',
          content: formatSecurityAnalysis(state.securityAnalysis),
          score: state.securityAnalysis?.securityScore || 0,
          subsections: generateSecuritySubsections(state.securityAnalysis, state.parsedData)
        },
        {
          title: 'Investment Recommendation',
          content: formatInvestmentRecommendation(state.investmentSynthesis),
          score: state.investmentSynthesis?.investmentScore || state.score?.investmentScore || 0,
          subsections: generateInvestmentSubsections(state.investmentSynthesis)
        }
      ],
      
      // Metadata with trace
      metadata: {
        comprehensiveScore: state.score,
        analysisTimestamp: new Date().toISOString(),
        evidenceCount: state.evidence.length,
        aiModels: {
          parsing: 'gemini-1.5-pro',
          analysis: 'claude-3-opus',
          orchestration: 'langgraph-pattern'
        },
        analysisDepth: 'comprehensive',
        iterations: state.iterationCount,
        finalConfidence: state.confidenceLevel,
        knowledgeGaps: state.knowledgeGaps,
        traceUrl: `/api/traces/${state.scanRequestId}` // Link to full trace
      },
      
      // Investment metrics
      investment_score: state.investmentSynthesis?.investmentScore || state.score?.investmentScore || 0,
      tech_health_score: state.technologyAnalysis?.scalabilityScore ? state.technologyAnalysis.scalabilityScore * 10 : state.score?.technicalScore || 0,
      tech_health_grade: state.score?.finalGrade || 'B',
      investment_rationale: state.investmentSynthesis?.executiveSummary || 'See detailed analysis in report sections'
    }

    // Generate citations
    const citations = generateCitations(state.evidence, reportData)
    
    state.reportData = reportData
    state.citations = citations
    state.completedNodes.push(GraphNodes.GENERATE_REPORT)
    
    addTrace(state, GraphNodes.GENERATE_REPORT, 'Report generation complete', {
      output: {
        sectionCount: reportData.sections.length,
        citationCount: citations.length,
        investmentScore: reportData.investment_score
      },
      duration: Date.now() - startTime
    })
    
    return state
  } catch (error) {
    addTrace(state, GraphNodes.GENERATE_REPORT, 'Error generating report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })
    throw error
  }
}

// Graph execution engine
async function executeGraph(initialState: AnalysisState): Promise<AnalysisState> {
  let state = initialState
  
  // Define the graph flow
  const graphFlow = {
    [GraphNodes.PARSE_EVIDENCE]: async (s: AnalysisState) => {
      s = await parseEvidenceNode(s)
      s.currentNode = GraphNodes.IDENTIFY_GAPS
      return s
    },
    [GraphNodes.IDENTIFY_GAPS]: async (s: AnalysisState) => {
      s = await identifyGapsNode(s)
      // Parallel analysis nodes
      s.currentNode = GraphNodes.ANALYZE_TECHNOLOGY
      return s
    },
    [GraphNodes.ANALYZE_TECHNOLOGY]: async (s: AnalysisState) => {
      // Run all analysis nodes in parallel
      const [techState, marketState, teamState, financialState, securityState] = await Promise.all([
        analyzeWithClaudeNode({ ...s }, GraphNodes.ANALYZE_TECHNOLOGY, 'tech-stack-analysis'),
        analyzeWithClaudeNode({ ...s }, GraphNodes.ANALYZE_MARKET, 'market-position-analysis'),
        analyzeWithClaudeNode({ ...s }, GraphNodes.ANALYZE_TEAM, 'team-culture-analysis'),
        analyzeWithClaudeNode({ ...s }, GraphNodes.ANALYZE_FINANCIAL, 'financial-analysis'),
        analyzeWithClaudeNode({ ...s }, GraphNodes.ANALYZE_SECURITY, 'security-compliance-analysis')
      ])
      
      // Merge results
      s.technologyAnalysis = techState.technologyAnalysis
      s.marketAnalysis = marketState.marketAnalysis
      s.teamAnalysis = teamState.teamAnalysis
      s.financialAnalysis = financialState.financialAnalysis
      s.securityAnalysis = securityState.securityAnalysis
      s.completedNodes = [...new Set([
        ...s.completedNodes,
        ...techState.completedNodes,
        ...marketState.completedNodes,
        ...teamState.completedNodes,
        ...financialState.completedNodes,
        ...securityState.completedNodes
      ])]
      
      s.currentNode = GraphNodes.REFLECTION
      return s
    },
    [GraphNodes.REFLECTION]: async (s: AnalysisState) => {
      s = await reflectionNode(s)
      if (s.currentNode === GraphNodes.IDENTIFY_GAPS) {
        // Loop back for another iteration
        return s
      }
      s.currentNode = GraphNodes.SYNTHESIZE
      return s
    },
    [GraphNodes.SYNTHESIZE]: async (s: AnalysisState) => {
      s = await synthesizeNode(s)
      s.currentNode = GraphNodes.GENERATE_REPORT
      return s
    },
    [GraphNodes.GENERATE_REPORT]: async (s: AnalysisState) => {
      s = await generateReportNode(s)
      s.currentNode = 'END'
      return s
    }
  }
  
  // Execute the graph
  while (state.currentNode !== 'END') {
    const nodeHandler = graphFlow[state.currentNode as keyof typeof graphFlow]
    if (!nodeHandler) {
      throw new Error(`Unknown node: ${state.currentNode}`)
    }
    
    state = await nodeHandler(state)
    
    // Safety check for infinite loops
    if (state.trace.length > 100) {
      addTrace(state, 'SAFETY', 'Maximum trace length exceeded, stopping execution')
      break
    }
  }
  
  return state
}

// Helper functions (simplified versions from previous implementation)
function extractCompanyInfo(parsedData: any): any {
  return {
    headquarters: parsedData?.metrics?.headquarters || 'Location not determined',
    founded: parsedData?.metrics?.founded || 'Year not determined',
    employeeCount: parsedData?.metrics?.employees || 'Size not determined',
    fundingTotal: parsedData?.fundingInfo?.totalRaised || 'Funding not disclosed',
    lastValuation: parsedData?.fundingInfo?.valuation || 'Valuation not disclosed',
    revenue: parsedData?.metrics?.revenue || 'Revenue not disclosed'
  }
}

function formatTechnologyAnalysis(analysis: any): string {
  if (!analysis) return 'Technology analysis pending.'
  if (analysis.error) return `Analysis incomplete: ${analysis.error}`
  
  return `## Technology Assessment

${analysis.summary || 'Technology analysis in progress.'}

### Key Findings
- **Technical Debt Score**: ${analysis.technicalDebtScore || 'N/A'}/10
- **Scalability Score**: ${analysis.scalabilityScore || 'N/A'}/10
- **Security Posture**: ${analysis.securityPosture || 'Not assessed'}

${analysis.investmentPerspective?.keyTakeaway || ''}`
}

function formatMarketAnalysis(analysis: any): string {
  if (!analysis) return 'Market analysis pending.'
  if (analysis.error) return `Analysis incomplete: ${analysis.error}`
  
  return `## Market Position Analysis

${analysis.summary || 'Market analysis in progress.'}

### Market Metrics
- **TAM**: ${analysis.marketSize?.tam || 'Not determined'}
- **Growth Rate**: ${analysis.marketSize?.growthRate || 'Not determined'}
- **Market Position**: ${analysis.competitivePosition?.ranking || 'Not determined'}`
}

function formatTeamAnalysis(analysis: any): string {
  if (!analysis) return 'Team analysis pending.'
  return analysis.summary || 'Team analysis in progress.'
}

function formatFinancialAnalysis(analysis: any): string {
  if (!analysis) return 'Financial analysis pending.'
  return analysis.summary || 'Financial analysis in progress.'
}

function formatSecurityAnalysis(analysis: any): string {
  if (!analysis) return 'Security analysis pending.'
  return analysis.summary || 'Security analysis in progress.'
}

function formatInvestmentRecommendation(synthesis: any): string {
  if (!synthesis) return 'Investment recommendation pending.'
  
  return `## Investment Recommendation

### Recommendation: ${synthesis.recommendation || 'PENDING'}
### Investment Score: ${synthesis.investmentScore || 0}/100
### Confidence Level: ${synthesis.confidenceLevel || 0}%

${synthesis.executiveSummary || 'Detailed analysis in progress.'}`
}

function generateTechSubsections(analysis: any, parsedData: any): any[] {
  return [
    {
      title: 'Core Technologies',
      content: `Technologies identified: ${parsedData?.technologies?.join(', ') || 'Analysis pending'}`
    }
  ]
}

function generateMarketSubsections(analysis: any, parsedData: any): any[] {
  return [
    {
      title: 'Competitive Landscape',
      content: `Competitors: ${parsedData?.competitorMentions?.join(', ') || 'Analysis pending'}`
    }
  ]
}

function generateTeamSubsections(analysis: any, parsedData: any): any[] {
  return [
    {
      title: 'Leadership',
      content: 'Leadership analysis pending'
    }
  ]
}

function generateFinancialSubsections(analysis: any, parsedData: any): any[] {
  return [
    {
      title: 'Revenue Metrics',
      content: `Revenue: ${parsedData?.metrics?.revenue || 'Not disclosed'}`
    }
  ]
}

function generateSecuritySubsections(analysis: any, parsedData: any): any[] {
  return [
    {
      title: 'Compliance',
      content: `Certifications: ${parsedData?.securityCertifications?.join(', ') || 'None identified'}`
    }
  ]
}

function generateInvestmentSubsections(synthesis: any): any[] {
  return [
    {
      title: 'Next Steps',
      content: synthesis?.nextSteps?.join('\n') || 'Next steps pending'
    }
  ]
}

function calculateMarketScore(analysis: any): number {
  return analysis?.marketSize ? 75 : 50
}

function calculateFinancialScore(analysis: any): number {
  return analysis?.unitEconomics ? 75 : 50
}

function generateCitations(evidence: any[], reportData: any): any[] {
  const citations: any[] = []
  let citationNumber = 1
  
  evidence.forEach(item => {
    if (item.content_data) {
      citations.push({
        citation_number: citationNumber++,
        evidence_item_id: item.id,
        section: 'analysis',
        claim_text: item.content_data.summary || item.content_data.processed || '',
        confidence: item.confidence_score || 0.8
      })
    }
  })
  
  return citations
}

// Main worker
export const reportGenerationWorker = new Worker<ReportGenerationJob>(
  'report-generation',
  async (job: Job<ReportGenerationJob>) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`Starting LangGraph-pattern report generation for ${company} (${scanRequestId})`)
    
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
      
      console.log(`Loaded ${evidence.length} evidence items for LangGraph analysis`)
      
      // Initialize state
      const initialState: AnalysisState = {
        scanRequestId,
        company,
        domain,
        investmentThesis,
        evidence,
        currentNode: GraphNodes.PARSE_EVIDENCE,
        completedNodes: [],
        iterationCount: 1,
        maxIterations: 3,
        knowledgeGaps: [],
        followUpQuestions: [],
        confidenceLevel: 0,
        trace: []
      }
      
      // Execute the graph
      await job.updateProgress(30)
      const finalState = await executeGraph(initialState)
      
      await job.updateProgress(80)
      
      // Store trace for audit
      await supabase
        .from('analysis_traces')
        .insert({
          scan_request_id: scanRequestId,
          trace_data: finalState.trace,
          created_at: new Date().toISOString()
        })
      
      // Create report record
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: Math.round(finalState.reportData.investment_score),
          investment_rationale: finalState.reportData.investment_rationale,
          tech_health_score: Math.round(finalState.reportData.tech_health_score),
          tech_health_grade: finalState.reportData.tech_health_grade,
          report_data: finalState.reportData,
          evidence_count: evidence.length,
          citation_count: finalState.citations?.length || 0,
          executive_summary: finalState.reportData.executiveSummary.content,
          report_version: '6.0-langgraph',
          ai_model_used: 'claude+gemini+langgraph',
          quality_score: Math.min(finalState.reportData.investment_score * 0.01, 1.0),
          human_reviewed: false,
          metadata: finalState.reportData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (reportError) throw reportError
      
      await job.updateProgress(90)
      
      // Store citations
      if (finalState.citations && finalState.citations.length > 0 && report) {
        const citationRecords = finalState.citations.map(c => ({
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
          ai_confidence: Math.round(finalState.reportData.investment_score),
          tech_health_score: Math.round(finalState.reportData.tech_health_score)
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`LangGraph report generation complete! Score: ${finalState.reportData.investment_score}`)
      
      return {
        success: true,
        reportId: report?.id,
        investmentScore: finalState.reportData.investment_score,
        citationCount: finalState.citations?.length || 0,
        analysisDepth: 'comprehensive',
        aiModels: 'claude+gemini+langgraph',
        iterations: finalState.iterationCount,
        traceLength: finalState.trace.length
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
  console.log(`Job ${job.id} completed successfully with LangGraph pattern`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await reportGenerationWorker.close()
  process.exit(0)
})

console.log('Report generation worker (LangGraph pattern) started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)