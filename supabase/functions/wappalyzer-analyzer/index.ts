import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface WappalyzerRequest {
  html: string
  url: string
  headers?: Record<string, string>
}

interface Technology {
  name: string
  categories: string[]
  version?: string
  confidence: number
}

// Simplified Wappalyzer patterns for common technologies
const TECHNOLOGY_PATTERNS = {
  // JavaScript frameworks
  'React': {
    patterns: [
      /_react.*\.js/i,
      /react\.production\.min\.js/i,
      /data-reactroot/i,
      /__REACT_DEVTOOLS_GLOBAL_HOOK__/
    ],
    categories: ['JavaScript Framework']
  },
  'Vue.js': {
    patterns: [
      /vue\.js/i,
      /vue\.min\.js/i,
      /\{\{[^}]+\}\}/,
      /v-[a-z]+=/i
    ],
    categories: ['JavaScript Framework']
  },
  'Angular': {
    patterns: [
      /angular\.js/i,
      /angular\.min\.js/i,
      /ng-[a-z]+=/i,
      /\[\(ngModel\)\]/
    ],
    categories: ['JavaScript Framework']
  },
  'Next.js': {
    patterns: [
      /_next\//i,
      /__NEXT_DATA__/,
      /next\.config\.js/i
    ],
    categories: ['JavaScript Framework', 'SSR']
  },
  // Analytics
  'Google Analytics': {
    patterns: [
      /google-analytics\.com\/analytics\.js/i,
      /googletagmanager\.com/i,
      /gtag\(/i,
      /_gaq\.push/i
    ],
    categories: ['Analytics']
  },
  'Google Tag Manager': {
    patterns: [
      /googletagmanager\.com\/gtm\.js/i,
      /GTM-[A-Z0-9]+/
    ],
    categories: ['Tag Manager']
  },
  // CDN
  'Cloudflare': {
    patterns: [
      /cloudflare\.com/i,
      /cf-ray/i,
      /cdn\.cloudflare\.com/i
    ],
    categories: ['CDN', 'Security']
  },
  'Fastly': {
    patterns: [
      /fastly\.net/i,
      /x-served-by.*cache/i
    ],
    categories: ['CDN']
  },
  // CMS
  'WordPress': {
    patterns: [
      /wp-content/i,
      /wp-includes/i,
      /wordpress/i
    ],
    categories: ['CMS']
  },
  // E-commerce
  'Shopify': {
    patterns: [
      /cdn\.shopify\.com/i,
      /myshopify\.com/i,
      /shopify-cdn/i
    ],
    categories: ['E-commerce']
  },
  // Security
  'reCAPTCHA': {
    patterns: [
      /google\.com\/recaptcha/i,
      /g-recaptcha/i,
      /grecaptcha/i
    ],
    categories: ['Security']
  },
  // Payment
  'Stripe': {
    patterns: [
      /stripe\.com/i,
      /js\.stripe\.com/i,
      /stripe\.js/i
    ],
    categories: ['Payment']
  },
  // Cloud Providers
  'AWS': {
    patterns: [
      /amazonaws\.com/i,
      /aws-sdk/i,
      /\.s3\.amazonaws/i
    ],
    categories: ['Cloud', 'IaaS']
  },
  'Google Cloud': {
    patterns: [
      /googleapis\.com/i,
      /gstatic\.com/i,
      /google-cloud/i
    ],
    categories: ['Cloud', 'IaaS']
  },
  'Microsoft Azure': {
    patterns: [
      /\.azure/i,
      /azurewebsites\.net/i,
      /windows\.net/i
    ],
    categories: ['Cloud', 'IaaS']
  }
}

function detectTechnologies(html: string, url: string, headers?: Record<string, string>): Technology[] {
  const detectedTechs: Technology[] = []
  const htmlLower = html.toLowerCase()
  
  // Check each technology pattern
  for (const [techName, techData] of Object.entries(TECHNOLOGY_PATTERNS)) {
    let confidence = 0
    let matchCount = 0
    
    for (const pattern of techData.patterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(html)) {
          matchCount++
        }
      } else if (typeof pattern === 'string' && htmlLower.includes(pattern.toLowerCase())) {
        matchCount++
      }
    }
    
    if (matchCount > 0) {
      confidence = Math.min(100, (matchCount / techData.patterns.length) * 100)
      detectedTechs.push({
        name: techName,
        categories: techData.categories,
        confidence: Math.round(confidence)
      })
    }
  }
  
  // Additional detection from headers
  if (headers) {
    // Server detection
    if (headers['server']) {
      const server = headers['server'].toLowerCase()
      if (server.includes('nginx')) {
        detectedTechs.push({
          name: 'Nginx',
          categories: ['Web Server'],
          confidence: 100
        })
      } else if (server.includes('apache')) {
        detectedTechs.push({
          name: 'Apache',
          categories: ['Web Server'],
          confidence: 100
        })
      }
    }
    
    // Programming language detection
    if (headers['x-powered-by']) {
      const poweredBy = headers['x-powered-by'].toLowerCase()
      if (poweredBy.includes('php')) {
        detectedTechs.push({
          name: 'PHP',
          categories: ['Programming Language'],
          confidence: 100
        })
      } else if (poweredBy.includes('asp.net')) {
        detectedTechs.push({
          name: 'ASP.NET',
          categories: ['Programming Language', 'Framework'],
          confidence: 100
        })
      }
    }
  }
  
  // Sort by confidence
  detectedTechs.sort((a, b) => b.confidence - a.confidence)
  
  return detectedTechs
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: WappalyzerRequest = await req.json()
    
    if (!request.html || !request.url) {
      throw new Error('HTML content and URL are required')
    }
    
    console.log(`Analyzing technologies for: ${request.url}`)
    
    // Detect technologies
    const technologies = detectTechnologies(
      request.html,
      request.url,
      request.headers
    )
    
    // Group by category
    const byCategory: Record<string, Technology[]> = {}
    for (const tech of technologies) {
      for (const category of tech.categories) {
        if (!byCategory[category]) {
          byCategory[category] = []
        }
        byCategory[category].push(tech)
      }
    }
    
    const result = {
      url: request.url,
      technologies,
      byCategory,
      summary: {
        total: technologies.length,
        categories: Object.keys(byCategory),
        topTechnologies: technologies.slice(0, 10).map(t => t.name)
      },
      timestamp: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('[ERROR]', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}) 