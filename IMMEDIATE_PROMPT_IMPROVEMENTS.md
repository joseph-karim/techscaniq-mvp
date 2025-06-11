# Immediate Prompt Engineering Improvements for TechScanIQ

Based on the generic meta-prompt structure from the guide, here's how we should restructure our analysis prompts immediately:

## Current Problem
Our prompts are asking for JSON output but not enforcing the structure rigorously enough, leading to:
- Plain text error responses instead of structured JSON
- Generic analysis lacking specific evidence citations
- Inconsistent output formats

## New Prompt Structure Template

### 1. Enhanced Technology Stack Analysis Prompt

```typescript
const ENHANCED_TECH_STACK_PROMPT = {
  systemPrompt: `You are a Senior Technical Due Diligence Analyst at a top-tier Private Equity firm specializing in software investments. You evaluate technology stacks with the rigor of a CTO planning a $100M+ acquisition. You ONLY make claims supported by the provided evidence and cite every technical assertion.`,
  
  taskDescription: `Analyze the provided evidence to generate a structured technical assessment. Extract specific technologies, evaluate architecture decisions, and identify technical risks/advantages. Every claim MUST be supported by evidence.`,
  
  inputContext: `
1. Company Name: {companyName}
2. Company Domain: {companyDomain}
3. Evidence Chunks: [Labeled passages from {evidenceCount} sources]
   Each chunk is marked as <chunk_X> where X is the citation number
4. Investment Context: {investmentThesis}`,
  
  methodology: `
CRITICAL RULES:
- Base ALL findings solely on the provided evidence chunks
- Cite specific chunk numbers [X] for every claim
- If evidence is insufficient for a standard analysis element, explicitly state "No evidence found"
- Do not use general knowledge or assumptions
- Each technical claim must quote or closely paraphrase the source

ANALYSIS FRAMEWORK:
1. Technology Identification: Extract all mentioned technologies from evidence
2. Architecture Assessment: Identify patterns only if explicitly described
3. Scalability Indicators: Look for performance metrics, infrastructure mentions
4. Technical Debt Signals: Outdated versions, migration mentions, tech complaints
5. Security Indicators: Certificates, compliance mentions, security tools`,
  
  outputFormat: `
Provide your ENTIRE output as a valid JSON object with NO other text:
{
  "summary": "Executive summary based on available evidence (200-300 words)",
  "evidenceQuality": {
    "totalChunks": {evidenceCount},
    "technicalChunks": "number of chunks with technical information",
    "confidence": "HIGH|MEDIUM|LOW based on evidence completeness"
  },
  "identifiedTechnologies": {
    "confirmed": [
      {
        "technology": "React",
        "category": "frontend",
        "evidence": "Mentioned in [3], [7]",
        "quote": "The application uses React for..."
      }
    ],
    "inferred": [
      {
        "technology": "Node.js",
        "category": "backend",
        "evidence": "Job posting in [12] seeks Node.js developers",
        "confidence": "MEDIUM"
      }
    ]
  },
  "architectureFindings": [
    {
      "finding": "Microservices architecture",
      "evidence": "[15], [23]",
      "quote": "Direct quote from evidence",
      "implication": "Supports horizontal scaling"
    }
  ],
  "technicalRisks": [
    {
      "risk": "Specific risk identified",
      "severity": "HIGH|MEDIUM|LOW",
      "evidence": "[chunk numbers]",
      "quote": "Supporting quote"
    }
  ],
  "dataGaps": [
    "No evidence found for database technology",
    "Infrastructure details not available in provided sources"
  ],
  "recommendedFollowUp": [
    "Request architecture documentation",
    "Conduct technical interviews with CTO"
  ]
}`
};
```

### 2. Enhanced Market Analysis Prompt

```typescript
const ENHANCED_MARKET_PROMPT = {
  systemPrompt: `You are a Senior Market Intelligence Analyst for PE investments. You construct market assessments based ONLY on verifiable evidence, never speculation. Every market claim requires a citation.`,
  
  taskDescription: `Analyze market position using ONLY the provided evidence. Identify market size indicators, competitive position, and growth signals. Do not infer beyond what evidence explicitly states.`,
  
  outputFormat: `
{
  "marketEvidence": {
    "explicitData": [
      {
        "metric": "Market size mentioned",
        "value": "$X billion",
        "source": "[chunk]",
        "quote": "Exact quote"
      }
    ],
    "competitorMentions": [
      {
        "competitor": "CompanyX",
        "context": "How they were mentioned",
        "source": "[chunk]"
      }
    ],
    "customerIndicators": [
      {
        "indicator": "Enterprise clients mentioned",
        "companies": ["Company1", "Company2"],
        "source": "[chunk]"
      }
    ]
  },
  "limitations": [
    "No TAM data found in evidence",
    "Growth rate not explicitly stated"
  ]
}`
};
```

### 3. Evidence Chunk Formatting

```typescript
const formatEvidenceForAnalysis = (evidence: Evidence[]): string => {
  return evidence.map((item, index) => {
    const chunkId = index + 1;
    return `
<chunk_${chunkId}>
Source: ${item.source_url}
Type: ${item.evidence_type}
Credibility: ${item.credibility_tier}
Date: ${item.extracted_date}
Content: ${item.content_data.processed || item.content_data.summary}
</chunk_${chunkId}>`;
  }).join('\n\n');
};
```

### 4. Prompt Construction

```typescript
const constructAnalysisPrompt = (
  promptTemplate: AnalysisPrompt,
  evidence: Evidence[],
  context: AnalysisContext
): string => {
  const formattedEvidence = formatEvidenceForAnalysis(evidence);
  
  return `
System: ${promptTemplate.systemPrompt}

# Task Description
${promptTemplate.taskDescription}

# Input Context
${promptTemplate.inputContext
  .replace('{companyName}', context.companyName)
  .replace('{evidenceCount}', evidence.length.toString())}

# Evidence to Analyze
${formattedEvidence}

# Methodology & Constraints
${promptTemplate.methodology}

# Output Format
${promptTemplate.outputFormat}

REMEMBER: Output ONLY the JSON object. No other text.`;
};
```

### 5. Response Validation

```typescript
const validateAndParseResponse = (response: string): AnalysisResult => {
  // Remove any non-JSON content
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      error: 'No valid JSON found in response',
      summary: 'Analysis failed - invalid format',
      dataGaps: ['Complete analysis unavailable due to formatting error']
    };
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.summary || !parsed.evidenceQuality) {
      return {
        ...parsed,
        error: 'Missing required fields',
        dataGaps: [...(parsed.dataGaps || []), 'Incomplete analysis structure']
      };
    }
    
    return parsed;
  } catch (error) {
    return {
      error: 'JSON parsing failed',
      summary: 'Analysis failed - parsing error',
      dataGaps: ['Complete analysis unavailable due to parsing error']
    };
  }
};
```

## Immediate Implementation Steps

1. **Update Analysis Prompts** (Today)
   - Replace current prompts with evidence-grounded versions
   - Add explicit citation requirements
   - Include data gap acknowledgment

2. **Implement Evidence Chunking** (Today)
   - Create 100-150 word chunks with clear labels
   - Add source metadata to each chunk
   - Number chunks for easy citation

3. **Add Response Validation** (Today)
   - Implement robust JSON extraction
   - Add fallback handling for errors
   - Ensure all sections have proper structure

4. **Test with Real Data** (Tomorrow)
   - Run 3 test reports with new prompts
   - Verify citation accuracy
   - Check for reduced hallucination

## Expected Improvements

1. **Citation Quality**: Every claim will have [chunk_number] citation
2. **Reduced Hallucination**: Model can only use provided evidence
3. **Transparent Gaps**: Explicitly states what evidence is missing
4. **Actionable Output**: Clear next steps for data collection

## Example Output Comparison

### Before (Generic/Hallucinated):
```json
{
  "summary": "The company uses modern technology stack with good scalability...",
  "primaryStack": {
    "frontend": ["React", "Vue.js"],
    "backend": ["Node.js", "Python"]
  }
}
```

### After (Evidence-Based):
```json
{
  "summary": "Based on 15 evidence chunks, identified React frontend [3,7] and AWS infrastructure [12]. Limited backend technology evidence available.",
  "identifiedTechnologies": {
    "confirmed": [
      {
        "technology": "React",
        "category": "frontend",
        "evidence": "[3], [7]",
        "quote": "built with React framework for responsive UI"
      }
    ]
  },
  "dataGaps": [
    "No evidence for backend programming languages",
    "Database technology not found in sources"
  ]
}
```

This approach ensures every piece of analysis is traceable to specific evidence, dramatically improving report quality and trustworthiness.