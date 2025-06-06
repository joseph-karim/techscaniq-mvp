#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('🔍 REVIEWING ACTUAL EVIDENCE CONTENT QUALITY...\n');

// Get the latest collection with evidence
const { data: collection } = await supabase
  .from('evidence_collections')
  .select('*')
  .eq('company_name', 'Mixpanel')
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

if (!collection) {
  console.log('❌ No collections found');
  process.exit(1);
}

console.log(`📊 Collection: ${collection.id}`);
console.log(`📈 Evidence count: ${collection.evidence_count}`);
console.log(`🎯 Investment thesis: ${collection.metadata?.investment_thesis}`);

// Get sample evidence items to review content quality
const { data: evidence } = await supabase
  .from('evidence_items')
  .select('type, confidence_score, content_data, source_data, metadata')
  .eq('collection_id', collection.id)
  .limit(8);

console.log('\n' + '='.repeat(60));
console.log('📋 EVIDENCE CONTENT QUALITY REVIEW');
console.log('='.repeat(60));

evidence.forEach((item, i) => {
  console.log(`\n--- Evidence Item ${i+1} ---`);
  console.log(`Type: ${item.type}`);
  console.log(`Confidence: ${item.confidence_score}`);
  console.log(`Source: ${item.source_data?.url || 'unknown'}`);
  
  // Check content quality
  const summary = item.content_data?.summary || 'No summary';
  console.log(`Summary: ${summary.substring(0, 120)}${summary.length > 120 ? '...' : ''}`);
  
  if (item.content_data?.raw) {
    try {
      const rawContent = JSON.parse(item.content_data.raw);
      
      if (rawContent.title) {
        console.log(`  📝 Title: ${rawContent.title}`);
      }
      
      if (rawContent.technologies_mentioned && rawContent.technologies_mentioned.length > 0) {
        console.log(`  🔧 Technologies: ${rawContent.technologies_mentioned.slice(0,5).join(', ')}`);
      }
      
      if (rawContent.api_endpoints && rawContent.api_endpoints.length > 0) {
        console.log(`  🔌 API Endpoints: ${rawContent.api_endpoints.length} found`);
        console.log(`     Examples: ${rawContent.api_endpoints.slice(0,3).join(', ')}`);
      }
      
      if (rawContent.team_members && rawContent.team_members.length > 0) {
        console.log(`  👥 Team Members: ${rawContent.team_members.length} found`);
        console.log(`     Examples: ${rawContent.team_members.slice(0,3).join(', ')}`);
      }
      
      if (rawContent.pricing_tiers && rawContent.pricing_tiers.length > 0) {
        console.log(`  💰 Pricing Tiers: ${rawContent.pricing_tiers.join(', ')}`);
      }
      
      if (rawContent.certifications && rawContent.certifications.length > 0) {
        console.log(`  🛡️ Security Certs: ${rawContent.certifications.join(', ')}`);
      }
      
      if (rawContent.technologies && Object.keys(rawContent.technologies).length > 0) {
        const topTechs = Object.entries(rawContent.technologies)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tech, count]) => `${tech}(${count})`)
          .join(', ');
        console.log(`  ⚙️ Top Technologies: ${topTechs}`);
      }
      
      if (rawContent.customer_names && rawContent.customer_names.length > 0) {
        console.log(`  🏢 Customers: ${rawContent.customer_names.slice(0,3).join(', ')}`);
      }
      
    } catch (e) {
      console.log(`  ❌ Raw content parsing failed: ${e.message}`);
    }
  }
});

// Analyze content quality
console.log('\n' + '='.repeat(60));
console.log('📊 CONTENT QUALITY ANALYSIS');
console.log('='.repeat(60));

const typeCount = {};
evidence.forEach(item => {
  typeCount[item.type] = (typeCount[item.type] || 0) + 1;
});

console.log('\n📈 Evidence Type Distribution:');
Object.entries(typeCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count} items`);
  });

// Check if evidence items have substantial content
let substantialContent = 0;
let emptyContent = 0;

evidence.forEach(item => {
  const summary = item.content_data?.summary || '';
  if (summary.length > 50 && !summary.includes('Evidence collected from crawl4ai')) {
    substantialContent++;
  } else {
    emptyContent++;
  }
});

console.log('\n🎯 Content Substance Analysis:');
console.log(`  Substantial content: ${substantialContent}/${evidence.length} items`);
console.log(`  Generic/empty content: ${emptyContent}/${evidence.length} items`);

if (substantialContent < evidence.length * 0.5) {
  console.log('\n❌ POOR QUALITY: Most evidence lacks substantial content');
} else if (substantialContent < evidence.length * 0.8) {
  console.log('\n⚠️ MARGINAL QUALITY: Some evidence lacks depth');
} else {
  console.log('\n✅ GOOD QUALITY: Most evidence contains substantial content');
}

console.log('\n' + '='.repeat(60));