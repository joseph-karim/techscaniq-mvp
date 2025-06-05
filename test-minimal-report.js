#!/usr/bin/env node

/**
 * Test minimal report generation to isolate the issue
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testReportComponents() {
  console.log('🧪 Testing Report Generation Components\n')

  try {
    // Test 1: Evidence collection only
    console.log('1️⃣ Testing evidence collection...')
    const { data: evidenceResult, error: evidenceError } = await supabase.functions.invoke('evidence-orchestrator', {
      body: {
        companyName: "Example Company",
        companyWebsite: "https://example.com",
        evidenceTypes: ['technical'],
        depth: 'shallow'
      }
    })

    if (evidenceError) {
      console.error('❌ Evidence collection failed:', evidenceError.message)
      return
    } else {
      console.log('✅ Evidence collection succeeded')
      console.log(`   - Evidence count: ${evidenceResult?.evidence?.length || 0}`)
      console.log(`   - Collection ID: ${evidenceResult?.collectionId}`)
    }

    // Test 2: Tech intelligence analysis
    console.log('\n2️⃣ Testing tech intelligence...')
    const { data: intelligenceResult, error: intelligenceError } = await supabase.functions.invoke('tech-intelligence-v3', {
      body: {
        company: { name: "Example Company", website: "https://example.com" },
        evidenceSummary: evidenceResult?.evidence?.slice(0, 5).map(e => ({
          id: e.id,
          type: e.type,
          category: 'technical',
          summary: e.content?.summary || 'Test evidence',
          confidence: 0.8
        })) || [],
        analysisType: 'comprehensive_report'
      }
    })

    if (intelligenceError) {
      console.error('❌ Tech intelligence failed:', intelligenceError.message)
    } else {
      console.log('✅ Tech intelligence succeeded')
      console.log(`   - Report generated: ${!!intelligenceResult?.report_data}`)
    }

    // Test 3: Create a manual report in database
    console.log('\n3️⃣ Testing direct database report insert...')
    
    const { data: reportRecord, error: reportError } = await supabase
      .from('reports')
      .insert({
        company_name: 'Test Manual Insert',
        report_data: {
          sections: {},
          company_name: 'Test Company',
          investment_score: 75,
          executiveSummary: 'Test report created manually'
        },
        executive_summary: 'Test report for debugging',
        investment_score: 75,
        investment_rationale: 'Good technical foundation',
        tech_health_score: 7.5,
        tech_health_grade: 'B',
        evidence_collection_id: evidenceResult?.collectionId,
        metadata: { test: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (reportError) {
      console.error('❌ Direct database insert failed:', reportError)
      console.error('   Error details:', reportError.message)
    } else {
      console.log('✅ Direct database insert succeeded')
      console.log(`   - Report ID: ${reportRecord.id}`)
      
      // Clean up
      await supabase.from('reports').delete().eq('id', reportRecord.id)
      console.log('   - Cleaned up test record')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testReportComponents()