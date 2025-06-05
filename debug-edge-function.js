#!/usr/bin/env node

/**
 * Debug script to test edge function connectivity and authentication
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Debug Edge Function Connectivity\n')
console.log('Supabase URL:', supabaseUrl)
console.log('Key (first 10 chars):', supabaseKey?.substring(0, 10) + '...')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEdgeFunctions() {
  try {
    // Test simple function first
    console.log('\n🧪 Testing html-collector function...')
    
    const { data: htmlResult, error: htmlError } = await supabase.functions.invoke('html-collector', {
      body: {
        url: 'https://example.com',
        options: { timeout: 5000 }
      }
    })

    if (htmlError) {
      console.error('❌ HTML Collector Error:', htmlError)
    } else {
      console.log('✅ HTML Collector Success:', htmlResult?.success)
    }

    // Test report orchestrator with minimal payload
    console.log('\n🧪 Testing report-orchestrator-v3 function...')
    
    const { data: reportResult, error: reportError } = await supabase.functions.invoke('report-orchestrator-v3', {
      body: {
        company: {
          name: "Test Company Debug",
          website: "https://example.com"
        },
        analysisDepth: "shallow"
      }
    })

    if (reportError) {
      console.error('❌ Report Orchestrator Error:', reportError)
      console.error('Error details:', JSON.stringify(reportError, null, 2))
    } else {
      console.log('✅ Report Orchestrator Success:', !!reportResult?.reportId)
      console.log('Report ID:', reportResult?.reportId)
    }

    // Test evidence collection
    console.log('\n🧪 Testing evidence-orchestrator function...')
    
    const { data: evidenceResult, error: evidenceError } = await supabase.functions.invoke('evidence-orchestrator', {
      body: {
        companyName: "Test Company",
        companyWebsite: "https://example.com",
        evidenceTypes: ['technical'],
        depth: 'shallow'
      }
    })

    if (evidenceError) {
      console.error('❌ Evidence Orchestrator Error:', evidenceError)
    } else {
      console.log('✅ Evidence Orchestrator Success:', evidenceResult?.success)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function checkDatabaseAccess() {
  console.log('\n🔍 Testing Database Access...')
  
  try {
    // Test reading scan requests
    const { data: scans, error: scansError } = await supabase
      .from('scan_requests')
      .select('id, company_name, status')
      .limit(1)

    if (scansError) {
      console.error('❌ Database read error:', scansError)
    } else {
      console.log('✅ Database read success, found', scans?.length, 'scans')
    }

    // Test reading reports
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('id, company_name')
      .limit(1)

    if (reportsError) {
      console.error('❌ Reports read error:', reportsError)
    } else {
      console.log('✅ Reports read success, found', reports?.length, 'reports')
    }

  } catch (error) {
    console.error('❌ Database test failed:', error)
  }
}

async function main() {
  await checkDatabaseAccess()
  await testEdgeFunctions()
  
  console.log('\n🎯 Debug Summary:')
  console.log('- Check if all edge functions are properly deployed')
  console.log('- Verify environment variables are set correctly')
  console.log('- Ensure RLS policies allow service role access')
  console.log('- Test with simpler payloads to isolate issues')
}

main()