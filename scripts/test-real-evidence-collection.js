import { config } from 'dotenv'
config()

const API_URL = `http://localhost:${process.env.API_PORT || 3001}`

async function testRealEvidenceCollection() {
  console.log('Testing REAL Evidence Collection System')
  console.log('=======================================')
  console.log(`API URL: ${API_URL}`)
  console.log('\nThis test will demonstrate real web crawling with:')
  console.log('- Actual web page fetching')
  console.log('- Intelligent decision engine for tool selection')
  console.log('- Deep crawling of linked pages')
  console.log('- Technology stack detection')
  console.log('- API documentation extraction')
  console.log('- Variable evidence count based on findings')
  
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
  
  // Step 2: Create a scan for a real company
  console.log('\n2. Creating scan for Ring4 (real company)...')
  const scanData = {
    company_name: 'Ring4',
    website_url: 'https://ring4.com',
    primary_criteria: 'vertical-saas',
    thesis_tags: ['communications', 'voip', 'business-telephony'],
    requestor_name: 'Test PE Analyst',
    organization_name: 'Test PE Firm',
    company_description: 'Cloud-based business phone system and communications platform',
    investment_thesis_data: {
      market_size: 'Growing market for cloud communications',
      competitive_moat: 'Advanced features and integrations',
      growth_potential: 'Expanding SMB and enterprise segments',
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
    
    // Step 3: Monitor progress with detailed updates
    console.log('\n3. Monitoring REAL evidence collection progress...')
    console.log('This will show actual web crawling in action')
    
    const scanId = scan.scanRequestId
    let completed = false
    let lastProgress = { evidence: 0, report: 0 }
    let lastItemCount = 0
    
    while (!completed) {
      try {
        const statusRes = await fetch(`${API_URL}/api/scans/${scanId}/status`)
        const status = await statusRes.json()
        
        // Update progress if changed
        const evidenceProgress = status.progress.evidenceCollection.progress
        const reportProgress = status.progress.reportGeneration.progress
        const itemsCollected = status.progress.evidenceCollection.itemsCollected
        
        if (evidenceProgress !== lastProgress.evidence || 
            reportProgress !== lastProgress.report ||
            itemsCollected !== lastItemCount) {
          
          console.log(`\n[${new Date().toLocaleTimeString()}] Progress Update:`)
          console.log(`  Evidence Collection: ${evidenceProgress}% (${itemsCollected} items collected)`)
          
          // Show what's being collected
          if (itemsCollected > lastItemCount) {
            console.log(`  ✓ Collected ${itemsCollected - lastItemCount} new evidence items`)
          }
          
          if (status.progress.evidenceCollection.currentPhase) {
            console.log(`  Current Phase: ${status.progress.evidenceCollection.currentPhase}`)
          }
          
          if (status.progress.evidenceCollection.toolsUsed) {
            console.log(`  Tools Used: ${status.progress.evidenceCollection.toolsUsed.join(', ')}`)
          }
          
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
          lastItemCount = itemsCollected
        }
        
        // Check if completed
        if (status.progress.reportGeneration.status === 'completed' && status.progress.reportGeneration.reportId) {
          completed = true
          console.log('\n✅ Scan completed successfully!')
          console.log(`Report ID: ${status.progress.reportGeneration.reportId}`)
          console.log(`Investment Score: ${status.progress.reportGeneration.investmentScore}`)
          console.log(`Total Evidence Items: ${status.progress.evidenceCollection.itemsCollected}`)
          console.log('\nNOTE: Evidence count varies based on what was found!')
          console.log('- More pages discovered = more evidence')
          console.log('- API documentation found = additional API evidence')
          console.log('- Technology signals detected = tech stack evidence')
          console.log(`\nView report at: http://localhost:3000/reports/${status.progress.reportGeneration.reportId}`)
          
          // Show some sample evidence
          if (status.progress.evidenceCollection.sampleEvidence) {
            console.log('\nSample Evidence Collected:')
            status.progress.evidenceCollection.sampleEvidence.forEach((item, i) => {
              console.log(`  ${i + 1}. ${item.title} (${item.type})`)
            })
          }
        }
        
      } catch (error) {
        console.error('Error checking status:', error)
      }
      
      // Wait 3 seconds between checks
      if (!completed) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating scan:', error)
  }
}

// Run the test
console.log('Starting REAL evidence collection test...')
console.log('This will actually crawl the web and collect real data!')
testRealEvidenceCollection().catch(console.error)