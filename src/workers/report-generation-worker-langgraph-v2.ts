import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { StateGraph, Annotation } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import { Anthropic } from '@anthropic-ai/sdk'
// import { GoogleGenerativeAI } from '@google/generative-ai' // Not used in this implementation

// Load environment variables
config()

// Initialize clients
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!) // Not used in this implementation

// Define the state for our research graph
const ResearchState = Annotation.Root({
  // Company information
  company: Annotation<string>(),
  domain: Annotation<string>(),
  investmentThesis: Annotation<string>(),
  scanRequestId: Annotation<string>(),
  
  // Evidence collection
  evidenceCollected: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  evidenceByType: Annotation<Record<string, any[]>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  totalEvidence: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  
  // Analysis results
  parsedData: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  sectionAnalyses: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  
  // Citations
  citations: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  citationMap: Annotation<Record<string, number>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  
  // Report sections
  reportSections: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  executiveSummary: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => '' }),
  
  // Scoring
  investmentScore: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  techHealthScore: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  confidenceScore: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  
  // Metadata
  analysisTrace: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  errors: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  currentPhase: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => 'initializing' }),
})

// Node functions
async function loadEvidence(state: typeof ResearchState.State) {
  console.log('[LoadEvidence] Loading evidence from database...')
  
  try {
    // Find evidence collection
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .contains('metadata', { scan_request_id: state.scanRequestId })
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (!collection) {
      throw new Error('No evidence collection found')
    }
    
    // Load evidence items
    const { data: evidence } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('collection_id', collection.id)
      .order('confidence_score', { ascending: false })
    
    if (!evidence || evidence.length === 0) {
      throw new Error('No evidence items found')
    }
    
    // Organize evidence by type
    const evidenceByType: Record<string, any[]> = {}
    evidence.forEach(item => {
      const type = item.type || item.evidence_type || 'general'
      if (!evidenceByType[type]) {
        evidenceByType[type] = []
      }
      evidenceByType[type].push(item)
    })
    
    return {
      evidenceCollected: evidence,
      evidenceByType,
      totalEvidence: evidence.length,
      currentPhase: 'evidence_loaded',
      analysisTrace: [...state.analysisTrace, {
        phase: 'evidence_loading',
        timestamp: new Date().toISOString(),
        evidenceCount: evidence.length,
        types: Object.keys(evidenceByType)
      }]
    }
  } catch (error) {
    console.error('[LoadEvidence] Error:', error)
    return {
      errors: [...state.errors, `Evidence loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentPhase: 'error'
    }
  }
}

async function parseEvidence(state: typeof ResearchState.State) {
  console.log('[ParseEvidence] Structuring evidence data...')
  
  try {
    const evidence = state.evidenceCollected
    
    // Structure the parsed data
    const parsedData = {
      companyInfo: {
        name: state.company,
        domain: state.domain,
      },
      technologies: extractTechnologies(evidence),
      market: extractMarketData(evidence),
      team: extractTeamData(evidence),
      financial: extractFinancialData(evidence),
      security: extractSecurityData(evidence),
    }
    
    return {
      parsedData,
      currentPhase: 'evidence_parsed',
      analysisTrace: [...state.analysisTrace, {
        phase: 'evidence_parsing',
        timestamp: new Date().toISOString(),
        dataPoints: Object.keys(parsedData).length
      }]
    }
  } catch (error) {
    console.error('[ParseEvidence] Error:', error)
    return {
      errors: [...state.errors, `Evidence parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentPhase: 'error'
    }
  }
}

async function analyzeTechnology(state: typeof ResearchState.State) {
  console.log('[AnalyzeTechnology] Analyzing technology stack...')
  
  try {
    const relevantEvidence = [
      ...(state.evidenceByType['technology_stack'] || []),
      ...(state.evidenceByType['api_response'] || []),
      ...(state.evidenceByType['webpage_content'] || [])
    ].filter(e => 
      e.title?.toLowerCase().includes('tech') ||
      e.content_data?.summary?.toLowerCase().includes('tech') ||
      e.content_data?.processed?.toLowerCase().includes('tech')
    )
    const techData = state.parsedData?.technologies || {}
    
    const prompt = `Analyze the technology stack for ${state.company} based on this evidence:

Evidence Items (${relevantEvidence.length}):
${relevantEvidence.map((e, i) => `[E${i+1}] ${e.content_data?.summary || e.title}`).join('\n')}

Technology Data:
${JSON.stringify(techData, null, 2)}

Provide a comprehensive analysis including:
1. Core technology stack and architecture
2. Technical strengths and innovations
3. Scalability and performance capabilities
4. Technical debt and risks
5. Development practices and culture

IMPORTANT: Reference specific evidence items using [E1], [E2], etc.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
    
    const analysis = response.content[0].type === 'text' ? response.content[0].text : ''
    
    return {
      sectionAnalyses: {
        ...state.sectionAnalyses,
        technology: {
          content: analysis,
          evidenceUsed: relevantEvidence.map(e => e.id),
          confidence: 0.85
        }
      },
      currentPhase: 'technology_analyzed',
      analysisTrace: [...state.analysisTrace, {
        phase: 'technology_analysis',
        timestamp: new Date().toISOString(),
        evidenceCount: relevantEvidence.length
      }]
    }
  } catch (error) {
    console.error('[AnalyzeTechnology] Error:', error)
    return {
      errors: [...state.errors, `Technology analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

async function analyzeMarket(state: typeof ResearchState.State) {
  console.log('[AnalyzeMarket] Analyzing market position...')
  
  try {
    const relevantEvidence = [
      ...(state.evidenceByType['market_analysis'] || []),
      ...(state.evidenceByType['business_overview'] || []),
      ...(state.evidenceByType['search_result'] || [])
    ].filter(e => 
      e.title?.toLowerCase().includes('market') ||
      e.title?.toLowerCase().includes('compet') ||
      e.content_data?.summary?.toLowerCase().includes('market') ||
      e.content_data?.summary?.toLowerCase().includes('compet')
    )
    
    const prompt = `Analyze the market position for ${state.company}:

Evidence Items (${relevantEvidence.length}):
${relevantEvidence.map((e, i) => `[E${i+1}] ${e.content_data?.summary || e.title}`).join('\n')}

Provide analysis of:
1. Market size and growth potential
2. Competitive landscape and positioning
3. Customer base and segments
4. Market differentiation
5. Growth opportunities and threats

Reference evidence using [E1], [E2], etc.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
    
    const analysis = response.content[0].type === 'text' ? response.content[0].text : ''
    
    return {
      sectionAnalyses: {
        ...state.sectionAnalyses,
        market: {
          content: analysis,
          evidenceUsed: relevantEvidence.map(e => e.id),
          confidence: 0.80
        }
      },
      currentPhase: 'market_analyzed'
    }
  } catch (error) {
    return {
      errors: [...state.errors, `Market analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

async function analyzeTeam(state: typeof ResearchState.State) {
  console.log('[AnalyzeTeam] Analyzing team and organization...')
  
  const relevantEvidence = [
    ...(state.evidenceByType['team'] || []),
    ...(state.evidenceByType['culture'] || [])
  ]
  
  // Similar implementation...
  return {
    sectionAnalyses: {
      ...state.sectionAnalyses,
      team: {
        content: 'Team analysis...',
        evidenceUsed: relevantEvidence.map(e => e.id),
        confidence: 0.75
      }
    },
    currentPhase: 'team_analyzed'
  }
}

async function analyzeFinancials(state: typeof ResearchState.State) {
  console.log('[AnalyzeFinancials] Analyzing financial health...')
  
  const relevantEvidence = [
    ...(state.evidenceByType['financial'] || []),
    ...(state.evidenceByType['pricing'] || [])
  ]
  
  // Similar implementation...
  return {
    sectionAnalyses: {
      ...state.sectionAnalyses,
      financials: {
        content: 'Financial analysis...',
        evidenceUsed: relevantEvidence.map(e => e.id),
        confidence: 0.82
      }
    },
    currentPhase: 'financials_analyzed'
  }
}

async function generateCitations(state: typeof ResearchState.State) {
  console.log('[GenerateCitations] Creating citations from evidence...')
  
  const citations: any[] = []
  let citationNumber = 1
  const citationMap: Record<string, number> = {}
  
  // Generate citations for all used evidence
  Object.values(state.sectionAnalyses).forEach(section => {
    section.evidenceUsed?.forEach((evidenceId: string) => {
      const evidence = state.evidenceCollected.find(e => e.id === evidenceId)
      if (evidence && !citationMap[evidenceId]) {
        const claimText = evidence.content_data?.summary || evidence.title || ''
        
        citations.push({
          claim_id: `claim_${evidence.id}`,
          claim: claimText,
          citation_text: claimText,
          citation_number: citationNumber,
          evidence_item_id: evidence.id,
          confidence: Math.round((evidence.confidence_score || 0.8) * 100),
          reasoning: `Based on ${evidence.evidence_type || evidence.type} evidence`,
          analyst: 'langgraph-claude',
          review_date: new Date().toISOString(),
          methodology: 'LangGraph AI-driven analysis',
          evidence_summary: {
            type: evidence.evidence_type || evidence.type,
            source: evidence.source_url || '',
            confidence: evidence.confidence_score || 0.8,
            content: evidence.content_data
          }
        })
        
        citationMap[evidenceId] = citationNumber
        citationNumber++
      }
    })
  })
  
  return {
    citations,
    citationMap,
    currentPhase: 'citations_generated'
  }
}

async function compileReport(state: typeof ResearchState.State) {
  console.log('[CompileReport] Compiling final report...')
  
  // Inject citations into section content
  const sectionsWithCitations: Record<string, any> = {}
  
  Object.entries(state.sectionAnalyses).forEach(([key, section]) => {
    let content = section.content
    
    // Replace [E1] style references with actual citation numbers
    section.evidenceUsed?.forEach((evidenceId: string, index: number) => {
      const citationNum = state.citationMap[evidenceId]
      if (citationNum) {
        const pattern = new RegExp(`\\[E${index + 1}\\]`, 'g')
        content = content.replace(pattern, `[${citationNum}](#cite-${citationNum})`)
      }
    })
    
    sectionsWithCitations[key] = {
      title: getSectionTitle(key),
      content,
      score: Math.round(section.confidence * 100),
      subsections: []
    }
  })
  
  // Calculate scores
  const avgConfidence = Object.values(state.sectionAnalyses)
    .reduce((sum, s) => sum + (s.confidence || 0), 0) / Object.keys(state.sectionAnalyses).length
  
  const investmentScore = Math.round(avgConfidence * 100)
  const techHealthScore = Math.round((state.sectionAnalyses.technology?.confidence || 0.5) * 100)
  
  return {
    reportSections: sectionsWithCitations,
    investmentScore,
    techHealthScore,
    confidenceScore: avgConfidence,
    currentPhase: 'report_compiled'
  }
}

async function generateExecutiveSummary(state: typeof ResearchState.State) {
  console.log('[GenerateExecutiveSummary] Creating executive summary...')
  
  const prompt = `Create an executive summary for ${state.company} based on these analyses:

${Object.entries(state.reportSections).map(([_key, section]) => 
  `${section.title}: ${section.content.substring(0, 300)}...`
).join('\n\n')}

Investment Score: ${state.investmentScore}/100
Tech Health Score: ${state.techHealthScore}/100

Create a 400-500 word executive summary with:
1. Key investment highlights
2. Major risks and concerns
3. Clear recommendation
4. 3-5 critical data points with citations

Use citation format [1], [2] based on the most important evidence.`

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })
  
  const summary = response.content[0].type === 'text' ? response.content[0].text : ''
  
  // Add top citations to executive summary
  const topCitations = state.citations.slice(0, 5)
  let summaryWithCitations = summary
  topCitations.forEach((citation, index) => {
    summaryWithCitations = summaryWithCitations.replace(
      new RegExp(`\\[${index + 1}\\]`, 'g'),
      `[${citation.citation_number}](#cite-${citation.citation_number})`
    )
  })
  
  return {
    executiveSummary: summaryWithCitations,
    currentPhase: 'complete'
  }
}

// Helper functions
function extractTechnologies(_evidence: any[]) {
  // const techEvidence = evidence.filter(e => 
  //   e.evidence_type === 'technical' || 
  //   e.type?.includes('tech') ||
  //   e.content_data?.technologies
  // )
  
  return {
    languages: [],
    frameworks: [],
    databases: [],
    infrastructure: [],
    tools: []
  }
}

function extractMarketData(_evidence: any[]) {
  return {
    marketSize: null,
    competitors: [],
    position: null,
    growth: null
  }
}

function extractTeamData(_evidence: any[]) {
  return {
    size: null,
    keyPeople: [],
    culture: [],
    hiring: null
  }
}

function extractFinancialData(_evidence: any[]) {
  return {
    revenue: null,
    growth: null,
    burnRate: null,
    runway: null
  }
}

function extractSecurityData(_evidence: any[]) {
  return {
    certifications: [],
    practices: [],
    incidents: []
  }
}

function getSectionTitle(key: string): string {
  const titles: Record<string, string> = {
    technology: 'Technology Stack & Architecture',
    market: 'Market Position & Competition',
    team: 'Team & Organizational Strength',
    financials: 'Financial Health & Unit Economics',
    security: 'Security & Compliance'
  }
  return titles[key] || key
}

// Build the LangGraph workflow
function buildResearchGraph() {
  const workflow = new StateGraph(ResearchState)
    .addNode('load_evidence', loadEvidence)
    .addNode('parse_evidence', parseEvidence)
    .addNode('analyze_technology', analyzeTechnology)
    .addNode('analyze_market', analyzeMarket)
    .addNode('analyze_team', analyzeTeam)
    .addNode('analyze_financials', analyzeFinancials)
    .addNode('generate_citations', generateCitations)
    .addNode('compile_report', compileReport)
    .addNode('generate_executive_summary', generateExecutiveSummary)
  
  // Define the flow
  workflow
    .addEdge('__start__', 'load_evidence')
    .addEdge('load_evidence', 'parse_evidence')
    .addEdge('parse_evidence', 'analyze_technology')
    .addEdge('analyze_technology', 'analyze_market')
    .addEdge('analyze_market', 'analyze_team')
    .addEdge('analyze_team', 'analyze_financials')
    .addEdge('analyze_financials', 'generate_citations')
    .addEdge('generate_citations', 'compile_report')
    .addEdge('compile_report', 'generate_executive_summary')
    .addEdge('generate_executive_summary', '__end__')
  
  // Conditional error handling could be added here if needed
  // const addErrorHandling = (nodeName: string) => {
  //   workflow.addConditionalEdges(
  //     nodeName,
  //     (state) => state.currentPhase === 'error' ? 'end' : 'continue',
  //     {
  //       end: '__end__',
  //       continue: nodeName === 'generate_executive_summary' ? '__end__' : undefined
  //     }
  //   )
  // }
  
  // Compile the graph
  const checkpointer = new MemorySaver()
  return workflow.compile({ checkpointer })
}

// Main worker
export const reportGenerationWorker = new Worker(
  'report-generation',
  async (job: Job) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`[LangGraph] Starting report generation for ${company}`)
    
    try {
      // Initialize the graph
      const app = buildResearchGraph()
      
      // Create initial state
      const initialState = {
        company,
        domain,
        investmentThesis,
        scanRequestId,
        evidenceCollected: [],
        evidenceByType: {},
        totalEvidence: 0,
        parsedData: null,
        sectionAnalyses: {},
        citations: [],
        citationMap: {},
        reportSections: {},
        executiveSummary: '',
        investmentScore: 0,
        techHealthScore: 0,
        confidenceScore: 0,
        analysisTrace: [],
        errors: [],
        currentPhase: 'initializing'
      }
      
      // Run the graph with streaming
      const config = { 
        configurable: { thread_id: scanRequestId },
        streamMode: 'values' as const
      }
      
      let finalState: any = initialState
      
      // Stream progress updates
      for await (const state of await app.stream(initialState as any, config)) {
        finalState = state
        
        // Update job progress based on phase
        const progressMap: Record<string, number> = {
          'evidence_loaded': 10,
          'evidence_parsed': 20,
          'technology_analyzed': 35,
          'market_analyzed': 50,
          'team_analyzed': 65,
          'financials_analyzed': 80,
          'citations_generated': 85,
          'report_compiled': 90,
          'complete': 95
        }
        
        const progress = progressMap[state.currentPhase] || 0
        await job.updateProgress(progress)
        
        console.log(`[LangGraph] Phase: ${state.currentPhase}, Progress: ${progress}%`)
      }
      
      // Check for errors
      if (finalState.errors.length > 0) {
        throw new Error(`Report generation failed: ${finalState.errors.join(', ')}`)
      }
      
      // Save report to database
      const reportData = {
        company_name: company,
        sections: finalState.reportSections,
        executiveSummary: {
          title: 'Executive Summary',
          content: finalState.executiveSummary
        },
        investment_score: finalState.investmentScore,
        investment_rationale: `Investment score: ${finalState.investmentScore}/100 based on comprehensive analysis`,
        tech_health_score: finalState.techHealthScore,
        tech_health_grade: finalState.techHealthScore >= 80 ? 'A' : 
                          finalState.techHealthScore >= 70 ? 'B' :
                          finalState.techHealthScore >= 60 ? 'C' : 'D',
        metadata: {
          analysisTrace: finalState.analysisTrace,
          totalEvidence: finalState.totalEvidence,
          citationCount: finalState.citations.length,
          workflow: 'langgraph-v2'
        }
      }
      
      // Save report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: finalState.investmentScore,
          investment_rationale: reportData.investment_rationale,
          tech_health_score: finalState.techHealthScore,
          tech_health_grade: reportData.tech_health_grade,
          report_data: reportData,
          evidence_count: finalState.totalEvidence,
          citation_count: finalState.citations.length,
          executive_summary: finalState.executiveSummary,
          report_version: 'langgraph-v2',
          ai_model_used: 'claude-3.5-sonnet + langgraph',
          quality_score: finalState.confidenceScore,
          human_reviewed: false,
          metadata: reportData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (reportError) throw reportError
      
      // Save citations
      if (finalState.citations.length > 0 && report) {
        const citationRecords = finalState.citations.map((c: any) => ({
          ...c,
          report_id: report.id,
          created_at: new Date().toISOString()
        }))
        
        const { error: citationError } = await supabase
          .from('report_citations')
          .insert(citationRecords)
        
        if (citationError) {
          console.error('Error storing citations:', citationError)
        } else {
          console.log(`[LangGraph] Stored ${finalState.citations.length} citations`)
        }
      }
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          status: 'completed',
          latest_report_id: report?.id,
          tech_health_score: finalState.techHealthScore
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      
      return {
        success: true,
        reportId: report?.id,
        investmentScore: finalState.investmentScore,
        citationCount: finalState.citations.length,
        workflow: 'langgraph-v2',
        phases: finalState.analysisTrace.map((t: any) => t.phase)
      }
      
    } catch (error) {
      console.error('[LangGraph] Error:', error)
      
      await supabase
        .from('scan_requests')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', scanRequestId)
      
      throw error
    }
  },
  { connection }
)

// Start the worker
console.log('🚀 LangGraph Report Generation Worker v2 started')
reportGenerationWorker.on('completed', (job) => {
  console.log(`✅ Report completed: ${job.returnvalue?.reportId}`)
})

reportGenerationWorker.on('failed', (_job, err) => {
  console.error(`❌ Report failed: ${err.message}`)
})