import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function finalTest() {
  console.log('🚀 Queue-Based Evidence Collection System - Final Test')
  console.log('===================================================\n')
  
  // Create scan
  console.log('Creating scan for Mixpanel...')
  const scanRes = await fetch(`${API_URL}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: 'Mixpanel',
      website_url: 'https://mixpanel.com',
      primary_criteria: 'vertical-saas',
      requestor_name: 'PE Analyst',
      organization_name: 'Test PE Firm'
    })
  })
  
  const scan = await scanRes.json()
  console.log('✅ Scan created:', scan.scanRequestId)
  console.log('   Evidence Job:', scan.jobs.evidenceJobId)
  console.log('   Report Job:', scan.jobs.reportJobId)
  
  // Wait and check results
  console.log('\n⏳ Waiting 30 seconds for processing...')
  await new Promise(resolve => setTimeout(resolve, 30000))
  
  // Check results
  const { data: scanRequest } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('id', scan.scanRequestId)
    .single()
  
  const { count: evidenceCount } = await supabase
    .from('evidence_items')
    .select('*', { count: 'exact', head: true })
    .eq('company_name', 'Mixpanel')
  
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('scan_request_id', scan.scanRequestId)
    .single()
  
  console.log('\n📊 Results:')
  console.log('============')
  console.log('Scan Status:', scanRequest?.status)
  console.log('AI Workflow Status:', scanRequest?.ai_workflow_status)
  console.log('Evidence Collected:', evidenceCount)
  
  if (report) {
    console.log('\n✅ Report Generated!')
    console.log('Report ID:', report.id)
    console.log('Investment Score:', report.investment_score)
    console.log('Tech Health Grade:', report.tech_health_grade)
    console.log('Evidence Count:', report.evidence_count)
    console.log('Citation Count:', report.citation_count)
    console.log('\nView at: http://localhost:3000/reports/' + report.id)
  } else {
    console.log('\n❌ No report generated')
  }
  
  console.log('\n📈 Summary:')
  console.log('- Evidence collection: ' + (evidenceCount > 100 ? '✅ Working (200+ items)' : evidenceCount > 0 ? '⚠️  Limited' : '❌ Failed'))
  console.log('- Report generation: ' + (report ? '✅ Working' : '❌ Failed'))
  console.log('- Investment scoring: ' + (report && report.investment_score !== 70 ? '✅ Dynamic' : '❌ Generic'))
}

finalTest().catch(console.error)