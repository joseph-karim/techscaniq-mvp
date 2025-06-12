#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAppliedMigrations() {
  // Check which migrations have been applied
  const { data: migrations, error } = await supabase
    .from('supabase_migrations.schema_migrations')
    .select('version, name, statements')
    .order('version', { ascending: false });

  if (error) {
    console.error('Error checking migrations:', error);
    
    // Try alternate table
    const { data: altMigrations, error: altError } = await supabase
      .from('schema_migrations')
      .select('*')
      .order('version', { ascending: false });
      
    if (altError) {
      console.error('Also failed with schema_migrations:', altError);
    } else {
      console.log('Applied migrations (from schema_migrations):');
      altMigrations?.forEach(m => console.log(`- ${m.version}`));
    }
    return;
  }

  console.log('Applied migrations:');
  migrations?.forEach(m => console.log(`- ${m.version}: ${m.name || 'unnamed'}`));
  
  // Check if thesis-aligned tables exist
  console.log('\nChecking thesis-aligned tables...');
  
  const tablesToCheck = [
    'thesis_configurations',
    'scoring_results', 
    'risk_items',
    'value_creation_initiatives'
  ];
  
  for (const table of tablesToCheck) {
    const { error: tableError } = await supabase
      .from(table)
      .select('id')
      .limit(1);
      
    console.log(`- ${table}: ${tableError ? '✗ Not found' : '✓ Exists'}`);
  }
  
  // Check if reports table has thesis columns
  console.log('\nChecking reports table columns...');
  const { data: reportData, error: reportError } = await supabase
    .from('reports')
    .select('id, thesis_type, weighted_scores')
    .limit(1);
    
  if (reportError && reportError.message.includes('column')) {
    console.log('- thesis columns: ✗ Not found');
  } else {
    console.log('- thesis columns: ✓ Exist');
  }
}

checkAppliedMigrations().catch(console.error);