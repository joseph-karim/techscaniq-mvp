/**
 * TechScanIQ v2 - Main Entry Point
 * 
 * This file exports all the key functionality of the TechScanIQ platform.
 */

// Export orchestrators
export { researchGraph, runResearch } from './orchestrator/graph';
export { marketAwareGraph, runMarketAwareResearch } from './orchestrator/marketAwareGraph';
export { formatAwareGraph, runFormatAwareResearch } from './orchestrator/formatAwareGraph';

// Export report formats and utilities
export {
  SALES_INTELLIGENCE_FORMAT,
  PE_DUE_DILIGENCE_FORMAT,
  getReportFormat,
  generateSectionPrompt,
  validateReportCompleteness,
  type ReportFormat,
  type ReportSectionConfig,
} from './prompts/report-formats';

// Export market context utilities
export {
  MarketContextService,
  type CompanyMarketSignals,
} from './services/marketContextService';

// Export types
export * from './types';

// Export tools
export { SonarDeepResearch } from './tools/sonarDeepResearch';

// Export services
export { VectorStoreService } from './services/vectorStore';

// Export config
export { config, models, thresholds } from './config';

// Export prompts
export { PROMPTS } from './prompts/structured-prompts';

// Re-export commonly used types for convenience
export type {
  Thesis,
  ResearchState,
  Evidence,
  ReportSection,
  MarketContext,
} from './types';