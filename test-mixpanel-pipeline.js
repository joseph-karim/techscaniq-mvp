#!/usr/bin/env node

/**
 * Test Mixpanel Pipeline with Comprehensive Scoring
 * This script triggers the complete pipeline via API for Mixpanel
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apiUrl = process.env.API_URL || 'http://localhost:3001'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.log('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testMixpanelPipeline() {
  console.log('🚀 Testing Mixpanel Pipeline with Comprehensive Scoring\n')
  
  const testData = {
    company: 'Mixpanel',
    domain: 'mixpanel.com',
    investmentThesis: 'Accelerate Organic Growth',
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
    // Step 1: Create scan request directly (using service role)
    console.log('1️⃣ Creating scan request directly...')
    
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: testData.company,
        website_url: `https://${testData.domain}`,
        primary_criteria: testData.investmentThesis,
        investment_thesis_data: testData.investorProfile?.investmentThesisData,
        status: 'pending',
        ai_workflow_status: 'pending',
        requestor_name: 'Test User',
        organization_name: 'TechScanIQ Test'
      })
      .select()
      .single()

    if (scanError) {
      console.error('❌ Failed to create scan request:', scanError)
      return
    }

    console.log(`✅ Created scan request: ${scanRequest.id}`)
    const scanRequestId = scanRequest.id

    // Step 2: Submit scan request via API
    console.log('\n2️⃣ Triggering pipeline via API...')
    
    const response = await fetch(`${apiUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...testData,
        scanRequestId  // Pass the already created scan request ID
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ API error:', error)
      console.log('Attempting direct job creation...')
      
      // Fallback: Create jobs directly
      const { createScanJob } = await import('./src/lib/queues/scan-queue.js')
      const jobResult = await createScanJob({
        scanRequestId,
        company: testData.company,
        domain: testData.domain,
        investmentThesis: testData.investmentThesis,
        investorProfile: testData.investorProfile
      })
      
      console.log(`✅ Created jobs directly:`)
      console.log(`   Evidence job: ${jobResult.evidenceJobId}`)
      console.log(`   Report job: ${jobResult.reportJobId}`)
    } else {
      const scanResult = await response.json()
      console.log(`✅ Pipeline triggered via API`)
      console.log(`   Evidence job: ${scanResult.evidenceJobId}`)
      console.log(`   Report job: ${scanResult.reportJobId}`)
    }

    // Step 3: Monitor progress
    console.log('\n3️⃣ Monitoring pipeline progress...')
    let completed = false
    let lastStatus = ''
    let progressDots = 0
    
    while (!completed) {
      // Check status directly from database
      const { data: scan } = await supabase
        .from('scan_requests')
        .select('ai_workflow_status, ai_workflow_error')
        .eq('id', scanRequestId)
        .single()

      if (scan) {
        if (scan.ai_workflow_status !== lastStatus) {
          lastStatus = scan.ai_workflow_status
          console.log(`\n   Status: ${lastStatus}`)
        } else {
          // Show progress animation
          process.stdout.write('.')
          progressDots++
          if (progressDots > 10) {
            process.stdout.write('\r' + ' '.repeat(15) + '\r')
            progressDots = 0
          }
        }
        
        if (scan.ai_workflow_status === 'completed' || scan.ai_workflow_status === 'failed') {
          completed = true
          console.log('') // New line after dots
          if (scan.ai_workflow_error) {
            console.error(`❌ Pipeline failed: ${scan.ai_workflow_error}`)
          }
        }
      }
      
      if (!completed) {
        await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds
      }
    }

    // Step 4: Get the full report with comprehensive scoring
    console.log('\n4️⃣ Fetching comprehensive scoring results...')
    
    const { data: report } = await supabase
      .from('reports')
      .select(`
        *,
        evidence_collection:evidence_collections(
          *,
          evidence_items(
            id,
            type,
            category,
            confidence_score,
            source_url
          )
        )
      `)
      .eq('scan_request_id', scanRequestId)
      .single()

    if (!report) {
      console.error('❌ No report found')
      return
    }

    // Display comprehensive scoring results
    const comprehensiveScore = report.metadata?.comprehensiveScore || report.report_data?.comprehensiveScore
    
    if (comprehensiveScore) {
      console.log('\n📊 COMPREHENSIVE SCORING RESULTS')
      console.log('═══════════════════════════════════════════════════')
      console.log(`🎯 Investment Score: ${Math.round(comprehensiveScore.confidenceAdjustedScore)}/100`)
      console.log(`📈 Grade: ${comprehensiveScore.finalGrade}`)
      console.log(`💡 Recommendation: ${comprehensiveScore.investmentRecommendation}`)
      console.log(`🔍 Confidence Level: ${comprehensiveScore.confidenceBreakdown.overallConfidence}%`)
      
      console.log('\n📊 DIMENSION BREAKDOWN')
      console.log('───────────────────────────────────────────────────')
      console.log(`Technical:  ${comprehensiveScore.technicalScore}/100 (${Math.round(comprehensiveScore.technicalConfidence * 100)}% conf)`)
      console.log(`Business:   ${comprehensiveScore.businessScore}/100 (${Math.round(comprehensiveScore.businessConfidence * 100)}% conf)`)
      console.log(`Market:     ${comprehensiveScore.marketScore}/100 (${Math.round(comprehensiveScore.marketConfidence * 100)}% conf)`)
      console.log(`Team:       ${comprehensiveScore.teamScore}/100 (${Math.round(comprehensiveScore.teamConfidence * 100)}% conf)`)
      console.log(`Financial:  ${comprehensiveScore.financialScore}/100 (${Math.round(comprehensiveScore.financialConfidence * 100)}% conf)`)
      
      console.log('\n🔍 CONFIDENCE ANALYSIS')
      console.log('───────────────────────────────────────────────────')
      console.log(`Evidence Quality:   ${Math.round(comprehensiveScore.confidenceBreakdown.evidenceQuality * 100)}%`)
      console.log(`Evidence Coverage:  ${Math.round(comprehensiveScore.confidenceBreakdown.evidenceCoverage * 100)}%`)
      if (comprehensiveScore.confidenceBreakdown.penaltyApplied > 0) {
        console.log(`Penalty Applied:    -${Math.round(comprehensiveScore.confidenceBreakdown.penaltyApplied * 100)}%`)
      }
      
      if (comprehensiveScore.confidenceBreakdown.missingCriticalEvidence?.length > 0) {
        console.log('\n⚠️  MISSING CRITICAL EVIDENCE')
        console.log('───────────────────────────────────────────────────')
        comprehensiveScore.confidenceBreakdown.missingCriticalEvidence.forEach(item => {
          console.log(`❌ ${item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
        })
      }
    }

    // Evidence analysis
    const evidenceItems = report.evidence_collection?.evidence_items || []
    console.log('\n📋 EVIDENCE COLLECTION SUMMARY')
    console.log('═══════════════════════════════════════════════════')
    console.log(`Total Evidence Items: ${evidenceItems.length}`)
    
    // Group by category
    const byCategory = evidenceItems.reduce((acc, item) => {
      const cat = item.category || 'uncategorized'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})
    
    console.log('\nBy Category:')
    Object.entries(byCategory).forEach(([cat, count]) => {
      const percentage = Math.round((count / evidenceItems.length) * 100)
      console.log(`  ${cat}: ${count} (${percentage}%)`)
    })
    
    // Group by type - top 10
    const byType = evidenceItems.reduce((acc, item) => {
      const type = item.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    
    console.log('\nTop Evidence Types:')
    Object.entries(byType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
      })
    
    // Average confidence
    const avgConfidence = evidenceItems.reduce((sum, item) => 
      sum + (item.confidence_score || 0.7), 0
    ) / (evidenceItems.length || 1)
    
    console.log(`\nAverage Confidence: ${Math.round(avgConfidence * 100)}%`)

    // Investment thesis alignment
    if (report.report_data?.investmentRecommendation?.thesisAlignment) {
      console.log('\n💼 INVESTMENT THESIS ALIGNMENT')
      console.log('═══════════════════════════════════════════════════')
      const alignment = report.report_data.investmentRecommendation.thesisAlignment
      console.log(`Overall Alignment: ${alignment.overallAlignment}`)
      
      if (alignment.criteriaScores) {
        console.log('\nWeighted Criteria Scores:')
        alignment.criteriaScores.forEach(criterion => {
          const contribution = (criterion.score * criterion.weight / 100).toFixed(1)
          console.log(`  ${criterion.criterion}:`)
          console.log(`    Score: ${criterion.score}/100 × ${criterion.weight}% = ${contribution} points`)
        })
      }
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS TO IMPROVE SCORING')
    console.log('═══════════════════════════════════════════════════')
    
    if (comprehensiveScore?.confidenceBreakdown.missingCriticalEvidence?.length > 0) {
      console.log('1. Collect Missing Critical Evidence:')
      comprehensiveScore.confidenceBreakdown.missingCriticalEvidence.slice(0, 5).forEach(item => {
        console.log(`   • ${item.replace(/_/g, ' ')}`)
      })
    }
    
    // Find lowest scoring dimensions
    const dimensions = [
      { name: 'Technical', score: comprehensiveScore?.technicalScore, conf: comprehensiveScore?.technicalConfidence },
      { name: 'Business', score: comprehensiveScore?.businessScore, conf: comprehensiveScore?.businessConfidence },
      { name: 'Market', score: comprehensiveScore?.marketScore, conf: comprehensiveScore?.marketConfidence },
      { name: 'Team', score: comprehensiveScore?.teamScore, conf: comprehensiveScore?.teamConfidence },
      { name: 'Financial', score: comprehensiveScore?.financialScore, conf: comprehensiveScore?.financialConfidence }
    ].sort((a, b) => (a.score || 0) - (b.score || 0))
    
    console.log('\n2. Focus on Low-Scoring Dimensions:')
    dimensions.slice(0, 2).forEach(dim => {
      console.log(`   • Improve ${dim.name} (${dim.score}/100, ${Math.round((dim.conf || 0) * 100)}% conf)`)
    })
    
    console.log('\n3. Enhance Evidence Quality:')
    console.log('   • Add more primary sources (company docs, API data)')
    console.log('   • Include quantitative metrics and KPIs')
    console.log('   • Gather recent data (< 6 months old)')

    // Summary
    console.log('\n📈 FINAL SUMMARY')
    console.log('═══════════════════════════════════════════════════')
    console.log(`Company: ${testData.company} (${testData.domain})`)
    console.log(`Investment Thesis: ${testData.investmentThesis}`)
    console.log(`Final Score: ${comprehensiveScore ? Math.round(comprehensiveScore.confidenceAdjustedScore) : 'N/A'}/100`)
    console.log(`Confidence: ${comprehensiveScore?.confidenceBreakdown.overallConfidence || 'N/A'}%`)
    console.log(`Evidence Items: ${evidenceItems.length}`)
    console.log(`Report ID: ${report.id}`)
    
    if (report?.id) {
      console.log(`\n🔗 View full report: ${supabaseUrl}/dashboard/reports/${report.id}`)
    }

  } catch (error) {
    console.error('❌ Pipeline test error:', error)
  }
}

// Check if API is running
async function checkApiHealth() {
  try {
    const response = await fetch(`${apiUrl}/api/health`)
    if (response.ok) {
      return true
    }
  } catch (error) {
    return false
  }
  return false
}

// Main execution
async function main() {
  console.log('🔍 Checking API server...')
  const apiHealthy = await checkApiHealth()
  
  if (!apiHealthy) {
    console.error('\n❌ API server is not running!')
    console.log('\nPlease start the API server first:')
    console.log('  npm run api\n')
    console.log('Also make sure the workers are running:')
    console.log('  npm run worker:evidence')
    console.log('  npm run worker:report\n')
    process.exit(1)
  }
  
  console.log('✅ API server is running\n')
  await testMixpanelPipeline()
}

main()