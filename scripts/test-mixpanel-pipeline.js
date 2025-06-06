#!/usr/bin/env node

/**
 * Test Enhanced Pipeline with Mixpanel - Mid-sized analytics company
 * This tests real-world performance on a company with moderate public information
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

async function testMixpanelPipeline() {
  console.log('📊 Testing Enhanced Pipeline with Mixpanel\n')
  console.log('Mid-sized company test - should demonstrate real evidence collection capabilities')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const testCompany = {
    name: 'Mixpanel',
    website_url: 'https://mixpanel.com',
    primary_criteria: 'digital-transformation',
    thesis_tags: ['analytics', 'product-analytics', 'data-infrastructure', 'saas'],
    requestor_name: 'PE Pipeline Test',
    organization_name: 'Test PE Firm',
    company_description: 'Product analytics platform that helps companies understand user behavior',
    investment_thesis_data: {
      thesisType: 'digital-transformation',
      focusAreas: ['analytics', 'data-driven-decisions', 'product-intelligence']
    }
  }

  try {
    // Step 1: Create scan request
    console.log('1️⃣ Creating scan request for Mixpanel...')
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

    // Step 2: Test enhanced evidence collector v8 directly
    console.log('\n2️⃣ Testing evidence-collector-v8 (enhanced with deep search)...')
    console.log('   Expected: Comprehensive evidence collection with decision loops')
    
    const evidenceStartTime = Date.now()
    const { data: evidenceResult, error: evidenceError } = await supabase.functions.invoke(
      'evidence-collector-v8',
      {
        body: {
          domain: 'mixpanel.com',
          company: 'Mixpanel',
          investment_thesis: 'digital-transformation',
          depth: 'comprehensive'
        }
      }
    )
    const evidenceDuration = ((Date.now() - evidenceStartTime) / 1000).toFixed(1)

    if (evidenceError) {
      console.error('❌ Evidence collection error:', evidenceError)
      console.log('\n   Falling back to v7...')
      
      // Try v7 as fallback
      const { data: v7Result, error: v7Error } = await supabase.functions.invoke(
        'evidence-collector-v7',
        {
          body: {
            companyName: 'Mixpanel',
            companyWebsite: 'https://mixpanel.com',
            depth: 'comprehensive'
          }
        }
      )
      
      if (!v7Error && v7Result) {
        console.log(`   V7 collected: ${v7Result.evidence?.length || 0} items`)
      }
    } else {
      console.log(`✅ Evidence collection completed in ${evidenceDuration}s`)
      console.log(`   Success: ${evidenceResult?.success}`)
      console.log(`   Evidence collected: ${evidenceResult?.evidence?.length || 0} items`)
      
      if (evidenceResult?.evidence?.length > 0) {
        // Analyze evidence quality
        const evidenceByType = {}
        evidenceResult.evidence.forEach(e => {
          const type = e.type || 'unknown'
          evidenceByType[type] = (evidenceByType[type] || 0) + 1
        })
        
        console.log('\n   Evidence breakdown:')
        Object.entries(evidenceByType)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .forEach(([type, count]) => {
            console.log(`     - ${type}: ${count}`)
          })
      }
      
      if (evidenceResult?.summary) {
        console.log('\n   Collection metrics:')
        console.log(`     Quality: ${evidenceResult.summary.evidence_quality || 'unknown'}`)
        if (evidenceResult.summary.coverage) {
          console.log(`     Coverage: ${evidenceResult.summary.coverage.percentage}%`)
        }
      }
    }

    // Step 3: Trigger full orchestrator v5
    console.log('\n3️⃣ Triggering report-orchestrator-v5 (enhanced pipeline)...')
    const pipelineStartTime = Date.now()
    
    const { data: orchestratorResult, error: orchestratorError } = await supabase.functions.invoke(
      'report-orchestrator-v5',
      {
        body: {
          scan_request_id: scanRequest.id,
          analysisDepth: 'comprehensive'
        }
      }
    )
    const pipelineDuration = ((Date.now() - pipelineStartTime) / 1000).toFixed(1)

    if (orchestratorError) {
      console.error('❌ Orchestrator v5 error:', orchestratorError)
      console.log('\n   Falling back to v3...')
      
      // Fallback to v3
      const { data: v3Result, error: v3Error } = await supabase.functions.invoke(
        'report-orchestrator-v3',
        {
          body: {
            scan_request_id: scanRequest.id,
            analysisDepth: 'comprehensive'
          }
        }
      )
      
      if (!v3Error) {
        console.log('   ✅ V3 orchestrator completed')
      }
    } else {
      console.log(`✅ Pipeline completed in ${pipelineDuration}s`)
      
      if (orchestratorResult?.summary) {
        console.log('\n   Pipeline execution summary:')
        console.log(`     Total evidence: ${orchestratorResult.summary.totalEvidence || 0}`)
        console.log(`     Stages completed: ${orchestratorResult.summary.completedStages || 0}`)
        console.log(`     Failed stages: ${orchestratorResult.summary.failedStages || 0}`)
        console.log(`     Overall status: ${orchestratorResult.summary.overallStatus}`)
      }
    }

    // Step 4: Analyze results for PE-grade quality
    console.log('\n4️⃣ Analyzing results for PE investment decision quality...')
    
    // Check evidence collection
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('scan_request_id', scanRequest.id)
      .single()

    let evidenceScore = 0
    if (collection) {
      console.log(`\n   Evidence Collection:`)
      console.log(`     ID: ${collection.id}`)
      console.log(`     Count: ${collection.evidence_count}`)
      
      if (collection.evidence_count >= 100) {
        evidenceScore = 3
        console.log(`     ✅ Excellent (100+ items)`)
      } else if (collection.evidence_count >= 50) {
        evidenceScore = 2
        console.log(`     ✅ Good (50+ items)`)
      } else if (collection.evidence_count >= 20) {
        evidenceScore = 1
        console.log(`     ⚠️  Marginal (20+ items)`)
      } else {
        console.log(`     ❌ Insufficient (<20 items)`)
      }
    } else {
      console.log(`   ❌ No evidence collection found`)
    }

    // Check report quality
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', scanRequest.id)
      .single()

    let reportScore = 0
    if (report) {
      console.log(`\n   Report Analysis:`)
      console.log(`     ID: ${report.id}`)
      console.log(`     Investment Score: ${report.investment_score}/100`)
      
      if (report.investment_score !== 70) {
        reportScore = 2
        console.log(`     ✅ Real analysis (not generic 70)`)
      } else {
        console.log(`     ❌ Generic fallback score`)
      }
      
      // Check report depth
      if (report.report_data) {
        const sections = Object.keys(report.report_data)
        console.log(`     Sections: ${sections.length}`)
        if (sections.length >= 8) reportScore += 1
      }
    } else {
      console.log(`   ❌ No report generated`)
    }

    // Check citations
    let citationScore = 0
    if (report) {
      const { count: citationCount } = await supabase
        .from('report_citations')
        .select('*', { count: 'exact' })
        .eq('report_id', report.id)
      
      console.log(`\n   Evidence Traceability:`)
      console.log(`     Citations: ${citationCount || 0}`)
      
      if (citationCount >= 20) {
        citationScore = 2
        console.log(`     ✅ Strong traceability`)
      } else if (citationCount >= 10) {
        citationScore = 1
        console.log(`     ⚠️  Limited traceability`)
      } else {
        console.log(`     ❌ Poor traceability`)
      }
    }

    // Final PE-grade assessment
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💼 PE INVESTMENT GRADE ASSESSMENT')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const totalScore = evidenceScore + reportScore + citationScore
    console.log(`\nScoring (out of 8):`)
    console.log(`  Evidence Collection: ${evidenceScore}/3`)
    console.log(`  Report Quality: ${reportScore}/3`)
    console.log(`  Traceability: ${citationScore}/2`)
    console.log(`  TOTAL: ${totalScore}/8`)
    
    if (totalScore >= 7) {
      console.log('\n✅ INVESTMENT GRADE: Ready for PE due diligence')
    } else if (totalScore >= 5) {
      console.log('\n⚠️  MARGINAL: Requires manual review and supplementation')
    } else {
      console.log('\n❌ NOT INVESTMENT GRADE: Insufficient for billion-dollar decisions')
    }
    
    console.log('\nKey metrics for Mixpanel:')
    console.log(`  - Evidence items: ${collection?.evidence_count || 0}`)
    console.log(`  - Investment score: ${report?.investment_score || 'N/A'}`)
    console.log(`  - Citations: ${citationCount || 0}`)
    console.log(`  - Total analysis time: ${((Date.now() - scanRequest.created_at) / 1000).toFixed(1)}s`)
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (report?.id) {
      console.log(`\n🔗 View full report: http://localhost:5173/reports/${report.id}`)
    }
    console.log(`📊 Monitor pipeline: http://localhost:5173/admin/pipeline-monitor`)

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
console.log('Starting Mixpanel pipeline test...')
console.log('Testing with a mid-sized analytics company to evaluate real-world performance.\n')

testMixpanelPipeline()