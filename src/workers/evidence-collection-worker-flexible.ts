import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'

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

interface FlexibleEvidenceJob {
  scanRequestId: string
  company: string
  domain: string
  [key: string]: any // Accept any additional fields
}

export const flexibleEvidenceWorker = new Worker<FlexibleEvidenceJob>(
  'evidence-collection',
  async (job: Job<FlexibleEvidenceJob>) => {
    const { scanRequestId, company, domain } = job.data
    
    console.log(`[FlexibleEvidence] Starting collection for ${company}`)
    
    try {
      // Collect evidence however you want
      const evidence = await collectEvidence(domain)
      
      // Just store it all in the collection metadata
      const { data: collection, error } = await supabase
        .from('evidence_collections')
        .insert({
          company_name: company,
          company_website: `https://${domain}`,
          status: 'completed',
          collection_type: 'flexible',
          evidence_count: evidence.length,
          metadata: {
            scan_request_id: scanRequestId,
            evidence_items: evidence, // Store everything here
            job_data: job.data,
            collected_at: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log(`✓ Stored ${evidence.length} items in collection ${collection.id}`)
      
      // Later, process with AI
      await queueAIProcessing(collection.id)
      
      return {
        success: true,
        collectionId: collection.id,
        evidenceCount: evidence.length
      }
      
    } catch (error) {
      console.error('Collection failed:', error)
      throw error
    }
  },
  { connection }
)

async function collectEvidence(domain: string): Promise<any[]> {
  // Collect evidence in whatever format makes sense
  const evidence = []
  
  // Example: Just store raw responses
  try {
    const response = await fetch(`https://${domain}`)
    evidence.push({
      type: 'homepage',
      url: `https://${domain}`,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      content: await response.text(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    evidence.push({
      type: 'homepage',
      url: `https://${domain}`,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
  
  // Add whatever other evidence you collect
  // No need to map to specific fields or types
  
  return evidence
}

async function queueAIProcessing(collectionId: string) {
  // Queue a job for Gemini Flash or another LLM to process
  console.log(`Queuing AI processing for collection ${collectionId}`)
  // This could create structured evidence items after AI processing
}

console.log('🚀 Flexible Evidence Collection Worker started')