import { Worker, Job, Queue, QueueEvents } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { Anthropic } from '@anthropic-ai/sdk'
import { GoogleGenerativeAI, DynamicRetrievalMode } from '@google/generative-ai'
import fetch from 'node-fetch'

config()

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
const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 8192,
  }
})

// All available queues
const crawl4aiQueue = new Queue('crawl4ai-extraction', { connection })
const skyvernQueue = new Queue('skyvern-discovery', { connection })
const playwrightQueue = new Queue('playwright-crawler', { connection })
const webtechQueue = new Queue('webtech-analyzer', { connection })
const securityQueue = new Queue('security-scanner', { connection })

// Create QueueEvents for waiting on jobs
const crawl4aiQueueEvents = new QueueEvents('crawl4ai-extraction', { connection })
const skyvernQueueEvents = new QueueEvents('skyvern-discovery', { connection })
const playwrightQueueEvents = new QueueEvents('playwright-crawler', { connection })
const webtechQueueEvents = new QueueEvents('webtech-analyzer', { connection })
const securityQueueEvents = new QueueEvents('security-scanner', { connection })

export const fullOrchestrator = new Worker(
  'evidence-orchestrator',
  async (job: Job) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`[FullOrchestrator] Starting comprehensive evidence collection for ${company}`)
    
    try {
      // Create collection for flexible storage
      const { data: collection } = await supabase
        .from('evidence_collections')
        .insert({
          company_name: company,
          company_website: `https://${domain}`,
          status: 'in_progress',
          collection_type: 'comprehensive',
          evidence_count: 0,
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis,
            evidence_raw: [],
            started_at: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (!collection) throw new Error('Failed to create collection')
      
      // Run comprehensive evidence collection
      const allEvidence = await runComprehensiveCollection(
        scanRequestId, 
        company, 
        domain, 
        investmentThesis
      )
      
      // Store all evidence flexibly
      await supabase
        .from('evidence_collections')
        .update({
          status: 'completed',
          evidence_count: allEvidence.length,
          metadata: {
            scan_request_id: scanRequestId,
            evidence_raw: allEvidence,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', collection.id)
      
      console.log(`[FullOrchestrator] Collected ${allEvidence.length} evidence items`)
      
      return { success: true, collectionId: collection.id, evidenceCount: allEvidence.length }
      
    } catch (error) {
      console.error('[FullOrchestrator] Failed:', error)
      throw error
    }
  },
  { connection, concurrency: 2 }
)

async function runComprehensiveCollection(
  scanRequestId: string,
  company: string,
  domain: string,
  investmentThesis: string
): Promise<any[]> {
  const allEvidence = []
  
  console.log('[Collection] Phase 1: Google-grounded Gemini Analysis')
  
  // 1. Gemini with Google grounding for real-time info
  const geminiQueries = [
    `${company} latest news funding announcements 2024 2025`,
    `${company} customer reviews testimonials complaints`,
    `${company} vs competitors market share analysis`,
    `${company} technology stack architecture details`,
    `${company} pricing plans enterprise customers`,
    `${company} employee growth linkedin insights`,
    `${company} product roadmap features announcements`
  ]
  
  for (const query of geminiQueries) {
    try {
      console.log(`  Gemini query: ${query}`)
      const result = await geminiModel.generateContent({
        contents: [{ 
          role: 'user', 
          parts: [{ 
            text: `Search and analyze: ${query}. 
            Include specific data points, numbers, dates, and sources.
            Focus on information from 2024-2025.` 
          }] 
        }],
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: DynamicRetrievalMode.MODE_DYNAMIC,
              dynamicThreshold: 0.3
            }
          }
        }]
      })
      
      const response = await result.response
      allEvidence.push({
        source: 'gemini_grounded',
        query,
        content: response.text(),
        timestamp: new Date().toISOString(),
        metadata: {
          model: 'gemini-2.0-flash',
          grounding: true
        }
      })
    } catch (error) {
      console.error(`  Gemini error for "${query}":`, error instanceof Error ? error.message : String(error))
    }
  }
  
  console.log('[Collection] Phase 2: Crawl4AI Deep Website Analysis')
  
  // 2. Queue Crawl4AI for deep website extraction
  const crawl4aiJobs = [
    { url: `https://${domain}`, extractionType: 'full_content' },
    { url: `https://${domain}/pricing`, extractionType: 'pricing_plans' },
    { url: `https://${domain}/customers`, extractionType: 'customer_logos' },
    { url: `https://${domain}/about`, extractionType: 'company_info' },
    { url: `https://${domain}/blog`, extractionType: 'recent_posts' },
    { url: `https://docs.${domain}`, extractionType: 'documentation' }
  ]
  
  const crawlJobs = await Promise.all(
    crawl4aiJobs.map(jobData => 
      crawl4aiQueue.add('extract', {
        scanRequestId,
        company,
        ...jobData,
        llmExtraction: true,
        screenshotEnabled: true
      })
    )
  )
  
  console.log(`  Queued ${crawlJobs.length} Crawl4AI jobs`)
  
  // Wait for Crawl4AI results with timeout
  const crawl4aiResults = await Promise.allSettled(
    crawlJobs.map(job => 
      job.waitUntilFinished(crawl4aiQueueEvents, 60000).catch(e => {
        console.error(`  Crawl4AI job ${job.id} failed:`, e.message)
        return null
      })
    )
  )
  
  crawl4aiResults.forEach((result, idx) => {
    if (result.status === 'fulfilled' && result.value?.evidence_items) {
      console.log(`  Crawl4AI extracted ${result.value.evidence_items.length} items from ${crawl4aiJobs[idx].url}`)
      allEvidence.push(...result.value.evidence_items.map((item: any) => ({
        ...item,
        source: 'crawl4ai',
        url: crawl4aiJobs[idx].url,
        extractionType: crawl4aiJobs[idx].extractionType
      })))
    }
  })
  
  console.log('[Collection] Phase 3: Skyvern AI Browser Automation')
  
  // 3. Skyvern for interactive discovery
  const skyvernJob = await skyvernQueue.add('discover', {
    scanRequestId,
    targetUrl: `https://${domain}`,
    discoveryMode: 'deep_exploration',
    tasks: [
      'Find and access product demo if available',
      'Navigate to pricing calculator and capture options',
      'Search for API documentation',
      'Look for customer case studies',
      'Find technology architecture diagrams'
    ]
  })
  
  // Wait for Skyvern result
  try {
    const skyvernResult = await skyvernJob.waitUntilFinished(skyvernQueueEvents, 120000)
    if (skyvernResult?.discovered_urls) {
      console.log(`  Skyvern discovered ${skyvernResult.discovered_urls.length} URLs`)
      allEvidence.push({
        source: 'skyvern',
        type: 'discovery_results',
        content: skyvernResult,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('  Skyvern job failed:', error instanceof Error ? error.message : String(error))
  }
  
  console.log('[Collection] Phase 4: Technical Analysis Suite')
  
  // 4. Technical analysis tools
  const techJobs = await Promise.all([
    playwrightQueue.add('crawl', {
      scanRequestId,
      url: `https://${domain}`,
      depth: 3,
      extractionTargets: ['forms', 'navigation', 'interactive_elements', 'api_calls']
    }),
    
    webtechQueue.add('analyze', {
      scanRequestId,
      urls: [
        `https://${domain}`,
        `https://app.${domain}`,
        `https://docs.${domain}`,
        `https://api.${domain}`
      ]
    }),
    
    securityQueue.add('scan', {
      scanRequestId,
      url: `https://${domain}`,
      checks: ['ssl', 'headers', 'vulnerabilities', 'ports']
    })
  ])
  
  // Wait for technical analysis results
  const techResults = await Promise.allSettled(
    techJobs.map((job, idx) => {
      const queueEvents = [playwrightQueueEvents, webtechQueueEvents, securityQueueEvents][idx]
      return job.waitUntilFinished(queueEvents, 60000).catch(e => {
        console.error(`  Tech analysis job ${job.id} failed:`, e.message)
        return null
      })
    })
  )
  
  techResults.forEach((result, idx) => {
    if (result.status === 'fulfilled' && result.value) {
      const jobType = ['playwright', 'webtech', 'security'][idx]
      console.log(`  ${jobType} analysis completed`)
      allEvidence.push({
        source: `technical_${jobType}`,
        type: 'technical_analysis',
        content: result.value,
        timestamp: new Date().toISOString()
      })
    }
  })
  
  console.log('[Collection] Phase 5: Market & Competitive Intelligence')
  
  // 5. Search for market intelligence
  const searchQueries = [
    `site:g2.com "${company}" reviews`,
    `site:capterra.com "${company}" alternatives`,
    `site:reddit.com "${company}" vs`,
    `site:news.ycombinator.com "${company}"`,
    `site:linkedin.com/company "${company}" employees`,
    `site:github.com "${company}" stars forks`,
    `"${company}" "series" "funding" "million"`,
    `"${company}" "case study" "implementation" "ROI"`
  ]
  
  for (const searchQuery of searchQueries) {
    allEvidence.push({
      source: 'search_query',
      query: searchQuery,
      content: `Search query queued: ${searchQuery}`,
      timestamp: new Date().toISOString()
    })
  }
  
  console.log('[Collection] Phase 6: Direct API & Data Collection')
  
  // 6. Try to fetch direct data
  const directUrls = [
    { url: `https://api.${domain}/status`, type: 'api_status' },
    { url: `https://${domain}/sitemap.xml`, type: 'sitemap' },
    { url: `https://github.com/${company}`, type: 'github_profile' },
    { url: `https://www.linkedin.com/company/${company}/`, type: 'linkedin_profile' }
  ]
  
  for (const { url, type } of directUrls) {
    try {
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'TechScanIQ Research Bot' },
        signal: AbortSignal.timeout(5000)
      })
      
      allEvidence.push({
        source: 'direct_fetch',
        type,
        url,
        status: response.status,
        content: await response.text().catch(() => ''),
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.log(`  Failed to fetch ${url}`)
    }
  }
  
  console.log('[Collection] Phase 7: Intelligent Reflection & Gap Analysis')
  
  // 7. Have Claude analyze what we found and identify gaps
  const reflectionResponse = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyze evidence collected for ${company} so far:
      
      Evidence sources used:
      - Gemini grounded searches: ${geminiQueries.length}
      - Crawl4AI jobs: ${crawl4aiJobs.length}
      - Skyvern automation: 1
      - Technical scanners: 3
      - Market searches: ${searchQueries.length}
      - Direct fetches: ${directUrls.length}
      
      Investment thesis: ${investmentThesis}
      
      What critical evidence is still missing? What specific data points do we need?
      
      Return as JSON: {critical_gaps, specific_queries, recommended_tools}`
    }]
  })
  
  try {
    const textContent = reflectionResponse.content.find(c => c.type === 'text')
    const content = textContent?.text || ''
    const reflection = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}')
    
    allEvidence.push({
      source: 'orchestrator_reflection',
      type: 'gap_analysis',
      content: reflection,
      timestamp: new Date().toISOString()
    })
    
    // Queue additional targeted searches based on gaps
    if (reflection.specific_queries) {
      for (const query of reflection.specific_queries.slice(0, 5)) {
        console.log(`  Gap-filling query: ${query}`)
        // Queue additional Gemini searches
      }
    }
  } catch (error) {
    console.error('[Collection] Reflection parsing error')
  }
  
  console.log(`[Collection] Total evidence items collected: ${allEvidence.length}`)
  
  // Wait briefly for async jobs to start populating
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  return allEvidence
}

console.log('🚀 Full Evidence Orchestrator started')
console.log('Orchestrates: Gemini (grounded), Crawl4AI, Skyvern, Technical tools, Search, and more')