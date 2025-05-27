-- Create scan_reports table
CREATE TABLE scan_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('standard', 'executive', 'deep-dive')),
  investor_name TEXT,
  assessment_context TEXT DEFAULT 'general',
  report_data JSONB NOT NULL,
  token_usage JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID,
  
  -- Indexes for performance
  CONSTRAINT unique_company_report UNIQUE (company_name, report_type, created_at)
);

-- Create indexes for better query performance
CREATE INDEX idx_scan_reports_company_name ON scan_reports(company_name);
CREATE INDEX idx_scan_reports_report_type ON scan_reports(report_type);
CREATE INDEX idx_scan_reports_created_at ON scan_reports(created_at DESC);
CREATE INDEX idx_scan_reports_user_id ON scan_reports(user_id);
CREATE INDEX idx_scan_reports_workspace_id ON scan_reports(workspace_id);
CREATE INDEX idx_scan_reports_investor_name ON scan_reports(investor_name);

-- Create GIN index for JSONB search
CREATE INDEX idx_scan_reports_data ON scan_reports USING GIN (report_data);

-- Enable RLS
ALTER TABLE scan_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reports" ON scan_reports
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create reports" ON scan_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own reports" ON scan_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON scan_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_scan_reports_updated_at
  BEFORE UPDATE ON scan_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
