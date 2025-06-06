import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugEdgeFunction() {
  console.log('🔍 Debugging Edge Function Pipeline\n')
  
  try {
    // Create a real test case
    console.log('1. Creating test scan request for a real company...')
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: 'Stripe',
        website_url: 'https://stripe.com',
        status: 'pending',
        requestor_name: 'Debug Test',
        organization_name: 'Test Org',
        thesis_tags: ['fintech', 'api-first', 'developer-tools'],
        primary_criteria: 'API design and developer experience',
        secondary_criteria: 'Scalability and reliability',
        sections: [],
        risks: [],
        investment_thesis_data: {
          thesisType: 'accelerate-organic-growth',
          criteria: [
            { id: '1', name: 'Developer Experience', weight: 40, description: 'API quality, documentation, SDKs' },
            { id: '2', name: 'Scalability', weight: 30, description: 'Infrastructure and performance' },
            { id: '3', name: 'Market Position', weight: 30, description: 'Competitive advantage' }
          ],
          focusAreas: ['api-first', 'developer-tools', 'fintech'],
          timeHorizon: '3-5 years',
          targetMultiple: '5-10x'
        }
      })
      .select()
      .single()
    
    if (scanError) {
      console.error('Failed to create scan request:', scanError)
      return
    }
    
    console.log('✅ Created scan request:', scanRequest.id)
    
    // Call the orchestrator with detailed logging
    console.log('\n2. Calling report-orchestrator-v3 with comprehensive depth...')
    console.log('   Request payload:', {
      scan_request_id: scanRequest.id,
      analysisDepth: 'comprehensive'
    })
    
    const startTime = Date.now()
    
    const { data: result, error: orchestratorError } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        scan_request_id: scanRequest.id,
        analysisDepth: 'comprehensive'
      }
    })
    
    const duration = Date.now() - startTime
    console.log(`   Execution time: ${duration}ms`)
    
    if (orchestratorError) {
      console.error('❌ Orchestrator error:', orchestratorError)
      
      // Check edge function logs
      const { data: logs } = await supabase
        .from('edge_function_logs')
        .select('*')
        .eq('function_name', 'report-orchestrator-v3')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (logs && logs.length > 0) {
        console.log('\n📋 Recent edge function logs:')
        logs.forEach(log => {
          console.log(`   ${log.status}: ${log.error_message || 'No error message'}`)
        })
      }
    } else {
      console.log('✅ Orchestrator completed')
      console.log('   Report ID:', result?.reportId)
      console.log('   Investment Score:', result?.investmentScore)
      console.log('   Success:', result?.success)
      
      if (result?.reportId) {
        // Fetch the full report
        const { data: report } = await supabase
          .from('reports')
          .select('*')
          .eq('id', result.reportId)
          .single()
        
        if (report) {
          console.log('\n3. Analyzing report quality...')
          console.log('   Evidence count:', report.evidence_count || 0)
          console.log('   Citation count:', report.citation_count || 0)
          console.log('   Has real company data:', report.report_data?.companyInfo?.founded !== 'Unknown')
          console.log('   Has real tech stack:', report.report_data?.technologyOverview?.primaryStack?.length > 0)
          console.log('   Has security findings:', report.report_data?.securityAssessment?.strengths?.length > 0)
          
          // Check evidence collection
          const { data: collections } = await supabase
            .from('evidence_collections')
            .select('*')
            .eq('scan_request_id', scanRequest.id)
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (collections && collections.length > 0) {
            const collection = collections[0]
            console.log('\n4. Evidence collection details:')
            console.log('   Collection ID:', collection.id)
            console.log('   Status:', collection.collection_status)
            console.log('   Evidence count:', collection.evidence_count)
            console.log('   Tools used:', collection.tools_used?.join(', '))
            console.log('   Evidence types:', Object.entries(collection.evidence_types || {}).map(([k,v]) => `${k}: ${v}`).join(', '))
            
            // Check a few evidence items
            const { data: items } = await supabase
              .from('evidence_items')
              .select('type, summary, confidence')
              .eq('collection_id', collection.id)
              .limit(5)
            
            if (items && items.length > 0) {
              console.log('\n   Sample evidence items:')
              items.forEach((item, i) => {
                console.log(`   ${i+1}. ${item.type}: "${item.summary?.substring(0, 60)}..." (confidence: ${item.confidence})`)
              })
            }
          } else {
            console.log('\n⚠️  No evidence collection found')
          }
          
          // Show a sample of the actual content
          if (report.report_data?.technologyOverview?.summary) {
            console.log('\n5. Sample report content:')
            console.log('   Tech Summary:', report.report_data.technologyOverview.summary.substring(0, 150) + '...')
          }
          
          if (report.report_data?.investmentRecommendation?.rationale) {
            console.log('   Investment Rationale:', report.report_data.investmentRecommendation.rationale.substring(0, 150) + '...')
          }
        }
      }
    }
    
    // Cleanup
    console.log('\n6. Cleaning up test data...')
    await supabase
      .from('scan_requests')
      .delete()
      .eq('id', scanRequest.id)
    
    console.log('✅ Cleanup complete')
    
  } catch (error) {
    console.error('💥 Debug test failed:', error)
  }
}

debugEdgeFunction()