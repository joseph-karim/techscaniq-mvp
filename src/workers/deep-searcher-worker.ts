import { Worker, Job, Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { Anthropic } from '@anthropic-ai/sdk'

// Load environment variables
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

interface DeepSearchJob {
  scanRequestId: string
  queries: string[]
  company: string
  includePrivateData: boolean
}

export const deepSearcherWorker = new Worker(
  'deep-searcher',
  async (job: Job<DeepSearchJob>) => {
    const { scanRequestId, queries, company } = job.data
    
    console.log(`[DeepSearcher] Processing ${queries.length} queries for ${company}`)
    
    try {
      const results = []
      
      // For now, use Claude to simulate deep search results
      // In production, this would integrate with Zilliz deep-searcher
      for (const query of queries) {
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `Perform a deep search analysis for: "${query}"
            
            Company context: ${company}
            
            Provide comprehensive insights including:
            - Key facts and data points
            - Technical details if relevant
            - Market insights
            - Competitive landscape
            - Recent developments
            
            Format as structured data with sources.`
          }]
        })
        
        const content = response.content.find(c => c.type === 'text')?.text || ''
        
        results.push({
          query,
          content,
          type: 'deep_search',
          confidence: 0.85,
          timestamp: new Date().toISOString(),
          metadata: {
            model: 'claude-opus-4-20250514',
            search_depth: 'comprehensive'
          }
        })
      }
      
      console.log(`[DeepSearcher] Found ${results.length} results`)
      
      return {
        success: true,
        scanRequestId,
        results,
        totalResults: results.length
      }
      
    } catch (error) {
      console.error('[DeepSearcher] Error:', error)
      throw error
    }
  },
  { connection, concurrency: 2 }
)

// Ensure proper cleanup
process.on('SIGTERM', async () => {
  console.log('Shutting down deep searcher worker...')
  await deepSearcherWorker.close()
  await connection.quit()
  process.exit(0)
})

console.log('🔍 Deep Searcher Worker started')
console.log('Provides intelligent deep search capabilities')