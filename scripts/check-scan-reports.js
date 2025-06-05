#!/usr/bin/env node

/**
 * Check scan_reports table for the missing Snowplow report
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkScanReports() {
  console.log('🔍 Checking scan_reports table...')

  try {
    // Check scan_reports table
    const { data: scanReports, error: scanReportsError } = await supabase
      .from('scan_reports')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .order('created_at', { ascending: false })

    if (scanReportsError) {
      console.error('❌ Error fetching scan reports:', scanReportsError)
    } else {
      console.log(`✅ Found ${scanReports?.length || 0} scan reports for Snowplow`)
      scanReports?.forEach(report => {
        console.log(`  - Report ID: ${report.id}`)
        console.log(`    Company: ${report.company_name}`)
        console.log(`    Report Type: ${report.report_type}`)
        console.log(`    Created: ${report.created_at}`)
        console.log(`    User ID: ${report.user_id || 'None'}`)
      })
    }

    // Check reports table as well (just to be sure)
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .order('created_at', { ascending: false })

    if (reportsError) {
      console.error('❌ Error fetching reports:', reportsError)
    } else {
      console.log(`✅ Found ${reports?.length || 0} reports in reports table for Snowplow`)
      reports?.forEach(report => {
        console.log(`  - Report ID: ${report.id}`)
        console.log(`    Scan Request ID: ${report.scan_request_id || 'None'}`)
        console.log(`    Investment Score: ${report.investment_score}`)
        console.log(`    Created: ${report.created_at}`)
      })
    }

    // Check the current scan request status
    const { data: scan, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', '2436895f-727d-4a17-acc6-ef09a1de628a')
      .single()

    if (scanError) {
      console.error('❌ Error fetching scan:', scanError)
    } else {
      console.log('\n📋 Current Snowplow scan status:')
      console.log(`   ID: ${scan.id}`)
      console.log(`   Status: ${scan.status}`)
      console.log(`   Report ID: ${scan.report_id || 'None'}`)
      console.log(`   Executive Report ID: ${scan.executive_report_id || 'None'}`)
      console.log(`   Tech Health Score: ${scan.tech_health_score || 'None'}`)
      console.log(`   AI Confidence: ${scan.ai_confidence || 'None'}`)
      console.log(`   Has Executive Report Data: ${scan.executive_report_data ? 'Yes' : 'No'}`)
      console.log(`   Has Sections: ${scan.sections ? 'Yes' : 'No'}`)
      console.log(`   Has Risks: ${scan.risks ? 'Yes' : 'No'}`)
    }

    // If we found reports, let's try to link them
    if (reports && reports.length > 0 && scan) {
      console.log('\n🔗 Attempting to link the latest report to scan...')
      
      const latestReport = reports[0]
      const { error: updateError } = await supabase
        .from('scan_requests')
        .update({ 
          report_id: latestReport.id,
          status: 'awaiting_review'  // Set to awaiting review
        })
        .eq('id', scan.id)

      if (updateError) {
        console.error('❌ Error linking report:', updateError)
      } else {
        console.log('✅ Successfully linked report to scan')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkScanReports()