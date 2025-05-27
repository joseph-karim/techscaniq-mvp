-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create evidence collections table
CREATE TABLE IF NOT EXISTS evidence_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    company_website TEXT,
    evidence_count INTEGER DEFAULT 0,
    collection_status TEXT DEFAULT 'in_progress' CHECK (collection_status IN ('in_progress', 'complete', 'failed')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evidence items table with comprehensive tracking
CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES evidence_collections(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL, -- Original ID from the service
    
    -- Evidence type and source
    type TEXT NOT NULL CHECK (type IN ('deepsearch_finding', 'webpage_content', 'search_result', 'api_response', 'document')),
    source_data JSONB NOT NULL, -- Contains url, query, api, timestamp
    
    -- Content with different representations
    content_data JSONB NOT NULL, -- Contains raw, processed, summary
    
    -- Metadata for quality and tracking
    metadata JSONB NOT NULL, -- Contains confidence, relevance, tokens, processing_steps
    
    -- Vector embedding for semantic search
    embedding vector(1024), -- Jina embeddings v3 dimension
    
    -- Classifications
    classifications JSONB, -- Array of {category, score}
    
    -- Breadcrumbs for full traceability
    breadcrumbs JSONB NOT NULL, -- Contains search_query, extraction_method, selectors, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    indexed_at TIMESTAMP WITH TIME ZONE, -- When embedding was created
    
    -- Search optimization
    search_text TEXT GENERATED ALWAYS AS (
        COALESCE(content_data->>'summary', '') || ' ' ||
        COALESCE(content_data->>'processed', '') || ' ' ||
        COALESCE(source_data->>'query', '')
    ) STORED
);

-- Create citations table for linking evidence to report claims
CREATE TABLE IF NOT EXISTS report_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL, -- References the report using this citation
    claim_id TEXT NOT NULL, -- Unique ID within the report for the claim
    evidence_item_id UUID REFERENCES evidence_items(id) ON DELETE CASCADE,
    
    -- Citation metadata
    citation_text TEXT NOT NULL, -- The actual claim being made
    citation_context TEXT, -- Surrounding context in the report
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Verification status
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed', 'invalid')),
    verification_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evidence search history for audit trail
CREATE TABLE IF NOT EXISTS evidence_search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES evidence_collections(id) ON DELETE CASCADE,
    search_type TEXT NOT NULL CHECK (search_type IN ('deepsearch', 'search', 'reader', 'direct')),
    search_query TEXT,
    search_url TEXT,
    results_count INTEGER DEFAULT 0,
    api_used TEXT,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_evidence_items_collection ON evidence_items(collection_id);
CREATE INDEX idx_evidence_items_type ON evidence_items(type);
CREATE INDEX idx_evidence_items_created ON evidence_items(created_at DESC);
CREATE INDEX idx_evidence_items_embedding ON evidence_items USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_evidence_items_search_text ON evidence_items USING gin(to_tsvector('english', search_text));

-- GIN indexes for JSONB queries
CREATE INDEX idx_evidence_source_gin ON evidence_items USING gin(source_data);
CREATE INDEX idx_evidence_content_gin ON evidence_items USING gin(content_data);
CREATE INDEX idx_evidence_breadcrumbs_gin ON evidence_items USING gin(breadcrumbs);
CREATE INDEX idx_evidence_classifications_gin ON evidence_items USING gin(classifications);

-- Citations indexes
CREATE INDEX idx_citations_report ON report_citations(report_id);
CREATE INDEX idx_citations_evidence ON report_citations(evidence_item_id);
CREATE INDEX idx_citations_status ON report_citations(verification_status);

-- Search history indexes
CREATE INDEX idx_search_history_collection ON evidence_search_history(collection_id);
CREATE INDEX idx_search_history_created ON evidence_search_history(created_at DESC);

-- Functions for evidence management

-- Function to find similar evidence using embeddings
CREATE OR REPLACE FUNCTION find_similar_evidence(
    query_embedding vector(1024),
    collection_id_filter UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    evidence_id UUID,
    similarity FLOAT,
    content JSONB,
    source JSONB,
    breadcrumbs JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        1 - (e.embedding <=> query_embedding) as similarity,
        e.content_data,
        e.source_data,
        e.breadcrumbs
    FROM evidence_items e
    WHERE 
        e.embedding IS NOT NULL
        AND (collection_id_filter IS NULL OR e.collection_id = collection_id_filter)
    ORDER BY e.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get evidence breadcrumb trail
CREATE OR REPLACE FUNCTION get_evidence_trail(evidence_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    trail JSONB;
BEGIN
    SELECT json_build_object(
        'evidence_id', e.id,
        'type', e.type,
        'source', e.source_data,
        'breadcrumbs', e.breadcrumbs,
        'search_history', (
            SELECT json_agg(json_build_object(
                'search_type', h.search_type,
                'query', h.search_query,
                'url', h.search_url,
                'timestamp', h.created_at
            ) ORDER BY h.created_at)
            FROM evidence_search_history h
            WHERE h.collection_id = e.collection_id
        ),
        'processing_steps', e.metadata->'processing_steps',
        'confidence', e.metadata->'confidence'
    ) INTO trail
    FROM evidence_items e
    WHERE e.id = evidence_id_param;
    
    RETURN trail;
END;
$$ LANGUAGE plpgsql;

-- Simple RLS Policies (without user_roles)
ALTER TABLE evidence_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_search_history ENABLE ROW LEVEL SECURITY;

-- Policies for evidence collections
CREATE POLICY "Users can view their own evidence collections"
    ON evidence_collections FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can create evidence collections"
    ON evidence_collections FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own collections"
    ON evidence_collections FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

-- Policies for evidence items (follow collection permissions)
CREATE POLICY "Evidence items follow collection permissions"
    ON evidence_items FOR ALL
    TO authenticated
    USING (
        collection_id IN (
            SELECT id FROM evidence_collections
            WHERE created_by = auth.uid()
        )
    );

-- Policies for citations (viewable by all authenticated users)
CREATE POLICY "Citations are viewable by authenticated users"
    ON report_citations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create citations"
    ON report_citations FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policies for search history (follow collection permissions)
CREATE POLICY "Search history follows collection permissions"
    ON evidence_search_history FOR ALL
    TO authenticated
    USING (
        collection_id IN (
            SELECT id FROM evidence_collections
            WHERE created_by = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON evidence_collections TO authenticated;
GRANT ALL ON evidence_items TO authenticated;
GRANT ALL ON report_citations TO authenticated;
GRANT ALL ON evidence_search_history TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_evidence TO authenticated;
GRANT EXECUTE ON FUNCTION get_evidence_trail TO authenticated; 