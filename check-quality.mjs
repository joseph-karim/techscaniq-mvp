#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkQuality() {
  console.log('=== CHECKING PIPELINE OUTPUT QUALITY ===\n');
  
  // Get latest evidence collections
  const { data: collections } = await supabase
    .from('evidence_collections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('Recent Evidence Collections:');
  collections?.forEach(col => {
    console.log(`\n- ${col.company_name} (${col.created_at})`);
    console.log(`  Status: ${col.status}, Evidence count: ${col.evidence_count}`);
    console.log(`  Type: ${col.collection_type}`);
    
    if (col.metadata?.evidence_raw && col.metadata.evidence_raw.length > 0) {
      console.log(`  Evidence sources: ${[...new Set(col.metadata.evidence_raw.map(e => e.source))].join(', ')}`);
      
      // Show sample evidence content
      const sample = col.metadata.evidence_raw[0];
      console.log(`  Sample evidence:`);
      console.log(`    Source: ${sample.source}`);
      console.log(`    Type: ${sample.type || 'N/A'}`);
      console.log(`    Content preview: ${JSON.stringify(sample.content || sample).substring(0, 200)}...`);
    }
  });
  
  // Get latest reports
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
    
  console.log('\n\nRecent Reports:');
  reports?.forEach(report => {
    console.log(`\n- ${report.company_name} (${report.created_at})`);
    console.log(`  Investment score: ${report.investment_score}`);
    console.log(`  Evidence count: ${report.evidence_count}, Citations: ${report.citation_count}`);
    console.log(`  Model: ${report.ai_model_used}`);
    
    if (report.executive_summary) {
      console.log(`  Executive summary: "${report.executive_summary.substring(0, 200)}..."`);
    }
    
    if (report.report_data?.sections) {
      console.log(`  Sections:`);
      Object.entries(report.report_data.sections).forEach(([key, section]) => {
        console.log(`    - ${section.title}`);
        if (section.content) {
          console.log(`      "${section.content.substring(0, 150)}..."`);
        }
      });
    }
  });
  
  // Check citations
  const { data: citations } = await supabase
    .from('citations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log('\n\nRecent Citations:');
  if (citations && citations.length > 0) {
    citations.forEach(cite => {
      console.log(`\n- "${cite.quote}" from ${cite.source_url || 'unknown source'}`);
      console.log(`  Location: ${cite.report_location}`);
    });
  } else {
    console.log('No citations found');
  }
  
  // Analyze quality issues
  console.log('\n\n=== QUALITY ANALYSIS ===');
  
  const completedCollections = collections?.filter(c => c.status === 'completed') || [];
  const failedCollections = collections?.filter(c => c.status === 'failed') || [];
  
  console.log(`\nCollection success rate: ${completedCollections.length}/${collections?.length || 0}`);
  console.log(`Failed collections: ${failedCollections.length}`);
  
  if (reports && reports.length > 0) {
    const avgScore = reports.reduce((sum, r) => sum + (r.investment_score || 0), 0) / reports.length;
    const avgCitations = reports.reduce((sum, r) => sum + (r.citation_count || 0), 0) / reports.length;
    
    console.log(`\nAverage investment score: ${avgScore.toFixed(1)}`);
    console.log(`Average citations per report: ${avgCitations.toFixed(1)}`);
  }
}

checkQuality().catch(console.error);