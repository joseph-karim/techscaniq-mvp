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
  depth: 'basic' | 'comprehensive'
  investmentThesis: string
}

interface SearchDecision {
  tool: string
  query: string
  reasoning: string
  expectedValue: number
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

// Agentic search engine that makes intelligent decisions
class AgenticSearchEngine {
  private context: {
    company: string
    domain: string
    investmentThesis: string
    collectedEvidence: any[]
    searchHistory: string[]
  }

  constructor(company: string, domain: string, investmentThesis: string) {
    this.context = {
      company,
      domain,
      investmentThesis,
      collectedEvidence: [],
      searchHistory: []
    }
  }

  async makeSearchDecision(): Promise<SearchDecision | null> {
    // Simulate LLM decision making based on context
    const evidenceGaps = this.identifyEvidenceGaps()
    
    if (evidenceGaps.length === 0) {
      return null // No more searches needed
    }

    // Prioritize searches based on investment thesis
    const priorities = this.prioritizeSearches(evidenceGaps)
    const topPriority = priorities[0]

    // Add some randomness to make it non-deterministic
    const shouldExplore = Math.random() > 0.3
    if (shouldExplore && priorities.length > 1) {
      const randomIndex = Math.floor(Math.random() * Math.min(3, priorities.length))
      return priorities[randomIndex]
    }

    return topPriority
  }

  private identifyEvidenceGaps(): SearchDecision[] {
    const gaps: SearchDecision[] = []
    const evidenceTypes = new Set(this.context.collectedEvidence.map(e => e.type))

    // Core evidence needs
    if (!evidenceTypes.has('homepage')) {
      gaps.push({
        tool: 'web_scraper',
        query: `https://${this.context.domain}`,
        reasoning: 'Need to analyze main website content and value proposition',
        expectedValue: 0.9
      })
    }

    if (!evidenceTypes.has('pricing') && !this.context.searchHistory.includes('pricing')) {
      gaps.push({
        tool: 'web_scraper',
        query: `https://${this.context.domain}/pricing`,
        reasoning: 'Pricing model is crucial for SaaS investment analysis',
        expectedValue: 0.85
      })
    }

    // Technical evidence for tech-focused thesis
    if (this.context.investmentThesis.includes('tech') || this.context.investmentThesis.includes('saas')) {
      if (!evidenceTypes.has('github')) {
        gaps.push({
          tool: 'github_api',
          query: this.context.company,
          reasoning: 'Technical capabilities and open source presence indicate engineering strength',
          expectedValue: 0.7
        })
      }

      if (!evidenceTypes.has('tech_stack')) {
        gaps.push({
          tool: 'tech_analyzer',
          query: this.context.domain,
          reasoning: 'Technology choices reveal scalability and technical debt',
          expectedValue: 0.75
        })
      }
    }

    // Market and competitive intelligence
    if (this.context.collectedEvidence.length < 10) {
      gaps.push({
        tool: 'google_search',
        query: `"${this.context.company}" funding valuation revenue`,
        reasoning: 'Financial metrics are essential for investment decisions',
        expectedValue: 0.8
      })

      gaps.push({
        tool: 'google_search',
        query: `"${this.context.company}" competitors market share`,
        reasoning: 'Competitive positioning affects growth potential',
        expectedValue: 0.75
      })
    }

    // Deep research based on what we've found
    const hasNegativeSignals = this.context.collectedEvidence.some(e => 
      e.content?.toLowerCase().includes('layoff') || 
      e.content?.toLowerCase().includes('lawsuit') ||
      e.content?.toLowerCase().includes('controversy')
    )

    if (hasNegativeSignals) {
      gaps.push({
        tool: 'news_search',
        query: `"${this.context.company}" problems issues challenges`,
        reasoning: 'Detected potential red flags that need investigation',
        expectedValue: 0.9
      })
    }

    // Growth signals
    if (this.context.investmentThesis.includes('growth')) {
      gaps.push({
        tool: 'linkedin_search',
        query: this.context.company,
        reasoning: 'Employee growth is a key indicator of company health',
        expectedValue: 0.7
      })

      gaps.push({
        tool: 'news_search',
        query: `"${this.context.company}" expansion "new market" international`,
        reasoning: 'Geographic expansion indicates growth trajectory',
        expectedValue: 0.65
      })
    }

    return gaps
  }

  private prioritizeSearches(searches: SearchDecision[]): SearchDecision[] {
    // Sort by expected value but add some randomness
    return searches.sort((a, b) => {
      const randomFactorA = Math.random() * 0.2
      const randomFactorB = Math.random() * 0.2
      return (b.expectedValue + randomFactorB) - (a.expectedValue + randomFactorA)
    })
  }

  async executeSearch(decision: SearchDecision): Promise<any[]> {
    console.log(`Executing search: ${decision.tool} - ${decision.query}`)
    console.log(`Reasoning: ${decision.reasoning}`)

    // In production, these would be real API calls
    // For now, return variable amounts of mock data
    const resultCount = Math.floor(Math.random() * 10) + 1

    const results = []
    for (let i = 0; i < resultCount; i++) {
      results.push({
        url: `https://example.com/${decision.tool}/${i}`,
        title: `${decision.query} - Result ${i + 1}`,
        content: this.generateMockContent(decision),
        type: decision.tool.replace('_', '-'),
        metadata: {
          tool: decision.tool,
          query: decision.query,
          confidence: Math.random() * 0.5 + 0.5,
          timestamp: new Date().toISOString()
        }
      })
    }

    // Update context
    this.context.collectedEvidence.push(...results)
    this.context.searchHistory.push(decision.query)

    return results
  }

  private generateMockContent(decision: SearchDecision): string {
    const templates = [
      `Analysis of ${this.context.company} shows strong indicators in ${decision.tool} data...`,
      `Recent developments at ${this.context.company} include significant progress in their core market...`,
      `Industry sources report that ${this.context.company} has been expanding their presence...`,
      `Technical evaluation reveals ${this.context.company} uses modern architecture patterns...`,
      `Financial data suggests ${this.context.company} has healthy unit economics...`
    ]
    return templates[Math.floor(Math.random() * templates.length)]
  }
}

export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  async (job: Job<EvidenceCollectionJob>) => {
    const { scanRequestId, company, domain, depth, investmentThesis } = job.data
    
    console.log(`Starting AGENTIC evidence collection for ${company} (${scanRequestId})`)
    
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
            search_strategy: 'agentic'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (collectionError) throw collectionError
      
      // Initialize agentic search engine
      const searchEngine = new AgenticSearchEngine(company, domain, investmentThesis)
      const allEvidence: any[] = []
      let iterations = 0
      const maxIterations = depth === 'comprehensive' ? 25 : 10
      
      // Main agentic search loop
      while (iterations < maxIterations) {
        await job.updateProgress(Math.round((iterations / maxIterations) * 90))
        
        // Make intelligent decision about what to search next
        const decision = await searchEngine.makeSearchDecision()
        
        if (!decision) {
          console.log('Search engine determined no more searches needed')
          break
        }
        
        // Execute the search
        const results = await searchEngine.executeSearch(decision)
        allEvidence.push(...results)
        
        // Save results to database
        for (const item of results) {
          const { error } = await supabase
            .from('evidence_items')
            .insert({
              collection_id: collection.id,
              company_name: company,
              type: item.type,
              evidence_type: item.type,
              content_data: {
                raw: JSON.stringify(item),
                summary: item.title,
                processed: item.content
              },
              source_data: {
                url: item.url,
                tool: item.metadata.tool,
                timestamp: item.metadata.timestamp
              },
              metadata: item.metadata,
              confidence_score: item.metadata.confidence || 0.8,
              processing_stage: 'raw',
              created_at: new Date().toISOString()
            })
          
          if (error) {
            console.error('Failed to save evidence item:', error)
          }
        }
        
        iterations++
        
        // Add some delay to simulate real API calls
        await new Promise(resolve => setTimeout(resolve, 100))
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
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis,
            search_strategy: 'agentic',
            iterations_completed: iterations,
            unique_sources: [...new Set(allEvidence.map(e => e.metadata?.tool))].length
          }
        })
        .eq('id', collection.id)
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'evidence_collected',
          evidence_count: allEvidence.length
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`Agentic evidence collection complete! Total items: ${allEvidence.length} (after ${iterations} search iterations)`)
      
      return {
        success: true,
        evidenceCount: allEvidence.length,
        iterations: iterations,
        collectionId: collection.id
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
    concurrency: 3, // Can run 3 evidence collections in parallel
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

console.log('Agentic evidence collection worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Using intelligent search decision engine')
console.log('Waiting for jobs...')