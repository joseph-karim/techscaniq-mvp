import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a valid JWT token for local development
const secret = 'super-secret-jwt-token-with-at-least-32-characters-long';
const token = jwt.sign(
  {
    sub: '1234567890',
    role: 'authenticated',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  },
  secret
);

async function generateRing4Report() {
  console.log('Creating scan request for Ring4...');
  
  // First, create a scan request
  const { data: scanRequest, error: scanError } = await supabase
    .from('scan_requests')
    .insert({
      company_name: 'Ring4',
      website_url: 'https://ring4.com',
      status: 'processing',
      requested_by: null,
      requestor_name: 'Joseph Karim',
      organization_name: 'TechScanIQ',
      tech_health_score: 0,
      ai_confidence: 0
    })
    .select()
    .single();
  
  if (scanError) {
    console.error('Error creating scan request:', scanError);
    return;
  }
  
  console.log('Scan request created:', scanRequest.id);
  
  // Call the report orchestrator with JWT token
  console.log('Calling report orchestrator...');
  
  const response = await fetch(`${supabaseUrl}/functions/v1/report-orchestrator-v3`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scan_request_id: scanRequest.id,
      company: {
        name: 'Ring4',
        website: 'https://ring4.com'
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Function error:', error);
    return;
  }
  
  const result = await response.json();
  console.log('Report generation completed!');
  console.log('Report ID:', result.reportId);
  
  // Update the scan request with the report ID and status
  const { error: updateError } = await supabase
    .from('scan_requests')
    .update({
      report_id: result.reportId,
      status: 'completed',
      tech_health_score: result.investmentScore || 75,
      tech_health_grade: result.investmentScore >= 80 ? 'A' : result.investmentScore >= 70 ? 'B' : 'C',
      ai_confidence: 0.85
    })
    .eq('id', scanRequest.id);
  
  if (updateError) {
    console.error('Error updating scan request:', updateError);
  } else {
    console.log('Scan request updated successfully!');
    console.log(`\nView the report at: http://localhost:5174/reports/${scanRequest.id}`);
  }
}

generateRing4Report().catch(console.error); 