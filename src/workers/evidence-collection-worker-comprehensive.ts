import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import fetch from 'node-fetch'
// @ts-ignore - node-fetch types
const fetchTyped = fetch as any
import https from 'https'
import { exec } from 'child_process'
import { promisify } from 'util'
import { GoogleGenerativeAI } from '@google/generative-ai'

const execAsync = promisify(exec)

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

interface EvidenceItem {
  id: string
  type: string
  source: {
    url?: string
    query?: string
    tool: string
    timestamp: string
  }
  content: {
    raw: string
    summary: string
    processed?: string
  }
  metadata: any
  confidence: number
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

// Load API keys from Supabase vault
async function loadAPIKeys() {
  try {
    const { data: geminiSecret, error } = await supabase.rpc('get_secret', { secret_name: 'google_gemini_api_key' })
    
    if (error) {
      console.error('Error loading Gemini key from vault:', error)
      // Try environment variable
      const envKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY
      console.log(`Using env key: ${!!envKey}`)
      return { geminiKey: envKey }
    }
    
    console.log(`Loaded Gemini key from vault: ${!!geminiSecret}`)
    return { geminiKey: geminiSecret }
  } catch (error) {
    console.error('Failed to load API keys:', error)
    const envKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY
    console.log(`Fallback to env key: ${!!envKey}`)
    return { geminiKey: envKey }
  }
}

// User agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

// Tool 1: HTML Collection
async function collectHTML(url: string): Promise<EvidenceItem | null> {
  try {
    console.log(`Collecting HTML from ${url}`)
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
    
    const response = await fetchTyped(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      follow: 5
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    
    return {
      id: crypto.randomUUID(),
      type: 'website_content',
      source: {
        url,
        tool: 'html-collector',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: html,
        summary: `Website HTML content for ${url}`,
        processed: html.substring(0, 5000) // First 5k chars for processing
      },
      metadata: {
        title: titleMatch?.[1] || 'No title',
        description: descMatch?.[1] || 'No description',
        contentLength: html.length,
        contentType: response.headers.get('content-type') || 'text/html'
      },
      confidence: 0.9
    }
  } catch (error) {
    console.error('HTML collection failed:', error)
    return null
  }
}

// Tool 2: Security Analysis
async function analyzeSecurityHeaders(url: string): Promise<EvidenceItem | null> {
  try {
    console.log(`Analyzing security headers for ${url}`)
    
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'HEAD',
      rejectUnauthorized: false
    }
    
    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        const headers = res.headers
        const securityHeaders = {
          'strict-transport-security': headers['strict-transport-security'] || 'Missing',
          'x-content-type-options': headers['x-content-type-options'] || 'Missing',
          'x-frame-options': headers['x-frame-options'] || 'Missing',
          'x-xss-protection': headers['x-xss-protection'] || 'Missing',
          'content-security-policy': headers['content-security-policy'] || 'Missing',
          'referrer-policy': headers['referrer-policy'] || 'Missing',
          'permissions-policy': headers['permissions-policy'] || 'Missing'
        }
        
        // Calculate security score
        const presentHeaders = Object.values(securityHeaders).filter(v => v !== 'Missing').length
        const totalHeaders = Object.keys(securityHeaders).length
        const score = (presentHeaders / totalHeaders) * 100
        
        resolve({
          id: crypto.randomUUID(),
          type: 'security_analysis',
          source: {
            url,
            tool: 'security-scanner',
            timestamp: new Date().toISOString()
          },
          content: {
            raw: JSON.stringify({ headers: securityHeaders, score }),
            summary: `Security headers analysis: ${presentHeaders}/${totalHeaders} headers present (${score.toFixed(0)}% score)`,
          },
          metadata: {
            score,
            grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
            presentHeaders,
            totalHeaders,
            headers: securityHeaders
          },
          confidence: 0.95
        })
      })
      
      req.on('error', (error) => {
        console.error('Security analysis failed:', error)
        resolve(null)
      })
      
      req.end()
    })
  } catch (error) {
    console.error('Security analysis error:', error)
    return null
  }
}

// Tool 3: SSL/TLS Analysis
async function analyzeSSL(domain: string): Promise<EvidenceItem | null> {
  try {
    console.log(`Analyzing SSL/TLS for ${domain}`)
    
    // Use openssl to get certificate info
    const { stdout } = await execAsync(
      `echo | timeout 5 openssl s_client -connect ${domain}:443 -servername ${domain} 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null || echo "SSL_ERROR"`
    )
    
    if (stdout.includes('SSL_ERROR')) {
      throw new Error('SSL connection failed')
    }
    
    const lines = stdout.split('\n').filter(l => l)
    const sslInfo: any = {}
    
    lines.forEach(line => {
      if (line.startsWith('notBefore=')) sslInfo.validFrom = line.split('=')[1]
      if (line.startsWith('notAfter=')) sslInfo.validTo = line.split('=')[1]
      if (line.startsWith('subject=')) sslInfo.subject = line.split('=', 2)[1]
      if (line.startsWith('issuer=')) sslInfo.issuer = line.split('=', 2)[1]
    })
    
    // Check if certificate is valid
    const now = new Date()
    const validTo = new Date(sslInfo.validTo)
    const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isValid = daysRemaining > 0
    
    return {
      id: crypto.randomUUID(),
      type: 'ssl_analysis',
      source: {
        url: `https://${domain}`,
        tool: 'ssl-scanner',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(sslInfo),
        summary: `SSL certificate ${isValid ? 'valid' : 'expired'}, ${daysRemaining} days remaining`,
      },
      metadata: {
        isValid,
        daysRemaining,
        ...sslInfo
      },
      confidence: 0.95
    }
  } catch (error) {
    console.error('SSL analysis failed:', error)
    return null
  }
}

// Tool 4: Google/Gemini Search
async function searchWithGemini(query: string, searchType: string, apiKey: string): Promise<EvidenceItem | null> {
  try {
    console.log(`Searching with Gemini: ${query}`)
    
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    const prompt = `Search for and provide detailed information about: ${query}
    
    Focus on ${searchType} information.
    Provide:
    1. Key facts and data points
    2. Recent updates or news
    3. Relevant metrics or statistics
    4. Sources if available
    
    Format as structured JSON with: title, summary, keyPoints (array), sources (array)`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Try to parse JSON from response
    let parsedData: any = {}
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1])
      }
    } catch (e) {
      parsedData = { summary: text }
    }
    
    return {
      id: crypto.randomUUID(),
      type: `${searchType}_info`,
      source: {
        query,
        tool: 'gemini-search',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(parsedData),
        summary: parsedData.summary || text.substring(0, 200),
      },
      metadata: {
        searchType,
        keyPoints: parsedData.keyPoints || [],
        sources: parsedData.sources || []
      },
      confidence: 0.8
    }
  } catch (error) {
    console.error('Gemini search failed:', error)
    return null
  }
}

// Tool 5: Technology Detection
async function detectTechnologies(htmlContent: string, domain: string): Promise<EvidenceItem | null> {
  try {
    console.log(`Detecting technologies for ${domain}`)
    
    const technologies: string[] = []
    const patterns = {
      'React': [/react/i, /_react/i, /React\./],
      'Vue.js': [/vue/i, /Vue\./],
      'Angular': [/angular/i, /ng-/],
      'jQuery': [/jquery/i, /\$\(/],
      'Bootstrap': [/bootstrap/i],
      'Tailwind CSS': [/tailwind/i],
      'Next.js': [/_next/i, /next\.js/i],
      'WordPress': [/wp-content/i, /wordpress/i],
      'Shopify': [/shopify/i, /myshopify\.com/],
      'Node.js': [/node\.js/i, /express/i],
      'Python': [/django/i, /flask/i],
      'Ruby on Rails': [/rails/i],
      'PHP': [/\.php/i],
      'AWS': [/amazonaws\.com/i, /aws/i],
      'Google Cloud': [/googleapis\.com/i, /gcp/i],
      'Cloudflare': [/cloudflare/i],
      'Vercel': [/vercel/i],
      'Netlify': [/netlify/i]
    }
    
    // Check patterns
    Object.entries(patterns).forEach(([tech, regexes]) => {
      if (regexes.some(regex => regex.test(htmlContent))) {
        technologies.push(tech)
      }
    })
    
    // Check for common libraries in script tags
    const scriptMatches = htmlContent.match(/<script[^>]*src=["']([^"']+)["']/gi) || []
    scriptMatches.forEach(script => {
      if (script.includes('gtag')) technologies.push('Google Analytics')
      if (script.includes('facebook')) technologies.push('Facebook SDK')
      if (script.includes('stripe')) technologies.push('Stripe')
      if (script.includes('segment')) technologies.push('Segment')
    })
    
    return {
      id: crypto.randomUUID(),
      type: 'technology_stack',
      source: {
        url: `https://${domain}`,
        tool: 'tech-detector',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify({ technologies }),
        summary: `Detected ${technologies.length} technologies: ${technologies.slice(0, 5).join(', ')}${technologies.length > 5 ? '...' : ''}`,
      },
      metadata: {
        count: technologies.length,
        technologies,
        categories: {
          frontend: technologies.filter(t => ['React', 'Vue.js', 'Angular', 'jQuery'].includes(t)),
          css: technologies.filter(t => ['Bootstrap', 'Tailwind CSS'].includes(t)),
          backend: technologies.filter(t => ['Node.js', 'Python', 'Ruby on Rails', 'PHP'].includes(t)),
          cloud: technologies.filter(t => ['AWS', 'Google Cloud', 'Cloudflare', 'Vercel', 'Netlify'].includes(t)),
          analytics: technologies.filter(t => ['Google Analytics', 'Segment'].includes(t))
        }
      },
      confidence: 0.85
    }
  } catch (error) {
    console.error('Technology detection failed:', error)
    return null
  }
}

// Main evidence collection orchestrator
async function collectEvidence(job: Job<EvidenceCollectionJob>): Promise<EvidenceItem[]> {
  const { company, domain, depth, investmentThesis } = job.data
  const evidence: EvidenceItem[] = []
  const { geminiKey } = await loadAPIKeys()
  
  console.log(`Collecting evidence - Depth: ${depth}, Has API Key: ${!!geminiKey}`)
  
  // Phase 1: Basic Collection (always run)
  console.log('Phase 1: Basic evidence collection')
  
  // Collect HTML
  const htmlEvidence = await collectHTML(`https://${domain}`)
  if (htmlEvidence) {
    evidence.push(htmlEvidence)
    await job.updateProgress(10)
    
    // Detect technologies from HTML
    const techEvidence = await detectTechnologies(htmlEvidence.content.raw, domain)
    if (techEvidence) evidence.push(techEvidence)
  }
  
  // Security headers
  const securityEvidence = await analyzeSecurityHeaders(`https://${domain}`)
  if (securityEvidence) evidence.push(securityEvidence)
  await job.updateProgress(20)
  
  // SSL analysis
  const sslEvidence = await analyzeSSL(domain)
  if (sslEvidence) evidence.push(sslEvidence)
  await job.updateProgress(30)
  
  // Phase 2: Search-based collection (comprehensive and exhaustive only)
  if (depth !== 'basic' && geminiKey) {
    console.log('Phase 2: Search-based evidence collection')
    
    // Business overview
    const businessEvidence = await searchWithGemini(
      `${company} company overview business model products services`,
      'business_overview',
      geminiKey
    )
    if (businessEvidence) evidence.push(businessEvidence)
    await job.updateProgress(40)
    
    // Team information
    const teamEvidence = await searchWithGemini(
      `${company} founders executives leadership team employees culture`,
      'team',
      geminiKey
    )
    if (teamEvidence) evidence.push(teamEvidence)
    await job.updateProgress(50)
    
    // Market analysis
    const marketEvidence = await searchWithGemini(
      `${company} market position competitors industry analysis market share`,
      'market_analysis',
      geminiKey
    )
    if (marketEvidence) evidence.push(marketEvidence)
    await job.updateProgress(60)
    
    // Technology deep dive
    const techDeepEvidence = await searchWithGemini(
      `${company} technology stack architecture infrastructure engineering blog tech talks`,
      'tech_deep_dive',
      geminiKey
    )
    if (techDeepEvidence) evidence.push(techDeepEvidence)
    await job.updateProgress(70)
  }
  
  // Phase 3: Exhaustive collection
  if (depth === 'exhaustive' && geminiKey) {
    console.log('Phase 3: Exhaustive evidence collection')
    
    // Financial information
    const financialEvidence = await searchWithGemini(
      `${company} funding revenue valuation investors financial performance metrics`,
      'financial_info',
      geminiKey
    )
    if (financialEvidence) evidence.push(financialEvidence)
    await job.updateProgress(80)
    
    // Investment thesis specific
    const thesisEvidence = await searchWithGemini(
      `${company} ${investmentThesis} scalability growth potential technical debt cloud architecture`,
      'investment_thesis',
      geminiKey
    )
    if (thesisEvidence) evidence.push(thesisEvidence)
    await job.updateProgress(90)
  }
  
  console.log(`Total evidence collected: ${evidence.length} items`)
  return evidence
}

// Main worker
export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  async (job: Job<EvidenceCollectionJob>) => {
    const { scanRequestId, company, domain, depth, investmentThesis, primaryCriteria } = job.data
    
    console.log(`Starting comprehensive evidence collection for ${company} (${scanRequestId})`)
    console.log(`Depth: ${depth}, Investment thesis: ${investmentThesis}`)
    
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
            worker: 'comprehensive-collection'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (collectionError) throw collectionError
      
      // Collect evidence
      const evidence = await collectEvidence(job)
      
      // Store evidence items
      if (evidence.length > 0) {
        const evidenceRecords = evidence.map(item => ({
          evidence_id: item.id,
          collection_id: collection.id,
          company_name: company,
          type: item.type,
          evidence_type: item.type,
          content_data: item.content,
          source_data: item.source,
          metadata: item.metadata,
          confidence_score: item.confidence,
          processing_stage: 'raw',
          created_at: new Date().toISOString()
        }))
        
        const { error: insertError } = await supabase
          .from('evidence_items')
          .insert(evidenceRecords)
        
        if (insertError) {
          console.error('Failed to insert evidence:', insertError)
        }
      }
      
      // Update collection status
      await supabase
        .from('evidence_collections')
        .update({
          status: 'completed',
          evidence_count: evidence.length,
          updated_at: new Date().toISOString(),
          metadata: {
            ...collection.metadata,
            tools_used: [...new Set(evidence.map(e => e.source.tool))],
            types_collected: [...new Set(evidence.map(e => e.type))]
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
        collectionId: collection.id,
        tools: [...new Set(evidence.map(e => e.source.tool))],
        types: [...new Set(evidence.map(e => e.type))]
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
    concurrency: 2, // Can handle 2 jobs concurrently
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

console.log('🚀 Comprehensive Evidence Collection Worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Waiting for jobs...')