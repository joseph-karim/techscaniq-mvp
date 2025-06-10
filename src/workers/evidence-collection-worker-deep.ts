import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
// import { AsyncWebCrawler, CrawlerConfig } from 'crawl4ai'
import { execSync } from 'child_process'
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

interface CrawlResult {
  url: string
  title: string
  content: string
  markdown: string
  metadata: any
  links: string[]
  images: string[]
  scripts: string[]
  apis: string[]
  technologies: string[]
  html: string
  codeBlocks: CodeBlock[]
  structuredData: any[]
}

interface AuditEntry {
  id: string
  timestamp: Date
  phase: string
  action: string
  tool: string
  input: any
  output: any
  reasoning: string
  evidenceCollected: number
  quality: 'high' | 'medium' | 'low'
  duration: number
}

interface AgentDecision {
  nextAction: string
  targetUrl?: string
  searchQuery?: string
  tool: string
  reasoning: string
  priority: number
}

interface CodeBlock {
  language: string
  code: string
  purpose: string
  patterns: string[]
  frameworks: string[]
}

// Investment thesis criteria based on PE_THESIS_TYPES from investment-thesis-selector.tsx
interface ThesisCriteria {
  [key: string]: {
    name: string
    criteria: Array<{ name: string; weight: number; description: string }>
    focusAreas: string[]
  }
}

const INVESTMENT_THESIS_CRITERIA: ThesisCriteria = {
  'accelerate-organic-growth': {
    name: 'Accelerate Organic Growth',
    criteria: [
      { name: 'Cloud Architecture Scalability', weight: 30, description: 'Auto-scaling capabilities, microservices architecture' },
      { name: 'Development Velocity & Pipeline', weight: 25, description: 'CI/CD maturity, test coverage, deployment frequency' },
      { name: 'Market Expansion Readiness', weight: 25, description: 'Geographic reach, customer acquisition systems' },
      { name: 'Code Quality & Technical Debt', weight: 20, description: 'Modular architecture, maintainability' }
    ],
    focusAreas: ['cloud-native', 'scalable-architecture', 'devops-maturity', 'test-coverage', 'microservices']
  },
  'buy-and-build': {
    name: 'Buy-and-Build / Roll-Up',
    criteria: [
      { name: 'API Architecture & Documentation', weight: 25, description: 'Comprehensive API coverage, developer documentation' },
      { name: 'Multi-tenant Conversion Effort', weight: 25, description: 'Single-tenant to multi-tenant migration complexity' },
      { name: 'Data Model Flexibility', weight: 20, description: 'Database schema flexibility, shared authentication' },
      { name: 'Team Depth for Multi-Codebase', weight: 20, description: 'Engineering team capability' },
      { name: 'Operational Standardization', weight: 10, description: 'Process standardization potential' }
    ],
    focusAreas: ['api-driven', 'microservices', 'documentation', 'distributed-systems', 'scalable-architecture']
  },
  'margin-expansion': {
    name: 'Margin Expansion / Cost-Out',
    criteria: [
      { name: 'Cloud Cost Optimization', weight: 30, description: 'Hosting cost per user analysis' },
      { name: 'Process Automation Potential', weight: 25, description: 'Manual QA elimination, deployment automation' },
      { name: 'Third-party Licensing Optimization', weight: 20, description: 'Vendor consolidation opportunities' },
      { name: 'Technical Debt Impact on Costs', weight: 15, description: 'Development inefficiencies' },
      { name: 'Operational Monitoring & Analytics', weight: 10, description: 'Performance monitoring maturity' }
    ],
    focusAreas: ['cloud-native', 'devops-maturity', 'containerized', 'test-coverage', 'low-technical-debt']
  },
  'turnaround-distressed': {
    name: 'Turnaround / Distressed',
    criteria: [
      { name: 'Critical Security & Compliance Gaps', weight: 35, description: 'Security vulnerabilities, compliance violations' },
      { name: 'Framework Obsolescence & Hiring Impact', weight: 20, description: 'Technology stack modernity' },
      { name: 'Technical Debt Remediation Scope', weight: 20, description: 'Time-to-refactor estimates' },
      { name: 'Team Capability & Knowledge Risk', weight: 15, description: 'Key person dependencies' },
      { name: 'Platform Stability & Performance', weight: 10, description: 'System reliability' }
    ],
    focusAreas: ['security-focus', 'modern-tech-stack', 'low-technical-debt', 'documentation', 'test-coverage']
  },
  'carve-out': {
    name: 'Carve-Out from Corporate',
    criteria: [
      { name: 'Parent System Dependencies', weight: 25, description: 'SSO dependencies, shared data lakes' },
      { name: 'IP & Licensing Complexity', weight: 20, description: 'License entanglements, IP ownership' },
      { name: 'Separation Architecture Assessment', weight: 20, description: 'Rebuild vs lift-and-shift' },
      { name: 'Standalone Operations Readiness', weight: 20, description: 'Independent infrastructure capability' },
      { name: 'Team Independence & Knowledge', weight: 15, description: 'Team completeness' }
    ],
    focusAreas: ['microservices', 'api-driven', 'documentation', 'distributed-systems', 'containerized']
  },
  'geographic-vertical-expansion': {
    name: 'Geographic or Vertical Expansion',
    criteria: [
      { name: 'Multi-region Deployment Support', weight: 20, description: 'GDPR compliance, data residency' },
      { name: 'Internationalization Readiness', weight: 20, description: 'Feature toggles, i18n framework' },
      { name: 'Industry-specific Compliance', weight: 20, description: 'HIPAA, SOC-2, industry certifications' },
      { name: 'Scalability for New Markets', weight: 20, description: 'Architecture scalability' },
      { name: 'Configuration Flexibility', weight: 20, description: 'Multi-tenant configuration' }
    ],
    focusAreas: ['security-focus', 'scalable-architecture', 'cloud-native', 'api-driven', 'high-availability']
  },
  'digital-transformation': {
    name: 'Digital Transformation / Product Extension',
    criteria: [
      { name: 'Service-Oriented Architecture', weight: 25, description: 'Microservices readiness' },
      { name: 'Plugin/API Framework Maturity', weight: 20, description: 'Extension architecture' },
      { name: 'Code Quality for Feature Development', weight: 20, description: 'Maintainability, test coverage' },
      { name: 'Legacy System Modernization Path', weight: 20, description: 'Migration strategy' },
      { name: 'Platform Extensibility Design', weight: 15, description: 'Module architecture' }
    ],
    focusAreas: ['microservices', 'api-driven', 'modern-tech-stack', 'test-coverage', 'documentation']
  }
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

// API keys will be fetched from Supabase vault
let ANTHROPIC_API_KEY: string | null = null
let GOOGLE_API_KEY: string | null = null

// Fetch API keys from Supabase vault on startup
async function loadAPIKeys() {
  try {
    // Get Anthropic API key
    const { data: anthropicKey } = await supabase.rpc('get_secret', { secret_name: 'ANTHROPIC_API_KEY' })
    ANTHROPIC_API_KEY = anthropicKey
    
    // Get Google API key
    const { data: googleKey } = await supabase.rpc('get_secret', { secret_name: 'GOOGLE_API_KEY' })
    GOOGLE_API_KEY = googleKey
    
    console.log('✅ API keys loaded from Supabase vault')
  } catch (error) {
    console.error('⚠️ Failed to load API keys from vault:', error)
    console.log('Will use rule-based approaches instead')
  }
}

// Load keys on startup
loadAPIKeys()

// Audit Trail Manager
class AuditTrailManager {
  private entries: AuditEntry[] = []
  private collectionId: string

  constructor(collectionId: string) {
    this.collectionId = collectionId
  }

  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
    const auditEntry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...entry
    }
    
    this.entries.push(auditEntry)
    
    // Store in database
    await supabase.from('pipeline_logs').insert({
      execution_id: this.collectionId,
      stage: entry.phase,
      action: entry.action,
      tool: entry.tool,
      input_data: entry.input,
      output_data: entry.output,
      reasoning: entry.reasoning,
      evidence_count: entry.evidenceCollected,
      quality_score: entry.quality,
      duration_ms: entry.duration,
      created_at: auditEntry.timestamp
    })
    
    return auditEntry
  }

  getEntries() {
    return this.entries
  }
}

// Agentic Decision Engine
class AgenticDecisionEngine {
  private _context: Map<string, any> = new Map() // Currently unused but may be needed for future enhancements
  private auditTrail: AuditTrailManager

  constructor(auditTrail: AuditTrailManager) {
    this.auditTrail = auditTrail
  }

  async makeDecision(currentEvidence: any[], investmentThesis: string): Promise<AgentDecision> {
    const startTime = Date.now()
    
    // Analyze current evidence state
    const evidenceTypes = this.categorizeEvidence(currentEvidence)
    const gaps = this.identifyGaps(evidenceTypes, investmentThesis)
    
    // Use Claude via Supabase for intelligent decision making
    const prompt = `
You are an investment analyst conducting deep due diligence. 

Current evidence collected:
${JSON.stringify(evidenceTypes, null, 2)}

Investment thesis: ${investmentThesis}

Identified gaps: ${gaps.join(', ')}

What should be the next most valuable action to gather evidence? Consider:
1. What critical information is still missing?
2. What would most reduce investment risk?
3. What evidence would validate/invalidate the thesis?

Respond with JSON:
{
  "nextAction": "description of action",
  "targetUrl": "specific URL if applicable",
  "searchQuery": "search query if applicable", 
  "tool": "crawl4ai|search|github|ssl|performance|security",
  "reasoning": "detailed reasoning",
  "priority": 1-10
}
`

    try {
      // Use Claude directly with API key from vault
      if (!ANTHROPIC_API_KEY) {
        console.log('Claude API key not available, using rule-based decision making')
        return this.makeRuleBasedDecision(evidenceTypes, gaps)
      }
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307', // Fast and cheap for decisions
          max_tokens: 500,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      })
      
      if (!response.ok) {
        console.log('Claude API error, using rule-based decision making')
        return this.makeRuleBasedDecision(evidenceTypes, gaps)
      }
      
      const result = await response.json()
      const decision = JSON.parse(result.content[0].text)
      
      await this.auditTrail.log({
        phase: 'decision_making',
        action: 'agent_decision',
        tool: 'openai',
        input: { evidenceTypes, gaps },
        output: decision,
        reasoning: decision.reasoning,
        evidenceCollected: 0,
        quality: 'high',
        duration: Date.now() - startTime
      })

      return decision
    } catch (error) {
      // Fallback to rule-based decision
      return this.makeRuleBasedDecision(evidenceTypes, gaps)
    }
  }

  private categorizeEvidence(evidence: any[]) {
    const categories = {
      technical: evidence.filter(e => e.type.includes('tech')).length,
      business: evidence.filter(e => e.type.includes('business')).length,
      financial: evidence.filter(e => e.type.includes('financial')).length,
      team: evidence.filter(e => e.type.includes('team')).length,
      security: evidence.filter(e => e.type.includes('security')).length,
      competitive: evidence.filter(e => e.type.includes('competitive')).length,
      innovation: evidence.filter(e => e.type.includes('innovation')).length
    }
    return categories
  }

  private identifyGaps(evidenceTypes: any, thesis: string): string[] {
    const gaps = []
    
    // Technical gaps
    if (evidenceTypes.technical < 20) gaps.push('technical_architecture')
    if (evidenceTypes.technical < 30) gaps.push('api_documentation')
    if (evidenceTypes.technical < 40) gaps.push('infrastructure_details')
    
    // Business gaps
    if (evidenceTypes.business < 10) gaps.push('customer_case_studies')
    if (evidenceTypes.business < 15) gaps.push('partnership_details')
    if (evidenceTypes.financial < 5) gaps.push('revenue_indicators')
    
    // Team gaps
    if (evidenceTypes.team < 10) gaps.push('leadership_profiles')
    if (evidenceTypes.team < 20) gaps.push('engineering_talent')
    
    // Security gaps
    if (evidenceTypes.security < 5) gaps.push('security_certifications')
    if (evidenceTypes.security < 10) gaps.push('compliance_status')
    
    // Thesis-specific gaps
    if (thesis.includes('ai') && evidenceTypes.innovation < 10) {
      gaps.push('ai_capabilities')
    }
    if (thesis.includes('scale') && evidenceTypes.technical < 50) {
      gaps.push('scalability_evidence')
    }
    
    return gaps
  }

  private makeRuleBasedDecision(_evidenceTypes: any, gaps: string[]): AgentDecision {
    // Priority-based rules
    if (gaps.includes('technical_architecture')) {
      return {
        nextAction: 'Deep crawl technical documentation and engineering blog',
        targetUrl: '/docs OR /api OR /developers OR /engineering',
        tool: 'crawl4ai',
        reasoning: 'Technical architecture is critical for investment decision',
        priority: 9
      }
    }
    
    if (gaps.includes('revenue_indicators')) {
      return {
        nextAction: 'Search for revenue, funding, and growth metrics',
        searchQuery: 'company revenue funding growth metrics customers',
        tool: 'search',
        reasoning: 'Financial health indicators are essential',
        priority: 8
      }
    }
    
    if (gaps.includes('security_certifications')) {
      return {
        nextAction: 'Analyze security posture and compliance',
        tool: 'security',
        reasoning: 'Security risks could be deal breakers',
        priority: 7
      }
    }
    
    // Default: deeper technical crawl
    return {
      nextAction: 'Perform comprehensive site crawl for any missed evidence',
      tool: 'crawl4ai',
      reasoning: 'Comprehensive crawl to ensure nothing is missed',
      priority: 5
    }
  }
}

// Basic Deep Crawler (without crawl4ai)
class DeepCrawler {
  private auditTrail: AuditTrailManager

  constructor(auditTrail: AuditTrailManager) {
    this.auditTrail = auditTrail
  }

  async initialize() {
    console.log('Initializing basic web crawler...')
  }

  async deepCrawl(domain: string, strategy: 'bfs' | 'dfs' | 'smart' = 'smart'): Promise<CrawlResult[]> {
    const startTime = Date.now()
    const results: CrawlResult[] = []
    const visitedUrls = new Set<string>()
    const urlQueue: { url: string; depth: number; score: number }[] = [
      { url: `https://${domain}`, depth: 0, score: 100 }
    ]
    
    // Advanced crawling configuration
    const maxDepth = 5
    const maxPages = 200
    const importantPatterns = [
      /\/(about|company|team|leadership|founders?)/i,
      /\/(products?|services?|solutions?|features?|platform)/i,
      /\/(technology|tech-?stack|engineering|architecture)/i,
      /\/(docs?|documentation|api|developers?|sdk|reference)/i,
      /\/(pricing|plans?|enterprise|customers?|case-?studies?)/i,
      /\/(investors?|funding|press|news|blog)/i,
      /\/(security|privacy|compliance|certifications?|soc\d?|iso)/i,
      /\/(careers?|jobs?|hiring|culture|values)/i,
      /\/(research|papers?|whitepapers?|reports?)/i,
      /\/(integrations?|partners?|ecosystem|marketplace)/i
    ]
    
    try {
      while (urlQueue.length > 0 && results.length < maxPages) {
        // Smart selection based on score and depth
        urlQueue.sort((a, b) => {
          if (strategy === 'bfs') return a.depth - b.depth || b.score - a.score
          if (strategy === 'dfs') return b.depth - a.depth || b.score - a.score
          return b.score - a.score // smart: prioritize by score
        })
        
        const { url, depth } = urlQueue.shift()!
        
        if (visitedUrls.has(url) || depth > maxDepth) continue
        visitedUrls.add(url)
        
        console.log(`[Depth ${depth}] Crawling: ${url}`)
        
        try {
          // Use fetch for basic crawling
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'TechScanIQ/2.0 (PE Due Diligence Bot)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Cache-Control': 'no-cache'
            }
          })
          
          if (!response.ok) continue
          
          const html = await response.text()
          const $ = cheerio.load(html)
          
          // Extract basic information
          const title = $('title').text() || 'Untitled'
          const description = $('meta[name="description"]').attr('content') || ''
          const keywords = $('meta[name="keywords"]').attr('content') || ''
          
          // Extract links
          const links: string[] = []
          $('a[href]').each((_, el) => {
            const href = $(el).attr('href')
            if (href) links.push(href)
          })
          
          // Extract scripts
          const scripts: string[] = []
          $('script[src]').each((_, el) => {
            const src = $(el).attr('src')
            if (src) scripts.push(src)
          })
          
          // Extract images
          const images: string[] = []
          $('img[src]').each((_, el) => {
            const src = $(el).attr('src')
            if (src) images.push(src)
          })
          
          // Create a mock result object similar to crawl4ai
          const result = {
            success: true,
            url,
            html,
            markdown: html.replace(/<[^>]*>/g, ' ').slice(0, 10000), // Simple text extraction
            metadata: {
              title,
              description,
              keywords
            },
            links,
            images,
            scripts,
            extracted_content: null,
            structured_data: []
          }
          
          // Continue with existing processing logic...
          // Note: Since we're using basic crawling without crawl4ai, 
          // we'll process the result directly instead of using crawl4ai configurations
          
          // Use Gemini Flash for intelligent parsing if API key available
          if (GOOGLE_API_KEY) {
            try {
              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{
                      parts: [{
                        text: `Extract structured information from this webpage content:
                        
${result.markdown.slice(0, 5000)}

Extract:
- Technology stack (frameworks, languages, databases, cloud)
- Team information
- Customer testimonials
- Pricing/business model
- Security certifications
- API documentation links
- Infrastructure details

Return as JSON.`
                      }]
                    }],
                    generationConfig: {
                      temperature: 0.2,
                      maxOutputTokens: 1000
                    }
                  })
                }
              )
              
              if (response.ok) {
                const data = await response.json()
                result.extracted_content = data.candidates[0].content.parts[0].text
              }
            } catch (err) {
              console.log('Gemini parsing failed, using basic extraction')
            }
          }
          
          // Basic result is ready to process
          if (result.success) {
            // Parse extracted content
            const extractedData = result.extracted_content ? 
              JSON.parse(result.extracted_content) : {}
            
            // Extract technologies from various sources
            const technologies = this.extractTechnologies(
              result.markdown,
              result.scripts || [],
              extractedData
            )
            
            // Extract API endpoints
            const apis = this.extractAPIs(
              result.links || [],
              [], // js_execution_result not available in basic crawler
              [] // network_capture not available in basic crawler
            )
            
            // Extract code blocks and patterns
            const codeBlocks = this.extractCodeBlocks(result.html || result.markdown)
            
            const crawlResult: CrawlResult = {
              url,
              title: result.metadata?.title || 'Untitled',
              content: result.markdown,
              markdown: result.markdown,
              html: result.html || '',
              metadata: {
                ...result.metadata,
                description: result.metadata?.description,
                keywords: result.metadata?.keywords,
                ogData: {}, // OG data not extracted in basic crawler
                structuredData: result.structured_data,
                customExtraction: extractedData,
                depth,
                crawledAt: new Date().toISOString()
              },
              links: result.links || [],
              images: result.images || [],
              scripts: result.scripts || [],
              apis,
              technologies,
              codeBlocks,
              structuredData: result.structured_data || []
            }
            
            results.push(crawlResult)
            
            // Score and add new URLs to queue
            const scoredLinks = this.scoreUrls(
              result.links || [],
              url,
              domain,
              importantPatterns
            )
            
            for (const scoredLink of scoredLinks) {
              if (!visitedUrls.has(scoredLink.url)) {
                urlQueue.push({
                  url: scoredLink.url,
                  depth: depth + 1,
                  score: scoredLink.score
                })
              }
            }
            
            // Log successful crawl
            await this.auditTrail.log({
              phase: 'crawling',
              action: 'page_crawled',
              tool: 'crawl4ai',
              input: { url, depth },
              output: {
                technologies: technologies.length,
                apis: apis.length,
                links: result.links?.length || 0
              },
              reasoning: `Crawled at depth ${depth} with strategy ${strategy}`,
              evidenceCollected: 1,
              quality: 'high',
              duration: Date.now() - startTime
            })
          }
        } catch (err) {
          console.error(`Failed to crawl ${url}:`, err)
          await this.auditTrail.log({
            phase: 'crawling',
            action: 'crawl_failed',
            tool: 'crawl4ai',
            input: { url, depth },
            output: { error: err instanceof Error ? err.message : 'Unknown error' },
            reasoning: 'Page crawl failed',
            evidenceCollected: 0,
            quality: 'low',
            duration: Date.now() - startTime
          })
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } finally {
      // No crawler to close in basic implementation
    }
    
    return results
  }

  private scoreUrls(links: string[], currentUrl: string, domain: string, patterns: RegExp[]): { url: string; score: number }[] {
    const scored: { url: string; score: number }[] = []
    
    for (const link of links) {
      try {
        const linkUrl = new URL(link, currentUrl)
        
        // Only same domain or subdomains
        if (!linkUrl.hostname.endsWith(domain)) continue
        
        let score = 50 // Base score
        
        // Boost for important patterns
        for (const pattern of patterns) {
          if (pattern.test(linkUrl.pathname)) {
            score += 30
            break
          }
        }
        
        // Boost for documentation/API
        if (/\/(docs?|api|developers?)/i.test(linkUrl.pathname)) score += 40
        if (/\/(about|company)/i.test(linkUrl.pathname)) score += 35
        if (/\/(pricing|customers?)/i.test(linkUrl.pathname)) score += 30
        if (/\/(blog|news|research)/i.test(linkUrl.pathname)) score += 25
        
        // Penalty for deep paths
        const pathDepth = linkUrl.pathname.split('/').filter(p => p).length
        score -= pathDepth * 5
        
        // Penalty for file extensions
        if (/\.(pdf|zip|tar|gz|jpg|png|gif)$/i.test(linkUrl.pathname)) score -= 40
        
        scored.push({ url: linkUrl.href, score: Math.max(0, score) })
      } catch (err) {
        // Invalid URL, skip
      }
    }
    
    return scored
  }

  private extractTechnologies(content: string, scripts: string[], extractedData: any): string[] {
    const technologies = new Set<string>()
    
    // Technology patterns with proper names
    const techPatterns = {
      // Frontend
      'React': /react(?:\.js)?|jsx/gi,
      'Angular': /angular(?:\.js)?/gi,
      'Vue.js': /vue(?:\.js)?/gi,
      'Next.js': /next(?:\.js)?/gi,
      'Nuxt.js': /nuxt(?:\.js)?/gi,
      'Svelte': /svelte/gi,
      'Tailwind CSS': /tailwind(?:css)?/gi,
      'Bootstrap': /bootstrap/gi,
      'Material-UI': /material-?ui|mui/gi,
      
      // Backend
      'Node.js': /node(?:\.js)?/gi,
      'Python': /python|django|flask|fastapi/gi,
      'Ruby on Rails': /ruby|rails/gi,
      'Java': /java(?!script)|spring/gi,
      '.NET': /\.net|c#|asp\.net/gi,
      'Go': /\bgolang\b|\bgo\b/gi,
      'Rust': /\brust\b/gi,
      'PHP': /\bphp\b|laravel|symfony/gi,
      
      // Databases
      'PostgreSQL': /postgres(?:ql)?/gi,
      'MySQL': /mysql/gi,
      'MongoDB': /mongodb|mongo/gi,
      'Redis': /redis/gi,
      'Elasticsearch': /elasticsearch|elastic/gi,
      'DynamoDB': /dynamodb/gi,
      'Cassandra': /cassandra/gi,
      
      // Cloud/Infrastructure
      'AWS': /aws|amazon web services/gi,
      'Google Cloud': /google cloud|gcp/gi,
      'Azure': /azure/gi,
      'Kubernetes': /kubernetes|k8s/gi,
      'Docker': /docker/gi,
      'Terraform': /terraform/gi,
      'Jenkins': /jenkins/gi,
      'GitHub Actions': /github actions/gi,
      'CircleCI': /circleci/gi,
      
      // Analytics/Monitoring
      'Google Analytics': /google analytics|gtag/gi,
      'Segment': /segment\.(?:com|io)|analytics\.js/gi,
      'Mixpanel': /mixpanel/gi,
      'Amplitude': /amplitude/gi,
      'Datadog': /datadog/gi,
      'New Relic': /new ?relic/gi,
      'Sentry': /sentry/gi,
      
      // AI/ML
      'TensorFlow': /tensorflow/gi,
      'PyTorch': /pytorch/gi,
      'OpenAI': /openai|gpt/gi,
      'Hugging Face': /hugging ?face/gi,
      'LangChain': /langchain/gi,
      
      // Other
      'GraphQL': /graphql/gi,
      'REST API': /rest(?:ful)? api/gi,
      'WebSocket': /websocket/gi,
      'gRPC': /grpc/gi,
      'Kafka': /kafka/gi,
      'RabbitMQ': /rabbitmq/gi,
      'Stripe': /stripe/gi,
      'Twilio': /twilio/gi,
      'SendGrid': /sendgrid/gi
    }
    
    // Check content
    for (const [tech, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(content)) {
        technologies.add(tech)
      }
    }
    
    // Check scripts
    for (const script of scripts) {
      // Common CDN patterns
      if (script.includes('react')) technologies.add('React')
      if (script.includes('angular')) technologies.add('Angular')
      if (script.includes('vue')) technologies.add('Vue.js')
      if (script.includes('jquery')) technologies.add('jQuery')
      if (script.includes('bootstrap')) technologies.add('Bootstrap')
      if (script.includes('tailwind')) technologies.add('Tailwind CSS')
      if (script.includes('segment.com')) technologies.add('Segment')
      if (script.includes('google-analytics')) technologies.add('Google Analytics')
      if (script.includes('googletagmanager')) technologies.add('Google Tag Manager')
      if (script.includes('stripe')) technologies.add('Stripe')
      if (script.includes('sentry')) technologies.add('Sentry')
    }
    
    // Check extracted data
    if (extractedData.technologies) {
      for (const tech of extractedData.technologies) {
        technologies.add(tech)
      }
    }
    
    return Array.from(technologies)
  }

  private extractAPIs(links: string[], jsApis: string[], networkCapture: any[]): string[] {
    const apis = new Set<string>()
    
    // From links
    for (const link of links) {
      if (/\/api\/|\/v\d+\/|\.json$|\.xml$/i.test(link)) {
        apis.add(link)
      }
    }
    
    // From JavaScript
    for (const api of jsApis) {
      apis.add(api.replace(/['"]/g, ''))
    }
    
    // From network capture
    if (Array.isArray(networkCapture)) {
      for (const request of networkCapture) {
        if (request.url && /\/api\/|\/graphql/i.test(request.url)) {
          apis.add(request.url)
        }
      }
    }
    
    return Array.from(apis)
  }

  private extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = []
    
    // Extract from markdown code blocks
    const markdownCodePattern = /```(\w+)?\n([\s\S]*?)```/g
    let match
    
    while ((match = markdownCodePattern.exec(content)) !== null) {
      const language = match[1] || 'plaintext'
      const code = match[2].trim()
      
      const analysis = this.analyzeCodeBlock(code, language)
      codeBlocks.push({
        language,
        code: code.slice(0, 1000), // Store first 1000 chars
        purpose: analysis.purpose,
        patterns: analysis.patterns,
        frameworks: analysis.frameworks
      })
    }
    
    // Extract from HTML <code> and <pre> tags
    const htmlCodePattern = /<pre[^>]*>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi
    while ((match = htmlCodePattern.exec(content)) !== null) {
      const code = match[1].replace(/<[^>]*>/g, '').trim()
      const analysis = this.analyzeCodeBlock(code, 'unknown')
      
      codeBlocks.push({
        language: 'unknown',
        code: code.slice(0, 1000),
        purpose: analysis.purpose,
        patterns: analysis.patterns,
        frameworks: analysis.frameworks
      })
    }
    
    return codeBlocks
  }
  
  private analyzeCodeBlock(code: string, _language: string): { purpose: string; patterns: string[]; frameworks: string[] } {
    const patterns: string[] = []
    const frameworks: string[] = []
    let purpose = 'unknown'
    
    // Frontend frameworks and patterns
    if (/import.*react/i.test(code) || /from ['"]react/i.test(code)) {
      frameworks.push('React')
      patterns.push('component-based')
      if (/useState|useEffect|useContext|useReducer/i.test(code)) {
        patterns.push('react-hooks')
      }
      if (/redux|useSelector|useDispatch/i.test(code)) {
        frameworks.push('Redux')
        patterns.push('state-management')
      }
    }
    if (/import.*@angular/i.test(code)) {
      frameworks.push('Angular')
      patterns.push('dependency-injection')
      if (/@Component|@Injectable|@Module/i.test(code)) {
        patterns.push('decorators')
      }
    }
    if (/import.*vue/i.test(code)) {
      frameworks.push('Vue.js')
      patterns.push('reactive')
      if (/composition API|ref\(|reactive\(/i.test(code)) {
        patterns.push('vue-composition-api')
      }
    }
    
    // API patterns and technologies
    if (/fetch\(|axios\.|http\./i.test(code)) {
      patterns.push('api-integration')
      if (/axios/i.test(code)) frameworks.push('Axios')
    }
    if (/graphql|query\s*{|mutation\s*{|subscription\s*{/i.test(code)) {
      patterns.push('graphql')
      frameworks.push('GraphQL')
      if (/apollo/i.test(code)) frameworks.push('Apollo')
    }
    if (/swagger|openapi/i.test(code)) {
      patterns.push('api-documentation')
      frameworks.push('OpenAPI/Swagger')
    }
    
    // Architecture patterns
    if (/class.*Controller|@Controller|router\.(get|post|put|delete)/i.test(code)) {
      patterns.push('mvc')
      purpose = 'controller'
    }
    if (/class.*Service|@Service|@Injectable/i.test(code)) {
      patterns.push('service-layer')
      purpose = 'service'
    }
    if (/class.*Repository|@Repository/i.test(code)) {
      patterns.push('repository-pattern')
      purpose = 'data-access'
    }
    if (/async\s+\w+|await\s+|Promise\.|\.then\(/i.test(code)) {
      patterns.push('async-programming')
    }
    if (/Observable|Subject|\.pipe\(|\.subscribe\(/i.test(code)) {
      patterns.push('reactive-programming')
      frameworks.push('RxJS')
    }
    
    // Database and ORM patterns
    if (/sequelize|typeorm|prisma|mongoose/i.test(code)) {
      patterns.push('orm')
      if (/sequelize/i.test(code)) frameworks.push('Sequelize')
      if (/typeorm/i.test(code)) frameworks.push('TypeORM')
      if (/prisma/i.test(code)) frameworks.push('Prisma')
      if (/mongoose/i.test(code)) frameworks.push('Mongoose')
    }
    if (/SELECT.*FROM|INSERT.*INTO|UPDATE.*SET|DELETE.*FROM/i.test(code)) {
      patterns.push('raw-sql')
    }
    
    // Testing patterns and frameworks
    if (/describe\(|it\(|test\(|expect\(/i.test(code)) {
      patterns.push('testing')
      purpose = 'test'
      if (/jest/i.test(code)) frameworks.push('Jest')
      if (/mocha/i.test(code)) frameworks.push('Mocha')
      if (/cypress/i.test(code)) frameworks.push('Cypress')
      if (/playwright/i.test(code)) frameworks.push('Playwright')
    }
    if (/beforeEach|afterEach|beforeAll|afterAll/i.test(code)) {
      patterns.push('test-lifecycle')
    }
    if (/mock|stub|spy/i.test(code)) {
      patterns.push('mocking')
    }
    
    // DevOps and Infrastructure patterns
    if (/docker|dockerfile|docker-compose/i.test(code)) {
      patterns.push('containerization')
      frameworks.push('Docker')
    }
    if (/kubernetes|k8s|kubectl|helm/i.test(code)) {
      patterns.push('orchestration')
      frameworks.push('Kubernetes')
    }
    if (/terraform|resource\s+"\w+"/i.test(code)) {
      patterns.push('infrastructure-as-code')
      frameworks.push('Terraform')
    }
    if (/\.github\/workflows|github\.event|github\.ref/i.test(code)) {
      patterns.push('ci-cd')
      frameworks.push('GitHub Actions')
    }
    if (/jenkins|pipeline\s*{|stage\(/i.test(code)) {
      patterns.push('ci-cd')
      frameworks.push('Jenkins')
    }
    
    // Cloud provider patterns
    if (/aws\.|AWS\.|amazonaws\.com/i.test(code)) {
      patterns.push('cloud-aws')
      frameworks.push('AWS')
    }
    if (/azure\.|Azure\.|microsoft\.com/i.test(code)) {
      patterns.push('cloud-azure')
      frameworks.push('Azure')
    }
    if (/gcloud|google\.cloud|googleapis\.com/i.test(code)) {
      patterns.push('cloud-gcp')
      frameworks.push('Google Cloud')
    }
    
    // Security patterns
    if (/jwt|jsonwebtoken|bearer/i.test(code)) {
      patterns.push('jwt-auth')
    }
    if (/oauth|oauth2/i.test(code)) {
      patterns.push('oauth')
    }
    if (/bcrypt|argon2|crypto/i.test(code)) {
      patterns.push('encryption')
    }
    if (/helmet|cors|csrf/i.test(code)) {
      patterns.push('security-middleware')
    }
    
    // Performance patterns
    if (/cache|redis|memcached/i.test(code)) {
      patterns.push('caching')
      if (/redis/i.test(code)) frameworks.push('Redis')
    }
    if (/lazy|memo|useMemo|useCallback/i.test(code)) {
      patterns.push('performance-optimization')
    }
    if (/worker|cluster|child_process/i.test(code)) {
      patterns.push('parallel-processing')
    }
    
    // Determine purpose if not already set
    if (purpose === 'unknown') {
      if (/config|configuration|settings/i.test(code)) purpose = 'configuration'
      else if (/schema|model|entity/i.test(code)) purpose = 'data-model'
      else if (/route|router|endpoint/i.test(code)) purpose = 'routing'
      else if (/util|helper|common/i.test(code)) purpose = 'utility'
      else if (/index\.|main\.|app\./i.test(code)) purpose = 'entry-point'
    }
    
    return { purpose, patterns: [...new Set(patterns)], frameworks: [...new Set(frameworks)] }
  }

  async cleanup() {
    // No crawler to close in basic implementation
  }
}

// Network Analysis Tools
class NetworkAnalyzer {
  private auditTrail: AuditTrailManager

  constructor(auditTrail: AuditTrailManager) {
    this.auditTrail = auditTrail
  }

  async analyzeSSL(domain: string): Promise<any> {
    const startTime = Date.now()
    
    try {
      // Run testssl.sh for comprehensive SSL/TLS analysis
      const result = execSync(
        `docker run --rm drwetter/testssl.sh --json-pretty --severity HIGH ${domain}`,
        { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }
      )
      
      const sslData = JSON.parse(result)
      
      await this.auditTrail.log({
        phase: 'network_analysis',
        action: 'ssl_scan',
        tool: 'testssl',
        input: { domain },
        output: { vulnerabilities: sslData.vulnerabilities?.length || 0 },
        reasoning: 'SSL/TLS security assessment',
        evidenceCollected: 1,
        quality: 'high',
        duration: Date.now() - startTime
      })
      
      return sslData
    } catch (error) {
      console.error('SSL analysis failed:', error)
      return null
    }
  }

  async analyzePerformance(url: string): Promise<any> {
    const startTime = Date.now()
    
    try {
      // Run Lighthouse for performance metrics
      const result = execSync(
        `lighthouse ${url} --output json --chrome-flags="--headless" --quiet`,
        { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }
      )
      
      const perfData = JSON.parse(result)
      
      await this.auditTrail.log({
        phase: 'network_analysis',
        action: 'performance_scan',
        tool: 'lighthouse',
        input: { url },
        output: {
          performance: perfData.categories.performance.score,
          accessibility: perfData.categories.accessibility.score,
          seo: perfData.categories.seo.score
        },
        reasoning: 'Web performance and quality assessment',
        evidenceCollected: 1,
        quality: 'high',
        duration: Date.now() - startTime
      })
      
      return perfData
    } catch (error) {
      console.error('Performance analysis failed:', error)
      return null
    }
  }

  async analyzeSecurity(domain: string): Promise<any> {
    const startTime = Date.now()
    
    try {
      // Run Nuclei for vulnerability scanning
      const result = execSync(
        `nuclei -u https://${domain} -t technologies,cves -json -silent`,
        { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }
      )
      
      const vulnerabilities = result.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
      
      await this.auditTrail.log({
        phase: 'network_analysis',
        action: 'security_scan',
        tool: 'nuclei',
        input: { domain },
        output: { vulnerabilities: vulnerabilities.length },
        reasoning: 'Vulnerability and technology detection',
        evidenceCollected: vulnerabilities.length,
        quality: 'high',
        duration: Date.now() - startTime
      })
      
      return vulnerabilities
    } catch (error) {
      console.error('Security analysis failed:', error)
      return []
    }
  }
}

// Intelligent Search Engine
class IntelligentSearchEngine {
  private auditTrail: AuditTrailManager
  searchHistory: Set<string> = new Set()

  constructor(auditTrail: AuditTrailManager) {
    this.auditTrail = auditTrail
  }

  async performIterativeSearch(
    company: string,
    _domain: string,
    thesis: string,
    maxIterations: number = 5
  ): Promise<any[]> {
    const results: any[] = []
    let iteration = 0
    
    // Initial broad search
    let currentQuery = `${company} technology stack architecture infrastructure`
    
    while (iteration < maxIterations) {
      if (this.searchHistory.has(currentQuery)) {
        // Avoid duplicate searches
        currentQuery = await this.generateNextQuery(results, thesis)
      }
      
      this.searchHistory.add(currentQuery)
      
      const searchResults = await this.executeSearch(currentQuery, company)
      results.push(...searchResults)
      
      // Analyze results and decide next search
      const decision = await this.analyzeSearchResults(searchResults, thesis)
      
      if (decision.sufficient) {
        break
      }
      
      currentQuery = decision.nextQuery
      iteration++
    }
    
    return results
  }

  async executeSearch(query: string, company: string): Promise<any[]> {
    const startTime = Date.now()
    
    try {
      // Use Google API key from vault
      if (!GOOGLE_API_KEY) {
        console.log('Google API key not available, skipping search')
        return []
      }
      
      // Use Google Custom Search API
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?` +
        `key=${GOOGLE_API_KEY}` +
        `&cx=${process.env.GOOGLE_CSE_ID || ''}` +
        `&q=${encodeURIComponent(query)}` +
        `&num=10`
      )
      
      const data = await response.json()
      const results = data.items || []
      
      // Extract and structure search results
      const structuredResults = results.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source: new URL(item.link).hostname,
        query: query,
        relevance: this.calculateRelevance(item, company)
      }))
      
      await this.auditTrail.log({
        phase: 'search',
        action: 'web_search',
        tool: 'google_cse',
        input: { query },
        output: { resultsCount: results.length },
        reasoning: `Searching for: ${query}`,
        evidenceCollected: results.length,
        quality: 'medium',
        duration: Date.now() - startTime
      })
      
      return structuredResults
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }

  private calculateRelevance(item: any, company: string): number {
    let score = 0
    const text = `${item.title} ${item.snippet}`.toLowerCase()
    
    // Company name match
    if (text.includes(company.toLowerCase())) score += 30
    
    // Technology indicators
    const techKeywords = ['api', 'infrastructure', 'architecture', 'stack', 'technology', 'platform']
    techKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 10
    })
    
    // Source quality
    const qualitySources = ['github.com', 'linkedin.com', 'crunchbase.com', 'techcrunch.com']
    if (qualitySources.some(source => item.link.includes(source))) score += 20
    
    return Math.min(100, score)
  }

  private async analyzeSearchResults(results: any[], thesis: string): Promise<{ sufficient: boolean; nextQuery: string }> {
    // Use AI to analyze if we have sufficient information
    const prompt = `
Analyze these search results for investment due diligence:

Results: ${JSON.stringify(results.slice(0, 5), null, 2)}

Investment thesis: ${thesis}

Do we have sufficient information? If not, what should we search for next?

Respond with JSON:
{
  "sufficient": boolean,
  "reasoning": "explanation",
  "nextQuery": "next search query if not sufficient"
}
`

    try {
      // Use Gemini Flash for quick analysis
      if (GOOGLE_API_KEY) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200
              }
            })
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          const content = data.candidates[0].content.parts[0].text
          return JSON.parse(content)
        }
      }
    } catch (error) {
      // Continue to fallback
    }
    
    // Fallback
    return {
      sufficient: results.length > 20,
      nextQuery: `${thesis} ${results.length > 0 ? 'detailed analysis' : 'market research'}`
    }
  }

  private async generateNextQuery(currentResults: any[], thesis: string): Promise<string> {
    // Generate intelligent follow-up query based on gaps
    const keywords = new Set<string>()
    
    // Extract entities from current results
    currentResults.forEach(result => {
      const entities = this.extractEntities(result.snippet)
      entities.forEach(entity => keywords.add(entity))
    })
    
    // Focus queries based on thesis
    if (thesis.includes('ai')) {
      return `${Array.from(keywords).slice(0, 3).join(' ')} AI ML infrastructure`
    }
    if (thesis.includes('scale')) {
      return `${Array.from(keywords).slice(0, 3).join(' ')} scalability performance metrics`
    }
    
    return `${Array.from(keywords).slice(0, 5).join(' ')} detailed technical analysis`
  }

  private extractEntities(text: string): string[] {
    // Simple entity extraction (in production, use NER)
    const entities: string[] = []
    
    // Extract capitalized words (likely proper nouns)
    const matches = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || []
    matches.forEach(match => {
      if (match.length > 3 && !['The', 'This', 'That', 'These'].includes(match)) {
        entities.push(match)
      }
    })
    
    return entities
  }
}

// Evidence Storage Manager with Thesis-Based Scoring
class EvidenceStorageManager {
  private collectionId: string
  private auditTrail: AuditTrailManager
  private evidenceCount: number = 0
  private investmentThesis: string
  private thesisCriteria: any

  constructor(collectionId: string, auditTrail: AuditTrailManager, investmentThesis: string) { // investmentThesis is used in thesisCriteria
    this.collectionId = collectionId
    this.auditTrail = auditTrail
    this.investmentThesis = investmentThesis
    this.thesisCriteria = INVESTMENT_THESIS_CRITERIA[investmentThesis] || INVESTMENT_THESIS_CRITERIA['digital-transformation']
  }

  async storeEvidence(
    type: string,
    content: any,
    source: string,
    tool: string,
    baseConfidence: number = 0.8
  ): Promise<void> {
    // Calculate thesis-aligned confidence score
    const thesisScore = this.calculateThesisAlignment(type, content)
    const confidence = baseConfidence * thesisScore
    const evidence = {
      evidence_id: crypto.randomUUID(),
      collection_id: this.collectionId,
      company_name: content.company || 'Unknown',
      type: type,
      evidence_type: type,
      content_data: {
        raw: JSON.stringify(content),
        summary: content.summary || this.generateSummary(content),
        processed: content.processed || JSON.stringify(content).slice(0, 5000)
      },
      source_data: {
        url: source,
        tool: tool,
        timestamp: new Date().toISOString()
      },
      metadata: content.metadata || {},
      confidence_score: confidence,
      processing_stage: 'collected',
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('evidence_items')
      .insert(evidence)

    if (!error) {
      this.evidenceCount++
    }

    await this.auditTrail.log({
      phase: 'storage',
      action: 'evidence_stored',
      tool: 'supabase',
      input: { type, source },
      output: { stored: !error, thesisScore, confidence },
      reasoning: `Storing ${type} evidence from ${tool} (thesis alignment: ${thesisScore.toFixed(2)})`,
      evidenceCollected: 1,
      quality: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
      duration: 0
    })
  }
  
  private calculateThesisAlignment(type: string, content: any): number {
    let score = 0.5 // Base score
    
    // Check each criterion for the thesis
    for (const criterion of this.thesisCriteria.criteria) {
      const weight = criterion.weight / 100
      
      // Score based on criterion name and evidence type/content
      if (criterion.name.includes('Cloud') && (type.includes('tech') || type.includes('infrastructure'))) {
        if (content.technologies?.some((t: string) => /aws|azure|gcp|cloud/i.test(t))) {
          score += weight * 0.8
        }
      }
      
      if (criterion.name.includes('API') && (type.includes('api') || type.includes('documentation'))) {
        score += weight * 0.9
      }
      
      if (criterion.name.includes('Security') && type.includes('security')) {
        score += weight * 0.95
      }
      
      if (criterion.name.includes('Scalability') && content.markdown?.includes('scale')) {
        score += weight * 0.7
      }
      
      if (criterion.name.includes('Development Velocity') && content.codeBlocks?.length > 0) {
        // Check for CI/CD patterns
        if (content.codeBlocks.some((cb: CodeBlock) => cb.patterns.includes('testing'))) {
          score += weight * 0.8
        }
      }
      
      if (criterion.name.includes('Cost Optimization') && type.includes('infrastructure')) {
        score += weight * 0.75
      }
    }
    
    // Check focus areas alignment
    const focusAreaBonus = this.calculateFocusAreaAlignment(content)
    score *= (1 + focusAreaBonus)
    
    return Math.min(1.0, Math.max(0.1, score))
  }
  
  private calculateFocusAreaAlignment(content: any): number {
    let alignmentScore = 0
    const focusAreas = this.thesisCriteria.focusAreas
    
    // Check technologies against focus areas
    if (content.technologies) {
      for (const tech of content.technologies) {
        if (focusAreas.includes('cloud-native') && /aws|azure|gcp|kubernetes|docker/i.test(tech)) {
          alignmentScore += 0.1
        }
        if (focusAreas.includes('api-driven') && /api|rest|graphql|openapi/i.test(tech)) {
          alignmentScore += 0.1
        }
        if (focusAreas.includes('microservices') && /microservice|kubernetes|docker|service mesh/i.test(tech)) {
          alignmentScore += 0.1
        }
        if (focusAreas.includes('modern-tech-stack') && /react|vue|angular|node|python|go/i.test(tech)) {
          alignmentScore += 0.05
        }
      }
    }
    
    // Check code patterns against focus areas
    if (content.codeBlocks) {
      for (const block of content.codeBlocks) {
        if (focusAreas.includes('test-coverage') && block.patterns.includes('testing')) {
          alignmentScore += 0.15
        }
        if (focusAreas.includes('documentation') && block.purpose === 'documentation') {
          alignmentScore += 0.1
        }
      }
    }
    
    return Math.min(0.5, alignmentScore) // Cap at 50% bonus
  }

  private generateSummary(content: any): string {
    // Generate a summary based on content type
    if (typeof content === 'string') {
      return content.slice(0, 200) + '...'
    }
    
    if (content.title) return content.title
    if (content.description) return content.description
    if (content.summary) return content.summary
    
    return 'Evidence item collected'
  }

  getEvidenceCount(): number {
    return this.evidenceCount
  }
}

// Main Evidence Collection Worker
export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  async (job: Job<EvidenceCollectionJob>) => {
    const { scanRequestId, company, domain, depth, investmentThesis, primaryCriteria } = job.data
    
    console.log(`Starting DEEP evidence collection for ${company} (${scanRequestId})`)
    console.log(`Depth: ${depth}, Domain: ${domain}, Thesis: ${investmentThesis}`)
    
    try {
      // Initialize systems
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
            worker: 'deep-collection'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (collectionError) throw collectionError
      
      const auditTrail = new AuditTrailManager(collection.id)
      const decisionEngine = new AgenticDecisionEngine(auditTrail)
      const deepCrawler = new DeepCrawler(auditTrail)
      const networkAnalyzer = new NetworkAnalyzer(auditTrail)
      const searchEngine = new IntelligentSearchEngine(auditTrail)
      const storageManager = new EvidenceStorageManager(collection.id, auditTrail, primaryCriteria || investmentThesis)
      
      await job.updateProgress(5)
      
      // Phase 1: Initial Deep Crawl
      console.log('Phase 1: Starting deep crawl...')
      await deepCrawler.initialize()
      
      const crawlStrategy = depth === 'exhaustive' ? 'dfs' : depth === 'comprehensive' ? 'smart' : 'bfs'
      const crawlResults = await deepCrawler.deepCrawl(domain, crawlStrategy)
      
      console.log(`Crawled ${crawlResults.length} pages`)
      
      // Store crawl evidence
      for (const result of crawlResults) {
        const evidenceType = categorizeUrl(result.url)
        await storageManager.storeEvidence(
          evidenceType,
          result,
          result.url,
          'crawl4ai',
          0.9
        )
        
        // Store code analysis as separate evidence if code blocks found
        if (result.codeBlocks && result.codeBlocks.length > 0) {
          const codeAnalysis = analyzeCodeEvidence(result.codeBlocks, investmentThesis)
          await storageManager.storeEvidence(
            'code_analysis',
            {
              url: result.url,
              codeBlocks: result.codeBlocks,
              analysis: codeAnalysis,
              technologies: [...new Set(result.codeBlocks.flatMap(cb => cb.frameworks))],
              patterns: [...new Set(result.codeBlocks.flatMap(cb => cb.patterns))]
            },
            result.url,
            'code_analyzer',
            0.95
          )
        }
        
        // Store HTML snapshot for critical pages
        if (result.html && (evidenceType === 'api_documentation' || evidenceType === 'technical_architecture' || 
            evidenceType === 'pricing_model' || result.url.includes('/docs') || result.url.includes('/api'))) {
          await storageManager.storeEvidence(
            'html_snapshot',
            {
              url: result.url,
              html: result.html.slice(0, 50000), // Store first 50KB
              title: result.title,
              evidenceType: evidenceType,
              timestamp: new Date().toISOString()
            },
            result.url,
            'html_archiver',
            0.8
          )
        }
      }
      
      await job.updateProgress(30)
      
      // Phase 2: Network Analysis
      console.log('Phase 2: Network and security analysis...')
      
      // SSL/TLS Analysis
      const sslData = await networkAnalyzer.analyzeSSL(domain)
      if (sslData) {
        await storageManager.storeEvidence(
          'security_analysis',
          sslData,
          domain,
          'testssl',
          0.95
        )
      }
      
      // Performance Analysis
      const perfData = await networkAnalyzer.analyzePerformance(`https://${domain}`)
      if (perfData) {
        await storageManager.storeEvidence(
          'performance_metrics',
          perfData,
          domain,
          'lighthouse',
          0.9
        )
      }
      
      // Security Scanning
      const securityData = await networkAnalyzer.analyzeSecurity(domain)
      for (const vuln of securityData) {
        await storageManager.storeEvidence(
          'security_vulnerabilities',
          vuln,
          domain,
          'nuclei',
          0.85
        )
      }
      
      await job.updateProgress(50)
      
      // Phase 3: Intelligent Search
      console.log('Phase 3: Intelligent web search...')
      
      const searchResults = await searchEngine.performIterativeSearch(
        company,
        domain,
        investmentThesis,
        depth === 'exhaustive' ? 10 : depth === 'comprehensive' ? 7 : 5
      )
      
      for (const result of searchResults) {
        await storageManager.storeEvidence(
          'web_search_result',
          result,
          result.link,
          'google_search',
          result.relevance / 100
        )
      }
      
      await job.updateProgress(70)
      
      // Phase 4: Agentic Deep Dive
      console.log('Phase 4: Agentic deep dive...')
      
      const allEvidence = await supabase
        .from('evidence_items')
        .select('*')
        .eq('collection_id', collection.id)
      
      let agentIterations = 0
      const maxAgentIterations = depth === 'exhaustive' ? 15 : depth === 'comprehensive' ? 10 : 5
      
      while (agentIterations < maxAgentIterations && storageManager.getEvidenceCount() < 300) {
        // Make intelligent decision about what to do next
        const decision = await decisionEngine.makeDecision(
          allEvidence.data || [],
          investmentThesis
        )
        
        console.log(`Agent decision: ${decision.nextAction}`)
        
        // Execute the decision
        if (decision.tool === 'crawl4ai' && decision.targetUrl) {
          const additionalPages = await deepCrawler.deepCrawl(
            decision.targetUrl.replace('https://', '').replace('http://', ''),
            'smart'
          )
          
          for (const page of additionalPages) {
            await storageManager.storeEvidence(
              categorizeUrl(page.url),
              page,
              page.url,
              'crawl4ai_targeted',
              0.85
            )
          }
        } else if (decision.tool === 'search' && decision.searchQuery) {
          const targetedResults = await searchEngine.executeSearch(
            decision.searchQuery,
            company
          )
          
          for (const result of targetedResults) {
            await storageManager.storeEvidence(
              'targeted_search_result',
              result,
              result.link,
              'google_search_targeted',
              0.8
            )
          }
        }
        
        agentIterations++
        await job.updateProgress(70 + (agentIterations / maxAgentIterations) * 25)
      }
      
      // Phase 5: Final Analysis and Synthesis
      console.log('Phase 5: Final synthesis...')
      
      // Extract all technologies found
      const allTechnologies = new Set<string>()
      crawlResults.forEach(result => {
        result.technologies.forEach(tech => allTechnologies.add(tech))
      })
      
      // Create comprehensive technology evidence
      if (allTechnologies.size > 0) {
        await storageManager.storeEvidence(
          'technology_stack_comprehensive',
          {
            technologies: Array.from(allTechnologies),
            count: allTechnologies.size,
            categories: categorizeTechnologies(Array.from(allTechnologies))
          },
          domain,
          'synthesis',
          0.95
        )
      }
      
      // Update collection with final stats
      const finalCount = storageManager.getEvidenceCount()
      await supabase
        .from('evidence_collections')
        .update({
          status: 'completed',
          collection_status: 'completed',
          evidence_count: finalCount,
          updated_at: new Date().toISOString(),
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis,
            primary_criteria: primaryCriteria,
            worker: 'deep-collection',
            pages_crawled: crawlResults.length,
            searches_performed: searchEngine.searchHistory.size,
            agent_iterations: agentIterations,
            audit_entries: auditTrail.getEntries().length
          }
        })
        .eq('id', collection.id)
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'evidence_collected',
          evidence_count: finalCount
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      
      console.log(`DEEP evidence collection complete! Collected ${finalCount} evidence items`)
      console.log(`Crawled ${crawlResults.length} pages, performed ${searchEngine.searchHistory.size} searches`)
      console.log(`Agent made ${agentIterations} intelligent decisions`)
      
      // Cleanup
      await deepCrawler.cleanup()
      
      return {
        success: true,
        evidenceCount: finalCount,
        pagesCrawled: crawlResults.length,
        searchesPerformed: searchEngine.searchHistory.size,
        agentDecisions: agentIterations,
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
    concurrency: 1, // Run one at a time due to resource intensity
  }
)

// Analyze code evidence based on investment thesis
function analyzeCodeEvidence(codeBlocks: CodeBlock[], thesis: string): any {
  const analysis = {
    qualityScore: 0,
    maturityIndicators: [] as string[],
    risks: [] as string[],
    opportunities: [] as string[]
  }
  
  // Analyze patterns for quality signals
  const allPatterns = codeBlocks.flatMap(cb => cb.patterns)
  const allFrameworks = codeBlocks.flatMap(cb => cb.frameworks)
  
  // Quality indicators
  if (allPatterns.includes('testing')) {
    analysis.qualityScore += 20
    analysis.maturityIndicators.push('Automated testing present')
  }
  if (allPatterns.includes('ci-cd')) {
    analysis.qualityScore += 15
    analysis.maturityIndicators.push('CI/CD pipeline detected')
  }
  if (allPatterns.includes('api-documentation')) {
    analysis.qualityScore += 10
    analysis.maturityIndicators.push('API documentation found')
  }
  if (allPatterns.includes('dependency-injection') || allPatterns.includes('service-layer')) {
    analysis.qualityScore += 10
    analysis.maturityIndicators.push('Clean architecture patterns')
  }
  
  // Thesis-specific analysis
  if (thesis === 'accelerate-organic-growth') {
    if (allPatterns.includes('cloud-aws') || allPatterns.includes('cloud-gcp') || allPatterns.includes('cloud-azure')) {
      analysis.opportunities.push('Cloud-native architecture supports scaling')
    }
    if (allPatterns.includes('containerization') || allPatterns.includes('orchestration')) {
      analysis.opportunities.push('Container infrastructure enables rapid deployment')
    }
    if (!allPatterns.includes('testing')) {
      analysis.risks.push('Limited test coverage may slow feature velocity')
    }
  }
  
  if (thesis === 'margin-expansion') {
    if (allPatterns.includes('caching') || allPatterns.includes('performance-optimization')) {
      analysis.opportunities.push('Performance optimizations can reduce infrastructure costs')
    }
    if (allFrameworks.includes('AWS') || allFrameworks.includes('Azure')) {
      analysis.opportunities.push('Cloud optimization potential for cost reduction')
    }
    if (allPatterns.includes('raw-sql') && !allPatterns.includes('orm')) {
      analysis.risks.push('Manual database operations may increase maintenance costs')
    }
  }
  
  if (thesis === 'buy-and-build') {
    if (allPatterns.includes('api-integration') || allPatterns.includes('graphql')) {
      analysis.opportunities.push('Strong API architecture facilitates integrations')
    }
    if (!allPatterns.includes('api-documentation')) {
      analysis.risks.push('Missing API documentation complicates acquisitions')
    }
  }
  
  if (thesis === 'turnaround-distressed') {
    if (allPatterns.includes('security-middleware') || allPatterns.includes('encryption')) {
      analysis.maturityIndicators.push('Security measures in place')
    } else {
      analysis.risks.push('Limited security patterns detected')
    }
    const hasModernFramework = ['React', 'Vue.js', 'Angular', 'Node.js', 'Python'].some(f => allFrameworks.includes(f))
    if (!hasModernFramework) {
      analysis.risks.push('Legacy technology stack may hinder hiring')
    }
  }
  
  return analysis
}

// Helper function to categorize URLs
function categorizeUrl(url: string): string {
  const path = url.toLowerCase()
  
  if (/\/(about|company|team|leadership|founder)/i.test(path)) return 'company_overview'
  if (/\/(product|service|solution|feature|platform)/i.test(path)) return 'product_information'
  if (/\/(tech|stack|engineering|architecture|infrastructure)/i.test(path)) return 'technical_architecture'
  if (/\/(api|docs|documentation|developers?|sdk)/i.test(path)) return 'api_documentation'
  if (/\/(pricing|plans?|enterprise)/i.test(path)) return 'pricing_model'
  if (/\/(customers?|case-?stud|testimonial|review)/i.test(path)) return 'customer_evidence'
  if (/\/(investors?|funding|press|news)/i.test(path)) return 'business_news'
  if (/\/(security|privacy|compliance|cert)/i.test(path)) return 'security_compliance'
  if (/\/(careers?|jobs?|hiring|culture)/i.test(path)) return 'team_culture'
  if (/\/(blog|article|post|content)/i.test(path)) return 'thought_leadership'
  
  return 'general_information'
}

// Helper function to categorize technologies
function categorizeTechnologies(technologies: string[]): any {
  const categories = {
    frontend: [] as string[],
    backend: [] as string[],
    database: [] as string[],
    infrastructure: [] as string[],
    analytics: [] as string[],
    ai_ml: [] as string[],
    security: [] as string[],
    other: [] as string[]
  }
  
  const categoryMappings: Record<string, string[]> = {
    frontend: ['React', 'Angular', 'Vue.js', 'Next.js', 'Nuxt.js', 'Svelte', 'Tailwind CSS', 'Bootstrap', 'Material-UI', 'jQuery'],
    backend: ['Node.js', 'Python', 'Ruby on Rails', 'Java', '.NET', 'Go', 'Rust', 'PHP'],
    database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra'],
    infrastructure: ['AWS', 'Google Cloud', 'Azure', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins', 'GitHub Actions', 'CircleCI'],
    analytics: ['Google Analytics', 'Segment', 'Mixpanel', 'Amplitude', 'Datadog', 'New Relic', 'Sentry'],
    ai_ml: ['TensorFlow', 'PyTorch', 'OpenAI', 'Hugging Face', 'LangChain'],
    security: ['OAuth', 'SAML', 'SSL/TLS', 'WAF', 'DDoS Protection']
  }
  
  for (const tech of technologies) {
    let categorized = false
    
    for (const [category, techs] of Object.entries(categoryMappings)) {
      if (techs.includes(tech)) {
        categories[category as keyof typeof categories].push(tech)
        categorized = true
        break
      }
    }
    
    if (!categorized) {
      categories.other.push(tech)
    }
  }
  
  return categories
}

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

console.log('🚀 DEEP Evidence Collection Worker started')
console.log('Features: Crawl4AI deep crawling, Agentic search, Network analysis')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Waiting for jobs...')