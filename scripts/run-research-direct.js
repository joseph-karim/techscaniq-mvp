import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

// Set USE_QUEUES to false
process.env.USE_QUEUES = 'false'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xngbtpbtivygkxnsexjg.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function runResearchDirect() {
  console.log('🚀 Running research directly (without queues)...\n')

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

  // Call the v2 research API with USE_QUEUES=false
  console.log('📊 Starting research via v2 API (direct mode)...')
  
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
        customThesis: 'Sales Intelligence: Evaluate Fidelity Canada as a prospect for Interad\'s digital agency services including web development, UX/UI design, and digital transformation',
        metadata: {
          scanId: scan.id,
          reportType: 'sales-intelligence',
          salesContext: scan.metadata?.sales_context || {},
          vendor: 'Interad',
          target: 'Fidelity Canada',
          directMode: true // Flag to indicate direct processing
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to start research:', errorText)
      return
    }

    const result = await response.json()
    console.log('✅ Research initiated!')
    console.log(`   Research ID: ${result.researchId}`)
    console.log(`   Mode: Direct (no queues)`)
    console.log(`   Estimated time: ${result.estimatedTime}\n`)

    // Since we're running direct, the research should be processing in the background
    console.log('📈 Research is processing in the background...')
    console.log('   Check the research state file for progress:')
    console.log(`   /Users/josephkarim/techscaniq-mvp/techscaniq-v2/data/states/research_state_${result.researchId}.json\n`)
    
    // Monitor the file for changes
    console.log('Monitoring progress (Ctrl+C to stop)...\n')
    
    let lastModified = new Date()
    let lastStatus = ''
    
    const checkProgress = async () => {
      try {
        const fs = await import('fs')
        const path = `/Users/josephkarim/techscaniq-mvp/techscaniq-v2/data/states/research_state_${result.researchId}.json`
        
        if (fs.existsSync(path)) {
          const stats = fs.statSync(path)
          const content = JSON.parse(fs.readFileSync(path, 'utf8'))
          
          if (stats.mtime > lastModified || content.status !== lastStatus) {
            console.log(`[${new Date().toLocaleTimeString()}] Update detected!`)
            console.log(`   Status: ${content.status}`)
            console.log(`   Evidence Count: ${content.evidence?.length || 0}`)
            console.log(`   Iterations: ${content.iterationCount}`)
            console.log(`   Questions: ${content.questions?.length || 0}`)
            
            if (content.qualityScores) {
              const scores = Object.values(content.qualityScores)
              const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0
              console.log(`   Average Quality Score: ${avgScore.toFixed(2)}`)
            }
            
            console.log('')
            
            lastModified = stats.mtime
            lastStatus = content.status
            
            // Update the scan in the database
            await supabase
              .from('scan_requests')
              .update({
                status: content.status === 'complete' ? 'complete' : 'processing',
                ai_workflow_status: content.status,
                evidence_collection_progress: Math.min(content.iterationCount * 20, 80),
                ai_workflow_run_id: result.researchId
              })
              .eq('id', scanId)
          }
          
          if (content.status === 'complete' || content.status === 'failed') {
            console.log('🎉 Research complete!')
            console.log(`\n📊 View the scan at: http://localhost:5173/admin/scans/${scanId}`)
            clearInterval(progressInterval)
            process.exit(0)
          }
        }
      } catch (error) {
        console.error('Error checking progress:', error.message)
      }
    }

    // Check immediately
    await checkProgress()

    // Then check every 5 seconds
    const progressInterval = setInterval(checkProgress, 5000)

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
runResearchDirect().catch(console.error)