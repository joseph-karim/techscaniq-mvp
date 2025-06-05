-- Ensure admin configuration tables have proper policies and sample data

-- First, ensure user_profiles table exists and has proper structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'pe', 'advisor')),
  organization_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$ 
BEGIN
  -- Users can view their own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" ON public.user_profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;

  -- Users can update their own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON public.user_profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- Users can create their own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can create their own profile') THEN
    CREATE POLICY "Users can create their own profile" ON public.user_profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  -- Admins can view all profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins can view all profiles') THEN
    CREATE POLICY "Admins can view all profiles" ON public.user_profiles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Now ensure the admin configuration tables are accessible
-- Add service role policies for admin tables (these allow full access for setup)

-- Service role can manage all admin tables
CREATE POLICY "Service role full access ai_prompts" ON public.ai_prompts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access scan_configurations" ON public.scan_configurations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access edge_function_logs" ON public.edge_function_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access admin_settings" ON public.admin_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Also allow authenticated users to read default configurations (for scan selection)
CREATE POLICY "Authenticated users can read scan configurations" ON public.scan_configurations
  FOR SELECT TO authenticated USING (is_active = true);

-- Allow public read access to active scan configurations for the frontend
CREATE POLICY "Public can read active scan configurations" ON public.scan_configurations
  FOR SELECT TO anon USING (is_active = true);

-- Insert some sample data if tables are empty
-- This will run only if the data doesn't already exist

-- Sample AI prompts
INSERT INTO public.ai_prompts (name, description, prompt_text, category, function_name, variables) 
SELECT * FROM (VALUES 
  (
    'Company Research Query',
    'Search query for company background information',
    '{{company_name}} company business overview revenue funding',
    'evidence_collection',
    'google-search-collector',
    '["company_name"]'::jsonb
  ),
  (
    'Technical Analysis',
    'Analyze technical infrastructure and stack',
    'Analyze the technology stack and infrastructure of {{company_name}}:

Technical Evidence:
{{technical_data}}

Provide assessment of:
1. Technology choices and architecture
2. Scalability and performance
3. Security implementation
4. Development practices
5. Technical risks and opportunities',
    'analysis',
    'tech-intelligence-v3',
    '["company_name", "technical_data"]'::jsonb
  )
) AS v(name, description, prompt_text, category, function_name, variables)
WHERE NOT EXISTS (SELECT 1 FROM public.ai_prompts LIMIT 1);

-- Sample edge function logs
INSERT INTO public.edge_function_logs (function_name, status, duration_ms, metadata)
SELECT * FROM (VALUES
  ('report-orchestrator-v3', 'completed', 45000, '{"company": "Test Company", "depth": "deep"}'::jsonb),
  ('evidence-orchestrator', 'completed', 12000, '{"evidence_count": 15}'::jsonb),
  ('tech-intelligence-v3', 'completed', 8000, '{"analysis_type": "basic"}'::jsonb)
) AS v(function_name, status, duration_ms, metadata)
WHERE NOT EXISTS (SELECT 1 FROM public.edge_function_logs LIMIT 1);

-- Sample admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, category, description)
SELECT * FROM (VALUES
  (
    'pipeline_timeout',
    '{"default_ms": 300000, "max_ms": 600000}'::jsonb,
    'timeouts',
    'Default and maximum timeouts for pipeline operations'
  ),
  (
    'evidence_retention',
    '{"days": 90}'::jsonb,
    'storage',
    'How long to retain evidence data'
  )
) AS v(setting_key, setting_value, category, description)
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings LIMIT 1);