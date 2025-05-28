import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

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
  metadata: {
    confidence: number
    relevance: number
    tokens?: number
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

async function collectConcurrently(company: string, website: string, depth: string): Promise<Evidence[]> {
  const allEvidence: Evidence[] = []
  const promises: Promise<any>[] = []
  
  // Phase 1: Core website content (always collect)
  promises.push(
    callSupabaseFunction('collect-webpage', { url: website })
      .then(result => {
        if (result.success && result.data) {
          allEvidence.push({
            id: crypto.randomUUID(),
            type: 'webpage_content',
            source: {
              url: website,
              api: 'reader',
              timestamp: new Date().toISOString()
            },
            content: {
              raw: result.data.content,
              summary: result.data.description || result.data.content.substring(0, 500)
            },
            metadata: {
              confidence: 1.0,
              relevance: 0.9
            }
          })
        }
      })
      .catch(err => console.error('Webpage collection failed:', err))
  )
  
  // Phase 2: Search queries (for non-shallow depths)
  if (depth !== 'shallow') {
    // Company overview search
    promises.push(
      callSupabaseFunction('search-company', {
        query: `${company} company overview technology infrastructure`,
        num: 2
      })
        .then(result => {
          if (result.success && result.data) {
            result.data.forEach((item: any) => {
              allEvidence.push({
                id: crypto.randomUUID(),
                type: 'search_result',
                source: {
                  url: item.url,
                  query: `${company} overview`,
                  api: 'search',
                  timestamp: new Date().toISOString()
                },
                content: {
                  raw: item.content,
                  summary: item.description || item.content.substring(0, 500)
                },
                metadata: {
                  confidence: 0.7,
                  relevance: 0.8
                }
              })
            })
          }
        })
        .catch(err => console.error('Company search failed:', err))
    )
    
    // Security search
    promises.push(
      callSupabaseFunction('search-company', {
        query: `${company} security compliance certifications`,
        num: 1
      })
        .then(result => {
          if (result.success && result.data) {
            result.data.forEach((item: any) => {
              allEvidence.push({
                id: crypto.randomUUID(),
                type: 'security_finding',
                source: {
                  url: item.url,
                  query: `${company} security`,
                  api: 'search',
                  timestamp: new Date().toISOString()
                },
                content: {
                  raw: item.content,
                  summary: item.description || item.content.substring(0, 500)
                },
                metadata: {
                  confidence: 0.6,
                  relevance: 0.7
                }
              })
            })
          }
        })
        .catch(err => console.error('Security search failed:', err))
    )
  }
  
  // Phase 3: Additional pages (for comprehensive depth)
  if (depth === 'comprehensive') {
    const additionalPages = ['/about', '/technology', '/careers']
    additionalPages.forEach(page => {
      promises.push(
        callSupabaseFunction('collect-webpage', { 
          url: `${website}${page}` 
        })
          .then(result => {
            if (result.success && result.data) {
              allEvidence.push({
                id: crypto.randomUUID(),
                type: 'webpage_content',
                source: {
                  url: `${website}${page}`,
                  api: 'reader',
                  timestamp: new Date().toISOString()
                },
                content: {
                  raw: result.data.content,
                  summary: result.data.description || result.data.content.substring(0, 500)
                },
                metadata: {
                  confidence: 0.9,
                  relevance: 0.8
                }
              })
            }
          })
          .catch(err => console.error(`Failed to collect ${page}:`, err))
      )
    })
  }
  
  // Wait for all concurrent operations with a timeout
  await Promise.race([
    Promise.allSettled(promises),
    new Promise(resolve => setTimeout(resolve, 25000)) // 25 second timeout
  ])
  
  return allEvidence
}

async function storeEvidence(collectionId: string, company: string, website: string, evidence: Evidence[]): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )
  
  // Store evidence collection metadata
  const { error: collectionError } = await supabase
    .from('evidence_collections')
    .insert({
      id: collectionId,
      company_name: company,
      company_website: website,
      evidence_count: evidence.length,
      created_at: new Date().toISOString()
    })
  
  if (collectionError) {
    console.error('Failed to store collection:', collectionError)
  }
  
  // Store individual evidence pieces
  if (evidence.length > 0) {
    const evidenceRecords = evidence.map(e => ({
      collection_id: collectionId,
      evidence_id: e.id,
      type: e.type,
      source_data: e.source,
      content_data: e.content,
      metadata: e.metadata
    }))
    
    const { error: evidenceError } = await supabase
      .from('evidence_items')
      .insert(evidenceRecords)
    
    if (evidenceError) {
      console.error('Failed to store evidence:', evidenceError)
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: EvidenceRequest = await req.json()
    const collectionId = crypto.randomUUID()
    
    console.log(`Starting concurrent evidence collection for ${request.companyName}`)
    
    // Collect evidence concurrently
    const evidence = await collectConcurrently(
      request.companyName,
      request.companyWebsite,
      request.depth || 'deep'
    )
    
    console.log(`Collected ${evidence.length} pieces of evidence`)
    
    // Store in database
    await storeEvidence(collectionId, request.companyName, request.companyWebsite, evidence)
    
    // Prepare response
    const response: EvidenceCollectionResponse = {
      collectionId,
      company: request.companyName,
      timestamp: new Date().toISOString(),
      evidence,
      summary: {
        total_evidence: evidence.length,
        by_type: evidence.reduce((acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        confidence_avg: evidence.length > 0 
          ? evidence.reduce((sum, e) => sum + e.metadata.confidence, 0) / evidence.length
          : 0,
        sources_used: ['reader', 'search']
      }
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Evidence collector v2 error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 