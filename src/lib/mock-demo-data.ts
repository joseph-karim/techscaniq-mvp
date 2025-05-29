import { Scan } from '@/types';
import { ring4MockReport } from './ring4-mock-report-data';

// --- Enhanced Scan Type for Demo ---
export interface DemoScanRequest extends Scan {
  // id, company_name, status, created_at, etc. are inherited from Scan
  website_url: string;
  description?: string;
  requestor_name: string; // Assuming scan_requests has this
  organization_name: string; // Assuming scan_requests has this
  personaAvailability: ('investor' | 'pe' | 'admin')[];
  pe_report_types_available?: ('deep_dive' | 'enhanced_pe_report')[];
  priority?: 'urgent' | 'high' | 'medium' | 'low' | string;
  // To link to a specific mock report object if needed for demos
  mock_report_id?: string; 
  mock_deep_dive_id?: string;
  mock_enhanced_pe_report_id?: string;
}

// --- Mock Report Structures ---
// Based on the output of report-orchestrator-v3 for a standard report
export interface DemoStandardReport {
  id: string; // Report ID
  scan_request_id?: string;
  company_name: string;
  domain?: string;
  website_url?: string;
  scan_type?: string;
  report_type?: string; // Add optional report_type
  created_at?: string; // Add optional created_at
  executive_summary?: string;
  investment_score?: number; // 0-100
  investment_rationale?: string;
  tech_health_score?: number; // 0-100
  tech_health_grade?: string; // A, B, C, D, F
  sections: Array<{
    title: string;
    content: string;
    subsections?: Array<{
      title: string;
      content: string;
    }>;
  }> | {
    [key: string]: { // e.g., technologyStack, infrastructure, security (legacy format)
      title: string;
      summary: string;
      findings: Array<{
        text: string;
        severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
        evidence_ids?: string[]; // Will map to DemoEvidenceItem crypto_ids
        category?: string;
      }>;
      opportunities?: Array<{ text: string; evidence_ids?: string[] }>;
      recommendations?: Array<{ text: string; evidence_ids?: string[] }>;
      risks?: Array<{ text: string; severity?: string; evidence_ids?: string[] }>;
    };
  };
  evidence_collection_id?: string;
  // Simplified citations for demo - actual ones are more complex
  citations?: Array<{ 
    citation_number: number;
    claim_id: string; // e.g., "security_0"
    evidence_item_id: string; // Should match a _original_crypto_id from a DemoEvidenceItem
    citation_text: string;
    citation_context?: string;
  }>;
  metadata?: {
    analysisDepth?: string;
    processingTime?: number;
    servicesUsed?: string[];
    [key: string]: any;
  };
}

// Placeholder for PE-specific reports - can be expanded based on actual components
export interface DemoDeepDiveReport {
  id: string; // Corresponds to mock_deep_dive_id in DemoScanRequest
  scan_request_id: string;
  company_name: string;
  title: string;
  deep_dive_content: any; // Replace with actual structure later
}

export interface DemoEnhancedPEReport {
  id: string; // Corresponds to mock_enhanced_pe_report_id
  scan_request_id: string;
  company_name: string;
  title: string;
  enhanced_content: any; // Replace with actual structure later
}

// --- Mock Evidence Items ---
// Simplified for linking demo citations
export interface DemoEvidenceItem {
  _original_crypto_id: string; // The ID AI would generate and report.citations would reference
  id: string; // The actual DB primary key (can be same as crypto for mock)
  type: string;
  source_tool?: string;
  source_url?: string;
  content_summary: string;
  content_raw?: string;
  timestamp: string;
}

// CloudNova Solutions - Comprehensive Report
export const mockCloudNovaReport: DemoStandardReport = {
  id: 'report-cloudnova-comprehensive',
  scan_request_id: 'demo-investor-scan-processing-1',
  company_name: 'CloudNova Solutions',
  website_url: 'https://cloudnova.dev',
  report_type: 'standard',
  created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  executive_summary: "CloudNova Solutions represents an exceptional investment opportunity in the rapidly expanding DevOps tools market, currently valued at $15.8B and growing at 22% CAGR. Founded in 2019 by former Google and Netflix engineers, the company has achieved remarkable traction with its innovative CI/CD automation platform that reduces deployment time by 87% on average. With $12.3M ARR growing at 185% year-over-year and serving 156 enterprise customers including Microsoft, Toyota, and Nike, CloudNova has demonstrated strong product-market fit. The company's technical excellence is evident in their world-class engineering team (80% from FAANG companies), sophisticated cloud-native architecture achieving 99.99% uptime, and industry-leading NPS score of 72. Their differentiated approach combining infrastructure-as-code with intelligent automation has created a defensible moat in a competitive landscape. Key investment highlights include exceptional unit economics (LTV:CAC of 5.2:1), rapid payback period of 5.1 months, and net revenue retention of 147%. The proposed Series A valuation of $125M (10x forward ARR) is justified by the company's growth trajectory and strategic position. We strongly recommend investment with expected returns of 8-12x over a 5-year horizon.",
  investment_score: 88,
  investment_rationale: "CloudNova merits a strong investment recommendation based on multiple compelling factors that position it for exceptional growth. The company operates at the intersection of three powerful trends: cloud migration (85% of enterprises by 2025), DevOps adoption (growing 24% annually), and AI-powered automation. Their product solves a critical pain point, reducing deployment failures by 76% and accelerating release cycles from weeks to hours. The founding team's pedigree is exceptional - CEO Michael Chen previously led Kubernetes development at Google, while CTO Sarah Williams architected Netflix's deployment infrastructure handling 1B+ daily deployments. Market timing is optimal with enterprises spending $4.7B annually on DevOps tools, projected to reach $12.8B by 2028. CloudNova's competitive advantages are substantial: proprietary AI that predicts deployment failures with 94% accuracy, 50+ native integrations vs 10-15 for competitors, and the only solution offering true multi-cloud orchestration. Financial performance exceeds benchmarks with 68% gross margins, Rule of 40 score of 117 (185% growth - 68% burn), and a clear path to profitability by Q2 2025. Customer concentration is healthy with no single customer exceeding 4% of revenue. The investment thesis is further strengthened by identified expansion opportunities including European market entry ($3.2B TAM), enterprise tier pricing, and platform marketplace launch. Risk factors are manageable, primarily centered on talent retention and emerging competition from cloud providers.",
  tech_health_score: 92,
  tech_health_grade: 'A+',
  sections: {
    companyOverview: {
      title: "Company Overview & Background",
      summary: "CloudNova Solutions has emerged as a category-defining leader in the DevOps automation space, founded by engineers who experienced deployment challenges firsthand at scale. The company's origin story began when the founders, working on critical infrastructure at Google and Netflix, recognized that even tech giants struggled with deployment complexity, and mid-market companies faced even greater challenges without access to internal tools built by FAANG companies.",
      findings: [
        { text: "Founded in March 2019 in San Francisco by Michael Chen (CEO, ex-Google Kubernetes team lead), Sarah Williams (CTO, ex-Netflix infrastructure architect), and David Park (CPO, ex-Amazon AWS). The founding team previously worked together on open-source Kubernetes contributions, building deep expertise and industry credibility.", category: "Founding Story" },
        { text: "Incorporated as CloudNova Solutions, Inc. in Delaware with headquarters at 585 Howard Street, San Francisco, CA 94105. Additional offices in Seattle (engineering hub, 45 employees), Austin (customer success, 20 employees), and recently opened London office (5 employees) for European expansion.", category: "Corporate Structure" },
        { text: "Mission: 'To democratize world-class deployment infrastructure, making continuous delivery accessible to every development team.' This mission resonates strongly with mid-market companies previously priced out of enterprise solutions.", category: "Mission & Vision" },
        { text: "Current employee count: 142 full-time employees (up from 67 in January 2023). Breakdown: Engineering (67), Sales (28), Customer Success (20), Marketing (12), Product (8), Operations (7). Notable: 45% remote workforce, 38% women (vs 22% industry average), representing 23 nationalities.", category: "Team Composition", evidence_ids: ["cloudnova-team-analysis"] },
        { text: "CloudNova's platform automates the entire CI/CD pipeline using proprietary AI to predict and prevent deployment failures. Key capabilities include: intelligent rollback (reduces downtime 91%), multi-cloud orchestration (AWS, GCP, Azure), GitOps workflow automation, and real-time cost optimization. The platform handles 2.5M+ deployments monthly across all customers.", category: "Product Overview", evidence_ids: ["cloudnova-product-demo"] },
        { text: "Funding history: Seed round of $3.5M (April 2020, led by First Round Capital), Series A of $18M (November 2022, led by Accel Partners with participation from Y Combinator, SV Angel). Total raised: $21.5M. Current runway: 22 months at current burn rate.", category: "Funding Status", evidence_ids: ["cloudnova-funding-history"] },
        { text: "Revenue trajectory: $12.3M ARR as of January 2024, growing from $1.2M (Jan 2022), $4.3M (Jan 2023). Monthly recurring revenue: $1.025M with 14% average monthly growth rate over past 6 months. Path to $30M ARR by end of 2024 appears achievable based on current pipeline.", category: "Financial Performance", evidence_ids: ["cloudnova-financial-metrics"] }
      ]
    },
    technologyAssessment: {
      title: "Technology Architecture & Innovation",
      summary: "CloudNova has built a technically sophisticated platform that stands out in a crowded market through its innovative use of machine learning, elegant architecture, and deep infrastructure expertise. The platform's ability to handle complex multi-cloud deployments while maintaining simplicity for users demonstrates exceptional technical execution.",
      findings: [
        { text: "Core Architecture: Built on a cloud-native, microservices architecture with 34 services deployed on Kubernetes. Primary tech stack: Go (60% of services) for performance-critical components, Python (25%) for ML/data processing, TypeScript/React (15%) for frontend. All services communicate via gRPC with Protocol Buffers, enabling sub-millisecond inter-service latency.", category: "Technical Stack", evidence_ids: ["cloudnova-architecture-review"] },
        { text: "AI/ML Innovation: Proprietary DeploymentBrain™ AI system uses ensemble learning combining LSTM networks for time-series analysis of deployment patterns, gradient boosting for failure prediction, and reinforcement learning for optimization recommendations. Trained on 50M+ historical deployments, achieving 94% accuracy in predicting deployment failures up to 15 minutes before occurrence.", category: "AI Capabilities", evidence_ids: ["cloudnova-ml-whitepaper"] },
        { text: "Infrastructure Scale: Platform runs across 6 AWS regions with automatic failover, handling 50K+ concurrent deployments. Infrastructure specs: 1,200 CPU cores, 8TB RAM, 150TB storage across the fleet. Auto-scaling handles 10x traffic spikes seamlessly. Monthly infrastructure cost: $125K, representing only 10% of revenue (excellent efficiency).", category: "Infrastructure", evidence_ids: ["cloudnova-infrastructure-metrics"] },
        { text: "Performance Metrics: Average deployment time: 3.2 minutes (vs industry average 28 minutes). API latency: p50=12ms, p99=47ms globally. Platform uptime: 99.99% (4 nines) with only 52 minutes total downtime in 2023. Deployment success rate: 98.7% (vs 76% industry average). These metrics significantly exceed competitor benchmarks.", category: "Performance", evidence_ids: ["cloudnova-performance-dashboard"] },
        { text: "Security Architecture: End-to-end encryption for all data in transit and at rest using AES-256. SOC 2 Type II certified, ISO 27001 compliant. Secrets management via HashiCorp Vault with automatic rotation. Role-based access control with fine-grained permissions. Automated security scanning catches 99.2% of vulnerabilities before production. Zero security breaches since inception.", category: "Security", evidence_ids: ["cloudnova-security-audit-2023"] },
        { text: "Developer Experience: RESTful API with GraphQL alternative, comprehensive SDKs for 7 languages. CLI tool with 50+ commands for automation. Terraform provider for infrastructure-as-code. Average time to first deployment: 12 minutes (vs 2-3 days for competitors). Developer documentation rated 9.2/10 in user surveys.", category: "Developer Tools", evidence_ids: ["cloudnova-developer-survey"] },
        { text: "Innovation Pipeline: R&D investment: 28% of revenue (above 20% benchmark for high-growth SaaS). Current projects: 1) Kubernetes cost optimization AI (beta, saving customers 35% on average), 2) Natural language deployment commands, 3) Automated security remediation. 8 patents filed, 3 granted. Publishing 2-3 research papers annually at top conferences.", category: "R&D Investment", evidence_ids: ["cloudnova-innovation-roadmap"] }
      ],
      opportunities: [
        { text: "Launch edge deployment capabilities to support IoT and low-latency applications, addressing a $2.3B adjacent market growing at 34% CAGR", evidence_ids: ["cloudnova-edge-computing-analysis"] },
        { text: "Develop native mobile CI/CD features as 67% of enterprises now prioritize mobile-first development, potentially adding $3M ARR", evidence_ids: ["cloudnova-mobile-market-research"] },
        { text: "Implement quantum-safe cryptography to future-proof security infrastructure and differentiate in enterprise sales cycles", evidence_ids: ["cloudnova-quantum-security-research"] }
      ],
      recommendations: [
        { text: "Accelerate Kubernetes operator development to deepen platform integration and create switching costs. Estimated 6-month project yielding 20% reduction in churn", evidence_ids: ["cloudnova-retention-analysis"] },
        { text: "Establish dedicated performance engineering team to maintain technical advantage as scale increases. Current ad-hoc approach risks degradation", evidence_ids: ["cloudnova-scaling-challenges"] },
        { text: "Open source non-core components to build developer community and accelerate adoption. Successful examples: HashiCorp, Elastic", evidence_ids: ["cloudnova-open-source-strategy"] }
      ]
    },
    marketAnalysis: {
      title: "Market Opportunity & Competitive Landscape",
      summary: "CloudNova operates in one of the fastest-growing segments of the enterprise software market. The DevOps tools market is experiencing unprecedented growth driven by digital transformation initiatives, cloud migration, and the increasing complexity of modern software deployment. CloudNova's positioning at the intersection of CI/CD automation and AI-powered intelligence places it in a sweet spot for capturing market share.",
      findings: [
        { text: "Total Addressable Market (TAM): Global DevOps tools market valued at $15.8B in 2024, projected to reach $32.4B by 2028 (22% CAGR). CI/CD segment specifically represents $4.2B growing at 26% CAGR. CloudNova's serviceable addressable market (SAM) focusing on mid-market to enterprise: $2.8B. Geographic breakdown: North America (45%), Europe (30%), Asia-Pacific (20%), Rest of World (5%).", category: "Market Size", evidence_ids: ["gartner-devops-market-2024"] },
        { text: "Market Drivers: 1) Cloud adoption: 94% of enterprises use cloud, driving need for cloud-native deployment tools. 2) Release frequency: Average deployment frequency increased 74% in past 2 years. 3) Developer shortage: 85% of companies report difficulty hiring DevOps talent, driving automation demand. 4) Cost pressure: Companies seek 30%+ reduction in deployment costs. 5) Security requirements: 67% cite security as top deployment concern.", category: "Growth Drivers", evidence_ids: ["forrester-devops-trends-2024"] },
        { text: "Competitive Landscape: Direct competitors include Jenkins (open source, 40% market share but declining), GitLab CI/CD ($400M revenue, growing 35%), CircleCI ($100M revenue, recent layoffs), GitHub Actions (Microsoft, bundling advantage). CloudNova differentiates through AI capabilities, multi-cloud support, and superior performance. Currently 2.3% market share, up from 0.4% in 2022.", category: "Competition", evidence_ids: ["cloudnova-competitive-analysis"] },
        { text: "Customer Segmentation: Enterprise (>1000 employees): 35% of revenue, $125K average contract value. Mid-market (100-1000): 45% of revenue, $48K ACV. SMB (<100): 20% of revenue, $15K ACV. Vertical breakdown: Technology (40%), Financial Services (20%), Retail/E-commerce (15%), Healthcare (10%), Other (15%). Land-and-expand motion working well with 147% net revenue retention.", category: "Customer Base", evidence_ids: ["cloudnova-customer-analytics"] },
        { text: "Pricing Strategy: Usage-based pricing model with three tiers: Starter ($299/month), Growth ($999/month), Enterprise (custom). Pricing based on deployment frequency, user seats, and compute resources. Average 2.3x expansion in Year 1. Gross margins of 78% enable aggressive pricing while maintaining profitability path.", category: "Pricing Model", evidence_ids: ["cloudnova-pricing-study"] },
        { text: "Go-to-Market Effectiveness: Product-led growth drives 55% of new customers through free trial. Sales-led motion for enterprise accounts with 6-person team achieving 142% of quota. Channel partnerships with AWS, Google Cloud, and Microsoft driving 20% of revenue. Marketing efficiency: CAC of $12K, payback period 5.1 months. Content marketing generates 45K monthly visitors with 4.2% conversion rate.", category: "GTM Strategy", evidence_ids: ["cloudnova-gtm-metrics"] },
        { text: "Competitive Advantages: 1) Technical superiority: 3.2 min avg deployment vs 28 min for competitors. 2) AI differentiation: Only solution with predictive failure prevention. 3) Multi-cloud: True abstraction layer vs single-cloud lock-in. 4) Developer experience: Highest-rated documentation and CLI tools. 5) Network effects: Shared deployment templates create community value. 6) Switching costs: Deep integration makes replacement difficult.", category: "Moat Analysis", evidence_ids: ["cloudnova-competitive-advantages"] }
      ],
      opportunities: [
        { text: "European expansion represents $850M immediate addressable market. GDPR compliance already achieved, local hiring begun. Projected $5M ARR within 18 months", evidence_ids: ["cloudnova-europe-expansion-plan"] },
        { text: "Platform marketplace for deployment templates and plugins could generate additional $2M ARR through 20% revenue share model", evidence_ids: ["cloudnova-marketplace-analysis"] },
        { text: "Vertical-specific solutions for regulated industries (healthcare, finance) with compliance pre-built. $400M TAM with higher ACVs", evidence_ids: ["cloudnova-vertical-strategy"] }
      ],
      risks: [
        { text: "Microsoft GitHub Actions expanding aggressively with free tier and Azure integration. Bundling threat could impact win rates", severity: "high", evidence_ids: ["github-actions-competitive-threat"] },
        { text: "Open source alternatives (ArgoCD, Flux) gaining traction in cost-conscious enterprises. May pressure pricing", severity: "medium", evidence_ids: ["open-source-deployment-tools"] },
        { text: "Economic downturn could delay deployment modernization projects. 30% of pipeline in 'budget review' status", severity: "medium", evidence_ids: ["cloudnova-pipeline-risk-analysis"] }
      ]
    },
    teamAssessment: {
      title: "Leadership Team & Organizational Strength",
      summary: "CloudNova's leadership team represents one of the strongest technical founding teams we've evaluated, with deep domain expertise from building deployment infrastructure at scale. The team's ability to attract top-tier talent and maintain exceptional culture metrics while scaling rapidly demonstrates operational excellence that extends beyond technical capabilities.",
      findings: [
        { text: "CEO - Michael Chen: Previously Tech Lead Manager on Google Kubernetes Engine, where he led the team that built GKE's deployment orchestration serving 1M+ developers. Stanford PhD in Distributed Systems, published 15+ papers on container orchestration. Known for technical depth - still reviews critical PRs. Strong leader who grew his Google team from 5 to 85 engineers. Owns 22% equity stake.", category: "Founders", evidence_ids: ["michael-chen-background"] },
        { text: "CTO - Sarah Williams: Architected Netflix's Spinnaker deployment platform handling 4,000+ daily deployments. MIT graduate, 15 years experience in distributed systems. Holds 8 patents in deployment automation. Keynote speaker at KubeCon, DockerCon. Recognized in 'Top 50 Women in Tech' 2023. Her technical vision drives CloudNova's 3-year roadmap. Owns 20% equity.", category: "Founders", evidence_ids: ["sarah-williams-linkedin"] },
        { text: "CPO - David Park: Former Principal PM at Amazon AWS, launched CodeDeploy service growing to $200M revenue. Harvard MBA, unique combination of technical depth and business acumen. Designed CloudNova's pricing model achieving industry-leading unit economics. Active in product community, 50K Twitter followers. Owns 15% equity.", category: "Founders", evidence_ids: ["david-park-product-leadership"] },
        { text: "VP Engineering - Lisa Zhang: Recruited from Stripe where she scaled the infrastructure team from 20 to 200. Carnegie Mellon alumna, expertise in high-performance systems. Implemented CloudNova's engineering culture resulting in 94% engineer retention rate. Manages distributed team across 3 offices seamlessly. Key hire showing ability to attract A-players.", category: "Leadership Team", evidence_ids: ["cloudnova-leadership-hires"] },
        { text: "VP Sales - Robert Taylor: Former RVP at Datadog, consistently exceeded quota by 150%+. Brought enterprise sales playbook that increased ACV by 240% in 12 months. Built sales team from 3 to 28 reps with rigorous hiring process. Deep relationships with Fortune 500 IT leaders. Revenue grew 10x under his leadership.", category: "Leadership Team", evidence_ids: ["cloudnova-sales-performance"] },
        { text: "Engineering Team Excellence: 67 engineers with remarkable pedigree - 54% from FAANG, 23% with advanced degrees, 12 published researchers. 3 Kubernetes core maintainers on staff. Team contributes 500+ PRs monthly to open source. Glassdoor engineering rating: 4.8/5. Unique '20% time' policy has yielded 5 patented innovations. Gender diversity at 35% (industry avg 19%).", category: "Team Quality", evidence_ids: ["cloudnova-engineering-culture"] },
        { text: "Culture & Values: Core values: 'Developer First, Radical Transparency, Continuous Learning, Customer Obsession'. Monthly all-hands share all metrics including burn rate. Learning budget: $5K/employee annually. Hackathons quarterly with 95% participation. Employee NPS: 67 (exceptional for 140+ person company). No regrettable attrition in past 18 months.", category: "Culture", evidence_ids: ["cloudnova-culture-survey"] },
        { text: "Board & Advisors: Board: Mike Chen (CEO), Peter Wagner (Accel), Josh Kopelman (First Round), 2 independents. Advisory board stellar: Kelsey Hightower (Google, Kubernetes co-founder), Adrian Cockcroft (ex-Netflix/AWS), Jennifer Tejada (PagerDuty CEO). Advisors actively engaged, monthly office hours with team.", category: "Governance", evidence_ids: ["cloudnova-board-composition"] }
      ],
      opportunities: [
        { text: "Establish European engineering hub in Amsterdam or Berlin to tap into strong DevOps talent pool and support regional expansion. Could add 30 engineers at 70% of SF cost", evidence_ids: ["cloudnova-europe-hiring-plan"] },
        { text: "Implement technical leadership development program as 12 senior engineers ready for management roles. Preventing attrition risk", evidence_ids: ["cloudnova-talent-development"] },
        { text: "Create CloudNova University for customer training, potentially generating $1M ARR while deepening customer relationships", evidence_ids: ["cloudnova-education-initiative"] }
      ],
      risks: [
        { text: "Intense talent competition with FAANG companies. Lost 3 senior engineers to OpenAI in Q4. Compensation at 60th percentile needs adjustment", severity: "medium", evidence_ids: ["cloudnova-retention-risk"] },
        { text: "CEO key person dependency - no clear succession plan. Michael's technical vision crucial to product direction", severity: "medium", evidence_ids: ["cloudnova-succession-planning"] },
        { text: "Sales leadership bench thin - VP Sales carrying too much quota responsibility. Need to hire 2-3 directors", severity: "low", evidence_ids: ["cloudnova-sales-org-gaps"] }
      ]
    },
    financialAnalysis: {
      title: "Financial Performance & Projections",
      summary: "CloudNova demonstrates exceptional financial performance with metrics that place it in the top decile of SaaS companies at similar scale. The combination of rapid growth, strong unit economics, and improving operational efficiency creates a compelling financial profile with clear path to profitability.",
      findings: [
        { text: "Revenue Growth: $12.3M ARR growing 185% YoY (from $4.3M in Jan 2023). Monthly growth rate averaging 14% over past 6 months. Quarterly revenue: Q4'23: $3.2M, Q3'23: $2.4M, Q2'23: $1.8M, Q1'23: $1.4M. New ARR added in Q4: $1.8M (accelerating from $1.2M in Q3). Forward revenue visibility strong with $4.2M in contracted revenue for Q1'24.", category: "Revenue Performance", evidence_ids: ["cloudnova-revenue-dashboard"] },
        { text: "Unit Economics Excellence: Gross margins: 78% (up from 72% YoY through infrastructure optimization). CAC: $12K blended ($8K for SMB, $45K for enterprise). LTV: $62K average ($180K for enterprise). LTV:CAC ratio: 5.2:1 (best-in-class is >3:1). Payback period: 5.1 months (exceptional for enterprise SaaS). Magic Number: 1.7 (very efficient growth).", category: "Unit Economics", evidence_ids: ["cloudnova-unit-economics-analysis"] },
        { text: "SaaS Metrics: Net Revenue Retention: 147% (top quartile for PLG companies). Gross Revenue Retention: 94% (logo retention 91%). Monthly churn: 1.8% (vs 5-7% for SMB SaaS). Quick Ratio: 5.2 (growth efficiency). Rule of 40: 117 (185% growth - 68% burn rate). Sales efficiency: $0.85 new ARR per $1 S&M spend.", category: "Key Metrics", evidence_ids: ["cloudnova-saas-metrics-board-deck"] },
        { text: "Burn & Runway: Monthly burn rate: $780K (down from $1.1M in Q1'23 despite 2x headcount growth). Cash balance: $17.2M providing 22 months runway. Path to breakeven at $24M ARR (Q2 2025). Burn multiple: 0.43 (very efficient). Revenue per employee: $87K (approaching $100K benchmark). Free cash flow expected positive by Q4 2025.", category: "Cash Management", evidence_ids: ["cloudnova-financial-statements"] },
        { text: "Cost Structure: OpEx breakdown: R&D: 45% (healthy for growth stage), S&M: 32%, G&A: 23%. Largest costs: Salaries: $580K/month (74%), Infrastructure: $78K (10%), Office/Benefits: $55K (7%), Marketing: $47K (6%), Other: $20K (3%). Stock compensation: $1.8M annually (reasonable 15% of revenue).", category: "Operating Expenses", evidence_ids: ["cloudnova-opex-breakdown"] },
        { text: "Customer Economics: Average Contract Value: $52K (up 140% from $22K in 2022). Largest customer: 3.8% of revenue (healthy concentration). Top 10 customers: 22% of revenue. Contract terms: 67% annual prepay, 28% quarterly, 5% monthly. Expansion revenue: 47% of new ARR from existing customers. Time to value: 2.4 weeks average.", category: "Revenue Quality", evidence_ids: ["cloudnova-customer-metrics"] },
        { text: "Financial Projections: 2024 forecast: $30M ARR (144% growth), 2025: $58M ARR, 2026: $95M ARR. Based on: Current pipeline of $8.5M, 35% historical close rate, 147% NRR, planned European expansion. Breakeven at $24M ARR achievable with current efficiency metrics. IPO ready at $100M ARR (2026).", category: "Growth Projections", evidence_ids: ["cloudnova-financial-model"] }
      ],
      opportunities: [
        { text: "Implement annual payment incentives (15% discount) to improve cash collection by $3M and reduce churn by estimated 20%", evidence_ids: ["cloudnova-payment-terms-analysis"] },
        { text: "Launch premium support tier at $20K/year targeting enterprise customers. 40% indicated interest, potentially adding $2M high-margin ARR", evidence_ids: ["cloudnova-support-tier-research"] },
        { text: "Optimize AWS costs through reserved instances and architectural improvements. Identified $40K/month savings (50% reduction) without performance impact", evidence_ids: ["cloudnova-infrastructure-optimization"] }
      ],
      risks: [
        { text: "Increasing CAC as moving upmarket - enterprise CAC risen 38% in past 6 months. Need to monitor efficiency", severity: "medium", evidence_ids: ["cloudnova-cac-trending"] },
        { text: "Foreign exchange exposure growing with 18% of revenue in EUR/GBP. No hedging strategy currently", severity: "low", evidence_ids: ["cloudnova-fx-risk"] },
        { text: "Deferred revenue collection extending from 45 to 62 days as enterprise customers negotiate payment terms", severity: "low", evidence_ids: ["cloudnova-ar-aging"] }
      ]
    },
    investmentRecommendation: {
      title: "Investment Thesis & Recommendation",
      summary: "CloudNova represents a rare combination of exceptional growth, strong unit economics, technical differentiation, and massive market opportunity. We strongly recommend proceeding with a $5M investment in the Series B round at a $125M post-money valuation, targeting 4% ownership.",
      findings: [
        { text: "Investment Recommendation: STRONG BUY. CloudNova merits our highest conviction based on: 1) Exceptional 185% growth at scale with improving efficiency, 2) World-class founding team with proven execution, 3) Clear technical differentiation validated by customer metrics, 4) Massive $15.8B market growing 22% annually, 5) Best-in-class unit economics with 5.2:1 LTV:CAC, 6) Multiple expansion vectors (geographic, product, vertical), 7) Strong competitive moat with 94% gross retention.", category: "Recommendation", evidence_ids: ["cloudnova-investment-committee-memo"] },
        { text: "Valuation Assessment: Series B at $125M post-money (10x forward ARR) is attractive given: Public comps (GitLab, JFrog) trade at 8-15x but growing 40-60% vs CloudNova's 185%. Recent privates: LaunchDarkly ($3B at 20x), CircleCI ($1.7B at 17x). CloudNova's Rule of 40 score of 117 justifies premium. DCF with 30% discount rate yields $142M valuation. Entry price provides strong risk/reward.", category: "Valuation Analysis", evidence_ids: ["cloudnova-valuation-benchmarks"] },
        { text: "Return Projections: Base case exit in 2028 at $250M ARR, 10x multiple = $2.5B valuation. Our 4% stake worth $100M (20x MOIC). Probability-weighted scenarios: Bear (20%): 3x return if growth slows to 50%, Base (60%): 20x at current trajectory, Bull (20%): 40x if platform vision succeeds. Expected return: 19x exceeding fund's 5x hurdle.", category: "Return Analysis", evidence_ids: ["cloudnova-exit-scenarios"] },
        { text: "Strategic Value: Perfect fit for fund's 'Infrastructure for Digital Transformation' thesis. Synergies with portfolio: DataPipeCo (customer), SecureDevCo (integration partner), CloudCostCo (channel partner). Deal enhances fund reputation in competitive dev tools sector. Leading round positions us for board seat.", category: "Strategic Fit", evidence_ids: ["fund-portfolio-synergies"] },
        { text: "Risk Mitigation: Primary risks manageable: 1) Competition - technical moat and switching costs provide defense, 2) Talent retention - implementing equity refresh and retention bonuses, 3) Market downturn - diverse customer base and critical use case provide resilience, 4) Execution risk - experienced team with proven playbook.", category: "Risk Assessment", evidence_ids: ["cloudnova-risk-mitigation-plan"] },
        { text: "Value Creation Plan: Post-investment initiatives: 1) Introduce to 25 portfolio companies as customers, 2) Recruit VP International from our network, 3) Share pricing optimization playbook from similar investments, 4) Facilitate partnership with major cloud providers, 5) Prepare for Series C with growth equity funds in our network.", category: "Value Add", evidence_ids: ["cloudnova-value-creation-opportunities"] },
        { text: "Deal Terms: Investing $5M of $40M Series B round. Terms negotiated: 1) $125M post (vs $140M ask), 2) 1x liquidation preference, 3) Pro-rata rights through IPO, 4) Board seat (not just observer), 5) Protective provisions standard, 6) Information rights with monthly reporting. Co-leading with Accel ($25M), others: $10M.", category: "Transaction Details", evidence_ids: ["cloudnova-term-sheet-final"] },
        { text: "Exit Strategy: Multiple paths to liquidity: 1) IPO primary path - comparable to GitLab's trajectory, 2) Strategic acquisition - Microsoft, Google, Amazon all potential acquirers, 3) PE rollup - Vista Equity, Thoma Bravo active in space, 4) Secondary opportunities likely at Series C/D. Management aligned on building independent company but pragmatic on exits.", category: "Exit Planning", evidence_ids: ["cloudnova-exit-strategy-discussion"] }
      ],
      recommendations: [
        { text: "Proceed immediately with $5M investment. High-quality deals in dev tools space are rare and competitive. Speed crucial to secure allocation", evidence_ids: ["cloudnova-deal-timing"] },
        { text: "Negotiate for additional board observer seat for operating partner to maximize value creation impact", evidence_ids: ["cloudnova-governance-optimization"] },
        { text: "Reserve $3M for follow-on at Series C to maintain ownership percentage as company scales toward IPO", evidence_ids: ["cloudnova-follow-on-strategy"] },
        { text: "Structure 10% of investment as secondary to provide founder liquidity and ensure long-term alignment", evidence_ids: ["cloudnova-founder-liquidity"] }
      ]
    }
  },
  evidence_collection_id: 'col-cloudnova-20240115',
  citations: [
    { claim_id: "team_0", evidence_item_id: "cloudnova-team-analysis", citation_text: "45% from FAANG companies", citation_context: "LinkedIn analysis of engineering team backgrounds shows exceptional pedigree", citation_number: 1 },
    { claim_id: "product_0", evidence_item_id: "cloudnova-product-demo", citation_text: "2.5M+ deployments monthly", citation_context: "Production metrics dashboard shows massive scale across customer base", citation_number: 2 },
    { claim_id: "financial_0", evidence_item_id: "cloudnova-financial-metrics", citation_text: "$12.3M ARR growing 185%", citation_context: "Audited financial statements confirm exceptional growth rate", citation_number: 3 },
    // ... more citations
  ],
  metadata: {
    analysisDepth: 'comprehensive',
    processingTime: 34521,
    servicesUsed: ['evidence-collector-v7', 'tech-intelligence-v3', 'market-research-v2'],
    reportVersion: '2.0',
    confidenceScores: {
      technical: 0.94,
      financial: 0.91,
      market: 0.88,
      team: 0.92,
      overall: 0.91
    }
  }
};

// Add more comprehensive reports for other companies...

export const enhancedMockReports = {
  cloudnova: mockCloudNovaReport,
  // We'll add more enhanced reports here
};

// Sample Scan Requests
export const mockDemoScanRequests: DemoScanRequest[] = [
  // Investor Persona Scans
  {
    id: 'demo-investor-scan-pending-1',
    company_id: 'CompA_ID',
    company_name: 'FutureTech Inc.',
    website_url: 'https://futuretech.ai',
    user_id: 'investor-user-123',
    status: 'pending',
    thesis_input: { predefined_tags: ['AI', 'SaaS'], custom_criteria: { primary: 'Scalable AI model' } },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    requestor_name: 'Robert Chen',
    organization_name: 'Alpha Ventures',
    personaAvailability: ['investor', 'admin'],
    priority: 'high',
    mock_report_id: 'report-futuretech-comprehensive'
  },
  {
    id: 'demo-investor-scan-processing-1',
    company_id: 'CompB_ID',
    company_name: 'CloudNova Solutions',
    website_url: 'https://cloudnova.dev',
    user_id: 'investor-user-123',
    status: 'complete',
    thesis_input: { predefined_tags: ['Cloud', 'DevOps'], custom_criteria: { primary: 'CI/CD pipeline efficiency' } },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    requestor_name: 'Alice Morgan',
    organization_name: 'Beta Capital',
    personaAvailability: ['investor', 'admin'],
    priority: 'medium',
    mock_report_id: 'report-cloudnova-comprehensive'
  },
  {
    id: 'a420adbf-65bc-4daa-aef9-d01c04b1e177',
    company_id: 'Ring4_ID',
    company_name: 'Ring4',
    website_url: 'https://ring4.ai',
    user_id: 'investor-user-123',
    status: 'complete',
    thesis_input: { predefined_tags: ['SaaS', 'Communications'], custom_criteria: { primary: 'Technology infrastructure' } },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    requestor_name: 'Demo Admin',
    organization_name: 'TechScanIQ Internal',
    personaAvailability: ['investor', 'admin', 'pe'],
    priority: 'high',
    mock_report_id: 'report-ring4-comprehensive',
    pe_report_types_available: ['deep_dive'],
    mock_deep_dive_id: 'deep-dive-ring4-demo'
  },

  // PE Persona Scans
  {
    id: 'demo-pe-scan-complete-1',
    company_id: 'PE_Target_1_ID',
    company_name: 'Synergy Corp',
    website_url: 'https://synergy-enterprise.com',
    user_id: 'pe-user-456',
    status: 'complete',
    thesis_input: { predefined_tags: ['Enterprise Software'], custom_criteria: { primary: 'Integration capabilities' } },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    requestor_name: 'Patricia Johnson',
    organization_name: 'Growth Equity Partners',
    personaAvailability: ['pe', 'admin'],
    priority: 'urgent',
    mock_report_id: 'report-synergy-comprehensive',
    pe_report_types_available: ['deep_dive', 'enhanced_pe_report'],
    mock_deep_dive_id: 'deep-dive-synergy-demo',
    mock_enhanced_pe_report_id: 'enhanced-synergy-demo'
  },
  {
    id: 'demo-pe-scan-awaiting-review-1',
    company_id: 'PE_Target_2_ID',
    company_name: 'InfraModern',
    website_url: 'https://inframodern.io',
    user_id: 'pe-user-456',
    status: 'awaiting_review',
    thesis_input: { predefined_tags: ['Infrastructure', 'Cloud Migration'], custom_criteria: { primary: 'Cost optimization potential' } },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    requestor_name: 'Alex Thompson',
    organization_name: 'Value Add Investors',
    personaAvailability: ['pe', 'admin'],
    priority: 'medium',
    mock_report_id: 'report-inframodern-comprehensive',
  },
];

// Evidence Items with much more detail
export const mockEvidenceItems: DemoEvidenceItem[] = [
  // CloudNova evidence
  { _original_crypto_id: "cloudnova-team-analysis", id: "cloudnova-team-analysis", type: "team_analysis", source_tool: "LinkedIn Scraper", source_url: "https://linkedin.com/company/cloudnova", content_summary: "Analysis of 142 employee profiles shows 67 engineers (47%), 54% from FAANG companies, 23% with advanced degrees. Notable hires include ex-Stripe VP Engineering Lisa Zhang and ex-Datadog RVP Robert Taylor.", content_raw: "Detailed LinkedIn data export...", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "cloudnova-product-demo", id: "cloudnova-product-demo", type: "product_analysis", source_tool: "Product Demo Recording", content_summary: "Platform demonstration showing 3.2 minute average deployment time, multi-cloud orchestration across AWS/GCP/Azure, and AI-powered failure prediction with 94% accuracy. Live metrics show 2.5M+ monthly deployments.", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "cloudnova-financial-metrics", id: "cloudnova-financial-metrics", type: "financial_data", source_tool: "Financial Statement Analysis", content_summary: "$12.3M ARR as of January 2024, growing from $4.3M (Jan 2023) - 185% YoY growth. MRR: $1.025M with 14% average monthly growth. Gross margins: 78%. Burn rate: $780K/month.", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "cloudnova-architecture-review", id: "cloudnova-architecture-review", type: "technical_architecture", source_tool: "Code Repository Analysis", source_url: "github.com/cloudnova", content_summary: "Microservices architecture with 34 services. Tech stack: Go (60%), Python (25%), TypeScript/React (15%). All services use gRPC with Protocol Buffers. Comprehensive test coverage at 87%.", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "cloudnova-ml-whitepaper", id: "cloudnova-ml-whitepaper", type: "technical_documentation", source_url: "cloudnova.dev/whitepaper", content_summary: "DeploymentBrain™ AI system combines LSTM networks for time-series analysis, gradient boosting for failure prediction, and reinforcement learning for optimization. Trained on 50M+ deployments.", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "gartner-devops-market-2024", id: "gartner-devops-market-2024", type: "market_research", source_tool: "Gartner Report", content_summary: "DevOps tools market valued at $15.8B in 2024, projected to reach $32.4B by 2028 (22% CAGR). CI/CD segment represents $4.2B growing at 26% CAGR.", timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Ring4 evidence items
  { _original_crypto_id: "ring4-team-linkedin-analysis", id: "ring4-team-linkedin-analysis", type: "team_research", source_tool: "LinkedIn Analysis", content_summary: "127 employees identified. Engineering team: 67 (52%), Sales/Marketing: 28 (22%), Customer Success: 15 (12%). 78% of engineers have 10+ years telecom experience. 34% women (above 20% industry average).", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "ring4-financial-metrics", id: "ring4-financial-metrics", type: "financial_analysis", source_tool: "Pitch Deck Analysis", content_summary: "$8.5M ARR Q4 2023, up from $3.74M Q4 2022 (127% growth). MRR: $708K. Burn rate: $650K/month. Runway: 18 months. Series A: $15M at $85M post-money valuation.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "ring4-github-analysis", id: "ring4-github-analysis", type: "code_analysis", source_tool: "GitHub Repository Scan", content_summary: "React Native 0.72 for mobile apps with 85% code reuse iOS/Android. Web dashboard: React 18.2, TypeScript, Next.js 13. 91% test coverage. 23 active contributors.", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "ring4-security-audit", id: "ring4-security-audit", type: "security_assessment", source_tool: "CrowdStrike Pentest Report", content_summary: "November 2023 penetration test found no critical vulnerabilities. Signal Protocol implementation verified for E2E encryption. SOC 2 Type II compliant. Zero breaches since inception.", timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
  
  // More generic evidence items for other companies
  { _original_crypto_id: "synergy-technical-debt", id: "synergy-technical-debt", type: "code_quality", source_tool: "SonarQube Analysis", content_summary: "Legacy Java 8 codebase with 2,341 code smells, 47 bugs, 12 vulnerabilities. Technical debt ratio: 18.3% (high). Estimated 423 days to resolve all issues.", timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "inframodern-cost-analysis", id: "inframodern-cost-analysis", type: "infrastructure_cost", source_tool: "Cost Analysis Tool", content_summary: "Current on-premise infrastructure costs $45K/month ($540K annually). Cloud migration could reduce to $27K/month. One-time migration cost estimated at $150K.", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

// Ring4 Comprehensive Report (Real Data Enhanced)
// Deep dive mock data for Ring4
const deepDiveMockDataInternal = {
  executiveSummary: {
    investmentThesis: 'Ring4 demonstrates exceptional technical execution with internal access revealing sophisticated engineering practices, robust security implementations, and clear scalability roadmap. The deep dive analysis confirms strong operational fundamentals and identifies specific optimization opportunities worth $2.3M in annual savings.',
    keyFindings: {
      enablers: [
        'Sophisticated microservices architecture with 99.97% uptime',
        'Advanced security practices including zero-trust architecture',
        'Automated testing coverage at 94% with comprehensive CI/CD',
        'Strong engineering culture with detailed code review processes',
        'Clear technical roadmap with quarterly OKRs and milestone tracking',
        'Efficient cost management with $180k annual cloud optimization',
        'Robust disaster recovery with 15-minute RTO/RPO targets'
      ],
      blockers: [
        'Legacy authentication service requires $120k modernization investment',
        'Database sharding needed for 10x scale ($200k implementation cost)',
        'Missing SOC2 Type II certification limiting enterprise sales',
        'Technical debt in payment processing system (6-month remediation)'
      ],
      risks: [
        'Key person dependency on lead architect (succession planning needed)',
        'Vendor concentration risk with 70% infrastructure on single provider',
        'Compliance gaps for international expansion (GDPR, SOX readiness)',
        'Performance bottlenecks identified at 50k concurrent users'
      ]
    },
    recommendations: [
      'Implement database sharding strategy (Q2 2025, $200k investment)',
      'Complete SOC2 Type II certification (Q1 2025, $80k cost)',
      'Modernize authentication service with zero-downtime migration',
      'Establish multi-cloud strategy for vendor risk mitigation',
      'Hire senior architect to reduce key person dependency',
      'Implement performance optimization for 100k+ user scale'
    ]
  }
};

// Use the comprehensive Ring4 report from ring4-mock-report-data.ts
export const mockRing4Report: DemoStandardReport = ring4MockReport;

// Legacy Ring4 report backup
export const mockRing4ReportLegacy: DemoStandardReport = {
  id: 'report-ring4-comprehensive-legacy',
  scan_request_id: 'a420adbf-65bc-4daa-aef9-d01c04b1e177',
  company_name: 'Ring4',
  website_url: 'https://ring4.com',
  report_type: 'standard',
  created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  executive_summary: "Ring4 represents a compelling investment opportunity in the rapidly growing secure communications market, currently valued at $15.8B and expanding at 22% CAGR. Founded in 2015 by telecommunications industry veterans, Ring4 has emerged as a leader in the virtual phone number space by addressing a critical need: enabling professionals to maintain separate business and personal communications without carrying multiple devices. The company has achieved remarkable traction with $8.5M ARR growing at 127% year-over-year, serving over 125,000 active users including three Fortune 500 companies. Ring4's competitive advantage lies in its unique combination of military-grade security (end-to-end encryption using Signal Protocol), innovative AI features (smart call routing with 94% accuracy, real-time transcription at 97% accuracy), and superior user experience (4.8/5 app store rating vs 3.2 industry average). The founding team brings exceptional pedigree - CEO John Harrison previously scaled a telecom company from $10M to $150M as CTO, while CTO Sarah Chen holds 12 VoIP-related patents from her tenure at Cisco. Financial metrics demonstrate strong product-market fit with 78% gross margins, 142% net revenue retention, and a best-in-class LTV:CAC ratio of 25:1. The company is well-capitalized following a $15M Series A led by Bessemer Venture Partners, providing 18 months runway to reach profitability. Key risks include intense competition from established players like Google Voice and emerging threats from WhatsApp Business, though Ring4's technical moat and privacy focus provide strong differentiation. With a clear path to $50M ARR by 2026 and multiple expansion opportunities in healthcare (post-HIPAA compliance) and international markets, Ring4 presents an attractive risk-adjusted return profile for growth-stage investors.",
  investment_score: 85,
  investment_rationale: "Ring4 merits a strong investment recommendation based on a confluence of favorable factors that position the company for exceptional growth. The market opportunity is substantial - the business communications sector is experiencing unprecedented expansion driven by remote work adoption (now permanent for 87% of companies), increasing privacy regulations (GDPR, CCPA), and the gig economy explosion (projected to reach 50% of workforce by 2027). Ring4 has captured a unique position by being the only solution offering true end-to-end encryption with advanced AI capabilities, addressing both security concerns and productivity needs. The product's technical superiority is evident in objective metrics: 45ms average call latency (vs 180ms industry standard), 97% transcription accuracy (vs 82% for competitors), and 89% spam blocking effectiveness (vs 54% carrier-level). Customer validation is exceptional with an NPS of 71 (vs 31 industry average), 2.1% monthly churn (vs 3.5% standard), and organic growth driving 45% of new customers. The team's execution capability is proven - they've grown from $1.5M to $8.5M ARR in 18 months while improving unit economics, achieving CAC payback in just 4.2 months. Financial projections show a clear path to $30M ARR by 2025 based on current pipeline and growth rates. The proposed Series B valuation of $180M (15x forward revenue) is reasonable compared to public comparables trading at 12-18x with lower growth rates. Multiple strategic acquirers (Microsoft, Zoom, Salesforce) have expressed interest, providing downside protection. We project 5-7x returns over 4-5 years based on comparable exit multiples in the communications software sector.",
  tech_health_score: 88,
  tech_health_grade: 'A',
  sections: {
    companyOverview: {
      title: "Company Overview & History",
      summary: "Ring4 has evolved from a simple virtual phone number provider to a comprehensive business communication platform, driven by the founders' vision to democratize enterprise-grade communication tools for professionals and small businesses. The company's journey reflects consistent innovation and market-driven product development.",
      findings: [
        { text: "Founded in March 2015 in San Francisco by John Harrison (CEO), Sarah Chen (CTO), and Michael Park (CPO, departed 2022 on good terms). The founding insight came from Harrison's experience at his previous startup where sales teams struggled with personal number privacy. Initial product launched in September 2015 as a basic virtual number app.", category: "Founding Story" },
        { text: "Corporate structure: Ring4, Inc., Delaware C-Corp. Headquarters at 450 Mission Street, Suite 201, San Francisco, CA 94105 (12,000 sq ft, lease through 2027). Additional offices: Austin, TX (opened 2021, 25 engineers), London, UK (opened 2023, 8 employees for European expansion). Clean cap table with no convertible notes or complex instruments.", category: "Corporate Details" },
        { text: "Product evolution showcases consistent innovation: v1.0 (2015): Basic virtual numbers, v2.0 (2017): Added team features and CRM integration, v3.0 (2019): Introduced AI-powered features, v4.0 (2021): End-to-end encryption launch, v5.0 (2023): Enterprise platform with advanced analytics. Each major version drove significant user growth and retention improvements.", category: "Product Evolution" },
        { text: "Company mission: 'To empower professionals with secure, intelligent communication tools that respect privacy while enhancing productivity.' This mission permeates product decisions - for example, Ring4 refuses to monetize user data despite potential revenue opportunity, differentiating from competitors who sell analytics.", category: "Mission & Values" },
        { text: "Current scale: 127 full-time employees (62% YoY growth), 125,000+ active users across 42 countries, 2M+ calls processed daily, 5M+ messages sent daily, 450GB of encrypted data managed. Geographic distribution: 70% US, 15% Canada, 10% UK, 5% other. Industry verticals: Real estate (35%), Healthcare (20%), Sales/Consulting (25%), Other professionals (20%).", category: "Company Scale", evidence_ids: ["ring4-team-linkedin-analysis"] },
        { text: "Awards and recognition: Y Combinator S16 batch (top 5% of cohort), 'Best Business App 2023' - TechCrunch, 'Most Innovative Communications Platform' - Enterprise Tech 30, 'Privacy Champion Award 2023' - EFF, Apple App Store 'App of the Day' (3 times), Google Play 'Editor's Choice' (2022).", category: "Recognition" },
        { text: "Key milestones: 2015: Founded and launched MVP, 2016: Y Combinator, reached 1K users, 2017: $2M seed round, 10K users, 2019: Launched AI features, 50K users, 2021: $6.5M bridge round, 75K users, 2023: $15M Series A, 125K users, launched enterprise plan, 2024: Opened European office, approaching profitability.", category: "Growth Timeline" },
        { text: "Funding history detail: Total raised $23.5M with increasing valuations: Seed (2016): $2M at $8M post (Y Combinator, angels), Bridge (2021): $6.5M at $35M post (Samsung Next led), Series A (2023): $15M at $85M post (Bessemer led). Capital efficiency: generated $8.5M ARR on $23.5M raised (0.36x ratio, excellent for SaaS).", category: "Funding Journey", evidence_ids: ["ring4-financial-metrics"] }
      ]
    },
    technologyStack: {
      title: "Technology Architecture & Innovation",
      summary: "Ring4's technology platform represents best-in-class architecture for secure communications, combining proven technologies with innovative proprietary solutions. The platform's ability to handle millions of daily communications while maintaining sub-50ms latency and military-grade security demonstrates exceptional technical execution.",
      findings: [
        { text: "Mobile architecture leverages React Native 0.72 achieving 85% code reuse between iOS and Android while maintaining native performance. Custom native modules written in Swift (iOS) and Kotlin (Android) handle critical voice processing and encryption. App size optimized to 42MB (vs 150MB+ for competitors) through code splitting and lazy loading. Offline functionality enables message queuing and call scheduling without connectivity.", category: "Mobile Technology", evidence_ids: ["ring4-github-analysis"] },
        { text: "Backend infrastructure consists of 23 microservices deployed on AWS across 3 regions (us-west-2 primary, eu-west-1, ap-southeast-1). Service breakdown: Call Service (Go) handles 2M+ calls/day with 99.99% uptime, Auth Service (Node.js) processes 10M+ requests/day with JWT tokens, Billing Service (Node.js) integrates Stripe with custom usage tracking, ML Pipeline (Python/TensorFlow) runs inference on 100% of calls, SMS Gateway (Go) processes 5M+ messages with carrier redundancy.", category: "Backend Architecture" },
        { text: "AI/ML capabilities represent significant competitive advantage. Smart Call Routing uses ensemble model (XGBoost + neural network) trained on 50M+ call records, achieving 94% accuracy in predicting optimal destination. Real-time transcription leverages fine-tuned Whisper model with custom acoustic modeling for phone audio, delivering 97% accuracy (vs 82% base Whisper). Spam detection combines BERT-based text analysis with audio fingerprinting, blocking 89% of spam calls with <0.1% false positive rate.", category: "AI Innovation", evidence_ids: ["ring4-ml-architecture", "ring4-ai-performance"] },
        { text: "Security implementation exceeds industry standards. End-to-end encryption uses Signal Protocol with enhancements: double ratchet algorithm, pre-keys for asynchronous communication, perfect forward secrecy. Voice calls encrypted with SRTP using AES-256, key exchange via DTLS 1.3. Zero-knowledge architecture ensures Ring4 cannot access communication content. Completed security audits: CrowdStrike (2023), Trail of Bits (2022), all findings remediated.", category: "Security Architecture", evidence_ids: ["ring4-security-audit", "ring4-encryption-docs"] },
        { text: "Database architecture optimized for scale and performance. PostgreSQL 14 cluster (primary + 2 read replicas) stores user data and metadata (450GB total). Redis Cluster (12 nodes, 96GB RAM) handles session management and real-time features. Elasticsearch cluster (3 nodes, 2TB) enables call transcript search. ClickHouse processes analytics with 100M+ events/day. All databases encrypted at rest with AWS KMS, automated backups every 6 hours.", category: "Data Infrastructure" },
        { text: "DevOps excellence enables rapid iteration. Full CI/CD pipeline with GitHub Actions: automated testing (91% coverage), security scanning, deployment to staging/production. Infrastructure as Code with Terraform managing 100% of resources. Monitoring stack: Prometheus + Grafana for metrics, ELK for centralized logging, Jaeger for distributed tracing, PagerDuty for incident management. Deploy frequency: 47 times/week average with zero-downtime deployments.", category: "DevOps & Reliability" },
        { text: "Performance optimization delivers superior user experience. API Gateway (Kong) handles 50M+ requests/day with p50=12ms, p99=45ms latency. CDN (CloudFront) serves static assets from 89 edge locations globally. WebRTC infrastructure supports 100K concurrent calls with automatic quality adaptation. Database query optimization reduced average response time 73% through intelligent indexing and query rewriting. Load tested to 1M concurrent users without degradation.", category: "Performance Engineering" },
        { text: "Innovation pipeline ensures technical leadership. 15% of engineering time dedicated to R&D projects. Current initiatives: WebRTC 3.0 migration for 40% quality improvement, GraphQL API v2 for 60% mobile bandwidth reduction, LLM integration for call summarization (POC showing 92% accuracy), Quantum-resistant cryptography research, Edge computing for sub-20ms latency globally. Patent applications filed for 3 novel techniques in 2023.", category: "Future Technology" }
      ],
      opportunities: [
        { text: "Implement edge computing nodes in 10 strategic locations to reduce latency below 20ms globally, potentially capturing 2M+ users in emerging markets who currently experience poor call quality", evidence_ids: ["ring4-latency-analysis"] },
        { text: "Develop WebAssembly-based codec for 50% bandwidth reduction, enabling high-quality calls in low-bandwidth regions and reducing infrastructure costs by estimated $200K annually", evidence_ids: ["ring4-codec-research"] },
        { text: "Launch developer API platform to enable third-party integrations, creating network effects and potential $5M ARR revenue stream based on Twilio's API monetization model", evidence_ids: ["ring4-api-strategy"] }
      ],
      recommendations: [
        { text: "Accelerate migration to ARM-based Graviton3 instances for 40% infrastructure cost reduction ($260K annual savings) with no performance impact based on successful POC", evidence_ids: ["ring4-aws-cost-analysis"] },
        { text: "Implement feature flag system (LaunchDarkly or custom) to enable gradual rollouts and A/B testing, reducing deployment risk and enabling data-driven product decisions", evidence_ids: ["ring4-deployment-incidents"] },
        { text: "Establish dedicated ML Ops team to manage model lifecycle, as current ad-hoc approach risks degradation. Industry best practice suggests 1 ML engineer per 3 models", evidence_ids: ["ring4-ml-ops-gap"] }
      ]
    },
    securityCompliance: {
      title: "Security Posture & Compliance Framework", 
      summary: "Ring4 has established a security-first culture that permeates every aspect of the organization, from product development to customer support. The company's commitment to privacy and security serves as both a competitive differentiator and a foundation for entering regulated markets like healthcare.",
      findings: [
        { text: "Encryption implementation represents industry-leading standards. All communications use end-to-end encryption with Signal Protocol, enhanced for business use cases. Voice calls: SRTP with AES-256, DTLS 1.3 key exchange, ZRTP for verification. Messages: Signal Protocol with sealed sender, disappearing messages option. Files: Client-side encryption before upload, zero-knowledge storage. Encryption keys never leave device, perfect forward secrecy maintained.", category: "Encryption Standards", evidence_ids: ["ring4-security-whitepaper"] },
        { text: "Authentication and access control exceeds enterprise requirements. Multi-factor authentication mandatory for all users: TOTP (RFC 6238), SMS backup (deprecated for new accounts), WebAuthn/FIDO2 for passwordless. Biometric authentication on all mobile platforms with secure enclave storage. Enterprise SSO via SAML 2.0 integration with major providers (Okta, Auth0, Azure AD). Admin access uses hardware keys with zero standing privileges.", category: "Authentication Security" },
        { text: "Compliance certifications position Ring4 for regulated industries. SOC 2 Type II certified (December 2023) covering all five trust principles with no exceptions. GDPR compliant with Privacy by Design, appointed DPO, 72-hour breach notification process. CCPA compliant with automated data subject requests, clear opt-out mechanisms. Currently undergoing HIPAA audit (expected completion Q2 2024) to unlock healthcare vertical. PCI DSS Level 1 for payment processing.", category: "Compliance Status", evidence_ids: ["ring4-soc2-report", "ring4-compliance-certs"] },
        { text: "Vulnerability management program demonstrates maturity. Automated scanning: Snyk (dependencies, 0 high/critical vulns), SonarQube (code quality, security hotspots), OWASP ZAP (web vulnerabilities). Bug bounty program via Bugcrowd: $127K paid across 89 valid reports, average time to triage 4 hours. Penetration testing quarterly rotation between CrowdStrike and Trail of Bits. Patch SLAs: Critical 4 hours, High 48 hours, Medium 7 days - 100% SLA compliance in 2023.", category: "Vulnerability Management" },
        { text: "Data privacy implementation reflects 'Privacy by Design' principles. Data minimization: only essential data collected, automatic purge after 90 days of account closure. Call recordings deleted after 30 days unless saved by user. Anonymized analytics use differential privacy (epsilon=1.1). No third-party tracking, advertising SDKs, or data brokers. Privacy impact assessments for all new features. Transparency reports published quarterly showing government request compliance (17 requests in 2023, 4 complied with).", category: "Privacy Practices" },
        { text: "Incident response capability tested and proven. 24/7 Security Operations Center with 3-minute average detection time for critical events. Incident response plan based on NIST framework, tested quarterly with tabletop exercises. Automated response handles common attacks: DDoS mitigation via Cloudflare (47 attacks mitigated in 2023), rate limiting (blocked 2.3M malicious requests), IP reputation blocking. All incidents documented with public postmortems for user-impacting events.", category: "Incident Response" },
        { text: "Infrastructure security implements defense in depth. Network segmentation with zero-trust architecture, all services in private VPCs with no internet-facing databases. Service mesh (Istio) enforces mTLS for all inter-service communication. Secrets management via HashiCorp Vault with dynamic credentials, automatic rotation every 30 days. Infrastructure scanning with Prowler, AWS Security Hub - 98% compliance score. Container security: all images scanned before deployment, distroless base images where possible.", category: "Infrastructure Security" },
        { text: "Supply chain security addresses modern threats. All dependencies verified with software bill of materials (SBOM), automated license compliance checking. Code signing for all releases with HSM-protected keys. Vendor security assessments for all critical suppliers (Twilio, AWS, Stripe). Development environment security: managed devices, VPN required, 2FA for all tools. Insider threat program with activity monitoring, annual security training (100% completion).", category: "Supply Chain Security" }
      ],
      risks: [
        { text: "Dependency on Twilio for PSTN connectivity creates potential single point of failure. While redundancy project 40% complete with Bandwidth.com, full implementation needed to eliminate risk of service disruption affecting 60% of call traffic", severity: "medium", evidence_ids: ["ring4-vendor-risk-assessment"] },
        { text: "Rapid growth outpacing security team expansion. Current ratio of 1:25 security engineers to developers below recommended 1:15, potentially creating bottlenecks in security reviews and increasing risk of vulnerabilities in new features", severity: "medium", evidence_ids: ["ring4-team-structure"] },
        { text: "Legacy PHP authentication service (5% of auth flows) uses bcrypt instead of modern Argon2id. While not immediately exploitable, represents technical debt that could become vulnerability with future cryptographic advances", severity: "low", evidence_ids: ["ring4-legacy-code-audit"] }
      ],
      recommendations: [
        { text: "Complete Twilio redundancy project by Q2 2025, implementing intelligent routing between providers based on cost, quality, and availability metrics. Estimated 99.99% uptime post-implementation", evidence_ids: ["ring4-redundancy-plan"] },
        { text: "Hire 3 additional security engineers targeting expertise in application security, cloud security, and privacy engineering. Implement security champions program embedding security expertise in each feature team", evidence_ids: ["ring4-security-hiring-plan"] },
        { text: "Accelerate HIPAA compliance to capture healthcare opportunity - 15,000+ providers on waitlist representing $3M potential ARR. Timeline acceleration would provide first-mover advantage", evidence_ids: ["ring4-healthcare-opportunity"] },
        { text: "Implement runtime application self-protection (RASP) for legacy PHP components during migration period, providing additional security layer without full rewrite", evidence_ids: ["ring4-legacy-protection-plan"] }
      ]
    },
    marketPosition: {
      title: "Market Analysis & Competitive Positioning",
      summary: "Ring4 operates in the rapidly growing business communications market, positioned uniquely at the intersection of security, convenience, and advanced features. The company has identified and captured a underserved niche - professionals who need enterprise-grade communication tools without enterprise complexity or pricing.",
      findings: [
        { text: "Total addressable market (TAM) for business communication tools valued at $58.7B globally in 2024, with virtual phone numbers and UCaaS representing $15.8B. Growing at 22% CAGR driven by: remote work adoption (58% of knowledge workers now remote/hybrid), gig economy expansion (36% of US workforce), privacy regulations driving secure communication needs, SMB digital transformation accelerating post-COVID. Ring4's specific TAM (professionals and SMBs requiring secure second lines): $6.2B.", category: "Market Size", evidence_ids: ["gartner-ucaas-2024", "ring4-market-research"] },
        { text: "Customer segmentation reveals focused go-to-market strategy. Primary segments: 1) Real Estate Professionals (35% of revenue): agents/brokers needing client privacy, average LTV $2,400, 2) Healthcare Providers (20%): HIPAA-compliant communication need, awaiting certification, 3) Sales/Consultants (25%): CRM integration critical, highest usage rates, 4) Small Businesses (20%): team features driving adoption, fastest growing segment at 180% YoY. ARPU ranges from $19/month (individual) to $145/month (team plans).", category: "Target Markets" },
        { text: "Competitive landscape analysis shows clear differentiation. Direct competitors: Google Voice (free but limited features, no encryption, poor support), Grasshopper ($29+/month, outdated interface, acquired by Citrix), Line2 ($10+/month, reliability issues reported), Sideline ($10/month, basic features only), Burner ($5+/month, consumer focused). Ring4 at $12.99/month provides superior value with encryption, AI features, and business integrations. Market share: Ring4 3.8% (up from 1.2% in 2022), taking share from legacy players.", category: "Competition Analysis" },
        { text: "Competitive advantages create sustainable moat. 1) Technical superiority: 45ms average latency vs 180ms competitors, highest call quality scores in independent testing, 2) Security differentiation: only solution with true E2E encryption, attracts privacy-conscious users (73% cite as primary reason), 3) AI features unavailable elsewhere: smart routing saves users 2.3 hours/week average, transcription accuracy 15% higher than competitors, 4) Superior mobile experience: 4.8/5 app rating vs 3.2 average, 5) Integration ecosystem: 50+ integrations vs 10-15 for competitors.", category: "Competitive Advantages" },
        { text: "Market trends provide strong tailwinds. 1) Privacy regulations (GDPR, CCPA, state laws) driving demand for secure communications - 67% of businesses cite compliance as communication priority, 2) Hybrid work permanence - 87% of companies maintaining flexible work policies, driving need for professional communication tools, 3) Gig economy growth - projected to reach 50% of workforce by 2027, all need business phone separation, 4) SMB digital transformation - 67% increasing tech spend, moving from consumer to business tools, 5) Generational shift - millennials/Gen Z prefer app-based vs traditional telephony.", category: "Market Dynamics" },
        { text: "Go-to-market strategy demonstrates sophistication. Multi-channel approach: 1) Product-led growth: 45% of customers from free trial, 14-day trial converts at 31%, 2) Content marketing: 25K organic monthly visitors, 3.2% conversion rate, ranking #1 for 'secure business phone', 3) Partnership channel: integrations with CRMs, accounting software driving 20% of new revenue, 4) Paid acquisition: Google Ads and LinkedIn, CAC of $67, LTV:CAC of 25:1, 5) Enterprise sales motion: launched Q3 2023, already $1.2M in pipeline, 6-month sales cycle.", category: "GTM Effectiveness" },
        { text: "Pricing strategy optimized through extensive testing. Three tiers: Starter ($12.99/month): unlimited talk/text, AI features, 1 number; Professional ($24.99/month): 3 numbers, team features, CRM integration; Enterprise (custom): unlimited numbers, SSO, SLA, dedicated support. Annual pricing offers 20% discount, driving 67% to annual plans. Pricing 55% below enterprise alternatives while 30% premium to consumer options - optimal positioning. Expansion revenue from number additions, international calling driving 147% net revenue retention.", category: "Pricing Power" },
        { text: "Geographic expansion represents significant opportunity. Currently 85% US revenue, 10% Canada, 5% UK. International expansion roadmap: 1) Australia/New Zealand: $450M market, English-speaking, similar regulations, 2) Western Europe: $3.1B market, GDPR compliant, localziation needs minimal, 3) Singapore/Hong Kong: $600M market, English business language, high smartphone penetration. Conservative projection: international to represent 35% of revenue by 2026.", category: "Geographic Strategy" },
        { text: "Healthcare vertical post-HIPAA certification represents $800M immediate opportunity with 15,000+ providers on waitlist. Higher ARPU ($89/month) and lower churn (1.2%) than other segments", evidence_ids: ["ring4-healthcare-analysis"] },
        { text: "Enterprise telephony replacement targeting companies spending $1M+ annually on legacy PBX systems. Pilot with 3 Fortune 1000 companies showing 70% cost savings", evidence_ids: ["ring4-enterprise-pilot"] },
        { text: "API platform launch enabling developers to build on Ring4 infrastructure. Twilio's API business demonstrates $1B+ potential in adjacent market", evidence_ids: ["ring4-api-opportunity"] },
        { text: "AI assistant expansion adding meeting scheduling, call preparation, follow-up automation. Would justify premium tier at $49.99/month based on user research", evidence_ids: ["ring4-ai-roadmap"] }
      ],
      opportunities: [
        { text: "Healthcare vertical post-HIPAA certification represents $800M immediate opportunity with 15,000+ providers on waitlist. Higher ARPU ($89/month) and lower churn (1.2%) than other segments", evidence_ids: ["ring4-healthcare-analysis"] },
        { text: "Enterprise telephony replacement targeting companies spending $1M+ annually on legacy PBX systems. Pilot with 3 Fortune 1000 companies showing 70% cost savings", evidence_ids: ["ring4-enterprise-pilot"] },
        { text: "API platform launch enabling developers to build on Ring4 infrastructure. Twilio's API business demonstrates $1B+ potential in adjacent market", evidence_ids: ["ring4-api-opportunity"] },
        { text: "AI assistant expansion adding meeting scheduling, call preparation, follow-up automation. Would justify premium tier at $49.99/month based on user research", evidence_ids: ["ring4-ai-roadmap"] }
      ],
      risks: [
        { text: "WhatsApp Business adding calling features and virtual numbers would impact 30% of addressable market. Meta's resources and user base pose significant threat", severity: "high", evidence_ids: ["whatsapp-product-roadmap"] },
        { text: "Platform dependency with Apple/Google controlling distribution. Recent App Store policy changes regarding VOIP apps could impact features or require revenue sharing", severity: "medium", evidence_ids: ["app-store-policy-risk"] },
        { text: "Economic downturn disproportionately impacts SMBs who represent 40% of revenue. Previous recession saw 25% reduction in telecom spending by small businesses", severity: "medium", evidence_ids: ["smb-recession-impact"] }
      ]
    },
    teamLeadership: {
      title: "Leadership Team & Organizational Assessment",
      summary: "Ring4's leadership team combines deep telecommunications expertise with modern SaaS execution capabilities. The founding team remains intact and engaged, having successfully scaled the organization while maintaining strong culture metrics. The recent addition of experienced executives in key roles demonstrates the team's ability to attract top talent.",
      findings: [
        { text: "CEO John Harrison brings rare combination of technical depth and business acumen. Previously CTO at TelecomCo, scaling from $10M to $150M revenue before $180M exit to Vonage. Stanford MS Computer Science, 18 years in telecommunications including 5 years at Cisco building VoIP infrastructure. Published author of 'Building Scalable VoIP Systems' (O'Reilly, 2018), recognized thought leader with 25K Twitter followers. Still commits code monthly, unusual for CEO but maintains technical credibility. Known for exceptional recruiting ability and strategic thinking. Owns 18.5% of company.", category: "CEO Profile", evidence_ids: ["ring4-leadership-bios"] },
        { text: "CTO Sarah Chen represents world-class technical leadership. Previously Principal Engineer at Cisco's Unified Communications division where she architected systems handling 1B+ daily calls. MIT PhD in Electrical Engineering, specialized in signal processing for real-time communications. Holds 12 patents in VoIP technology with 3 more pending. Led development of Cisco's WebRTC implementation used by 50M+ users. Recognized as 'Top 40 Under 40' in telecommunications. Her technical vision drives Ring4's 3-year roadmap and AI strategy. Highly respected in engineering community. Owns 15.2% of company.", category: "CTO Profile", evidence_ids: ["ring4-cto-patents"] },
        { text: "VP Engineering Marcus Thompson transformed engineering culture since joining from WhatsApp (2022). At WhatsApp, managed voice calling infrastructure team handling 100M+ daily calls. Previously at Skype during Microsoft acquisition, navigating complex technical integration. Carnegie Mellon BS/MS Computer Science. Implemented modern engineering practices: reduced deployment time from 2 hours to 12 minutes, improved test coverage from 67% to 91%, established SRE function. Manages 67 engineers across 3 offices with 94% retention rate. Seen as likely successor to CTO.", category: "VP Engineering", evidence_ids: ["ring4-vp-eng-impact"] },
        { text: "VP Sales Jennifer Martinez catalyzed enterprise growth trajectory. Joined from Twilio (2021) where she led mid-market team from $5M to $45M ARR in 3 years. Brought systematic sales methodology increasing Ring4's average contract value by 340% in 18 months. Built sales organization from 3 to 28 reps with consistent 125% quota attainment. Harvard MBA, deep relationships with Fortune 500 telecom buyers. Her Rolodex instrumental in landing 3 Fortune 500 customers. Equity stake makes her highly aligned with long-term success.", category: "VP Sales", evidence_ids: ["ring4-sales-leadership"] },
        { text: "VP Product David Kim bridges user experience with technical capability. Apple alumni from iMessage team (2015-2020), where he designed features later implemented in Ring4. Stanford instructor in design thinking, brings rigorous user research process. Increased NPS from 42 to 71 through systematic improvements. Personally leads AI product strategy, with smart routing feature increasing retention 23%. Published HCI researcher with 2,400+ citations. His product sense crucial for maintaining simplicity while adding power features.", category: "VP Product", evidence_ids: ["ring4-product-innovation"] },
        { text: "Engineering team composition reflects exceptional talent density. 67 engineers total: Backend (28), Mobile (15), Frontend (10), DevOps/SRE (8), ML/AI (6). Remarkable pedigree: 45% from FAANG companies, 78% with 10+ years experience, 23% with advanced degrees. Notable hires: 3 ex-Twilio engineers bringing carrier integration expertise, 2 from WhatsApp with large-scale messaging experience, 4 from Google Voice team. Gender diversity at 34% (vs 20% industry average). Average tenure 2.7 years with 91% retention rate.", category: "Engineering Team", evidence_ids: ["ring4-team-linkedin-analysis"] },
        { text: "Organizational culture drives performance and retention. Core values actively practiced: 'Privacy First' (rejected $2M advertising partnership), 'Customer Obsession' (CEO does monthly support shifts), 'Technical Excellence' (20% time for innovation), 'Transparent Communication' (all metrics shared company-wide). Glassdoor rating 4.6/5 across 67 reviews. Benefits include generous equity (all employees have options), unlimited PTO (average 22 days taken), learning budget ($5K/year), parental leave (16 weeks). Remote-first since 2020 with quarterly gatherings.", category: "Culture & Values", evidence_ids: ["ring4-glassdoor-reviews", "ring4-culture-deck"] },
        { text: "Board composition balances expertise with independence. Board members: John Harrison (CEO/Chairman), Sarah Chen (CTO), David Cowan (Bessemer partner, led Twilio investment), Mark Leslie (former Veritas CEO, independent), Monica Lam (Stanford professor, security expertise, independent). Bessemer's involvement beyond capital includes customer introductions (landed 2 enterprise deals), recruiting support (VP Sales hire), strategic guidance on international expansion. Board meets monthly with robust governance practices.", category: "Board & Governance", evidence_ids: ["ring4-board-composition"] },
        { text: "Advisory board provides strategic value. Jeff Lawson (Twilio CEO): monthly calls on scaling challenges, Eric Yuan (Zoom CEO): partnership discussions underway, Diane Greene (former Google Cloud CEO): enterprise sales strategy, Bruce Schneier (security expert): privacy architecture review. Advisors actively engaged - not just resume padding. Each advisor has specific quarterly deliverables and equity compensation tied to value creation.", category: "Advisory Network", evidence_ids: ["ring4-advisor-value"] }
      ],
      opportunities: [
        { text: "Expand data science team from 6 to 15 to fully capitalize on AI opportunities. Current backlog of ML features represents $2M ARR opportunity being delayed by resource constraints", evidence_ids: ["ring4-ml-hiring-needs"] },
        { text: "Establish European engineering hub in Amsterdam or Berlin to access privacy-focused talent and provide 24/7 development coverage. Could hire senior engineers at 70% of SF cost", evidence_ids: ["ring4-europe-expansion"] },
        { text: "Implement executive coaching program for high-potential senior engineers preparing for leadership roles. Need to build bench strength for anticipated growth to 200+ employees", evidence_ids: ["ring4-leadership-development"] }
      ],
      risks: [
        { text: "Key person dependency on CTO Sarah Chen who owns critical patents and system knowledge. No documented succession plan despite her being actively recruited by major tech companies", severity: "medium", evidence_ids: ["ring4-key-person-risk"] },
        { text: "Compensation at 50th percentile creating retention risk in hot talent market. Lost 3 senior engineers to OpenAI offering 2x compensation. Need to adjust to 75th percentile", severity: "medium", evidence_ids: ["ring4-compensation-analysis"] },
        { text: "Limited go-to-market leadership depth with VP Sales carrying too much responsibility. Need directors of sales for enterprise and SMB segments to scale efficiently", severity: "low", evidence_ids: ["ring4-gtm-org-structure"] }
      ]
    },
    financialPerformance: {
      title: "Financial Analysis & Projections",
      summary: "Ring4 demonstrates exceptional financial performance with unit economics that place it in the top tier of SaaS companies. The combination of rapid growth, improving margins, and shortening payback periods creates a compelling financial profile with clear visibility to profitability.",
      findings: [
        { text: "Revenue growth trajectory exceeds benchmarks. Annual Recurring Revenue (ARR): $8.5M as of December 2023, growing from $3.74M (December 2022) - 127% YoY growth. Monthly Recurring Revenue (MRR): $708K with acceleration - monthly growth rates: 8.2% (Q1), 9.7% (Q2), 11.3% (Q3), 13.8% (Q4). Revenue mix: 78% subscription, 15% usage-based (international minutes, SMS), 7% one-time setup/training. Gross revenue retention: 91% annually indicates strong product-market fit.", category: "Revenue Performance", evidence_ids: ["ring4-financial-metrics", "ring4-revenue-dashboard"] },
        { text: "Unit economics demonstrate best-in-class efficiency. Customer Acquisition Cost (CAC): $67 blended ($45 SMB, $1,250 enterprise) - decreased 23% YoY through optimization. Lifetime Value (LTV): $1,680 average ($4,200 enterprise) based on current retention curves. LTV:CAC ratio: 25:1 far exceeds 3:1 benchmark. CAC payback period: 4.2 months (exceptional for B2B SaaS). Monthly burn per customer acquired: $520, indicating capital efficiency. These metrics enable aggressive growth while maintaining financial discipline.", category: "Unit Economics", evidence_ids: ["ring4-cohort-analysis", "ring4-ltv-cac-model"] },
        { text: "SaaS metrics indicate exceptional health. Net Revenue Retention (NRR): 142% driven by seat expansion and feature upsells. Logo retention: 91% annually (96% for accounts >$1K MRR). Monthly churn: 2.1% (vs 3.5% benchmark for SMB SaaS). Quick ratio: 4.8 (new MRR + expansion MRR / churned MRR). Rule of 40 score: 92 (127% growth - 35% EBITDA margin). Magic Number: 1.4 indicating efficient go-to-market. These metrics place Ring4 in top decile of SaaS companies.", category: "SaaS Metrics", evidence_ids: ["ring4-saas-metrics-detail"] },
        { text: "Cost structure shows improving operational leverage. Operating expenses as % of revenue: R&D: 42% (healthy for product-led growth), S&M: 38% (decreasing from 52% YoY), G&A: 20% (scale economies emerging). Gross margins: 78% (up from 71% through infrastructure optimization). Contribution margin: 65% after variable costs. Employee cost per revenue dollar: $0.67 (approaching $0.50 benchmark). Infrastructure costs only 12% of revenue despite technical complexity.", category: "Operating Efficiency", evidence_ids: ["ring4-opex-analysis"] },
        { text: "Cash management demonstrates discipline. Monthly burn rate: $650K (down from $1.1M in Q1 2023 despite 62% headcount growth). Cash balance: $11.2M providing 17.2 months runway at current burn. Net burn: $650K gross burn - $450K cash collections = $200K/month. Burn multiple: 0.7x (burn / net new ARR) indicating efficient growth. Days sales outstanding: 31 days (excellent for SMB-heavy customer base). Working capital positive as of Q4 2023.", category: "Cash Flow Dynamics", evidence_ids: ["ring4-cash-flow-statement"] },
        { text: "Path to profitability clearly defined. Break-even projected at $19M ARR (Q3 2024) based on current unit economics. Key drivers: 1) Gross margin expansion to 82% through infrastructure optimization, 2) Sales efficiency improvements as brand awareness grows, 3) R&D leverage as platform matures, 4) G&A leverage with scale. Scenario analysis shows profitability achievable even with 30% growth rate reduction. Free cash flow positive expected Q4 2024.", category: "Profitability Timeline", evidence_ids: ["ring4-path-to-profitability"] },
        { text: "Funding history shows increasing momentum. Total raised: $23.5M across three rounds with improving terms. Seed (2016): $2M at $8M post-money (25% dilution), Bridge (2021): $6.5M at $35M post (18.6% dilution), Series A (2023): $15M at $85M post (17.6% dilution). Capital efficiency: $2.76 raised per $1 ARR (excellent for growth stage). Clean cap table: no debt, warrants, or complex instruments. Founder ownership: 33.7% combined (healthy for Series A stage).", category: "Capital Structure", evidence_ids: ["ring4-cap-table-analysis"] },
        { text: "Financial projections based on bottom-up model. 2024: $19.5M ARR (129% growth) - conservative given current momentum. 2025: $38M ARR (95% growth) - factors market expansion and enterprise growth. 2026: $62M ARR (63% growth) - achievable with international expansion. Key assumptions: 140% NRR maintained, CAC payback <6 months, 35% of growth from international. Model stress-tested with 20% haircut still shows attractive returns.", category: "Growth Projections", evidence_ids: ["ring4-financial-model-2024"] }
      ],
      opportunities: [
        { text: "Implement annual payment incentives (15% discount) to improve cash position by $2.5M. Offering 20% discount for annual prepay (vs current 10%) would shift 85% of customers based on testing", evidence_ids: ["ring4-payment-terms-optimization"] },
        { text: "AWS cost optimization through Reserved Instances and architectural improvements could reduce infrastructure costs by 40% ($320K annually) without performance impact", evidence_ids: ["ring4-aws-spend-analysis"] },
        { text: "Premium support tier at $99/seat/month for enterprise would add $1.5M high-margin ARR based on 20% adoption rate from customer surveys", evidence_ids: ["ring4-support-tier-analysis"] },
        { text: "Usage-based pricing for API access could generate additional $3M ARR within 18 months based on developer interest and comparable API monetization models", evidence_ids: ["ring4-api-monetization-study"] }
      ],
      risks: [
        { text: "Customer concentration improving but top 10 customers still represent 18% of revenue. Loss of largest customer (3.8% of ARR) would impact growth trajectory", severity: "medium", evidence_ids: ["ring4-customer-concentration-risk"] },
        { text: "Foreign exchange exposure growing with international expansion. 15% of revenue in non-USD currencies without hedging strategy could impact margins 2-3%", severity: "low", evidence_ids: ["ring4-fx-exposure-analysis"] },
        { text: "Accounts receivable aging increasing from 25 to 31 days as enterprise mix grows. Could pressure working capital if trend continues", severity: "low", evidence_ids: ["ring4-ar-aging-report"] }
      ]
    },
    investmentThesis: {
      title: "Investment Recommendation & Thesis",
      summary: "Ring4 presents a compelling growth equity investment opportunity with exceptional fundamentals, clear market leadership potential, and multiple paths to attractive returns. We recommend proceeding with a $5M investment in the Series B round at a $180M post-money valuation.",
      findings: [
        { text: "Investment recommendation: STRONG BUY. Ring4 warrants our highest conviction rating based on: 1) Exceptional growth (127%) with improving unit economics, 2) Massive market opportunity ($15.8B) with secular tailwinds, 3) Clear product differentiation validated by customer metrics, 4) World-class team with proven execution capability, 5) Multiple expansion opportunities reducing execution risk, 6) Clear path to profitability by Q3 2024, 7) Strategic acquirer interest providing downside protection. Risk-adjusted returns exceed all fund hurdles.", category: "Overall Recommendation", evidence_ids: ["ring4-investment-memo-final"] },
        { text: "Valuation analysis supports attractive entry point. Proposed $180M Series B valuation = 21x current ARR, 9.2x forward ARR. Public comparables: RingCentral (RNG) 4.2x ARR but growing 18%, 8x8 (EGHT) 2.8x ARR growing 12%, Zoom (ZM) 8.7x ARR growing 35%. Recent private comps: Dialpad $2.2B at 15x ARR (growing 90%), Aircall $1B at 12x ARR (growing 65%). Ring4's superior growth and margins justify premium. DCF analysis with 25% discount rate yields $195M valuation.", category: "Valuation Analysis", evidence_ids: ["ring4-valuation-comps-analysis"] },
        { text: "Return analysis shows exceptional upside. Base case: Exit in 2028 at $250M ARR, 8x multiple = $2B valuation. Our $5M for 2.8% returns $56M (11.2x MOIC, 62% IRR). Probability weighted returns: Bear case (20% probability): 3x return if growth slows to 50%, Base case (60%): 11x at current trajectory, Bull case (20%): 20x if API platform succeeds. Expected value: 10.4x MOIC exceeds fund target of 5x. Multiple expansion possible given strategic value.", category: "Return Projections", evidence_ids: ["ring4-exit-scenario-modeling"] },
        { text: "Strategic rationale aligns with fund thesis. Ring4 fits 'Digital Infrastructure for the Future of Work' thesis perfectly. Portfolio synergies identified: CollaborateCo (integration partner), SecureCloudCo (security validation), HRTechCo (customer). Deal enhances fund's reputation in competitive communications/security sectors. Opportunity to lead round positions us for board seat and information rights. Team actively sought our participation given telecom expertise.", category: "Strategic Alignment", evidence_ids: ["fund-thesis-alignment"] },
        { text: "Due diligence findings uniformly positive. Technical DD (3 weeks): 'Best-in-class architecture with meaningful competitive advantages' - TechDDPartners. Financial DD: 'Conservative accounting, metrics accurately reported, no red flags' - Deloitte. Legal DD: 'Clean structure, IP properly assigned, standard employment agreements' - Wilson Sonsini. Customer references (20 calls): 18 extremely positive, 2 neutral, 0 negative. Unusually strong feedback on product and support.", category: "Diligence Summary", evidence_ids: ["ring4-dd-reports-summary"] },
        { text: "Risk assessment shows manageable factors. Key risks identified: 1) WhatsApp Business competition - mitigated by enterprise focus and superior security, 2) Platform dependency - reduced through web app and API strategy, 3) Key person risk - addressed with retention packages and knowledge transfer, 4) Customer concentration - improving with growth, 5) Regulatory changes - strong compliance team and adaptable architecture. No deal-breaking risks identified.", category: "Risk Analysis", evidence_ids: ["ring4-risk-assessment-matrix"] },
        { text: "Value creation opportunities substantial. Post-investment initiatives: 1) Portfolio company introductions - 15 immediate customer opportunities, 2) Executive recruiting - VP International and VP Marketing from our network, 3) Pricing optimization - our SaaS playbook could add 20% to revenue, 4) M&A opportunities - 3 bolt-on targets identified for consolidation, 5) IPO preparation - leverage our public market experience. Active involvement could accelerate growth by 6-12 months.", category: "Value Add Plan", evidence_ids: ["ring4-value-creation-playbook"] },
        { text: "Deal structure and terms favorable. Proposed terms: $5M investment of $30M round (leading), $180M post-money valuation (negotiated from $210M ask), 1x participating preferred with 2x cap, Pro-rata rights through IPO, Board seat (not observer), Information rights with monthly reporting, Standard protective provisions, Tag-along and co-sale rights. Co-investors: Bessemer ($20M), Samsung Next ($3M), Angels ($2M). Clean structure with aligned interests.", category: "Transaction Terms", evidence_ids: ["ring4-term-sheet-executed"] },
        { text: "Exit strategy provides multiple options. Primary path: IPO in 2027-2028 at $200M+ ARR (comparable to RingCentral, 8x8 trajectories). Strategic buyers: Microsoft Teams (integration discussions underway), Zoom (CEO is advisor), Salesforce (customer relationship management fit). Financial buyers: Vista Equity, Thoma Bravo expressed interest in consolidation plays. Secondary markets provide interim liquidity options. Management open to all paths maximizing shareholder value.", category: "Exit Planning", evidence_ids: ["ring4-exit-strategy-analysis"] },
        { text: "Follow-on strategy ensures continued upside. Reserve $2M for Series C participation to maintain 2.8% ownership. High conviction merits doubling down as company scales. Series C likely in 18-24 months at $400M+ valuation based on trajectory. Potential to lead Series C given relationship and value-add. Board seat provides visibility for timing. Historical fund returns highest when following winners.", category: "Follow-On Investment", evidence_ids: ["ring4-follow-on-reserves"] }
      ],
      recommendations: [
        { text: "Proceed immediately with $5M investment at agreed terms. Market momentum and competitive interest require quick execution to secure allocation and terms", evidence_ids: ["ring4-deal-urgency"] },
        { text: "Structure 10% as secondary ($500K) to provide founder liquidity and ensure long-term alignment through challenging growth phase ahead", evidence_ids: ["ring4-secondary-structure"] },
        { text: "Implement monthly board meetings (vs quarterly) for first year to maximize value creation impact during critical scaling period", evidence_ids: ["ring4-governance-cadence"] },
        { text: "Begin exit planning discussions early - introduce management to public market advisors and potential strategic acquirers to maximize optionality", evidence_ids: ["ring4-exit-preparation"] }
      ]
    },
    executiveSummaryHighlights: {
      title: "Executive Summary Highlights",
      summary: deepDiveMockDataInternal?.executiveSummary?.investmentThesis ?? "Key findings from the deep dive technical assessment.",
      findings: [
        ...(deepDiveMockDataInternal?.executiveSummary?.keyFindings?.enablers || []).map((item: string, index: number) => ({ text: item, category: 'Enabler', evidence_ids: [`dd_exec_enabler_${index}`] })),
        ...(deepDiveMockDataInternal?.executiveSummary?.keyFindings?.blockers || []).map((item: string, index: number) => ({ text: item, severity: 'medium', category: 'Blocker', evidence_ids: [`dd_exec_blocker_${index}`] })),
      ],
      risks: (deepDiveMockDataInternal?.executiveSummary?.keyFindings?.risks || []).map((item: string, index: number) => ({ text: item, severity: 'high', evidence_ids: [`dd_exec_risk_${index}`] })),
      recommendations: (deepDiveMockDataInternal?.executiveSummary?.recommendations || []).map((item: string, index: number) => ({ text: item, evidence_ids: [`dd_exec_rec_${index}`] })) // Ensure this maps from deepDiveMockDataInternal.executiveSummary.recommendations
    }
  },
  evidence_collection_id: 'col-ring4-20240115',
  citations: [
    // Team & Leadership Citations
    { claim_id: "team_0", evidence_item_id: "ring4-team-linkedin-analysis", citation_text: "127 employees with 62% YoY growth", citation_context: "LinkedIn analysis shows rapid scaling while maintaining quality hiring standards", citation_number: 1 },
    { claim_id: "financial_0", evidence_item_id: "ring4-financial-metrics", citation_text: "$8.5M ARR growing 127% YoY", citation_context: "Financial statements and metrics dashboard confirm exceptional growth rate", citation_number: 2 },
    { claim_id: "tech_0", evidence_item_id: "ring4-github-analysis", citation_text: "React Native with 85% code reuse", citation_context: "Code repository analysis reveals efficient mobile development approach", citation_number: 3 },
    { claim_id: "security_0", evidence_item_id: "ring4-security-audit", citation_text: "Zero critical vulnerabilities found", citation_context: "CrowdStrike penetration test validates strong security posture", citation_number: 4 },
    // Add many more citations for completeness...
  ],
  metadata: {
    analysisDepth: 'comprehensive',
    processingTime: 45234,
    servicesUsed: ['evidence-collector-v7', 'tech-intelligence-v3', 'market-research-v2', 'financial-analyzer-v3'],
    reportVersion: '2.0',
    confidenceScores: {
      technical: 0.93,
      financial: 0.91,
      market: 0.89,
      team: 0.94,
      overall: 0.92
    }
  }
};

// Add all standard reports to array
export const mockStandardReports: DemoStandardReport[] = [
  mockCloudNovaReport,
  mockRing4Report,
  // We'll add more comprehensive reports for other companies
];

// Deep dive and enhanced PE reports
export const mockDeepDiveReports: DemoDeepDiveReport[] = [
  {
    id: 'deep-dive-ring4-demo',
    scan_request_id: 'a420adbf-65bc-4daa-aef9-d01c04b1e177',
    company_name: 'Ring4',
    title: 'Ring4 - Technical Deep Dive Analysis',
    deep_dive_content: {
      executiveSummary: "This technical deep dive validates Ring4's architectural decisions and implementation quality, confirming the platform's ability to scale to 10M+ users while maintaining sub-50ms latency and 99.99% availability.",
      architectureAnalysis: {
        microservicesBreakdown: "Detailed analysis of 23 microservices including dependency mapping, performance characteristics, and scaling limits...",
        dataFlowDiagrams: "Complete data flow from client applications through API gateway, service mesh, to data stores...",
        securityArchitecture: "Comprehensive review of encryption implementation, key management, and zero-trust architecture..."
      },
      codeQualityMetrics: {
        technicalDebt: "Total technical debt: 127 days. Debt ratio: 8.3% (excellent). Primary areas: Legacy PHP auth service (45 days), Mobile app refactoring (30 days)...",
        testCoverage: "Overall: 91%, Unit tests: 94%, Integration tests: 87%, E2E tests: 78%. Mutation testing score: 82%...",
        performanceAnalysis: "Detailed performance profiling of critical paths. API latency breakdown by service. Database query optimization opportunities..."
      },
      scalabilityAssessment: {
        loadTestResults: "Successfully handled 1M concurrent connections, 50K calls/second, 200K messages/second. Bottlenecks identified at 2M concurrent...",
        architecturalLimits: "Current architecture can scale to 10M users with infrastructure additions. Beyond requires sharding strategy...",
        costProjections: "Infrastructure cost modeling at various scale points: 1M users ($180K/mo), 5M users ($750K/mo), 10M users ($1.3M/mo)..."
      },
      competitiveBenchmarking: {
        performanceComparison: "Detailed benchmarks against Twilio, Vonage, RingCentral APIs. Ring4 superior in 8 of 10 metrics...",
        featureGapAnalysis: "Missing features vs enterprise competitors: Call center capabilities, Advanced IVR, Workforce optimization...",
        technologyDifferentiators: "Unique implementations: Predictive call routing algorithm, Hybrid encryption approach, Efficient mobile battery usage..."
      }
    }
  }
];

export const mockEnhancedPEReports: DemoEnhancedPEReport[] = [
  {
    id: 'enhanced-ring4-pe',
    scan_request_id: 'a420adbf-65bc-4daa-aef9-d01c04b1e177',
    company_name: 'Ring4',
    title: 'Ring4 - Private Equity Value Creation Plan',
    enhanced_content: {
      executiveSummary: "Ring4 presents an exceptional value creation opportunity with potential for 5-7x returns through operational improvements, strategic acquisitions, and market expansion.",
      valueCreationLevers: [
        {
          lever: "International Expansion",
          impact: "$25M ARR increment",
          timeline: "18 months",
          investment: "$5M",
          details: "Launch in 5 English-speaking markets with proven playbook..."
        },
        {
          lever: "Enterprise Product Launch",
          impact: "$30M ARR increment", 
          timeline: "24 months",
          investment: "$8M",
          details: "Build call center features, advanced analytics, integration APIs..."
        },
        {
          lever: "Operational Excellence",
          impact: "45% EBITDA margins",
          timeline: "12 months",
          investment: "$2M",
          details: "Sales efficiency, infrastructure optimization, automation..."
        }
      ],
      acquisitionTargets: [
        {
          company: "SecureVoice Inc",
          rationale: "HIPAA compliant platform, 5K healthcare customers",
          revenue: "$8M ARR",
          valuation: "$65M",
          synergies: "$4M cost, $12M revenue"
        },
        {
          company: "GlobalReach Telecom",
          rationale: "International number inventory, carrier relationships",
          revenue: "$15M ARR",
          valuation: "$120M",
          synergies: "$8M cost, $20M revenue"
        }
      ],
      hundredDayPlan: {
        governance: "Install experienced board members, implement KPI dashboards, establish value creation PMO...",
        commercial: "Hire Chief Revenue Officer, implement sales methodology, launch enterprise sales team...",
        operational: "Reduce COGS by 20%, implement procurement excellence, automate customer onboarding...",
        technology: "Accelerate product roadmap, hire 20 engineers, implement agile at scale..."
      },
      exitStrategy: {
        strategicBuyers: ["Microsoft ($5B+ valuation)", "Zoom ($3B+ valuation)", "Salesforce ($4B+ valuation)"],
        ipeTimeline: "4-5 years to $250M ARR",
        secondaryOptions: "GP-led continuation fund at 3-year mark",
        valueMaximization: "Dual track process recommended at $150M ARR"
      }
    }
  }
];

// Export complete mock demo reports mapping
export const mockDemoReports: Record<string, DemoStandardReport> = {
  'report-cloudnova-comprehensive': mockCloudNovaReport,
  'report-ring4-comprehensive': mockRing4Report,
  // Add more as we create them
};

// FutureTech Inc. Comprehensive Report (AI/SaaS focus)
export const mockFutureTechReport: DemoStandardReport = {
  id: 'report-futuretech-comprehensive',
  scan_request_id: 'demo-investor-scan-pending-1',
  company_name: 'FutureTech Inc.',
  website_url: 'https://futuretech.ai',
  report_type: 'standard',
  created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  executive_summary: "FutureTech Inc. represents a high-potential investment opportunity in the rapidly evolving AI/ML platform space. Founded in 2021 by ex-Google AI researchers, the company has developed a groundbreaking AutoML platform that democratizes machine learning for non-technical users. With $5.2M ARR growing at 220% YoY and serving 450+ enterprise customers including Microsoft and Toyota, FutureTech has achieved remarkable product-market fit. The platform's unique visual ML pipeline builder and automated model optimization capabilities have reduced ML development time by 75% for customers. However, concerns around high burn rate ($1.2M/month) and intense competition from established players like DataRobot and H2O.ai require careful consideration.",
  investment_score: 78,
  investment_rationale: "FutureTech merits a positive but cautious investment recommendation. The company's innovative approach to making ML accessible has captured significant market share in a $4.2B TAM growing at 38% CAGR. Key strengths include exceptional technical team (12 PhDs from top institutions), strong IP portfolio (8 patents filed), and impressive customer metrics (NPS 68, 125% net retention). However, the high cash burn and competitive landscape present material risks. The proposed Series A valuation of $120M (23x ARR) is aggressive but potentially justified given growth trajectory.",
  tech_health_score: 82,
  tech_health_grade: 'B+',
  sections: {
    companyOverview: {
      title: "Company Overview",
      summary: "FutureTech emerged from Stanford AI Lab in 2021 with a mission to democratize machine learning.",
      findings: [
        { text: "Founded by Dr. James Liu (ex-Google Brain) and Dr. Maria Santos (ex-DeepMind) with combined 25 years in AI research", category: "Founding Team" },
        { text: "450+ enterprise customers including 12 Fortune 500 companies. Key verticals: Financial Services (35%), Healthcare (28%), Retail (22%)", category: "Customer Base" },
        { text: "$5.2M ARR with $433K MRR, growing from $1.1M ARR twelve months ago. Average contract value $42K, up from $28K", category: "Financial Metrics" },
        { text: "65 employees across San Francisco (HQ), Toronto (R&D), and Bangalore (Engineering). 73% technical roles", category: "Team Scale" }
      ]
    },
    technologyStack: {
      title: "Technology Architecture",
      summary: "FutureTech's platform leverages cutting-edge ML infrastructure with a focus on usability and scalability.",
      findings: [
        { text: "Core platform built on Kubernetes with custom ML orchestration layer handling 2M+ model training jobs monthly", category: "Infrastructure" },
        { text: "Proprietary AutoML engine using neural architecture search (NAS) achieves state-of-the-art results on 78% of benchmark datasets", category: "ML Innovation", severity: "info" },
        { text: "Tech stack: Python/FastAPI backend, React/TypeScript frontend, PostgreSQL + TimescaleDB, Redis, Apache Spark for data processing", category: "Technology Choices" },
        { text: "Model serving infrastructure handles 50M+ predictions daily with p99 latency of 23ms using custom ONNX runtime optimizations", category: "Performance" }
      ],
      risks: [
        { text: "Heavy dependence on expensive GPU infrastructure ($180K/month) with limited cost optimization implemented", severity: "high" },
        { text: "Technical debt in data pipeline code requiring estimated 3-month refactoring effort", severity: "medium" }
      ]
    },
    marketPosition: {
      title: "Market Analysis",
      summary: "FutureTech operates in the competitive but rapidly growing AutoML market with differentiated positioning.",
      findings: [
        { text: "AutoML market valued at $4.2B in 2024, projected to reach $14.8B by 2028 (37% CAGR). FutureTech has 0.12% market share", category: "Market Size" },
        { text: "Main competitors: DataRobot ($2.8B valuation), H2O.ai ($1.7B), Google AutoML, Amazon SageMaker. FutureTech differentiates through ease of use", category: "Competition" },
        { text: "Win rate of 67% in competitive deals, primarily winning on user experience and time-to-value (average 2 weeks vs 2 months)", category: "Competitive Performance" },
        { text: "Strong partnerships with AWS (Advanced Partner), Snowflake (Premier Partner), and Databricks driving 40% of new leads", category: "Partnerships" }
      ],
      opportunities: [
        { text: "Expansion into European market represents $500M opportunity with GDPR-compliant infrastructure already in place" },
        { text: "Vertical-specific solutions for healthcare and financial services could double average contract values" }
      ]
    }
  },
  evidence_collection_id: 'col-futuretech-20240115',
  citations: [
    { claim_id: "market_0", evidence_item_id: "futuretech-market-size", citation_text: "$4.2B AutoML market", citation_context: "Gartner Magic Quadrant for Data Science and Machine Learning Platforms 2024", citation_number: 1 },
    { claim_id: "tech_0", evidence_item_id: "futuretech-benchmark-results", citation_text: "78% SOTA results", citation_context: "Internal benchmarking against MLPerf datasets", citation_number: 2 }
  ],
  metadata: {
    analysisDepth: 'comprehensive',
    processingTime: 38462,
    reportVersion: '2.0',
    confidenceScores: {
      technical: 0.86,
      financial: 0.82,
      market: 0.84,
      overall: 0.84
    }
  }
};

// Synergy Corp Comprehensive Report (Enterprise Software focus)
export const mockSynergyReport: DemoStandardReport = {
  id: 'report-synergy-comprehensive',
  scan_request_id: 'demo-pe-scan-complete-1',
  company_name: 'Synergy Corp',
  website_url: 'https://synergy-enterprise.com',
  report_type: 'standard',
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  executive_summary: "Synergy Corp presents a complex investment scenario as a mature enterprise software company attempting digital transformation. Founded in 2008, the company has built a substantial presence in enterprise resource planning (ERP) for mid-market manufacturing companies with $42M ARR. However, growth has stagnated at 12% YoY, and the technology stack shows significant legacy debt. The recent appointment of a new CTO from Salesforce and planned cloud migration initiative offer potential for revitalization, but execution risks remain high. The company's strong customer base (89% gross retention) and domain expertise provide a foundation for transformation.",
  investment_score: 65,
  investment_rationale: "Synergy Corp warrants a neutral to slightly positive assessment contingent on successful execution of its transformation plan. The company's established market position and sticky customer relationships provide downside protection, while the cloud migration and product modernization initiatives offer upside potential. Key concerns include technical debt (18.3% debt ratio), slow innovation velocity, and emerging cloud-native competitors. The proposed valuation of $380M (9x ARR) reflects these mixed fundamentals but may offer value if transformation succeeds.",
  tech_health_score: 58,
  tech_health_grade: 'C',
  sections: {
    companyOverview: {
      title: "Company Overview",
      summary: "Synergy Corp is an established player in mid-market ERP with strong domain expertise but facing modernization challenges.",
      findings: [
        { text: "Founded in 2008 in Detroit, MI. Bootstrapped to $15M ARR before taking PE investment in 2019 (Riverside Partners)", category: "Company History" },
        { text: "Serving 850+ manufacturing companies with average customer tenure of 7.3 years. Top clients include Ford suppliers and aerospace manufacturers", category: "Customer Base" },
        { text: "$42M ARR growing at 12% YoY (down from 35% in 2019). EBITDA positive at 18% margins but declining due to transformation investments", category: "Financial Performance" },
        { text: "320 employees with concerning demographics: average age 47, only 15% hired in last 2 years, 45% eligible for retirement within 5 years", category: "Team Composition" }
      ]
    },
    technologyStack: {
      title: "Technology Assessment",
      summary: "Legacy architecture constrains growth but modernization efforts show promise if executed successfully.",
      findings: [
        { text: "Core ERP system built on Java 8 (EOL) with Oracle database. Monolithic architecture with 2.3M lines of code in single repository", category: "Legacy Systems", severity: "high" },
        { text: "SonarQube analysis reveals 2,341 code smells, 47 bugs, 12 security vulnerabilities. Technical debt estimated at 423 developer-days", category: "Code Quality", severity: "high", evidence_ids: ["synergy-technical-debt"] },
        { text: "New cloud initiative using microservices (Spring Boot), Kubernetes, and PostgreSQL. 15% of functionality migrated in 18 months", category: "Modernization Progress" },
        { text: "Customer-facing UI outdated (jQuery/JSP) with poor mobile experience. New React-based UI in beta with 25 pilot customers showing 3x engagement", category: "User Experience" }
      ],
      risks: [
        { text: "Critical dependency on retiring Oracle DBA with no documented knowledge transfer plan", severity: "critical" },
        { text: "Integration spaghetti with 200+ point-to-point connections to customer systems creating fragility", severity: "high" },
        { text: "No automated testing for legacy modules covering 70% of codebase, making changes risky", severity: "high" }
      ],
      recommendations: [
        { text: "Accelerate cloud migration with dedicated tiger team and external expertise to achieve 50% migration within 12 months" },
        { text: "Implement comprehensive testing framework starting with critical financial modules to reduce deployment risks" },
        { text: "Create retention packages for key technical staff and aggressive hiring program for cloud-native talent" }
      ]
    },
    transformationPlan: {
      title: "Digital Transformation Analysis",
      summary: "Ambitious transformation plan with meaningful progress but execution risks remain substantial.",
      findings: [
        { text: "New CTO Sarah Mitchell (ex-Salesforce) hired 6 months ago, brought in 12 senior engineers from FAANG companies", category: "Leadership Change" },
        { text: "Cloud migration budget of $15M over 3 years. Currently 15% complete, targeting 100% by 2026. Using strangler fig pattern", category: "Migration Strategy" },
        { text: "API-first architecture enabling new integrations. 45 APIs published vs 0 eighteen months ago. Partner ecosystem growing", category: "Platform Evolution" },
        { text: "Customer success metrics improving: NPS increased from 12 to 34, support tickets down 40%, feature velocity up 3x", category: "Early Results" }
      ],
      opportunities: [
        { text: "Modern platform could enable expansion into adjacent verticals (logistics, warehousing) representing $200M TAM" },
        { text: "API marketplace could generate $5-10M ARR based on comparable B2B software platforms" },
        { text: "AI/ML capabilities for demand forecasting and optimization could justify 50% price increases" }
      ]
    }
  },
  evidence_collection_id: 'col-synergy-20240113',
  citations: [
    { claim_id: "tech_debt_0", evidence_item_id: "synergy-technical-debt", citation_text: "2,341 code smells identified", citation_context: "SonarQube enterprise scan completed January 2024", citation_number: 1 }
  ],
  metadata: {
    analysisDepth: 'comprehensive',
    processingTime: 42156,
    reportVersion: '2.0',
    confidenceScores: {
      technical: 0.78,
      financial: 0.88,
      market: 0.82,
      overall: 0.83
    }
  }
};

// InfraModern Comprehensive Report (Infrastructure/DevOps focus)
export const mockInfraModernReport: DemoStandardReport = {
  id: 'report-inframodern-comprehensive',
  scan_request_id: 'demo-pe-scan-awaiting-review-1',
  company_name: 'InfraModern',
  website_url: 'https://inframodern.io',
  report_type: 'standard',
  created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  executive_summary: "InfraModern represents a compelling infrastructure modernization play in the rapidly growing cloud migration and DevOps tooling market. Founded in 2020 by former AWS and HashiCorp engineers, the company has developed an innovative platform that automates cloud migration assessments and executes migrations with 70% less manual effort than traditional approaches. With $3.8M ARR growing at 340% YoY and blue-chip customers like Coca-Cola and Best Buy, InfraModern has found product-market fit in a massive market opportunity. The company's proprietary migration intelligence engine and automated cost optimization capabilities provide strong technical differentiation.",
  investment_score: 84,
  investment_rationale: "InfraModern merits a strong investment recommendation based on exceptional growth metrics, proven ROI for customers, and massive market tailwinds. The cloud migration market ($45B by 2027) remains vastly underpenetrated with only 35% of enterprise workloads in the cloud. InfraModern's solution addresses the key barrier - complexity and cost of migration. The team's pedigree (AWS, HashiCorp, Google Cloud) provides credibility and technical excellence. At a proposed $95M valuation (25x ARR), the company is reasonably priced given 340% growth and strong unit economics (LTV:CAC of 4.2:1).",
  tech_health_score: 91,
  tech_health_grade: 'A',
  sections: {
    companyOverview: {
      title: "Company Overview",
      summary: "InfraModern has rapidly emerged as a leader in automated cloud migration and infrastructure optimization.",
      findings: [
        { text: "Founded in September 2020 by ex-AWS Principal Engineers Tom Bradley and Lisa Wang who previously built AWS Migration Hub", category: "Founding Story" },
        { text: "120+ enterprise customers with average contract value of $125K. Notable wins: Coca-Cola, Best Buy, Johnson & Johnson, Delta Airlines", category: "Customer Traction" },
        { text: "$3.8M ARR growing from $700K one year ago (340% growth). Monthly growth averaging 28% over last 6 months", category: "Revenue Growth" },
        { text: "48 employees (40 technical). Distributed team across SF, Seattle, Toronto. Notable hires from Terraform, Kubernetes, and Datadog teams", category: "Team Building" }
      ]
    },
    technologyStack: {
      title: "Technology Platform",
      summary: "InfraModern's platform represents best-in-class cloud-native architecture with innovative automation capabilities.",
      findings: [
        { text: "Migration Intelligence Engine analyzes existing infrastructure using graph neural networks, achieving 94% accuracy in predicting migration complexity", category: "Core Technology" },
        { text: "Platform built on Go microservices, Temporal for workflow orchestration, TimescaleDB for metrics, and React/TypeScript frontend", category: "Architecture" },
        { text: "Automated cost optimization algorithms have saved customers average of 37% on cloud bills through rightsizing and reserved instance planning", category: "Cost Innovation", evidence_ids: ["inframodern-cost-analysis"] },
        { text: "Security-first design with SOC2 Type II, ISO 27001, and FedRAMP-ready architecture supporting government customers", category: "Security & Compliance" },
        { text: "Multi-cloud support for AWS, Azure, GCP with 250+ service mappings. Proprietary abstraction layer enables cloud-agnostic migrations", category: "Platform Capabilities" }
      ],
      opportunities: [
        { text: "FinOps platform extension could add $15M TAM by providing ongoing cost optimization beyond initial migration" },
        { text: "Kubernetes migration specialist tool addressing the 78% of enterprises struggling with container adoption" },
        { text: "Acquisition of complementary tools in observability or security could create full-stack platform" }
      ]
    },
    marketPosition: {
      title: "Market & Competition",
      summary: "InfraModern is well-positioned in a large and growing market with limited direct competition.",
      findings: [
        { text: "Cloud migration market valued at $15B in 2024, growing to $45B by 2027 (44% CAGR) driven by digital transformation initiatives", category: "Market Size" },
        { text: "Only 35% of enterprise workloads currently in cloud, leaving massive headroom. Average enterprise has 500+ applications to migrate", category: "Market Opportunity" },
        { text: "Direct competitors limited: CloudEndure (acquired by AWS), Carbonite Migrate, Zerto. InfraModern wins on automation and cost", category: "Competitive Landscape" },
        { text: "Partners with all major cloud providers and systems integrators (Accenture, Deloitte) who drive 60% of revenue", category: "Go-to-Market" }
      ]
    },
    customerMetrics: {
      title: "Customer Success Metrics",
      summary: "Exceptional customer satisfaction and proven ROI drive rapid growth and expansion.",
      findings: [
        { text: "Average customer reduces migration time by 70% and costs by 55% compared to traditional approaches. ROI achieved in 4.5 months", category: "Customer ROI" },
        { text: "Net Promoter Score of 72 (vs industry average of 30). 95% of customers rate platform 4 or 5 stars", category: "Satisfaction" },
        { text: "141% net revenue retention driven by expansion into additional cloud platforms and ongoing optimization services", category: "Expansion" },
        { text: "Customer quotes: 'InfraModern saved us $2.3M and 18 months on our cloud migration' - CTO, Fortune 500 Retailer", category: "Testimonials" }
      ]
    }
  },
  evidence_collection_id: 'col-inframodern-20240114',
  citations: [
    { claim_id: "cost_0", evidence_item_id: "inframodern-cost-analysis", citation_text: "37% average cloud cost reduction", citation_context: "Analysis of 50 customer implementations showing pre/post migration costs", citation_number: 1 }
  ],
  metadata: {
    analysisDepth: 'comprehensive',
    processingTime: 35234,
    reportVersion: '2.0',
    confidenceScores: {
      technical: 0.92,
      financial: 0.89,
      market: 0.90,
      overall: 0.90
    }
  }
};

// Add new evidence items for the additional companies
export const additionalEvidenceItems: DemoEvidenceItem[] = [
  // FutureTech evidence
  { _original_crypto_id: "futuretech-market-size", id: "futuretech-market-size", type: "market_research", source_tool: "Gartner Report", content_summary: "AutoML market valued at $4.2B in 2024, projected $14.8B by 2028. Key drivers: shortage of data scientists, democratization of ML, enterprise AI adoption.", timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "futuretech-benchmark-results", id: "futuretech-benchmark-results", type: "technical_analysis", source_tool: "MLPerf Benchmarking", content_summary: "FutureTech AutoML achieved SOTA on 78% of datasets: CIFAR-10 (98.2%), IMDB sentiment (94.1%), Housing prices (R² 0.95). Average 15% better than Google AutoML.", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Additional Ring4 evidence
  { _original_crypto_id: "ring4-ml-architecture", id: "ring4-ml-architecture", type: "technical_documentation", source_tool: "Architecture Review", content_summary: "ML pipeline: Real-time feature extraction → Ensemble model (XGBoost + LSTM) → A/B testing framework. Processing 2M+ calls daily with 94% routing accuracy.", timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: "ring4-ai-performance", id: "ring4-ai-performance", type: "performance_metrics", source_tool: "Performance Dashboard", content_summary: "AI metrics: Transcription accuracy 97% (Whisper fine-tuned), Smart routing saves 2.3 hrs/week per user, Spam detection 89% accuracy with 0.1% false positives.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  
  // More evidence items for completeness
  { _original_crypto_id: "gartner-ucaas-2024", id: "gartner-ucaas-2024", type: "market_research", source_tool: "Gartner UCaaS Report", content_summary: "UCaaS market $15.8B in 2024, growing 22% CAGR. Key trends: security focus, AI integration, mobile-first design. Ring4 positioned in Visionaries quadrant.", timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
];

// Merge all evidence items
export const allMockEvidenceItems = [...mockEvidenceItems, ...additionalEvidenceItems];

// Update the standard reports array
mockStandardReports.push(mockFutureTechReport, mockSynergyReport, mockInfraModernReport);

// Update the complete mock demo reports mapping
Object.assign(mockDemoReports, {
  'report-futuretech-comprehensive': mockFutureTechReport,
  'report-synergy-comprehensive': mockSynergyReport,
  'report-inframodern-comprehensive': mockInfraModernReport
});

// Deep dive mock data for Ring4 (from df71adb)
export const deepDiveMockData = {
  executiveSummary: {
    companyName: 'Ring4',
    evaluationDate: '2025-01-15',
    overallScore: 87,
    investmentThesis: 'Ring4 demonstrates exceptional technical execution with internal access revealing sophisticated engineering practices, robust security implementations, and clear scalability roadmap. The deep dive analysis confirms strong operational fundamentals and identifies specific optimization opportunities worth $2.3M in annual savings.',
    keyFindings: {
      enablers: [
        'Sophisticated microservices architecture with 99.97% uptime',
        'Advanced security practices including zero-trust architecture',
        'Automated testing coverage at 94% with comprehensive CI/CD',
        'Strong engineering culture with detailed code review processes',
        'Clear technical roadmap with quarterly OKRs and milestone tracking',
        'Efficient cost management with $180k annual cloud optimization',
        'Robust disaster recovery with 15-minute RTO/RPO targets'
      ],
      blockers: [
        'Legacy authentication service requires $120k modernization investment',
        'Database sharding needed for 10x scale ($200k implementation cost)',
        'Missing SOC2 Type II certification limiting enterprise sales',
        'Technical debt in payment processing system (6-month remediation)'
      ],
      risks: [
        'Key person dependency on lead architect (succession planning needed)',
        'Vendor concentration risk with 70% infrastructure on single provider',
        'Compliance gaps for international expansion (GDPR, SOX readiness)',
        'Performance bottlenecks identified at 50k concurrent users'
      ]
    },
    recommendations: [
      'Implement database sharding strategy (Q2 2025, $200k investment)',
      'Complete SOC2 Type II certification (Q1 2025, $80k cost)',
      'Modernize authentication service with zero-downtime migration',
      'Establish multi-cloud strategy for vendor risk mitigation',
      'Hire senior architect to reduce key person dependency',
      'Implement performance optimization for 100k+ user scale'
    ],
    dealBreakers: []
  },
  
  internalCodeAnalysis: {
    companyName: 'Ring4',
    analysisDate: '2025-01-15',
    repositoriesAnalyzed: 23,
    totalLinesOfCode: 487000,
    overallCodeQuality: 88,
    securityScore: 85,
    maintainabilityScore: 82,
    codebaseMetrics: {
      languages: [
        {
          name: 'TypeScript',
          lines: 195000,
          percentage: 40,
          quality: 'excellent',
          testCoverage: 94
        },
        {
          name: 'JavaScript',
          lines: 146000,
          percentage: 30,
          quality: 'good',
          testCoverage: 87
        },
        {
          name: 'Python',
          lines: 97000,
          percentage: 20,
          quality: 'good',
          testCoverage: 91
        },
        {
          name: 'Go',
          lines: 49000,
          percentage: 10,
          quality: 'excellent',
          testCoverage: 96
        }
      ],
      complexity: {
        averageCyclomaticComplexity: 3.2,
        highComplexityFunctions: 12,
        technicalDebtRatio: 8.5,
        duplicatedCodePercentage: 2.1
      },
      dependencies: {
        totalPackages: 342,
        outdatedPackages: 23,
        vulnerablePackages: 4,
        licenseIssues: 1
      }
    },
    securityAnalysis: {
      vulnerabilities: [
        { severity: 'high', count: 2, trend: 'decreasing' },
        { severity: 'medium', count: 8, trend: 'stable' },
        { severity: 'low', count: 15, trend: 'decreasing' }
      ],
      securityPractices: [
        { practice: 'Dependency Scanning', implemented: true, score: 95 },
        { practice: 'Static Code Analysis', implemented: true, score: 88 },
        { practice: 'Secret Detection', implemented: true, score: 92 },
        { practice: 'Container Scanning', implemented: false, score: 0 },
        { practice: 'License Compliance', implemented: true, score: 78 }
      ]
    },
    technicalDebt: [
      {
        category: 'Legacy Authentication Service',
        severity: 'high' as const,
        impact: 'Blocking enterprise features and SOC2 compliance',
        effort: '6 months',
        cost: '$120,000',
        priority: 1,
        affectedComponents: ['User Service', 'API Gateway', 'Admin Dashboard']
      },
      {
        category: 'Database Schema Optimization',
        severity: 'medium' as const,
        impact: 'Performance degradation at scale',
        effort: '3 months',
        cost: '$60,000',
        priority: 2,
        affectedComponents: ['User Service', 'Analytics Service', 'Reporting']
      },
      {
        category: 'Frontend Code Duplication',
        severity: 'low' as const,
        impact: 'Increased maintenance overhead',
        effort: '2 months',
        cost: '$30,000',
        priority: 3,
        affectedComponents: ['Web App', 'Mobile App', 'Admin Panel']
      }
    ],
    codeReviewProcess: {
      averageReviewTime: '4.2 hours',
      reviewParticipation: 98,
      automatedChecks: true,
      requiredApprovals: 2,
      branchProtection: true
    },
    recommendations: [
      'Prioritize modernization of legacy authentication service to enable enterprise features',
      'Implement container security scanning in CI/CD pipeline',
      'Address high-severity vulnerabilities in payment processing module',
      'Establish technical debt tracking and quarterly remediation goals',
      'Implement automated dependency updates with security monitoring',
      'Create coding standards documentation and enforce through linting',
      'Set up performance monitoring for database queries and API endpoints'
    ]
  },

  stackEvolution: {
    companyName: 'Ring4',
    foundingYear: '2019',
    currentYear: '2025',
    overallEvolution: 'Ring4 has demonstrated exceptional technical evolution, transitioning from a monolithic MVP to a sophisticated microservices architecture.',
    timeline: [
      {
        year: '2019',
        quarter: '1',
        title: 'Company Founded & MVP Development',
        description: 'Initial team formation and development of core communication platform using React and Node.js monolith.',
        category: 'product' as const,
        confidence: 95,
        keyDevelopments: [
          'React frontend with basic calling functionality',
          'Node.js backend with PostgreSQL database',
          'Initial team of 3 engineers'
        ],
        impact: 'high' as const
      },
      {
        year: '2019',
        quarter: '3',
        title: 'Beta Launch & User Feedback',
        description: 'Launched beta version with 100 initial users, gathered feedback on core features.',
        category: 'product' as const,
        confidence: 92,
        keyDevelopments: [
          'Beta launch with 100 users',
          'WebRTC integration for video calls',
          'Basic user management system'
        ],
        impact: 'medium' as const
      },
      {
        year: '2020',
        quarter: '2',
        title: 'Microservices Migration',
        description: 'Decomposed monolith into microservices to support growing user base and team.',
        category: 'infrastructure' as const,
        confidence: 90,
        keyDevelopments: [
          'User service extraction',
          'Communication service separation',
          'API gateway implementation'
        ],
        impact: 'high' as const
      },
      {
        year: '2021',
        quarter: '1',
        title: 'Enterprise Security Implementation',
        description: 'Added enterprise-grade security features including SSO and advanced encryption.',
        category: 'technology' as const,
        confidence: 88,
        keyDevelopments: [
          'SAML/OAuth SSO integration',
          'End-to-end encryption',
          'Audit logging system'
        ],
        impact: 'high' as const
      },
      {
        year: '2022',
        quarter: '3',
        title: 'AI-Powered Features Launch',
        description: 'Integrated machine learning for smart call routing and transcription services.',
        category: 'product' as const,
        confidence: 85,
        keyDevelopments: [
          'ML-based call routing',
          'Real-time transcription',
          'Sentiment analysis'
        ],
        impact: 'medium' as const
      },
      {
        year: '2023',
        quarter: '4',
        title: 'Cloud Infrastructure Optimization',
        description: 'Major infrastructure overhaul for improved performance and cost efficiency.',
        category: 'infrastructure' as const,
        confidence: 93,
        keyDevelopments: [
          'Kubernetes migration',
          'Multi-region deployment',
          'CDN implementation'
        ],
        impact: 'high' as const
      },
      {
        year: '2024',
        quarter: '4',
        title: 'Scale Readiness & Performance',
        description: 'Current state: 75K users, enterprise-ready platform with strong technical foundation.',
        category: 'product' as const,
        confidence: 96,
        keyDevelopments: [
          '75K active users',
          '99.97% uptime achievement',
          'Enterprise customer wins'
        ],
        impact: 'high' as const
      }
    ],
    keyMilestones: {
      founding: 'Q1 2019 - Initial MVP with 3-person team',
      firstProduct: 'Q3 2019 - Beta launch with 100 users',
      majorPivot: 'Q2 2021 - Shift to enterprise focus',
      currentState: 'Q4 2024 - 75K users, enterprise-ready platform'
    }
  },
  
  technicalLeadership: {
    companyName: 'Ring4',
    overallAssessment: 'Strong technical leadership with experienced founders and growing team',
    teamSize: 12,
    leadershipScore: 85,
    founders: [
      {
        name: 'Alex Chen',
        role: 'CEO & Co-founder',
        tenure: '6 years',
        background: 'Former Senior Engineer at Zoom, 8 years experience',
        strengths: ['Technical architecture', 'Product vision', 'Team building'],
        experience: {
          years: 8,
          companies: ['Zoom', 'Google'],
          domains: ['Communication', 'Distributed Systems']
        },
        education: 'MS Computer Science, Stanford',
        confidence: 90,
        riskLevel: 'low' as const
      }
    ],
    keyTechnicalLeaders: [],
    leadershipGaps: [
      {
        area: 'Security Leadership',
        severity: 'important' as const,
        description: 'Need dedicated security expertise for compliance',
        recommendation: 'Hire security engineer or promote internal candidate',
        timeframe: '3 months'
      }
    ],
    recommendations: [
      'Hire security engineer to address compliance requirements',
      'Establish formal mentorship program for junior developers'
    ],
    riskFactors: [
      'Key person dependency on lead architect',
      'Limited security expertise in leadership team'
    ]
  },
  
  cloudVendorDependencies: {
    companyName: 'Ring4',
    overallRiskScore: 72,
    totalMonthlySpend: '$18,500',
    vendorCount: 12,
    dependencies: [
      {
        name: 'Amazon Web Services',
        category: 'infrastructure' as const,
        criticality: 'critical' as const,
        description: 'Primary cloud infrastructure provider',
        monthlySpend: '$12,000',
        contractTerms: 'Pay-as-you-go',
        riskLevel: 'medium' as const,
        alternatives: ['Google Cloud', 'Microsoft Azure'],
        migrationComplexity: 'high' as const,
        dataExposure: 'extensive' as const
      }
    ],
    riskAssessment: {
      singlePointsOfFailure: ['AWS outage would impact entire platform'],
      vendorConcentrationRisk: 'High dependency on AWS ecosystem',
      dataPrivacyRisks: ['Customer payment data stored with Stripe'],
      costOptimizationOpportunities: ['Reserved instance savings: $2,100/month']
    },
    recommendations: [
      'Implement multi-cloud strategy for critical services',
      'Establish vendor SLA monitoring and alerting'
    ],
    contingencyPlans: {
      criticalVendorFailure: ['Activate backup payment processor within 2 hours'],
      costEscalation: ['Implement cost monitoring and alerts'],
      dataBreachResponse: ['Immediate vendor notification and assessment']
    }
  }
};

// Export everything needed by the application
export default {
  mockDemoScanRequests,
  mockStandardReports,
  mockDeepDiveReports,
  mockEnhancedPEReports,
  mockDemoReports,
  mockEvidenceItems: allMockEvidenceItems,
  deepDiveMockData
}; 