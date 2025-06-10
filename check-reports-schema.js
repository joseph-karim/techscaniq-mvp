import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get reports structure
const { data: sample, error } = await supabase
  .from('reports')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error:', error);
} else if (sample && sample.length > 0) {
  console.log('reports columns:', Object.keys(sample[0]));
  console.log('\nChecking for status/published fields:');
  console.log('- status:', 'status' in sample[0]);
  console.log('- published_at:', 'published_at' in sample[0]);
  console.log('- human_reviewed:', 'human_reviewed' in sample[0]);
  console.log('- quality_score:', 'quality_score' in sample[0]);
} else {
  console.log('No reports found');
}