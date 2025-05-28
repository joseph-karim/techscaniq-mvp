// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface SearchRequest {
  query: string
  companyName?: string
  companyWebsite?: string
  maxResults?: number
  searchType?: 'general' | 'technology' | 'team' | 'market' | 'financial'
}

interface SearchResult {
  query: string
  results: Array<{
    title: string
    url: string
    snippet: string
    content?: string
  }>
  searchMetadata?: {
    searchTime: number
    totalResults?: number
    searchType: string
  }
  groundingMetadata?: any
}

// Timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 30000): Promise<Response> {
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
    throw error
  }
}

async function searchWithGemini(searchRequest: SearchRequest, req?: Request): Promise<SearchResult> {
  // Check for API key in environment first, then in headers for local dev
  let apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey && req) {
    apiKey = req.headers.get('x-google-api-key') || ''
  }
  
  if (!apiKey) {
    throw new Error('Google API key not configured')
  }

  const startTime = Date.now()
  const searchResults: Array<{title: string, url: string, snippet: string, content?: string}> = []
  
  try {
    console.log(`Searching with Gemini 2.0 Flash: ${searchRequest.query}`)
    
    // Construct the search prompt based on search type
    let searchPrompt = searchRequest.query
    
    if (searchRequest.companyName && searchRequest.companyWebsite) {
      switch (searchRequest.searchType) {
        case 'technology':
          searchPrompt = `Technology stack and technical details for ${searchRequest.companyName} (${searchRequest.companyWebsite}): ${searchRequest.query}`
          break
        case 'team':
          searchPrompt = `Team information, founders, executives for ${searchRequest.companyName}: ${searchRequest.query}`
          break
        case 'market':
          searchPrompt = `Market analysis, competitors, industry for ${searchRequest.companyName}: ${searchRequest.query}`
          break
        case 'financial':
          searchPrompt = `Funding, revenue, financial information for ${searchRequest.companyName}: ${searchRequest.query}`
          break
        default:
          searchPrompt = `${searchRequest.companyName} ${searchRequest.query}`
      }
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: searchPrompt
        }]
      }],
      tools: [{
        googleSearch: {}
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain"
      }
    }

    console.log('Making request to Gemini 2.0 Flash with search grounding...')
    
    const response = await fetchWithTimeout(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      },
      30000
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini response received')
    
    // Extract the generated content
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Extract grounding metadata if available
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata
    
    // Parse search results from grounding metadata
    if (groundingMetadata?.searchEntryPoint?.renderedContent) {
      // Extract search results from the grounding metadata
      const searchEntries = groundingMetadata.groundingSupports || []
      
      for (const entry of searchEntries.slice(0, searchRequest.maxResults || 10)) {
        if (entry.segment && entry.groundingChunkIndices) {
          searchResults.push({
            title: entry.segment.text?.substring(0, 100) || 'Search Result',
            url: entry.segment.startIndex ? `https://search-result-${entry.segment.startIndex}` : '#',
            snippet: entry.segment.text || '',
            content: content
          })
        }
      }
    }
    
    // If no grounding results, create a synthetic result from the content
    if (searchResults.length === 0 && content) {
      searchResults.push({
        title: `Search results for: ${searchRequest.query}`,
        url: searchRequest.companyWebsite || '#',
        snippet: content.substring(0, 300) + '...',
        content: content
      })
    }

    const searchTime = Date.now() - startTime

    return {
      query: searchRequest.query,
      results: searchResults,
      searchMetadata: {
        searchTime,
        totalResults: searchResults.length,
        searchType: searchRequest.searchType || 'general'
      },
      groundingMetadata
    }

  } catch (error) {
    console.error('Search error:', error)
    const searchTime = Date.now() - startTime
    
    return {
      query: searchRequest.query,
      results: [],
      searchMetadata: {
        searchTime,
        totalResults: 0,
        searchType: searchRequest.searchType || 'general'
      }
    }
  }
}

// Fallback to regular web search using Google Custom Search API
async function fallbackWebSearch(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  const searchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID') || 'YOUR_SEARCH_ENGINE_ID'
  
  if (!apiKey) {
    throw new Error('Google API key not configured')
  }

  try {
    console.log(`Fallback to Google Custom Search for: ${query}`)
    
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.append('key', apiKey)
    url.searchParams.append('cx', searchEngineId)
    url.searchParams.append('q', query)
    url.searchParams.append('num', maxResults.toString())
    
    const response = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Google Search API error: ${response.status} - ${errorData}`)
    }
    
    const data = await response.json()
    
    const results: SearchResult[] = (data.items || []).map((item: any) => ({
      title: item.title || '',
      url: item.link || '',
      snippet: item.snippet || '',
      metadata: {
        source: 'google-custom-search',
        displayLink: item.displayLink,
        formattedUrl: item.formattedUrl
      }
    }))
    
    return results
  } catch (error) {
    console.error('Google Custom Search error:', error)
    throw error
  }
}

Deno.serve(async (req) => {
  // Skip JWT verification for testing
  // In production, you'd want to verify the JWT token
  // const jwt = req.headers.get('Authorization')?.split(' ')[1]
  // if (!jwt) {
  //   return new Response(JSON.stringify({ error: 'No JWT token provided' }), {
  //     status: 401,
  //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  //   })
  // }

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: SearchRequest = await req.json()
    
    if (!request.query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const result = await searchWithGemini(request, req)
    
    return new Response(
      JSON.stringify({ success: true, ...result }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('Google Search collector error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/google-search-collector' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
