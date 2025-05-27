-- Create scan_requests table for managing scan workflow
CREATE TABLE IF NOT EXISTS scan_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Company information
    company_name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    
    -- Requestor information
    requested_by UUID REFERENCES auth.users(id),
    requestor_name TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    
    -- Scan status and workflow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'awaiting_review', 'in_review', 'complete', 'error')),
    
    -- AI analysis results
    ai_confidence INTEGER,
    tech_health_score DECIMAL(3,1),
    tech_health_grade TEXT CHECK (tech_health_grade IN ('A', 'B', 'C', 'D', 'F')),
    
    -- Analysis sections (JSONB for flexibility)
    sections JSONB DEFAULT '[]',
    risks JSONB DEFAULT '[]',
    
    -- Executive report data
    executive_report_id UUID,
    executive_report_data JSONB,
    executive_report_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Review data
    reviewed_by UUID REFERENCES auth.users(id),
    review_started_at TIMESTAMP WITH TIME ZONE,
    review_completed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    
    -- Publishing
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_scan_requests_status ON scan_requests(status);
CREATE INDEX idx_scan_requests_requested_by ON scan_requests(requested_by);
CREATE INDEX idx_scan_requests_created_at ON scan_requests(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_scan_requests_updated_at BEFORE UPDATE ON scan_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE scan_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own scan requests
CREATE POLICY "Users can view their own scan requests"
    ON scan_requests FOR SELECT
    TO authenticated
    USING (requested_by = auth.uid());

-- Users can create scan requests
CREATE POLICY "Users can create scan requests"
    ON scan_requests FOR INSERT
    TO authenticated
    WITH CHECK (requested_by = auth.uid());

-- Admins can view all scan requests
CREATE POLICY "Admins can view all scan requests"
    ON scan_requests FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ));

-- Admins can update scan requests
CREATE POLICY "Admins can update scan requests"
    ON scan_requests FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ));

-- Grant permissions
GRANT ALL ON scan_requests TO authenticated; 