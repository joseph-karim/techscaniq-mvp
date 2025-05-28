import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function generateRing4Report() {
  console.log('Generating new Ring4.ai report...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Call report-orchestrator-v3 directly
    const response = await fetch(`${supabaseUrl}/functions/v1/report-orchestrator-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        company: {
          name: 'Ring4',
          website: 'https://ring4.ai'
        },
        analysisDepth: 'comprehensive'
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to generate report:', result);
      return;
    }
    
    console.log('\n✅ Report generated successfully!');
    console.log('Report ID:', result.reportId);
    console.log('Investment Score:', result.investmentScore);
    console.log('Executive Summary:', result.executiveSummary?.substring(0, 200) + '...');
    console.log('Evidence collected:', result.evidence?.total || 0);
    
    // Check if report was stored in database
    if (result.reportId) {
      // Check in reports table
      const { data: reportRecord, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', result.reportId)
        .single();
        
      if (reportRecord) {
        console.log('\n✅ Report stored in reports table');
        console.log('Company:', reportRecord.company_name);
        console.log('Tech Health Score:', reportRecord.tech_health_score);
        console.log('Tech Health Grade:', reportRecord.tech_health_grade);
      } else {
        console.log('\n❌ Report NOT found in reports table');
        if (reportError) console.error(reportError);
      }
      
      // Check citations
      const { data: citations, error: citationError } = await supabase
        .from('report_citations')
        .select('*')
        .eq('report_id', result.reportId);
        
      if (citations && citations.length > 0) {
        console.log(`\n✅ ${citations.length} citations stored`);
        console.log('Sample citation:', citations[0].citation_text);
      } else {
        console.log('\n❌ No citations found');
        if (citationError) console.error(citationError);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateRing4Report(); 