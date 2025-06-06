import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAPIKeys() {
  console.log('🔐 Testing API Key Access in Edge Functions\n')
  
  // Test 1: Direct API key test
  console.log('1. Testing if edge functions can access API keys...')
  
  const { data: testResult, error: testError } = await supabase.functions.invoke('tech-intelligence-v3', {
    body: {
      test: 'api-keys'  // Special test mode
    }
  })
  
  if (testError) {
    console.error('❌ Function error:', testError)
  } else {
    console.log('Function response:', testResult)
  }
  
  // Test 2: Try a real analysis with minimal data
  console.log('\n2. Testing real API call with minimal data...')
  
  const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('tech-intelligence-v3', {
    body: {
      company: {
        name: 'Test Company',
        website: 'https://example.com'
      },
      evidenceSummary: [{
        id: 'test-1',
        type: 'website',
        category: 'technical',
        summary: 'Test company website with modern stack',
        source: 'https://example.com',
        confidence: 0.9
      }],
      analysisType: 'quick_assessment'
    }
  })
  
  if (analysisError) {
    console.error('❌ Analysis error:', analysisError)
  } else {
    console.log('✅ Analysis successful!')
    console.log('   Has report data:', !!analysisResult.report_data)
    console.log('   Investment score:', analysisResult.investment_score)
    
    // Check if we got real analysis or fallback
    if (analysisResult.report_data?.companyInfo?.founded === 'Unknown') {
      console.log('⚠️  Got fallback report - API might not be working')
    } else {
      console.log('✅ Got real AI analysis!')
    }
  }
  
  // Test 3: Check Google API
  console.log('\n3. Testing Google API access...')
  
  const { data: googleResult, error: googleError } = await supabase.functions.invoke('google-search-collector', {
    body: {
      query: 'test query',
      maxResults: 1
    }
  })
  
  if (googleError) {
    console.error('❌ Google API error:', googleError)
  } else {
    console.log('✅ Google API working:', googleResult.success)
  }
}

testAPIKeys()
