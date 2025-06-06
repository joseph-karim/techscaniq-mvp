import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkReportConstraint() {
  console.log('Checking valid report structure...')
  
  // Get a working report
  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, company_name, report_data')
    .not('report_data', 'is', null)
    .limit(5)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${reports?.length || 0} reports with data`)
  
  if (reports && reports.length > 0) {
    const report = reports[0]
    console.log('\nSample report structure from:', report.company_name)
    console.log('Report data keys:', Object.keys(report.report_data))
    
    // Check each section
    Object.entries(report.report_data).forEach(([key, value]) => {
      console.log(`\n${key}:`)
      if (typeof value === 'object' && value !== null) {
        console.log('  Keys:', Object.keys(value))
        if (value.score !== undefined) console.log('  Score:', value.score)
        if (value.grade !== undefined) console.log('  Grade:', value.grade)
      }
    })
  }
}

checkReportConstraint().catch(console.error)