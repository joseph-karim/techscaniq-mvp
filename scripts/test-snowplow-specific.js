#!/usr/bin/env node

/**
 * Test the edge function with the specific Snowplow scan ID
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSnowplowScan() {
  console.log('🧪 Testing with actual Snowplow scan ID...')

  try {
    // First, get the Snowplow scan details
    const { data: scan, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', '2436895f-727d-4a17-acc6-ef09a1de628a')
      .single()

    if (scanError || !scan) {
      console.error('❌ Could not find scan:', scanError)
      return
    }

    console.log('✅ Found scan:', scan.company_name)
    console.log('   Status:', scan.status)
    console.log('   Website:', scan.website_url)

    // Test the function with scan_request_id
    const { data, error } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        scan_request_id: scan.id,
        // The function should get company info from the scan_request
        analysisDepth: 'shallow'
      }
    })

    if (error) {
      console.error('❌ Edge function error with scan_request_id:')
      console.error('  Status:', error.context?.status)
      
      try {
        const responseText = await error.context?.text()
        console.error('  Response Body:', responseText)
      } catch (e) {
        console.error('  Could not read response body')
      }
      
      console.error('  Full error:', error)
    } else {
      console.log('✅ Edge function succeeded with scan_request_id!')
      console.log('  Report ID:', data.reportId)
      console.log('  Investment Score:', data.investmentScore)
      
      // Check if the scan was updated
      const { data: updatedScan } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('id', scan.id)
        .single()
      
      console.log('   Updated scan status:', updatedScan?.status)
      console.log('   Report ID linked:', updatedScan?.report_id || 'None')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Also check if there are any reports generated but not linked
async function checkUnlinkedReports() {
  console.log('\n🔍 Checking for unlinked reports...')
  
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
    } else {
      console.log(`Found ${reports?.length || 0} reports for Snowplow`)
      reports?.forEach(report => {
        console.log(`  - Report ID: ${report.id}`)
        console.log(`    Scan Request ID: ${report.scan_request_id || 'None'}`)
        console.log(`    Created: ${report.created_at}`)
        console.log(`    Investment Score: ${report.investment_score}`)
      })
    }
  } catch (error) {
    console.error('Error checking reports:', error)
  }
}

async function main() {
  await testSnowplowScan()
  await checkUnlinkedReports()
}

main()