import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

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
  }
}

interface EvidenceCollectionResponse {
  collectionId: string
  company: string
  timestamp: string
  evidence: Evidence[]
  summary: {
    total_evidence: number
    by_type: Record<string, number>
    confidence_avg: number
    sources_used: string[]
  }
}

const JINA_API_KEY = Deno.env.get('JINA_API_KEY')

const jinaHeaders = {
  'Authorization': `Bearer ${JINA_API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

// Add timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

// Collect HTML content directly
async function collectRawHTML(url: string): Promise<Evidence | null> {
  try {
    console.log(`Fetching raw HTML from: ${url}`)
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, 8000)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract metadata from HTML
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i)
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["'](.*?)["']/i)
    
    // Extract technology hints
    const techSignals = {
      react: /react|jsx/i.test(html),
      vue: /vue\.js|v-if|v-for/i.test(html),
      angular: /ng-app|angular/i.test(html),
      wordpress: /wp-content|wordpress/i.test(html),
      shopify: /shopify|myshopify/i.test(html),
      nextjs: /_next\/static/i.test(html),
      gatsby: /gatsby/i.test(html)
    }
    
    // Extract structured data
    const ldJsonMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis)
    const structuredData = []
    for (const match of ldJsonMatches) {
      try {
        const data = JSON.parse(match[1])
        structuredData.push(data)
      } catch {}
    }
    
    return {
      id: crypto.randomUUID(),
      type: 'raw_html',
      source: {
        url,
        api: 'direct_fetch',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: html.substring(0, 50000), // Limit size
        processed: JSON.stringify({
          title: titleMatch?.[1] || '',
          description: descriptionMatch?.[1] || '',
          keywords: keywordsMatch?.[1] || '',
          techSignals,
          structuredData,
          htmlLength: html.length
        })
      },
      metadata: {
        relevance: 1.0,
        confidence: 1.0
      }
    }
  } catch (error) {
    console.error('Raw HTML collection error:', error)
    return null
  }
}

// Use JINA Reader with raw HTML option
async function collectWithReader(url: string, format: 'text' | 'html' = 'text'): Promise<Evidence | null> {
  try {
    const readerUrl = `https://r.jina.ai/${url}`
    const headers = {
      ...jinaHeaders,
      'X-Return-Format': format // Request HTML format
    }
    
    console.log(`Using JINA Reader (${format} format) for: ${url}`)
    const response = await fetchWithTimeout(readerUrl, {
      method: 'GET',
      headers
    }, 12000)
    
    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`Reader API error: ${response.status} ${response.statusText}`, errorBody)
      throw new Error(`Reader failed: ${response.statusText}`)
    }
    
    const content = await response.text()
    
    return {
      id: crypto.randomUUID(),
      type: format === 'html' ? 'webpage_html' : 'webpage_content',
      source: {
        url,
        api: 'reader',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: content,
        summary: format === 'html' ? 'Raw HTML content' : content.substring(0, 200) + '...'
      },
      metadata: {
        relevance: 0.9,
        confidence: 1.0
      }
    }
  } catch (error) {
    console.error('Reader error:', error)
    return null
  }
}

// Enhanced search with specific queries
async function searchAndCollect(query: string, site?: string): Promise<Evidence[]> {
  const evidence: Evidence[] = []
  
  try {
    const searchQuery = site ? `site:${site} ${query}` : query
    const searchUrl = 'https://s.jina.ai/'
    
    console.log(`Searching for: ${searchQuery}`)
    const response = await fetchWithTimeout(searchUrl, {
      method: 'POST',
      headers: jinaHeaders,
      body: JSON.stringify({
        q: searchQuery,
        num: 5
      })
    }, 10000)
    
    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`Search API error: ${response.status} ${response.statusText}`, errorBody)
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const results = await response.json()
    
    for (const result of results.results || []) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'search_result',
        source: {
          url: result.url,
          query: searchQuery,
          api: 'search',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: result.content || result.description || '',
          processed: result.title || '',
          summary: result.description || ''
        },
        metadata: {
          relevance: 0.8,
          confidence: 0.9
        }
      })
    }
  } catch (error) {
    console.error('Search error:', error)
  }
  
  return evidence
}

// Collect technology stack evidence
async function collectTechStackEvidence(company: string, website: string): Promise<Evidence[]> {
  const evidence: Evidence[] = []
  const domain = new URL(website).hostname
  
  // Technology detection queries
  const techQueries = [
    `${company} technology stack architecture`,
    `${company} engineering blog tech stack`,
    `"${domain}" github repository`,
    `${company} careers engineering requirements`,
    `${company} API documentation developer`
  ]
  
  for (const query of techQueries) {
    const results = await searchAndCollect(query)
    evidence.push(...results)
  }
  
  return evidence
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
    
    console.log(`Starting evidence collection for ${request.companyName}`)
    
    // Check if JINA API key is available
    const useRealData = !!JINA_API_KEY && JINA_API_KEY !== 'undefined'
    
    if (!useRealData) {
      console.log('JINA API key not available, using mock data')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'JINA API key not configured'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }
    
    // Test API key validity
    console.log('Testing JINA API key validity...')
    try {
      const testResponse = await fetchWithTimeout('https://s.jina.ai/', {
        method: 'POST',
        headers: jinaHeaders,
        body: JSON.stringify({ q: 'test', num: 1 })
      }, 5000)
      
      if (!testResponse.ok) {
        throw new Error('Invalid API key')
      }
      console.log('JINA API key is valid, proceeding with data collection...')
    } catch (error) {
      console.error('JINA API key validation failed:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'JINA API authentication failed'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }
    
    // Collect evidence based on depth
    if (request.depth === 'shallow') {
      console.log('Performing shallow analysis...')
      
      // 1. Get main website content (text)
      const mainContent = await collectWithReader(request.companyWebsite, 'text')
      if (mainContent) allEvidence.push(mainContent)
      
      // 2. Get raw HTML for technical analysis
      const htmlContent = await collectRawHTML(request.companyWebsite)
      if (htmlContent) allEvidence.push(htmlContent)
      
    } else if (request.depth === 'deep') {
      console.log('Performing deep analysis...')
      
      // 1. Collect main website data
      const [textContent, htmlContent] = await Promise.all([
        collectWithReader(request.companyWebsite, 'text'),
        collectRawHTML(request.companyWebsite)
      ])
      
      if (textContent) allEvidence.push(textContent)
      if (htmlContent) allEvidence.push(htmlContent)
      
      // 2. Collect HTML from key pages
      const keyPages = ['/about', '/technology', '/products', '/careers']
      for (const page of keyPages) {
        try {
          const pageUrl = new URL(page, request.companyWebsite).toString()
          const pageHtml = await collectWithReader(pageUrl, 'html')
          if (pageHtml) allEvidence.push(pageHtml)
        } catch {}
      }
      
      // 3. Search for company information
      const searchResults = await searchAndCollect(
        `${request.companyName} company overview technology`,
        new URL(request.companyWebsite).hostname
      )
      allEvidence.push(...searchResults)
      
      // 4. Collect technology stack evidence
      const techEvidence = await collectTechStackEvidence(
        request.companyName,
        request.companyWebsite
      )
      allEvidence.push(...techEvidence.slice(0, 3)) // Limit to avoid timeout
      
    } else {
      // Comprehensive analysis
      console.log('Performing comprehensive analysis...')
      
      // Similar to deep but with more searches and pages
      // Limited implementation to avoid timeouts
      const [textContent, htmlContent] = await Promise.all([
        collectWithReader(request.companyWebsite, 'text'),
        collectWithReader(request.companyWebsite, 'html')
      ])
      
      if (textContent) allEvidence.push(textContent)
      if (htmlContent) allEvidence.push(htmlContent)
    }
    
    console.log(`Evidence collection complete. Total evidence: ${allEvidence.length}`)
    
    // Store evidence in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Create collection record
    const { data: collection, error: collectionError } = await supabase
      .from('evidence_collections')
      .insert({
        id: collectionId,
        company_name: request.companyName,
        company_website: request.companyWebsite,
        evidence_count: allEvidence.length,
        status: 'completed'
      })
      .select()
      .single()
    
    if (collectionError) {
      console.error('Failed to store collection:', collectionError)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        collectionId,
        evidence: allEvidence,
        summary: {
          total: allEvidence.length,
          byType: allEvidence.reduce((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1
            return acc
          }, {} as Record<string, number>)
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