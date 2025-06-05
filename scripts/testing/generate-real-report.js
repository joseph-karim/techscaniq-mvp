import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Local Supabase JWT secret
const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';

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

console.log('Generated JWT:', token);

// Function to call the report orchestrator
async function generateReport() {
  try {
    console.log('\n🚀 Starting report generation for Ring4...\n');
    
    const scanRequestId = uuidv4();
    console.log('Scan Request ID:', scanRequestId);
    
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
        scan_request_id: scanRequestId,
        investor_name: 'Demo Capital Partners',
        assessment_context: 'Series B Investment Evaluation'
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('Error response:', responseText);
      return;
    }

    const result = JSON.parse(responseText);
    console.log('\n✅ Report generation successful!');
    console.log('Report ID:', result.report_id);
    console.log('Investment Score:', result.investment_score);
    console.log('\nView the report at:');
    console.log(`http://localhost:5174/reports/${result.report_id}`);
    
    // Also check for scan_request_id route
    if (result.scan_request_id) {
      console.log(`http://localhost:5174/scans/${result.scan_request_id}`);
    }
    
    console.log('\nReport Summary:');
    if (result.report_data?.executiveSummary) {
      console.log('- Investment Score:', result.report_data.executiveSummary.investmentScore);
      console.log('- Recommendation:', result.report_data.executiveSummary.recommendation);
      console.log('- Key Strengths:', result.report_data.executiveSummary.keyStrengths?.length || 0);
      console.log('- Key Risks:', result.report_data.executiveSummary.keyRisks?.length || 0);
    }
    
  } catch (error) {
    console.error('Error generating report:', error);
  }
}

// Wait a bit for functions to be ready, then generate report
setTimeout(generateReport, 3000); 