import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingRequest {
  collectionId: string
  rawEvidence: {
    id: string
    content: string
    source: string
    type: string
  }[]
  claimToVerify?: string // For reranking evidence against a specific claim
}

interface ProcessedChunk {
  id: string
  originalEvidenceId: string
  chunkIndex: number
  content: string
  embedding?: number[]
  metadata: {
    startChar: number
    endChar: number
    tokens: number
    semanticDensity?: number
  }
}

interface CitationCandidate {
  evidenceId: string
  chunkId: string
  content: string
  relevanceScore: number
  source: string
  breadcrumb: {
    originalDoc: string
    chunkPosition: string
    extractionPath: string[]
  }
}

// Jina API configuration
const JINA_API_KEY = Deno.env.get('JINA_API_KEY')
const jinaHeaders = {
  'Authorization': `Bearer ${JINA_API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

async function segmentEvidence(content: string, maxChunkLength: number = 1000): Promise<any> {
  try {
    const response = await fetch('https://segment.jina.ai/', {
      method: 'POST',
      headers: jinaHeaders,
      body: JSON.stringify({
        content,
        tokenizer: 'cl100k_base',
        return_chunks: true,
        return_tokens: true,
        max_chunk_length: maxChunkLength
      })
    })
    
    if (!response.ok) throw new Error(`Segmenter failed: ${response.statusText}`)
    
    return response.json()
  } catch (error) {
    console.error('Segmentation error:', error)
    throw error
  }
}

async function createChunkEmbeddings(chunks: string[]): Promise<number[][]> {
  try {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: jinaHeaders,
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: chunks,
        task: 'retrieval.passage',
        dimensions: 1024,
        late_chunking: false // Already chunked
      })
    })
    
    if (!response.ok) throw new Error(`Embeddings failed: ${response.statusText}`)
    
    const result = await response.json()
    return result.data.map((d: any) => d.embedding)
  } catch (error) {
    console.error('Embedding error:', error)
    throw error
  }
}

async function rerankEvidence(query: string, documents: any[]): Promise<any[]> {
  try {
    const response = await fetch('https://api.jina.ai/v1/rerank', {
      method: 'POST',
      headers: jinaHeaders,
      body: JSON.stringify({
        model: 'jina-reranker-v2-base-multilingual',
        query,
        documents: documents.map(d => ({
          text: d.content,
          id: d.id
        })),
        top_n: Math.min(10, documents.length),
        return_documents: true
      })
    })
    
    if (!response.ok) throw new Error(`Reranker failed: ${response.statusText}`)
    
    const result = await response.json()
    return result.results
  } catch (error) {
    console.error('Reranking error:', error)
    throw error
  }
}

async function processEvidenceChunks(evidence: any): Promise<ProcessedChunk[]> {
  const chunks: ProcessedChunk[] = []
  
  // Segment the evidence content
  const segmentResult = await segmentEvidence(evidence.content)
  
  // Create embeddings for all chunks
  const embeddings = await createChunkEmbeddings(segmentResult.chunks)
  
  // Process each chunk
  segmentResult.chunks.forEach((chunk: string, index: number) => {
    const [startChar, endChar] = segmentResult.chunk_positions[index]
    
    chunks.push({
      id: crypto.randomUUID(),
      originalEvidenceId: evidence.id,
      chunkIndex: index,
      content: chunk,
      embedding: embeddings[index],
      metadata: {
        startChar,
        endChar,
        tokens: segmentResult.tokens[index]?.length || 0,
        semanticDensity: calculateSemanticDensity(chunk)
      }
    })
  })
  
  return chunks
}

function calculateSemanticDensity(text: string): number {
  // Simple heuristic: ratio of unique meaningful words to total words
  const words = text.toLowerCase().split(/\s+/)
  const meaningfulWords = words.filter(w => w.length > 3)
  const uniqueWords = new Set(meaningfulWords)
  return uniqueWords.size / Math.max(words.length, 1)
}

async function findBestCitations(claim: string, chunks: ProcessedChunk[], evidenceMap: Map<string, any>): Promise<CitationCandidate[]> {
  // Prepare documents for reranking
  const documents = chunks.map(chunk => ({
    id: chunk.id,
    content: chunk.content,
    evidenceId: chunk.originalEvidenceId
  }))
  
  // Rerank chunks against the claim
  const rerankedResults = await rerankEvidence(claim, documents)
  
  // Build citation candidates
  const citations: CitationCandidate[] = rerankedResults.map((result: any) => {
    const chunk = chunks.find(c => c.id === result.document.id)!
    const originalEvidence = evidenceMap.get(chunk.originalEvidenceId)
    
    return {
      evidenceId: chunk.originalEvidenceId,
      chunkId: chunk.id,
      content: result.document.text,
      relevanceScore: result.relevance_score,
      source: originalEvidence.source,
      breadcrumb: {
        originalDoc: originalEvidence.source,
        chunkPosition: `chars ${chunk.metadata.startChar}-${chunk.metadata.endChar}`,
        extractionPath: [
          originalEvidence.type,
          `chunk_${chunk.chunkIndex}`,
          `relevance_${result.relevance_score.toFixed(3)}`
        ]
      }
    }
  })
  
  return citations
}

async function storeProcessedEvidence(collectionId: string, chunks: ProcessedChunk[], citations: CitationCandidate[]): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )
  
  // Store processed chunks with embeddings
  const chunkRecords = chunks.map(chunk => ({
    collection_id: collectionId,
    chunk_id: chunk.id,
    evidence_id: chunk.originalEvidenceId,
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    embedding: chunk.embedding,
    metadata: chunk.metadata,
    created_at: new Date().toISOString()
  }))
  
  const { error: chunkError } = await supabase
    .from('evidence_chunks')
    .insert(chunkRecords)
  
  if (chunkError) {
    console.error('Failed to store chunks:', chunkError)
  }
  
  // Store citation candidates if provided
  if (citations.length > 0) {
    const citationRecords = citations.map(citation => ({
      collection_id: collectionId,
      evidence_id: citation.evidenceId,
      chunk_id: citation.chunkId,
      content: citation.content,
      relevance_score: citation.relevanceScore,
      source: citation.source,
      breadcrumb: citation.breadcrumb,
      created_at: new Date().toISOString()
    }))
    
    const { error: citationError } = await supabase
      .from('citation_candidates')
      .insert(citationRecords)
    
    if (citationError) {
      console.error('Failed to store citations:', citationError)
    }
  }
}

async function createStructuredCitation(citation: CitationCandidate, claimContext: string): Promise<any> {
  // Use Jina Classifier to categorize the citation type
  const classificationResponse = await fetch('https://api.jina.ai/v1/classify', {
    method: 'POST',
    headers: jinaHeaders,
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      input: [citation.content],
      labels: [
        'Direct Evidence',
        'Supporting Context',
        'Counter Evidence',
        'Background Information',
        'Technical Specification',
        'Market Data',
        'Expert Opinion'
      ]
    })
  })
  
  const classification = await classificationResponse.json()
  const citationType = classification.data[0].prediction
  
  return {
    id: crypto.randomUUID(),
    type: citationType,
    content: citation.content,
    source: {
      url: citation.source,
      evidenceId: citation.evidenceId,
      chunkId: citation.chunkId
    },
    relevance: {
      score: citation.relevanceScore,
      context: claimContext
    },
    breadcrumb: citation.breadcrumb,
    metadata: {
      extractedAt: new Date().toISOString(),
      processingSteps: [
        'content_extraction',
        'segmentation',
        'embedding',
        'reranking',
        'classification'
      ]
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: ProcessingRequest = await req.json()
    const processedChunks: ProcessedChunk[] = []
    const evidenceMap = new Map(request.rawEvidence.map(e => [e.id, e]))
    
    console.log(`Processing ${request.rawEvidence.length} evidence items`)
    
    // Phase 1: Segment and embed all evidence
    for (const evidence of request.rawEvidence) {
      const chunks = await processEvidenceChunks(evidence)
      processedChunks.push(...chunks)
    }
    
    console.log(`Created ${processedChunks.length} chunks from evidence`)
    
    // Phase 2: If a claim is provided, find best citations
    let citations: CitationCandidate[] = []
    let structuredCitations: any[] = []
    
    if (request.claimToVerify) {
      citations = await findBestCitations(
        request.claimToVerify,
        processedChunks,
        evidenceMap
      )
      
      // Create structured citations for top results
      for (const citation of citations.slice(0, 5)) {
        const structured = await createStructuredCitation(
          citation,
          request.claimToVerify
        )
        structuredCitations.push(structured)
      }
    }
    
    // Phase 3: Store everything
    await storeProcessedEvidence(
      request.collectionId,
      processedChunks,
      citations
    )
    
    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          evidenceProcessed: request.rawEvidence.length,
          chunksCreated: processedChunks.length,
          citationsFound: citations.length,
          averageChunkSize: processedChunks.reduce((sum, c) => sum + c.content.length, 0) / processedChunks.length
        },
        citations: structuredCitations,
        processingSteps: [
          'segmentation',
          'embedding_generation',
          'reranking',
          'classification',
          'storage'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Evidence processor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 