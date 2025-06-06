import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Environment check:')
console.log('SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
console.log('ANON_KEY:', supabaseKey ? '✓ Set' : '✗ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('\nPlease set environment variables in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPipeline() {
  console.log('\n🚀 Testing TechScanIQ Pipeline\n')
  
  try {
    // Test 1: Database connection
    console.log('1. Testing database connection...')
    const { data: testQuery, error: dbError } = await supabase
      .from('scan_requests')
      .select('id')
      .limit(1)
    
    if (dbError) {
      console.error('❌ Database connection failed:', dbError.message)
      return
    }
    console.log('✅ Database connected')
    
    // Test 2: Check existing reports
    console.log('\n2. Checking existing reports...')
    const { data: reports, error: reportError } = await supabase
      .from('reports')
      .select('id, company_name, investment_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (reportError) {
      console.error('❌ Failed to fetch reports:', reportError.message)
    } else {
      console.log(`✅ Found ${reports.length} reports`)
      reports.forEach(r => {
        console.log(`   - ${r.company_name}: Score ${r.investment_score} (${new Date(r.created_at).toLocaleDateString()})`)
      })
    }
    
    // Test 3: Check edge function availability
    console.log('\n3. Testing edge function (report-orchestrator-v3)...')
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/report-orchestrator-v3`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST'
        }
      })
      
      if (response.ok) {
        console.log('✅ Edge function is accessible')
        console.log('   CORS headers:', response.headers.get('access-control-allow-origin'))
      } else {
        console.log('❌ Edge function returned:', response.status)
      }
    } catch (fetchError) {
      console.error('❌ Edge function test failed:', fetchError.message)
    }
    
    // Test 4: Create a minimal scan request
    console.log('\n4. Creating test scan request...')
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: 'Pipeline Test Company',
        website_url: 'https://example.com',
        status: 'pending',
        requestor_name: 'Test Script',
        organization_name: 'Test Org',
        thesis_tags: ['test'],
        primary_criteria: 'Test criteria',
        sections: [],
        risks: []
      })
      .select()
      .single()
    
    if (scanError) {
      console.error('❌ Failed to create scan request:', scanError.message)
      return
    }
    
    console.log('✅ Created scan request:', scanRequest.id)
    
    // Test 5: Trigger report generation
    console.log('\n5. Triggering report generation...')
    console.log('   Calling report-orchestrator-v3...')
    
    const { data: reportResult, error: reportError2 } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        scan_request_id: scanRequest.id,
        analysisDepth: 'shallow'  // Use shallow for faster test
      }
    })
    
    if (reportError2) {
      console.error('❌ Report generation failed:', reportError2)
      
      // Check scan status
      const { data: updatedScan } = await supabase
        .from('scan_requests')
        .select('status')
        .eq('id', scanRequest.id)
        .single()
      
      console.log('   Scan status:', updatedScan?.status)
    } else {
      console.log('✅ Report generation completed')
      console.log('   Report ID:', reportResult?.reportId)
      console.log('   Investment Score:', reportResult?.investmentScore)
    }
    
    // Cleanup
    console.log('\n6. Cleaning up...')
    await supabase
      .from('scan_requests')
      .delete()
      .eq('id', scanRequest.id)
    
    console.log('✅ Test data cleaned up')
    
    console.log('\n✨ Pipeline test completed!')
    
  } catch (error) {
    console.error('\n💥 Test failed:', error)
  }
}

testPipeline()