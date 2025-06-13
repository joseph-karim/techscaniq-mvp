#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

dotenv.config();

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const reportGenerationQueue = new Queue('report-generation', { connection });

async function testCitations() {
  console.log('=== TESTING CITATIONS ===\n');

  const scanRequestId = '9f332d98-093e-4186-8e6d-c060728836b4';
  
  // Clear existing evidence
  await supabase
    .from('evidence_items')
    .delete()
    .eq('scan_request_id', scanRequestId);

  // Create test evidence items
  console.log('Creating test evidence items...');
  const testEvidence = [
    {
      scan_request_id: scanRequestId,
      evidence_id: randomUUID(),
      type: 'webpage_content',
      company_name: 'Snowplow',
      content_data: { 
        raw: 'Snowplow is a behavioral data platform that enables companies to collect granular, event-level data from all their platforms and channels.',
        summary: 'Snowplow provides behavioral data collection',
        processed: 'Snowplow is a leading behavioral data platform'
      },
      source_data: { 
        tool: 'web_crawler', 
        url: 'https://snowplow.io',
        timestamp: new Date().toISOString()
      },
      metadata: { 
        confidence_score: 0.95,
        processing_stage: 'raw',
        title: 'Snowplow Homepage'
      }
    },
    {
      scan_request_id: scanRequestId,
      evidence_id: randomUUID(),
      type: 'search_result',
      company_name: 'Snowplow',
      content_data: { 
        raw: 'Snowplow has raised over $40 million in funding and serves Fortune 500 customers including Strava, HelloFresh, and Supercell.',
        summary: 'Snowplow funding and customer information',
        processed: 'Well-funded company with enterprise customers'
      },
      source_data: { 
        tool: 'business_search', 
        url: 'https://snowplow.io/customers',
        timestamp: new Date().toISOString()
      },
      metadata: { 
        confidence_score: 0.9,
        processing_stage: 'raw',
        title: 'Snowplow Customers'
      }
    },
    {
      scan_request_id: scanRequestId,
      evidence_id: randomUUID(),
      type: 'technology_stack',
      company_name: 'Snowplow',
      content_data: { 
        raw: 'Snowplow offers SDKs for JavaScript, Android, iOS, Python, Ruby, Java, and more. It integrates with major cloud platforms including AWS, GCP, and Azure.',
        summary: 'Snowplow technology stack and integrations',
        processed: 'Multi-platform SDK support with cloud integrations'
      },
      source_data: { 
        tool: 'technical_analysis', 
        url: 'https://docs.snowplow.io',
        timestamp: new Date().toISOString()
      },
      metadata: { 
        confidence_score: 0.92,
        processing_stage: 'raw',
        title: 'Snowplow Technical Documentation'
      }
    }
  ];

  const { error: insertError } = await supabase
    .from('evidence_items')
    .insert(testEvidence);

  if (insertError) {
    console.error('Failed to insert evidence:', insertError);
    return;
  }

  console.log(`✓ Created ${testEvidence.length} evidence items`);

  // Generate report
  console.log('\nGenerating report with citations...');
  const reportJob = await reportGenerationQueue.add(
    'langgraph-v3-thesis',
    {
      scanRequestId,
      company: 'Snowplow',
      domain: 'snowplow.io',
      investmentThesis: 'accelerate-organic-growth',
      thesisData: {
        criteria: ['market_growth', 'product_market_fit', 'competitive_advantage']
      },
      workflow: 'thesis-aligned',
      enableCitations: true
    }
  );

  console.log(`Report job created: ${reportJob.id}`);

  // Monitor report generation
  console.log('\nWaiting for report generation...');
  let reportState = await reportJob.getState();
  let attempts = 0;

  while (reportState !== 'completed' && reportState !== 'failed' && attempts < 24) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    reportState = await reportJob.getState();
    attempts++;
    
    if (attempts % 4 === 0) {
      console.log(`  Status: ${reportState} (${attempts * 5}s elapsed)`);
    }
  }

  if (reportState === 'completed') {
    console.log('\n✓ Report generation completed!');
    
    const jobResult = await reportJob.returnvalue;
    if (jobResult?.reportId) {
      const { data: report } = await supabase
        .from('reports')
        .select('*')
        .eq('id', jobResult.reportId)
        .single();

      if (report) {
        console.log('\n=== REPORT SUMMARY ===');
        console.log(`Report ID: ${report.id}`);
        console.log(`Investment Score: ${report.investment_score || 'N/A'}`);
        console.log(`Citations: ${report.citation_count || 0}`);
        console.log(`Evidence Used: ${report.evidence_count || 0}`);
        
        // Check citations
        const { data: citations } = await supabase
          .from('citations')
          .select('*')
          .eq('report_id', report.id)
          .limit(10);
          
        if (citations && citations.length > 0) {
          console.log('\nCitations found:');
          citations.forEach((c, i) => {
            console.log(`\n${i+1}. "${c.quote}"`);
            console.log(`   Evidence: ${c.evidence_id.substring(0, 8)}...`);
            console.log(`   Source: ${c.source_url || 'N/A'}`);
            console.log(`   Location: ${c.report_location || 'N/A'}`);
          });
        } else {
          console.log('\nNo citations found in database');
        }
        
        // Check report content
        if (report.report_data?.sections) {
          console.log('\nReport has sections:', Object.keys(report.report_data.sections));
        }
        
        console.log(`\nView report at: http://localhost:5173/reports/${report.id}`);
      }
    }
  } else {
    console.error('\n✗ Report generation failed or timed out');
    if (reportState === 'failed') {
      console.error('Failure reason:', await reportJob.failedReason);
    }
  }

  await connection.quit();
  console.log('\n✅ Test complete!');
}

testCitations().catch(console.error);