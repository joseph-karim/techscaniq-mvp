import { createClient } from '@supabase/supabase-js';
import Bull from 'bull';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(chalk.red('❌ Missing required environment variables'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test configuration
const TEST_COMPANY = {
  name: 'Stripe',
  website: 'https://stripe.com',
  investmentThesis: {
    focus: 'payments_infrastructure',
    stage: 'growth',
    checkSize: '50M+',
    priorities: ['scalability', 'security', 'market_position']
  }
};

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = {
  info: (msg) => console.log(chalk.blue(`ℹ️  ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg) => console.log(chalk.red(`❌ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠️  ${msg}`)),
  section: (msg) => console.log(chalk.bold.magenta(`\n🔷 ${msg}\n`))
};

// Step 1: Create scan request (PE user perspective)
async function createScanRequest() {
  log.section('Step 1: Creating Scan Request (PE User)');
  
  try {
    const { data: scanRequest, error } = await supabase
      .from('scan_requests')
      .insert({
        company_name: TEST_COMPANY.name,
        website_url: TEST_COMPANY.website,
        requested_by: 'test-pe-user@example.com',
        priority: 'high',
        scan_type: 'comprehensive',
        status: 'pending',
        investment_thesis: TEST_COMPANY.investmentThesis,
        notes: 'Testing comprehensive scoring workflow'
      })
      .select()
      .single();

    if (error) throw error;

    log.success(`Scan request created: ${scanRequest.id}`);
    log.info(`Company: ${scanRequest.company_name}`);
    log.info(`Status: ${scanRequest.status}`);
    
    return scanRequest;
  } catch (error) {
    log.error(`Failed to create scan request: ${error.message}`);
    throw error;
  }
}

// Step 2: Admin reviews and configures scan
async function adminConfigureScan(scanRequestId) {
  log.section('Step 2: Admin Configures Scan');
  
  try {
    // Simulate admin review
    log.info('Admin reviewing scan request...');
    await delay(1000);
    
    // Update scan request with admin configuration
    const { data: updatedRequest, error } = await supabase
      .from('scan_requests')
      .update({
        status: 'approved',
        admin_notes: 'Approved for comprehensive scan with deep evidence collection',
        scan_depth: 'comprehensive',
        evidence_requirements: {
          technical: ['architecture', 'security', 'scalability', 'integrations'],
          business: ['market_position', 'competitive_analysis'],
          team: ['leadership', 'engineering_capacity'],
          financial: ['pricing_model', 'unit_economics']
        }
      })
      .eq('id', scanRequestId)
      .select()
      .single();

    if (error) throw error;

    log.success('Scan request approved and configured');
    log.info(`Scan depth: ${updatedRequest.scan_depth}`);
    
    return updatedRequest;
  } catch (error) {
    log.error(`Failed to configure scan: ${error.message}`);
    throw error;
  }
}

// Step 3: Trigger evidence collection
async function triggerEvidenceCollection(scanRequest) {
  log.section('Step 3: Triggering Evidence Collection');
  
  try {
    // Create evidence collection record
    const { data: collection, error: collectionError } = await supabase
      .from('evidence_collections')
      .insert({
        company_name: scanRequest.company_name,
        company_website: scanRequest.website_url,
        scan_request_id: scanRequest.id,
        collection_type: 'comprehensive',
        status: 'pending',
        metadata: {
          depth: scanRequest.scan_depth,
          requirements: scanRequest.evidence_requirements
        }
      })
      .select()
      .single();

    if (collectionError) throw collectionError;

    log.success(`Evidence collection created: ${collection.id}`);

    // Create job for evidence collection
    const evidenceQueue = new Bull('evidence-collection', {
      redis: {
        port: 6379,
        host: 'localhost'
      }
    });

    const job = await evidenceQueue.add('collect-evidence', {
      collectionId: collection.id,
      scanRequestId: scanRequest.id,
      companyName: scanRequest.company_name,
      websiteUrl: scanRequest.website_url,
      depth: 'comprehensive',
      investmentThesis: scanRequest.investment_thesis
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    log.success(`Evidence collection job created: ${job.id}`);
    
    // Update scan request status
    await supabase
      .from('scan_requests')
      .update({ 
        status: 'collecting_evidence',
        evidence_collection_id: collection.id 
      })
      .eq('id', scanRequest.id);

    return { collection, jobId: job.id };
  } catch (error) {
    log.error(`Failed to trigger evidence collection: ${error.message}`);
    throw error;
  }
}

// Step 4: Monitor evidence collection
async function monitorEvidenceCollection(collectionId, timeout = 120000) {
  log.section('Step 4: Monitoring Evidence Collection');
  
  const startTime = Date.now();
  let lastStatus = '';
  
  while (Date.now() - startTime < timeout) {
    try {
      const { data: collection, error } = await supabase
        .from('evidence_collections')
        .select('*, evidence_items(count)')
        .eq('id', collectionId)
        .single();

      if (error) throw error;

      const evidenceCount = collection.evidence_items?.[0]?.count || 0;
      
      if (collection.status !== lastStatus) {
        log.info(`Status: ${collection.status} | Evidence items: ${evidenceCount}`);
        lastStatus = collection.status;
      }

      if (collection.status === 'completed') {
        log.success('Evidence collection completed!');
        log.info(`Total evidence items collected: ${collection.evidence_count || evidenceCount}`);
        return collection;
      }

      if (collection.status === 'failed') {
        throw new Error('Evidence collection failed');
      }

      await delay(5000);
    } catch (error) {
      log.error(`Error monitoring collection: ${error.message}`);
      throw error;
    }
  }
  
  throw new Error('Evidence collection timed out');
}

// Step 5: Generate report with comprehensive scoring
async function generateReport(scanRequest, collectionId) {
  log.section('Step 5: Generating Report with Comprehensive Scoring');
  
  try {
    // Create report generation job
    const reportQueue = new Bull('report-generation', {
      redis: {
        port: 6379,
        host: 'localhost'
      }
    });

    const job = await reportQueue.add('generate-report', {
      scanRequestId: scanRequest.id,
      evidenceCollectionId: collectionId,
      companyName: scanRequest.company_name,
      reportType: 'comprehensive',
      includeScoring: true,
      investmentThesis: scanRequest.investment_thesis
    });

    log.success(`Report generation job created: ${job.id}`);
    
    // Wait for report generation
    log.info('Waiting for report generation...');
    
    let reportId = null;
    const maxAttempts = 30;
    
    for (let i = 0; i < maxAttempts; i++) {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .eq('scan_request_id', scanRequest.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && reports && reports.length > 0) {
        reportId = reports[0].id;
        log.success(`Report generated: ${reportId}`);
        
        // Check for comprehensive scoring
        if (reports[0].metadata?.comprehensiveScore) {
          log.success('Comprehensive scoring included!');
          log.info(`Investment Score: ${reports[0].metadata.comprehensiveScore.weightedScore}/100`);
          log.info(`Confidence: ${reports[0].metadata.comprehensiveScore.confidenceBreakdown.overallConfidence}%`);
          log.info(`Grade: ${reports[0].metadata.comprehensiveScore.finalGrade}`);
        }
        
        return reports[0];
      }
      
      await delay(5000);
    }
    
    throw new Error('Report generation timed out');
  } catch (error) {
    log.error(`Failed to generate report: ${error.message}`);
    throw error;
  }
}

// Step 6: Admin reviews and publishes report
async function adminReviewAndPublish(reportId) {
  log.section('Step 6: Admin Reviews and Publishes Report');
  
  try {
    // Fetch report for review
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;

    log.info('Admin reviewing report...');
    log.info(`Current status: ${report.status || 'draft'}`);
    
    // Check comprehensive scoring
    if (report.metadata?.comprehensiveScore) {
      const score = report.metadata.comprehensiveScore;
      log.info('Comprehensive Scoring Review:');
      log.info(`- Technical Score: ${score.technicalScore}/100`);
      log.info(`- Business Score: ${score.businessScore}/100`);
      log.info(`- Team Score: ${score.teamScore}/100`);
      log.info(`- Overall Confidence: ${score.confidenceBreakdown.overallConfidence}%`);
      
      // Check if confidence meets threshold
      if (score.confidenceBreakdown.overallConfidence < 60) {
        log.warning('Low confidence score - additional evidence may be needed');
      }
    }
    
    // Simulate review time
    await delay(2000);
    
    // Publish report
    const { data: publishedReport, error: publishError } = await supabase
      .from('reports')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: 'admin@example.com',
        quality_score: 85,
        human_reviewed: true
      })
      .eq('id', reportId)
      .select()
      .single();

    if (publishError) throw publishError;

    log.success('Report published successfully!');
    
    return publishedReport;
  } catch (error) {
    log.error(`Failed to publish report: ${error.message}`);
    throw error;
  }
}

// Step 7: Test investor view
async function testInvestorView(reportId) {
  log.section('Step 7: Testing Investor View');
  
  try {
    // Fetch report as investor would see it
    const { data: report, error } = await supabase
      .from('reports')
      .select(`
        *,
        scan_requests!inner(
          company_name,
          website_url,
          investment_thesis
        )
      `)
      .eq('id', reportId)
      .eq('status', 'published')
      .single();

    if (error) throw error;

    log.success('Report accessible to investors');
    log.info(`Company: ${report.scan_requests.company_name}`);
    log.info(`Investment Score: ${report.investment_score}/100`);
    log.info(`Tech Health Score: ${report.tech_health_score}/100`);
    log.info(`Grade: ${report.tech_health_grade}`);
    
    // Check evidence access
    const { data: evidenceItems, error: evidenceError } = await supabase
      .from('evidence_items')
      .select('id, type, confidence_score')
      .eq('company_name', report.scan_requests.company_name)
      .limit(5);

    if (!evidenceError && evidenceItems) {
      log.info(`Evidence items accessible: ${evidenceItems.length} items`);
    }
    
    return report;
  } catch (error) {
    log.error(`Failed to access report as investor: ${error.message}`);
    throw error;
  }
}

// Step 8: Test admin view with full details
async function testAdminView(reportId) {
  log.section('Step 8: Testing Admin View');
  
  try {
    // Fetch report with all details
    const { data: report, error } = await supabase
      .from('reports')
      .select(`
        *,
        scan_requests!inner(*),
        report_citations(count)
      `)
      .eq('id', reportId)
      .single();

    if (error) throw error;

    log.success('Full report accessible to admin');
    log.info(`Report ID: ${report.id}`);
    log.info(`Status: ${report.status}`);
    log.info(`Evidence Count: ${report.evidence_count}`);
    log.info(`Citations: ${report.report_citations?.[0]?.count || 0}`);
    
    // Check comprehensive scoring details
    if (report.metadata?.comprehensiveScore) {
      log.info('Comprehensive Scoring Details:');
      const score = report.metadata.comprehensiveScore;
      
      // Dimension breakdown
      Object.entries(score.dimensionBreakdown).forEach(([dim, details]) => {
        log.info(`- ${dim}: Score ${details.score}, Confidence ${details.confidence}`);
      });
      
      // Missing evidence
      if (score.confidenceBreakdown.missingCriticalEvidence?.length > 0) {
        log.warning(`Missing critical evidence: ${score.confidenceBreakdown.missingCriticalEvidence.join(', ')}`);
      }
    }
    
    return report;
  } catch (error) {
    log.error(`Failed to access admin view: ${error.message}`);
    throw error;
  }
}

// Main test execution
async function runComprehensiveTest() {
  console.log(chalk.bold.cyan('\n🚀 Starting Comprehensive Workflow Test\n'));
  
  try {
    // Step 1: Create scan request
    const scanRequest = await createScanRequest();
    
    // Step 2: Admin configures scan
    const configuredRequest = await adminConfigureScan(scanRequest.id);
    
    // Step 3: Trigger evidence collection
    const { collection, jobId } = await triggerEvidenceCollection(configuredRequest);
    
    // Step 4: Monitor collection
    const completedCollection = await monitorEvidenceCollection(collection.id);
    
    // Step 5: Generate report
    const report = await generateReport(configuredRequest, collection.id);
    
    // Step 6: Admin review and publish
    const publishedReport = await adminReviewAndPublish(report.id);
    
    // Step 7: Test investor view
    await testInvestorView(publishedReport.id);
    
    // Step 8: Test admin view
    await testAdminView(publishedReport.id);
    
    // Summary
    log.section('Test Summary');
    log.success('All workflow steps completed successfully!');
    log.info(`Total test duration: ${Math.round((Date.now() - startTime) / 1000)}s`);
    log.info(`Report URL: ${process.env.VITE_APP_URL}/reports/${publishedReport.id}`);
    
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Check if workers are running
async function checkWorkers() {
  log.section('Checking Worker Status');
  
  const evidenceQueue = new Bull('evidence-collection', {
    redis: { port: 6379, host: 'localhost' }
  });
  
  const reportQueue = new Bull('report-generation', {
    redis: { port: 6379, host: 'localhost' }
  });
  
  try {
    const [evidenceHealth, reportHealth] = await Promise.all([
      evidenceQueue.isReady(),
      reportQueue.isReady()
    ]);
    
    log.success('Redis connection established');
    
    // Check for active workers
    const [evidenceWorkers, reportWorkers] = await Promise.all([
      evidenceQueue.getWorkers(),
      reportQueue.getWorkers()
    ]);
    
    if (evidenceWorkers.length === 0) {
      log.warning('No evidence collection workers detected');
      log.info('Run: npm run worker:evidence:deep');
    }
    
    if (reportWorkers.length === 0) {
      log.warning('No report generation workers detected');
      log.info('Run: npm run worker:report');
    }
    
    return evidenceWorkers.length > 0 && reportWorkers.length > 0;
  } catch (error) {
    log.error('Redis not available. Please start Redis first.');
    return false;
  }
}

// Execute test
const startTime = Date.now();

checkWorkers().then(workersReady => {
  if (!workersReady) {
    log.warning('Workers not running. Please start workers before running test.');
    log.info('Run: npm run workers:deep');
    process.exit(1);
  }
  
  runComprehensiveTest();
});