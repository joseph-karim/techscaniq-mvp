import dotenv from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// For local development, load from .env.local if it exists
const envLocalPath = '/Users/josephkarim/techscaniq-mvp/.env.local';

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const configSchema = z.object({
  // API Keys
  OPENAI_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  GOOGLE_AI_API_KEY: z.string(),
  PERPLEXITY_API_KEY: z.string().optional(),
  
  // Database
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  
  // LangGraph/LangChain
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_ENDPOINT: z.string().url().optional(),
  LANGCHAIN_TRACING_V2: z.coerce.boolean().default(true),
  LANGCHAIN_PROJECT: z.string().default('techscaniq-v2'),
  
  // Server
  API_PORT: z.coerce.number().default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Research Configuration
  MAX_CONCURRENT_SEARCHES: z.coerce.number().default(5),
  EVIDENCE_QUALITY_THRESHOLD: z.coerce.number().default(0.7),
  MAX_RESEARCH_ITERATIONS: z.coerce.number().default(5),
  RESEARCH_TIMEOUT_MINUTES: z.coerce.number().default(120), // 2 hours default for comprehensive research
  MIN_EVIDENCE_COUNT: z.coerce.number().default(10),
  USE_QUEUES: z.coerce.boolean().default(true),
});

// Parse and validate environment variables
const parseConfig = () => {
  try {
    return configSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      LANGCHAIN_API_KEY: process.env.LANGGRAPH_API_KEY || process.env.LANGCHAIN_API_KEY,
      LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT,
      LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2,
      LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
      API_PORT: process.env.API_PORT,
      API_HOST: process.env.API_HOST,
      NODE_ENV: process.env.NODE_ENV,
      MAX_CONCURRENT_SEARCHES: process.env.MAX_CONCURRENT_SEARCHES,
      EVIDENCE_QUALITY_THRESHOLD: process.env.EVIDENCE_QUALITY_THRESHOLD,
      MAX_RESEARCH_ITERATIONS: process.env.MAX_RESEARCH_ITERATIONS,
      RESEARCH_TIMEOUT_MINUTES: process.env.RESEARCH_TIMEOUT_MINUTES,
      MIN_EVIDENCE_COUNT: process.env.MIN_EVIDENCE_COUNT,
      USE_QUEUES: process.env.USE_QUEUES,
    });
  } catch (error) {
    console.error('Configuration validation failed:', error);
    if (error instanceof z.ZodError) {
      console.error('Invalid configuration:', error.errors);
    }
    process.exit(1);
  }
};

export const config = {
  ...parseConfig(),
  // Add properties used in graph.ts
  QUALITY_THRESHOLD: parseConfig().EVIDENCE_QUALITY_THRESHOLD,
  MIN_EVIDENCE_COUNT: parseConfig().MIN_EVIDENCE_COUNT,
};

// Model configurations and assignments
export const ORCHESTRATOR_MODEL = 'claude-opus-4-20250514';
export const CONTENT_PARSER_MODEL = 'gemini-2.0-flash-exp';
export const QUALITY_EVALUATOR_MODEL = 'o3';
export const DEEP_ANALYZER_MODEL = 'o3-pro-2025-06-10';

export const models = {
  openai: {
    gpt4o: 'gpt-4o',
    gpt4oMini: 'gpt-4o-mini',
    o3: 'o3', // Reasoning model for citation review and scoring
    o3Pro: 'o3-pro-2025-06-10', // Deep analysis with extended thinking
  },
  anthropic: {
    claudeOpus4: 'claude-opus-4-20250514', // World's best coding model, 72.5% SWE-bench
    claudeSonnet4: 'claude-sonnet-4', // Hybrid model with instant + deep reasoning
    claude37Sonnet: 'claude-3.7-sonnet', // Still supported
  },
  google: {
    gemini25Pro: 'gemini-2.5-pro', // Latest flagship
    gemini15Flash: 'gemini-1.5-flash', // Efficient processing
    geminiFlash2: 'gemini-2.0-flash-exp', // Fast fetching and parsing
  },
  // Model assignments for different tasks
  orchestrator: {
    model: 'claude-opus-4-20250514',
    temperature: 0.3,
  },
  contentParser: {
    model: 'gemini-2.0-flash-exp',
    temperature: 0.1,
  },
  qualityEvaluator: {
    model: 'gpt-4o-mini', // Using gpt-4o-mini for quality evaluation
    temperature: 0.2,
  },
  deepAnalyzer: {
    model: 'o3-pro-2025-06-10',
    temperature: 0.5,
  },
  citationReviewer: {
    model: 'o3',
    temperature: 0.1,
  },
};

// Research thresholds
export const thresholds = {
  minEvidenceQuality: config.EVIDENCE_QUALITY_THRESHOLD,
  minSourceCredibility: 0.6,
  maxIterations: config.MAX_RESEARCH_ITERATIONS,
  minEvidencePerPillar: 3,
  targetEvidenceCount: 20,
};

// Timeouts
export const timeouts = {
  webSearch: 30000, // 30 seconds
  documentAnalysis: 60000, // 1 minute
  llmCall: 120000, // 2 minutes
  totalResearch: config.RESEARCH_TIMEOUT_MINUTES * 60 * 1000,
};