import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { spawn } from 'child_process'
import fetch from 'node-fetch'

// Load environment variables
config()

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xngbtpbtivygkxnsexjg.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to wait for a service to be ready
async function waitForService(url, maxAttempts = 30, delayMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return true
      }
    } catch (e) {
      // Service not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  return false
}

async function triggerFullScan() {
  console.log('🚀 Starting full sales intelligence scan pipeline for Fidelity Canada...\n')

  // First, check if we already have the scan created
  const existingScanId = '532c3609-788e-45c7-9879-29ab59289ed5'
  
  // Check scan status
  const { data: existingScan, error: checkError } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('id', existingScanId)
    .single()

  if (checkError || !existingScan) {
    console.error('❌ Could not find existing scan. Please run create-fidelity-scan.js first.')
    return
  }

  console.log('✅ Found existing scan:')
  console.log(`   ID: ${existingScan.id}`)
  console.log(`   Company: ${existingScan.company_name}`)
  console.log(`   Type: ${existingScan.report_type}`)
  console.log(`   Status: ${existingScan.status}\n`)

  // Start the API server
  console.log('🔧 Starting API server...')
  const apiServer = spawn('npm', ['run', 'api:server'], {
    stdio: 'inherit',
    env: { ...process.env }
  })

  // Wait for API server to be ready
  console.log('⏳ Waiting for API server to be ready...')
  const apiReady = await waitForService('http://localhost:3001/api/health')
  
  if (!apiReady) {
    console.error('❌ API server failed to start')
    apiServer.kill()
    process.exit(1)
  }

  console.log('✅ API server is ready!\n')

  // Start the workers
  console.log('🔧 Starting background workers...')
  const workers = spawn('npm', ['run', 'workers:all'], {
    stdio: 'inherit',
    env: { ...process.env }
  })

  // Give workers time to start
  await new Promise(resolve => setTimeout(resolve, 3000))
  console.log('✅ Workers started!\n')

  // Trigger the scan processing
  console.log('📊 Triggering scan processing...')
  
  try {
    const response = await fetch('http://localhost:3001/api/scans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scan_id: existingScan.id,
        company_name: existingScan.company_name,
        website_url: existingScan.website_url,
        company_description: existingScan.company_description,
        report_type: existingScan.report_type,
        metadata: existingScan.metadata,
        requestor_name: existingScan.requestor_name,
        organization_name: existingScan.organization_name,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to trigger scan processing:', errorText)
    } else {
      const result = await response.json()
      console.log('✅ Scan processing triggered successfully!')
      console.log('   Response:', result)
    }
  } catch (error) {
    console.error('❌ Error triggering scan:', error.message)
  }

  // Monitor scan progress
  console.log('\n📈 Monitoring scan progress...')
  console.log('   (Press Ctrl+C to stop monitoring)\n')

  let lastStatus = existingScan.status
  let lastProgress = 0

  const progressInterval = setInterval(async () => {
    try {
      const { data: scan, error } = await supabase
        .from('scan_requests')
        .select('status, evidence_collection_progress, report_generation_progress, ai_workflow_status')
        .eq('id', existingScanId)
        .single()

      if (error) {
        console.error('Error checking scan status:', error)
        return
      }

      const evidenceProgress = scan.evidence_collection_progress || 0
      const reportProgress = scan.report_generation_progress || 0
      const totalProgress = (evidenceProgress + reportProgress) / 2

      if (scan.status !== lastStatus || totalProgress !== lastProgress) {
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${scan.status}`)
        console.log(`   Evidence Collection: ${evidenceProgress}%`)
        console.log(`   Report Generation: ${reportProgress}%`)
        console.log(`   AI Workflow: ${scan.ai_workflow_status || 'pending'}`)
        console.log('')

        lastStatus = scan.status
        lastProgress = totalProgress
      }

      // If scan is complete, stop monitoring
      if (scan.status === 'complete' || scan.status === 'failed') {
        console.log('🎉 Scan processing complete!')
        console.log(`\n📊 View the report at: http://localhost:5173/admin/scans/${existingScanId}`)
        
        clearInterval(progressInterval)
        
        // Clean up processes
        setTimeout(() => {
          console.log('\n🛑 Stopping services...')
          apiServer.kill()
          workers.kill()
          process.exit(0)
        }, 2000)
      }
    } catch (error) {
      console.error('Error in progress monitoring:', error)
    }
  }, 5000) // Check every 5 seconds

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping services...')
    clearInterval(progressInterval)
    apiServer.kill()
    workers.kill()
    process.exit(0)
  })
}

// Run the function
triggerFullScan().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})