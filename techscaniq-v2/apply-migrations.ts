#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';
import { config as dotenvConfig } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenvConfig({ path: '../.env.local' });

async function applyMigrations() {
  console.log('🚀 Applying database migrations...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read migration file
    const migrationPath = join(__dirname, 'src/database/migrations/create-vector-store.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Applying vector store migration...');
    
    // Execute migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // If RPC doesn't exist, try direct SQL (this won't work in production but helps locally)
      console.log('\n🔄 Attempting alternative approach...');
      console.log('Please run the following SQL in your Supabase SQL editor:');
      console.log('---');
      console.log(migrationSQL);
      console.log('---');
    } else {
      console.log('✅ Vector store migration applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error applying migrations:', error);
    process.exit(1);
  }
}

// Run migrations
applyMigrations().catch(console.error);