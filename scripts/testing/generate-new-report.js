import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function generateNewReport() {
  console.log('Creating scan request for Stripe...');
  
  // Create a scan request first
  const { data: scanRequest, error: scanError } = await supabase
    .from('scan_requests')
    .insert({
      company_name: 'Stripe',
      company_website: 'https://stripe.com',
      scan_type: 'comprehensive',
      status: 'in_progress',
      requested_by: 'b8fd75d7-8db5-45ce-8d24-d0ac00fe9dd9',
      tech_health_score: 0,
      ai_confidence: 0
    })
    .select()
    .single();
    
  if (scanError) {
    console.error('Error creating scan request:', scanError);
    return;
  }
  
  console.log('Created scan request:', scanRequest.id);
  
  // Now call the report orchestrator edge function
  console.log('Calling report orchestrator...');
  
  const response = await fetch('http://127.0.0.1:54321/functions/v1/report-orchestrator-v3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY5Mzc0ODIsImV4cCI6MjAwMjUxMzQ4Mn0.6jkXhJrJYUjnFHoNEKghge8YFC4Ai84cQD0EJX5DE30'
    },
    body: JSON.stringify({
      company_name: 'Stripe',
      company_website: 'https://stripe.com',
      scan_request_id: scanRequest.id
    })
  });
  
  if (response.ok) {
    const result = await response.json();
    console.log('Report generation started successfully');
    console.log('Report ID:', result.reportId);
    
    // Update the scan request with the report ID
    const { error: updateError } = await supabase
      .from('scan_requests')
      .update({ 
        report_id: result.reportId,
        status: 'complete',
        tech_health_score: 85,
        tech_health_grade: 'A',
        ai_confidence: 95
      })
      .eq('id', scanRequest.id);
      
    if (updateError) {
      console.error('Error updating scan request:', updateError);
    } else {
      console.log('Scan request updated successfully');
      console.log(`\nYou can view the report at:`);
      console.log(`http://localhost:5174/reports/${result.reportId}`);
      console.log(`\nOr view it in the reports list at:`);
      console.log(`http://localhost:5174/reports`);
    }
  } else {
    console.error('Failed to generate report:', response.status, await response.text());
  }
}

generateNewReport(); 