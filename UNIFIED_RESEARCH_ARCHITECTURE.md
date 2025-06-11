# Unified Research Architecture

## Problem Statement

The current system has a fundamental disconnect:
- **Evidence Collection is Blind**: Collects 128 evidence items without knowing what claims to support
- **Citation Generation is Post-Hoc**: Only 7 citations from 128 items because it only cites what was randomly used
- **No Purpose-Driven Collection**: System collects evidence first, then tries to figure out what to do with it
- **Verbose Citations**: Citations just repeat evidence summaries instead of making specific claims

## Solution: Claim-Driven Research

### Core Concept
Instead of collecting evidence blindly and then trying to make sense of it, we:
1. **Start with specific claims** we want to validate for the investment thesis
2. **Search for evidence** specifically to support or refute each claim
3. **Generate citations inline** as we build the report
4. **Track confidence levels** for each claim and overall assessment

### Architecture

```
Investment Thesis
    ↓
Research Claims Planning
    ↓
Targeted Evidence Collection (per claim)
    ↓
Section Generation with Inline Citations
    ↓
Confidence-Based Scoring
    ↓
Executive Summary
```

### Key Components

#### 1. Research Claims
```typescript
interface ResearchClaim {
  id: string
  section: string  // technology, market, team, financial
  claim: string    // "The company has achieved product-market fit"
  evidenceNeeded: string[]  // ["customer growth", "revenue metrics", "retention"]
  searchQueries: string[]   // Specific searches to validate
  confidenceTarget: number  // 0.9 for critical, 0.7 for medium
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'researching' | 'supported' | 'unsupported' | 'partial'
  supportingEvidence: string[]  // Evidence IDs that support this claim
  confidence: number  // Actual confidence achieved
}
```

#### 2. Investment Thesis Templates
Each thesis type has specific claims to validate:

**Data Infrastructure**:
- Critical: "Has scalable data processing architecture"
- Critical: "Achieved product-market fit with enterprise customers"
- High: "Uses modern cloud-native technologies"

**Accelerate Organic Growth**:
- Critical: "Product has strong network effects"
- Critical: "In a large and growing market"
- High: "Customer acquisition costs are declining"

#### 3. Evidence Collection Strategy
- **Prioritized**: Start with critical claims
- **Targeted**: Search specifically for evidence to validate each claim
- **Confidence-Aware**: Stop when confidence target is met or max attempts reached
- **Multi-Source**: Internal pages + external validation

#### 4. Citation Generation
- **Inline**: Citations created as sections are written
- **Structured**: Each citation links to specific claim and evidence
- **Confidence-Scored**: Shows confidence level for each claim

### Example Flow

1. **Plan Claims** for Snowplow (data_infrastructure thesis):
   ```
   Critical: "Snowplow has built a scalable data processing architecture"
   - Search: site:snowplow.io architecture
   - Search: "Snowplow" data pipeline scalability
   - Evidence needed: architecture docs, benchmarks, case studies
   ```

2. **Collect Evidence**:
   ```
   Found: Architecture page describing "5 billion events/day capacity"
   Confidence: 0.85 (high - specific metric from official source)
   ```

3. **Generate Section**:
   ```
   "Snowplow has demonstrated enterprise-grade scalability, processing 
   over 5 billion events daily for customers like Strava [1]. Their 
   architecture leverages AWS Kinesis for real-time ingestion [2]..."
   ```

4. **Create Citation**:
   ```
   [1] Claim: "processing over 5 billion events daily"
       Evidence: snowplow.io/architecture (confidence: 0.85)
       Priority: Critical claim validated
   ```

### Benefits

1. **Higher Citation Rate**: Every major claim gets cited (30-50 citations vs 7)
2. **Better Evidence Quality**: Evidence collected with purpose, not randomly
3. **Confidence Transparency**: Know exactly how confident we are in each claim
4. **Gap Identification**: Clearly shows what couldn't be validated
5. **Faster Processing**: Don't waste time on irrelevant evidence

### Implementation Status

- ✅ Architecture designed
- ✅ Claim templates created for major thesis types  
- 🚧 Unified worker implementation (report-generation-worker-unified.ts)
- ⏳ Testing with Snowplow
- ⏳ UI updates to show claim confidence

### Next Steps

1. Complete the unified worker implementation
2. Test with Snowplow to validate approach
3. Compare citation quality/quantity with current system
4. Update UI to show claim-based confidence scores
5. Migrate existing workers to unified approach