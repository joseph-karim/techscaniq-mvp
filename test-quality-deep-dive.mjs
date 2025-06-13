#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import fs from 'fs/promises';

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

const evidenceQueue = new Queue('evidence-collection', { connection });
const reportQueue = new Queue('report-generation', { connection });

async function testQualityDeepDive() {
  console.log('=== DEEP QUALITY ANALYSIS TEST ===\n');
  
  // 1. Create a fresh test scan
  const scanRequestId = 'quality-test-' + Date.now();
  const company = 'Mixpanel';
  const domain = 'mixpanel.com';
  const thesis = 'accelerate-organic-growth';
  
  console.log('Test parameters:');
  console.log(`- Company: ${company}`);
  console.log(`- Domain: ${domain}`);
  console.log(`- Thesis: ${thesis}`);
  console.log(`- Scan ID: ${scanRequestId}\n`);
  
  await supabase
    .from('scan_requests')
    .insert({
      id: scanRequestId,
      company_name: company,
      company_website: `https://${domain}`,
      investment_thesis: thesis,
      primary_criteria: 'cloud-architecture',
      status: 'in_progress',
      priority: 'high',
      requested_by: 'quality-test',
      investment_thesis_data: {
        weightings: {
          'cloud-architecture': 0.30,
          'dev-velocity': 0.25,
          'market-expansion': 0.25,
          'code-quality': 0.20
        }
      }
    });
  
  // 2. Run evidence collection with full orchestrator
  console.log('Starting evidence collection...');
  const evidenceJob = await evidenceQueue.add(
    'full-orchestration',
    {
      scanRequestId,
      company,
      domain,
      investmentThesis: thesis,
      depth: 'comprehensive'
    }
  );
  
  // Monitor evidence collection
  let evidenceComplete = false;
  let collectionId = null;
  const startTime = Date.now();
  
  for (let i = 0; i < 120; i++) { // 10 minutes max
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await evidenceJob.getState();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    // Check collection status
    const { data: collections } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('metadata->>scan_request_id', scanRequestId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const collection = collections?.[0];
    if (collection) {
      const evidence = collection.metadata?.evidence_raw || [];
      console.log(`[${elapsed}s] Status: ${state}, Evidence items: ${evidence.length}`);
      
      if (state === 'completed' || evidence.length > 50) {
        evidenceComplete = true;
        collectionId = collection.id;
        break;
      }
    }
    
    if (state === 'failed') {
      console.error('Evidence collection failed:', await evidenceJob.failedReason);
      break;
    }
  }
  
  if (!evidenceComplete || !collectionId) {
    console.error('Evidence collection did not complete successfully');
    await connection.quit();
    return;
  }
  
  // 3. Analyze evidence quality
  console.log('\n=== EVIDENCE QUALITY ANALYSIS ===');
  
  const { data: collection } = await supabase
    .from('evidence_collections')
    .select('*')
    .eq('id', collectionId)
    .single();
  
  const evidence = collection.metadata?.evidence_raw || [];
  
  console.log(`\nTotal evidence items: ${evidence.length}`);
  
  // Analyze evidence by source
  const sourceAnalysis = {};
  const contentTypes = {};
  let totalContentLength = 0;
  let emptyContent = 0;
  
  evidence.forEach(item => {
    // Track sources
    sourceAnalysis[item.source] = (sourceAnalysis[item.source] || 0) + 1;
    
    // Track content types
    const contentType = typeof item.content;
    contentTypes[contentType] = (contentTypes[contentType] || 0) + 1;
    
    // Analyze content quality
    if (!item.content || item.content === '') {
      emptyContent++;
    } else if (typeof item.content === 'string') {
      totalContentLength += item.content.length;
    }
  });
  
  console.log('\nEvidence by source:');
  Object.entries(sourceAnalysis).forEach(([source, count]) => {
    console.log(`  ${source}: ${count} (${((count/evidence.length)*100).toFixed(1)}%)`);
  });
  
  console.log('\nContent analysis:');
  console.log(`  Average content length: ${Math.floor(totalContentLength / evidence.length)} chars`);
  console.log(`  Empty content items: ${emptyContent}`);
  console.log(`  Content types:`, contentTypes);
  
  // Sample actual content
  console.log('\nSample evidence content:');
  const nonEmptyEvidence = evidence.filter(e => e.content && e.content !== '');
  nonEmptyEvidence.slice(0, 3).forEach((item, i) => {
    console.log(`\n[${i+1}] Source: ${item.source}`);
    const content = typeof item.content === 'string' ? 
      item.content : JSON.stringify(item.content);
    console.log(`Content (first 500 chars): ${content.substring(0, 500)}...`);
  });
  
  // 4. Generate report
  console.log('\n\nGenerating report...');
  const reportJob = await reportQueue.add(
    'thesis-aligned-flexible',
    {
      scanRequestId,
      company,
      domain,
      investmentThesis: thesis,
      collectionId,
      enableCitations: true
    }
  );
  
  // Wait for report
  let reportComplete = false;
  let reportId = null;
  
  for (let i = 0; i < 60; i++) { // 5 minutes max
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await reportJob.getState();
    console.log(`Report generation: ${state}`);
    
    if (state === 'completed') {
      const result = await reportJob.returnvalue;
      reportId = result?.reportId;
      reportComplete = true;
      break;
    } else if (state === 'failed') {
      console.error('Report generation failed:', await reportJob.failedReason);
      break;
    }
  }
  
  if (!reportComplete || !reportId) {
    console.error('Report generation did not complete successfully');
    await connection.quit();
    return;
  }
  
  // 5. Analyze report quality
  console.log('\n=== REPORT QUALITY ANALYSIS ===');
  
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();
  
  console.log(`\nReport ID: ${report.id}`);
  console.log(`Investment score: ${report.investment_score}`);
  console.log(`Evidence used: ${report.evidence_count}`);
  console.log(`Citations: ${report.citation_count}`);
  
  // Analyze executive summary
  console.log('\nExecutive Summary Analysis:');
  if (report.executive_summary) {
    console.log(`  Length: ${report.executive_summary.length} chars`);
    console.log(`  Contains company name: ${report.executive_summary.includes(company)}`);
    console.log(`  Contains numbers/metrics: ${/\d+/.test(report.executive_summary)}`);
    console.log(`  Preview: "${report.executive_summary.substring(0, 200)}..."`);
  } else {
    console.log('  ❌ No executive summary');
  }
  
  // Analyze sections
  if (report.report_data?.sections) {
    console.log('\nReport Sections:');
    Object.entries(report.report_data.sections).forEach(([key, section]) => {
      console.log(`\n  ${section.title}:`);
      console.log(`    Length: ${section.content?.length || 0} chars`);
      console.log(`    Citations: ${(section.content?.match(/\[\d+\]/g) || []).length}`);
      
      // Check for generic content
      const genericPhrases = [
        'leverages modern',
        'demonstrates strong',
        'shows promise',
        'well-positioned',
        'robust solution'
      ];
      const genericCount = genericPhrases.filter(phrase => 
        section.content?.toLowerCase().includes(phrase)
      ).length;
      console.log(`    Generic phrases found: ${genericCount}`);
      
      // Check for specific data
      const hasNumbers = /\d+/.test(section.content || '');
      const hasCompanyName = section.content?.includes(company) || false;
      console.log(`    Contains numbers: ${hasNumbers}`);
      console.log(`    Contains company name: ${hasCompanyName}`);
    });
  }
  
  // Check citation quality
  const { data: citations } = await supabase
    .from('citations')
    .select('*')
    .eq('report_id', reportId);
  
  console.log('\n\nCitation Analysis:');
  console.log(`Total citations in DB: ${citations?.length || 0}`);
  
  if (citations && citations.length > 0) {
    // Analyze citation sources
    const citationSources = {};
    citations.forEach(c => {
      const domain = c.source_url ? new URL(c.source_url).hostname : 'unknown';
      citationSources[domain] = (citationSources[domain] || 0) + 1;
    });
    
    console.log('\nCitations by domain:');
    Object.entries(citationSources).forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}`);
    });
    
    console.log('\nSample citations:');
    citations.slice(0, 3).forEach((c, i) => {
      console.log(`\n[${i+1}] "${c.quote}"`);
      console.log(`  Source: ${c.source_url || 'No URL'}`);
      console.log(`  Location: ${c.report_location}`);
    });
  }
  
  // 6. Overall quality assessment
  console.log('\n\n=== QUALITY ASSESSMENT ===');
  
  const qualityMetrics = {
    'Evidence diversity': Object.keys(sourceAnalysis).length >= 3 ? '✅' : '❌',
    'Non-empty evidence': ((evidence.length - emptyContent) / evidence.length * 100).toFixed(1) + '%',
    'Report has score': report.investment_score > 0 ? '✅' : '❌',
    'Has executive summary': report.executive_summary ? '✅' : '❌',
    'Citations present': citations?.length > 0 ? '✅' : '❌',
    'Specific content': report.executive_summary?.includes(company) ? '✅' : '❌'
  };
  
  console.log('\nQuality Metrics:');
  Object.entries(qualityMetrics).forEach(([metric, value]) => {
    console.log(`  ${metric}: ${value}`);
  });
  
  // Save detailed analysis
  const analysisReport = {
    testId: scanRequestId,
    company,
    timestamp: new Date().toISOString(),
    evidenceAnalysis: {
      total: evidence.length,
      sources: sourceAnalysis,
      emptyContent,
      avgContentLength: Math.floor(totalContentLength / evidence.length)
    },
    reportAnalysis: {
      score: report.investment_score,
      evidenceUsed: report.evidence_count,
      citations: report.citation_count,
      sectionsCount: Object.keys(report.report_data?.sections || {}).length
    },
    qualityMetrics
  };
  
  await fs.writeFile(
    `quality-analysis-${Date.now()}.json`,
    JSON.stringify(analysisReport, null, 2)
  );
  
  console.log('\n✅ Quality analysis complete!');
  console.log('Full report saved to quality-analysis-*.json');
  
  await connection.quit();
}

testQualityDeepDive().catch(console.error);