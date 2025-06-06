#!/usr/bin/env node

/**
 * Test Complete Pipeline End-to-End
 * This script validates the entire flow from scan request to evidence display
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.log('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCompletePipeline() {
  console.log('🧪 Testing Complete Pipeline End-to-End\n')
  
  const testCompany = {
    name: 'Stripe',
    domain: 'stripe.com',
    investment_thesis: 'digital-transformation'
  }

  try {
    // Step 1: Create scan request
    console.log('1️⃣ Creating scan request...')
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: testCompany.name,
        company_domain: testCompany.domain,
        investment_thesis: testCompany.investment_thesis,
        status: 'pending',
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (scanError) {
      console.error('❌ Failed to create scan request:', scanError)
      return
    }

    console.log(`✅ Created scan request: ${scanRequest.id}`)

    // Step 2: Trigger evidence collection (using v8 for comprehensive collection)
    console.log('\n2️⃣ Triggering evidence collection...')
    const { data: orchestratorResult, error: orchestratorError } = await supabase.functions.invoke(
      'report-orchestrator-v5', 
      {
        body: {
          scan_request_id: scanRequest.id,
          analysisDepth: 'comprehensive'
        }
      }
    )

    if (orchestratorError) {
      console.error('❌ Orchestrator error:', orchestratorError)
      
      // Fallback to simpler orchestrator
      console.log('   Trying fallback orchestrator v3...')
      const { data: v3Result, error: v3Error } = await supabase.functions.invoke(
        'report-orchestrator-v3',
        {
          body: {
            scan_request_id: scanRequest.id,
            analysisDepth: 'shallow'
          }
        }
      )
      
      if (v3Error) {
        console.error('❌ Fallback also failed:', v3Error)
        return
      }
      
      console.log('✅ Fallback orchestrator completed')
    } else {
      console.log('✅ Evidence collection completed')
      console.log(`   Evidence collected: ${orchestratorResult?.evidence?.length || 0} items`)
      console.log(`   Pipeline summary:`, orchestratorResult?.summary)
    }

    // Step 3: Check evidence storage
    console.log('\n3️⃣ Checking evidence storage...')
    
    // Check evidence collection
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('scan_request_id', scanRequest.id)
      .single()

    if (collection) {
      console.log(`✅ Evidence collection created: ${collection.id}`)
      console.log(`   Evidence count: ${collection.evidence_count}`)
      
      // Check evidence items
      const { data: evidenceItems } = await supabase
        .from('evidence_items')
        .select('id, type, category, summary')
        .eq('collection_id', collection.id)
        .limit(5)

      console.log(`   Sample evidence items:`)
      evidenceItems?.forEach(item => {
        console.log(`     - ${item.type}: ${item.summary?.substring(0, 50)}...`)
      })
    } else {
      console.error('❌ No evidence collection found')
    }

    // Step 4: Check report generation
    console.log('\n4️⃣ Checking report generation...')
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', scanRequest.id)
      .single()

    if (report) {
      console.log(`✅ Report generated: ${report.id}`)
      console.log(`   Evidence collection ID: ${report.evidence_collection_id}`)
      console.log(`   Evidence count: ${report.evidence_count}`)
      console.log(`   Status: ${report.status}`)
      
      // Check if report has content
      if (report.report_data) {
        const sections = Object.keys(report.report_data)
        console.log(`   Report sections: ${sections.join(', ')}`)
      }
    } else {
      console.error('❌ No report found')
    }

    // Step 5: Check citations
    console.log('\n5️⃣ Checking citations...')
    if (report) {
      const { data: citations } = await supabase
        .from('report_citations')
        .select(`
          *,
          evidence_item:evidence_items(*)
        `)
        .eq('report_id', report.id)
        .limit(5)

      if (citations && citations.length > 0) {
        console.log(`✅ Found ${citations.length} citations`)
        citations.forEach(citation => {
          console.log(`   Citation #${citation.citation_number}: ${citation.claim_text?.substring(0, 50)}...`)
        })
      } else {
        console.log('⚠️  No citations found - this may need to be fixed')
      }
    }

    // Step 6: Test fetching via API (simulate frontend)
    console.log('\n6️⃣ Testing frontend data fetch...')
    const { data: fullReport } = await supabase
      .from('reports')
      .select(`
        *,
        evidence_collection:evidence_collections(
          *,
          evidence_items(*)
        ),
        citations:report_citations(
          *,
          evidence_item:evidence_items(*)
        )
      `)
      .eq('id', report?.id)
      .single()

    if (fullReport) {
      console.log('✅ Frontend fetch successful')
      console.log(`   Evidence items: ${fullReport.evidence_collection?.evidence_items?.length || 0}`)
      console.log(`   Citations: ${fullReport.citations?.length || 0}`)
    }

    // Step 7: Check scan request status
    console.log('\n7️⃣ Checking final scan request status...')
    const { data: finalScanRequest } = await supabase
      .from('scan_requests')
      .select('status, latest_report_id')
      .eq('id', scanRequest.id)
      .single()

    console.log(`   Status: ${finalScanRequest?.status}`)
    console.log(`   Latest report ID: ${finalScanRequest?.latest_report_id || 'Not set'}`)

    // Summary
    console.log('\n📊 Pipeline Test Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Company: ${testCompany.name} (${testCompany.domain})`)
    console.log(`Scan Request: ${scanRequest.id}`)
    console.log(`Evidence Collection: ${collection?.id || 'Missing ❌'}`)
    console.log(`Evidence Items: ${collection?.evidence_count || 0}`)
    console.log(`Report: ${report?.id || 'Missing ❌'}`)
    console.log(`Citations: ${citations?.length || 0}`)
    console.log(`Final Status: ${finalScanRequest?.status}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (report?.id) {
      console.log(`\n🔗 View report at: ${supabaseUrl.replace('.supabase.co', '')}/reports/${report.id}`)
    }

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
testCompletePipeline()