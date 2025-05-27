-- Create evidence chunks table for segmented content
CREATE TABLE IF NOT EXISTS evidence_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES evidence_collections(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL, -- References original evidence_items
    chunk_id UUID NOT NULL, -- ID from the processing service
    chunk_index INTEGER NOT NULL,
    
    -- Chunk content and embedding
    content TEXT NOT NULL,
    embedding vector(1024), -- Jina embeddings v3
    
    -- Chunk metadata
    metadata JSONB NOT NULL, -- Contains startChar, endChar, tokens, semanticDensity
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure uniqueness
    UNIQUE(collection_id, chunk_id)
);

-- Create citation candidates table
CREATE TABLE IF NOT EXISTS citation_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES evidence_collections(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL,
    chunk_id UUID NOT NULL,
    
    -- Citation content and relevance
    content TEXT NOT NULL,
    relevance_score DECIMAL(5,4) NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
    
    -- Source tracking
    source TEXT NOT NULL,
    
    -- Breadcrumb for full traceability
    breadcrumb JSONB NOT NULL, -- Contains originalDoc, chunkPosition, extractionPath
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to chunks
    FOREIGN KEY (chunk_id) REFERENCES evidence_chunks(chunk_id) ON DELETE CASCADE
);

-- Create structured citations table (final citations used in reports)
CREATE TABLE IF NOT EXISTS structured_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL,
    citation_candidate_id UUID REFERENCES citation_candidates(id) ON DELETE SET NULL,
    
    -- Citation classification
    citation_type TEXT NOT NULL CHECK (citation_type IN (
        'Direct Evidence',
        'Supporting Context',
        'Counter Evidence',
        'Background Information',
        'Technical Specification',
        'Market Data',
        'Expert Opinion'
    )),
    
    -- Citation content
    content TEXT NOT NULL,
    claim_context TEXT NOT NULL, -- The claim this citation supports
    
    -- Source information
    source_info JSONB NOT NULL, -- Contains url, evidenceId, chunkId
    
    -- Relevance tracking
    relevance_info JSONB NOT NULL, -- Contains score, context
    
    -- Full breadcrumb trail
    breadcrumb JSONB NOT NULL,
    
    -- Processing metadata
    metadata JSONB NOT NULL, -- Contains extractedAt, processingSteps
    
    -- Usage tracking
    times_referenced INTEGER DEFAULT 0,
    last_referenced_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance

-- Chunk indexes
CREATE INDEX idx_chunks_collection ON evidence_chunks(collection_id);
CREATE INDEX idx_chunks_evidence ON evidence_chunks(evidence_id);
CREATE INDEX idx_chunks_embedding ON evidence_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chunks_metadata_gin ON evidence_chunks USING gin(metadata);

-- Citation candidate indexes
CREATE INDEX idx_candidates_collection ON citation_candidates(collection_id);
CREATE INDEX idx_candidates_relevance ON citation_candidates(relevance_score DESC);
CREATE INDEX idx_candidates_chunk ON citation_candidates(chunk_id);
CREATE INDEX idx_candidates_breadcrumb_gin ON citation_candidates USING gin(breadcrumb);

-- Structured citation indexes
CREATE INDEX idx_structured_report ON structured_citations(report_id);
CREATE INDEX idx_structured_type ON structured_citations(citation_type);
CREATE INDEX idx_structured_usage ON structured_citations(times_referenced DESC);

-- Functions for citation management

-- Function to find citations for a claim using semantic search
CREATE OR REPLACE FUNCTION find_citations_for_claim(
    claim_embedding vector(1024),
    collection_id_param UUID,
    min_relevance DECIMAL DEFAULT 0.7,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    citation_id UUID,
    chunk_content TEXT,
    relevance_score DECIMAL,
    source TEXT,
    breadcrumb JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_chunks AS (
        SELECT 
            c.chunk_id,
            c.content,
            1 - (c.embedding <=> claim_embedding) as similarity
        FROM evidence_chunks c
        WHERE 
            c.collection_id = collection_id_param
            AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> claim_embedding
        LIMIT limit_count * 2  -- Get more than needed for filtering
    )
    SELECT 
        cc.id as citation_id,
        rc.content as chunk_content,
        cc.relevance_score,
        cc.source,
        cc.breadcrumb,
        rc.similarity
    FROM ranked_chunks rc
    JOIN citation_candidates cc ON cc.chunk_id = rc.chunk_id
    WHERE 
        cc.relevance_score >= min_relevance
        AND rc.similarity >= 0.5  -- Minimum semantic similarity
    ORDER BY 
        (cc.relevance_score * 0.7 + rc.similarity * 0.3) DESC  -- Weighted score
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get complete citation trail
CREATE OR REPLACE FUNCTION get_citation_trail(citation_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    trail JSONB;
BEGIN
    WITH citation_info AS (
        SELECT 
            sc.id,
            sc.citation_type,
            sc.content,
            sc.claim_context,
            sc.source_info,
            sc.breadcrumb as citation_breadcrumb,
            cc.breadcrumb as candidate_breadcrumb,
            cc.relevance_score,
            ec.metadata as chunk_metadata,
            ei.breadcrumbs as evidence_breadcrumb,
            ei.source_data,
            ei.metadata as evidence_metadata
        FROM structured_citations sc
        LEFT JOIN citation_candidates cc ON sc.citation_candidate_id = cc.id
        LEFT JOIN evidence_chunks ec ON cc.chunk_id = ec.chunk_id
        LEFT JOIN evidence_items ei ON ec.evidence_id = ei.evidence_id
        WHERE sc.id = citation_id_param
    )
    SELECT json_build_object(
        'citation_id', id,
        'type', citation_type,
        'content', content,
        'claim', claim_context,
        'trail', json_build_array(
            json_build_object(
                'level', 'citation',
                'data', citation_breadcrumb
            ),
            json_build_object(
                'level', 'candidate',
                'data', candidate_breadcrumb,
                'relevance_score', relevance_score
            ),
            json_build_object(
                'level', 'chunk',
                'data', chunk_metadata
            ),
            json_build_object(
                'level', 'evidence',
                'data', evidence_breadcrumb,
                'source', source_data,
                'metadata', evidence_metadata
            )
        )
    ) INTO trail
    FROM citation_info;
    
    RETURN trail;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE evidence_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE structured_citations ENABLE ROW LEVEL SECURITY;

-- Chunks follow collection permissions
CREATE POLICY "Chunks follow collection permissions"
    ON evidence_chunks FOR ALL
    TO authenticated
    USING (
        collection_id IN (
            SELECT id FROM evidence_collections
            WHERE created_by = auth.uid() OR auth.uid() IN (
                SELECT user_id FROM user_roles WHERE role IN ('admin', 'pe_user')
            )
        )
    );

-- Citation candidates follow collection permissions
CREATE POLICY "Citation candidates follow collection permissions"
    ON citation_candidates FOR ALL
    TO authenticated
    USING (
        collection_id IN (
            SELECT id FROM evidence_collections
            WHERE created_by = auth.uid() OR auth.uid() IN (
                SELECT user_id FROM user_roles WHERE role IN ('admin', 'pe_user')
            )
        )
    );

-- Structured citations are viewable by authenticated users
CREATE POLICY "Structured citations viewable by authenticated"
    ON structured_citations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "PE users can manage structured citations"
    ON structured_citations FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('admin', 'pe_user')
        )
    );

-- Grant permissions
GRANT ALL ON evidence_chunks TO authenticated;
GRANT ALL ON citation_candidates TO authenticated;
GRANT ALL ON structured_citations TO authenticated;
GRANT EXECUTE ON FUNCTION find_citations_for_claim TO authenticated;
GRANT EXECUTE ON FUNCTION get_citation_trail TO authenticated; 