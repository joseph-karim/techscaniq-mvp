#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTestEvidence() {
  const scanId = '9f332d98-093e-4186-8e6d-c060728836b4';
  
  // First create an evidence collection
  const { data: collection, error: collectionError } = await supabase
    .from('evidence_collections')
    .insert({
      collection_name: 'Snowplow Technical Analysis',
      status: 'completed',
      metadata: {
        company: 'Snowplow',
        analysis_type: 'technical_due_diligence',
        created_for_scan: scanId
      }
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
      evidence_id: crypto.randomUUID(),
      collection_id: collection.id,
      evidence_type: 'technical_documentation',
      source_data: {
        url: 'https://snowplow.io/docs/architecture',
        title: 'Snowplow Architecture Overview'
      },
      content_data: {
        text: 'Snowplow uses AWS infrastructure with auto-scaling groups and Kubernetes for container orchestration. The platform handles billions of events per day with horizontal scaling capabilities.',
        summary: 'Cloud-native architecture on AWS with Kubernetes'
      },
      confidence_score: 0.85,
      metadata: { 
        source: 'architecture_docs', 
        extracted_at: new Date().toISOString()
      }
    },
    {
      evidence_id: crypto.randomUUID(),
      collection_id: collection.id,
      evidence_type: 'market_analysis',
      source_data: {
        url: 'https://snowplow.io/customers',
        title: 'Customer Case Studies'
      },
      content_data: {
        text: 'Customer base includes 500+ enterprises with 40% YoY growth. Key clients include BBC, Strava, and The Economist. Strong presence in media, retail, and SaaS verticals.',
        summary: 'Strong enterprise growth with blue-chip clients'
      },
      confidence_score: 0.90,
      metadata: { 
        source: 'investor_materials',
        extracted_at: new Date().toISOString()
      }
    },
    {
      evidence_id: crypto.randomUUID(),
      collection_id: collection.id,
      evidence_type: 'technical_blog',
      source_data: {
        url: 'https://snowplow.io/blog/engineering',
        title: 'Engineering Practices at Snowplow'
      },
      content_data: {
        text: 'CI/CD pipeline with automated testing, deploys 50+ times per week. Uses GitHub Actions for continuous integration with 80%+ test coverage on core modules.',
        summary: 'Mature DevOps practices with high deployment frequency'
      },
      confidence_score: 0.80,
      metadata: { 
        source: 'engineering_blog',
        extracted_at: new Date().toISOString()
      }
    },
    {
      evidence_id: crypto.randomUUID(),
      collection_id: collection.id,
      evidence_type: 'api_documentation',
      source_data: {
        url: 'https://docs.snowplow.io/api',
        title: 'API Documentation'
      },
      content_data: {
        text: 'Microservices architecture with over 20 services. API-first design with comprehensive REST and GraphQL APIs. Event-driven architecture using Apache Kafka.',
        summary: 'Modern microservices and API-driven architecture'
      },
      confidence_score: 0.85,
      metadata: { 
        source: 'technical_documentation',
        extracted_at: new Date().toISOString()
      }
    },
    {
      evidence_id: crypto.randomUUID(),
      collection_id: collection.id,
      evidence_type: 'code_analysis',
      source_data: {
        url: 'github.com/snowplow',
        title: 'Code Repository Analysis'
      },
      content_data: {
        text: 'Some legacy Scala components being migrated to Go. Technical debt concentrated in older data processing modules, but active refactoring underway.',
        summary: 'Manageable technical debt with active remediation'
      },
      confidence_score: 0.70,
      metadata: { 
        source: 'code_analysis',
        extracted_at: new Date().toISOString()
      }
    }
  ];

  const { error: itemsError } = await supabase
    .from('evidence_items')
    .insert(evidenceItems);

  if (itemsError) {
    console.error('Error creating evidence items:', itemsError);
  } else {
    console.log(`✅ Added ${evidenceItems.length} evidence items`);
  }
  
  // Now update the worker to use this structure
  console.log('\nTo fix the worker, it needs to:');
  console.log('1. Query evidence_collections with metadata containing scan_request_id');
  console.log('2. Then query evidence_items by collection_id');
  console.log('3. Transform the data to match expected format');
}

addTestEvidence().catch(console.error);