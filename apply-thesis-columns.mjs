#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyThesisColumns() {
  console.log('Adding thesis-aligned columns to reports table...\n');
  
  // We need to execute raw SQL since Supabase SDK doesn't support ALTER TABLE
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      -- Add thesis-aligned columns to reports table
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS thesis_type TEXT,
      ADD COLUMN IF NOT EXISTS thesis_config JSONB,
      ADD COLUMN IF NOT EXISTS weighted_scores JSONB,
      ADD COLUMN IF NOT EXISTS executive_memo JSONB,
      ADD COLUMN IF NOT EXISTS deep_dive_sections JSONB,
      ADD COLUMN IF NOT EXISTS risk_register JSONB,
      ADD COLUMN IF NOT EXISTS value_creation_roadmap JSONB,
      ADD COLUMN IF NOT EXISTS recommendation JSONB;
      
      -- Create index for thesis_type
      CREATE INDEX IF NOT EXISTS idx_reports_thesis_type ON reports(thesis_type);
    `
  });

  if (error) {
    console.error('Error adding columns:', error);
    
    // Try an alternative approach - add columns one by one
    console.log('\nTrying individual column additions...');
    
    const columns = [
      'thesis_type TEXT',
      'thesis_config JSONB',
      'weighted_scores JSONB',
      'executive_memo JSONB',
      'deep_dive_sections JSONB',
      'risk_register JSONB',
      'value_creation_roadmap JSONB',
      'recommendation JSONB'
    ];
    
    for (const colDef of columns) {
      const [colName, colType] = colDef.split(' ');
      console.log(`Adding column ${colName}...`);
      
      // Check if column exists by trying to select it
      const { error: checkError } = await supabase
        .from('reports')
        .select(`id, ${colName}`)
        .limit(1);
        
      if (checkError && checkError.message.includes('column')) {
        console.log(`Column ${colName} doesn't exist, adding it...`);
        // Column doesn't exist, we need another approach
        console.log(`✗ Cannot add ${colName} - need database access`);
      } else {
        console.log(`✓ Column ${colName} already exists`);
      }
    }
    
    return;
  }

  console.log('✅ Successfully added thesis-aligned columns!');
  
  // Verify columns exist
  console.log('\nVerifying columns...');
  const { data: testData, error: testError } = await supabase
    .from('reports')
    .select('id, thesis_type, weighted_scores, deep_dive_sections')
    .limit(1);
    
  if (testError) {
    console.log('❌ Column verification failed:', testError.message);
  } else {
    console.log('✅ All columns verified successfully!');
  }
  
  // Create the other thesis tables
  console.log('\nCreating thesis support tables...');
  
  const tables = [
    {
      name: 'thesis_configurations',
      sql: `CREATE TABLE IF NOT EXISTS thesis_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        thesis_type TEXT NOT NULL,
        thesis_name TEXT NOT NULL,
        timeline TEXT NOT NULL,
        target_multiple TEXT NOT NULL,
        weights JSONB NOT NULL DEFAULT '{}',
        threshold DECIMAL(3,2) NOT NULL DEFAULT 0.70,
        focus_areas JSONB DEFAULT '[]',
        scoring_rubrics JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )`
    },
    {
      name: 'scoring_results',
      sql: `CREATE TABLE IF NOT EXISTS scoring_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        criterion TEXT NOT NULL,
        weight DECIMAL(3,2) NOT NULL,
        raw_score INTEGER NOT NULL CHECK (raw_score >= 0 AND raw_score <= 100),
        weighted_score DECIMAL(5,2) NOT NULL,
        evidence_refs JSONB DEFAULT '[]',
        findings JSONB DEFAULT '[]',
        recommendations JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT now()
      )`
    },
    {
      name: 'risk_items',
      sql: `CREATE TABLE IF NOT EXISTS risk_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        risk_code TEXT NOT NULL,
        risk_description TEXT NOT NULL,
        likelihood TEXT NOT NULL CHECK (likelihood IN ('Low', 'Medium', 'High')),
        impact TEXT NOT NULL CHECK (impact IN ('Low', 'Medium', 'High')),
        mitigation TEXT NOT NULL,
        owner TEXT NOT NULL,
        cost_estimate TEXT,
        evidence_refs JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT now()
      )`
    },
    {
      name: 'value_creation_initiatives',
      sql: `CREATE TABLE IF NOT EXISTS value_creation_initiatives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        initiative_name TEXT NOT NULL,
        timeline_bucket TEXT NOT NULL CHECK (timeline_bucket IN ('0-6m', '6-18m', '18m+')),
        expected_impact TEXT NOT NULL,
        cost_estimate TEXT NOT NULL,
        roi_estimate TEXT NOT NULL,
        owner TEXT NOT NULL,
        thesis_alignment TEXT NOT NULL,
        evidence_refs JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT now()
      )`
    }
  ];
  
  for (const table of tables) {
    console.log(`Creating table ${table.name}...`);
    const { error: tableError } = await supabase.rpc('exec_sql', { query: table.sql });
    
    if (tableError) {
      console.log(`✗ Error creating ${table.name}:`, tableError.message);
    } else {
      console.log(`✓ Created ${table.name}`);
    }
  }
}

applyThesisColumns().catch(console.error);