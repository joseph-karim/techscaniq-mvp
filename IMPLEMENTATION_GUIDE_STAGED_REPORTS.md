# Implementation Guide: Staged Report Generation System

## What We've Built

### 1. **Section-Based Prompts** (`src/lib/prompts/section-based-prompts.ts`)
- Individual focused prompts for each report section
- Evidence-based approach with mandatory citations
- Structured JSON output with confidence scores
- Data gap acknowledgment built into each section

### 2. **Staged Report Generator** (`src/workers/report-generation-worker-staged.ts`)
- Generates each section independently with relevant evidence
- Parallel processing where possible
- Master editor review for consistency
- Proper citation tracking throughout

### 3. **Enhanced UI Compatibility**
- Sections map directly to existing tabs in view-report.tsx
- Each section has its own confidence score
- Clear data gap reporting per section

## Immediate Implementation Steps

### Step 1: Update Report Generation Worker (Today)
Replace the current report generation worker with the staged approach:

```bash
# Update the worker import in your queue processor
# From: import './workers/report-generation-worker-v5'
# To: import './workers/report-generation-worker-staged'
```

### Step 2: Update Evidence Collection (Today)
Enhance evidence collection with query decomposition:

```javascript
// In evidence-collection-worker.ts, add query decomposition
const queries = decomposeInvestmentThesis(investmentThesis, companyName);
// Generate 15-20 focused queries instead of broad searches
```

### Step 3: Test with Real Data (Today)
Run the test pipeline:

```bash
# Test with a known company
node test-staged-pipeline.js "Snowplow" "https://snowplow.io" "buy-and-scale"

# Or run full test suite
node test-staged-pipeline.js
```

### Step 4: Monitor Quality Metrics
Check these metrics in generated reports:
- Section confidence scores (should be >70% for good sections)
- Data gaps per section (fewer is better)
- Citation coverage (every claim should have evidence)
- Overall coherence from master editor

## Key Improvements You'll See

### Before:
```
"I apologize, but I cannot provide a comprehensive technical analysis 
based on the limited evidence provided..."
```

### After:
```json
{
  "overview": "Technical analysis based on 12 evidence items reveals React frontend [3,7] and AWS infrastructure [9].",
  "identifiedStack": {
    "frontend": ["React [3,7]", "TypeScript [7]"],
    "backend": ["Not found in evidence"],
    "infrastructure": ["AWS [9]", "CloudFront CDN [9]"]
  },
  "dataGaps": [
    "Backend programming language not identified",
    "Database technology not found in 12 sources"
  ],
  "confidenceScore": 65
}
```

## Next Week's Priorities

### 1. **Query Decomposition Implementation**
```typescript
function decomposeInvestmentThesis(thesis: string, company: string) {
  const baseQueries = {
    'buy-and-scale': [
      `${company} technology stack scalability`,
      `${company} API architecture`,
      `${company} customer growth rate`,
      `${company} market expansion`,
      // ... 15 more specific queries
    ]
  };
  return baseQueries[thesis];
}
```

### 2. **Vector Database Setup**
- Choose Pinecone/Weaviate for evidence ranking
- Embed all evidence chunks
- Implement similarity search for relevance

### 3. **Source Credibility Weighting**
```typescript
const sourceWeights = {
  'gartner.com': 1.0,
  'g2.com': 0.8,
  'reddit.com': 0.4,
  'unknown': 0.3
};
```

## Monitoring Success

### Quality Indicators:
- ✅ Specific technology mentions with citations
- ✅ Clear acknowledgment of missing data
- ✅ Confidence scores reflecting evidence quality
- ✅ Actionable recommendations for gaps

### Red Flags:
- ❌ Generic statements without evidence
- ❌ Confidence >80% with <10 evidence items  
- ❌ Missing citations for claims
- ❌ Vague "analysis pending" messages

## Troubleshooting

### If sections are still generic:
1. Check evidence filtering in `filterEvidenceForSection()`
2. Ensure evidence chunks are 100-200 words (not full pages)
3. Verify JSON parsing in `parseResponse()`

### If citations aren't working:
1. Check evidence chunk formatting has `[1]`, `[2]` etc.
2. Verify prompts enforce citation requirements
3. Look for citation references in generated content

### If confidence scores are always low:
1. May need more evidence sources
2. Check if evidence filtering is too aggressive
3. Consider adjusting confidence calculation

## Production Rollout Plan

### Week 1: Testing
- Run 10 test reports
- Compare quality to current system
- Gather user feedback

### Week 2: Gradual Rollout
- Enable for 25% of users
- Monitor quality metrics
- Fix any issues

### Week 3: Full Deployment
- Enable for all users
- Implement caching optimizations
- Add performance monitoring

## Cost Optimization

With staged generation, you can:
- Use Claude Opus only for synthesis sections
- Use Claude Haiku for evidence extraction
- Cache section results for 24 hours
- Reuse sections when re-running reports

Expected cost reduction: 40-60% per report

## Summary

This staged approach transforms TechScanIQ from a "web summarizer" into a true PE-grade analysis tool by:
1. Generating focused sections with relevant evidence
2. Acknowledging data gaps explicitly
3. Providing traceable citations
4. Maintaining quality through editor review

The system is now architected for the quality that PE firms expect, while being transparent about its limitations.