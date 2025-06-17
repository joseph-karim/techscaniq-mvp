// Market-Context Aware Prompts for TechScanIQ

import { MarketContext } from '../types';

// Export as a template for backward compatibility
export const MARKET_AWARE_TECHNICAL_EVALUATION = `
You are evaluating {company}'s technical infrastructure for investment potential.

CRITICAL CONTEXT:
- Target Market: {marketContext.targetCustomerSize}
- Primary Buyers: {marketContext.primaryBuyers}
- Customer Technical Sophistication: {marketContext.technicalSophistication}
- Market Leader: {marketContext.competitiveContext.marketLeader} ({marketContext.competitiveContext.marketLeaderShare}% share)

EVALUATION FRAMEWORK:
Assess technical decisions through the lens of their ACTUAL market, not Silicon Valley standards.

For {marketContext.targetCustomerSize} customers, prioritize:
{marketPriorities}

SCORING RUBRIC:
- "Appropriate Technology": Does it serve the target market's needs?
- "Overengineering Penalty": Deduct points for unnecessary complexity
- "Stability Premium": Add points for proven, boring technology if market values it
- "Integration Reality": Partner integrations may matter more than APIs
- "Market-Specific Moats": What creates switching costs for THIS market?

Remember: 
- SMBs may prefer PostgreSQL over distributed databases (simpler, cheaper)
- Session auth might be BETTER than OAuth for non-technical users  
- Rate limits that seem "low" might be perfectly adequate
- Missing features that developers want may be irrelevant

Output a nuanced assessment that would help investors understand technical fit for market.
`;

export function getMarketAwareTechnicalEvaluationPrompt(company: string, marketContext: MarketContext): string {
  return `
You are evaluating ${company}'s technical infrastructure for investment potential.

CRITICAL CONTEXT:
- Target Market: ${marketContext.targetCustomerSize}
- Primary Buyers: ${marketContext.primaryBuyers.join(', ')}
- Customer Technical Sophistication: ${marketContext.technicalSophistication}
- Market Leader: ${marketContext.competitiveContext.marketLeader} (${marketContext.competitiveContext.marketLeaderShare}% share)

EVALUATION FRAMEWORK:
Assess technical decisions through the lens of their ACTUAL market, not Silicon Valley standards.

For ${marketContext.targetCustomerSize} customers, prioritize:
${getMarketPriorities(marketContext)}

SCORING RUBRIC:
- "Appropriate Technology": Does it serve the target market's needs?
- "Overengineering Penalty": Deduct points for unnecessary complexity
- "Stability Premium": Add points for proven, boring technology if market values it
- "Integration Reality": Partner integrations may matter more than APIs
- "Market-Specific Moats": What creates switching costs for THIS market?

Remember: 
- SMBs may prefer PostgreSQL over distributed databases (simpler, cheaper)
- Session auth might be BETTER than OAuth for non-technical users  
- Rate limits that seem "low" might be perfectly adequate
- Missing features that developers want may be irrelevant

Output a nuanced assessment that would help investors understand technical fit for market.
`;
}

export const TECHNICAL_EVIDENCE_INTERPRETATION = `
Given this technical evidence about {company}:
{evidence}

And this market context:
- Target Customers: {marketContext.targetCustomerSize} ({customerCount} customers)
- Retention Rate: {retentionRate}%
- Primary Use Case: {primaryUseCase}

Interpret the technical findings appropriately:

1. CONTEXT-AWARE ASSESSMENT
   - How does this tech serve their ACTUAL customers?
   - Is "outdated" tech actually a stability advantage?
   - Are missing features actually needed?

2. COMPETITIVE CONTEXT
   - How does this compare to what {marketContext.competitiveContext.marketLeader} offers?
   - Is technical parity needed or is "good enough" fine?

3. GROWTH IMPLICATIONS
   - Will current tech support expansion plans?
   - What technical investments are actually needed?
   - Where is "technical debt" actually business risk?

Avoid Silicon Valley bias. A company serving accountants doesn't need Kubernetes.
`;

export const API_QUALITY_RUBRIC = {
  Developer: {
    rateLimit: { excellent: 100, good: 50, acceptable: 25, poor: 10 },
    sdkCount: { excellent: 8, good: 5, acceptable: 3, poor: 0 },
    documentation: { excellent: 'Interactive', good: 'Comprehensive', acceptable: 'Basic', poor: 'PDF' },
  },
  SMB: {
    rateLimit: { excellent: 10, good: 5, acceptable: 2, poor: 1 }, // Much lower bar
    sdkCount: { excellent: 0, good: 0, acceptable: 0, poor: 0 }, // Don't need SDKs
    documentation: { excellent: 'Partner Portal', good: 'Integration Guides', acceptable: 'Support Docs', poor: 'None' },
  },
  Enterprise: {
    rateLimit: { excellent: 50, good: 25, acceptable: 10, poor: 5 },
    sdkCount: { excellent: 3, good: 2, acceptable: 1, poor: 0 },
    documentation: { excellent: 'White-label Docs', good: 'Enterprise Guide', acceptable: 'API Reference', poor: 'Basic' },
  }
};

// Helper function to generate market-specific priorities
function getMarketPriorities(context: MarketContext): string {
  const priorities: Record<string, string[]> = {
    SMB: [
      '- Reliability over innovation',
      '- Simple integration with existing tools (QuickBooks, etc.)',
      '- Predictable costs and performance',
      '- Strong data isolation and compliance',
      '- Familiar technology that local IT can support'
    ],
    'Mid-Market': [
      '- Scalability for growth',
      '- API availability for custom integrations',
      '- Multi-user permissions and workflows',
      '- Some modern features but stability crucial',
      '- Professional services availability'
    ],
    Enterprise: [
      '- API-first architecture',
      '- High availability and disaster recovery',
      '- Advanced security and compliance',
      '- Customization and white-labeling',
      '- Global infrastructure'
    ],
    Developer: [
      '- Excellent API design and documentation',
      '- Multiple SDKs and code examples',
      '- High rate limits and low latency',
      '- Modern protocols (GraphQL, WebSockets)',
      '- Active GitHub presence and community'
    ]
  };
  
  return priorities[context.targetCustomerSize]?.join('\n') || '';
}

// Market-specific technical moat evaluation
export const TECHNICAL_MOAT_EVALUATION = `
Evaluate {company}'s technical moat for their {marketContext.targetCustomerSize} market:

MARKET-SPECIFIC MOAT FACTORS:
{moatFactors}

Rate each factor 0-10 based on evidence, considering:
- Is this a real barrier for {marketContext.targetCustomerSize} customers?
- Does technical sophistication create or reduce switching costs?
- Are network effects more important than technical features?

A "technically inferior" product with strong network effects and integrations
often beats a "technically superior" product in {marketContext.targetCustomerSize} markets.
`;

export function getTechnicalMoatEvaluationPrompt(company: string, marketContext: MarketContext): string {
  return `
Evaluate ${company}'s technical moat for their ${marketContext.targetCustomerSize} market:

MARKET-SPECIFIC MOAT FACTORS:
${getMarketMoatFactors(marketContext)}

Rate each factor 0-10 based on evidence, considering:
- Is this a real barrier for ${marketContext.targetCustomerSize} customers?
- Does technical sophistication create or reduce switching costs?
- Are network effects more important than technical features?

A "technically inferior" product with strong network effects and integrations
often beats a "technically superior" product in ${marketContext.targetCustomerSize} markets.
`;
}

function getMarketMoatFactors(context: MarketContext): string {
  const moatFactors: Record<string, string[]> = {
    SMB: [
      '- Integration depth with accounting software',
      '- Ease of use for non-technical users',
      '- Data migration difficulty',
      '- Accountant partner network',
      '- Workflow lock-in and training costs'
    ],
    Enterprise: [
      '- API ecosystem and custom integrations',
      '- Compliance certifications',
      '- SLA guarantees and support',
      '- Customization capabilities',
      '- Global infrastructure presence'
    ],
    Developer: [
      '- API design quality and stability',
      '- SDK quality and maintenance',
      '- Documentation and community',
      '- Performance and reliability',
      '- Feature velocity and innovation'
    ]
  };
  
  return moatFactors[context.targetCustomerSize]?.join('\n') || '';
}

// Example: How Bill.com would be evaluated
export const BILLCOM_MARKET_CONTEXT: MarketContext = {
  targetCustomerSize: 'SMB',
  primaryBuyers: ['CFOs', 'Controllers', 'Accounting Managers'],
  technicalSophistication: 'Low',
  industryNorms: {
    typicalTechStack: ['QuickBooks', 'Excel', 'Basic Cloud Apps'],
    commonIntegrations: ['QuickBooks', 'Xero', 'NetSuite', 'Bank Feeds'],
    regulatoryRequirements: ['SOC2', 'PCI-DSS', 'ACH Compliance']
  },
  competitiveContext: {
    marketLeader: 'QuickBooks',
    marketLeaderShare: 26.66,
    typicalFeatures: ['Invoice Generation', 'Payment Processing', 'Basic Approvals']
  }
};

// This context would automatically adjust scoring:
// - PostgreSQL sharding: ✅ Appropriate for SMB isolation needs
// - 5 req/sec API: ✅ Sufficient for market  
// - No GitHub: ✅ Irrelevant for target buyers
// - Session auth: ✅ Matches user behavior