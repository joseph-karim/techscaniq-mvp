require('dotenv').config({ path: '/Users/josephkarim/techscaniq-mvp/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkScan() {
  const scanId = '532c3609-788e-45c7-9879-29ab59289ed5';
  
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', scanId)
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Scan found:', JSON.stringify(data, null, 2));
  
  // Check if there's a research_id
  if (data.research_id) {
    console.log('\nResearch ID:', data.research_id);
    
    // Check for state file
    const fs = require('fs');
    const path = require('path');
    const stateFile = path.join(__dirname, `../data/states/research_state_${data.research_id}.json`);
    
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      console.log('\nResearch State:');
      console.log('  Status:', state.status);
      console.log('  Evidence Count:', state.evidence?.length || 0);
      console.log('  Iteration Count:', state.iterationCount || 0);
      console.log('  Last Updated:', state.thesis?.updatedAt || 'Unknown');
    } else {
      console.log('\nNo state file found at:', stateFile);
    }
  } else {
    console.log('\nNo research_id associated with this scan yet');
  }
  
  // Check for reports
  if (data.report_url || data.report_data) {
    console.log('\nReport Status:');
    console.log('  Report URL:', data.report_url || 'Not generated');
    console.log('  Has Report Data:', !!data.report_data);
  }
}

checkScan().catch(console.error);