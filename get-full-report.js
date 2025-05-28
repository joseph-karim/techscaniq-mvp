import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function getFullReport() {
  const reportId = '54d36b34-190c-4085-b3ea-84017a3538bf';
  
  // Get the full report
  const { data: report, error } = await supabase
    .from('scan_reports')
    .select('*')
    .eq('id', reportId)
    .single();
  
  if (error) {
    console.error('Error fetching report:', error);
  } else {
    console.log('Full report data:');
    console.log(JSON.stringify(report, null, 2));
  }
}

getFullReport(); 