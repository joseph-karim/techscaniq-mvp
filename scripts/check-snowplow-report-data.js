#!/usr/bin/env node

/**
 * Check the actual Snowplow report data structure
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

async function checkSnowplowReportData() {
  console.log('🔍 Checking Snowplow report data structure...')
  
  try {
    // Get the current Snowplow scan
    const scanId = '98fb98ce-4d56-43af-a9a5-9eea8f33822a'
    
    const { data: scan, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      console.error('❌ Could not find scan:', scanError)
      return
    }

    console.log(`✅ Found scan: ${scan.company_name}`)
    console.log(`   Report ID: ${scan.report_id}`)
    console.log(`   Status: ${scan.status}`)

    if (!scan.report_id) {
      console.log('❌ No report ID linked to scan')
      return
    }

    // Get the linked report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', scan.report_id)
      .single()

    if (reportError || !report) {
      console.error('❌ Could not find report:', reportError)
      return
    }

    console.log(`\n📋 Report Analysis:`)
    console.log(`   ID: ${report.id}`)
    console.log(`   Company: ${report.company_name}`)
    console.log(`   Investment Score: ${report.investment_score}`)
    console.log(`   Tech Health Score: ${report.tech_health_score}`)
    console.log(`   Executive Summary Length: ${report.executive_summary?.length || 0} chars`)

    // Check report_data structure
    console.log(`\n🔍 Report Data Structure:`)
    
    if (report.report_data) {
      console.log(`   report_data type: ${typeof report.report_data}`)
      
      if (typeof report.report_data === 'object') {
        const keys = Object.keys(report.report_data)
        console.log(`   report_data keys: ${keys.join(', ')}`)
        
        // Check for sections specifically
        if (report.report_data.sections) {
          console.log(`\n📑 Sections Analysis:`)
          console.log(`   sections type: ${typeof report.report_data.sections}`)
          console.log(`   sections is array: ${Array.isArray(report.report_data.sections)}`)
          
          if (Array.isArray(report.report_data.sections)) {
            console.log(`   sections count: ${report.report_data.sections.length}`)
            report.report_data.sections.forEach((section, idx) => {
              console.log(`   Section ${idx + 1}: ${section.title || 'Untitled'}`)
              console.log(`     Content length: ${section.content?.length || 0} chars`)
            })
          } else if (typeof report.report_data.sections === 'object') {
            const sectionKeys = Object.keys(report.report_data.sections)
            console.log(`   sections object keys: ${sectionKeys.join(', ')}`)
            
            sectionKeys.forEach(key => {
              const section = report.report_data.sections[key]
              console.log(`   ${key}:`)
              console.log(`     title: ${section.title || 'Missing'}`)
              console.log(`     summary length: ${section.summary?.length || 0} chars`)
              console.log(`     findings count: ${section.findings?.length || 0}`)
            })
          }
        } else {
          console.log(`   ❌ No 'sections' field in report_data`)
        }

        // Show all top-level keys and their types
        console.log(`\n📊 All report_data fields:`)
        Object.entries(report.report_data).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              console.log(`   ${key}: array (${value.length} items)`)
            } else {
              console.log(`   ${key}: object (${Object.keys(value).length} keys)`)
            }
          } else {
            console.log(`   ${key}: ${typeof value} (${value?.toString().substring(0, 50) || 'null'})`)
          }
        })

      } else {
        console.log(`   ❌ report_data is not an object: ${report.report_data}`)
      }
    } else {
      console.log(`   ❌ No report_data field`)
    }

    // Check scan sections
    console.log(`\n🔍 Scan Sections:`)
    if (scan.sections) {
      console.log(`   scan sections type: ${typeof scan.sections}`)
      console.log(`   scan sections is array: ${Array.isArray(scan.sections)}`)
      
      if (Array.isArray(scan.sections)) {
        console.log(`   scan sections count: ${scan.sections.length}`)
      } else if (typeof scan.sections === 'object') {
        console.log(`   scan sections keys: ${Object.keys(scan.sections).join(', ')}`)
      }
    } else {
      console.log(`   ❌ No sections field in scan`)
    }

    // Compare with a working report (Ring4 for example)
    console.log(`\n🔍 Comparing with working reports...`)
    
    const { data: workingReports, error: workingError } = await supabase
      .from('reports')
      .select('id, company_name, report_data')
      .not('report_data', 'is', null)
      .limit(5)

    if (workingError) {
      console.error('❌ Error fetching working reports:', workingError)
    } else {
      console.log(`   Found ${workingReports.length} reports with report_data`)
      
      workingReports.forEach(r => {
        console.log(`\n   ${r.company_name} (${r.id}):`)
        if (r.report_data?.sections) {
          console.log(`     Has sections: ${Array.isArray(r.report_data.sections) ? 'array' : 'object'}`)
          if (Array.isArray(r.report_data.sections)) {
            console.log(`     Section count: ${r.report_data.sections.length}`)
          } else {
            console.log(`     Section keys: ${Object.keys(r.report_data.sections).join(', ')}`)
          }
        } else {
          console.log(`     No sections field`)
        }
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkSnowplowReportData() 