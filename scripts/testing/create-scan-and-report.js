import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Local Supabase configuration
const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a valid JWT for local testing
const token = jwt.sign(
  {
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour from now
    sub: 'test-user',
    email: 'test@example.com',
    role: 'authenticated'
  },
  JWT_SECRET
);

async function createScanRequestAndGenerateReport() {
  try {
    console.log('🚀 Creating scan request for Ring4...\n');

    // First, create a scan request
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: 'Ring4',
        website_url: 'https://ring4.com',
        status: 'processing',
        requestor_name: 'Demo User',
        organization_name: 'Demo Capital Partners',
        company_description: 'Ring4 is a cloud-based business phone system for teams',
        primary_criteria: 'Technology infrastructure and scalability',
        secondary_criteria: 'Market position and growth potential',
        thesis_tags: ['SaaS', 'Communications', 'B2B']
      })
      .select()
      .single();

    if (scanError) {
      console.error('Error creating scan request:', scanError);
      return;
    }

    console.log('✅ Scan request created successfully!');
    console.log('Scan Request ID:', scanRequest.id);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now generate the report
    console.log('\n📊 Generating report...\n');
    console.log('⏳ This may take 30-60 seconds as the system collects and analyzes evidence...\n');
    
    const response = await fetch('http://127.0.0.1:54321/functions/v1/report-orchestrator-v3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-custom-role': 'admin'
      },
      body: JSON.stringify({
        company_name: 'Ring4',
        website_url: 'https://ring4.com',
        depth: 'deep',
        report_type: 'deep-dive',
        user_id: 'test-user',
        scan_request_id: scanRequest.id,
        investor_name: 'Demo Capital Partners',
        assessment_context: 'Series B Investment Evaluation'
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (!response.ok) {
      console.error('Error response:', responseText);
      
      // Update scan request status to error
      await supabase
        .from('scan_requests')
        .update({ status: 'error' })
        .eq('id', scanRequest.id);
      
      return;
    }

    const result = JSON.parse(responseText);
    console.log('\n✅ Report generation successful!');
    console.log('Report ID:', result.report_id);
    console.log('Investment Score:', result.investment_score);
    console.log('\n🔗 View the report at:');
    console.log(`http://localhost:5174/reports/${result.report_id}`);
    console.log(`http://localhost:5174/scans/${scanRequest.id}`);
    
    console.log('\n📊 Report Summary:');
    if (result.report_data?.executiveSummary) {
      console.log('- Investment Score:', result.report_data.executiveSummary.investmentScore);
      console.log('- Recommendation:', result.report_data.executiveSummary.recommendation);
      console.log('- Key Strengths:', result.report_data.executiveSummary.keyStrengths?.length || 0);
      console.log('- Key Risks:', result.report_data.executiveSummary.keyRisks?.length || 0);
    }

    // Update scan request with report info
    await supabase
      .from('scan_requests')
      .update({ 
        status: 'complete',
        report_id: result.report_id,
        ai_confidence: result.report_data?.executiveSummary?.investmentScore || 0,
        tech_health_score: result.report_data?.technologyAssessment?.overallHealthScore || 0
      })
      .eq('id', scanRequest.id);

    console.log('\n🎉 Process completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the process
createScanRequestAndGenerateReport(); 