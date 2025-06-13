import { Worker, Job, Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import Anthropic from '@anthropic-ai/sdk'
import { mapToValidEvidenceType, getEvidenceTypeFromContext } from './fix-evidence-types.js'
// @ts-ignore
const fetchTyped = fetch as any

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

// Research phases inspired by Chain of RAG
enum ResearchPhase {
  INITIAL_CONTEXT = 'initial_context',
  REFLECTION = 'reflection',
  EXTERNAL_VALIDATION = 'external_validation',
  TECHNICAL_ANALYSIS = 'technical_analysis',
  TARGETED_SEARCH = 'targeted_search',
  GAP_FILLING = 'gap_filling',
  SYNTHESIS = 'synthesis'
}

interface ResearchStrategy {
  required_evidence: string[]
  initial_keywords: string[]
  deep_keywords: string[]
  external_search_queries: string[]
  reflection_prompts: Record<string, string>
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

// Investment thesis strategies
const THESIS_STRATEGIES: Record<string, ResearchStrategy> = {
  'accelerate-organic-growth': {
    required_evidence: [
      'customer_reviews', 'product_ratings', 'user_satisfaction',
      'competitive_analysis', 'market_position', 'competitor_comparison',
      'technical_architecture', 'api_documentation', 'integration_capabilities',
      'performance_metrics', 'scalability_data', 'uptime_reliability',
      'business_model', 'pricing_strategy', 'revenue_model',
      'product_features', 'platform_capabilities', 'security_compliance',
      'market_trends', 'industry_analysis', 'growth_trajectory'
    ],
    initial_keywords: [
      'about', 'company', 'mission', 'team', 'product', 
      'pricing', 'customers', 'growth', 'market', 'technology',
      'platform', 'features', 'solutions', 'services'
    ],
    deep_keywords: [],
    external_search_queries: [
      'site:g2.com {domain} reviews ratings',
      'site:capterra.com {domain} reviews alternatives',
      'site:trustradius.com {domain} reviews',
      '{domain} vs competitors comparison',
      '{domain} alternative competitors reddit',
      '{domain} API documentation developer',
      '{domain} technical architecture blog',
      '{domain} performance benchmarks scalability',
      '{domain} customer case studies success',
      '{domain} pricing model business model',
      '{domain} integration capabilities webhook',
      'site:stackoverflow.com {domain} technical',
      'site:github.com {domain} open source',
      '{domain} security compliance certifications'
    ],
    reflection_prompts: {
      business_model: "What is their core business model and revenue generation approach?",
      growth_metrics: "What growth indicators and metrics are available?",
      scalability: "What evidence exists of their ability to scale?",
      technology: "What is their technology stack and architecture?",
      market_position: "What is their market position and competitive advantage?"
    }
  }
}

class DeepResearchCollector {
  private genAI: GoogleGenerativeAI | null = null
  private anthropic: Anthropic | null = null
  private strategy: ResearchStrategy
  private collectedEvidence: EvidenceItem[] = []
  private discoveredUrls: Set<string> = new Set()
  private crawledUrls: Set<string> = new Set()
  private evidenceTypes: Set<string> = new Set()
  private keywords: Set<string> = new Set()
  
  constructor(
    private company: string,
    private domain: string,
    private investmentThesis: string,
    private _apiKey?: string,
    private collectionId?: string
  ) {
    this.strategy = THESIS_STRATEGIES[investmentThesis] || THESIS_STRATEGIES['accelerate-organic-growth']
    this.strategy.initial_keywords.forEach(k => this.keywords.add(k))
    
    if (this._apiKey) {
      this.genAI = new GoogleGenerativeAI(this._apiKey)
    }
    
    // Initialize Anthropic for technical analysis orchestration
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey })
    }
  }
  
  async collectEvidence(job: Job<EvidenceCollectionJob>): Promise<EvidenceItem[]> {
    console.log(`🔬 Starting Deep Research for ${this.company} (${this.domain})`)
    console.log(`🎯 Investment Thesis: ${this.investmentThesis}`)
    console.log(`📋 Required Evidence: ${this.strategy.required_evidence.length} types`)
    
    let totalPages = 0
    const maxPages = 200
    const iterations = 7 // Added technical analysis phase
    
    for (let i = 1; i <= iterations && totalPages < maxPages; i++) {
      console.log(`\n🔄 Research Iteration ${i}/${iterations}`)
      
      // Determine phase based on iteration
      const phase = this.getPhaseForIteration(i)
      console.log(`📍 Phase: ${phase}`)
      
      // Execute research for this phase
      const pagesInIteration = await this.executePhase(phase, job, maxPages - totalPages)
      totalPages += pagesInIteration
      
      // Update progress
      const progress = Math.min(90, (i / iterations) * 90)
      await job.updateProgress(progress)
      
      // Reflect on findings
      if (i % 2 === 0 && this.genAI) {
        await this.reflectOnFindings()
      }
    }
    
    // Final synthesis
    if (this.genAI) {
      await this.synthesizeFindings()
    }
    
    console.log(`\n✅ Research Complete!`)
    console.log(`📊 Evidence collected: ${this.collectedEvidence.length} items`)
    console.log(`📄 Pages crawled: ${this.crawledUrls.size}`)
    console.log(`🏷️ Evidence types: ${Array.from(this.evidenceTypes).join(', ')}`)
    
    return this.collectedEvidence
  }
  
  private getPhaseForIteration(iteration: number): ResearchPhase {
    const phaseMap: Record<number, ResearchPhase> = {
      1: ResearchPhase.INITIAL_CONTEXT,
      2: ResearchPhase.REFLECTION,
      3: ResearchPhase.EXTERNAL_VALIDATION,
      4: ResearchPhase.TECHNICAL_ANALYSIS,
      5: ResearchPhase.TARGETED_SEARCH,
      6: ResearchPhase.GAP_FILLING,
      7: ResearchPhase.SYNTHESIS
    }
    return phaseMap[iteration] || ResearchPhase.TARGETED_SEARCH
  }
  
  private async executePhase(phase: ResearchPhase, _job: Job, maxPages: number): Promise<number> {
    let pagesCollected = 0
    
    switch (phase) {
      case ResearchPhase.INITIAL_CONTEXT:
        // Crawl main website pages
        const mainUrls = [
          `https://${this.domain}`,
          `https://${this.domain}/about`,
          `https://${this.domain}/about-us`,
          `https://${this.domain}/team`,
          `https://${this.domain}/product`,
          `https://${this.domain}/products`,
          `https://${this.domain}/pricing`,
          `https://${this.domain}/customers`,
          `https://${this.domain}/technology`,
          `https://${this.domain}/platform`,
          `https://${this.domain}/solutions`,
          `https://${this.domain}/features`,
          `https://${this.domain}/integrations`,
          `https://${this.domain}/security`,
          `https://${this.domain}/compliance`,
          `https://${this.domain}/company`,
          `https://${this.domain}/careers`,
          `https://${this.domain}/blog`,
          `https://${this.domain}/resources`,
          `https://${this.domain}/docs`,
          `https://${this.domain}/documentation`,
          `https://${this.domain}/api`,
          `https://${this.domain}/developers`,
          `https://${this.domain}/partners`,
          `https://${this.domain}/case-studies`,
          `https://${this.domain}/whitepapers`,
          `https://${this.domain}/webinars`,
          `https://${this.domain}/events`,
          `https://${this.domain}/news`,
          `https://${this.domain}/press`,
          `https://${this.domain}/contact`,
          `https://${this.domain}/support`,
          `https://${this.domain}/help`,
          `https://${this.domain}/faq`,
          `https://${this.domain}/legal`,
          `https://${this.domain}/privacy`,
          `https://${this.domain}/terms`
        ]
        
        console.log(`🕸️ Crawling ${mainUrls.length} main pages...`)
        for (const url of mainUrls) {
          if (pagesCollected >= maxPages) break
          if (!this.crawledUrls.has(url)) {
            const evidence = await this.crawlPage(url)
            if (evidence) {
              this.collectedEvidence.push(evidence)
              pagesCollected++
            }
          }
        }
        
        // Also crawl the homepage thoroughly to discover more links
        if (pagesCollected < maxPages) {
          const homepageEvidence = await this.crawlPage(`https://${this.domain}`)
          if (homepageEvidence) {
            // Extract all discovered links from homepage
            const discoveredFromHome = Array.from(this.discoveredUrls)
              .filter(url => url.includes(this.domain))
              .slice(0, 20)
            
            console.log(`🔗 Found ${discoveredFromHome.length} additional pages from homepage`)
            for (const url of discoveredFromHome) {
              if (pagesCollected >= maxPages) break
              if (!this.crawledUrls.has(url)) {
                const evidence = await this.crawlPage(url)
                if (evidence) {
                  this.collectedEvidence.push(evidence)
                  pagesCollected++
                }
              }
            }
          }
        }
        break
        
      case ResearchPhase.EXTERNAL_VALIDATION:
        // Search external sources
        if (this.genAI) {
          console.log('🌐 Performing external validation searches...')
          for (const queryTemplate of this.strategy.external_search_queries.slice(0, 5)) {
            if (pagesCollected >= maxPages) break
            const query = queryTemplate.replace('{domain}', this.domain)
            const evidence = await this.searchExternal(query)
            if (evidence) {
              this.collectedEvidence.push(...evidence)
              pagesCollected += evidence.length
            }
          }
        } else {
          console.log('⚠️  Skipping external validation - no API key configured')
          // Fallback: crawl more internal pages
          const internalUrls = Array.from(this.discoveredUrls)
            .filter(url => url.includes(this.domain))
            .slice(0, 10)
          for (const url of internalUrls) {
            if (pagesCollected >= maxPages) break
            if (!this.crawledUrls.has(url)) {
              const evidence = await this.crawlPage(url)
              if (evidence) {
                this.collectedEvidence.push(evidence)
                pagesCollected++
              }
            }
          }
        }
        break
        
      case ResearchPhase.TECHNICAL_ANALYSIS:
        // Claude-orchestrated technical analysis
        console.log('🔧 Starting Claude-orchestrated technical analysis...')
        pagesCollected += await this.runTechnicalAnalysisPhase(maxPages)
        break
        
      case ResearchPhase.TARGETED_SEARCH:
        // Deep dive into discovered URLs
        const discoveredArray = Array.from(this.discoveredUrls)
        const relevantUrls = discoveredArray
          .filter(url => !this.crawledUrls.has(url))
          .filter(url => this.isRelevantUrl(url))
          .slice(0, 20)
        
        for (const url of relevantUrls) {
          if (pagesCollected >= maxPages) break
          const evidence = await this.crawlPage(url)
          if (evidence) {
            this.collectedEvidence.push(evidence)
            pagesCollected++
          }
        }
        break
        
      case ResearchPhase.GAP_FILLING:
        // Fill evidence gaps
        const missingEvidence = this.strategy.required_evidence.filter(
          type => !this.evidenceTypes.has(type)
        )
        
        console.log(`🔍 Missing evidence types: ${missingEvidence.join(', ')}`)
        
        for (const evidenceType of missingEvidence.slice(0, 5)) {
          if (pagesCollected >= maxPages) break
          const evidence = await this.searchForSpecificEvidence(evidenceType)
          if (evidence) {
            this.collectedEvidence.push(...evidence)
            pagesCollected += evidence.length
          }
        }
        break
    }
    
    return pagesCollected
  }
  
  private async crawlPage(url: string): Promise<EvidenceItem | null> {
    try {
      console.log(`🌐 Crawling: ${url}`)
      this.crawledUrls.add(url)
      
      const response = await fetchTyped(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TechScanIQ/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 15000,
        redirect: 'follow'
      })
      
      if (!response.ok) {
        console.log(`❌ Failed to fetch ${url}: ${response.status}`)
        return null
      }
      
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Extract title and description
      const title = $('title').text() || $('h1').first().text() || 'No title'
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         $('p').first().text().slice(0, 200)
      
      // Extract links for discovery
      $('a[href]').each((_, elem) => {
        const href = $(elem).attr('href')
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).toString()
            if (absoluteUrl.includes(this.domain) || this.isRelevantExternalUrl(absoluteUrl)) {
              this.discoveredUrls.add(absoluteUrl)
            }
          } catch (e) {
            // Invalid URL
          }
        }
      })
      
      // Extract keywords from content
      const text = ($ as any).text()
      this.extractKeywords(text)
      
      // Determine evidence type
      const evidenceType = this.determineEvidenceType(url, title, text)
      this.evidenceTypes.add(evidenceType)
      
      // Extract structured data
      const structuredData = this.extractStructuredData($ as any, url)
      
      return {
        id: crypto.randomUUID(),
        type: evidenceType,
        source: {
          url,
          tool: 'deep-crawler',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: html.substring(0, 10000), // Limit size
          summary: `${title} - ${description}`,
          processed: structuredData
        },
        metadata: {
          title,
          description,
          wordCount: text.split(/\s+/).length,
          linksFound: $('a[href]').length,
          imagesFound: $('img').length
        },
        confidence: 0.85
      }
    } catch (error) {
      console.error(`❌ Error crawling ${url}:`, error)
      return null
    }
  }
  
  private async searchExternal(query: string): Promise<EvidenceItem[]> {
    if (!this.genAI) return []
    
    try {
      console.log(`🔍 External search: ${query}`)
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
      
      const prompt = `Search for: ${query}
      
      Provide detailed, factual information about ${this.company}.
      Focus on:
      - Recent news and updates
      - Financial information
      - Market analysis
      - Customer feedback
      - Technology insights
      
      Format your response as a JSON array of findings, each with:
      {
        "title": "Finding title",
        "summary": "Brief summary",
        "details": "Detailed information",
        "source": "Source if available",
        "date": "Date if available",
        "relevance": "Why this is relevant"
      }`
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Parse JSON findings
      let findings: any[] = []
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          findings = JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        // If JSON parsing fails, create a single finding
        findings = [{
          title: `Search results for: ${query}`,
          summary: text.substring(0, 200),
          details: text
        }]
      }
      
      return findings.map((finding: any) => ({
        id: crypto.randomUUID(),
        type: this.getEvidenceTypeFromQuery(query),
        source: {
          query,
          tool: 'gemini-search',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: JSON.stringify(finding),
          summary: finding.summary || finding.title,
          processed: finding.details || finding.summary
        },
        metadata: {
          ...finding,
          searchQuery: query
        },
        confidence: 0.75
      }))
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }
  
  private async searchForSpecificEvidence(evidenceType: string): Promise<EvidenceItem[]> {
    const queries: Record<string, string[]> = {
      financial_metrics: [
        `${this.company} revenue earnings financial results`,
        `${this.company} funding valuation investors`
      ],
      customer_reviews: [
        `${this.company} customer reviews testimonials`,
        `${this.company} user feedback ratings`
      ],
      technology_stack: [
        `${this.company} technology stack architecture`,
        `${this.company} engineering blog technical`
      ],
      team_strength: [
        `${this.company} leadership team executives`,
        `${this.company} employees culture hiring`
      ],
      competitive_advantage: [
        `${this.company} vs competitors comparison`,
        `${this.company} market differentiation unique`
      ]
    }
    
    const searchQueries = queries[evidenceType] || [`${this.company} ${evidenceType}`]
    const evidence: EvidenceItem[] = []
    
    for (const query of searchQueries) {
      const results = await this.searchExternal(query)
      evidence.push(...results)
    }
    
    return evidence
  }
  
  private async reflectOnFindings(): Promise<void> {
    if (!this.genAI || this.collectedEvidence.length === 0) return
    
    console.log(`\n🤔 Reflecting on ${this.collectedEvidence.length} findings...`)
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    // Summarize findings by type
    const findingsByType: Record<string, any[]> = {}
    this.collectedEvidence.forEach(item => {
      if (!findingsByType[item.type]) findingsByType[item.type] = []
      findingsByType[item.type].push({
        summary: item.content.summary,
        url: item.source.url || item.source.query
      })
    })
    
    const reflectionPrompt = `Analyze these findings about ${this.company}:
    
    ${JSON.stringify(findingsByType, null, 2)}
    
    Based on these findings:
    1. What key insights emerge?
    2. What evidence gaps remain?
    3. What additional searches would be valuable?
    4. What are the investment implications?
    
    Provide a structured analysis.`
    
    try {
      const result = await model.generateContent(reflectionPrompt)
      const response = await result.response
      const reflection = response.text()
      
      // Add reflection as evidence
      this.collectedEvidence.push({
        id: crypto.randomUUID(),
        type: mapToValidEvidenceType('market_analysis'),
        source: {
          tool: 'gemini-reflection',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: reflection,
          summary: 'Interim analysis and reflection on findings',
          processed: reflection
        },
        metadata: {
          evidenceCount: this.collectedEvidence.length,
          evidenceTypes: Array.from(this.evidenceTypes)
        },
        confidence: 0.9
      })
      
      // Extract new keywords from reflection
      this.extractKeywords(reflection)
    } catch (error) {
      console.error('Reflection error:', error)
    }
  }
  
  private async synthesizeFindings(): Promise<void> {
    if (!this.genAI || this.collectedEvidence.length === 0) return
    
    console.log(`\n🎯 Synthesizing ${this.collectedEvidence.length} evidence items...`)
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    // Group evidence by investment criteria
    const evidenceSummary = {
      total: this.collectedEvidence.length,
      types: Array.from(this.evidenceTypes),
      sources: [...new Set(this.collectedEvidence.map(e => e.source.tool))],
      highConfidence: this.collectedEvidence.filter(e => e.confidence >= 0.8).length
    }
    
    const synthesisPrompt = `Synthesize investment analysis for ${this.company}:
    
    Investment Thesis: ${this.investmentThesis}
    Evidence Collected: ${evidenceSummary.total} items
    Evidence Types: ${evidenceSummary.types.join(', ')}
    
    Key Findings Summary:
    ${this.collectedEvidence
      .filter(e => e.confidence >= 0.8)
      .slice(0, 20)
      .map(e => `- [${e.type}] ${e.content.summary}`)
      .join('\n')}
    
    Provide:
    1. Investment thesis alignment (0-100)
    2. Key strengths for this thesis
    3. Key risks or concerns  
    4. Critical evidence gaps
    5. Overall investment recommendation
    
    Format as structured JSON.`
    
    try {
      const result = await model.generateContent(synthesisPrompt)
      const response = await result.response
      const synthesis = response.text()
      
      // Add synthesis as final evidence
      this.collectedEvidence.push({
        id: crypto.randomUUID(),
        type: mapToValidEvidenceType('market_analysis'),
        source: {
          tool: 'gemini-synthesis',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: synthesis,
          summary: 'Comprehensive investment analysis synthesis',
          processed: synthesis
        },
        metadata: {
          evidenceSummary,
          investmentThesis: this.investmentThesis
        },
        confidence: 0.95
      })
    } catch (error) {
      console.error('Synthesis error:', error)
    }
  }
  
  private determineEvidenceType(url: string, _title: string, content: string): string {
    const urlLower = url.toLowerCase()
    const contentLower = content.toLowerCase()
    
    // URL-based detection (using only VALID types from database)
    if (urlLower.includes('/about') || urlLower.includes('/team') || urlLower.includes('/careers')) {
      return 'business_search';
    }
    if (urlLower.includes('/pricing') || urlLower.includes('/customers')) {
      return 'business_search';
    }
    if (urlLower.includes('/technology') || urlLower.includes('/tech') || urlLower.includes('/platform')) {
      return 'technology_stack';
    }
    if (urlLower.includes('/security')) {
      return 'security_analysis';
    }
    if (urlLower.includes('/api') || urlLower.includes('/docs') || urlLower.includes('/developer')) {
      return 'api_response';
    }
    if (urlLower.includes('/blog') || urlLower.includes('/news')) {
      return 'webpage_content';
    }
    if (urlLower.includes('/integrations')) {
      return 'technology_stack';
    }
    
    // Content-based detection
    if (contentLower.includes('revenue') || contentLower.includes('funding')) {
      return 'business_search';
    }
    if (contentLower.includes('customers love') || contentLower.includes('testimonial')) {
      return 'business_search';
    }
    if (contentLower.includes('market leader') || contentLower.includes('competitive')) {
      return 'business_search';
    }
    
    // Default to webpage_content
    return 'webpage_content';
  }
  
  private extractStructuredData($: cheerio.CheerioAPI, url: string): string {
    const structured: any = {}
    
    // Extract specific data based on page type
    if (url.includes('/team')) {
      structured.teamMembers = []
      $('.team-member, .person, [class*="team"]').each((_, elem) => {
        const name = $(elem).find('h3, h4, .name').text().trim()
        const role = $(elem).find('.role, .title, .position').text().trim()
        if (name) {
          structured.teamMembers.push({ name, role })
        }
      })
    }
    
    if (url.includes('/pricing')) {
      structured.pricingPlans = []
      $('.pricing-plan, .price-card, [class*="pricing"]').each((_, elem) => {
        const name = $(elem).find('h3, h4, .plan-name').text().trim()
        const price = $(elem).find('.price, .amount').text().trim()
        if (name) {
          structured.pricingPlans.push({ name, price })
        }
      })
    }
    
    // Extract any JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const jsonLd = JSON.parse($(elem).html() || '{}')
        structured.jsonLd = jsonLd
      } catch (e) {
        // Invalid JSON
      }
    })
    
    return JSON.stringify(structured)
  }
  
  private extractKeywords(text: string): void {
    // Simple keyword extraction
    const words = text.toLowerCase().split(/\s+/)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])
    
    words.forEach(word => {
      if (word.length > 4 && !commonWords.has(word) && /^[a-z]+$/.test(word)) {
        this.keywords.add(word)
      }
    })
  }
  
  private isRelevantUrl(url: string): boolean {
    const relevant = [
      'about', 'team', 'product', 'pricing', 'customers', 'technology',
      'platform', 'features', 'security', 'blog', 'resources', 'api',
      'docs', 'careers', 'company', 'solutions', 'integrations'
    ]
    return relevant.some(term => url.toLowerCase().includes(term))
  }
  
  private isRelevantExternalUrl(url: string): boolean {
    const relevant = [
      'techcrunch.com', 'venturebeat.com', 'reuters.com', 'bloomberg.com',
      'businessinsider.com', 'forbes.com', 'wsj.com', 'linkedin.com',
      'github.com', 'producthunt.com', 'g2.com', 'capterra.com',
      'glassdoor.com', 'indeed.com', 'crunchbase.com'
    ]
    return relevant.some(domain => url.includes(domain))
  }
  
  private getEvidenceTypeFromQuery(query: string): string {
    return getEvidenceTypeFromContext(query, 'gemini-search');
  }
  
  // Claude-orchestrated technical analysis phase
  private async runTechnicalAnalysisPhase(_maxPages: number): Promise<number> {
    if (!this.anthropic) {
      console.log('⚠️  Skipping technical analysis - no Anthropic API key configured')
      return 0
    }
    
    let toolsExecuted = 0
    
    try {
      // Have Claude analyze what technical evidence we need
      const message = await this.anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 2000,
        temperature: 0.3,
        system: `You are a technical due diligence analyst. Your job is to orchestrate technical analysis tools to gather deep technical intelligence about companies.

Available technical analysis tools:
1. Playwright Crawler - Deep website crawling with browser automation, JavaScript execution, technology detection
2. Webtech Analyzer - Technology stack detection, framework analysis, infrastructure identification  
3. Security Scanner - Security headers, SSL analysis, vulnerability assessment, compliance checks

Current evidence collected: ${this.collectedEvidence.length} items
Evidence types found: ${Array.from(this.evidenceTypes).join(', ')}
Company domain: ${this.domain}

Your goal is to determine which technical analysis tools should be run to gather the most valuable evidence for a PE tech due diligence on ${this.company}.`,
        messages: [
          {
            role: 'user',
            content: `Analyze ${this.company} (${this.domain}) for ${this.investmentThesis} investment thesis.

Current evidence summary:
${this.collectedEvidence.slice(0, 5).map(e => `- ${e.type}: ${(e as any).summary?.substring(0, 100) || (typeof e.content === 'string' ? e.content : e.content.raw || '').substring(0, 100)}...`).join('\\n')}

What technical analysis should we run? Consider:
1. Product quality assessment through code/architecture analysis
2. Competitive technical positioning  
3. Security and compliance posture
4. Performance and scalability indicators
5. Technology modernization and technical debt

Respond with JSON format:
{
  "tools_to_run": [
    {
      "tool": "playwright-crawler | webtech-analyzer | security-scanner",
      "priority": "high | medium | low", 
      "reason": "why this tool is needed",
      "targets": ["specific URLs or pages to analyze"]
    }
  ],
  "evidence_gaps": ["what technical evidence is missing"],
  "analysis_focus": "primary area of technical concern to investigate"
}`
          }
        ]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = responseText.match(/\`\`\`json\\n([\\s\\S]*?)\\n\`\`\`/) || responseText.match(/({[\\s\\S]*})/)
      
      if (!jsonMatch) {
        console.log('⚠️  Claude response could not be parsed as JSON')
        return 0
      }

      const analysisplan = JSON.parse(jsonMatch[1])
      console.log(`🎯 Claude Technical Analysis Plan: ${analysisplan.analysis_focus}`)
      console.log(`🔧 Tools to run: ${analysisplan.tools_to_run?.length || 0}`)

      // Create queues for technical analysis workers
      const connection = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
      })

      // Execute each recommended tool
      for (const toolConfig of analysisplan.tools_to_run || []) {
        if (toolsExecuted >= 3) break // Limit to 3 tools per phase
        
        try {
          console.log(`🔧 Executing ${toolConfig.tool}: ${toolConfig.reason}`)
          
          switch (toolConfig.tool) {
            case 'playwright-crawler':
              const playwrightQueue = new Queue('playwright-crawler', { connection })
              await playwrightQueue.add('crawl', {
                url: `https://${this.domain}`,
                domain: this.domain,
                company: this.company,
                collectionId: this.collectionId || '00000000-0000-0000-0000-000000000000',
                depth: toolConfig.priority === 'high' ? 2 : 1,
                extractionTargets: toolConfig.targets
              })
              toolsExecuted++
              break
              
            case 'webtech-analyzer':
              const webtechQueue = new Queue('webtech-analyzer', { connection })
              await webtechQueue.add('analyze', {
                url: `https://${this.domain}`,
                domain: this.domain,
                company: this.company,
                collectionId: this.collectionId
              })
              toolsExecuted++
              break
              
            case 'security-scanner':
              const securityQueue = new Queue('security-scanner', { connection })
              await securityQueue.add('scan', {
                url: `https://${this.domain}`,
                domain: this.domain,
                company: this.company,
                collectionId: this.collectionId
              })
              toolsExecuted++
              break
          }
          
          // Wait a bit between tool executions
          await new Promise(resolve => setTimeout(resolve, 2000))
          
        } catch (error) {
          console.error(`Failed to execute ${toolConfig.tool}:`, error)
        }
      }

      // Wait for workers to complete (simplified - in production would poll job status)
      if (toolsExecuted > 0) {
        console.log(`⏳ Waiting for ${toolsExecuted} technical analysis tools to complete...`)
        await new Promise(resolve => setTimeout(resolve, 30000)) // Wait 30s for completion
      }

      await connection.quit()
      
    } catch (error) {
      console.error('Technical analysis orchestration failed:', error)
    }

    return toolsExecuted
  }
}

// Main worker
export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  async (job: Job<EvidenceCollectionJob>) => {
    // Check if this is a deep-research job
    if (job.name !== 'deep-research') {
      console.log(`[DeepResearch] Skipping job ${job.name}, not for this worker`)
      return null
    }
    
    const { scanRequestId, company, domain, depth, investmentThesis, primaryCriteria } = job.data
    
    console.log(`Starting deep research evidence collection for ${company} (${scanRequestId})`)
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
            worker: 'deep-research-collection'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (collectionError) throw collectionError
      
      // Get API key from environment
      const apiKey = process.env.GOOGLE_AI_API_KEY
      
      if (!apiKey) {
        console.log('⚠️  No GOOGLE_AI_API_KEY found in environment - external searches will be limited')
      } else {
        console.log('✅ Using Google AI API key for deep research')
      }
      
      // Initialize deep research collector
      const collector = new DeepResearchCollector(company, domain, investmentThesis, apiKey)
      
      // Collect evidence
      const evidence = await collector.collectEvidence(job)
      
      // Store evidence items in batches
      const batchSize = 50
      for (let i = 0; i < evidence.length; i += batchSize) {
        const batch = evidence.slice(i, i + batchSize)
        
        const evidenceRecords = batch.map(item => ({
          scan_request_id: scanRequestId,
          evidence_id: item.id,
          collection_id: collection.id,
          company_name: company,
          type: mapToValidEvidenceType(item.type),
          content_data: item.content,
          source_data: item.source,
          metadata: {
            ...item.metadata,
            confidence_score: item.confidence || 0.5,
            processing_stage: 'raw',
            source_tool: item.source.tool,
            title: item.content.summary?.substring(0, 200) || 'Evidence Item',
            url: item.source.url || '',
            breadcrumbs: [
              {
                step: 'collection',
                timestamp: new Date().toISOString(),
                tool: item.source.tool,
                url: item.source.url,
                query: item.source.query
              }
            ]
          }
        }))
        
        const { error: insertError } = await supabase
          .from('evidence_items')
          .insert(evidenceRecords)
        
        if (insertError) {
          console.error(`Error inserting evidence batch ${i/batchSize + 1}:`, insertError)
          throw insertError
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
            evidence_types: [...new Set(evidence.map(e => e.type))],
            sources: [...new Set(evidence.map(e => e.source.tool))],
            urls_crawled: evidence.filter(e => e.source.url).length,
            external_searches: evidence.filter(e => e.source.query).length
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
      console.log(`Deep research complete! Collected ${evidence.length} evidence items`)
      
      return {
        success: true,
        evidenceCount: evidence.length,
        collectionId: collection.id,
        evidenceTypes: [...new Set(evidence.map(e => e.type))],
        sources: [...new Set(evidence.map(e => e.source.tool))]
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
    concurrency: 1, // Deep research is resource intensive
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

console.log('🚀 Deep Research Evidence Collection Worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Waiting for jobs...')