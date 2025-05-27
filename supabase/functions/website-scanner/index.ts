import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScanRequest {
  url: string
  depth?: 'basic' | 'full'
}

interface TechnologySignal {
  name: string
  category: string
  confidence: number
  version?: string
  evidence: string[]
}

interface ScanResult {
  url: string
  scannedAt: string
  technologies: TechnologySignal[]
  infrastructure: {
    hosting?: string
    cdn?: string
    ssl: boolean
    headers: Record<string, string>
  }
  performance: {
    loadTime?: number
    resourceCount?: number
    totalSize?: number
  }
  metadata: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

// Technology detection patterns
const techPatterns = {
  frameworks: [
    { pattern: /_next\/static/, name: 'Next.js', category: 'Frontend Framework' },
    { pattern: /react(?:\.production\.min)?\.js/, name: 'React', category: 'Frontend Library' },
    { pattern: /vue(?:\.min)?\.js/, name: 'Vue.js', category: 'Frontend Framework' },
    { pattern: /angular(?:\.min)?\.js/, name: 'Angular', category: 'Frontend Framework' },
    { pattern: /jquery(?:\.min)?\.js/, name: 'jQuery', category: 'JavaScript Library' },
  ],
  analytics: [
    { pattern: /google-analytics\.com|googletagmanager\.com/, name: 'Google Analytics', category: 'Analytics' },
    { pattern: /segment\.com|segment\.io/, name: 'Segment', category: 'Analytics' },
    { pattern: /mixpanel\.com/, name: 'Mixpanel', category: 'Analytics' },
    { pattern: /amplitude\.com/, name: 'Amplitude', category: 'Analytics' },
  ],
  hosting: [
    { pattern: /x-vercel-id/, name: 'Vercel', category: 'Hosting', headerCheck: true },
    { pattern: /x-served-by.*netlify/, name: 'Netlify', category: 'Hosting', headerCheck: true },
    { pattern: /server.*cloudflare/, name: 'Cloudflare', category: 'CDN/Hosting', headerCheck: true },
    { pattern: /x-amz-/, name: 'AWS', category: 'Cloud Provider', headerCheck: true },
  ],
  cms: [
    { pattern: /wp-content|wordpress/i, name: 'WordPress', category: 'CMS' },
    { pattern: /drupal/i, name: 'Drupal', category: 'CMS' },
    { pattern: /joomla/i, name: 'Joomla', category: 'CMS' },
  ],
  ecommerce: [
    { pattern: /shopify/i, name: 'Shopify', category: 'E-commerce' },
    { pattern: /woocommerce/i, name: 'WooCommerce', category: 'E-commerce' },
    { pattern: /magento/i, name: 'Magento', category: 'E-commerce' },
  ]
}

async function scanWebsite(url: string): Promise<ScanResult> {
  const startTime = Date.now()
  const technologies: TechnologySignal[] = []
  const infrastructure: {
    ssl: boolean
    headers: Record<string, string>
    cdn?: string
    hosting?: string
  } = {
    ssl: url.startsWith('https'),
    headers: {}
  }
  
  try {
    // Fetch the website
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TechScanIQ/1.0 (Executive Report Scanner)'
      }
    })
    
    // Capture headers for infrastructure detection
    response.headers.forEach((value, key) => {
      infrastructure.headers[key] = value
      
      // Check hosting patterns in headers
      techPatterns.hosting.forEach(pattern => {
        if (pattern.headerCheck) {
          const headerValue = `${key}: ${value}`.toLowerCase()
          if (pattern.pattern.test(headerValue)) {
            const existing = technologies.find(t => t.name === pattern.name)
            if (!existing) {
              technologies.push({
                name: pattern.name,
                category: pattern.category,
                confidence: 0.9,
                evidence: [`Header: ${key}: ${value}`]
              })
            }
          }
        }
      })
    })
    
    // Get the HTML content
    const html = await response.text()
    
    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i)
    
    const metadata = {
      title: titleMatch?.[1]?.trim(),
      description: descMatch?.[1]?.trim(),
      keywords: keywordsMatch?.[1]?.split(',').map(k => k.trim()).filter(Boolean)
    }
    
    // Detect technologies from HTML content
    Object.entries(techPatterns).forEach(([category, patterns]) => {
      if (category !== 'hosting') { // Skip hosting as we already checked headers
        patterns.forEach(pattern => {
          if (pattern.pattern.test(html)) {
            const existing = technologies.find(t => t.name === pattern.name)
            if (!existing) {
              // Find actual evidence in the HTML
              const matches = html.match(pattern.pattern)
              technologies.push({
                name: pattern.name,
                category: pattern.category,
                confidence: 0.8,
                evidence: matches ? [`Found: ${matches[0].substring(0, 100)}...`] : ['Pattern match in HTML']
              })
            }
          }
        })
      }
    })
    
    // Check for common meta tags that indicate technologies
    const generatorMatch = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i)
    if (generatorMatch) {
      technologies.push({
        name: generatorMatch[1],
        category: 'Generator',
        confidence: 0.95,
        evidence: [`Meta generator: ${generatorMatch[1]}`]
      })
    }
    
    // Simple CDN detection from common patterns
    if (html.includes('cdn.jsdelivr.net') || html.includes('cdnjs.cloudflare.com')) {
      infrastructure.cdn = 'Public CDN'
    } else if (infrastructure.headers['cf-ray']) {
      infrastructure.cdn = 'Cloudflare'
    } else if (infrastructure.headers['x-cache']?.includes('cloudfront')) {
      infrastructure.cdn = 'AWS CloudFront'
    }
    
    // Basic performance metrics
    const performance = {
      loadTime: Date.now() - startTime,
      resourceCount: (html.match(/<script|<link|<img/g) || []).length,
      totalSize: new Blob([html]).size
    }
    
    return {
      url,
      scannedAt: new Date().toISOString(),
      technologies,
      infrastructure,
      performance,
      metadata
    }
    
  } catch (error) {
    console.error('Error scanning website:', error)
    return {
      url,
      scannedAt: new Date().toISOString(),
      technologies: [],
      infrastructure,
      performance: {
        loadTime: Date.now() - startTime
      },
      metadata: {}
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, depth = 'basic' }: ScanRequest = await req.json()
    
    if (!url) {
      throw new Error('URL is required')
    }
    
    // Validate URL
    try {
      new URL(url)
    } catch {
      throw new Error('Invalid URL format')
    }
    
    console.log(`Scanning website: ${url}`)
    
    const result = await scanWebsite(url)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Error in website scanner:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}) 