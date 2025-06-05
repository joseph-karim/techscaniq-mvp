#!/usr/bin/env node

/**
 * Complete workflow review and fix scan-to-report linking
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function reviewCompleteWorkflow() {
  console.log('🔍 Complete Workflow Review\n')

  try {
    // 1. Check current scan requests and their status
    console.log('📋 Current Scan Requests:')
    const { data: scans, error: scansError } = await supabase
      .from('scan_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (scansError) {
      console.error('❌ Error fetching scans:', scansError)
    } else {
      scans?.forEach(scan => {
        console.log(`  📄 ${scan.company_name} (${scan.id})`)
        console.log(`     Status: ${scan.status}`)
        console.log(`     Report ID: ${scan.report_id || 'None'}`)
        console.log(`     Has Sections: ${scan.sections?.length > 0 ? 'Yes' : 'No'}`)
        console.log(`     Has Risks: ${scan.risks?.length > 0 ? 'Yes' : 'No'}`)
        console.log(`     Tech Health Score: ${scan.tech_health_score || 'None'}`)
        console.log(`     Created: ${scan.created_at}`)
        console.log('     ---')
      })
    }

    // 2. Check reports table
    console.log('\n📊 Reports Table:')
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (reportsError) {
      console.error('❌ Error fetching reports:', reportsError)
    } else {
      console.log(`Found ${reports?.length || 0} reports`)
      reports?.forEach(report => {
        console.log(`  📈 ${report.company_name} (${report.id})`)
        console.log(`     Scan Request ID: ${report.scan_request_id || 'None'}`)
        console.log(`     Investment Score: ${report.investment_score || 'None'}`)
        console.log(`     Created: ${report.created_at}`)
        console.log('     ---')
      })
    }

    // 3. Check evidence collections
    console.log('\n🔬 Evidence Collections:')
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_collections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (evidenceError) {
      console.error('❌ Error fetching evidence:', evidenceError)
    } else {
      console.log(`Found ${evidence?.length || 0} evidence collections`)
      evidence?.forEach(collection => {
        console.log(`  🔍 ${collection.company_name} (${collection.id})`)
        console.log(`     Status: ${collection.collection_status}`)
        console.log(`     Evidence Count: ${collection.evidence_count || 0}`)
        console.log(`     Created: ${collection.created_at}`)
        console.log('     ---')
      })
    }

    // 4. Test the workflow end-to-end with a new scan
    console.log('\n🧪 Testing Complete Workflow with Test Company:')
    
    // Create a test scan request
    const testScan = {
      company_name: 'Test Workflow Company',
      website_url: 'https://example.com',
      status: 'pending',
      requestor_name: 'Test User',
      organization_name: 'Test Org',
      primary_criteria: 'Test criteria',
      secondary_criteria: 'Secondary test criteria',
      company_description: 'Test company for workflow validation'
    }

    const { data: newScan, error: createError } = await supabase
      .from('scan_requests')
      .insert(testScan)
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating test scan:', createError)
    } else {
      console.log(`✅ Created test scan: ${newScan.id}`)

      // Test the report generation
      console.log('   Triggering report generation...')
      
      const { data: reportResult, error: reportError } = await supabase.functions.invoke('report-orchestrator-v3', {
        body: {
          scan_request_id: newScan.id,
          analysisDepth: 'shallow'
        }
      })

      if (reportError) {
        console.error('❌ Report generation failed:', reportError)
      } else {
        console.log('✅ Report generated successfully!')
        console.log(`   Report ID: ${reportResult.reportId}`)
        console.log(`   Investment Score: ${reportResult.investmentScore}`)

        // Check if scan was updated
        const { data: updatedScan } = await supabase
          .from('scan_requests')
          .select('*')
          .eq('id', newScan.id)
          .single()

        console.log(`   Scan Status: ${updatedScan?.status}`)
        console.log(`   Linked Report ID: ${updatedScan?.report_id || 'None'}`)

        // Check if report was created in database
        const { data: savedReport } = await supabase
          .from('reports')
          .select('*')
          .eq('scan_request_id', newScan.id)
          .single()

        if (savedReport) {
          console.log('✅ Report properly saved to database')
          console.log(`   Database Report ID: ${savedReport.id}`)
        } else {
          console.log('❌ Report not found in database')
        }

        // Clean up test data
        await supabase.from('scan_requests').delete().eq('id', newScan.id)
        if (savedReport) {
          await supabase.from('reports').delete().eq('id', savedReport.id)
        }
        console.log('   🧹 Cleaned up test data')
      }
    }

    // 5. Check for orphaned data
    console.log('\n🔗 Checking for Orphaned Data:')
    
    // Scans without reports
    const { data: scansWithoutReports } = await supabase
      .from('scan_requests')
      .select('id, company_name, status, created_at')
      .is('report_id', null)
      .in('status', ['complete', 'awaiting_review'])

    if (scansWithoutReports && scansWithoutReports.length > 0) {
      console.log(`⚠️  Found ${scansWithoutReports.length} completed scans without linked reports:`)
      scansWithoutReports.forEach(scan => {
        console.log(`   - ${scan.company_name} (${scan.id}) - ${scan.status}`)
      })
    } else {
      console.log('✅ No orphaned completed scans found')
    }

    // Reports without scan requests
    const { data: reportsWithoutScans } = await supabase
      .from('reports')
      .select('id, company_name, created_at')
      .is('scan_request_id', null)

    if (reportsWithoutScans && reportsWithoutScans.length > 0) {
      console.log(`⚠️  Found ${reportsWithoutScans.length} reports without linked scans:`)
      reportsWithoutScans.forEach(report => {
        console.log(`   - ${report.company_name} (${report.id})`)
      })
    } else {
      console.log('✅ No orphaned reports found')
    }

    console.log('\n📝 Workflow Review Summary:')
    console.log('='.repeat(50))
    console.log(`Total Scans: ${scans?.length || 0}`)
    console.log(`Total Reports: ${reports?.length || 0}`)
    console.log(`Total Evidence Collections: ${evidence?.length || 0}`)
    console.log(`Orphaned Scans: ${scansWithoutReports?.length || 0}`)
    console.log(`Orphaned Reports: ${reportsWithoutScans?.length || 0}`)

  } catch (error) {
    console.error('❌ Workflow review failed:', error)
  }
}

// Also fix the Snowplow scan specifically
async function fixSnowplowScanLinking() {
  console.log('\n🔧 Fixing Snowplow Scan Linking:')

  try {
    const snowplowId = '2436895f-727d-4a17-acc6-ef09a1de628a'
    
    // Get the scan
    const { data: scan } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', snowplowId)
      .single()

    if (!scan) {
      console.log('❌ Snowplow scan not found')
      return
    }

    console.log(`✅ Found Snowplow scan: ${scan.status}`)

    // Check if there's a report for this scan
    const { data: existingReport } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', snowplowId)
      .single()

    if (existingReport) {
      console.log(`✅ Found existing report: ${existingReport.id}`)
      
      // Update scan to link to report
      const { error: updateError } = await supabase
        .from('scan_requests')
        .update({ 
          report_id: existingReport.id,
          status: 'complete'
        })
        .eq('id', snowplowId)

      if (updateError) {
        console.error('❌ Error linking report:', updateError)
      } else {
        console.log('✅ Successfully linked scan to report')
      }
    } else {
      console.log('⚠️  No report found, keeping current status for review access')
    }

  } catch (error) {
    console.error('❌ Error fixing Snowplow scan:', error)
  }
}

async function main() {
  await reviewCompleteWorkflow()
  await fixSnowplowScanLinking()
  
  console.log('\n🎉 Workflow review complete!')
  console.log('\nNext steps:')
  console.log('1. Test the scan workflow on scan.techscaniq.com')
  console.log('2. Verify report generation works end-to-end')
  console.log('3. Check that view report buttons show correct data')
  console.log('4. Confirm evidence collection is working')
}

main()