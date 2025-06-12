-- Complete thesis-aligned report schema migration
-- This migration adds all necessary columns and tables for thesis-aligned PE reports

-- First, add missing columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS report_type TEXT,
ADD COLUMN IF NOT EXISTS thesis_type TEXT,
ADD COLUMN IF NOT EXISTS thesis_config JSONB,
ADD COLUMN IF NOT EXISTS weighted_scores JSONB,
ADD COLUMN IF NOT EXISTS executive_memo JSONB,
ADD COLUMN IF NOT EXISTS deep_dive_sections JSONB,
ADD COLUMN IF NOT EXISTS risk_register JSONB,
ADD COLUMN IF NOT EXISTS value_creation_roadmap JSONB,
ADD COLUMN IF NOT EXISTS recommendation JSONB,
ADD COLUMN IF NOT EXISTS technical_focus_areas JSONB,
ADD COLUMN IF NOT EXISTS financial_crosschecks JSONB;

-- Create index for report_type and thesis_type
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_thesis_type ON reports(thesis_type);

-- Create thesis configurations table (stores PE thesis templates)
CREATE TABLE IF NOT EXISTS thesis_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_type TEXT NOT NULL UNIQUE,
  thesis_name TEXT NOT NULL,
  timeline TEXT NOT NULL,
  target_multiple TEXT NOT NULL,
  weights JSONB NOT NULL DEFAULT '{}',
  threshold DECIMAL(3,2) NOT NULL DEFAULT 0.70,
  focus_areas JSONB DEFAULT '[]',
  scoring_rubrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create scoring results table (detailed scoring per criterion)
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
);

-- Create risk items table (risk register entries)
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
);

-- Create value creation initiatives table (roadmap items)
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
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scoring_results_report_id ON scoring_results(report_id);
CREATE INDEX IF NOT EXISTS idx_risk_items_report_id ON risk_items(report_id);
CREATE INDEX IF NOT EXISTS idx_value_creation_initiatives_report_id ON value_creation_initiatives(report_id);

-- Enable RLS on new tables
ALTER TABLE thesis_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_creation_initiatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for thesis_configurations (read-only for all authenticated users)
CREATE POLICY "Users can view thesis configurations"
  ON thesis_configurations FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for scoring_results
CREATE POLICY "Users can view scoring results for accessible reports"
  ON scoring_results FOR SELECT
  TO authenticated
  USING (
    report_id IN (
      SELECT r.id FROM reports r
      JOIN scan_requests sr ON r.scan_request_id = sr.id
      WHERE sr.requested_by = auth.uid()
    )
  );

-- Admins can manage scoring results
CREATE POLICY "Admins can manage scoring results"
  ON scoring_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for risk_items
CREATE POLICY "Users can view risk items for accessible reports"
  ON risk_items FOR SELECT
  TO authenticated
  USING (
    report_id IN (
      SELECT r.id FROM reports r
      JOIN scan_requests sr ON r.scan_request_id = sr.id
      WHERE sr.requested_by = auth.uid()
    )
  );

-- Admins can manage risk items
CREATE POLICY "Admins can manage risk items"
  ON risk_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for value_creation_initiatives
CREATE POLICY "Users can view initiatives for accessible reports"
  ON value_creation_initiatives FOR SELECT
  TO authenticated
  USING (
    report_id IN (
      SELECT r.id FROM reports r
      JOIN scan_requests sr ON r.scan_request_id = sr.id
      WHERE sr.requested_by = auth.uid()
    )
  );

-- Admins can manage value creation initiatives
CREATE POLICY "Admins can manage value creation initiatives"
  ON value_creation_initiatives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON thesis_configurations TO authenticated;
GRANT ALL ON scoring_results TO authenticated;
GRANT ALL ON risk_items TO authenticated;
GRANT ALL ON value_creation_initiatives TO authenticated;

-- Insert default thesis configurations
INSERT INTO thesis_configurations (thesis_type, thesis_name, timeline, target_multiple, weights, threshold, focus_areas, scoring_rubrics)
VALUES 
  ('accelerate-organic-growth', 'Accelerate Organic Growth', '3-5 years', '3-5x', 
   '{"Technical Scalability": 30, "Market Expansion Readiness": 25, "Developer Experience": 20, "Operational Excellence": 15, "Security & Compliance": 10}',
   0.70,
   '["scalable-architecture", "cloud-native", "api-driven", "microservices"]',
   '{}'),
  
  ('buy-and-build', 'Platform Buy & Build', '5-7 years', '5-7x',
   '{"Integration Architecture": 35, "API Ecosystem": 25, "Data Architecture": 20, "DevOps Maturity": 15, "Security Framework": 5}',
   0.65,
   '["api-driven", "microservices", "event-driven", "data-integration"]',
   '{}'),
   
  ('margin-expansion', 'Margin Expansion', '2-3 years', '2-3x',
   '{"Automation Potential": 30, "Infrastructure Efficiency": 25, "Technical Debt": 25, "Cost Architecture": 15, "Process Maturity": 5}',
   0.60,
   '["automation", "cloud-cost-optimization", "devops-maturity", "monitoring"]',
   '{}'),
   
  ('turnaround-distressed', 'Turnaround / Distressed', '3-5 years', '3x+',
   '{"System Stability": 35, "Core Infrastructure": 30, "Security Vulnerabilities": 20, "Team Capability": 10, "Customer Trust": 5}',
   0.60,
   '["system-reliability", "security-focus", "technical-debt", "monitoring"]',
   '{}'),
   
  ('carve-out', 'Carve-out', '3-4 years', '2.5-4x',
   '{"Standalone Readiness": 35, "System Dependencies": 25, "Data Separation": 20, "Team Autonomy": 15, "Licensing": 5}',
   0.65,
   '["system-independence", "data-architecture", "security-focus", "team-structure"]',
   '{}'),
   
  ('geographic-vertical-expansion', 'Geographic/Vertical Expansion', '3-5 years', '3-5x',
   '{"Multi-tenancy": 30, "Localization": 25, "Compliance Framework": 20, "Performance at Scale": 15, "Integration Flexibility": 10}',
   0.65,
   '["multi-tenant", "internationalization", "compliance", "scalable-architecture"]',
   '{}'),
   
  ('digital-transformation', 'Digital Transformation', '2-4 years', '2.5-4x',
   '{"Cloud Readiness": 30, "API Coverage": 25, "Data Analytics": 20, "Mobile/Web Experience": 15, "AI/ML Capabilities": 10}',
   0.65,
   '["cloud-native", "api-driven", "data-analytics", "ai-ml-ready"]',
   '{}')
ON CONFLICT (thesis_type) DO UPDATE SET
  thesis_name = EXCLUDED.thesis_name,
  timeline = EXCLUDED.timeline,
  target_multiple = EXCLUDED.target_multiple,
  weights = EXCLUDED.weights,
  threshold = EXCLUDED.threshold,
  focus_areas = EXCLUDED.focus_areas;