-- AI Workflow Schema for Production
-- Copy and paste this into Supabase SQL Editor

-- Create ai_workflow_runs table
CREATE TABLE IF NOT EXISTS ai_workflow_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_request_id UUID REFERENCES scan_requests(id),
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('full_report', 'section_update', 'evidence_collection')),
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'planning', 'collecting', 'analyzing', 'drafting', 'refining', 'completed', 'failed')),
  current_stage TEXT,
  stages_completed JSONB DEFAULT '[]',
  error_log JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_workflow_stages table
CREATE TABLE IF NOT EXISTS ai_workflow_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_run_id UUID REFERENCES ai_workflow_runs(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_type TEXT NOT NULL CHECK (stage_type IN ('planning', 'collection', 'analysis', 'drafting', 'refinement', 'coherence')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  ai_model_used TEXT,
  prompt_template TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  evidence_items_used UUID[],
  processing_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tool_executions table
CREATE TABLE IF NOT EXISTS tool_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_run_id UUID REFERENCES ai_workflow_runs(id),
  tool_name TEXT NOT NULL,
  execution_type TEXT NOT NULL,
  input_parameters JSONB,
  output_data JSONB,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER
);

-- Create prompt_executions table
CREATE TABLE IF NOT EXISTS prompt_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_stage_id UUID REFERENCES ai_workflow_stages(id),
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('system', 'planning', 'section_specific', 'refinement', 'coherence')),
  prompt_template_id TEXT,
  prompt_content TEXT,
  ai_model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  response_content TEXT,
  response_quality_score DECIMAL(3,2),
  execution_time_ms INTEGER,
  cost_usd DECIMAL(10,6),
  temperature DECIMAL(3,2) DEFAULT 0.7,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add ai_workflow_run_id to scan_requests if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scan_requests' AND column_name = 'ai_workflow_run_id') THEN
        ALTER TABLE scan_requests ADD COLUMN ai_workflow_run_id UUID REFERENCES ai_workflow_runs(id);
    END IF;
END$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_workflow_runs_scan_request ON ai_workflow_runs(scan_request_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflow_stages_workflow ON ai_workflow_stages(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_workflow ON tool_executions(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_stage ON prompt_executions(workflow_stage_id);

-- Create RLS policies for demo access
CREATE POLICY IF NOT EXISTS "Demo access to ai_workflow_runs" ON ai_workflow_runs FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to ai_workflow_stages" ON ai_workflow_stages FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to tool_executions" ON tool_executions FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to prompt_executions" ON prompt_executions FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to reports" ON reports FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to report_citations" ON report_citations FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Demo access to evidence_items" ON evidence_items FOR SELECT TO anon USING (true);

-- Enable RLS on new tables
ALTER TABLE ai_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;