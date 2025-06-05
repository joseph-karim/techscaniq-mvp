import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  console.log('VITE_SUPABASE_URL:', supabaseUrl)
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCitations() {
  try {
    // Get the latest report
    const { data: reports, error: reportError } = await supabase
      .from('scan_reports')
      .select('id, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (reportError) {
      console.error('Error fetching reports:', reportError)
      return
    }
    
    console.log('Latest reports:')
    reports.forEach(report => {
      console.log(`- ${report.company_name} (${report.id}) - ${report.created_at}`)
    })
    
    // Check citations for each report
    for (const report of reports) {
      const { data: citations, error: citationError } = await supabase
        .from('report_citations')
        .select('*')
        .eq('report_id', report.id)
      
      if (citationError) {
        console.error(`Error fetching citations for ${report.company_name}:`, citationError)
        continue
      }
      
      console.log(`\nCitations for ${report.company_name}: ${citations.length}`)
      if (citations.length > 0) {
        console.log('Sample citations:')
        citations.slice(0, 3).forEach(citation => {
          console.log(`  - ${citation.claim_id}: ${citation.citation_text.slice(0, 50)}...`)
        })
      }
    }
    
    // Check evidence items
    const { data: evidenceItems, error: evidenceError } = await supabase
      .from('evidence_items')
      .select('id, type, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (evidenceError) {
      console.error('Error fetching evidence items:', evidenceError)
    } else {
      console.log(`\nLatest evidence items: ${evidenceItems.length}`)
      evidenceItems.forEach(item => {
        console.log(`  - ${item.id} (${item.type}) - ${item.created_at}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkCitations() 