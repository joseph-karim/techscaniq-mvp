import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTechEvidence() {
  // Get recent evidence from technical tools
  const { data: evidence } = await supabase
    .from('evidence_items')
    .select('evidence_type, content_data, metadata, created_at')
    .in('evidence_type', ['technology_stack', 'security_assessment', 'technical_analysis'])
    .gte('created_at', new Date(Date.now() - 10*60*1000).toISOString()) // Last 10 minutes
    .order('created_at', { ascending: false });
  
  console.log('=== TECHNICAL EVIDENCE COLLECTED ===\n');
  
  if (!evidence || evidence.length === 0) {
    console.log('❌ No technical evidence found in last 10 minutes');
    return;
  }
  
  evidence.forEach((item, i) => {
    console.log(`${i+1}. ${item.evidence_type.toUpperCase()}`);
    console.log(`   Summary: ${item.content_data?.summary || 'No summary'}`);
    console.log(`   Tool: ${item.metadata?.tool || 'Unknown'}`);
    console.log(`   Score: ${item.content_data?.securityScore || 'N/A'}`);
    console.log(`   Technologies: ${item.content_data?.technologies?.join(', ') || 'N/A'}`);
    console.log(`   Time: ${new Date(item.created_at).toLocaleTimeString()}`);
    console.log();
  });
  
  console.log(`✅ Found ${evidence.length} technical evidence items`);
  
  // Now generate a report with this technical evidence
  console.log('\n=== TRIGGERING REPORT GENERATION ===\n');
  
  const { data: reports } = await supabase
    .from('reports')
    .select('id')
    .eq('company_name', 'Snowplow')
    .order('created_at', { ascending: false })
    .limit(1);
    
  console.log('Latest Snowplow report ID:', reports?.[0]?.id || 'None found');
  
  process.exit(0);
}

checkTechEvidence();