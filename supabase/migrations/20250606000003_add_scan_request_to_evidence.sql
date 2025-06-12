-- Add scan_request_id to evidence_collections for proper linkage
ALTER TABLE evidence_collections 
ADD COLUMN IF NOT EXISTS scan_request_id UUID REFERENCES scan_requests(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_evidence_collections_scan_request_id 
ON evidence_collections(scan_request_id);

-- Add scan_request_id to evidence_items for direct access
ALTER TABLE evidence_items 
ADD COLUMN IF NOT EXISTS scan_request_id UUID REFERENCES scan_requests(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_evidence_items_scan_request_id 
ON evidence_items(scan_request_id);

-- Update RLS policies to include scan_request_id checks
DROP POLICY IF EXISTS "Users can view evidence for their scan requests" ON evidence_collections;
CREATE POLICY "Users can view evidence for their scan requests" ON evidence_collections
  FOR SELECT USING (
    scan_request_id IN (
      SELECT id FROM scan_requests 
      WHERE requested_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view evidence items for their scan requests" ON evidence_items;
CREATE POLICY "Users can view evidence items for their scan requests" ON evidence_items
  FOR SELECT USING (
    scan_request_id IN (
      SELECT id FROM scan_requests 
      WHERE requested_by = auth.uid()
    )
  );