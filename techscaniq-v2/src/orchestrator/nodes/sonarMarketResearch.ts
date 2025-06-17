import { ResearchState } from '../../types';
import { sonarResearch, MarketInsights } from '../../tools/sonarDeepResearch';
import { config } from '../../config';

interface SonarNodeConfig {
  maxWaitTime?: number;
  pollInterval?: number;
  costLimit?: number;
}

/**
 * Initiates Sonar Deep Research for comprehensive market analysis
 */
export async function sonarMarketResearchNode(
  state: ResearchState,
  config?: SonarNodeConfig
): Promise<Partial<ResearchState>> {
  console.log('🔍 Starting Sonar Deep Research for market intelligence...');
  
  const { thesis } = state;
  
  try {
    // Skip if already completed or in progress
    if (state.metadata?.sonarStatus === 'completed' || state.metadata?.sonarJobId) {
      console.log('ℹ️ Sonar research already initiated');
      return {};
    }
    
    // Determine focus areas based on thesis type
    const focusAreas = determineFocusAreas(thesis);
    
    // Submit async research request
    const jobId = await sonarResearch.submitResearch(
      thesis.company,
      (thesis as any).companyWebsite || (thesis as any).website || thesis.company,
      thesis.type || 'growth',
      focusAreas
    );
    
    return {
      metadata: {
        ...state.metadata,
        sonarJobId: jobId,
        sonarStatus: 'processing',
        // Start time tracked internally
      }
    };
    
  } catch (error) {
    console.error('❌ Sonar research submission failed:', error);
    
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'sonar_market_research',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning', // Not critical - can fallback to web search
      }],
      metadata: {
        ...state.metadata,
        sonarStatus: 'failed',
      }
    };
  }
}

/**
 * Polls and collects Sonar research results
 */
export async function sonarResultCollectorNode(
  state: ResearchState,
  config?: SonarNodeConfig
): Promise<Partial<ResearchState>> {
  const { sonarJobId, sonarStatus } = state.metadata || {};
  
  if (!sonarJobId || sonarStatus === 'completed' || sonarStatus === 'failed') {
    return {};
  }
  
  console.log('📊 Checking Sonar research status...');
  
  try {
    const result = await sonarResearch.getResults(sonarJobId);
    
    if (result.status === 'COMPLETED') {
      console.log('✅ Sonar research completed!');
      
      // Parse results into evidence
      const marketEvidence = sonarResearch.parseToEvidence(result);
      console.log(`📚 Extracted ${marketEvidence.length} evidence items from Sonar`);
      
      // Extract market insights
      const marketInsights = sonarResearch.extractInsights(result);
      
      // Calculate cost
      const cost = sonarResearch.calculateCost(result.response?.usage);
      console.log(`💰 Sonar research cost: $${cost.toFixed(2)}`);
      
      // Check cost limit
      if (config?.costLimit && cost > config.costLimit) {
        console.warn(`⚠️ Sonar cost ($${cost.toFixed(2)}) exceeded limit ($${config.costLimit})`);
      }
      
      // Update evidence with proper pillar mapping
      const mappedEvidence = marketEvidence.map(e => ({
        ...e,
        researchQuestionId: findMatchingQuestion(e, state.researchQuestions || state.questions || []),
      }));
      
      return {
        evidence: [...state.evidence, ...mappedEvidence],
        metadata: {
          ...state.metadata,
          sonarStatus: 'completed',
          // Completion time tracked internally
          sonarCost: cost,
          sonarUsage: result.response?.usage,
          marketInsights,
          // Add insights to help guide technical research
          marketContext: {
            targetCustomerSize: state.metadata?.marketContext?.targetCustomerSize || 'Mid-Market',
            primaryBuyers: state.metadata?.marketContext?.primaryBuyers || [],
            technicalSophistication: state.metadata?.marketContext?.technicalSophistication || 'Medium',
            industryNorms: state.metadata?.marketContext?.industryNorms || {
              typicalTechStack: [],
              commonIntegrations: [],
              regulatoryRequirements: [],
            },
            competitiveContext: state.metadata?.marketContext?.competitiveContext || {
              marketLeader: 'Unknown',
              marketLeaderShare: 0,
              typicalFeatures: [],
            },
            competitors: marketInsights?.competitors?.map((c: any) => c.name) || [],
          }
        }
      };
    }
    
    if (result.status === 'FAILED') {
      throw new Error(`Sonar research failed: ${result.error_message}`);
    }
    
    // Still processing
    console.log(`⏳ Sonar research still ${result.status}...`);
    return {
      metadata: {
        ...state.metadata,
        sonarLastChecked: new Date(),
      }
    };
    
  } catch (error) {
    console.error('❌ Sonar result collection failed:', error);
    
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'sonar_result_collection',
        error: error instanceof Error ? error.message : String(error),
        severity: 'warning',
      }],
      metadata: {
        ...state.metadata,
        sonarStatus: 'failed',
      }
    };
  }
}

/**
 * Wait for Sonar completion with timeout
 */
export async function waitForSonarCompletion(
  state: ResearchState,
  config?: SonarNodeConfig
): Promise<Partial<ResearchState>> {
  const { sonarJobId, sonarStatus } = state.metadata || {};
  
  if (!sonarJobId || sonarStatus === 'completed' || sonarStatus === 'failed') {
    return {};
  }
  
  try {
    const result = await sonarResearch.waitForCompletion(
      sonarJobId,
      config?.maxWaitTime || 600000,  // 10 minutes default
      config?.pollInterval || 10000    // 10 seconds default
    );
    
    // Process results same as collector node
    return sonarResultCollectorNode({
      ...state,
      metadata: {
        ...state.metadata,
        sonarJobId,
      }
    }, config);
    
  } catch (error) {
    console.error('❌ Sonar completion wait failed:', error);
    
    return {
      metadata: {
        ...state.metadata,
        sonarStatus: 'timeout',
      }
    };
  }
}

// Helper functions

function determineFocusAreas(thesis: any): string[] {
  const focusAreas: string[] = [];
  
  // Add focus areas based on thesis type
  switch (thesis.type) {
    case 'accelerate-growth':
      focusAreas.push(
        'Customer acquisition strategies and CAC/LTV metrics',
        'Product-market fit indicators and NPS scores',
        'Sales velocity and pipeline metrics'
      );
      break;
      
    case 'margin-expansion':
      focusAreas.push(
        'Cost structure and operational efficiency metrics',
        'Gross margin trends and improvement opportunities',
        'Automation and process optimization potential'
      );
      break;
      
    case 'market-expansion':
      focusAreas.push(
        'Geographic expansion opportunities and barriers',
        'Adjacent market opportunities and TAM',
        'Localization requirements and costs'
      );
      break;
      
    case 'turnaround':
      focusAreas.push(
        'Root causes of current challenges',
        'Competitor recovery strategies and precedents',
        'Quick win opportunities and cost reduction areas'
      );
      break;
  }
  
  // Add pillar-specific focus areas
  thesis.pillars.forEach((pillar: any) => {
    if (pillar.weight > 0.3) { // High-weight pillars
      switch (pillar.id) {
        case 'market-position':
          focusAreas.push('Detailed competitive analysis with market share data');
          break;
        case 'financial-performance':
          focusAreas.push('Unit economics breakdown and cohort analysis');
          break;
        case 'team-organization':
          focusAreas.push('Leadership team track record and key hires/departures');
          break;
      }
    }
  });
  
  return focusAreas;
}

function findMatchingQuestion(evidence: any, questions: any[]): string {
  // Try to match evidence to research questions based on content
  for (const question of questions) {
    const keywords = question.keywords || [];
    const content = evidence.content.toLowerCase();
    
    if (keywords.some((keyword: string) => content.includes(keyword.toLowerCase()))) {
      return question.id;
    }
  }
  
  // Fallback to pillar-based matching
  const pillarQuestion = questions.find(q => q.pillarId === evidence.pillarId);
  return pillarQuestion?.id || '';
}

/**
 * Check if we should use Sonar for this research
 */
export function shouldUseSonar(state: ResearchState): boolean {
  const { thesis } = state;
  
  // Always use for investment DD
  const thesisType = thesis.type;
  if (thesisType && (thesisType === 'growth' || 
      thesisType === 'efficiency' ||
      thesisType === 'innovation')) {
    return true;
  }
  
  // Use for high-value targets
  const highValuePillars = thesis.pillars.filter((p: any) => p.weight > 0.25);
  if (highValuePillars.length >= 2) {
    return true;
  }
  
  // Skip for quick scans or technical-only analysis
  if (thesisType === 'custom' && (thesis as any).customThesis?.includes('quick')) {
    return false;
  }
  
  return true;
}