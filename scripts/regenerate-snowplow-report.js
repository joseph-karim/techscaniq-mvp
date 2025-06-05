#!/usr/bin/env node

/**
 * Regenerate Snowplow report with proper content
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

async function regenerateSnowplowReport() {
  console.log('🔄 Regenerating Snowplow report with proper content...')
  
  const scanId = '98fb98ce-4d56-43af-a9a5-9eea8f33822a'
  
  try {
    // Step 1: Update scan status to processing
    console.log('1️⃣ Setting scan to processing status...')
    
    const { error: statusError } = await supabase
      .from('scan_requests')
      .update({ 
        status: 'processing',
        ai_workflow_status: 'generating_report',
        report_generation_progress: 0
      })
      .eq('id', scanId)

    if (statusError) {
      console.error('❌ Error updating scan status:', statusError)
      return
    }

    console.log('✅ Scan status updated to processing')

    // Step 2: Call report-orchestrator-v3 to regenerate
    console.log('2️⃣ Triggering report regeneration...')
    
    const { data: reportResult, error: generateError } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        scan_request_id: scanId,
        analysisDepth: 'comprehensive',
        forceRegenerate: true // Force regeneration even if report exists
      }
    })

    if (generateError) {
      console.error('❌ Report generation failed:', generateError)
      
      // Set scan to error status
      await supabase
        .from('scan_requests')
        .update({ 
          status: 'error',
          ai_workflow_status: 'failed'
        })
        .eq('id', scanId)
        
      return
    }

    console.log('✅ Report generation initiated successfully')
    console.log(`   New Report ID: ${reportResult.reportId}`)

    // Step 3: Wait a moment and check the result
    console.log('3️⃣ Waiting for report generation to complete...')
    
    // Wait for 30 seconds to let the generation complete
    await new Promise(resolve => setTimeout(resolve, 30000))
    
    // Check the updated scan
    const { data: updatedScan, error: scanCheckError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', scanId)
      .single()

    if (scanCheckError) {
      console.error('❌ Error checking updated scan:', scanCheckError)
    } else {
      console.log('\n🎉 Updated scan status:')
      console.log(`   Status: ${updatedScan.status}`)
      console.log(`   AI Workflow Status: ${updatedScan.ai_workflow_status}`)
      console.log(`   Report ID: ${updatedScan.report_id}`)
      console.log(`   Report Generation Progress: ${updatedScan.report_generation_progress}%`)
    }

    // Check the new report content
    if (updatedScan.report_id) {
      const { data: newReport, error: reportCheckError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', updatedScan.report_id)
        .single()

      if (reportCheckError) {
        console.error('❌ Error checking new report:', reportCheckError)
      } else {
        console.log('\n📋 New report content:')
        console.log(`   Investment Score: ${newReport.investment_score}`)
        console.log(`   Tech Health Score: ${newReport.tech_health_score}`)
        console.log(`   Executive Summary Length: ${newReport.executive_summary?.length || 0} chars`)
        
        if (newReport.report_data?.sections) {
          const sections = newReport.report_data.sections
          if (typeof sections === 'object') {
            const sectionKeys = Object.keys(sections)
            console.log(`   Sections: ${sectionKeys.length} sections`)
            
            sectionKeys.forEach(key => {
              const section = sections[key]
              console.log(`     ${key}: ${section.findings?.length || 0} findings, ${section.summary?.length || 0} char summary`)
            })
          }
        }
      }
    }

    console.log('\n📋 Instructions:')
    console.log('1. Wait 1-2 minutes for generation to fully complete')
    console.log('2. Refresh the page: https://scan.techscaniq.com/scans/98fb98ce-4d56-43af-a9a5-9eea8f33822a')
    console.log('3. You should now see detailed report sections with actual content')
    console.log('4. If still processing, check back in a few minutes')

  } catch (error) {
    console.error('❌ Error:', error)
    
    // Reset scan status on error
    await supabase
      .from('scan_requests')
      .update({ 
        status: 'error',
        ai_workflow_status: 'failed'
      })
      .eq('id', scanId)
  }
}

regenerateSnowplowReport() 