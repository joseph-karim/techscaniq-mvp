import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import axios from 'axios'
import * as cheerio from 'cheerio'
// URL is already global in Node.js

config()

interface WebtechJob {
  url: string
  domain: string
  company: string
  collectionId: string
}

interface TechDetection {
  name: string
  category: string
  confidence: number
  version?: string
  evidence: string[]
}

interface WebtechResult {
  url: string
  technologies: TechDetection[]
  httpHeaders: Record<string, string>
  cookies: any[]
  dns: any
  ssl: any
  performance: any
  seo: any
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

class WebtechAnalyzer {
  
  // Technology detection patterns (simplified from Wappalyzer)
  private techPatterns = {
    // JavaScript Frameworks
    'React': {
      category: 'JavaScript Framework',
      patterns: [
        { type: 'script', pattern: /react/i },
        { type: 'html', pattern: /data-reactroot/i },
        { type: 'script', pattern: /_react/i }
      ]
    },
    'Vue.js': {
      category: 'JavaScript Framework',
      patterns: [
        { type: 'script', pattern: /vue\.js|vue\.min\.js/i },
        { type: 'html', pattern: /v-if|v-for|v-model/i },
        { type: 'script', pattern: /Vue\(/i }
      ]
    },
    'Angular': {
      category: 'JavaScript Framework',
      patterns: [
        { type: 'script', pattern: /angular/i },
        { type: 'html', pattern: /ng-app|ng-controller/i },
        { type: 'meta', pattern: /Angular/i }
      ]
    },
    'Next.js': {
      category: 'React Framework',
      patterns: [
        { type: 'script', pattern: /_next\//i },
        { type: 'html', pattern: /__NEXT_DATA__/i },
        { type: 'meta', pattern: /next\.js/i }
      ]
    },
    
    // CSS Frameworks
    'Bootstrap': {
      category: 'CSS Framework',
      patterns: [
        { type: 'script', pattern: /bootstrap/i },
        { type: 'css', pattern: /bootstrap/i },
        { type: 'html', pattern: /col-md-|container-fluid/i }
      ]
    },
    'Tailwind CSS': {
      category: 'CSS Framework',
      patterns: [
        { type: 'css', pattern: /tailwind/i },
        { type: 'html', pattern: /bg-blue-|text-gray-|flex-col/i }
      ]
    },
    
    // Analytics & Tracking
    'Google Analytics': {
      category: 'Analytics',
      patterns: [
        { type: 'script', pattern: /google-analytics|gtag/i },
        { type: 'script', pattern: /GA_MEASUREMENT_ID/i }
      ]
    },
    'Mixpanel': {
      category: 'Analytics',
      patterns: [
        { type: 'script', pattern: /mixpanel/i },
        { type: 'script', pattern: /mixpanel\.track/i }
      ]
    },
    'Segment': {
      category: 'Analytics',
      patterns: [
        { type: 'script', pattern: /segment/i },
        { type: 'script', pattern: /analytics\.js/i }
      ]
    },
    'Amplitude': {
      category: 'Analytics',
      patterns: [
        { type: 'script', pattern: /amplitude/i },
        { type: 'script', pattern: /amplitude\.getInstance/i }
      ]
    },
    
    // E-commerce & Payments
    'Stripe': {
      category: 'Payment Processor',
      patterns: [
        { type: 'script', pattern: /stripe/i },
        { type: 'script', pattern: /stripe\.com/i }
      ]
    },
    'Shopify': {
      category: 'E-commerce Platform',
      patterns: [
        { type: 'script', pattern: /shopify/i },
        { type: 'meta', pattern: /Shopify/i },
        { type: 'script', pattern: /cdn\.shopify\.com/i }
      ]
    },
    
    // CDNs & Infrastructure
    'Cloudflare': {
      category: 'CDN',
      patterns: [
        { type: 'header', pattern: /cf-ray/i },
        { type: 'header', pattern: /cloudflare/i }
      ]
    },
    'Amazon CloudFront': {
      category: 'CDN',
      patterns: [
        { type: 'header', pattern: /cloudfront/i },
        { type: 'header', pattern: /x-amz-cf-id/i }
      ]
    },
    
    // CMS & Platforms
    'WordPress': {
      category: 'CMS',
      patterns: [
        { type: 'meta', pattern: /WordPress/i },
        { type: 'script', pattern: /wp-content|wp-includes/i },
        { type: 'html', pattern: /wp-json/i }
      ]
    },
    'Webflow': {
      category: 'Website Builder',
      patterns: [
        { type: 'script', pattern: /webflow/i },
        { type: 'meta', pattern: /Webflow/i }
      ]
    },
    
    // Customer Support
    'Intercom': {
      category: 'Customer Support',
      patterns: [
        { type: 'script', pattern: /intercom/i },
        { type: 'script', pattern: /intercom\.io/i }
      ]
    },
    'Zendesk': {
      category: 'Customer Support',
      patterns: [
        { type: 'script', pattern: /zendesk/i },
        { type: 'script', pattern: /zdassets\.com/i }
      ]
    },
    
    // Marketing & Growth
    'HubSpot': {
      category: 'Marketing Automation',
      patterns: [
        { type: 'script', pattern: /hubspot/i },
        { type: 'script', pattern: /hs-analytics/i }
      ]
    },
    'Marketo': {
      category: 'Marketing Automation',
      patterns: [
        { type: 'script', pattern: /marketo/i },
        { type: 'script', pattern: /munchkin/i }
      ]
    }
  }
  
  async analyzeSite(url: string): Promise<WebtechResult> {
    console.log(`🔍 Analyzing technologies for: ${url}`)
    
    try {
      // Fetch the page
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        maxRedirects: 5
      })
      
      const html = response.data
      const headers = response.headers
      const $ = cheerio.load(html)
      
      // Detect technologies
      const technologies = this.detectTechnologies(html, headers, $)
      
      // Analyze HTTP headers
      const httpHeaders = this.analyzeHeaders(headers)
      
      // Extract cookies
      const cookies = this.extractCookies(headers)
      
      // Performance analysis
      const performance = await this.analyzePerformance(url, html)
      
      // SEO analysis
      const seo = this.analyzeSEO($ as any)
      
      console.log(`✅ Found ${technologies.length} technologies for ${url}`)
      
      return {
        url,
        technologies,
        httpHeaders,
        cookies,
        dns: {}, // Would need additional DNS lookup
        ssl: {}, // Would need SSL analysis
        performance,
        seo
      }
      
    } catch (error) {
      console.error(`Failed to analyze ${url}:`, error)
      throw error
    }
  }
  
  private detectTechnologies(html: string, headers: any, $: any): TechDetection[] {
    const detected: TechDetection[] = []
    
    // Get all script sources
    const scripts = $('script[src]').map((_: any, el: any) => $(el).attr('src')).get()
    const inlineScripts = $('script:not([src])').map((_: any, el: any) => $(el).html()).get()
    
    // Get all CSS links
    const cssLinks = $('link[rel="stylesheet"]').map((_: any, el: any) => $(el).attr('href')).get()
    
    // Get meta tags
    const metaTags = $('meta').map((_: any, el: any) => {
      const name = $(el).attr('name') || $(el).attr('property')
      const content = $(el).attr('content')
      return { name, content }
    }).get()
    
    // Check each technology pattern
    for (const [techName, techConfig] of Object.entries(this.techPatterns)) {
      const evidence: string[] = []
      let confidence = 0
      
      for (const pattern of techConfig.patterns) {
        switch (pattern.type) {
          case 'script':
            // Check script sources
            for (const script of scripts) {
              if (script && pattern.pattern.test(script)) {
                evidence.push(`Script: ${script}`)
                confidence += 0.8
              }
            }
            // Check inline scripts
            for (const script of inlineScripts) {
              if (script && pattern.pattern.test(script)) {
                evidence.push('Inline script match')
                confidence += 0.6
              }
            }
            break
            
          case 'css':
            for (const css of cssLinks) {
              if (css && pattern.pattern.test(css)) {
                evidence.push(`CSS: ${css}`)
                confidence += 0.7
              }
            }
            break
            
          case 'html':
            if (pattern.pattern.test(html)) {
              evidence.push('HTML pattern match')
              confidence += 0.5
            }
            break
            
          case 'meta':
            for (const meta of metaTags) {
              if (meta.content && pattern.pattern.test(meta.content)) {
                evidence.push(`Meta: ${meta.name} = ${meta.content}`)
                confidence += 0.9
              }
            }
            break
            
          case 'header':
            for (const [headerName, headerValue] of Object.entries(headers)) {
              if (typeof headerValue === 'string' && pattern.pattern.test(`${headerName}: ${headerValue}`)) {
                evidence.push(`Header: ${headerName}`)
                confidence += 0.8
              }
            }
            break
        }
      }
      
      if (evidence.length > 0) {
        detected.push({
          name: techName,
          category: techConfig.category,
          confidence: Math.min(confidence, 1.0),
          evidence
        })
      }
    }
    
    return detected.sort((a, b) => b.confidence - a.confidence)
  }
  
  private analyzeHeaders(headers: any): Record<string, string> {
    const importantHeaders = [
      'server',
      'x-powered-by',
      'x-framework',
      'x-generator',
      'cf-ray',
      'x-amz-cf-id',
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options'
    ]
    
    const result: Record<string, string> = {}
    
    for (const header of importantHeaders) {
      if (headers[header]) {
        result[header] = headers[header]
      }
    }
    
    return result
  }
  
  private extractCookies(headers: any): any[] {
    const cookies: any[] = []
    const setCookie = headers['set-cookie']
    
    if (setCookie) {
      for (const cookie of Array.isArray(setCookie) ? setCookie : [setCookie]) {
        const parts = cookie.split(';')
        const [name, value] = parts[0].split('=')
        
        cookies.push({
          name: name?.trim(),
          value: value?.trim(),
          attributes: parts.slice(1).map((p: string) => p.trim())
        })
      }
    }
    
    return cookies
  }
  
  private async analyzePerformance(_url: string, html: string): Promise<any> {
    return {
      htmlSize: html.length,
      resourcesCount: (html.match(/<script|<link|<img/g) || []).length,
      hasMinification: html.length < 100000 && !html.includes('\n  '), // Simple check
      hasCompression: html.includes('gzip') || html.includes('br'),
      loadTime: 'unknown' // Would need actual performance measurement
    }
  }
  
  private analyzeSEO($: cheerio.CheerioAPI): any {
    return {
      title: $('title').text(),
      description: $('meta[name="description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content'),
      openGraph: {
        title: $('meta[property="og:title"]').attr('content'),
        description: $('meta[property="og:description"]').attr('content'),
        image: $('meta[property="og:image"]').attr('content')
      },
      structuredData: $('script[type="application/ld+json"]').length > 0,
      headingStructure: {
        h1: $('h1').length,
        h2: $('h2').length,
        h3: $('h3').length
      }
    }
  }
}

// Store evidence in database
async function storeEvidence(
  collectionId: string,
  result: WebtechResult,
  company: string
): Promise<void> {
  try {
    await supabase
      .from('evidence_items')
      .insert({
        collection_id: collectionId,
        evidence_type: 'technology_stack',
        content_data: {
          summary: `Technology stack analysis of ${result.url}: Detected ${result.technologies.length} technologies including ${result.technologies.slice(0, 3).map(t => t.name).join(', ')}`,
          processed: JSON.stringify(result.technologies, null, 2),
          technologies: result.technologies.map(t => t.name),
          categories: [...new Set(result.technologies.map(t => t.category))],
          httpHeaders: result.httpHeaders,
          performance: result.performance,
          seo: result.seo
        },
        source_data: {
          url: result.url,
          scan_timestamp: new Date().toISOString(),
          technologies_detail: result.technologies
        },
        source_url: result.url,
        confidence_score: 0.85,
        metadata: {
          company,
          tool: 'webtech-analyzer',
          technologies_count: result.technologies.length,
          categories_found: [...new Set(result.technologies.map(t => t.category))],
          high_confidence_techs: result.technologies.filter(t => t.confidence > 0.8).map(t => t.name)
        }
      })
  } catch (error) {
    console.error('Failed to store webtech evidence:', error)
  }
}

// Main worker
export const webtechAnalyzerWorker = new Worker<WebtechJob>(
  'webtech-analyzer',
  async (job: Job<WebtechJob>) => {
    const { url, domain, company, collectionId } = job.data
    
    console.log(`🔍 Starting webtech analysis for ${company} (${domain})`)
    
    const analyzer = new WebtechAnalyzer()
    
    try {
      await job.updateProgress(20)
      
      // Analyze main site
      const result = await analyzer.analyzeSite(url)
      await storeEvidence(collectionId, result, company)
      
      await job.updateProgress(100)
      
      console.log(`✅ Webtech analysis complete for ${company}: ${result.technologies.length} technologies detected`)
      
      return {
        success: true,
        technologiesDetected: result.technologies.length,
        categories: [...new Set(result.technologies.map(t => t.category))],
        highConfidenceTechs: result.technologies.filter(t => t.confidence > 0.8).map(t => t.name),
        performance: result.performance,
        seo: result.seo
      }
      
    } catch (error) {
      console.error('Webtech analysis failed:', error)
      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  }
)

// Error handling
webtechAnalyzerWorker.on('failed', (job, err) => {
  console.error(`Webtech analysis job ${job?.id} failed:`, err)
})

webtechAnalyzerWorker.on('completed', (job) => {
  console.log(`Webtech analysis job ${job.id} completed successfully`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing webtech analyzer worker...')
  await webtechAnalyzerWorker.close()
  process.exit(0)
})

console.log('Webtech analyzer worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)