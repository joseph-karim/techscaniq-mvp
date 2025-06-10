import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { URL } from 'url'

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
  confidence: number
  source: string
}

interface PageCharacteristics {
  hasJavaScript: boolean
  hasAPI: boolean
  securityHeaders: string[]
  contentLength: number
  title: string
  description: string
  techSignals: string[]
}

interface ToolDecision {
  tool: string
  reasoning: string
  priority: number
  expectedEvidence: number
}

interface ToolResult {
  success: boolean
  evidence: EvidenceItem[]
  characteristics: Partial<PageCharacteristics>
  duration: number
  error?: string
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

// Audit Trail System
class AuditTrail {
  private entries: any[] = []
  
  async log(entry: any) {
    this.entries.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...entry
    })
  }
  
  getTrail() {
    return this.entries
  }
  
  getSummary() {
    return {
      totalActions: this.entries.length,
      totalEvidence: this.entries.reduce((sum, e) => sum + e.evidenceCount, 0),
      byPhase: this.groupByPhase(),
      byTool: this.groupByTool()
    }
  }
  
  private groupByPhase() {
    return this.entries.reduce((acc, entry) => {
      if (!acc[entry.phase]) acc[entry.phase] = 0
      acc[entry.phase] += entry.evidenceCount
      return acc
    }, {} as Record<string, number>)
  }
  
  private groupByTool() {
    return this.entries.reduce((acc, entry) => {
      if (!acc[entry.tool]) acc[entry.tool] = 0
      acc[entry.tool] += entry.evidenceCount
      return acc
    }, {} as Record<string, number>)
  }
}

// Decision Engine - Intelligent tool selection
class DecisionEngine {
  private _audit: AuditTrail
  private collectedEvidence: Map<string, EvidenceItem[]> = new Map()
  private _pageAnalysis: Map<string, any> = new Map()
  
  constructor(audit: AuditTrail) {
    this._audit = audit
  }
  
  async makeToolDecision(context: any): Promise<ToolDecision> {
    const { url: _url, previousTools = [], pageCharacteristics = {}, evidenceCount = 0 } = context
    
    // Analyze current state
    const hasBasicHTML = previousTools.includes('html-collector')
    const hasDeepCrawl = previousTools.includes('deep-crawler')
    const hasAPIAnalysis = previousTools.includes('api-analyzer')
    const hasTechAnalysis = previousTools.includes('tech-analyzer')
    
    // Decision tree
    if (!hasBasicHTML) {
      return {
        tool: 'html-collector',
        reasoning: 'Need basic HTML content first',
        priority: 10,
        expectedEvidence: 5
      }
    }
    
    if (pageCharacteristics.hasAPI && !hasAPIAnalysis) {
      return {
        tool: 'api-analyzer',
        reasoning: 'API endpoints detected, extracting API documentation',
        priority: 9,
        expectedEvidence: 15
      }
    }
    
    if (pageCharacteristics.techSignals?.length > 0 && !hasTechAnalysis) {
      return {
        tool: 'tech-analyzer',
        reasoning: 'Technology signals detected, performing deep tech analysis',
        priority: 8,
        expectedEvidence: 20
      }
    }
    
    if (!hasDeepCrawl && evidenceCount < 50) {
      return {
        tool: 'deep-crawler',
        reasoning: 'Need more comprehensive evidence from linked pages',
        priority: 7,
        expectedEvidence: 30
      }
    }
    
    return {
      tool: '',
      reasoning: 'No more applicable tools',
      priority: 0,
      expectedEvidence: 0
    }
  }
  
  async shouldContinueLoop(context: any): Promise<boolean> {
    const { loopCount = 0, evidenceCount = 0, maxLoops = 10 } = context
    
    if (loopCount >= maxLoops) return false
    if (evidenceCount > 100) return false
    
    const decision = await this.makeToolDecision(context)
    if (!decision.tool) return false
    if (decision.expectedEvidence < 5 && evidenceCount > 50) return false
    
    return true
  }
  
  async recordEvidence(url: string, evidence: EvidenceItem[]) {
    if (!this.collectedEvidence.has(url)) {
      this.collectedEvidence.set(url, [])
    }
    this.collectedEvidence.get(url)!.push(...evidence)
  }
}

// Tool Executor - Handles actual tool execution
class ToolExecutor {
  private _audit: AuditTrail
  
  constructor(audit: AuditTrail) {
    this._audit = audit
  }
  
  async executeTool(toolName: string, url: string, context: any): Promise<ToolResult> {
    const startTime = Date.now()
    
    try {
      let result: ToolResult
      
      switch (toolName) {
        case 'html-collector':
          result = await this.executeHtmlCollector(url)
          break
        case 'deep-crawler':
          result = await this.executeDeepCrawler(url, context)
          break
        case 'tech-analyzer':
          result = await this.executeTechAnalyzer(url, context)
          break
        case 'api-analyzer':
          result = await this.executeApiAnalyzer(url, context)
          break
        default:
          result = { success: false, evidence: [], characteristics: {}, duration: 0 }
      }
      
      return {
        ...result,
        duration: Date.now() - startTime
      }
    } catch (error) {
      console.error(`Tool ${toolName} failed for ${url}:`, error)
      return {
        success: false,
        evidence: [],
        characteristics: {},
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  private async executeHtmlCollector(url: string): Promise<ToolResult> {
    const startTime = Date.now()
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TechScanIQ/1.0; +https://techscaniq.com/bot)'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Extract page characteristics
      const title = $('title').text() || 'Untitled'
      const description = $('meta[name="description"]').attr('content') || ''
      const hasJavaScript = /<script/.test(html)
      const hasAPI = /\/api\/|\/v\d+\//.test(html)
      
      // Extract technology signals
      const techSignals: string[] = []
      const techPatterns = [
        { pattern: /react|vue|angular|svelte/gi, name: 'Frontend Framework' },
        { pattern: /node\.js|python|ruby|java|\.net/gi, name: 'Backend Language' },
        { pattern: /aws|azure|gcp|google cloud/gi, name: 'Cloud Provider' },
        { pattern: /mongodb|postgres|mysql|redis/gi, name: 'Database' },
        { pattern: /kubernetes|docker|k8s/gi, name: 'Containerization' },
        { pattern: /jenkins|circleci|github actions/gi, name: 'CI/CD' }
      ]
      
      for (const { pattern, name } of techPatterns) {
        if (pattern.test(html)) {
          techSignals.push(name)
        }
      }
      
      // Extract security headers
      const securityHeaders = []
      const headers = response.headers
      if (headers.get('strict-transport-security')) securityHeaders.push('HSTS')
      if (headers.get('content-security-policy')) securityHeaders.push('CSP')
      if (headers.get('x-frame-options')) securityHeaders.push('X-Frame-Options')
      
      const evidence: EvidenceItem[] = [
        {
          url,
          title: `${title} - Page Content`,
          content: this.extractMainContent($ as any),
          type: 'webpage',
          metadata: {
            contentLength: html.length,
            hasJavaScript,
            hasAPI,
            techSignals,
            securityHeaders
          },
          confidence: 1.0,
          source: 'html-collector'
        }
      ]
      
      // Extract specific sections
      const sections = [
        { selector: '.about, #about, [class*="about"]', type: 'about' },
        { selector: '.team, #team, [class*="team"]', type: 'team' },
        { selector: '.tech, #tech, [class*="tech"], .technology', type: 'technology' },
        { selector: '.pricing, #pricing, [class*="pricing"]', type: 'pricing' },
        { selector: '.features, #features, [class*="features"]', type: 'features' }
      ]
      
      for (const { selector, type } of sections) {
        const content = $(selector).text().trim()
        if (content && content.length > 50) {
          evidence.push({
            url,
            title: `${title} - ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
            content: content.substring(0, 5000),
            type: `webpage-${type}`,
            metadata: { selector, length: content.length },
            confidence: 0.9,
            source: 'html-collector'
          })
        }
      }
      
      return {
        success: true,
        evidence,
        characteristics: {
          title,
          description,
          hasJavaScript,
          hasAPI,
          securityHeaders,
          contentLength: html.length,
          techSignals
        },
        duration: Date.now() - startTime
      }
    } catch (error) {
      console.error('HTML collection error:', error)
      return {
        success: false,
        evidence: [],
        characteristics: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }
  
  private extractMainContent($: cheerio.CheerioAPI): string {
    // Remove script and style elements
    $('script, style').remove()
    
    // Try to find main content areas
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '#content',
      '.main-content'
    ]
    
    for (const selector of contentSelectors) {
      const content = $(selector).text().trim()
      if (content && content.length > 100) {
        return content.substring(0, 10000)
      }
    }
    
    // Fallback to body content
    return $('body').text().trim().substring(0, 10000)
  }
  
  private async executeDeepCrawler(url: string, _context: any): Promise<ToolResult> {
    const startTime = Date.now()
    const evidence: EvidenceItem[] = []
    const baseUrl = new URL(url)
    
    try {
      // Discover linked pages
      const response = await fetch(url)
      const html = await response.text()
      const $ = cheerio.load(html)
      
      const links = new Set<string>()
      $('a[href]').each((_, elem) => {
        const href = $(elem).attr('href')
        if (href) {
          try {
            const linkUrl = new URL(href, url)
            if (linkUrl.hostname === baseUrl.hostname) {
              links.add(linkUrl.toString())
            }
          } catch {
            // Invalid URL, skip
          }
        }
      })
      
      // Prioritize important pages
      const importantPaths = ['/about', '/team', '/technology', '/api', '/docs', '/pricing', '/features', '/blog', '/careers']
      const prioritizedLinks = Array.from(links)
        .filter(link => importantPaths.some(path => link.includes(path)))
        .slice(0, 10)
      
      // Crawl prioritized pages
      for (const link of prioritizedLinks) {
        try {
          const pageResponse = await fetch(link)
          if (pageResponse.ok) {
            const pageHtml = await pageResponse.text()
            const $page = cheerio.load(pageHtml)
            const pageTitle = $page('title').text() || 'Untitled'
            
            evidence.push({
              url: link,
              title: pageTitle,
              content: this.extractMainContent($page as any),
              type: this.classifyPageType(link),
              metadata: {
                parent: url,
                depth: 1
              },
              confidence: 0.8,
              source: 'deep-crawler'
            })
          }
        } catch (error) {
          console.error(`Failed to crawl ${link}:`, error)
        }
      }
      
      return {
        success: true,
        evidence,
        characteristics: {
          // linkedPages: links.size,
          // crawledPages: evidence.length
        },
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        evidence: [],
        characteristics: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }
  
  private classifyPageType(url: string): string {
    if (url.includes('/about')) return 'about-page'
    if (url.includes('/team')) return 'team-page'
    if (url.includes('/tech') || url.includes('/technology')) return 'technology-page'
    if (url.includes('/api') || url.includes('/docs')) return 'api-documentation'
    if (url.includes('/pricing')) return 'pricing-page'
    if (url.includes('/blog')) return 'blog-post'
    if (url.includes('/careers') || url.includes('/jobs')) return 'careers-page'
    return 'webpage'
  }
  
  private async executeTechAnalyzer(url: string, _context: any): Promise<ToolResult> {
    const startTime = Date.now()
    const evidence: EvidenceItem[] = []
    
    try {
      const response = await fetch(url)
      const html = await response.text()
      
      // Analyze JavaScript files
      const scriptUrls = this.extractScriptUrls(html, url)
      const techStack = new Set<string>()
      
      for (const scriptUrl of scriptUrls.slice(0, 5)) {
        try {
          const scriptResponse = await fetch(scriptUrl)
          const scriptContent = await scriptResponse.text()
          
          // Detect frameworks and libraries
          if (scriptContent.includes('React')) techStack.add('React')
          if (scriptContent.includes('Vue')) techStack.add('Vue.js')
          if (scriptContent.includes('Angular')) techStack.add('Angular')
          if (scriptContent.includes('webpack')) techStack.add('Webpack')
          if (scriptContent.includes('jQuery')) techStack.add('jQuery')
        } catch {
          // Skip failed script fetches
        }
      }
      
      // Analyze meta tags and headers
      const $ = cheerio.load(html)
      const generator = $('meta[name="generator"]').attr('content')
      if (generator) techStack.add(generator)
      
      // Check for common tech indicators
      const techIndicators = {
        'wp-content': 'WordPress',
        'shopify': 'Shopify',
        'squarespace': 'Squarespace',
        'wix': 'Wix',
        'drupal': 'Drupal',
        'joomla': 'Joomla'
      }
      
      for (const [indicator, tech] of Object.entries(techIndicators)) {
        if (html.includes(indicator)) {
          techStack.add(tech)
        }
      }
      
      evidence.push({
        url,
        title: 'Technology Stack Analysis',
        content: `Detected technologies: ${Array.from(techStack).join(', ')}`,
        type: 'tech-stack',
        metadata: {
          technologies: Array.from(techStack),
          scriptCount: scriptUrls.length
        },
        confidence: 0.85,
        source: 'tech-analyzer'
      })
      
      return {
        success: true,
        evidence,
        characteristics: {
          // detectedTech: Array.from(techStack)
        },
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        evidence: [],
        characteristics: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }
  
  private extractScriptUrls(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html)
    const scripts: string[] = []
    
    $('script[src]').each((_, elem) => {
      const src = $(elem).attr('src')
      if (src) {
        try {
          const scriptUrl = new URL(src, baseUrl)
          scripts.push(scriptUrl.toString())
        } catch {
          // Invalid URL
        }
      }
    })
    
    return scripts
  }
  
  private async executeApiAnalyzer(url: string, _context: any): Promise<ToolResult> {
    const startTime = Date.now()
    const evidence: EvidenceItem[] = []
    
    try {
      // Common API documentation paths
      const apiPaths = ['/api', '/api/docs', '/documentation', '/developers', '/api/v1', '/api/v2', '/swagger', '/openapi']
      const baseUrl = new URL(url)
      
      for (const path of apiPaths) {
        try {
          const apiUrl = new URL(path, baseUrl.origin)
          const response = await fetch(apiUrl.toString())
          
          if (response.ok) {
            const content = await response.text()
            
            // Try to parse as JSON (might be OpenAPI spec)
            let apiSpec = null
            try {
              apiSpec = JSON.parse(content)
            } catch {
              // Not JSON, analyze as HTML
            }
            
            if (apiSpec && (apiSpec.openapi || apiSpec.swagger)) {
              // OpenAPI/Swagger spec found
              const endpoints = this.extractEndpointsFromSpec(apiSpec)
              evidence.push({
                url: apiUrl.toString(),
                title: 'API Specification',
                content: JSON.stringify(endpoints, null, 2),
                type: 'api-spec',
                metadata: {
                  version: apiSpec.openapi || apiSpec.swagger,
                  endpointCount: endpoints.length,
                  paths: Object.keys(apiSpec.paths || {})
                },
                confidence: 1.0,
                source: 'api-analyzer'
              })
            } else {
              // HTML API documentation
              const $ = cheerio.load(content)
              const apiEndpoints = this.extractApiEndpointsFromHtml($ as any)
              
              if (apiEndpoints.length > 0) {
                evidence.push({
                  url: apiUrl.toString(),
                  title: 'API Documentation',
                  content: apiEndpoints.join('\n'),
                  type: 'api-docs',
                  metadata: {
                    endpointCount: apiEndpoints.length
                  },
                  confidence: 0.8,
                  source: 'api-analyzer'
                })
              }
            }
          }
        } catch {
          // Skip failed API path
        }
      }
      
      return {
        success: true,
        evidence,
        characteristics: {
          hasAPI: evidence.length > 0
        },
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        evidence: [],
        characteristics: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }
  
  private extractEndpointsFromSpec(spec: any): any[] {
    const endpoints: any[] = []
    
    if (spec.paths) {
      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const [method, details] of Object.entries(methods as any)) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: (details as any).summary || '',
            operationId: (details as any).operationId || ''
          })
        }
      }
    }
    
    return endpoints
  }
  
  private extractApiEndpointsFromHtml($: cheerio.CheerioAPI): string[] {
    const endpoints: string[] = []
    
    // Look for common API endpoint patterns
    const text = $('body').text()
    const endpointPattern = /(?:GET|POST|PUT|DELETE|PATCH)\s+\/[a-zA-Z0-9\-_\/\{\}:]+/g
    const matches = text.match(endpointPattern)
    
    if (matches) {
      endpoints.push(...matches)
    }
    
    // Also look for code blocks with endpoints
    $('code, pre').each((_, elem) => {
      const code = $(elem).text()
      const codeMatches = code.match(endpointPattern)
      if (codeMatches) {
        endpoints.push(...codeMatches)
      }
    })
    
    return [...new Set(endpoints)]
  }
}

// Agentic Search System
class AgenticSearcher {
  
  constructor(_audit: AuditTrail) {
    // Audit trail can be used for logging search actions if needed
  }
  
  async performIterativeSearch(company: string, domain: string): Promise<EvidenceItem[]> {
    const evidence: EvidenceItem[] = []
    
    // Phase 1: Basic company search
    const basicSearches = [
      `${company} company overview`,
      `${company} technology stack`,
      `${company} funding investors`,
      `${company} team leadership`
    ]
    
    for (const query of basicSearches) {
      try {
        // Use Google Custom Search API or similar
        const results = await this.searchWeb(query)
        
        for (const result of results.slice(0, 3)) {
          evidence.push({
            url: result.link,
            title: result.title,
            content: result.snippet,
            type: 'search-result',
            metadata: {
              query,
              position: result.position
            },
            confidence: 0.7,
            source: 'web-search'
          })
        }
      } catch (error) {
        console.error(`Search failed for "${query}":`, error)
      }
    }
    
    // Phase 2: Deep technical search
    const technicalSearches = [
      `site:${domain} API documentation`,
      `${company} github open source`,
      `${company} engineering blog`,
      `${company} tech stack site:stackshare.io`
    ]
    
    for (const query of technicalSearches) {
      try {
        const results = await this.searchWeb(query)
        
        for (const result of results.slice(0, 2)) {
          evidence.push({
            url: result.link,
            title: result.title,
            content: result.snippet,
            type: 'technical-search',
            metadata: {
              query,
              position: result.position
            },
            confidence: 0.8,
            source: 'web-search'
          })
        }
      } catch (error) {
        console.error(`Technical search failed for "${query}":`, error)
      }
    }
    
    return evidence
  }
  
  private async searchWeb(query: string): Promise<any[]> {
    // In production, this would use Google Custom Search API or similar
    // For now, return empty results to avoid API costs
    console.log(`Would search for: "${query}"`)
    return []
  }
}

// Intelligent Crawler with Decision Loop
class IntelligentCrawler {
  private audit: AuditTrail
  private decisionEngine: DecisionEngine
  private toolExecutor: ToolExecutor
  
  constructor(audit: AuditTrail) {
    this.audit = audit
    this.decisionEngine = new DecisionEngine(audit)
    this.toolExecutor = new ToolExecutor(audit)
  }
  
  async crawlWithIntelligence(domain: string, _company: string): Promise<EvidenceItem[]> {
    const startTime = Date.now()
    const allEvidence: EvidenceItem[] = []
    
    // Discover important URLs
    const urls = await this.discoverUrls(domain)
    console.log(`Discovered ${urls.length} URLs on ${domain}`)
    
    // Process each URL with intelligent tool selection
    for (const url of urls) {
      const urlEvidence = await this.intelligentUrlProcessing(url)
      allEvidence.push(...urlEvidence)
    }
    
    await this.audit.log({
      phase: 'intelligent-crawl-complete',
      action: `Completed intelligent crawl of ${domain}`,
      tool: 'intelligent-crawler',
      input: { domain, urlCount: urls.length },
      output: { totalEvidence: allEvidence.length },
      reasoning: 'Full domain crawl with intelligent tool selection',
      evidenceCount: allEvidence.length,
      quality: 'high',
      duration: Date.now() - startTime
    })
    
    return allEvidence
  }
  
  private async intelligentUrlProcessing(url: string): Promise<EvidenceItem[]> {
    const evidence: EvidenceItem[] = []
    const context = {
      url,
      previousTools: [] as string[],
      pageCharacteristics: {},
      loopCount: 0,
      evidenceCount: 0
    }
    
    // Decision loop for this URL
    while (await this.decisionEngine.shouldContinueLoop(context)) {
      const decision = await this.decisionEngine.makeToolDecision(context)
      
      if (!decision.tool) break
      
      console.log(`[${url}] Loop ${context.loopCount}: Running ${decision.tool} - ${decision.reasoning}`)
      
      // Execute the chosen tool
      const toolResult = await this.toolExecutor.executeTool(decision.tool, url, context)
      
      if (toolResult.success) {
        evidence.push(...toolResult.evidence)
        context.previousTools.push(decision.tool)
        context.pageCharacteristics = { ...context.pageCharacteristics, ...toolResult.characteristics }
        context.evidenceCount = evidence.length
        
        // Record evidence for decision engine
        await this.decisionEngine.recordEvidence(url, toolResult.evidence)
        
        await this.audit.log({
          phase: 'url-processing',
          action: `Processed ${url} with ${decision.tool}`,
          tool: decision.tool,
          input: { url },
          output: { evidence: toolResult.evidence.length },
          reasoning: decision.reasoning,
          evidenceCount: toolResult.evidence.length,
          quality: 'high',
          duration: toolResult.duration
        })
      }
      
      context.loopCount++
    }
    
    console.log(`[${url}] Completed with ${evidence.length} pieces of evidence after ${context.loopCount} loops`)
    
    return evidence
  }
  
  private async discoverUrls(domain: string): Promise<string[]> {
    const urls = new Set<string>()
    const baseUrl = `https://${domain}`
    
    // Start with base URL
    urls.add(baseUrl)
    
    // Add common important paths
    const importantPaths = [
      '/about', '/team', '/technology', '/tech-stack', '/engineering',
      '/api', '/docs', '/documentation', '/developers',
      '/careers', '/jobs', '/investors', '/press',
      '/customers', '/case-studies', '/testimonials',
      '/pricing', '/features', '/security', '/privacy'
    ]
    
    for (const path of importantPaths) {
      urls.add(`${baseUrl}${path}`)
    }
    
    // Try to discover more URLs from sitemap
    try {
      const sitemapUrl = `${baseUrl}/sitemap.xml`
      const response = await fetch(sitemapUrl)
      
      if (response.ok) {
        const sitemapXml = await response.text()
        const urlPattern = /<loc>(https?:\/\/[^<]+)<\/loc>/g
        let match
        
        while ((match = urlPattern.exec(sitemapXml)) !== null) {
          const url = match[1]
          if (url.includes(domain)) {
            urls.add(url)
          }
        }
      }
    } catch {
      // Sitemap not available
    }
    
    return Array.from(urls).slice(0, 50) // Limit to 50 URLs for performance
  }
}

// Main Evidence Collection Function
async function collectEvidence(job: Job<EvidenceCollectionJob>) {
  const { scanRequestId, company, domain, investmentThesis, depth } = job.data
  
  const audit = new AuditTrail()
  const intelligentCrawler = new IntelligentCrawler(audit)
  const agenticSearcher = new AgenticSearcher(audit)
  
  const allEvidence: EvidenceItem[] = []
  const startTime = Date.now()
  
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
          investment_thesis: investmentThesis
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (collectionError) throw collectionError
    
    // Phase 1: Intelligent Web Crawling (10-20 minutes)
    console.log('Phase 1: Starting intelligent web crawl...')
    await job.updateProgress(10)
    
    const crawlEvidence = await intelligentCrawler.crawlWithIntelligence(domain, company)
    allEvidence.push(...crawlEvidence)
    
    console.log(`Collected ${crawlEvidence.length} items from web crawling`)
    await job.updateProgress(40)
    
    // Phase 2: Agentic Search (5-10 minutes)
    console.log('Phase 2: Starting agentic search...')
    
    const searchEvidence = await agenticSearcher.performIterativeSearch(company, domain)
    allEvidence.push(...searchEvidence)
    
    console.log(`Collected ${searchEvidence.length} items from web search`)
    await job.updateProgress(60)
    
    // Phase 3: Save evidence to database
    console.log('Phase 3: Saving evidence to database...')
    
    // Save evidence in batches
    const batchSize = 50
    for (let i = 0; i < allEvidence.length; i += batchSize) {
      const batch = allEvidence.slice(i, i + batchSize)
      
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
              tool: item.source,
              timestamp: new Date().toISOString()
            },
            metadata: item.metadata,
            confidence_score: item.confidence,
            processing_stage: 'raw',
            created_at: new Date().toISOString()
          }))
        )
      
      if (error) {
        console.error('Failed to save evidence batch:', error)
        throw error
      }
      
      const progress = 60 + (i / allEvidence.length) * 30
      await job.updateProgress(Math.round(progress))
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
          ...collection.metadata,
          audit_summary: audit.getSummary(),
          duration: Date.now() - startTime
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
    console.log('Audit summary:', audit.getSummary())
    
    return {
      success: true,
      collectionId: collection.id,
      itemCount: allEvidence.length,
      scanRequestId,
      auditSummary: audit.getSummary()
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
}

// Create the worker
export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  collectEvidence,
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

console.log('Evidence collection worker v2 started (with REAL web crawling)')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Waiting for jobs...')