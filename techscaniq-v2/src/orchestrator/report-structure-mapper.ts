import { Evidence, InvestmentThesis, ThesisPillar } from '../types/research';
import { v4 as uuidv4 } from 'uuid';

// Report structure definitions
export interface ReportStructure {
  reportType: string;
  sections: ReportSection[];
  requiredEvidence: RequiredEvidence[];
}

export interface ReportSection {
  id: string;
  title: string;
  order: number;
  requiredEvidence: string[];
  thesisCritical: boolean;
  subsections?: ReportSubsection[];
}

export interface ReportSubsection {
  id: string;
  title: string;
  evidenceTypes: string[];
}

export interface RequiredEvidence {
  type: string;
  minCount: number;
  pillars?: string[];
}

// PE Due Diligence Report Structure
export const PE_DUE_DILIGENCE_STRUCTURE: ReportStructure = {
  reportType: 'pe-due-diligence',
  sections: [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      order: 1,
      requiredEvidence: ['market', 'financials', 'thesis', 'investment rationale'],
      thesisCritical: true,
      subsections: [
        { id: 'investment-thesis', title: 'Investment Thesis', evidenceTypes: ['thesis'] },
        { id: 'company-overview', title: 'Company Overview', evidenceTypes: ['company', 'financials'] },
        { id: 'key-findings', title: 'Key Findings', evidenceTypes: ['all'] },
        { id: 'recommendation', title: 'Investment Recommendation', evidenceTypes: ['analysis'] }
      ]
    },
    {
      id: 'scoring-analysis',
      title: 'Scoring Analysis',
      order: 2,
      requiredEvidence: ['technical', 'market', 'team', 'growth potential'],
      thesisCritical: true,
      subsections: [
        { id: 'overall-score', title: 'Overall Technology Score', evidenceTypes: ['technical', 'market'] },
        { id: 'dimension-scores', title: 'Dimension Scores', evidenceTypes: ['all'] },
        { id: 'thesis-alignment', title: 'Thesis Alignment Score', evidenceTypes: ['thesis'] },
        { id: 'benchmarking', title: 'Industry Benchmarking', evidenceTypes: ['market', 'competitive'] }
      ]
    },
    {
      id: 'deep-dive',
      title: 'Deep Dive',
      order: 3,
      requiredEvidence: ['architecture', 'scalability', 'platform capabilities'],
      thesisCritical: false,
      subsections: [
        { id: 'architecture-analysis', title: 'Architecture Analysis', evidenceTypes: ['technical', 'architecture'] },
        { id: 'scalability-assessment', title: 'Scalability Assessment', evidenceTypes: ['technical', 'performance'] },
        { id: 'platform-capabilities', title: 'Platform Capabilities', evidenceTypes: ['product', 'features'] },
        { id: 'integration-readiness', title: 'Integration Readiness', evidenceTypes: ['technical', 'api'] }
      ]
    },
    {
      id: 'technical-focus',
      title: 'Technical Focus',
      order: 4,
      requiredEvidence: ['stack', 'infrastructure', 'technical debt', 'modernization'],
      thesisCritical: false,
      subsections: [
        { id: 'tech-stack', title: 'Technology Stack', evidenceTypes: ['technical', 'stack'] },
        { id: 'infrastructure', title: 'Infrastructure & DevOps', evidenceTypes: ['technical', 'infrastructure'] },
        { id: 'technical-debt', title: 'Technical Debt Analysis', evidenceTypes: ['technical', 'debt'] },
        { id: 'modernization-roadmap', title: 'Modernization Roadmap', evidenceTypes: ['technical', 'roadmap'] }
      ]
    },
    {
      id: 'risk-register',
      title: 'Risk Register',
      order: 5,
      requiredEvidence: ['risks', 'mitigation', 'competitive threats'],
      thesisCritical: true,
      subsections: [
        { id: 'technical-risks', title: 'Technical Risks', evidenceTypes: ['technical', 'risks'] },
        { id: 'market-risks', title: 'Market Risks', evidenceTypes: ['market', 'competitive'] },
        { id: 'operational-risks', title: 'Operational Risks', evidenceTypes: ['operational', 'team'] },
        { id: 'mitigation-strategies', title: 'Mitigation Strategies', evidenceTypes: ['mitigation'] }
      ]
    },
    {
      id: 'value-creation',
      title: 'Value Creation',
      order: 6,
      requiredEvidence: ['opportunities', 'growth', 'M&A', 'synergies'],
      thesisCritical: true,
      subsections: [
        { id: 'growth-opportunities', title: 'Growth Opportunities', evidenceTypes: ['market', 'growth'] },
        { id: 'ma-opportunities', title: 'M&A Opportunities', evidenceTypes: ['ma', 'consolidation'] },
        { id: 'operational-improvements', title: 'Operational Improvements', evidenceTypes: ['operational'] },
        { id: 'exit-strategies', title: 'Exit Strategies', evidenceTypes: ['exit', 'valuation'] }
      ]
    },
    {
      id: 'evidence',
      title: 'Evidence',
      order: 7,
      requiredEvidence: [],
      thesisCritical: false,
      subsections: [
        { id: 'all-evidence', title: 'All Evidence', evidenceTypes: ['all'] }
      ]
    }
  ],
  requiredEvidence: [
    { type: 'market', minCount: 5, pillars: ['Market Opportunity', 'Organic Growth'] },
    { type: 'technical', minCount: 10, pillars: ['Technology Transformation', 'Platform Consolidation'] },
    { type: 'financial', minCount: 3, pillars: ['Organic Growth', 'Operational Excellence'] },
    { type: 'competitive', minCount: 3, pillars: ['Market Opportunity'] },
    { type: 'team', minCount: 2, pillars: ['Operational Excellence'] }
  ]
};

// Sales Intelligence Report Structure
export const SALES_INTELLIGENCE_STRUCTURE: ReportStructure = {
  reportType: 'sales-intelligence',
  sections: [
    {
      id: 'company-overview',
      title: 'Company Overview',
      order: 1,
      requiredEvidence: ['company', 'market', 'positioning'],
      thesisCritical: false,
      subsections: [
        { id: 'company-profile', title: 'Company Profile', evidenceTypes: ['company'] },
        { id: 'market-position', title: 'Market Position', evidenceTypes: ['market', 'competitive'] },
        { id: 'key-metrics', title: 'Key Metrics', evidenceTypes: ['financial', 'metrics'] }
      ]
    },
    {
      id: 'product-analysis',
      title: 'Product Analysis',
      order: 2,
      requiredEvidence: ['product', 'features', 'differentiation'],
      thesisCritical: false,
      subsections: [
        { id: 'product-portfolio', title: 'Product Portfolio', evidenceTypes: ['product'] },
        { id: 'key-features', title: 'Key Features', evidenceTypes: ['features', 'technical'] },
        { id: 'differentiators', title: 'Differentiators', evidenceTypes: ['competitive', 'unique'] }
      ]
    },
    {
      id: 'competitive-landscape',
      title: 'Competitive Landscape',
      order: 3,
      requiredEvidence: ['competitors', 'market share', 'positioning'],
      thesisCritical: false,
      subsections: [
        { id: 'competitor-analysis', title: 'Competitor Analysis', evidenceTypes: ['competitive'] },
        { id: 'market-dynamics', title: 'Market Dynamics', evidenceTypes: ['market'] },
        { id: 'win-loss-factors', title: 'Win/Loss Factors', evidenceTypes: ['competitive', 'sales'] }
      ]
    },
    {
      id: 'sales-insights',
      title: 'Sales Insights',
      order: 4,
      requiredEvidence: ['pricing', 'customers', 'use cases', 'ROI'],
      thesisCritical: false,
      subsections: [
        { id: 'pricing-strategy', title: 'Pricing Strategy', evidenceTypes: ['pricing'] },
        { id: 'customer-segments', title: 'Customer Segments', evidenceTypes: ['customers'] },
        { id: 'use-cases', title: 'Use Cases', evidenceTypes: ['use-cases', 'product'] },
        { id: 'roi-analysis', title: 'ROI Analysis', evidenceTypes: ['roi', 'financial'] }
      ]
    }
  ],
  requiredEvidence: [
    { type: 'product', minCount: 5 },
    { type: 'competitive', minCount: 5 },
    { type: 'pricing', minCount: 2 },
    { type: 'customers', minCount: 3 }
  ]
};

// Report structure mapper class
export class ReportStructureMapper {
  private structures: Map<string, ReportStructure> = new Map([
    ['pe-due-diligence', PE_DUE_DILIGENCE_STRUCTURE],
    ['sales-intelligence', SALES_INTELLIGENCE_STRUCTURE]
  ]);

  getStructure(reportType: string): ReportStructure {
    return this.structures.get(reportType) || PE_DUE_DILIGENCE_STRUCTURE;
  }

  mapEvidenceToStructure(
    evidence: Evidence[],
    reportType: string,
    thesis: InvestmentThesis
  ): MappedReport {
    const structure = this.getStructure(reportType);
    const mappedSections: MappedSection[] = [];
    const unmappedEvidence: Evidence[] = [];
    const usedEvidenceIds = new Set<string>();

    // Map evidence to each section
    structure.sections.forEach(section => {
      const mappedSection = this.mapSectionEvidence(
        section,
        evidence,
        thesis,
        usedEvidenceIds
      );
      mappedSections.push(mappedSection);
    });

    // Identify unmapped evidence
    evidence.forEach(e => {
      if (!usedEvidenceIds.has(e.id)) {
        unmappedEvidence.push(e);
      }
    });

    // Calculate coverage metrics
    const coverage = this.calculateCoverage(structure, mappedSections);
    const completeness = this.calculateCompleteness(structure, evidence);

    return {
      reportType,
      sections: mappedSections,
      unmappedEvidence,
      coverage,
      completeness,
      gaps: this.identifyGaps(structure, mappedSections, thesis)
    };
  }

  private mapSectionEvidence(
    section: ReportSection,
    evidence: Evidence[],
    thesis: InvestmentThesis,
    usedEvidenceIds: Set<string>
  ): MappedSection {
    const sectionEvidence: Evidence[] = [];
    const subsectionMap: Record<string, Evidence[]> = {};

    // Initialize subsection map
    section.subsections?.forEach(sub => {
      subsectionMap[sub.id] = [];
    });

    // Map evidence based on required evidence types
    evidence.forEach(e => {
      if (this.isEvidenceRelevantToSection(e, section, thesis)) {
        sectionEvidence.push(e);
        usedEvidenceIds.add(e.id);

        // Map to subsections
        section.subsections?.forEach(sub => {
          if (this.isEvidenceRelevantToSubsection(e, sub)) {
            subsectionMap[sub.id].push(e);
          }
        });
      }
    });

    // Sort evidence by relevance and quality
    const sortedEvidence = this.sortEvidenceByRelevance(sectionEvidence, thesis);

    return {
      sectionId: section.id,
      title: section.title,
      evidence: sortedEvidence,
      subsections: Object.entries(subsectionMap).map(([id, evidence]) => ({
        id,
        evidence: this.sortEvidenceByRelevance(evidence, thesis)
      })),
      score: this.calculateSectionScore(sortedEvidence, section, thesis),
      completeness: this.calculateSectionCompleteness(section, sortedEvidence)
    };
  }

  private isEvidenceRelevantToSection(
    evidence: Evidence,
    section: ReportSection,
    thesis: InvestmentThesis
  ): boolean {
    const content = `${evidence.title} ${evidence.content}`.toLowerCase();
    
    // Check required evidence types
    const matchesRequired = section.requiredEvidence.some(req => 
      content.includes(req.toLowerCase())
    );

    // For thesis-critical sections, also check pillar alignment
    if (section.thesisCritical && evidence.thesisPillarId) {
      const pillarRelevant = this.isPillarRelevantToSection(
        evidence.thesisPillarId,
        section.id,
        thesis
      );
      return matchesRequired || pillarRelevant;
    }

    return matchesRequired;
  }

  private isEvidenceRelevantToSubsection(
    evidence: Evidence,
    subsection: ReportSubsection
  ): boolean {
    if (subsection.evidenceTypes.includes('all')) {
      return true;
    }

    // Check if evidence type matches
    return subsection.evidenceTypes.includes(evidence.type);
  }

  private isPillarRelevantToSection(
    pillarId: string,
    sectionId: string,
    thesis: InvestmentThesis
  ): boolean {
    // Map sections to relevant thesis pillars
    const sectionPillarMap: Record<string, string[]> = {
      'executive-summary': ['all'],
      'scoring-analysis': ['all'],
      'deep-dive': ['Technology Transformation', 'Platform Consolidation'],
      'technical-focus': ['Technology Transformation', 'Platform Consolidation'],
      'risk-register': ['all'],
      'value-creation': ['Organic Growth', 'Platform Consolidation', 'Operational Excellence']
    };

    const relevantPillars = sectionPillarMap[sectionId] || [];
    return relevantPillars.includes('all') || relevantPillars.some(p => 
      pillarId.includes(p)
    );
  }

  private sortEvidenceByRelevance(
    evidence: Evidence[],
    thesis: InvestmentThesis
  ): Evidence[] {
    return evidence.sort((a, b) => {
      // First by thesis alignment
      const alignA = a.metadata?.thesisAlignment || 0;
      const alignB = b.metadata?.thesisAlignment || 0;
      if (alignA !== alignB) return alignB - alignA;

      // Then by quality score
      const qualityA = a.metadata?.qualityScore || 0;
      const qualityB = b.metadata?.qualityScore || 0;
      if (qualityA !== qualityB) return qualityB - qualityA;

      // Finally by confidence
      return b.confidence - a.confidence;
    });
  }

  private calculateSectionScore(
    evidence: Evidence[],
    section: ReportSection,
    thesis: InvestmentThesis
  ): number {
    if (evidence.length === 0) return 0;

    // Base score from evidence quality
    const avgQuality = evidence.reduce((sum, e) => 
      sum + (e.metadata?.qualityScore || 0), 0
    ) / evidence.length;

    // Bonus for thesis-critical sections with good alignment
    let thesisBonus = 0;
    if (section.thesisCritical) {
      const avgAlignment = evidence.reduce((sum, e) => 
        sum + (e.metadata?.thesisAlignment || 0), 0
      ) / evidence.length;
      thesisBonus = avgAlignment * 0.2; // 20% bonus for alignment
    }

    // Penalty for low evidence count
    const countPenalty = evidence.length < 3 ? 0.1 : 0;

    return Math.round(Math.min(100, avgQuality + thesisBonus - countPenalty));
  }

  private calculateSectionCompleteness(
    section: ReportSection,
    evidence: Evidence[]
  ): number {
    if (section.requiredEvidence.length === 0) return 100;

    const foundTypes = new Set<string>();
    evidence.forEach(e => {
      const content = `${e.title} ${e.content}`.toLowerCase();
      section.requiredEvidence.forEach(req => {
        if (content.includes(req.toLowerCase())) {
          foundTypes.add(req);
        }
      });
    });

    return Math.round((foundTypes.size / section.requiredEvidence.length) * 100);
  }

  private calculateCoverage(
    structure: ReportStructure,
    mappedSections: MappedSection[]
  ): number {
    const totalSections = structure.sections.filter(s => s.id !== 'evidence').length;
    const populatedSections = mappedSections.filter(s => 
      s.sectionId !== 'evidence' && s.evidence.length > 0
    ).length;

    return Math.round((populatedSections / totalSections) * 100);
  }

  private calculateCompleteness(
    structure: ReportStructure,
    evidence: Evidence[]
  ): Record<string, number> {
    const completeness: Record<string, number> = {};

    structure.requiredEvidence.forEach(req => {
      const count = evidence.filter(e => e.type === req.type).length;
      completeness[req.type] = Math.min(100, Math.round((count / req.minCount) * 100));
    });

    return completeness;
  }

  private identifyGaps(
    structure: ReportStructure,
    mappedSections: MappedSection[],
    thesis: InvestmentThesis
  ): ReportGap[] {
    const gaps: ReportGap[] = [];

    // Check section completeness
    mappedSections.forEach(section => {
      if (section.completeness < 50) {
        gaps.push({
          type: 'section',
          sectionId: section.sectionId,
          description: `${section.title} has low completeness (${section.completeness}%)`,
          severity: section.score < 30 ? 'critical' : 'high',
          suggestedActions: [
            `Gather more evidence for ${section.title}`,
            `Focus on required evidence types`
          ]
        });
      }
    });

    // Check evidence type requirements
    structure.requiredEvidence.forEach(req => {
      const count = mappedSections
        .flatMap(s => s.evidence)
        .filter(e => e.type === req.type).length;

      if (count < req.minCount) {
        gaps.push({
          type: 'evidence',
          evidenceType: req.type,
          description: `Insufficient ${req.type} evidence (${count}/${req.minCount})`,
          severity: count === 0 ? 'critical' : 'high',
          suggestedActions: [
            `Collect ${req.minCount - count} more ${req.type} evidence items`,
            `Focus on ${req.pillars?.join(', ') || 'all'} pillars`
          ]
        });
      }
    });

    return gaps;
  }

  generateReportContent(
    mappedReport: MappedReport,
    thesis: InvestmentThesis
  ): GeneratedReport {
    const sections: GeneratedSection[] = [];

    mappedReport.sections.forEach(mappedSection => {
      const content = this.generateSectionContent(mappedSection, thesis);
      sections.push({
        id: mappedSection.sectionId,
        title: mappedSection.title,
        content,
        evidence: mappedSection.evidence,
        score: mappedSection.score
      });
    });

    return {
      reportType: mappedReport.reportType,
      sections,
      metadata: {
        generatedAt: new Date().toISOString(),
        coverage: mappedReport.coverage,
        evidenceCount: mappedReport.sections.reduce((sum, s) => sum + s.evidence.length, 0),
        gaps: mappedReport.gaps
      }
    };
  }

  private generateSectionContent(
    section: MappedSection,
    thesis: InvestmentThesis
  ): string {
    if (section.evidence.length === 0) {
      return `No evidence collected for ${section.title}. Additional research required.`;
    }

    let content = '';

    // Group evidence by support/contradict
    const supporting = section.evidence.filter(e => e.metadata?.supports === true);
    const neutral = section.evidence.filter(e => 
      !e.metadata?.supports && !e.metadata?.contradicts
    );
    const contradicting = section.evidence.filter(e => e.metadata?.contradicts === true);

    // Generate content based on evidence groups
    if (supporting.length > 0) {
      content += this.generateEvidenceNarrative(
        'Supporting Evidence',
        supporting,
        thesis
      );
    }

    if (neutral.length > 0) {
      content += '\n\n' + this.generateEvidenceNarrative(
        'Additional Findings',
        neutral,
        thesis
      );
    }

    if (contradicting.length > 0) {
      content += '\n\n' + this.generateEvidenceNarrative(
        'Considerations and Challenges',
        contradicting,
        thesis
      );
    }

    return content;
  }

  private generateEvidenceNarrative(
    title: string,
    evidence: Evidence[],
    thesis: InvestmentThesis
  ): string {
    let narrative = `${title}:\n\n`;

    // Take top 3-5 most relevant pieces
    const topEvidence = evidence.slice(0, 5);

    topEvidence.forEach((e, index) => {
      // Extract key insight
      const insight = this.extractKeyInsight(e);
      
      // Add citation reference
      const citation = `[${e.id}]`;
      
      narrative += `• ${insight} ${citation}\n`;
    });

    return narrative;
  }

  private extractKeyInsight(evidence: Evidence): string {
    // Take first meaningful sentence or excerpt
    const sentences = evidence.content.split(/[.!?]+/);
    const meaningful = sentences.find(s => 
      s.trim().length > 20 && 
      !s.toLowerCase().includes('click here') &&
      !s.toLowerCase().includes('learn more')
    );

    return meaningful?.trim() || evidence.content.substring(0, 150) + '...';
  }
}

// Types for mapped report
export interface MappedReport {
  reportType: string;
  sections: MappedSection[];
  unmappedEvidence: Evidence[];
  coverage: number;
  completeness: Record<string, number>;
  gaps: ReportGap[];
}

export interface MappedSection {
  sectionId: string;
  title: string;
  evidence: Evidence[];
  subsections: MappedSubsection[];
  score: number;
  completeness: number;
}

export interface MappedSubsection {
  id: string;
  evidence: Evidence[];
}

export interface ReportGap {
  type: 'section' | 'evidence' | 'pillar';
  sectionId?: string;
  evidenceType?: string;
  pillarId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions: string[];
}

export interface GeneratedReport {
  reportType: string;
  sections: GeneratedSection[];
  metadata: {
    generatedAt: string;
    coverage: number;
    evidenceCount: number;
    gaps: ReportGap[];
  };
}

export interface GeneratedSection {
  id: string;
  title: string;
  content: string;
  evidence: Evidence[];
  score: number;
}