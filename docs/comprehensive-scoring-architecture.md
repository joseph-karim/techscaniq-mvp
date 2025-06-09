# Comprehensive Scoring Architecture

## Overview

This document outlines the comprehensive scoring system for TechScanIQ that combines:
1. Investment thesis fit scoring
2. Evidence-based confidence ratings
3. Absence of evidence penalty system
4. Multi-dimensional assessment framework

## Core Scoring Components

### 1. Investment Thesis Alignment Score (0-100)

Each investment thesis has specific weighted criteria that must be evaluated:

```typescript
interface ThesisScore {
  overallScore: number; // 0-100
  criteriaBreakdown: {
    criterion: string;
    weight: number; // 0-100, must sum to 100
    rawScore: number; // 0-100
    weightedScore: number; // rawScore * weight / 100
    evidenceCount: number;
    confidenceLevel: number; // 0-1
  }[];
  thesisType: InvestmentThesis;
  alignment: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}
```

### 2. Evidence Confidence Rating System

#### Evidence Strength Factors

```typescript
interface EvidenceStrength {
  source: {
    type: 'primary' | 'secondary' | 'tertiary';
    credibility: number; // 0-1
    recency: number; // 0-1 based on age
  };
  corroboration: {
    supportingEvidence: number; // count
    conflictingEvidence: number; // count
    netConfidence: number; // 0-1
  };
  specificity: {
    dataPoints: number;
    quantitative: boolean;
    verifiable: boolean;
  };
}
```

#### Confidence Calculation

```typescript
function calculateEvidenceConfidence(evidence: Evidence[]): number {
  const factors = {
    quantity: Math.min(evidence.length / EXPECTED_EVIDENCE_COUNT, 1),
    quality: calculateAverageQuality(evidence),
    coverage: calculateTopicCoverage(evidence),
    recency: calculateRecencyScore(evidence),
    consistency: calculateConsistencyScore(evidence)
  };
  
  // Weighted confidence score
  return (
    factors.quantity * 0.2 +
    factors.quality * 0.3 +
    factors.coverage * 0.2 +
    factors.recency * 0.15 +
    factors.consistency * 0.15
  );
}
```

### 3. Absence of Evidence Penalty System

#### Critical Evidence Requirements by Category

```typescript
const CRITICAL_EVIDENCE_REQUIREMENTS = {
  technical: {
    architecture: ['tech_stack', 'infrastructure', 'scalability'],
    security: ['security_headers', 'ssl_config', 'vulnerability_scan'],
    performance: ['load_times', 'uptime', 'response_metrics'],
    codeQuality: ['github_metrics', 'ci_cd', 'test_coverage']
  },
  business: {
    team: ['leadership_profiles', 'team_size', 'key_hires'],
    market: ['market_size', 'competitors', 'positioning'],
    customers: ['customer_count', 'case_studies', 'testimonials'],
    growth: ['revenue_growth', 'user_growth', 'market_share']
  },
  financial: {
    revenue: ['revenue_model', 'pricing', 'mrr_arr'],
    funding: ['funding_history', 'investors', 'valuation'],
    metrics: ['burn_rate', 'runway', 'unit_economics']
  }
};
```

#### Penalty Calculation

```typescript
function calculateAbsenceOfEvidencePenalty(
  requiredEvidence: string[],
  collectedEvidence: Evidence[]
): number {
  const missingCritical = requiredEvidence.filter(req => 
    !collectedEvidence.some(e => e.type === req)
  );
  
  // Exponential penalty for missing critical evidence
  const penaltyRate = 0.1; // 10% per missing critical item
  const penalty = Math.min(missingCritical.length * penaltyRate, 0.5); // Max 50% penalty
  
  return penalty;
}
```

### 4. Comprehensive Scoring Formula

```typescript
interface ComprehensiveScore {
  // Raw scores (0-100)
  technicalScore: number;
  businessScore: number;
  marketScore: number;
  teamScore: number;
  financialScore: number;
  
  // Confidence ratings (0-1)
  technicalConfidence: number;
  businessConfidence: number;
  marketConfidence: number;
  teamConfidence: number;
  financialConfidence: number;
  
  // Thesis alignment
  thesisScore: number; // 0-100
  thesisConfidence: number; // 0-1
  
  // Final calculations
  weightedScore: number; // 0-100
  confidenceAdjustedScore: number; // 0-100
  finalGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  investmentRecommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Pass';
}
```

#### Score Calculation Algorithm

```typescript
function calculateComprehensiveScore(
  evidence: Evidence[],
  thesis: InvestmentThesis
): ComprehensiveScore {
  // Step 1: Calculate dimension scores
  const dimensions = calculateDimensionScores(evidence);
  
  // Step 2: Calculate confidence for each dimension
  const confidences = calculateDimensionConfidences(evidence);
  
  // Step 3: Apply thesis-specific weights
  const thesisWeights = getThesisWeights(thesis);
  const weightedScore = calculateWeightedScore(dimensions, thesisWeights);
  
  // Step 4: Apply confidence adjustment
  const overallConfidence = calculateOverallConfidence(confidences, evidence);
  const confidenceMultiplier = 0.5 + (overallConfidence * 0.5); // 50-100% range
  
  // Step 5: Apply absence of evidence penalties
  const penalty = calculateAbsenceOfEvidencePenalty(
    CRITICAL_EVIDENCE_REQUIREMENTS,
    evidence
  );
  
  // Final score calculation
  const confidenceAdjustedScore = weightedScore * confidenceMultiplier * (1 - penalty);
  
  return {
    ...dimensions,
    ...confidences,
    thesisScore: weightedScore,
    thesisConfidence: overallConfidence,
    weightedScore,
    confidenceAdjustedScore,
    finalGrade: scoreToGrade(confidenceAdjustedScore),
    investmentRecommendation: scoreToRecommendation(confidenceAdjustedScore, thesis)
  };
}
```

### 5. Evidence Quality Scoring

```typescript
interface EvidenceQualityScore {
  relevance: number; // 0-1, how relevant to investment thesis
  specificity: number; // 0-1, how specific vs generic
  verifiability: number; // 0-1, can be independently verified
  recency: number; // 0-1, based on age of evidence
  credibility: number; // 0-1, source credibility
  
  overallQuality: number; // 0-1, weighted average
}

function scoreEvidenceQuality(evidence: Evidence): EvidenceQualityScore {
  const scores = {
    relevance: scoreRelevance(evidence),
    specificity: scoreSpecificity(evidence),
    verifiability: scoreVerifiability(evidence),
    recency: scoreRecency(evidence),
    credibility: scoreCredibility(evidence)
  };
  
  // Weighted quality score
  const overallQuality = (
    scores.relevance * 0.3 +
    scores.specificity * 0.2 +
    scores.verifiability * 0.2 +
    scores.recency * 0.15 +
    scores.credibility * 0.15
  );
  
  return { ...scores, overallQuality };
}
```

### 6. Confidence Visualization

```typescript
interface ConfidenceVisualization {
  overallConfidence: {
    score: number; // 0-100
    level: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Very Low';
    color: string; // For UI display
  };
  dimensionConfidence: {
    dimension: string;
    confidence: number;
    evidenceCount: number;
    missingCritical: string[];
  }[];
  confidenceFactors: {
    factor: string;
    impact: 'Positive' | 'Negative';
    magnitude: number; // -1 to 1
    explanation: string;
  }[];
}
```

## Implementation Strategy

### Phase 1: Evidence Quality Scoring
1. Implement evidence quality scoring functions
2. Add quality scores to evidence storage
3. Create quality visualization components

### Phase 2: Confidence Rating System
1. Implement confidence calculation algorithms
2. Add confidence ratings to all scores
3. Create confidence visualization UI

### Phase 3: Absence of Evidence Handling
1. Define critical evidence requirements per thesis
2. Implement penalty calculation system
3. Add missing evidence alerts to UI

### Phase 4: Comprehensive Score Integration
1. Integrate all scoring components
2. Update report generation with new scores
3. Add score explanation narratives

### Phase 5: Testing and Validation
1. Test with real company data
2. Validate scores against PE expert assessments
3. Fine-tune weights and thresholds

## Score Interpretation Guide

### Grade Mapping
- **A (85-100)**: Exceptional opportunity, strong evidence, high confidence
- **B (70-84)**: Good opportunity, solid evidence, moderate-high confidence
- **C (55-69)**: Fair opportunity, adequate evidence, moderate confidence
- **D (40-54)**: Weak opportunity, limited evidence, low confidence
- **F (0-39)**: Poor opportunity, insufficient evidence, very low confidence

### Investment Recommendations
- **Strong Buy**: Score 80+, Confidence 80%+, Thesis alignment "Excellent"
- **Buy**: Score 65+, Confidence 70%+, Thesis alignment "Good"
- **Hold**: Score 50+, Confidence 60%+, Thesis alignment "Fair"
- **Pass**: Score <50 or Confidence <60% or Thesis alignment "Poor"

### Confidence Levels
- **Very High (90-100%)**: Abundant high-quality evidence across all dimensions
- **High (75-89%)**: Strong evidence coverage with minor gaps
- **Moderate (60-74%)**: Reasonable evidence but some important gaps
- **Low (40-59%)**: Significant evidence gaps affecting reliability
- **Very Low (<40%)**: Insufficient evidence for reliable assessment

## Example Scoring Output

```json
{
  "comprehensiveScore": {
    "technicalScore": 75,
    "technicalConfidence": 0.85,
    "businessScore": 68,
    "businessConfidence": 0.72,
    "marketScore": 82,
    "marketConfidence": 0.78,
    "teamScore": 71,
    "teamConfidence": 0.65,
    "financialScore": 64,
    "financialConfidence": 0.55,
    
    "thesisScore": 73,
    "thesisConfidence": 0.71,
    
    "weightedScore": 73,
    "confidenceAdjustedScore": 62,
    "finalGrade": "C",
    "investmentRecommendation": "Hold",
    
    "confidenceBreakdown": {
      "overallConfidence": 71,
      "evidenceQuality": 0.75,
      "evidenceCoverage": 0.68,
      "missingCriticalEvidence": [
        "test_coverage",
        "unit_economics",
        "customer_churn"
      ],
      "penaltyApplied": 0.15
    }
  }
}
```

## Next Steps

1. Implement core scoring algorithms in TypeScript
2. Update evidence collection to include quality metrics
3. Modify report generation to use new scoring system
4. Create confidence visualization components
5. Add missing evidence alerts and recommendations