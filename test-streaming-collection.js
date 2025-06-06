import { spawn } from 'child_process'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test configuration
const TEST_DOMAIN = 'stripe.com'
const TEST_THESIS = 'buy-and-build'
const TEST_SCAN_ID = 'test-scan-' + Date.now()

console.log('🚀 Testing Streaming Evidence Collection')
console.log('=====================================')
console.log(`Domain: ${TEST_DOMAIN}`)
console.log(`Thesis: ${TEST_THESIS}`)
console.log(`Scan ID: ${TEST_SCAN_ID}`)
console.log('')

// Prepare API keys
const apiKeys = {
  anthropic_key: process.env.ANTHROPIC_API_KEY || '',
  google_api_key: process.env.GOOGLE_API_KEY || '',
  gemini_key: process.env.GOOGLE_API_KEY || ''
}

// Statistics
let stats = {
  evidenceCount: 0,
  pagesCrawled: 0,
  phases: [],
  startTime: Date.now(),
  lastUpdate: Date.now()
}

// Run the streaming crawler with virtual environment
const pythonPath = path.join(__dirname, 'src/workers/deep_research_crawler_streaming.py')
const venvPython = path.join(__dirname, 'venv/bin/python3')

// Check if venv exists, otherwise use system python
const pythonExec = fs.existsSync(venvPython) ? venvPython : 'python3'

const pythonProcess = spawn(pythonExec, [
  pythonPath,
  TEST_DOMAIN,
  TEST_THESIS,
  TEST_SCAN_ID,
  JSON.stringify(apiKeys)
])

let buffer = ''

// Handle streaming output
pythonProcess.stdout.on('data', (data) => {
  buffer += data.toString()
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''

  for (const line of lines) {
    if (!line.trim()) continue

    try {
      if (line.startsWith('STREAM:')) {
        const update = JSON.parse(line.substring(7))
        handleStreamUpdate(update)
      } else if (line.startsWith('EVIDENCE:')) {
        const evidence = JSON.parse(line.substring(9))
        handleEvidenceItem(evidence)
      }
    } catch (err) {
      console.error('Error parsing output:', err)
      console.log('Raw line:', line)
    }
  }
})

pythonProcess.stderr.on('data', (data) => {
  const output = data.toString()
  // Only show non-progress stderr (actual errors)
  if (!output.includes('Research Complete:') && !output.includes('Evidence collected:')) {
    console.error('Python stderr:', output)
  }
})

pythonProcess.on('close', (code) => {
  const duration = (Date.now() - stats.startTime) / 1000
  
  console.log('')
  console.log('✅ Process completed')
  console.log('===================')
  console.log(`Exit code: ${code}`)
  console.log(`Duration: ${duration.toFixed(1)}s`)
  console.log(`Final evidence count: ${stats.evidenceCount}`)
  console.log(`Total pages crawled: ${stats.pagesCrawled}`)
  console.log(`Evidence per second: ${(stats.evidenceCount / duration).toFixed(1)}`)
  
  if (stats.evidenceCount >= 200) {
    console.log('')
    console.log('🎉 SUCCESS: Collected 200+ evidence items!')
  }
  
  process.exit(code)
})

pythonProcess.on('error', (err) => {
  console.error('Process error:', err)
  process.exit(1)
})

// Handle streaming updates
function handleStreamUpdate(update) {
  const timeSinceLastUpdate = (Date.now() - stats.lastUpdate) / 1000
  stats.lastUpdate = Date.now()
  
  switch (update.type) {
    case 'status':
      console.log(`\n📋 Status: ${update.message}`)
      break
      
    case 'progress':
      if (update.evidence_count) stats.evidenceCount = update.evidence_count
      if (update.pages_crawled) stats.pagesCrawled = update.pages_crawled
      
      console.log(`\n🔄 Progress Update (Phase: ${update.phase}, Iteration: ${update.iteration})`)
      console.log(`   Evidence items: ${update.evidence_count} (+${update.new_evidence?.length || 0} new)`)
      console.log(`   Pages crawled: ${update.pages_crawled} (${update.total_pages} total)`)
      console.log(`   Time since last update: ${timeSinceLastUpdate.toFixed(1)}s`)
      
      if (update.evidence_types_found?.length > 0) {
        console.log(`   Evidence types found: ${update.evidence_types_found.slice(0, 5).join(', ')}...`)
      }
      
      if (update.remaining_gaps?.length > 0) {
        console.log(`   Remaining gaps: ${update.remaining_gaps.join(', ')}`)
      }
      
      // Show sample of new evidence
      if (update.new_evidence?.length > 0) {
        console.log(`   New evidence samples:`)
        update.new_evidence.slice(0, 3).forEach(ev => {
          console.log(`     - ${ev.evidence_type}: ${ev.url}`)
        })
      }
      break
      
    case 'complete':
      console.log(`\n✅ Collection Complete!`)
      console.log(`   Final evidence count: ${update.evidence_count}`)
      console.log(`   Total pages crawled: ${update.pages_crawled}`)
      
      if (update.synthesis) {
        console.log(`   Evidence completeness: ${(update.synthesis.evidence_completeness * 100).toFixed(0)}%`)
        console.log(`   Recommendations: ${update.synthesis.recommendations[0]}`)
      }
      break
      
    case 'error':
      console.error(`\n❌ Error: ${update.error}`)
      break
  }
}

// Handle individual evidence items
function handleEvidenceItem(evidence) {
  // Could store these in a database in real implementation
  console.log(`   📄 New evidence: [${evidence.type}] ${evidence.source} (confidence: ${evidence.confidence.toFixed(2)})`)
}

// Progress indicator
setInterval(() => {
  const elapsed = (Date.now() - stats.startTime) / 1000
  const rate = stats.evidenceCount / elapsed
  const eta = stats.evidenceCount > 0 ? (200 - stats.evidenceCount) / rate : 0
  
  process.stdout.write(`\r⏱️  Elapsed: ${elapsed.toFixed(0)}s | Evidence: ${stats.evidenceCount} | Rate: ${rate.toFixed(1)}/s | ETA to 200: ${eta.toFixed(0)}s`)
}, 5000)