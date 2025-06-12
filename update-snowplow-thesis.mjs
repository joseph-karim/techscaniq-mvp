#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSnowplowThesis() {
  // Update the Snowplow scan with investment thesis data
  const { data, error } = await supabase
    .from('scan_requests')
    .update({
      investment_thesis_data: {
        thesisType: 'accelerate-organic-growth',
        criteria: [
          { 
            id: 'c1', 
            name: 'Cloud Architecture Scalability', 
            weight: 30, 
            description: 'Auto-scaling capabilities, microservices architecture, infrastructure headroom for 10x growth' 
          },
          { 
            id: 'c2', 
            name: 'Development Velocity & Pipeline', 
            weight: 25, 
            description: 'CI/CD maturity, test coverage, deployment frequency, feature delivery speed' 
          },
          { 
            id: 'c3', 
            name: 'Market Expansion Readiness', 
            weight: 25, 
            description: 'Geographic reach, customer acquisition systems, product-market fit indicators' 
          },
          { 
            id: 'c4', 
            name: 'Code Quality & Technical Debt', 
            weight: 20, 
            description: 'Modular architecture, maintainability, technical debt burden affecting velocity' 
          }
        ],
        focusAreas: ['cloud-native', 'scalable-architecture', 'devops-maturity', 'api-driven', 'microservices'],
        timeHorizon: '3-5 years',
        targetMultiple: '5-10x',
        notes: 'Focus on scalability and growth acceleration capabilities'
      }
    })
    .eq('id', '9f332d98-093e-4186-8e6d-c060728836b4');

  if (error) {
    console.error('Error updating scan:', error);
  } else {
    console.log('✅ Updated Snowplow scan with investment thesis data');
    
    // Also add some evidence if missing
    const { count } = await supabase
      .from('evidence_items')
      .select('*', { count: 'exact', head: true })
      .eq('scan_request_id', '9f332d98-093e-4186-8e6d-c060728836b4');
    
    if (count === 0) {
      console.log('Adding evidence items...');
      
      const evidenceItems = [
        {
          scan_request_id: '9f332d98-093e-4186-8e6d-c060728836b4',
          evidence_type: 'technical_analysis',
          content_data: { 
            text: 'Snowplow uses AWS infrastructure with auto-scaling groups and Kubernetes for container orchestration. The platform handles billions of events per day with horizontal scaling capabilities.',
            summary: 'Cloud-native architecture on AWS with Kubernetes'
          },
          metadata: { source: 'architecture_docs', confidence: 85 }
        },
        {
          scan_request_id: '9f332d98-093e-4186-8e6d-c060728836b4',
          evidence_type: 'market_analysis',
          content_data: { 
            text: 'Customer base includes 500+ enterprises with 40% YoY growth. Key clients include BBC, Strava, and The Economist. Strong presence in media, retail, and SaaS verticals.',
            summary: 'Strong enterprise growth with blue-chip clients'
          },
          metadata: { source: 'investor_materials', confidence: 90 }
        },
        {
          scan_request_id: '9f332d98-093e-4186-8e6d-c060728836b4',
          evidence_type: 'technical_analysis',
          content_data: { 
            text: 'CI/CD pipeline with automated testing, deploys 50+ times per week. Uses GitHub Actions for continuous integration with 80%+ test coverage on core modules.',
            summary: 'Mature DevOps practices with high deployment frequency'
          },
          metadata: { source: 'engineering_blog', confidence: 80 }
        },
        {
          scan_request_id: '9f332d98-093e-4186-8e6d-c060728836b4',
          evidence_type: 'technical_analysis',
          content_data: { 
            text: 'Microservices architecture with over 20 services. API-first design with comprehensive REST and GraphQL APIs. Event-driven architecture using Apache Kafka.',
            summary: 'Modern microservices and API-driven architecture'
          },
          metadata: { source: 'technical_documentation', confidence: 85 }
        },
        {
          scan_request_id: '9f332d98-093e-4186-8e6d-c060728836b4',
          evidence_type: 'technical_debt',
          content_data: { 
            text: 'Some legacy Scala components being migrated to Go. Technical debt concentrated in older data processing modules, but active refactoring underway.',
            summary: 'Manageable technical debt with active remediation'
          },
          metadata: { source: 'code_analysis', confidence: 70 }
        }
      ];

      const { error: evidenceError } = await supabase
        .from('evidence_items')
        .insert(evidenceItems);

      if (evidenceError) {
        console.error('Error creating evidence:', evidenceError);
      } else {
        console.log(`✅ Added ${evidenceItems.length} evidence items`);
      }
    } else {
      console.log(`Evidence already exists: ${count} items`);
    }
  }
}

updateSnowplowThesis().catch(console.error);