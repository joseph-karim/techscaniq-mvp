-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create evidence embeddings table for semantic search
CREATE TABLE IF NOT EXISTS evidence_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL,
  thesis_id UUID NOT NULL,
  pillar_id TEXT NOT NULL,
  
  -- Vector embedding for semantic search
  embedding VECTOR(1536), -- OpenAI ada-002 dimension
  
  -- Metadata for filtering
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_credibility FLOAT NOT NULL,
  quality_score FLOAT NOT NULL,
  extracted_at TIMESTAMPTZ NOT NULL,
  keywords TEXT[],
  
  -- Indexes for performance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_evidence_embeddings_thesis_id ON evidence_embeddings(thesis_id);
CREATE INDEX idx_evidence_embeddings_pillar_id ON evidence_embeddings(pillar_id);
CREATE INDEX idx_evidence_embeddings_quality_score ON evidence_embeddings(quality_score);
CREATE INDEX idx_evidence_embeddings_source_type ON evidence_embeddings(source_type);
CREATE INDEX idx_evidence_embeddings_created_at ON evidence_embeddings(created_at);

-- Create HNSW index for fast similarity search
CREATE INDEX idx_evidence_embeddings_vector ON evidence_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create function for similarity search
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_evidence_embeddings_updated_at
BEFORE UPDATE ON evidence_embeddings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE evidence_embeddings IS 'Stores vector embeddings for evidence to enable semantic search';
COMMENT ON COLUMN evidence_embeddings.embedding IS 'OpenAI text-embedding-ada-002 vector (1536 dimensions)';
COMMENT ON FUNCTION match_evidence IS 'Performs semantic similarity search on evidence with optional filters';