#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSnowplowReport() {
  // Get the most recent Snowplow scan
  const { data: scans } = await supabase
    .from('scan_requests')
    .select('*')
    .ilike('company_name', '%snowplow%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!scans || scans.length === 0) {
    console.log('No Snowplow scans found');
    return;
  }

  const scan = scans[0];
  console.log(`\nChecking Snowplow scan: ${scan.id}`);
  console.log(`Created: ${new Date(scan.created_at).toLocaleString()}`);
  console.log(`Status: ${scan.status}`);

  // Get the report
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('scan_request_id', scan.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!reports || reports.length === 0) {
    console.log('No report found for this scan');
    return;
  }

  const report = reports[0];
  console.log(`\nReport ID: ${report.id}`);
  console.log(`Type: ${report.report_type}`);
  
  // Analyze report content
  const reportData = report.report_data;
  
  if (reportData?.sections) {
    console.log('\n=== REPORT SECTIONS ANALYSIS ===\n');
    
    Object.entries(reportData.sections).forEach(([key, section]) => {
      console.log(`### ${section.title || key}`);
      
      if (section.content) {
        // Check for generic content patterns
        const genericPatterns = [
          'I apologize',
          'cannot provide',
          'limited evidence',
          'insufficient evidence',
          'analysis pending'
        ];
        
        const hasGenericContent = genericPatterns.some(pattern => 
          section.content.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (hasGenericContent) {
          console.log('❌ GENERIC CONTENT DETECTED');
          // Show first 300 chars of the problematic content
          console.log(`Content preview: "${section.content.slice(0, 300)}..."`);
        } else {
          console.log('✓ Has specific content');
          // Show a sample of good content
          const lines = section.content.split('\n').filter(l => l.trim());
          console.log(`Sample: "${lines[0]?.slice(0, 150) || 'No content'}..."`);
        }
      }
      
      console.log('---\n');
    });
  }
  
  // Check evidence count
  const { data: evidence } = await supabase
    .from('evidence_items')
    .select('id, evidence_type, source_url')
    .eq('scan_request_id', scan.id);
  
  console.log(`\nEvidence collected: ${evidence?.length || 0} items`);
  
  if (evidence && evidence.length > 0) {
    // Group by type
    const types = evidence.reduce((acc, item) => {
      acc[item.evidence_type] = (acc[item.evidence_type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nEvidence types:');
    Object.entries(types).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });
  }
}

checkSnowplowReport().catch(console.error);