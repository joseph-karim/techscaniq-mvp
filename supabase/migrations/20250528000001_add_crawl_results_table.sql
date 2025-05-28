-- Create table for storing deep crawl results
CREATE TABLE IF NOT EXISTS crawl_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  url TEXT NOT NULL,
  status INTEGER NOT NULL,
  content_type TEXT,
  artifacts JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_crawl_results_scan_id ON crawl_results(scan_id);
CREATE INDEX idx_crawl_results_url ON crawl_results(url);
CREATE INDEX idx_crawl_results_created_at ON crawl_results(created_at);

-- Add RLS policies
ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage crawl results" ON crawl_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to read their own crawl results
CREATE POLICY "Users can read their own crawl results" ON crawl_results
  FOR SELECT TO authenticated
  USING (
    scan_id IN (
      SELECT sr.id FROM scan_requests sr
      WHERE sr.requested_by = auth.uid()
    )
  );

-- Update evidence_collections table to support new collection types
ALTER TABLE evidence_collections 
ADD COLUMN IF NOT EXISTS collection_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create an index on collection_type for performance
CREATE INDEX IF NOT EXISTS idx_evidence_collections_type 
ON evidence_collections(collection_type);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crawl_results_updated_at
  BEFORE UPDATE ON crawl_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 