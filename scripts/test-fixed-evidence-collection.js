#!/usr/bin/env node

/**
 * Test the fixed evidence collection and report generation
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

async function testFixedEvidenceCollection() {
  console.log('🧪 Testing fixed evidence collection and report generation...')
  
  const scanId = '98fb98ce-4d56-43af-a9a5-9eea8f33822a'
  
  try {
    // Step 1: Test evidence collection directly
    console.log('\n1️⃣ Testing evidence-collector-v7 directly...')
    
    const { data: evidenceResult, error: evidenceError } = await supabase.functions.invoke('evidence-collector-v7', {
      body: {
        companyName: 'Snowplow',
        companyWebsite: 'https://snowplow.io/',
        depth: 'comprehensive', // Use comprehensive for maximum evidence
        investmentThesis: {
          thesisType: 'accelerate-organic-growth',
          focusAreas: ['cloud-native', 'scalable-architecture'],
          criteria: [
            { name: 'Technical Excellence', weight: 30, description: 'Modern architecture and engineering practices' },
            { name: 'Scalability', weight: 25, description: 'Ability to handle growth' },
            { name: 'Market Position', weight: 20, description: 'Competitive advantage' },
            { name: 'Team Quality', weight: 15, description: 'Engineering team capabilities' },
            { name: 'Security', weight: 10, description: 'Security posture and compliance' }
          ]
        }
      }
    })

    if (evidenceError) {
      console.error('❌ Evidence collection failed:', evidenceError)
      return
    }

    if (evidenceResult.success) {
      console.log('✅ Evidence collection successful!')
      console.log(`   Evidence items: ${evidenceResult.evidence?.length || 0}`)
      console.log(`   Collection ID: ${evidenceResult.collectionId}`)
      console.log(`   Duration: ${evidenceResult.summary?.duration}ms`)
      
      if (evidenceResult.evidence && evidenceResult.evidence.length > 0) {
        console.log('   Evidence types collected:')
        const types = [...new Set(evidenceResult.evidence.map(e => e.type))]
        types.forEach(type => {
          const count = evidenceResult.evidence.filter(e => e.type === type).length
          console.log(`     ${type}: ${count} items`)
        })
        
        console.log('   Tools used:')
        const tools = [...new Set(evidenceResult.evidence.map(e => e.source.tool))]
        tools.forEach(tool => {
          console.log(`     ${tool}`)
        })
      }
    } else {
      console.error('❌ Evidence collection returned unsuccessful result:', evidenceResult)
      return
    }

    // Step 2: Test full report generation with the fixed pipeline
    console.log('\n2️⃣ Testing full report generation with fixed evidence pipeline...')
    
    // Update scan status first
    await supabase
      .from('scan_requests')
      .update({ status: 'processing' })
      .eq('id', scanId)
    
    const { data: reportResult, error: reportError } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        scan_request_id: scanId,
        analysisDepth: 'comprehensive'
      }
    })

    if (reportError) {
      console.error('❌ Report generation failed:', reportError)
      return
    }

    console.log('✅ Report generation completed!')
    console.log(`   Report ID: ${reportResult.reportId}`)

    // Step 3: Check the results
    console.log('\n3️⃣ Checking generated report quality...')
    
    // Wait a moment for the database to update
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const { data: updatedScan, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', scanId)
      .single()

    if (scanError) {
      console.error('❌ Error fetching updated scan:', scanError)
      return
    }

    console.log(`   Scan status: ${updatedScan.status}`)
    console.log(`   Report ID: ${updatedScan.report_id}`)
    console.log(`   Tech Health Score: ${updatedScan.tech_health_score}`)

    if (updatedScan.report_id) {
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', updatedScan.report_id)
        .single()

      if (reportError) {
        console.error('❌ Error fetching report:', reportError)
      } else {
        console.log('\n📊 Report Quality Check:')
        console.log(`   Investment Score: ${report.investment_score}`)
        console.log(`   Executive Summary: ${report.executive_summary?.length || 0} chars`)
        
        if (report.report_data?.sections) {
          const sections = report.report_data.sections
          console.log(`   Report sections: ${Object.keys(sections).length}`)
          
          Object.entries(sections).forEach(([key, section]) => {
            console.log(`     ${key}:`)
            console.log(`       Summary: ${section.summary?.length || 0} chars`)
            console.log(`       Findings: ${section.findings?.length || 0} items`)
            console.log(`       Recommendations: ${section.recommendations?.length || 0} items`)
          })
        }
      }
    }

    console.log('\n🎉 Test completed! Check the Snowplow scan page to see the results.')
    console.log('📋 URL: https://scan.techscaniq.com/scans/98fb98ce-4d56-43af-a9a5-9eea8f33822a')

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testFixedEvidenceCollection() 