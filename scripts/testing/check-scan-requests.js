import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkScanRequests() {
  console.log('Checking scan requests...\n');
  
  const { data: requests, error } = await supabase
    .from('scan_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching scan requests:', error);
    return;
  }

  console.log(`Found ${requests.length} scan requests:\n`);
  
  requests.forEach(req => {
    console.log(`ID: ${req.id}`);
    console.log(`Company: ${req.company_name} (${req.website_url})`);
    console.log(`Status: ${req.status}`);
    console.log(`Report ID: ${req.report_id || 'No report yet'}`);
    console.log(`Created: ${req.created_at}`);
    console.log('---');
  });
}

checkScanRequests(); 