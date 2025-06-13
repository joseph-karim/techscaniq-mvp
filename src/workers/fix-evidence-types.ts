// Valid evidence types from database migration:
// 'webpage_content', 'business_search', 'technology_stack', 'security_analysis', 
// 'performance_metrics', 'ssl_analysis', 'vulnerability_scan', 'deep_crawl', 
// 'network_analysis', 'deepsearch_finding', 'search_result', 'api_response', 'document'

export function mapToValidEvidenceType(type: string): string {
  const typeMap: Record<string, string> = {
    // Map old types to valid database types
    'financial_info': 'business_search',
    'business_overview': 'business_search',
    'team_info': 'business_search',
    'market_analysis': 'business_search',
    'investment_analysis': 'business_search',
    'business_intelligence': 'business_search',
    
    'technical_analysis': 'technology_stack',
    'product_information': 'webpage_content',
    'webpage': 'webpage_content',
    
    'security_findings': 'security_analysis',
    'performance_data': 'performance_metrics',
    'ssl_info': 'ssl_analysis',
    'vulnerability': 'vulnerability_scan',
    'network_info': 'network_analysis',
    
    'search_finding': 'search_result',
    'api_data': 'api_response',
    'pdf': 'document',
    'doc': 'document',
    
    // Keep valid types as-is
    'webpage_content': 'webpage_content',
    'business_search': 'business_search',
    'technology_stack': 'technology_stack',
    'security_analysis': 'security_analysis',
    'performance_metrics': 'performance_metrics',
    'ssl_analysis': 'ssl_analysis',
    'vulnerability_scan': 'vulnerability_scan',
    'deep_crawl': 'deep_crawl',
    'network_analysis': 'network_analysis',
    'deepsearch_finding': 'deepsearch_finding',
    'search_result': 'search_result',
    'api_response': 'api_response',
    'document': 'document'
  };
  
  return typeMap[type] || 'webpage_content'; // Default to webpage_content if unknown
}

export function getEvidenceTypeFromContext(query: string, tool: string): string {
  // Based on the tool
  if (tool === 'playwright-crawler') return 'deep_crawl';
  if (tool === 'webtech-analyzer') return 'technology_stack';
  if (tool === 'security-scanner') return 'security_analysis';
  if (tool === 'skyvern-discovery') return 'deep_crawl';
  
  // Based on query content
  if (query) {
    if (query.includes('revenue') || query.includes('funding') || query.includes('financial')) {
      return 'business_search';
    }
    if (query.includes('technology') || query.includes('stack') || query.includes('tech')) {
      return 'technology_stack';
    }
    if (query.includes('security') || query.includes('vulnerab')) {
      return 'security_analysis';
    }
    if (query.includes('api') || query.includes('endpoint')) {
      return 'api_response';
    }
    if (query.includes('performance') || query.includes('speed') || query.includes('load')) {
      return 'performance_metrics';
    }
    if (query.includes('ssl') || query.includes('certificate')) {
      return 'ssl_analysis';
    }
    return 'search_result';
  }
  
  return 'webpage_content';
}