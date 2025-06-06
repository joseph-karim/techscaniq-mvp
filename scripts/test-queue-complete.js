import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testQueueComplete() {
  console.log('🚀 Queue-Based System - Complete Test')
  console.log('====================================\n')
  
  // Use a unique company name to avoid conflicts
  const testCompany = `Mixpanel-${Date.now()}`
  
  // Create scan
  console.log(`Creating scan for ${testCompany}...`)
  const scanRes = await fetch(`${API_URL}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: testCompany,
      website_url: 'https://mixpanel.com',
      primary_criteria: 'vertical-saas',
      requestor_name: 'Queue Test',
      organization_name: 'Test PE Firm'
    })
  })
  
  const scan = await scanRes.json()
  if (!scan.success) {
    console.error('Failed to create scan:', scan)
    return
  }
  
  console.log('✅ Scan created:', scan.scanRequestId)
  
  // Monitor progress
  console.log('\n⏳ Monitoring progress...')
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check evidence collection
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('company_name', testCompany)
      .single()
    
    const { count: evidenceCount } = await supabase
      .from('evidence_items')
      .select('*', { count: 'exact', head: true })
      .eq('company_name', testCompany)
    
    // Check report
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', scan.scanRequestId)
      .single()
    
    console.log(`\n[${new Date().toLocaleTimeString()}]`)
    console.log(`Collection: ${collection?.status || 'none'} (${collection?.evidence_count || 0} tracked)`)
    console.log(`Evidence items: ${evidenceCount}`)
    console.log(`Report: ${report ? `✅ Score: ${report.investment_score}` : '⏳ generating...'}`)
    
    if (report) {
      console.log('\n✅ SUCCESS! Full pipeline completed')
      console.log('Report ID:', report.id)
      console.log('Investment Score:', report.investment_score)
      console.log('Grade:', report.tech_health_grade)
      console.log('Evidence:', report.evidence_count)
      console.log('Citations:', report.citation_count)
      console.log('\nView at: http://localhost:3000/reports/' + report.id)
      break
    }
  }
}

testQueueComplete().catch(console.error)