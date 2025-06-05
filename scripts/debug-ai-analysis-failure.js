#!/usr/bin/env node

/**
 * Debug why AI analysis is failing in the report generation pipeline
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

async function debugAIAnalysisFailure() {
  console.log('🔍 Debugging AI analysis failure...')
  
  try {
    // Step 1: Check environment variables for AI services
    console.log('\n1️⃣ Checking AI service configurations...')
    
    const envVars = {
      'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY ? 'Present' : 'Missing',
      'GOOGLE_API_KEY': process.env.GOOGLE_API_KEY ? 'Present' : 'Missing',
      'OPENAI_API_KEY': process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
      'PERPLEXITY_API_KEY': process.env.PERPLEXITY_API_KEY ? 'Present' : 'Missing'
    }
    
    console.log('Environment variables:')
    Object.entries(envVars).forEach(([key, status]) => {
      console.log(`   ${key}: ${status}`)
    })
    
    // Step 2: Test evidence collection for Snowplow
    console.log('\n2️⃣ Testing evidence collection...')
    
    try {
      const { data: evidenceResult, error: evidenceError } = await supabase.functions.invoke('evidence-orchestrator', {
        body: {
          companyName: 'Snowplow',
          companyWebsite: 'https://snowplow.io/',
          evidenceTypes: ['technical', 'security', 'team'],
          depth: 'shallow' // Use shallow for quick test
        }
      })

      if (evidenceError) {
        console.error('❌ Evidence collection failed:', evidenceError)
      } else {
        console.log('✅ Evidence collection successful')
        console.log(`   Evidence items: ${evidenceResult.evidence?.length || 0}`)
        console.log(`   Collection ID: ${evidenceResult.collectionId}`)
        
        if (evidenceResult.evidence && evidenceResult.evidence.length > 0) {
          console.log('   Sample evidence types:')
          const types = [...new Set(evidenceResult.evidence.map(e => e.type))]
          types.forEach(type => {
            const count = evidenceResult.evidence.filter(e => e.type === type).length
            console.log(`     ${type}: ${count} items`)
          })
        }
      }
    } catch (evidenceTestError) {
      console.error('❌ Evidence test error:', evidenceTestError.message)
    }
    
    // Step 3: Test tech-intelligence-v3 directly
    console.log('\n3️⃣ Testing tech-intelligence-v3 directly...')
    
    // Create minimal test evidence for analysis
    const testEvidence = [
      {
        id: 'test-1',
        type: 'technical',
        category: 'technology',
        summary: 'Snowplow is a behavioral data platform that tracks user interactions across web and mobile applications.',
        source: 'https://snowplow.io/',
        confidence: 0.9
      },
      {
        id: 'test-2',
        type: 'technical',
        category: 'infrastructure',
        summary: 'The platform uses real-time data streaming and can process billions of events.',
        source: 'company website',
        confidence: 0.8
      }
    ]
    
    const testCompany = {
      name: 'Snowplow',
      website: 'https://snowplow.io/'
    }
    
    try {
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('tech-intelligence-v3', {
        body: {
          company: testCompany,
          evidenceSummary: testEvidence,
          analysisType: 'comprehensive_report',
          evidenceCollectionId: 'test-collection'
        }
      })

      if (analysisError) {
        console.error('❌ Tech intelligence analysis failed:', analysisError)
        console.error('Error details:', JSON.stringify(analysisError, null, 2))
      } else if (analysisResult.success) {
        console.log('✅ Tech intelligence analysis successful')
        console.log(`   Report data keys: ${Object.keys(analysisResult.report_data || {}).join(', ')}`)
        
        // Check if sections have content
        if (analysisResult.report_data?.technologyOverview) {
          console.log(`   Technology overview: ${analysisResult.report_data.technologyOverview.summary?.length || 0} chars`)
        }
        if (analysisResult.report_data?.investmentRecommendation) {
          console.log(`   Investment score: ${analysisResult.report_data.investmentRecommendation.score}`)
        }
      } else {
        console.error('❌ Tech intelligence returned unsuccessful result:', analysisResult)
      }
    } catch (analysisTestError) {
      console.error('❌ Tech intelligence test error:', analysisTestError.message)
    }
    
    // Step 4: Check function logs for errors
    console.log('\n4️⃣ Checking recent function logs...')
    
    try {
      const { data: logs, error: logsError } = await supabase
        .from('logs')
        .select('*')
        .in('function_name', ['report-orchestrator-v3', 'tech-intelligence-v3', 'evidence-orchestrator'])
        .eq('level', 'error')
        .order('created_at', { ascending: false })
        .limit(10)

      if (logsError) {
        console.error('❌ Error fetching logs:', logsError)
      } else {
        console.log(`Found ${logs.length} recent error logs:`)
        logs.forEach((log, i) => {
          console.log(`\n   Error ${i + 1}:`)
          console.log(`     Function: ${log.function_name}`)
          console.log(`     Message: ${log.message}`)
          console.log(`     Time: ${log.created_at}`)
          if (log.details) {
            console.log(`     Details: ${JSON.stringify(log.details, null, 2)}`)
          }
        })
      }
    } catch (logsError) {
      console.error('❌ Logs check error:', logsError.message)
    }
    
    // Step 5: Test rate limiting by checking API response times
    console.log('\n5️⃣ Testing API availability...')
    
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log('Testing Anthropic API...')
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 100,
            messages: [{
              role: 'user',
              content: 'Test message'
            }]
          })
        })
        
        if (anthropicResponse.ok) {
          console.log('✅ Anthropic API accessible')
        } else {
          const errorText = await anthropicResponse.text()
          console.log(`❌ Anthropic API error: ${anthropicResponse.status} - ${errorText}`)
        }
      } catch (anthropicError) {
        console.error('❌ Anthropic API test failed:', anthropicError.message)
      }
    }
    
    if (process.env.GOOGLE_API_KEY) {
      try {
        console.log('Testing Google API...')
        const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Test message'
              }]
            }]
          })
        })
        
        if (googleResponse.ok) {
          console.log('✅ Google API accessible')
        } else {
          const errorText = await googleResponse.text()
          console.log(`❌ Google API error: ${googleResponse.status} - ${errorText}`)
        }
      } catch (googleError) {
        console.error('❌ Google API test failed:', googleError.message)
      }
    }
    
    console.log('\n📋 Summary and Next Steps:')
    console.log('1. Check API key configurations above')
    console.log('2. Review function error logs for specific failures')
    console.log('3. Test individual function components')
    console.log('4. Verify rate limiting isn\'t blocking requests')
    console.log('5. Check if prompts are too large for API context limits')

  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

debugAIAnalysisFailure() 