-- Create internal_due_diligence table for storing comprehensive internal analysis data
CREATE TABLE IF NOT EXISTS internal_due_diligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    
    -- Core analysis sections (JSONB for flexibility)
    code_analysis JSONB DEFAULT '{}',
    infrastructure_details JSONB DEFAULT '{}',
    team_process_info JSONB DEFAULT '{}',
    financial_metrics JSONB DEFAULT '{}',
    compliance_audit JSONB DEFAULT '{}',
    api_integration_data JSONB DEFAULT '{}',
    technical_roadmap JSONB DEFAULT '{}',
    
    -- Evidence storage using Jina embeddings
    evidence_data JSONB DEFAULT '[]',
    evidence_embeddings vector(1536)[],  -- Array of embeddings for evidence
    
    -- Metadata
    generated_by UUID REFERENCES auth.users(id),
    last_updated_by UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_internal_due_diligence_repo ON internal_due_diligence(repo_id);
CREATE INDEX idx_internal_due_diligence_status ON internal_due_diligence(status);
CREATE INDEX idx_internal_due_diligence_created ON internal_due_diligence(created_at DESC);

-- Create GIN indexes for JSONB columns for efficient querying
CREATE INDEX idx_code_analysis_gin ON internal_due_diligence USING gin(code_analysis);
CREATE INDEX idx_infrastructure_gin ON internal_due_diligence USING gin(infrastructure_details);
CREATE INDEX idx_financial_metrics_gin ON internal_due_diligence USING gin(financial_metrics);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS due_diligence_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    due_diligence_id UUID REFERENCES internal_due_diligence(id) ON DELETE CASCADE,
    section TEXT NOT NULL CHECK (section IN (
        'code_analysis', 
        'infrastructure', 
        'team_process', 
        'financial', 
        'compliance', 
        'api_integration', 
        'scalability'
    )),
    
    -- Recommendation details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_impact JSONB DEFAULT '{}',
    implementation_notes TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'dismissed', 'in_progress')),
    implemented_at TIMESTAMP WITH TIME ZONE,
    implemented_by UUID REFERENCES auth.users(id),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    dismissed_by UUID REFERENCES auth.users(id),
    dismissal_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for recommendations
CREATE INDEX idx_recommendations_due_diligence ON due_diligence_recommendations(due_diligence_id);
CREATE INDEX idx_recommendations_section ON due_diligence_recommendations(section);
CREATE INDEX idx_recommendations_priority ON due_diligence_recommendations(priority);
CREATE INDEX idx_recommendations_status ON due_diligence_recommendations(status);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_internal_due_diligence_updated_at
    BEFORE UPDATE ON internal_due_diligence
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recommendations_updated_at
    BEFORE UPDATE ON due_diligence_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE internal_due_diligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE due_diligence_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated PE users can view internal due diligence data
CREATE POLICY "PE users can view internal due diligence"
    ON internal_due_diligence
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role = 'pe_user' 
            AND has_repo_access = true
        )
    );

-- Policy: Only PE users can create/update internal due diligence data
CREATE POLICY "PE users can manage internal due diligence"
    ON internal_due_diligence
    FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role = 'pe_user' 
            AND has_repo_access = true
        )
    );

-- Policy: Recommendations follow same access as parent due diligence
CREATE POLICY "Recommendations access follows parent"
    ON due_diligence_recommendations
    FOR ALL
    TO authenticated
    USING (
        due_diligence_id IN (
            SELECT id FROM internal_due_diligence
            WHERE auth.uid() IN (
                SELECT user_id FROM user_roles 
                WHERE role = 'pe_user' 
                AND has_repo_access = true
            )
        )
    );

-- Grant permissions
GRANT ALL ON internal_due_diligence TO authenticated;
GRANT ALL ON due_diligence_recommendations TO authenticated; 