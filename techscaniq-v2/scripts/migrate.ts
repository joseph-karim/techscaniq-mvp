#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client with service role key
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', 'create-vector-store.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📊 Running migration...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSQL,
    });

    if (error) {
      // If the RPC function doesn't exist, try direct execution
      console.log('⚠️  exec_sql RPC not available, trying direct execution...');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        // Unfortunately, Supabase client doesn't support raw SQL execution
        // We'll need to use the SQL editor in Supabase Dashboard
        console.log('❌ Direct SQL execution not supported via client.');
        console.log('\n🔧 Please run the migration manually:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the migration from:');
        console.log(`   ${migrationPath}`);
        console.log('4. Execute the SQL\n');
        
        // Output the SQL for easy copying
        console.log('📋 Migration SQL:\n');
        console.log('```sql');
        console.log(migrationSQL);
        console.log('```\n');
        
        return;
      }
    }

    console.log('✅ Migration completed successfully!');
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    // Check if the table exists
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'evidence_embeddings');

    if (tables && tables.length > 0) {
      console.log('✅ Table "evidence_embeddings" created successfully');
    } else {
      console.log('⚠️  Could not verify table creation');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('\n🎉 Migration process completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});