#!/usr/bin/env node

/**
 * Fix the Snowplow scan that got stuck and investigate workflow issues
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

async function fixSnowplowScan() {
  console.log('🔧 Fixing Snowplow scan workflow...')

  try {
    // 1. Get the stuck Snowplow scan
    const { data: snowplowScan, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .single()

    if (scanError || !snowplowScan) {
      console.error('❌ Could not find Snowplow scan:', scanError)
      return
    }

    console.log(`✅ Found Snowplow scan: ${snowplowScan.id}`)
    console.log(`   Status: ${snowplowScan.status}`)
    console.log(`   Created: ${snowplowScan.created_at}`)

    // 2. Check if there's a report for this scan
    const { data: existingReport, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', snowplowScan.id)
      .single()

    if (existingReport) {
      console.log(`✅ Found existing report: ${existingReport.id}`)
      
      // Update the scan request to link to the report
      const { error: updateError } = await supabase
        .from('scan_requests')
        .update({ 
          report_id: existingReport.id,
          status: 'complete'
        })
        .eq('id', snowplowScan.id)

      if (updateError) {
        console.error('❌ Error linking report:', updateError)
      } else {
        console.log('✅ Linked scan to existing report')
      }

    } else {
      console.log('🔄 No report found, triggering report generation...')
      
      // Call the report orchestrator to generate a report
      const { data: reportResult, error: generateError } = await supabase.functions.invoke('report-orchestrator-v3', {
        body: {
          scan_request_id: snowplowScan.id,
          company: {
            name: snowplowScan.company_name,
            website: snowplowScan.website_url || 'https://snowplow.io'
          },
          analysisDepth: 'deep'
        }
      })

      if (generateError) {
        console.error('❌ Error generating report:', generateError)
        
        // Update scan status to error
        await supabase
          .from('scan_requests')
          .update({ status: 'error' })
          .eq('id', snowplowScan.id)
          
      } else {
        console.log('✅ Report generation initiated successfully')
        console.log('   Report data:', JSON.stringify(reportResult, null, 2).substring(0, 500) + '...')
      }
    }

    // 3. Check for evidence collections
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('scan_request_id', snowplowScan.id)

    if (evidenceError) {
      console.error('❌ Error checking evidence:', evidenceError)
    } else if (!evidence || evidence.length === 0) {
      console.log('⚠️  No evidence collections found for this scan')
      console.log('   This explains why users cannot view collected items')
    } else {
      console.log(`✅ Found ${evidence.length} evidence collections`)
      evidence.forEach(collection => {
        console.log(`   - Collection: ${collection.id} (${collection.status})`)
      })
    }

    // 4. Check the current scan requests table structure
    console.log('\n📋 Current scan request data:')
    console.log(`   Company: ${snowplowScan.company_name}`)
    console.log(`   Website: ${snowplowScan.website_url || 'Not set'}`)
    console.log(`   Status: ${snowplowScan.status}`)
    console.log(`   Report ID: ${snowplowScan.report_id || 'None'}`)
    console.log(`   Tech Health Score: ${snowplowScan.tech_health_score || 'None'}`)
    console.log(`   AI Confidence: ${snowplowScan.ai_confidence || 'None'}`)
    console.log(`   Executive Report Data: ${snowplowScan.executive_report_data ? 'Present' : 'None'}`)

  } catch (error) {
    console.error('❌ Error fixing scan:', error)
  }
}

// Also check the useState issue in the review component
async function checkReviewComponent() {
  console.log('\n🔍 Checking review component issues...')
  
  // The React error #310 usually means useState was called with an invalid initial state
  // Let's check what data the review component might be receiving
  
  try {
    const { data: scanRequests, error } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('status', 'awaiting_review')
      .limit(3)

    if (error) {
      console.error('Error fetching review data:', error)
    } else {
      console.log(`Found ${scanRequests?.length || 0} scans awaiting review`)
      scanRequests?.forEach(scan => {
        console.log(`   - ${scan.company_name}: ${scan.status}`)
        console.log(`     Sections: ${scan.sections ? 'Present' : 'Missing'}`)
        console.log(`     Executive Report: ${scan.executive_report_data ? 'Present' : 'Missing'}`)
      })
    }
  } catch (error) {
    console.error('Error checking review component data:', error)
  }
}

async function main() {
  await fixSnowplowScan()
  await checkReviewComponent()
  console.log('\n✨ Scan investigation and fix complete!')
}

main()