import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface PerformanceRequest {
  url: string
  html?: string
  resources?: Array<{
    url: string
    type: string
    size?: number
    loadTime?: number
  }>
}

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  
  // Other metrics
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  tti: number // Time to Interactive
  tbt: number // Total Blocking Time
  
  // Resource metrics
  totalSize: number
  jsSize: number
  cssSize: number
  imageSize: number
  fontSize: number
  requestCount: number
}

interface PerformanceReport {
  url: string
  score: number
  metrics: PerformanceMetrics
  diagnostics: Array<{
    id: string
    title: string
    description: string
    score: number
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

// Simulate performance metrics based on HTML and resources
function analyzePerformance(html: string, resources: any[]): PerformanceMetrics {
  // Calculate resource sizes
  let totalSize = 0
  let jsSize = 0
  let cssSize = 0
  let imageSize = 0
  let fontSize = 0
  
  for (const resource of resources) {
    const size = resource.size || estimateResourceSize(resource.url)
    totalSize += size
    
    if (resource.type === 'script' || resource.url.match(/\.(js|mjs)$/i)) {
      jsSize += size
    } else if (resource.type === 'stylesheet' || resource.url.match(/\.css$/i)) {
      cssSize += size
    } else if (resource.type === 'image' || resource.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      imageSize += size
    } else if (resource.type === 'font' || resource.url.match(/\.(woff|woff2|ttf|otf)$/i)) {
      fontSize += size
    }
  }
  
  // Simulate Core Web Vitals based on resource analysis
  const baseLoadTime = 500 // Base time in ms
  const sizeImpact = totalSize / 10000 // 10KB = 1ms impact
  const jsImpact = jsSize / 5000 // JS has higher impact
  
  return {
    // Simulate LCP based on largest image or total size
    lcp: baseLoadTime + sizeImpact * 2 + Math.random() * 500,
    
    // Simulate FID based on JS size
    fid: 50 + jsImpact + Math.random() * 50,
    
    // Simulate CLS based on number of images and fonts
    cls: (imageSize > 0 ? 0.05 : 0) + (fontSize > 0 ? 0.03 : 0) + Math.random() * 0.02,
    
    // Other metrics
    fcp: baseLoadTime + sizeImpact + Math.random() * 200,
    ttfb: 100 + Math.random() * 200,
    tti: baseLoadTime + sizeImpact * 3 + jsImpact * 2,
    tbt: jsImpact * 10 + Math.random() * 100,
    
    // Resource metrics
    totalSize,
    jsSize,
    cssSize,
    imageSize,
    fontSize,
    requestCount: resources.length
  }
}

function estimateResourceSize(url: string): number {
  // Estimate size based on file type
  if (url.match(/\.(js|mjs)$/i)) return 50000 // 50KB average
  if (url.match(/\.css$/i)) return 20000 // 20KB average
  if (url.match(/\.(jpg|jpeg|png)$/i)) return 100000 // 100KB average
  if (url.match(/\.(gif|webp)$/i)) return 80000 // 80KB average
  if (url.match(/\.svg$/i)) return 5000 // 5KB average
  if (url.match(/\.(woff|woff2)$/i)) return 30000 // 30KB average
  return 10000 // 10KB default
}

function generateDiagnostics(metrics: PerformanceMetrics, html: string): any[] {
  const diagnostics: any[] = []
  
  // LCP diagnostic
  diagnostics.push({
    id: 'largest-contentful-paint',
    title: 'Largest Contentful Paint',
    description: `LCP marks the time at which the largest text or image is painted`,
    score: metrics.lcp < 2500 ? 1 : metrics.lcp < 4000 ? 0.5 : 0,
    details: {
      value: metrics.lcp,
      displayValue: `${(metrics.lcp / 1000).toFixed(1)} s`
    }
  })
  
  // FID diagnostic
  diagnostics.push({
    id: 'first-input-delay',
    title: 'First Input Delay',
    description: `FID measures the time from user interaction to browser response`,
    score: metrics.fid < 100 ? 1 : metrics.fid < 300 ? 0.5 : 0,
    details: {
      value: metrics.fid,
      displayValue: `${metrics.fid.toFixed(0)} ms`
    }
  })
  
  // CLS diagnostic
  diagnostics.push({
    id: 'cumulative-layout-shift',
    title: 'Cumulative Layout Shift',
    description: `CLS measures visual stability`,
    score: metrics.cls < 0.1 ? 1 : metrics.cls < 0.25 ? 0.5 : 0,
    details: {
      value: metrics.cls,
      displayValue: metrics.cls.toFixed(3)
    }
  })
  
  // JavaScript size diagnostic
  if (metrics.jsSize > 200000) { // 200KB
    diagnostics.push({
      id: 'javascript-size',
      title: 'JavaScript Bundle Size',
      description: 'Large JavaScript bundles can impact performance',
      score: metrics.jsSize < 100000 ? 1 : metrics.jsSize < 300000 ? 0.5 : 0,
      details: {
        value: metrics.jsSize,
        displayValue: `${(metrics.jsSize / 1024).toFixed(0)} KB`
      }
    })
  }
  
  return diagnostics
}

function generateOpportunities(metrics: PerformanceMetrics, html: string): any[] {
  const opportunities: any[] = []
  
  // Image optimization
  if (metrics.imageSize > 500000) { // 500KB
    opportunities.push({
      id: 'image-optimization',
      title: 'Optimize Images',
      description: 'Use modern formats like WebP and proper sizing',
      estimatedSavings: {
        bytes: metrics.imageSize * 0.4, // 40% potential savings
        ms: 500
      }
    })
  }
  
  // JavaScript reduction
  if (metrics.jsSize > 300000) { // 300KB
    opportunities.push({
      id: 'reduce-javascript',
      title: 'Reduce JavaScript Bundle Size',
      description: 'Use code splitting and remove unused code',
      estimatedSavings: {
        bytes: metrics.jsSize * 0.3, // 30% potential savings
        ms: 300
      }
    })
  }
  
  // Minification check
  if (html.includes('    ') || html.includes('\n\n')) {
    opportunities.push({
      id: 'minify-resources',
      title: 'Minify HTML, CSS, and JavaScript',
      description: 'Remove unnecessary characters from your code',
      estimatedSavings: {
        bytes: metrics.totalSize * 0.1, // 10% potential savings
        ms: 100
      }
    })
  }
  
  // Too many requests
  if (metrics.requestCount > 50) {
    opportunities.push({
      id: 'reduce-requests',
      title: 'Reduce Number of HTTP Requests',
      description: 'Combine files and use resource hints',
      estimatedSavings: {
        ms: (metrics.requestCount - 20) * 10
      }
    })
  }
  
  return opportunities
}

function calculateScore(metrics: PerformanceMetrics): number {
  // Weight each metric
  const weights = {
    lcp: 0.25,
    fid: 0.25,
    cls: 0.25,
    fcp: 0.1,
    tti: 0.1,
    tbt: 0.05
  }
  
  // Score each metric (0-100)
  const scores = {
    lcp: metrics.lcp < 2500 ? 100 : metrics.lcp < 4000 ? 50 : 0,
    fid: metrics.fid < 100 ? 100 : metrics.fid < 300 ? 50 : 0,
    cls: metrics.cls < 0.1 ? 100 : metrics.cls < 0.25 ? 50 : 0,
    fcp: metrics.fcp < 1800 ? 100 : metrics.fcp < 3000 ? 50 : 0,
    tti: metrics.tti < 3800 ? 100 : metrics.tti < 7300 ? 50 : 0,
    tbt: metrics.tbt < 200 ? 100 : metrics.tbt < 600 ? 50 : 0
  }
  
  // Calculate weighted score
  let totalScore = 0
  for (const [metric, weight] of Object.entries(weights)) {
    totalScore += scores[metric as keyof typeof scores] * weight
  }
  
  return Math.round(totalScore)
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
    
    // Extract resources from HTML if not provided
    const resources = request.resources || []
    if (request.html && resources.length === 0) {
      // Extract script tags
      const scripts = request.html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || []
      scripts.forEach(tag => {
        const match = tag.match(/src=["']([^"']+)["']/)
        if (match) {
          resources.push({ url: match[1], type: 'script' })
        }
      })
      
      // Extract stylesheets
      const stylesheets = request.html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi) || []
      stylesheets.forEach(tag => {
        const match = tag.match(/href=["']([^"']+)["']/)
        if (match) {
          resources.push({ url: match[1], type: 'stylesheet' })
        }
      })
      
      // Extract images
      const images = request.html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi) || []
      images.forEach(tag => {
        const match = tag.match(/src=["']([^"']+)["']/)
        if (match) {
          resources.push({ url: match[1], type: 'image' })
        }
      })
    }
    
    // Analyze performance
    const metrics = analyzePerformance(request.html || '', resources)
    const diagnostics = generateDiagnostics(metrics, request.html || '')
    const opportunities = generateOpportunities(metrics, request.html || '')
    const score = calculateScore(metrics)
    
    const report: PerformanceReport = {
      url: request.url,
      score,
      metrics,
      diagnostics,
      opportunities
    }
    
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