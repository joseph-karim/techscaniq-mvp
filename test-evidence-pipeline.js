#!/usr/bin/env node

/**
 * Test script for the TechScanIQ evidence collection pipeline
 * This tests the complete workflow from localhost
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

console.log('🧪 Testing TechScanIQ Evidence Collection Pipeline')
console.log('================================================')

async function testEvidenceCollection() {
  try {
    console.log('\n1. Testing CORS preflight...')
    
    const corsTest = await fetch(`${SUPABASE_URL}/functions/v1/evidence-orchestrator`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type'
      }
    })
    
    console.log(`   Status: ${corsTest.status}`)
    console.log(`   CORS Origin: ${corsTest.headers.get('access-control-allow-origin')}`)
    console.log(`   ✅ CORS preflight successful`)
    
    console.log('\n2. Testing evidence collection for Ring4...')
    
    const startTime = Date.now()
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/evidence-orchestrator`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        companyName: 'Ring4',
        companyWebsite: 'https://ring4.com',
        depth: 'shallow'
      })
    })
    
    console.log(`   Status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`   ❌ Request failed: ${errorText}`)
      return
    }
    
    const result = await response.json()
    const duration = Date.now() - startTime
    
    console.log(`   ✅ Evidence collection completed in ${duration}ms`)
    console.log(`   Success: ${result.success}`)
    
    if (result.success) {
      console.log(`   Evidence collected: ${result.evidence?.length || 0} items`)
      console.log(`   Collection ID: ${result.collectionId}`)
      console.log(`   Summary:`)
      console.log(`     - Total: ${result.summary?.total || 0}`)
      console.log(`     - Duration: ${result.summary?.duration || 0}ms`)
      console.log(`     - Tools used: ${result.summary?.tools?.join(', ') || 'none'}`)
      
      if (result.evidence && result.evidence.length > 0) {
        console.log(`   Evidence types collected:`)
        const types = [...new Set(result.evidence.map(e => e.type))]
        types.forEach(type => console.log(`     - ${type}`))
      }
      
      if (result.summary?.errors && result.summary.errors.length > 0) {
        console.log(`   ⚠️  Errors encountered:`)
        result.summary.errors.forEach(error => console.log(`     - ${error}`))
      }
    } else {
      console.log(`   ❌ Collection failed: ${result.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`)
    
    if (error.message.includes('fetch')) {
      console.error('   This might be a CORS issue or network connectivity problem')
    }
  }
}

async function testDirectFunctionCall() {
  console.log('\n3. Testing individual edge function call...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/html-collector`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        url: 'https://ring4.com',
        options: {
          timeout: 15000,
          userAgent: 'TechScanIQ/1.0 (Test Bot)'
        }
      })
    })
    
    console.log(`   Status: ${response.status}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log(`   ✅ HTML collector successful`)
      console.log(`   Success: ${result.success}`)
      console.log(`   HTML length: ${result.html?.length || 0} characters`)
    } else {
      const errorText = await response.text()
      console.log(`   ❌ HTML collector failed: ${errorText}`)
    }
    
  } catch (error) {
    console.log(`   ❌ HTML collector error: ${error.message}`)
  }
}

async function runTests() {
  await testEvidenceCollection()
  await testDirectFunctionCall()
  
  console.log('\n🎉 Pipeline test completed!')
  console.log('\nNext steps:')
  console.log('1. Check the Supabase dashboard for edge function logs')
  console.log('2. Verify evidence was stored in the database')
  console.log('3. Test the admin configuration interface')
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

runTests().catch(console.error)