#!/usr/bin/env node
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// Parse database URL
const dbUrl = new URL(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);

const pool = new Pool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || '5432'),
  database: dbUrl.pathname.slice(1),
  user: dbUrl.username,
  password: dbUrl.password,
  ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database, applying thesis-aligned schema...\n');
    
    // Add columns to reports table
    console.log('Adding thesis columns to reports table...');
    const alterTableQueries = [
      "ALTER TABLE reports ADD COLUMN IF NOT EXISTS thesis_type TEXT",
      "ALTER TABLE reports ADD COLUMN IF NOT EXISTS thesis_config JSONB",
      "ALTER TABLE reports ADD COLUMN IF NOT EXISTS weighted_scores JSONB",
      "ALTER TABLE reports ADD COLUMN IF NOT EXISTS executive_memo JSONB",
      "ALTER TABLE reports ADD COLUMN IF NOT EXISTS deep_dive_sections JSONB",
      "ALTER TABLE reports ADD COLUMN IF NOT EXISTS risk_register JSONB",
      "ALTER TABLE reports ADD COLUMN IF NOT EXISTS value_creation_roadmap JSONB",
      "ALTER TABLE reports ADD COLUMN IF NOT EXISTS recommendation JSONB"
    ];
    
    for (const query of alterTableQueries) {
      try {
        await client.query(query);
        console.log(`✓ ${query.substring(0, 50)}...`);
      } catch (e) {
        console.log(`⚠️  ${e.message}`);
      }
    }
    
    // Create thesis_configurations table
    console.log('\nCreating thesis_configurations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS thesis_configurations (
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
      )
    `);
    console.log('✓ Created thesis_configurations table');
    
    // Create scoring_results table
    console.log('\nCreating scoring_results table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS scoring_results (
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
      )
    `);
    console.log('✓ Created scoring_results table');
    
    // Create risk_items table
    console.log('\nCreating risk_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_items (
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
      )
    `);
    console.log('✓ Created risk_items table');
    
    // Create value_creation_initiatives table
    console.log('\nCreating value_creation_initiatives table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS value_creation_initiatives (
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
      )
    `);
    console.log('✓ Created value_creation_initiatives table');
    
    // Create indexes
    console.log('\nCreating indexes...');
    const indexQueries = [
      "CREATE INDEX IF NOT EXISTS idx_scoring_results_report_id ON scoring_results(report_id)",
      "CREATE INDEX IF NOT EXISTS idx_risk_items_report_id ON risk_items(report_id)",
      "CREATE INDEX IF NOT EXISTS idx_value_creation_initiatives_report_id ON value_creation_initiatives(report_id)",
      "CREATE INDEX IF NOT EXISTS idx_reports_thesis_type ON reports(thesis_type)"
    ];
    
    for (const query of indexQueries) {
      await client.query(query);
      console.log(`✓ ${query.substring(0, 50)}...`);
    }
    
    // Enable RLS
    console.log('\nEnabling RLS...');
    await client.query("ALTER TABLE thesis_configurations ENABLE ROW LEVEL SECURITY");
    await client.query("ALTER TABLE scoring_results ENABLE ROW LEVEL SECURITY");
    await client.query("ALTER TABLE risk_items ENABLE ROW LEVEL SECURITY");
    await client.query("ALTER TABLE value_creation_initiatives ENABLE ROW LEVEL SECURITY");
    console.log('✓ RLS enabled');
    
    console.log('\n✅ Migration applied successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration().catch(console.error);