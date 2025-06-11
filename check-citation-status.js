import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCitationStatus() {
  console.log('Checking Citation Status in Database...\n');

  try {
    // Get recent reports
    const { data: reports, error: reportError } = await supabase
      .from('reports')
      .select('id, company_name, created_at, report_type')
      .order('created_at', { ascending: false })
      .limit(10);

    if (reportError) throw reportError;

    console.log(`Found ${reports?.length || 0} recent reports\n`);

    for (const report of reports || []) {
      // Get citations for this report
      const { data: citations, error: citationError } = await supabase
        .from('report_citations')
        .select('*')
        .eq('report_id', report.id)
        .order('citation_number');

      if (citationError) {
        console.error(`Error fetching citations for ${report.id}:`, citationError);
        continue;
      }

      console.log(`Report: ${report.company_name}`);
      console.log(`  ID: ${report.id}`);
      console.log(`  Type: ${report.report_type}`);
      console.log(`  Created: ${new Date(report.created_at).toLocaleString()}`);
      console.log(`  Citations: ${citations?.length || 0}`);

      if (citations && citations.length > 0) {
        console.log(`  Sample citations:`);
        citations.slice(0, 3).forEach(citation => {
          console.log(`    [${citation.citation_number}] ${citation.citation_text || 'No text'}`);
          console.log(`      Evidence ID: ${citation.evidence_id}`);
          console.log(`      Section: ${citation.section || 'N/A'}`);
          console.log(`      Context: ${citation.context ? citation.context.substring(0, 50) + '...' : 'N/A'}`);
        });
      }

      // Check report content for citation markers
      const { data: fullReport } = await supabase
        .from('reports')
        .select('content')
        .eq('id', report.id)
        .single();

      if (fullReport?.content) {
        const content = JSON.stringify(fullReport.content);
        const citationPattern = /\[\d+\]\(#cite-\d+\)/g;
        const embeddedCitations = content.match(citationPattern);
        console.log(`  Embedded citation markers in content: ${embeddedCitations?.length || 0}`);
        if (embeddedCitations && embeddedCitations.length > 0) {
          console.log(`  Sample markers: ${embeddedCitations.slice(0, 3).join(', ')}`);
        }
      }

      console.log('');
    }

    // Check evidence collections
    console.log('\nChecking Evidence Collections...\n');
    const { data: collections } = await supabase
      .from('evidence_collections')
      .select('id, company_name, total_evidence, status')
      .order('created_at', { ascending: false })
      .limit(5);

    for (const collection of collections || []) {
      const { data: evidenceCount } = await supabase
        .from('evidence_items')
        .select('id', { count: 'exact', head: true })
        .eq('collection_id', collection.id);

      console.log(`Collection: ${collection.company_name}`);
      console.log(`  ID: ${collection.id}`);
      console.log(`  Status: ${collection.status}`);
      console.log(`  Expected evidence: ${collection.total_evidence}`);
      console.log(`  Actual evidence: ${evidenceCount?.count || 0}`);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkCitationStatus();