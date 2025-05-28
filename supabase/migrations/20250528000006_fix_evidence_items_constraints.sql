-- Fix evidence_items constraints to allow proper storage
ALTER TABLE evidence_items 
ALTER COLUMN evidence_type_old DROP NOT NULL;

-- Drop the problematic check constraint
ALTER TABLE evidence_items 
DROP CONSTRAINT IF EXISTS evidence_items_type_check;

-- Make breadcrumbs nullable
ALTER TABLE evidence_items 
ALTER COLUMN breadcrumbs DROP NOT NULL;

-- Add the new evidence_type column if it doesn't exist
ALTER TABLE evidence_items 
ADD COLUMN IF NOT EXISTS evidence_type text;

-- Update existing rows to have a valid evidence_type
UPDATE evidence_items 
SET evidence_type = COALESCE(evidence_type_old, 'general')
WHERE evidence_type IS NULL; 