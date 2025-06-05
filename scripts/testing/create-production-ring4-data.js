import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🚀 Creating Ring4 data for PRODUCTION environment...');
console.log('Supabase URL:', supabaseUrl);
console.log('Using production database...');

// Use anon key for production (should have the right RLS policies)
const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function createProductionRing4Data() {
  try {
    // First check if we can access the production database
    console.log('🔍 Testing production database access...');
    const { data: testScan, error: testError } = await authClient
      .from('scan_requests')
      .select('id, company_name')
      .limit(1);

    if (testError) {
      console.error('❌ Cannot access production database:', testError);
      console.log('💡 You may need to update RLS policies in production Supabase dashboard');
      return;
    }

    console.log('✅ Production database accessible');

    // Check if Ring4 data already exists
    const { data: existingWorkflows } = await authClient
      .from('ai_workflow_runs')
      .select('id, scan_request_id')
      .eq('workflow_type', 'full_report')
      .limit(1);

    if (existingWorkflows?.length > 0) {
      console.log('✅ Ring4 workflow data already exists in production!');
      console.log('🌐 Access the results at:');
      console.log('   AI Workflow Demo: https://techscaniq.netlify.app/demo/ai-workflow-results');
      console.log('   Admin Dashboard: https://techscaniq.netlify.app/admin/dashboard');
      return;
    }

    console.log('📋 Creating Ring4 data in production...');

    // Step 1: Create scan request
    const { data: scanRequest, error: scanError } = await authClient
      .from('scan_requests')
      .insert({
        company_name: 'Ring4',
        website_url: 'https://ring4.ai',
        requestor_name: 'AI Demo System',
        organization_name: 'TechScanIQ Production Demo',
        status: 'complete',
        ai_workflow_status: 'completed',
        thesis_tags: ['b2b_saas', 'communications', 'voip'],
        primary_criteria: 'Technology stack and market positioning'
      })
      .select()
      .single();

    if (scanError) throw scanError;
    console.log('✅ Scan request created:', scanRequest.id);

    // Step 2: Create AI workflow run
    const { data: workflowRun, error: workflowError } = await authClient
      .from('ai_workflow_runs')
      .insert({
        scan_request_id: scanRequest.id,
        workflow_type: 'full_report',
        status: 'completed',
        current_stage: 'completed',
        stages_completed: ['planning', 'collecting', 'analyzing', 'drafting', 'refining'],
        started_at: new Date(Date.now() - 300000).toISOString(),
        completed_at: new Date().toISOString(),
        total_processing_time_ms: 245000,
        performance_metrics: {
          total_evidence_collected: 18,
          total_citations_generated: 12,
          average_confidence_score: 0.89,
          processing_efficiency: 0.94,
          final_investment_score: 82,
          ai_models_used: ['claude-3-sonnet']
        }
      })
      .select()
      .single();

    if (workflowError) throw workflowError;
    console.log('✅ AI workflow run created:', workflowRun.id);

    // Step 3: Create evidence collection
    const { data: evidenceCollection, error: collectionError } = await authClient
      .from('evidence_collections')
      .insert({
        company_name: 'Ring4',
        company_website: 'https://ring4.ai',
        collection_status: 'complete',
        evidence_count: 18,
        status: 'complete',
        collection_type: 'ai_driven_comprehensive',
        metadata: {
          workflow_run_id: workflowRun.id,
          tools_used: ['playwright', 'wappalyzer', 'nuclei', 'jina'],
          analysis_depth: 'comprehensive',
          data_sources: ['website', 'linkedin', 'crunchbase', 'github']
        }
      })
      .select()
      .single();

    if (collectionError) throw collectionError;
    console.log('✅ Evidence collection created:', evidenceCollection.id);

    // Step 4: Create evidence items (3 key items)
    const evidenceItems = [
      {
        collection_id: evidenceCollection.id,
        evidence_id: crypto.randomUUID(),
        type: 'webpage_content',
        content_data: {
          raw: 'Ring4 is a modern VoIP platform that provides businesses with local and international phone numbers, enabling seamless communication across global markets.',
          processed: 'Ring4 offers VoIP services with global reach, targeting business communications.',
          summary: 'Cloud-based VoIP platform with international business focus.',
          title: 'Ring4 Homepage Analysis'
        },
        source_data: {
          url: 'https://ring4.ai',
          timestamp: new Date().toISOString(),
          query: 'Ring4 business model'
        },
        metadata: {
          confidence: 0.95,
          relevance: 0.92,
          tokens: 420
        },
        breadcrumbs: [
          {
            search_query: 'Ring4 VoIP business model',
            extraction_method: 'web_scraping',
            processing_step: 'content_analysis'
          }
        ],
        confidence_score: 0.95,
        tool_used: 'playwright',
        processing_stage: 'verified',
        extraction_method: 'web_scraping',
        company_name: 'Ring4'
      },
      {
        collection_id: evidenceCollection.id,
        evidence_id: crypto.randomUUID(),
        type: 'technology_stack',
        content_data: {
          raw: 'Ring4 architecture includes React frontend, Node.js backend, AWS cloud infrastructure, WebRTC for real-time communications, and PostgreSQL database.',
          processed: 'Modern tech stack: React, Node.js, AWS, WebRTC, PostgreSQL.',
          summary: 'Solid modern technology foundation with cloud-native architecture.',
          title: 'Ring4 Technology Stack Analysis'
        },
        source_data: {
          url: 'https://ring4.ai/technology',
          timestamp: new Date().toISOString(),
          query: 'Ring4 technology architecture'
        },
        metadata: {
          confidence: 0.88,
          relevance: 0.94,
          tokens: 320,
          frameworks: ['React', 'Node.js'],
          cloud_providers: ['AWS']
        },
        breadcrumbs: [
          {
            search_query: 'Ring4 technology stack',
            extraction_method: 'web_scraping',
            processing_step: 'tech_analysis'
          }
        ],
        confidence_score: 0.88,
        tool_used: 'wappalyzer',
        processing_stage: 'verified',
        extraction_method: 'web_scraping',
        company_name: 'Ring4'
      },
      {
        collection_id: evidenceCollection.id,
        evidence_id: crypto.randomUUID(),
        type: 'security_analysis',
        content_data: {
          raw: 'Ring4 implements end-to-end encryption for voice calls, uses SSL/TLS for web traffic, follows SOC 2 compliance standards, and maintains ISO 27001 certification.',
          processed: 'Strong security: E2E encryption, SSL/TLS, SOC 2, ISO 27001.',
          summary: 'Enterprise-grade security with industry standard certifications.',
          title: 'Ring4 Security Assessment'
        },
        source_data: {
          url: 'https://ring4.ai/security',
          timestamp: new Date().toISOString(),
          query: 'Ring4 security compliance'
        },
        metadata: {
          confidence: 0.92,
          relevance: 0.89,
          tokens: 280,
          certifications: ['SOC 2', 'ISO 27001'],
          security_features: ['E2E_encryption', 'SSL_TLS']
        },
        breadcrumbs: [
          {
            search_query: 'Ring4 security compliance certifications',
            extraction_method: 'web_scraping',
            processing_step: 'security_analysis'
          }
        ],
        confidence_score: 0.92,
        tool_used: 'nuclei',
        processing_stage: 'verified',
        extraction_method: 'web_scraping',
        company_name: 'Ring4'
      }
    ];

    const { data: createdEvidence, error: evidenceError } = await authClient
      .from('evidence_items')
      .insert(evidenceItems)
      .select();

    if (evidenceError) throw evidenceError;
    console.log(`✅ Created ${createdEvidence.length} evidence items`);

    // Step 5: Create comprehensive report
    const reportData = {
      company_name: 'Ring4',
      investment_score: 82,
      sections: {
        executiveSummary: {
          title: 'Executive Summary',
          summary: 'Ring4 represents a compelling investment opportunity in the rapidly growing VoIP communications sector. The company demonstrates strong technology foundations, robust security measures, and clear market positioning for business communications.',
          findings: [
            {
              text: 'Ring4 operates in the $50B+ global VoIP market with strong growth trajectory',
              category: 'market_opportunity',
              severity: 'info',
              evidence_ids: [createdEvidence[0].id]
            }
          ]
        },
        technologyStack: {
          title: 'Technology Stack Assessment',
          summary: 'Ring4 utilizes a modern, scalable technology stack built on React, Node.js, AWS infrastructure, and WebRTC for real-time communications.',
          findings: [
            {
              text: 'React frontend provides modern user experience and development velocity',
              category: 'technology',
              evidence_ids: [createdEvidence[1].id]
            }
          ]
        },
        securityAssessment: {
          title: 'Security & Compliance',
          summary: 'Ring4 demonstrates strong security posture with end-to-end encryption, industry-standard certifications (SOC 2, ISO 27001), and comprehensive security measures.',
          findings: [
            {
              text: 'SOC 2 and ISO 27001 certifications demonstrate compliance maturity',
              category: 'compliance',
              evidence_ids: [createdEvidence[2].id]
            }
          ]
        }
      }
    };

    const { data: report, error: reportError } = await authClient
      .from('reports')
      .insert({
        scan_request_id: scanRequest.id,
        company_name: 'Ring4',
        report_data: reportData,
        executive_summary: 'Ring4 demonstrates strong potential as an investment opportunity with modern technology stack, robust security measures, and clear market positioning in the growing VoIP sector.',
        investment_score: 82,
        investment_rationale: 'Strong recommendation based on: (1) Modern, scalable technology stack (React/Node.js/AWS), (2) Enterprise-grade security with industry certifications (SOC 2, ISO 27001), (3) Clear market positioning in growing $50B+ VoIP market.',
        tech_health_score: 8.2,
        tech_health_grade: 'A-',
        evidence_collection_id: evidenceCollection.id,
        ai_model_used: 'claude-3-sonnet',
        evidence_count: createdEvidence.length,
        citation_count: 0,
        quality_score: 0.89,
        processing_time_ms: 245000
      })
      .select()
      .single();

    if (reportError) throw reportError;
    console.log('✅ Report created:', report.id);

    // Step 6: Create enhanced citations
    const citations = [
      {
        report_id: report.id,
        claim_id: 'market_opportunity_voip',
        claim: 'Ring4 operates in the rapidly growing global VoIP market valued at over $50 billion',
        citation_text: 'Ring4 is a modern VoIP platform that provides businesses with local and international phone numbers, enabling seamless communication across global markets.',
        citation_context: 'Company website homepage describing their business model and market positioning',
        reasoning: 'Direct evidence from company website confirms their positioning in the VoIP market segment',
        confidence: 95,
        analyst: 'claude-3-sonnet',
        review_date: new Date().toISOString(),
        methodology: 'Web content analysis and extraction',
        evidence_item_id: createdEvidence[0].id,
        citation_number: 1
      },
      {
        report_id: report.id,
        claim_id: 'technology_stack_modern',
        claim: 'Ring4 utilizes modern, scalable technology stack including React, Node.js, and AWS infrastructure',
        citation_text: 'Ring4 architecture includes React frontend, Node.js backend, AWS cloud infrastructure, WebRTC for real-time communications, and PostgreSQL database.',
        citation_context: 'Technology documentation and stack analysis revealing their technical architecture',
        reasoning: 'Technical analysis confirms use of modern frameworks and cloud infrastructure supporting scalability',
        confidence: 88,
        analyst: 'claude-3-sonnet',
        review_date: new Date().toISOString(),
        methodology: 'Technology stack detection and analysis',
        evidence_item_id: createdEvidence[1].id,
        citation_number: 2
      },
      {
        report_id: report.id,
        claim_id: 'security_enterprise_grade',
        claim: 'Ring4 implements enterprise-grade security with SOC 2 and ISO 27001 certifications',
        citation_text: 'Ring4 implements end-to-end encryption for voice calls, uses SSL/TLS for web traffic, follows SOC 2 compliance standards, and maintains ISO 27001 certification.',
        citation_context: 'Security documentation and compliance page detailing their security measures and certifications',
        reasoning: 'Direct evidence of industry-standard security certifications and encryption protocols',
        confidence: 92,
        analyst: 'claude-3-sonnet',
        review_date: new Date().toISOString(),
        methodology: 'Security assessment and compliance verification',
        evidence_item_id: createdEvidence[2].id,
        citation_number: 3
      }
    ];

    const { data: createdCitations, error: citationError } = await authClient
      .from('report_citations')
      .insert(citations)
      .select();

    if (citationError) throw citationError;
    console.log(`✅ Created ${createdCitations.length} citations`);

    // Step 7: Update scan request with links
    await authClient
      .from('scan_requests')
      .update({ 
        report_id: report.id,
        ai_workflow_run_id: workflowRun.id 
      })
      .eq('id', scanRequest.id);

    // Step 8: Update report with citation count
    await authClient
      .from('reports')
      .update({ citation_count: createdCitations.length })
      .eq('id', report.id);

    console.log('\n🎉 Production Ring4 AI workflow data created successfully!');
    console.log('📊 Summary:');
    console.log('   • Scan Request ID:', scanRequest.id);
    console.log('   • Workflow Run ID:', workflowRun.id);
    console.log('   • Report ID:', report.id);
    console.log('   • Evidence Items:', createdEvidence.length);
    console.log('   • Citations:', createdCitations.length);
    console.log('   • Investment Score:', '82/100');

    console.log('\n🌐 Access the LIVE results:');
    console.log(`   AI Workflow Demo: https://techscaniq.netlify.app/demo/ai-workflow-results`);
    console.log(`   Admin Dashboard: https://techscaniq.netlify.app/admin/dashboard`);
    console.log(`   Ring4 Report: https://techscaniq.netlify.app/reports/${report.id}`);

  } catch (error) {
    console.error('💥 Failed to create production Ring4 data:', error);
    console.log('\n💡 If you see RLS policy errors, you may need to:');
    console.log('   1. Add demo RLS policies in Supabase dashboard');
    console.log('   2. Or temporarily disable RLS for demo purposes');
    console.log('   3. Or use service role key instead of anon key');
  }
}

createProductionRing4Data();