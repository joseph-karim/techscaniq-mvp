-- Fix missing columns in evidence tables

-- Add missing columns to evidence_collections
ALTER TABLE evidence_collections 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress',
ADD COLUMN IF NOT EXISTS collection_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add missing columns to evidence_items
ALTER TABLE evidence_items
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS evidence_type TEXT;

-- Update evidence_items to use the correct column names
ALTER TABLE evidence_items
RENAME COLUMN type TO evidence_type_old;

ALTER TABLE evidence_items
RENAME COLUMN evidence_type TO type;

-- Drop the old constraint if it exists
ALTER TABLE evidence_items 
DROP CONSTRAINT IF EXISTS evidence_items_type_check;

-- Add new constraint with updated values
ALTER TABLE evidence_items
ADD CONSTRAINT evidence_items_type_check 
CHECK (type IN ('webpage_content', 'business_search', 'technology_stack', 'security_analysis', 
                'performance_metrics', 'ssl_analysis', 'vulnerability_scan', 'deep_crawl', 
                'network_analysis', 'deepsearch_finding', 'search_result', 'api_response', 'document'));

-- Update breadcrumbs to be nullable temporarily
ALTER TABLE evidence_items
ALTER COLUMN breadcrumbs DROP NOT NULL;

-- Set default empty array for breadcrumbs
ALTER TABLE evidence_items
ALTER COLUMN breadcrumbs SET DEFAULT '[]'::jsonb;

-- Update existing null breadcrumbs
UPDATE evidence_items 
SET breadcrumbs = '[]'::jsonb 
WHERE breadcrumbs IS NULL;

-- Create reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_request_id UUID REFERENCES scan_requests(id),
  company_name TEXT NOT NULL,
  report_data JSONB NOT NULL,
  executive_summary TEXT,
  investment_score INTEGER,
  investment_rationale TEXT,
  tech_health_score DECIMAL(3,1),
  tech_health_grade TEXT,
  evidence_collection_id UUID REFERENCES evidence_collections(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_reports_scan_request ON reports(scan_request_id);
CREATE INDEX IF NOT EXISTS idx_reports_company ON reports(company_name);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- Add RLS policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for their scan requests" ON reports
  FOR SELECT TO authenticated
  USING (
    scan_request_id IN (
      SELECT id FROM scan_requests WHERE requested_by = auth.uid()
    )
  );

CREATE POLICY "Service role can manage reports" ON reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Update scan_requests to ensure it has all needed columns
ALTER TABLE scan_requests
ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES reports(id),
ADD COLUMN IF NOT EXISTS ai_confidence INTEGER,
ADD COLUMN IF NOT EXISTS tech_health_score DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS tech_health_grade TEXT,
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS risks JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS executive_report_data JSONB,
ADD COLUMN IF NOT EXISTS executive_report_generated_at TIMESTAMPTZ;

-- Create trigger for reports updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 