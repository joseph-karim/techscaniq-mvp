-- TechScanIQ Continuous Monitoring Core Schema
-- Migration: 001_monitoring_core_schema.sql
-- Description: Creates the foundational tables for continuous monitoring system

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Organizations table (if not exists from main app)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monitoring configurations
CREATE TABLE monitoring_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    schedule JSONB NOT NULL, -- {"type": "cron|interval", "expression": "0 */6 * * *", "timezone": "UTC"}
    scan_config JSONB NOT NULL, -- {"technologies": true, "security": true, "performance": true}
    alert_rules JSONB NOT NULL DEFAULT '[]', -- Array of alert rule objects
    enabled BOOLEAN DEFAULT true,
    last_scan_at TIMESTAMPTZ,
    next_scan_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_url CHECK (url ~ '^https?://'),
    CONSTRAINT valid_schedule_type CHECK (schedule->>'type' IN ('cron', 'interval')),
    CONSTRAINT valid_name_length CHECK (length(name) >= 3)
);

-- Create indexes for monitoring_configs
CREATE INDEX idx_monitoring_configs_org_enabled ON monitoring_configs(organization_id, enabled);
CREATE INDEX idx_monitoring_configs_next_scan ON monitoring_configs(next_scan_at) WHERE enabled = true;
CREATE INDEX idx_monitoring_configs_url ON monitoring_configs(url);

-- Scan results table (partitioned by scan timestamp)
CREATE TABLE scan_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
    scan_timestamp TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'completed', 'failed', 'timeout', 'cancelled'
    duration_ms INTEGER,
    result_summary JSONB NOT NULL DEFAULT '{}', -- Key metrics and findings
    full_result_url VARCHAR(2048), -- S3/R2 URL to complete results
    error_message TEXT,
    scan_metadata JSONB DEFAULT '{}', -- Scanner version, configuration, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('completed', 'failed', 'timeout', 'cancelled')),
    CONSTRAINT valid_duration CHECK (duration_ms >= 0),
    CONSTRAINT non_empty_summary CHECK (result_summary != '{}' OR status != 'completed')
) PARTITION BY RANGE (scan_timestamp);

-- Create partitions for scan_results (current month and next month)
CREATE TABLE scan_results_2024_12 PARTITION OF scan_results
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE scan_results_2025_01 PARTITION OF scan_results
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Create indexes for scan_results
CREATE INDEX idx_scan_results_config_timestamp ON scan_results(config_id, scan_timestamp DESC);
CREATE INDEX idx_scan_results_status ON scan_results(status);
CREATE INDEX idx_scan_results_created ON scan_results(created_at DESC);

-- Technology changes tracking
CREATE TABLE technology_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES scan_results(id) ON DELETE SET NULL,
    detected_at TIMESTAMPTZ NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- 'added', 'removed', 'updated', 'version_changed'
    technology_name VARCHAR(255) NOT NULL,
    technology_category VARCHAR(100), -- 'framework', 'library', 'cms', 'analytics', etc.
    old_version VARCHAR(100),
    new_version VARCHAR(100),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    evidence JSONB DEFAULT '{}', -- Supporting evidence for the change
    impact_assessment VARCHAR(20) DEFAULT 'unknown', -- 'low', 'medium', 'high', 'critical', 'unknown'
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID, -- User who acknowledged
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_change_type CHECK (change_type IN ('added', 'removed', 'updated', 'version_changed')),
    CONSTRAINT valid_impact CHECK (impact_assessment IN ('low', 'medium', 'high', 'critical', 'unknown')),
    CONSTRAINT version_change_requires_versions CHECK (
        change_type != 'version_changed' OR (old_version IS NOT NULL AND new_version IS NOT NULL)
    )
);

-- Create indexes for technology_changes
CREATE INDEX idx_technology_changes_config_detected ON technology_changes(config_id, detected_at DESC);
CREATE INDEX idx_technology_changes_type ON technology_changes(change_type);
CREATE INDEX idx_technology_changes_unacknowledged ON technology_changes(config_id) WHERE acknowledged = false;
CREATE INDEX idx_technology_changes_technology ON technology_changes(technology_name);

-- Performance metrics changes
CREATE TABLE performance_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES scan_results(id) ON DELETE SET NULL,
    detected_at TIMESTAMPTZ NOT NULL,
    metric_name VARCHAR(100) NOT NULL, -- 'load_time', 'ttfb', 'fcp', 'lcp', etc.
    old_value DECIMAL(10,3),
    new_value DECIMAL(10,3) NOT NULL,
    change_percent DECIMAL(5,2), -- Percentage change
    threshold_exceeded BOOLEAN DEFAULT false,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
    evidence JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
    CONSTRAINT valid_metric_values CHECK (old_value >= 0 AND new_value >= 0)
);

-- Create indexes for performance_changes
CREATE INDEX idx_performance_changes_config_detected ON performance_changes(config_id, detected_at DESC);
CREATE INDEX idx_performance_changes_metric ON performance_changes(metric_name);
CREATE INDEX idx_performance_changes_severity ON performance_changes(severity);
CREATE INDEX idx_performance_changes_unacknowledged ON performance_changes(config_id) WHERE acknowledged = false;

-- Security changes tracking
CREATE TABLE security_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES scan_results(id) ON DELETE SET NULL,
    detected_at TIMESTAMPTZ NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- 'vulnerability_added', 'vulnerability_fixed', 'security_header_changed'
    vulnerability_type VARCHAR(100), -- 'xss', 'sql_injection', 'csrf', etc.
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '{}',
    cve_ids TEXT[], -- Array of CVE identifiers if applicable
    remediation_advice TEXT,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_security_change_type CHECK (change_type IN (
        'vulnerability_added', 'vulnerability_fixed', 'security_header_changed',
        'ssl_certificate_changed', 'security_policy_changed'
    )),
    CONSTRAINT valid_security_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Create indexes for security_changes
CREATE INDEX idx_security_changes_config_detected ON security_changes(config_id, detected_at DESC);
CREATE INDEX idx_security_changes_severity ON security_changes(severity);
CREATE INDEX idx_security_changes_unresolved ON security_changes(config_id) WHERE resolved = false;
CREATE INDEX idx_security_changes_cve ON security_changes USING GIN(cve_ids);

-- Monitoring alerts
CREATE TABLE monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES monitoring_configs(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    alert_type VARCHAR(100) NOT NULL, -- 'technology_change', 'performance_degradation', 'security_issue'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(500) NOT NULL,
    description TEXT,
    details JSONB NOT NULL DEFAULT '{}', -- Alert-specific details
    change_reference_id UUID, -- Reference to the change that triggered this alert
    change_reference_type VARCHAR(50), -- 'technology_change', 'performance_change', 'security_change'
    triggered_at TIMESTAMPTZ NOT NULL,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    notification_channels JSONB DEFAULT '[]', -- Array of notification channels used
    notification_sent BOOLEAN DEFAULT false,
    notification_attempts INTEGER DEFAULT 0,
    last_notification_attempt TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_alert_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_change_reference_type CHECK (
        change_reference_type IS NULL OR change_reference_type IN (
            'technology_change', 'performance_change', 'security_change'
        )
    )
);

-- Create indexes for monitoring_alerts
CREATE INDEX idx_monitoring_alerts_config_triggered ON monitoring_alerts(config_id, triggered_at DESC);
CREATE INDEX idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX idx_monitoring_alerts_unresolved ON monitoring_alerts(config_id) WHERE resolved = false;
CREATE INDEX idx_monitoring_alerts_notification_pending ON monitoring_alerts(triggered_at) 
    WHERE notification_sent = false AND notification_attempts < 3;

-- Alert notification logs
CREATE TABLE alert_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES monitoring_alerts(id) ON DELETE CASCADE,
    channel_type VARCHAR(50) NOT NULL, -- 'email', 'slack', 'webhook', 'sms'
    channel_config JSONB NOT NULL, -- Channel-specific configuration
    status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'pending'
    attempt_number INTEGER NOT NULL DEFAULT 1,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    response_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_notification_channel CHECK (channel_type IN ('email', 'slack', 'webhook', 'sms')),
    CONSTRAINT valid_notification_status CHECK (status IN ('sent', 'failed', 'pending'))
);

-- Create indexes for alert_notifications
CREATE INDEX idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_status ON alert_notifications(status);
CREATE INDEX idx_alert_notifications_failed ON alert_notifications(created_at) WHERE status = 'failed';

-- Monitoring system health metrics
CREATE TABLE monitoring_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,
    component VARCHAR(100) NOT NULL, -- 'scheduler', 'scanner', 'change_detector', 'alert_engine'
    status VARCHAR(50) NOT NULL, -- 'healthy', 'degraded', 'unhealthy'
    metrics JSONB DEFAULT '{}', -- Component-specific health metrics
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    uptime_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_health_status CHECK (status IN ('healthy', 'degraded', 'unhealthy'))
);

-- Create indexes for monitoring_health
CREATE INDEX idx_monitoring_health_timestamp ON monitoring_health(timestamp DESC);
CREATE INDEX idx_monitoring_health_component ON monitoring_health(component, timestamp DESC);
CREATE INDEX idx_monitoring_health_unhealthy ON monitoring_health(timestamp) WHERE status = 'unhealthy';

-- Create a view for active monitoring configurations with next scan times
CREATE VIEW active_monitoring_configs AS
SELECT 
    mc.*,
    CASE 
        WHEN mc.schedule->>'type' = 'cron' THEN 
            -- For cron expressions, calculate next run time
            mc.next_scan_at
        WHEN mc.schedule->>'type' = 'interval' THEN
            -- For intervals, add interval to last scan or now
            COALESCE(mc.last_scan_at, NOW()) + 
            INTERVAL '1 minute' * (mc.schedule->>'minutes')::integer
        ELSE NOW()
    END as calculated_next_scan
FROM monitoring_configs mc
WHERE mc.enabled = true;

-- Create a view for recent changes summary
CREATE VIEW recent_changes_summary AS
SELECT 
    mc.id as config_id,
    mc.name as config_name,
    mc.url,
    COUNT(tc.id) as technology_changes,
    COUNT(pc.id) as performance_changes,
    COUNT(sc.id) as security_changes,
    MAX(GREATEST(
        COALESCE(tc.detected_at, '1970-01-01'::timestamptz),
        COALESCE(pc.detected_at, '1970-01-01'::timestamptz),
        COALESCE(sc.detected_at, '1970-01-01'::timestamptz)
    )) as last_change_at
FROM monitoring_configs mc
LEFT JOIN technology_changes tc ON mc.id = tc.config_id 
    AND tc.detected_at > NOW() - INTERVAL '24 hours'
LEFT JOIN performance_changes pc ON mc.id = pc.config_id 
    AND pc.detected_at > NOW() - INTERVAL '24 hours'
LEFT JOIN security_changes sc ON mc.id = sc.config_id 
    AND sc.detected_at > NOW() - INTERVAL '24 hours'
WHERE mc.enabled = true
GROUP BY mc.id, mc.name, mc.url;

-- Function to automatically create scan_results partitions
CREATE OR REPLACE FUNCTION create_scan_results_partition(start_date DATE, end_date DATE)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
BEGIN
    partition_name := 'scan_results_' || to_char(start_date, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF scan_results 
                   FOR VALUES FROM (%L) TO (%L)',
                   partition_name, start_date, end_date);
    
    -- Create indexes on the new partition
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(config_id, scan_timestamp DESC)',
                   'idx_' || partition_name || '_config_timestamp', partition_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(status)',
                   'idx_' || partition_name || '_status', partition_name);
END;
$$ LANGUAGE plpgsql;

-- Function to update next_scan_at based on schedule
CREATE OR REPLACE FUNCTION update_next_scan_time(config_id UUID)
RETURNS void AS $$
DECLARE
    config_record monitoring_configs%ROWTYPE;
    next_scan TIMESTAMPTZ;
BEGIN
    SELECT * INTO config_record FROM monitoring_configs WHERE id = config_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitoring configuration not found: %', config_id;
    END IF;
    
    IF config_record.schedule->>'type' = 'interval' THEN
        next_scan := NOW() + INTERVAL '1 minute' * (config_record.schedule->>'minutes')::integer;
    ELSIF config_record.schedule->>'type' = 'cron' THEN
        -- For cron, this would need a proper cron parser
        -- For now, default to 1 hour
        next_scan := NOW() + INTERVAL '1 hour';
    ELSE
        next_scan := NOW() + INTERVAL '1 hour';
    END IF;
    
    UPDATE monitoring_configs 
    SET next_scan_at = next_scan, updated_at = NOW()
    WHERE id = config_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_scan_at when a scan completes
CREATE OR REPLACE FUNCTION trigger_update_next_scan()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE monitoring_configs 
        SET last_scan_at = NEW.scan_timestamp
        WHERE id = NEW.config_id;
        
        PERFORM update_next_scan_time(NEW.config_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scan_results_update_next_scan
    AFTER INSERT ON scan_results
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_next_scan();

-- Insert initial system health record
INSERT INTO monitoring_health (timestamp, component, status, metrics)
VALUES 
    (NOW(), 'system', 'healthy', '{"initialization": true}'),
    (NOW(), 'scheduler', 'healthy', '{"jobs": 0}'),
    (NOW(), 'scanner', 'healthy', '{"active_scans": 0}'),
    (NOW(), 'change_detector', 'healthy', '{"changes_detected": 0}'),
    (NOW(), 'alert_engine', 'healthy', '{"alerts_sent": 0}');

-- Create notification for partition maintenance
CREATE OR REPLACE FUNCTION maintain_scan_results_partitions()
RETURNS void AS $$
DECLARE
    current_month DATE;
    next_month DATE;
BEGIN
    current_month := date_trunc('month', CURRENT_DATE);
    next_month := current_month + INTERVAL '1 month';
    
    -- Create partition for next month if it doesn't exist
    PERFORM create_scan_results_partition(next_month, next_month + INTERVAL '1 month');
    
    -- Log maintenance activity
    INSERT INTO monitoring_health (timestamp, component, status, metrics)
    VALUES (NOW(), 'partition_maintenance', 'healthy', 
            json_build_object('partitions_checked', true, 'next_partition_date', next_month));
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE monitoring_configs IS 'Configuration for continuous monitoring of websites and applications';
COMMENT ON TABLE scan_results IS 'Results of scheduled scans, partitioned by scan timestamp';
COMMENT ON TABLE technology_changes IS 'Detected changes in technology stack over time';
COMMENT ON TABLE performance_changes IS 'Detected changes in performance metrics';
COMMENT ON TABLE security_changes IS 'Detected security-related changes and vulnerabilities';
COMMENT ON TABLE monitoring_alerts IS 'Alert instances triggered by monitoring rules';
COMMENT ON TABLE alert_notifications IS 'Log of notification attempts for alerts';
COMMENT ON TABLE monitoring_health IS 'System health metrics for monitoring components';