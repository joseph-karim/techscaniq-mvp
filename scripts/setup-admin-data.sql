-- Setup admin configuration data with RLS bypass
-- This should be run as a database migration or by a superuser

-- Temporarily disable RLS to insert seed data
SET row_security = off;

-- Insert sample prompts if they don't exist
INSERT INTO public.ai_prompts (name, description, prompt_text, category, function_name, variables) 
SELECT * FROM (VALUES 
  (
    'Executive Summary Generation',
    'Generate executive summary from collected evidence',
    'Based on the following evidence about {{company_name}}, generate a comprehensive executive summary for an investment analysis report:

Evidence:
{{evidence_summary}}

Investment Criteria:
{{investment_criteria}}

Please provide:
1. Company overview and business model
2. Key strengths and competitive advantages
3. Technology and infrastructure assessment
4. Market position and growth potential
5. Risk factors and concerns
6. Investment recommendation (1-10 score)

Format the response as a structured analysis suitable for PE/VC review.',
    'report_generation',
    'tech-intelligence-v3',
    '["company_name", "evidence_summary", "investment_criteria"]'::jsonb
  ),
  (
    'Technology Stack Analysis',
    'Analyze technology stack from evidence data',
    'Analyze the technology stack of {{company_name}} based on the following evidence:

{{technical_evidence}}

Focus on:
1. Frontend and backend technologies
2. Database and data architecture
3. Infrastructure and deployment
4. Security implementation
5. Scalability considerations
6. Technical debt assessment
7. Development practices

Provide a detailed assessment with confidence scores and recommendations.',
    'analysis',
    'tech-intelligence-v3',
    '["company_name", "technical_evidence"]'::jsonb
  ),
  (
    'Security Assessment',
    'Generate security analysis from scan results',
    'Evaluate the security posture of {{company_name}} based on:

SSL/TLS Analysis:
{{ssl_data}}

Vulnerability Scan Results:
{{vulnerability_data}}

Security Headers:
{{security_headers}}

Provide:
1. Overall security score (1-100)
2. Critical vulnerabilities
3. Security strengths
4. Compliance considerations
5. Remediation recommendations
6. Risk level assessment',
    'analysis',
    'security-scanner',
    '["company_name", "ssl_data", "vulnerability_data", "security_headers"]'::jsonb
  )
) AS v(name, description, prompt_text, category, function_name, variables)
WHERE NOT EXISTS (SELECT 1 FROM public.ai_prompts WHERE name = v.name);

-- Insert sample edge function logs
INSERT INTO public.edge_function_logs (function_name, status, duration_ms, metadata)
SELECT * FROM (VALUES
  ('report-orchestrator-v3', 'completed', 45000, '{"company": "Ring4", "depth": "deep"}'::jsonb),
  ('evidence-orchestrator', 'completed', 12000, '{"evidence_count": 25}'::jsonb),
  ('tech-intelligence-v3', 'completed', 8000, '{"analysis_type": "comprehensive"}'::jsonb),
  ('html-collector', 'completed', 3000, '{"pages_collected": 5}'::jsonb),
  ('google-search-collector', 'failed', 5000, '{"query": "Ring4 company information"}'::jsonb)
) AS v(function_name, status, duration_ms, metadata)
WHERE NOT EXISTS (SELECT 1 FROM public.edge_function_logs WHERE function_name = v.function_name LIMIT 1);

-- Insert additional admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, category, description)
SELECT * FROM (VALUES
  (
    'scan_rate_limit',
    '{"requests_per_minute": 10, "burst_limit": 20}'::jsonb,
    'capacity',
    'Rate limiting for scan requests'
  ),
  (
    'evidence_storage_policy',
    '{"retention_days": 90, "archive_after_days": 30}'::jsonb,
    'storage',
    'Evidence data retention and archival policy'
  ),
  (
    'notification_settings',
    '{"scan_completion_webhook": "https://example.com/webhook", "email_alerts": true, "slack_integration": false}'::jsonb,
    'notifications',
    'Notification and alerting configuration'
  )
) AS v(setting_key, setting_value, category, description)
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings WHERE setting_key = v.setting_key);

-- Re-enable RLS
SET row_security = on;

-- Grant admin access to a specific user (replace with actual admin user ID)
-- This would typically be done during user setup
-- UPDATE public.user_profiles SET role = 'admin' WHERE id = 'your-admin-user-id';

SELECT 'Admin configuration data setup complete' as status;