import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestReport() {
  const scanRequestId = '9f332d98-093e-4186-8e6d-c060728836b4';
  
  // Get the latest report
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('scan_request_id', scanRequestId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error fetching report:', error);
    return;
  }
  
  console.log('\n=== Report Summary ===');
  console.log('Report ID:', report.id);
  console.log('Company:', report.company_name);
  console.log('Investment Score:', report.investment_score);
  console.log('Tech Health Score:', report.tech_health_score);
  console.log('Tech Health Grade:', report.tech_health_grade);
  console.log('Evidence Count:', report.evidence_count);
  console.log('Citation Count:', report.citation_count);
  console.log('Report Version:', report.report_version);
  console.log('Created:', new Date(report.created_at).toLocaleString());
  
  console.log('\n=== Executive Summary ===');
  console.log(report.executive_summary);
  
  // Check sections
  if (report.report_data?.sections) {
    console.log('\n=== Report Sections ===');
    const sections = report.report_data.sections;
    Object.entries(sections).forEach(([key, section]) => {
      console.log(`\n${key.toUpperCase()}:`);
      console.log(`- Title: ${section.title}`);
      console.log(`- Score: ${section.score}`);
      console.log(`- Content Preview: ${section.content?.substring(0, 200)}...`);
      console.log(`- Subsections: ${section.subsections?.length || 0}`);
    });
  }
  
  // Check investment recommendation
  if (report.report_data?.sections?.investment) {
    const investment = report.report_data.sections.investment;
    console.log('\n=== Investment Recommendation ===');
    console.log(investment.content);
  }
  
  // Check comprehensive score
  if (report.report_data?.metadata?.comprehensiveScore) {
    const score = report.report_data.metadata.comprehensiveScore;
    console.log('\n=== Comprehensive Scoring ===');
    console.log('Investment Score:', score.confidenceAdjustedScore);
    console.log('Technical Score:', score.technicalScore);
    console.log('Overall Confidence:', score.confidenceBreakdown.overallConfidence + '%');
    console.log('Evidence Quality:', (score.confidenceBreakdown.evidenceQuality * 100).toFixed(1) + '%');
    console.log('Evidence Coverage:', (score.confidenceBreakdown.evidenceCoverage * 100).toFixed(1) + '%');
  }
  
  // Update scan request to view in UI
  const { error: updateError } = await supabase
    .from('scan_requests')
    .update({
      latest_report_id: report.id
    })
    .eq('id', scanRequestId);
  
  if (updateError) {
    console.error('Error updating scan request:', updateError);
  } else {
    console.log('\n✅ Report published successfully!');
    console.log('View in UI: http://localhost:5173/reports/' + report.id);
  }
  
  process.exit(0);
}

checkLatestReport();