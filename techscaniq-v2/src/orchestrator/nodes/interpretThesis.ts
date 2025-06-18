import { ResearchState, ThesisPillar, InvestmentThesis } from '../../types';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models } from '../../config';
import { PROMPTS } from '../../prompts/structured-prompts';
import { ThesisInterpretationSchema, parseStructuredOutput } from '../../schemas/structured-outputs';

function generateThesisId(): string {
  return `thesis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Use Claude Opus 4 for orchestration as specified
const model = new ChatAnthropic({
  apiKey: config.ANTHROPIC_API_KEY,
  modelName: models.anthropic.claudeOpus4,
  temperature: 0.3,
  maxTokens: 8192, // Ensure we get complete responses
});

export async function interpretThesisNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('🎯 Interpreting investment thesis...');
  console.log(`   Company: ${state.thesis.company}`);
  console.log(`   Type: ${state.thesis.type}`);
  console.log(`   Custom Thesis: ${(state.thesis as any).customThesis?.substring(0, 100)}...`);
  
  try {
    const { thesis, metadata } = state;
    
    // For sales intelligence, use a simpler interpretation
    if (metadata?.reportType === 'sales-intelligence') {
      console.log('💼 Using sales intelligence quick interpretation...');
      
      const interpretation = {
        successFactors: [
          'Digital transformation initiatives requiring external expertise',
          'Technology stack alignment with vendor capabilities',
          'Budget availability for digital services'
        ],
        successCriteria: [
          'Active digital transformation projects',
          'Technology modernization needs',
          'Alignment with vendor service offerings'
        ],
        riskFactors: [
          'Existing vendor relationships',
          'Internal IT capabilities',
          'Budget constraints'
        ],
        keyMetrics: [
          { name: 'Digital Maturity Score', target: 'Medium to High', importance: 'high' },
          { name: 'Technology Stack Complexity', target: 'Enterprise-grade', importance: 'critical' }
        ],
        researchPriorities: [
          {
            area: 'Technology Infrastructure',
            rationale: 'Understand current tech stack and modernization needs',
            expectedEvidence: ['Current technology platforms', 'Digital initiatives', 'Tech challenges']
          },
          {
            area: 'Vendor Landscape',
            rationale: 'Identify existing partnerships and opportunities',
            expectedEvidence: ['Current technology vendors', 'Partnership gaps', 'Procurement process']
          }
        ]
      };
      
      // Skip the LLM call and return quickly
      const updatedThesis = {
        ...thesis,
        successCriteria: interpretation.successCriteria || [],
        riskFactors: interpretation.riskFactors || [],
        updatedAt: new Date(),
      };
      
      console.log('✅ Returning quick interpretation result');
      console.log(`   Questions generated: ${generateInitialQuestions(updatedThesis, interpretation).length}`);
      
      return {
        thesis: updatedThesis,
        researchQuestions: generateInitialQuestions(updatedThesis, interpretation),
        metadata: {
          ...state.metadata,
          interpretation,
        },
        status: 'researching' as const,
      };
    }
    
    // Use structured prompt system for other types
    const { system, prompt } = PROMPTS.thesisInterpretation;
    
    console.log('📤 Sending to Claude Opus 4...');
    const startTime = Date.now();
    
    const response = await model.invoke([
      new SystemMessage(system),
      new HumanMessage(prompt({
        ...thesis,
        id: thesis.id || generateThesisId(),
        website: (thesis as any).website || thesis.company,
        type: thesis.type || 'growth',
        createdAt: thesis.createdAt || new Date(),
        updatedAt: thesis.updatedAt || new Date(),
      } as InvestmentThesis)),
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`📥 Response received in ${duration}ms`);

    // Parse and validate structured output
    const interpretation = parseStructuredOutput(
      ThesisInterpretationSchema,
      response.content.toString()
    );

    // Update the thesis with the interpretation
    const updatedThesis = {
      ...thesis,
      successCriteria: interpretation.successCriteria || [],
      riskFactors: interpretation.riskFactors || [],
      updatedAt: new Date(),
    };

    // Generate initial research questions based on the interpretation
    const initialQuestions = generateInitialQuestions(updatedThesis, interpretation);

    console.log(`✅ Thesis interpreted:`);
    console.log(`   - ${interpretation.successFactors.length} success factors`);
    console.log(`   - ${interpretation.keyMetrics.length} key metrics`);
    console.log(`   - ${interpretation.riskFactors.length} risk factors`);
    console.log(`   - ${interpretation.researchPriorities.length} research priorities`);

    return {
      thesis: updatedThesis,
      researchQuestions: initialQuestions,
      metadata: {
        ...state.metadata,
        interpretation,
      },
      status: 'researching',
    };

  } catch (error) {
    console.error('❌ Thesis interpretation failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'interpret_thesis',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      }],
    };
  }
}

function generateInitialQuestions(thesis: any, interpretation: any): any[] {
  const questions: any[] = [];
  
  // Generate questions for each pillar based on research priorities
  interpretation.researchPriorities.forEach((priority: any) => {
    // Find matching pillar
    const matchingPillar = thesis.pillars.find((p: ThesisPillar) => 
      p.name.toLowerCase().includes(priority.area.toLowerCase()) ||
      priority.area.toLowerCase().includes(p.name.toLowerCase())
    );
    
    const pillarId = matchingPillar?.id || 'general';
    
    // Create questions based on expected evidence
    priority.expectedEvidence.forEach((evidence: string) => {
      questions.push({
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        question: `For ${thesis.company}: ${evidence}`,
        pillarId: pillarId,
        priority: 'high',
        status: 'pending',
        rationale: priority.rationale,
        createdAt: new Date(),
      });
    });
  });

  // Add questions based on key metrics
  interpretation.keyMetrics.forEach((metric: any, index: number) => {
    questions.push({
      id: `q_metric_${Date.now()}_${index}`,
      question: `What is ${thesis.company}'s ${metric.name} and how does it compare to ${metric.target}?`,
      pillarId: 'metrics',
      priority: metric.importance,
      status: 'pending',
      createdAt: new Date(),
    });
  });

  // Add questions based on success criteria
  thesis.successCriteria.forEach((criterion: string, index: number) => {
    questions.push({
      id: `q_sc_${Date.now()}_${index}`,
      question: `What evidence validates: ${criterion}?`,
      pillarId: 'success-criteria',
      priority: 'high',
      status: 'pending',
      createdAt: new Date(),
    });
  });

  // Add questions based on risk factors
  thesis.riskFactors.forEach((risk: string, index: number) => {
    questions.push({
      id: `q_rf_${Date.now()}_${index}`,
      question: `What evidence exists regarding risk: ${risk}?`,
      pillarId: 'risk-factors',
      priority: 'high',
      status: 'pending',
      createdAt: new Date(),
    });
  });

  return questions;
}