#!/usr/bin/env ts-node

import { runDeepResearch } from './src/orchestrator/graph';
import { config as dotenvConfig } from 'dotenv';
import { EvidenceCollectorIntegration } from './src/tools/evidenceCollectorIntegration';
import { WebTechDetector } from './src/tools/webTechDetector';
import { StorageService } from './src/services/storage';

// Load environment variables
dotenvConfig({ path: '../.env.local' });

async function testEndToEnd() {
  console.log('🚀 Testing TechScanIQ 2.0 End-to-End Pipeline\n');
  
  const company = 'Snowplow';
  const website = 'https://snowplow.io';
  const thesisType = 'accelerate-growth';
  
  console.log(`Target Company: ${company}`);
  console.log(`Website: ${website}`);
  console.log(`Investment Thesis: ${thesisType}`);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    // Step 1: Test individual tools
    console.log('📋 Step 1: Testing Evidence Collection Tools\n');
    
    // Test web tech detection
    console.log('Testing WebTechDetector...');
    const techDetector = new WebTechDetector();
    const techResults = await techDetector.detectTechnologies(website);
    console.log(`✅ Detected ${techDetector.countTechnologies(techResults.technologies)} technologies`);
    console.log(`   - Frontend: ${techResults.technologies.libraries.map(t => t.name).join(', ')}`);
    console.log(`   - Infrastructure: ${techResults.vendors.hosting.join(', ')}`);
    console.log(`   - Analytics: ${techResults.vendors.analytics.join(', ')}`);
    
    // Test evidence collector integration
    console.log('\nTesting Evidence Collector Integration...');
    const collector = new EvidenceCollectorIntegration();
    
    // Quick test with limited pages
    console.log('- Running crawl4ai (limited to 10 pages for test)...');
    const crawlEvidence = await collector.collectWithCrawl4AI(
      website.replace('https://', ''), 
      thesisType, 
      10
    );
    console.log(`✅ Crawl4ai collected ${crawlEvidence.length} evidence pieces`);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Step 2: Test full orchestration
    console.log('📋 Step 2: Running Full LangGraph Orchestration\n');
    
    const reportId = await runDeepResearch(company, website, thesisType);
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Research completed successfully!`);
    console.log(`📄 Report ID: ${reportId}`);
    
    // Step 3: Verify storage
    console.log('\n📋 Step 3: Verifying Storage\n');
    const storage = new StorageService();
    
    // Try to load the research state
    const thesisId = reportId.replace('report_', 'thesis_').split('_').slice(0, 2).join('_');
    const loadedState = await storage.loadResearchState(thesisId);
    
    if (loadedState) {
      console.log(`✅ Successfully loaded research state from storage`);
      console.log(`   - Evidence count: ${loadedState.evidence.length}`);
      console.log(`   - Quality scores: ${Object.keys(loadedState.qualityScores).length}`);
    } else {
      console.log('⚠️  Could not load research state (may not be stored yet)');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 End-to-end test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEndToEnd().catch(console.error);