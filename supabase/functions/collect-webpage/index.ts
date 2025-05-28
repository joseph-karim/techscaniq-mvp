import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface WebpageRequest {
  url: string
  selectors?: string[]
}

interface WebpageResponse {
  success: boolean
  data?: {
    url: string
    content: string
    title?: string
    description?: string
    links?: string[]
  }
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
    const { url, selectors }: WebpageRequest = await req.json()
    
    if (!url) {
      throw new Error('URL is required')
    }
    
    const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
    if (!JINA_API_KEY) {
      throw new Error('JINA API key not configured')
    }
    
    const headers: any = {
      'Authorization': `Bearer ${JINA_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Return-Format': 'markdown',
      'X-With-Links-Summary': 'true',
      'X-With-Images-Summary': 'true'
    }
    
    if (selectors && selectors.length > 0) {
      headers['X-Target-Selector'] = selectors.join(',')
    }
    
    console.log(`Fetching webpage content from: ${url}`)
    
    const response = await fetchWithTimeout('https://r.jina.ai/', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url })
    }, 8000)
    
    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`Reader API error: ${response.status}`, errorBody)
      throw new Error(`Reader failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    const responseData: WebpageResponse = {
      success: true,
      data: {
        url,
        content: result.data.content,
        title: result.data.title,
        description: result.data.description,
        links: result.data.links
      }
    }
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Webpage collection error:', error)
    const responseData: WebpageResponse = {
      success: false,
      error: error.message
    }
    
    return new Response(
      JSON.stringify(responseData),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 