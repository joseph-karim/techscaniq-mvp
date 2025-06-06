import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import fs from 'fs'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMigration() {
  console.log('Applying evidence migration...')
  
  const migration = fs.readFileSync('./supabase/migrations/20250606000001_add_scan_request_to_evidence.sql', 'utf8')
  
  // Note: This is a simplified approach. In production, use proper migration tools
  console.log('Migration SQL:', migration)
  
  console.log('\n⚠️  This would normally be applied via Supabase CLI.')
  console.log('For now, the columns may already exist or need manual application.')
  
  // Check if columns exist
  const { data: collections } = await supabase
    .from('evidence_collections')
    .select('*')
    .limit(1)
  
  const { data: items } = await supabase
    .from('evidence_items')
    .select('*')
    .limit(1)
  
  console.log('\nCurrent evidence_collections columns:', collections ? Object.keys(collections[0] || {}) : 'No data')
  console.log('Current evidence_items columns:', items ? Object.keys(items[0] || {}) : 'No data')
}

applyMigration().catch(console.error)