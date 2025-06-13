import { Worker, Job, FlowProducer } from 'bullmq';
import { connection, queues, JobPriority } from '../index';
import { ResearchState, ResearchQuestion, Evidence } from '../../../types';

interface OrchestrationJobData {
  type: 'start_research' | 'gather_evidence' | 'evaluate_quality' | 'technical_analysis';
  stateId: string;
  data: any;
}

interface OrchestrationJobResult {
  success: boolean;
  stateId: string;
  results?: any;
  error?: string;
}

// Flow producer for creating job workflows
const flowProducer = new FlowProducer({ connection });

export const orchestrationWorker = new Worker<OrchestrationJobData, OrchestrationJobResult>(
  'orchestration-tasks',
  async (job: Job<OrchestrationJobData>) => {
    const { type, stateId, data } = job.data;
    
    console.log(`[Orchestration Worker] Processing ${type} for state ${stateId}`);
    
    try {
      await job.updateProgress(10);
      
      switch (type) {
        case 'start_research':
          return await handleStartResearch(job, stateId, data);
        
        case 'gather_evidence':
          return await handleGatherEvidence(job, stateId, data);
          
        case 'evaluate_quality':
          return await handleEvaluateQuality(job, stateId, data);
          
        case 'technical_analysis':
          return await handleTechnicalAnalysis(job, stateId, data);
          
        default:
          throw new Error(`Unknown orchestration type: ${type}`);
      }
      
    } catch (error) {
      console.error(`[Orchestration Worker] Error:`, error);
      
      await job.log(`Orchestration failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        stateId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

async function handleStartResearch(
  job: Job<OrchestrationJobData>,
  stateId: string,
  data: { company: string, website: string, thesisType: string, customThesis?: string }
): Promise<OrchestrationJobResult> {
  const { company, website, thesisType, customThesis } = data;
  
  await job.updateProgress(20);
  
  try {
    // Import and run the research graph
    const { runDeepResearch } = await import('../../../orchestrator/graph');
    
    await job.log(`Starting research for ${company} (${website})`);
    
    // Run the research
    const reportId = await runDeepResearch(company, website, thesisType, customThesis);
    
    await job.updateProgress(100);
    
    return {
      success: true,
      stateId,
      results: {
        reportId,
        company,
        website,
      },
    };
  } catch (error) {
    await job.log(`Research failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function handleGatherEvidence(
  job: Job<OrchestrationJobData>,
  stateId: string,
  data: { questions: ResearchQuestion[], thesis: any }
): Promise<OrchestrationJobResult> {
  const { questions, thesis } = data;
  
  await job.updateProgress(20);
  
  // Create a workflow for evidence gathering
  const searchJobs = questions.map(question => ({
    name: 'search',
    queueName: 'evidence-search',
    data: {
      query: question.question,
      type: 'web',
      pillarId: question.pillarId,
      questionId: question.id,
      options: { limit: 10 },
    },
    opts: {
      priority: question.priority === 'high' ? JobPriority.HIGH : JobPriority.NORMAL,
    },
  }));
  
  // Add search jobs to queue
  const flow = await flowProducer.add({
    name: 'evidence-gathering-flow',
    queueName: 'orchestration-tasks',
    data: { stateId, phase: 'evidence-gathering' },
    children: searchJobs,
  });
  
  await job.updateProgress(40);
  
  // Monitor search jobs
  const searchResults = [];
  let completedJobs = 0;
  
  // Wait for child jobs to complete
  const childrenValues = await job.getChildrenValues();
  
  for (const [jobId, result] of Object.entries(childrenValues)) {
    searchResults.push(result);
    completedJobs++;
    await job.updateProgress(40 + (completedJobs / searchJobs.length) * 40);
  }
  
  // Extract evidence from search results
  const allEvidence: Evidence[] = [];
  searchResults.forEach(result => {
    if (result.success && result.evidence) {
      allEvidence.push(...result.evidence);
    }
  });
  
  await job.updateProgress(90);
  
  // Queue document analysis for top results
  const analysisJobs = allEvidence
    .slice(0, 20) // Analyze top 20 results
    .map(evidence => 
      queues.analysis.add('analyze-content', {
        url: evidence.source.url,
        type: 'content',
      }, {
        priority: JobPriority.NORMAL,
      })
    );
  
  await Promise.all(analysisJobs);
  
  await job.updateProgress(100);
  
  return {
    success: true,
    stateId,
    results: {
      evidenceCount: allEvidence.length,
      searchJobsCompleted: completedJobs,
      analysisJobsQueued: analysisJobs.length,
    },
  };
}

async function handleEvaluateQuality(
  job: Job<OrchestrationJobData>,
  stateId: string,
  data: { evidence: Evidence[], context: any }
): Promise<OrchestrationJobResult> {
  const { evidence, context } = data;
  
  await job.updateProgress(20);
  
  // Create quality evaluation jobs
  const evaluationJobs = evidence.map((ev, index) => ({
    name: 'evaluate',
    queueName: 'quality-evaluation',
    data: {
      evidence: ev,
      context,
    },
    opts: {
      priority: JobPriority.NORMAL,
      delay: index * 100, // Stagger jobs by 100ms
    },
  }));
  
  // Add evaluation jobs to queue
  const flow = await flowProducer.add({
    name: 'quality-evaluation-flow',
    queueName: 'orchestration-tasks',
    data: { stateId, phase: 'quality-evaluation' },
    children: evaluationJobs,
  });
  
  await job.updateProgress(60);
  
  // Wait for evaluations to complete
  const evaluationResults = await job.getChildrenValues();
  
  await job.updateProgress(90);
  
  // Aggregate quality scores
  const qualityScores: Record<string, number> = {};
  let successfulEvaluations = 0;
  
  Object.values(evaluationResults).forEach((result: any) => {
    if (result.success && result.qualityScore) {
      qualityScores[result.evidenceId] = result.qualityScore.overall;
      successfulEvaluations++;
    }
  });
  
  await job.updateProgress(100);
  
  return {
    success: true,
    stateId,
    results: {
      evaluationsCompleted: successfulEvaluations,
      totalEvidence: evidence.length,
      averageQuality: Object.values(qualityScores).reduce((a, b) => a + b, 0) / successfulEvaluations,
      qualityScores,
    },
  };
}

async function handleTechnicalAnalysis(
  job: Job<OrchestrationJobData>,
  stateId: string,
  data: { urls: string[] }
): Promise<OrchestrationJobResult> {
  const { urls } = data;
  
  await job.updateProgress(20);
  
  // Create technical analysis jobs
  const techJobs = [];
  
  for (const url of urls) {
    // Tech stack detection
    techJobs.push(
      queues.analysis.add('tech-stack', {
        url,
        type: 'tech-stack',
      }, {
        priority: JobPriority.NORMAL,
      })
    );
    
    // Technical profile collection
    techJobs.push(
      queues.technical.add('technical-profile', {
        url,
        type: 'technical-profile',
      }, {
        priority: JobPriority.LOW,
      })
    );
  }
  
  await job.updateProgress(50);
  
  // Wait for jobs to be added
  const jobInstances = await Promise.all(techJobs);
  
  await job.updateProgress(80);
  
  // Log progress
  await job.log(`Queued ${techJobs.length} technical analysis jobs for ${urls.length} URLs`);
  
  await job.updateProgress(100);
  
  return {
    success: true,
    stateId,
    results: {
      urlsAnalyzed: urls.length,
      jobsQueued: techJobs.length,
      jobIds: jobInstances.map(j => j.id),
    },
  };
}

// Worker event handlers
orchestrationWorker.on('completed', (job) => {
  console.log(`[Orchestration Worker] Job ${job.id} completed successfully`);
});

orchestrationWorker.on('failed', (job, err) => {
  console.error(`[Orchestration Worker] Job ${job?.id} failed:`, err.message);
});

export default orchestrationWorker;