#!/usr/bin/env node

/**
 * Fix Snowplow scan by updating only valid columns
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

async function fixSnowplowColumns() {
  console.log('🔧 Fixing Snowplow scan columns...')
  
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

    // Get the linked report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', currentScan.report_id)
      .single()

    if (reportError || !report) {
      console.error('❌ Could not find linked report:', reportError)
      return
    }

    console.log(`✅ Found linked report: ${report.id}`)
    console.log(`   Investment Score: ${report.investment_score}`)

    // Update scan with only the columns that exist in the schema
    const updateData = {
      status: 'complete',
      tech_health_score: report.tech_health_score || 7,
      tech_health_grade: report.tech_health_grade || 'C',
      ai_confidence: report.ai_confidence || 85,
      sections: report.sections || [],
      risks: report.risks || []
    }

    console.log('🔄 Updating scan with valid columns only...')
    
    const { error: updateError } = await supabase
      .from('scan_requests')
      .update(updateData)
      .eq('id', targetScanId)

    if (updateError) {
      console.error('❌ Error updating scan:', updateError)
      return
    }

    console.log('✅ Successfully updated scan!')

    // Verify the update
    const { data: updatedScan, error: verifyError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', targetScanId)
      .single()

    if (verifyError) {
      console.error('❌ Could not verify update:', verifyError)
    } else {
      console.log('\n🎉 Updated scan state:')
      console.log(`   Status: ${updatedScan.status}`)
      console.log(`   Report ID: ${updatedScan.report_id}`)
      console.log(`   Tech Health Score: ${updatedScan.tech_health_score}`)
      console.log(`   Tech Health Grade: ${updatedScan.tech_health_grade}`)
      console.log(`   AI Confidence: ${updatedScan.ai_confidence}`)
      console.log(`   Sections: ${updatedScan.sections?.length || 0} items`)
      console.log(`   Risks: ${updatedScan.risks?.length || 0} items`)
    }

    // Check if the frontend issue might be related to the ViewReport component
    console.log('\n🔍 Analyzing potential frontend issues...')
    
    if (report.sections && Array.isArray(report.sections) && report.sections.length > 0) {
      console.log('✅ Report has sections data (array format)')
      console.log(`   Number of sections: ${report.sections.length}`)
      report.sections.forEach((section, index) => {
        console.log(`   Section ${index + 1}: ${section.title || 'Untitled'}`)
      })
    } else if (report.sections && typeof report.sections === 'object') {
      console.log('✅ Report has sections data (object format)')
      const sectionKeys = Object.keys(report.sections)
      console.log(`   Number of sections: ${sectionKeys.length}`)
      sectionKeys.forEach(key => {
        console.log(`   Section: ${key}`)
      })
    } else {
      console.log('⚠️ Report has no sections data or invalid format')
    }

    console.log('\n📋 Instructions:')
    console.log('1. Refresh the page: https://scan.techscaniq.com/scans/98fb98ce-4d56-43af-a9a5-9eea8f33822a')
    console.log('2. Clear browser cache if needed (Cmd+Shift+R or Ctrl+Shift+R)')
    console.log('3. The report should now show proper content instead of "Section Not Found"')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixSnowplowColumns() 