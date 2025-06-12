#!/usr/bin/env node
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Test environment
console.log('Environment Check:');
console.log('- Supabase URL:', process.env.VITE_SUPABASE_URL ? '✓' : '✗');
console.log('- Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
console.log('- Anthropic Key:', process.env.ANTHROPIC_API_KEY ? '✓' : '✗');

async function testPipeline() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n1. Testing Supabase connection...');
  const { data, error } = await supabase
    .from('scan_requests')
    .select('id, company_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Supabase error:', error);
    return;
  }

  console.log(`✓ Found ${data?.length || 0} recent scan requests`);
  
  if (data && data.length > 0) {
    console.log('\nRecent scans:');
    data.forEach(scan => {
      console.log(`- ${scan.company_name} (${new Date(scan.created_at).toLocaleDateString()})`);
    });
    
    // Check if we have a Snowplow scan
    const snowplowScan = data.find(s => s.company_name.toLowerCase().includes('snowplow'));
    if (snowplowScan) {
      console.log(`\n✓ Found existing Snowplow scan: ${snowplowScan.id}`);
      
      // Check for reports
      const { data: reports } = await supabase
        .from('reports')
        .select('id, report_type, created_at, report_data')
        .eq('scan_request_id', snowplowScan.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (reports && reports.length > 0) {
        console.log(`\n✓ Found report: ${reports[0].id}`);
        console.log(`Type: ${reports[0].report_type}`);
        console.log(`Created: ${new Date(reports[0].created_at).toLocaleString()}`);
        
        // Check report quality
        const reportData = reports[0].report_data;
        if (reportData?.sections) {
          console.log('\nReport sections:');
          Object.entries(reportData.sections).forEach(([key, section]) => {
            console.log(`- ${section.title || key}`);
            if (section.content) {
              // Check if it's the generic error message
              if (section.content.includes('I apologize') || section.content.includes('cannot provide')) {
                console.log('  ⚠️  Generic/Error content detected');
              } else {
                console.log('  ✓ Has specific content');
              }
            }
          });
        }
      }
    }
  }
}

testPipeline().catch(console.error);