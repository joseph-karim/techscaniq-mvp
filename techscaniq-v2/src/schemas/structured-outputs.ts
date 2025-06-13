import { z } from 'zod';

// Structured output schemas for each model/node

export const ThesisInterpretationSchema = z.object({
  successFactors: z.array(z.string()).min(3).max(5),
  successCriteria: z.array(z.string()).min(3).max(7),
  riskFactors: z.array(z.string()).min(3).max(7),
  keyMetrics: z.array(z.object({
    name: z.string(),
    target: z.string(),
    importance: z.enum(['critical', 'high', 'medium']),
  })),
  researchPriorities: z.array(z.object({
    area: z.string(),
    rationale: z.string(),
    expectedEvidence: z.array(z.string()),
  })),
});

export const QueryGenerationSchema = z.object({
  queries: z.record(z.string(), z.array(z.object({
    query: z.string(),
    type: z.enum(['web', 'news', 'academic', 'social', 'technical']),
    priority: z.enum(['high', 'medium', 'low']),
    rationale: z.string(),
    expectedResults: z.array(z.string()),
    filters: z.object({
      dateRange: z.string().optional(),
      domains: z.array(z.string()).optional(),
      excludeDomains: z.array(z.string()).optional(),
    }).optional(),
  }))),
});

export const EvidenceAnalysisSchema = z.object({
  summary: z.string().max(500),
  keyPoints: z.array(z.string()).max(10),
  entities: z.object({
    companies: z.array(z.string()),
    people: z.array(z.string()),
    technologies: z.array(z.string()),
    metrics: z.array(z.object({
      name: z.string(),
      value: z.string(),
      context: z.string(),
    })),
  }),
  sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  relevantQuotes: z.array(z.object({
    text: z.string(),
    importance: z.number().min(0).max(1),
  })),
  investmentRelevance: z.number().min(0).max(1),
  contradictions: z.array(z.string()).optional(),
  supportingEvidence: z.array(z.string()).optional(),
});

export const QualityEvaluationSchema = z.object({
  relevance: z.number().min(0).max(1),
  credibility: z.number().min(0).max(1),
  recency: z.number().min(0).max(1),
  specificity: z.number().min(0).max(1),
  bias: z.number().min(0).max(1),
  reasoning: z.string(),
  missingInformation: z.array(z.string()).optional(),
  suggestedFollowUp: z.array(z.string()).optional(),
});

export const ReflectionAnalysisSchema = z.object({
  gaps: z.array(z.object({
    pillarId: z.string(),
    type: z.enum(['missing_data', 'insufficient_evidence', 'conflicting_info', 'needs_update']),
    description: z.string(),
    importance: z.enum(['critical', 'high', 'medium']),
    suggestedQueries: z.array(z.string()),
  })),
  insights: z.array(z.object({
    finding: z.string(),
    confidence: z.number().min(0).max(1),
    implications: z.array(z.string()),
  })),
  nextSteps: z.array(z.object({
    action: z.string(),
    priority: z.enum(['immediate', 'high', 'medium', 'low']),
    expectedOutcome: z.string(),
  })),
});

export const ReportSectionSchema = z.object({
  content: z.string(),
  keyFindings: z.array(z.string()),
  supportingData: z.array(z.object({
    fact: z.string(),
    source: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  risks: z.array(z.string()).optional(),
  opportunities: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  citations: z.array(z.object({
    id: z.number(),
    text: z.string(),
    source: z.string(),
    url: z.string(),
  })),
});

export const InvestmentRecommendationSchema = z.object({
  recommendation: z.enum(['STRONG_BUY', 'BUY', 'HOLD', 'PASS']),
  confidence: z.number().min(0).max(1),
  keyReasons: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
    weight: z.number().min(0).max(1),
  })),
  conditions: z.array(z.object({
    condition: z.string(),
    timeline: z.string(),
    importance: z.enum(['critical', 'high', 'medium', 'low']),
  })),
  dealConsiderations: z.array(z.object({
    aspect: z.string(),
    recommendation: z.string(),
    rationale: z.string(),
  })),
});

// Helper function to validate and parse structured outputs
export function parseStructuredOutput<T>(
  schema: z.ZodSchema<T>,
  output: string,
  fallback?: T
): T {
  try {
    // Try to extract JSON from the output
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in output');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return schema.parse(parsed);
  } catch (error) {
    console.error('Failed to parse structured output:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}