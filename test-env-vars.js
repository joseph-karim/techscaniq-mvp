#!/usr/bin/env node

/**
 * Test what environment variables are available in the edge functions
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEnvironmentVariables() {
  console.log('🔧 Testing Environment Variables in Edge Functions\n')

  try {
    // Test tech-intelligence-v3 with minimal payload to see environment
    const { data: result, error } = await supabase.functions.invoke('tech-intelligence-v3', {
      body: {
        company: { name: "Test", website: "https://example.com" },
        evidenceSummary: [{
          id: '1',
          type: 'technical',
          category: 'test',
          summary: 'test evidence',
          source: 'test',
          confidence: 0.8
        }]
      }
    })

    if (error) {
      console.error('❌ Function error:', error)
    } else {
      console.log('✅ Function succeeded:', result?.success)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testEnvironmentVariables()