// Staged Report Generation Worker - Generates reports section by section
// Then uses a master editor to ensure consistency and quality

import { Queue, Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { 
  TECHNOLOGY_SECTION_PROMPT,
  MARKET_SECTION_PROMPT,
  TEAM_SECTION_PROMPT,
  FINANCIAL_SECTION_PROMPT,
  RISK_SECTION_PROMPT,
  RECOMMENDATION_SECTION_PROMPT,
  EXECUTIVE_SUMMARY_PROMPT,
  MASTER_EDITOR_PROMPT,
  SectionPrompt
} from '../lib/prompts/section-based-prompts';
import { connection as redisConnection } from './queue-config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ReportGenerationJob {
  scanRequestId: string;
  companyName: string;
  companyDomain: string;
  investmentThesis: string;
  userId: string;
}

interface SectionResult {
  sectionId: string;
  sectionName: string;
  content: any;
  confidenceScore: number;
  generatedAt: string;
  tokenUsage: {
    input: number;
    output: number;
  };
}

class StagedReportGenerator {
  private sections: SectionResult[] = [];
  private evidence: any[] = [];
  private context: any;
  private trace: any[] = [];

  constructor(private job: ReportGenerationJob) {
    this.context = {
      companyName: job.companyName,
      companyDomain: job.companyDomain,
      investmentThesis: job.investmentThesis
    };
  }

  async generate(): Promise<any> {
    try {
      // Step 1: Load evidence
      await this.loadEvidence();
      
      // Step 2: Generate sections in parallel where possible
      await this.generateSections();
      
      // Step 3: Generate risk assessment (depends on other sections)
      await this.generateRiskAssessment();
      
      // Step 4: Generate investment recommendation (depends on all sections)
      await this.generateRecommendation();
      
      // Step 5: Master editor review
      const editedSections = await this.masterEditorReview();
      
      // Step 6: Generate executive summary (last, after all edits)
      await this.generateExecutiveSummary(editedSections);
      
      // Step 7: Assemble final report
      const finalReport = await this.assembleFinalReport(editedSections);
      
      // Step 8: Save report
      await this.saveReport(finalReport);
      
      return finalReport;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  }

  private async loadEvidence(): Promise<void> {
    this.addTrace('Loading evidence', { scanRequestId: this.job.scanRequestId });
    
    const { data: evidence, error } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('scan_request_id', this.job.scanRequestId)
      .order('confidence_score', { ascending: false });
    
    if (error) throw error;
    
    this.evidence = evidence || [];
    this.addTrace('Evidence loaded', { count: this.evidence.length });
  }

  private async generateSections(): Promise<void> {
    const sectionPrompts = [
      TECHNOLOGY_SECTION_PROMPT,
      MARKET_SECTION_PROMPT,
      TEAM_SECTION_PROMPT,
      FINANCIAL_SECTION_PROMPT
    ];
    
    // Generate sections in parallel
    const sectionPromises = sectionPrompts.map(prompt => 
      this.generateSingleSection(prompt)
    );
    
    const results = await Promise.all(sectionPromises);
    this.sections.push(...results);
  }

  private async generateSingleSection(prompt: SectionPrompt): Promise<SectionResult> {
    const startTime = Date.now();
    this.addTrace(`Generating section: ${prompt.sectionName}`);
    
    try {
      // Filter evidence relevant to this section
      const sectionEvidence = this.filterEvidenceForSection(prompt);
      
      // Generate section content
      const message = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: prompt.maxTokens,
        messages: [
          {
            role: 'user',
            content: this.constructSectionPrompt(prompt, sectionEvidence)
          }
        ]
      });
      
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const content = this.parseResponse(responseText);
      
      const result: SectionResult = {
        sectionId: prompt.id,
        sectionName: prompt.sectionName,
        content,
        confidenceScore: content.confidenceScore || 50,
        generatedAt: new Date().toISOString(),
        tokenUsage: {
          input: message.usage?.input_tokens || 0,
          output: message.usage?.output_tokens || 0
        }
      };
      
      this.addTrace(`Section completed: ${prompt.sectionName}`, {
        duration: Date.now() - startTime,
        confidence: result.confidenceScore
      });
      
      return result;
    } catch (error) {
      console.error(`Error generating section ${prompt.sectionName}:`, error);
      
      return {
        sectionId: prompt.id,
        sectionName: prompt.sectionName,
        content: {
          error: true,
          overview: 'Section generation failed',
          dataGaps: ['Unable to analyze this section'],
          confidenceScore: 0
        },
        confidenceScore: 0,
        generatedAt: new Date().toISOString(),
        tokenUsage: { input: 0, output: 0 }
      };
    }
  }

  private filterEvidenceForSection(prompt: SectionPrompt): any[] {
    // Smart evidence filtering based on section type
    return this.evidence.filter(e => {
      const type = (e.evidence_type || e.type || '').toLowerCase();
      const content = (e.content_data?.summary || '').toLowerCase();
      
      switch(prompt.id) {
        case 'technology-assessment':
          return type.includes('tech') || type.includes('stack') || 
                 content.includes('technology') || content.includes('api') ||
                 type.includes('security') || type.includes('performance');
        
        case 'market-position':
          return type.includes('market') || type.includes('competitor') || 
                 type.includes('industry') || type.includes('customer') ||
                 content.includes('market') || content.includes('competitor');
        
        case 'team-organization':
          return type.includes('team') || type.includes('leadership') || 
                 type.includes('employee') || type.includes('culture') ||
                 content.includes('founder') || content.includes('ceo');
        
        case 'financial-analysis':
          return type.includes('pricing') || type.includes('revenue') || 
                 type.includes('funding') || type.includes('financial') ||
                 content.includes('pricing') || content.includes('customer');
        
        default:
          return true;
      }
    }).slice(0, 25); // Limit to top 25 most relevant pieces
  }

  private constructSectionPrompt(prompt: SectionPrompt, evidence: any[]): string {
    const evidenceText = evidence.map((e, i) => {
      const content = e.content_data?.processed || 
                     e.content_data?.summary || 
                     e.summary || '';
      return `[${i + 1}] Source: ${e.source_url || 'Unknown'}
Type: ${e.evidence_type || e.type}
Confidence: ${e.confidence_score || 0.5}
Content: ${content.slice(0, 300)}...`;
    }).join('\n\n');
    
    return `${prompt.systemPrompt}

${prompt.taskDescription}

Company: ${this.context.companyName}
Website: ${this.context.companyDomain}
Investment Thesis: ${this.context.investmentThesis}

Evidence Available (${evidence.length} items):
${evidenceText}

Output Format (JSON only):
${prompt.outputFormat}

IMPORTANT: Output ONLY valid JSON. Base all findings on provided evidence.`;
  }

  private async generateRiskAssessment(): Promise<void> {
    // Risk assessment depends on other sections
    // Note: In full implementation, would pass sectional analyses to risk prompt
    const riskPrompt = {
      ...RISK_SECTION_PROMPT,
      requiredEvidence: ['sectional_analyses']
    };
    
    const riskResult = await this.generateSingleSection(riskPrompt);
    this.sections.push(riskResult);
  }

  private async generateRecommendation(): Promise<void> {
    // Recommendation depends on all sections including risk
    const recommendationResult = await this.generateSingleSection(RECOMMENDATION_SECTION_PROMPT);
    this.sections.push(recommendationResult);
  }

  private async masterEditorReview(): Promise<SectionResult[]> {
    this.addTrace('Master editor review starting');
    
    const editorPrompt = `${MASTER_EDITOR_PROMPT.systemPrompt}

${MASTER_EDITOR_PROMPT.taskDescription}

Report Sections Generated:
${this.sections.map(s => `
Section: ${s.sectionName}
Confidence: ${s.confidenceScore}%
Content: ${JSON.stringify(s.content, null, 2)}
`).join('\n---\n')}

${MASTER_EDITOR_PROMPT.editingInstructions}

Output Format:
${MASTER_EDITOR_PROMPT.outputFormat}`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: editorPrompt }]
      });
      
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const editorFeedback = this.parseResponse(responseText);
      
      // Apply editor feedback to sections
      const editedSections = this.applyEditorFeedback(this.sections, editorFeedback);
      
      this.addTrace('Master editor review completed', {
        issues: editorFeedback.consistencyIssues?.length || 0,
        enhancements: editorFeedback.narrativeEnhancements?.length || 0
      });
      
      return editedSections;
    } catch (error) {
      console.error('Master editor review failed:', error);
      return this.sections; // Return unedited sections
    }
  }

  private applyEditorFeedback(sections: SectionResult[], feedback: any): SectionResult[] {
    // In a real implementation, this would apply specific edits
    // For now, we'll just add editor notes to sections
    return sections.map(section => ({
      ...section,
      content: {
        ...section.content,
        editorNotes: feedback.narrativeEnhancements?.filter(
          (e: any) => e.section === section.sectionId
        ) || []
      }
    }));
  }

  private async generateExecutiveSummary(sections: SectionResult[]): Promise<void> {
    const summaryContext = sections.map(s => ({
      section: s.sectionName,
      keyPoints: {
        overview: s.content.overview,
        strengths: s.content.strengths || s.content.financialStrengths || [],
        concerns: s.content.concerns || s.content.risks || [],
        confidence: s.confidenceScore
      }
    }));
    
    const summaryPrompt = `${EXECUTIVE_SUMMARY_PROMPT.systemPrompt}

${EXECUTIVE_SUMMARY_PROMPT.taskDescription}

Company: ${this.context.companyName}
Investment Thesis: ${this.context.investmentThesis}

Section Summaries:
${JSON.stringify(summaryContext, null, 2)}

Output Format:
${EXECUTIVE_SUMMARY_PROMPT.outputFormat}`;
    
    const summaryResult = await this.generateSingleSection({
      ...EXECUTIVE_SUMMARY_PROMPT,
      taskDescription: summaryPrompt
    });
    
    this.sections.unshift(summaryResult); // Add to beginning
  }

  private async assembleFinalReport(sections: SectionResult[]): Promise<any> {
    const sectionMap: any = {};
    
    // Convert sections array to the expected format
    sections.forEach(section => {
      const sectionKey = section.sectionId.replace(/-/g, '_');
      sectionMap[sectionKey] = {
        title: section.sectionName,
        content: this.formatSectionContent(section),
        metadata: {
          confidence: section.confidenceScore,
          generatedAt: section.generatedAt,
          tokenUsage: section.tokenUsage
        }
      };
    });
    
    // Calculate overall scores
    const avgConfidence = sections.reduce((sum, s) => sum + s.confidenceScore, 0) / sections.length;
    const recommendation = sections.find(s => s.sectionId === 'investment-recommendation')?.content;
    
    return {
      report_data: {
        company_name: this.context.companyName,
        website_url: this.context.companyDomain,
        investment_thesis: this.context.investmentThesis,
        
        // Executive summary at top level
        executive_summary: sections.find(s => s.sectionId === 'executive-summary')?.content.summary || '',
        
        // Scores
        investment_score: recommendation?.thesisAlignment?.score || Math.round(avgConfidence),
        investment_rationale: recommendation?.rationale || 'See detailed analysis in report sections',
        
        // All sections
        sections: sectionMap,
        
        // Metadata
        generated_at: new Date().toISOString(),
        evidence_count: this.evidence.length,
        overall_confidence: avgConfidence,
        recommendation: recommendation?.recommendation || 'NEED_MORE_DATA'
      }
    };
  }

  private formatSectionContent(section: SectionResult): string {
    const content = section.content;
    
    // Format section content as markdown
    let markdown = `## ${section.sectionName}\n\n`;
    
    if (content.overview) {
      markdown += `${content.overview}\n\n`;
    }
    
    // Add subsections based on content structure
    Object.entries(content).forEach(([key, value]) => {
      if (key === 'overview' || key === 'confidenceScore' || key === 'error') return;
      
      const sectionTitle = key.replace(/([A-Z])/g, ' $1').trim();
      markdown += `### ${sectionTitle.charAt(0).toUpperCase() + sectionTitle.slice(1)}\n\n`;
      
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'string') {
            markdown += `- ${item}\n`;
          } else if (typeof item === 'object') {
            markdown += `- **${item.name || item.finding || item.risk || 'Item'}**: ${item.description || item.context || JSON.stringify(item)}\n`;
          }
        });
        markdown += '\n';
      } else if (typeof value === 'object') {
        markdown += `${JSON.stringify(value, null, 2)}\n\n`;
      } else {
        markdown += `${value}\n\n`;
      }
    });
    
    return markdown;
  }

  private async saveReport(report: any): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .insert({
        scan_request_id: this.job.scanRequestId,
        report_type: 'staged_comprehensive',
        status: 'completed',
        report_data: report.report_data,
        metadata: {
          trace: this.trace,
          sectionCount: this.sections.length,
          totalTokens: this.sections.reduce((sum, s) => 
            sum + s.tokenUsage.input + s.tokenUsage.output, 0
          )
        }
      });
    
    if (error) throw error;
    
    // Update scan request status
    await supabase
      .from('scan_requests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', this.job.scanRequestId);
  }

  private parseResponse(text: string): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // If no JSON found, return structured error
      return {
        error: true,
        overview: text.slice(0, 200),
        dataGaps: ['Unable to parse response as JSON']
      };
    } catch (error) {
      return {
        error: true,
        overview: 'Failed to parse response',
        dataGaps: ['JSON parsing error']
      };
    }
  }

  private addTrace(event: string, data?: any): void {
    this.trace.push({
      timestamp: new Date().toISOString(),
      event,
      data
    });
  }
}

// Queue worker
export const reportGenerationWorker = new Worker(
  'report-generation-staged',
  async (job: Job<ReportGenerationJob>) => {
    console.log(`Starting staged report generation for ${job.data.companyName}`);
    
    const generator = new StagedReportGenerator(job.data);
    const report = await generator.generate();
    
    console.log(`Report generation completed for ${job.data.companyName}`);
    return report;
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process 2 reports at a time
  }
);

// Export queue for adding jobs
export const reportGenerationQueue = new Queue('report-generation-staged', {
  connection: redisConnection
});