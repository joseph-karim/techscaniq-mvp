import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkMixpanelScan() {
  console.log('Checking Mixpanel scan results...')
  
  // Check scan request
  const { data: scan } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('id', 'edbc50d2-1e7e-468c-be14-9362e6d88d35')
    .single()
  
  console.log('\nScan Request:')
  console.log('Status:', scan?.status)
  console.log('AI Workflow Status:', scan?.ai_workflow_status)
  console.log('Latest Report ID:', scan?.latest_report_id)
  
  // Check evidence collection
  const { data: collection } = await supabase
    .from('evidence_collections')
    .select('*')
    .eq('company_name', 'Mixpanel')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  console.log('\nEvidence Collection:')
  console.log('Status:', collection?.status)
  console.log('Evidence Count:', collection?.evidence_count)
  
  // Check evidence items
  const { count: evidenceCount } = await supabase
    .from('evidence_items')
    .select('*', { count: 'exact', head: true })
    .eq('company_name', 'Mixpanel')
  
  console.log('\nEvidence Items:')
  console.log('Total Count:', evidenceCount)
  
  // Check reports
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('scan_request_id', 'edbc50d2-1e7e-468c-be14-9362e6d88d35')
    .single()
  
  if (report) {
    console.log('\nReport:')
    console.log('ID:', report.id)
    console.log('Investment Score:', report.investment_score)
    console.log('Status:', report.status)
    console.log('Evidence Count:', report.evidence_count)
    console.log('Citation Count:', report.citation_count)
  } else {
    console.log('\nNo report found yet')
  }
}

checkMixpanelScan().catch(console.error)