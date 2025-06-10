import { createClient } from '@supabase/supabase-js';
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

// Test 1: Create and configure scan request
async function testScanRequestWorkflow() {
  log.section('Test 1: Scan Request Workflow');
  
  try {
    // Create scan request
    const { data: scanRequest, error } = await supabase
      .from('scan_requests')
      .insert({
        company_name: TEST_COMPANY.name,
        website_url: TEST_COMPANY.website,
        requested_by: 'f147301a-8aed-4893-b56f-d3d5e04fb80c', // Use existing user ID
        requestor_name: 'Test User',
        organization_name: 'Test Capital',
        status: 'pending',
        investment_thesis_data: TEST_COMPANY.investmentThesis,
        thesis_tags: ['payments', 'infrastructure', 'growth']
      })
      .select()
      .single();

    if (error) throw error;

    log.success(`Scan request created: ${scanRequest.id}`);
    
    // Simulate admin approval
    const { data: approved, error: approveError } = await supabase
      .from('scan_requests')
      .update({
        status: 'processing',
        reviewer_notes: 'Approved for comprehensive scan',
        reviewed_by: 'f147301a-8aed-4893-b56f-d3d5e04fb80c', // Use admin user ID
        review_started_at: new Date().toISOString()
      })
      .eq('id', scanRequest.id)
      .select()
      .single();

    if (approveError) throw approveError;
    
    log.success('Scan request approved');
    
    return scanRequest;
  } catch (error) {
    log.error(`Scan request test failed: ${error.message}`);
    throw error;
  }
}

// Test 2: Check existing reports and evidence
async function testExistingReports() {
  log.section('Test 2: Checking Existing Reports');
  
  try {
    // Get recent reports
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id,
        company_name,
        created_at,
        metadata,
        investment_score,
        tech_health_score,
        tech_health_grade,
        evidence_count,
        human_reviewed
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    log.info(`Found ${reports.length} recent reports`);
    
    // Check for comprehensive scoring
    let reportsWithScoring = 0;
    reports.forEach(report => {
      log.info(`\nReport: ${report.company_name}`);
      log.info(`- Human reviewed: ${report.human_reviewed ? 'Yes' : 'No (Draft)'}`);
      log.info(`- Evidence count: ${report.evidence_count || 0}`);
      
      if (report.metadata?.comprehensiveScore) {
        reportsWithScoring++;
        const score = report.metadata.comprehensiveScore;
        log.success('Has comprehensive scoring!');
        log.info(`- Investment Score: ${score.weightedScore}/100`);
        log.info(`- Confidence: ${score.confidenceBreakdown.overallConfidence}%`);
        log.info(`- Grade: ${score.finalGrade}`);
      } else {
        log.warning('No comprehensive scoring');
      }
    });
    
    log.info(`\n${reportsWithScoring}/${reports.length} reports have comprehensive scoring`);
    
    return reports[0]; // Return most recent report
  } catch (error) {
    log.error(`Report check failed: ${error.message}`);
    throw error;
  }
}

// Test 3: Test UI component data requirements
async function testUIDataRequirements(reportId) {
  log.section('Test 3: UI Component Data Requirements');
  
  try {
    // Fetch report as would be done in view-report.tsx
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        scan_requests:scan_request_id(
          company_name,
          website_url,
          investment_thesis_data
        )
      `)
      .eq('id', reportId)
      .single();

    if (reportError) throw reportError;

    log.success('Report data fetched successfully');
    
    // Check EnhancedEvidenceAppendix requirements
    log.info('\nChecking EnhancedEvidenceAppendix data:');
    log.info(`- Company name: ${report.scan_requests?.company_name || report.company_name}`);
    log.info(`- Report ID: ${report.id}`);
    log.info(`- Has comprehensive score: ${!!report.metadata?.comprehensiveScore}`);
    
    // Fetch evidence items
    const companyName = report.scan_requests?.company_name || report.company_name;
    const { data: evidenceItems, error: evidenceError } = await supabase
      .from('evidence_items')
      .select('id, type, evidence_type, confidence_score, metadata')
      .eq('company_name', companyName)
      .limit(10);

    if (!evidenceError) {
      log.success(`Found ${evidenceItems.length} evidence items`);
      
      // Check confidence scores
      const withConfidence = evidenceItems.filter(e => e.confidence_score !== null);
      log.info(`- ${withConfidence.length}/${evidenceItems.length} have confidence scores`);
      
      // Check for critical evidence types
      const criticalTypes = ['tech_stack', 'api_architecture', 'infrastructure', 'security_headers'];
      const foundCritical = evidenceItems.filter(e => 
        criticalTypes.includes(e.evidence_type || e.type)
      );
      log.info(`- ${foundCritical.length} critical evidence items found`);
    }
    
    // Check ConfidenceVisualization requirements
    if (report.metadata?.comprehensiveScore) {
      log.info('\nChecking ConfidenceVisualization data:');
      const score = report.metadata.comprehensiveScore;
      
      log.info('Required fields:');
      log.info(`- weightedScore: ${score.weightedScore ? '✓' : '✗'}`);
      log.info(`- finalGrade: ${score.finalGrade ? '✓' : '✗'}`);
      log.info(`- investmentRecommendation: ${score.investmentRecommendation ? '✓' : '✗'}`);
      log.info(`- confidenceBreakdown: ${score.confidenceBreakdown ? '✓' : '✗'}`);
      log.info(`- dimension scores: ${score.technicalScore ? '✓' : '✗'}`);
    }
    
    return report;
  } catch (error) {
    log.error(`UI data test failed: ${error.message}`);
    throw error;
  }
}

// Test 4: Test admin vs investor access
async function testAccessControl(reportId) {
  log.section('Test 4: Access Control Testing');
  
  try {
    // Test admin access (full data)
    log.info('Testing admin access...');
    const { data: adminReport, error: adminError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (adminError) throw adminError;
    
    log.success('Admin can access full report data');
    log.info(`- Has metadata: ${!!adminReport.metadata}`);
    log.info(`- Has comprehensive score: ${!!adminReport.metadata?.comprehensiveScore}`);
    
    // Test published report access (investor view)
    log.info('\nTesting investor access...');
    const { data: investorReports, error: investorError } = await supabase
      .from('reports')
      .select(`
        id,
        company_name,
        executive_summary,
        investment_score,
        tech_health_score,
        tech_health_grade,
        report_data,
        created_at
      `)
      .eq('human_reviewed', true)
      .limit(5);

    if (investorError) throw investorError;
    
    log.success(`Investor can access ${investorReports.length} published reports`);
    
    // Check what data is visible
    if (investorReports.length > 0) {
      const sampleReport = investorReports[0];
      log.info('\nInvestor visible fields:');
      log.info(`- Company: ${sampleReport.company_name}`);
      log.info(`- Investment Score: ${sampleReport.investment_score}`);
      log.info(`- Tech Health: ${sampleReport.tech_health_score}`);
      log.info(`- Has executive summary: ${!!sampleReport.executive_summary}`);
      log.info(`- Has detailed sections: ${!!sampleReport.report_data?.sections}`);
    }
    
    return { adminReport, investorReports };
  } catch (error) {
    log.error(`Access control test failed: ${error.message}`);
    throw error;
  }
}

// Test 5: Test report publishing workflow
async function testPublishingWorkflow() {
  log.section('Test 5: Publishing Workflow');
  
  try {
    // Find a draft report (not human reviewed)
    const { data: draftReports, error: draftError } = await supabase
      .from('reports')
      .select('id, company_name, metadata, human_reviewed')
      .eq('human_reviewed', false)
      .limit(1);

    if (draftError) throw draftError;
    
    if (draftReports.length === 0) {
      log.warning('No draft reports found to test publishing');
      return null;
    }
    
    const draftReport = draftReports[0];
    log.info(`Found draft report: ${draftReport.company_name}`);
    
    // Check publishing requirements
    const hasScore = !!draftReport.metadata?.comprehensiveScore;
    const confidence = draftReport.metadata?.comprehensiveScore?.confidenceBreakdown?.overallConfidence || 0;
    
    log.info('Publishing requirements:');
    log.info(`- Has comprehensive score: ${hasScore ? '✓' : '✗'}`);
    log.info(`- Confidence level: ${confidence}% ${confidence >= 60 ? '✓' : '✗ (min 60%)'}`);
    
    if (hasScore && confidence >= 60) {
      // Simulate publishing
      const { data: published, error: publishError } = await supabase
        .from('reports')
        .update({
          human_reviewed: true,
          quality_score: 85
        })
        .eq('id', draftReport.id)
        .select()
        .single();

      if (publishError) throw publishError;
      
      log.success('Report published successfully!');
      return published;
    } else {
      log.warning('Report does not meet publishing requirements');
      return null;
    }
  } catch (error) {
    log.error(`Publishing test failed: ${error.message}`);
    throw error;
  }
}

// Main test execution
async function runWorkflowTests() {
  console.log(chalk.bold.cyan('\n🚀 Starting Workflow Tests\n'));
  
  const results = {
    scanRequest: null,
    reports: null,
    uiData: null,
    accessControl: null,
    publishing: null
  };
  
  try {
    // Test 1: Scan request workflow
    results.scanRequest = await testScanRequestWorkflow();
    
    // Test 2: Check existing reports
    const reports = await testExistingReports();
    results.reports = reports;
    
    if (reports) {
      // Test 3: UI data requirements
      results.uiData = await testUIDataRequirements(reports.id);
      
      // Test 4: Access control
      results.accessControl = await testAccessControl(reports.id);
    }
    
    // Test 5: Publishing workflow
    results.publishing = await testPublishingWorkflow();
    
    // Summary
    log.section('Test Summary');
    
    const allPassed = Object.values(results).every(r => r !== null);
    if (allPassed) {
      log.success('All tests completed successfully!');
    } else {
      log.warning('Some tests could not complete - check logs above');
    }
    
    // Recommendations
    log.section('Recommendations');
    
    if (!results.reports || !results.reports.metadata?.comprehensiveScore) {
      log.warning('No reports with comprehensive scoring found');
      log.info('To test full workflow:');
      log.info('1. Start workers: npm run workers:deep');
      log.info('2. Create a new scan from admin dashboard');
      log.info('3. Wait for evidence collection and report generation');
    }
    
    log.info('\nView reports at:');
    log.info(`- Admin: ${process.env.VITE_APP_URL || 'http://localhost:3000'}/admin/dashboard`);
    log.info(`- Investor: ${process.env.VITE_APP_URL || 'http://localhost:3000'}/reports`);
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Execute tests
runWorkflowTests();