#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeLatestOutput() {
  console.log('=== ANALYZING LATEST PIPELINE OUTPUT ===\n');
  
  // Get the most recent evidence collection that completed
  const { data: collections } = await supabase
    .from('evidence_collections')
    .select('*')
    .eq('company_name', 'Snowplow')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('Recent Snowplow collections:');
  collections?.forEach(col => {
    console.log(`- ${col.created_at}: Status=${col.status}, Count=${col.evidence_count}, Type=${col.collection_type}`);
  });
  
  // Find a completed collection with evidence
  const completedCollection = collections?.find(c => 
    c.status === 'completed' && c.evidence_count > 0
  );
  
  if (!completedCollection) {
    console.log('\n❌ No completed collections with evidence found');
    return;
  }
  
  console.log(`\nAnalyzing collection: ${completedCollection.id}`);
  console.log(`Created: ${completedCollection.created_at}`);
  console.log(`Evidence count: ${completedCollection.evidence_count}`);
  
  // Analyze evidence content
  const evidence = completedCollection.metadata?.evidence_raw || [];
  console.log('\n=== EVIDENCE CONTENT ANALYSIS ===');
  
  // Group by source
  const sourceGroups = {};
  evidence.forEach(item => {
    if (!sourceGroups[item.source]) {
      sourceGroups[item.source] = [];
    }
    sourceGroups[item.source].push(item);
  });
  
  Object.entries(sourceGroups).forEach(([source, items]) => {
    console.log(`\n${source} (${items.length} items):`);
    
    // Analyze content quality
    let emptyCount = 0;
    let avgLength = 0;
    let hasRealContent = false;
    
    items.forEach(item => {
      if (!item.content || item.content === '') {
        emptyCount++;
      } else if (typeof item.content === 'string') {
        avgLength += item.content.length;
        if (item.content.length > 100 && !item.content.includes('Search query queued')) {
          hasRealContent = true;
        }
      }
    });
    
    avgLength = items.length > 0 ? Math.floor(avgLength / items.length) : 0;
    
    console.log(`  Empty content: ${emptyCount}/${items.length}`);
    console.log(`  Avg content length: ${avgLength} chars`);
    console.log(`  Has real content: ${hasRealContent ? '✅' : '❌'}`);
    
    // Show sample
    const sample = items.find(i => i.content && typeof i.content === 'string' && i.content.length > 50);
    if (sample) {
      console.log(`  Sample: "${sample.content.substring(0, 200)}..."`);
    }
  });
  
  // Find reports generated from this collection
  console.log('\n\n=== REPORT ANALYSIS ===');
  
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('company_name', 'Snowplow')
    .or(`metadata->>collection_id.eq.${completedCollection.id},report_data->>metadata->>collection_id.eq.${completedCollection.id}`)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!reports || reports.length === 0) {
    // Try finding by scan_request_id
    const scanRequestId = completedCollection.metadata?.scan_request_id;
    if (scanRequestId) {
      const { data: reportsByScan } = await supabase
        .from('reports')
        .select('*')
        .eq('scan_request_id', scanRequestId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (reportsByScan && reportsByScan.length > 0) {
        console.log(`Found ${reportsByScan.length} reports by scan_request_id`);
        analyzeReport(reportsByScan[0]);
      } else {
        console.log('No reports found for this collection');
      }
    }
  } else {
    console.log(`Found ${reports.length} reports`);
    analyzeReport(reports[0]);
  }
}

function analyzeReport(report) {
  console.log(`\nReport ID: ${report.id}`);
  console.log(`Created: ${report.created_at}`);
  console.log(`Investment Score: ${report.investment_score}`);
  console.log(`Evidence Count: ${report.evidence_count}`);
  console.log(`Citation Count: ${report.citation_count}`);
  console.log(`Model: ${report.ai_model_used}`);
  
  // Analyze executive summary
  if (report.executive_summary) {
    console.log('\nExecutive Summary Quality:');
    console.log(`  Length: ${report.executive_summary.length} chars`);
    console.log(`  Has numbers: ${/\d+/.test(report.executive_summary) ? '✅' : '❌'}`);
    console.log(`  Mentions company: ${report.executive_summary.includes('Snowplow') ? '✅' : '❌'}`);
    
    // Check for generic phrases
    const genericPhrases = [
      'demonstrates strong',
      'well-positioned',
      'shows promise',
      'leverages modern',
      'robust solution'
    ];
    const genericCount = genericPhrases.filter(p => 
      report.executive_summary.toLowerCase().includes(p)
    ).length;
    console.log(`  Generic phrases: ${genericCount} (${genericCount > 2 ? '❌ Too generic' : '✅'})`);
    
    console.log(`\n  Content: "${report.executive_summary.substring(0, 300)}..."`);
  } else {
    console.log('\n❌ No executive summary');
  }
  
  // Analyze sections
  if (report.report_data?.sections) {
    console.log('\nReport Sections:');
    Object.entries(report.report_data.sections).forEach(([key, section]) => {
      console.log(`\n${section.title}:`);
      if (section.content) {
        const citations = (section.content.match(/\[\d+\]/g) || []).length;
        console.log(`  Citations: ${citations}`);
        console.log(`  Length: ${section.content.length} chars`);
        console.log(`  Preview: "${section.content.substring(0, 150)}..."`);
      } else {
        console.log('  ❌ No content');
      }
    });
  }
  
  // Overall quality assessment
  console.log('\n\n=== QUALITY ASSESSMENT ===');
  const qualityScore = {
    hasScore: report.investment_score > 0,
    hasSummary: !!report.executive_summary,
    hasSections: Object.keys(report.report_data?.sections || {}).length > 0,
    hasCitations: report.citation_count > 0,
    isSpecific: report.executive_summary?.includes('Snowplow') && /\d+/.test(report.executive_summary || '')
  };
  
  const passed = Object.values(qualityScore).filter(v => v).length;
  const total = Object.keys(qualityScore).length;
  
  console.log(`Quality Score: ${passed}/${total} (${Math.round(passed/total * 100)}%)`);
  Object.entries(qualityScore).forEach(([metric, pass]) => {
    console.log(`  ${metric}: ${pass ? '✅' : '❌'}`);
  });
  
  if (passed < 3) {
    console.log('\n⚠️  QUALITY ISSUES DETECTED');
    console.log('The report appears to be generic or incomplete.');
  }
}

analyzeLatestOutput().catch(console.error);