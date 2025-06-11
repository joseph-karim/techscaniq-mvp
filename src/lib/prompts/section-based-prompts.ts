// Section-Based Analysis Prompts for Multi-Stage Report Generation
// Each section is generated independently, then refined by an editor

export interface SectionPrompt {
  id: string;
  sectionName: string;
  tabId: string;
  description: string;
  systemPrompt: string;
  taskDescription: string;
  requiredEvidence: string[];
  outputFormat: string;
  maxTokens: number;
}

// Helper to format evidence for a specific section
export function formatSectionEvidence(evidence: any[], sectionType: string): string {
  // Filter evidence relevant to this section
  const relevantEvidence = evidence.filter(e => {
    const type = e.evidence_type || e.type || '';
    const content = e.content_data?.summary || '';
    
    switch(sectionType) {
      case 'technical':
        return type.includes('tech') || type.includes('stack') || 
               content.includes('technology') || content.includes('API');
      case 'market':
        return type.includes('market') || type.includes('competitor') || 
               type.includes('industry') || content.includes('market');
      case 'team':
        return type.includes('team') || type.includes('leadership') || 
               type.includes('employee') || content.includes('founder');
      case 'financial':
        return type.includes('pricing') || type.includes('revenue') || 
               type.includes('funding') || content.includes('customer');
      default:
        return true;
    }
  });
  
  return relevantEvidence.slice(0, 20).map((item, index) => {
    const chunkId = index + 1;
    const content = item.content_data?.processed || 
                   item.content_data?.summary || 
                   item.summary || '';
    
    return `[${chunkId}] Source: ${item.source_url || 'Unknown'}
Type: ${item.evidence_type || item.type}
Content: ${content.slice(0, 200)}...`;
  }).join('\n\n');
}

// SECTION 1: Executive Summary (Generated LAST after all sections)
export const EXECUTIVE_SUMMARY_PROMPT: SectionPrompt = {
  id: 'executive-summary',
  sectionName: 'Executive Summary',
  tabId: 'executive-summary',
  description: 'High-level synthesis of all findings',
  systemPrompt: 'You are a PE Investment Committee member writing the executive summary of a due diligence report. You synthesize findings from all sections into a concise, actionable summary.',
  taskDescription: 'Create a 300-400 word executive summary that captures the investment opportunity, key strengths, critical risks, and recommendation based on the sectional analyses provided.',
  requiredEvidence: ['all_section_summaries'],
  outputFormat: `{
  "summary": "3-4 paragraph executive summary",
  "investmentThesis": "One sentence thesis alignment statement",
  "keyStrengths": ["Top 3 strengths from analysis"],
  "keyRisks": ["Top 3 risks from analysis"],
  "recommendation": "PROCEED|CONDITIONAL|PASS",
  "confidence": "HIGH|MEDIUM|LOW based on evidence quality"
}`,
  maxTokens: 1000
};

// SECTION 2: Technology Assessment
export const TECHNOLOGY_SECTION_PROMPT: SectionPrompt = {
  id: 'technology-assessment',
  sectionName: 'Technology Stack & Architecture',
  tabId: 'technology-architecture',
  description: 'Technical stack and architecture analysis',
  systemPrompt: 'You are a Technical Due Diligence expert. Analyze ONLY the technical evidence provided. Be specific about what you found and what is missing.',
  taskDescription: 'Analyze the technical evidence to identify technologies, architecture patterns, and technical risks. Cite specific evidence chunks.',
  requiredEvidence: ['technical', 'website', 'job_postings'],
  outputFormat: `{
  "overview": "2-3 sentence overview of technical findings",
  "identifiedStack": {
    "frontend": ["List technologies found with [evidence#]"],
    "backend": ["List technologies found with [evidence#]"],
    "infrastructure": ["List technologies found with [evidence#]"]
  },
  "architectureInsights": ["Key patterns observed with evidence"],
  "technicalStrengths": ["Specific strengths with evidence"],
  "technicalConcerns": ["Specific concerns with evidence"],
  "dataGaps": ["What technical info is missing"],
  "confidenceScore": "0-100 based on evidence completeness"
}`,
  maxTokens: 1500
};

// SECTION 3: Market Position
export const MARKET_SECTION_PROMPT: SectionPrompt = {
  id: 'market-position',
  sectionName: 'Market Position & Competition',
  tabId: 'market-competition',
  description: 'Market opportunity and competitive landscape',
  systemPrompt: 'You are a Market Intelligence Analyst. Report ONLY what the evidence explicitly states about market position and competition.',
  taskDescription: 'Analyze market evidence to assess market size, growth, competitive position, and customer segments based on available data.',
  requiredEvidence: ['market_research', 'competitor_mentions', 'customer_reviews'],
  outputFormat: `{
  "overview": "2-3 sentence market position summary",
  "marketIndicators": {
    "sizeData": ["Any market size mentions with [evidence#]"],
    "growthData": ["Any growth mentions with [evidence#]"],
    "noDataFor": ["TAM", "SAM", "Market share"]
  },
  "competitors": [
    {"name": "Competitor", "context": "How mentioned", "evidence": "[#]"}
  ],
  "customerInsights": {
    "segments": ["Identified segments with evidence"],
    "sentiment": "Overall sentiment from reviews",
    "keyThemes": ["Common themes in feedback"]
  },
  "marketStrengths": ["List with evidence"],
  "marketChallenges": ["List with evidence"],
  "confidenceScore": "0-100"
}`,
  maxTokens: 1500
};

// SECTION 4: Team & Organization
export const TEAM_SECTION_PROMPT: SectionPrompt = {
  id: 'team-organization',
  sectionName: 'Team & Organizational Strength',
  tabId: 'team-organization',
  description: 'Leadership and organizational assessment',
  systemPrompt: 'You are an Organizational Due Diligence expert. Assess the team based only on available evidence about leadership, employees, and culture.',
  taskDescription: 'Evaluate the team strength, leadership quality, and organizational indicators from available evidence.',
  requiredEvidence: ['leadership_profiles', 'employee_data', 'culture_indicators'],
  outputFormat: `{
  "overview": "2-3 sentence team assessment",
  "leadership": {
    "identified": [{"role": "CEO", "name": "If known", "background": "Key facts", "evidence": "[#]"}],
    "strengths": ["Leadership strengths observed"],
    "gaps": ["Leadership gaps or unknowns"]
  },
  "organization": {
    "size": "Employee count if known",
    "growth": "Hiring trends if observable",
    "culture": ["Cultural indicators with evidence"]
  },
  "executionIndicators": ["Signs of execution capability"],
  "teamRisks": ["Identified risks with evidence"],
  "dataGaps": ["Missing organizational info"],
  "confidenceScore": "0-100"
}`,
  maxTokens: 1200
};

// SECTION 5: Financial Analysis
export const FINANCIAL_SECTION_PROMPT: SectionPrompt = {
  id: 'financial-analysis',
  sectionName: 'Financial Health & Unit Economics',
  tabId: 'financial-health',
  description: 'Financial indicators and business model analysis',
  systemPrompt: 'You are a Financial Due Diligence analyst. Extract financial indicators and business model insights from available evidence only.',
  taskDescription: 'Analyze available evidence for financial health indicators, pricing model, and unit economics clues.',
  requiredEvidence: ['pricing_data', 'customer_metrics', 'funding_data'],
  outputFormat: `{
  "overview": "2-3 sentence financial summary",
  "businessModel": {
    "pricing": "What we know about pricing with [evidence#]",
    "customerSize": "Target customer indicators",
    "recurring": "Evidence of subscription/recurring revenue"
  },
  "financialIndicators": {
    "fundingData": ["Known funding with evidence"],
    "growthSignals": ["Growth indicators observed"],
    "efficiencySignals": ["Efficiency indicators"]
  },
  "unitEconomicsClues": {
    "cacIndicators": ["Customer acquisition clues"],
    "retentionSignals": ["Retention/churn clues"],
    "marginIndicators": ["Gross margin clues"]
  },
  "financialStrengths": ["List with evidence"],
  "financialConcerns": ["List with evidence"],
  "dataGaps": ["Critical missing financial data"],
  "confidenceScore": "0-100"
}`,
  maxTokens: 1200
};

// SECTION 6: Risk Assessment
export const RISK_SECTION_PROMPT: SectionPrompt = {
  id: 'risk-assessment',
  sectionName: 'Risk Assessment & Mitigation',
  tabId: 'risk-assessment',
  description: 'Comprehensive risk analysis across all areas',
  systemPrompt: 'You are a Risk Assessment specialist. Identify and categorize risks based on evidence from all analysis areas.',
  taskDescription: 'Compile and prioritize risks identified across technical, market, team, and financial analyses.',
  requiredEvidence: ['all_section_analyses'],
  outputFormat: `{
  "overview": "Overall risk assessment summary",
  "criticalRisks": [
    {
      "risk": "Specific risk",
      "category": "technical|market|team|financial",
      "severity": "HIGH|MEDIUM|LOW",
      "evidence": "From which analysis",
      "mitigation": "Suggested mitigation if any"
    }
  ],
  "dataGapRisks": [
    {
      "unknownArea": "What we don't know",
      "potentialImpact": "Why it matters",
      "diligenceRequired": "How to address"
    }
  ],
  "riskScore": "Overall risk score 0-100 (0=low risk)",
  "mitigationPriorities": ["Top 3 risk mitigation priorities"]
}`,
  maxTokens: 1000
};

// SECTION 7: Investment Recommendation
export const RECOMMENDATION_SECTION_PROMPT: SectionPrompt = {
  id: 'investment-recommendation',
  sectionName: 'Investment Recommendation',
  tabId: 'investment-recommendation',
  description: 'Final investment recommendation and conditions',
  systemPrompt: 'You are an Investment Committee member. Make a recommendation based on all sectional analyses, acknowledging evidence quality.',
  taskDescription: 'Synthesize all findings into a clear investment recommendation with specific conditions and next steps.',
  requiredEvidence: ['all_section_analyses', 'risk_assessment'],
  outputFormat: `{
  "recommendation": "STRONG_BUY|BUY_WITH_CONDITIONS|NEED_MORE_DATA|PASS",
  "rationale": "3-4 sentence rationale",
  "thesisAlignment": {
    "score": "0-100",
    "strengths": ["How it aligns with thesis"],
    "gaps": ["Where it doesn't align"]
  },
  "conditions": [
    "Specific conditions that must be met"
  ],
  "dueDiligencePriorities": [
    "Top 5 additional diligence items needed"
  ],
  "valueCreationOpportunities": [
    "Post-investment improvement areas"
  ],
  "dealBreakers": [
    "Any identified deal breakers"
  ],
  "timeline": "Recommended decision timeline"
}`,
  maxTokens: 1200
};

// MASTER EDITOR PROMPT - Reviews and refines all sections
export const MASTER_EDITOR_PROMPT = {
  systemPrompt: 'You are a Senior PE Partner reviewing a due diligence report. Ensure consistency, identify gaps between sections, and enhance the investment narrative.',
  
  taskDescription: 'Review all report sections for consistency, completeness, and investment thesis alignment. Identify cross-section insights and ensure the narrative flows logically.',
  
  editingInstructions: `
1. Consistency Check:
   - Ensure numbers and facts align across sections
   - Verify evidence citations are consistent
   - Check that risks in one section appear in risk assessment

2. Gap Analysis:
   - Identify missing connections between sections
   - Note where sections contradict each other
   - Highlight areas needing more evidence

3. Narrative Enhancement:
   - Strengthen the investment story
   - Ensure executive summary captures all key points
   - Make recommendations more specific

4. Quality Improvements:
   - Replace vague statements with specific evidence-backed claims  
   - Ensure each section has clear takeaways
   - Add cross-references between related findings`,
   
  outputFormat: `{
  "consistencyIssues": [
    {"issue": "Description", "sections": ["section1", "section2"], "fix": "Suggested fix"}
  ],
  "crossSectionInsights": [
    {"insight": "New insight from combining sections", "relevantSections": ["list"]}
  ],
  "narrativeEnhancements": [
    {"section": "section_id", "enhancement": "Specific improvement"}
  ],
  "additionalDataNeeds": [
    {"need": "What's missing", "impact": "Why it matters", "sections": ["affected sections"]}
  ],
  "editorConfidence": "HIGH|MEDIUM|LOW",
  "readyForDelivery": true|false
}`
};

// Function to generate a single section
export async function generateReportSection(
  prompt: SectionPrompt,
  evidence: any[],
  context: any,
  llm: any
): Promise<any> {
  const sectionEvidence = formatSectionEvidence(evidence, prompt.id);
  
  const fullPrompt = `${prompt.systemPrompt}

${prompt.taskDescription}

Company: ${context.companyName}
Investment Thesis: ${context.investmentThesis}

Relevant Evidence (${evidence.length} total items):
${sectionEvidence}

Generate output in this JSON format:
${prompt.outputFormat}

Remember: Only claim what you can support with evidence. Output ONLY valid JSON.`;

  try {
    const response = await llm.invoke(fullPrompt, { maxTokens: prompt.maxTokens });
    return JSON.parse(response);
  } catch (error) {
    return {
      error: 'Section generation failed',
      overview: 'Unable to analyze due to insufficient evidence or processing error',
      dataGaps: ['Section analysis could not be completed'],
      confidenceScore: 0
    };
  }
}