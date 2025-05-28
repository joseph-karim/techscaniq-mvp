import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkScanRequest() {
  // Get the latest scan request
  const { data: scanRequest, error } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('id', 'fd363bb3-bafa-4bb7-86b6-b27bc7012747')
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Scan Request Status:', scanRequest.status);
  console.log('Report ID:', scanRequest.report_id);
  console.log('Tech Health Score:', scanRequest.tech_health_score);
  console.log('Tech Health Grade:', scanRequest.tech_health_grade);
  console.log('AI Confidence:', scanRequest.ai_confidence);
  
  // Update the status to complete if needed
  if (scanRequest.status !== 'complete') {
    const { error: updateError } = await supabase
      .from('scan_requests')
      .update({ status: 'complete' })
      .eq('id', scanRequest.id);
      
    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      console.log('Updated status to complete');
    }
  }
}

checkScanRequest(); 