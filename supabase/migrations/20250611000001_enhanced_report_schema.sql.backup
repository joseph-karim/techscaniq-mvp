-- Enhanced Report Schema for Rich Research Architecture
-- Migration: 20250611000001_enhanced_report_schema.sql

-- 1. Drop the restrictive constraint that's blocking rich research data
ALTER TABLE reports DROP CONSTRAINT IF EXISTS report_data_structure_check;

-- 2. Add new columns for enhanced research data
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS report_version VARCHAR(50) DEFAULT 'legacy',
ADD COLUMN IF NOT EXISTS research_methodology VARCHAR(100),
ADD COLUMN IF NOT EXISTS automated_checks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS automated_checks_passed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS iteration_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS overall_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS knowledge_gaps TEXT[],
ADD COLUMN IF NOT EXISTS technical_profile JSONB,
ADD COLUMN IF NOT EXISTS research_trace JSONB[];

-- 3. Update existing reports to mark them as legacy
UPDATE reports 
SET report_version = 'legacy-v1' 
WHERE report_version IS NULL OR report_version = 'legacy';

-- 4. Create new flexible constraint that supports both legacy and enhanced formats
ALTER TABLE reports ADD CONSTRAINT report_data_enhanced_structure_check 
CHECK (
  -- Legacy format validation
  (report_version LIKE 'legacy%' AND 
   report_data ? 'company_name' AND 
   report_data ? 'investment_score' AND
   report_data ? 'sections') 
  OR
  -- Rich research format validation  
  (report_version LIKE 'rich-%' AND
   report_data ? 'company_name' AND
   report_data ? 'investment_score' AND
   report_data ? 'scores_by_category')
  OR
  -- Unified format validation
  (report_version LIKE 'unified-%' AND
   report_data ? 'company_name' AND
   report_data ? 'investment_score')
);

-- 5. Create indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_reports_version ON reports(report_version);
CREATE INDEX IF NOT EXISTS idx_reports_methodology ON reports(research_methodology);
CREATE INDEX IF NOT EXISTS idx_reports_confidence ON reports(overall_confidence);
CREATE INDEX IF NOT EXISTS idx_reports_automated_checks ON reports(automated_checks_passed, automated_checks_count);

-- 6. Create view for enhanced reports with computed fields
CREATE OR REPLACE VIEW enhanced_reports AS
SELECT 
  id,
  scan_request_id,
  company_name,
  investment_score,
  tech_health_score,
  tech_health_grade,
  report_version,
  research_methodology,
  
  -- Computed fields for rich research
  CASE 
    WHEN automated_checks_count > 0 
    THEN ROUND((automated_checks_passed::DECIMAL / automated_checks_count) * 100, 1)
    ELSE NULL 
  END as automation_success_rate,
  
  CASE 
    WHEN overall_confidence IS NOT NULL 
    THEN ROUND(overall_confidence * 100, 0)
    ELSE NULL 
  END as confidence_percentage,
  
  -- Extract key metrics from technical_profile
  technical_profile->>'securityGrade' as security_grade,
  COALESCE(jsonb_array_length(technical_profile->'technologies'), 0) as technologies_detected,
  COALESCE(jsonb_array_length(technical_profile->'integrations'), 0) as integrations_detected,
  COALESCE(jsonb_array_length(technical_profile->'detectedAPIs'), 0) as apis_detected,
  
  -- Research quality metrics
  iteration_count,
  automated_checks_count,
  automated_checks_passed,
  COALESCE(array_length(knowledge_gaps, 1), 0) as knowledge_gaps_count,
  
  -- Legacy fields
  investment_rationale,
  executive_summary,
  evidence_count,
  citation_count,
  quality_score,
  human_reviewed,
  ai_model_used,
  
  -- Timestamps
  created_at,
  updated_at,
  
  -- Full data
  report_data,
  technical_profile,
  knowledge_gaps,
  research_trace
  
FROM reports;

-- 7. Create indexes on the view for common queries
CREATE INDEX IF NOT EXISTS idx_enhanced_reports_automation_rate 
ON reports((CASE WHEN automated_checks_count > 0 THEN automated_checks_passed::DECIMAL / automated_checks_count ELSE 0 END));

-- 8. Update RLS policies to include new report versions
DROP POLICY IF EXISTS "reports_select_policy" ON reports;
CREATE POLICY "reports_select_policy" ON reports
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM user_profiles 
    WHERE role IN ('admin', 'analyst', 'pe_partner')
  )
  OR 
  scan_request_id IN (
    SELECT id FROM scan_requests 
    WHERE user_id = auth.uid()
  )
);

-- 9. Create helper function to get report summary statistics
CREATE OR REPLACE FUNCTION get_report_quality_stats(report_version_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  total_reports BIGINT,
  avg_investment_score NUMERIC,
  avg_confidence NUMERIC,
  avg_automation_rate NUMERIC,
  avg_citation_count NUMERIC,
  avg_evidence_utilization NUMERIC,
  technology_coverage NUMERIC
) 
LANGUAGE SQL
AS $$
  SELECT 
    COUNT(*) as total_reports,
    ROUND(AVG(investment_score), 1) as avg_investment_score,
    ROUND(AVG(overall_confidence * 100), 1) as avg_confidence,
    ROUND(AVG(
      CASE 
        WHEN automated_checks_count > 0 
        THEN (automated_checks_passed::DECIMAL / automated_checks_count) * 100
        ELSE 0 
      END
    ), 1) as avg_automation_rate,
    ROUND(AVG(citation_count), 1) as avg_citation_count,
    ROUND(AVG(
      CASE 
        WHEN evidence_count > 0 
        THEN (citation_count::DECIMAL / evidence_count) * 100
        ELSE 0 
      END
    ), 1) as avg_evidence_utilization,
    ROUND(AVG(COALESCE(jsonb_array_length(technical_profile->'technologies'), 0)), 1) as technology_coverage
  FROM reports 
  WHERE 
    (report_version_filter IS NULL OR report_version LIKE report_version_filter || '%')
    AND created_at > NOW() - INTERVAL '30 days';
$$;

-- 10. Create notification trigger for quality alerts
CREATE OR REPLACE FUNCTION check_report_quality() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Alert on low confidence scores for rich research reports
  IF NEW.report_version LIKE 'rich-%' AND NEW.overall_confidence < 0.5 THEN
    INSERT INTO admin_notifications (
      type, 
      message, 
      metadata, 
      created_at
    ) VALUES (
      'low_confidence_report',
      'Report generated with low confidence: ' || NEW.company_name || ' (' || ROUND(NEW.overall_confidence * 100) || '%)',
      jsonb_build_object(
        'report_id', NEW.id,
        'company_name', NEW.company_name,
        'confidence', NEW.overall_confidence,
        'report_version', NEW.report_version
      ),
      NOW()
    );
  END IF;
  
  -- Alert on high knowledge gaps
  IF array_length(NEW.knowledge_gaps, 1) > 5 THEN
    INSERT INTO admin_notifications (
      type,
      message,
      metadata,
      created_at
    ) VALUES (
      'high_knowledge_gaps',
      'Report has significant knowledge gaps: ' || NEW.company_name || ' (' || array_length(NEW.knowledge_gaps, 1) || ' gaps)',
      jsonb_build_object(
        'report_id', NEW.id,
        'company_name', NEW.company_name,
        'gaps_count', array_length(NEW.knowledge_gaps, 1),
        'gaps', NEW.knowledge_gaps
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS report_quality_check_trigger ON reports;
CREATE TRIGGER report_quality_check_trigger
  AFTER INSERT OR UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION check_report_quality();

-- 11. Create admin notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at);

-- 12. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON enhanced_reports TO authenticated;
GRANT SELECT ON admin_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_report_quality_stats TO authenticated;

-- 13. Add comments for documentation
COMMENT ON COLUMN reports.report_version IS 'Version of the report generation system (legacy-v1, rich-v1, unified-v1, etc.)';
COMMENT ON COLUMN reports.research_methodology IS 'Research approach used (basic, chain-of-rag, rich-iterative, etc.)';
COMMENT ON COLUMN reports.technical_profile IS 'Automated technical analysis results (security, technologies, APIs, etc.)';
COMMENT ON COLUMN reports.research_trace IS 'Detailed log of research iterations and decisions';
COMMENT ON COLUMN reports.knowledge_gaps IS 'Array of identified knowledge gaps that could not be filled';
COMMENT ON COLUMN reports.overall_confidence IS 'Overall confidence score (0.0 to 1.0) for the entire report';

COMMENT ON VIEW enhanced_reports IS 'Enhanced view of reports with computed metrics for rich research analysis';
COMMENT ON FUNCTION get_report_quality_stats IS 'Get summary statistics comparing report quality across different versions';

-- Migration complete
-- This migration enables:
-- 1. Flexible report structures for different research methodologies
-- 2. Rich metadata tracking for automated analysis
-- 3. Quality monitoring and alerting
-- 4. Performance analytics and comparison
-- 5. Backward compatibility with existing reports