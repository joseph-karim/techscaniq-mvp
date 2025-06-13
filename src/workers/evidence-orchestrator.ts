import { Worker, Job, Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { Anthropic } from '@anthropic-ai/sdk'

config()

// Single Redis connection
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

// Technical analysis queues
const skyvernQueue = new Queue('skyvern-discovery', { connection })
const webtechQueue = new Queue('webtech-analyzer', { connection })
const securityQueue = new Queue('security-scanner', { connection })

// Single orchestrator that handles all evidence collection
export const evidenceOrchestrator = new Worker(
  'evidence-orchestrator',
  async (job: Job) => {
    const { scanRequestId, company, domain, investmentThesis, workflow = 'intelligent' } = job.data
    
    console.log(`[Orchestrator] Starting ${workflow} evidence collection for ${company}`)
    
    try {
      // Create a collection to store ALL evidence as JSONB
      const { data: collection, error } = await supabase
        .from('evidence_collections')
        .insert({
          company_name: company,
          company_website: `https://${domain}`,
          status: 'in_progress',
          collection_type: workflow,
          evidence_count: 0,
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis,
            evidence_raw: [], // Store everything here
            workflow,
            started_at: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (error) throw error
      
      if (workflow === 'intelligent') {
        // Use LangGraph for intelligent orchestration
        await runIntelligentOrchestration(job, collection.id)
      } else {
        // Simple collection
        await runSimpleCollection(job, collection.id)
      }
      
      return { success: true, collectionId: collection.id }
      
    } catch (error) {
      console.error('[Orchestrator] Failed:', error)
      throw error
    }
  },
  { connection, concurrency: 2 }
)

async function runIntelligentOrchestration(job: Job, collectionId: string) {
  const { scanRequestId, company, domain, investmentThesis } = job.data
  
  console.log('[Intelligence] Starting LangGraph orchestration')
  
  // Step 1: Ask Claude what to investigate
  const planningResponse = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Analyze ${company} (${domain}) for investment thesis: ${investmentThesis}.
      
      Generate 5-10 specific research questions we need to answer.
      Focus on data we can actually collect (websites, APIs, technical scans).
      
      Return as JSON array of {question, priority, category, tools}.`
    }]
  })
  
  let researchPlan
  try {
    // Extract JSON from response
    const textContent = planningResponse.content.find(c => c.type === 'text')
    const content = textContent?.text || ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    researchPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : []
  } catch (e) {
    // Fallback plan
    researchPlan = [
      { question: "What is the company's core product?", priority: "high", category: "product", tools: ["web_crawl"] },
      { question: "What technologies do they use?", priority: "high", category: "technical", tools: ["webtech", "security"] },
      { question: "Who are their customers?", priority: "high", category: "market", tools: ["web_crawl", "search"] },
      { question: "What's their business model?", priority: "medium", category: "business", tools: ["web_crawl"] },
      { question: "How do they compare to competitors?", priority: "medium", category: "competitive", tools: ["search"] }
    ]
  }
  
  console.log(`[Intelligence] Research plan: ${researchPlan.length} questions`)
  
  // Step 2: Collect evidence for each question
  const allEvidence = []
  
  for (const item of researchPlan) {
    console.log(`[Intelligence] Researching: ${item.question}`)
    
    // Basic web collection
    try {
      const response = await fetch(`https://${domain}`)
      const html = await response.text()
      
      allEvidence.push({
        question: item.question,
        category: item.category,
        source: 'web_crawl',
        url: `https://${domain}`,
        content: html.substring(0, 5000), // First 5k chars
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.log(`[Intelligence] Failed to crawl ${domain}`)
    }
    
    // Queue technical tools if needed
    if (item.tools?.includes('webtech')) {
      await webtechQueue.add('analyze', { scanRequestId, url: `https://${domain}`, domain, company })
    }
    
    if (item.tools?.includes('security')) {
      await securityQueue.add('scan', { scanRequestId, url: `https://${domain}`, domain, company })
    }
    
    if (item.tools?.includes('deep_crawl')) {
      await skyvernQueue.add('discover', {
        scanRequestId,
        targetUrl: `https://${domain}`,
        discoveryMode: 'product_discovery',
        context: { question: item.question }
      })
    }
  }
  
  // Step 3: Reflect on what we found
  const reflectionResponse = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Review this evidence for ${company}:
      
      ${JSON.stringify(allEvidence.slice(0, 5), null, 2)}
      
      What key insights emerge? What gaps remain? What should we investigate next?
      
      Return as JSON with {insights, gaps, next_steps}.`
    }]
  })
  
  let reflection
  try {
    const textContent = reflectionResponse.content.find(c => c.type === 'text')
    const content = textContent?.text || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    reflection = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  } catch (e) {
    reflection = { insights: [], gaps: [], next_steps: [] }
  }
  
  console.log(`[Intelligence] Reflection complete: ${reflection.insights?.length || 0} insights`)
  
  // Step 4: Store everything in collection metadata
  await supabase
    .from('evidence_collections')
    .update({
      status: 'completed',
      evidence_count: allEvidence.length,
      metadata: {
        scan_request_id: scanRequestId,
        evidence_raw: allEvidence,
        research_plan: researchPlan,
        reflection,
        completed_at: new Date().toISOString()
      }
    })
    .eq('id', collectionId)
  
  console.log(`[Intelligence] Stored ${allEvidence.length} evidence items in collection`)
  
  // Step 5: Queue report generation
  const reportQueue = new Queue('report-generation', { connection })
  await reportQueue.add('generate-with-citations', {
    scanRequestId,
    company,
    domain,
    investmentThesis,
    collectionId,
    evidence: allEvidence,
    reflection
  })
}

async function runSimpleCollection(job: Job, collectionId: string) {
  const { scanRequestId, company, domain } = job.data
  
  console.log('[Simple] Running basic evidence collection')
  
  const evidence = []
  
  // Collect whatever we can
  try {
    const response = await fetch(`https://${domain}`)
    evidence.push({
      type: 'homepage',
      url: `https://${domain}`,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      content: await response.text(),
      collected_at: new Date().toISOString()
    })
  } catch (error) {
    evidence.push({
      type: 'homepage',
      url: `https://${domain}`,
      error: error instanceof Error ? error.message : String(error),
      collected_at: new Date().toISOString()
    })
  }
  
  // Queue technical analysis
  await Promise.all([
    webtechQueue.add('analyze', { scanRequestId, url: `https://${domain}`, domain, company }),
    securityQueue.add('scan', { scanRequestId, url: `https://${domain}`, domain, company })
  ])
  
  // Store in collection
  await supabase
    .from('evidence_collections')
    .update({
      status: 'completed',
      evidence_count: evidence.length,
      metadata: {
        scan_request_id: scanRequestId,
        evidence_raw: evidence,
        completed_at: new Date().toISOString()
      }
    })
    .eq('id', collectionId)
}

// Start the orchestrator
console.log('🚀 Evidence Orchestrator started')
console.log('This handles intelligent evidence collection without schema bottlenecks')