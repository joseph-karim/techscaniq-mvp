import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface SearchRequest {
  query: string
  site?: string
  num?: number
}

interface SearchResult {
  url: string
  title: string
  content: string
  description?: string
}

interface SearchResponse {
  success: boolean
  data?: SearchResult[]
  error?: string
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeout)
    return response
  } catch (error) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, site, num = 3 }: SearchRequest = await req.json()
    
    if (!query) {
      throw new Error('Search query is required')
    }
    
    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    if (!JINA_API_KEY) {
      throw new Error('JINA API key not configured')
    }
    
    const headers: any = {
      'Authorization': `Bearer ${JINA_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    
    if (site) {
      headers['X-Site'] = site
    }
    
    console.log(`Searching for: ${query}`)
    
    const response = await fetchWithTimeout('https://s.jina.ai/', {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: query, num })
    }, 8000)
    
    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`Search API error: ${response.status}`, errorBody)
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    const searchResults: SearchResult[] = (result.data || []).map((item: any) => ({
      url: item.url,
      title: item.title,
      content: item.content,
      description: item.description
    }))
    
    const responseData: SearchResponse = {
      success: true,
      data: searchResults
    }
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Search error:', error)
    const responseData: SearchResponse = {
      success: false,
      error: error.message
    }
    
    return new Response(
      JSON.stringify(responseData),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 