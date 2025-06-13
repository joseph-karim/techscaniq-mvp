-- Add content column to evidence_embeddings table
-- This is required by LangChain's SupabaseVectorStore

ALTER TABLE evidence_embeddings 
ADD COLUMN IF NOT EXISTS content TEXT;

-- Update the match_evidence function to include content
DROP FUNCTION IF EXISTS match_evidence;

CREATE OR REPLACE FUNCTION match_evidence(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_thesis_id UUID DEFAULT NULL,
  filter_pillar_id TEXT DEFAULT NULL,
  filter_min_quality FLOAT DEFAULT NULL,
  filter_source_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  evidence_id UUID,
  pillar_id TEXT,
  source_url TEXT,
  source_type TEXT,
  quality_score FLOAT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.evidence_id,
    e.pillar_id,
    e.source_url,
    e.source_type,
    e.quality_score,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM evidence_embeddings e
  WHERE
    (filter_thesis_id IS NULL OR e.thesis_id = filter_thesis_id)
    AND (filter_pillar_id IS NULL OR e.pillar_id = filter_pillar_id)
    AND (filter_min_quality IS NULL OR e.quality_score >= filter_min_quality)
    AND (filter_source_type IS NULL OR e.source_type = filter_source_type)
    AND (1 - (e.embedding <=> query_embedding)) >= match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON COLUMN evidence_embeddings.content IS 'The searchable text content for this evidence piece';