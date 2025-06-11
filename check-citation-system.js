import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCitations() {
  // Get a recent report with citations
  const { data: reports } = await supabase
    .from('reports')
    .select('id, company_name, citation_count, report_data')
    .gt('citation_count', 0)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (reports && reports.length > 0) {
    const report = reports[0];
    console.log('Found report with citations:', {
      id: report.id,
      company: report.company_name,
      citation_count: report.citation_count
    });
    
    // Check report sections
    console.log('\nReport sections structure:');
    if (report.report_data?.sections) {
      if (Array.isArray(report.report_data.sections)) {
        console.log('- Sections is an array with', report.report_data.sections.length, 'sections');
        report.report_data.sections.forEach((s, i) => {
          console.log(`  Section ${i + 1}: ${s.title}`);
          console.log(`    Has content: ${!!s.content}`);
          console.log(`    Content length: ${s.content?.length || 0}`);
          console.log(`    Has findings: ${!!s.findings}`);
          // Check for citation markers
          const citations = s.content?.match(/\[\d+\]/g);
          console.log(`    Citation markers found: ${citations?.length || 0}`);
        });
      } else {
        console.log('- Sections is an object with keys:', Object.keys(report.report_data.sections));
        // Check each section for citation markers
        Object.entries(report.report_data.sections).forEach(([key, section]) => {
          console.log(`\n  Section: ${key}`);
          console.log(`    Title: ${section.title}`);
          console.log(`    Has content: ${!!section.content}`);
          console.log(`    Content length: ${section.content?.length || 0}`);
          // Check for citation markers
          const citations = section.content?.match(/\[\d+\]/g);
          console.log(`    Citation markers found: ${citations?.length || 0}`);
          if (citations && citations.length > 0) {
            console.log(`    Citation examples:`, citations.slice(0, 5));
          }
        });
      }
    }
    
    // Get citations for this report
    const { data: citations } = await supabase
      .from('report_citations')
      .select('*')
      .eq('report_id', report.id)
      .limit(5);
      
    console.log('\nCitations in database:');
    citations?.forEach((c, i) => {
      console.log(`\nCitation ${i + 1}:`, {
        claim_id: c.claim_id,
        citation_text: c.citation_text?.substring(0, 100) + '...',
        section: c.section,
        confidence_score: c.confidence_score,
        citation_number: c.citation_number
      });
    });
    
    // Check if executive summary has citations
    if (report.report_data?.executiveSummary?.content) {
      const execCitations = report.report_data.executiveSummary.content.match(/\[\d+\]/g);
      console.log('\nExecutive Summary citation markers:', execCitations?.length || 0);
    }
    
  } else {
    console.log('No reports with citations found');
  }
}

checkCitations().catch(console.error);