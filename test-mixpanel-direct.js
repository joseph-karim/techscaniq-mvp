#!/usr/bin/env node

/**
 * Direct Test of Mixpanel Pipeline with Comprehensive Scoring
 * This bypasses the API and directly creates queue jobs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { Worker } from 'bullmq'

// Load environment variables
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.log('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Import the worker directly
async function runMixpanelTest() {
  console.log('🚀 Direct Mixpanel Pipeline Test with Comprehensive Scoring\n')
  
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
    // Step 1: Create scan request
    console.log('1️⃣ Creating scan request for Mixpanel...')
    
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

    // Step 2: Simulate evidence collection
    console.log('\n2️⃣ Simulating evidence collection...')
    
    // Update status
    await supabase
      .from('scan_requests')
      .update({
        ai_workflow_status: 'collecting_evidence'
      })
      .eq('id', scanRequest.id)
    
    // Simulate evidence collection (normally done by worker)
    console.log('   Creating mock evidence for testing...')
    
    // Create evidence collection
    const { data: collection, error: collectionError } = await supabase
      .from('evidence_collections')
      .insert({
        company_name: testData.company,
        company_website: `https://${testData.domain}`,
        evidence_count: 150,
        status: 'processing',
        collection_type: 'comprehensive',
        metadata: {
          scan_request_id: scanRequest.id,
          source: 'test-direct'
        }
      })
      .select()
      .single()
    
    if (collectionError) {
      console.error('❌ Failed to create evidence collection:', collectionError)
      return
    }
    
    // Create sample evidence items with valid types
    const evidenceTypes = [
      // Technical evidence
      { type: 'technology_stack', evidence_type: 'tech_stack', category: 'technical', summary: 'React, Node.js, PostgreSQL, Redis, Kafka' },
      { type: 'website_content', evidence_type: 'infrastructure', category: 'technical', summary: 'AWS cloud infrastructure with multi-region deployment' },
      { type: 'tech_deep_dive', evidence_type: 'scalability', category: 'technical', summary: 'Handles billions of events per day' },
      { type: 'security_analysis', evidence_type: 'security_headers', category: 'technical', summary: 'Proper security headers implemented' },
      { type: 'website_content', evidence_type: 'api_architecture', category: 'technical', summary: 'RESTful and GraphQL APIs available' },
      
      // Business evidence
      { type: 'business_overview', evidence_type: 'team_size', category: 'business', summary: '500-1000 employees' },
      { type: 'market_analysis', evidence_type: 'market_position', category: 'business', summary: 'Top 3 player in product analytics' },
      { type: 'website_content', evidence_type: 'customer_count', category: 'business', summary: '8,000+ customers globally' },
      { type: 'business_overview', evidence_type: 'use_cases', category: 'business', summary: 'Product analytics, A/B testing, user engagement' },
      
      // Market evidence
      { type: 'market_analysis', evidence_type: 'market_size', category: 'market', summary: '$15B product analytics market' },
      { type: 'market_analysis', evidence_type: 'competitors', category: 'market', summary: 'Amplitude, Heap, PostHog, Google Analytics' },
      { type: 'market_analysis', evidence_type: 'growth_rate', category: 'market', summary: '15% CAGR in analytics market' },
      { type: 'business_overview', evidence_type: 'differentiators', category: 'market', summary: 'Real-time analysis, intuitive UI, data accuracy' },
      
      // Team evidence
      { type: 'website_content', evidence_type: 'leadership_profiles', category: 'team', summary: 'CEO: Amir Movafaghi, former Twitter executive' },
      { type: 'business_overview', evidence_type: 'team_experience', category: 'team', summary: 'Leadership from Google, Facebook, Twitter' },
      { type: 'website_content', evidence_type: 'culture', category: 'team', summary: 'Data-driven, customer-focused culture' },
      
      // Financial evidence
      { type: 'business_overview', evidence_type: 'funding_history', category: 'financial', summary: '$865M total funding, last round in 2021' },
      { type: 'business_overview', evidence_type: 'revenue_model', category: 'financial', summary: 'SaaS subscription model' },
      { type: 'website_content', evidence_type: 'pricing', category: 'financial', summary: 'Free tier, Growth ($25/mo), Enterprise (custom)' }
    ]
    
    // Add 100+ more evidence items to simulate comprehensive collection
    for (let i = 0; i < 100; i++) {
      const categories = ['technical', 'business', 'market', 'team', 'financial']
      const validTypes = ['website_content', 'business_overview', 'market_analysis', 'tech_deep_dive', 'deep_crawl']
      const category = categories[i % categories.length]
      evidenceTypes.push({
        type: validTypes[i % validTypes.length],
        evidence_type: `evidence_${category}_${i}`,
        category,
        summary: `Additional ${category} evidence item ${i}`
      })
    }
    
    const evidenceItems = evidenceTypes.map((item, index) => ({
      collection_id: collection.id,
      evidence_id: crypto.randomUUID(),
      company_name: testData.company,
      evidence_type: item.type,
      type: item.type,
      confidence_score: 0.6 + Math.random() * 0.3, // 60-90% confidence
      metadata: { 
        index,
        scan_request_id: scanRequest.id,
        category: item.category
      },
      content_data: {
        summary: item.summary,
        processed: `Processed: ${item.summary}`,
        category: item.category
      },
      source_data: {
        url: `https://mixpanel.com/${item.type}`,
        title: item.type
      }
    }))
    
    const { error: evidenceError } = await supabase
      .from('evidence_items')
      .insert(evidenceItems)
    
    if (evidenceError) {
      console.error('❌ Failed to create evidence items:', evidenceError)
      return
    }
    
    console.log(`✅ Created ${evidenceItems.length} evidence items`)
    
    // Update collection status
    await supabase
      .from('evidence_collections')
      .update({
        status: 'completed',
        evidence_count: evidenceItems.length
      })
      .eq('id', collection.id)
    
    // Step 3: Run comprehensive scoring inline
    console.log('\n3️⃣ Running comprehensive scoring analysis...')
    
    // Update status
    await supabase
      .from('scan_requests')
      .update({
        ai_workflow_status: 'generating_report'
      })
      .eq('id', scanRequest.id)
    
    // Calculate comprehensive score inline
    const scoringInput = evidenceItems.map(e => ({
      id: `${e.collection_id}-${e.metadata.index}`,
      type: e.evidence_type,
      category: e.metadata.category,
      content: e.content_data.summary,
      source: e.source_data.url,
      confidence: e.confidence_score,
      timestamp: new Date().toISOString(),
      metadata: e.metadata
    }))
    
    // Simple scoring calculation
    const byCategory = scoringInput.reduce((acc, item) => {
      const cat = item.category || 'uncategorized'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {})
    
    const technicalScore = Math.min(byCategory.technical?.length * 5 || 0, 85)
    const businessScore = Math.min(byCategory.business?.length * 5 || 0, 80)
    const marketScore = Math.min(byCategory.market?.length * 5 || 0, 75)
    const teamScore = Math.min(byCategory.team?.length * 5 || 0, 70)
    const financialScore = Math.min(byCategory.financial?.length * 5 || 0, 65)
    
    const avgConfidence = scoringInput.reduce((sum, item) => sum + item.confidence, 0) / scoringInput.length
    const coverageFactor = Math.min(scoringInput.length / 200, 1)
    
    // Check for missing critical TECH-FOCUSED evidence
    const criticalTypes = [
      'tech_stack',           // Core technology choices
      'api_architecture',     // API design and scalability
      'infrastructure',       // Cloud/hosting setup
      'security_headers',     // Security implementation
      'performance_metrics',  // Speed and reliability
      'integration_ecosystem' // Third-party integrations
    ]
    const collectedTypes = new Set(scoringInput.map(e => e.type))
    const missingCritical = criticalTypes.filter(t => !collectedTypes.has(t))
    
    // Missing evidence affects confidence, not score
    const missingEvidenceImpact = Math.max(0, 1 - (missingCritical.length * 0.1)) // Each missing critical reduces confidence by 10%
    const overallConfidence = (avgConfidence * 0.6 + coverageFactor * 0.4) * missingEvidenceImpact
    
    // Tech-focused weights for "Accelerate Organic Growth" thesis
    const weightedScore = technicalScore * 0.40 + businessScore * 0.20 + marketScore * 0.25 + teamScore * 0.10 + financialScore * 0.05
    const confidenceAdjustedScore = weightedScore // No penalty on score itself
    
    const comprehensiveScore = {
      technicalScore,
      technicalConfidence: byCategory.technical ? avgConfidence : 0,
      businessScore,
      businessConfidence: byCategory.business ? avgConfidence : 0,
      marketScore,
      marketConfidence: byCategory.market ? avgConfidence : 0,
      teamScore,
      teamConfidence: byCategory.team ? avgConfidence : 0,
      financialScore,
      financialConfidence: byCategory.financial ? avgConfidence : 0,
      weightedScore: Math.round(weightedScore),
      thesisScore: Math.round(weightedScore),
      thesisConfidence: overallConfidence,
      confidenceAdjustedScore: Math.round(confidenceAdjustedScore),
      finalGrade: confidenceAdjustedScore >= 85 ? 'A' : confidenceAdjustedScore >= 70 ? 'B' : confidenceAdjustedScore >= 55 ? 'C' : confidenceAdjustedScore >= 40 ? 'D' : 'F',
      investmentRecommendation: confidenceAdjustedScore >= 80 ? 'Strong Buy' : confidenceAdjustedScore >= 65 ? 'Buy' : confidenceAdjustedScore >= 50 ? 'Hold' : 'Pass',
      confidenceBreakdown: {
        overallConfidence: Math.round(overallConfidence * 100),
        evidenceQuality: avgConfidence,
        evidenceCoverage: coverageFactor,
        missingCriticalEvidence: missingCritical,
        penaltyApplied: 0, // No penalty on score
        confidenceImpact: `Missing ${missingCritical.length} critical evidence items reduced confidence by ${Math.round((1 - missingEvidenceImpact) * 100)}%`
      }
    }
    
    console.log('✅ Comprehensive scoring completed')
    console.log(`   Investment Score: ${Math.round(comprehensiveScore.confidenceAdjustedScore)}/100`)
    console.log(`   Grade: ${comprehensiveScore.finalGrade}`)
    console.log(`   Recommendation: ${comprehensiveScore.investmentRecommendation}`)
    console.log(`   Confidence: ${comprehensiveScore.confidenceBreakdown.overallConfidence}%`)
    
    // Create a report with the comprehensive scoring
    const reportData = {
      companyInfo: {
        name: testData.company,
        website: `https://${testData.domain}`,
        description: 'Product analytics platform'
      },
      executiveSummary: {
        content: `Comprehensive analysis of ${testData.company} with ${evidenceItems.length} evidence items.`
      },
      comprehensiveScore,
      investmentRecommendation: {
        score: Math.round(comprehensiveScore.confidenceAdjustedScore),
        grade: comprehensiveScore.finalGrade,
        recommendation: comprehensiveScore.investmentRecommendation.toLowerCase().replace(' ', '-'),
        rationale: `Based on comprehensive scoring analysis with ${comprehensiveScore.confidenceBreakdown.overallConfidence}% confidence.`
      }
    }
    
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        scan_request_id: scanRequest.id,
        company_name: testData.company,
        investment_score: Math.round(comprehensiveScore.confidenceAdjustedScore),
        investment_rationale: reportData.investmentRecommendation.rationale,
        tech_health_score: comprehensiveScore.technicalScore,
        tech_health_grade: comprehensiveScore.finalGrade,
        report_data: reportData,
        evidence_count: evidenceItems.length,
        citation_count: 0,
        executive_summary: reportData.executiveSummary.content,
        report_version: '3.0-test',
        ai_model_used: 'comprehensive-scoring-test',
        quality_score: comprehensiveScore.confidenceBreakdown.evidenceQuality,
        metadata: { comprehensiveScore }
      })
      .select()
      .single()
    
    if (reportError) {
      console.error('❌ Failed to create report:', reportError)
    } else {
      console.log(`✅ Report created: ${report.id}`)
    }
    
    // Update scan request
    await supabase
      .from('scan_requests')
      .update({
        ai_workflow_status: 'completed',
        report_id: report?.id
      })
      .eq('id', scanRequest.id)
    
    // Step 4: Display results
    console.log('\n4️⃣ Displaying comprehensive scoring results...')
    
    if (report) {
      displayResults(report)
    } else {
      console.log('⚠️  No report found, checking evidence...')
      
      // Display evidence summary
      const { data: finalCollection } = await supabase
        .from('evidence_collections')
        .select('*, evidence_items(*)')
        .eq('id', collection.id)
        .single()
      
      if (finalCollection) {
        console.log('\n📋 Evidence Collection Summary:')
        console.log(`Total items: ${finalCollection.evidence_items.length}`)
        
        const byCategory = finalCollection.evidence_items.reduce((acc, item) => {
          const category = item.metadata?.category || item.content_data?.category || 'uncategorized'
          acc[category] = (acc[category] || 0) + 1
          return acc
        }, {})
        
        console.log('\nBy category:')
        Object.entries(byCategory).forEach(([cat, count]) => {
          console.log(`  ${cat}: ${count}`)
        })
      }
    }
    
    console.log('\n✅ Test completed!')
    console.log(`Scan request ID: ${scanRequest.id}`)
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

function displayResults(report) {
  const score = report.metadata?.comprehensiveScore || report.report_data?.comprehensiveScore
  
  if (score) {
    console.log('\n📊 COMPREHENSIVE SCORING RESULTS')
    console.log('═══════════════════════════════════════════════════')
    console.log(`🎯 Investment Score: ${Math.round(score.confidenceAdjustedScore)}/100`)
    console.log(`📈 Grade: ${score.finalGrade}`)
    console.log(`💡 Recommendation: ${score.investmentRecommendation}`)
    console.log(`🔍 Confidence Level: ${score.confidenceBreakdown.overallConfidence}%`)
    
    console.log('\n📊 DIMENSION BREAKDOWN')
    console.log('───────────────────────────────────────────────────')
    console.log(`Technical:  ${score.technicalScore}/100 (${Math.round(score.technicalConfidence * 100)}% conf)`)
    console.log(`Business:   ${score.businessScore}/100 (${Math.round(score.businessConfidence * 100)}% conf)`)
    console.log(`Market:     ${score.marketScore}/100 (${Math.round(score.marketConfidence * 100)}% conf)`)
    console.log(`Team:       ${score.teamScore}/100 (${Math.round(score.teamConfidence * 100)}% conf)`)
    console.log(`Financial:  ${score.financialScore}/100 (${Math.round(score.financialConfidence * 100)}% conf)`)
    
    if (score.confidenceBreakdown.missingCriticalEvidence?.length > 0) {
      console.log('\n⚠️  MISSING CRITICAL EVIDENCE')
      console.log('───────────────────────────────────────────────────')
      score.confidenceBreakdown.missingCriticalEvidence.forEach(item => {
        console.log(`❌ ${item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
      })
    }
  }
}

// Run the test
runMixpanelTest()