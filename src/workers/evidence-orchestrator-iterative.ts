import { Worker, Job, Queue, QueueEvents } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { StateGraph, Annotation } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import { Anthropic } from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Initialize all tool queues
const crawl4aiQueue = new Queue('crawl4ai-extraction', { connection })
const skyvernQueue = new Queue('skyvern-discovery', { connection })
const playwrightQueue = new Queue('playwright-crawler', { connection })
const webtechQueue = new Queue('webtech-analyzer', { connection })
const securityQueue = new Queue('security-scanner', { connection })
const deepSearchQueue = new Queue('deep-searcher', { connection })

// Enhanced state for iterative orchestration
const IterativeOrchestrationState = Annotation.Root({
  // Core info
  company: Annotation<string>(),
  domain: Annotation<string>(),
  investmentThesis: Annotation<string>(),
  scanRequestId: Annotation<string>(),
  collectionId: Annotation<string>(),
  primaryCriteria: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => 'General technology assessment' }),
  
  // Research questions and focus areas
  researchQuestions: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  currentFocus: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => '' }),
  knowledgeGaps: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  
  // Evidence tracking
  evidenceBySource: Annotation<Record<string, any[]>>({ 
    reducer: (x, y) => y ?? x, 
    default: () => ({
      gemini_grounded: [],
      crawl4ai: [],
      skyvern: [],
      deep_searcher: [],
      technical_analysis: [],
      search_queries: [],
      direct_fetch: []
    }) 
  }),
  allEvidence: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  
  // Tool orchestration
  pendingJobs: Annotation<Map<string, any>>({ reducer: (x, y) => y ?? x, default: () => new Map() }),
  completedTools: Annotation<Set<string>>({ reducer: (x, y) => y ?? x, default: () => new Set() }),
  toolResults: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  
  // Iteration control
  iterationCount: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  maxIterations: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 5 }),
  confidence: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  shouldContinue: Annotation<boolean>({ reducer: (x, y) => y ?? x, default: () => true }),
  
  // Reflection and synthesis
  reflections: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  synthesis: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  
  // Metadata
  currentPhase: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => 'initializing' }),
  errors: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  trace: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
})

// Node: Initialize and decompose research
async function initializeResearch(state: typeof IterativeOrchestrationState.State) {
  console.log('[Iterative] Initializing research and decomposing questions...')
  
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are researching ${state.company} (${state.domain}) for investment thesis: ${state.investmentThesis}.

Decompose this into specific research questions across these categories:
1. Technical Architecture & Product (APIs, infrastructure, scalability)
2. Market Position & Competition
3. Business Model & Growth
4. Team & Culture
5. Customer Evidence & Case Studies

Generate 15-20 specific, actionable research questions that can be answered through web research, technical analysis, and document extraction.

Return as JSON: { questions: [{question: string, category: string, priority: 1-5, tools: string[]}] }`
    }]
  })
  
  const content = response.content.find(c => c.type === 'text')?.text || ''
  const { questions } = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}')
  
  return {
    ...state,
    researchQuestions: questions.map(q => q.question),
    currentPhase: 'gathering_initial',
    trace: [...state.trace, { phase: 'initialization', questions: questions.length }]
  }
}

// Node: Orchestrate tool execution based on current focus
async function orchestrateTools(state: typeof IterativeOrchestrationState.State) {
  const currentQuestions = state.researchQuestions.slice(0, 3) // Focus on top 3 questions
  console.log(`[Iterative] Orchestrating tools for iteration ${state.iterationCount + 1}...`)
  
  const newJobs = new Map(state.pendingJobs)
  const newEvidence = []
  
  // 1. Gemini grounded search for each question
  for (const question of currentQuestions) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash'
      })
      
      const result = await model.generateContent(`Search for: ${state.company} ${question}. 
      Include recent news, data, statistics, and relevant information from web searches.`)
      
      const response = await result.response
      newEvidence.push({
        source: 'gemini_grounded',
        question,
        content: response.text(),
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error(`Gemini error: ${error.message}`)
    }
  }
  
  // 2. Deep Searcher for semantic research (new tool)
  if (!state.completedTools.has('deep_searcher')) {
    const deepSearchJob = await deepSearchQueue.add('search', {
      scanRequestId: state.scanRequestId,
      queries: currentQuestions,
      company: state.company,
      includePrivateData: false
    })
    newJobs.set('deep_searcher', deepSearchJob)
  }
  
  // 3. Crawl4AI for focused extraction based on gaps
  if (state.iterationCount === 0 || state.knowledgeGaps.includes('pricing')) {
    const crawl4aiJob = await crawl4aiQueue.add('extract', {
      scanRequestId: state.scanRequestId,
      company: state.company,
      domain: state.domain,
      depth: 'comprehensive',
      investmentThesis: state.investmentThesis,
      primaryCriteria: state.primaryCriteria || 'General technology assessment'
    })
    newJobs.set('crawl4ai', crawl4aiJob)
  }
  
  // 4. Skyvern for intelligent discovery based on research needs
  if (!state.completedTools.has('skyvern') || state.knowledgeGaps.includes('product_demo')) {
    const skyvernJob = await skyvernQueue.add('discover', {
      scanRequestId: state.scanRequestId,
      targetUrl: `https://${state.domain}`,
      discoveryMode: 'research_driven',
      researchContext: {
        questions: currentQuestions,
        gaps: state.knowledgeGaps,
        previousFindings: state.synthesis
      },
      tasks: [
        'Find product demo or free trial',
        'Access API documentation',
        'Discover customer case studies',
        'Find pricing calculator',
        'Locate technical architecture docs'
      ]
    })
    newJobs.set('skyvern', skyvernJob)
  }
  
  // 5. Technical analysis suite
  if (state.iterationCount === 0) {
    const techJobs = await Promise.all([
      playwrightQueue.add('crawl', {
        scanRequestId: state.scanRequestId,
        url: `https://${state.domain}`,
        researchFocus: currentQuestions
      }),
      webtechQueue.add('analyze', {
        scanRequestId: state.scanRequestId,
        url: `https://${state.domain}`,
        domain: state.domain,
        company: state.company
      }),
      securityQueue.add('scan', {
        scanRequestId: state.scanRequestId,
        url: `https://${state.domain}`,
        domain: state.domain,
        company: state.company
      })
    ])
    techJobs.forEach((job, idx) => newJobs.set(`tech_${idx}`, job))
  }
  
  return {
    ...state,
    pendingJobs: newJobs,
    evidenceBySource: {
      ...state.evidenceBySource,
      gemini_grounded: [...state.evidenceBySource.gemini_grounded, ...newEvidence]
    },
    allEvidence: [...state.allEvidence, ...newEvidence],
    currentPhase: 'collecting_evidence'
  }
}

// Node: Collect results from pending jobs
async function collectResults(state: typeof IterativeOrchestrationState.State) {
  console.log('[Iterative] Collecting results from tools...')
  
  const newEvidence = []
  const completedTools = new Set(state.completedTools)
  const toolResults = { ...state.toolResults }
  
  // Wait for all pending jobs with timeout
  const jobPromises = Array.from(state.pendingJobs.entries()).map(async ([key, job]) => {
    try {
      const queueEvent = getQueueEventsForJob(key)
      const result = await job.waitUntilFinished(queueEvent, 60000)
      
      if (result) {
        completedTools.add(key)
        toolResults[key] = result
        
        // Extract evidence based on tool type
        if (key.startsWith('crawl4ai') && result.evidence_items) {
          newEvidence.push(...result.evidence_items.map(item => ({
            ...item,
            source: 'crawl4ai',
            tool: key
          })))
        } else if (key === 'skyvern' && result.discovered_urls) {
          newEvidence.push({
            source: 'skyvern',
            type: 'discovery_results',
            content: result,
            discoveredCount: result.discovered_urls.length
          })
        } else if (key === 'deep_searcher' && result.results) {
          newEvidence.push(...result.results.map(r => ({
            source: 'deep_searcher',
            ...r
          })))
        } else if (key.startsWith('tech_')) {
          newEvidence.push({
            source: 'technical_analysis',
            tool: key,
            content: result
          })
        }
      }
    } catch (error) {
      console.error(`Job ${key} failed:`, error.message)
    }
  })
  
  await Promise.allSettled(jobPromises)
  
  return {
    ...state,
    completedTools,
    toolResults,
    allEvidence: [...state.allEvidence, ...newEvidence],
    pendingJobs: new Map(), // Clear pending jobs
    currentPhase: 'reflecting'
  }
}

// Node: Reflect on findings and identify gaps
async function reflectAndAnalyze(state: typeof IterativeOrchestrationState.State) {
  console.log('[Iterative] Reflecting on findings and identifying gaps...')
  
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Analyze the research findings for ${state.company}:

Research Questions:
${state.researchQuestions.slice(0, 10).join('\n')}

Evidence Collected (${state.allEvidence.length} items):
- Gemini grounded: ${state.evidenceBySource.gemini_grounded.length}
- Crawl4AI: ${state.allEvidence.filter(e => e.source === 'crawl4ai').length}
- Skyvern: ${state.allEvidence.filter(e => e.source === 'skyvern').length}
- Deep Searcher: ${state.allEvidence.filter(e => e.source === 'deep_searcher').length}
- Technical: ${state.allEvidence.filter(e => e.source === 'technical_analysis').length}

Sample Evidence:
${JSON.stringify(state.allEvidence.slice(-10), null, 2)}

Provide:
1. Key findings for each research question
2. Knowledge gaps that still need to be filled
3. Confidence score (0-100) for investment decision
4. Suggested focus areas for next iteration
5. Synthesis of findings

Return as JSON: {
  findings: {[question: string]: string},
  gaps: string[],
  confidence: number,
  nextFocus: string[],
  synthesis: {summary: string, strengths: string[], concerns: string[], opportunities: string[]}
}`
    }]
  })
  
  const content = response.content.find(c => c.type === 'text')?.text || ''
  const analysis = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}')
  
  const shouldContinue = analysis.confidence < 80 && state.iterationCount < state.maxIterations
  
  return {
    ...state,
    knowledgeGaps: analysis.gaps || [],
    confidence: analysis.confidence || state.confidence,
    synthesis: analysis.synthesis || state.synthesis,
    reflections: [...state.reflections, analysis],
    shouldContinue,
    researchQuestions: analysis.nextFocus || state.researchQuestions,
    currentPhase: shouldContinue ? 'planning_next' : 'finalizing',
    trace: [...state.trace, {
      iteration: state.iterationCount,
      confidence: analysis.confidence,
      gaps: analysis.gaps?.length || 0,
      evidence: state.allEvidence.length
    }]
  }
}

// Node: Store evidence and prepare for report
async function storeEvidence(state: typeof IterativeOrchestrationState.State) {
  console.log('[Iterative] Storing evidence and finalizing collection...')
  
  // Update collection with all evidence
  await supabase
    .from('evidence_collections')
    .update({
      status: 'completed',
      evidence_count: state.allEvidence.length,
      metadata: {
        scan_request_id: state.scanRequestId,
        evidence_raw: state.allEvidence,
        research_questions: state.researchQuestions,
        synthesis: state.synthesis,
        reflections: state.reflections,
        iterations: state.iterationCount,
        confidence: state.confidence,
        trace: state.trace,
        completed_at: new Date().toISOString()
      }
    })
    .eq('id', state.collectionId)
  
  // Queue report generation
  const reportQueue = new Queue('report-generation', { connection })
  await reportQueue.add('generate-comprehensive', {
    scanRequestId: state.scanRequestId,
    collectionId: state.collectionId,
    investmentThesis: state.investmentThesis,
    synthesis: state.synthesis,
    confidence: state.confidence
  })
  
  return {
    ...state,
    currentPhase: 'completed'
  }
}


// Helper function to get queue for job key
function getQueueForJob(key: string): Queue {
  if (key.startsWith('crawl4ai')) return crawl4aiQueue
  if (key === 'skyvern') return skyvernQueue
  if (key === 'deep_searcher') return deepSearchQueue
  if (key === 'tech_0') return playwrightQueue
  if (key === 'tech_1') return webtechQueue
  if (key === 'tech_2') return securityQueue
  return new Queue('unknown', { connection })
}

// Create queue events lazily
let queueEventsCache: Record<string, QueueEvents> | null = null

function getQueueEvents() {
  if (!queueEventsCache) {
    queueEventsCache = {
      crawl4ai: new QueueEvents('crawl4ai-extraction', { connection }),
      skyvern: new QueueEvents('skyvern-discovery', { connection }),
      deepSearcher: new QueueEvents('deep-searcher', { connection }),
      playwright: new QueueEvents('playwright-crawler', { connection }),
      webtech: new QueueEvents('webtech-analyzer', { connection }),
      security: new QueueEvents('security-scanner', { connection })
    }
  }
  return queueEventsCache
}

function getQueueEventsForJob(key: string): QueueEvents {
  const events = getQueueEvents()
  if (key.startsWith('crawl4ai')) return events.crawl4ai
  if (key === 'skyvern') return events.skyvern
  if (key === 'deep_searcher') return events.deepSearcher
  if (key === 'tech_0') return events.playwright
  if (key === 'tech_1') return events.webtech
  if (key === 'tech_2') return events.security
  return events.crawl4ai // default
}

// Build the iterative orchestration graph
const orchestrationGraph = new StateGraph(IterativeOrchestrationState)
  .addNode('initialize', initializeResearch)
  .addNode('orchestrate', orchestrateTools)
  .addNode('collect', collectResults)
  .addNode('reflect', reflectAndAnalyze)
  .addNode('store', storeEvidence)
  .addEdge('__start__', 'initialize')
  .addEdge('initialize', 'orchestrate')
  .addEdge('orchestrate', 'collect')
  .addEdge('collect', 'reflect')
  .addConditionalEdges('reflect', (state) => {
    if (state.shouldContinue) {
      return 'orchestrate'
    }
    return 'store'
  })
  .addEdge('store', '__end__')

const checkpointer = new MemorySaver()
const compiledGraph = orchestrationGraph.compile({ checkpointer })

// Worker implementation
export const iterativeOrchestrator = new Worker(
  'evidence-orchestrator',
  async (job: Job) => {
    // Filter by job name
    if (job.name !== 'iterative-orchestrated') {
      console.log(`[IterativeOrchestrator] Skipping job ${job.name}, not for this worker`)
      return null
    }
    
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`[IterativeOrchestrator] Starting iterative research for ${company}`)
    console.log('Combines comprehensive tool orchestration with LangGraph iteration')
    
    try {
      // Create collection
      const { data: collection } = await supabase
        .from('evidence_collections')
        .insert({
          company_name: company,
          company_website: `https://${domain}`,
          status: 'in_progress',
          collection_type: 'iterative_orchestrated',
          evidence_count: 0,
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis,
            workflow: 'iterative-orchestration',
            started_at: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (!collection) throw new Error('Failed to create collection')
      
      // Run iterative orchestration
      const finalState = await compiledGraph.invoke(
        {
          company,
          domain,
          investmentThesis,
          scanRequestId,
          collectionId: collection.id
        },
        {
          configurable: {
            thread_id: `orchestration_${scanRequestId}`
          }
        }
      )
      
      console.log(`[IterativeOrchestrator] Completed ${finalState.iterationCount} iterations`)
      console.log(`Final confidence: ${finalState.confidence}%`)
      console.log(`Total evidence: ${finalState.allEvidence.length} items`)
      
      return {
        success: true,
        collectionId: collection.id,
        iterations: finalState.iterationCount,
        confidence: finalState.confidence,
        evidenceCount: finalState.allEvidence.length
      }
      
    } catch (error) {
      console.error('[IterativeOrchestrator] Error:', error)
      throw error
    }
  },
  { connection }
)

// Ensure proper cleanup
process.on('SIGTERM', async () => {
  console.log('Shutting down iterative orchestrator...')
  await iterativeOrchestrator.close()
  await connection.quit()
  process.exit(0)
})

console.log('🔄 Iterative Orchestrator started')
console.log('Combines comprehensive tools with intelligent iteration')