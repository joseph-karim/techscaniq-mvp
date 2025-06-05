#!/usr/bin/env node

/**
 * Check for Snowplow scan data in the database
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

async function checkSnowplowData() {
  console.log('🔍 Checking for Snowplow scan data...')

  try {
    // 1. Check scan_requests for Snowplow
    console.log('\n📋 Scan Requests:')
    const { data: scanRequests, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .order('created_at', { ascending: false })

    if (scanError) {
      console.error('Error fetching scan requests:', scanError)
    } else {
      console.log(`Found ${scanRequests?.length || 0} scan requests for Snowplow`)
      scanRequests?.forEach(scan => {
        console.log(`  - ID: ${scan.id}`)
        console.log(`  - Company: ${scan.company_name}`)
        console.log(`  - Status: ${scan.status}`)
        console.log(`  - Created: ${scan.created_at}`)
        console.log(`  - Report ID: ${scan.report_id || 'None'}`)
        console.log('  ---')
      })
    }

    // 2. Check reports table for Snowplow
    console.log('\n📊 Reports:')
    const { data: reports, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .order('created_at', { ascending: false })

    if (reportError) {
      console.error('Error fetching reports:', reportError)
    } else {
      console.log(`Found ${reports?.length || 0} reports for Snowplow`)
      reports?.forEach(report => {
        console.log(`  - ID: ${report.id}`)
        console.log(`  - Company: ${report.company_name}`)
        console.log(`  - Scan Request ID: ${report.scan_request_id || 'None'}`)
        console.log(`  - Investment Score: ${report.investment_score || 'None'}`)
        console.log(`  - Created: ${report.created_at}`)
        console.log('  ---')
      })
    }

    // 3. Check evidence collections
    console.log('\n🔬 Evidence Collections:')
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_collections')
      .select('*')
      .ilike('company_name', '%snowplow%')
      .order('created_at', { ascending: false })

    if (evidenceError) {
      console.error('Error fetching evidence:', evidenceError)
    } else {
      console.log(`Found ${evidence?.length || 0} evidence collections for Snowplow`)
      evidence?.forEach(collection => {
        console.log(`  - ID: ${collection.id}`)
        console.log(`  - Company: ${collection.company_name}`)
        console.log(`  - Status: ${collection.status}`)
        console.log(`  - Items Count: ${collection.total_items || 0}`)
        console.log(`  - Created: ${collection.created_at}`)
        console.log('  ---')
      })
    }

    // 4. Check evidence items
    console.log('\n📝 Evidence Items:')
    const { data: evidenceItems, error: itemsError } = await supabase
      .from('evidence_items')
      .select('id, type, source_url, created_at, evidence_collection_id')
      .order('created_at', { ascending: false })
      .limit(20)

    if (itemsError) {
      console.error('Error fetching evidence items:', itemsError)
    } else {
      console.log(`Found ${evidenceItems?.length || 0} recent evidence items (showing last 20)`)
      evidenceItems?.forEach(item => {
        console.log(`  - ID: ${item.id}`)
        console.log(`  - Type: ${item.type}`)
        console.log(`  - Source: ${item.source_url || 'No URL'}`)
        console.log(`  - Collection ID: ${item.evidence_collection_id || 'None'}`)
        console.log(`  - Created: ${item.created_at}`)
        console.log('  ---')
      })
    }

    // 5. Check edge function logs for recent activity
    console.log('\n⚡ Recent Edge Function Activity:')
    const { data: logs, error: logsError } = await supabase
      .from('edge_function_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (logsError) {
      console.error('Error fetching logs:', logsError)
    } else {
      console.log(`Found ${logs?.length || 0} recent function executions`)
      logs?.forEach(log => {
        console.log(`  - Function: ${log.function_name}`)
        console.log(`  - Status: ${log.status}`)
        console.log(`  - Duration: ${log.duration_ms || 'N/A'}ms`)
        console.log(`  - Created: ${log.created_at}`)
        console.log('  ---')
      })
    }

    // 6. Check for any scan requests with issues
    console.log('\n🚨 Scan Requests with Issues:')
    const { data: problemScans, error: problemError } = await supabase
      .from('scan_requests')
      .select('*')
      .in('status', ['error', 'failed', 'processing'])
      .order('created_at', { ascending: false })
      .limit(5)

    if (problemError) {
      console.error('Error fetching problem scans:', problemError)
    } else {
      console.log(`Found ${problemScans?.length || 0} scans with potential issues`)
      problemScans?.forEach(scan => {
        console.log(`  - ID: ${scan.id}`)
        console.log(`  - Company: ${scan.company_name}`)
        console.log(`  - Status: ${scan.status}`)
        console.log(`  - Created: ${scan.created_at}`)
        console.log('  ---')
      })
    }

  } catch (error) {
    console.error('❌ Error checking data:', error)
  }
}

checkSnowplowData()