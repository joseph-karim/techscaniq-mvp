-- Create table for storing configurable prompts
CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  prompt_text TEXT NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('evidence_collection', 'report_generation', 'analysis', 'classification')),
  function_name VARCHAR(255),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variables like {{company_name}}, {{website}}
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create table for prompt version history
CREATE TABLE public.ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.ai_prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(prompt_id, version)
);

-- Create table for scan configuration presets
CREATE TABLE public.scan_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  depth VARCHAR(50) NOT NULL CHECK (depth IN ('shallow', 'deep', 'comprehensive', 'custom')),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb, -- Detailed configuration options
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create table for edge function monitoring
CREATE TABLE public.edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name VARCHAR(255) NOT NULL,
  scan_request_id UUID REFERENCES public.scan_requests(id),
  status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'timeout')),
  duration_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for admin configuration settings
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX idx_ai_prompts_category ON public.ai_prompts(category);
CREATE INDEX idx_ai_prompts_function_name ON public.ai_prompts(function_name);
CREATE INDEX idx_ai_prompts_is_active ON public.ai_prompts(is_active);
CREATE INDEX idx_ai_prompt_versions_prompt_id ON public.ai_prompt_versions(prompt_id);
CREATE INDEX idx_scan_configurations_is_default ON public.scan_configurations(is_default);
CREATE INDEX idx_edge_function_logs_function_name ON public.edge_function_logs(function_name);
CREATE INDEX idx_edge_function_logs_scan_request_id ON public.edge_function_logs(scan_request_id);
CREATE INDEX idx_edge_function_logs_created_at ON public.edge_function_logs(created_at);
CREATE INDEX idx_admin_settings_category ON public.admin_settings(category);

-- Create RLS policies
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin users can read all prompts
CREATE POLICY "Admin users can read all prompts" ON public.ai_prompts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin users can create/update prompts
CREATE POLICY "Admin users can create prompts" ON public.ai_prompts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update prompts" ON public.ai_prompts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Similar policies for other tables
CREATE POLICY "Admin users can read all prompt versions" ON public.ai_prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can create prompt versions" ON public.ai_prompt_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can manage scan configurations" ON public.scan_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can view edge function logs" ON public.edge_function_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can manage settings" ON public.admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_prompts_updated_at BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scan_configurations_updated_at BEFORE UPDATE ON public.scan_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to version prompts
CREATE OR REPLACE FUNCTION version_prompt()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.prompt_text IS DISTINCT FROM NEW.prompt_text THEN
    -- Create a version record with the old content
    INSERT INTO public.ai_prompt_versions (
      prompt_id,
      version,
      prompt_text,
      created_by
    ) VALUES (
      OLD.id,
      OLD.version,
      OLD.prompt_text,
      OLD.updated_by
    );
    
    -- Increment version in the main table
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER version_prompt_on_update BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW EXECUTE FUNCTION version_prompt();

-- Insert default scan configurations
INSERT INTO public.scan_configurations (name, description, depth, configuration, is_default) VALUES
(
  'Shallow Scan',
  'Basic website analysis and business information (5-10 minutes)',
  'shallow',
  '{
    "phases": ["basic_content", "business_info"],
    "tools": ["html-collector", "google-search-collector", "playwright-crawler"],
    "timeout_ms": 600000,
    "evidence_types": ["website_content", "business_overview", "basic_tech"]
  }'::jsonb,
  false
),
(
  'Deep Scan',
  'Comprehensive technical analysis with security scans (10-20 minutes)',
  'deep',
  '{
    "phases": ["basic_content", "business_info", "technical_analysis"],
    "tools": ["html-collector", "google-search-collector", "playwright-crawler", "webtech-analyzer", "security-scanner", "testssl-scanner", "performance-analyzer"],
    "timeout_ms": 1200000,
    "evidence_types": ["website_content", "business_overview", "technology_stack", "security_analysis", "ssl_analysis", "performance_metrics"]
  }'::jsonb,
  true
),
(
  'Comprehensive Scan',
  'Full analysis including market research and team info (20-40 minutes)',
  'comprehensive',
  '{
    "phases": ["basic_content", "business_info", "technical_analysis", "advanced_searches"],
    "tools": ["html-collector", "google-search-collector", "playwright-crawler", "webtech-analyzer", "security-scanner", "testssl-scanner", "performance-analyzer", "nuclei-scanner"],
    "timeout_ms": 2400000,
    "evidence_types": ["website_content", "business_overview", "technology_stack", "security_analysis", "ssl_analysis", "performance_metrics", "vulnerability_scan", "team_info", "market_analysis", "financial_info", "tech_deep_dive"]
  }'::jsonb,
  false
);

-- Insert default prompts for evidence collection
INSERT INTO public.ai_prompts (name, description, prompt_text, category, function_name, variables) VALUES
(
  'Business Overview Search',
  'Google search query template for finding business information',
  '{{company_name}} company information business overview',
  'evidence_collection',
  'google-search-collector',
  '["company_name"]'::jsonb
),
(
  'Team Information Search',
  'Google search query template for finding team/leadership information',
  '{{company_name}} founders team executives leadership',
  'evidence_collection',
  'google-search-collector',
  '["company_name"]'::jsonb
),
(
  'Market Analysis Search',
  'Google search query template for market and competitor analysis',
  '{{company_name}} market analysis competitors industry',
  'evidence_collection',
  'google-search-collector',
  '["company_name"]'::jsonb
),
(
  'Financial Information Search',
  'Google search query template for financial data',
  '{{company_name}} funding revenue investment valuation',
  'evidence_collection',
  'google-search-collector',
  '["company_name"]'::jsonb
),
(
  'Technology Stack Search',
  'Google search query template for technology deep dive',
  '{{company_name}} technology stack architecture engineering',
  'evidence_collection',
  'google-search-collector',
  '["company_name"]'::jsonb
);

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, category, description) VALUES
(
  'evidence_collection_timeout',
  '{"default": 30000, "max": 60000, "min": 10000}'::jsonb,
  'timeouts',
  'Timeout settings for evidence collection functions (in milliseconds)'
),
(
  'max_concurrent_scans',
  '{"value": 5}'::jsonb,
  'capacity',
  'Maximum number of concurrent scans allowed'
),
(
  'ai_model_preferences',
  '{
    "report_generation": "claude-3-sonnet",
    "evidence_analysis": "gpt-4-turbo",
    "classification": "claude-3-haiku"
  }'::jsonb,
  'ai_models',
  'Preferred AI models for different tasks'
);