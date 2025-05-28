import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing frontend data access...');
console.log('Supabase URL:', supabaseUrl);
console.log('Has anon key:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

try {
  // Test basic connection
  const { data: scans, error: scansError } = await supabase
    .from('scan_requests')
    .select('id, company_name, status, created_at')
    .eq('company_name', 'Ring4')
    .order('created_at', { ascending: false })
    .limit(3);

  if (scansError) {
    console.log('❌ Scan requests error:', scansError);
  } else {
    console.log('✅ Scan requests accessible:', scans?.length || 0);
    if (scans?.length > 0) {
      console.log('Latest scan:', scans[0].id.substring(0, 8), scans[0].status);
    }
  }

  // Test reports access
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('id, company_name, investment_score, created_at')
    .eq('company_name', 'Ring4')
    .order('created_at', { ascending: false })
    .limit(3);

  if (reportsError) {
    console.log('❌ Reports error:', reportsError);
  } else {
    console.log('✅ Reports accessible:', reports?.length || 0);
    if (reports?.length > 0) {
      console.log('Latest report:', reports[0].id.substring(0, 8), 'Score:', reports[0].investment_score);
    }
  }

  // Test citations access  
  if (reports?.length > 0) {
    const { data: citations, error: citationsError } = await supabase
      .from('report_citations')
      .select('*')
      .eq('report_id', reports[0].id);

    if (citationsError) {
      console.log('❌ Citations error:', citationsError);
    } else {
      console.log('✅ Citations accessible:', citations?.length || 0);
      if (citations?.length > 0) {
        console.log('Sample citation:', citations[0].claim?.substring(0, 50) + '...');
      }
    }
  }

  console.log('\n🌐 Frontend should be able to access the data!');
  console.log('Navigate to these URLs to see the results:');
  if (scans?.length > 0) {
    console.log(`   Scan: http://localhost:5177/scans/${scans[0].id}`);
  }
  if (reports?.length > 0) {
    console.log(`   Report: http://localhost:5177/reports/${reports[0].id}`);
  }

} catch (error) {
  console.error('💥 Test failed:', error);
}