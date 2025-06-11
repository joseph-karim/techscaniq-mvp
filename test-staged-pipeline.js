#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Redis for BullMQ
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

// Initialize queues
const evidenceQueue = new Queue('evidence-collection', { connection: redis });
const reportQueue = new Queue('report-generation-staged', { connection: redis });

async function runStagedPipeline(companyName, websiteUrl, investmentThesis = 'buy-and-scale') {
  console.log(`\n🚀 Starting staged pipeline test for ${companyName}`);
  console.log(`Website: ${websiteUrl}`);
  console.log(`Investment Thesis: ${investmentThesis}\n`);

  try {
    // Step 1: Create scan request
    console.log('📝 Creating scan request...');
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: companyName,
        website_url: websiteUrl,
        scan_type: 'comprehensive',
        investment_thesis: investmentThesis,
        user_id: '00000000-0000-0000-0000-000000000000', // Test user
        status: 'pending',
        priority: 'high',
        notes: 'Staged pipeline test with enhanced prompts'
      })
      .select()
      .single();

    if (scanError) throw scanError;
    console.log(`✅ Scan request created: ${scanRequest.id}`);

    // Step 2: Trigger evidence collection with query decomposition
    console.log('\n📊 Starting evidence collection...');
    const evidenceJob = await evidenceQueue.add('collect-evidence', {
      scanRequestId: scanRequest.id,
      companyName: companyName,
      websiteUrl: websiteUrl,
      investmentThesis: investmentThesis,
      collectionStrategy: 'focused', // Use focused collection
      maxSources: 30, // Limit sources for quality
      queryDecomposition: true // Enable query decomposition
    });

    console.log(`⏳ Evidence collection job queued: ${evidenceJob.id}`);
    
    // Wait for evidence collection (with timeout)
    const evidenceResult = await evidenceJob.waitUntilFinished(evidenceQueue.events, 300000); // 5 min timeout
    console.log(`✅ Evidence collection completed: ${evidenceResult.evidenceCount} items collected`);

    // Step 3: Check evidence quality
    console.log('\n🔍 Checking evidence quality...');
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_items')
      .select('evidence_type, confidence_score, source_url')
      .eq('scan_request_id', scanRequest.id);

    if (evidenceError) throw evidenceError;

    // Analyze evidence distribution
    const evidenceTypes = evidence.reduce((acc, item) => {
      acc[item.evidence_type] = (acc[item.evidence_type] || 0) + 1;
      return acc;
    }, {});

    console.log('Evidence distribution:', evidenceTypes);
    console.log(`Average confidence: ${(evidence.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / evidence.length).toFixed(2)}`);

    // Step 4: Trigger staged report generation
    console.log('\n📄 Starting staged report generation...');
    const reportJob = await reportQueue.add('generate-report', {
      scanRequestId: scanRequest.id,
      companyName: companyName,
      companyDomain: websiteUrl,
      investmentThesis: investmentThesis,
      userId: '00000000-0000-0000-0000-000000000000'
    });

    console.log(`⏳ Report generation job queued: ${reportJob.id}`);
    console.log('This will generate sections: Tech → Market → Team → Financial → Risk → Recommendation → Executive Summary');
    
    // Wait for report generation
    const reportResult = await reportJob.waitUntilFinished(reportQueue.events, 600000); // 10 min timeout
    console.log(`✅ Report generation completed`);

    // Step 5: Fetch and analyze the generated report
    console.log('\n📊 Analyzing generated report...');
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', scanRequest.id)
      .single();

    if (reportError) throw reportError;

    // Display report sections
    console.log('\n📑 Report Sections Generated:');
    const sections = report.report_data.sections;
    Object.entries(sections).forEach(([key, section]) => {
      console.log(`\n### ${section.title}`);
      console.log(`Confidence: ${section.metadata?.confidence || 'N/A'}%`);
      console.log(`Content preview: ${section.content.slice(0, 200)}...`);
    });

    // Display executive summary
    console.log('\n📋 Executive Summary:');
    console.log(report.report_data.executive_summary);

    // Display recommendation
    console.log('\n🎯 Investment Recommendation:');
    console.log(`Decision: ${report.report_data.recommendation}`);
    console.log(`Investment Score: ${report.report_data.investment_score}/100`);
    console.log(`Rationale: ${report.report_data.investment_rationale}`);

    // Display quality metrics
    console.log('\n📈 Quality Metrics:');
    console.log(`Overall Confidence: ${report.report_data.overall_confidence?.toFixed(1)}%`);
    console.log(`Evidence Used: ${report.report_data.evidence_count} items`);
    console.log(`Total Tokens: ${report.metadata?.totalTokens || 'N/A'}`);

    // Display trace summary
    if (report.metadata?.trace) {
      console.log('\n🔍 Generation Trace:');
      report.metadata.trace.slice(-5).forEach(t => {
        console.log(`- ${t.event} (${new Date(t.timestamp).toLocaleTimeString()})`);
      });
    }

    console.log('\n✅ Pipeline test completed successfully!');
    console.log(`\n🔗 View report at: ${process.env.VITE_APP_URL}/reports/${report.id}`);

    return {
      scanRequestId: scanRequest.id,
      reportId: report.id,
      success: true
    };

  } catch (error) {
    console.error('\n❌ Pipeline test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test different scenarios
async function runTests() {
  console.log('🧪 Starting staged pipeline tests...\n');

  // Test 1: Well-known company with good data
  console.log('=== Test 1: High-data company (Stripe) ===');
  await runStagedPipeline('Stripe', 'https://stripe.com', 'buy-and-scale');

  // Test 2: Medium-data company
  console.log('\n=== Test 2: Medium-data company (Mixpanel) ===');
  await runStagedPipeline('Mixpanel', 'https://mixpanel.com', 'buy-and-optimize');

  // Test 3: Low-data company (to test how it handles gaps)
  console.log('\n=== Test 3: Low-data company ===');
  await runStagedPipeline('TechStartupXYZ', 'https://example-startup.com', 'turnaround');

  console.log('\n✅ All tests completed!');
  process.exit(0);
}

// Run tests if called directly
if (require.main === module) {
  // Check for specific company test
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    const [company, website, thesis = 'buy-and-scale'] = args;
    runStagedPipeline(company, website, thesis).then(() => process.exit(0));
  } else {
    console.log('Usage: node test-staged-pipeline.js <company> <website> [thesis]');
    console.log('Or run without args for full test suite\n');
    runTests();
  }
}