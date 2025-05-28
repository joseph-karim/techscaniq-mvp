-- Make evidence_type_old column nullable
ALTER TABLE evidence_items 
ALTER COLUMN evidence_type_old DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN evidence_items.evidence_type_old IS 'Legacy evidence type field for backward compatibility (nullable)'; 