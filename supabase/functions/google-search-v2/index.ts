import "jsr:@supabase/functions-js/edge-runtime.d.ts"

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
  searchType?: 'general' | 'technology' | 'team' | 'market' | 'financial' | 'news'
  dateRestrict?: string // e.g., "d1" for last day, "w1" for last week, "m1" for last month
  siteSearch?: string // Restrict to specific site
  excludeSites?: string[] // Sites to exclude
}

interface SearchResult {
  title: string
  url: string
  snippet: string
  displayLink: string
  formattedUrl: string
  htmlSnippet?: string
  pagemap?: any
  metadata?: any
}

interface SearchResponse {
  success: boolean
  query: string
  results: SearchResult[]
  searchInfo?: {
    searchTime: number
    totalResults: string
    formattedSearchTime: string
    formattedTotalResults: string
  }
  error?: string
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

// Build search query based on type
function buildSearchQuery(request: SearchRequest): string {
  let query = request.query
  
  if (request.companyName) {
    switch (request.searchType) {
      case 'technology':
        query = `"${request.companyName}" (technology OR "tech stack" OR framework OR programming OR infrastructure OR API OR cloud OR AWS OR Azure OR kubernetes)`
        break
      case 'team':
        query = `"${request.companyName}" (founder OR CEO OR CTO OR executive OR leadership OR team OR employees OR "engineering team")`
        break
      case 'market':
        query = `"${request.companyName}" (market OR industry OR competitor OR "market share" OR customers OR "target market" OR competition)`
        break
      case 'financial':
        query = `"${request.companyName}" (funding OR revenue OR valuation OR investment OR "series A" OR "series B" OR IPO OR acquisition OR investors)`
        break
      case 'news':
        query = `"${request.companyName}" (announcement OR news OR press OR launch OR partnership OR acquisition OR funding)`
        break
      default:
        query = `"${request.companyName}" ${request.query}`
    }
  }
  
  return query
}

// Use Google Custom Search API
async function performGoogleSearch(request: SearchRequest): Promise<SearchResponse> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  const searchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')
  
  if (!apiKey || !searchEngineId) {
    console.error('Missing Google API credentials')
    // Fallback to web scraping if no API key
    return await performScrapedSearch(request)
  }
  
  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    
    // Build query
    const query = buildSearchQuery(request)
    
    // Set parameters
    url.searchParams.append('key', apiKey)
    url.searchParams.append('cx', searchEngineId)
    url.searchParams.append('q', query)
    url.searchParams.append('num', Math.min(request.maxResults || 10, 10).toString())
    
    // Add optional parameters
    if (request.dateRestrict) {
      url.searchParams.append('dateRestrict', request.dateRestrict)
    }
    
    if (request.siteSearch) {
      url.searchParams.append('siteSearch', request.siteSearch)
    }
    
    if (request.excludeSites && request.excludeSites.length > 0) {
      const excludeQuery = request.excludeSites.map(site => `-site:${site}`).join(' ')
      url.searchParams.append('q', `${query} ${excludeQuery}`)
    }
    
    console.log(`Performing Google Custom Search: ${query}`)
    
    const response = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error(`Google Search API error: ${response.status} - ${errorData}`)
      // Fallback to scraping
      return await performScrapedSearch(request)
    }
    
    const data = await response.json()
    
    const results: SearchResult[] = (data.items || []).map((item: any) => ({
      title: item.title || '',
      url: item.link || '',
      snippet: item.snippet || '',
      displayLink: item.displayLink || '',
      formattedUrl: item.formattedUrl || '',
      htmlSnippet: item.htmlSnippet,
      pagemap: item.pagemap,
      metadata: {
        mime: item.mime,
        fileFormat: item.fileFormat,
        image: item.image
      }
    }))
    
    return {
      success: true,
      query: request.query,
      results,
      searchInfo: data.searchInformation ? {
        searchTime: parseFloat(data.searchInformation.searchTime) * 1000, // Convert to ms
        totalResults: data.searchInformation.totalResults,
        formattedSearchTime: data.searchInformation.formattedSearchTime,
        formattedTotalResults: data.searchInformation.formattedTotalResults
      } : undefined
    }
    
  } catch (error) {
    console.error('Google Custom Search error:', error)
    // Fallback to scraping
    return await performScrapedSearch(request)
  }
}

// Fallback: Scrape search results from Google
async function performScrapedSearch(request: SearchRequest): Promise<SearchResponse> {
  try {
    console.log(`Fallback to web scraping for: ${request.query}`)
    
    const query = buildSearchQuery(request)
    const encodedQuery = encodeURIComponent(query)
    const numResults = request.maxResults || 10
    
    // Build Google search URL
    let searchUrl = `https://www.google.com/search?q=${encodedQuery}&num=${numResults}&hl=en`
    
    if (request.dateRestrict) {
      // Convert to Google's tbs parameter
      const tbsMap = {
        'd1': 'qdr:d',
        'w1': 'qdr:w',
        'm1': 'qdr:m',
        'y1': 'qdr:y'
      }
      const tbs = tbsMap[request.dateRestrict] || 'qdr:m'
      searchUrl += `&tbs=${tbs}`
    }
    
    // Fetch search results page
    const response = await fetchWithTimeout(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }, 15000)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // Parse search results using regex (basic parsing)
    const results: SearchResult[] = []
    
    // Extract search results using patterns
    const resultPattern = /<div[^>]+class="[^"]*g[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<div[^>]+>([^<]+(?:<[^>]+>[^<]+)*)</g
    
    let match
    while ((match = resultPattern.exec(html)) !== null && results.length < numResults) {
      const url = match[1]
      const title = match[2].replace(/<[^>]+>/g, '').trim()
      const snippet = match[3].replace(/<[^>]+>/g, '').trim()
      
      if (url && title) {
        // Clean up URL
        let cleanUrl = url
        if (url.startsWith('/url?q=')) {
          cleanUrl = decodeURIComponent(url.substring(7).split('&')[0])
        }
        
        results.push({
          title,
          url: cleanUrl,
          snippet: snippet || '',
          displayLink: new URL(cleanUrl).hostname,
          formattedUrl: cleanUrl,
          htmlSnippet: snippet
        })
      }
    }
    
    // If regex parsing fails, try alternative approach
    if (results.length === 0) {
      console.log('Primary parsing failed, trying alternative approach')
      
      // Look for search result URLs
      const urlPattern = /href="\/url\?q=([^&]+)&/g
      const urls: string[] = []
      
      while ((match = urlPattern.exec(html)) !== null && urls.length < numResults) {
        const url = decodeURIComponent(match[1])
        if (url && !url.includes('google.com') && !url.includes('youtube.com')) {
          urls.push(url)
        }
      }
      
      // Create basic results from URLs
      for (const url of urls) {
        results.push({
          title: new URL(url).hostname,
          url,
          snippet: '',
          displayLink: new URL(url).hostname,
          formattedUrl: url
        })
      }
    }
    
    return {
      success: true,
      query: request.query,
      results: results.slice(0, numResults),
      searchInfo: {
        searchTime: Date.now(),
        totalResults: results.length.toString(),
        formattedSearchTime: '0.5s',
        formattedTotalResults: results.length.toString()
      }
    }
    
  } catch (error) {
    console.error('Web scraping search error:', error)
    return {
      success: false,
      query: request.query,
      results: [],
      error: error.message || 'Failed to perform search'
    }
  }
}

// Use search APIs (DuckDuckGo as backup)
async function performDuckDuckGoSearch(request: SearchRequest): Promise<SearchResponse> {
  try {
    const query = buildSearchQuery(request)
    const encodedQuery = encodeURIComponent(query)
    
    // DuckDuckGo instant answer API (limited but free)
    const apiUrl = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
    
    const response = await fetchWithTimeout(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    const results: SearchResult[] = []
    
    // Extract results from DuckDuckGo response
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, request.maxResults || 10)) {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text,
            displayLink: new URL(topic.FirstURL).hostname,
            formattedUrl: topic.FirstURL
          })
        }
      }
    }
    
    // Add abstract if available
    if (data.AbstractURL && data.AbstractText) {
      results.unshift({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.AbstractText,
        displayLink: data.AbstractSource || new URL(data.AbstractURL).hostname,
        formattedUrl: data.AbstractURL
      })
    }
    
    return {
      success: true,
      query: request.query,
      results,
      searchInfo: {
        searchTime: Date.now(),
        totalResults: results.length.toString(),
        formattedSearchTime: '0.3s',
        formattedTotalResults: results.length.toString()
      }
    }
    
  } catch (error) {
    console.error('DuckDuckGo search error:', error)
    return {
      success: false,
      query: request.query,
      results: [],
      error: error.message || 'Failed to perform DuckDuckGo search'
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: SearchRequest = await req.json()
    
    if (!request.query) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Query is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Try Google Custom Search API first
    let result = await performGoogleSearch(request)
    
    // If Google fails and we have few results, try DuckDuckGo
    if (!result.success || result.results.length < 3) {
      console.log('Trying DuckDuckGo as backup')
      const ddgResult = await performDuckDuckGoSearch(request)
      if (ddgResult.success && ddgResult.results.length > result.results.length) {
        result = ddgResult
      }
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('Search service error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        query: '',
        results: [],
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})