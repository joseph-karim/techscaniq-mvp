#!/usr/bin/env node

/**
 * Test scan submission and visibility
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testScanSubmission() {
  console.log('🧪 Testing Scan Submission and Visibility\n')

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ No authenticated user found. Please log in first.')
      return
    }
    
    console.log(`✅ Authenticated as: ${user.email}`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Role: ${user.user_metadata?.role || 'user'}`)
    
    // Create a test scan request
    console.log('\n1️⃣ Creating test scan request...')
    const testScan = {
      company_name: 'Test Company ' + new Date().toISOString(),
      website_url: 'https://example.com',
      company_description: 'Test scan for debugging',
      requested_by: user.id,
      requestor_name: user.email,
      organization_name: 'Test Organization',
      status: 'pending',
      sections: [],
      risks: [],
      thesis_tags: ['test'],
      primary_criteria: 'Test criteria'
    }
    
    const { data: newScan, error: createError } = await supabase
      .from('scan_requests')
      .insert(testScan)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating scan:', createError)
      return
    }
    
    console.log(`✅ Created scan: ${newScan.id}`)
    console.log(`   Company: ${newScan.company_name}`)
    
    // Now fetch all scans for this user
    console.log('\n2️⃣ Fetching user scans...')
    const { data: userScans, error: fetchError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('requested_by', user.id)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Error fetching scans:', fetchError)
    } else {
      console.log(`✅ Found ${userScans.length} scans for user`)
      userScans.slice(0, 3).forEach(scan => {
        console.log(`   - ${scan.company_name} (${scan.status}) - ${scan.created_at}`)
      })
    }
    
    // Test with join query (like reports-list)
    console.log('\n3️⃣ Testing with reports join...')
    const { data: scansWithReports, error: joinError } = await supabase
      .from('scan_requests')
      .select('*, reports!reports_scan_request_id_fkey (*)')
      .eq('requested_by', user.id)
      .order('created_at', { ascending: false })
    
    if (joinError) {
      console.error('❌ Error with join query:', joinError)
    } else {
      console.log(`✅ Join query successful, found ${scansWithReports.length} scans`)
    }
    
    // Clean up test data
    console.log('\n4️⃣ Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('scan_requests')
      .delete()
      .eq('id', newScan.id)
    
    if (deleteError) {
      console.error('❌ Error deleting test scan:', deleteError)
    } else {
      console.log('✅ Test scan deleted')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testScanSubmission()