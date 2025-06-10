import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const log = {
  info: (msg) => console.log(chalk.blue(`ℹ️  ${msg}`)),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
  error: (msg) => console.log(chalk.red(`❌ ${msg}`)),
  warning: (msg) => console.log(chalk.yellow(`⚠️  ${msg}`)),
  section: (msg) => console.log(chalk.bold.magenta(`\n🔷 ${msg}\n`))
};

// Test the UI components and data flow
async function testUIFlow() {
  log.section('Testing UI Components and Data Flow');
  
  // 1. Test Admin Dashboard View
  log.info('Testing Admin Dashboard...');
  
  // Get recent scan requests
  const { data: scanRequests, error: scanError } = await supabase
    .from('scan_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (!scanError && scanRequests) {
    log.success(`Found ${scanRequests.length} scan requests`);
    scanRequests.forEach(req => {
      log.info(`- ${req.company_name}: ${req.status}`);
    });
  }
  
  // 2. Test Report List View
  log.section('Testing Report List View');
  
  const { data: reports, error: reportError } = await supabase
    .from('reports')
    .select(`
      id,
      company_name,
      created_at,
      metadata,
      investment_score,
      tech_health_score,
      evidence_count,
      human_reviewed
    `)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (!reportError && reports) {
    log.success(`Found ${reports.length} reports`);
    
    // Group by review status
    const reviewed = reports.filter(r => r.human_reviewed);
    const drafts = reports.filter(r => !r.human_reviewed);
    const withScoring = reports.filter(r => r.metadata?.comprehensiveScore);
    
    log.info(`- Reviewed: ${reviewed.length}`);
    log.info(`- Drafts: ${drafts.length}`);
    log.info(`- With comprehensive scoring: ${withScoring.length}`);
  }
  
  // 3. Test Individual Report View
  if (reports && reports.length > 0) {
    log.section('Testing Individual Report View');
    
    const testReport = reports[0];
    log.info(`Testing report: ${testReport.company_name}`);
    
    // Check if report has all required data
    const checks = {
      'Has ID': !!testReport.id,
      'Has company name': !!testReport.company_name,
      'Has investment score': testReport.investment_score !== null,
      'Has tech health score': testReport.tech_health_score !== null,
      'Has evidence count': testReport.evidence_count !== null,
      'Has metadata': !!testReport.metadata,
      'Has comprehensive score': !!testReport.metadata?.comprehensiveScore
    };
    
    Object.entries(checks).forEach(([check, passed]) => {
      if (passed) {
        log.success(check);
      } else {
        log.warning(check + ' - Missing');
      }
    });
    
    // Test evidence data
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_items')
      .select('id, type, confidence_score')
      .eq('company_name', testReport.company_name)
      .limit(5);
      
    if (!evidenceError && evidence) {
      log.info(`\nEvidence items: ${evidence.length}`);
      evidence.forEach(e => {
        log.info(`- ${e.type}: ${e.confidence_score ? (e.confidence_score * 100).toFixed(0) + '%' : 'No confidence'}`);
      });
    }
  }
  
  // 4. Test UI Routes
  log.section('Testing UI Routes');
  
  const routes = [
    '/dashboard',
    '/admin/dashboard',
    '/admin/scan-config',
    '/reports',
    '/reports/' + (reports?.[0]?.id || 'test-id'),
    '/scans/request-scan'
  ];
  
  log.info('Key routes for testing:');
  routes.forEach(route => {
    log.info(`- http://localhost:3000${route}`);
  });
  
  // 5. Summary
  log.section('UI Testing Summary');
  
  if (reports && reports.filter(r => r.metadata?.comprehensiveScore).length === 0) {
    log.warning('No reports with comprehensive scoring found');
    log.info('\nTo see comprehensive scoring in action:');
    log.info('1. Ensure workers are running with v3: npm run workers:deep');
    log.info('2. Create a new scan request');
    log.info('3. Wait for evidence collection and report generation');
    log.info('4. Check the report for comprehensive scoring visualization');
  } else {
    log.success('Reports with comprehensive scoring are available!');
    log.info('Visit the report pages to see:');
    log.info('- ConfidenceVisualization component in Executive Summary');
    log.info('- EnhancedEvidenceAppendix with confidence scores');
  }
}

// Run the test
testUIFlow().catch(console.error);