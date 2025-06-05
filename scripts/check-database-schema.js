#!/usr/bin/env node

/**
 * Check database schema to understand table structure
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

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Get a sample scan_request to see available columns
    const { data: sampleScan, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .limit(1)
      .single()

    if (scanError) {
      console.error('❌ Error fetching sample scan:', scanError)
    } else {
      console.log('\n📋 scan_requests table columns:')
      Object.keys(sampleScan).forEach(column => {
        console.log(`   - ${column}: ${typeof sampleScan[column]}`)
      })
    }

    // Get a sample report to see available columns
    const { data: sampleReport, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .limit(1)
      .single()

    if (reportError) {
      console.error('❌ Error fetching sample report:', reportError)
    } else {
      console.log('\n📋 reports table columns:')
      Object.keys(sampleReport).forEach(column => {
        console.log(`   - ${column}: ${typeof sampleReport[column]}`)
      })
    }

    // Check the specific Snowplow scan and report
    console.log('\n🔍 Checking specific Snowplow data...')
    
    const { data: snowplowScan, error: snowplowScanError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', '98fb98ce-4d56-43af-a9a5-9eea8f33822a')
      .single()

    if (snowplowScanError) {
      console.error('❌ Error fetching Snowplow scan:', snowplowScanError)
    } else {
      console.log('\n📊 Snowplow scan data:')
      console.log(`   Company: ${snowplowScan.company_name}`)
      console.log(`   Status: ${snowplowScan.status}`)
      console.log(`   Report ID: ${snowplowScan.report_id}`)
      console.log(`   Tech Health Score: ${snowplowScan.tech_health_score}`)
      
      if (snowplowScan.report_id) {
        const { data: snowplowReport, error: snowplowReportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', snowplowScan.report_id)
          .single()

        if (snowplowReportError) {
          console.error('❌ Error fetching Snowplow report:', snowplowReportError)
        } else {
          console.log('\n📋 Snowplow report data:')
          console.log(`   Company: ${snowplowReport.company_name}`)
          console.log(`   Investment Score: ${snowplowReport.investment_score}`)
          console.log(`   Executive Summary: ${snowplowReport.executive_summary ? 'Present' : 'Missing'}`)
          console.log(`   Executive Summary Length: ${snowplowReport.executive_summary?.length || 0} chars`)
          
          // Check for any section-related fields
          Object.keys(snowplowReport).forEach(key => {
            if (key.toLowerCase().includes('section') || key.toLowerCase().includes('content')) {
              console.log(`   ${key}: ${snowplowReport[key]}`)
            }
          })
        }
      }
    }

    // Check if there are any section_content or related tables
    console.log('\n🔍 Checking for related tables...')
    
    try {
      const { data: sectionData, error: sectionError } = await supabase
        .from('section_content')
        .select('*')
        .limit(1)

      if (!sectionError && sectionData) {
        console.log('✅ Found section_content table')
        if (sectionData.length > 0) {
          console.log('📋 section_content columns:')
          Object.keys(sectionData[0]).forEach(column => {
            console.log(`   - ${column}`)
          })
        }
      }
    } catch (e) {
      console.log('⚠️ No section_content table found')
    }

    try {
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_sections')
        .select('*')
        .limit(1)

      if (!analysisError && analysisData) {
        console.log('✅ Found analysis_sections table')
        if (analysisData.length > 0) {
          console.log('📋 analysis_sections columns:')
          Object.keys(analysisData[0]).forEach(column => {
            console.log(`   - ${column}`)
          })
        }
      }
    } catch (e) {
      console.log('⚠️ No analysis_sections table found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDatabaseSchema() 