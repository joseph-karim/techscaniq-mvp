import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMinimalReport() {
  console.log('🧪 Testing Minimal Report Generation\n')
  
  try {
    // Step 1: Test with direct company info (no scan request)
    console.log('1. Testing direct report generation (no scan request)...')
    
    const { data: directResult, error: directError } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        company: {
          name: 'Vercel',
          website: 'https://vercel.com'
        },
        analysisDepth: 'shallow'  // Use shallow for speed
      }
    })
    
    if (directError) {
      console.error('❌ Direct generation failed:', directError)
    } else {
      console.log('✅ Direct generation succeeded')
      console.log('   Report ID:', directResult?.reportId)
      console.log('   Score:', directResult?.investmentScore)
      console.log('   Time:', directResult?.metadata?.processingTime, 'ms')
    }
    
    // Step 2: Check evidence collection separately
    console.log('\n2. Testing evidence collection only...')
    
    const { data: evidenceResult, error: evidenceError } = await supabase.functions.invoke('evidence-collector-v7', {
      body: {
        companyName: 'Vercel',
        companyWebsite: 'https://vercel.com',
        evidenceTypes: ['technical'],  // Just technical for speed
        depth: 'shallow'
      }
    })
    
    if (evidenceError) {
      console.error('❌ Evidence collection failed:', evidenceError)
    } else {
      console.log('✅ Evidence collection succeeded')
      console.log('   Evidence count:', evidenceResult?.evidence?.length || 0)
      console.log('   Collection ID:', evidenceResult?.collectionId)
      console.log('   Success:', evidenceResult?.success)
      
      if (evidenceResult?.evidence?.length > 0) {
        console.log('\n   Sample evidence:')
        evidenceResult.evidence.slice(0, 3).forEach((e, i) => {
          console.log(`   ${i+1}. ${e.type}: "${e.summary?.substring(0, 50)}..."`)
        })
      }
    }
    
    // Step 3: Test AI analysis separately
    console.log('\n3. Testing AI analysis (tech-intelligence-v3)...')
    
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('tech-intelligence-v3', {
      body: {
        company: {
          name: 'Vercel',
          website: 'https://vercel.com'
        },
        evidenceSummary: [
          {
            id: 'test-1',
            type: 'website_content',
            category: 'technical',
            summary: 'Vercel is a platform for frontend developers',
            source: 'https://vercel.com',
            confidence: 0.9
          }
        ],
        analysisType: 'technical_only'
      }
    })
    
    if (aiError) {
      console.error('❌ AI analysis failed:', aiError)
    } else {
      console.log('✅ AI analysis succeeded')
      console.log('   Success:', aiResult?.success)
      console.log('   Score:', aiResult?.investment_score)
    }
    
    // Step 4: Check environment
    console.log('\n4. Checking environment variables...')
    
    // Check if API keys are configured
    const { data: envCheck } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        test: true  // Special test mode
      }
    })
    
    console.log('\n✨ Test Summary:')
    console.log('- Direct generation:', directResult ? '✅' : '❌')
    console.log('- Evidence collection:', evidenceResult?.success ? '✅' : '❌')
    console.log('- AI analysis:', aiResult?.success ? '✅' : '❌')
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testMinimalReport()