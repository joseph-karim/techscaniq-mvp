import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface CrawlRequest {
  scanId: string
  targetUrl: string
  depth?: number
  options?: {
    captureHAR?: boolean
    captureDataLayer?: boolean
    captureScreenshots?: boolean
    followSubdomains?: boolean
  }
}

interface CrawlResult {
  url: string
  status: number
  contentType: string
  artifacts: {
    html?: string
    har?: any
    dataLayer?: any[]
    headers?: Record<string, string>
    scripts?: ScriptInfo[]
    apis?: ApiEndpoint[]
    technologies?: TechStack[]
    security?: SecurityInfo
    performance?: PerformanceMetrics
  }
  metadata: {
    capturedAt: string
    renderTime: number
    resourceCount: number
    errorCount: number
  }
}

interface ScriptInfo {
  src?: string
  inline?: boolean
  size: number
  hash: string
  framework?: string
}

interface ApiEndpoint {
  url: string
  method: string
  status: number
  type?: 'REST' | 'GraphQL' | 'WebSocket'
  responseTime?: number
}

interface TechStack {
  name: string
  version?: string
  confidence: number
  source: string[]
}

interface SecurityInfo {
  headers: Record<string, string>
  cspScore?: string
  tlsVersion?: string
  securityIssues: string[]
}

interface PerformanceMetrics {
  ttfb: number
  domContentLoaded: number
  loadComplete: number
  largestContentfulPaint?: number
  bundleSizes: Record<string, number>
}

// Since we can't use Playwright in edge functions directly,
// we'll use a hybrid approach with enhanced fetch capabilities
async function deepCrawl(request: CrawlRequest): Promise<CrawlResult[]> {
  const results: CrawlResult[] = []
  const visited = new Set<string>()
  const queue = [request.targetUrl]
  
  while (queue.length > 0 && results.length < (request.depth || 10)) {
    const url = queue.shift()!
    if (visited.has(url)) continue
    visited.add(url)
    
    try {
      const result = await crawlPage(url, request)
      results.push(result)
      
      // Extract additional URLs to crawl
      const links = extractLinks(result.artifacts.html || '', url)
      for (const link of links) {
        if (shouldCrawl(link, request)) {
          queue.push(link)
        }
      }
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error)
    }
  }
  
  return results
}

async function crawlPage(url: string, request: CrawlRequest): Promise<CrawlResult> {
  const startTime = Date.now()
  const artifacts: CrawlResult['artifacts'] = {}
  const metadata: CrawlResult['metadata'] = {
    capturedAt: new Date().toISOString(),
    renderTime: 0,
    resourceCount: 0,
    errorCount: 0
  }
  
  // Fetch the main HTML
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TechScanIQ/1.0; +https://techscaniq.com/bot)'
    }
  })
  
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })
  artifacts.headers = headers
  
  const html = await response.text()
  artifacts.html = html
  
  // Parse HTML to extract scripts, styles, and other resources
  artifacts.scripts = await extractScripts(html, url)
  
  // Extract technology stack
  artifacts.technologies = detectTechnologies(html, headers, artifacts.scripts)
  
  // Analyze security headers
  artifacts.security = analyzeSecurityHeaders(headers)
  
  // Extract API endpoints from scripts
  artifacts.apis = await discoverAPIs(html, artifacts.scripts, url)
  
  // Simulate dataLayer extraction (would need real browser)
  if (request.options?.captureDataLayer) {
    artifacts.dataLayer = extractDataLayerHints(html)
  }
  
  metadata.renderTime = Date.now() - startTime
  metadata.resourceCount = artifacts.scripts?.length || 0
  
  return {
    url,
    status: response.status,
    contentType: headers['content-type'] || 'text/html',
    artifacts,
    metadata
  }
}

function extractScripts(html: string, baseUrl: string): ScriptInfo[] {
  const scripts: ScriptInfo[] = []
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi
  const srcRegex = /src=["']([^"']+)["']/i
  
  let match
  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = match[1]
    const content = match[2]
    const srcMatch = srcRegex.exec(attrs)
    
    if (srcMatch) {
      // External script
      const src = new URL(srcMatch[1], baseUrl).href
      scripts.push({
        src,
        inline: false,
        size: 0,
        hash: hashString(src),
        framework: detectFrameworkFromUrl(src)
      })
    } else if (content.trim()) {
      // Inline script
      scripts.push({
        inline: true,
        size: content.length,
        hash: hashString(content),
        framework: detectFrameworkFromCode(content)
      })
    }
  }
  
  return scripts
}

function detectTechnologies(html: string, headers: Record<string, string>, scripts: ScriptInfo[]): TechStack[] {
  const techs: TechStack[] = []
  
  // React detection
  if (html.includes('react') || scripts.some(s => s.framework === 'react')) {
    techs.push({
      name: 'React',
      version: extractReactVersion(html, scripts),
      confidence: 0.9,
      source: ['script-tag', 'framework-detection']
    })
  }
  
  // Next.js detection
  if (html.includes('__NEXT_DATA__') || scripts.some(s => s.src?.includes('_next'))) {
    techs.push({
      name: 'Next.js',
      confidence: 0.95,
      source: ['inline-script', 'url-pattern']
    })
  }
  
  // Vue detection
  if (html.includes('Vue.js') || scripts.some(s => s.framework === 'vue')) {
    techs.push({
      name: 'Vue.js',
      confidence: 0.9,
      source: ['script-tag']
    })
  }
  
  // Server detection from headers
  if (headers['server']) {
    techs.push({
      name: headers['server'],
      confidence: 1.0,
      source: ['http-header']
    })
  }
  
  // CDN detection
  if (headers['x-powered-by']) {
    techs.push({
      name: headers['x-powered-by'],
      confidence: 1.0,
      source: ['http-header']
    })
  }
  
  return techs
}

function analyzeSecurityHeaders(headers: Record<string, string>): SecurityInfo {
  const securityIssues: string[] = []
  
  // Check for missing security headers
  const requiredHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'content-security-policy'
  ]
  
  for (const header of requiredHeaders) {
    if (!headers[header]) {
      securityIssues.push(`Missing ${header} header`)
    }
  }
  
  // Analyze CSP if present
  const csp = headers['content-security-policy']
  let cspScore = 'N/A'
  if (csp) {
    cspScore = gradeCSP(csp)
  }
  
  return {
    headers: Object.fromEntries(
      Object.entries(headers).filter(([k]) => 
        k.toLowerCase().includes('security') || 
        k.toLowerCase().includes('content-') ||
        k.toLowerCase().startsWith('x-')
      )
    ),
    cspScore,
    securityIssues
  }
}

async function discoverAPIs(html: string, scripts: ScriptInfo[], baseUrl: string): Promise<ApiEndpoint[]> {
  const apis: ApiEndpoint[] = []
  const apiPatterns = [
    /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g,
    /axios\s*\.\s*(get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/g,
    /XMLHttpRequest.*open\s*\(\s*["'](\w+)["']\s*,\s*["']([^"']+)["']/g,
    /\/api\/[^"'\s]*/g,
    /\/graphql/gi
  ]
  
  // Search in HTML and inline scripts
  for (const pattern of apiPatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const url = match[match.length - 1]
      if (url && url.startsWith('/')) {
        apis.push({
          url: new URL(url, baseUrl).href,
          method: 'GET',
          status: 0,
          type: url.includes('graphql') ? 'GraphQL' : 'REST'
        })
      }
    }
  }
  
  return apis
}

function extractDataLayerHints(html: string): any[] {
  const dataLayer: any[] = []
  
  // Look for GTM/GA patterns
  const gtmPattern = /dataLayer\.push\s*\(\s*({[^}]+})\s*\)/g
  let match
  while ((match = gtmPattern.exec(html)) !== null) {
    try {
      const obj = JSON.parse(match[1].replace(/'/g, '"'))
      dataLayer.push(obj)
    } catch {}
  }
  
  return dataLayer
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = []
  const linkRegex = /href=["']([^"']+)["']/gi
  let match
  
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl).href
      if (url.startsWith('http')) {
        links.push(url)
      }
    } catch {}
  }
  
  return links
}

function shouldCrawl(url: string, request: CrawlRequest): boolean {
  const targetDomain = new URL(request.targetUrl).hostname
  const urlDomain = new URL(url).hostname
  
  // Only crawl same domain unless subdomain following is enabled
  if (request.options?.followSubdomains) {
    return urlDomain.endsWith(targetDomain.split('.').slice(-2).join('.'))
  }
  
  return urlDomain === targetDomain
}

function detectFrameworkFromUrl(url: string): string | undefined {
  if (url.includes('react')) return 'react'
  if (url.includes('vue')) return 'vue'
  if (url.includes('angular')) return 'angular'
  if (url.includes('jquery')) return 'jquery'
  return undefined
}

function detectFrameworkFromCode(code: string): string | undefined {
  if (code.includes('React.createElement')) return 'react'
  if (code.includes('Vue.component')) return 'vue'
  if (code.includes('angular.module')) return 'angular'
  return undefined
}

function extractReactVersion(html: string, scripts: ScriptInfo[]): string | undefined {
  const versionRegex = /react@([0-9.]+)/
  for (const script of scripts) {
    if (script.src) {
      const match = versionRegex.exec(script.src)
      if (match) return match[1]
    }
  }
  return undefined
}

function gradeCSP(csp: string): string {
  // Simplified CSP grading
  let score = 100
  
  if (!csp.includes("default-src")) score -= 20
  if (csp.includes("unsafe-inline")) score -= 30
  if (csp.includes("unsafe-eval")) score -= 30
  if (!csp.includes("upgrade-insecure-requests")) score -= 10
  
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: CrawlRequest = await req.json()
    console.log(`Starting deep crawl for ${request.targetUrl}`)
    
    // Perform the crawl
    const results = await deepCrawl(request)
    
    // Store results in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Store each crawled page
    for (const result of results) {
      const { error } = await supabase
        .from('crawl_results')
        .insert({
          scan_id: request.scanId,
          url: result.url,
          status: result.status,
          content_type: result.contentType,
          artifacts: result.artifacts,
          metadata: result.metadata
        })
      
      if (error) {
        console.error('Failed to store crawl result:', error)
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        scanId: request.scanId,
        pagesCount: results.length,
        results: results.map(r => ({
          url: r.url,
          status: r.status,
          technologies: r.artifacts.technologies,
          apis: r.artifacts.apis?.length || 0,
          scripts: r.artifacts.scripts?.length || 0,
          securityScore: r.artifacts.security?.cspScore
        }))
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