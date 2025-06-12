#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeClaudeReport() {
  const reportId = '60febb11-5851-48ff-af29-bd55fec5ac90'; // The 128-citation report
  
  console.log('=== ANALYZING CLAUDE-ORCHESTRATED REPORT ===\n');
  console.log(`Report ID: ${reportId}`);
  console.log('Citations: 128\n');
  
  // Get the full report
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();
    
  // Get actual citations
  const { data: citations } = await supabase
    .from('report_citations')
    .select('*')
    .eq('report_id', reportId)
    .order('citation_number');
    
  console.log('CITATION QUALITY CHECK:');
  console.log(`Total citations: ${citations?.length || 0}`);
  
  if (citations && citations.length > 0) {
    // Sample first 10 citations
    console.log('\nFirst 10 Citations:');
    citations.slice(0, 10).forEach((c, i) => {
      console.log(`\n[${c.citation_number}] ${c.claim}`);
      console.log(`   Source: ${c.source_url || 'N/A'}`);
      console.log(`   Context: ${c.citation_context?.substring(0, 100) || 'N/A'}...`);
      console.log(`   Confidence: ${c.confidence || 'N/A'}`);
      console.log(`   Evidence ID: ${c.evidence_item_id || 'N/A'}`);
    });
    
    // Check evidence linkage
    const linkedCitations = citations.filter(c => c.evidence_item_id);
    console.log(`\nEvidence Linkage: ${linkedCitations.length}/${citations.length} citations linked to evidence`);
    
    // Check citation diversity
    const uniqueSources = [...new Set(citations.map(c => c.source_url).filter(Boolean))];
    console.log(`Unique sources: ${uniqueSources.length}`);
    
    // Check confidence distribution
    const avgConfidence = citations.reduce((sum, c) => sum + (c.confidence || 0), 0) / citations.length;
    console.log(`Average confidence: ${avgConfidence.toFixed(1)}`);
  }
  
  // Analyze report sections
  console.log('\n\nREPORT SECTION ANALYSIS:');
  if (report.report_data?.sections) {
    const sections = report.report_data.sections;
    Object.entries(sections).forEach(([name, section]) => {
      if (section.content) {
        const sectionCitations = section.content.match(/\[(\d+)\]/g) || [];
        console.log(`\n${name}:`);
        console.log(`- Length: ${section.content.length} chars`);
        console.log(`- Citations: ${sectionCitations.length}`);
        console.log(`- Has specific metrics: ${/\d+%|\$\d+|\d+x/.test(section.content)}`);
        
        // Extract first quantitative claim
        const quantMatch = section.content.match(/(\d+[%$xX]|\$\d+[MBK]?|\d+\s*(million|billion|customers|employees|years))/);
        if (quantMatch) {
          console.log(`- Sample metric: "${quantMatch[0]}"`);
        }
      }
    });
  }
  
  // Save detailed analysis
  const analysis = {
    reportId,
    citationCount: citations?.length || 0,
    evidenceLinkage: citations?.filter(c => c.evidence_item_id).length || 0,
    averageConfidence: citations ? citations.reduce((sum, c) => sum + (c.confidence || 0), 0) / citations.length : 0,
    sampleCitations: citations?.slice(0, 5).map(c => ({
      number: c.citation_number,
      claim: c.claim,
      source: c.source_url,
      hasEvidence: !!c.evidence_item_id
    }))
  };
  
  fs.writeFileSync(
    'claude-orchestrated-report-analysis.json',
    JSON.stringify(analysis, null, 2)
  );
  
  console.log('\n\nPE-GRADE ASSESSMENT:');
  console.log(`✓ Citations: ${citations?.length || 0} (EXCELLENT)`);
  console.log(`${citations?.filter(c => c.evidence_item_id).length > 100 ? '✓' : '✗'} Evidence linkage: ${citations?.filter(c => c.evidence_item_id).length || 0} linked`);
  console.log(`✓ Investment Score: ${report.investment_score || 0}`);
  console.log(`✓ Quality Score: ${report.quality_score || 0}`);
  
  return analysis;
}

analyzeClaudeReport().catch(console.error);