-- Add investment thesis fields to scan_requests table
ALTER TABLE scan_requests 
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS thesis_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_criteria TEXT,
ADD COLUMN IF NOT EXISTS secondary_criteria TEXT,
ADD COLUMN IF NOT EXISTS investment_thesis_data JSONB DEFAULT '{}';

-- Add index for thesis tags for better search performance
CREATE INDEX IF NOT EXISTS idx_scan_requests_thesis_tags ON scan_requests USING GIN(thesis_tags);

-- Update the comment on the table to reflect new fields
COMMENT ON COLUMN scan_requests.company_description IS 'User-provided description of the company and what they do';
COMMENT ON COLUMN scan_requests.thesis_tags IS 'Array of investment thesis tags selected by the requestor';
COMMENT ON COLUMN scan_requests.primary_criteria IS 'Primary technical evaluation criteria (max 200 chars)';
COMMENT ON COLUMN scan_requests.secondary_criteria IS 'Secondary technical evaluation criteria (max 200 chars)';
COMMENT ON COLUMN scan_requests.investment_thesis_data IS 'Additional investment thesis data in JSON format'; 