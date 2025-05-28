-- Update the CHECK constraint for evidence_items.type to include new types

-- First, drop the existing constraint if it exists
ALTER TABLE evidence_items
DROP CONSTRAINT IF EXISTS evidence_items_type_check;

-- Then, add the new constraint with all allowed types
ALTER TABLE evidence_items
ADD CONSTRAINT evidence_items_type_check CHECK (type IN (
    -- Existing types (keeping for safety, though some might be obsolete)
    'deepsearch_finding',
    'webpage_content', -- Original name
    'search_result',
    'api_response',
    'document',

    -- New types from evidence-collector-v7
    'website_content', -- Current name used by collector
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
    'vulnerability_scan'
)); 