# TechScanIQ Pipeline Architecture - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Current State Analysis](#current-state-analysis)
3. [Pipeline Flow](#pipeline-flow)
4. [Component Inventory](#component-inventory)
5. [Integration Points](#integration-points)
6. [Data Flow](#data-flow)
7. [Error Handling & Recovery](#error-handling--recovery)
8. [Admin Control Requirements](#admin-control-requirements)
9. [Implementation Plan](#implementation-plan)

## System Overview

### Architecture Goals
- **Resilient**: Individual component failures don't break the entire pipeline
- **Observable**: Complete visibility into every step and decision
- **Configurable**: Admins can control every aspect without code changes
- **Scalable**: Can handle hundreds of evidence pieces per scan
- **Auditable**: Full traceability of all actions and decisions

### Current Components

```
UI (Request Scan) 
    ↓
Scan Request (DB)
    ↓
Report Orchestrator (v3/v5)
    ├── Evidence Collector (v7/v8)
    │   ├── HTML Collector
    │   ├── Playwright Crawler
    │   ├── WebTech Analyzer
    │   ├── Security Scanner
    │   ├── TestSSL Scanner
    │   ├── Performance Analyzer
    │   ├── Google Search Collector
    │   ├── Nuclei Scanner
    │   └── Deep Research Collector
    ├── Tech Intelligence (v3)
    └── Report Storage
```

## Current State Analysis

### What's Working
1. **UI to Scan Request**: Successfully creates scan requests in database
2. **Manual Pipeline Trigger**: UI manually invokes report-orchestrator-v3
3. **Basic Evidence Collection**: evidence-collector-v7 collects 10-50 pieces
4. **Report Generation**: tech-intelligence-v3 generates analysis
5. **Report Display**: Reports are viewable in UI

### What's Missing/Broken
1. **No Automatic Triggers**: Pipeline doesn't start automatically
2. **Limited Evidence**: Not collecting 200+ pieces as intended
3. **No Admin Visibility**: Admins can't see pipeline progress/failures
4. **No Configuration UI**: All config is hardcoded
5. **Poor Error Recovery**: Failures break entire pipeline
6. **No Versioning**: Can't track config changes
7. **Limited Monitoring**: No real-time pipeline status

## Pipeline Flow

### Current Flow (v3)
```typescript
1. User submits scan request
2. UI creates scan_request record
3. UI manually calls report-orchestrator-v3
4. Orchestrator:
   - Updates status to 'processing'
   - Calls evidence-collector-v7
   - Calls tech-intelligence-v3
   - Stores report
   - Updates status to 'awaiting_review'
```

### Enhanced Flow (v5)
```typescript
1. User submits scan request
2. System creates scan_request with metadata
3. Pipeline trigger (automatic or manual)
4. Orchestrator v5:
   - Initializes monitoring
   - Executes stages with retry logic
   - Records all decisions
   - Handles partial failures
   - Stores evidence progressively
   - Generates comprehensive report
   - Updates status with detailed progress
```

## Component Inventory

### Edge Functions

#### Evidence Collection
- `evidence-collector-v7`: Current production collector
- `evidence-collector-v8`: Enhanced with decision engine
- `evidence-orchestrator`: Simplified 3-tool version
- `html-collector`: Basic HTML fetching
- `jina-collector`: JINA-based extraction
- `google-search-collector`: Gemini-powered search
- `webtech-analyzer`: Technology detection
- `security-scanner`: Security assessment
- `testssl-scanner`: SSL/TLS analysis
- `performance-analyzer`: Lighthouse metrics
- `nuclei-scanner`: Vulnerability scanning
- `playwright-crawler`: JS-rendered content
- `deep-research-collector`: Deep web research
- `har-capture`: Network analysis

#### Analysis & Intelligence
- `tech-intelligence-v3`: AI-powered analysis
- `report-orchestrator-v3`: Current orchestrator
- `report-orchestrator-v5`: Enhanced with monitoring

### Database Tables

#### Existing Tables
```sql
-- Core tables
scan_requests
reports
evidence_items
evidence_collections
report_citations

-- Admin tables
admin_config
admin_scan_config
admin_report_config
```

#### Needed Tables
```sql
-- Pipeline monitoring
pipeline_logs
pipeline_executions
pipeline_stages
pipeline_metrics

-- Configuration versioning
pipeline_configs
config_versions
config_history

-- Admin control
admin_pipeline_settings
admin_tool_configs
admin_thresholds
```

## Integration Points

### 1. UI → Backend
- **Current**: Direct function invocation
- **Enhanced**: Event-driven with status updates

### 2. Orchestrator → Evidence Collectors
- **Current**: Sequential calls with timeouts
- **Enhanced**: Parallel execution with circuit breakers

### 3. Evidence → Storage
- **Current**: Bulk insert at end
- **Enhanced**: Progressive storage with deduplication

### 4. Analysis → Report
- **Current**: Single AI call
- **Enhanced**: Multi-stage analysis with citations

## Data Flow

### Evidence Collection Flow
```
URL Discovery → Page Analysis → Tool Selection → 
Evidence Extraction → Validation → Storage
```

### Decision Engine Flow
```
Current State Analysis → Tool Priority Calculation → 
Execution → Result Recording → Loop Decision
```

### Report Generation Flow
```
Evidence Aggregation → Deduplication → Scoring → 
AI Analysis → Citation Mapping → Report Storage
```

## Error Handling & Recovery

### Stage-Level Recovery
- Each stage can retry independently
- Configurable retry count and delays
- Partial results are preserved
- Failed stages can be skipped

### Pipeline-Level Recovery
- Continue on non-critical failures
- Rollback capability for critical failures
- State preservation for resume
- Comprehensive error logging

## Admin Control Requirements

### 1. Real-Time Monitoring Dashboard
```typescript
interface PipelineDashboard {
  // Active pipelines
  activePipelines: PipelineExecution[]
  
  // Historical data
  recentExecutions: PipelineHistory[]
  successRate: number
  averageDuration: number
  evidenceStats: EvidenceStatistics
  
  // System health
  toolAvailability: ToolStatus[]
  errorRate: number
  queueDepth: number
}
```

### 2. Configuration Management
```typescript
interface PipelineConfig {
  id: string
  version: number
  name: string
  description: string
  
  // Stage configuration
  stages: StageConfig[]
  
  // Global settings
  maxRetries: number
  timeout: number
  continueOnError: boolean
  
  // Tool settings
  enabledTools: string[]
  toolConfigs: Record<string, ToolConfig>
  
  // Thresholds
  minEvidence: number
  qualityThreshold: number
  
  // Active/Draft status
  status: 'active' | 'draft' | 'archived'
  activatedAt?: Date
  activatedBy?: string
}
```

### 3. Manual Controls
```typescript
interface AdminControls {
  // Pipeline control
  pausePipeline(executionId: string): Promise<void>
  resumePipeline(executionId: string): Promise<void>
  retryStage(executionId: string, stage: string): Promise<void>
  skipStage(executionId: string, stage: string): Promise<void>
  
  // Configuration
  createConfig(config: PipelineConfig): Promise<void>
  updateConfig(id: string, updates: Partial<PipelineConfig>): Promise<void>
  activateConfig(id: string): Promise<void>
  rollbackConfig(version: number): Promise<void>
  
  // Tool management
  enableTool(toolName: string): Promise<void>
  disableTool(toolName: string): Promise<void>
  updateToolConfig(toolName: string, config: ToolConfig): Promise<void>
}
```

### 4. Visibility Features
- Live pipeline execution view
- Stage-by-stage progress tracking
- Evidence collection in real-time
- Error details and stack traces
- Performance metrics per stage
- Tool usage statistics
- Cost tracking (API calls)

### 5. Configuration Versioning
```typescript
interface ConfigVersion {
  id: string
  configId: string
  version: number
  changes: ConfigChange[]
  createdBy: string
  createdAt: Date
  activatedAt?: Date
  deactivatedAt?: Date
  rollbackFrom?: number
  
  // Diff from previous
  diff: {
    added: string[]
    removed: string[]
    modified: Record<string, { old: any, new: any }>
  }
}
```

## Implementation Plan

### Phase 1: Database Schema (Current Task)
1. Create pipeline monitoring tables
2. Add configuration versioning tables
3. Set up admin control tables
4. Create indexes for performance
5. Add RLS policies for security

### Phase 2: Monitoring Infrastructure
1. Implement PipelineMonitor class
2. Add real-time event streaming
3. Create metrics aggregation
4. Build error tracking system

### Phase 3: Admin UI Components
1. Pipeline dashboard component
2. Configuration editor
3. Real-time execution viewer
4. Tool management interface
5. Version history browser

### Phase 4: Enhanced Orchestrator
1. Integrate monitoring hooks
2. Add configuration loading
3. Implement pause/resume
4. Add manual stage control

### Phase 5: Testing & Validation
1. End-to-end pipeline tests
2. Failure scenario testing
3. Performance benchmarking
4. Admin control testing

## Next Steps

1. **Immediate**: Create database schema for monitoring
2. **Short-term**: Build admin dashboard components
3. **Medium-term**: Implement configuration versioning
4. **Long-term**: Add advanced features (A/B testing, ML optimization)

## Risk Mitigation

### Technical Risks
- **Edge function timeouts**: Implement chunking and progress saving
- **Database locks**: Use proper transaction isolation
- **Memory limits**: Stream large datasets
- **API rate limits**: Implement backoff and queuing

### Operational Risks
- **Config mistakes**: Validation and dry-run mode
- **Accidental changes**: Approval workflow
- **Data loss**: Comprehensive backups
- **Performance degradation**: Monitoring alerts

## Success Metrics

1. **Pipeline Reliability**: 95%+ success rate
2. **Evidence Volume**: 200+ pieces per scan
3. **Processing Time**: <5 minutes average
4. **Admin Response Time**: <30 seconds to intervene
5. **Configuration Accuracy**: Zero production incidents from config changes