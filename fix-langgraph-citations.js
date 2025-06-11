import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xngbtpbtivygkxnsexjg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCitations() {
  // Check the latest LangGraph report
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('report_version', 'langgraph-v2')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!report) {
    console.log('No LangGraph report found');
    return;
  }

  console.log(`Report: ${report.id}`);
  console.log(`Citation count: ${report.citation_count}`);
  
  // Extract citations from the content
  const content = JSON.stringify(report.report_data);
  const citationMatches = content.match(/\[(\d+)\]\(#cite-(\d+)\)/g);
  
  if (citationMatches) {
    console.log(`Found ${citationMatches.length} citation markers in content`);
    console.log('Sample citations:', citationMatches.slice(0, 5));
    
    // Check if any citations exist in DB
    const { data: existingCitations, count } = await supabase
      .from('report_citations')
      .select('*', { count: 'exact' })
      .eq('report_id', report.id);
      
    console.log(`\nExisting citations in DB: ${count}`);
    
    if (count === 0 && report.citation_count > 0) {
      console.log('\nCitations were generated but not saved!');
      console.log('This indicates the citation insertion is failing.');
      
      // Let's check what a citation record should look like
      const { data: sampleCitation } = await supabase
        .from('report_citations')
        .select('*')
        .limit(1)
        .single();
        
      if (sampleCitation) {
        console.log('\nSample citation structure:');
        console.log(Object.keys(sampleCitation));
      }
    }
  }
}

fixCitations();