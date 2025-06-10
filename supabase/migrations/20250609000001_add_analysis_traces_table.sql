-- Create analysis traces table for storing detailed analysis audit trails
CREATE TABLE IF NOT EXISTS analysis_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_request_id UUID REFERENCES scan_requests(id) ON DELETE CASCADE,
  trace_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT analysis_traces_scan_request_id_idx UNIQUE (scan_request_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_analysis_traces_scan_request_id ON analysis_traces(scan_request_id);
CREATE INDEX IF NOT EXISTS idx_analysis_traces_created_at ON analysis_traces(created_at);

-- RLS policies
ALTER TABLE analysis_traces ENABLE ROW LEVEL SECURITY;

-- Admin users can view all traces
CREATE POLICY "Admin users can view all analysis traces" ON analysis_traces
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Users can view traces for their own scan requests
CREATE POLICY "Users can view their own analysis traces" ON analysis_traces
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_requests
      WHERE scan_requests.id = analysis_traces.scan_request_id
      AND scan_requests.user_id = auth.uid()
    )
  );

-- Service role can insert traces
CREATE POLICY "Service role can insert analysis traces" ON analysis_traces
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON analysis_traces TO authenticated;
GRANT ALL ON analysis_traces TO service_role;