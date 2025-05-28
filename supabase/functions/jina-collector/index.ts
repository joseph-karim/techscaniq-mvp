import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface JinaRequest {
  url?: string
  query?: string
  type: 'reader' | 'search'
}

// Timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 15000): Promise<Response> {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: JinaRequest = await req.json()
    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    
    if (!JINA_API_KEY) {
      throw new Error('JINA API key not configured')
    }
    
    let result
    
    if (request.type === 'reader' && request.url) {
      // Use JINA Reader API
      console.log(`Using JINA Reader for: ${request.url}`)
      
      const response = await fetchWithTimeout(
        `https://r.jina.ai/${request.url}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${JINA_API_KEY}`,
            'Accept': 'application/json',
            'X-Return-Format': 'markdown',
            'X-With-Links-Summary': 'true',
            'X-With-Images-Summary': 'true'
          }
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`JINA Reader error: ${response.status} ${errorText}`)
        throw new Error(`Reader failed: ${response.status} - ${errorText}`)
      }
      
      const responseData = await response.json()
      console.log('JINA Reader response:', JSON.stringify(responseData).substring(0, 200))
      
      // Extract content from the response structure
      const content = responseData.data?.content || responseData.content || JSON.stringify(responseData)
      
      result = {
        type: 'reader',
        content,
        url: request.url,
        metadata: {
          title: responseData.data?.title,
          description: responseData.data?.description,
          links: responseData.data?.links,
          images: responseData.data?.images
        },
        timestamp: new Date().toISOString()
      }
      
    } else if (request.type === 'search' && request.query) {
      // Use JINA Search API
      console.log(`Using JINA Search for: ${request.query}`)
      
      const response = await fetchWithTimeout(
        `https://s.jina.ai/?q=${encodeURIComponent(request.query)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${JINA_API_KEY}`,
            'Accept': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`JINA Search error: ${response.status} ${errorText}`)
        throw new Error(`Search failed: ${response.status} - ${errorText}`)
      }
      
      const responseData = await response.json()
      console.log('JINA Search response:', JSON.stringify(responseData).substring(0, 200))
      
      // Extract search results from the response structure
      const searchResults = responseData.data || responseData.results || responseData
      
      result = {
        type: 'search',
        results: searchResults,
        query: request.query,
        timestamp: new Date().toISOString()
      }
      
    } else {
      throw new Error('Invalid request: must specify type and either url or query')
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
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