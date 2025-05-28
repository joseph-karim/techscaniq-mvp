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
    [key: string]: any
  }
}

// Call another Supabase function
async function callSupabaseFunction(functionName: string, payload: any): Promise<any> {
  const baseUrl = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321'
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  
  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify(payload),
  })
  
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Function ${functionName} failed: ${JSON.stringify(data)}`)
  }
  
  return data
}

// Generate unique ID
function generateId(): string {
  return crypto.randomUUID()
}

// Tool 1: JINA for business content (exec summary, team info, etc.)
async function collectBusinessContent(url: string, queries: string[]): Promise<Evidence[]> {
  const evidence: Evidence[] = []
  
  try {
    // Use JINA Reader for main webpage content
    console.log(`Collecting business content from: ${url}`)
    const readerData = await callSupabaseFunction('jina-collector', {
      url,
      type: 'reader'
    })
    
    if (readerData.success) {
      evidence.push({
        id: generateId(),
        type: 'business_content',
        source: {
          url,
          tool: 'jina-reader',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: readerData.content,
          summary: readerData.title
        },
        metadata: {
          relevance: 0.9,
          confidence: 1,
          description: readerData.description,
          ...(readerData.metadata || {})
        }
      })
    }
    
    // Use JINA Search for specific business queries
    for (const query of queries) {
      try {
        console.log(`Searching for business info: ${query}`)
        const searchData = await callSupabaseFunction('jina-collector', {
          query,
          type: 'search'
        })
        
        if (searchData.success && searchData.results) {
          searchData.results.forEach((result: any, index: number) => {
            evidence.push({
              id: generateId(),
              type: 'business_search',
              source: {
                query,
                url: result.url,
                tool: 'jina-search',
                timestamp: new Date().toISOString()
              },
              content: {
                raw: result.content,
                summary: result.title
              },
              metadata: {
                relevance: 0.8 - (index * 0.1),
                confidence: 0.9,
                description: result.description
              }
            })
          })
        }
      } catch (err) {
        console.error(`Search error for "${query}":`, err)
      }
    }
  } catch (err) {
    console.error('Business content collection error:', err)
  }
  
  return evidence
}

// Tool 2: Wappalyzer for technology detection
async function analyzeTechnologies(url: string, html?: string): Promise<Evidence> {
  console.log(`Analyzing technologies for: ${url}`)
  
  try {
    const techData = await callSupabaseFunction('wappalyzer-analyzer', {
      url,
      html: html || ''
    })
    
    return {
      id: generateId(),
      type: 'technology_analysis',
      source: {
        url,
        tool: 'wappalyzer',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(techData.technologies || []),
        processed: techData.summary || 'Technology stack analysis',
        summary: `Found ${techData.technologies?.length || 0} technologies`
      },
      metadata: {
        relevance: 0.95,
        confidence: techData.confidence || 0.8,
        technologies: techData.technologies,
        categories: techData.categories
      }
    }
  } catch (err) {
    console.error('Technology analysis error:', err)
    return {
      id: generateId(),
      type: 'technology_analysis',
      source: { url, tool: 'wappalyzer', timestamp: new Date().toISOString() },
      content: { raw: 'Error analyzing technologies', summary: 'Analysis failed' },
      metadata: { relevance: 0, confidence: 0, error: err.message }
    }
  }
}

// Tool 3: Security Scanner
async function performSecurityScan(url: string, html?: string): Promise<Evidence> {
  console.log(`Security scan for: ${url}`)
  
  try {
    const securityData = await callSupabaseFunction('security-scanner', {
      url,
      html: html || ''
    })
    
    return {
      id: generateId(),
      type: 'security_analysis',
      source: {
        url,
        tool: 'security-scanner',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(securityData),
        processed: securityData.summary?.description || 'Security analysis complete',
        summary: `Security Grade: ${securityData.grade || 'N/A'} (Score: ${securityData.score || 0}/100)`
      },
      metadata: {
        relevance: 0.95,
        confidence: 0.9,
        findings: securityData.findings,
        score: securityData.score,
        grade: securityData.grade
      }
    }
  } catch (err) {
    console.error('Security scan error:', err)
    return {
      id: generateId(),
      type: 'security_analysis',
      source: { url, tool: 'security-scanner', timestamp: new Date().toISOString() },
      content: { raw: 'Error performing security scan', summary: 'Scan failed' },
      metadata: { relevance: 0, confidence: 0, error: err.message }
    }
  }
}

// Tool 4: Performance Analyzer
async function analyzePerformance(url: string, html?: string): Promise<Evidence> {
  console.log(`Performance analysis for: ${url}`)
  
  try {
    const perfData = await callSupabaseFunction('performance-analyzer', {
      url,
      html: html || ''
    })
    
    return {
      id: generateId(),
      type: 'performance_analysis',
      source: {
        url,
        tool: 'performance-analyzer',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(perfData),
        processed: perfData.summary || 'Performance analysis complete',
        summary: `Performance Score: ${perfData.score || 0}/100`
      },
      metadata: {
        relevance: 0.9,
        confidence: 0.85,
        metrics: perfData.metrics,
        diagnostics: perfData.diagnostics,
        opportunities: perfData.opportunities
      }
    }
  } catch (err) {
    console.error('Performance analysis error:', err)
    return {
      id: generateId(),
      type: 'performance_analysis',
      source: { url, tool: 'performance-analyzer', timestamp: new Date().toISOString() },
      content: { raw: 'Error analyzing performance', summary: 'Analysis failed' },
      metadata: { relevance: 0, confidence: 0, error: err.message }
    }
  }
}

// Tool 5: TestSSL Scanner for deep TLS analysis
async function performSSLScan(url: string): Promise<Evidence> {
  console.log(`TLS/SSL scan for: ${url}`)
  
  try {
    const sslData = await callSupabaseFunction('testssl-scanner', { url })
    
    return {
      id: generateId(),
      type: 'ssl_analysis',
      source: {
        url,
        tool: 'testssl',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(sslData),
        processed: sslData.summary || 'SSL/TLS analysis complete',
        summary: `SSL Grade: ${sslData.grade || 'N/A'} (Score: ${sslData.score || 0}/100)`
      },
      metadata: {
        relevance: 0.9,
        confidence: 0.95,
        certificate: sslData.certificate,
        protocols: sslData.protocol,
        vulnerabilities: sslData.vulnerabilities
      }
    }
  } catch (err) {
    console.error('SSL scan error:', err)
    return {
      id: generateId(),
      type: 'ssl_analysis',
      source: { url, tool: 'testssl', timestamp: new Date().toISOString() },
      content: { raw: 'Error performing SSL scan', summary: 'Scan failed' },
      metadata: { relevance: 0, confidence: 0, error: err.message }
    }
  }
}

// Tool 6: Nuclei Scanner for vulnerability detection
async function performVulnerabilityScan(url: string, html?: string): Promise<Evidence> {
  console.log(`Vulnerability scan for: ${url}`)
  
  try {
    const vulnData = await callSupabaseFunction('nuclei-scanner', {
      url,
      html: html || ''
    })
    
    return {
      id: generateId(),
      type: 'vulnerability_analysis',
      source: {
        url,
        tool: 'nuclei',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(vulnData),
        processed: vulnData.summary?.description || 'Vulnerability scan complete',
        summary: `Found ${vulnData.summary?.total || 0} vulnerabilities (${vulnData.summary?.critical || 0} critical)`
      },
      metadata: {
        relevance: 0.95,
        confidence: 0.9,
        vulnerabilities: vulnData.vulnerabilities,
        summary: vulnData.summary
      }
    }
  } catch (err) {
    console.error('Vulnerability scan error:', err)
    return {
      id: generateId(),
      type: 'vulnerability_analysis',
      source: { url, tool: 'nuclei', timestamp: new Date().toISOString() },
      content: { raw: 'Error performing vulnerability scan', summary: 'Scan failed' },
      metadata: { relevance: 0, confidence: 0, error: err.message }
    }
  }
}

// Tool 7: Playwright for deep crawling and HAR capture
async function performDeepCrawl(url: string, depth: number): Promise<Evidence[]> {
  console.log(`Deep crawling ${url} with depth ${depth}`)
  const evidence: Evidence[] = []
  
  try {
    // Playwright crawler for DOM and network analysis
    const crawlData = await callSupabaseFunction('playwright-crawler', {
      url,
      depth,
      options: {
        screenshot: false,
        extractScripts: true,
        extractAPIs: true
      }
    })
    
    if (crawlData.success) {
      evidence.push({
        id: generateId(),
        type: 'deep_crawl',
        source: {
          url,
          tool: 'playwright',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: crawlData.html || '',
          processed: JSON.stringify({
            scripts: crawlData.scripts,
            apis: crawlData.apis,
            technologies: crawlData.technologies
          }),
          summary: `Crawled ${crawlData.pagesCount || 1} pages, found ${crawlData.apis?.length || 0} APIs`
        },
        metadata: {
          relevance: 0.9,
          confidence: 1,
          metrics: crawlData.metrics,
          resources: crawlData.resources,
          technologies: crawlData.technologies
        }
      })
    }
    
    // HAR capture for network analysis
    if (depth >= 2) {
      const harData = await callSupabaseFunction('har-capture', { url })
      
      if (harData.success) {
        evidence.push({
          id: generateId(),
          type: 'network_analysis',
          source: {
            url,
            tool: 'har-capture',
            timestamp: new Date().toISOString()
          },
          content: {
            raw: JSON.stringify(harData.har),
            processed: harData.analysis || 'Network analysis complete',
            summary: `Captured ${harData.requestsCount || 0} network requests`
          },
          metadata: {
            relevance: 0.85,
            confidence: 0.9,
            apis: harData.apis,
            thirdPartyServices: harData.thirdPartyServices,
            performanceMetrics: harData.performanceMetrics
          }
        })
      }
    }
  } catch (err) {
    console.error('Deep crawl error:', err)
  }
  
  return evidence
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const startTime = Date.now()
    const { companyName, companyWebsite, evidenceTypes = [], depth = 'shallow' } = await req.json() as EvidenceRequest
    
    console.log(`Starting evidence collection v6 for ${companyName}`)
    console.log(`Website: ${companyWebsite}`)
    console.log(`Depth: ${depth}`)
    console.log(`Using specialized tools for each evidence type`)
    
    const evidence: Evidence[] = []
    
    // Phase 1: Business content extraction with JINA
    const businessQueries = [
      `${companyName} executive team leadership`,
      `${companyName} company overview mission`,
      `${companyName} funding investment history`
    ]
    
    const businessEvidence = await collectBusinessContent(companyWebsite, businessQueries)
    evidence.push(...businessEvidence)
    
    // Phase 2: Technical analysis with specialized tools
    const techPromises = []
    
    // Always run these core analyses
    techPromises.push(analyzeTechnologies(companyWebsite))
    techPromises.push(performSecurityScan(companyWebsite))
    techPromises.push(analyzePerformance(companyWebsite))
    
    // Add deeper analysis for higher depth levels
    if (depth === 'deep' || depth === 'comprehensive') {
      techPromises.push(performSSLScan(companyWebsite))
      techPromises.push(performVulnerabilityScan(companyWebsite))
    }
    
    // Run all technical analyses in parallel
    const techResults = await Promise.allSettled(techPromises)
    techResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        evidence.push(result.value)
      }
    })
    
    // Phase 3: Deep crawling for comprehensive analysis
    if (depth === 'comprehensive') {
      const crawlEvidence = await performDeepCrawl(companyWebsite, 3)
      evidence.push(...crawlEvidence)
    }
    
    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Create collection record
    const { data: collection, error: collectionError } = await supabase
      .from('evidence_collections')
      .insert({
        company_name: companyName,
        company_website: companyWebsite,
        evidence_count: evidence.length,
        status: 'completed',
        collection_type: depth,
        metadata: {
          evidenceTypes: evidence.map(e => e.type).filter((v, i, a) => a.indexOf(v) === i),
          tools: evidence.map(e => e.source.tool).filter((v, i, a) => a.indexOf(v) === i)
        }
      })
      .select()
      .single()
    
    if (collectionError) {
      console.error('Failed to store collection:', collectionError)
    } else if (collection) {
      // Store evidence items
      const evidenceItems = evidence.map(e => ({
        collection_id: collection.id,
        evidence_type: e.type,
        source: e.source,
        content: e.content,
        metadata: e.metadata,
        company_name: companyName,
        breadcrumbs: []
      }))
      
      const { error: itemsError } = await supabase
        .from('evidence_items')
        .insert(evidenceItems)
      
      if (itemsError) {
        console.error('Failed to store evidence items:', itemsError)
      }
    }
    
    const totalTime = Date.now() - startTime
    console.log(`Evidence collection complete. Total evidence: ${evidence.length}`)
    console.log(`Time taken: ${totalTime}ms`)
    
    return new Response(JSON.stringify({
      success: true,
      evidence,
      collectionId: collection?.id,
      summary: {
        total: evidence.length,
        byType: evidence.reduce((acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        tools: evidence.map(e => e.source.tool).filter((v, i, a) => a.indexOf(v) === i)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 