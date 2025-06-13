#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPipelineImprovements() {
  console.log('=== TESTING PIPELINE IMPROVEMENTS ===\n');
  
  // Check for existing scan request
  const { data: scans } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('company_name', 'Snowplow')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (!scans || scans.length === 0) {
    console.log('❌ No Snowplow scan request found');
    return;
  }
  
  const scanRequest = scans[0];
  console.log(`✓ Found scan request: ${scanRequest.id}`);
  
  // Check evidence collection
  const { data: evidence, count } = await supabase
    .from('evidence_items')
    .select('*, evidence_type, source', { count: 'exact' })
    .eq('scan_request_id', scanRequest.id);
    
  console.log(`\n📊 Evidence Statistics:`);
  console.log(`Total evidence items: ${count || 0}`);
  
  if (evidence && evidence.length > 0) {
    // Group by type
    const typeGroups = {};
    evidence.forEach(item => {
      typeGroups[item.evidence_type] = (typeGroups[item.evidence_type] || 0) + 1;
    });
    
    console.log('\nEvidence by type:');
    Object.entries(typeGroups)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
    // Group by source
    const sourceGroups = {};
    evidence.forEach(item => {
      sourceGroups[item.source] = (sourceGroups[item.source] || 0) + 1;
    });
    
    console.log('\nEvidence by source:');
    Object.entries(sourceGroups)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
      
    // Check for technical evidence
    const technicalEvidence = evidence.filter(e => 
      ['technology_stack', 'security_analysis', 'api_response', 'deep_crawl'].includes(e.evidence_type)
    );
    
    console.log(`\n🔧 Technical Evidence: ${technicalEvidence.length} items`);
    
    // Check for Skyvern evidence
    const skyvernEvidence = evidence.filter(e => e.source === 'skyvern-discovery');
    console.log(`🤖 Skyvern Discovery: ${skyvernEvidence.length} items`);
    
    // Check for iterative research evidence
    const iterativeEvidence = evidence.filter(e => e.source === 'iterative-research');
    console.log(`🔄 Iterative Research: ${iterativeEvidence.length} items`);
    
  } else {
    console.log('\n⚠️  No evidence found yet');
  }
  
  // Check reports
  const { data: reports } = await supabase
    .from('reports')
    .select('*, investment_score, citation_count, evidence_count')
    .eq('scan_request_id', scanRequest.id)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (reports && reports.length > 0) {
    const report = reports[0];
    console.log('\n📄 Latest Report:');
    console.log(`  Report ID: ${report.id}`);
    console.log(`  Investment Score: ${report.investment_score || 'N/A'}`);
    console.log(`  Citations: ${report.citation_count || 0}`);
    console.log(`  Evidence Used: ${report.evidence_count || 0}`);
    console.log(`  Created: ${new Date(report.created_at).toLocaleString()}`);
  } else {
    console.log('\n⚠️  No reports generated yet');
  }
  
  console.log('\n✅ Pipeline check complete!');
}

testPipelineImprovements().catch(console.error);