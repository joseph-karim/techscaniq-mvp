import { InvestmentThesis } from '@/types';

export interface EvidenceItem {
  id: string;
  type: string;
  category: string;
  content: string;
  source: string;
  confidence: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface EvidenceStrength {
  source: {
    type: 'primary' | 'secondary' | 'tertiary';
    credibility: number; // 0-1
    recency: number; // 0-1 based on age
  };
  corroboration: {
    supportingEvidence: number;
    conflictingEvidence: number;
    netConfidence: number; // 0-1
  };
  specificity: {
    dataPoints: number;
    quantitative: boolean;
    verifiable: boolean;
  };
}

export interface ThesisCriterion {
  criterion: string;
  weight: number; // 0-100, must sum to 100
  rawScore: number; // 0-100
  weightedScore: number;
  evidenceCount: number;
  confidenceLevel: number; // 0-1
}

export interface ThesisScore {
  overallScore: number; // 0-100
  criteriaBreakdown: ThesisCriterion[];
  thesisType: InvestmentThesis;
  alignment: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface DimensionScores {
  technicalScore: number;
  businessScore: number;
  marketScore: number;
  teamScore: number;
  financialScore: number;
}

export interface DimensionConfidences {
  technicalConfidence: number;
  businessConfidence: number;
  marketConfidence: number;
  teamConfidence: number;
  financialConfidence: number;
}

export interface ComprehensiveScore extends DimensionScores, DimensionConfidences {
  thesisScore: number;
  thesisConfidence: number;
  weightedScore: number;
  confidenceAdjustedScore: number;
  finalGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  investmentRecommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Pass';
  confidenceBreakdown: {
    overallConfidence: number;
    evidenceQuality: number;
    evidenceCoverage: number;
    missingCriticalEvidence: string[];
    penaltyApplied: number;
    confidenceReduction?: number;
  };
}

export interface EvidenceQualityScore {
  relevance: number;
  specificity: number;
  verifiability: number;
  recency: number;
  credibility: number;
  overallQuality: number;
}

// Critical TECH-FOCUSED evidence requirements
export const CRITICAL_EVIDENCE_REQUIREMENTS = {
  technical: {
    core: ['tech_stack', 'architecture_design', 'api_structure'],
    infrastructure: ['cloud_platform', 'deployment_model', 'scalability_approach'],
    engineering: ['dev_practices', 'ci_cd_pipeline', 'monitoring_tools'],
    security: ['security_posture', 'data_protection', 'compliance_standards']
  },
  product: {
    features: ['core_capabilities', 'unique_features', 'api_offerings'],
    integration: ['integration_ecosystem', 'webhook_support', 'sdk_availability'],
    performance: ['response_times', 'uptime_sla', 'throughput_metrics']
  },
  competitive: {
    differentiation: ['tech_advantages', 'feature_comparison', 'innovation_pipeline'],
    positioning: ['market_segment', 'technical_moat', 'platform_effects']
  }
};

// Tech-focused thesis weight configurations
export const THESIS_WEIGHTS: Record<string, Record<keyof DimensionScores, number>> = {
  'Accelerate Organic Growth': {
    technicalScore: 0.40,    // Tech platform scalability is key
    businessScore: 0.20,     // Product-market fit
    marketScore: 0.25,       // Competitive tech advantages
    teamScore: 0.10,         // Engineering capability
    financialScore: 0.05     // Less focus on financials
  },
  'Buy-and-Build / Roll-Up': {
    technicalScore: 0.45,    // Integration capability is critical
    businessScore: 0.15,     
    marketScore: 0.20,       // Tech consolidation opportunities
    teamScore: 0.15,         // Technical leadership
    financialScore: 0.05
  },
  'Margin Expansion / Cost-Out': {
    technicalScore: 0.35,    // Tech efficiency and automation
    businessScore: 0.25,     // Operational improvements
    marketScore: 0.15,
    teamScore: 0.15,
    financialScore: 0.10     // Cost structure optimization
  },
  'Turnaround / Distressed': {
    technicalScore: 0.30,    // Tech debt assessment
    businessScore: 0.20,
    marketScore: 0.20,
    teamScore: 0.25,         // Can team fix tech issues?
    financialScore: 0.05
  },
  'Digital Transformation': {
    technicalScore: 0.50,    // Technology is the core focus
    businessScore: 0.20,     // Digital capabilities
    marketScore: 0.15,       // Tech disruption potential
    teamScore: 0.15,         // Tech transformation skills
    financialScore: 0.00     // Not financial-focused
  }
};

export class ComprehensiveScoringService {
  private readonly EXPECTED_EVIDENCE_COUNT = 200;
  private readonly MAX_EVIDENCE_AGE_DAYS = 365;

  calculateComprehensiveScore(
    evidence: EvidenceItem[],
    thesis: InvestmentThesis
  ): ComprehensiveScore {
    // Step 1: Calculate dimension scores
    const dimensions = this.calculateDimensionScores(evidence);
    
    // Step 2: Calculate confidence for each dimension
    const confidences = this.calculateDimensionConfidences(evidence);
    
    // Step 3: Apply thesis-specific weights
    const thesisWeights = THESIS_WEIGHTS[thesis.type] || THESIS_WEIGHTS['Accelerate Organic Growth'];
    const weightedScore = this.calculateWeightedScore(dimensions, thesisWeights);
    
    // Step 4: Calculate overall confidence (including impact of missing evidence)
    const { penalty: confidenceReduction, missingEvidence } = this.calculateAbsenceOfEvidencePenalty(evidence);
    const baseConfidence = this.calculateOverallConfidence(confidences, evidence);
    const overallConfidence = baseConfidence * (1 - confidenceReduction); // Missing evidence reduces confidence, not score
    
    // Final score calculation - based only on available evidence
    const confidenceAdjustedScore = weightedScore; // No penalty on the score itself
    
    return {
      ...dimensions,
      ...confidences,
      thesisScore: weightedScore,
      thesisConfidence: overallConfidence,
      weightedScore,
      confidenceAdjustedScore,
      finalGrade: this.scoreToGrade(confidenceAdjustedScore),
      investmentRecommendation: this.scoreToRecommendation(confidenceAdjustedScore, thesis),
      confidenceBreakdown: {
        overallConfidence: Math.round(overallConfidence * 100),
        evidenceQuality: this.calculateAverageQuality(evidence),
        evidenceCoverage: Math.min(evidence.length / this.EXPECTED_EVIDENCE_COUNT, 1),
        missingCriticalEvidence: missingEvidence,
        penaltyApplied: 0, // No penalty on score
        confidenceReduction: confidenceReduction // Shows impact on confidence
      }
    };
  }

  private calculateDimensionScores(evidence: EvidenceItem[]): DimensionScores {
    const technical = evidence.filter(e => e.category === 'technical');
    const business = evidence.filter(e => e.category === 'business');
    const market = evidence.filter(e => e.category === 'market');
    const team = evidence.filter(e => e.category === 'team');
    const financial = evidence.filter(e => e.category === 'financial');

    return {
      technicalScore: this.scoreDimension(technical, 'technical'),
      businessScore: this.scoreDimension(business, 'business'),
      marketScore: this.scoreDimension(market, 'market'),
      teamScore: this.scoreDimension(team, 'team'),
      financialScore: this.scoreDimension(financial, 'financial')
    };
  }

  private calculateDimensionConfidences(evidence: EvidenceItem[]): DimensionConfidences {
    const technical = evidence.filter(e => e.category === 'technical');
    const business = evidence.filter(e => e.category === 'business');
    const market = evidence.filter(e => e.category === 'market');
    const team = evidence.filter(e => e.category === 'team');
    const financial = evidence.filter(e => e.category === 'financial');

    return {
      technicalConfidence: this.calculateCategoryConfidence(technical, 'technical'),
      businessConfidence: this.calculateCategoryConfidence(business, 'business'),
      marketConfidence: this.calculateCategoryConfidence(market, 'market'),
      teamConfidence: this.calculateCategoryConfidence(team, 'team'),
      financialConfidence: this.calculateCategoryConfidence(financial, 'financial')
    };
  }

  private scoreDimension(evidence: EvidenceItem[], category: string): number {
    if (evidence.length === 0) return 0;

    // Base score from evidence analysis
    const baseScore = this.analyzeEvidenceForScore(evidence, category);
    
    // Quality adjustment
    const qualityMultiplier = evidence.reduce((sum, e) => sum + (e.confidence || 0.5), 0) / evidence.length;
    
    return Math.round(baseScore * qualityMultiplier);
  }

  private analyzeEvidenceForScore(evidence: EvidenceItem[], category: string): number {
    // This would be enhanced with AI analysis in production
    // For now, using a simplified scoring based on evidence patterns
    
    const positiveSignals = evidence.filter(e => 
      e.content.toLowerCase().includes('strong') ||
      e.content.toLowerCase().includes('excellent') ||
      e.content.toLowerCase().includes('growing') ||
      e.content.toLowerCase().includes('innovative')
    ).length;

    const negativeSignals = evidence.filter(e =>
      e.content.toLowerCase().includes('weak') ||
      e.content.toLowerCase().includes('poor') ||
      e.content.toLowerCase().includes('declining') ||
      e.content.toLowerCase().includes('outdated')
    ).length;

    const neutralCount = evidence.length - positiveSignals - negativeSignals;
    
    // Calculate base score (0-100)
    const positiveWeight = 1.0;
    const neutralWeight = 0.6;
    const negativeWeight = -0.5;
    
    const weightedSum = (positiveSignals * positiveWeight) + 
                       (neutralCount * neutralWeight) + 
                       (negativeSignals * negativeWeight);
    
    const maxPossible = evidence.length * positiveWeight;
    const normalizedScore = Math.max(0, Math.min(100, (weightedSum / maxPossible) * 100));
    
    return normalizedScore;
  }

  private calculateCategoryConfidence(evidence: EvidenceItem[], category: string): number {
    if (evidence.length === 0) return 0;

    const factors = {
      quantity: Math.min(evidence.length / (this.EXPECTED_EVIDENCE_COUNT / 5), 1),
      quality: this.calculateAverageQuality(evidence),
      coverage: this.calculateTopicCoverage(evidence, category),
      recency: this.calculateRecencyScore(evidence),
      consistency: this.calculateConsistencyScore(evidence)
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

  private calculateAverageQuality(evidence: EvidenceItem[]): number {
    if (evidence.length === 0) return 0;
    return evidence.reduce((sum, e) => sum + (e.confidence || 0.5), 0) / evidence.length;
  }

  private calculateTopicCoverage(evidence: EvidenceItem[], category: string): number {
    const requiredTopics = Object.values(CRITICAL_EVIDENCE_REQUIREMENTS[category as keyof typeof CRITICAL_EVIDENCE_REQUIREMENTS] || {}).flat();
    const coveredTopics = new Set(evidence.map(e => e.type));
    
    if (requiredTopics.length === 0) return 1;
    
    const coverage = requiredTopics.filter(topic => coveredTopics.has(topic)).length / requiredTopics.length;
    return coverage;
  }

  private calculateRecencyScore(evidence: EvidenceItem[]): number {
    if (evidence.length === 0) return 0;
    
    const now = Date.now();
    const scores = evidence.map(e => {
      const age = (now - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24); // days
      return Math.max(0, 1 - (age / this.MAX_EVIDENCE_AGE_DAYS));
    });
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private calculateConsistencyScore(evidence: EvidenceItem[]): number {
    // Simplified consistency check - in production would use NLP
    // to detect conflicting evidence
    return 0.85; // Default high consistency
  }

  private calculateWeightedScore(
    dimensions: DimensionScores,
    weights: Record<keyof DimensionScores, number>
  ): number {
    return Math.round(
      dimensions.technicalScore * weights.technicalScore +
      dimensions.businessScore * weights.businessScore +
      dimensions.marketScore * weights.marketScore +
      dimensions.teamScore * weights.teamScore +
      dimensions.financialScore * weights.financialScore
    );
  }

  private calculateOverallConfidence(
    confidences: DimensionConfidences,
    evidence: EvidenceItem[]
  ): number {
    const avgConfidence = (
      confidences.technicalConfidence +
      confidences.businessConfidence +
      confidences.marketConfidence +
      confidences.teamConfidence +
      confidences.financialConfidence
    ) / 5;

    // Additional confidence factors
    const evidenceCountFactor = Math.min(evidence.length / this.EXPECTED_EVIDENCE_COUNT, 1);
    const qualityFactor = this.calculateAverageQuality(evidence);
    
    // Weighted overall confidence
    return avgConfidence * 0.6 + evidenceCountFactor * 0.2 + qualityFactor * 0.2;
  }

  private calculateAbsenceOfEvidencePenalty(
    evidence: EvidenceItem[]
  ): { penalty: number; missingEvidence: string[] } {
    const allRequired = Object.values(CRITICAL_EVIDENCE_REQUIREMENTS).flatMap(category => 
      Object.values(category).flat()
    );
    
    const collectedTypes = new Set(evidence.map(e => e.type));
    const missingCritical = allRequired.filter(req => !collectedTypes.has(req));
    
    // Exponential penalty for missing critical evidence
    const penaltyRate = 0.1; // 10% per missing critical item
    const penalty = Math.min(missingCritical.length * penaltyRate, 0.5); // Max 50% penalty
    
    return {
      penalty,
      missingEvidence: missingCritical
    };
  }

  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  private scoreToRecommendation(
    score: number,
    thesis: InvestmentThesis
  ): 'Strong Buy' | 'Buy' | 'Hold' | 'Pass' {
    if (score >= 80) return 'Strong Buy';
    if (score >= 65) return 'Buy';
    if (score >= 50) return 'Hold';
    return 'Pass';
  }

  scoreEvidenceQuality(evidence: EvidenceItem): EvidenceQualityScore {
    const scores = {
      relevance: this.scoreRelevance(evidence),
      specificity: this.scoreSpecificity(evidence),
      verifiability: this.scoreVerifiability(evidence),
      recency: this.scoreRecency(evidence),
      credibility: this.scoreCredibility(evidence)
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

  private scoreRelevance(evidence: EvidenceItem): number {
    // Check if evidence contains investment-relevant keywords
    const relevantKeywords = [
      'revenue', 'growth', 'customer', 'market', 'technology',
      'team', 'funding', 'competitive', 'scalability', 'security'
    ];
    
    const content = evidence.content.toLowerCase();
    const keywordMatches = relevantKeywords.filter(kw => content.includes(kw)).length;
    
    return Math.min(keywordMatches / 3, 1); // Max out at 3 keyword matches
  }

  private scoreSpecificity(evidence: EvidenceItem): number {
    // Check for specific numbers, dates, names
    const hasNumbers = /\d+/.test(evidence.content);
    const hasPercentages = /%/.test(evidence.content);
    const hasCurrency = /\$|€|£/.test(evidence.content);
    const hasProperNouns = /[A-Z][a-z]+/.test(evidence.content);
    
    const specificityScore = [hasNumbers, hasPercentages, hasCurrency, hasProperNouns]
      .filter(Boolean).length / 4;
    
    return specificityScore;
  }

  private scoreVerifiability(evidence: EvidenceItem): number {
    // Primary sources are most verifiable
    if (evidence.source.includes('official') || evidence.source.includes('company')) return 1.0;
    if (evidence.source.includes('linkedin') || evidence.source.includes('github')) return 0.8;
    if (evidence.source.includes('news') || evidence.source.includes('press')) return 0.6;
    return 0.4;
  }

  private scoreRecency(evidence: EvidenceItem): number {
    const age = (Date.now() - new Date(evidence.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    if (age < 30) return 1.0;
    if (age < 90) return 0.8;
    if (age < 180) return 0.6;
    if (age < 365) return 0.4;
    return 0.2;
  }

  private scoreCredibility(evidence: EvidenceItem): number {
    // Score based on source type
    if (evidence.source.includes('.gov') || evidence.source.includes('.edu')) return 1.0;
    if (evidence.source.includes('linkedin.com') || evidence.source.includes('github.com')) return 0.9;
    if (evidence.source.includes('techcrunch') || evidence.source.includes('forbes')) return 0.8;
    if (evidence.metadata?.verified) return 0.9;
    return 0.6;
  }
}