import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xngbtpbtivygkxnsexjg.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function triggerSalesIntelligenceResearch() {
  console.log('🚀 Triggering sales intelligence research for Fidelity Canada...\n')

  // Get the existing scan
  const scanId = '532c3609-788e-45c7-9879-29ab59289ed5'
  const { data: scan, error } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('id', scanId)
    .single()

  if (error || !scan) {
    console.error('❌ Could not find scan:', error)
    return
  }

  console.log('✅ Found scan:')
  console.log(`   Company: ${scan.company_name}`)
  console.log(`   Type: ${scan.report_type}`)
  console.log(`   Status: ${scan.status}\n`)

  // Call the v2 research API
  console.log('📊 Starting research via v2 API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/research/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company: scan.company_name,
        website: scan.website_url,
        thesisType: 'custom',
        customThesis: 'Sales Intelligence Analysis: Evaluate Fidelity Canada as a potential customer for Interad\'s digital agency services, focusing on their technology needs, digital transformation initiatives, and alignment with our offerings.',
        metadata: {
          scanId: scan.id,
          reportType: 'sales-intelligence',
          salesContext: scan.metadata?.sales_context || {},
          vendor: 'Interad',
          target: 'Fidelity Canada'
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to start research:', errorText)
      return
    }

    const result = await response.json()
    console.log('✅ Research started successfully!')
    console.log(`   Research ID: ${result.researchId}`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Estimated time: ${result.estimatedTime}\n`)

    // Monitor research progress
    console.log('📈 Monitoring research progress...\n')
    
    let lastStatus = ''
    let lastProgress = 0

    const checkProgress = async () => {
      try {
        const statusResponse = await fetch(`http://localhost:3000/api/research/${result.researchId}/status`)
        
        if (!statusResponse.ok) {
          console.error('Failed to get status')
          return
        }

        const status = await statusResponse.json()
        
        if (status.status !== lastStatus || status.progress !== lastProgress) {
          console.log(`[${new Date().toLocaleTimeString()}]`)
          console.log(`   Status: ${status.status}`)
          console.log(`   Progress: ${status.progress}%`)
          console.log(`   Phase: ${status.currentPhase}`)
          console.log(`   Evidence Count: ${status.evidenceCount}`)
          console.log(`   Iterations: ${status.iterationCount}`)
          console.log('')

          lastStatus = status.status
          lastProgress = status.progress
        }

        // Update the scan request with research progress
        await supabase
          .from('scan_requests')
          .update({
            status: 'processing',
            ai_workflow_status: status.currentPhase,
            evidence_collection_progress: status.progress,
            ai_workflow_run_id: result.researchId
          })
          .eq('id', scanId)

        // Check if research is complete
        if (status.status === 'complete' || status.status === 'failed') {
          console.log('🎉 Research complete!')
          
          // Get the final research results
          const resultsResponse = await fetch(`http://localhost:3000/api/research/${result.researchId}/results`)
          
          if (resultsResponse.ok) {
            const results = await resultsResponse.json()
            console.log('\n📊 Research Results:')
            console.log(`   Total Evidence: ${results.evidence?.length || 0} pieces`)
            console.log(`   Key Findings: ${results.findings?.length || 0}`)
            
            // Update scan with results
            await supabase
              .from('scan_requests')
              .update({
                status: 'complete',
                ai_workflow_status: 'complete',
                evidence_collection_progress: 100,
                report_generation_progress: 100,
                sections: results.findings || [],
                metadata: {
                  ...scan.metadata,
                  research_results: results
                }
              })
              .eq('id', scanId)

            console.log('\n✅ Scan updated with research results!')
            console.log(`\n📊 View the scan at: http://localhost:5173/admin/scans/${scanId}`)
          }
          
          clearInterval(progressInterval)
          process.exit(0)
        }
      } catch (error) {
        console.error('Error checking progress:', error.message)
      }
    }

    // Check progress immediately
    await checkProgress()

    // Then check every 10 seconds
    const progressInterval = setInterval(checkProgress, 10000)

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping monitoring...')
      clearInterval(progressInterval)
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run it
triggerSalesIntelligenceResearch().catch(console.error)