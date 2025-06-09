#!/usr/bin/env node

/**
 * Test Mixpanel Comprehensive Scoring Pipeline
 * This script triggers the data pipeline for Mixpanel to test comprehensive scoring and identify gaps
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

async function testMixpanelScoring() {
  console.log('🚀 Testing Mixpanel Comprehensive Scoring Pipeline\n')
  
  const testCompany = {
    name: 'Mixpanel',
    domain: 'mixpanel.com',
    investment_thesis: 'Accelerate Organic Growth',
    investorProfile: {
      investmentThesisData: {
        thesisType: 'Accelerate Organic Growth',
        criteria: [
          { name: 'Scalable Technology Architecture', weight: 25, description: 'Cloud-native, API-first platform' },
          { name: 'Market Expansion Capability', weight: 20, description: 'Ability to capture new segments' },
          { name: 'Product Innovation Pipeline', weight: 20, description: 'R&D velocity and feature development' },
          { name: 'Customer Acquisition Efficiency', weight: 20, description: 'CAC/LTV metrics and growth' },
          { name: 'Competitive Differentiation', weight: 15, description: 'Unique value proposition' }
        ],
        timeHorizon: '3-5 years',
        targetMultiple: '3-5x',
        focusAreas: ['Product-led growth', 'Enterprise expansion', 'AI/ML capabilities']
      }
    }
  }

  try {
    // Step 1: Create scan request
    console.log('1️⃣ Creating scan request for Mixpanel...')
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: testCompany.name,
        company_domain: testCompany.domain,
        investment_thesis: testCompany.investment_thesis,
        investor_profile: testCompany.investorProfile,
        status: 'pending',
        ai_workflow_status: 'pending',
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (scanError) {
      console.error('❌ Failed to create scan request:', scanError)
      return
    }

    console.log(`✅ Created scan request: ${scanRequest.id}`)

    // Step 2: Trigger evidence collection with the queue system
    console.log('\n2️⃣ Triggering evidence collection via queue system...')
    
    // Import the queue library
    const { createScanJob } = await import('./src/lib/queues/scan-queue.ts')
    
    // Create job for evidence collection and report generation
    const jobResult = await createScanJob({
      scanRequestId: scanRequest.id,
      company: testCompany.name,
      domain: testCompany.domain,
      investmentThesis: testCompany.investment_thesis,
      investorProfile: testCompany.investorProfile
    })
    
    console.log(`✅ Created queue jobs:`)
    console.log(`   Evidence collection job: ${jobResult.evidenceJobId}`)
    console.log(`   Report generation job: ${jobResult.reportJobId}`)
    
    // Monitor progress
    console.log('\n3️⃣ Monitoring pipeline progress...')
    let completed = false
    let lastStatus = ''
    
    while (!completed) {
      // Check scan request status
      const { data: currentScan } = await supabase
        .from('scan_requests')
        .select('ai_workflow_status, ai_workflow_error')
        .eq('id', scanRequest.id)
        .single()
      
      if (currentScan?.ai_workflow_status !== lastStatus) {
        lastStatus = currentScan.ai_workflow_status
        console.log(`   Status: ${lastStatus}`)
      }
      
      if (currentScan?.ai_workflow_status === 'completed' || currentScan?.ai_workflow_status === 'failed') {
        completed = true
        if (currentScan.ai_workflow_error) {
          console.error(`❌ Pipeline failed: ${currentScan.ai_workflow_error}`)
        }
      }
      
      if (!completed) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      }
    }

    // Step 4: Analyze results
    console.log('\n4️⃣ Analyzing comprehensive scoring results...')
    
    // Get the report
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', scanRequest.id)
      .single()

    if (!report) {
      console.error('❌ No report generated')
      return
    }

    console.log(`✅ Report generated: ${report.id}`)
    
    // Extract comprehensive score from report
    const comprehensiveScore = report.metadata?.comprehensiveScore || report.report_data?.comprehensiveScore
    
    if (comprehensiveScore) {
      console.log('\n📊 Comprehensive Scoring Results:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`Overall Investment Score: ${Math.round(comprehensiveScore.confidenceAdjustedScore)}/100`)
      console.log(`Grade: ${comprehensiveScore.finalGrade}`)
      console.log(`Recommendation: ${comprehensiveScore.investmentRecommendation}`)
      console.log(`Overall Confidence: ${comprehensiveScore.confidenceBreakdown.overallConfidence}%`)
      
      console.log('\n📈 Dimension Scores:')
      console.log(`   Technical: ${comprehensiveScore.technicalScore}/100 (${Math.round(comprehensiveScore.technicalConfidence * 100)}% confidence)`)
      console.log(`   Business: ${comprehensiveScore.businessScore}/100 (${Math.round(comprehensiveScore.businessConfidence * 100)}% confidence)`)
      console.log(`   Market: ${comprehensiveScore.marketScore}/100 (${Math.round(comprehensiveScore.marketConfidence * 100)}% confidence)`)
      console.log(`   Team: ${comprehensiveScore.teamScore}/100 (${Math.round(comprehensiveScore.teamConfidence * 100)}% confidence)`)
      console.log(`   Financial: ${comprehensiveScore.financialScore}/100 (${Math.round(comprehensiveScore.financialConfidence * 100)}% confidence)`)
      
      console.log('\n🔍 Confidence Factors:')
      console.log(`   Evidence Quality: ${Math.round(comprehensiveScore.confidenceBreakdown.evidenceQuality * 100)}%`)
      console.log(`   Evidence Coverage: ${Math.round(comprehensiveScore.confidenceBreakdown.evidenceCoverage * 100)}%`)
      console.log(`   Penalty Applied: ${Math.round(comprehensiveScore.confidenceBreakdown.penaltyApplied * 100)}%`)
      
      if (comprehensiveScore.confidenceBreakdown.missingCriticalEvidence?.length > 0) {
        console.log('\n⚠️  Missing Critical Evidence:')
        comprehensiveScore.confidenceBreakdown.missingCriticalEvidence.forEach(item => {
          console.log(`   - ${item.replace(/_/g, ' ')}`)
        })
      }
    } else {
      console.log('⚠️  No comprehensive scoring data found in report')
    }

    // Step 5: Check evidence details
    console.log('\n5️⃣ Evidence Collection Analysis...')
    
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .contains('metadata', { scan_request_id: scanRequest.id })
      .single()

    if (collection) {
      const { data: evidenceItems } = await supabase
        .from('evidence_items')
        .select('type, category, confidence_score')
        .eq('collection_id', collection.id)
      
      console.log(`Total evidence collected: ${evidenceItems?.length || 0}`)
      
      // Group by category
      const byCategory = evidenceItems?.reduce((acc, item) => {
        const cat = item.category || 'uncategorized'
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {})
      
      console.log('\nEvidence by category:')
      Object.entries(byCategory || {}).forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`)
      })
      
      // Group by type
      const byType = evidenceItems?.reduce((acc, item) => {
        const type = item.type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
      
      console.log('\nTop evidence types collected:')
      Object.entries(byType || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([type, count]) => {
          console.log(`   ${type}: ${count}`)
        })
      
      // Average confidence
      const avgConfidence = evidenceItems?.reduce((sum, item) => 
        sum + (item.confidence_score || 0.7), 0
      ) / (evidenceItems?.length || 1)
      
      console.log(`\nAverage evidence confidence: ${Math.round(avgConfidence * 100)}%`)
    }

    // Step 6: Investment thesis alignment
    if (report.report_data?.investmentRecommendation?.thesisAlignment) {
      console.log('\n💼 Investment Thesis Alignment:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      const alignment = report.report_data.investmentRecommendation.thesisAlignment
      console.log(`Overall Alignment: ${alignment.overallAlignment}`)
      
      if (alignment.criteriaScores) {
        console.log('\nCriteria Scores:')
        alignment.criteriaScores.forEach(criterion => {
          console.log(`   ${criterion.criterion}: ${criterion.score}/100 (${criterion.weight}% weight)`)
        })
      }
    }

    // Summary
    console.log('\n📋 Pipeline Test Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Company: ${testCompany.name} (${testCompany.domain})`)
    console.log(`Investment Thesis: ${testCompany.investment_thesis}`)
    console.log(`Evidence Items: ${report.evidence_count || 0}`)
    console.log(`Citations: ${report.citation_count || 0}`)
    console.log(`Report Version: ${report.report_version}`)
    console.log(`AI Model: ${report.ai_model_used}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (report?.id) {
      console.log(`\n🔗 View full report at: ${supabaseUrl.replace('.supabase.co', '')}/reports/${report.id}`)
    }

    // Recommendations based on gaps
    if (comprehensiveScore?.confidenceBreakdown.missingCriticalEvidence?.length > 0) {
      console.log('\n💡 Recommendations to improve scoring:')
      console.log('1. Collect missing critical evidence items listed above')
      console.log('2. Enhance evidence collection depth for low-confidence dimensions')
      console.log('3. Add more quantitative data points for financial metrics')
      console.log('4. Gather competitive intelligence for market positioning')
    }

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
console.log('Note: This test requires the queue workers to be running.')
console.log('Make sure to run: npm run worker:evidence and npm run worker:report\n')

testMixpanelScoring()