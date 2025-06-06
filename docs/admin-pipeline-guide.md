# TechScanIQ Admin Pipeline Guide

## Overview

This guide provides administrators with complete visibility and control over the TechScanIQ evidence collection and report generation pipeline.

## Table of Contents

1. [Pipeline Architecture](#pipeline-architecture)
2. [Admin Dashboard Access](#admin-dashboard-access)
3. [Monitoring Pipeline Executions](#monitoring-pipeline-executions)
4. [Configuration Management](#configuration-management)
5. [Troubleshooting](#troubleshooting)
6. [API Keys and Secrets](#api-keys-and-secrets)

## Pipeline Architecture

### Data Flow
```
User Request → Scan Request → Evidence Collection → AI Analysis → Report Generation → Display
```

### Key Components

1. **Evidence Collectors (v7/v8)**
   - HTML Collection
   - Technology Detection
   - Security Scanning
   - Business Intelligence
   - Deep Web Crawling

2. **Report Orchestrators (v3/v5)**
   - Pipeline coordination
   - Error handling
   - Progress tracking
   - Evidence storage

3. **AI Intelligence (v3)**
   - Evidence analysis
   - Report generation
   - Citation creation

## Admin Dashboard Access

### Navigation
1. Log in as admin
2. Access admin tools via sidebar:
   - **Pipeline Monitor** - Real-time execution tracking
   - **Pipeline Configuration** - Tool and stage management
   - **Admin Dashboard** - Overview and metrics

### Pipeline Monitor Features

#### Real-time Monitoring
- View active pipeline executions
- Stage-by-stage progress
- Live logs and metrics
- Error alerts

#### Manual Controls
- **Pause** - Temporarily halt execution
- **Resume** - Continue paused pipeline
- **Retry** - Retry failed stages
- **Skip** - Skip non-critical stages
- **Cancel** - Stop pipeline execution

#### Metrics Dashboard
- Execution duration
- Evidence collected
- Success/failure rates
- Tool performance

## Monitoring Pipeline Executions

### Active Pipelines View
Shows all currently running pipelines with:
- Company name and domain
- Current stage
- Progress percentage
- Evidence count
- Status (running, paused, failed)

### Detailed Execution View
Click on any pipeline to see:
- **Stages Tab**: All pipeline stages with status
- **Logs Tab**: Real-time execution logs
- **Metrics Tab**: Performance and quality metrics

### Alerts System
Automatic alerts for:
- Pipeline failures
- Performance degradation
- API rate limits
- Missing evidence

## Configuration Management

### Pipeline Configuration Page

#### General Settings
- **Minimum Evidence Target**: Set required evidence count (default: 200)
- **Max Duration**: Pipeline timeout in seconds
- **Quality Threshold**: Minimum evidence quality score

#### Stage Management
Enable/disable and configure individual stages:
- Initial Evidence Collection
- Deep Web Crawling
- Technology Analysis
- Business Intelligence
- Security Assessment
- Competitive Analysis
- Financial Indicators
- Report Generation

#### Tool Configuration
Control individual tools:
- Enable/disable tools
- Set timeouts
- Configure retry attempts
- Adjust tool-specific settings

#### Advanced Settings
- **Retry Policy**: Configure automatic retries
- **Error Handling**: Continue on error settings
- **Critical Stages**: Define stages that must succeed

### Configuration Versioning
- Save configurations as drafts
- Activate configurations when ready
- View version history
- Rollback to previous versions

## Troubleshooting

### Common Issues and Solutions

#### 1. Pipeline Stuck or Frozen
**Symptoms**: Pipeline shows "running" but no progress
**Solution**: 
- Check logs for errors
- Use manual "Cancel" and restart
- Check API rate limits

#### 2. Low Evidence Count
**Symptoms**: Reports with <50 evidence items
**Solution**:
- Verify domain is accessible
- Check tool configurations
- Enable more evidence collectors
- Increase depth to "comprehensive"

#### 3. Report Generation Fails
**Symptoms**: Evidence collected but no report
**Solution**:
- Check AI API key validity
- Verify evidence quality
- Check for malformed evidence data

#### 4. Evidence Not Showing in Reports
**Symptoms**: Report exists but no evidence visible
**Solution**:
- Check evidence_collection_id linkage
- Verify citations were created
- Refresh materialized views

### Debug Commands

Check pipeline status:
```sql
SELECT * FROM pipeline_executions 
WHERE status = 'running' 
ORDER BY started_at DESC;
```

View recent errors:
```sql
SELECT * FROM pipeline_logs 
WHERE level = 'error' 
AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

Check evidence linkage:
```sql
SELECT 
  r.id as report_id,
  r.company_name,
  ec.id as collection_id,
  COUNT(ei.id) as evidence_count
FROM reports r
LEFT JOIN evidence_collections ec ON r.evidence_collection_id = ec.id
LEFT JOIN evidence_items ei ON ei.collection_id = ec.id
GROUP BY r.id, r.company_name, ec.id
ORDER BY r.created_at DESC;
```

## API Keys and Secrets

### Required API Keys

All API keys must be set in Supabase Dashboard under:
**Project Settings → Edge Functions → Secrets**

1. **ANTHROPIC_API_KEY** (Required)
   - Used by: tech-intelligence-v3
   - Purpose: AI report generation
   - Get from: https://console.anthropic.com/

2. **GOOGLE_API_KEY** (Required)
   - Used by: google-search-collector
   - Purpose: Business intelligence gathering
   - Get from: Google Cloud Console

3. **OPENAI_API_KEY** (Optional)
   - Used by: Alternative AI analysis
   - Purpose: Backup AI provider

### Setting Secrets

1. Go to Supabase Dashboard
2. Navigate to Settings → Edge Functions
3. Click "Add new secret"
4. Enter secret name (e.g., ANTHROPIC_API_KEY)
5. Enter secret value
6. Save

### Verifying Secrets

Test edge function API access:
```bash
node scripts/test-edge-function-api-access.js
```

## Best Practices

### Performance Optimization

1. **Configure Depth Appropriately**
   - Use "shallow" for quick scans
   - Use "comprehensive" for detailed analysis
   - Balance between speed and thoroughness

2. **Tool Selection**
   - Disable unnecessary tools for faster execution
   - Enable security tools only when needed
   - Adjust timeouts based on company size

3. **Monitoring**
   - Check pipeline monitor daily
   - Address alerts promptly
   - Review failed pipelines for patterns

### Data Quality

1. **Evidence Validation**
   - Monitor evidence quality scores
   - Check for duplicate evidence
   - Verify evidence relevance

2. **Report Quality**
   - Review generated reports for completeness
   - Check citation accuracy
   - Monitor AI analysis quality

### System Health

1. **Regular Checks**
   - Monitor API usage and limits
   - Check database performance
   - Review error logs weekly

2. **Maintenance**
   - Archive old pipeline logs monthly
   - Update tool configurations as needed
   - Test disaster recovery procedures

## Support

For technical issues:
1. Check pipeline logs for detailed error messages
2. Review this troubleshooting guide
3. Contact development team with:
   - Pipeline execution ID
   - Error messages
   - Steps to reproduce

## Appendix: Database Schema

Key tables for monitoring:
- `pipeline_executions` - Main execution tracking
- `pipeline_stages` - Stage-level details
- `pipeline_logs` - Detailed logs
- `pipeline_alerts` - System alerts
- `pipeline_configs` - Configuration versions
- `evidence_collections` - Evidence grouping
- `evidence_items` - Individual evidence
- `report_citations` - Evidence-report links