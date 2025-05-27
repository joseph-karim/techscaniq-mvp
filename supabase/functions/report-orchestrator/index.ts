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
  services?: string[] // Which services to run
}

interface OrchestratorResponse {
  reportId: string
  company: string
  executedAt: string
  services: {
    websiteScanner?: {
      status: 'success' | 'failed'
      data?: any
      error?: string
      duration: number
    }
    techIntelligence?: {
      status: 'success' | 'failed'
      data?: any
      error?: string
      duration: number
    }
  }
  totalDuration: number
}

async function callSupabaseFunction(functionName: string, payload: any, authHeader: string): Promise<any> {
  const projectUrl = Deno.env.get('SUPABASE_URL') || 'https://xngbtpbtivygkxnsexjg.supabase.co'
  const url = `${projectUrl}/functions/v1/${functionName}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify(payload)
  })
  
  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error || `Function ${functionName} failed`)
  }
  
  return result
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const request: OrchestratorRequest = await req.json()
    
    if (!request.company?.name || !request.company?.website) {
      throw new Error('Company name and website are required')
    }
    
    // Get the authorization header to pass to other functions
    const authHeader = req.headers.get('Authorization') || ''
    
    const response: OrchestratorResponse = {
      reportId: crypto.randomUUID(),
      company: request.company.name,
      executedAt: new Date().toISOString(),
      services: {},
      totalDuration: 0
    }
    
    console.log(`Starting orchestrated analysis for ${request.company.name}...`)
    
    // Step 1: Website Scanner
    const scanStartTime = Date.now()
    try {
      console.log('Running website scanner...')
      const scanResult = await callSupabaseFunction('website-scanner', {
        url: request.company.website
      }, authHeader)
      
      response.services.websiteScanner = {
        status: 'success',
        data: scanResult.data,
        duration: Date.now() - scanStartTime
      }
      console.log('Website scan completed successfully')
    } catch (error) {
      console.error('Website scanner error:', error)
      response.services.websiteScanner = {
        status: 'failed',
        error: error.message,
        duration: Date.now() - scanStartTime
      }
    }
    
    // Step 2: Tech Intelligence (uses website scan data if available)
    const intelligenceStartTime = Date.now()
    try {
      console.log('Running tech intelligence analysis...')
      const intelligenceResult = await callSupabaseFunction('tech-intelligence', {
        company: request.company,
        websiteScanData: response.services.websiteScanner?.data
      }, authHeader)
      
      response.services.techIntelligence = {
        status: 'success',
        data: intelligenceResult.data,
        duration: Date.now() - intelligenceStartTime
      }
      console.log('Tech intelligence completed successfully')
    } catch (error) {
      console.error('Tech intelligence error:', error)
      response.services.techIntelligence = {
        status: 'failed',
        error: error.message,
        duration: Date.now() - intelligenceStartTime
      }
    }
    
    response.totalDuration = Date.now() - startTime
    
    console.log(`Orchestration completed in ${response.totalDuration}ms`)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: response
      }),
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