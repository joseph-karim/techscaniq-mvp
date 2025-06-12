#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSnowplowStatus() {
  console.log('=== CHECKING SNOWPLOW REPORTS ===\n');
  
  // Get the most recent Snowplow scan
  const { data: scans, error: scanError } = await supabase
    .from('scan_requests')
    .select('*')
    .ilike('company_name', '%snowplow%')
    .order('created_at', { ascending: false })
    .limit(3);

  if (scanError) {
    console.error('Error fetching scans:', scanError);
    return;
  }

  if (!scans || scans.length === 0) {
    console.log('No Snowplow scans found');
    return;
  }

  console.log(`Found ${scans.length} Snowplow scans\n`);

  for (const scan of scans) {
    console.log(`\nScan ID: ${scan.id}`);
    console.log(`Created: ${new Date(scan.created_at).toLocaleString()}`);
    console.log(`Status: ${scan.status}`);
    console.log(`Investment Thesis: ${scan.investment_thesis || 'N/A'}`);

    // Get the report
    const { data: reports } = await supabase
      .from('reports')
      .select('*')
      .eq('scan_request_id', scan.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!reports || reports.length === 0) {
      console.log('❌ No report found for this scan');
      continue;
    }

    const report = reports[0];
    console.log(`\n✓ Report ID: ${report.id}`);
    console.log(`Report Type: ${report.report_type}`);
    
    // Analyze report content
    const reportData = report.report_data;
    
    if (reportData?.sections) {
      console.log('\nReport Quality Analysis:');
      
      let genericCount = 0;
      let specificCount = 0;
      
      Object.entries(reportData.sections).forEach(([key, section]) => {
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
            genericCount++;
            console.log(`  ❌ ${section.title || key}: Generic/Apologetic content`);
          } else {
            specificCount++;
            console.log(`  ✓ ${section.title || key}: Specific content`);
          }
        }
      });
      
      console.log(`\nSummary: ${specificCount} specific sections, ${genericCount} generic sections`);
      
      // Show a sample of problematic content
      if (genericCount > 0) {
        console.log('\nExample of problematic content:');
        Object.entries(reportData.sections).forEach(([key, section]) => {
          if (section.content && section.content.includes('I apologize')) {
            console.log(`\n"${section.content.slice(0, 200)}..."`);
            return false; // Show only first example
          }
        });
      }
    }
    
    // Check evidence
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_items')
      .select('id, evidence_type')
      .eq('scan_request_id', scan.id);
    
    if (!evidenceError && evidence) {
      console.log(`\nEvidence collected: ${evidence.length} items`);
      
      // Group by type
      const types = evidence.reduce((acc, item) => {
        acc[item.evidence_type] = (acc[item.evidence_type] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(types).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

checkSnowplowStatus().catch(console.error);