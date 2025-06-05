#!/usr/bin/env node

/**
 * Link the existing Snowplow report to the scan request
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

async function linkSnowplowReport() {
  console.log('🔗 Linking Snowplow report to scan...')

  try {
    // Get the scan that's in review (this is likely the one the user is viewing)
    const { data: scanInReview, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', '2436895f-727d-4a17-acc6-ef09a1de628a')
      .single()

    if (scanError || !scanInReview) {
      console.error('❌ Could not find the scan in review:', scanError)
      return
    }

    console.log(`✅ Found scan: ${scanInReview.company_name} (Status: ${scanInReview.status})`)

    // Get the existing Snowplow report
    const { data: existingReport, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .single()

    if (reportError || !existingReport) {
      console.error('❌ Could not find Snowplow report:', reportError)
      return
    }

    console.log(`✅ Found report: ${existingReport.id} (Investment Score: ${existingReport.investment_score})`)

    // Link the report to the scan
    const { error: updateScanError } = await supabase
      .from('scan_requests')
      .update({ 
        report_id: existingReport.id,
        status: 'complete',
        tech_health_score: existingReport.tech_health_score || 0,
        tech_health_grade: existingReport.tech_health_grade || 'N/A',
        ai_confidence: existingReport.ai_confidence || 0
      })
      .eq('id', scanInReview.id)

    if (updateScanError) {
      console.error('❌ Error linking report to scan:', updateScanError)
      return
    }

    // Update the report to link back to the scan
    const { error: updateReportError } = await supabase
      .from('reports')
      .update({ 
        scan_request_id: scanInReview.id 
      })
      .eq('id', existingReport.id)

    if (updateReportError) {
      console.error('❌ Error linking scan to report:', updateReportError)
      return
    }

    console.log('✅ Successfully linked scan and report!')
    console.log(`   Scan ID: ${scanInReview.id}`)
    console.log(`   Report ID: ${existingReport.id}`)
    console.log(`   Investment Score: ${existingReport.investment_score}`)
    console.log(`   Status: complete`)

    // Check if we have executive summary or sections that need to be copied
    if (existingReport.executive_summary) {
      console.log('\n📋 Found rich report content:')
      console.log(`   Executive Summary: ${existingReport.executive_summary.substring(0, 100)}...`)
      
      // Copy key data to the scan request for easy access
      const { error: enrichError } = await supabase
        .from('scan_requests')
        .update({
          sections: existingReport.sections || [],
          risks: existingReport.risks || [],
          executive_summary: existingReport.executive_summary
        })
        .eq('id', scanInReview.id)

      if (enrichError) {
        console.error('❌ Error enriching scan data:', enrichError)
      } else {
        console.log('✅ Enriched scan with report data')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

linkSnowplowReport() 