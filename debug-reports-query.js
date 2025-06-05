#!/usr/bin/env node

/**
 * Debug script to test reports query issue
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugReportsQuery() {
  console.log('🔍 Debugging Reports Query\n')

  try {
    // First, check if we can query scan_requests alone
    console.log('1️⃣ Testing scan_requests query:')
    const { data: scans, error: scansError } = await supabase
      .from('scan_requests')
      .select('*')
      .limit(5)

    if (scansError) {
      console.error('❌ Error querying scan_requests:', scansError)
    } else {
      console.log(`✅ Found ${scans?.length || 0} scan requests`)
    }

    // Next, test querying reports alone
    console.log('\n2️⃣ Testing reports query:')
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .limit(5)

    if (reportsError) {
      console.error('❌ Error querying reports:', reportsError)
    } else {
      console.log(`✅ Found ${reports?.length || 0} reports`)
    }

    // Test the join query that's failing
    console.log('\n3️⃣ Testing scan_requests with reports join:')
    const { data: joinData, error: joinError } = await supabase
      .from('scan_requests')
      .select('*, reports (*)')
      .limit(5)

    if (joinError) {
      console.error('❌ Error with join query:', joinError)
      console.error('Error details:', JSON.stringify(joinError, null, 2))
    } else {
      console.log(`✅ Join query successful, found ${joinData?.length || 0} results`)
      joinData?.forEach(scan => {
        console.log(`   - ${scan.company_name}: ${scan.reports?.length || 0} reports`)
      })
    }

    // Try alternative query using scan_request_id
    console.log('\n4️⃣ Testing alternative join approach:')
    const { data: altJoinData, error: altJoinError } = await supabase
      .from('scan_requests')
      .select(`
        *,
        reports!scan_request_id (
          id,
          executive_summary,
          investment_score,
          tech_health_score,
          tech_health_grade
        )
      `)
      .limit(5)

    if (altJoinError) {
      console.error('❌ Error with alternative join:', altJoinError)
    } else {
      console.log(`✅ Alternative join successful, found ${altJoinData?.length || 0} results`)
    }

    // Test the fixed query that we're using in reports-list
    console.log('\n5️⃣ Testing fixed reports-list query:')
    const { data: fixedData, error: fixedError } = await supabase
      .from('scan_requests')
      .select('*, reports!reports_scan_request_id_fkey (*)')
      .limit(5)

    if (fixedError) {
      console.error('❌ Error with fixed query:', fixedError)
    } else {
      console.log(`✅ Fixed query successful, found ${fixedData?.length || 0} results`)
      fixedData?.forEach(scan => {
        console.log(`   - ${scan.company_name}: ${scan.reports?.length || 0} reports`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugReportsQuery()