import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCitationsSchema() {
  // Get table schema info
  const { data: columns, error } = await supabase
    .rpc('get_table_columns', { table_name: 'report_citations' });
    
  if (error) {
    console.error('Error fetching schema:', error);
    
    // Try alternative approach
    const { data: testInsert, error: insertError } = await supabase
      .from('report_citations')
      .insert({
        report_id: '00000000-0000-0000-0000-000000000000',
        claim_id: 'test',
        evidence_item_id: '00000000-0000-0000-0000-000000000000',
        citation_text: 'test',
        citation_number: 1
      })
      .select();
      
    if (insertError) {
      console.log('Insert error reveals schema issue:', insertError.message);
      console.log('Details:', insertError.details);
    }
    
    // Clean up test
    if (testInsert) {
      await supabase
        .from('report_citations')
        .delete()
        .eq('claim_id', 'test');
    }
    
    return;
  }
  
  console.log('report_citations table columns:');
  columns?.forEach(col => {
    console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
  });
}

// Alternative: Just try to select from the table to see structure
async function checkCitationsSample() {
  console.log('\nTrying to fetch citation structure...');
  const { data, error } = await supabase
    .from('report_citations')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Sample citation columns:', Object.keys(data[0]));
  } else {
    console.log('No citations found, but table exists');
    
    // Try to see table structure via insert error
    const { error: insertError } = await supabase
      .from('report_citations')
      .insert({});
      
    if (insertError) {
      console.log('Required fields from error:', insertError.message);
    }
  }
}

async function main() {
  await checkCitationsSchema();
  await checkCitationsSample();
}

main().catch(console.error);