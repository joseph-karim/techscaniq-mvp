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

// Collect using JINA Reader
async function collectWithJinaReader(url: string): Promise<Evidence | null> {
  try {
    console.log(`Collecting content from: ${url}`)
    
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
        summary: result.data.content.substring(0, 200) + '...'
      },
      metadata: {
        relevance: 0.95,
        confidence: 1.0
      }
    }
  } catch (error) {
    console.error('JINA Reader error:', error)
    return null
  }
}

// Collect using JINA Search
async function collectWithJinaSearch(query: string): Promise<Evidence[]> {
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
    console.error('JINA Search error:', error)
    return []
  }
}

// Collect using Playwright crawler
async function collectWithPlaywright(url: string, depth: number): Promise<Evidence[]> {
  try {
    console.log(`Crawling with Playwright: ${url}`)
    
    const result = await callSupabaseFunction('playwright-crawler', {
      url,
      depth,
      options: {
        extractScripts: true,
        extractAPIs: true
      }
    })
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    const evidence: Evidence[] = []
    
    // Convert crawler results to evidence
    for (const crawlResult of result.results || []) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'technical_analysis',
        source: {
          url: crawlResult.url,
          tool: 'playwright-crawler',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: JSON.stringify(crawlResult),
          processed: JSON.stringify({
            technologies: crawlResult.technologies,
            apis: crawlResult.apis,
            metrics: crawlResult.metrics
          }),
          summary: `Found ${crawlResult.technologies.length} technologies, ${crawlResult.apis.length} API endpoints`
        },
        metadata: {
          technologies: crawlResult.technologies.map((t: any) => t.name),
          apis: crawlResult.apis,
          performance: crawlResult.metrics,
          relevance: 1.0,
          confidence: 0.95
        }
      })
    }
    
    return evidence
  } catch (error) {
    console.error('Playwright error:', error)
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
    
    console.log(`Starting evidence collection v4 for ${request.companyName}`)
    console.log(`Depth: ${request.depth || 'shallow'}`)
    
    const allEvidence: Evidence[] = []
    
    // Determine collection strategy based on depth
    if (request.depth === 'shallow') {
      // Quick scan - main page only
      const [jinaContent, playwrightResults] = await Promise.allSettled([
        collectWithJinaReader(request.companyWebsite),
        collectWithPlaywright(request.companyWebsite, 1)
      ])
      
      if (jinaContent.status === 'fulfilled' && jinaContent.value) {
        allEvidence.push(jinaContent.value)
      }
      if (playwrightResults.status === 'fulfilled') {
        allEvidence.push(...playwrightResults.value)
      }
      
    } else if (request.depth === 'deep') {
      // Standard scan
      const [jinaContent, jinaSearch, playwrightResults] = await Promise.allSettled([
        collectWithJinaReader(request.companyWebsite),
        collectWithJinaSearch(`${request.companyName} technology stack infrastructure`),
        collectWithPlaywright(request.companyWebsite, 3)
      ])
      
      if (jinaContent.status === 'fulfilled' && jinaContent.value) {
        allEvidence.push(jinaContent.value)
      }
      if (jinaSearch.status === 'fulfilled') {
        allEvidence.push(...jinaSearch.value)
      }
      if (playwrightResults.status === 'fulfilled') {
        allEvidence.push(...playwrightResults.value)
      }
      
    } else {
      // Comprehensive scan
      const tasks = await Promise.allSettled([
        collectWithJinaReader(request.companyWebsite),
        collectWithJinaSearch(`${request.companyName} technology stack`),
        collectWithJinaSearch(`${request.companyName} security compliance`),
        collectWithJinaSearch(`${request.companyName} engineering team culture`),
        collectWithPlaywright(request.companyWebsite, 5)
      ])
      
      for (const result of tasks) {
        if (result.status === 'fulfilled') {
          if (Array.isArray(result.value)) {
            allEvidence.push(...result.value)
          } else if (result.value) {
            allEvidence.push(result.value)
          }
        }
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
        collection_type: 'v4_jina_playwright',
        metadata: {
          depth: request.depth,
          processingTime: Date.now() - startTime,
          version: 'v4'
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
    
    // Generate insights
    const insights = {
      technologiesDetected: allEvidence.flatMap(e => e.metadata?.technologies || []),
      apisFound: allEvidence.flatMap(e => e.metadata?.apis || []),
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