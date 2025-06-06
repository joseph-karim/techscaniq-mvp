import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAIChunking() {
  console.log('🧪 Testing AI Analysis Chunking\n')
  
  try {
    // Create test evidence with different categories
    const testEvidence = [
      // Technical evidence
      ...Array(15).fill(null).map((_, i) => ({
        id: `tech-${i}`,
        type: 'website_content',
        category: 'technical',
        summary: `Technical finding ${i}: Uses modern web technologies`,
        source: 'https://example.com',
        confidence: 0.8 + Math.random() * 0.2
      })),
      // Security evidence
      ...Array(10).fill(null).map((_, i) => ({
        id: `sec-${i}`,
        type: 'security_scan',
        category: 'security',
        summary: `Security finding ${i}: SSL configured properly`,
        source: 'security scan',
        confidence: 0.7 + Math.random() * 0.3
      })),
      // Market evidence
      ...Array(8).fill(null).map((_, i) => ({
        id: `market-${i}`,
        type: 'search_result',
        category: 'market',
        summary: `Market finding ${i}: Growing market presence`,
        source: 'market research',
        confidence: 0.6 + Math.random() * 0.4
      }))
    ]
    
    console.log(`Total test evidence: ${testEvidence.length} items`)
    console.log(`Categories: technical (15), security (10), market (8)`)
    
    // Test 1: Direct AI call with all evidence (should fail or be slow)
    console.log('\n1️⃣ Testing direct AI call with ALL evidence...')
    const startTime1 = Date.now()
    
    const { data: fullResult, error: fullError } = await supabase.functions.invoke('tech-intelligence-v3', {
      body: {
        company: {
          name: 'Test Company',
          website: 'https://example.com'
        },
        evidenceSummary: testEvidence,
        analysisType: 'comprehensive_report'
      }
    })
    
    const duration1 = Date.now() - startTime1
    
    if (fullError) {
      console.log(`❌ Full analysis failed (as expected): ${fullError.message}`)
    } else {
      console.log(`⚠️  Full analysis completed in ${duration1}ms`)
      console.log(`   Score: ${fullResult?.investment_score}`)
    }
    
    // Test 2: Category-focused analysis (should work)
    console.log('\n2️⃣ Testing category-focused analysis...')
    
    const categoryResults = {}
    
    for (const category of ['technical', 'security', 'market']) {
      console.log(`\n   Analyzing ${category} category...`)
      const categoryEvidence = testEvidence
        .filter(e => e.category === category)
        .slice(0, 10) // Limit to 10 items
      
      const startTime = Date.now()
      
      const { data, error } = await supabase.functions.invoke('tech-intelligence-v3', {
        body: {
          company: {
            name: 'Test Company',
            website: 'https://example.com'
          },
          evidenceSummary: categoryEvidence,
          analysisType: 'category_focused',
          focusCategory: category
        }
      })
      
      const duration = Date.now() - startTime
      
      if (error) {
        console.log(`   ❌ ${category} failed: ${error.message}`)
        categoryResults[category] = { error: error.message }
      } else {
        console.log(`   ✅ ${category} completed in ${duration}ms`)
        console.log(`      Success: ${data?.success}`)
        categoryResults[category] = { 
          success: data?.success,
          duration,
          hasData: !!data?.report_data
        }
      }
    }
    
    // Test 3: Limited evidence analysis
    console.log('\n3️⃣ Testing with limited evidence (15 items)...')
    const limitedEvidence = testEvidence
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15)
    
    const startTime3 = Date.now()
    
    const { data: limitedResult, error: limitedError } = await supabase.functions.invoke('tech-intelligence-v3', {
      body: {
        company: {
          name: 'Test Company',
          website: 'https://example.com'
        },
        evidenceSummary: limitedEvidence,
        analysisType: 'comprehensive_report'
      }
    })
    
    const duration3 = Date.now() - startTime3
    
    if (limitedError) {
      console.log(`❌ Limited analysis failed: ${limitedError.message}`)
    } else {
      console.log(`✅ Limited analysis completed in ${duration3}ms`)
      console.log(`   Score: ${limitedResult?.investment_score}`)
      console.log(`   Success: ${limitedResult?.success}`)
    }
    
    // Summary
    console.log('\n📊 CHUNKING TEST SUMMARY')
    console.log('─'.repeat(40))
    console.log('Full evidence (33 items):', fullError ? '❌ Failed' : `⚠️ ${duration1}ms`)
    console.log('Category-focused:')
    Object.entries(categoryResults).forEach(([cat, result]) => {
      console.log(`  - ${cat}:`, result.error ? '❌ Failed' : `✅ ${result.duration}ms`)
    })
    console.log('Limited evidence (15 items):', limitedError ? '❌ Failed' : `✅ ${duration3}ms`)
    
    console.log('\n💡 RECOMMENDATIONS')
    console.log('─'.repeat(40))
    console.log('1. The chunking strategy should use category-focused analysis')
    console.log('2. Each category should be limited to 10-15 evidence items')
    console.log('3. Consider implementing parallel processing for categories')
    console.log('4. Add better error handling for partial failures')
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testAIChunking()