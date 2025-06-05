#!/usr/bin/env node

/**
 * Test the fixed scan workflow end-to-end
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

async function testScanWorkflow() {
  console.log('🧪 Testing the fixed scan workflow...')
  
  try {
    // Step 1: Create a scan request (like the UI would)
    console.log('\n1️⃣ Creating scan request...')
    
    const testScanData = {
      company_name: 'Test Workflow Company',
      website_url: 'https://example.com',
      company_description: 'Test company for workflow validation',
      thesis_tags: ['cloud-native', 'scalable-architecture'],
      primary_criteria: 'Test primary criteria for validation',
      secondary_criteria: 'Test secondary criteria',
      requested_by: null, // Anonymous for testing
      requestor_name: 'Test User',
      organization_name: 'Test Organization',
      status: 'pending',
      sections: [],
      risks: [],
      investment_thesis_data: {
        thesisType: 'accelerate-organic-growth',
        criteria: [
          { id: 'criterion-0', name: 'Test Criterion', weight: 50, description: 'Test description' }
        ],
        focusAreas: ['cloud-native'],
        timeHorizon: '3-5 years',
        targetMultiple: '5-10x',
        notes: 'Test workflow validation',
        submitted_at: new Date().toISOString()
      }
    }

    const { data: scanRequest, error: dbError } = await supabase
      .from('scan_requests')
      .insert(testScanData)
      .select()
      .single()

    if (dbError) {
      throw new Error(`Failed to create scan request: ${dbError.message}`)
    }

    console.log(`✅ Scan request created: ${scanRequest.id}`)
    console.log(`   Company: ${scanRequest.company_name}`)
    console.log(`   Status: ${scanRequest.status}`)

    // Step 2: Trigger report generation (like the fixed UI would)
    console.log('\n2️⃣ Triggering report generation...')
    
    const { data: reportResult, error: reportError } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        scan_request_id: scanRequest.id,
        analysisDepth: 'shallow' // Use shallow for faster testing
      }
    })

    if (reportError) {
      console.error('⚠️ Report generation failed:', reportError)
      // Don't throw - this is expected behavior in some cases
    } else {
      console.log('✅ Report generation initiated successfully')
      console.log(`   Report ID: ${reportResult.reportId || 'N/A'}`)
      console.log(`   Investment Score: ${reportResult.investmentScore || 'N/A'}`)
    }

    // Step 3: Check scan status after a short delay
    console.log('\n3️⃣ Checking scan status after report generation...')
    
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    
    const { data: updatedScan, error: fetchError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', scanRequest.id)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch updated scan: ${fetchError.message}`)
    }

    console.log(`✅ Updated scan status: ${updatedScan.status}`)
    console.log(`   Report ID: ${updatedScan.report_id || 'None'}`)
    console.log(`   Tech Health Score: ${updatedScan.tech_health_score || 'None'}`)
    console.log(`   AI Confidence: ${updatedScan.ai_confidence || 'None'}`)
    console.log(`   Has Sections: ${updatedScan.sections?.length > 0 ? 'Yes' : 'No'}`)
    console.log(`   Has Risks: ${updatedScan.risks?.length > 0 ? 'Yes' : 'No'}`)

    // Step 4: Check if a report was created in the database
    console.log('\n4️⃣ Checking for created report...')
    
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', scanRequest.id)

    if (reportsError) {
      console.error('⚠️ Error checking reports:', reportsError)
    } else if (reports && reports.length > 0) {
      const report = reports[0]
      console.log('✅ Report found in database:')
      console.log(`   Report ID: ${report.id}`)
      console.log(`   Investment Score: ${report.investment_score || 'N/A'}`)
      console.log(`   Tech Health Score: ${report.tech_health_score || 'N/A'}`)
      console.log(`   Has Executive Summary: ${report.executive_summary ? 'Yes' : 'No'}`)
      console.log(`   Created: ${report.created_at}`)
    } else {
      console.log('⚠️ No report found in database yet (may still be processing)')
    }

    // Step 5: Test Results Summary
    console.log('\n📊 Test Results Summary:')
    console.log('='.repeat(50))
    
    let testsPassed = 0
    let totalTests = 0
    
    // Test 1: Scan was created
    totalTests++
    if (scanRequest.id) {
      console.log('✅ Test 1: Scan request creation - PASSED')
      testsPassed++
    } else {
      console.log('❌ Test 1: Scan request creation - FAILED')
    }
    
    // Test 2: Report generation was triggered
    totalTests++
    if (!reportError) {
      console.log('✅ Test 2: Report generation trigger - PASSED')
      testsPassed++
    } else {
      console.log('❌ Test 2: Report generation trigger - FAILED')
    }
    
    // Test 3: Scan status changed from pending
    totalTests++
    if (updatedScan.status !== 'pending') {
      console.log('✅ Test 3: Scan status progression - PASSED')
      testsPassed++
    } else {
      console.log('❌ Test 3: Scan status progression - FAILED (still pending)')
    }
    
    // Test 4: Report linking
    totalTests++
    if (updatedScan.report_id || (reports && reports.length > 0)) {
      console.log('✅ Test 4: Report linking - PASSED')
      testsPassed++
    } else {
      console.log('❌ Test 4: Report linking - FAILED')
    }

    console.log('\n🎯 Overall Result:')
    console.log(`   Tests Passed: ${testsPassed}/${totalTests}`)
    
    if (testsPassed === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Workflow fix is working correctly!')
    } else if (testsPassed >= totalTests - 1) {
      console.log('⚠️ MOSTLY WORKING - Minor issues but core workflow is fixed')
    } else {
      console.log('❌ WORKFLOW ISSUES - Fix may not be working properly')
    }

    // Step 6: Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    
    if (reports && reports.length > 0) {
      await supabase.from('reports').delete().eq('id', reports[0].id)
      console.log('   Deleted test report')
    }
    
    await supabase.from('scan_requests').delete().eq('id', scanRequest.id)
    console.log('   Deleted test scan request')
    console.log('✅ Cleanup complete')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testScanWorkflow() 