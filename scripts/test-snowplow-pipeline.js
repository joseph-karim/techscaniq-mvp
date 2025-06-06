#!/usr/bin/env node

/**
 * Test Complete Pipeline for Snowplow Analytics
 * This script runs the entire evidence collection and report generation pipeline
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  console.log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSnowplowPipeline() {
  console.log('🎿 Testing Complete Pipeline for Snowplow Analytics\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const testCompany = {
    name: 'Snowplow Analytics',
    website_url: 'https://snowplow.io',
    primary_criteria: 'digital-transformation',
    thesis_tags: ['data-infrastructure', 'analytics', 'open-source'],
    requestor_name: 'Pipeline Test',
    organization_name: 'TechScanIQ Test',
    company_description: 'Customer Data Infrastructure platform for collecting and operationalizing behavioral data',
    investment_thesis_data: {
      thesisType: 'digital-transformation',
      focusAreas: ['data-infrastructure', 'analytics', 'real-time-processing']
    }
  }

  try {
    // Step 1: Create scan request
    console.log('1️⃣ Creating scan request for Snowplow...')
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: testCompany.name,
        website_url: testCompany.website_url,
        primary_criteria: testCompany.primary_criteria,
        thesis_tags: testCompany.thesis_tags,
        requestor_name: testCompany.requestor_name,
        organization_name: testCompany.organization_name,
        company_description: testCompany.company_description,
        investment_thesis_data: testCompany.investment_thesis_data,
        // requested_by is a UUID field, skip it for test
        status: 'pending',
        ai_workflow_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (scanError) {
      console.error('❌ Failed to create scan request:', scanError)
      return
    }

    console.log(`✅ Created scan request: ${scanRequest.id}`)
    console.log(`   Company: ${scanRequest.company_name}`)
    console.log(`   Website: ${scanRequest.website_url}`)
    console.log(`   Primary Criteria: ${scanRequest.primary_criteria}`)
    console.log(`   Thesis Tags: ${scanRequest.thesis_tags?.join(', ') || 'None'}`)

    // Step 2: Trigger report orchestrator (v3 is more stable for now)
    console.log('\n2️⃣ Triggering pipeline via orchestrator v3...')
    console.log('   This will collect evidence and generate a comprehensive report')
    console.log('   Expected duration: 2-5 minutes\n')
    
    const startTime = Date.now()
    
    const { data: orchestratorResult, error: orchestratorError } = await supabase.functions.invoke(
      'report-orchestrator-v3', 
      {
        body: {
          scan_request_id: scanRequest.id,
          analysisDepth: 'comprehensive'
        }
      }
    )

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    if (orchestratorError) {
      console.error('❌ Pipeline error:', orchestratorError)
      return
    } else {
      console.log(`✅ Pipeline completed in ${duration} seconds`)
      
      if (orchestratorResult) {
        console.log('\n📊 Pipeline Result:')
        console.log(`   Success: ${orchestratorResult.success}`)
        if (orchestratorResult.report) {
          console.log(`   Report ID: ${orchestratorResult.report.reportId}`)
          console.log(`   Investment Score: ${orchestratorResult.report.investmentScore}/100`)
        }
        if (orchestratorResult.evidence) {
          console.log(`   Evidence collected: ${orchestratorResult.evidence.length} items`)
        }
      }
    }

    // Step 3: Check evidence storage
    console.log('\n3️⃣ Verifying evidence storage...')
    
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('scan_request_id', scanRequest.id)
      .single()

    if (collection) {
      console.log(`✅ Evidence collection created: ${collection.id}`)
      console.log(`   Total evidence items: ${collection.evidence_count}`)
      console.log(`   Status: ${collection.status}`)
      
      // Sample evidence items
      const { data: evidenceItems } = await supabase
        .from('evidence_items')
        .select('id, type, category, summary, confidence, source')
        .eq('collection_id', collection.id)
        .order('confidence', { ascending: false })
        .limit(10)

      if (evidenceItems && evidenceItems.length > 0) {
        console.log(`\n   Top evidence items (by confidence):`)
        evidenceItems.forEach((item, i) => {
          console.log(`   ${i + 1}. [${item.type}] ${item.summary?.substring(0, 60)}...`)
          console.log(`      Confidence: ${(item.confidence * 100).toFixed(0)}% | Source: ${item.source}`)
        })
      }
    } else {
      console.log('⚠️  No evidence collection found - checking evidence items directly...')
      
      // Try to find evidence items by scan_request_id
      const { data: evidenceItems } = await supabase
        .from('evidence_items')
        .select('id, type, category, summary')
        .eq('scan_request_id', scanRequest.id)
        .limit(5)
      
      if (evidenceItems && evidenceItems.length > 0) {
        console.log(`   Found ${evidenceItems.length} evidence items linked to scan request`)
      }
    }

    // Step 4: Check report generation
    console.log('\n4️⃣ Checking report generation...')
    const { data: reports } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', scanRequest.id)
      .order('created_at', { ascending: false })

    if (reports && reports.length > 0) {
      const report = reports[0]
      console.log(`✅ Report generated: ${report.id}`)
      console.log(`   Company: ${report.company_name}`)
      console.log(`   Evidence collection ID: ${report.evidence_collection_id || 'Not linked ❌'}`)
      console.log(`   Evidence count: ${report.evidence_count || 0}`)
      console.log(`   Status: ${report.status}`)
      
      // Check report sections
      if (report.report_data) {
        const sections = Object.keys(report.report_data)
        console.log(`   Report sections: ${sections.length}`)
        console.log(`   - ${sections.slice(0, 5).join('\n   - ')}`)
        if (sections.length > 5) console.log(`   ... and ${sections.length - 5} more`)
      }
    } else {
      console.error('❌ No report found')
    }

    // Step 5: Check citations
    console.log('\n5️⃣ Verifying evidence citations...')
    if (reports && reports.length > 0) {
      const report = reports[0]
      const { data: citations, count } = await supabase
        .from('report_citations')
        .select('*', { count: 'exact' })
        .eq('report_id', report.id)
        .limit(5)

      if (citations && citations.length > 0) {
        console.log(`✅ Found ${count} total citations`)
        console.log('   Sample citations:')
        citations.forEach(citation => {
          console.log(`   - Citation #${citation.citation_number}: ${citation.claim_text?.substring(0, 50)}...`)
        })
      } else {
        console.log('⚠️  No citations found - may need manual creation')
      }
    }

    // Step 6: Final status check
    console.log('\n6️⃣ Final scan request status...')
    const { data: finalScanRequest } = await supabase
      .from('scan_requests')
      .select('status, latest_report_id, ai_confidence, tech_health_score')
      .eq('id', scanRequest.id)
      .single()

    console.log(`   Status: ${finalScanRequest?.status}`)
    console.log(`   Latest report ID: ${finalScanRequest?.latest_report_id || 'Not set'}`)
    if (finalScanRequest?.ai_confidence) {
      console.log(`   AI Confidence: ${finalScanRequest.ai_confidence}%`)
    }
    if (finalScanRequest?.tech_health_score) {
      console.log(`   Tech Health Score: ${finalScanRequest.tech_health_score}/100`)
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 SNOWPLOW PIPELINE TEST SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Company: ${testCompany.name} (${testCompany.website_url})`)
    console.log(`Scan Request: ${scanRequest.id}`)
    console.log(`Evidence Collection: ${collection?.id || 'Check evidence items directly'}`)
    console.log(`Evidence Items: ${collection?.evidence_count || 'Unknown'}`)
    console.log(`Report: ${reports?.[0]?.id || 'Missing ❌'}`)
    console.log(`Total Duration: ${duration}s`)
    console.log(`Final Status: ${finalScanRequest?.status}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (reports?.[0]?.id) {
      const baseUrl = supabaseUrl.replace('.supabase.co', '').replace('https://', '')
      console.log(`\n🔗 View the report at:`)
      console.log(`   Local: http://localhost:5173/reports/${reports[0].id}`)
      console.log(`   Production: https://${baseUrl}.netlify.app/reports/${reports[0].id}`)
    }

    console.log(`\n🔍 Monitor pipeline execution:`)
    console.log(`   http://localhost:5173/admin/pipeline-monitor`)

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
console.log('Starting Snowplow pipeline test...')
console.log('This will run the complete evidence collection and report generation pipeline.')
console.log('Expected duration: 2-5 minutes\n')

testSnowplowPipeline()