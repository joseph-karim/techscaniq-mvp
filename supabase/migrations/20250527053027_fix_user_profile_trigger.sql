-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Create a more robust function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    default_workspace_id UUID;
    workspace_name_val TEXT;
    user_role_val TEXT;
BEGIN
    -- Extract values from user metadata with defaults
    workspace_name_val := COALESCE(NEW.raw_user_meta_data->>'workspace_name', 'My Workspace');
    user_role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'investor');
    
    -- Create a default workspace for the user
    BEGIN
        INSERT INTO workspaces (name) 
        VALUES (workspace_name_val)
        RETURNING id INTO default_workspace_id;
    EXCEPTION WHEN OTHERS THEN
        -- If workspace creation fails, create a simple one
        INSERT INTO workspaces (name) 
        VALUES ('Default Workspace')
        RETURNING id INTO default_workspace_id;
    END;
    
    -- Create user profile
    BEGIN
        INSERT INTO user_profiles (id, workspace_id, workspace_name, role)
        VALUES (
            NEW.id,
            default_workspace_id,
            workspace_name_val,
            user_role_val
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after user is inserted
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Also create profiles for any existing users that don't have them
DO $$
DECLARE
    user_record RECORD;
    default_workspace_id UUID;
BEGIN
    FOR user_record IN 
        SELECT u.id, u.raw_user_meta_data 
        FROM auth.users u 
        LEFT JOIN user_profiles p ON u.id = p.id 
        WHERE p.id IS NULL
    LOOP
        -- Create workspace
        INSERT INTO workspaces (name) 
        VALUES (COALESCE(user_record.raw_user_meta_data->>'workspace_name', 'My Workspace'))
        RETURNING id INTO default_workspace_id;
        
        -- Create profile
        INSERT INTO user_profiles (id, workspace_id, workspace_name, role)
        VALUES (
            user_record.id,
            default_workspace_id,
            COALESCE(user_record.raw_user_meta_data->>'workspace_name', 'My Workspace'),
            COALESCE(user_record.raw_user_meta_data->>'role', 'investor')
        );
    END LOOP;
END $$;
