import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface ScrapeRequest {
  url: string
  options?: {
    timeout?: number
    userAgent?: string
    headers?: Record<string, string>
    extractSelectors?: {
      title?: string
      description?: string
      mainContent?: string
      links?: string
      images?: string
      scripts?: string
      metadata?: string
    }
    followRedirects?: boolean
    maxDepth?: number
    includeSubpages?: boolean
  }
}

interface ScrapeResponse {
  success: boolean
  url: string
  finalUrl?: string
  status?: number
  error?: string
  data?: {
    title?: string
    description?: string
    mainContent?: string
    links?: string[]
    images?: string[]
    scripts?: string[]
    metadata?: Record<string, string>
    structuredData?: any[]
    technologies?: {
      frameworks?: string[]
      libraries?: string[]
      analytics?: string[]
      cdns?: string[]
    }
    performance?: {
      loadTime: number
      htmlSize: number
      resourceCount: number
    }
  }
  rawHtml?: string
}

// User agent pool for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
]

// Get random user agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// Timeout wrapper
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeout = 15000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: options.redirect || 'follow'
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

// Extract structured data from HTML
function extractStructuredData(doc: any): any[] {
  const structuredData: any[] = []
  
  // Find all script tags with type="application/ld+json"
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]')
  
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent)
      structuredData.push(data)
    } catch (e) {
      console.error('Failed to parse structured data:', e)
    }
  }
  
  return structuredData
}

// Detect technologies from HTML
function detectTechnologies(html: string, doc: any): ScrapeResponse['data']['technologies'] {
  const technologies: ScrapeResponse['data']['technologies'] = {
    frameworks: [],
    libraries: [],
    analytics: [],
    cdns: []
  }
  
  // Framework detection patterns
  const frameworkPatterns = {
    'React': [/__REACT/, /react\.production\.min\.js/, /data-reactroot/],
    'Vue.js': [/vue\.js/, /vue\.min\.js/, /v-cloak/],
    'Angular': [/angular\.js/, /angular\.min\.js/, /ng-app/],
    'Next.js': [/__NEXT_DATA__/, /_next\/static/],
    'Nuxt.js': [/__NUXT__/, /_nuxt/],
    'Gatsby': [/gatsby-/, /___gatsby/],
    'WordPress': [/wp-content/, /wp-includes/],
    'Shopify': [/cdn\.shopify/, /shopify\.com/],
    'Django': [/csrfmiddlewaretoken/, /django-/],
    'Ruby on Rails': [/rails-/, /data-turbo/],
    'Laravel': [/laravel/, /csrf-token/],
    'Express': [/X-Powered-By.*Express/i]
  }
  
  // Check for frameworks
  for (const [framework, patterns] of Object.entries(frameworkPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        technologies.frameworks.push(framework)
        break
      }
    }
  }
  
  // Library detection
  const libraryPatterns = {
    'jQuery': [/jquery[\.-]/, /\$\.fn\.jquery/],
    'Bootstrap': [/bootstrap[\.-]/, /\.btn-primary/],
    'Tailwind CSS': [/tailwind/, /\.tw-/, /class="[^"]*(?:flex|grid|p-\d|m-\d)/],
    'Material-UI': [/material-ui/, /MuiButton/],
    'Lodash': [/lodash[\.-]/],
    'Moment.js': [/moment[\.-]/],
    'D3.js': [/d3[\.-]v\d/],
    'Three.js': [/three[\.-]/]
  }
  
  // Check for libraries
  for (const [library, patterns] of Object.entries(libraryPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        technologies.libraries.push(library)
        break
      }
    }
  }
  
  // Analytics detection
  const analyticsPatterns = {
    'Google Analytics': [/google-analytics\.com/, /gtag\(/, /_gaq\.push/],
    'Google Tag Manager': [/googletagmanager\.com/],
    'Facebook Pixel': [/facebook\.com\/tr/, /fbq\(/],
    'Hotjar': [/hotjar\.com/],
    'Mixpanel': [/mixpanel\.com/],
    'Segment': [/segment\.com/, /analytics\.js/],
    'Amplitude': [/amplitude\.com/],
    'Heap': [/heap\.io/]
  }
  
  // Check for analytics
  for (const [analytics, patterns] of Object.entries(analyticsPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        technologies.analytics.push(analytics)
        break
      }
    }
  }
  
  // CDN detection
  const cdnPatterns = {
    'Cloudflare': [/cloudflare\.com/, /cf-ray/],
    'Cloudfront': [/cloudfront\.net/],
    'Fastly': [/fastly\.net/],
    'Akamai': [/akamai\.net/],
    'MaxCDN': [/maxcdn\.com/],
    'jsDelivr': [/jsdelivr\.net/],
    'unpkg': [/unpkg\.com/],
    'cdnjs': [/cdnjs\.cloudflare\.com/]
  }
  
  // Check for CDNs
  for (const [cdn, patterns] of Object.entries(cdnPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        technologies.cdns.push(cdn)
        break
      }
    }
  }
  
  // Remove duplicates
  technologies.frameworks = [...new Set(technologies.frameworks)]
  technologies.libraries = [...new Set(technologies.libraries)]
  technologies.analytics = [...new Set(technologies.analytics)]
  technologies.cdns = [...new Set(technologies.cdns)]
  
  return technologies
}

// Extract main content from HTML
function extractMainContent(doc: any): string {
  // Try to find main content areas
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '#main',
    '#content',
    '.content',
    '.main-content',
    '#main-content'
  ]
  
  for (const selector of contentSelectors) {
    const element = doc.querySelector(selector)
    if (element) {
      return element.textContent.trim()
    }
  }
  
  // Fallback to body content
  const body = doc.querySelector('body')
  return body ? body.textContent.trim() : ''
}

// Extract metadata from HTML
function extractMetadata(doc: any): Record<string, string> {
  const metadata: Record<string, string> = {}
  
  // Extract title
  const title = doc.querySelector('title')
  if (title) {
    metadata.title = title.textContent.trim()
  }
  
  // Extract meta tags
  const metaTags = doc.querySelectorAll('meta')
  for (const meta of metaTags) {
    const name = meta.getAttribute('name') || meta.getAttribute('property')
    const content = meta.getAttribute('content')
    
    if (name && content) {
      metadata[name] = content
    }
  }
  
  return metadata
}

// Extract links from HTML
function extractLinks(doc: any, baseUrl: string): string[] {
  const links: string[] = []
  const anchors = doc.querySelectorAll('a[href]')
  
  for (const anchor of anchors) {
    const href = anchor.getAttribute('href')
    if (href) {
      try {
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(href, baseUrl).toString()
        links.push(absoluteUrl)
      } catch (e) {
        // Invalid URL, skip it
      }
    }
  }
  
  return [...new Set(links)] // Remove duplicates
}

// Extract images from HTML
function extractImages(doc: any, baseUrl: string): string[] {
  const images: string[] = []
  const imgs = doc.querySelectorAll('img[src]')
  
  for (const img of imgs) {
    const src = img.getAttribute('src')
    if (src) {
      try {
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(src, baseUrl).toString()
        images.push(absoluteUrl)
      } catch (e) {
        // Invalid URL, skip it
      }
    }
  }
  
  return [...new Set(images)] // Remove duplicates
}

// Extract script sources
function extractScripts(doc: any, baseUrl: string): string[] {
  const scripts: string[] = []
  const scriptTags = doc.querySelectorAll('script[src]')
  
  for (const script of scriptTags) {
    const src = script.getAttribute('src')
    if (src) {
      try {
        const absoluteUrl = new URL(src, baseUrl).toString()
        scripts.push(absoluteUrl)
      } catch (e) {
        // Invalid URL, skip it
      }
    }
  }
  
  return [...new Set(scripts)]
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body: ScrapeRequest = await req.json()
    const { url, options = {} } = body
    
    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const startTime = Date.now()
    
    // Prepare headers
    const headers: Record<string, string> = {
      'User-Agent': options.userAgent || getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...options.headers
    }

    try {
      // Fetch the URL
      const response = await fetchWithTimeout(
        url,
        { 
          method: 'GET',
          headers,
          redirect: options.followRedirects !== false ? 'follow' : 'manual'
        },
        options.timeout || 15000
      )

      const loadTime = Date.now() - startTime

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            url,
            status: response.status,
            error: `HTTP ${response.status}: ${response.statusText}`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get response text
      const html = await response.text()
      const htmlSize = new TextEncoder().encode(html).length
      
      // Parse HTML
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      if (!doc) {
        throw new Error('Failed to parse HTML')
      }
      
      // Extract data based on options
      const extractedData: ScrapeResponse['data'] = {
        title: doc.querySelector('title')?.textContent?.trim(),
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                     doc.querySelector('meta[property="og:description"]')?.getAttribute('content'),
        mainContent: extractMainContent(doc),
        links: extractLinks(doc, response.url),
        images: extractImages(doc, response.url),
        scripts: extractScripts(doc, response.url),
        metadata: extractMetadata(doc),
        structuredData: extractStructuredData(doc),
        technologies: detectTechnologies(html, doc),
        performance: {
          loadTime,
          htmlSize,
          resourceCount: doc.querySelectorAll('link, script, img').length
        }
      }
      
      // Apply custom selectors if provided
      if (options.extractSelectors) {
        for (const [key, selector] of Object.entries(options.extractSelectors)) {
          if (selector) {
            const element = doc.querySelector(selector)
            if (element) {
              extractedData[key] = element.textContent?.trim()
            }
          }
        }
      }

      const result: ScrapeResponse = {
        success: true,
        url,
        finalUrl: response.url !== url ? response.url : undefined,
        status: response.status,
        data: extractedData,
        rawHtml: html.substring(0, 50000) // Limit raw HTML to 50KB for response size
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      
      return new Response(
        JSON.stringify({
          success: false,
          url,
          error: fetchError.message || 'Failed to fetch and parse HTML'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Request error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})