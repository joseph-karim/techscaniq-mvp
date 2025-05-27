// Executive Report Data Types for Comprehensive Investor-Aligned Assessment

export interface InvestorProfile {
  firmName: string
  website: string
  supplementalLinks?: {
    crunchbase?: string
    linkedin?: string
    portfolio?: string
    blog?: string
  }
  overview: {
    type: string // PE/VC
    headquarters: string
    yearFounded?: string
    aum?: string
    fundStage?: string
  }
  investmentThesis: {
    targetCompanySize: string
    sectorFocus: string[]
    revenueProfile: string
    holdingPeriod?: string
    valueCreationStrategy: string[]
    operatingPlaybook: string[]
  }
  technologyLens: {
    digitalTransformationEmphasis: boolean
    preferences: string[]
    priorCaseStudies?: string[]
  }
  portfolioAnalysis?: {
    keyCompanies: string[]
    commonTechThemes: string[]
    maturityPatterns: string[]
  }
}

export interface ExecutiveAssessment {
  overallAssessment: string
  summaryScores: {
    category: string
    score: number // 0-100%
    rationale: string
  }[]
  strategicRecommendations: string[]
  keyFindings: {
    enablers: string[]
    blockers: string[]
    risks: string[]
  }
}

export interface TemporalIntelligence {
  stackEvolution: {
    year: string
    change: string
    signalType: 'verified' | 'inferred' | 'partial'
    confidence: number
    source: string
  }[]
}

export interface TechnicalLeadership {
  founders: {
    name: string
    role: string
    background: string
    techStrength: 'high' | 'medium' | 'low'
    confidence: number
    source: string
  }[]
  teamAssessment: {
    teamSize: number
    engineeringDepth: string
    innovationCulture: string
    rdProcesses: string
  }
}

export interface StackArchitecture {
  layers: {
    layer: string
    technology: string
    purpose: string
    confidence: number
    source: string
  }[]
  diagram?: string
  scalabilityAssessment: string
  modernizationNeeds: string[]
}

export interface CloudVendorDependencies {
  services: {
    service: string
    vendor: string
    function: string
    dependencyRisk: 'high' | 'medium' | 'low'
    confidence: number
    source: string
  }[]
  redundancyAssessment: string
  costOptimizationOpportunities: string[]
}

export interface AICapabilities {
  currentFeatures: {
    model: string
    version?: string
    type: string
    purpose: string
    deployedIn: string
    responsibleAIScore: number
    confidence: number
    source: string
  }[]
  roadmapPotential: {
    feature: string
    complexity: 'low' | 'medium' | 'high'
    businessImpact: string
    timeframe: string
  }[]
}

export interface CodeQualitySignals {
  metrics: {
    testCoverage: string
    linterPresence: string
    buildReliability: string
    score: number
    confidence: number
    source: string
  }
  maintainabilityOutlook: string
  refactorPriorities: string[]
}

export interface DataArchitectureGovernance {
  components: {
    component: string
    tooling: string
    maturityLevel: 'basic' | 'intermediate' | 'advanced'
    confidence: number
    source: string
  }[]
  aiReadiness: number
  privacyCompliance: string[]
  governanceGaps: string[]
}

export interface RevenueAttribution {
  capabilities: {
    capability: string
    revenueTieIn: string
    businessImpact: string
    confidence: number
    source: string
  }[]
}

export interface DisasterRecoveryRedundancy {
  layers: {
    layer: string
    policy: string
    maturityLevel: 'none' | 'basic' | 'intermediate' | 'advanced'
    confidence: number
    source: string
  }[]
  bcpRisks: string[]
  recommendations: string[]
}

export interface PeerBenchmarking {
  competitors: {
    company: string
    stackScore: number
    aiScore: number
    infraCost: string
    integrationFit: 'high' | 'medium' | 'low'
    edge: string
  }[]
  positioning: string
}

export interface ExecutiveReport {
  id: string
  investorProfile: InvestorProfile
  targetCompany: {
    name: string
    website: string
    assessmentContext: 'diligence' | 'optimization' | 'exit-planning'
  }
  executiveAssessment: ExecutiveAssessment
  temporalIntelligence: TemporalIntelligence
  technicalLeadership: TechnicalLeadership
  stackArchitecture: StackArchitecture
  cloudVendorDependencies: CloudVendorDependencies
  aiCapabilities: AICapabilities
  codeQualitySignals: CodeQualitySignals
  dataArchitectureGovernance: DataArchitectureGovernance
  agentAutomationReadiness: {
    workflowDesign: 'high' | 'medium' | 'low'
    delegationReady: 'high' | 'medium' | 'low'
    modelHookability: 'high' | 'medium' | 'low'
    businessProcessFit: number
  }
  revenueAttribution: RevenueAttribution
  disasterRecoveryRedundancy: DisasterRecoveryRedundancy
  modularityComponentization: {
    layers: {
      layer: string
      modularityScore: number
      commentary: string
      confidence: number
    }[]
    flexibility: string
    pivotReadiness: string
  }
  shadowITLegacy: {
    findings: {
      finding: string
      riskLevel: 'high' | 'medium' | 'low'
      confidence: number
      source: string
    }[]
    phaseOutPriorities: string[]
  }
  integratabilityInteroperability: {
    systems: {
      system: string
      integrationFit: 'high' | 'medium' | 'low'
      notes: string
      confidence: number
    }[]
    maReadiness: string
  }
  peerBenchmarking: PeerBenchmarking
  sourceLog: {
    insightArea: string
    insight: string
    confidence: number
    source: string
    assumptions?: string
  }[]
  finalNarrativeSummary: {
    keyFindings: string[]
    strategicOpportunities: string[]
    techRisks: string[]
    nextSteps: string[]
  }
} 