import { createClient } from '@supabase/supabase-js'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface StreamUpdate {
  type: 'status' | 'progress' | 'complete' | 'error'
  phase?: string
  message?: string
  evidence_count?: number
  pages_crawled?: number
  iteration?: number
  total_pages?: number
  evidence_types_found?: string[]
  remaining_gaps?: string[]
  new_evidence?: any[]
  evidence_coverage?: any
  key_insights?: any
  error?: string
}

async function streamCollectEvidence(
  scanRequestId: string,
  domain: string,
  investmentThesis: string,
  onUpdate: (update: StreamUpdate) => void
): Promise<void> {
  console.log(`[Stream Worker] Starting evidence collection for ${domain}`)

  // Create evidence collection record with initial status
  const { data: collection, error: createError } = await supabase
    .from('evidence_collections')
    .insert({
      scan_request_id: scanRequestId,
      source_url: `https://${domain}`,
      collection_status: 'in_progress',
      metadata: { 
        investment_thesis: investmentThesis,
        stream_mode: true,
        started_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (createError || !collection) {
    console.error('[Stream Worker] Failed to create evidence collection:', createError)
    onUpdate({ type: 'error', error: createError?.message || 'Failed to create collection' })
    return
  }

  const collectionId = collection.id
  console.log(`[Stream Worker] Created collection ${collectionId}`)

  try {
    // Get API keys from vault
    let anthropicKey = ''
    let geminiKey = ''
    
    try {
      const { data: secrets } = await supabase.rpc('get_secret', { secret_name: 'ANTHROPIC_API_KEY' })
      anthropicKey = secrets || ''
      
      const { data: googleSecret } = await supabase.rpc('get_secret', { secret_name: 'GOOGLE_API_KEY' })
      geminiKey = googleSecret || ''
    } catch (err) {
      console.log('[Stream Worker] Could not fetch API keys from vault, using env vars')
      anthropicKey = process.env.ANTHROPIC_API_KEY || ''
      geminiKey = process.env.GOOGLE_API_KEY || ''
    }

    const apiKeys = {
      anthropic_key: anthropicKey,
      google_api_key: geminiKey,
      gemini_key: geminiKey
    }

    // Create a streaming Python process
    const pythonPath = path.join(__dirname, 'deep_research_crawler_streaming.py')
    const pythonProcess = spawn('python3', [
      pythonPath,
      domain,
      investmentThesis,
      scanRequestId,
      JSON.stringify(apiKeys)
    ])

    let buffer = ''
    let evidenceBatch: any[] = []
    const BATCH_SIZE = 10 // Insert evidence in batches

    // Handle streaming output
    pythonProcess.stdout.on('data', async (data) => {
      buffer += data.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue

        try {
          if (line.startsWith('STREAM:')) {
            // Parse streaming update
            const updateJson = line.substring(7).trim()
            const update: StreamUpdate = JSON.parse(updateJson)
            
            // Forward update to client
            onUpdate(update)

            // Update collection status periodically
            if (update.type === 'progress' && update.evidence_count) {
              await supabase
                .from('evidence_collections')
                .update({
                  evidence_count: update.evidence_count,
                  metadata: {
                    ...collection.metadata,
                    last_update: new Date().toISOString(),
                    pages_crawled: update.pages_crawled,
                    current_phase: update.phase,
                    evidence_types_found: update.evidence_types_found
                  }
                })
                .eq('id', collectionId)
            }
          } else if (line.startsWith('EVIDENCE:')) {
            // Parse evidence item
            const evidenceJson = line.substring(9).trim()
            const evidence = JSON.parse(evidenceJson)
            
            evidenceBatch.push({
              evidence_collection_id: collectionId,
              scan_request_id: scanRequestId,
              type: evidence.type,
              source: evidence.source,
              confidence: evidence.confidence,
              content: evidence.content,
              created_at: new Date().toISOString()
            })

            // Insert batch when full
            if (evidenceBatch.length >= BATCH_SIZE) {
              await insertEvidenceBatch(evidenceBatch)
              evidenceBatch = []
            }
          }
        } catch (err) {
          console.error('[Stream Worker] Error parsing stream output:', err, 'Line:', line)
        }
      }
    })

    pythonProcess.stderr.on('data', (data) => {
      console.error('[Stream Worker] Python error:', data.toString())
    })

    // Wait for process to complete
    await new Promise<void>((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        console.log(`[Stream Worker] Python process exited with code ${code}`)

        // Insert any remaining evidence
        if (evidenceBatch.length > 0) {
          await insertEvidenceBatch(evidenceBatch)
        }

        if (code === 0) {
          // Update collection as completed
          await supabase
            .from('evidence_collections')
            .update({
              collection_status: 'completed',
              metadata: {
                ...collection.metadata,
                completed_at: new Date().toISOString()
              }
            })
            .eq('id', collectionId)

          resolve()
        } else {
          reject(new Error(`Process exited with code ${code}`))
        }
      })

      pythonProcess.on('error', (err) => {
        console.error('[Stream Worker] Process error:', err)
        reject(err)
      })
    })

  } catch (error) {
    console.error('[Stream Worker] Collection failed:', error)
    
    // Update collection as failed
    await supabase
      .from('evidence_collections')
      .update({
        collection_status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          ...collection.metadata,
          failed_at: new Date().toISOString()
        }
      })
      .eq('id', collectionId)

    onUpdate({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Collection failed' 
    })
  }
}

async function insertEvidenceBatch(batch: any[]): Promise<void> {
  if (batch.length === 0) return

  const { error } = await supabase
    .from('evidence_items')
    .insert(batch)

  if (error) {
    console.error('[Stream Worker] Failed to insert evidence batch:', error)
  } else {
    console.log(`[Stream Worker] Inserted ${batch.length} evidence items`)
  }
}

// Process queue messages
self.addEventListener('message', async (event) => {
  const { scanRequestId, domain, investmentThesis } = event.data

  if (!scanRequestId || !domain) {
    console.error('[Stream Worker] Missing required parameters')
    self.postMessage({ 
      type: 'error', 
      error: 'Missing scanRequestId or domain' 
    })
    return
  }

  try {
    await streamCollectEvidence(
      scanRequestId, 
      domain, 
      investmentThesis || 'accelerate-organic-growth',
      (update) => {
        // Forward updates to main thread
        self.postMessage(update)
      }
    )

    self.postMessage({ 
      type: 'complete',
      message: 'Evidence collection completed' 
    })
  } catch (error) {
    console.error('[Stream Worker] Error:', error)
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

export {}