import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { chromium, Browser, Page } from 'playwright'

config()

interface CrawlJob {
  url: string
  domain: string
  company: string
  collectionId: string
  depth?: number
  extractionTargets?: string[]
}

interface CrawlResult {
  url: string
  title: string
  content: string
  metadata: any
  technologies: string[]
  apiEndpoints: string[]
  scripts: string[]
  forms: any[]
  performance: any
  screenshots?: string
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

class PlaywrightCrawler {
  private browser: Browser | null = null
  
  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
  
  async crawlPage(url: string, _options: any = {}): Promise<CrawlResult> {
    if (!this.browser) await this.initialize()
    
    const page = await this.browser!.newPage()
    
    try {
      // Set user agent and viewport
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      })
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // Track network requests for API discovery
      const requests: string[] = []
      const responses: any[] = []
      
      page.on('request', request => {
        const url = request.url()
        if (url.includes('/api/') || url.includes('/v1/') || url.includes('.json')) {
          requests.push(url)
        }
      })
      
      page.on('response', response => {
        if (response.url().includes('/api/') && response.status() === 200) {
          responses.push({
            url: response.url(),
            status: response.status(),
            headers: response.headers()
          })
        }
      })
      
      // Navigate and wait for network idle
      console.log(`🔍 Crawling: ${url}`)
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Extract basic page information
      const title = await page.title()
      const content = await page.textContent('body') || ''
      
      // Extract technologies by analyzing scripts and HTML
      const technologies = await this.detectTechnologies(page)
      
      // Extract forms for product analysis
      const forms = await this.extractForms(page)
      
      // Extract metadata
      const metadata = await this.extractMetadata(page)
      
      // Performance metrics
      const performance = await this.getPerformanceMetrics(page)
      
      // Take screenshot for visual analysis
      const screenshot = await page.screenshot({ 
        fullPage: false,
        type: 'png'
      })
      
      console.log(`✅ Crawled: ${url} - Found ${technologies.length} technologies, ${requests.length} API calls`)
      
      return {
        url,
        title,
        content: content.substring(0, 5000), // Limit content length
        metadata,
        technologies,
        apiEndpoints: [...new Set(requests)],
        scripts: await this.extractScripts(page),
        forms,
        performance,
        screenshots: screenshot.toString('base64')
      }
      
    } finally {
      await page.close()
    }
  }
  
  private async detectTechnologies(page: Page): Promise<string[]> {
    const technologies: string[] = []
    
    try {
      // Check for common frameworks in scripts
      const scripts = await page.$$eval('script[src]', scripts => 
        scripts.map(script => script.getAttribute('src')).filter((src): src is string => src !== null)
      )
      
      // Technology detection patterns
      const patterns = {
        'React': /react/i,
        'Vue.js': /vue/i,
        'Angular': /angular/i,
        'jQuery': /jquery/i,
        'Bootstrap': /bootstrap/i,
        'Tailwind': /tailwind/i,
        'Next.js': /_next\//,
        'Gatsby': /gatsby/i,
        'Webpack': /webpack/i,
        'TypeScript': /typescript|\.ts$/i,
        'GraphQL': /graphql/i,
        'Apollo': /apollo/i,
        'Shopify': /shopify/i,
        'Stripe': /stripe/i,
        'Google Analytics': /google-analytics|gtag/i,
        'Intercom': /intercom/i,
        'Segment': /segment/i,
        'Mixpanel': /mixpanel/i,
        'Amplitude': /amplitude/i,
        'Hotjar': /hotjar/i,
        'Zendesk': /zendesk/i
      }
      
      for (const script of scripts) {
        for (const [tech, pattern] of Object.entries(patterns)) {
          if (pattern.test(script)) {
            technologies.push(tech)
          }
        }
      }
      
      // Check window objects for additional technologies
      const windowTechs = await page.evaluate(() => {
        const techs = []
        if (typeof window !== 'undefined') {
          if ((window as any).React) techs.push('React')
          if ((window as any).Vue) techs.push('Vue.js')
          if ((window as any).angular) techs.push('Angular')
          if ((window as any).jQuery || (window as any).$) techs.push('jQuery')
          if ((window as any).gtag) techs.push('Google Analytics')
          if ((window as any).Intercom) techs.push('Intercom')
          if ((window as any).analytics) techs.push('Segment')
          if ((window as any).mixpanel) techs.push('Mixpanel')
        }
        return techs
      })
      
      technologies.push(...windowTechs)
      
      // Check meta tags for additional info
      const metaTechs = await page.$$eval('meta[name*="generator"], meta[name*="framework"]', metas =>
        metas.map(meta => meta.getAttribute('content')).filter(Boolean)
      )
      technologies.push(...metaTechs.filter((tech): tech is string => tech !== null))
      
    } catch (error) {
      console.warn('Technology detection error:', error)
    }
    
    return [...new Set(technologies)]
  }
  
  private async extractForms(page: Page): Promise<any[]> {
    try {
      return await page.$$eval('form', forms => 
        forms.map(form => ({
          action: form.getAttribute('action'),
          method: form.getAttribute('method') || 'GET',
          fields: Array.from(form.querySelectorAll('input, select, textarea')).map(field => ({
            name: field.getAttribute('name'),
            type: field.getAttribute('type') || field.tagName.toLowerCase(),
            required: field.hasAttribute('required'),
            placeholder: field.getAttribute('placeholder')
          }))
        }))
      )
    } catch (error) {
      return []
    }
  }
  
  private async extractMetadata(page: Page): Promise<any> {
    try {
      return await page.evaluate(() => {
        // Basic meta tags
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content')
        const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content')
        const author = document.querySelector('meta[name="author"]')?.getAttribute('content')
        
        // Open Graph
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
        const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content')
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content')
        
        // Twitter Card
        const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')
        const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')
        
        return {
          description,
          keywords,
          author,
          openGraph: { title: ogTitle, description: ogDescription, image: ogImage },
          twitter: { card: twitterCard, title: twitterTitle },
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
          language: document.documentElement.lang
        }
      })
    } catch (error) {
      return {}
    }
  }
  
  private async extractScripts(page: Page): Promise<string[]> {
    try {
      const scripts = await page.$$eval('script', scripts => 
        scripts.map(script => {
          const src = script.getAttribute('src')
          const inline = script.textContent
          return src || (inline ? `inline:${inline.substring(0, 100)}...` : null)
        }).filter((script): script is string => script !== null)
      )
      return scripts
    } catch (error) {
      return []
    }
  }
  
  private async getPerformanceMetrics(page: Page): Promise<any> {
    try {
      return await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          loadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
          domReady: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
          resourceCount: performance.getEntriesByType('resource').length
        }
      })
    } catch (error) {
      return {}
    }
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

// Store evidence in database
async function storeEvidence(
  collectionId: string,
  result: CrawlResult,
  company: string
): Promise<void> {
  try {
    await supabase
      .from('evidence_items')
      .insert({
        collection_id: collectionId,
        evidence_type: 'technical_analysis',
        content_data: {
          summary: `Technical analysis of ${result.url}: Found ${result.technologies.length} technologies including ${result.technologies.slice(0, 3).join(', ')}`,
          processed: result.content,
          technologies: result.technologies,
          apiEndpoints: result.apiEndpoints,
          forms: result.forms,
          performance: result.performance,
          metadata: result.metadata,
          scripts: result.scripts.slice(0, 10) // Limit scripts
        },
        source_data: {
          url: result.url,
          title: result.title,
          crawl_timestamp: new Date().toISOString(),
          screenshot: result.screenshots
        },
        source_url: result.url,
        confidence_score: 0.9,
        metadata: {
          company,
          tool: 'playwright-crawler',
          technologies_found: result.technologies.length,
          api_endpoints_found: result.apiEndpoints.length,
          forms_found: result.forms.length
        }
      })
  } catch (error) {
    console.error('Failed to store evidence:', error)
  }
}

// Main worker
export const playwrightCrawlerWorker = new Worker<CrawlJob>(
  'playwright-crawler',
  async (job: Job<CrawlJob>) => {
    const { url, domain, company, collectionId, depth = 1 } = job.data
    
    console.log(`🔍 Starting Playwright crawl for ${company} (${domain})`)
    
    const crawler = new PlaywrightCrawler()
    const results: CrawlResult[] = []
    
    try {
      // Crawl main page
      await job.updateProgress(20)
      const mainResult = await crawler.crawlPage(url)
      results.push(mainResult)
      await storeEvidence(collectionId, mainResult, company)
      
      // Discover and crawl additional important pages
      const importantPaths = [
        '/pricing',
        '/features',
        '/api',
        '/docs',
        '/documentation',
        '/developers',
        '/about',
        '/product',
        '/platform',
        '/security',
        '/integrations'
      ]
      
      await job.updateProgress(40)
      
      for (let i = 0; i < importantPaths.length && i < depth * 3; i++) {
        const path = importantPaths[i]
        const pageUrl = new URL(path, url).toString()
        
        try {
          const result = await crawler.crawlPage(pageUrl)
          results.push(result)
          await storeEvidence(collectionId, result, company)
          await job.updateProgress(40 + (i / importantPaths.length) * 50)
        } catch (error) {
          console.warn(`Failed to crawl ${pageUrl}:`, error)
        }
      }
      
      await job.updateProgress(100)
      console.log(`✅ Playwright crawl complete for ${company}: ${results.length} pages analyzed`)
      
      return {
        success: true,
        pagesAnalyzed: results.length,
        technologiesFound: [...new Set(results.flatMap(r => r.technologies))],
        apiEndpointsFound: [...new Set(results.flatMap(r => r.apiEndpoints))],
        formsFound: results.reduce((sum, r) => sum + r.forms.length, 0)
      }
      
    } catch (error) {
      console.error('Playwright crawl failed:', error)
      throw error
    } finally {
      await crawler.close()
    }
  },
  {
    connection,
    concurrency: 2, // Limit concurrent browser instances
  }
)

// Error handling
playwrightCrawlerWorker.on('failed', (job, err) => {
  console.error(`Playwright crawl job ${job?.id} failed:`, err)
})

playwrightCrawlerWorker.on('completed', (job) => {
  console.log(`Playwright crawl job ${job.id} completed successfully`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Playwright worker...')
  await playwrightCrawlerWorker.close()
  process.exit(0)
})

console.log('Playwright crawler worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)