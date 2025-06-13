-- Option 1: Add a flexible JSONB column to existing table
ALTER TABLE evidence_items 
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Option 2: Create a new flexible evidence storage table
CREATE TABLE IF NOT EXISTS evidence_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_request_id UUID NOT NULL,
  evidence_batch JSONB NOT NULL, -- Store anything here
  source TEXT, -- 'deep_research', 'skyvern', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_data JSONB -- AI-processed version
);

-- Option 3: Even simpler - just use the collections table
-- The evidence_collections table already has a metadata JSONB field
-- Just store all evidence there and process later

-- Example of storing evidence in collections metadata:
/*
UPDATE evidence_collections 
SET metadata = jsonb_set(
  metadata, 
  '{evidence_items}', 
  '[
    {"url": "...", "content": "...", "type": "webpage"},
    {"query": "...", "results": [...], "type": "search"},
    {"scan": {...}, "type": "technical"}
  ]'::jsonb
)
WHERE id = 'collection-id';
*/