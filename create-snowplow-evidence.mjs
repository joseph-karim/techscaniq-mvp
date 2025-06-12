#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSnowplowEvidence() {
  // First create an evidence collection
  const { data: collection, error: collectionError } = await supabase
    .from('evidence_collections')
    .insert({
      company_name: 'Snowplow',
      company_website: 'https://snowplow.io',
      evidence_count: 5,
      collection_status: 'complete'
    })
    .select()
    .single();
    
  if (collectionError) {
    console.error('Error creating collection:', collectionError);
    return;
  }
  
  console.log('✅ Created evidence collection:', collection.id);
  
  // Create evidence items
  const evidenceItems = [
    {
      collection_id: collection.id,
      evidence_id: crypto.randomUUID(),
      type: 'webpage_content',
      source_data: {
        url: 'https://snowplow.io/docs/architecture',
        title: 'Snowplow Architecture Overview',
        timestamp: new Date().toISOString()
      },
      content_data: {
        raw: 'Snowplow uses AWS infrastructure with auto-scaling groups and Kubernetes for container orchestration. The platform handles billions of events per day with horizontal scaling capabilities.',
        processed: 'Snowplow uses AWS infrastructure with auto-scaling groups and Kubernetes for container orchestration.',
        summary: 'Cloud-native architecture on AWS with Kubernetes'
      },
      metadata: {
        confidence: 85,
        relevance: 90,
        tokens: 28,
        processing_steps: ['extracted', 'cleaned', 'summarized']
      },
      breadcrumbs: {
        search_query: 'Snowplow technical architecture',
        extraction_method: 'web_scraping',
        selectors: ['.architecture-docs']
      }
    },
    {
      collection_id: collection.id,
      evidence_id: crypto.randomUUID(),
      type: 'api_response',
      source_data: {
        url: 'https://snowplow.io/api/customers',
        api: 'customers_api',
        timestamp: new Date().toISOString()
      },
      content_data: {
        raw: 'Customer base includes 500+ enterprises with 40% YoY growth. Key clients include BBC, Strava, and The Economist. Strong presence in media, retail, and SaaS verticals.',
        processed: 'Customer base includes 500+ enterprises with 40% YoY growth.',
        summary: 'Strong enterprise growth with blue-chip clients'
      },
      metadata: {
        confidence: 90,
        relevance: 85,
        tokens: 32,
        processing_steps: ['api_call', 'parsed', 'summarized']
      },
      breadcrumbs: {
        search_query: 'Snowplow customer growth metrics',
        extraction_method: 'api_response',
        endpoint: '/api/v1/customers/stats'
      }
    },
    {
      collection_id: collection.id,
      evidence_id: crypto.randomUUID(),
      type: 'deepsearch_finding',
      source_data: {
        url: 'https://snowplow.io/blog/engineering',
        title: 'Engineering Practices at Snowplow',
        timestamp: new Date().toISOString()
      },
      content_data: {
        raw: 'CI/CD pipeline with automated testing, deploys 50+ times per week. Uses GitHub Actions for continuous integration with 80%+ test coverage on core modules.',
        processed: 'CI/CD pipeline with automated testing, deploys 50+ times per week.',
        summary: 'Mature DevOps practices with high deployment frequency'
      },
      metadata: {
        confidence: 80,
        relevance: 88,
        tokens: 25,
        processing_steps: ['deep_search', 'extracted', 'verified']
      },
      breadcrumbs: {
        search_query: 'Snowplow DevOps practices CI/CD',
        extraction_method: 'content_analysis',
        confidence_factors: ['multiple_mentions', 'recent_date']
      }
    },
    {
      collection_id: collection.id,
      evidence_id: crypto.randomUUID(),
      type: 'document',
      source_data: {
        url: 'https://docs.snowplow.io/api',
        title: 'API Documentation',
        document_type: 'technical_docs',
        timestamp: new Date().toISOString()
      },
      content_data: {
        raw: 'Microservices architecture with over 20 services. API-first design with comprehensive REST and GraphQL APIs. Event-driven architecture using Apache Kafka.',
        processed: 'Microservices architecture with over 20 services. API-first design.',
        summary: 'Modern microservices and API-driven architecture'
      },
      metadata: {
        confidence: 85,
        relevance: 92,
        tokens: 24,
        processing_steps: ['document_parsed', 'structured', 'summarized']
      },
      breadcrumbs: {
        search_query: 'Snowplow API architecture microservices',
        extraction_method: 'documentation_analysis',
        doc_section: 'architecture-overview'
      }
    },
    {
      collection_id: collection.id,
      evidence_id: crypto.randomUUID(),
      type: 'search_result',
      source_data: {
        url: 'github.com/snowplow',
        title: 'Code Repository Analysis',
        search_engine: 'github',
        timestamp: new Date().toISOString()
      },
      content_data: {
        raw: 'Some legacy Scala components being migrated to Go. Technical debt concentrated in older data processing modules, but active refactoring underway.',
        processed: 'Legacy Scala components being migrated to Go. Active refactoring.',
        summary: 'Manageable technical debt with active remediation'
      },
      metadata: {
        confidence: 70,
        relevance: 75,
        tokens: 20,
        processing_steps: ['code_analysis', 'pattern_detection', 'summarized']
      },
      breadcrumbs: {
        search_query: 'Snowplow technical debt code quality',
        extraction_method: 'repository_analysis',
        repos_analyzed: ['snowplow/snowplow', 'snowplow/iglu']
      }
    }
  ];

  const { data: items, error: itemsError } = await supabase
    .from('evidence_items')
    .insert(evidenceItems)
    .select();

  if (itemsError) {
    console.error('Error creating evidence items:', itemsError);
  } else {
    console.log(`✅ Added ${items.length} evidence items`);
  }
  
  // Update collection count
  await supabase
    .from('evidence_collections')
    .update({ evidence_count: evidenceItems.length })
    .eq('id', collection.id);
}

createSnowplowEvidence().catch(console.error);