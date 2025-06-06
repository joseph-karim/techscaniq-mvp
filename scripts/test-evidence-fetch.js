import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEvidenceFetch() {
  try {
    console.log('Testing evidence fetching...\n')

    // 1. Get a recent report
    const { data: reports, error: reportError } = await supabase
      .from('reports')
      .select('id, company_name, report_data, created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    if (reportError) {
      console.error('Error fetching reports:', reportError)
      return
    }

    if (!reports || reports.length === 0) {
      console.log('No reports found')
      return
    }

    const report = reports[0]
    const companyName = report.report_data?.company_name || 'Unknown'
    
    console.log(`Found report: ${report.id}`)
    console.log(`Company: ${companyName}`)
    console.log(`Created: ${report.created_at}\n`)

    // 2. Get evidence collection for this company
    const { data: collections, error: collectionError } = await supabase
      .from('evidence_collections')
      .select(`
        *,
        evidence_items (
          id,
          evidence_id,
          type,
          source_data,
          content_data,
          metadata,
          breadcrumbs,
          created_at
        )
      `)
      .eq('company_name', companyName)
      .order('created_at', { ascending: false })
      .limit(1)

    if (collectionError) {
      console.error('Error fetching evidence collection:', collectionError)
    } else if (!collections || collections.length === 0) {
      console.log('No evidence collection found for this company')
    } else {
      const collection = collections[0]
      console.log(`Evidence Collection ID: ${collection.id}`)
      console.log(`Status: ${collection.collection_status}`)
      console.log(`Evidence Count: ${collection.evidence_items?.length || 0}\n`)

      // Show sample evidence items
      if (collection.evidence_items && collection.evidence_items.length > 0) {
        console.log('Sample Evidence Items:')
        collection.evidence_items.slice(0, 3).forEach((item, idx) => {
          console.log(`\n${idx + 1}. Type: ${item.type}`)
          console.log(`   Source: ${item.source_data?.url || item.source_data?.query || 'N/A'}`)
          console.log(`   Summary: ${item.content_data?.summary?.substring(0, 100)}...`)
          console.log(`   Confidence: ${Math.round((item.metadata?.confidence || 0.8) * 100)}%`)
        })
      }
    }

    // 3. Get citations for this report
    const { data: citations, error: citationError } = await supabase
      .from('report_citations')
      .select(`
        *,
        evidence_items!evidence_item_id (
          id,
          type,
          source_data,
          content_data,
          metadata
        )
      `)
      .eq('report_id', report.id)
      .order('created_at', { ascending: true })

    if (citationError) {
      console.error('Error fetching citations:', citationError)
    } else {
      console.log(`\n\nCitations Found: ${citations?.length || 0}`)
      
      if (citations && citations.length > 0) {
        console.log('\nSample Citations:')
        citations.slice(0, 3).forEach((citation, idx) => {
          console.log(`\n${idx + 1}. Claim: ${citation.claim || citation.citation_text}`)
          console.log(`   Confidence: ${Math.round((citation.confidence || citation.confidence_score || 0.8) * 100)}%`)
          console.log(`   Evidence: ${citation.evidence_items ? 'Linked' : 'Not linked'}`)
        })
      }
    }

    console.log('\n\nTest complete!')

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testEvidenceFetch()