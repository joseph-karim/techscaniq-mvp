import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkLatestReports() {
  console.log('Checking latest reports...')
  
  // Get latest reports
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error:', error)
  } else if (reports && reports.length > 0) {
    console.log(`\nFound ${reports.length} recent reports:`)
    reports.forEach((report, i) => {
      console.log(`\n${i + 1}. ${report.company_name}`)
      console.log(`   ID: ${report.id}`)
      console.log(`   Scan Request ID: ${report.scan_request_id}`)
      console.log(`   Investment Score: ${report.investment_score}`)
      console.log(`   Evidence Count: ${report.evidence_count}`)
      console.log(`   Citation Count: ${report.citation_count}`)
      console.log(`   Created: ${new Date(report.created_at).toLocaleString()}`)
    })
  } else {
    console.log('No reports found')
  }
}

checkLatestReports().catch(console.error)