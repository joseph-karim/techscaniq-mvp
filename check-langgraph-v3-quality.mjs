#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLangGraphV3Quality() {
  const reportId = '23b2d163-ed6e-4458-a440-a8675530c6ba';
  
  console.log('=== LANGGRAPH V3 THESIS-ALIGNED REPORT QUALITY ===\n');
  console.log(`Report ID: ${reportId}`);
  
  // Get the full report
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();
    
  if (!report) {
    console.error('Report not found');
    return;
  }
  
  console.log(`Company: ${report.company_name}`);
  console.log(`Type: ${report.report_type}`);
  console.log(`Thesis: ${report.thesis_type}`);
  console.log(`Citations: ${report.citation_count}`);
  console.log(`Evidence: ${report.evidence_count}`);
  console.log(`Quality Score: ${report.quality_score}`);
  
  // Check weighted scoring
  console.log('\n=== WEIGHTED SCORING ===');
  if (report.weighted_scores) {
    console.log(`Total Score: ${report.weighted_scores.totalScore}%`);
    console.log(`Threshold: ${report.weighted_scores.threshold}%`);
    console.log(`Pass/Fail: ${report.weighted_scores.passed ? 'PASS' : 'FAIL'}`);
    
    console.log('\nBreakdown:');
    report.weighted_scores.breakdown?.forEach(b => {
      console.log(`- ${b.category}: ${b.rawScore}/100 (${b.weight}% weight) = ${b.weightedScore.toFixed(1)} points`);
    });
  }
  
  // Check deep dive sections
  console.log('\n=== DEEP DIVE SECTIONS ===');
  if (report.deep_dive_sections) {
    report.deep_dive_sections.forEach((section, idx) => {
      console.log(`\n${idx + 1}. ${section.title} (${section.weight}% weight)`);
      console.log(`   Score: ${section.rawScore}/100 → ${section.weightedScore.toFixed(1)} weighted`);
      console.log(`   Evidence Count: ${section.evidenceCount || 0}`);
      
      if (section.findings && section.findings.length > 0) {
        console.log(`   Key Findings: ${section.findings.length}`);
        console.log(`   - ${section.findings[0].substring(0, 100)}...`);
      }
      
      if (section.recommendations && section.recommendations.length > 0) {
        console.log(`   Recommendations: ${section.recommendations.length}`);
        console.log(`   - ${section.recommendations[0].substring(0, 100)}...`);
      }
    });
  }
  
  // Check actual citations
  console.log('\n=== CITATION ANALYSIS ===');
  const { data: citations } = await supabase
    .from('report_citations')
    .select('*')
    .eq('report_id', reportId)
    .order('citation_number')
    .limit(10);
    
  if (citations && citations.length > 0) {
    console.log(`\nFirst ${Math.min(10, citations.length)} citations:`);
    citations.forEach((c, idx) => {
      console.log(`\n[${c.citation_number}] ${c.claim?.substring(0, 100)}...`);
      console.log(`    Evidence ID: ${c.evidence_item_id || 'MISSING'}`);
      console.log(`    Source: ${c.source_url || 'N/A'}`);
      console.log(`    Confidence: ${c.confidence || 'N/A'}`);
    });
    
    // Check evidence linkage
    const linkedCitations = citations.filter(c => c.evidence_item_id);
    console.log(`\nEvidence Linkage: ${linkedCitations.length}/${citations.length} citations properly linked`);
  } else {
    console.log('No citations found!');
  }
  
  // Check executive memo
  console.log('\n=== EXECUTIVE MEMO ===');
  if (report.executive_memo) {
    console.log(`Decision: ${report.executive_memo.decision || 'N/A'}`);
    console.log(`\nThesis Fit: ${report.executive_memo.thesisFitSummary?.substring(0, 200)}...`);
    
    if (report.executive_memo.topUpsides?.length > 0) {
      console.log('\nTop Upsides:');
      report.executive_memo.topUpsides.forEach((u, i) => {
        console.log(`${i+1}. ${u.point || u}`);
        if (u.evidenceRefs) {
          console.log(`   Evidence: ${u.evidenceRefs.join(', ')}`);
        }
      });
    }
    
    if (report.executive_memo.topRisks?.length > 0) {
      console.log('\nTop Risks:');
      report.executive_memo.topRisks.forEach((r, i) => {
        console.log(`${i+1}. ${r.point || r}`);
        if (r.evidenceRefs) {
          console.log(`   Evidence: ${r.evidenceRefs.join(', ')}`);
        }
      });
    }
  }
  
  // Check risk register
  console.log('\n=== RISK REGISTER ===');
  if (report.risk_register && report.risk_register.length > 0) {
    report.risk_register.forEach(risk => {
      console.log(`- ${risk.code}: ${risk.description}`);
      console.log(`  L/I: ${risk.likelihood}/${risk.impact}, Mitigation: ${risk.mitigation}`);
    });
  } else {
    console.log('Empty risk register (PE RED FLAG)');
  }
  
  // Check value creation
  console.log('\n=== VALUE CREATION ROADMAP ===');
  if (report.value_creation_roadmap && report.value_creation_roadmap.length > 0) {
    report.value_creation_roadmap.forEach(init => {
      console.log(`- ${init.name} (${init.timelineBucket})`);
      console.log(`  ROI: ${init.roiEstimate}, Cost: ${init.costEstimate}`);
    });
  } else {
    console.log('Empty value creation roadmap (PE RED FLAG)');
  }
  
  // PE-Grade Assessment
  console.log('\n=== PE-GRADE ASSESSMENT ===');
  
  const peChecks = {
    'Citations created': report.citation_count > 0,
    'Evidence-linked citations': citations?.filter(c => c.evidence_item_id).length > 10,
    'Weighted scoring': report.weighted_scores !== null,
    'Deep dive sections': report.deep_dive_sections?.length >= 3,
    'Executive memo': report.executive_memo !== null,
    'Risk register': report.risk_register?.length > 0,
    'Value creation plan': report.value_creation_roadmap?.length > 0,
    'Specific metrics': JSON.stringify(report).includes('%') || JSON.stringify(report).includes('$'),
    'Decision clarity': report.executive_memo?.decision !== null
  };
  
  Object.entries(peChecks).forEach(([check, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${check}`);
  });
  
  const passCount = Object.values(peChecks).filter(Boolean).length;
  console.log(`\nScore: ${passCount}/9 PE criteria met`);
  console.log(`Grade: ${passCount >= 7 ? 'PE-READY' : passCount >= 5 ? 'NEEDS IMPROVEMENT' : 'NOT PE-READY'}`);
}

checkLangGraphV3Quality().catch(console.error);