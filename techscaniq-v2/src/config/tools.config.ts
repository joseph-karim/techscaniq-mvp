export interface ToolConfig {
  enabled: boolean;
  timeout: number; // milliseconds
  maxRetries: number;
  concurrency?: number;
}

export interface ToolsConfiguration {
  webTechDetector: ToolConfig;
  technicalCollector: ToolConfig;
  apiDiscovery: ToolConfig;
  crawl4ai: ToolConfig;
  operatorAnalyzer: ToolConfig;
  documentAnalyzer: ToolConfig;
  webSearch: ToolConfig;
  skyvern: ToolConfig;
}

// Default configuration with conservative timeouts to prevent choke points
export const toolsConfig: ToolsConfiguration = {
  webTechDetector: {
    enabled: true,
    timeout: 30000, // 30 seconds
    maxRetries: 2,
  },
  
  technicalCollector: {
    enabled: true,
    timeout: 45000, // 45 seconds (SSL/DNS can be slow)
    maxRetries: 1,
  },
  
  apiDiscovery: {
    enabled: true,
    timeout: 30000, // 30 seconds
    maxRetries: 2,
  },
  
  crawl4ai: {
    enabled: process.env.ENABLE_CRAWL4AI === 'true', // Disabled by default until Python deps verified
    timeout: 300000, // 5 minutes (deep crawling takes time)
    maxRetries: 1,
    concurrency: 1, // Only one crawl4ai process at a time
  },
  
  operatorAnalyzer: {
    enabled: process.env.ENABLE_OPERATOR === 'true', // Disabled by default (resource intensive)
    timeout: 60000, // 1 minute
    maxRetries: 1,
    concurrency: 1, // Only one browser automation at a time
  },
  
  documentAnalyzer: {
    enabled: true,
    timeout: 30000, // 30 seconds
    maxRetries: 2,
  },
  
  webSearch: {
    enabled: true,
    timeout: 900000, // 15 minutes for Perplexity deep research
    maxRetries: 3,
    concurrency: 5, // Can handle multiple searches
  },
  
  skyvern: {
    enabled: process.env.SKYVERN_API_KEY ? true : false, // Only if API key present
    timeout: 300000, // 5 minutes
    maxRetries: 1,
    concurrency: 1,
  },
};

// Helper function to check if a tool is available
export function isToolAvailable(toolName: keyof ToolsConfiguration): boolean {
  const tool = toolsConfig[toolName];
  return tool ? tool.enabled : false;
}

// Helper function to get tool timeout
export function getToolTimeout(toolName: keyof ToolsConfiguration): number {
  const tool = toolsConfig[toolName];
  return tool ? tool.timeout : 30000; // Default 30 seconds
}