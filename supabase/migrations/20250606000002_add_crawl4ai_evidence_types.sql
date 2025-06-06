-- Add new evidence types for crawl4ai integration

-- Drop existing constraint
ALTER TABLE evidence_items
DROP CONSTRAINT IF EXISTS evidence_items_type_check;

-- Add new constraint with crawl4ai types
ALTER TABLE evidence_items
ADD CONSTRAINT evidence_items_type_check CHECK (type IN (
    -- Existing types
    'deepsearch_finding',
    'webpage_content',
    'search_result',
    'api_response',
    'document',
    'website_content',
    'business_overview',
    'deep_crawl',
    'technology_stack',
    'security_analysis',
    'ssl_analysis',
    'performance_metrics',
    'team_info',
    'market_analysis',
    'financial_info',
    'tech_deep_dive',
    'vulnerability_scan',
    
    -- New crawl4ai evidence types
    'technical_architecture',
    'api_documentation',
    'company_overview',
    'pricing_model',
    'security_compliance',
    'customer_evidence',
    'team_culture',
    'technology_stack_comprehensive',
    'business_intelligence',
    'infrastructure_analysis',
    'investment_analysis',
    'code_pattern_analysis',
    'financial_signal',
    'culture_analysis',
    'api_discovery',
    'api_endpoints',
    'html_snapshot',
    'general_information',
    'product_information'
));