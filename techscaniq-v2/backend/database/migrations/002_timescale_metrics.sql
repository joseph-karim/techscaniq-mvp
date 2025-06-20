-- TechScanIQ TimescaleDB Metrics Schema
-- Migration: 002_timescale_metrics.sql
-- Description: Creates time-series tables for performance metrics and system monitoring

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Performance metrics time-series table
CREATE TABLE performance_metrics (
    time TIMESTAMPTZ NOT NULL,
    config_id UUID NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(20), -- 'ms', 'seconds', 'bytes', 'score', etc.
    tags JSONB DEFAULT '{}', -- Additional metadata tags
    scan_id UUID, -- Reference to the scan that generated this metric
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_metric_value CHECK (value >= 0),
    CONSTRAINT valid_metric_name CHECK (length(metric_name) > 0)
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable('performance_metrics', 'time', chunk_time_interval => INTERVAL '1 day');

-- Create indexes for performance_metrics
CREATE INDEX idx_performance_metrics_config_time ON performance_metrics (config_id, time DESC);
CREATE INDEX idx_performance_metrics_metric_time ON performance_metrics (metric_name, time DESC);
CREATE INDEX idx_performance_metrics_tags ON performance_metrics USING GIN (tags);

-- System health metrics time-series table
CREATE TABLE system_metrics (
    time TIMESTAMPTZ NOT NULL,
    service_name VARCHAR(100) NOT NULL, -- 'api-server', 'monitoring-pipeline', 'change-detector'
    metric_name VARCHAR(100) NOT NULL, -- 'cpu_usage', 'memory_usage', 'response_time'
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(20),
    tags JSONB DEFAULT '{}', -- Additional metadata like instance_id, version, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_system_metric_value CHECK (value >= 0),
    CONSTRAINT valid_service_name CHECK (length(service_name) > 0)
);

-- Convert to hypertable
SELECT create_hypertable('system_metrics', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Create indexes for system_metrics
CREATE INDEX idx_system_metrics_service_time ON system_metrics (service_name, time DESC);
CREATE INDEX idx_system_metrics_metric_time ON system_metrics (metric_name, time DESC);
CREATE INDEX idx_system_metrics_tags ON system_metrics USING GIN (tags);

-- Scan frequency metrics
CREATE TABLE scan_frequency_metrics (
    time TIMESTAMPTZ NOT NULL,
    config_id UUID NOT NULL,
    scans_scheduled INTEGER DEFAULT 0,
    scans_completed INTEGER DEFAULT 0,
    scans_failed INTEGER DEFAULT 0,
    average_duration_ms DOUBLE PRECISION,
    success_rate DOUBLE PRECISION, -- Percentage of successful scans
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_scan_counts CHECK (
        scans_scheduled >= 0 AND scans_completed >= 0 AND scans_failed >= 0
    ),
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- Convert to hypertable
SELECT create_hypertable('scan_frequency_metrics', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Create indexes for scan_frequency_metrics
CREATE INDEX idx_scan_frequency_config_time ON scan_frequency_metrics (config_id, time DESC);

-- Change detection metrics
CREATE TABLE change_detection_metrics (
    time TIMESTAMPTZ NOT NULL,
    config_id UUID NOT NULL,
    technology_changes INTEGER DEFAULT 0,
    performance_changes INTEGER DEFAULT 0,
    security_changes INTEGER DEFAULT 0,
    total_changes INTEGER DEFAULT 0,
    processing_time_ms DOUBLE PRECISION,
    confidence_avg DOUBLE PRECISION, -- Average confidence score of detected changes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_change_counts CHECK (
        technology_changes >= 0 AND performance_changes >= 0 AND 
        security_changes >= 0 AND total_changes >= 0
    ),
    CONSTRAINT valid_confidence CHECK (confidence_avg IS NULL OR (confidence_avg >= 0 AND confidence_avg <= 1))
);

-- Convert to hypertable
SELECT create_hypertable('change_detection_metrics', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Create indexes for change_detection_metrics
CREATE INDEX idx_change_detection_config_time ON change_detection_metrics (config_id, time DESC);

-- Alert metrics
CREATE TABLE alert_metrics (
    time TIMESTAMPTZ NOT NULL,
    config_id UUID,
    alert_type VARCHAR(100),
    severity VARCHAR(20),
    alerts_triggered INTEGER DEFAULT 0,
    alerts_acknowledged INTEGER DEFAULT 0,
    alerts_resolved INTEGER DEFAULT 0,
    average_resolution_time_minutes DOUBLE PRECISION,
    notification_success_rate DOUBLE PRECISION, -- Percentage of successful notifications
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_alert_counts CHECK (
        alerts_triggered >= 0 AND alerts_acknowledged >= 0 AND alerts_resolved >= 0
    ),
    CONSTRAINT valid_notification_rate CHECK (
        notification_success_rate IS NULL OR (notification_success_rate >= 0 AND notification_success_rate <= 100)
    )
);

-- Convert to hypertable
SELECT create_hypertable('alert_metrics', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Create indexes for alert_metrics
CREATE INDEX idx_alert_metrics_config_time ON alert_metrics (config_id, time DESC);
CREATE INDEX idx_alert_metrics_type_time ON alert_metrics (alert_type, time DESC);
CREATE INDEX idx_alert_metrics_severity_time ON alert_metrics (severity, time DESC);

-- Queue metrics (for monitoring message queue health)
CREATE TABLE queue_metrics (
    time TIMESTAMPTZ NOT NULL,
    queue_name VARCHAR(100) NOT NULL, -- 'scan.scheduled', 'scan.completed', etc.
    messages_produced INTEGER DEFAULT 0,
    messages_consumed INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    queue_depth INTEGER DEFAULT 0, -- Current number of messages in queue
    average_processing_time_ms DOUBLE PRECISION,
    throughput_per_second DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_queue_counts CHECK (
        messages_produced >= 0 AND messages_consumed >= 0 AND messages_failed >= 0 AND queue_depth >= 0
    )
);

-- Convert to hypertable
SELECT create_hypertable('queue_metrics', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Create indexes for queue_metrics
CREATE INDEX idx_queue_metrics_name_time ON queue_metrics (queue_name, time DESC);

-- Create continuous aggregates for common queries

-- Hourly performance metrics rollup
CREATE MATERIALIZED VIEW performance_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    config_id,
    metric_name,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as sample_count
FROM performance_metrics
GROUP BY bucket, config_id, metric_name;

-- Daily performance metrics rollup
CREATE MATERIALIZED VIEW performance_metrics_daily
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', time) AS bucket,
    config_id,
    metric_name,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as sample_count
FROM performance_metrics
GROUP BY bucket, config_id, metric_name;

-- System health hourly rollup
CREATE MATERIALIZED VIEW system_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    service_name,
    metric_name,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as sample_count
FROM system_metrics
GROUP BY bucket, service_name, metric_name;

-- Create data retention policies

-- Keep raw performance metrics for 90 days
SELECT add_retention_policy('performance_metrics', INTERVAL '90 days');

-- Keep raw system metrics for 30 days
SELECT add_retention_policy('system_metrics', INTERVAL '30 days');

-- Keep scan frequency metrics for 180 days
SELECT add_retention_policy('scan_frequency_metrics', INTERVAL '180 days');

-- Keep change detection metrics for 365 days
SELECT add_retention_policy('change_detection_metrics', INTERVAL '365 days');

-- Keep alert metrics for 365 days
SELECT add_retention_policy('alert_metrics', INTERVAL '365 days');

-- Keep queue metrics for 30 days
SELECT add_retention_policy('queue_metrics', INTERVAL '30 days');

-- Functions for common metric operations

-- Function to record performance metric
CREATE OR REPLACE FUNCTION record_performance_metric(
    p_config_id UUID,
    p_metric_name VARCHAR(100),
    p_value DOUBLE PRECISION,
    p_unit VARCHAR(20) DEFAULT NULL,
    p_tags JSONB DEFAULT '{}',
    p_scan_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO performance_metrics (time, config_id, metric_name, value, unit, tags, scan_id)
    VALUES (NOW(), p_config_id, p_metric_name, p_value, p_unit, p_tags, p_scan_id);
END;
$$ LANGUAGE plpgsql;

-- Function to record system metric
CREATE OR REPLACE FUNCTION record_system_metric(
    p_service_name VARCHAR(100),
    p_metric_name VARCHAR(100),
    p_value DOUBLE PRECISION,
    p_unit VARCHAR(20) DEFAULT NULL,
    p_tags JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO system_metrics (time, service_name, metric_name, value, unit, tags)
    VALUES (NOW(), p_service_name, p_metric_name, p_value, p_unit, p_tags);
END;
$$ LANGUAGE plpgsql;

-- Function to get latest performance metrics for a config
CREATE OR REPLACE FUNCTION get_latest_performance_metrics(
    p_config_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    time TIMESTAMPTZ,
    metric_name VARCHAR(100),
    value DOUBLE PRECISION,
    unit VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT pm.time, pm.metric_name, pm.value, pm.unit
    FROM performance_metrics pm
    WHERE pm.config_id = p_config_id
    ORDER BY pm.time DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance trend
CREATE OR REPLACE FUNCTION get_performance_trend(
    p_config_id UUID,
    p_metric_name VARCHAR(100),
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    bucket TIMESTAMPTZ,
    avg_value DOUBLE PRECISION,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    sample_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        time_bucket('1 hour', pm.time) as bucket,
        AVG(pm.value) as avg_value,
        MIN(pm.value) as min_value,
        MAX(pm.value) as max_value,
        COUNT(*) as sample_count
    FROM performance_metrics pm
    WHERE pm.config_id = p_config_id 
        AND pm.metric_name = p_metric_name
        AND pm.time > NOW() - INTERVAL '1 hour' * p_hours
    GROUP BY bucket
    ORDER BY bucket DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to detect performance anomalies
CREATE OR REPLACE FUNCTION detect_performance_anomalies(
    p_config_id UUID,
    p_metric_name VARCHAR(100),
    p_threshold_multiplier DOUBLE PRECISION DEFAULT 2.0
)
RETURNS TABLE (
    time TIMESTAMPTZ,
    value DOUBLE PRECISION,
    baseline_avg DOUBLE PRECISION,
    deviation_factor DOUBLE PRECISION
) AS $$
DECLARE
    baseline_avg DOUBLE PRECISION;
    baseline_stddev DOUBLE PRECISION;
BEGIN
    -- Calculate baseline statistics from last 7 days
    SELECT AVG(value), STDDEV(value)
    INTO baseline_avg, baseline_stddev
    FROM performance_metrics
    WHERE config_id = p_config_id 
        AND metric_name = p_metric_name
        AND time > NOW() - INTERVAL '7 days'
        AND time < NOW() - INTERVAL '1 hour'; -- Exclude recent data
    
    -- Return anomalous values
    RETURN QUERY
    SELECT 
        pm.time,
        pm.value,
        baseline_avg,
        ABS(pm.value - baseline_avg) / NULLIF(baseline_stddev, 0) as deviation_factor
    FROM performance_metrics pm
    WHERE pm.config_id = p_config_id 
        AND pm.metric_name = p_metric_name
        AND pm.time > NOW() - INTERVAL '1 hour'
        AND ABS(pm.value - baseline_avg) > (baseline_stddev * p_threshold_multiplier)
    ORDER BY pm.time DESC;
END;
$$ LANGUAGE plpgsql;

-- Create views for common dashboard queries

-- Current system health overview
CREATE VIEW current_system_health AS
SELECT 
    service_name,
    metric_name,
    value,
    unit,
    time,
    CASE 
        WHEN metric_name = 'cpu_usage' AND value > 80 THEN 'warning'
        WHEN metric_name = 'memory_usage' AND value > 85 THEN 'warning'
        WHEN metric_name = 'response_time' AND value > 5000 THEN 'warning'
        ELSE 'healthy'
    END as health_status
FROM system_metrics sm1
WHERE sm1.time = (
    SELECT MAX(time) 
    FROM system_metrics sm2 
    WHERE sm2.service_name = sm1.service_name 
        AND sm2.metric_name = sm1.metric_name
);

-- Performance summary by config
CREATE VIEW performance_summary_24h AS
SELECT 
    config_id,
    COUNT(DISTINCT metric_name) as metrics_tracked,
    AVG(CASE WHEN metric_name = 'load_time' THEN value END) as avg_load_time,
    AVG(CASE WHEN metric_name = 'ttfb' THEN value END) as avg_ttfb,
    AVG(CASE WHEN metric_name = 'fcp' THEN value END) as avg_fcp,
    COUNT(*) as total_measurements
FROM performance_metrics
WHERE time > NOW() - INTERVAL '24 hours'
GROUP BY config_id;

-- Alert frequency summary
CREATE VIEW alert_frequency_summary AS
SELECT 
    date_trunc('day', time) as date,
    config_id,
    alert_type,
    severity,
    SUM(alerts_triggered) as total_alerts,
    AVG(notification_success_rate) as avg_notification_success_rate
FROM alert_metrics
WHERE time > NOW() - INTERVAL '30 days'
GROUP BY date, config_id, alert_type, severity
ORDER BY date DESC;

-- Initialize some baseline metrics
INSERT INTO system_metrics (time, service_name, metric_name, value, unit, tags) VALUES
    (NOW(), 'monitoring-pipeline', 'startup', 1, 'event', '{"version": "1.0.0"}'),
    (NOW(), 'timescaledb', 'initialization', 1, 'event', '{"status": "ready"}');

COMMENT ON TABLE performance_metrics IS 'Time-series performance metrics for monitored websites';
COMMENT ON TABLE system_metrics IS 'Time-series system health metrics for monitoring infrastructure';
COMMENT ON TABLE scan_frequency_metrics IS 'Aggregated metrics about scan frequency and success rates';
COMMENT ON TABLE change_detection_metrics IS 'Metrics about change detection effectiveness';
COMMENT ON TABLE alert_metrics IS 'Metrics about alert generation and resolution';
COMMENT ON TABLE queue_metrics IS 'Metrics about message queue performance and health';

COMMENT ON FUNCTION record_performance_metric IS 'Records a performance metric for a monitored configuration';
COMMENT ON FUNCTION record_system_metric IS 'Records a system health metric';
COMMENT ON FUNCTION get_latest_performance_metrics IS 'Retrieves the latest performance metrics for a configuration';
COMMENT ON FUNCTION get_performance_trend IS 'Gets hourly performance trend data';
COMMENT ON FUNCTION detect_performance_anomalies IS 'Detects performance anomalies using statistical analysis';