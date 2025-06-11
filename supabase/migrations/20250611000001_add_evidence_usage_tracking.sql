-- Add usage tracking to evidence items
ALTER TABLE evidence_items 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Add citation context to report_citations
ALTER TABLE report_citations
ADD COLUMN IF NOT EXISTS context TEXT,
ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2);

-- Add citation map to reports for quick lookup
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS citation_map JSONB DEFAULT '{}';

-- Create index for evidence usage queries
CREATE INDEX IF NOT EXISTS idx_evidence_items_usage 
ON evidence_items(usage_count DESC, last_used_at DESC);

-- Create index for citation lookups
CREATE INDEX IF NOT EXISTS idx_report_citations_number 
ON report_citations(report_id, citation_number);

-- Update RLS policies to allow updates to usage fields
CREATE POLICY "Service role can update evidence usage" ON evidence_items
  FOR UPDATE 
  TO service_role
  USING (true);

COMMENT ON COLUMN evidence_items.usage_count IS 'Number of times this evidence has been cited in reports';
COMMENT ON COLUMN evidence_items.last_used_at IS 'Timestamp of last citation usage';
COMMENT ON COLUMN report_citations.context IS 'Text context surrounding the citation';
COMMENT ON COLUMN report_citations.confidence IS 'Confidence score of the citation (0-1)';
COMMENT ON COLUMN reports.citation_map IS 'JSON map of citation numbers to evidence IDs for quick lookup';