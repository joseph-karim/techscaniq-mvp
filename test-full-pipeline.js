#!/usr/bin/env node

/**
 * Comprehensive test of the TechScanIQ pipeline
 * Tests database operations, edge functions, and data flow
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Create Supabase client
const supabase = createClient(SUPABASE_URL, ANON_KEY)

console.log('🚀 TechScanIQ Full Pipeline Test')
console.log('==============================')

async function testDatabaseConnection() {
  console.log('\n1. Testing database connection...')
  
  try {
    const { data, error } = await supabase
      .from('evidence_collections')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error(`   ❌ Database error: ${error.message}`)
      return false
    }
    
    console.log('   ✅ Database connection successful')
    return true
  } catch (error) {
    console.error(`   ❌ Database connection failed: ${error.message}`)
    return false
  }
}

async function testCreateScanRequest() {
  console.log('\n2. Creating test scan request...')
  
  try {
    const { data, error } = await supabase
      .from('scan_requests')
      .insert({
        company_name: 'Ring4 (Pipeline Test)',
        company_website: 'https://ring4.com',
        status: 'pending',
        requestor_name: 'Pipeline Test',
        organization_name: 'TechScanIQ Test Suite',
        notes: 'Automated pipeline test'
      })
      .select()
      .single()
    
    if (error) {
      console.error(`   ❌ Failed to create scan request: ${error.message}`)
      return null
    }
    
    console.log(`   ✅ Created scan request: ${data.id}`)
    return data
  } catch (error) {
    console.error(`   ❌ Scan request creation failed: ${error.message}`)
    return null
  }
}

async function testEvidenceOrchestrator(scanRequest) {
  console.log('\n3. Testing evidence orchestrator...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/evidence-orchestrator`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({
        companyName: scanRequest.company_name,
        companyWebsite: scanRequest.company_website,
        depth: 'shallow',
        scanRequestId: scanRequest.id
      })
    })
    
    console.log(`   Status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`   ❌ Orchestrator failed: ${errorText}`)
      return null
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`   ✅ Evidence collection successful`)
      console.log(`   Collected ${result.evidence?.length || 0} evidence items`)
      console.log(`   Collection ID: ${result.collectionId}`)
      console.log(`   Duration: ${result.summary?.duration || 0}ms`)
      return result
    } else {
      console.error(`   ❌ Collection failed: ${result.error}`)
      return null
    }
    
  } catch (error) {
    console.error(`   ❌ Orchestrator test failed: ${error.message}`)
    return null
  }
}

async function testEvidenceStorage(collectionId) {
  console.log('\n4. Verifying evidence storage...')
  
  try {
    // Check evidence collection record
    const { data: collection, error: collectionError } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('id', collectionId)
      .single()
    
    if (collectionError) {
      console.error(`   ❌ Collection record error: ${collectionError.message}`)
      return false
    }
    
    console.log(`   ✅ Collection record found`)
    console.log(`   Status: ${collection.status}`)
    console.log(`   Evidence count: ${collection.evidence_count}`)
    
    // Check evidence items
    const { data: items, error: itemsError } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('collection_id', collectionId)
    
    if (itemsError) {
      console.error(`   ❌ Evidence items error: ${itemsError.message}`)
      return false
    }
    
    console.log(`   ✅ Found ${items.length} evidence items in database`)
    
    if (items.length > 0) {
      const types = [...new Set(items.map(item => item.type))]
      console.log(`   Evidence types: ${types.join(', ')}`)
    }
    
    return true
    
  } catch (error) {
    console.error(`   ❌ Storage verification failed: ${error.message}`)
    return false
  }
}

async function testAdminConfiguration() {
  console.log('\n5. Testing admin configuration system...')
  
  try {
    // Test AI prompts
    const { data: prompts, error: promptsError } = await supabase
      .from('ai_prompts')
      .select('*')
      .limit(3)
    
    if (promptsError) {
      console.error(`   ❌ Prompts query failed: ${promptsError.message}`)
    } else {
      console.log(`   ✅ Found ${prompts.length} AI prompts`)
    }
    
    // Test scan configurations
    const { data: configs, error: configsError } = await supabase
      .from('scan_configurations')
      .select('*')
      .limit(3)
    
    if (configsError) {
      console.error(`   ❌ Configs query failed: ${configsError.message}`)
    } else {
      console.log(`   ✅ Found ${configs.length} scan configurations`)
    }
    
    // Test edge function logs
    const { data: logs, error: logsError } = await supabase
      .from('edge_function_logs')
      .select('*')
      .limit(3)
    
    if (logsError) {
      console.error(`   ❌ Logs query failed: ${logsError.message}`)
    } else {
      console.log(`   ✅ Found ${logs.length} function execution logs`)
    }
    
    return true
    
  } catch (error) {
    console.error(`   ❌ Admin config test failed: ${error.message}`)
    return false
  }
}

async function testCORSConfiguration() {
  console.log('\n6. Testing CORS configuration...')
  
  const origins = [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:3000',
    'https://scan.techscaniq.com',
    'https://unauthorized-domain.com'
  ]
  
  for (const origin of origins) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/evidence-orchestrator`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST'
        }
      })
      
      const corsOrigin = response.headers.get('access-control-allow-origin')
      const isAuthorized = origin !== 'https://unauthorized-domain.com'
      
      if (isAuthorized && corsOrigin === origin) {
        console.log(`   ✅ ${origin} - authorized and working`)
      } else if (!isAuthorized && corsOrigin !== origin) {
        console.log(`   ✅ ${origin} - correctly rejected`)
      } else {
        console.log(`   ⚠️  ${origin} - unexpected CORS behavior`)
      }
      
    } catch (error) {
      console.error(`   ❌ ${origin} - CORS test failed: ${error.message}`)
    }
  }
}

async function cleanupTestData(scanRequest) {
  console.log('\n7. Cleaning up test data...')
  
  try {
    if (scanRequest?.id) {
      await supabase
        .from('scan_requests')
        .delete()
        .eq('id', scanRequest.id)
      
      console.log('   ✅ Test scan request cleaned up')
    }
  } catch (error) {
    console.log(`   ⚠️  Cleanup warning: ${error.message}`)
  }
}

async function runFullPipelineTest() {
  let scanRequest = null
  let collectionResult = null
  
  try {
    // Run tests in sequence
    const dbOk = await testDatabaseConnection()
    if (!dbOk) return
    
    scanRequest = await testCreateScanRequest()
    if (!scanRequest) return
    
    collectionResult = await testEvidenceOrchestrator(scanRequest)
    if (!collectionResult?.collectionId) {
      console.log('   ⚠️  Skipping storage verification due to collection failure')
    } else {
      await testEvidenceStorage(collectionResult.collectionId)
    }
    
    await testAdminConfiguration()
    await testCORSConfiguration()
    
  } finally {
    await cleanupTestData(scanRequest)
  }
  
  console.log('\n🎉 Full pipeline test completed!')
  console.log('\nResults Summary:')
  console.log(`- Database connection: ${dbOk ? '✅' : '❌'}`)
  console.log(`- Scan request creation: ${scanRequest ? '✅' : '❌'}`)
  console.log(`- Evidence collection: ${collectionResult ? '✅' : '❌'}`)
  console.log(`- Evidence storage: ${collectionResult?.collectionId ? '✅' : '❌'}`)
  
  if (collectionResult) {
    console.log('\nEvidence Collection Details:')
    console.log(`- Evidence items: ${collectionResult.evidence?.length || 0}`)
    console.log(`- Processing time: ${collectionResult.summary?.duration || 0}ms`)
    console.log(`- Tools used: ${collectionResult.summary?.tools?.join(', ') || 'none'}`)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

runFullPipelineTest().catch(console.error)