# Report Generation Architecture Fix

## Current Problem

The report generation is completely disconnected from the deep research system:

1. **Evidence Collection**: Deep research collects evidence but doesn't generate reports
2. **Report Generation**: Creates generic content without using collected evidence
3. **No Citations**: Reports have no citations linking claims to evidence

## Root Cause

We have two separate systems:
- `IntelligentResearchOrchestrator` (Python) - Collects evidence
- Report generation (TypeScript) - Creates reports without evidence

## Solution: Unified Deep-Searcher Architecture

### 1. Single Flow: Research → Report with Citations

```python
async def generate_cited_report(company: str, thesis: str):
    """
    Single flow that:
    1. Researches company using multiple tools
    2. Collects evidence with source tracking
    3. Generates report with embedded citations
    """
    
    # Phase 1: Deep Research
    evidence = await orchestrator.conduct_adaptive_research(
        company=company,
        domain=domain,
        investment_thesis=thesis
    )
    
    # Phase 2: Process Evidence for Citations
    citations_db = {}
    for idx, evidence_item in enumerate(evidence['evidence_collected']):
        citation_id = f"cite-{idx+1}"
        citations_db[citation_id] = {
            'source': evidence_item['source'],
            'content': evidence_item['content'],
            'confidence': evidence_item['confidence']
        }
    
    # Phase 3: Generate Report with Citations
    report_prompt = f"""
    Generate a comprehensive investment report for {company}.
    
    Evidence collected:
    {format_evidence_for_prompt(evidence)}
    
    IMPORTANT: For every claim you make, add a citation like [1], [2], etc.
    Map citations to the evidence items provided.
    
    Structure:
    1. Executive Summary (with citations)
    2. Technology Assessment (with citations)
    3. Team Analysis (with citations)
    4. Security Review (with citations)
    5. Investment Recommendation (with citations)
    
    Example format:
    "The company uses modern cloud infrastructure [1] with Kubernetes orchestration [2] 
    and has achieved SOC 2 compliance [3]."
    """
    
    # Generate report with Claude
    report = await generate_with_citations(report_prompt, citations_db)
    
    return {
        'report': report,
        'citations': citations_db,
        'evidence_count': len(evidence['evidence_collected'])
    }
```

### 2. Implementation Steps

#### Step 1: Create Unified Worker
```typescript
// src/workers/deep-research-report-worker.ts
export async function generateDeepResearchReport(request: {
  company: string;
  domain: string;
  thesis: string;
}) {
  // Call Python orchestrator via subprocess or API
  const research = await runPythonOrchestrator(request);
  
  // Store evidence in database
  const evidenceIds = await storeEvidence(research.evidence);
  
  // Generate report with citations
  const report = await generateReportWithCitations(
    research.findings,
    research.evidence
  );
  
  // Store report with citation links
  await storeReportWithCitations(report, evidenceIds);
  
  return report;
}
```

#### Step 2: Update Report UI to Show Citations
```tsx
// Add citation rendering to view-report.tsx
const renderCitation = (citationNumber: string) => {
  const citation = citations.find(c => c.number === citationNumber);
  return (
    <button
      onClick={() => setSelectedCitation(citation)}
      className="citation-link"
    >
      [{citationNumber}]
    </button>
  );
};
```

#### Step 3: Connect to Existing Flow
```typescript
// In scan request processing
if (scanType === 'deep') {
  // Use deep research report generator
  const report = await generateDeepResearchReport({
    company: request.company_name,
    domain: request.website_url,
    thesis: request.investment_thesis
  });
} else {
  // Use existing simple report
  const report = await generateBasicReport(request);
}
```

## Benefits

1. **Rich, Evidence-Based Content**: Every claim backed by real evidence
2. **Full Traceability**: Complete audit trail from source to claim
3. **Higher Quality**: No more generic "UNKNOWN" placeholders
4. **Investment-Ready**: Reports suitable for real investment decisions

## Example Output

Instead of:
```
Leadership Score: 7.5/10
Team Size: UNKNOWN
CEO: Unknown - Successfully raised $40M Series B
```

We get:
```
Leadership Score: 8.2/10
Team Size: 187 employees (45% engineering) [1]
CEO: Alex Kiely - Former Google Cloud executive who led the $40M Series B [2]

The leadership team demonstrates strong execution capability with 3 successful 
product launches in 2024 [3] and consistent quarterly growth of 35% [4].
```

## Next Steps

1. **Immediate**: Test the IntelligentResearchOrchestrator with a real company
2. **Short-term**: Create TypeScript wrapper for Python orchestrator
3. **Medium-term**: Port critical Python components to TypeScript
4. **Long-term**: Full integration with Jina AI for citation ranking