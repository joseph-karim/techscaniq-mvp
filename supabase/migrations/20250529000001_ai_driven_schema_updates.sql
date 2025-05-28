-- AI-Driven Technical Due Diligence Schema Updates
-- This migration aligns the database with the AI-driven architecture and frontend requirements

-- 1. UPDATE EVIDENCE SYSTEM FOR RAG PIPELINE
-- Enhance evidence_items to support the RAG system with vector embeddings and confidence scoring

ALTER TABLE evidence_items 
ADD COLUMN IF NOT EXISTS vector_embedding vector(1536), -- OpenAI ada-002 embedding size
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS analyst_notes TEXT,
ADD COLUMN IF NOT EXISTS retrieval_rank INTEGER,
ADD COLUMN IF NOT EXISTS tool_used TEXT, -- e.g., 'playwright', 'wappalyzer', 'nuclei'
ADD COLUMN IF NOT EXISTS processing_stage TEXT DEFAULT 'raw' CHECK (processing_stage IN ('raw', 'processed', 'verified', 'cited')),
ADD COLUMN IF NOT EXISTS evidence_hash TEXT, -- For deduplication
ADD COLUMN IF NOT EXISTS extraction_method TEXT; -- e.g., 'web_scraping', 'api_call', 'document_parse'

-- Add indexes for RAG performance
CREATE INDEX IF NOT EXISTS idx_evidence_items_vector ON evidence_items USING ivfflat (vector_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_evidence_items_confidence ON evidence_items(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_items_tool ON evidence_items(tool_used);
CREATE INDEX IF NOT EXISTS idx_evidence_items_hash ON evidence_items(evidence_hash);

-- 2. ENHANCE CITATION SYSTEM FOR FRONTEND COMPATIBILITY
-- Update report_citations to match frontend Citation interface requirements

ALTER TABLE report_citations
ADD COLUMN IF NOT EXISTS claim TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS reasoning TEXT,
ADD COLUMN IF NOT EXISTS confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
ADD COLUMN IF NOT EXISTS analyst TEXT DEFAULT 'AI System',
ADD COLUMN IF NOT EXISTS review_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS methodology TEXT,
ADD COLUMN IF NOT EXISTS evidence_summary JSONB DEFAULT '[]'; -- Flattened evidence for frontend

-- Update existing citations to have required fields
UPDATE report_citations 
SET claim = citation_text 
WHERE claim = '' OR claim IS NULL;

-- 3. STANDARDIZE REPORTS TABLE FOR FRONTEND SECTIONS
-- Ensure report_data JSONB matches the frontend section structure

-- Add constraint to enforce frontend-compatible structure
ALTER TABLE reports 
ADD CONSTRAINT report_data_structure_check 
CHECK (
  report_data ? 'sections' AND
  report_data ? 'company_name' AND
  report_data ? 'investment_score' AND
  jsonb_typeof(report_data->'sections') = 'object'
);

-- Add fields for AI processing metadata
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS ai_model_used TEXT DEFAULT 'claude-3-sonnet',
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS human_reviewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS report_version TEXT DEFAULT '1.0';

-- 4. ADD AI WORKFLOW TRACKING TABLES
-- Track the AI orchestration process for debugging and optimization

CREATE TABLE IF NOT EXISTS ai_workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS ai_workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID REFERENCES ai_workflow_runs(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL, -- e.g., 'planning', 'tech_stack_analysis', 'security_scan'
  stage_type TEXT NOT NULL CHECK (stage_type IN ('planning', 'collection', 'analysis', 'drafting', 'refinement', 'coherence')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  ai_model_used TEXT,
  prompt_template TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  evidence_items_used UUID[] DEFAULT '{}',
  processing_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADD TOOL INTEGRATION TRACKING
-- Track external tool usage (Playwright, Wappalyzer, etc.)

CREATE TABLE IF NOT EXISTS tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID REFERENCES ai_workflow_runs(id),
  tool_name TEXT NOT NULL, -- e.g., 'playwright', 'wappalyzer', 'nuclei', 'lighthouse'
  tool_version TEXT,
  execution_type TEXT NOT NULL, -- e.g., 'web_scraping', 'tech_detection', 'security_scan'
  target_url TEXT,
  input_parameters JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  execution_time_ms INTEGER,
  evidence_items_generated UUID[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADD PROMPT ENGINEERING TRACKING
-- Track prompt performance for optimization

CREATE TABLE IF NOT EXISTS prompt_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 7. ENHANCE SCAN_REQUESTS FOR AI WORKFLOW
-- Add fields to track AI processing status

ALTER TABLE scan_requests
ADD COLUMN IF NOT EXISTS ai_workflow_status TEXT DEFAULT 'pending' CHECK (ai_workflow_status IN ('pending', 'processing', 'completed', 'failed', 'review_required')),
ADD COLUMN IF NOT EXISTS ai_workflow_run_id UUID REFERENCES ai_workflow_runs(id),
ADD COLUMN IF NOT EXISTS evidence_collection_progress DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS report_generation_progress DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS thesis_alignment_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS risk_flags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS automated_flags JSONB DEFAULT '[]';

-- 8. CREATE MATERIALIZED VIEW FOR FRONTEND PERFORMANCE
-- Pre-compute citation data to avoid complex JOINs

CREATE MATERIALIZED VIEW report_citations_with_evidence AS
SELECT 
  rc.id,
  rc.report_id,
  rc.citation_number,
  rc.claim,
  rc.citation_text,
  rc.citation_context,
  rc.reasoning,
  rc.confidence,
  rc.analyst,
  rc.review_date,
  rc.methodology,
  jsonb_build_object(
    'id', ei.id,
    'type', ei.type,
    'title', ei.content_data->>'summary',
    'source', ei.source_data->>'url',
    'excerpt', ei.content_data->>'processed',
    'metadata', jsonb_build_object(
      'confidence', ei.confidence_score,
      'tool_used', ei.tool_used,
      'fileType', ei.metadata->>'fileType',
      'lastModified', ei.metadata->>'lastModified'
    )
  ) as evidence
FROM report_citations rc
LEFT JOIN evidence_items ei ON rc.evidence_item_id = ei.id;

-- Create index for fast frontend queries
CREATE INDEX idx_report_citations_with_evidence_report_id ON report_citations_with_evidence(report_id);

-- 9. ADD VALIDATION FUNCTIONS
-- Ensure data quality for the AI pipeline

CREATE OR REPLACE FUNCTION validate_report_sections(sections JSONB) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Check that required sections exist
  RETURN (
    sections ? 'executiveSummary' AND
    sections ? 'companyOverview' AND
    sections ? 'technologyStack' AND
    sections ? 'securityAssessment' AND
    sections ? 'teamAnalysis' AND
    sections ? 'financialOverview' AND
    jsonb_typeof(sections) = 'object'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_citation_structure(citation JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check that citation has required fields for frontend
  RETURN (
    citation ? 'id' AND
    citation ? 'claim' AND
    citation ? 'confidence' AND
    citation ? 'analyst' AND
    jsonb_typeof(citation->'evidence') = 'array'
  );
END;
$$ LANGUAGE plpgsql;

-- 10. ADD TRIGGERS FOR DATA CONSISTENCY
-- Automatically update citation counts and evidence counts

CREATE OR REPLACE FUNCTION update_report_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update citation count
  UPDATE reports 
  SET citation_count = (
    SELECT COUNT(*) 
    FROM report_citations 
    WHERE report_id = COALESCE(NEW.report_id, OLD.report_id)
  ),
  evidence_count = (
    SELECT COUNT(DISTINCT rc.evidence_item_id)
    FROM report_citations rc
    WHERE rc.report_id = COALESCE(NEW.report_id, OLD.report_id)
    AND rc.evidence_item_id IS NOT NULL
  )
  WHERE id = COALESCE(NEW.report_id, OLD.report_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON report_citations
  FOR EACH ROW
  EXECUTE FUNCTION update_report_counts();

-- 11. ADD RLS POLICIES FOR NEW TABLES
ALTER TABLE ai_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage ai_workflow_runs" ON ai_workflow_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage ai_workflow_stages" ON ai_workflow_stages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage tool_executions" ON tool_executions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage prompt_executions" ON prompt_executions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to view their workflow runs
CREATE POLICY "Users can view their workflow runs" ON ai_workflow_runs
  FOR SELECT TO authenticated
  USING (
    scan_request_id IN (
      SELECT id FROM scan_requests WHERE requested_by = auth.uid()
    )
  );

-- 12. REFRESH MATERIALIZED VIEW FUNCTION
CREATE OR REPLACE FUNCTION refresh_report_citations_view()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW report_citations_with_evidence;
END;
$$ LANGUAGE plpgsql;

-- Set up automatic refresh (call this after major evidence updates)
-- This can be triggered by the AI workflow completion

-- 13. ADD COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE ai_workflow_runs IS 'Tracks AI orchestration workflows for report generation';
COMMENT ON TABLE ai_workflow_stages IS 'Individual stages within an AI workflow (planning, collection, analysis, etc.)';
COMMENT ON TABLE tool_executions IS 'External tool executions (Playwright, Wappalyzer, Nuclei, etc.)';
COMMENT ON TABLE prompt_executions IS 'LLM prompt executions with performance metrics';
COMMENT ON MATERIALIZED VIEW report_citations_with_evidence IS 'Pre-computed view for fast frontend citation loading';

COMMENT ON COLUMN evidence_items.vector_embedding IS 'Vector embedding for RAG similarity search';
COMMENT ON COLUMN evidence_items.confidence_score IS 'AI confidence in evidence quality (0.0-1.0)';
COMMENT ON COLUMN evidence_items.tool_used IS 'External tool that generated this evidence';
COMMENT ON COLUMN reports.quality_score IS 'Overall AI-assessed report quality (0.0-1.0)';
COMMENT ON COLUMN report_citations.confidence IS 'Citation confidence percentage (0-100)';