import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';
import { connection as redisConnection } from './queue-config';
import { PE_THESIS_TYPES, type ThesisType, type InvestmentThesisData } from '@/components/scans/investment-thesis-selector';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ThesisAlignedReportData {
  scanRequestId: string;
  investmentThesisData: InvestmentThesisData;
  evidenceItems: any[];
}

interface ScoringResult {
  criterion: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  evidenceRefs: string[];
  findings: Array<{ evidence: string; observation: string; impact: 'positive' | 'negative' | 'neutral'; score: number }>;
  recommendations: string[];
}

interface RiskItem {
  code: string;
  description: string;
  likelihood: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  mitigation: string;
  owner: string;
  costEstimate?: string;
  evidenceRefs: string[];
}

interface ValueCreationInitiative {
  name: string;
  timelineBucket: '0-6m' | '6-18m' | '18m+';
  expectedImpact: string;
  costEstimate: string;
  roiEstimate: string;
  owner: string;
  thesisAlignment: string;
  evidenceRefs: string[];
}

// Generate section-specific prompts based on thesis type
const generateSectionPrompt = (
  criterion: string,
  weight: number,
  description: string,
  evidence: any[],
  thesisType: string,
  companyName: string
) => {
  return `You are a Senior Technical Due Diligence Analyst evaluating ${companyName} for a ${thesisType} investment thesis.

Evaluate the company on: ${criterion}
Description: ${description}
Weight in overall assessment: ${weight}%

Evidence Available (${evidence.length} items):
${evidence.map((item, index) => `[${index + 1}] Type: ${item.evidence_type}
Source: ${item.source_url || 'N/A'}
Content: ${item.content_data?.text || item.content_data?.summary || 'No content'}`).join('\n\n')}

Provide a structured assessment in the following JSON format:
{
  "rawScore": 0-100,
  "findings": [
    {
      "evidence": "⟦X⟧",
      "observation": "What was found",
      "impact": "positive|negative|neutral",
      "score": -20 to +20
    }
  ],
  "keyStrengths": ["List of strengths with evidence refs"],
  "keyGaps": ["List of gaps or concerns with evidence refs"],
  "recommendations": [
    {
      "action": "Specific action",
      "cost": "Estimated cost",
      "timeline": "Implementation timeline",
      "impact": "Expected impact"
    }
  ],
  "summary": "2-3 sentence summary of findings"
}

Score based on:
- 80-100: Excellent - ready for aggressive growth/scale
- 60-79: Good - minor improvements needed
- 40-59: Fair - significant work required
- 20-39: Poor - major overhaul needed
- 0-19: Critical - fundamental issues

Important: Every observation MUST reference specific evidence with ⟦X⟧ notation.`;
};

// Generate executive summary based on all sections
const generateExecutiveSummaryPrompt = (
  companyName: string,
  thesisData: InvestmentThesisData,
  scoringResults: ScoringResult[],
  totalScore: number,
  threshold: number
) => {
  const thesisDetails = thesisData.thesisType !== 'custom' 
    ? PE_THESIS_TYPES[thesisData.thesisType as ThesisType]
    : { name: thesisData.customThesisName, description: thesisData.customThesisDescription };

  return `Generate an executive investment memo for ${companyName}.

Investment Thesis: ${thesisDetails?.name}
Description: ${thesisDetails?.description}
Timeline: ${thesisData.timeHorizon}
Target Multiple: ${thesisData.targetMultiple}

Overall Score: ${totalScore.toFixed(1)}% (Threshold: ${threshold}%)

Scoring Results:
${scoringResults.map(r => `- ${r.criterion}: ${r.rawScore}/100 (${r.weight}% weight) = ${r.weightedScore.toFixed(1)} points`).join('\n')}

Generate a 1-2 page executive memo with:

1. Thesis Fit Summary (1 paragraph)
2. Top 3 Upsides (with evidence refs ⟦X⟧)
3. Top 3 Risks (with evidence refs ⟦X⟧)
4. Decision Snapshot: 
   - Recommendation: Proceed / Proceed with Conditions / Decline
   - Key conditions precedent (if applicable)
   - Next steps checklist

Format as structured JSON:
{
  "thesisFitSummary": "paragraph explaining fit",
  "topUpsides": [
    {"point": "Upside description", "evidenceRefs": ["⟦3⟧", "⟦7⟧"]}
  ],
  "topRisks": [
    {"point": "Risk description", "evidenceRefs": ["⟦12⟧", "⟦15⟧"]}
  ],
  "decision": "Proceed|Proceed with Conditions|Decline",
  "conditions": ["List of conditions if applicable"],
  "nextSteps": ["Immediate action items"]
}`;
};

// Generate risk register based on findings
const generateRiskRegisterPrompt = (findings: any[], companyName: string) => {
  return `Based on the technical due diligence findings for ${companyName}, create a risk register.

Key Findings with Concerns:
${JSON.stringify(findings, null, 2)}

Generate a risk register in JSON format:
{
  "risks": [
    {
      "code": "R-01",
      "description": "Risk description",
      "likelihood": "Low|Medium|High",
      "impact": "Low|Medium|High",
      "mitigation": "Specific mitigation action",
      "owner": "VP Engineering|CTO|etc",
      "costEstimate": "$X/month or $Y one-time",
      "evidenceRefs": ["⟦X⟧"]
    }
  ]
}

Focus on:
- Technical risks (architecture, scalability, security)
- Operational risks (team, processes, dependencies)
- Integration risks (for roll-up strategies)
- Compliance/regulatory risks`;
};

// Generate value creation roadmap
const generateValueCreationPrompt = (
  thesisData: InvestmentThesisData,
  scoringResults: ScoringResult[],
  companyName: string
) => {
  return `Create a value creation roadmap for ${companyName} aligned with the ${thesisData.thesisType} thesis.

Target: ${thesisData.targetMultiple} return in ${thesisData.timeHorizon}

Key Improvement Areas:
${scoringResults.filter(r => r.rawScore < 70).map(r => 
  `- ${r.criterion}: Current score ${r.rawScore}/100 (needs improvement)`
).join('\n')}

Generate initiatives in JSON format:
{
  "initiatives": [
    {
      "name": "Initiative name",
      "timelineBucket": "0-6m|6-18m|18m+",
      "expectedImpact": "Description of impact",
      "costEstimate": "$X",
      "roiEstimate": "X% ARR increase or $Y EBITDA",
      "owner": "Role responsible",
      "thesisAlignment": "How this supports the thesis",
      "evidenceRefs": ["⟦X⟧"]
    }
  ]
}

Prioritize high-ROI technical initiatives that directly support the investment thesis.`;
};

class ThesisAlignedReportGenerator {
  private scanRequestId: string;
  private investmentThesisData: InvestmentThesisData;
  private evidenceItems: any[];
  private scoringResults: ScoringResult[] = [];
  private threshold: number = 0.70;

  constructor(data: ThesisAlignedReportData) {
    this.scanRequestId = data.scanRequestId;
    this.investmentThesisData = data.investmentThesisData;
    this.evidenceItems = data.evidenceItems;
    
    // Set threshold based on thesis type
    if (this.investmentThesisData.thesisType !== 'custom') {
      // Default thresholds by thesis type
      const thresholds: Record<string, number> = {
        'accelerate-organic-growth': 0.70,
        'buy-and-build': 0.65,
        'margin-expansion': 0.60,
        'turnaround-distressed': 0.60,
        'carve-out': 0.65,
        'geographic-vertical-expansion': 0.65,
        'digital-transformation': 0.65
      };
      this.threshold = thresholds[this.investmentThesisData.thesisType] || 0.70;
    }
  }

  async generate(jobProgress?: (progress: number) => void): Promise<any> {
    try {
      // Get company details
      const { data: scanRequest } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('id', this.scanRequestId)
        .single();

      if (!scanRequest) {
        throw new Error('Scan request not found');
      }

      const companyName = scanRequest.company_name;

      // 1. Generate deep-dive sections for each criterion (40% progress)
      jobProgress?.(10);
      await this.generateDeepDiveSections(companyName);
      jobProgress?.(40);

      // 2. Calculate total weighted score
      const totalScore = this.scoringResults.reduce((sum, r) => sum + r.weightedScore, 0);

      // 3. Generate executive summary (60% progress)
      const executiveSummary = await this.generateExecutiveSummary(companyName, totalScore);
      jobProgress?.(60);

      // 4. Generate risk register (75% progress)
      const riskRegister = await this.generateRiskRegister(companyName);
      jobProgress?.(75);

      // 5. Generate value creation roadmap (90% progress)
      const valueCreationRoadmap = await this.generateValueCreationRoadmap(companyName);
      jobProgress?.(90);

      // 6. Compile final report
      const report = {
        company_name: companyName,
        website_url: scanRequest.website_url,
        thesis_type: this.investmentThesisData.thesisType,
        thesis_config: this.investmentThesisData,
        
        // Executive Investment Memo
        executive_memo: executiveSummary,
        
        // Weighted Scores
        weighted_scores: {
          totalScore,
          threshold: this.threshold * 100,
          passed: totalScore >= this.threshold * 100,
          breakdown: this.scoringResults.map(r => ({
            category: r.criterion,
            weight: r.weight,
            rawScore: r.rawScore,
            weightedScore: r.weightedScore,
            evidenceRefs: r.evidenceRefs
          }))
        },
        
        // Deep Dive Sections
        deep_dive_sections: this.scoringResults.map(r => ({
          title: r.criterion,
          weight: r.weight,
          rawScore: r.rawScore,
          weightedScore: r.weightedScore,
          findings: r.findings,
          recommendations: r.recommendations,
          evidenceRefs: r.evidenceRefs
        })),
        
        // Technical Focus Areas
        technical_focus_areas: this.generateTechnicalFocusAreas(),
        
        // Risk Register
        risk_register: riskRegister,
        
        // Value Creation Roadmap
        value_creation_roadmap: valueCreationRoadmap,
        
        // Financial Cross-checks (placeholder for now)
        financial_crosschecks: {
          dataAvailable: false,
          message: "Financial data requires data room access"
        },
        
        // Final Recommendation
        recommendation: {
          decision: executiveSummary.decision,
          conditions: executiveSummary.conditions,
          nextSteps: executiveSummary.nextSteps,
          overallScore: totalScore,
          threshold: this.threshold * 100
        },
        
        metadata: {
          generatedAt: new Date().toISOString(),
          evidenceCount: this.evidenceItems.length,
          modelVersion: 'claude-3-sonnet-20240229',
          reportVersion: '2.0-thesis-aligned'
        }
      };

      // Save to database
      const { data: savedReport, error } = await supabase
        .from('reports')
        .insert({
          scan_request_id: this.scanRequestId,
          company_name: companyName,
          website_url: scanRequest.website_url,
          report_type: 'thesis-aligned',
          report_data: report,
          thesis_type: this.investmentThesisData.thesisType,
          thesis_config: this.investmentThesisData,
          weighted_scores: report.weighted_scores,
          executive_memo: report.executive_memo,
          deep_dive_sections: report.deep_dive_sections,
          risk_register: report.risk_register,
          value_creation_roadmap: report.value_creation_roadmap,
          recommendation: report.recommendation
        })
        .select()
        .single();

      if (error) throw error;

      // Also save detailed scoring results
      if (savedReport) {
        await this.saveScoringResults(savedReport.id);
        await this.saveRiskItems(savedReport.id, riskRegister);
        await this.saveValueCreationInitiatives(savedReport.id, valueCreationRoadmap);
      }

      jobProgress?.(100);
      return savedReport;

    } catch (error) {
      console.error('Error generating thesis-aligned report:', error);
      throw error;
    }
  }

  private async generateDeepDiveSections(companyName: string) {
    const criteria = this.investmentThesisData.criteria;
    
    for (const criterion of criteria) {
      const prompt = generateSectionPrompt(
        criterion.name,
        criterion.weight,
        criterion.description,
        this.evidenceItems,
        this.investmentThesisData.thesisType,
        companyName
      );

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      
      try {
        const result = JSON.parse(content);
        
        this.scoringResults.push({
          criterion: criterion.name,
          weight: criterion.weight,
          rawScore: result.rawScore,
          weightedScore: (result.rawScore * criterion.weight) / 100,
          evidenceRefs: this.extractEvidenceRefs(content),
          findings: result.findings,
          recommendations: result.recommendations
        });
      } catch (e) {
        console.error(`Failed to parse section for ${criterion.name}:`, e);
        // Add a default low score if parsing fails
        this.scoringResults.push({
          criterion: criterion.name,
          weight: criterion.weight,
          rawScore: 30,
          weightedScore: (30 * criterion.weight) / 100,
          evidenceRefs: [],
          findings: [],
          recommendations: []
        });
      }
    }
  }

  private async generateExecutiveSummary(companyName: string, totalScore: number) {
    const prompt = generateExecutiveSummaryPrompt(
      companyName,
      this.investmentThesisData,
      this.scoringResults,
      totalScore,
      this.threshold * 100
    );

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse executive summary:', e);
      return {
        thesisFitSummary: "Analysis indicates moderate alignment with investment thesis.",
        topUpsides: [],
        topRisks: [],
        decision: totalScore >= this.threshold * 100 ? "Proceed with Conditions" : "Decline",
        conditions: ["Obtain detailed technical documentation"],
        nextSteps: ["Schedule management presentation"]
      };
    }
  }

  private async generateRiskRegister(companyName: string) {
    const concernFindings = this.scoringResults.flatMap(r => 
      r.findings.filter(f => f.impact === 'negative')
    );

    const prompt = generateRiskRegisterPrompt(concernFindings, companyName);

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      const result = JSON.parse(content);
      return result.risks || [];
    } catch (e) {
      console.error('Failed to parse risk register:', e);
      return [];
    }
  }

  private async generateValueCreationRoadmap(companyName: string) {
    const prompt = generateValueCreationPrompt(
      this.investmentThesisData,
      this.scoringResults,
      companyName
    );

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      const result = JSON.parse(content);
      return result.initiatives || [];
    } catch (e) {
      console.error('Failed to parse value creation roadmap:', e);
      return [];
    }
  }

  private generateTechnicalFocusAreas() {
    const focusAreaScores: Record<string, { maturity: number; evidence: string[]; notes: string }> = {};
    
    // Map focus areas to evidence and calculate maturity scores
    for (const focusArea of this.investmentThesisData.focusAreas) {
      // Search for evidence related to this focus area
      const relatedEvidence = this.evidenceItems.filter(item => {
        const content = JSON.stringify(item.content_data).toLowerCase();
        return content.includes(focusArea.replace(/-/g, ' '));
      });

      // Calculate maturity based on evidence quality and findings
      let maturity = 3; // Default to medium
      if (relatedEvidence.length > 3) maturity = 4;
      if (relatedEvidence.length > 5) maturity = 5;
      if (relatedEvidence.length === 0) maturity = 2;

      focusAreaScores[focusArea] = {
        maturity,
        evidence: relatedEvidence.slice(0, 3).map((_, i) => `⟦${i + 1}⟧`),
        notes: this.getFocusAreaNotes(focusArea, relatedEvidence)
      };
    }

    return focusAreaScores;
  }

  private getFocusAreaNotes(focusArea: string, evidence: any[]): string {
    const focusAreaNotes: Record<string, string> = {
      'cloud-native': evidence.length > 0 ? 'Cloud infrastructure detected' : 'No clear cloud architecture evidence',
      'scalable-architecture': evidence.length > 0 ? 'Scalability patterns identified' : 'Scalability assessment pending',
      'devops-maturity': evidence.length > 0 ? 'CI/CD practices observed' : 'DevOps maturity unclear',
      'microservices': evidence.length > 0 ? 'Service architecture detected' : 'Architecture style unclear',
      'api-driven': evidence.length > 0 ? 'API-first approach confirmed' : 'API coverage unknown',
      'test-coverage': evidence.length > 0 ? 'Testing practices identified' : 'Test coverage data needed',
      'security-focus': evidence.length > 0 ? 'Security measures in place' : 'Security posture unknown'
    };

    return focusAreaNotes[focusArea] || 'Assessment pending';
  }

  private extractEvidenceRefs(content: string): string[] {
    const refs: string[] = [];
    const matches = content.matchAll(/⟦(\d+)⟧/g);
    for (const match of matches) {
      refs.push(`⟦${match[1]}⟧`);
    }
    return [...new Set(refs)]; // Remove duplicates
  }

  private async saveScoringResults(reportId: string) {
    const scoringData = this.scoringResults.map(r => ({
      report_id: reportId,
      criterion: r.criterion,
      weight: r.weight / 100, // Convert to decimal
      raw_score: r.rawScore,
      weighted_score: r.weightedScore,
      evidence_refs: r.evidenceRefs,
      findings: r.findings,
      recommendations: r.recommendations
    }));

    await supabase.from('scoring_results').insert(scoringData);
  }

  private async saveRiskItems(reportId: string, risks: RiskItem[]) {
    const riskData = risks.map(r => ({
      report_id: reportId,
      risk_code: r.code,
      risk_description: r.description,
      likelihood: r.likelihood,
      impact: r.impact,
      mitigation: r.mitigation,
      owner: r.owner,
      cost_estimate: r.costEstimate,
      evidence_refs: r.evidenceRefs
    }));

    if (riskData.length > 0) {
      await supabase.from('risk_items').insert(riskData);
    }
  }

  private async saveValueCreationInitiatives(reportId: string, initiatives: ValueCreationInitiative[]) {
    const initiativeData = initiatives.map(i => ({
      report_id: reportId,
      initiative_name: i.name,
      timeline_bucket: i.timelineBucket,
      expected_impact: i.expectedImpact,
      cost_estimate: i.costEstimate,
      roi_estimate: i.roiEstimate,
      owner: i.owner,
      thesis_alignment: i.thesisAlignment,
      evidence_refs: i.evidenceRefs
    }));

    if (initiativeData.length > 0) {
      await supabase.from('value_creation_initiatives').insert(initiativeData);
    }
  }
}

// Create the worker to process thesis-aligned reports
const reportGenerationWorker = new Worker(
  'report-generation',
  async (job: Job) => {
    // Only process thesis-aligned report jobs
    if (job.name !== 'generate-thesis-aligned-report') {
      console.log(`Skipping job ${job.id} - not a thesis-aligned report`)
      return null
    }
    
    console.log(`Processing thesis-aligned report generation job ${job.id}`);
    
    const { scanRequestId } = job.data;
  
  try {
    // Get scan request with investment thesis data
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .select('*, investment_thesis_data')
      .eq('id', scanRequestId)
      .single();

    if (scanError || !scanRequest) {
      throw new Error('Scan request not found');
    }

    if (!scanRequest.investment_thesis_data) {
      throw new Error('No investment thesis data found for scan request');
    }

    // Get evidence items through collections
    // First, find evidence collections for this company
    const companyName = scanRequest.company_name;
    const { data: collections, error: collectionError } = await supabase
      .from('evidence_collections')
      .select('id')
      .eq('company_name', companyName)
      .order('created_at', { ascending: false })
      .limit(1);

    if (collectionError || !collections || collections.length === 0) {
      console.log('No evidence collections found, using empty evidence');
    }

    let evidenceItems: any[] = [];
    
    if (collections && collections.length > 0) {
      const collectionId = collections[0].id;
      
      // Get evidence items from the collection
      const { data: items, error: evidenceError } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('collection_id', collectionId);

      if (evidenceError) {
        console.error('Error fetching evidence items:', evidenceError);
      } else if (items) {
        // Transform to expected format
        evidenceItems = items.map(item => ({
          id: item.id,
          evidence_type: item.type || 'webpage_content',
          source_url: item.source_data?.url || '',
          content_data: {
            text: item.content_data?.raw || item.content_data?.processed || item.content_data?.summary || '',
            summary: item.content_data?.summary || ''
          },
          metadata: {
            ...item.metadata,
            confidence: item.metadata?.confidence || 70
          }
        }));
      }
    }
    
    console.log(`Found ${evidenceItems.length} evidence items for analysis`);

    // Initialize generator
    const generator = new ThesisAlignedReportGenerator({
      scanRequestId,
      investmentThesisData: scanRequest.investment_thesis_data,
      evidenceItems: evidenceItems || []
    });

    // Generate report with progress updates
    const report = await generator.generate(async (progress) => {
      await job.updateProgress(progress);
    });

    // Update scan request status
    await supabase
      .from('scan_requests')
      .update({ 
        status: 'awaiting_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', scanRequestId);

    return {
      reportId: report.id,
      success: true
    };

  } catch (error) {
    console.error('Error in thesis-aligned report generation:', error);
    
    // Update scan request with error
    const errorMessage = error instanceof Error ? error.message : String(error);
    await supabase
      .from('scan_requests')
      .update({ 
        status: 'error',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', scanRequestId);

    throw error;
  }
  },
  {
    connection: redisConnection,
    concurrency: 1
  }
);

// Worker event handlers
reportGenerationWorker.on('completed', (job) => {
  console.log(`✅ Thesis-aligned report generation completed for job ${job.id}`);
});

reportGenerationWorker.on('failed', (job, err) => {
  console.error(`❌ Thesis-aligned report generation failed for job ${job?.id}:`, err);
});

console.log('Thesis-aligned report generation worker started');