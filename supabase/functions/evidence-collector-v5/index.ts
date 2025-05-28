import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface EvidenceRequest {
  companyName: string
  companyWebsite: string
  evidenceTypes?: string[]
  depth?: 'shallow' | 'deep' | 'comprehensive'
}

interface Evidence {
  id: string
  type: string
  source: {
    url?: string
    query?: string
    tool?: string
    timestamp: string
  }
  content: {
    raw: string
    processed?: string
    summary?: string
  }
  metadata?: {
    relevance?: number
    confidence?: number
    technologies?: string[]
    apis?: any[]
    security?: any
    performance?: any
  }
}

// Call internal Supabase function
async function callSupabaseFunction(functionName: string, payload: any): Promise<any> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Function ${functionName} failed: ${error}`)
  }
  
  return response.json()
}

// Collect webpage content with JINA
async function collectWebContent(url: string): Promise<Evidence | null> {
  try {
    console.log(`Collecting web content from: ${url}`)
    
    const result = await callSupabaseFunction('jina-collector', {
      type: 'reader',
      url
    })
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return {
      id: crypto.randomUUID(),
      type: 'webpage_content',
      source: {
        url,
        tool: 'jina-reader',
        timestamp: result.data.timestamp
      },
      content: {
        raw: result.data.content,
        summary: result.data.content.substring(0, 500) + '...'
      },
      metadata: {
        relevance: 0.95,
        confidence: 1.0
      }
    }
  } catch (error) {
    console.error('Web content collection error:', error)
    return null
  }
}

// Analyze with Wappalyzer
async function analyzeTechnologies(html: string, url: string, headers?: Record<string, string>): Promise<Evidence | null> {
  try {
    console.log(`Analyzing technologies for: ${url}`)
    
    const result = await callSupabaseFunction('wappalyzer-analyzer', {
      html,
      url,
      headers
    })
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return {
      id: crypto.randomUUID(),
      type: 'technology_analysis',
      source: {
        url,
        tool: 'wappalyzer',
        timestamp: result.data.timestamp
      },
      content: {
        raw: JSON.stringify(result.data),
        processed: JSON.stringify(result.data.technologies),
        summary: `Detected ${result.data.summary.total} technologies: ${result.data.summary.topTechnologies.join(', ')}`
      },
      metadata: {
        technologies: result.data.technologies.map((t: any) => t.name),
        relevance: 1.0,
        confidence: 0.9
      }
    }
  } catch (error) {
    console.error('Technology analysis error:', error)
    return null
  }
}

// Security scan
async function performSecurityScan(url: string, html: string, headers?: Record<string, string>): Promise<Evidence | null> {
  try {
    console.log(`Security scan for: ${url}`)
    
    const result = await callSupabaseFunction('security-scanner', {
      url,
      html,
      headers
    })
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return {
      id: crypto.randomUUID(),
      type: 'security_analysis',
      source: {
        url,
        tool: 'security-scanner',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(result.data),
        processed: JSON.stringify(result.data.findings),
        summary: `Security Score: ${result.data.score}/100 (Grade: ${result.data.grade}). Found ${result.data.summary.critical} critical, ${result.data.summary.high} high issues`
      },
      metadata: {
        security: result.data,
        relevance: 1.0,
        confidence: 0.95
      }
    }
  } catch (error) {
    console.error('Security scan error:', error)
    return null
  }
}

// Performance analysis
async function analyzePerformance(url: string, html: string): Promise<Evidence | null> {
  try {
    console.log(`Performance analysis for: ${url}`)
    
    const result = await callSupabaseFunction('performance-analyzer', {
      url,
      html
    })
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return {
      id: crypto.randomUUID(),
      type: 'performance_analysis',
      source: {
        url,
        tool: 'performance-analyzer',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(result.data),
        processed: JSON.stringify(result.data.metrics),
        summary: `Performance Score: ${result.data.score}/100. LCP: ${(result.data.metrics.lcp/1000).toFixed(1)}s, FID: ${result.data.metrics.fid}ms, CLS: ${result.data.metrics.cls}`
      },
      metadata: {
        performance: result.data,
        relevance: 1.0,
        confidence: 0.85
      }
    }
  } catch (error) {
    console.error('Performance analysis error:', error)
    return null
  }
}

// Search with JINA
async function searchCompanyInfo(query: string): Promise<Evidence[]> {
  try {
    console.log(`Searching for: ${query}`)
    
    const result = await callSupabaseFunction('jina-collector', {
      type: 'search',
      query
    })
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    const evidence: Evidence[] = []
    const searchResults = result.data.results
    
    // Process top results
    for (const item of (searchResults.data || []).slice(0, 3)) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'search_result',
        source: {
          url: item.url,
          query,
          tool: 'jina-search',
          timestamp: result.data.timestamp
        },
        content: {
          raw: item.content || item.description || '',
          summary: item.title || ''
        },
        metadata: {
          relevance: 0.8,
          confidence: 0.9
        }
      })
    }
    
    return evidence
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

// Enhanced Playwright crawl
async function deepCrawl(url: string, depth: number): Promise<Evidence[]> {
  try {
    console.log(`Deep crawling: ${url} (depth: ${depth})`)
    
    const result = await callSupabaseFunction('playwright-crawler', {
      url,
      depth,
      options: {
        extractScripts: true,
        extractAPIs: true,
        screenshot: true,
        waitForSelector: 'body'
      }
    })
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    const evidence: Evidence[] = []
    
    for (const crawlResult of result.results || []) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'deep_crawl_result',
        source: {
          url: crawlResult.url,
          tool: 'playwright-deep-crawler',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: JSON.stringify(crawlResult),
          processed: JSON.stringify({
            technologies: crawlResult.technologies,
            apis: crawlResult.apis,
            scripts: crawlResult.scripts,
            metrics: crawlResult.metrics
          }),
          summary: `Crawled ${crawlResult.url}: ${crawlResult.title}`
        },
        metadata: {
          technologies: crawlResult.technologies?.map((t: any) => t.name) || [],
          apis: crawlResult.apis,
          relevance: 1.0,
          confidence: 0.95
        }
      })
    }
    
    return evidence
  } catch (error) {
    console.error('Deep crawl error:', error)
    return []
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: EvidenceRequest = await req.json()
    const collectionId = crypto.randomUUID()
    const startTime = Date.now()
    
    console.log(`Starting evidence collection v5 for ${request.companyName}`)
    console.log(`Website: ${request.companyWebsite}`)
    console.log(`Depth: ${request.depth || 'shallow'}`)
    console.log(`Using OSS tools: Wappalyzer, Security Scanner, Performance Analyzer`)
    
    const allEvidence: Evidence[] = []
    
    // First, collect the main webpage content
    const webContent = await collectWebContent(request.companyWebsite)
    if (webContent) {
      allEvidence.push(webContent)
      
      // Extract HTML for analysis
      const html = webContent.content.raw
      
      // Run all OSS tool analyses in parallel
      const [techAnalysis, securityAnalysis, perfAnalysis] = await Promise.allSettled([
        analyzeTechnologies(html, request.companyWebsite),
        performSecurityScan(request.companyWebsite, html),
        analyzePerformance(request.companyWebsite, html)
      ])
      
      // Add successful analyses to evidence
      if (techAnalysis.status === 'fulfilled' && techAnalysis.value) {
        allEvidence.push(techAnalysis.value)
      }
      if (securityAnalysis.status === 'fulfilled' && securityAnalysis.value) {
        allEvidence.push(securityAnalysis.value)
      }
      if (perfAnalysis.status === 'fulfilled' && perfAnalysis.value) {
        allEvidence.push(perfAnalysis.value)
      }
    }
    
    // Depth-based additional collection
    if (request.depth === 'deep' || request.depth === 'comprehensive') {
      // Search for additional information
      const searchQueries = [
        `${request.companyName} technology stack architecture`,
        `${request.companyName} security breach incidents`,
        `${request.companyName} engineering team culture`
      ]
      
      const searchTasks = searchQueries.map(q => searchCompanyInfo(q))
      const searchResults = await Promise.allSettled(searchTasks)
      
      for (const result of searchResults) {
        if (result.status === 'fulfilled') {
          allEvidence.push(...result.value)
        }
      }
      
      // Deep crawl for comprehensive analysis
      if (request.depth === 'comprehensive') {
        const crawlResults = await deepCrawl(request.companyWebsite, 3)
        allEvidence.push(...crawlResults)
      }
    }
    
    console.log(`Evidence collection complete. Total evidence: ${allEvidence.length}`)
    console.log(`Time taken: ${Date.now() - startTime}ms`)
    
    // Store in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    )
    
    // Create collection record
    const { error: collectionError } = await supabase
      .from('evidence_collections')
      .insert({
        id: collectionId,
        company_name: request.companyName,
        company_website: request.companyWebsite,
        evidence_count: allEvidence.length,
        status: 'completed',
        collection_type: 'v5_oss_tools',
        metadata: {
          depth: request.depth,
          processingTime: Date.now() - startTime,
          version: 'v5',
          tools: ['jina', 'wappalyzer', 'security-scanner', 'performance-analyzer', 'playwright']
        }
      })
    
    if (collectionError) {
      console.error('Failed to store collection:', collectionError)
    }
    
    // Store evidence items
    if (allEvidence.length > 0) {
      const evidenceItems = allEvidence.map(e => ({
        ...e,
        collection_id: collectionId,
        company_name: request.companyName,
        company_website: request.companyWebsite,
        breadcrumbs: [], // Required field
        created_at: new Date().toISOString()
      }))
      
      const { error: itemsError } = await supabase
        .from('evidence_items')
        .insert(evidenceItems)
      
      if (itemsError) {
        console.error('Failed to store evidence items:', itemsError)
      }
    }
    
    // Generate comprehensive insights
    const insights = {
      technologiesDetected: allEvidence
        .filter(e => e.type === 'technology_analysis')
        .flatMap(e => e.metadata?.technologies || []),
      securityFindings: allEvidence
        .filter(e => e.type === 'security_analysis')
        .map(e => e.metadata?.security)
        .filter(Boolean),
      performanceMetrics: allEvidence
        .filter(e => e.type === 'performance_analysis')
        .map(e => e.metadata?.performance)
        .filter(Boolean),
      evidenceByType: allEvidence.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        collectionId,
        evidence: allEvidence,
        summary: {
          total: allEvidence.length,
          byType: insights.evidenceByType,
          insights
        }
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