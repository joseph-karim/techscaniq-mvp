import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeReportStructure() {
  // Get a recent report with v2 worker
  const { data: report } = await supabase
    .from('reports')
    .select('id, company_name, ai_model_used, report_data')
    .eq('ai_model_used', 'queue-based-system-v2')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (report) {
    console.log('Report ID:', report.id);
    console.log('Company:', report.company_name);
    console.log('AI Model:', report.ai_model_used);
    console.log('\nReport sections:');
    
    if (report.report_data?.sections) {
      if (Array.isArray(report.report_data.sections)) {
        report.report_data.sections.forEach(section => {
          console.log(`- ${section.title}: ${section.content ? section.content.length + ' chars' : 'NO CONTENT'}`);
        });
      } else {
        Object.entries(report.report_data.sections).forEach(([key, section]) => {
          console.log(`- ${key}: ${JSON.stringify(section)}`);
        });
      }
    }
    
    console.log('\nOther report_data fields:');
    Object.keys(report.report_data).forEach(key => {
      if (key !== 'sections') {
        const value = report.report_data[key];
        if (typeof value === 'object' && value.content) {
          console.log(`- ${key}: has content (${value.content.length} chars)`);
        } else if (typeof value === 'object' && value.summary) {
          console.log(`- ${key}: has summary (${value.summary.length} chars)`);
        }
      }
    });
  }
}

analyzeReportStructure();