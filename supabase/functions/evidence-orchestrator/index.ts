import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// CORS headers for handling cross-origin requests
const allowedOrigins = [
  'https://scan.techscaniq.com',
  'https://techscaniq.com', 
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
]

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  }
}

interface EvidenceRequest {
  companyName: string
  companyWebsite: string
  depth?: 'shallow' | 'deep' | 'comprehensive'
  investmentThesis?: any
}

// Call a Supabase function
async function callFunction(functionName: string, payload: any): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify(payload)
  })

  const result = await response.json()
  return { success: response.ok, ...result }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const startTime = Date.now()
    const { companyName, companyWebsite, depth = 'shallow', investmentThesis } = await req.json() as EvidenceRequest
    
    console.log(`Evidence orchestrator starting for ${companyName}`)
    
    const evidence = []
    const errors = []
    
    // Step 1: HTML Collection
    try {
      console.log('Calling html-collector...')
      const htmlResult = await callFunction('html-collector', {
        url: companyWebsite,
        options: { timeout: 15000 }
      })
      
      if (htmlResult.success && htmlResult.html) {
        evidence.push({
          id: crypto.randomUUID(),
          type: 'website_content',
          source: { url: companyWebsite, tool: 'html-collector', timestamp: new Date().toISOString() },
          content: { raw: htmlResult.html, summary: 'Website HTML content' },
          metadata: { confidence: 0.9, size: htmlResult.html.length }
        })
      }
    } catch (error) {
      console.error('HTML collection failed:', error)
      errors.push(`html-collector: ${error.message}`)
    }

    // Step 2: Security Analysis
    try {
      console.log('Calling security-scanner...')
      const securityResult = await callFunction('security-scanner', {
        url: companyWebsite,
        checks: ['headers', 'ssl']
      })
      
      if (securityResult.success) {
        evidence.push({
          id: crypto.randomUUID(),
          type: 'security_analysis',
          source: { url: companyWebsite, tool: 'security-scanner', timestamp: new Date().toISOString() },
          content: { raw: JSON.stringify(securityResult.checks), summary: 'Security analysis' },
          metadata: { confidence: 0.95, grade: securityResult.grade }
        })
      }
    } catch (error) {
      console.error('Security analysis failed:', error)
      errors.push(`security-scanner: ${error.message}`)
    }

    // Step 3: Google Search (if not shallow)
    if (depth !== 'shallow') {
      try {
        console.log('Calling google-search-collector...')
        const searchResult = await callFunction('google-search-collector', {
          query: `${companyName} company information`,
          companyName,
          companyWebsite,
          searchType: 'general',
          maxResults: 3
        })
        
        if (searchResult.success && searchResult.results?.length > 0) {
          evidence.push({
            id: crypto.randomUUID(),
            type: 'business_overview',
            source: { query: searchResult.query, tool: 'google-search', timestamp: new Date().toISOString() },
            content: { raw: JSON.stringify(searchResult.results), summary: 'Business information from search' },
            metadata: { confidence: 0.8, resultCount: searchResult.results.length }
          })
        }
      } catch (error) {
        console.error('Google search failed:', error)
        errors.push(`google-search: ${error.message}`)
      }
    }

    // Step 4: Store evidence using evidence-storage function
    let collectionId = null
    try {
      console.log('Calling evidence-storage...')
      const storageResult = await callFunction('evidence-storage', {
        companyName,
        companyWebsite,
        evidence,
        metadata: {
          depth,
          investmentThesis,
          duration: Date.now() - startTime,
          errors
        }
      })
      
      if (storageResult.success) {
        collectionId = storageResult.collectionId
      }
    } catch (error) {
      console.error('Evidence storage failed:', error)
      errors.push(`evidence-storage: ${error.message}`)
    }

    const totalTime = Date.now() - startTime
    console.log(`Evidence orchestration completed. Items: ${evidence.length}, Time: ${totalTime}ms`)
    
    return new Response(JSON.stringify({
      success: true,
      evidence,
      collectionId,
      summary: {
        total: evidence.length,
        duration: totalTime,
        tools: [...new Set(evidence.map(e => e.source.tool))],
        errors: errors.length > 0 ? errors : undefined
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Orchestrator error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})