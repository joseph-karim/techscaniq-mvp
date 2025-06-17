import { ResearchState } from '../../types';
import { sonarResearch } from '../../tools/sonarDeepResearch';

/**
 * Sonar Research Node
 * 
 * This node performs comprehensive market research using Perplexity's Sonar Deep Research API.
 * It's designed to gather the bulk of investment-relevant information in a single, thorough pass.
 */
export async function sonarResearchNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('🔬 Starting Sonar Deep Research...');
  
  try {
    const { thesis, metadata } = state;
    const reportType = metadata?.reportType || 'pe-due-diligence';
    
    // Extract investment focus areas based on report type
    const focusAreas = getInvestmentFocusAreas(reportType, thesis);
    
    console.log(`📊 Report Type: ${reportType}`);
    console.log(`🎯 Focus Areas: ${focusAreas.join(', ')}`);
    
    // Submit the research job
    const jobId = await sonarResearch.submitResearch(
      thesis.company,
      thesis.website || '',
      determineThesisType(thesis),
      focusAreas
    );
    
    console.log(`📝 Sonar job submitted: ${jobId.substring(0, 20)}...`);
    
    // Update state with job ID
    return {
      sonarJobId: jobId,
      status: 'sonar_submitted',
      metadata: {
        ...state.metadata,
        sonarStatus: 'submitted',
        sonarSubmittedAt: new Date(),
      },
    };
    
  } catch (error) {
    console.error('❌ Sonar research submission failed:', error);
    return {
      status: 'failed',
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'sonar_research',
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
      }],
    };
  }
}

/**
 * Sonar Results Node
 * 
 * This node polls for and processes Sonar research results.
 */
export async function sonarResultsNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('⏳ Checking Sonar research status...');
  
  try {
    const { sonarJobId } = state;
    if (!sonarJobId) {
      throw new Error('No Sonar job ID found');
    }
    
    // Wait for completion with extended timeout for deep research
    const result = await sonarResearch.waitForCompletion(
      sonarJobId,
      1200000, // 20 minutes for deep research
      15000    // Check every 15 seconds
    );
    
    // Parse results into evidence
    const evidence = sonarResearch.parseToEvidence(result);
    console.log(`✅ Sonar research completed: ${evidence.length} evidence items extracted`);
    
    // Extract market insights
    const marketInsights = sonarResearch.extractInsights(result);
    
    // Calculate research cost
    const cost = sonarResearch.calculateCost(result.response?.usage);
    console.log(`💰 Research cost: $${cost.toFixed(2)}`);
    
    return {
      evidence: [...(state.evidence || []), ...evidence],
      status: 'sonar_processing',
      sonarInsights: {
        evidence,
        summary: result.response?.choices[0]?.message.content || '',
        marketData: marketInsights,
      },
      metadata: {
        ...state.metadata,
        sonarStatus: 'completed',
        sonarCompletedAt: new Date(),
        sonarCost: cost,
        sonarStats: {
          searchQueries: result.response?.usage?.num_search_queries || 0,
          reasoningTokens: result.response?.usage?.reasoning_tokens || 0,
          citations: result.response?.citations?.length || 0,
        },
      },
    };
    
  } catch (error) {
    console.error('❌ Sonar results processing failed:', error);
    
    // Check if it's a timeout
    if (error instanceof Error && error.message.includes('timed out')) {
      return {
        status: 'sonar_processing',
        metadata: {
          ...state.metadata,
          sonarLastChecked: new Date(),
        },
      };
    }
    
    return {
      status: 'failed',
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'sonar_results',
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
      }],
    };
  }
}

/**
 * Determine investment focus areas based on report type
 */
function getInvestmentFocusAreas(
  reportType: 'sales-intelligence' | 'pe-due-diligence',
  thesis: any
): string[] {
  if (reportType === 'pe-due-diligence') {
    // PE focus areas aligned with investment thesis
    const baseFocusAreas = [
      'Revenue growth and financial performance',
      'Market size (TAM/SAM/SOM) and growth rates',
      'Competitive positioning and market share',
      'Customer acquisition and retention metrics',
      'Unit economics (LTV/CAC) and profitability',
      'Management team and organizational capability',
      'Technology scalability and technical debt',
      'Strategic partnerships and M&A opportunities',
    ];
    
    // Add thesis-specific focus areas
    if (thesis.statement.toLowerCase().includes('organic growth')) {
      baseFocusAreas.push(
        'Organic growth drivers and scalability',
        'Product-market fit and expansion potential',
        'Go-to-market efficiency and sales velocity'
      );
    }
    
    if (thesis.statement.toLowerCase().includes('buy-and-build')) {
      baseFocusAreas.push(
        'Acquisition targets and consolidation opportunities',
        'Integration capabilities and track record',
        'Platform potential for bolt-on acquisitions'
      );
    }
    
    return baseFocusAreas;
  }
  
  // Sales Intelligence focus areas
  return [
    'Current technology stack and integration ecosystem',
    'Strategic initiatives and digital transformation plans',
    'Budget cycles and procurement processes',
    'Key decision makers and organizational structure',
    'Competitive vendor relationships and satisfaction',
    'Technology gaps and modernization needs',
    'Recent RFPs and vendor selection criteria',
    'Business priorities and pain points',
  ];
}

/**
 * Determine thesis type from the investment statement
 */
function determineThesisType(thesis: any): string {
  const statement = thesis.statement.toLowerCase();
  
  if (statement.includes('organic growth') || statement.includes('accelerate growth')) {
    return 'accelerate-growth';
  }
  
  if (statement.includes('margin expansion') || statement.includes('operational efficiency')) {
    return 'margin-expansion';
  }
  
  if (statement.includes('market expansion') || statement.includes('geographic')) {
    return 'market-expansion';
  }
  
  if (statement.includes('turnaround') || statement.includes('restructuring')) {
    return 'turnaround';
  }
  
  if (statement.includes('buy-and-build') || statement.includes('consolidation')) {
    return 'buy-and-build';
  }
  
  return 'accelerate-growth'; // Default
}