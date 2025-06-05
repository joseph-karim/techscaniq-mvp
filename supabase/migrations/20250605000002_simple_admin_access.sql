-- Simple admin access - disable RLS for admin configuration tables
-- These are internal admin tools, not user-facing data

-- Disable RLS on admin configuration tables
ALTER TABLE public.ai_prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_function_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings DISABLE ROW LEVEL SECURITY;

-- Clean up any existing restrictive policies
DROP POLICY IF EXISTS "Admin users can read all prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "Admin users can create prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "Admin users can update prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "Admin users can read all prompt versions" ON public.ai_prompt_versions;
DROP POLICY IF EXISTS "Admin users can create prompt versions" ON public.ai_prompt_versions;
DROP POLICY IF EXISTS "Admin users can manage scan configurations" ON public.scan_configurations;
DROP POLICY IF EXISTS "Admin users can view edge function logs" ON public.edge_function_logs;
DROP POLICY IF EXISTS "Admin users can manage settings" ON public.admin_settings;

-- For ai_prompt_versions, also disable RLS since it's related
ALTER TABLE public.ai_prompt_versions DISABLE ROW LEVEL SECURITY;

-- Add some sample data if tables are empty
INSERT INTO public.ai_prompts (name, description, prompt_text, category, function_name, variables) 
SELECT * FROM (VALUES 
  (
    'Company Research Query',
    'Search query template for company background research',
    '{{company_name}} company business overview revenue funding team',
    'evidence_collection',
    'google-search-collector',
    '["company_name"]'::jsonb
  ),
  (
    'Technology Analysis',
    'Analyze technical evidence and provide structured assessment',
    'Analyze the technology stack of {{company_name}} based on the following evidence:

{{technical_evidence}}

Provide a structured analysis covering:
1. Technology stack overview
2. Architecture patterns identified  
3. Scalability assessment
4. Security considerations
5. Technical risks and opportunities
6. Recommendations for improvement',
    'analysis',
    'tech-intelligence-v3',
    '["company_name", "technical_evidence"]'::jsonb
  ),
  (
    'Executive Summary Generation',
    'Generate executive summary from all collected evidence',
    'Based on comprehensive evidence about {{company_name}}, create an executive summary for {{investor_firm}}:

Evidence Summary:
{{evidence_summary}}

Investment Thesis:
{{investment_criteria}}

Generate a concise executive summary including:
1. Company overview and business model
2. Key technical strengths and capabilities
3. Market position and competitive advantages
4. Primary risks and mitigation strategies
5. Investment recommendation with confidence score',
    'report_generation',
    'tech-intelligence-v3',
    '["company_name", "investor_firm", "evidence_summary", "investment_criteria"]'::jsonb
  )
) AS v(name, description, prompt_text, category, function_name, variables)
WHERE NOT EXISTS (SELECT 1 FROM public.ai_prompts WHERE name = v.name);

-- Add some sample edge function execution logs
INSERT INTO public.edge_function_logs (function_name, status, duration_ms, metadata, created_at)
SELECT * FROM (VALUES
  ('report-orchestrator-v3', 'completed', 45000, '{"company": "Ring4", "depth": "deep", "evidence_count": 25}'::jsonb, NOW() - INTERVAL '2 hours'),
  ('evidence-orchestrator', 'completed', 12000, '{"company": "Ring4", "collections": 5}'::jsonb, NOW() - INTERVAL '2 hours'),
  ('tech-intelligence-v3', 'completed', 8000, '{"analysis_type": "comprehensive", "sections": 6}'::jsonb, NOW() - INTERVAL '2 hours'),
  ('html-collector', 'completed', 3000, '{"url": "https://ring4.com", "pages_collected": 5}'::jsonb, NOW() - INTERVAL '3 hours'),
  ('google-search-collector', 'completed', 2500, '{"query": "Ring4 company information", "results": 10}'::jsonb, NOW() - INTERVAL '3 hours'),
  ('security-scanner', 'failed', 5000, '{"error": "Connection timeout", "target": "ring4.com"}'::jsonb, NOW() - INTERVAL '1 hour'),
  ('webtech-analyzer', 'completed', 1500, '{"technologies_detected": 15, "confidence": 0.85}'::jsonb, NOW() - INTERVAL '1 hour')
) AS v(function_name, status, duration_ms, metadata, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.edge_function_logs LIMIT 1);

-- Add some admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, category, description)
SELECT * FROM (VALUES
  (
    'evidence_collection_timeout',
    '{"default_ms": 30000, "max_ms": 60000, "min_ms": 10000}'::jsonb,
    'timeouts',
    'Timeout settings for evidence collection functions'
  ),
  (
    'max_concurrent_scans',
    '{"value": 5, "burst_limit": 10}'::jsonb,
    'capacity',
    'Maximum number of concurrent scans allowed'
  ),
  (
    'pipeline_retry_policy',
    '{"max_retries": 3, "backoff_multiplier": 2, "initial_delay_ms": 1000}'::jsonb,
    'reliability',
    'Retry policy for failed pipeline operations'
  ),
  (
    'ai_model_preferences',
    '{"report_generation": "claude-3-sonnet", "evidence_analysis": "gpt-4-turbo", "classification": "claude-3-haiku"}'::jsonb,
    'ai_models',
    'Preferred AI models for different pipeline tasks'
  )
) AS v(setting_key, setting_value, category, description)
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings WHERE setting_key = v.setting_key);

-- Verify the setup
SELECT 
  'Admin configuration tables setup complete' as status,
  (SELECT COUNT(*) FROM public.ai_prompts) as ai_prompts_count,
  (SELECT COUNT(*) FROM public.scan_configurations) as scan_configs_count,
  (SELECT COUNT(*) FROM public.edge_function_logs) as function_logs_count,
  (SELECT COUNT(*) FROM public.admin_settings) as admin_settings_count;