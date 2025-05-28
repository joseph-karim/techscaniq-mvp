-- Fix evidence_items table schema
ALTER TABLE evidence_items 
ADD COLUMN IF NOT EXISTS evidence_type_old TEXT;

-- Set a default value for existing rows based on the type column
UPDATE evidence_items 
SET evidence_type_old = type
WHERE evidence_type_old IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN evidence_items.evidence_type_old IS 'Legacy evidence type field for backward compatibility'; 