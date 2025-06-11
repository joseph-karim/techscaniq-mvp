import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllCitations() {
  // Get total citation count
  const { count: totalCitations } = await supabase
    .from('report_citations')
    .select('*', { count: 'exact', head: true });
    
  console.log(`Total citations in database: ${totalCitations}`);
  
  // Get reports claiming to have citations
  const { data: reports } = await supabase
    .from('reports')
    .select('id, company_name, citation_count, created_at')
    .gt('citation_count', 0)
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log(`\nReports claiming to have citations:`);
  for (const report of reports || []) {
    // Count actual citations for this report
    const { count: actualCount } = await supabase
      .from('report_citations')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', report.id);
      
    console.log(`- ${report.company_name}: Claims ${report.citation_count}, Actual ${actualCount}`);
    console.log(`  Report ID: ${report.id}`);
    console.log(`  Created: ${report.created_at}`);
  }
  
  // Get any citations that exist
  const { data: sampleCitations } = await supabase
    .from('report_citations')
    .select('*')
    .limit(3);
    
  if (sampleCitations && sampleCitations.length > 0) {
    console.log('\nSample citations:');
    sampleCitations.forEach((c, i) => {
      console.log(`${i + 1}. Report ID: ${c.report_id}`);
      console.log(`   Citation: ${c.citation_text?.substring(0, 80)}...`);
    });
  }
}

checkAllCitations().catch(console.error);