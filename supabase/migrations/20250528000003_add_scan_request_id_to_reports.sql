-- Add scan_request_id column to scan_reports table
ALTER TABLE scan_reports
ADD COLUMN scan_request_id UUID REFERENCES scan_requests(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_scan_reports_scan_request_id ON scan_reports(scan_request_id);

-- Update the unique constraint to include scan_request_id
ALTER TABLE scan_reports DROP CONSTRAINT IF EXISTS unique_company_report;
ALTER TABLE scan_reports ADD CONSTRAINT unique_scan_request_report 
  UNIQUE (scan_request_id, report_type);

-- Add comment for documentation
COMMENT ON COLUMN scan_reports.scan_request_id IS 'Reference to the scan request that generated this report'; 