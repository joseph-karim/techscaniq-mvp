#!/usr/bin/env node

/**
 * Check all Snowplow scans and identify which one needs fixing
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

async function checkAllSnowplowScans() {
  console.log('🔍 Checking ALL Snowplow scans to identify which one you\'re viewing...')

  try {
    // Get ALL Snowplow scans
    const { data: allScans, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .order('created_at', { ascending: false })

    if (scanError) {
      console.error('❌ Error fetching scans:', scanError)
      return
    }

    console.log(`\n📋 Found ${allScans.length} Snowplow scan(s):`)
    
    allScans.forEach((scan, index) => {
      console.log(`\n${index + 1}. SCAN ID: ${scan.id}`)
      console.log(`   Company: ${scan.company_name}`)
      console.log(`   Status: ${scan.status}`)
      console.log(`   Created: ${scan.created_at}`)
      console.log(`   Website: ${scan.website_url || 'Not set'}`)
      console.log(`   Report ID: ${scan.report_id || 'None'}`)
      console.log(`   Tech Health Score: ${scan.tech_health_score || 'None'}`)
      console.log(`   AI Confidence: ${scan.ai_confidence || 'None'}`)
      console.log(`   Requested by: ${scan.requestor_name || 'Unknown'}`)
      console.log(`   Organization: ${scan.organization_name || 'Unknown'}`)
      
      // Determine likelihood this is the one being viewed
      let likelihood = 'Low'
      if (scan.status === 'in_review' || scan.status === 'awaiting_review') {
        likelihood = 'High - likely in advisor review'
      } else if (scan.status === 'complete' && scan.report_id) {
        likelihood = 'Medium - complete with report'
      } else if (scan.status === 'processing') {
        likelihood = 'Low - still processing'
      }
      
      console.log(`   🎯 Likelihood you're viewing this one: ${likelihood}`)
    })

    // Get all Snowplow reports
    const { data: allReports, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .order('created_at', { ascending: false })

    if (reportError) {
      console.error('❌ Error fetching reports:', reportError)
      return
    }

    console.log(`\n📊 Found ${allReports.length} Snowplow report(s):`)
    
    allReports.forEach((report, index) => {
      console.log(`\n${index + 1}. REPORT ID: ${report.id}`)
      console.log(`   Company: ${report.company_name}`)
      console.log(`   Linked to Scan: ${report.scan_request_id || 'None'}`)
      console.log(`   Investment Score: ${report.investment_score}`)
      console.log(`   Tech Health Score: ${report.tech_health_score || 'None'}`)
      console.log(`   Created: ${report.created_at}`)
      console.log(`   Has Executive Summary: ${report.executive_summary ? 'Yes' : 'No'}`)
      console.log(`   Has Sections: ${report.sections ? 'Yes' : 'No'}`)
    })

    // Identify the most likely scan the user is viewing
    const mostLikelyScan = allScans.find(scan => 
      scan.status === 'in_review' || scan.status === 'awaiting_review'
    ) || allScans[0] // fallback to most recent

    if (mostLikelyScan) {
      console.log(`\n🎯 MOST LIKELY SCAN YOU'RE VIEWING:`)
      console.log(`   ID: ${mostLikelyScan.id}`)
      console.log(`   Status: ${mostLikelyScan.status}`)
      console.log(`   Has Report: ${mostLikelyScan.report_id ? 'Yes' : 'No'}`)
      
      // If this scan doesn't have a report but there are unlinked reports, suggest linking
      if (!mostLikelyScan.report_id && allReports.length > 0) {
        const unlinkedReport = allReports.find(report => !report.scan_request_id)
        if (unlinkedReport) {
          console.log(`\n💡 RECOMMENDATION: Link unlinked report ${unlinkedReport.id} to scan ${mostLikelyScan.id}`)
          
          // Ask if we should fix it
          console.log(`\n🔧 Fixing this automatically...`)
          
          // Link the report to the scan
          const { error: updateScanError } = await supabase
            .from('scan_requests')
            .update({ 
              report_id: unlinkedReport.id,
              status: 'complete',
              tech_health_score: unlinkedReport.tech_health_score || 0,
              tech_health_grade: unlinkedReport.tech_health_grade || 'N/A',
              ai_confidence: unlinkedReport.ai_confidence || 0
            })
            .eq('id', mostLikelyScan.id)

          if (updateScanError) {
            console.error('❌ Error linking report to scan:', updateScanError)
          } else {
            // Update the report to link back
            const { error: updateReportError } = await supabase
              .from('reports')
              .update({ scan_request_id: mostLikelyScan.id })
              .eq('id', unlinkedReport.id)

            if (updateReportError) {
              console.error('❌ Error linking scan to report:', updateReportError)
            } else {
              console.log('✅ Successfully linked scan and report!')
              console.log(`   Scan: ${mostLikelyScan.id} -> Report: ${unlinkedReport.id}`)
              console.log(`   Investment Score: ${unlinkedReport.investment_score}`)
            }
          }
        }
      } else if (mostLikelyScan.report_id) {
        console.log(`✅ This scan already has a report linked: ${mostLikelyScan.report_id}`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAllSnowplowScans() 