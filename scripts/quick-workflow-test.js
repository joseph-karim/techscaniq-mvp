#!/usr/bin/env node

/**
 * Quick test of the scan workflow fix
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function quickTest() {
  console.log('🚀 Quick workflow test...')
  
  // Create scan request
  const { data: scan, error } = await supabase
    .from('scan_requests')
    .insert({
      company_name: 'QuickTest Co',
      website_url: 'https://example.com',
      requestor_name: 'Test User',
      organization_name: 'Test Org',
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Failed to create scan:', error)
    return
  }

  console.log(`✅ Created scan: ${scan.id}`)

  // Test report generation call
  console.log('🔄 Testing report generation...')
  
  const { data: reportResult, error: reportError } = await supabase.functions.invoke('report-orchestrator-v3', {
    body: {
      scan_request_id: scan.id,
      analysisDepth: 'shallow'
    }
  })

  if (reportError) {
    console.log(`⚠️ Report generation error: ${reportError.message}`)
  } else {
    console.log('✅ Report generation call successful')
    console.log(`   Report ID: ${reportResult?.reportId || 'N/A'}`)
  }

  // Clean up
  await supabase.from('scan_requests').delete().eq('id', scan.id)
  console.log('✅ Test complete (cleaned up)')
}

quickTest().catch(console.error) 