#!/usr/bin/env node

/**
 * PE-Grade Deep Scan Test for Mixpanel
 * This simulates a real billion-dollar investment decision analysis
 */

import { createClient } from '@supabase/supabase-js'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure .env contains:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const evidenceCollectionQueue = new Queue('evidence-collection', { connection: redis })

// PE Investment Thesis for Mixpanel
const MIXPANEL_INVESTMENT_CASE = {
  company: 'Mixpanel',
  domain: 'mixpanel.com',
  investmentThesis: 'accelerate-organic-growth', // 20-40% ARR growth focus
  primaryCriteria: 'accelerate-organic-growth',
  thesisRationale: `
    Mixpanel is a product analytics platform with strong market position.
    Investment thesis: Accelerate organic growth through:
    1. Enhanced scalability to handle enterprise traffic spikes
    2. Faster feature velocity with improved dev pipeline
    3. Geographic expansion with multi-region support
    4. Deeper integrations with modern data stack
  `,
  keyQuestions: [
    'Can the platform handle 10x traffic growth?',
    'How mature is their CI/CD pipeline?',
    'What is their cloud infrastructure cost per user?',
    'How modular is their architecture for rapid feature development?',
    'Do they have strong API coverage for integrations?',
    'What security certifications do they have?',
    'How strong is their engineering team?'
  ],
  expectedEvidence: {
    technical: 50,
    business: 30,
    security: 20,
    team: 20,
    financial: 15,
    total: 200
  }
}

async function createPEScanRequest() {
  console.log('🎯 Creating PE-Grade Scan Request for Mixpanel\n')
  console.log('Investment Thesis:', MIXPANEL_INVESTMENT_CASE.investmentThesis)
  console.log('Key Focus:', MIXPANEL_INVESTMENT_CASE.thesisRationale)
  
  // Create scan request
  const { data: scanRequest, error } = await supabase
    .from('scan_requests')
    .insert({
      company_name: MIXPANEL_INVESTMENT_CASE.company,
      website_url: `https://${MIXPANEL_INVESTMENT_CASE.domain}`,
      primary_criteria: MIXPANEL_INVESTMENT_CASE.primaryCriteria,
      thesis_tags: [MIXPANEL_INVESTMENT_CASE.investmentThesis],
      investment_thesis_data: {
        thesis_type: MIXPANEL_INVESTMENT_CASE.investmentThesis,
        thesis_rationale: MIXPANEL_INVESTMENT_CASE.thesisRationale,
        key_questions: MIXPANEL_INVESTMENT_CASE.keyQuestions,
        scan_type: 'deep_diligence',
        depth: 'exhaustive'
      },
      requestor_name: 'PE Investment Committee',
      organization_name: 'TechGrowth Partners',
      status: 'pending',
      ai_workflow_status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('❌ Failed to create scan request:', error)
    throw error
  }
  
  console.log('✅ Scan request created:', scanRequest.id)
  return scanRequest
}

async function queueDeepEvidenceCollection(scanRequest) {
  console.log('\n📊 Queuing Deep Evidence Collection Job')
  
  const job = await evidenceCollectionQueue.add(
    'deep-evidence-collection',
    {
      scanRequestId: scanRequest.id,
      company: MIXPANEL_INVESTMENT_CASE.company,
      domain: MIXPANEL_INVESTMENT_CASE.domain,
      depth: 'exhaustive', // Maximum depth for PE diligence
      investmentThesis: MIXPANEL_INVESTMENT_CASE.investmentThesis,
      primaryCriteria: MIXPANEL_INVESTMENT_CASE.primaryCriteria
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: false,
      removeOnFail: false
    }
  )
  
  console.log('✅ Evidence collection job queued:', job.id)
  return job
}

async function monitorProgress(jobId, scanRequestId) {
  console.log('\n⏳ Monitoring Evidence Collection Progress...\n')
  
  const startTime = Date.now()
  let lastProgress = 0
  let checkCount = 0
  
  while (true) {
    checkCount++
    
    // Get job status
    const job = await evidenceCollectionQueue.getJob(jobId)
    if (!job) {
      console.error('❌ Job not found')
      break
    }
    
    const state = await job.getState()
    const progress = job.progress || 0
    
    // Get scan request status
    const { data: scanRequest } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', scanRequestId)
      .single()
    
    // Get evidence count
    const { data: evidenceCollection } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('metadata->>scan_request_id', scanRequestId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // Show progress
    if (progress !== lastProgress || checkCount % 10 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      console.log(`[${elapsed}s] Status: ${state} | Progress: ${progress}% | AI Status: ${scanRequest?.ai_workflow_status}`)
      
      if (evidenceCollection) {
        console.log(`    Evidence collected: ${evidenceCollection.evidence_count || 0} items`)
        console.log(`    Collection status: ${evidenceCollection.status}`)
        
        if (evidenceCollection.metadata?.pages_crawled) {
          console.log(`    Pages crawled: ${evidenceCollection.metadata.pages_crawled}`)
        }
        if (evidenceCollection.metadata?.technologies_found) {
          console.log(`    Technologies found: ${evidenceCollection.metadata.technologies_found.length}`)
        }
      }
      
      lastProgress = progress
    }
    
    // Check completion
    if (state === 'completed') {
      console.log('\n✅ Evidence collection completed!')
      const result = await job.returnvalue
      return { scanRequest, evidenceCollection, result }
    }
    
    if (state === 'failed') {
      console.error('\n❌ Evidence collection failed!')
      const failedReason = job.failedReason
      console.error('Reason:', failedReason)
      throw new Error(failedReason)
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Timeout after 30 minutes
    if (Date.now() - startTime > 30 * 60 * 1000) {
      console.error('\n⏱️ Timeout: Evidence collection took too long')
      break
    }
  }
}

async function analyzeResults(scanRequestId, collectionId) {
  console.log('\n📈 Analyzing Evidence Collection Results\n')
  
  // Get all evidence items
  const { data: evidenceItems } = await supabase
    .from('evidence_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('confidence_score', { ascending: false })
  
  if (!evidenceItems || evidenceItems.length === 0) {
    console.error('❌ No evidence items found')
    return
  }
  
  // Categorize evidence
  const evidenceByType = {}
  const evidenceByTool = {}
  const highConfidenceItems = []
  
  for (const item of evidenceItems) {
    // By type
    evidenceByType[item.type] = (evidenceByType[item.type] || 0) + 1
    
    // By tool
    const tool = item.source_data?.tool || 'unknown'
    evidenceByTool[tool] = (evidenceByTool[tool] || 0) + 1
    
    // High confidence
    if (item.confidence_score >= 0.85) {
      highConfidenceItems.push({
        type: item.type,
        confidence: item.confidence_score,
        source: item.source_data?.url || item.source_data?.tool,
        summary: item.content_data?.summary?.slice(0, 100)
      })
    }
  }
  
  console.log('📊 Evidence Summary:')
  console.log(`Total items: ${evidenceItems.length}`)
  console.log('\nBy Type:')
  Object.entries(evidenceByType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`)
    })
  
  console.log('\nBy Collection Tool:')
  Object.entries(evidenceByTool)
    .sort(([,a], [,b]) => b - a)
    .forEach(([tool, count]) => {
      console.log(`  - ${tool}: ${count}`)
    })
  
  console.log(`\nHigh Confidence Items (≥0.85): ${highConfidenceItems.length}`)
  highConfidenceItems.slice(0, 10).forEach((item, i) => {
    console.log(`\n${i + 1}. [${item.confidence.toFixed(2)}] ${item.type}`)
    console.log(`   Source: ${item.source}`)
    console.log(`   ${item.summary}...`)
  })
  
  // Check against expected evidence
  console.log('\n🎯 Evidence Target Analysis:')
  const expected = MIXPANEL_INVESTMENT_CASE.expectedEvidence
  console.log(`Technical Evidence: ${evidenceByType['technical_architecture'] || 0} + ${evidenceByType['technology_stack'] || 0} + ${evidenceByType['api_documentation'] || 0} (target: ${expected.technical})`)
  console.log(`Business Evidence: ${evidenceByType['business_overview'] || 0} + ${evidenceByType['company_overview'] || 0} (target: ${expected.business})`)
  console.log(`Security Evidence: ${evidenceByType['security_analysis'] || 0} + ${evidenceByType['security_compliance'] || 0} (target: ${expected.security})`)
  console.log(`Total Evidence: ${evidenceItems.length} (target: ${expected.total}+)`)
  
  // Extract key technologies found
  const techEvidence = evidenceItems.filter(item => 
    item.type === 'technology_stack' || 
    item.type === 'technology_stack_comprehensive' ||
    item.type === 'code_analysis'
  )
  
  if (techEvidence.length > 0) {
    console.log('\n🔧 Technology Stack Discovered:')
    const allTechs = new Set()
    techEvidence.forEach(item => {
      if (item.content_data?.raw) {
        try {
          const parsed = JSON.parse(item.content_data.raw)
          if (parsed.technologies) {
            parsed.technologies.forEach(t => allTechs.add(t))
          }
        } catch (e) {}
      }
    })
    
    if (allTechs.size > 0) {
      console.log('Technologies:', Array.from(allTechs).sort().join(', '))
    }
  }
  
  // Investment thesis alignment
  console.log('\n💰 Investment Thesis Alignment:')
  const codeAnalysisItems = evidenceItems.filter(item => item.type === 'code_analysis')
  if (codeAnalysisItems.length > 0) {
    console.log(`Code analysis performed on ${codeAnalysisItems.length} pages`)
    
    // Extract insights
    const allRisks = new Set()
    const allOpportunities = new Set()
    
    codeAnalysisItems.forEach(item => {
      if (item.content_data?.raw) {
        try {
          const parsed = JSON.parse(item.content_data.raw)
          if (parsed.analysis) {
            parsed.analysis.risks?.forEach(r => allRisks.add(r))
            parsed.analysis.opportunities?.forEach(o => allOpportunities.add(o))
          }
        } catch (e) {}
      }
    })
    
    if (allOpportunities.size > 0) {
      console.log('\n✅ Investment Opportunities:')
      Array.from(allOpportunities).forEach(opp => console.log(`  • ${opp}`))
    }
    
    if (allRisks.size > 0) {
      console.log('\n⚠️ Investment Risks:')
      Array.from(allRisks).forEach(risk => console.log(`  • ${risk}`))
    }
  }
  
  // Final verdict
  console.log('\n🏆 PE Diligence Summary:')
  const hasStrongTech = (evidenceByType['technical_architecture'] || 0) + (evidenceByType['technology_stack'] || 0) > 30
  const hasAPIEvidence = (evidenceByType['api_documentation'] || 0) > 5
  const hasSecurityEvidence = (evidenceByType['security_analysis'] || 0) > 5
  const totalEvidence = evidenceItems.length
  
  if (totalEvidence >= 150 && hasStrongTech && hasAPIEvidence && hasSecurityEvidence) {
    console.log('✅ STRONG EVIDENCE BASE for investment decision')
    console.log('   - Comprehensive technical architecture understanding')
    console.log('   - Clear API integration capabilities')
    console.log('   - Security posture assessed')
    console.log('   - Ready for deeper financial/commercial diligence')
  } else {
    console.log('⚠️ INSUFFICIENT EVIDENCE for billion-dollar decision')
    if (totalEvidence < 150) console.log('   - Need more evidence items (current: ' + totalEvidence + ')')
    if (!hasStrongTech) console.log('   - Limited technical architecture insights')
    if (!hasAPIEvidence) console.log('   - Missing API/integration evidence')
    if (!hasSecurityEvidence) console.log('   - Insufficient security assessment')
  }
}

async function main() {
  console.log('🚀 TechScanIQ Deep Evidence Collection Test')
  console.log('🏢 Target: Mixpanel (Product Analytics Platform)')
  console.log('💼 Scenario: PE Growth Investment Due Diligence')
  console.log('💰 Investment Size: $500M-1B (implied)\n')
  
  try {
    // Create scan request
    const scanRequest = await createPEScanRequest()
    
    // Queue evidence collection
    const job = await queueDeepEvidenceCollection(scanRequest)
    
    // Monitor progress
    const { evidenceCollection, result } = await monitorProgress(job.id, scanRequest.id)
    
    // Analyze results
    if (evidenceCollection?.id) {
      await analyzeResults(scanRequest.id, evidenceCollection.id)
    }
    
    console.log('\n✅ Test completed successfully!')
    console.log('\nNext steps for real PE diligence:')
    console.log('1. Generate comprehensive investment report')
    console.log('2. Deep dive into financial metrics')
    console.log('3. Competitive landscape analysis')
    console.log('4. Management team assessment')
    console.log('5. Customer reference checks')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
  } finally {
    // Cleanup
    await redis.quit()
    process.exit(0)
  }
}

// Check if worker is running
async function checkWorkerStatus() {
  const workers = await evidenceCollectionQueue.getWorkers()
  if (workers.length === 0) {
    console.error('\n⚠️  WARNING: No evidence collection workers detected!')
    console.error('Please start the deep evidence collection worker first:')
    console.error('  npm run worker:evidence:deep')
    console.error('\nOr run the full stack:')
    console.error('  npm run dev:api:deep')
    return false
  }
  return true
}

// Run the test
checkWorkerStatus().then(hasWorkers => {
  if (hasWorkers) {
    main()
  } else {
    process.exit(1)
  }
})