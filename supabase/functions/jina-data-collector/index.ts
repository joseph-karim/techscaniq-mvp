import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DataCollectionRequest {
  url?: string
  query?: string
  type: 'reader' | 'search' | 'embed' | 'rerank'
  options?: {
    // Reader options
    cssSelectors?: string[]
    excludeSelectors?: string[]
    imageCaption?: boolean
    gatherLinks?: boolean
    // Search options
    maxResults?: number
    // Embedding options
    texts?: string[]
    // Reranking options
    documents?: string[]
  }
}

interface JinaReaderResponse {
  title: string
  url: string
  content: string
  links?: string[]
  images?: Array<{ url: string; caption?: string }>
  timestamp?: string
}

interface JinaSearchResult {
  title: string
  url: string
  snippet: string
  content?: string
}

class JinaDataCollector {
  private apiKey: string
  private baseUrl = 'https://api.jina.ai'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async fetchWebContent(url: string, options: any = {}): Promise<JinaReaderResponse> {
    // Use Jina Reader API by prepending r.jina.ai
    const readerUrl = `https://r.jina.ai/${url}`
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    // Build query parameters
    const params = new URLSearchParams()
    if (options.imageCaption) params.append('image_caption', 'true')
    if (options.gatherLinks) params.append('gather_all_links_at_the_end', 'true')
    if (options.cssSelectors) {
      options.cssSelectors.forEach(selector => params.append('css_selector_only', selector))
    }
    if (options.excludeSelectors) {
      options.excludeSelectors.forEach(selector => params.append('css_selector_excluding', selector))
    }

    const finalUrl = `${readerUrl}${params.toString() ? '?' + params.toString() : ''}`
    
    try {
      const response = await fetch(finalUrl, { headers })
      
      if (!response.ok) {
        throw new Error(`Jina Reader API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('Jina Reader API error:', error)
      throw error
    }
  }

  async searchWeb(query: string, options: any = {}): Promise<JinaSearchResult[]> {
    // Use Jina Search API
    const searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    try {
      const response = await fetch(searchUrl, { headers })
      
      if (!response.ok) {
        throw new Error(`Jina Search API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('Jina Search API error:', error)
      throw error
    }
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: texts,
        task: 'text-matching'
      })
    })

    if (!response.ok) {
      throw new Error(`Jina Embeddings API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data.map(item => item.embedding)
  }

  async rerankDocuments(query: string, documents: string[]): Promise<Array<{ index: number; score: number }>> {
    const response = await fetch(`${this.baseUrl}/v1/rerank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'jina-reranker-v2-base-multilingual',
        query,
        documents
      })
    })

    if (!response.ok) {
      throw new Error(`Jina Reranker API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: DataCollectionRequest = await req.json()
    
    // Get API key from environment
    const apiKey = Deno.env.get('JINA_API_KEY') || ''
    const collector = new JinaDataCollector(apiKey)
    
    let result: any
    
    switch (request.type) {
      case 'reader':
        if (!request.url) {
          throw new Error('URL is required for reader type')
        }
        result = await collector.fetchWebContent(request.url, request.options || {})
        break
        
      case 'search':
        if (!request.query) {
          throw new Error('Query is required for search type')
        }
        result = await collector.searchWeb(request.query, request.options || {})
        break
        
      case 'embed':
        if (!request.options?.texts || request.options.texts.length === 0) {
          throw new Error('Texts array is required for embedding type')
        }
        result = await collector.createEmbeddings(request.options.texts)
        break
        
      case 'rerank':
        if (!request.query || !request.options?.documents || request.options.documents.length === 0) {
          throw new Error('Query and documents are required for reranking type')
        }
        result = await collector.rerankDocuments(request.query, request.options.documents)
        break
        
      default:
        throw new Error(`Unknown request type: ${request.type}`)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        type: request.type
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Jina data collector error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}) 