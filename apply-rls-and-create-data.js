import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🚀 Applying RLS policies and creating Ring4 data...');

// For applying RLS policies, we need to use a more privileged connection
// Let's try with the anon key first and see what works

const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function applyRLSAndCreateData() {
  try {
    console.log('🔐 Attempting to apply RLS policies...');
    
    // Try to apply RLS policies using SQL
    const rlsPolicies = `
      CREATE POLICY IF NOT EXISTS "Demo access ai_workflow_runs" ON ai_workflow_runs FOR SELECT TO anon USING (true);
      CREATE POLICY IF NOT EXISTS "Demo insert ai_workflow_runs" ON ai_workflow_runs FOR INSERT TO anon WITH CHECK (true);
      CREATE POLICY IF NOT EXISTS "Demo access reports" ON reports FOR SELECT TO anon USING (true);
      CREATE POLICY IF NOT EXISTS "Demo insert reports" ON reports FOR INSERT TO anon WITH CHECK (true);
    `;
    
    try {
      const { error: rlsError } = await authClient.rpc('exec_sql', { sql: rlsPolicies });
      if (rlsError) {
        console.log('⚠️ Could not apply RLS policies (might need admin access):', rlsError.message);
      } else {
        console.log('✅ RLS policies applied successfully');
      }
    } catch (rlsErr) {
      console.log('⚠️ RLS policy application failed (expected - need admin access)');
    }

    // Now try to create the data
    console.log('📋 Creating Ring4 workflow data...');

    // Check if data already exists
    const { data: existingWorkflows } = await authClient
      .from('ai_workflow_runs')
      .select('id, performance_metrics')
      .eq('workflow_type', 'full_report')
      .limit(1);

    if (existingWorkflows?.length > 0) {
      console.log('✅ Ring4 workflow data already exists!');
      console.log('🌐 Live demo accessible at:');
      console.log('   AI Workflow: https://techscaniq.netlify.app/demo/ai-workflow-results');
      console.log('   Admin Dashboard: https://techscaniq.netlify.app/admin/dashboard');
      return;
    }

    // Try to create minimal workflow data
    console.log('📊 Creating AI workflow run...');
    
    const { data: workflowRun, error: workflowError } = await authClient
      .from('ai_workflow_runs')
      .insert({
        workflow_type: 'full_report',
        status: 'completed',
        current_stage: 'completed',
        stages_completed: ['planning', 'collecting', 'analyzing', 'drafting'],
        started_at: new Date(Date.now() - 300000).toISOString(),
        completed_at: new Date().toISOString(),
        total_processing_time_ms: 245000,
        performance_metrics: {
          total_evidence_collected: 18,
          total_citations_generated: 12,
          average_confidence_score: 0.89,
          final_investment_score: 82
        }
      })
      .select()
      .single();

    if (workflowError) {
      console.error('❌ Workflow creation failed:', workflowError);
      console.log('\n💡 To fix this, you need to apply RLS policies in Supabase Dashboard:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/xngbtpbtivygkxnsexjg');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the contents of add-production-rls-policies.sql');
      console.log('   4. Run the SQL to add demo access policies');
      console.log('   5. Then run this script again');
      return;
    }

    console.log('✅ AI workflow created:', workflowRun.id);

    console.log('\n🎉 Production setup complete!');
    console.log('🌐 Access the live demos:');
    console.log('   AI Workflow: https://techscaniq.netlify.app/demo/ai-workflow-results');
    console.log('   Admin Dashboard: https://techscaniq.netlify.app/admin/dashboard');

  } catch (error) {
    console.error('💥 Setup failed:', error);
    console.log('\n📋 Manual steps required:');
    console.log('1. Apply RLS policies via Supabase Dashboard SQL Editor');
    console.log('2. Copy contents of add-production-rls-policies.sql');
    console.log('3. Then run: node create-production-ring4-data.js');
  }
}

applyRLSAndCreateData();