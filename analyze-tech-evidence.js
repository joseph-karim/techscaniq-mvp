import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeTechEvidence() {
  // Get collection ID
  const { data: collection } = await supabase
    .from('evidence_collections')
    .select('id')
    .contains('metadata', { scan_request_id: '9f332d98-093e-4186-8e6d-c060728836b4' })
    .single();
  
  if (!collection) {
    console.log('No collection found');
    return;
  }
  
  // Get evidence focused on tech topics
  const { data: evidence } = await supabase
    .from('evidence_items')
    .select('evidence_type, content_data, source_url, confidence_score')
    .eq('collection_id', collection.id)
    .order('confidence_score', { ascending: false })
    .limit(20);
    
  console.log('=== TECH EVIDENCE GAPS ANALYSIS ===\n');
  
  const techCategories = {
    'Customer Reviews & Ratings': 0,
    'Competitive Comparisons': 0,
    'Product Documentation': 0,
    'Technical Architecture': 0,
    'API & Integration': 0,
    'Performance & Scalability': 0,
    'Business Model Analysis': 0,
    'Market Trends': 0
  };
  
  evidence?.forEach(item => {
    const content = (item.content_data?.summary || item.content_data?.processed || '').toLowerCase();
    const source = (item.source_url || '').toLowerCase();
    
    if (content.includes('review') || content.includes('rating') || source.includes('g2') || source.includes('capterra') || content.includes('customer satisfaction')) {
      techCategories['Customer Reviews & Ratings']++;
    }
    if (content.includes('competitor') || content.includes('vs ') || content.includes('alternative') || content.includes('comparison')) {
      techCategories['Competitive Comparisons']++;
    }
    if (content.includes('documentation') || content.includes('developer') || source.includes('docs.')) {
      techCategories['Product Documentation']++;
    }
    if (content.includes('architecture') || content.includes('infrastructure') || content.includes('system design')) {
      techCategories['Technical Architecture']++;
    }
    if (content.includes('api') || content.includes('integration') || content.includes('webhook') || content.includes('sdk')) {
      techCategories['API & Integration']++;
    }
    if (content.includes('performance') || content.includes('scalability') || content.includes('latency') || content.includes('throughput')) {
      techCategories['Performance & Scalability']++;
    }
    if (content.includes('business model') || content.includes('pricing') || content.includes('monetization') || content.includes('revenue model')) {
      techCategories['Business Model Analysis']++;
    }
    if (content.includes('trend') || content.includes('market') || content.includes('industry') || content.includes('adoption')) {
      techCategories['Market Trends']++;
    }
  });
  
  console.log('EVIDENCE DISTRIBUTION:');
  Object.entries(techCategories).forEach(([category, count]) => {
    const status = count >= 3 ? '✅' : count >= 1 ? '⚠️ ' : '❌';
    console.log(`${status} ${category}: ${count} items`);
  });
  
  // Check for key missing evidence types
  console.log('\n=== CRITICAL GAPS FOR TECH ASSESSMENT ===\n');
  
  const criticalGaps = [];
  
  if (techCategories['Customer Reviews & Ratings'] === 0) {
    criticalGaps.push('❌ No customer reviews or satisfaction data');
  }
  
  if (techCategories['Competitive Comparisons'] < 2) {
    criticalGaps.push('❌ Insufficient competitive analysis');
  }
  
  if (techCategories['Technical Architecture'] === 0) {
    criticalGaps.push('❌ No technical architecture details');
  }
  
  if (techCategories['API & Integration'] === 0) {
    criticalGaps.push('❌ No API/integration analysis');
  }
  
  if (techCategories['Performance & Scalability'] === 0) {
    criticalGaps.push('❌ No performance/scalability data');
  }
  
  if (criticalGaps.length > 0) {
    console.log('MISSING CRITICAL TECH EVIDENCE:');
    criticalGaps.forEach(gap => console.log(`  ${gap}`));
  } else {
    console.log('✅ All critical tech evidence categories covered');
  }
  
  // Sample high-confidence evidence
  console.log('\n=== SAMPLE HIGH-CONFIDENCE EVIDENCE ===\n');
  
  const highConfidence = evidence?.filter(e => e.confidence_score >= 0.8).slice(0, 5);
  
  if (highConfidence?.length > 0) {
    highConfidence.forEach((item, i) => {
      console.log(`${i+1}. Type: ${item.evidence_type}`);
      console.log(`   Confidence: ${item.confidence_score}`);
      console.log(`   Content: ${item.content_data?.summary?.substring(0, 120)}...`);
      console.log(`   Source: ${item.source_url?.split('/')[2] || 'Unknown'}`);
      console.log();
    });
  } else {
    console.log('⚠️  No high-confidence evidence found (>0.8)');
  }
  
  // Overall tech assessment readiness
  console.log('=== TECH ASSESSMENT READINESS ===\n');
  
  const totalEvidence = Object.values(techCategories).reduce((a, b) => a + b, 0);
  const categoriesCovered = Object.values(techCategories).filter(count => count > 0).length;
  const readinessScore = Math.round((categoriesCovered / Object.keys(techCategories).length) * 100);
  
  console.log(`Categories covered: ${categoriesCovered}/${Object.keys(techCategories).length} (${readinessScore}%)`);
  console.log(`Total evidence items: ${totalEvidence}`);
  
  if (readinessScore >= 80) {
    console.log('✅ TECH ASSESSMENT: Ready for investment decision');
  } else if (readinessScore >= 60) {
    console.log('⚠️  TECH ASSESSMENT: Needs improvement before decision');
  } else {
    console.log('❌ TECH ASSESSMENT: Insufficient for investment decision');
  }
  
  process.exit(0);
}

analyzeTechEvidence();