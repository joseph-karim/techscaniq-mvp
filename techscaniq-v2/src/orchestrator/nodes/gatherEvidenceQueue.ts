import { ResearchState, Evidence } from '../../types';
import { queues, JobPriority } from '../../services/queue/index';
import { config } from '../../config';
import { EvidenceCollectorIntegration } from '../../tools/evidenceCollectorIntegration';

/**
 * Enhanced evidence gathering node that uses queue system when available
 */
export async function gatherEvidenceQueueNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('📊 Gathering evidence with queue system...');
  
  try {
    const { thesis, metadata, researchQuestions } = state;
    const queries = metadata?.currentQueries || {};
    
    if (Object.keys(queries).length === 0) {
      console.log('No queries to process');
      return {};
    }

    // Use evidence collector integration for comprehensive gathering
    const evidenceCollector = new EvidenceCollectorIntegration();
    
    // First, use crawl4ai and Skyvern for deep evidence collection
    console.log('🕷️ Starting comprehensive evidence collection...');
    
    const comprehensiveEvidence = await evidenceCollector.collectComprehensiveEvidence(
      thesis.companyWebsite || thesis.website || thesis.company,
      thesis.statement
    );
    
    // Then, queue additional searches for specific queries
    const searchJobs = [];
    
    for (const [pillarId, pillarQueries] of Object.entries(queries)) {
      for (const queryObj of pillarQueries as any[]) {
        // Find matching research question
        const question = researchQuestions.find(q => 
          q.pillarId === pillarId && q.question.includes(queryObj.query)
        );
        
        if (question) {
          const job = await queues.search.add(
            'search',
            {
              query: queryObj.query,
              type: queryObj.type || 'web',
              pillarId: pillarId,
              questionId: question.id,
              options: {
                limit: 10,
                dateRange: queryObj.filters?.dateRange,
              },
            },
            {
              priority: question.priority === 'high' ? JobPriority.HIGH : JobPriority.NORMAL,
            }
          );
          
          searchJobs.push(job);
        }
      }
    }
    
    console.log(`📋 Queued ${searchJobs.length} search jobs`);
    
    // Queue quality evaluation for comprehensive evidence
    const qualityJobs = [];
    for (const evidence of comprehensiveEvidence) {
      const job = await queues.quality.add(
        'evaluate',
        {
          evidence,
          context: {
            researchQuestion: 'Comprehensive evidence collection',
            pillarName: evidence.pillarId,
            thesisStatement: thesis.statement,
          },
        },
        {
          priority: JobPriority.NORMAL,
        }
      );
      qualityJobs.push(job);
    }
    
    console.log(`🎯 Queued ${qualityJobs.length} quality evaluation jobs`);
    
    // Update metadata with job information
    return {
      evidence: [...state.evidence, ...comprehensiveEvidence],
      metadata: {
        ...state.metadata,
        lastEvidenceGathering: new Date(),
        evidenceStats: {
          total: state.evidence.length + comprehensiveEvidence.length,
          byPillar: calculatePillarStats([...state.evidence, ...comprehensiveEvidence]),
        },
        queuedJobs: {
          search: searchJobs.map(j => j.id).filter((id): id is string => id !== undefined),
          quality: qualityJobs.map(j => j.id).filter((id): id is string => id !== undefined),
        },
      },
    };
  } catch (error) {
    console.error('❌ Evidence gathering with queues failed:', error);
    return {
      errors: [...state.errors, {
        timestamp: new Date(),
        phase: 'gather_evidence_queue',
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
      }],
    };
  }
}

function calculatePillarStats(evidence: Evidence[]): Record<string, number> {
  const stats: Record<string, number> = {};
  evidence.forEach(e => {
    stats[e.pillarId] = (stats[e.pillarId] || 0) + 1;
  });
  return stats;
}