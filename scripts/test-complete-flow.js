import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testCompleteFlow() {
  console.log('Testing Complete Queue-Based Flow')
  console.log('=================================')
  
  // Step 1: Create scan
  console.log('\n1. Creating scan for Mixpanel...')
  const scanRes = await fetch(`${API_URL}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: 'Mixpanel',
      website_url: 'https://mixpanel.com',
      primary_criteria: 'vertical-saas',
      requestor_name: 'Queue Test',
      organization_name: 'Test PE Firm'
    })
  })
  
  const scan = await scanRes.json()
  console.log('Scan created:', scan)
  
  if (!scan.success) {
    console.error('Failed to create scan')
    return
  }
  
  const scanId = scan.scanRequestId
  
  // Step 2: Monitor progress
  console.log('\n2. Monitoring progress...')
  let completed = false
  let iterations = 0
  const maxIterations = 60 // 5 minutes max
  
  while (!completed && iterations < maxIterations) {
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
    iterations++
    
    // Check scan status
    const { data: scanRequest } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', scanId)
      .single()
    
    // Check evidence
    const { count: evidenceCount } = await supabase
      .from('evidence_items')
      .select('*', { count: 'exact', head: true })
      .eq('company_name', 'Mixpanel')
    
    // Check report
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', scanId)
      .single()
    
    console.log(`\nIteration ${iterations}:`)
    console.log('- Scan status:', scanRequest?.status)
    console.log('- Evidence count:', evidenceCount)
    console.log('- Report exists:', !!report)
    
    if (report) {
      completed = true
      console.log('\n✅ SUCCESS! Report generated')
      console.log('Report ID:', report.id)
      console.log('Investment Score:', report.investment_score)
      console.log('Evidence Count:', report.evidence_count)
      console.log('Citation Count:', report.citation_count)
      console.log('\nView at: http://localhost:3000/reports/' + report.id)
    }
  }
  
  if (!completed) {
    console.log('\n❌ Timeout - Report not generated within 5 minutes')
  }
}

testCompleteFlow().catch(console.error)