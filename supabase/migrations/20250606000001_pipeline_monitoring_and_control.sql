-- Pipeline Monitoring and Admin Control Schema
-- This migration creates comprehensive tables for pipeline visibility and control

-- =====================================================
-- PIPELINE EXECUTION TRACKING
-- =====================================================

-- Main pipeline execution table
CREATE TABLE pipeline_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_request_id UUID REFERENCES scan_requests(id) ON DELETE CASCADE,
    orchestrator_version TEXT NOT NULL, -- e.g., 'v3', 'v5'
    config_version_id UUID, -- References config used
    
    -- Status tracking
    status TEXT NOT NULL CHECK (status IN (
        'initializing', 'running', 'paused', 'completed', 
        'failed', 'completed_with_errors', 'cancelled'
    )),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Progress tracking
    current_stage TEXT,
    total_stages INTEGER DEFAULT 0,
    completed_stages INTEGER DEFAULT 0,
    failed_stages INTEGER DEFAULT 0,
    skipped_stages INTEGER DEFAULT 0,
    
    -- Evidence metrics
    total_evidence_collected INTEGER DEFAULT 0,
    high_quality_evidence INTEGER DEFAULT 0,
    evidence_by_type JSONB DEFAULT '{}',
    
    -- Error tracking
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Metadata
    triggered_by TEXT, -- 'user', 'admin', 'scheduled', 'webhook'
    triggered_by_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pipeline stages for detailed tracking
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES pipeline_executions(id) ON DELETE CASCADE,
    
    stage_name TEXT NOT NULL,
    stage_order INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'pending', 'running', 'success', 'partial', 'failed', 'skipped', 'cancelled'
    )),
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Retry tracking
    attempt_number INTEGER DEFAULT 1,
    max_retries INTEGER DEFAULT 3,
    
    -- Results
    evidence_collected INTEGER DEFAULT 0,
    tool_calls_made INTEGER DEFAULT 0,
    
    -- Error info
    error_message TEXT,
    error_details JSONB,
    
    -- Input/Output for debugging
    input_data JSONB,
    output_summary JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed pipeline logs
CREATE TABLE pipeline_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES pipeline_executions(id) ON DELETE CASCADE,
    scan_request_id UUID REFERENCES scan_requests(id) ON DELETE CASCADE,
    
    -- Log details
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    stage TEXT,
    message TEXT NOT NULL,
    
    -- Structured data
    data JSONB DEFAULT '{}',
    
    -- Performance tracking
    duration_ms INTEGER,
    memory_used_mb INTEGER,
    
    -- Search optimization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool execution tracking
CREATE TABLE tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES pipeline_executions(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE,
    
    tool_name TEXT NOT NULL,
    tool_version TEXT,
    
    -- Execution details
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'timeout')),
    
    -- Input/Output
    input_params JSONB,
    output_summary JSONB,
    evidence_count INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_type TEXT,
    
    -- Resource usage
    api_calls_made INTEGER DEFAULT 0,
    bytes_processed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONFIGURATION MANAGEMENT
-- =====================================================

-- Pipeline configuration with versioning
CREATE TABLE pipeline_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    parent_version_id UUID REFERENCES pipeline_configs(id),
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived')),
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Configuration
    config JSONB NOT NULL DEFAULT '{
        "stages": [],
        "tools": {},
        "thresholds": {
            "minEvidence": 50,
            "maxDuration": 300000,
            "qualityThreshold": 0.7
        },
        "retryPolicy": {
            "maxRetries": 3,
            "retryDelay": 2000,
            "backoffMultiplier": 2
        },
        "errorHandling": {
            "continueOnError": true,
            "criticalStages": []
        }
    }',
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    activated_by UUID REFERENCES auth.users(id),
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Configuration change history
CREATE TABLE config_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID REFERENCES pipeline_configs(id) ON DELETE CASCADE,
    
    -- Change details
    change_type TEXT NOT NULL CHECK (change_type IN (
        'create', 'update', 'activate', 'deactivate', 'archive', 'rollback'
    )),
    change_summary TEXT NOT NULL,
    
    -- Diff information
    previous_value JSONB,
    new_value JSONB,
    json_patch JSONB, -- RFC 6902 JSON Patch format
    
    -- Audit
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Rollback info
    is_rollback BOOLEAN DEFAULT FALSE,
    rollback_from_id UUID REFERENCES config_changes(id),
    
    metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- ADMIN CONTROLS
-- =====================================================

-- Manual interventions tracking
CREATE TABLE pipeline_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES pipeline_executions(id) ON DELETE CASCADE,
    
    -- Intervention details
    intervention_type TEXT NOT NULL CHECK (intervention_type IN (
        'pause', 'resume', 'cancel', 'retry_stage', 'skip_stage', 'modify_config'
    )),
    target_stage TEXT,
    
    -- Reason and notes
    reason TEXT NOT NULL,
    notes TEXT,
    
    -- Results
    status TEXT CHECK (status IN ('pending', 'applied', 'failed')),
    result JSONB,
    
    -- Audit
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin alerts and notifications
CREATE TABLE pipeline_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES pipeline_executions(id) ON DELETE CASCADE,
    
    -- Alert details
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'error', 'performance', 'threshold', 'anomaly', 'intervention_required'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored')),
    
    -- Resolution
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- METRICS AND ANALYTICS
-- =====================================================

-- Aggregated pipeline metrics (for dashboards)
CREATE TABLE pipeline_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Time window
    metric_date DATE NOT NULL,
    metric_hour INTEGER CHECK (metric_hour >= 0 AND metric_hour < 24),
    
    -- Execution metrics
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    average_duration_ms INTEGER,
    
    -- Evidence metrics
    total_evidence_collected INTEGER DEFAULT 0,
    average_evidence_per_scan INTEGER DEFAULT 0,
    high_quality_evidence_ratio DECIMAL(3,2),
    
    -- Tool metrics
    tool_usage JSONB DEFAULT '{}', -- {tool_name: count}
    tool_success_rates JSONB DEFAULT '{}', -- {tool_name: success_rate}
    
    -- Error metrics
    error_count INTEGER DEFAULT 0,
    error_types JSONB DEFAULT '{}', -- {error_type: count}
    
    -- Performance metrics
    p50_duration_ms INTEGER,
    p95_duration_ms INTEGER,
    p99_duration_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(metric_date, metric_hour)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Execution queries
CREATE INDEX idx_pipeline_executions_scan_request ON pipeline_executions(scan_request_id);
CREATE INDEX idx_pipeline_executions_status ON pipeline_executions(status);
CREATE INDEX idx_pipeline_executions_started_at ON pipeline_executions(started_at DESC);

-- Stage queries
CREATE INDEX idx_pipeline_stages_execution ON pipeline_stages(execution_id);
CREATE INDEX idx_pipeline_stages_status ON pipeline_stages(status);

-- Log queries
CREATE INDEX idx_pipeline_logs_execution ON pipeline_logs(execution_id);
CREATE INDEX idx_pipeline_logs_level ON pipeline_logs(level);
CREATE INDEX idx_pipeline_logs_timestamp ON pipeline_logs(timestamp DESC);
CREATE INDEX idx_pipeline_logs_scan_request ON pipeline_logs(scan_request_id);

-- Tool execution queries
CREATE INDEX idx_tool_executions_execution ON tool_executions(execution_id);
CREATE INDEX idx_tool_executions_tool_name ON tool_executions(tool_name);
CREATE INDEX idx_tool_executions_status ON tool_executions(status);

-- Config queries
CREATE INDEX idx_pipeline_configs_status ON pipeline_configs(status);
CREATE INDEX idx_pipeline_configs_version ON pipeline_configs(version);

-- Alert queries
CREATE INDEX idx_pipeline_alerts_execution ON pipeline_alerts(execution_id);
CREATE INDEX idx_pipeline_alerts_status ON pipeline_alerts(status);
CREATE INDEX idx_pipeline_alerts_severity ON pipeline_alerts(severity);

-- Metrics queries
CREATE INDEX idx_pipeline_metrics_date ON pipeline_metrics(metric_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE pipeline_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_metrics ENABLE ROW LEVEL SECURITY;

-- Admin policies (admins can see everything)
CREATE POLICY "Admins can view all pipeline data" ON pipeline_executions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Repeat for other tables
CREATE POLICY "Admins can view all stages" ON pipeline_stages
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all logs" ON pipeline_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage configs" ON pipeline_configs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view metrics" ON pipeline_metrics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update pipeline execution progress
CREATE OR REPLACE FUNCTION update_pipeline_execution_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pipeline_executions
    SET 
        completed_stages = (
            SELECT COUNT(*) FROM pipeline_stages 
            WHERE execution_id = NEW.execution_id 
            AND status IN ('success', 'partial')
        ),
        failed_stages = (
            SELECT COUNT(*) FROM pipeline_stages 
            WHERE execution_id = NEW.execution_id 
            AND status = 'failed'
        ),
        current_stage = CASE 
            WHEN NEW.status = 'running' THEN NEW.stage_name
            ELSE current_stage
        END,
        updated_at = NOW()
    WHERE id = NEW.execution_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_execution_on_stage_change
    AFTER INSERT OR UPDATE ON pipeline_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_pipeline_execution_progress();

-- Auto-generate metrics
CREATE OR REPLACE FUNCTION generate_pipeline_metrics()
RETURNS void AS $$
DECLARE
    current_hour INTEGER;
    current_date DATE;
BEGIN
    current_hour := EXTRACT(HOUR FROM NOW());
    current_date := CURRENT_DATE;
    
    INSERT INTO pipeline_metrics (
        metric_date,
        metric_hour,
        total_executions,
        successful_executions,
        failed_executions,
        average_duration_ms,
        total_evidence_collected,
        error_count
    )
    SELECT
        current_date,
        current_hour,
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'failed'),
        AVG(duration_ms)::INTEGER,
        SUM(total_evidence_collected),
        SUM(error_count)
    FROM pipeline_executions
    WHERE started_at >= current_date + (current_hour || ' hours')::INTERVAL
    AND started_at < current_date + ((current_hour + 1) || ' hours')::INTERVAL
    ON CONFLICT (metric_date, metric_hour) 
    DO UPDATE SET
        total_executions = EXCLUDED.total_executions,
        successful_executions = EXCLUDED.successful_executions,
        failed_executions = EXCLUDED.failed_executions,
        average_duration_ms = EXCLUDED.average_duration_ms,
        total_evidence_collected = EXCLUDED.total_evidence_collected,
        error_count = EXCLUDED.error_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get pipeline execution summary
CREATE OR REPLACE FUNCTION get_pipeline_execution_summary(exec_id UUID)
RETURNS TABLE (
    execution_id UUID,
    status TEXT,
    duration_ms INTEGER,
    stage_summary JSONB,
    evidence_summary JSONB,
    error_summary JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.id,
        pe.status,
        pe.duration_ms,
        jsonb_build_object(
            'total', pe.total_stages,
            'completed', pe.completed_stages,
            'failed', pe.failed_stages,
            'current', pe.current_stage
        ) as stage_summary,
        jsonb_build_object(
            'total', pe.total_evidence_collected,
            'high_quality', pe.high_quality_evidence,
            'by_type', pe.evidence_by_type
        ) as evidence_summary,
        jsonb_build_object(
            'count', pe.error_count,
            'last_error', pe.last_error
        ) as error_summary
    FROM pipeline_executions pe
    WHERE pe.id = exec_id;
END;
$$ LANGUAGE plpgsql;

-- Get active alerts for admin dashboard
CREATE OR REPLACE FUNCTION get_active_alerts()
RETURNS TABLE (
    alert_id UUID,
    execution_id UUID,
    company_name TEXT,
    alert_type TEXT,
    severity TEXT,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.id,
        pa.execution_id,
        sr.company_name,
        pa.alert_type,
        pa.severity,
        pa.title,
        pa.created_at
    FROM pipeline_alerts pa
    JOIN pipeline_executions pe ON pa.execution_id = pe.id
    JOIN scan_requests sr ON pe.scan_request_id = sr.id
    WHERE pa.status = 'active'
    ORDER BY 
        CASE pa.severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        pa.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;