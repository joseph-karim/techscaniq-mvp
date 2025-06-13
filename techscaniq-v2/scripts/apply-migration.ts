#!/usr/bin/env tsx
import axios from 'axios';
import { config } from '../src/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyMigration() {
  console.log('🚀 Applying vector store migration via Supabase Management API...\n');

  try {
    // Extract project ref from Supabase URL
    const urlMatch = config.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!urlMatch) {
      throw new Error('Invalid Supabase URL format');
    }
    const projectRef = urlMatch[1];
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', 'create-vector-store.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('🔑 Project ref:', projectRef);
    
    // Use the SQL endpoint directly
    const response = await axios.post(
      `${config.SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      { query: migrationSQL },
      {
        headers: {
          'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      console.log('✅ Migration applied successfully!');
    }
    
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log('⚠️  Direct SQL execution endpoint not available.\n');
      console.log('📋 Please follow the manual migration instructions in MIGRATION-INSTRUCTIONS.md');
      console.log('   or use the Supabase Dashboard SQL Editor.\n');
      
      // Create a quick copy command for convenience
      const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', 'create-vector-store.sql');
      console.log('Quick copy command:');
      console.log(`cat ${migrationPath} | pbcopy`);
      console.log('\nThis will copy the migration SQL to your clipboard (macOS).');
    } else {
      console.error('❌ Migration failed:', error.response?.data || error.message);
    }
  }
}

// Run the migration
applyMigration().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});