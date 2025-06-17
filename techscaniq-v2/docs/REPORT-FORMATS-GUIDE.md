# Report Formats Guide

## Overview

TechScanIQ v2 supports two distinct report formats, each tailored for specific use cases and audiences:

1. **Sales Intelligence (BMO - Business Market Opportunity)** - For sales teams pursuing enterprise deals
2. **PE Due Diligence** - For investment committees evaluating acquisition opportunities

## Sales Intelligence Report Format

### Purpose
Help sales teams understand a prospect's technology landscape, business priorities, and buying signals to craft compelling proposals and close deals faster.

### Target Audience
- Account Executives
- Solution Engineers
- Sales Leadership
- Customer Success Teams

### Report Structure

#### 1. Executive Overview (15% weight)
- Company snapshot (size, revenue, industry position)
- Current technology landscape summary
- Key business priorities and initiatives
- Decision-making structure
- Budget cycles and procurement processes

#### 2. Current Technology Landscape (25% weight)
**Subsections:**
- Core Technology Stack
- Integration Ecosystem
- Technology Maturity Assessment
- Innovation Initiatives

**Key Insights:**
- Detailed mapping of technologies in use
- Integration points and API ecosystem
- Technology refresh cycles
- Technical debt and modernization needs
- Cloud adoption status

#### 3. Strategic Business Priorities (20% weight)
- Publicly stated strategic initiatives
- Digital transformation priorities
- Competitive pressures and market dynamics
- Regulatory compliance requirements
- Customer experience improvement goals

#### 4. Buying Signals & Opportunities (20% weight)
**Subsections:**
- Technology Gaps
- Pain Points
- Budget Indicators
- Timing Signals

**Actionable Intelligence:**
- Identified technology gaps vs competitors
- Public complaints or challenges
- Recent funding announcements
- Leadership changes indicating new priorities
- Contract renewal timelines

#### 5. Key Stakeholders & Decision Makers (10% weight)
- C-suite executives and backgrounds
- IT leadership structure
- Procurement and finance contacts
- Technical influencers
- Board members with relevant expertise

#### 6. Competitive Intelligence (10% weight)
- Current vendor relationships
- Recent vendor switches
- Satisfaction levels with current solutions
- RFP history and selection criteria
- Partner ecosystem

### Output Focus
- **Action-oriented insights** for immediate use
- **Specific engagement strategies** for each stakeholder
- **Timing recommendations** for outreach
- **Value proposition alignment** with priorities
- **Competitive displacement opportunities**

## PE Due Diligence Report Format

### Purpose
Provide comprehensive investment analysis for private equity firms evaluating technology companies for potential acquisition or investment.

### Target Audience
- Investment Committee Members
- Partners and Principals
- Operating Partners
- Deal Team Members

### Report Structure

#### 1. Executive Summary (15% weight)
- Investment recommendation (STRONG BUY/BUY/HOLD/PASS)
- Confidence level and rationale
- Top 3-5 investment highlights
- Critical risks and mitigation strategies
- Deal structure recommendations
- Expected returns and exit scenarios

#### 2. Technology & Product Assessment (25% weight)
**Subsections:**
- Architecture & Scalability
- Technical Debt Analysis
- IP & Competitive Moat
- R&D Capabilities

**Deep Analysis:**
- Technical architecture evaluation
- Scalability limits and constraints
- Technical debt quantification
- Proprietary technology assessment
- Engineering team quality
- Product roadmap viability

#### 3. Market & Competitive Analysis (20% weight)
**Subsections:**
- TAM/SAM/SOM Analysis
- Competitive Positioning
- Market Dynamics
- Growth Vectors

**Market Intelligence:**
- Market size with clear methodology
- Market share and trajectory
- Competitive advantages/disadvantages
- Industry growth rates
- Regulatory considerations
- International expansion potential

#### 4. Financial Analysis (20% weight)
**Subsections:**
- Revenue Quality
- Unit Economics
- Cash Flow Dynamics
- Financial Projections

**Financial Deep Dive:**
- Revenue composition (recurring vs one-time)
- Customer concentration analysis
- LTV/CAC ratios and trends
- Gross margins and improvement potential
- Burn rate and runway
- Working capital requirements

#### 5. Risk Assessment & Mitigation (10% weight)
**Risk Categories:**
- Technology Risks
- Market Risks
- Execution Risks
- Financial Risks

**Risk Analysis:**
- Probability and impact assessment
- Specific mitigation strategies
- Deal breakers vs manageable risks
- Scenario planning
- Downside protection

#### 6. Value Creation Opportunities (10% weight)
- Operational improvements
- Revenue expansion strategies
- Cost optimization potential
- Strategic acquisition targets
- Platform play opportunities
- Exit strategy and timeline

### Output Focus
- **Quantitative analysis** with supporting data
- **Risk-adjusted return** projections
- **Clear go/no-go** recommendation
- **Specific value creation** roadmap
- **Deal structuring** considerations

## Key Differences

| Aspect | Sales Intelligence | PE Due Diligence |
|--------|-------------------|------------------|
| **Primary Goal** | Win the deal | Make investment decision |
| **Time Horizon** | Near-term (3-12 months) | Long-term (3-7 years) |
| **Risk Focus** | Objection handling | Downside protection |
| **Financial Depth** | Budget and pricing | Full financial analysis |
| **Technical Focus** | Integration points | Scalability & debt |
| **Output** | Engagement strategy | Investment recommendation |
| **Key Metrics** | Buying signals, timing | IRR, multiple, risks |

## Using Report Formats

### Specifying Report Type

```typescript
import { runFormatAwareResearch } from './orchestrator/formatAwareGraph';

// For Sales Intelligence
const salesResult = await runFormatAwareResearch(thesis, {
  reportType: 'sales-intelligence',
  maxIterations: 2,
  useSonar: true,
  useMarketContext: true,
});

// For PE Due Diligence
const peResult = await runFormatAwareResearch(thesis, {
  reportType: 'pe-due-diligence',
  maxIterations: 3,
  useSonar: true,
  useMarketContext: true,
});
```

### Report Validation

The system automatically validates report completeness:
- Required sections must be present
- Section weights must sum to 100%
- Key metrics must be populated
- Citations must support claims

### Format Selection Guidelines

**Choose Sales Intelligence when:**
- Preparing for enterprise sales engagement
- Need to understand buying process
- Looking for specific opportunities
- Require stakeholder mapping
- Want competitive intelligence

**Choose PE Due Diligence when:**
- Evaluating investment opportunity
- Need comprehensive risk assessment
- Require financial deep dive
- Planning value creation
- Determining exit strategy

## Best Practices

### For Sales Intelligence Reports
1. Focus on **actionable insights** over analysis
2. Highlight **specific pain points** to address
3. Map **decision makers** with contact info
4. Identify **budget cycles** and timing
5. Provide **talk tracks** for objections

### For PE Due Diligence Reports
1. Be **brutally honest** about risks
2. Quantify everything possible
3. Validate **all assumptions**
4. Consider **multiple scenarios**
5. Focus on **value creation** potential

## Integration with Market Context

Both report formats integrate with market context awareness:
- Sales Intelligence adjusts for SMB vs Enterprise buyers
- PE Due Diligence evaluates based on target market
- Technical assessments consider market appropriateness
- Recommendations align with market realities

## Future Enhancements

1. **Industry-Specific Templates** - Customize for SaaS, FinTech, HealthTech
2. **Dynamic Section Weights** - Adjust based on company stage
3. **Comparative Analysis** - Side-by-side competitor reports
4. **Scenario Modeling** - Interactive what-if analysis
5. **Executive Briefing Format** - Ultra-condensed 1-page summary