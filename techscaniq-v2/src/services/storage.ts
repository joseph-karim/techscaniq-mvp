import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { InvestmentThesis, Evidence, Report, ResearchState } from '../types';
import fs from 'fs-extra';
import path from 'path';

const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY
);

export class StorageService {
  /**
   * Save research state to local storage (for development)
   */
  async saveResearchState(researchId: string, state: ResearchState): Promise<void> {
    const key = `research_state_${researchId}`;
    const serialized = JSON.stringify(state, null, 2);
    
    // In production, save to database or S3
    // For now, save to local file
    const filePath = path.join(process.cwd(), 'data', 'states', `${key}.json`);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, state, { spaces: 2 });
  }

  /**
   * Load research state from local storage (for development)
   */
  async loadResearchState(researchId: string): Promise<ResearchState | null> {
    const key = `research_state_${researchId}`;
    const filePath = path.join(process.cwd(), 'data', 'states', `${key}.json`);
    
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return null;
      }
      
      const data = await fs.readJson(filePath);
      // Convert date strings back to Date objects
      if (data.thesis) {
        data.thesis.createdAt = new Date(data.thesis.createdAt);
        data.thesis.updatedAt = new Date(data.thesis.updatedAt);
      }
      return data as ResearchState;
    } catch (error) {
      console.error(`Error loading research state ${researchId}:`, error);
      return null;
    }
  }
  /**
   * Store investment thesis
   */
  async storeThesis(thesis: InvestmentThesis): Promise<string> {
    const { data, error } = await supabase
      .from('investment_theses')
      .insert({
        id: thesis.id,
        company: thesis.company,
        company_website: thesis.companyWebsite,
        statement: thesis.statement,
        type: thesis.type,
        pillars: thesis.pillars,
        success_criteria: thesis.successCriteria,
        risk_factors: thesis.riskFactors,
        created_at: thesis.createdAt,
        updated_at: thesis.updatedAt,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Store evidence batch
   */
  async storeEvidence(evidence: Evidence[]): Promise<void> {
    const records = evidence.map(e => ({
      id: e.id,
      thesis_id: e.researchQuestionId, // Will be updated with proper thesis ID
      pillar_id: e.pillarId,
      source_type: e.source.type,
      source_name: e.source.name,
      source_url: e.source.url,
      source_credibility: e.source.credibilityScore,
      content: e.content,
      metadata: e.metadata,
      quality_score: e.qualityScore.overall,
      quality_components: e.qualityScore.components,
      quality_reasoning: e.qualityScore.reasoning,
      created_at: e.createdAt,
    }));

    const { error } = await supabase
      .from('evidence')
      .insert(records);

    if (error) throw error;
  }

  /**
   * Store complete report
   */
  async storeReport(state: ResearchState): Promise<string> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create main report record
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        id: reportId,
        thesis_id: state.thesisId,
        company: state.thesis.company,
        executive_summary: state.reportSections?.['executive_summary']?.content || '',
        investment_score: this.calculateInvestmentScore(state),
        status: 'final',
        metadata: {
          evidence_count: state.evidence.length,
          citation_count: state.citations?.length || 0,
          average_quality_score: this.calculateAverageQuality(state.qualityScores || {}),
          research_duration: Date.now() - state.thesis.createdAt.getTime(),
          iteration_count: state.iterationCount,
          model_versions: {
            orchestration: 'claude-opus-4',
            parsing: 'gemini-2.0-flash-exp',
            analysis: 'o3-pro-2025-06-10',
            review: 'o3',
          },
        },
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Store report sections
    const sections = state.reportSections 
      ? Object.entries(state.reportSections).map(([_, section]) => ({
          id: `${reportId}_${section.id}`,
          report_id: reportId,
          section_id: section.id,
          title: section.title,
          content: section.content,
          order_index: section.order,
          metadata: section.metadata,
        }))
      : [];

    const { error: sectionsError } = await supabase
      .from('report_sections')
      .insert(sections);

    if (sectionsError) throw sectionsError;

    // Store citations
    if (state.citations && state.citations.length > 0) {
      const citations = state.citations.map(c => ({
        id: c.id,
        report_id: reportId,
        evidence_id: c.evidenceId,
        report_section_id: c.reportSectionId,
        quote: c.quote,
        context: c.context,
        page_number: c.pageNumber,
        created_at: c.createdAt,
      }));

      const { error: citationsError } = await supabase
        .from('citations')
        .insert(citations);

      if (citationsError) throw citationsError;
    }

    console.log(`✅ Report stored with ID: ${reportId}`);
    return reportId;
  }

  /**
   * Load research state from Supabase for resume
   */
  async loadResearchStateFromSupabase(thesisId: string): Promise<ResearchState | null> {
    try {
      // Load thesis
      const { data: thesis, error: thesisError } = await supabase
        .from('investment_theses')
        .select('*')
        .eq('id', thesisId)
        .single();

      if (thesisError || !thesis) return null;

      // Load evidence
      const { data: evidence, error: evidenceError } = await supabase
        .from('evidence')
        .select('*')
        .eq('thesis_id', thesisId);

      if (evidenceError) return null;

      // Reconstruct research state
      const state: ResearchState = {
        thesisId: thesis.id,
        thesis: {
          id: thesis.id,
          company: thesis.company,
          website: thesis.company_website,
          companyWebsite: thesis.company_website,
          statement: thesis.statement,
          type: thesis.type,
          pillars: thesis.pillars,
          successCriteria: thesis.success_criteria,
          riskFactors: thesis.risk_factors,
          createdAt: new Date(thesis.created_at),
          updatedAt: new Date(thesis.updated_at),
        },
        researchQuestions: [], // Would need to load from separate table
        evidence: evidence.map(e => ({
          id: e.id,
          researchQuestionId: e.thesis_id,
          pillarId: e.pillar_id,
          source: {
            type: e.source_type,
            name: e.source_name,
            url: e.source_url,
            credibilityScore: e.source_credibility,
          },
          content: e.content,
          metadata: e.metadata,
          qualityScore: {
            overall: e.quality_score,
            components: e.quality_components,
            reasoning: e.quality_reasoning,
          },
          createdAt: new Date(e.created_at),
        })),
        qualityScores: evidence.reduce((acc, e) => {
          acc[e.id] = e.quality_score;
          return acc;
        }, {}),
        reportSections: {},
        citations: [],
        iterationCount: 0,
        maxIterations: config.MAX_RESEARCH_ITERATIONS,
        status: 'researching',
        errors: [],
      };

      return state;
    } catch (error) {
      console.error('Failed to load research state:', error);
      return null;
    }
  }

  private calculateInvestmentScore(state: ResearchState): number {
    // Simple scoring based on evidence quality and thesis validation
    const avgQuality = this.calculateAverageQuality(state.qualityScores || {});
    const thesisScore = state.reportSections?.['thesis_analysis']?.metadata?.validationScore || 0.5;
    const riskScore = 1 - (state.reportSections?.['risk_analysis']?.metadata?.criticalRiskCount || 0) * 0.1;
    
    return Math.round((avgQuality * 0.3 + thesisScore * 0.5 + riskScore * 0.2) * 100);
  }

  private calculateAverageQuality(scores: Record<string, number>): number {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    return values.reduce((sum, score) => sum + score, 0) / values.length;
  }
}