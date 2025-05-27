-- Create user profiles table to store workspace information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL DEFAULT gen_random_uuid(),
    workspace_name TEXT,
    role TEXT DEFAULT 'investor' CHECK (role IN ('investor', 'admin', 'pe')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_profiles_workspace ON user_profiles(workspace_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Enable RLS on new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- RLS policies for workspaces
CREATE POLICY "Users can view their workspace"
    ON workspaces FOR SELECT
    TO authenticated
    USING (id IN (
        SELECT workspace_id FROM user_profiles WHERE id = auth.uid()
    ));

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    default_workspace_id UUID;
BEGIN
    -- Create a default workspace for the user
    INSERT INTO workspaces (name) 
    VALUES (COALESCE(NEW.raw_user_meta_data->>'workspace_name', 'My Workspace'))
    RETURNING id INTO default_workspace_id;
    
    -- Create user profile
    INSERT INTO user_profiles (id, workspace_id, workspace_name, role)
    VALUES (
        NEW.id,
        default_workspace_id,
        COALESCE(NEW.raw_user_meta_data->>'workspace_name', 'My Workspace'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'investor')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Drop the problematic RLS policies from the previous migration
DROP POLICY IF EXISTS "Users can view companies in their workspace" ON companies;
DROP POLICY IF EXISTS "Users can create companies in their workspace" ON companies;
DROP POLICY IF EXISTS "Users can view scans in their workspace" ON scans;
DROP POLICY IF EXISTS "Users can create scans in their workspace" ON scans;
DROP POLICY IF EXISTS "Users can view findings for scans in their workspace" ON findings;
DROP POLICY IF EXISTS "Users can create findings for scans in their workspace" ON findings;

-- Create simplified RLS policies that work with the current auth setup

-- Companies policies - allow all authenticated users for now
CREATE POLICY "Authenticated users can view companies"
    ON companies FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create companies"
    ON companies FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
    ON companies FOR UPDATE
    TO authenticated
    USING (true);

-- Scans policies - users can only see their own scans
CREATE POLICY "Users can view their own scans v2"
    ON scans FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create scans v2"
    ON scans FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scans v2"
    ON scans FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Findings policies - users can see findings for their scans
CREATE POLICY "Users can view findings for their scans"
    ON findings FOR SELECT
    TO authenticated
    USING (scan_id IN (
        SELECT id FROM scans WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create findings for their scans"
    ON findings FOR INSERT
    TO authenticated
    WITH CHECK (scan_id IN (
        SELECT id FROM scans WHERE user_id = auth.uid()
    ));

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON workspaces TO authenticated;
