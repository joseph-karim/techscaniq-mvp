import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function getUsers() {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email')
    .limit(5);
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  console.log('Available users:');
  users.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}`);
  });
  
  if (users.length > 0) {
    console.log('\nFirst user ID:', users[0].id);
  }
}

getUsers().catch(console.error); 