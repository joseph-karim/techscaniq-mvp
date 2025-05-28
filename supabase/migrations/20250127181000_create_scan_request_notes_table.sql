-- Create scan_request_notes table for additional notes and updates
CREATE TABLE IF NOT EXISTS scan_request_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_request_id UUID REFERENCES scan_requests(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scan_request_notes_scan_request_id ON scan_request_notes(scan_request_id);
CREATE INDEX IF NOT EXISTS idx_scan_request_notes_created_at ON scan_request_notes(created_at DESC);

-- RLS Policies
ALTER TABLE scan_request_notes ENABLE ROW LEVEL SECURITY;

-- Users can view notes for their own scan requests
DROP POLICY IF EXISTS "Users can view notes for their scan requests" ON scan_request_notes;
CREATE POLICY "Users can view notes for their scan requests"
    ON scan_request_notes FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM scan_requests
        WHERE scan_requests.id = scan_request_notes.scan_request_id
        AND scan_requests.requested_by = auth.uid()
    ));

-- Users can create notes for their own scan requests
DROP POLICY IF EXISTS "Users can create notes for their scan requests" ON scan_request_notes;
CREATE POLICY "Users can create notes for their scan requests"
    ON scan_request_notes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM scan_requests
            WHERE scan_requests.id = scan_request_id
            AND scan_requests.requested_by = auth.uid()
        )
        AND author_id = auth.uid()
    );

-- Admins can view all notes
DROP POLICY IF EXISTS "Admins can view all notes" ON scan_request_notes;
CREATE POLICY "Admins can view all notes"
    ON scan_request_notes FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ));

-- Admins can create notes
DROP POLICY IF EXISTS "Admins can create notes" ON scan_request_notes;
CREATE POLICY "Admins can create notes"
    ON scan_request_notes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
        AND author_id = auth.uid()
    );

-- Grant permissions
GRANT ALL ON scan_request_notes TO authenticated; 