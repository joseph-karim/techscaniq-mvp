#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBetterReports() {
  console.log('=== CHECKING RECENT HIGH-QUALITY REPORTS ===\n');
  
  // Reports mentioned in job history with high citation counts
  const reportIds = [
    { id: '60febb11-5851-48ff-af29-bd55fec5ac90', worker: 'claude-orchestrated', citations: 128 },
    { id: 'a1be4b4d-f64d-4725-bf41-533da608daec', worker: 'claude-orchestrated', citations: 125 },
    { id: '49e18654-de43-4074-9dcc-e3a0d176a30b', worker: 'langgraph-v2', citations: 7 },
    { id: '72938ede-d3cd-407d-861b-8b8388619347', worker: 'thesis-aligned', citations: 0 }
  ];
  
  for (const reportInfo of reportIds) {
    console.log(`\n=== Report: ${reportInfo.id} ===`);
    console.log(`Worker: ${reportInfo.worker}`);
    console.log(`Expected citations: ${reportInfo.citations}`);
    
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportInfo.id)
      .single();
      
    if (error) {
      console.log('Error fetching report:', error.message);
      continue;
    }
    
    if (report) {
      console.log(`Company: ${report.company_name}`);
      console.log(`Report Type: ${report.report_type || 'standard'}`);
      console.log(`Quality Score: ${report.quality_score}`);
      console.log(`Evidence Count: ${report.evidence_count}`);
      console.log(`Citation Count: ${report.citation_count}`);
      console.log(`Investment Score: ${report.investment_score || report.report_data?.investment_score || 'N/A'}`);
      console.log(`Created: ${new Date(report.created_at).toLocaleString()}`);
      
      // Check actual citations
      const { data: citations, error: citError } = await supabase
        .from('report_citations')
        .select('id, claim, confidence')
        .eq('report_id', reportInfo.id)
        .limit(3);
        
      if (citations && citations.length > 0) {
        console.log(`\nSample Citations:`);
        citations.forEach((c, i) => {
          console.log(`${i+1}. "${c.claim?.substring(0, 80)}..." (confidence: ${c.confidence})`);
        });
      }
      
      // Check report structure
      if (report.report_data) {
        const keys = Object.keys(report.report_data);
        console.log(`\nReport Structure: ${keys.join(', ')}`);
        
        // Check for evidence references
        const reportStr = JSON.stringify(report.report_data);
        const evidenceRefs = reportStr.match(/⟦\d+⟧/g) || [];
        console.log(`Evidence references in report: ${evidenceRefs.length}`);
      }
    }
  }
  
  // Get the best recent report
  console.log('\n\n=== FINDING BEST RECENT REPORT ===');
  const { data: bestReports } = await supabase
    .from('reports')
    .select('id, company_name, citation_count, quality_score, created_at')
    .order('citation_count', { ascending: false })
    .gt('citation_count', 0)
    .limit(5);
    
  if (bestReports) {
    console.log('\nTop reports by citation count:');
    bestReports.forEach((r, i) => {
      console.log(`${i+1}. ${r.company_name} - ${r.citation_count} citations (${r.id})`);
    });
  }
}

checkBetterReports().catch(console.error);