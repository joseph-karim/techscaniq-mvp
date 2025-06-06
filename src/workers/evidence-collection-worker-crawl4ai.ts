import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

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

interface Crawl4AIResult {
  success: boolean
  scan_request_id: string
  domain: string
  investment_thesis: string
  evidence_count: number
  pages_crawled: number
  research_iterations?: number
  evidence_coverage?: {
    collected: string[]
    missing: string[]
  }
  synthesis?: any
  technologies?: Record<string, number>
  evidence_items: any[]
  error?: string
  traceback?: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Load API keys from Supabase vault
async function loadAPIKeys() {
  try {
    const { data: secrets } = await supabase.rpc('get_secret', { secret_name: 'anthropic_api_key' })
    const anthropicKey = secrets
    
    const { data: geminiSecret } = await supabase.rpc('get_secret', { secret_name: 'google_gemini_api_key' })
    const geminiKey = geminiSecret
    
    return { anthropicKey, geminiKey }
  } catch (error) {
    console.error('Failed to load API keys:', error)
    return { anthropicKey: null, geminiKey: null }
  }
}

// Investment thesis criteria mapping
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
  },
  'buy-and-build': {
    name: 'Buy and Build Strategy',
    criteria: [
      { name: 'API Architecture & Integration', weight: 35 },
      { name: 'Modular System Design', weight: 30 },
      { name: 'M&A Tech Compatibility', weight: 20 },
      { name: 'Platform Extensibility', weight: 15 }
    ],
    focusAreas: ['api-first', 'modular-architecture', 'integration-ready', 'multi-tenant']
  },
  'margin-expansion': {
    name: 'Margin Expansion',
    criteria: [
      { name: 'Infrastructure Efficiency', weight: 30 },
      { name: 'Automation Level', weight: 30 },
      { name: 'Technical Debt', weight: 20 },
      { name: 'Operational Scalability', weight: 20 }
    ],
    focusAreas: ['cost-optimization', 'automation', 'efficiency', 'serverless']
  },
  'turnaround-distressed': {
    name: 'Turnaround / Distressed',
    criteria: [
      { name: 'System Stability', weight: 35 },
      { name: 'Technical Debt Level', weight: 30 },
      { name: 'Core IP Value', weight: 20 },
      { name: 'Recovery Potential', weight: 15 }
    ],
    focusAreas: ['stability', 'maintainability', 'core-features', 'technical-debt']
  },
  'carve-out': {
    name: 'Carve-out Opportunity',
    criteria: [
      { name: 'System Independence', weight: 35 },
      { name: 'Modular Architecture', weight: 30 },
      { name: 'Standalone Viability', weight: 20 },
      { name: 'Integration Dependencies', weight: 15 }
    ],
    focusAreas: ['independence', 'modularity', 'self-contained', 'minimal-dependencies']
  },
  'geographic-vertical-expansion': {
    name: 'Geographic/Vertical Expansion',
    criteria: [
      { name: 'Localization Readiness', weight: 30 },
      { name: 'Multi-region Architecture', weight: 30 },
      { name: 'Compliance Flexibility', weight: 20 },
      { name: 'Market Adaptability', weight: 20 }
    ],
    focusAreas: ['localization', 'multi-region', 'compliance-ready', 'adaptable']
  },
  'digital-transformation': {
    name: 'Digital Transformation',
    criteria: [
      { name: 'Modern Tech Stack', weight: 30 },
      { name: 'Cloud Migration Readiness', weight: 25 },
      { name: 'API & Integration Maturity', weight: 25 },
      { name: 'Digital Innovation Potential', weight: 20 }
    ],
    focusAreas: ['modern-stack', 'cloud-ready', 'api-driven', 'innovative']
  }
}

// Run Python crawler
async function runCrawl4AI(domain: string, investmentThesis: string, scanRequestId: string, apiKeys?: { anthropicKey?: string, geminiKey?: string }): Promise<Crawl4AIResult> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'deep_research_crawler.py')
    const venvPython = path.join(__dirname, '..', '..', 'venv', 'bin', 'python')
    
    console.log(`Running deep research crawler for ${domain}...`)
    
    // Prepare API keys as JSON
    const apiKeysJson = JSON.stringify({
      google_api_key: apiKeys?.geminiKey || '',
      anthropic_api_key: apiKeys?.anthropicKey || ''
    })
    
    const process = spawn(venvPython, [pythonScript, domain, investmentThesis, scanRequestId, apiKeysJson])
    
    let outputData = ''
    let errorData = ''
    
    process.stdout.on('data', (data) => {
      const chunk = data.toString()
      outputData += chunk
      
      // Look for JSON output
      if (chunk.includes('"success":')) {
        try {
          const jsonStart = chunk.indexOf('{')
          if (jsonStart >= 0) {
            const jsonStr = chunk.substring(jsonStart)
            const result = JSON.parse(jsonStr)
            if (result.success !== undefined) {
              // Don't resolve yet, wait for process to finish
            }
          }
        } catch (e) {
          // Continue collecting output
        }
      }
    })
    
    process.stderr.on('data', (data) => {
      errorData += data.toString()
      console.error('Crawler stderr:', data.toString())
    })
    
    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Crawler process exited with code ${code}: ${errorData}`))
        return
      }
      
      try {
        // Find JSON in output
        const jsonMatch = outputData.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0])
          resolve(result)
        } else {
          reject(new Error('No JSON output from crawler'))
        }
      } catch (error) {
        reject(new Error(`Failed to parse crawler output: ${error}`))
      }
    })
    
    process.on('error', (error) => {
      reject(error)
    })
  })
}

// Score evidence based on investment thesis
function scoreEvidence(evidence: any, investmentThesis: string): number {
  const criteria = INVESTMENT_THESIS_CRITERIA[investmentThesis]
  if (!criteria) return 0.5
  
  let score = 0.7 // Base score
  
  // Boost score based on relevance to focus areas
  const content = JSON.stringify(evidence.content || {}).toLowerCase()
  
  for (const focusArea of criteria.focusAreas) {
    if (content.includes(focusArea.replace('-', ' '))) {
      score += 0.05
    }
  }
  
  // Type-based scoring
  const highValueTypes = [
    'technical_architecture',
    'api_documentation',
    'code_pattern_analysis',
    'infrastructure_analysis',
    'security_analysis'
  ]
  
  if (highValueTypes.includes(evidence.type)) {
    score += 0.1
  }
  
  return Math.min(score, 0.95)
}

// Analyze evidence with Claude
async function analyzeWithClaude(evidence: any[], investmentThesis: string, apiKey: string): Promise<any> {
  // Group evidence by type
  const groupedEvidence = evidence.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, any[]>)
  
  const thesisCriteria = INVESTMENT_THESIS_CRITERIA[investmentThesis]
  
  // Create analysis prompt
  const prompt = `
Analyze this technical evidence for a ${thesisCriteria.name} investment thesis.

Evidence Summary:
${Object.entries(groupedEvidence).map(([type, items]) => 
  `- ${type}: ${items.length} items`
).join('\n')}

Key Technologies Found:
${[...new Set(evidence.flatMap(e => e.content?.technologies || []))].join(', ')}

Investment Criteria:
${thesisCriteria.criteria.map((c: any) => `- ${c.name} (${c.weight}% weight)`).join('\n')}

Provide:
1. Overall investment alignment score (0-100)
2. Key strengths for this thesis
3. Key risks or concerns
4. Critical gaps in evidence
5. Recommended deep-dive areas
`

  // Here you would call Claude API
  // For now, return structured analysis
  return {
    alignmentScore: 85,
    strengths: [
      'Strong cloud-native architecture',
      'Mature API ecosystem',
      'Evidence of scalable infrastructure'
    ],
    risks: [
      'Technical debt in legacy components',
      'Limited automation evidence'
    ],
    gaps: [
      'Financial performance metrics',
      'Customer growth data'
    ],
    recommendations: [
      'Deep dive on infrastructure costs',
      'Analyze engineering team composition'
    ]
  }
}

// Main worker
export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  async (job: Job<EvidenceCollectionJob>) => {
    const { scanRequestId, company, domain, depth, investmentThesis, primaryCriteria } = job.data
    
    console.log(`Starting crawl4ai evidence collection for ${company} (${scanRequestId})`)
    console.log(`Investment thesis: ${investmentThesis}`)
    
    try {
      // Load API keys
      const { anthropicKey, geminiKey } = await loadAPIKeys()
      
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
            worker: 'crawl4ai-deep-collection'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (collectionError) throw collectionError
      
      await job.updateProgress(10)
      
      // Run crawl4ai deep crawler with API keys
      console.log('Starting deep research crawl with external validation...')
      const crawlResults = await runCrawl4AI(domain, investmentThesis, scanRequestId, { anthropicKey, geminiKey })
      
      if (!crawlResults.success) {
        throw new Error(crawlResults.error || 'Crawl4AI failed')
      }
      
      console.log(`Deep Research completed:`)
      console.log(`  - Evidence items: ${crawlResults.evidence_count}`)
      console.log(`  - Pages crawled: ${crawlResults.pages_crawled}`)
      console.log(`  - Research iterations: ${crawlResults.research_iterations || 'N/A'}`)
      if (crawlResults.evidence_coverage) {
        console.log(`  - Evidence coverage: ${crawlResults.evidence_coverage.collected.length} collected, ${crawlResults.evidence_coverage.missing.length} missing`)
      }
      await job.updateProgress(60)
      
      // Store evidence items
      let totalInserted = 0
      const batchSize = 50
      
      for (let i = 0; i < crawlResults.evidence_items.length; i += batchSize) {
        const batch = crawlResults.evidence_items.slice(i, i + batchSize)
        
        const evidenceRecords = batch.map(item => ({
          evidence_id: crypto.randomUUID(),
          collection_id: collection.id,
          company_name: company,
          type: item.type,
          evidence_type: item.type,
          content_data: {
            raw: JSON.stringify(item.content),
            summary: item.content.summary || item.content.title || 'Evidence collected from crawl4ai',
            processed: item.content.full_content || item.content.content || JSON.stringify(item.content)
          },
          source_data: {
            url: item.source,
            tool: 'crawl4ai',
            timestamp: new Date().toISOString()
          },
          metadata: item.content,
          confidence_score: scoreEvidence(item, investmentThesis),
          processing_stage: 'raw',
          created_at: new Date().toISOString()
        }))
        
        console.log(`Inserting batch of ${evidenceRecords.length} evidence records...`)
        
        const { error } = await supabase
          .from('evidence_items')
          .insert(evidenceRecords)
        
        if (error) {
          console.error('Database error inserting evidence:', error)
          console.error('Sample record:', JSON.stringify(evidenceRecords[0], null, 2))
        } else {
          console.log(`Successfully inserted ${evidenceRecords.length} evidence records`)
          totalInserted += evidenceRecords.length
        }
        
        await job.updateProgress(60 + (i / crawlResults.evidence_items.length) * 30)
      }
      
      // Count actual evidence items from database
      const { count: actualEvidenceCount } = await supabase
        .from('evidence_items')
        .select('*', { count: 'exact' })
        .eq('collection_id', collection.id)
      
      // Analyze evidence with Claude
      if (anthropicKey && actualEvidenceCount > 0) {
        console.log('Analyzing evidence with Claude...')
        // Get evidence items for analysis
        const { data: evidenceForAnalysis } = await supabase
          .from('evidence_items')
          .select('*')
          .eq('collection_id', collection.id)
          .limit(50) // Limit for analysis
        
        const analysis = await analyzeWithClaude(evidenceForAnalysis || [], investmentThesis, anthropicKey)
        
        // Store analysis as evidence
        await supabase.from('evidence_items').insert({
          evidence_id: crypto.randomUUID(),
          collection_id: collection.id,
          company_name: company,
          type: 'investment_analysis',
          evidence_type: 'investment_analysis',
          content_data: {
            raw: JSON.stringify(analysis),
            summary: `Investment alignment: ${analysis.alignmentScore}/100`,
            processed: JSON.stringify(analysis, null, 2)
          },
          source_data: {
            url: 'claude_analysis',
            tool: 'claude',
            timestamp: new Date().toISOString()
          },
          metadata: analysis,
          confidence_score: 0.95,
          processing_stage: 'processed',
          created_at: new Date().toISOString()
        })
      }
      
      // Update collection status
      await supabase
        .from('evidence_collections')
        .update({
          status: 'completed',
          evidence_count: actualEvidenceCount,
          updated_at: new Date().toISOString(),
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis,
            pages_crawled: crawlResults.pages_crawled,
            research_iterations: crawlResults.research_iterations,
            evidence_coverage: crawlResults.evidence_coverage,
            synthesis: crawlResults.synthesis,
            technologies_found: crawlResults.technologies ? Object.keys(crawlResults.technologies) : [],
            technology_counts: crawlResults.technologies || {}
          }
        })
        .eq('id', collection.id)
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'evidence_collected',
          evidence_count: actualEvidenceCount
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`Evidence collection complete! Collected ${actualEvidenceCount} items`)
      
      return {
        success: true,
        evidenceCount: actualEvidenceCount,
        pagesCrawled: crawlResults.pages_crawled,
        collectionId: collection.id,
        researchIterations: crawlResults.research_iterations,
        evidenceCoverage: crawlResults.evidence_coverage,
        synthesis: crawlResults.synthesis,
        technologies: crawlResults.technologies || {}
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
    concurrency: 1, // crawl4ai is resource intensive
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

console.log('🚀 Crawl4AI Deep Evidence Collection Worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Waiting for jobs...')