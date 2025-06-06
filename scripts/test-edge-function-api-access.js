#!/usr/bin/env node

/**
 * Test if Edge Functions can properly access API keys from Supabase secrets
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

async function testEdgeFunctionAPIAccess() {
  console.log('🧪 Testing Edge Function API access...')
  
  try {
    // Test tech-intelligence-v3 directly with minimal data to check API access
    console.log('\n1️⃣ Testing tech-intelligence-v3 API access...')
    
    const { data: result, error } = await supabase.functions.invoke('tech-intelligence-v3', {
      body: {
        company: {
          name: 'TestCo',
          website: 'https://example.com'
        },
        evidenceSummary: [
          {
            id: 'test-1',
            type: 'test',
            category: 'technology',
            summary: 'Test evidence item',
            source: 'test',
            confidence: 0.9
          }
        ],
        analysisType: 'comprehensive_report',
        evidenceCollectionId: 'test-collection'
      }
    })

    if (error) {
      console.error('❌ Function invocation error:', error)
      
      // Check if it's an API key issue
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        console.error('🔑 This looks like an API key access issue')
      } else if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        console.error('⏱️ This looks like a rate limiting issue')
      } else {
        console.error('🤔 Unknown function error')
      }
    } else {
      if (result.success) {
        console.log('✅ tech-intelligence-v3 function executed successfully!')
        console.log(`   Has report data: ${!!result.report_data}`)
        
        if (result.report_data) {
          console.log(`   Report data keys: ${Object.keys(result.report_data).join(', ')}`)
          
          // Check if sections have actual content
          if (result.report_data.technologyOverview) {
            console.log(`   Technology overview length: ${result.report_data.technologyOverview.summary?.length || 0} chars`)
          }
        }
      } else {
        console.error('❌ Function returned unsuccessful:', result.error)
      }
    }

    // Test a simpler function that also uses API keys
    console.log('\n2️⃣ Testing google-search-collector...')
    
    const { data: searchResult, error: searchError } = await supabase.functions.invoke('google-search-collector', {
      body: {
        query: 'test query',
        companyName: 'TestCo',
        companyWebsite: 'https://example.com',
        searchType: 'general',
        maxResults: 1
      }
    })

    if (searchError) {
      console.error('❌ Google search function error:', searchError)
    } else {
      if (searchResult.success) {
        console.log('✅ Google search function executed successfully!')
        console.log(`   Results count: ${searchResult.results?.length || 0}`)
      } else {
        console.error('❌ Google search returned unsuccessful:', searchResult.error)
      }
    }

    // Test evidence collection to see where things might be failing
    console.log('\n3️⃣ Testing evidence-collector-v7 again with detailed logging...')
    
    const { data: evidenceResult, error: evidenceError } = await supabase.functions.invoke('evidence-collector-v7', {
      body: {
        companyName: 'TestCo',
        companyWebsite: 'https://httpbin.org/', // Use a reliable test site
        depth: 'shallow', // Use shallow to minimize API calls
        evidenceTypes: ['technical', 'security']
      }
    })

    if (evidenceError) {
      console.error('❌ Evidence collection error:', evidenceError)
    } else {
      if (evidenceResult.success) {
        console.log('✅ Evidence collection executed successfully!')
        console.log(`   Evidence items: ${evidenceResult.evidence?.length || 0}`)
        console.log(`   Duration: ${evidenceResult.summary?.duration}ms`)
        
        if (evidenceResult.summary?.errors?.length > 0) {
          console.log('⚠️ Evidence collection had errors:')
          evidenceResult.summary.errors.forEach(error => {
            console.log(`     ${error}`)
          })
        }
      } else {
        console.error('❌ Evidence collection returned unsuccessful:', evidenceResult.error)
      }
    }

    console.log('\n📋 Analysis:')
    console.log('If functions are executing but returning empty content, the issue might be:')
    console.log('1. API rate limiting causing fallbacks to empty responses')
    console.log('2. Prompt size exceeding API context limits')
    console.log('3. API model configuration issues (wrong model names)')
    console.log('4. Network timeouts causing incomplete responses')

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testEdgeFunctionAPIAccess() 