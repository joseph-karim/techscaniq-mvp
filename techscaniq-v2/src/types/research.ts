// Research types for unified orchestration

export interface InvestmentThesis {
  company: string;
  description: string;
  pePartner?: string;
  investmentAmount?: number;
  targetHoldPeriod?: number;
}

export interface SalesIntelligenceContext {
  company: string;
  offering: string;
  idealCustomerProfile: {
    industry?: string;
    companySize?: string;
    geography?: string;
    techStack?: string[];
    painPoints?: string[];
  };
  useCases: string[];
  budgetRange?: {
    min: number;
    max: number;
    currency: string;
  };
  decisionCriteria?: string[];
  competitiveAlternatives?: string[];
  evaluationTimeline?: string;
}

export interface ResearchParams {
  company: string;
  thesis?: InvestmentThesis;
  salesContext?: SalesIntelligenceContext;
  reportType: 'pe-due-diligence' | 'sales-intelligence';
  industry?: string;
}

export interface ResearchResult {
  reportType: string;
  sections: Record<string, ReportSection>;
  overallScore: number;
  evidence: Evidence[];
  thesisValidation?: ThesisValidation;
  salesValidation?: SalesValidation;
  alignmentScore?: ThesisAlignmentScore;
  metadata: {
    generatedAt: string;
    evidenceCount: number;
    coverage: number;
    thesisAlignmentScore?: number;
  };
}

export interface SalesValidation {
  productMarketFit: boolean;
  fitScore: number;
  keyStrengths: string[];
  gaps: string[];
  competitiveAdvantages: string[];
  recommendedApproach: string[];
}

export interface ReportSection {
  title: string;
  content: string;
  evidence: Evidence[];
  score: number;
  thesisAlignment?: number;
}

export interface ThesisPillar {
  id: string;
  name: string;
  weight: number;
  keyTerms: string[];
  keywords?: string[];
}

export interface ResearchQuestion {
  id: string;
  pillarId: string;
  question: string;
  priority: number;
  marketDependent?: boolean;
}

export interface PrioritizedPlan {
  pillars: ThesisPillar[];
  questions: ResearchQuestion[];
  queries: string[];
  urls: string[];
  products: string[];
  documents: string[];
  company: string;
}

export interface Evidence {
  id: string;
  source: EvidenceSource;
  type: EvidenceType;
  title: string;
  content: string;
  url?: string;
  confidence: number;
  relevanceScore: number;
  thesisPillarId?: string;
  citations: Citation[];
  metadata: EvidenceMetadata;
}

export interface EvidenceMetadata {
  timestamp?: string;
  lastModified?: string;
  qualityScore?: number;
  credibilityScore?: number;
  relevanceScore?: number;
  thesisAlignment?: number;
  supports?: boolean;
  contradicts?: boolean;
  [key: string]: any;
}

export type EvidenceSource = 
  | 'perplexity' 
  | 'crawl4ai' 
  | 'skyvern' 
  | 'claude' 
  | 'publicData' 
  | 'sec' 
  | 'crunchbase' 
  | 'manual'
  | 'deepResearch'
  | 'technicalAnalysis'
  | 'marketIntelligence';

export type EvidenceType = 
  | 'document' 
  | 'webpage' 
  | 'product' 
  | 'analysis' 
  | 'financial' 
  | 'market' 
  | 'technical';

export interface Citation {
  text: string;
  url?: string;
  page?: number;
}

export interface ResearchGap {
  id: string;
  pillarId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions?: string[];
}

export interface ThesisAlignmentScore {
  overallAlignment: number;
  pillarScores: Record<string, number>;
  supportingEvidence: Evidence[];
  contradictingEvidence: Evidence[];
  gaps: string[];
  recommendations: string[];
}

export interface ThesisValidation {
  validated: boolean;
  confidenceLevel: number;
  keyFindings: string[];
  risks: string[];
  opportunities: string[];
  recommendedActions: string[];
}

export interface MarketContext {
  industry: string;
  sector: string;
  geography: string;
  marketMaturity: 'emerging' | 'growth' | 'mature' | 'declining';
  competitiveDynamics: string;
  regulatoryEnvironment: string;
}