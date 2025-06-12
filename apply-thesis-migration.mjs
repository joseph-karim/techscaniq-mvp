#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  const migrationPath = './supabase/migrations/20250611000003_add_thesis_aligned_schema.sql';
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Applying thesis-aligned schema migration...');
  
  // Split the SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    try {
      console.log('\nExecuting statement:', statement.substring(0, 50) + '...');
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });
      
      if (error) {
        console.error('❌ Error:', error.message);
        errorCount++;
      } else {
        console.log('✓ Success');
        successCount++;
      }
    } catch (e) {
      console.error('❌ Error:', e.message);
      errorCount++;
    }
  }
  
  console.log(`\nMigration complete: ${successCount} successful, ${errorCount} errors`);
}

applyMigration().catch(console.error);