import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface StorageRequest {
  companyName: string
  companyWebsite: string
  evidence: any[]
  metadata?: any
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { companyName, companyWebsite, evidence, metadata } = await req.json() as StorageRequest
    
    console.log(`Storing evidence for ${companyName}: ${evidence.length} items`)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Create collection record
    const { data: collection, error: collectionError } = await supabase
      .from('evidence_collections')
      .insert({
        company_name: companyName,
        company_website: companyWebsite,
        evidence_count: evidence.length,
        status: 'completed',
        collection_type: metadata?.depth || 'shallow',
        metadata: metadata || {}
      })
      .select()
      .single()

    if (collectionError) {
      throw new Error(`Failed to create collection: ${collectionError.message}`)
    }

    // Store evidence items
    const storedItems = []
    for (const item of evidence) {
      const { data, error } = await supabase
        .from('evidence_items')
        .insert({
          collection_id: collection.id,
          evidence_id: item.id,
          type: item.type,
          source_data: item.source,
          content_data: item.content,
          metadata: item.metadata || {},
          company_name: companyName,
          classifications: [{ category: 'general', score: 0.8 }]
        })
        .select()
        .single()

      if (!error && data) {
        storedItems.push(data)
      } else {
        console.warn(`Failed to store evidence item ${item.id}:`, error)
      }
    }

    console.log(`Stored ${storedItems.length}/${evidence.length} evidence items`)
    
    return new Response(JSON.stringify({
      success: true,
      collectionId: collection.id,
      storedItems: storedItems.length,
      totalItems: evidence.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Storage error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})