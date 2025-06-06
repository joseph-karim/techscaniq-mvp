import { config } from 'dotenv'
config()

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`

async function testQueueSystem() {
  console.log('Testing Queue-Based Evidence Collection System')
  console.log('===========================================')
  console.log(`API URL: ${API_URL}`)
  
  // Step 1: Check API health
  console.log('\n1. Checking API health...')
  try {
    const healthRes = await fetch(`${API_URL}/api/health`)
    const health = await healthRes.json()
    console.log('✅ API is healthy:', health)
  } catch (error) {
    console.error('❌ API server is not running. Please start it with: npm run api:server')
    return
  }
  
  // Step 2: Create a scan for Mixpanel
  console.log('\n2. Creating scan for Mixpanel...')
  const scanData = {
    company_name: 'Mixpanel',
    website_url: 'https://mixpanel.com',
    primary_criteria: 'vertical-saas',
    thesis_tags: ['analytics', 'product-analytics', 'data-infrastructure'],
    requestor_name: 'Test PE Analyst',
    organization_name: 'Test PE Firm',
    company_description: 'Product analytics platform that helps companies understand user behavior',
    investment_thesis_data: {
      market_size: 'Large and growing product analytics market',
      competitive_moat: 'Deep technical expertise and strong brand',
      growth_potential: 'Expanding into enterprise and new verticals',
    }
  }
  
  try {
    const scanRes = await fetch(`${API_URL}/api/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanData)
    })
    
    if (!scanRes.ok) {
      const error = await scanRes.json()
      console.error('❌ Failed to create scan:', error)
      return
    }
    
    const scan = await scanRes.json()
    console.log('✅ Scan created:', scan)
    
    // Step 3: Monitor progress
    console.log('\n3. Monitoring scan progress...')
    console.log('This will take 30+ minutes for comprehensive evidence collection')
    
    const scanId = scan.scanRequestId
    let completed = false
    let lastProgress = { evidence: 0, report: 0 }
    
    while (!completed) {
      try {
        const statusRes = await fetch(`${API_URL}/api/scans/${scanId}/status`)
        const status = await statusRes.json()
        
        // Update progress if changed
        const evidenceProgress = status.progress.evidenceCollection.progress
        const reportProgress = status.progress.reportGeneration.progress
        
        if (evidenceProgress !== lastProgress.evidence || reportProgress !== lastProgress.report) {
          console.log(`\n[${new Date().toLocaleTimeString()}] Progress Update:`)
          console.log(`  Evidence Collection: ${evidenceProgress}% (${status.progress.evidenceCollection.itemsCollected} items)`)
          console.log(`  Report Generation: ${reportProgress}%`)
          
          if (status.progress.evidenceCollection.status === 'failed') {
            console.error('❌ Evidence collection failed!')
            console.log('Job details:', status.jobs.evidence)
            break
          }
          
          if (status.progress.reportGeneration.status === 'failed') {
            console.error('❌ Report generation failed!')
            console.log('Job details:', status.jobs.report)
            break
          }
          
          lastProgress = { evidence: evidenceProgress, report: reportProgress }
        }
        
        // Check if completed
        if (status.progress.reportGeneration.status === 'completed' && status.progress.reportGeneration.reportId) {
          completed = true
          console.log('\n✅ Scan completed successfully!')
          console.log(`Report ID: ${status.progress.reportGeneration.reportId}`)
          console.log(`Investment Score: ${status.progress.reportGeneration.investmentScore}`)
          console.log(`Total Evidence Items: ${status.progress.evidenceCollection.itemsCollected}`)
          console.log(`\nView report at: http://localhost:3000/reports/${status.progress.reportGeneration.reportId}`)
        }
        
      } catch (error) {
        console.error('Error checking status:', error)
      }
      
      // Wait 5 seconds between checks
      if (!completed) {
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating scan:', error)
  }
}

// Run the test
testQueueSystem().catch(console.error)