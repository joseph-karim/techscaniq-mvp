import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'

// Load environment variables
config()

interface EvidenceCollectionJob {
  scanRequestId: string
  company: string
  domain: string
  investmentThesis: string
  depth: string
}

interface EvidenceItem {
  url: string
  title: string
  content: string
  type: string
  metadata: any
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

// Simulated evidence collection functions for now
// In production, these would call real APIs
async function collectBasicEvidence(domain: string): Promise<EvidenceItem[]> {
  console.log(`Collecting basic evidence for ${domain}...`)
  
  return [
    {
      url: `https://${domain}`,
      title: 'Homepage',
      content: 'Product analytics platform homepage content...',
      type: 'webpage',
      metadata: { source: 'basic-crawler' }
    },
    {
      url: `https://${domain}/about`,
      title: 'About Page',
      content: 'Company history and mission...',
      type: 'webpage',
      metadata: { source: 'basic-crawler' }
    },
    {
      url: `https://${domain}/pricing`,
      title: 'Pricing Page',
      content: 'Pricing tiers and features...',
      type: 'webpage',
      metadata: { source: 'basic-crawler' }
    }
  ]
}

async function collectDeepEvidence(_domain: string, company: string): Promise<EvidenceItem[]> {
  console.log(`Collecting deep evidence for ${company}...`)
  
  // Simulate API calls to various sources
  return [
    {
      url: `https://news.ycombinator.com/search?query=${company}`,
      title: 'Hacker News Discussions',
      content: 'Technical community discussions about the company...',
      type: 'discussion',
      metadata: { source: 'hn-search', sentiment: 'positive' }
    },
    {
      url: `https://www.linkedin.com/company/${company.toLowerCase()}`,
      title: 'LinkedIn Company Page',
      content: 'Employee count, growth metrics, company updates...',
      type: 'social',
      metadata: { source: 'linkedin', employees: '500-1000' }
    },
    {
      url: `https://github.com/${company.toLowerCase()}`,
      title: 'GitHub Organization',
      content: 'Open source projects, developer activity...',
      type: 'technical',
      metadata: { source: 'github', repos: 42, stars: 5000 }
    }
  ]
}

async function collectComprehensiveEvidence(_domain: string, company: string): Promise<EvidenceItem[]> {
  console.log(`Collecting comprehensive evidence for ${company}...`)
  
  // In production, this would use sophisticated crawling
  const items: EvidenceItem[] = []
  
  // Simulate collecting 200+ pieces of evidence
  const sources = [
    'techcrunch', 'venturebeat', 'forbes', 'businessinsider',
    'producthunt', 'angellist', 'crunchbase', 'pitchbook',
    'glassdoor', 'indeed', 'g2crowd', 'capterra',
    'twitter', 'reddit', 'stackoverflow', 'medium'
  ]
  
  for (const source of sources) {
    // Simulate multiple items per source
    for (let i = 0; i < 10; i++) {
      items.push({
        url: `https://${source}.com/search/${company}/${i}`,
        title: `${company} on ${source} - Item ${i + 1}`,
        content: `Detailed content about ${company} from ${source}...`,
        type: source.includes('tech') ? 'news' : 'social',
        metadata: {
          source,
          relevance: Math.random(),
          timestamp: new Date().toISOString()
        }
      })
    }
  }
  
  return items
}

export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  async (job: Job<EvidenceCollectionJob>) => {
    const { scanRequestId, company, domain, depth, investmentThesis } = job.data
    
    console.log(`Starting evidence collection for ${company} (${scanRequestId})`)
    
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
          collection_type: 'comprehensive',
          evidence_count: 0,
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (collectionError) throw collectionError
      
      const allEvidence: EvidenceItem[] = []
      
      // Phase 1: Basic Collection (5-10 minutes)
      console.log('Phase 1: Basic evidence collection...')
      await job.updateProgress(10)
      const basicEvidence = await collectBasicEvidence(domain)
      allEvidence.push(...basicEvidence)
      
      // Save basic evidence
      for (const item of basicEvidence) {
        const { error } = await supabase
          .from('evidence_items')
          .insert({
            collection_id: collection.id,
            company_name: company,
            type: item.type,
            evidence_type: item.type,
            content_data: {
              raw: JSON.stringify({ url: item.url, content: item.content }),
              summary: item.title,
              processed: item.content
            },
            source_data: {
              url: item.url,
              tool: 'queue-based-collector',
              timestamp: new Date().toISOString()
            },
            metadata: item.metadata,
            confidence_score: 0.8,
            processing_stage: 'raw',
            created_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Failed to save evidence item:', error)
          throw error
        }
      }
      
      await job.updateProgress(30)
      console.log(`Collected ${basicEvidence.length} basic evidence items`)
      
      // Phase 2: Deep Collection (10-15 minutes)
      console.log('Phase 2: Deep evidence collection...')
      const deepEvidence = await collectDeepEvidence(domain, company)
      allEvidence.push(...deepEvidence)
      
      // Save deep evidence
      for (const item of deepEvidence) {
        const { error } = await supabase
          .from('evidence_items')
          .insert({
            collection_id: collection.id,
            company_name: company,
            type: item.type,
            evidence_type: item.type,
            content_data: {
              raw: JSON.stringify({ url: item.url, content: item.content }),
              summary: item.title,
              processed: item.content
            },
            source_data: {
              url: item.url,
              tool: 'queue-based-collector',
              timestamp: new Date().toISOString()
            },
            metadata: item.metadata,
            confidence_score: 0.8,
            processing_stage: 'raw',
            created_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Failed to save deep evidence item:', error)
          throw error
        }
      }
      
      await job.updateProgress(60)
      console.log(`Collected ${deepEvidence.length} deep evidence items`)
      
      // Phase 3: Comprehensive Collection (10+ minutes)
      if (depth === 'comprehensive') {
        console.log('Phase 3: Comprehensive evidence collection...')
        const comprehensiveEvidence = await collectComprehensiveEvidence(domain, company)
        allEvidence.push(...comprehensiveEvidence)
        
        // Save comprehensive evidence in batches
        const batchSize = 50
        for (let i = 0; i < comprehensiveEvidence.length; i += batchSize) {
          const batch = comprehensiveEvidence.slice(i, i + batchSize)
          
          const { error } = await supabase
            .from('evidence_items')
            .insert(
              batch.map(item => ({
                collection_id: collection.id,
                scan_request_id: scanRequestId,
                company_name: company,
                type: item.type,
                evidence_type: item.type,
                content_data: {
                  raw: JSON.stringify({ url: item.url, content: item.content }),
                  summary: item.title,
                  processed: item.content
                },
                source_data: {
                  url: item.url,
                  tool: 'queue-based-collector',
                  timestamp: new Date().toISOString()
                },
                metadata: item.metadata,
                confidence_score: 0.8,
                processing_stage: 'raw',
                created_at: new Date().toISOString()
              }))
            )
          
          if (error) {
            console.error('Failed to save comprehensive evidence batch:', error)
            throw error
          }
          
          const progress = 60 + (i / comprehensiveEvidence.length) * 35
          await job.updateProgress(Math.round(progress))
        }
        
        console.log(`Collected ${comprehensiveEvidence.length} comprehensive evidence items`)
      }
      
      // Update collection status
      await supabase
        .from('evidence_collections')
        .update({
          status: 'completed',
          collection_status: 'completed',
          evidence_count: allEvidence.length,
          updated_at: new Date().toISOString(),
          metadata: {
            phases_completed: depth === 'comprehensive' ? 3 : 2,
            sources_used: [...new Set(allEvidence.map(e => e.metadata?.source).filter(Boolean))],
            duration: Date.now() - new Date(collection.created_at).getTime()
          }
        })
        .eq('id', collection.id)
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'evidence_collected'
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`Evidence collection complete! Total items: ${allEvidence.length}`)
      
      return {
        success: true,
        collectionId: collection.id,
        itemCount: allEvidence.length,
        scanRequestId
      }
      
    } catch (error) {
      console.error('Evidence collection failed:', error)
      
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
    concurrency: 2, // Process 2 evidence collections at a time
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

console.log('Evidence collection worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Waiting for jobs...')