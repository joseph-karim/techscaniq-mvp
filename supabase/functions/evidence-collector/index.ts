import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    processing_steps?: string[]
  }
  embedding?: number[]
  classifications?: {
    category: string
    score: number
  }[]
  breadcrumbs: {
    search_query?: string
    search_results?: number
    extraction_method?: string
    selectors_used?: string[]
    rerank_score?: number
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

// Jina API configuration
const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
const jinaHeaders = {
  'Authorization': `Bearer ${JINA_API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

async function collectWithDeepSearch(company: string, website: string, query: string): Promise<Evidence[]> {
  const evidence: Evidence[] = []
  
  try {
    const response = await fetch('https://deepsearch.jina.ai/v1/chat/completions', {
      method: 'POST',
      headers: jinaHeaders,
      body: JSON.stringify({
        model: 'jina-deepsearch-v1',
        messages: [{
          role: 'user',
          content: query
        }],
        reasoning_effort: 'high',
        max_returned_urls: 10,
        boost_hostnames: [new URL(website).hostname],
        stream: false,
        response_format: {
          type: 'json_schema',
          json_schema: {
            type: 'object',
            properties: {
              findings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    fact: { type: 'string' },
                    source_url: { type: 'string' },
                    confidence: { type: 'number' },
                    evidence_snippet: { type: 'string' },
                    category: { type: 'string' }
                  }
                }
              },
              summary: { type: 'string' }
            }
          }
        }
      })
    })

    if (!response.ok) throw new Error(`DeepSearch failed: ${response.statusText}`)
    
    const result = await response.json()
    const findings = result.choices[0].message.content
    
    // Convert DeepSearch findings to Evidence objects
    for (const finding of findings.findings || []) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'deepsearch_finding',
        source: {
          url: finding.source_url,
          query,
          api: 'deepsearch',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: finding.evidence_snippet,
          summary: finding.fact
        },
        metadata: {
          confidence: finding.confidence || 0.8,
          relevance: 0.9,
          processing_steps: ['deepsearch', 'extraction', 'validation']
        },
        breadcrumbs: {
          search_query: query,
          extraction_method: 'deepsearch_reasoning'
        }
      })
    }
  } catch (error) {
    console.error('DeepSearch error:', error)
  }
  
  return evidence
}

async function collectWithReader(url: string, selectors?: string[]): Promise<Evidence | null> {
  try {
    const headers = {
      ...jinaHeaders,
      'X-With-Links-Summary': 'true',
      'X-With-Images-Summary': 'true',
      'X-With-Generated-Alt': 'true',
      'X-With-Shadow-Dom': 'true',
      'X-Return-Format': 'markdown'
    }
    
    if (selectors && selectors.length > 0) {
      headers['X-Target-Selector'] = selectors.join(',')
    }
    
    const response = await fetch('https://r.jina.ai/', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url })
    })
    
    if (!response.ok) throw new Error(`Reader failed: ${response.statusText}`)
    
    const result = await response.json()
    
    return {
      id: crypto.randomUUID(),
      type: 'webpage_content',
      source: {
        url,
        api: 'reader',
        timestamp: new Date().toISOString()
      },
      content: {
        raw: result.data.content,
        processed: result.data.content.substring(0, 2000) // First 2000 chars for summary
      },
      metadata: {
        confidence: 1.0, // Direct extraction is highly confident
        relevance: 0.8,
        tokens: result.usage?.tokens,
        processing_steps: ['reader_extraction', 'markdown_conversion']
      },
      breadcrumbs: {
        extraction_method: 'jina_reader',
        selectors_used: selectors
      }
    }
  } catch (error) {
    console.error('Reader error:', error)
    return null
  }
}

async function searchAndCollect(query: string, site?: string): Promise<Evidence[]> {
  const evidence: Evidence[] = []
  
  try {
    const headers = { ...jinaHeaders }
    if (site) headers['X-Site'] = site
    
    const response = await fetch('https://s.jina.ai/', {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: query, num: 5 })
    })
    
    if (!response.ok) throw new Error(`Search failed: ${response.statusText}`)
    
    const result = await response.json()
    
    for (const item of result.data || []) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'search_result',
        source: {
          url: item.url,
          query,
          api: 'search',
          timestamp: new Date().toISOString()
        },
        content: {
          raw: item.content,
          summary: item.description
        },
        metadata: {
          confidence: 0.7,
          relevance: 0.8,
          tokens: item.usage?.tokens
        },
        breadcrumbs: {
          search_query: query,
          search_results: result.data.length
        }
      })
    }
  } catch (error) {
    console.error('Search error:', error)
  }
  
  return evidence
}

async function createEmbeddings(evidence: Evidence[]): Promise<void> {
  if (evidence.length === 0) return
  
  const texts = evidence.map(e => e.content.summary || e.content.raw.substring(0, 1000))
  
  try {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: jinaHeaders,
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: texts,
        task: 'retrieval.passage'
      })
    })
    
    if (!response.ok) throw new Error(`Embeddings failed: ${response.statusText}`)
    
    const result = await response.json()
    
    // Attach embeddings to evidence
    result.data.forEach((item: any, index: number) => {
      if (evidence[index]) {
        evidence[index].embedding = item.embedding
      }
    })
  } catch (error) {
    console.error('Embeddings error:', error)
  }
}

async function classifyEvidence(evidence: Evidence[]): Promise<void> {
  if (evidence.length === 0) return
  
  const texts = evidence.map(e => e.content.summary || e.content.raw.substring(0, 500))
  const labels = [
    'Technology Infrastructure',
    'Security Risk',
    'Team & Culture',
    'Financial Data',
    'Market Position',
    'Technical Debt',
    'Compliance Issue',
    'Competitive Advantage'
  ]
  
  try {
    const response = await fetch('https://api.jina.ai/v1/classify', {
      method: 'POST',
      headers: jinaHeaders,
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: texts,
        labels
      })
    })
    
    if (!response.ok) throw new Error(`Classification failed: ${response.statusText}`)
    
    const result = await response.json()
    
    // Attach classifications to evidence
    result.data.forEach((item: any, index: number) => {
      if (evidence[index]) {
        evidence[index].classifications = [{
          category: item.prediction,
          score: item.score
        }]
      }
    })
  } catch (error) {
    console.error('Classification error:', error)
  }
}

async function storeEvidence(collectionId: string, evidence: Evidence[]): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )
  
  // Store evidence collection metadata
  const { error: collectionError } = await supabase
    .from('evidence_collections')
    .insert({
      id: collectionId,
      evidence_count: evidence.length,
      created_at: new Date().toISOString()
    })
  
  if (collectionError) {
    console.error('Failed to store collection:', collectionError)
  }
  
  // Store individual evidence pieces
  const evidenceRecords = evidence.map(e => ({
    collection_id: collectionId,
    evidence_id: e.id,
    type: e.type,
    source_data: e.source,
    content_data: e.content,
    metadata: e.metadata,
    embedding: e.embedding,
    classifications: e.classifications,
    breadcrumbs: e.breadcrumbs
  }))
  
  const { error: evidenceError } = await supabase
    .from('evidence_items')
    .insert(evidenceRecords)
  
  if (evidenceError) {
    console.error('Failed to store evidence:', evidenceError)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: EvidenceRequest = await req.json()
    const collectionId = crypto.randomUUID()
    const allEvidence: Evidence[] = []
    
    console.log(`Starting evidence collection for ${request.companyName}`)
    
    // Phase 1: Deep Search for comprehensive insights
    if (request.depth === 'comprehensive' || request.depth === 'deep') {
      const deepSearchQueries = [
        `${request.companyName} technology stack architecture infrastructure detailed analysis`,
        `${request.companyName} security vulnerabilities data breaches incidents`,
        `${request.companyName} engineering team culture development practices`,
        `${request.companyName} financial performance funding revenue metrics`,
        `${request.companyName} market position competitors analysis`
      ]
      
      for (const query of deepSearchQueries) {
        const evidence = await collectWithDeepSearch(request.companyName, request.companyWebsite, query)
        allEvidence.push(...evidence)
      }
    }
    
    // Phase 2: Direct website extraction
    const websiteEvidence = await collectWithReader(request.companyWebsite)
    if (websiteEvidence) allEvidence.push(websiteEvidence)
    
    // Extract specific pages
    const targetPages = ['/about', '/team', '/technology', '/security', '/careers']
    for (const page of targetPages) {
      const pageEvidence = await collectWithReader(`${request.companyWebsite}${page}`)
      if (pageEvidence) allEvidence.push(pageEvidence)
    }
    
    // Phase 3: Targeted searches
    if (request.evidenceTypes.includes('technical')) {
      const techEvidence = await searchAndCollect(`${request.companyName} github open source`)
      allEvidence.push(...techEvidence)
    }
    
    if (request.evidenceTypes.includes('security')) {
      const secEvidence = await searchAndCollect(`${request.companyName} CVE vulnerability disclosure`)
      allEvidence.push(...secEvidence)
    }
    
    // Phase 4: Create embeddings for all evidence
    await createEmbeddings(allEvidence)
    
    // Phase 5: Classify evidence
    await classifyEvidence(allEvidence)
    
    // Phase 6: Store in database
    await storeEvidence(collectionId, allEvidence)
    
    // Prepare response
    const response: EvidenceCollectionResponse = {
      collectionId,
      company: request.companyName,
      timestamp: new Date().toISOString(),
      evidence: allEvidence,
      summary: {
        total_evidence: allEvidence.length,
        by_type: allEvidence.reduce((acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        confidence_avg: allEvidence.reduce((sum, e) => sum + e.metadata.confidence, 0) / allEvidence.length,
        sources_used: [...new Set(allEvidence.map(e => e.source.api || 'unknown'))]
      }
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Evidence collector error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 