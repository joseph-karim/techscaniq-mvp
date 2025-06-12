#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReportQuality() {
  const reportId = '72938ede-d3cd-407d-861b-8b8388619347';
  
  console.log('=== PE REPORT QUALITY ASSESSMENT ===\n');
  console.log(`Report ID: ${reportId}`);
  console.log('Company: Snowplow\n');
  
  // 1. Get the full report
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();
    
  if (reportError) {
    console.error('Error fetching report:', reportError);
    return;
  }
  
  // 2. Check evidence base
  console.log('EVIDENCE BASE:');
  const { data: citations } = await supabase
    .from('report_citations')
    .select('*')
    .eq('report_id', reportId);
    
  console.log(`- Citations: ${citations?.length || 0}`);
  console.log(`- Quality Score: ${report.quality_score || 0}`);
  console.log(`- Evidence Count: ${report.evidence_count || 0}`);
  
  // 3. Analyze report structure
  console.log('\nREPORT STRUCTURE:');
  const reportData = report.report_data;
  
  if (reportData) {
    console.log('\nEXECUTIVE MEMO:');
    if (reportData.executive_memo) {
      console.log(`- Decision: ${reportData.executive_memo.decision}`);
      console.log(`- Thesis Fit: ${reportData.executive_memo.thesisFitSummary?.substring(0, 100)}...`);
      console.log('\nTop Upsides:');
      reportData.executive_memo.topUpsides?.forEach((u, i) => {
        console.log(`  ${i+1}. ${u.point}`);
        console.log(`     Evidence: ${u.evidenceRefs?.join(', ') || 'NONE'}`);
      });
      console.log('\nTop Risks:');
      reportData.executive_memo.topRisks?.forEach((r, i) => {
        console.log(`  ${i+1}. ${r.point}`);
        console.log(`     Evidence: ${r.evidenceRefs?.join(', ') || 'NONE'}`);
      });
    }
    
    console.log('\nWEIGHTED SCORING:');
    if (reportData.weighted_scores) {
      console.log(`- Total Score: ${reportData.weighted_scores.totalScore}%`);
      console.log(`- Threshold: ${reportData.weighted_scores.threshold}%`);
      console.log(`- Pass/Fail: ${reportData.weighted_scores.passed ? 'PASS' : 'FAIL'}`);
      console.log('\nBreakdown:');
      reportData.weighted_scores.breakdown?.forEach(b => {
        console.log(`  - ${b.category}: ${b.rawScore}/100 (${b.weight}% weight) = ${b.weightedScore} points`);
      });
    }
    
    console.log('\nDEEP DIVE SECTIONS:');
    if (reportData.deep_dive_sections) {
      reportData.deep_dive_sections.forEach(section => {
        console.log(`\n${section.title} (${section.weight}% weight):`);
        console.log(`- Raw Score: ${section.rawScore}/100`);
        console.log(`- Findings: ${section.findings?.length || 0}`);
        console.log(`- Recommendations: ${section.recommendations?.length || 0}`);
        console.log(`- Evidence Refs: ${section.evidenceRefs?.join(', ') || 'NONE'}`);
        
        if (section.findings && section.findings.length > 0) {
          console.log('  Sample Finding:');
          const finding = section.findings[0];
          console.log(`    Evidence: ${finding.evidence}`);
          console.log(`    Observation: ${finding.observation}`);
          console.log(`    Impact: ${finding.impact} (${finding.score > 0 ? '+' : ''}${finding.score})`);
        }
      });
    }
    
    console.log('\nRISK REGISTER:');
    if (reportData.risk_register && reportData.risk_register.length > 0) {
      reportData.risk_register.forEach(risk => {
        console.log(`- ${risk.code}: ${risk.description}`);
        console.log(`  Likelihood: ${risk.likelihood}, Impact: ${risk.impact}`);
        console.log(`  Mitigation: ${risk.mitigation}`);
        console.log(`  Evidence: ${risk.evidenceRefs?.join(', ') || 'NONE'}`);
      });
    } else {
      console.log('- No risks identified (RED FLAG for PE)');
    }
    
    console.log('\nVALUE CREATION ROADMAP:');
    if (reportData.value_creation_roadmap && reportData.value_creation_roadmap.length > 0) {
      reportData.value_creation_roadmap.forEach(init => {
        console.log(`- ${init.name} (${init.timelineBucket})`);
        console.log(`  ROI: ${init.roiEstimate}, Cost: ${init.costEstimate}`);
        console.log(`  Evidence: ${init.evidenceRefs?.join(', ') || 'NONE'}`);
      });
    } else {
      console.log('- No initiatives identified (RED FLAG for PE)');
    }
  }
  
  // 4. Check citation quality
  console.log('\n=== CITATION ANALYSIS ===');
  const evidenceRefs = JSON.stringify(reportData).match(/⟦\d+⟧/g) || [];
  console.log(`Evidence markers found in report: ${evidenceRefs.length}`);
  console.log(`Unique evidence refs: ${[...new Set(evidenceRefs)].join(', ')}`);
  
  // 5. Check actual evidence
  console.log('\n=== EVIDENCE VERIFICATION ===');
  const { data: scanRequest } = await supabase
    .from('scan_requests')
    .select('id, company_name')
    .eq('id', report.scan_request_id)
    .single();
    
  if (scanRequest) {
    const { data: collections } = await supabase
      .from('evidence_collections')
      .select('id, evidence_count')
      .eq('company_name', scanRequest.company_name);
      
    console.log(`Evidence collections for ${scanRequest.company_name}: ${collections?.length || 0}`);
    
    if (collections && collections.length > 0) {
      const collectionId = collections[0].id;
      const { data: evidenceItems } = await supabase
        .from('evidence_items')
        .select('id, type, source_data, content_data')
        .eq('collection_id', collectionId)
        .limit(5);
        
      console.log(`Evidence items found: ${evidenceItems?.length || 0}`);
      if (evidenceItems && evidenceItems.length > 0) {
        console.log('\nSample evidence:');
        evidenceItems.forEach((item, i) => {
          console.log(`${i+1}. Type: ${item.type}`);
          console.log(`   Source: ${item.source_data?.url || 'N/A'}`);
          console.log(`   Content: ${item.content_data?.summary?.substring(0, 100) || 'N/A'}...`);
        });
      }
    }
  }
  
  // 6. PE-Grade Assessment
  console.log('\n=== PE-GRADE ASSESSMENT ===');
  
  const assessmentCriteria = {
    'Evidence-based claims': citations?.length > 0 ? 'FAIL - No citations' : 'FAIL',
    'Quantitative metrics': reportData.weighted_scores ? 'PARTIAL' : 'FAIL',
    'Risk identification': reportData.risk_register?.length > 0 ? 'PASS' : 'FAIL',
    'Value creation plan': reportData.value_creation_roadmap?.length > 0 ? 'PASS' : 'FAIL',
    'Citation traceability': evidenceRefs.length > 0 && citations?.length > 0 ? 'PASS' : 'FAIL',
    'Professional language': 'NEEDS REVIEW',
    'Data specificity': 'NEEDS REVIEW'
  };
  
  Object.entries(assessmentCriteria).forEach(([criterion, result]) => {
    console.log(`- ${criterion}: ${result}`);
  });
  
  const passCount = Object.values(assessmentCriteria).filter(v => v === 'PASS').length;
  const totalCriteria = Object.keys(assessmentCriteria).length;
  
  console.log(`\nOVERALL GRADE: ${passCount}/${totalCriteria} criteria passed`);
  console.log(`PE-READY: ${passCount >= 5 ? 'YES' : 'NO - Needs significant improvement'}`);
}

checkReportQuality().catch(console.error);