-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    website TEXT,
    workspace_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'awaiting_review', 'complete', 'error')),
    thesis_input JSONB,
    workspace_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create findings table
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    evidence JSONB,
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    advisor_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_companies_workspace ON companies(workspace_id);
CREATE INDEX idx_companies_name ON companies(name);

CREATE INDEX idx_scans_company ON scans(company_id);
CREATE INDEX idx_scans_user ON scans(user_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_workspace ON scans(workspace_id);
CREATE INDEX idx_scans_created ON scans(created_at DESC);

CREATE INDEX idx_findings_scan ON findings(scan_id);
CREATE INDEX idx_findings_category ON findings(category);
CREATE INDEX idx_findings_severity ON findings(severity);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scans updated_at
CREATE TRIGGER update_scans_updated_at 
    BEFORE UPDATE ON scans
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view companies in their workspace"
    ON companies FOR SELECT
    TO authenticated
    USING (workspace_id IN (
        SELECT workspace_id FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create companies in their workspace"
    ON companies FOR INSERT
    TO authenticated
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM auth.users WHERE id = auth.uid()
    ));

-- RLS Policies for scans
CREATE POLICY "Users can view scans in their workspace"
    ON scans FOR SELECT
    TO authenticated
    USING (workspace_id IN (
        SELECT workspace_id FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create scans in their workspace"
    ON scans FOR INSERT
    TO authenticated
    WITH CHECK (workspace_id IN (
        SELECT workspace_id FROM auth.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own scans"
    ON scans FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for findings
CREATE POLICY "Users can view findings for scans in their workspace"
    ON findings FOR SELECT
    TO authenticated
    USING (scan_id IN (
        SELECT id FROM scans WHERE workspace_id IN (
            SELECT workspace_id FROM auth.users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can create findings for scans in their workspace"
    ON findings FOR INSERT
    TO authenticated
    WITH CHECK (scan_id IN (
        SELECT id FROM scans WHERE workspace_id IN (
            SELECT workspace_id FROM auth.users WHERE id = auth.uid()
        )
    ));

-- Grant permissions
GRANT ALL ON companies TO authenticated;
GRANT ALL ON scans TO authenticated;
GRANT ALL ON findings TO authenticated;
