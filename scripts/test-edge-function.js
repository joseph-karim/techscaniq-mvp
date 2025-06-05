#!/usr/bin/env node

/**
 * Test the edge function with detailed error logging
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

async function testEdgeFunction() {
  console.log('🧪 Testing report-orchestrator-v3 edge function...')

  try {
    const { data, error } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        company: {
          name: 'Snowplow',
          website: 'https://snowplow.io'
        },
        analysisDepth: 'shallow',  // Use shallow for faster testing
        investorProfile: {
          firmName: 'Test Firm',
          website: 'https://test.com'
        }
      }
    })

    if (error) {
      console.error('❌ Edge function error:')
      console.error('  Status:', error.context?.status)
      console.error('  Status Text:', error.context?.statusText)
      
      // Try to get the response body
      try {
        const responseText = await error.context?.text()
        console.error('  Response Body:', responseText)
      } catch (e) {
        console.error('  Could not read response body')
      }
      
      console.error('  Full error:', error)
    } else {
      console.log('✅ Edge function succeeded!')
      console.log('  Response:', JSON.stringify(data, null, 2).substring(0, 1000) + '...')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Also test a simpler function to see if the issue is specific
async function testSimpleFunction() {
  console.log('\n🧪 Testing evidence-orchestrator function...')
  
  try {
    const { data, error } = await supabase.functions.invoke('evidence-orchestrator', {
      body: {
        companyName: 'Snowplow',
        companyWebsite: 'https://snowplow.io',
        depth: 'shallow'
      }
    })

    if (error) {
      console.error('❌ Evidence orchestrator error:')
      console.error('  Status:', error.context?.status)
      
      try {
        const responseText = await error.context?.text()
        console.error('  Response Body:', responseText)
      } catch (e) {
        console.error('  Could not read response body')
      }
    } else {
      console.log('✅ Evidence orchestrator succeeded!')
      console.log('  Response:', JSON.stringify(data, null, 2).substring(0, 500) + '...')
    }

  } catch (error) {
    console.error('❌ Evidence orchestrator test failed:', error)
  }
}

async function main() {
  await testEdgeFunction()
  await testSimpleFunction()
}

main()