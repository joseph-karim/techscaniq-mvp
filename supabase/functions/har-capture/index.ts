import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface HARCaptureRequest {
  url: string
  options?: {
    waitTime?: number
    captureConsole?: boolean
    blockResources?: string[]
  }
}

interface NetworkEntry {
  url: string
  method: string
  status: number
  type: string
  size: number
  timing: {
    start: number
    end: number
    duration: number
  }
  headers: Record<string, string>
  isAPI: boolean
  isThirdParty: boolean
}

interface HARCaptureResult {
  url: string
  har?: any
  network: {
    requests: NetworkEntry[]
    totalRequests: number
    totalSize: number
    apiCalls: number
    thirdPartyRequests: number
    blockedRequests: number
  }
  console: any[]
  cookies: any[]
  localStorage: Record<string, any>
  timing: {
    navigationStart: number
    domContentLoaded: number
    loadComplete: number
  }
}

// Since we can't run Puppeteer/Playwright in edge functions,
// we'll use JINA's browser rendering capabilities
async function captureWithJINA(url: string, options?: HARCaptureRequest['options']): Promise<HARCaptureResult> {
  const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
  
  if (!JINA_API_KEY) {
    throw new Error('JINA API key not configured')
  }
  
  // Use JINA Reader with browser mode to get JavaScript-rendered content
  const browserUrl = `https://r.jina.ai/${url}`
  const headers = {
    'Authorization': `Bearer ${JINA_API_KEY}`,
    'X-Return-Format': 'html',
    'X-Wait-For-Selector': 'body',
    'X-Timeout': '30000'
  }
  
  console.log(`Capturing browser render for: ${url}`)
  
  const response = await fetch(browserUrl, {
    method: 'GET',
    headers
  })
  
  if (!response.ok) {
    throw new Error(`Browser capture failed: ${response.statusText}`)
  }
  
  const html = await response.text()
  
  // Extract network requests from inline scripts and resource loading
  const networkRequests = extractNetworkRequests(html, url)
  
  // Analyze third-party and API requests
  const analyzedRequests = analyzeNetworkRequests(networkRequests, url)
  
  // Extract console logs if embedded in HTML
  const consoleLogs = extractConsoleLogs(html)
  
  // Extract localStorage hints
  const localStorageData = extractLocalStorageHints(html)
  
  // Calculate network statistics
  const networkStats = {
    requests: analyzedRequests,
    totalRequests: analyzedRequests.length,
    totalSize: analyzedRequests.reduce((sum, req) => sum + req.size, 0),
    apiCalls: analyzedRequests.filter(req => req.isAPI).length,
    thirdPartyRequests: analyzedRequests.filter(req => req.isThirdParty).length,
    blockedRequests: 0
  }
  
  return {
    url,
    network: networkStats,
    console: consoleLogs,
    cookies: [], // Would need real browser to capture
    localStorage: localStorageData,
    timing: {
      navigationStart: Date.now(),
      domContentLoaded: Date.now() + 100,
      loadComplete: Date.now() + 200
    }
  }
}

function extractNetworkRequests(html: string, baseUrl: string): NetworkEntry[] {
  const requests: NetworkEntry[] = []
  const resourcePatterns = [
    // Script tags
    /<script[^>]+src=["']([^"']+)["']/gi,
    // Link tags (CSS, preload, etc.)
    /<link[^>]+href=["']([^"']+)["']/gi,
    // Images
    /<img[^>]+src=["']([^"']+)["']/gi,
    // Fetch/XHR in inline scripts
    /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g,
    // API endpoints
    /["'`](\/api\/[^"'`]+)["'`]/g,
    // GraphQL endpoints
    /["'`](\/graphql[^"'`]*)["'`]/g
  ]
  
  for (const pattern of resourcePatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      try {
        const resourceUrl = new URL(match[1], baseUrl).href
        
        // Determine resource type
        let type = 'other'
        if (pattern.source.includes('script')) type = 'script'
        else if (pattern.source.includes('link')) type = 'stylesheet'
        else if (pattern.source.includes('img')) type = 'image'
        else if (match[1].includes('/api/') || match[1].includes('graphql')) type = 'xhr'
        
        requests.push({
          url: resourceUrl,
          method: type === 'xhr' ? 'POST' : 'GET',
          status: 200, // Assumed since we can't get real status
          type,
          size: 0, // Would need real response to calculate
          timing: {
            start: 0,
            end: 100,
            duration: 100
          },
          headers: {},
          isAPI: false,
          isThirdParty: false
        })
      } catch {}
    }
  }
  
  return requests
}

function analyzeNetworkRequests(requests: NetworkEntry[], baseUrl: string): NetworkEntry[] {
  const baseDomain = new URL(baseUrl).hostname
  
  return requests.map(req => {
    const reqDomain = new URL(req.url).hostname
    
    // Determine if API call
    req.isAPI = req.url.includes('/api/') || 
                req.url.includes('/graphql') || 
                req.url.includes('/v1/') ||
                req.url.includes('/v2/') ||
                req.type === 'xhr'
    
    // Determine if third-party
    req.isThirdParty = reqDomain !== baseDomain && 
                       !reqDomain.endsWith(`.${baseDomain}`)
    
    // Estimate sizes based on type
    if (req.size === 0) {
      switch (req.type) {
        case 'script': req.size = 50000; break
        case 'stylesheet': req.size = 20000; break
        case 'image': req.size = 100000; break
        case 'xhr': req.size = 5000; break
        default: req.size = 10000
      }
    }
    
    return req
  })
}

function extractConsoleLogs(html: string): any[] {
  const logs: any[] = []
  
  // Look for console.log patterns in inline scripts
  const consolePattern = /console\.(log|error|warn|info)\s*\(\s*["'`]([^"'`]+)["'`]/g
  let match
  
  while ((match = consolePattern.exec(html)) !== null) {
    logs.push({
      level: match[1],
      message: match[2],
      timestamp: new Date().toISOString()
    })
  }
  
  return logs
}

function extractLocalStorageHints(html: string): Record<string, any> {
  const storage: Record<string, any> = {}
  
  // Look for localStorage patterns
  const patterns = [
    /localStorage\.setItem\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([^"'`]+)["'`]/g,
    /localStorage\.getItem\s*\(\s*["'`]([^"'`]+)["'`]/g,
    /localStorage\[["'`]([^"'`]+)["'`]\]/g
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const key = match[1]
      const value = match[2] || 'unknown'
      storage[key] = value
    }
  }
  
  return storage
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: HARCaptureRequest = await req.json()
    console.log(`Starting HAR capture for ${request.url}`)
    
    // Capture browser data
    const result = await captureWithJINA(request.url, request.options)
    
    // Analyze the results for insights
    const insights = {
      hasAPICalls: result.network.apiCalls > 0,
      usesGraphQL: result.network.requests.some(r => r.url.includes('graphql')),
      thirdPartyPercentage: (result.network.thirdPartyRequests / result.network.totalRequests) * 100,
      estimatedLoadSize: result.network.totalSize,
      apiEndpoints: result.network.requests
        .filter(r => r.isAPI)
        .map(r => ({ url: r.url, method: r.method })),
      thirdPartyDomains: [...new Set(
        result.network.requests
          .filter(r => r.isThirdParty)
          .map(r => new URL(r.url).hostname)
      )],
      suspectedTechnologies: detectTechnologiesFromRequests(result.network.requests)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        url: result.url,
        capturedAt: new Date().toISOString(),
        network: result.network,
        insights,
        console: result.console,
        localStorage: result.localStorage
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

function detectTechnologiesFromRequests(requests: NetworkEntry[]): string[] {
  const technologies: string[] = []
  
  for (const req of requests) {
    const url = req.url.toLowerCase()
    
    // CDN detection
    if (url.includes('cloudflare')) technologies.push('Cloudflare')
    if (url.includes('fastly')) technologies.push('Fastly')
    if (url.includes('akamai')) technologies.push('Akamai')
    
    // Analytics
    if (url.includes('google-analytics')) technologies.push('Google Analytics')
    if (url.includes('segment.com')) technologies.push('Segment')
    if (url.includes('mixpanel')) technologies.push('Mixpanel')
    if (url.includes('amplitude')) technologies.push('Amplitude')
    
    // Frameworks from CDN
    if (url.includes('react')) technologies.push('React')
    if (url.includes('vue')) technologies.push('Vue.js')
    if (url.includes('angular')) technologies.push('Angular')
    if (url.includes('jquery')) technologies.push('jQuery')
    
    // Payment
    if (url.includes('stripe')) technologies.push('Stripe')
    if (url.includes('paypal')) technologies.push('PayPal')
    
    // Customer support
    if (url.includes('intercom')) technologies.push('Intercom')
    if (url.includes('zendesk')) technologies.push('Zendesk')
  }
  
  return [...new Set(technologies)]
} 