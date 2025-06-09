# Comprehensive Scoring UI Integration Guide

## Overview

This guide explains how the comprehensive scoring system integrates with the TechScanIQ UI components, admin dashboard, and report workflow.

## 1. Admin Dashboard Workflow

### A. Triggering Scans from Admin Dashboard

**Location**: `/src/pages/admin/scan-config.tsx`

The admin can trigger evidence collection jobs with different depth levels:

```typescript
// Depth options available:
- 'shallow': Quick scan (5-10 min)
- 'deep': Standard scan (15-20 min)  
- 'comprehensive': Full scan (30+ min)
```

**Workflow**:
1. Admin selects scan from requests list
2. Chooses collection depth
3. Clicks "Start Collection" → triggers job queue
4. Real-time progress updates via WebSocket

### B. Pipeline Monitoring

**Location**: `/src/pages/admin/pipeline-monitor.tsx`

Features:
- Real-time execution status
- Stage-by-stage progress tracking
- Error alerts and retry capabilities
- Evidence collection metrics

## 2. Report Generation & Draft Management

### A. Report Worker Integration

The comprehensive scoring is calculated in the report generation worker:

```typescript
// src/workers/report-generation-worker-v3.ts
const comprehensiveScore = scoringService.calculateComprehensiveScore(
  evidenceItems,
  investorProfile
)

// Score is stored in report metadata
metadata: { 
  comprehensiveScore,
  missingEvidence,
  confidenceFactors
}
```

### B. Draft Report Creation

Reports are created as drafts first:
- Status: `draft` (not published)
- Admin can review and edit
- Comprehensive score displayed prominently
- Missing evidence highlighted

## 3. UI Component Integration

### A. Confidence Visualization Component

**Location**: `/src/components/reports/ConfidenceVisualization.tsx`

Displays comprehensive scoring results:

```jsx
<ConfidenceVisualization score={report.metadata.comprehensiveScore} />
```

Features:
- Investment score with grade (A-F)
- Confidence level visualization
- Dimension breakdown with progress bars
- Missing evidence alerts
- Scoring methodology explanation

### B. Tech Health Score Gauge

**Location**: `/src/components/dashboard/tech-health-score-gauge.tsx`

Visual gauge showing:
- Technical score (0-100)
- Color-coded zones
- Composite rating breakdown
- Hover tooltips with details

### C. Evidence Modal Integration

**Location**: `/src/components/reports/EvidenceModal.tsx`

Evidence items include:
- Confidence scores per item
- Category classification
- Source verification
- PE user annotation capability

## 4. Navigation & Report Structure

### A. Report Navigation

**Location**: `/src/components/reports/ScanReportNavigation.tsx`

Sections include:
```javascript
- Executive Summary (with comprehensive score)
- Company Overview
- Technology Stack (40% weight)
- Security Assessment
- Team Analysis (10% weight)
- Financial Overview (5% weight)
- Evidence Appendix
```

### B. Anchor Links & Smooth Scrolling

Each section has:
- Unique ID for anchor linking
- Progress indicator
- Category grouping
- Expandable subsections

## 5. Evidence Citation System

### A. Inline Citations

**Location**: `/src/components/reports/EvidenceCitation.tsx`

Features:
- Numbered citations [1], [2], etc.
- Click to expand evidence details
- Confidence indicator
- Source link

### B. Evidence Appendix

Complete evidence trail with:
- All collected evidence items
- Grouped by category
- Sortable by confidence
- Filterable by type

## 6. Publishing Workflow

### A. Draft to Published

1. **Review Draft**:
   - Admin reviews comprehensive score
   - Checks confidence levels
   - Reviews missing evidence

2. **Quality Checks**:
   - Minimum confidence threshold (60%)
   - Required evidence coverage
   - Investment thesis alignment

3. **Publish Actions**:
   ```javascript
   // Update report status
   await supabase
     .from('reports')
     .update({ 
       status: 'published',
       published_at: new Date(),
       published_by: userId
     })
   ```

### B. Post-Publication

- Report becomes read-only
- PE users can view and annotate
- Confidence scores remain visible
- Missing evidence noted for future diligence

## 7. Integration Points

### A. Database Schema

```sql
reports table:
- metadata: JSONB (stores comprehensiveScore)
- investment_score: INTEGER
- tech_health_score: FLOAT
- quality_score: FLOAT
- confidence_score: FLOAT (removed, now in metadata)

evidence_items table:
- confidence_score: FLOAT
- metadata: JSONB (includes category)
```

### B. API Endpoints

```javascript
// Get report with comprehensive scoring
GET /api/reports/:id
Response includes:
{
  report_data: {...},
  metadata: {
    comprehensiveScore: {
      technicalScore: 85,
      confidenceBreakdown: {...}
    }
  }
}
```

## 8. UI Improvements Needed

### A. Admin Dashboard Enhancements

1. **Scoring Preview**:
   - Show live scoring as evidence is collected
   - Confidence meter during collection
   - Missing evidence alerts

2. **Threshold Configuration**:
   - Set minimum confidence for publishing
   - Configure critical evidence requirements
   - Customize thesis weights

### B. Report Viewer Enhancements

1. **Confidence Indicators**:
   - Add confidence badges to each section
   - Show evidence coverage metrics
   - Highlight low-confidence areas

2. **Missing Evidence Callouts**:
   - Prominent alerts for missing critical data
   - Suggested actions to improve confidence
   - Quick links to request additional evidence

## 9. Example Integration Flow

```javascript
// 1. Admin triggers scan
const { data: scanRequest } = await supabase
  .from('scan_requests')
  .insert({ company_name, website_url })

// 2. Create evidence collection job
const job = await createScanJob({
  scanRequestId,
  depth: 'comprehensive'
})

// 3. Worker collects evidence & calculates score
const comprehensiveScore = scoringService.calculateComprehensiveScore(
  evidence,
  investmentThesis
)

// 4. Store in report
const report = await createReport({
  scan_request_id,
  report_data,
  metadata: { comprehensiveScore }
})

// 5. Display in UI
<ConfidenceVisualization score={report.metadata.comprehensiveScore} />
<TechHealthScoreGauge score={comprehensiveScore.technicalScore} />
<EvidenceAppendix evidence={evidence} />
```

## 10. Best Practices

1. **Always Show Confidence**: Never display scores without confidence levels
2. **Explain Missing Evidence**: Be transparent about what's missing
3. **Progressive Enhancement**: Show partial results as evidence is collected
4. **User Education**: Include tooltips explaining scoring methodology
5. **Actionable Insights**: Provide clear next steps to improve scores

This integration ensures that comprehensive scoring is seamlessly woven throughout the application, from evidence collection through report publication.