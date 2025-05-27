-- Temporarily disable the user profile trigger to fix signup issues
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Simplify RLS policies to allow basic authentication
-- Temporarily disable RLS on user_profiles and workspaces for testing
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE findings DISABLE ROW LEVEL SECURITY;
ALTER TABLE scan_requests DISABLE ROW LEVEL SECURITY;

-- Grant basic permissions for authenticated users
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON workspaces TO authenticated;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON scans TO authenticated;
GRANT ALL ON findings TO authenticated;
GRANT ALL ON scan_requests TO authenticated;
