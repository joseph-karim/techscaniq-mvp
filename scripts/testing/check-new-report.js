import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkNewReport() {
  const reportId = 'b52fec0f-49e9-4d86-8e4d-0b5c14e3ec70';
  console.log(`Checking for new report ID: ${reportId}\n`);
  
  // Check reports table
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportError) {
    console.error('Error fetching from reports table:', reportError.message);
  } else if (report) {
    console.log('Found report in reports table!');
    console.log('ID:', report.id);
    console.log('Company:', report.company_name);
    console.log('Investment Score:', report.investment_score);
    console.log('Tech Health Score:', report.tech_health_score);
    console.log('Created:', report.created_at);
    console.log('\nExecutive Summary:', report.executive_summary);
    console.log('\nInvestment Rationale:', report.investment_rationale);
    
    // Check for citations
    console.log('\nChecking citations...');
    const { data: citations, error: citationsError } = await supabase
      .from('report_citations')
      .select('*')
      .eq('report_id', reportId);
      
    if (citationsError) {
      console.error('Error fetching citations:', citationsError);
    } else {
      console.log(`Found ${citations.length} citations`);
      if (citations.length > 0) {
        console.log('\nCitation examples:');
        citations.slice(0, 3).forEach(citation => {
          console.log(`- [${citation.citation_number}] ${citation.citation_text.substring(0, 60)}...`);
        });
      }
    }
  } else {
    console.log('Report not found in reports table');
  }
  
  // Check evidence collection
  console.log('\nChecking evidence collection...');
  const { data: collections, error: collectionError } = await supabase
    .from('evidence_collections')
    .select('*')
    .eq('id', '90ff9e4a-7030-4105-a963-3bb106026898')
    .single();
    
  if (collectionError) {
    console.error('Error fetching collection:', collectionError);
  } else if (collections) {
    console.log('Found evidence collection:');
    console.log('ID:', collections.id);
    console.log('Collection Type:', collections.collection_type);
    console.log('Created:', collections.created_at);
    
    // Check evidence items
    const { data: items, error: itemsError } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('collection_id', collections.id);
      
    if (itemsError) {
      console.error('Error fetching evidence items:', itemsError);
    } else {
      console.log(`Found ${items.length} evidence items`);
      if (items.length > 0) {
        console.log('\nEvidence types:', [...new Set(items.map(i => i.evidence_type))].join(', '));
      }
    }
  }
}

checkNewReport().catch(console.error); 