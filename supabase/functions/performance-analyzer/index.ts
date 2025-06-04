import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-google-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface PerformanceRequest {
  url: string
  category?: 'performance' | 'accessibility' | 'best-practices' | 'seo'
  strategy?: 'mobile' | 'desktop'
}

interface PageSpeedMetrics {
  // Core Web Vitals from PageSpeed
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay (deprecated)
  cls?: number // Cumulative Layout Shift
  inp?: number // Interaction to Next Paint (new metric)
  
  // Other Lighthouse metrics
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  tti?: number // Time to Interactive
  tbt?: number // Total Blocking Time
  si?: number // Speed Index
  
  // Overall scores
  performanceScore: number
  accessibilityScore?: number
  bestPracticesScore?: number
  seoScore?: number
}

interface PerformanceReport {
  url: string
  strategy: string
  lighthouseVersion: string
  metrics: PageSpeedMetrics
  audits: Array<{
    id: string
    title: string
    description: string
    score: number | null
    displayValue?: string
    details?: any
  }>
  opportunities: Array<{
    id: string
    title: string
    description: string
    estimatedSavings?: {
      bytes?: number
      ms?: number
    }
  }>
}

// Timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 30000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
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

async function analyzeWithPageSpeed(
  url: string, 
  strategy: 'mobile' | 'desktop' = 'mobile', 
  req?: Request
): Promise<PerformanceReport> {
  // Check for API key in environment first, then in headers for local dev
  let apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey && req) {
    apiKey = req.headers.get('x-google-api-key') || ''
  }
  
  if (!apiKey) {
    throw new Error('Google API key not configured')
  }

  const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  apiUrl.searchParams.set('url', url)
  apiUrl.searchParams.set('key', apiKey)
  apiUrl.searchParams.set('strategy', strategy)
  apiUrl.searchParams.set('category', 'performance')
  apiUrl.searchParams.set('category', 'accessibility')
  apiUrl.searchParams.set('category', 'best-practices')
  apiUrl.searchParams.set('category', 'seo')

  console.log(`Running PageSpeed Insights analysis for: ${url} (${strategy})`)

  const response = await fetchWithTimeout(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  }, 30000)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('PageSpeed API error:', response.status, errorText)
    throw new Error(`PageSpeed API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('PageSpeed analysis completed')

  // Extract metrics from Lighthouse results
  const lighthouseResult = data.lighthouseResult
  const audits = lighthouseResult.audits
  const categories = lighthouseResult.categories

  const metrics: PageSpeedMetrics = {
    performanceScore: Math.round((categories.performance?.score || 0) * 100),
    accessibilityScore: Math.round((categories.accessibility?.score || 0) * 100),
    bestPracticesScore: Math.round((categories['best-practices']?.score || 0) * 100),
    seoScore: Math.round((categories.seo?.score || 0) * 100),
    
    // Core Web Vitals (in milliseconds or ratio)
    lcp: audits['largest-contentful-paint']?.numericValue,
    fcp: audits['first-contentful-paint']?.numericValue,
    cls: audits['cumulative-layout-shift']?.numericValue,
    tti: audits['interactive']?.numericValue,
    tbt: audits['total-blocking-time']?.numericValue,
    si: audits['speed-index']?.numericValue,
    ttfb: audits['server-response-time']?.numericValue,
    inp: audits['experimental-interaction-to-next-paint']?.numericValue
  }

  // Extract important audits
  const importantAudits = [
    'largest-contentful-paint',
    'first-contentful-paint',
    'cumulative-layout-shift',
    'interactive',
    'total-blocking-time',
    'speed-index',
    'server-response-time'
  ]

  const auditResults = importantAudits.map(auditId => {
    const audit = audits[auditId]
    return {
      id: auditId,
      title: audit?.title || auditId,
      description: audit?.description || '',
      score: audit?.score,
      displayValue: audit?.displayValue,
      details: audit?.details
    }
  }).filter(audit => audit.score !== undefined)

  // Extract opportunities (performance improvements)
  const opportunities = Object.keys(audits)
    .filter(auditId => audits[auditId].details?.type === 'opportunity')
    .map(auditId => {
      const audit = audits[auditId]
      return {
        id: auditId,
        title: audit.title,
        description: audit.description,
        estimatedSavings: {
          bytes: audit.details?.overallSavingsBytes,
          ms: audit.details?.overallSavingsMs
        }
      }
    })
    .filter(opp => opp.estimatedSavings.bytes || opp.estimatedSavings.ms)

  return {
    url,
    strategy,
    lighthouseVersion: lighthouseResult.lighthouseVersion,
    metrics,
    audits: auditResults,
    opportunities
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: PerformanceRequest = await req.json()
    
    if (!request.url) {
      throw new Error('URL is required')
    }
    
    console.log(`Performance analysis for: ${request.url}`)
    
    const strategy = request.strategy || 'mobile'
    const report = await analyzeWithPageSpeed(request.url, strategy, req)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: report
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