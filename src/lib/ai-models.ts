// AI Model Configuration
// Central configuration for all AI models used in the application

export const AI_MODELS = {
  // Primary Claude model for all analysis tasks
  CLAUDE_OPUS_4: 'claude-opus-4-20250514',
  
  // Google models for search and research
  GEMINI_2_FLASH: 'gemini-2.0-flash',
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  
  // Legacy models (for reference/comparison)
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20241022',
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  
  // Future models (placeholder)
  CLAUDE_OPUS_5: 'claude-opus-5-future',
} as const

export const MODEL_CAPABILITIES = {
  [AI_MODELS.CLAUDE_OPUS_4]: {
    name: 'Claude Opus 4',
    description: 'Latest flagship model with enhanced reasoning and analysis',
    maxTokens: 4096,
    contextWindow: 200000,
    strengths: [
      'Advanced reasoning and analysis',
      'Superior code understanding',
      'Enhanced factual accuracy',
      'Better structured output',
      'Improved technical knowledge'
    ],
    useCases: [
      'Investment analysis',
      'Technical due diligence', 
      'Complex research synthesis',
      'Code analysis',
      'Strategic recommendations'
    ],
    cost: 'premium',
    version: '4.0',
    provider: 'Anthropic'
  },
  [AI_MODELS.GEMINI_2_FLASH]: {
    name: 'Gemini 2.0 Flash',
    description: 'Ultra-fast model optimized for search and research tasks',
    maxTokens: 8192,
    contextWindow: 1000000,
    strengths: [
      'Real-time web search',
      'Fast information retrieval',
      'Multi-modal capabilities',
      'Excellent for research',
      'Cost effective'
    ],
    useCases: [
      'Web search and research',
      'Information gathering',
      'Real-time data analysis',
      'Competitive intelligence',
      'Market research'
    ],
    cost: 'low',
    version: '2.0',
    provider: 'Google'
  },
  [AI_MODELS.GEMINI_1_5_PRO]: {
    name: 'Gemini 1.5 Pro',
    description: 'Balanced model for complex reasoning with large context',
    maxTokens: 8192,
    contextWindow: 2000000,
    strengths: [
      'Large context window',
      'Strong reasoning',
      'Multi-modal support',
      'Good balance of speed/quality'
    ],
    useCases: [
      'Long document analysis',
      'Complex reasoning tasks',
      'Multi-modal analysis'
    ],
    cost: 'moderate',
    version: '1.5',
    provider: 'Google'
  },
  [AI_MODELS.CLAUDE_3_5_SONNET]: {
    name: 'Claude 3.5 Sonnet',
    description: 'Fast and capable model for general tasks',
    maxTokens: 4096,
    contextWindow: 200000,
    strengths: [
      'Fast response times',
      'Good general capability',
      'Cost effective'
    ],
    useCases: [
      'General analysis',
      'Content generation',
      'Basic research'
    ],
    cost: 'moderate',
    version: '3.5',
    provider: 'Anthropic'
  }
} as const

// Default model selection
export const DEFAULT_MODEL = AI_MODELS.CLAUDE_OPUS_4

// Model selection by task type
export const MODEL_BY_TASK = {
  // Core analysis tasks - use Claude Opus 4
  INVESTMENT_ANALYSIS: AI_MODELS.CLAUDE_OPUS_4,
  TECHNICAL_RESEARCH: AI_MODELS.CLAUDE_OPUS_4,
  EXECUTIVE_SUMMARY: AI_MODELS.CLAUDE_OPUS_4,
  EVIDENCE_ANALYSIS: AI_MODELS.CLAUDE_OPUS_4,
  CITATION_GENERATION: AI_MODELS.CLAUDE_OPUS_4,
  QUESTION_GENERATION: AI_MODELS.CLAUDE_OPUS_4,
  REPORT_SYNTHESIS: AI_MODELS.CLAUDE_OPUS_4,
  
  // Search and research tasks - use Gemini 2.0 Flash
  WEB_SEARCH: AI_MODELS.GEMINI_2_FLASH,
  COMPETITIVE_RESEARCH: AI_MODELS.GEMINI_2_FLASH,
  MARKET_RESEARCH: AI_MODELS.GEMINI_2_FLASH,
  REAL_TIME_DATA: AI_MODELS.GEMINI_2_FLASH,
  INFORMATION_GATHERING: AI_MODELS.GEMINI_2_FLASH,
  
  // Long context tasks - use Gemini 1.5 Pro
  DOCUMENT_ANALYSIS: AI_MODELS.GEMINI_1_5_PRO,
  MULTI_SOURCE_SYNTHESIS: AI_MODELS.GEMINI_1_5_PRO,
} as const

// Validate model configuration
export function validateModel(model: string): boolean {
  return Object.values(AI_MODELS).includes(model as any)
}

// Get model info
export function getModelInfo(model: string) {
  return MODEL_CAPABILITIES[model as keyof typeof MODEL_CAPABILITIES]
}

// Usage tracking
export interface ModelUsage {
  model: string
  task: string
  tokensUsed: number
  responseTime: number
  timestamp: Date
  success: boolean
}

export function trackModelUsage(usage: ModelUsage) {
  // In production, would send to analytics/monitoring
  console.log(`[ModelUsage] ${usage.model} - ${usage.task}: ${usage.tokensUsed} tokens in ${usage.responseTime}ms`)
}