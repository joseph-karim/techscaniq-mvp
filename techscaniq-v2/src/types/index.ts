export type ThesisType = 'growth' | 'efficiency' | 'innovation' | 'custom';

export interface InvestmentThesis {
  id: string;
  company: string;
  companyWebsite?: string;
  website: string; // Primary field
  statement: string;
  type: ThesisType;
  customThesis?: string;
  pillars: ThesisPillar[];
  successCriteria?: string[];
  riskFactors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThesisPillar {
  id: string;
  name: string;
  weight: number; // 0-1, sum of all weights = 1
  description: string;
  questions: string[];
  keyQuestions?: string[]; // Alias for questions
  metrics?: string[];
}

export interface ResearchQuestion {
  id: string;
  question: string;
  pillarId: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
}

export interface Evidence {
  id: string;
  researchQuestionId: string;
  pillarId: string;
  source: EvidenceSource;
  content: string;
  metadata: EvidenceMetadata;
  qualityScore: QualityScore;
  createdAt: Date;
}

export interface EvidenceSource {
  type: 'web' | 'document' | 'api' | 'database' | 'academic' | 'news';
  name: string;
  url?: string;
  credibilityScore: number; // 0-1
  publishDate?: Date;
  author?: string;
}

export interface EvidenceMetadata {
  extractedAt: Date;
  extractionMethod: string;
  wordCount: number;
  language: string;
  keywords: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  confidence?: number;
  llmAnalysis?: any; // For storing LLM analysis results
  section?: string; // For sonar deep research
}

export interface QualityScore {
  overall: number; // 0-1
  components: {
    relevance: number;
    credibility: number;
    recency: number;
    specificity: number;
    bias: number;
    depth?: number; // Optional depth score for comprehensive analysis
  };
  reasoning: string;
  missingInformation?: string[];
  suggestedFollowUp?: string[];
}

export interface Citation {
  id: string;
  evidenceId: string;
  reportSectionId: string;
  quote: string;
  context: string;
  pageNumber?: number;
  createdAt: Date;
}

export interface Report {
  id: string;
  thesisId: string;
  executiveSummary: string;
  investmentScore: number; // 0-100
  sections: ReportSection[];
  citations: Citation[];
  metadata: ReportMetadata;
  status: 'draft' | 'in_review' | 'final';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  pillarId: string;
  title: string;
  content: string;
  score: number; // 0-100
  weight: number;
  keyFindings: string[];
  risks: string[];
  opportunities: string[];
  order?: number; // For sorting sections
  metadata?: Record<string, any>; // Additional metadata
}

// Market Context Types
export interface MarketContext {
  targetCustomerSize: 'SMB' | 'Mid-Market' | 'Enterprise' | 'Developer' | 'Consumer';
  primaryBuyers: string[];
  technicalSophistication: 'Low' | 'Medium' | 'High';
  industryNorms: {
    typicalTechStack: string[];
    commonIntegrations: string[];
    regulatoryRequirements: string[];
  };
  competitiveContext: {
    marketLeader: string;
    marketLeaderShare: number;
    typicalFeatures: string[];
  };
  competitors?: string[]; // For sonar market research
}

export interface CompanyMarketSignals {
  customerRevenue?: number;
  avgContractValue?: number;
  customerCount?: number;
  targetIndustries?: string[];
  pricingModel?: string;
  salesCycle?: string;
  retentionRate?: number;
  growthStrategy?: string;
}

export interface ReportMetadata {
  evidenceCount: number;
  citationCount: number;
  averageQualityScore: number;
  researchDuration: number; // minutes
  iterationCount: number;
  modelVersions: Record<string, string>;
}

// LangGraph State Types
// Simplified Thesis type for examples
export interface Thesis {
  id?: string;
  statement: string;
  company: string;
  website?: string;
  type?: ThesisType;
  pillars: {
    id: string;
    name: string;
    weight: number;
    questions: string[];
    description?: string;
  }[];
  successCriteria?: string[];
  metadata?: {
    sector?: string;
    subSector?: string;
    investmentStage?: string;
    reportType?: 'sales-intelligence' | 'pe-due-diligence';
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResearchState {
  thesisId?: string;
  thesis: InvestmentThesis | Thesis;
  questions?: ResearchQuestion[]; // Support both naming conventions
  researchQuestions?: ResearchQuestion[];
  evidence: Evidence[];
  qualityScores?: Record<string, number>;
  reportSections?: Record<string, ReportSection>;
  citations?: Citation[];
  report?: {
    content: string;
    sections: ReportSection[];
    citations: Citation[];
  };
  iterationCount: number;
  evidenceCount?: number;
  maxIterations?: number;
  status: 'interpreting_thesis' | 'gathering_evidence' | 'evaluating_quality' | 'reflecting' | 'generating_report' | 'completed' | 'initializing' | 'researching' | 'evaluating' | 'refining' | 'generating' | 'complete' | 'sonar_submitted' | 'sonar_processing' | 'failed';
  errors?: ResearchError[];
  queuedJobs?: string[];
  nextSteps?: any;
  sonarJobId?: string;
  sonarInsights?: {
    evidence: any[];
    summary: string;
    marketData: any;
  };
  metadata?: {
    currentQueries?: Record<string, any[]>;
    lastEvidenceGathering?: Date;
    evidenceStats?: {
      total: number;
      byPillar: Record<string, number>;
    };
    qualityStats?: {
      averageQuality: number;
      highQualityCount: number;
      totalEvaluated: number;
      technicalEvidenceCount?: number;
    };
    gaps?: any[];
    pillarAnalysis?: Record<string, any>;
    lastReflection?: Date;
    reportGeneratedAt?: Date;
    reportStats?: {
      sections: number;
      totalCitations: number;
      evidenceUsed: number;
      marketContext?: string;
      completeness?: number;
      missingRequiredSections?: string[];
    };
    interpretation?: any;
    insights?: any;
    researchPriorities?: string[];
    successCriteria?: string[];
    nextSteps?: any;
    queuedJobs?: Record<string, string[]>;
    marketContext?: MarketContext;
    marketSignals?: CompanyMarketSignals;
    marketSpecificInsights?: string[];
    startTime?: Date;
    logs?: any[];
    useSonar?: boolean;
    useMarketContext?: boolean;
    reportType?: 'sales-intelligence' | 'pe-due-diligence';
    reportFormat?: string;
    sonarJobId?: string;
    sonarStatus?: string;
    sonarLastChecked?: Date;
  };
}

export interface ResearchError {
  timestamp: Date;
  phase: string;
  error: string;
  severity: 'warning' | 'error' | 'critical';
  metadata?: Record<string, any>;
}

// Job Queue Types
export interface ResearchJob {
  id: string;
  type: 'web_search' | 'document_analysis' | 'api_fetch' | 'quality_evaluation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  attempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}