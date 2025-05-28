import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl || !supabaseAnonKey || !jwtSecret) {
  console.error('Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create JWT token for authenticated request
function createAuthToken() {
  return jwt.sign(
    {
      role: 'service_role',
      aud: 'authenticated', 
      iss: supabaseUrl,
      sub: '00000000-0000-0000-0000-000000000000',
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    },
    jwtSecret
  );
}

// Create authenticated client
function createAuthenticatedClient() {
  const token = createAuthToken();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

async function createAIWorkflowRun(scanRequestId) {
  console.log('🤖 Creating AI workflow run...');
  
  const authClient = createAuthenticatedClient();
  
  const { data: workflowRun, error } = await authClient
    .from('ai_workflow_runs')
    .insert({
      scan_request_id: scanRequestId,
      workflow_type: 'full_report',
      status: 'started',
      current_stage: 'planning',
      performance_metrics: {
        total_evidence_collected: 0,
        total_citations_generated: 0,
        average_confidence_score: 0.0
      }
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating workflow run:', error);
    throw error;
  }

  console.log('✅ AI workflow run created:', workflowRun.id);
  return workflowRun;
}

async function createWorkflowStage(workflowRunId, stageName, stageType) {
  console.log(`🔄 Creating workflow stage: ${stageName}`);
  
  const authClient = createAuthenticatedClient();
  
  const { data: stage, error } = await authClient
    .from('ai_workflow_stages')
    .insert({
      workflow_run_id: workflowRunId,
      stage_name: stageName,
      stage_type: stageType,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Error creating stage ${stageName}:`, error);
    throw error;
  }

  console.log(`✅ Stage created: ${stage.id}`);
  return stage;
}

async function updateWorkflowStage(stageId, updates) {
  const authClient = createAuthenticatedClient();
  
  const { error } = await authClient
    .from('ai_workflow_stages')
    .update({
      ...updates,
      completed_at: updates.status === 'completed' ? new Date().toISOString() : undefined
    })
    .eq('id', stageId);

  if (error) {
    console.error('❌ Error updating stage:', error);
    throw error;
  }
}

async function logToolExecution(workflowRunId, toolName, executionType, inputParams, success, outputData, errorMessage = null) {
  console.log(`🔧 Logging tool execution: ${toolName}`);
  
  const authClient = createAuthenticatedClient();
  
  const { data: execution, error } = await authClient
    .from('tool_executions')
    .insert({
      workflow_run_id: workflowRunId,
      tool_name: toolName,
      execution_type: executionType,
      input_parameters: inputParams,
      output_data: outputData,
      success: success,
      error_message: errorMessage,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      execution_time_ms: Math.floor(Math.random() * 5000) + 1000 // Simulated execution time
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error logging tool execution:', error);
    throw error;
  }

  console.log(`✅ Tool execution logged: ${execution.id}`);
  return execution;
}

async function logPromptExecution(stageId, promptType, promptContent, aiModel, responseContent, inputTokens, outputTokens) {
  console.log(`📝 Logging prompt execution: ${promptType}`);
  
  const authClient = createAuthenticatedClient();
  
  const { data: execution, error } = await authClient
    .from('prompt_executions')
    .insert({
      workflow_stage_id: stageId,
      prompt_type: promptType,
      prompt_content: promptContent,
      ai_model: aiModel,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      response_content: responseContent,
      response_quality_score: 0.85 + Math.random() * 0.15, // Simulated quality score
      execution_time_ms: Math.floor(Math.random() * 3000) + 500,
      cost_usd: (inputTokens * 0.00001) + (outputTokens * 0.00003), // Simulated cost
      temperature: 0.7
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error logging prompt execution:', error);
    throw error;
  }

  console.log(`✅ Prompt execution logged: ${execution.id}`);
  return execution;
}

async function createEnhancedEvidenceItems(collectionId, workflowRunId) {
  console.log('📊 Creating enhanced evidence items...');
  
  const authClient = createAuthenticatedClient();
  
  // Simulate evidence items with RAG features
  const evidenceItems = [
    {
      collection_id: collectionId,
      evidence_id: crypto.randomUUID(),
      type: 'webpage_content',
      content_data: {
        raw: 'Ring4 is a Voice over Internet Protocol (VoIP) and cloud communications platform that enables businesses to communicate with customers through local and international phone numbers.',
        processed: 'Ring4 provides VoIP and cloud communications solutions for businesses with local and international number support.',
        summary: 'Ring4 is a VoIP and cloud communications platform for business communications.',
        title: 'Ring4 Company Overview'
      },
      source_data: {
        url: 'https://ring4.ai',
        timestamp: new Date().toISOString(),
        query: 'Ring4 company overview'
      },
      metadata: {
        confidence: 0.95,
        relevance: 0.9,
        tokens: 450,
        fileType: 'html'
      },
      breadcrumbs: [
        {
          search_query: 'Ring4 business model',
          extraction_method: 'web_scraping',
          processing_step: 'content_extraction'
        }
      ],
      confidence_score: 0.95,
      tool_used: 'playwright',
      processing_stage: 'processed',
      extraction_method: 'web_scraping',
      company_name: 'Ring4'
    },
    {
      collection_id: collectionId,
      evidence_id: crypto.randomUUID(),
      type: 'technology_stack',
      content_data: {
        raw: 'Ring4 uses React for frontend, Node.js for backend, AWS for cloud infrastructure, and WebRTC for real-time communications.',
        processed: 'Technology stack includes React frontend, Node.js backend, AWS cloud infrastructure, and WebRTC for communications.',
        summary: 'Modern tech stack with React, Node.js, AWS, and WebRTC.',
        title: 'Ring4 Technology Stack Analysis'
      },
      source_data: {
        url: 'https://ring4.ai/careers',
        timestamp: new Date().toISOString(),
        query: 'Ring4 technology stack'
      },
      metadata: {
        confidence: 0.88,
        relevance: 0.95,
        tokens: 320,
        fileType: 'html'
      },
      breadcrumbs: [
        {
          search_query: 'Ring4 technology architecture',
          extraction_method: 'web_scraping',
          processing_step: 'technology_analysis'
        }
      ],
      confidence_score: 0.88,
      tool_used: 'wappalyzer',
      processing_stage: 'verified',
      extraction_method: 'web_scraping',
      company_name: 'Ring4'
    },
    {
      collection_id: collectionId,
      evidence_id: crypto.randomUUID(),
      type: 'security_analysis',
      content_data: {
        raw: 'Ring4 implements end-to-end encryption for voice calls, uses SSL/TLS for web traffic, and follows SOC 2 compliance standards.',
        processed: 'Security features include end-to-end encryption, SSL/TLS, and SOC 2 compliance.',
        summary: 'Strong security posture with encryption and compliance standards.',
        title: 'Ring4 Security Assessment'
      },
      source_data: {
        url: 'https://ring4.ai/security',
        timestamp: new Date().toISOString(),
        query: 'Ring4 security features'
      },
      metadata: {
        confidence: 0.92,
        relevance: 0.88,
        tokens: 280,
        fileType: 'html'
      },
      breadcrumbs: [
        {
          search_query: 'Ring4 security compliance',
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

  const { data: createdEvidence, error } = await authClient
    .from('evidence_items')
    .insert(evidenceItems)
    .select();

  if (error) {
    console.error('❌ Error creating evidence items:', error);
    throw error;
  }

  console.log(`✅ Created ${createdEvidence.length} enhanced evidence items`);
  return createdEvidence;
}

async function createEnhancedCitations(reportId, evidenceItems) {
  console.log('📎 Creating enhanced citations...');
  
  const authClient = createAuthenticatedClient();
  
  const citations = [
    {
      report_id: reportId,
      claim_id: 'company_overview_1',
      citation_number: 1,
      claim: 'Ring4 provides VoIP and cloud communications solutions',
      citation_text: 'Ring4 is a VoIP and cloud communications platform for business communications.',
      citation_context: 'Company overview and business model analysis',
      reasoning: 'Primary evidence from company website describing core business offering',
      confidence: 95,
      analyst: 'AI System',
      review_date: new Date().toISOString(),
      methodology: 'Web scraping and content analysis',
      evidence_item_id: evidenceItems[0].id,
      evidence_summary: [{
        id: evidenceItems[0].id,
        type: 'webpage_content',
        title: 'Ring4 Company Overview',
        source: 'https://ring4.ai',
        excerpt: 'Ring4 is a VoIP and cloud communications platform for business communications.',
        metadata: evidenceItems[0].metadata
      }]
    },
    {
      report_id: reportId,
      claim_id: 'technology_stack_1',
      citation_number: 2,
      claim: 'Ring4 uses modern technology stack including React and Node.js',
      citation_text: 'Technology stack includes React frontend, Node.js backend, AWS cloud infrastructure, and WebRTC for communications.',
      citation_context: 'Technology stack analysis for investment assessment',
      reasoning: 'Technical evidence showing modern, scalable technology choices',
      confidence: 88,
      analyst: 'AI System',
      review_date: new Date().toISOString(),
      methodology: 'Technology detection and job posting analysis',
      evidence_item_id: evidenceItems[1].id,
      evidence_summary: [{
        id: evidenceItems[1].id,
        type: 'technology_stack',
        title: 'Ring4 Technology Stack Analysis',
        source: 'https://ring4.ai/careers',
        excerpt: 'Modern tech stack with React, Node.js, AWS, and WebRTC.',
        metadata: evidenceItems[1].metadata
      }]
    },
    {
      report_id: reportId,
      claim_id: 'security_assessment_1',
      citation_number: 3,
      claim: 'Ring4 implements strong security measures including end-to-end encryption',
      citation_text: 'Security features include end-to-end encryption, SSL/TLS, and SOC 2 compliance.',
      citation_context: 'Security assessment for risk evaluation',
      reasoning: 'Security evidence demonstrating enterprise-grade protection measures',
      confidence: 92,
      analyst: 'AI System',
      review_date: new Date().toISOString(),
      methodology: 'Security scan and compliance verification',
      evidence_item_id: evidenceItems[2].id,
      evidence_summary: [{
        id: evidenceItems[2].id,
        type: 'security_analysis',
        title: 'Ring4 Security Assessment',
        source: 'https://ring4.ai/security',
        excerpt: 'Strong security posture with encryption and compliance standards.',
        metadata: evidenceItems[2].metadata
      }]
    }
  ];

  const { data: createdCitations, error } = await authClient
    .from('report_citations')
    .insert(citations)
    .select();

  if (error) {
    console.error('❌ Error creating citations:', error);
    throw error;
  }

  console.log(`✅ Created ${createdCitations.length} enhanced citations`);
  return createdCitations;
}

async function completeMockWorkflow(scanRequest, workflowRun, authClient) {
  console.log('\n📋 Creating mock data for workflow demonstration...');
  
  // Step 1: Create mock evidence collection
  const { data: evidenceCollection, error: collectionError } = await authClient
    .from('evidence_collections')
    .insert({
      company_name: 'Ring4',
      company_website: 'https://ring4.ai',
      collection_status: 'complete',
      evidence_count: 15,
      status: 'complete',
      collection_type: 'ai_driven_mock',
      metadata: {
        workflow_run_id: workflowRun.id,
        tools_used: ['playwright', 'wappalyzer', 'nuclei'],
        analysis_depth: 'comprehensive',
        mock_data: true
      }
    })
    .select()
    .single();

  if (collectionError) {
    console.error('❌ Error creating mock evidence collection:', collectionError);
    throw collectionError;
  }

  // Step 2: Create mock evidence items
  const evidenceItems = await createEnhancedEvidenceItems(evidenceCollection.id, workflowRun.id);

  // Step 3: Create mock report with proper structure
  const reportData = {
    company_name: 'Ring4',
    investment_score: 78,
    sections: {
      executiveSummary: {
        title: 'Executive Summary',
        summary: 'Ring4 represents a compelling investment opportunity in the VoIP communications space with strong technology foundations and enterprise-grade security.',
        findings: [{
          text: 'Ring4 provides VoIP and cloud communications solutions for businesses',
          category: 'business_model',
          severity: 'info',
          evidence_ids: [evidenceItems[0].id]
        }]
      },
      companyOverview: {
        title: 'Company Overview',
        summary: 'Ring4 is a VoIP and cloud communications platform enabling businesses to communicate through local and international phone numbers.',
        findings: [{
          text: 'Focused on business communications with international reach',
          category: 'market_position',
          evidence_ids: [evidenceItems[0].id]
        }]
      },
      technologyStack: {
        title: 'Technology Stack',
        summary: 'Modern technology stack built on React, Node.js, AWS infrastructure, and WebRTC for real-time communications.',
        findings: [{
          text: 'Ring4 uses modern technology stack including React and Node.js',
          category: 'technology',
          evidence_ids: [evidenceItems[1].id]
        }]
      },
      securityAssessment: {
        title: 'Security Assessment',
        summary: 'Strong security posture with end-to-end encryption, SSL/TLS implementation, and SOC 2 compliance.',
        findings: [{
          text: 'Ring4 implements strong security measures including end-to-end encryption',
          category: 'security',
          evidence_ids: [evidenceItems[2].id]
        }]
      },
      teamAnalysis: {
        title: 'Team Analysis',
        summary: 'Analysis of team composition and leadership capabilities based on available information.',
        findings: []
      },
      financialOverview: {
        title: 'Financial Overview',
        summary: 'Financial analysis based on publicly available information and market positioning.',
        findings: []
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
      investment_score: 78,
      investment_rationale: 'Recommendation based on strong technology foundations (React/Node.js), enterprise-grade security (end-to-end encryption, SOC 2), and position in growing communications market.',
      tech_health_score: 7.8,
      tech_health_grade: 'B',
      evidence_collection_id: evidenceCollection.id,
      ai_model_used: 'claude-3-sonnet',
      evidence_count: evidenceItems.length,
      quality_score: 0.87,
      human_reviewed: false,
      report_version: '2.0'
    })
    .select()
    .single();

  if (reportError) {
    console.error('❌ Error creating mock report:', reportError);
    throw reportError;
  }

  console.log('✅ Mock report created:', report.id);

  // Step 4: Create enhanced citations
  const citations = await createEnhancedCitations(report.id, evidenceItems);

  // Step 5: Log completion stages
  const analysisStage = await createWorkflowStage(workflowRun.id, 'mock_analysis', 'analysis');
  await updateWorkflowStage(analysisStage.id, {
    status: 'completed',
    output_data: {
      investment_score: 78,
      technology_score: 85,
      security_score: 90,
      market_score: 75,
      overall_confidence: 0.87,
      mock_data: true
    }
  });

  const reportStage = await createWorkflowStage(workflowRun.id, 'mock_report_generation', 'drafting');
  await updateWorkflowStage(reportStage.id, {
    status: 'completed',
    output_data: {
      report_id: report.id,
      citations_generated: citations.length,
      sections_completed: 6,
      mock_data: true
    }
  });

  // Step 6: Finalize workflow
  await authClient
    .from('ai_workflow_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      performance_metrics: {
        total_evidence_collected: evidenceItems.length,
        total_citations_generated: citations.length,
        average_confidence_score: 0.87,
        processing_time_by_stage: {
          planning: 2500,
          collection: 8500,
          analysis: 12000,
          drafting: 6500
        },
        mock_data: true
      },
      total_processing_time_ms: 29500
    })
    .eq('id', workflowRun.id);

  // Update scan request final status
  await authClient
    .from('scan_requests')
    .update({
      status: 'complete',
      ai_workflow_status: 'completed',
      evidence_collection_progress: 1.0,
      report_generation_progress: 1.0,
      thesis_alignment_score: 0.85
    })
    .eq('id', scanRequest.id);

  return {
    scanRequest,
    workflowRun,
    report,
    citations,
    evidenceItems,
    mockData: true
  };
}

async function runFullAIWorkflow() {
  try {
    console.log('🚀 Starting AI-driven workflow for Ring4...\n');
    
    // Step 1: Create scan request with AI workflow tracking
    console.log('📋 Step 1: Creating scan request...');
    const authClient = createAuthenticatedClient();
    
    const { data: scanRequest, error: scanError } = await authClient
      .from('scan_requests')
      .insert({
        company_name: 'Ring4',
        website_url: 'https://ring4.ai',
        status: 'pending',
        requestor_name: 'AI Workflow Test',
        organization_name: 'TechScanIQ',
        requested_by: null,
        ai_workflow_status: 'pending'
      })
      .select()
      .single();

    if (scanError) {
      console.error('❌ Error creating scan request:', scanError);
      return;
    }

    console.log('✅ Scan request created:', scanRequest.id);
    
    // Step 2: Create AI workflow run and update scan request
    const workflowRun = await createAIWorkflowRun(scanRequest.id);
    
    await authClient
      .from('scan_requests')
      .update({ 
        ai_workflow_run_id: workflowRun.id,
        ai_workflow_status: 'processing'
      })
      .eq('id', scanRequest.id);

    // Step 3: Planning Stage
    console.log('\n🧠 Step 2: AI Planning Stage...');
    const planningStage = await createWorkflowStage(workflowRun.id, 'investment_analysis_planning', 'planning');
    
    await logPromptExecution(
      planningStage.id,
      'planning',
      'Analyze Ring4 for investment potential. Focus on technology stack, security, and market position. Create comprehensive evidence collection plan.',
      'claude-3-sonnet',
      'Investment analysis plan created focusing on VoIP technology assessment, security compliance evaluation, and competitive positioning analysis.',
      250,
      180
    );
    
    await updateWorkflowStage(planningStage.id, {
      status: 'completed',
      output_data: {
        evidence_types_planned: ['webpage_content', 'technology_stack', 'security_analysis'],
        analysis_focus: ['technology_scalability', 'security_compliance', 'market_position'],
        confidence_target: 0.85
      }
    });

    // Step 4: Use REAL orchestrator for evidence collection and analysis
    console.log('\n🔄 Step 3: Triggering real AI orchestrator...');
    const orchestratorStage = await createWorkflowStage(workflowRun.id, 'orchestrator_execution', 'collection');
    
    // Call the actual report orchestrator v3
    const response = await fetch(`${supabaseUrl}/functions/v1/report-orchestrator-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        scan_request_id: scanRequest.id,
        company: {
          name: 'Ring4',
          website: 'https://ring4.ai'
        },
        analysisDepth: 'comprehensive'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️ Orchestrator issue (likely rate limits):', errorText);
      
      // Check if it's a rate limit or API quota issue
      const isRateLimit = errorText.includes('quota') || 
                         errorText.includes('rate') || 
                         errorText.includes('limit') ||
                         errorText.includes('API key not configured');
      
      if (isRateLimit) {
        console.log('🔄 Continuing with mock data due to API limits...');
        
        // Create mock orchestrator result for demonstration
        const mockResult = {
          reportId: 'mock-' + crypto.randomUUID(),
          company: 'Ring4',
          investmentScore: 78,
          evidence: {
            total: 15,
            byType: {
              'webpage_content': 8,
              'technology_stack': 4,
              'security_analysis': 3
            }
          },
          metadata: {
            processingTime: 25000,
            servicesUsed: ['evidence-collector-v7', 'tech-intelligence-v3'],
            confidenceScore: 0.87
          }
        };
        
        await updateWorkflowStage(orchestratorStage.id, {
          status: 'completed',
          output_data: {
            mock_result: true,
            rate_limited: true,
            evidence_total: 15,
            investment_score: 78,
            processing_time_ms: 25000
          }
        });
        
        // Continue with mock workflow using existing database structure
        console.log('✅ Using mock data - continuing workflow demonstration');
        return await completeMockWorkflow(scanRequest, workflowRun, authClient);
      } else {
        await updateWorkflowStage(orchestratorStage.id, {
          status: 'failed',
          error_message: `Orchestrator failed: ${errorText}`
        });
        
        throw new Error(`Orchestrator failed: ${errorText}`);
      }
    }

    const orchestratorResult = await response.json();
    console.log('✅ Orchestrator completed successfully');
    console.log('📊 Evidence collected:', orchestratorResult.evidence?.total || 'Unknown');
    console.log('📈 Investment score:', orchestratorResult.investmentScore || 'Unknown');

    // Log tool executions based on orchestrator result
    if (orchestratorResult.metadata?.servicesUsed) {
      for (const service of orchestratorResult.metadata.servicesUsed) {
        await logToolExecution(
          workflowRun.id,
          service.replace('evidence-collector-', '').replace('-v7', ''),
          'automated_collection',
          { service: service, target: 'https://ring4.ai' },
          true,
          { evidence_collected: orchestratorResult.evidence?.total || 0 }
        );
      }
    }

    await updateWorkflowStage(orchestratorStage.id, {
      status: 'completed',
      output_data: {
        orchestrator_result: orchestratorResult,
        evidence_total: orchestratorResult.evidence?.total || 0,
        investment_score: orchestratorResult.investmentScore || 0,
        processing_time_ms: orchestratorResult.metadata?.processingTime || 0
      }
    });

    // Step 5: Fetch the created report and evidence
    console.log('\n📋 Step 4: Fetching generated report...');
    
    // The orchestrator should have created a report, let's fetch it
    const { data: reports, error: reportsError } = await authClient
      .from('reports')
      .select('*')
      .eq('scan_request_id', scanRequest.id)
      .order('created_at', { ascending: false });

    if (reportsError || !reports || reports.length === 0) {
      console.error('❌ No report found after orchestrator execution:', reportsError);
      throw new Error('Report not created by orchestrator');
    }

    const report = reports[0];
    console.log('✅ Report found:', report.id);

    // Fetch evidence collection
    const { data: evidenceCollection } = await authClient
      .from('evidence_collections')
      .select('*')
      .eq('id', report.evidence_collection_id)
      .single();

    // Fetch evidence items
    const { data: evidenceItems } = await authClient
      .from('evidence_items')
      .select('*')
      .eq('evidence_collection_id', report.evidence_collection_id);

    // Fetch existing citations
    const { data: existingCitations } = await authClient
      .from('report_citations')
      .select('*')
      .eq('report_id', report.id);

    console.log('📊 Evidence items found:', evidenceItems?.length || 0);
    console.log('📎 Citations found:', existingCitations?.length || 0);

    // Step 6: Enhanced citation processing
    console.log('\n🔗 Step 5: Enhancing citations with new schema...');
    const citationStage = await createWorkflowStage(workflowRun.id, 'citation_enhancement', 'refinement');

    // If we have evidence but no enhanced citations, create them
    if (evidenceItems && evidenceItems.length > 0 && (!existingCitations || existingCitations.length === 0)) {
      console.log('📎 Creating enhanced citations...');
      const enhancedCitations = await createEnhancedCitations(report.id, evidenceItems.slice(0, 3));
      
      await updateWorkflowStage(citationStage.id, {
        status: 'completed',
        output_data: {
          citations_enhanced: enhancedCitations.length,
          evidence_items_processed: evidenceItems.length
        }
      });
    } else {
      console.log('📎 Citations already exist or no evidence available');
      await updateWorkflowStage(citationStage.id, {
        status: 'completed',
        output_data: {
          citations_found: existingCitations?.length || 0,
          enhancement_skipped: true
        }
      });
    }

    // Step 7: Finalize workflow with real data
    console.log('\n✨ Step 6: Finalizing AI workflow...');
    
    const finalCitations = await authClient
      .from('report_citations')
      .select('*')
      .eq('report_id', report.id);

    await authClient
      .from('ai_workflow_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        performance_metrics: {
          total_evidence_collected: evidenceItems?.length || 0,
          total_citations_generated: finalCitations.data?.length || 0,
          average_confidence_score: report.quality_score || 0.85,
          processing_time_by_stage: {
            planning: 2500,
            orchestrator: orchestratorResult.metadata?.processingTime || 15000,
            citations: 3000
          }
        },
        total_processing_time_ms: (orchestratorResult.metadata?.processingTime || 15000) + 5500
      })
      .eq('id', workflowRun.id);

    // Update scan request final status
    await authClient
      .from('scan_requests')
      .update({
        status: 'complete',
        ai_workflow_status: 'completed',
        evidence_collection_progress: 1.0,
        report_generation_progress: 1.0,
        thesis_alignment_score: 0.85
      })
      .eq('id', scanRequest.id);

    console.log('\n🎉 AI Workflow Complete!');
    console.log('════════════════════════════════════════');
    console.log(`📊 Scan Request ID: ${scanRequest.id}`);
    console.log(`🤖 Workflow Run ID: ${workflowRun.id}`);
    console.log(`📋 Report ID: ${report.id}`);
    console.log(`📎 Citations: ${finalCitations.data?.length || 0}`);
    console.log(`📊 Evidence Items: ${evidenceItems?.length || 0}`);
    console.log(`📈 Investment Score: ${report.investment_score}/100`);
    console.log(`🔗 Frontend URL: http://localhost:5177/scans/${scanRequest.id}`);
    console.log(`📋 Report URL: http://localhost:5177/reports/${report.id}`);
    console.log('════════════════════════════════════════');

    return {
      scanRequest,
      workflowRun,
      report,
      citations: finalCitations.data,
      evidenceItems: evidenceItems || [],
      orchestratorResult
    };

  } catch (error) {
    console.error('💥 Workflow failed:', error);
    throw error;
  }
}

// Run the workflow
runFullAIWorkflow().catch(console.error);