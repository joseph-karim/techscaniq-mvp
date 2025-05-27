import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrchestratorRequest {
  company: {
    name: string
    website: string
  }
  investorProfile?: {
    firmName: string
    website: string
    supplementalLinks?: Record<string, string>
  }
  services?: string[] // Which services to run
}

interface ServiceResult {
  status: 'success' | 'failed' | 'skipped'
  data?: any
  error?: string
  duration: number
}

interface OrchestratorResponse {
  reportId: string
  company: string
  executedAt: string
  services: {
    jinaReader?: ServiceResult
    jinaSearch?: ServiceResult
    techIntelligence?: ServiceResult
    evidenceStorage?: ServiceResult
  }
  totalDuration: number
  report?: {
    summary: string
    insights: any
    evidence: any[]
  }
}

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

async function gatherCompanyData(company: { name: string; website: string }) {
  const startTime = Date.now()
  const services: OrchestratorResponse['services'] = {}
  const evidence: any[] = []
  
  // Step 1: Use Jina Reader to extract website content
  try {
    console.log('Step 1: Extracting website content with Jina Reader...')
    const readerResult = await callSupabaseFunction('jina-data-collector', {
      type: 'reader',
      url: company.website,
      options: {
        imageCaption: true,
        gatherLinks: true
      }
    })
    
    services.jinaReader = {
      status: 'success',
      data: readerResult.data,
      duration: Date.now() - startTime
    }
    
    // Store as evidence
    evidence.push({
      type: 'website_content',
      source: company.website,
      data: readerResult.data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Jina Reader error:', error)
    services.jinaReader = {
      status: 'failed',
      error: error.message,
      duration: Date.now() - startTime
    }
  }
  
  // Step 2: Search for additional information
  const searchQueries = [
    `${company.name} technology stack infrastructure`,
    `${company.name} engineering culture development`,
    `${company.name} security vulnerabilities data breach`,
    `${company.name} funding investors valuation`,
    `${company.name} leadership team executives CTO`
  ]
  
  const searchStartTime = Date.now()
  const searchResults: any[] = []
  
  for (const query of searchQueries) {
    try {
      console.log(`Searching: ${query}`)
      const searchResult = await callSupabaseFunction('jina-data-collector', {
        type: 'search',
        query
      })
      
      if (searchResult.data) {
        searchResults.push(...searchResult.data)
        evidence.push({
          type: 'search_result',
          query,
          data: searchResult.data,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error(`Search error for "${query}":`, error)
    }
  }
  
  services.jinaSearch = {
    status: searchResults.length > 0 ? 'success' : 'failed',
    data: { queries: searchQueries, results: searchResults },
    duration: Date.now() - searchStartTime
  }
  
  // Step 3: Analyze with Tech Intelligence
  const analysisStartTime = Date.now()
  try {
    console.log('Step 3: Analyzing with Tech Intelligence...')
    const analysisResult = await callSupabaseFunction('tech-intelligence', {
      company,
      websiteScanData: services.jinaReader?.data,
      searchResults: searchResults,
      focus: 'comprehensive'
    })
    
    services.techIntelligence = {
      status: 'success',
      data: analysisResult,
      duration: Date.now() - analysisStartTime
    }
  } catch (error) {
    console.error('Tech Intelligence error:', error)
    services.techIntelligence = {
      status: 'failed',
      error: error.message,
      duration: Date.now() - analysisStartTime
    }
  }
  
  // Step 4: Store evidence with embeddings
  const storageStartTime = Date.now()
  try {
    console.log('Step 4: Creating embeddings for evidence storage...')
    
    // Extract key text snippets for embedding
    const textSnippets = evidence.map(e => {
      if (e.type === 'website_content') {
        return e.data.content?.substring(0, 1000) || ''
      } else if (e.type === 'search_result') {
        return e.data.map((r: any) => r.snippet || r.description || '').join(' ')
      }
      return JSON.stringify(e.data).substring(0, 1000)
    }).filter(Boolean)
    
    if (textSnippets.length > 0) {
      const embeddingsResult = await callSupabaseFunction('jina-data-collector', {
        type: 'embed',
        options: {
          texts: textSnippets
        }
      })
      
      // Attach embeddings to evidence
      if (embeddingsResult.data) {
        evidence.forEach((e, i) => {
          if (i < embeddingsResult.data.length) {
            e.embedding = embeddingsResult.data[i]
          }
        })
      }
      
      services.evidenceStorage = {
        status: 'success',
        data: { 
          evidenceCount: evidence.length,
          withEmbeddings: embeddingsResult.data?.length || 0
        },
        duration: Date.now() - storageStartTime
      }
    }
  } catch (error) {
    console.error('Evidence storage error:', error)
    services.evidenceStorage = {
      status: 'failed',
      error: error.message,
      duration: Date.now() - storageStartTime
    }
  }
  
  return { services, evidence }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: OrchestratorRequest = await req.json()
    const startTime = Date.now()
    const reportId = crypto.randomUUID()
    
    console.log(`Starting orchestrated report generation for ${request.company.name}`)
    
    // Gather data using Jina services
    const { services, evidence } = await gatherCompanyData(request.company)
    
    // Generate comprehensive report
    const report = {
      summary: services.techIntelligence?.data?.insights?.technologyStack?.summary || 
               'Technology assessment in progress',
      insights: services.techIntelligence?.data?.insights || {},
      evidence: evidence
    }
    
    const response: OrchestratorResponse = {
      reportId,
      company: request.company.name,
      executedAt: new Date().toISOString(),
      services,
      totalDuration: Date.now() - startTime,
      report
    }
    
    // Store report in database (implementation needed)
    // await storeReport(response)
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Orchestrator error:', error)
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