import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get scan_requests structure
const { data: sample, error } = await supabase
  .from('scan_requests')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error:', error);
} else if (sample && sample.length > 0) {
  console.log('scan_requests columns:', Object.keys(sample[0]));
  console.log('\nSample data:', JSON.stringify(sample[0], null, 2));
} else {
  console.log('No scan requests found');
}

// Check if we need to add investment_thesis column
console.log('\nChecking for investment-related columns...');
if (sample && sample.length > 0) {
  const hasInvestmentThesis = 'investment_thesis' in sample[0];
  const hasInvestmentFocus = 'investment_focus' in sample[0];
  const hasInvestmentStage = 'investment_stage' in sample[0];
  
  console.log('- investment_thesis:', hasInvestmentThesis);
  console.log('- investment_focus:', hasInvestmentFocus);
  console.log('- investment_stage:', hasInvestmentStage);
}