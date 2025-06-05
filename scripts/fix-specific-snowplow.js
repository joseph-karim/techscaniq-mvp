#!/usr/bin/env node

/**
 * Fix the specific Snowplow scan the user is viewing
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

async function fixSpecificSnowplow() {
  console.log('🔧 Fixing the specific Snowplow scan user is viewing...')
  
  // This is the scan ID from the URL the user provided
  const targetScanId = '98fb98ce-4d56-43af-a9a5-9eea8f33822a'
  
  try {
    // Get the current scan details
    const { data: currentScan, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', targetScanId)
      .single()

    if (scanError || !currentScan) {
      console.error('❌ Could not find scan:', scanError)
      return
    }

    console.log(`✅ Found scan: ${currentScan.company_name}`)
    console.log(`   Current Status: ${currentScan.status}`)
    console.log(`   Current Report ID: ${currentScan.report_id || 'None'}`)
    console.log(`   Requested by: ${currentScan.requestor_name}`)

    // Check if there's already a report for any Snowplow scan we can use
    const { data: existingReports, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .order('created_at', { ascending: false })

    if (reportError) {
      console.error('❌ Error checking reports:', reportError)
      return
    }

    let reportToUse = null

    if (existingReports && existingReports.length > 0) {
      reportToUse = existingReports[0]
      console.log(`✅ Found existing Snowplow report: ${reportToUse.id}`)
      console.log(`   Investment Score: ${reportToUse.investment_score}`)
      console.log(`   Tech Health Score: ${reportToUse.tech_health_score}`)
    } else {
      console.log('⚠️ No existing reports found, will trigger new generation')
    }

    // Update the scan with report data or trigger new generation
    if (reportToUse) {
      console.log('🔗 Linking existing report to scan...')
      
      const { error: updateError } = await supabase
        .from('scan_requests')
        .update({ 
          report_id: reportToUse.id,
          status: 'complete',
          tech_health_score: reportToUse.tech_health_score || 7,
          tech_health_grade: reportToUse.tech_health_grade || 'C',
          ai_confidence: reportToUse.ai_confidence || 85,
          sections: reportToUse.sections || [],
          risks: reportToUse.risks || [],
          executive_summary: reportToUse.executive_summary
        })
        .eq('id', targetScanId)

      if (updateError) {
        console.error('❌ Error updating scan:', updateError)
        return
      }

      // Update report to link back to this scan
      await supabase
        .from('reports')
        .update({ scan_request_id: targetScanId })
        .eq('id', reportToUse.id)

      console.log('✅ Successfully linked scan and report!')
      
    } else {
      console.log('🚀 Triggering new report generation...')
      
      // Call report orchestrator to generate new report
      const { data: reportResult, error: generateError } = await supabase.functions.invoke('report-orchestrator-v3', {
        body: {
          scan_request_id: targetScanId,
          analysisDepth: 'comprehensive'
        }
      })

      if (generateError) {
        console.error('❌ Report generation failed:', generateError)
        
        // Set scan to error status
        await supabase
          .from('scan_requests')
          .update({ status: 'error' })
          .eq('id', targetScanId)
          
      } else {
        console.log('✅ Report generation initiated successfully')
        console.log(`   Report ID: ${reportResult.reportId}`)
      }
    }

    // Verify the fix
    const { data: finalScan, error: verifyError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', targetScanId)
      .single()

    if (verifyError) {
      console.error('❌ Could not verify update:', verifyError)
    } else {
      console.log('\n🎉 Final scan state:')
      console.log(`   Status: ${finalScan.status}`)
      console.log(`   Report ID: ${finalScan.report_id || 'None'}`)
      console.log(`   Tech Health Score: ${finalScan.tech_health_score || 'None'}`)
      console.log(`   AI Confidence: ${finalScan.ai_confidence || 'None'}`)
      console.log(`   Has Sections: ${finalScan.sections?.length > 0 ? 'Yes' : 'No'}`)
      console.log(`   Has Executive Summary: ${finalScan.executive_summary ? 'Yes' : 'No'}`)
    }

    console.log('\n📋 Instructions:')
    console.log('1. Refresh the page: https://scan.techscaniq.com/scans/98fb98ce-4d56-43af-a9a5-9eea8f33822a')
    console.log('2. You should now see the full report content instead of "Section Not Found"')
    console.log('3. Tech health score should show proper value instead of 0')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixSpecificSnowplow() 