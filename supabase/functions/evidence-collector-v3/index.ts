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
  evidenceTypes: ('technical' | 'security' | 'team' | 'financial' | 'market')[]
  depth?: 'shallow' | 'deep' | 'comprehensive'
}

interface Evidence {
  id: string
  type: string
  source: {
    url?: string
    query?: string
    api?: string
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

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: EvidenceRequest = await req.json()
    const collectionId = crypto.randomUUID()
    const allEvidence: Evidence[] = []
    
    console.log(`Starting evidence collection v3 for ${request.companyName}`)
    
    // Check dependencies
    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!JINA_API_KEY) {
      throw new Error('JINA API key not configured')
    }
    
    // Based on depth, orchestrate different collection strategies
    const tasks: Promise<any>[] = []
    
    if (request.depth === 'shallow') {
      // Quick scan - just main page
      tasks.push(
        collectDeepCrawl(request.companyWebsite, collectionId, 1),
        collectJINAContent(request.companyWebsite, 'text'),
        searchCompanyInfo(request.companyName, 'overview')
      )
    } else if (request.depth === 'deep') {
      // Standard scan - main pages + tech analysis
      tasks.push(
        collectDeepCrawl(request.companyWebsite, collectionId, 5),
        collectHARData(request.companyWebsite),
        collectJINAContent(request.companyWebsite, 'html'),
        searchCompanyInfo(request.companyName, 'technology'),
        searchCompanyInfo(request.companyName, 'security')
      )
    } else {
      // Comprehensive scan - full site crawl + all analyses
      tasks.push(
        collectDeepCrawl(request.companyWebsite, collectionId, 10),
        collectHARData(request.companyWebsite),
        collectJINAContent(request.companyWebsite, 'html'),
        searchCompanyInfo(request.companyName, 'technology infrastructure'),
        searchCompanyInfo(request.companyName, 'security compliance'),
        searchCompanyInfo(request.companyName, 'engineering team'),
        discoverSubdomains(request.companyWebsite)
      )
    }
    
    // Execute all tasks concurrently
    const results = await Promise.allSettled(tasks)
    
    // Process results
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        if (Array.isArray(result.value)) {
          allEvidence.push(...result.value)
        } else {
          allEvidence.push(result.value)
        }
      }
    }
    
    console.log(`Evidence collection complete. Total evidence: ${allEvidence.length}`)
    
    // Store evidence in database
    const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '')
    
    // Create collection record
    await supabase
      .from('evidence_collections')
      .insert({
        id: collectionId,
        company_name: request.companyName,
        company_website: request.companyWebsite,
        evidence_count: allEvidence.length,
        collection_type: 'deep_crawl_v3',
        metadata: {
          depth: request.depth,
          version: '3.0'
        }
      })
    
    // Store individual evidence items
    if (allEvidence.length > 0) {
      const evidenceItems = allEvidence.map(e => ({
        ...e,
        collection_id: collectionId,
        breadcrumbs: [],
        embedding: null
      }))
      
      await supabase
        .from('evidence_items')
        .insert(evidenceItems)
    }
    
    // Generate summary insights
    const insights = generateInsights(allEvidence)
    
    return new Response(
      JSON.stringify({
        success: true,
        collectionId,
        evidence: allEvidence,
        summary: {
          total: allEvidence.length,
          byType: groupByType(allEvidence),
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

async function collectDeepCrawl(url: string, scanId: string, depth: number): Promise<Evidence[]> {
  try {
    const response = await callInternalFunction('deep-crawler', {
      scanId,
      targetUrl: url,
      depth,
      options: {
        captureDataLayer: true,
        followSubdomains: false
      }
    })
    
    if (!response.success) {
      throw new Error('Deep crawl failed')
    }
    
    // Convert crawl results to evidence
    const evidence: Evidence[] = []
    
    for (const result of response.results || []) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'deep_crawl',
        source: {
          url: result.url,
          api: 'deep-crawler',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: JSON.stringify(result),
          summary: `Found ${result.technologies?.length || 0} technologies, ${result.apis || 0} API endpoints, ${result.scripts || 0} scripts`
        },
        metadata: {
          technologies: result.technologies?.map((t: any) => t.name),
          apis: result.apis,
          security: { score: result.securityScore },
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

async function collectHARData(url: string): Promise<Evidence | null> {
  try {
    const response = await callInternalFunction('har-capture', {
      url,
      options: {
        captureConsole: true
      }
    })
    
    if (!response.success) {
      throw new Error('HAR capture failed')
    }
    
    return {
      id: crypto.randomUUID(),
      type: 'network_analysis',
      source: {
        url,
        api: 'har-capture',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: JSON.stringify(response),
        summary: `Captured ${response.network?.totalRequests || 0} network requests, ${response.insights?.apiEndpoints?.length || 0} API endpoints`,
        processed: JSON.stringify(response.insights)
      },
      metadata: {
        technologies: response.insights?.suspectedTechnologies || [],
        apis: response.insights?.apiEndpoints || [],
        relevance: 0.9,
        confidence: 0.85
      }
    }
  } catch (error) {
    console.error('HAR capture error:', error)
    return null
  }
}

async function collectJINAContent(url: string, format: 'text' | 'html'): Promise<Evidence | null> {
  try {
    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    const readerUrl = `https://r.jina.ai/${url}`
    
    const response = await fetch(readerUrl, {
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'X-Return-Format': format,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`JINA Reader failed: ${response.statusText}`)
    }
    
    const content = await response.text()
    
    return {
      id: crypto.randomUUID(),
      type: format === 'html' ? 'webpage_html' : 'webpage_text',
      source: {
        url,
        api: 'jina-reader',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: content,
        summary: content.substring(0, 200) + '...'
      },
      metadata: {
        relevance: 0.9,
        confidence: 1.0
      }
    }
  } catch (error) {
    console.error('JINA content error:', error)
    return null
  }
}

async function searchCompanyInfo(company: string, topic: string): Promise<Evidence[]> {
  try {
    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    const query = `${company} ${topic}`
    
    const response = await fetch('https://s.jina.ai/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: 3
      })
    })
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const results = await response.json()
    const evidence: Evidence[] = []
    
    for (const result of results.results || []) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'search_result',
        source: {
          url: result.url,
          query,
          api: 'jina-search',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: result.content || result.description || '',
          processed: result.title || '',
          summary: result.description || ''
        },
        metadata: {
          relevance: 0.7,
          confidence: 0.8
        }
      })
    }
    
    return evidence
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

async function discoverSubdomains(website: string): Promise<Evidence[]> {
  // In a real implementation, this would use DNS enumeration
  // For now, we'll check common subdomains
  const domain = new URL(website).hostname
  const commonSubdomains = ['api', 'app', 'docs', 'blog', 'static', 'cdn', 'admin']
  const evidence: Evidence[] = []
  
  for (const subdomain of commonSubdomains) {
    const url = `https://${subdomain}.${domain}`
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (response.ok) {
        evidence.push({
          id: crypto.randomUUID(),
          type: 'subdomain_discovery',
          source: {
            url,
            api: 'dns-discovery',
            timestamp: new Date().toISOString()
          },
          content: {
            raw: `Active subdomain: ${subdomain}`,
            summary: `Found ${subdomain}.${domain}`
          },
          metadata: {
            relevance: 0.6,
            confidence: 1.0
          }
        })
      }
    } catch {}
  }
  
  return evidence
}

async function callInternalFunction(functionName: string, payload: any): Promise<any> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    throw new Error(`Function ${functionName} failed: ${response.statusText}`)
  }
  
  return response.json()
}

function generateInsights(evidence: Evidence[]): any {
  const technologies = new Set<string>()
  const apis = new Set<string>()
  const securityIssues: string[] = []
  
  for (const e of evidence) {
    if (e.metadata?.technologies) {
      e.metadata.technologies.forEach(t => technologies.add(t))
    }
    if (e.metadata?.apis) {
      e.metadata.apis.forEach((a: any) => apis.add(a.url || a))
    }
    if (e.metadata?.security?.securityIssues) {
      securityIssues.push(...e.metadata.security.securityIssues)
    }
  }
  
  return {
    technologiesDetected: Array.from(technologies),
    apiEndpointsFound: Array.from(apis),
    securityIssues,
    dataQuality: {
      hasDeepCrawl: evidence.some(e => e.type === 'deep_crawl'),
      hasNetworkAnalysis: evidence.some(e => e.type === 'network_analysis'),
      hasHTMLContent: evidence.some(e => e.type === 'webpage_html'),
      hasSearchResults: evidence.some(e => e.type === 'search_result')
    }
  }
}

function groupByType(evidence: Evidence[]): Record<string, number> {
  return evidence.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
} 