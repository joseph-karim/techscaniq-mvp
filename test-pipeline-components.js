import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Test results storage
const results = {
  database: { status: '❓', details: {} },
  scanRequest: { status: '❓', details: {} },
  evidenceCollection: { status: '❓', details: {} },
  aiAnalysis: { status: '❓', details: {} },
  reportStorage: { status: '❓', details: {} },
  citations: { status: '❓', details: {} },
  uiRetrieval: { status: '❓', details: {} }
}

async function testDatabaseConnection() {
  console.log('\n1️⃣ DATABASE CONNECTION TEST')
  console.log('─'.repeat(40))
  
  try {
    const { data, error } = await supabase
      .from('scan_requests')
      .select('count')
      .limit(1)
    
    if (error) throw error
    
    results.database.status = '✅'
    results.database.details = { connected: true, tables: ['scan_requests', 'reports', 'evidence_collections'] }
    console.log('✅ Database connected successfully')
  } catch (error) {
    results.database.status = '❌'
    results.database.details = { error: error.message }
    console.error('❌ Database connection failed:', error.message)
  }
}

async function testScanRequestCreation() {
  console.log('\n2️⃣ SCAN REQUEST CREATION TEST')
  console.log('─'.repeat(40))
  
  try {
    const scanData = {
      company_name: 'Test Pipeline Company',
      website_url: 'https://example.com',
      status: 'pending',
      requestor_name: 'Component Test',
      organization_name: 'Test Org',
      thesis_tags: ['test'],
      primary_criteria: 'Test criteria',
      sections: [],
      risks: []
    }
    
    const { data, error } = await supabase
      .from('scan_requests')
      .insert(scanData)
      .select()
      .single()
    
    if (error) throw error
    
    results.scanRequest.status = '✅'
    results.scanRequest.details = { id: data.id, created: true }
    console.log('✅ Scan request created:', data.id)
    
    return data.id
  } catch (error) {
    results.scanRequest.status = '❌'
    results.scanRequest.details = { error: error.message }
    console.error('❌ Scan request creation failed:', error.message)
    return null
  }
}

async function testEvidenceCollection(scanRequestId) {
  console.log('\n3️⃣ EVIDENCE COLLECTION TEST')
  console.log('─'.repeat(40))
  
  try {
    console.log('Testing evidence-collector-v7...')
    const startTime = Date.now()
    
    const { data, error } = await supabase.functions.invoke('evidence-collector-v7', {
      body: {
        companyName: 'Example Company',
        companyWebsite: 'https://example.com',
        evidenceTypes: ['technical'],
        depth: 'shallow',
        scanRequestId: scanRequestId
      }
    })
    
    const duration = Date.now() - startTime
    
    if (error) throw error
    
    results.evidenceCollection.status = data?.success ? '✅' : '⚠️'
    results.evidenceCollection.details = {
      success: data?.success,
      evidenceCount: data?.evidence?.length || 0,
      collectionId: data?.collectionId,
      duration: duration + 'ms',
      tools: data?.summary?.tools || []
    }
    
    console.log('✅ Evidence collection completed')
    console.log('   Evidence count:', data?.evidence?.length || 0)
    console.log('   Duration:', duration + 'ms')
    console.log('   Collection ID:', data?.collectionId)
    
    // Check if evidence was stored
    if (data?.collectionId) {
      const { data: storedCollection, error: fetchError } = await supabase
        .from('evidence_collections')
        .select('*')
        .eq('id', data.collectionId)
        .single()
      
      if (storedCollection) {
        console.log('   ✅ Evidence stored in database')
        console.log('   Status:', storedCollection.collection_status)
        console.log('   Evidence types:', Object.keys(storedCollection.evidence_types || {}))
      }
    }
    
    return data
  } catch (error) {
    results.evidenceCollection.status = '❌'
    results.evidenceCollection.details = { error: error.message }
    console.error('❌ Evidence collection failed:', error.message)
    return null
  }
}

async function testAIAnalysis(evidenceData) {
  console.log('\n4️⃣ AI ANALYSIS TEST')
  console.log('─'.repeat(40))
  
  try {
    console.log('Testing tech-intelligence-v3...')
    const startTime = Date.now()
    
    // Prepare minimal evidence for testing
    const testEvidence = evidenceData?.evidence?.slice(0, 3).map(e => ({
      id: e.id,
      type: e.type,
      category: 'technical',
      summary: e.summary || 'Test evidence',
      source: e.source || 'test',
      confidence: 0.8
    })) || [{
      id: 'test-1',
      type: 'website_content',
      category: 'technical',
      summary: 'Test company website content',
      source: 'https://example.com',
      confidence: 0.8
    }]
    
    const { data, error } = await supabase.functions.invoke('tech-intelligence-v3', {
      body: {
        company: {
          name: 'Example Company',
          website: 'https://example.com'
        },
        evidenceSummary: testEvidence,
        analysisType: 'comprehensive_report'
      }
    })
    
    const duration = Date.now() - startTime
    
    if (error) throw error
    
    results.aiAnalysis.status = data?.success ? '✅' : '⚠️'
    results.aiAnalysis.details = {
      success: data?.success,
      hasReportData: !!data?.report_data,
      investmentScore: data?.investment_score,
      duration: duration + 'ms',
      error: data?.error
    }
    
    console.log('✅ AI analysis completed')
    console.log('   Success:', data?.success)
    console.log('   Investment score:', data?.investment_score)
    console.log('   Duration:', duration + 'ms')
    
    if (!data?.success && data?.error) {
      console.log('   ⚠️  AI error:', data.error)
    }
    
    return data
  } catch (error) {
    results.aiAnalysis.status = '❌'
    results.aiAnalysis.details = { error: error.message }
    console.error('❌ AI analysis failed:', error.message)
    return null
  }
}

async function testReportStorage(scanRequestId, analysisData) {
  console.log('\n5️⃣ REPORT STORAGE TEST')
  console.log('─'.repeat(40))
  
  try {
    const reportData = {
      scan_request_id: scanRequestId,
      company_name: 'Example Company',
      report_data: analysisData?.report_data || {
        sections: {},
        company_name: 'Example Company',
        investment_score: 70
      },
      executive_summary: analysisData?.executive_summary || 'Test report',
      investment_score: analysisData?.investment_score || 70,
      investment_rationale: analysisData?.investment_rationale || 'Test rationale',
      tech_health_score: (analysisData?.investment_score || 70) / 10,
      tech_health_grade: 'B',
      evidence_count: 0,
      citation_count: 0
    }
    
    const { data, error } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single()
    
    if (error) throw error
    
    results.reportStorage.status = '✅'
    results.reportStorage.details = { 
      reportId: data.id,
      stored: true
    }
    
    console.log('✅ Report stored successfully')
    console.log('   Report ID:', data.id)
    
    return data.id
  } catch (error) {
    results.reportStorage.status = '❌'
    results.reportStorage.details = { error: error.message }
    console.error('❌ Report storage failed:', error.message)
    return null
  }
}

async function testFullOrchestration(scanRequestId) {
  console.log('\n6️⃣ FULL ORCHESTRATION TEST')
  console.log('─'.repeat(40))
  
  try {
    console.log('Testing report-orchestrator-v3...')
    const startTime = Date.now()
    
    const { data, error } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        scan_request_id: scanRequestId,
        analysisDepth: 'shallow'
      }
    })
    
    const duration = Date.now() - startTime
    
    if (error) {
      console.error('❌ Orchestration failed:', error)
      return null
    }
    
    console.log('✅ Orchestration completed')
    console.log('   Report ID:', data?.reportId)
    console.log('   Investment score:', data?.investmentScore)
    console.log('   Duration:', duration + 'ms')
    console.log('   Success:', data?.success !== false)
    
    return data
  } catch (error) {
    console.error('❌ Orchestration error:', error.message)
    return null
  }
}

async function cleanupTestData(scanRequestId) {
  console.log('\n🧹 CLEANUP')
  console.log('─'.repeat(40))
  
  if (scanRequestId) {
    await supabase
      .from('scan_requests')
      .delete()
      .eq('id', scanRequestId)
    console.log('✅ Test data cleaned up')
  }
}

async function runComponentTests() {
  console.log('🔬 TECHSCANIQ PIPELINE COMPONENT TESTS')
  console.log('=' + '='.repeat(39))
  console.log('Testing each component in isolation to identify issues\n')
  
  let scanRequestId = null
  
  try {
    // Test 1: Database
    await testDatabaseConnection()
    
    // Test 2: Scan Request
    scanRequestId = await testScanRequestCreation()
    
    // Test 3: Evidence Collection
    const evidenceData = await testEvidenceCollection(scanRequestId)
    
    // Test 4: AI Analysis
    const analysisData = await testAIAnalysis(evidenceData)
    
    // Test 5: Report Storage
    const reportId = await testReportStorage(scanRequestId, analysisData)
    
    // Test 6: Full Orchestration (separate scan)
    if (scanRequestId) {
      const newScanId = await testScanRequestCreation()
      if (newScanId) {
        await testFullOrchestration(newScanId)
        await supabase.from('scan_requests').delete().eq('id', newScanId)
      }
    }
    
  } finally {
    await cleanupTestData(scanRequestId)
  }
  
  // Summary Report
  console.log('\n📊 TEST SUMMARY')
  console.log('=' + '='.repeat(39))
  console.log(`Database Connection:    ${results.database.status}`)
  console.log(`Scan Request Creation:  ${results.scanRequest.status}`)
  console.log(`Evidence Collection:    ${results.evidenceCollection.status}`)
  console.log(`AI Analysis:            ${results.aiAnalysis.status}`)
  console.log(`Report Storage:         ${results.reportStorage.status}`)
  
  console.log('\n📋 DETAILED RESULTS')
  console.log('─'.repeat(40))
  Object.entries(results).forEach(([component, result]) => {
    if (result.status !== '✅' && Object.keys(result.details).length > 0) {
      console.log(`\n${component}:`)
      console.log(JSON.stringify(result.details, null, 2))
    }
  })
  
  console.log('\n💡 RECOMMENDATIONS')
  console.log('─'.repeat(40))
  
  if (results.evidenceCollection.status === '❌') {
    console.log('- Check if evidence-collector-v7 edge function is deployed')
    console.log('- Verify API keys for evidence collection tools')
  }
  
  if (results.aiAnalysis.status === '❌') {
    console.log('- Check if ANTHROPIC_API_KEY is set in edge function environment')
    console.log('- Verify tech-intelligence-v3 edge function is deployed')
  }
  
  if (results.aiAnalysis.details.error?.includes('AI analysis failed')) {
    console.log('- AI service may be failing - check Claude API key and quotas')
    console.log('- Consider implementing better fallback for AI failures')
  }
}

runComponentTests().catch(console.error)