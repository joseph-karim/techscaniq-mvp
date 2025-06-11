import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test function to inject citations into content
function injectCitationsIntoContent(content, citations) {
  if (!content || !citations || citations.length === 0) {
    return content;
  }

  let modifiedContent = content;
  
  // For each citation, find relevant text and add citation marker
  citations.forEach((citation) => {
    const citationNumber = citation.citation_number;
    const claimText = citation.claim || citation.citation_text;
    
    if (!claimText || !citationNumber) return;

    // Extract key terms from the claim
    const keyTerms = claimText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 5); // Take up to 5 key terms

    if (keyTerms.length < 2) return;

    // Try to find a sentence containing these key terms
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    let bestMatch = { index: -1, score: 0, sentence: '' };
    
    sentences.forEach((sentence, idx) => {
      const sentenceLower = sentence.toLowerCase();
      const matchedTerms = keyTerms.filter(term => sentenceLower.includes(term));
      const score = matchedTerms.length / keyTerms.length;
      
      if (score > bestMatch.score && score >= 0.4) {
        const startIndex = content.indexOf(sentence);
        bestMatch = { index: startIndex, score, sentence };
      }
    });

    // If we found a good match, add the citation
    if (bestMatch.index >= 0 && !bestMatch.sentence.includes(`[${citationNumber}]`)) {
      const insertPosition = bestMatch.index + bestMatch.sentence.length - 1; // Before the period
      const citationMarker = ` [${citationNumber}](#cite-${citationNumber})`;
      
      modifiedContent = 
        modifiedContent.substring(0, insertPosition) +
        citationMarker +
        modifiedContent.substring(insertPosition);
      
      console.log(`Injected citation ${citationNumber} into: "${bestMatch.sentence.trim()}"`);
    }
  });

  return modifiedContent;
}

async function testCitationInjection() {
  // Get a recent report with citations
  const { data: reports } = await supabase
    .from('reports')
    .select('id, company_name, citation_count, report_data')
    .gt('citation_count', 0)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (!reports || reports.length === 0) {
    console.log('No reports with citations found');
    return;
  }
  
  const report = reports[0];
  console.log(`Testing with report for ${report.company_name} (${report.citation_count} citations)`);
  
  // Get some citations
  console.log(`\nFetching citations for report ${report.id}...`);
  const { data: citations, error } = await supabase
    .from('report_citations')
    .select('*')
    .eq('report_id', report.id)
    .limit(5);
    
  if (error) {
    console.error('Error fetching citations:', error);
    return;
  }
    
  if (!citations || citations.length === 0) {
    console.log('No citations found');
    return;
  }
  
  console.log('\nCitations to inject:');
  citations.forEach((c, i) => {
    console.log(`${i + 1}. "${c.citation_text?.substring(0, 80)}..."`);
  });
  
  // Test injection on a section
  const sections = report.report_data?.sections;
  if (typeof sections === 'object' && sections.technology) {
    console.log('\n\nTesting citation injection on Technology section:');
    console.log('Original content length:', sections.technology.content.length);
    console.log('First 200 chars:', sections.technology.content.substring(0, 200) + '...');
    
    const modifiedContent = injectCitationsIntoContent(sections.technology.content, citations);
    console.log('\nModified content length:', modifiedContent.length);
    
    // Check how many citations were added
    const citationMatches = modifiedContent.match(/\[\d+\]/g);
    console.log('Citation markers found:', citationMatches?.length || 0);
    
    if (citationMatches && citationMatches.length > 0) {
      console.log('Citation examples:', citationMatches.slice(0, 5));
      
      // Show a snippet with citation
      const firstCitation = citationMatches[0];
      const citationIndex = modifiedContent.indexOf(firstCitation);
      const snippetStart = Math.max(0, citationIndex - 100);
      const snippetEnd = Math.min(modifiedContent.length, citationIndex + 100);
      const snippet = modifiedContent.substring(snippetStart, snippetEnd);
      console.log('\nSnippet with citation:');
      console.log('...', snippet, '...');
    }
  }
}

testCitationInjection().catch(console.error);