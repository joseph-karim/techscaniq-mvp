/**
 * Report Format Definitions for Different Use Cases
 * 
 * This file defines the structure and requirements for different report types:
 * 1. Sales Intelligence (BMO - Business Market Opportunity)
 * 2. PE Due Diligence (Private Equity Investment Analysis)
 */

import { ResearchState, ReportSection } from '../types';

export interface ReportFormat {
  type: 'sales-intelligence' | 'pe-due-diligence';
  sections: ReportSectionConfig[];
  metadata: {
    targetAudience: string;
    focusAreas: string[];
    deliveryFormat: string;
  };
}

export interface ReportSectionConfig {
  id: string;
  title: string;
  weight: number;
  required: boolean;
  subsections?: string[];
  contentGuidelines: string[];
  keyMetrics?: string[];
}

/**
 * Sales Intelligence Report Format (BMO - Business Market Opportunity)
 * 
 * Purpose: Help sales teams understand a prospect's technology landscape,
 * business priorities, and buying signals to craft compelling proposals.
 */
export const SALES_INTELLIGENCE_FORMAT: ReportFormat = {
  type: 'sales-intelligence',
  sections: [
    {
      id: 'executive_overview',
      title: 'Executive Overview',
      weight: 0.15,
      required: true,
      contentGuidelines: [
        'Company snapshot: size, revenue, industry position',
        'Current technology landscape summary',
        'Key business priorities and initiatives',
        'Decision-making structure and key stakeholders',
        'Budget cycles and procurement processes'
      ],
      keyMetrics: ['employee_count', 'revenue', 'growth_rate', 'market_share']
    },
    {
      id: 'technology_landscape',
      title: 'Current Technology Landscape',
      weight: 0.25,
      required: true,
      subsections: [
        'Core Technology Stack',
        'Integration Ecosystem',
        'Technology Maturity Assessment',
        'Innovation Initiatives'
      ],
      contentGuidelines: [
        'Detailed mapping of current technologies in use',
        'Integration points and API ecosystem',
        'Technology refresh cycles and upgrade patterns',
        'Technical debt and modernization needs',
        'Cloud adoption status and strategy'
      ],
      keyMetrics: ['tech_stack_age', 'cloud_adoption_percentage', 'api_integrations']
    },
    {
      id: 'business_priorities',
      title: 'Strategic Business Priorities',
      weight: 0.20,
      required: true,
      contentGuidelines: [
        'Publicly stated strategic initiatives',
        'Digital transformation priorities',
        'Competitive pressures and market dynamics',
        'Regulatory compliance requirements',
        'Customer experience improvement goals'
      ]
    },
    {
      id: 'buying_signals',
      title: 'Buying Signals & Opportunities',
      weight: 0.20,
      required: true,
      subsections: [
        'Technology Gaps',
        'Pain Points',
        'Budget Indicators',
        'Timing Signals'
      ],
      contentGuidelines: [
        'Identified technology gaps vs competitors',
        'Public complaints or challenges mentioned',
        'Recent funding or budget announcements',
        'Leadership changes indicating new priorities',
        'Contract renewal timelines for existing vendors'
      ]
    },
    {
      id: 'stakeholder_analysis',
      title: 'Key Stakeholders & Decision Makers',
      weight: 0.10,
      required: true,
      contentGuidelines: [
        'C-suite executives and their backgrounds',
        'IT leadership and reporting structure',
        'Procurement and finance contacts',
        'Technical influencers and architects',
        'Board members with relevant expertise'
      ]
    },
    {
      id: 'competitive_intelligence',
      title: 'Competitive Intelligence',
      weight: 0.10,
      required: true,
      contentGuidelines: [
        'Current vendor relationships',
        'Recent vendor switches or implementations',
        'Satisfaction levels with current solutions',
        'RFP history and vendor selection criteria',
        'Partner ecosystem and alliances'
      ]
    }
  ],
  metadata: {
    targetAudience: 'Sales Teams, Account Executives, Solution Engineers',
    focusAreas: ['Technology Gaps', 'Buying Signals', 'Decision Makers', 'Budget Timing'],
    deliveryFormat: 'Action-oriented insights with specific engagement strategies'
  }
};

/**
 * PE Due Diligence Report Format
 * 
 * Purpose: Provide comprehensive investment analysis for private equity firms
 * evaluating technology companies for potential acquisition or investment.
 */
export const PE_DUE_DILIGENCE_FORMAT: ReportFormat = {
  type: 'pe-due-diligence',
  sections: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      weight: 0.15,
      required: true,
      contentGuidelines: [
        'Investment recommendation with confidence level',
        'Valuation range and key assumptions',
        'Top 3-5 investment highlights',
        'Critical risks and mitigation strategies',
        'Deal structure recommendations'
      ]
    },
    {
      id: 'technology_assessment',
      title: 'Technology & Product Assessment',
      weight: 0.25,
      required: true,
      subsections: [
        'Architecture & Scalability',
        'Technical Debt Analysis',
        'IP & Competitive Moat',
        'R&D Capabilities'
      ],
      contentGuidelines: [
        'Deep technical architecture evaluation',
        'Scalability limits and growth constraints',
        'Technical debt quantification and remediation costs',
        'Proprietary technology and defensibility',
        'Engineering team quality and retention risks'
      ],
      keyMetrics: ['tech_debt_ratio', 'r&d_spending', 'engineering_retention', 'performance_metrics']
    },
    {
      id: 'market_analysis',
      title: 'Market & Competitive Analysis',
      weight: 0.20,
      required: true,
      subsections: [
        'TAM/SAM/SOM Analysis',
        'Competitive Positioning',
        'Market Dynamics',
        'Growth Vectors'
      ],
      contentGuidelines: [
        'Total addressable market sizing with methodology',
        'Market share and competitive position',
        'Industry growth rates and secular trends',
        'Regulatory landscape and compliance requirements',
        'International expansion opportunities'
      ],
      keyMetrics: ['tam_size', 'market_share', 'growth_rate', 'win_rate']
    },
    {
      id: 'financial_analysis',
      title: 'Financial Analysis',
      weight: 0.20,
      required: true,
      subsections: [
        'Revenue Quality',
        'Unit Economics',
        'Cash Flow Dynamics',
        'Financial Projections'
      ],
      contentGuidelines: [
        'Revenue composition and quality (recurring vs one-time)',
        'Customer concentration and churn analysis',
        'Gross margins and path to profitability',
        'Working capital requirements',
        'CapEx needs and R&D investment requirements'
      ],
      keyMetrics: ['revenue_growth', 'gross_margin', 'ltv_cac', 'burn_rate', 'runway']
    },
    {
      id: 'risk_assessment',
      title: 'Risk Assessment & Mitigation',
      weight: 0.10,
      required: true,
      subsections: [
        'Technology Risks',
        'Market Risks',
        'Execution Risks',
        'Financial Risks'
      ],
      contentGuidelines: [
        'Technical obsolescence and disruption risks',
        'Competitive threats and market share erosion',
        'Key person dependencies and succession planning',
        'Customer concentration and platform risks',
        'Cybersecurity and data privacy exposure'
      ]
    },
    {
      id: 'value_creation',
      title: 'Value Creation Opportunities',
      weight: 0.10,
      required: true,
      contentGuidelines: [
        'Operational improvement opportunities',
        'Revenue expansion strategies',
        'Cost optimization potential',
        'Strategic acquisition targets',
        'Exit strategy options and timeline'
      ]
    }
  ],
  metadata: {
    targetAudience: 'Investment Committee, Partners, Operating Partners',
    focusAreas: ['Investment Thesis', 'Risk/Return', 'Value Creation', 'Exit Strategy'],
    deliveryFormat: 'Comprehensive analysis with quantitative support and risk assessment'
  }
};

/**
 * Helper function to get the appropriate report format based on context
 */
export function getReportFormat(context: {
  type?: 'sales-intelligence' | 'pe-due-diligence';
  thesis?: any;
  metadata?: any;
}): ReportFormat {
  // Determine report type from context
  if (context.type === 'sales-intelligence') {
    return SALES_INTELLIGENCE_FORMAT;
  }
  
  if (context.type === 'pe-due-diligence') {
    return PE_DUE_DILIGENCE_FORMAT;
  }
  
  // Default detection based on thesis or metadata
  if (context.thesis?.metadata?.reportType) {
    return context.thesis.metadata.reportType === 'sales-intelligence' 
      ? SALES_INTELLIGENCE_FORMAT 
      : PE_DUE_DILIGENCE_FORMAT;
  }
  
  // Default to PE due diligence
  return PE_DUE_DILIGENCE_FORMAT;
}

/**
 * Generate section prompts based on report format
 */
export function generateSectionPrompt(
  section: ReportSectionConfig,
  format: ReportFormat,
  state: ResearchState
): string {
  const formatContext = format.type === 'sales-intelligence'
    ? 'for a sales team preparing to engage with this prospect'
    : 'for an investment committee evaluating this opportunity';
    
  return `
Generate the "${section.title}" section ${formatContext}.

Requirements:
${section.contentGuidelines.map(g => `- ${g}`).join('\n')}

${section.subsections ? `
Subsections to include:
${section.subsections.map(s => `- ${s}`).join('\n')}
` : ''}

${section.keyMetrics ? `
Key metrics to highlight:
${section.keyMetrics.map(m => `- ${m}`).join('\n')}
` : ''}

Target audience: ${format.metadata.targetAudience}
Focus: ${format.metadata.focusAreas.join(', ')}

Ensure the content is:
- Specific and actionable
- Supported by evidence
- Appropriate for the ${format.type} context
- ${format.metadata.deliveryFormat}
`;
}

/**
 * Validate report completeness based on format requirements
 */
export function validateReportCompleteness(
  sections: Record<string, ReportSection>,
  format: ReportFormat
): {
  isComplete: boolean;
  missingSections: string[];
  coverage: number;
} {
  const requiredSections = format.sections.filter(s => s.required);
  const missingSections = requiredSections
    .filter(s => !sections[s.id])
    .map(s => s.title);
    
  const totalWeight = format.sections.reduce((sum, s) => sum + s.weight, 0);
  const coveredWeight = format.sections
    .filter(s => sections[s.id])
    .reduce((sum, s) => sum + s.weight, 0);
    
  return {
    isComplete: missingSections.length === 0,
    missingSections,
    coverage: coveredWeight / totalWeight
  };
}