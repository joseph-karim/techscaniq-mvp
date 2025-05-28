import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function main() {
  console.log('Starting fresh scan request and report generation...\n');
  
  // Create a user token
  const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';
  const userToken = jwt.sign(
    {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {}
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  console.log('Generated JWT token for authentication\n');
  
  // Step 1: Create scan request
  const scanData = {
    company_name: 'Ring4',
    website_url: 'https://ring4.ai',
    requestor_name: 'Test User',
    organization_name: 'Test Organization',
    status: 'pending'
  };
  
  console.log('Creating scan request...');
  const { data: scanRequest, error: scanError } = await supabase
    .from('scan_requests')
    .insert(scanData)
    .select()
    .single();
    
  if (scanError) {
    console.error('Error creating scan request:', scanError);
    return;
  }
  
  console.log('✓ Scan request created:', {
    id: scanRequest.id,
    company_name: scanRequest.company_name,
    status: scanRequest.status
  });
  
  // Step 2: Wait a moment then update status to trigger report generation
  console.log('\nWaiting 2 seconds before triggering report generation...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Calling report-orchestrator-v3 to generate report...');
  const response = await fetch('http://localhost:54321/functions/v1/report-orchestrator-v3', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
      'x-google-api-key': 'AIzaSyA3_4HWUD371ulHhKo_xsTr9tz5C3RD3lg',
      'x-anthropic-api-key': 'ANTHROPIC_API_KEY_PLACEHOLDER',
      'x-jina-api-key': 'jina_9aa1c75a49e24353bbf005ca5798cdcaZIpoGj9_2ZEdAZpuBdEKl8bSqYZO'
    },
    body: JSON.stringify({
      scan_request_id: scanRequest.id
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to generate report:', error);
    return;
  }
  
  const result = await response.json();
  console.log('✓ Report generation response:', result);
  
  // Step 3: Monitor report generation
  console.log('\nMonitoring report generation (checking every 5 seconds)...');
  
  let reportFound = false;
  let attempts = 0;
  const maxAttempts = 24; // 2 minutes max
  
  while (!reportFound && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
    
    // Check scan request status
    const { data: updatedScan, error: fetchError } = await supabase
      .from('scan_requests')
      .select('status, report_id')
      .eq('id', scanRequest.id)
      .single();
      
    if (fetchError) {
      console.error('Error checking scan status:', fetchError);
      continue;
    }
    
    console.log(`  Attempt ${attempts}: Status = ${updatedScan.status}, Report ID = ${updatedScan.report_id || 'not set'}`);
    
    // If report_id is set, check if report exists
    if (updatedScan.report_id) {
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('id, company_name, investment_score, created_at')
        .eq('id', updatedScan.report_id)
        .single();
        
      if (!reportError && report) {
        console.log('\n✓ Report found in database!');
        console.log('Report details:', report);
        
        // Check for citations
        const { data: citations, error: citError } = await supabase
          .from('report_citations')
          .select('*')
          .eq('report_id', report.id);
          
        if (!citError && citations) {
          console.log(`\n✓ Found ${citations.length} citations`);
          if (citations.length > 0) {
            console.log('Sample citation:', citations[0]);
          }
        }
        
        reportFound = true;
      }
    }
  }
  
  if (!reportFound) {
    console.log('\n⚠️ Report generation did not complete within 2 minutes');
    console.log('Check function logs for errors');
  }
  
  // Step 4: Final summary
  console.log('\n=== Final Summary ===');
  const { data: finalScan } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('id', scanRequest.id)
    .single();
    
  console.log('Scan Request:', {
    id: finalScan.id,
    status: finalScan.status,
    report_id: finalScan.report_id,
    created_at: finalScan.created_at
  });
  
  if (finalScan.report_id) {
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', finalScan.report_id)
      .single();
      
    if (report) {
      console.log('\nReport:', {
        id: report.id,
        company_name: report.company_name,
        investment_score: report.investment_score,
        has_executive_summary: !!report.executive_summary,
        has_report_data: !!report.report_data,
        evidence_collection_id: report.evidence_collection_id
      });
      
      // Get citation count
      const { count } = await supabase
        .from('report_citations')
        .select('*', { count: 'exact', head: true })
        .eq('report_id', report.id);
        
      console.log(`Citations: ${count || 0}`);
    }
  }
}

main().catch(console.error); 