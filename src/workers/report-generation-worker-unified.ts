import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';
// import { GoogleGenerativeAI } from '@google/generative-ai'; // Not used in this implementation

// Initialize clients
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!); // Not used in this implementation

interface Evidence {
  id: string;
  type: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  url?: string;
  confidence_score: number;
  vector_embedding?: number[];
  metadata?: any;
}

interface Citation {
  evidence_id: string;
  citation_text: string;
  citation_number: number;
  context: string;
  confidence: number;
}

interface ReportSection {
  title: string;
  content: string;
  citations: Citation[];
  evidence_used: string[];
}

class UnifiedReportGenerator {
  private evidenceMap: Map<string, Evidence> = new Map();
  private citationCounter: number = 1;
  private usedEvidence: Set<string> = new Set();

  /**
   * Generate a complete report with integrated citations
   */
  async generateReport(
    scanRequestId: string,
    companyName: string,
    investmentThesis: string,
    evidenceCollectionId: string
  ) {
    console.log(`Starting unified report generation for ${companyName}`);

    try {
      // 1. Load and index evidence
      const evidence = await this.loadEvidence(evidenceCollectionId);
      console.log(`Loaded ${evidence.length} evidence items`);

      // 2. Generate report sections with citations
      const sections = await this.generateSectionsWithCitations(
        companyName,
        investmentThesis,
        evidence
      );

      // 3. Create executive summary with key citations
      const executiveSummary = await this.generateExecutiveSummary(
        companyName,
        sections,
        evidence
      );

      // 4. Compile full report
      const fullReport = this.compileReport(executiveSummary, sections);

      // 5. Save report and citations to database
      const reportId = await this.saveReport(
        scanRequestId,
        companyName,
        fullReport,
        sections
      );

      // 6. Update evidence usage statistics
      await this.updateEvidenceUsage();

      return reportId;
    } catch (error) {
      console.error('Error generating unified report:', error);
      throw error;
    }
  }

  /**
   * Load evidence from database and create searchable index
   */
  private async loadEvidence(collectionId: string): Promise<Evidence[]> {
    const { data, error } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('collection_id', collectionId)
      .order('confidence_score', { ascending: false });

    if (error) throw error;

    // Index evidence by ID for quick lookup
    data.forEach(item => {
      this.evidenceMap.set(item.id, item);
    });

    return data;
  }

  /**
   * Generate report sections with inline citations
   */
  private async generateSectionsWithCitations(
    companyName: string,
    investmentThesis: string,
    evidence: Evidence[]
  ): Promise<ReportSection[]> {
    const sections = [
      'Technology Stack & Architecture',
      'Engineering Team & Culture',
      'Product Development Velocity',
      'Infrastructure & Scalability',
      'Security & Compliance',
      'Technical Debt & Code Quality',
      'Innovation & R&D',
      'Integration Ecosystem',
      'Data Architecture & Analytics',
      'Investment Recommendation'
    ];

    const reportSections: ReportSection[] = [];

    for (const sectionTitle of sections) {
      console.log(`Generating section: ${sectionTitle}`);
      
      // Retrieve relevant evidence for this section
      const relevantEvidence = await this.retrieveRelevantEvidence(
        sectionTitle,
        investmentThesis,
        evidence
      );

      // Generate content with citations
      const section = await this.generateSectionWithCitations(
        companyName,
        sectionTitle,
        investmentThesis,
        relevantEvidence
      );

      reportSections.push(section);
    }

    return reportSections;
  }

  /**
   * Retrieve evidence relevant to a specific section
   */
  private async retrieveRelevantEvidence(
    sectionTitle: string,
    _investmentThesis: string,
    allEvidence: Evidence[]
  ): Promise<Evidence[]> {
    // For now, use keyword matching and category filtering
    // TODO: Implement proper RAG with embeddings
    
    const keywords = this.extractKeywords(sectionTitle);
    const relevant = allEvidence.filter(item => {
      // Check category relevance
      const categoryMatch = this.isCategoryRelevant(item.category, sectionTitle);
      
      // Check content relevance
      const contentMatch = keywords.some(keyword => 
        item.title.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword)
      );

      return categoryMatch || contentMatch;
    });

    // Sort by confidence and return top items
    return relevant
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 15);
  }

  /**
   * Generate a section with inline citations
   */
  private async generateSectionWithCitations(
    companyName: string,
    sectionTitle: string,
    investmentThesis: string,
    relevantEvidence: Evidence[]
  ): Promise<ReportSection> {
    // Prepare evidence context for the prompt
    const evidenceContext = relevantEvidence.map((item, index) => 
      `[E${index + 1}] ${item.type}: ${item.summary} (confidence: ${item.confidence_score})`
    ).join('\n');

    const prompt = `You are analyzing ${companyName} for the section "${sectionTitle}" as part of a private equity due diligence report.

Investment Thesis: ${investmentThesis}

Available Evidence:
${evidenceContext}

Instructions:
1. Write a detailed analysis for this section (300-400 words)
2. Use specific evidence to support your claims
3. When citing evidence, use the format: "claim text [E1]" where E1 refers to evidence item 1
4. Focus on concrete findings relevant to private equity investment decisions
5. Be critical and balanced, highlighting both strengths and risks
6. Use multiple pieces of evidence to support key points

Generate the section content with inline citations:`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract citations and convert to database format
    const citations = this.extractAndConvertCitations(content, relevantEvidence);

    // Track which evidence was used
    const evidenceUsed = citations.map(c => c.evidence_id);
    evidenceUsed.forEach(id => this.usedEvidence.add(id));

    return {
      title: sectionTitle,
      content: this.convertCitationsToMarkdown(content, citations),
      citations,
      evidence_used: [...new Set(evidenceUsed)]
    };
  }

  /**
   * Extract citations from content and convert to proper format
   */
  private extractAndConvertCitations(
    content: string,
    relevantEvidence: Evidence[]
  ): Citation[] {
    const citations: Citation[] = [];
    const citationRegex = /\[E(\d+)\]/g;
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      const evidenceIndex = parseInt(match[1]) - 1;
      
      if (evidenceIndex >= 0 && evidenceIndex < relevantEvidence.length) {
        const evidence = relevantEvidence[evidenceIndex];
        
        // Extract context around citation
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(content.length, match.index + 50);
        const context = content.substring(contextStart, contextEnd);

        citations.push({
          evidence_id: evidence.id,
          citation_text: evidence.title,
          citation_number: this.citationCounter++,
          context: context.trim(),
          confidence: evidence.confidence_score
        });
      }
    }

    return citations;
  }

  /**
   * Convert [E1] style citations to markdown links with citation numbers
   */
  private convertCitationsToMarkdown(
    content: string,
    citations: Citation[]
  ): string {
    let convertedContent = content;
    
    // Create a map of E-numbers to citation numbers
    const citationMap = new Map<string, number>();
    citations.forEach((citation) => {
      // Find which E-number this citation corresponds to
      const eNumber = content.match(new RegExp(`\\[E\\d+\\]`))?.map((match, idx) => {
        if (citations[idx]?.evidence_id === citation.evidence_id) {
          return match;
        }
      }).filter(Boolean)?.[0];
      
      if (eNumber) {
        citationMap.set(eNumber, citation.citation_number);
      }
    });

    // Replace [E1] with markdown citations
    convertedContent = content.replace(/\[E(\d+)\]/g, (match) => {
      const citationNumber = citationMap.get(match);
      return citationNumber ? `[${citationNumber}](#cite-${citationNumber})` : match;
    });

    return convertedContent;
  }

  /**
   * Generate executive summary based on all sections
   */
  private async generateExecutiveSummary(
    companyName: string,
    sections: ReportSection[],
    _evidence: Evidence[]
  ): Promise<ReportSection> {
    // Collect key findings from each section
    const keyFindings = sections.map(section => ({
      title: section.title,
      summary: section.content.substring(0, 200) + '...',
      citations: section.citations.slice(0, 2)
    }));

    const prompt = `Generate an executive summary for the ${companyName} private equity due diligence report.

Key findings from each section:
${keyFindings.map(f => `${f.title}: ${f.summary}`).join('\n\n')}

Create a concise executive summary (400-500 words) that:
1. Highlights the most critical findings for PE investors
2. Provides a clear investment recommendation
3. Summarizes key risks and opportunities
4. Includes 5-7 key metrics or facts with citations

Use citations in the format [1], [2], etc. based on the most important evidence.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    // Use the most impactful citations from all sections
    const topCitations = sections
      .flatMap(s => s.citations)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 7);

    return {
      title: 'Executive Summary',
      content,
      citations: topCitations,
      evidence_used: topCitations.map(c => c.evidence_id)
    };
  }

  /**
   * Compile all sections into a full report
   */
  private compileReport(
    executiveSummary: ReportSection,
    sections: ReportSection[]
  ): any {
    const compiledSections: any = {
      executive_summary: executiveSummary.content
    };

    sections.forEach(section => {
      const sectionKey = section.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');
      
      compiledSections[sectionKey] = section.content;
    });

    // Add comprehensive scoring based on evidence quality
    const scoring = this.calculateComprehensiveScoring(sections);

    return {
      sections: compiledSections,
      comprehensive_scoring: scoring,
      metadata: {
        total_evidence_used: this.usedEvidence.size,
        total_citations: this.citationCounter - 1,
        generation_timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Calculate comprehensive scoring based on evidence and findings
   */
  private calculateComprehensiveScoring(sections: ReportSection[]): any {
    // Aggregate confidence scores from citations
    const allCitations = sections.flatMap(s => s.citations);
    const avgConfidence = allCitations.reduce((sum, c) => sum + c.confidence, 0) / allCitations.length;

    // Calculate scores based on section content and evidence
    return {
      overall_score: Math.round(avgConfidence * 100),
      sub_scores: {
        technology_sophistication: this.calculateSectionScore('Technology Stack', sections),
        team_quality: this.calculateSectionScore('Engineering Team', sections),
        scalability: this.calculateSectionScore('Infrastructure', sections),
        security_posture: this.calculateSectionScore('Security', sections),
        innovation_capacity: this.calculateSectionScore('Innovation', sections)
      },
      confidence_level: avgConfidence > 0.8 ? 'High' : avgConfidence > 0.6 ? 'Medium' : 'Low',
      evidence_quality: {
        total_evidence: this.evidenceMap.size,
        evidence_used: this.usedEvidence.size,
        citation_density: (this.citationCounter - 1) / sections.length
      }
    };
  }

  /**
   * Save report and citations to database
   */
  private async saveReport(
    scanRequestId: string,
    companyName: string,
    fullReport: any,
    sections: ReportSection[]
  ): Promise<string> {
    // Start a transaction
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        scan_request_id: scanRequestId,
        company_name: companyName,
        report_type: 'unified_deep_research',
        content: fullReport,
        status: 'completed',
        comprehensive_scoring: fullReport.comprehensive_scoring
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Save all citations
    const citations = sections.flatMap(section => 
      section.citations.map(citation => ({
        report_id: report.id,
        evidence_id: citation.evidence_id,
        citation_text: citation.citation_text,
        citation_number: citation.citation_number,
        context: citation.context,
        section: section.title
      }))
    );

    const { error: citationError } = await supabase
      .from('report_citations')
      .insert(citations);

    if (citationError) throw citationError;

    return report.id;
  }

  /**
   * Update evidence usage statistics
   */
  private async updateEvidenceUsage() {
    const updates = Array.from(this.usedEvidence).map(evidenceId => ({
      id: evidenceId,
      usage_count: 1, // This would be incremented in a real implementation
      last_used_at: new Date().toISOString()
    }));

    // Update evidence items with usage stats
    for (const update of updates) {
      await supabase
        .from('evidence_items')
        .update({
          metadata: {
            usage_count: update.usage_count,
            last_used_at: update.last_used_at
          }
        })
        .eq('id', update.id);
    }
  }

  // Helper methods
  private extractKeywords(text: string): string[] {
    const keywords = text.toLowerCase().split(/\s+/);
    return keywords.filter(k => k.length > 3);
  }

  private isCategoryRelevant(category: string, sectionTitle: string): boolean {
    const categoryMap: Record<string, string[]> = {
      'Technology Stack': ['technical', 'github', 'code', 'framework'],
      'Engineering Team': ['team', 'hiring', 'culture', 'linkedin'],
      'Security': ['security', 'compliance', 'vulnerability'],
      'Infrastructure': ['infrastructure', 'cloud', 'devops', 'deployment'],
      'Product': ['product', 'features', 'user', 'market']
    };

    const relevantCategories = Object.entries(categoryMap)
      .filter(([section]) => sectionTitle.includes(section))
      .flatMap(([, categories]) => categories);

    return relevantCategories.some(cat => category.toLowerCase().includes(cat));
  }

  private calculateSectionScore(sectionKeyword: string, sections: ReportSection[]): number {
    const section = sections.find(s => s.title.includes(sectionKeyword));
    if (!section) return 50;

    // Calculate based on citation confidence and evidence quality
    const avgConfidence = section.citations.reduce((sum, c) => sum + c.confidence, 0) / section.citations.length;
    return Math.round(avgConfidence * 100);
  }
}

// Export for use in worker
export const generateUnifiedReport = async (
  scanRequestId: string,
  companyName: string,
  investmentThesis: string,
  evidenceCollectionId: string
) => {
  const generator = new UnifiedReportGenerator();
  return await generator.generateReport(
    scanRequestId,
    companyName,
    investmentThesis,
    evidenceCollectionId
  );
};