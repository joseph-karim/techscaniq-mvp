import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import * as cheerio from 'cheerio'

// Load environment variables
config()

interface EvidenceCollectionJob {
  scanRequestId: string
  company: string
  domain: string
  depth: 'basic' | 'comprehensive' | 'exhaustive'
  investmentThesis: string
  primaryCriteria: string
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

// Investment thesis criteria
const INVESTMENT_THESIS_CRITERIA: any = {
  'accelerate-organic-growth': {
    name: 'Accelerate Organic Growth',
    criteria: [
      { name: 'Cloud Architecture Scalability', weight: 30 },
      { name: 'Development Velocity & Pipeline', weight: 25 },
      { name: 'Market Expansion Readiness', weight: 25 },
      { name: 'Code Quality & Technical Debt', weight: 20 }
    ],
    focusAreas: ['cloud-native', 'scalable-architecture', 'devops-maturity', 'test-coverage', 'microservices']
  }
}

// Simple crawler using fetch and cheerio
async function crawlWebsite(domain: string, maxPages: number = 50): Promise<any[]> {
  const results: any[] = []
  const visitedUrls = new Set<string>()
  const urlQueue = [`https://${domain}`]
  
  while (urlQueue.length > 0 && results.length < maxPages) {
    const url = urlQueue.shift()!
    if (visitedUrls.has(url)) continue
    visitedUrls.add(url)
    
    console.log(`Crawling: ${url}`)
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TechScanIQ/2.0 (Investment Analysis Bot)'
        }
      })
      
      if (!response.ok) continue
      
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Extract basic info
      const title = $('title').text()
      const description = $('meta[name="description"]').attr('content') || ''
      
      // Extract text content
      const textContent = $('body').text().replace(/\s+/g, ' ').trim()
      
      // Extract technologies from content
      const technologies: string[] = []
      if (/react/i.test(html)) technologies.push('React')
      if (/angular/i.test(html)) technologies.push('Angular')
      if (/vue\.js/i.test(html)) technologies.push('Vue.js')
      if (/node\.js/i.test(html)) technologies.push('Node.js')
      if (/kubernetes/i.test(html)) technologies.push('Kubernetes')
      if (/docker/i.test(html)) technologies.push('Docker')
      if (/aws|amazon web services/i.test(html)) technologies.push('AWS')
      if (/google cloud|gcp/i.test(html)) technologies.push('Google Cloud')
      if (/azure/i.test(html)) technologies.push('Azure')
      
      results.push({
        url,
        title,
        description,
        content: textContent.slice(0, 5000),
        technologies,
        html: html.slice(0, 50000) // Store first 50KB
      })
      
      // Add links to queue
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href')
        if (href && href.startsWith('/') && urlQueue.length < maxPages * 2) {
          const newUrl = `https://${domain}${href}`
          if (!visitedUrls.has(newUrl)) {
            urlQueue.push(newUrl)
          }
        }
      })
      
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error)
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return results
}

// Categorize URL for evidence type
function categorizeUrl(url: string): string {
  const path = url.toLowerCase()
  
  if (/\/(about|company|team|leadership)/i.test(path)) return 'company_overview'
  if (/\/(product|service|solution|feature)/i.test(path)) return 'product_information'
  if (/\/(tech|engineering|architecture)/i.test(path)) return 'technical_architecture'
  if (/\/(api|docs|documentation|developers)/i.test(path)) return 'api_documentation'
  if (/\/(pricing|plans)/i.test(path)) return 'pricing_model'
  if (/\/(security|privacy|compliance)/i.test(path)) return 'security_compliance'
  if (/\/(careers|jobs|hiring)/i.test(path)) return 'team_culture'
  
  return 'general_information'
}

// Main worker
export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  async (job: Job<EvidenceCollectionJob>) => {
    const { scanRequestId, company, domain, depth, investmentThesis, primaryCriteria } = job.data
    
    console.log(`Starting evidence collection for ${company} (${scanRequestId})`)
    console.log(`Depth: ${depth}, Domain: ${domain}, Thesis: ${investmentThesis}`)
    
    try {
      // Update scan request status
      await supabase
        .from('scan_requests')
        .update({
          status: 'processing',
          ai_workflow_status: 'collecting_evidence'
        })
        .eq('id', scanRequestId)
      
      // Create evidence collection record
      const { data: collection, error: collectionError } = await supabase
        .from('evidence_collections')
        .insert({
          company_name: company,
          company_website: `https://${domain}`,
          collection_status: 'in_progress',
          status: 'in_progress',
          collection_type: depth,
          evidence_count: 0,
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis,
            primary_criteria: primaryCriteria,
            worker: 'simple-deep-collection'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (collectionError) throw collectionError
      
      await job.updateProgress(10)
      
      // Crawl website
      console.log('Starting website crawl...')
      const maxPages = depth === 'exhaustive' ? 100 : depth === 'comprehensive' ? 50 : 20
      const crawlResults = await crawlWebsite(domain, maxPages)
      
      console.log(`Crawled ${crawlResults.length} pages`)
      await job.updateProgress(50)
      
      // Store evidence
      const evidence = []
      for (const [index, result] of crawlResults.entries()) {
        const evidenceType = categorizeUrl(result.url)
        
        const evidenceItem = {
          evidence_id: crypto.randomUUID(),
          collection_id: collection.id,
          company_name: company,
          type: evidenceType,
          evidence_type: evidenceType,
          content_data: {
            raw: result.content,
            summary: result.title,
            processed: result.description
          },
          source_data: {
            url: result.url,
            tool: 'web_crawler',
            timestamp: new Date().toISOString()
          },
          metadata: {
            technologies: result.technologies,
            page_index: index
          },
          confidence_score: 0.8,
          processing_stage: 'collected',
          created_at: new Date().toISOString()
        }
        
        const { error } = await supabase
          .from('evidence_items')
          .insert(evidenceItem)
        
        if (!error) {
          evidence.push(evidenceItem)
        }
        
        // Store HTML snapshot for important pages
        if (evidenceType === 'api_documentation' || evidenceType === 'technical_architecture') {
          await supabase
            .from('evidence_items')
            .insert({
              evidence_id: crypto.randomUUID(),
              collection_id: collection.id,
              company_name: company,
              type: 'html_snapshot',
              evidence_type: 'html_snapshot',
              content_data: {
                raw: result.html,
                summary: `HTML snapshot of ${result.title}`,
                processed: result.url
              },
              source_data: {
                url: result.url,
                tool: 'html_archiver',
                timestamp: new Date().toISOString()
              },
              metadata: { original_type: evidenceType },
              confidence_score: 0.9,
              processing_stage: 'archived',
              created_at: new Date().toISOString()
            })
        }
        
        await job.updateProgress(50 + (index / crawlResults.length) * 40)
      }
      
      // Technology summary
      const allTechnologies = new Set<string>()
      crawlResults.forEach(r => r.technologies.forEach((t: string) => allTechnologies.add(t)))
      
      if (allTechnologies.size > 0) {
        await supabase.from('evidence_items').insert({
          evidence_id: crypto.randomUUID(),
          collection_id: collection.id,
          company_name: company,
          type: 'technology_stack_comprehensive',
          evidence_type: 'technology_stack_comprehensive',
          content_data: {
            raw: JSON.stringify(Array.from(allTechnologies)),
            summary: 'Comprehensive Technology Stack Analysis',
            processed: `Technologies found: ${Array.from(allTechnologies).join(', ')}`
          },
          source_data: {
            url: `https://${domain}`,
            tool: 'tech_analysis',
            timestamp: new Date().toISOString()
          },
          metadata: {
            count: allTechnologies.size,
            technologies: Array.from(allTechnologies)
          },
          confidence_score: 0.9,
          processing_stage: 'analyzed',
          created_at: new Date().toISOString()
        })
      }
      
      // Update collection status
      await supabase
        .from('evidence_collections')
        .update({
          status: 'completed',
          collection_status: 'completed',
          evidence_count: evidence.length,
          updated_at: new Date().toISOString(),
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis,
            pages_crawled: crawlResults.length,
            technologies_found: Array.from(allTechnologies)
          }
        })
        .eq('id', collection.id)
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'evidence_collected',
          evidence_count: evidence.length
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`Evidence collection complete! Collected ${evidence.length} items`)
      
      return {
        success: true,
        evidenceCount: evidence.length,
        pagesCrawled: crawlResults.length,
        collectionId: collection.id
      }
      
    } catch (error) {
      console.error('Evidence collection failed:', error)
      
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
    concurrency: 2,
  }
)

// Error handling
evidenceCollectionWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err)
})

evidenceCollectionWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await evidenceCollectionWorker.close()
  process.exit(0)
})

console.log('🚀 Simple Deep Evidence Collection Worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Waiting for jobs...')