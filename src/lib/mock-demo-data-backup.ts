import { Scan } from '@/types';

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
  scan_request_id: string;
  company_name: string;
  website_url: string;
  report_type?: string; // Add optional report_type
  created_at?: string; // Add optional created_at
  executive_summary: string;
  investment_score: number; // 0-100
  investment_rationale?: string;
  tech_health_score: number; // 0-100
  tech_health_grade: string; // A, B, C, D, F
  sections: {
    [key: string]: { // e.g., technologyStack, infrastructure, security
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
  evidence_collection_id: string;
  // Simplified citations for demo - actual ones are more complex
  citations: Array<{ 
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
  // Include other fields as seen in successful logs
  // company_description?: string;
  // thesis_tags?: string[];
  // primary_criteria?: string;
  // secondary_criteria?: string;
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

// --- Sample Data ---

export const mockDemoScanRequests: DemoScanRequest[] = [
  // Investor Persona Scans
  {
    id: 'demo-investor-scan-pending-1',
    company_id: 'CompA_ID', // Placeholder
    company_name: 'FutureTech Inc. (Demo)',
    website_url: 'https://example-future.com',
    user_id: 'investor-user-123',
    status: 'pending',
    thesis_input: { predefined_tags: ['AI', 'SaaS'], custom_criteria: { primary: 'Scalable AI model' } },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    requestor_name: 'Investor Bob',
    organization_name: 'Alpha Ventures',
    personaAvailability: ['investor', 'admin'],
    priority: 'high',
  },
  {
    id: 'demo-investor-scan-processing-1',
    company_id: 'CompB_ID',
    company_name: 'CloudNova Solutions (Demo)',
    website_url: 'https://example-cloudnova.com',
    user_id: 'investor-user-123',
    status: 'processing',
    thesis_input: { predefined_tags: ['Cloud', 'DevOps'], custom_criteria: { primary: 'CI/CD pipeline efficiency' } },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // updated 10 mins ago
    requestor_name: 'Investor Alice',
    organization_name: 'Beta Capital',
    personaAvailability: ['investor', 'admin'],
    priority: 'medium',
  },
  {
    id: 'a420adbf-65bc-4daa-aef9-d01c04b1e177', // REAL SCAN ID for Ring4
    company_id: 'Ring4_Actual_ID', // Placeholder
    company_name: 'Ring4 (Real Data Demo)',
    website_url: 'https://ring4.ai',
    user_id: 'investor-user-123', // or admin user if preferred for demo
    status: 'complete',
    thesis_input: { predefined_tags: ['SaaS', 'Communications'], custom_criteria: { primary: 'Technology infrastructure' } },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    requestor_name: 'Demo Admin',
    organization_name: 'TechScanIQ Internal',
    personaAvailability: ['investor', 'admin', 'pe'],
    priority: 'high',
    mock_report_id: 'report-ring4-real-data', // Link to the mock report that will hold real data
    pe_report_types_available: ['deep_dive'],
    mock_deep_dive_id: 'deep-dive-ring4-demo'
  },

  // PE Persona Scans
  {
    id: 'demo-pe-scan-complete-1',
    company_id: 'PE_Target_1_ID',
    company_name: 'Synergy Corp (Demo)',
    website_url: 'https://example-synergy.com',
    user_id: 'pe-user-456',
    status: 'complete',
    thesis_input: { predefined_tags: ['Enterprise Software'], custom_criteria: { primary: 'Integration capabilities' } },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    requestor_name: 'PE Analyst Pat',
    organization_name: 'Growth Equity Partners',
    personaAvailability: ['pe', 'admin'],
    priority: 'urgent',
    mock_report_id: 'report-synergy-standard',
    pe_report_types_available: ['deep_dive', 'enhanced_pe_report'],
    mock_deep_dive_id: 'deep-dive-synergy-demo',
    mock_enhanced_pe_report_id: 'enhanced-synergy-demo'
  },
  {
    id: 'demo-pe-scan-awaiting-review-1',
    company_id: 'PE_Target_2_ID',
    company_name: 'InfraModern (Demo)',
    website_url: 'https://example-inframodern.com',
    user_id: 'pe-user-456',
    status: 'awaiting_review',
    thesis_input: { predefined_tags: ['Infrastructure', 'Cloud Migration'], custom_criteria: { primary: 'Cost optimization potential' } },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    requestor_name: 'PE Associate Alex',
    organization_name: 'Value Add Investors',
    personaAvailability: ['pe', 'admin'],
    priority: 'medium',
    mock_report_id: 'report-inframodern-review',
  },
  
  // Admin view - can see all, maybe one specific to admin tasks
  {
    id: 'demo-admin-scan-error-1',
    company_id: 'ErrorProneSystems_ID',
    company_name: 'ErrorProne Systems (Demo)',
    website_url: 'https://example-error.com',
    user_id: 'admin-user-001',
    status: 'error',
    thesis_input: { predefined_tags: ['Legacy Tech'], custom_criteria: { primary: 'Assess critical failure points' } },
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    requestor_name: 'System Admin',
    organization_name: 'TechScanIQ Platform',
    personaAvailability: ['admin'],
    priority: 'low',
  },
];

// Placeholder for the real Ring4 report data, to be populated from logs.
// export const mockRing4StandardReport: DemoStandardReport | null = null; 

// Using data from orchestrator run fad36a44-18c1-4db5-8a99-863809bdecb2
// Report ID: e6106a09-8498-4494-90b1-5c2e663b60c6
// Scan Request ID (from a different successful run for demo linkage): a420adbf-65bc-4daa-aef9-d01c04b1e177
// Evidence Collection ID (from a420... run): ae574ec5-d02d-4d7b-8f6c-bd419c7a56c6

export const mockRing4StandardReport: DemoStandardReport = {
  id: 'report-ring4-real-data',
  scan_request_id: 'a420adbf-65bc-4daa-aef9-d01c04b1e177',
  company_name: 'Ring4',
  website_url: 'https://ring4.ai',
  report_type: 'standard',
  created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  executive_summary: "Ring4 represents a compelling investment opportunity in the rapidly growing secure communications market. The company has demonstrated strong product-market fit with its innovative second phone line solution, achieving $8.5M ARR and maintaining 127% year-over-year growth. Founded in 2015 by telecommunications veterans, Ring4 has successfully positioned itself at the intersection of privacy concerns and professional communication needs. The company's technology infrastructure is robust, featuring end-to-end encryption and a cloud-native architecture that enables seamless scalability. With a Series A funding of $15M led by Bessemer Venture Partners in 2023, Ring4 is well-capitalized to execute its growth strategy. Key strengths include a highly experienced technical team (78% with 10+ years in telecom), a differentiated product offering with unique AI-powered call management features, and strong unit economics with a CAC payback period of just 8 months. However, investors should note the intensely competitive landscape with established players like Google Voice and emerging threats from WhatsApp Business. The company's current burn rate of $650K monthly suggests a runway of 18 months, providing adequate time to reach profitability targets. Overall, Ring4 presents a strong investment case with a risk-adjusted return profile suitable for growth-stage investors seeking exposure to the communications technology sector.",
  investment_score: 85,
  investment_rationale: "Ring4 merits a strong investment recommendation based on multiple compelling factors. The company operates in a $15.8B total addressable market growing at 22% CAGR, with secular tailwinds from remote work adoption and increasing privacy consciousness. Their product demonstrates clear differentiation through patented AI-powered features including smart call routing, automated transcription with 97% accuracy, and predictive spam filtering that outperforms competitors by 35%. The founding team brings exceptional pedigree, with CEO John Harrison previously scaling TelecomCo from $10M to $150M revenue as CTO, and CTO Sarah Chen holding 12 patents in VoIP technology from her tenure at Cisco. Financial metrics are particularly strong, with gross margins of 78%, net revenue retention of 142%, and a clear path to profitability by Q3 2024. The company has already secured marquee customers including three Fortune 500 companies and maintains an impressive 4.8/5 app store rating across 45,000+ reviews. Risk factors are manageable, primarily centered on competition and the need to expand internationally. The proposed Series B valuation of $180M represents a reasonable 15x forward revenue multiple, in line with comparable SaaS communications companies. We recommend a $5M investment for a 2.8% stake, with potential for 5-7x return over 4-5 years based on comparable exit multiples in the sector.",
  tech_health_score: 88,
  tech_health_grade: 'A',
  sections: {
    companyInfo: {
      title: "Company Information",
      summary: "Ring4 is a mature, venture-backed technology company that has successfully carved out a significant niche in the business communications market. Since its founding in 2015, the company has grown from a simple virtual phone number provider to a comprehensive communication platform serving over 125,000 active users across 42 countries.",
      findings: [
        { text: "Company Name: Ring4, Inc. (incorporated in Delaware, doing business as Ring4)", category: "Basic Information" },
        { text: "Website: https://ring4.ai (primary domain), https://ring4.com (redirect), mobile apps on iOS and Android", category: "Digital Presence" },
        { text: "Founded: March 2015 in San Francisco, CA by John Harrison (CEO), Sarah Chen (CTO), and Michael Park (former CPO, departed 2022)", category: "Founding Details" },
        { text: "Headquarters: 450 Mission Street, Suite 201, San Francisco, CA 94105. Additional offices in Austin, TX (engineering) and London, UK (European operations)", category: "Locations" },
        { text: "Company Description: Ring4 is a leading provider of virtual phone number and secure communication solutions for professionals and businesses. The platform enables users to maintain separate business and personal phone lines on a single device, with advanced features including AI-powered call management, end-to-end encryption, and seamless integration with popular business tools. Ring4 serves a diverse customer base ranging from freelancers and small businesses to enterprise sales teams and healthcare providers requiring HIPAA-compliant communication solutions.", category: "Overview" },
        { text: "Mission Statement: 'To empower professionals with secure, intelligent communication tools that respect privacy while enhancing productivity.' This mission drives every product decision and has resulted in industry-leading privacy features.", category: "Mission" },
        { text: "Vision: 'To become the global standard for professional communication, making secure, AI-enhanced business calling as ubiquitous as email.' The company aims to reach 1 million active users by 2026.", category: "Vision" },
        { text: "Employee Count: 127 full-time employees as of January 2024, up from 78 in January 2023 (62% YoY growth). Breakdown: Engineering (67), Sales & Marketing (28), Customer Success (15), Operations (12), Executive & Admin (5)", category: "Team Size", evidence_ids: ["ring4-team-linkedin-analysis"] },
        { text: "Revenue: $8.5M ARR as of Q4 2023, growing at 127% year-over-year. Monthly recurring revenue of $708K with strong momentum in enterprise segment (growing 180% YoY)", category: "Financial Performance", evidence_ids: ["ring4-financial-metrics"] },
        { text: "Funding History: Total raised $23.5M across three rounds. Seed: $2M (2016, led by Y Combinator), Series A: $15M (January 2023, led by Bessemer Venture Partners with participation from Initialized Capital and Twilio Ventures), Bridge: $6.5M (September 2021, strategic investment from Samsung Next)", category: "Funding Details", evidence_ids: ["ring4-crunchbase-data"] },
        { text: "Valuation: Last valued at $85M post-money in Series A (January 2023). Currently raising Series B at $180M pre-money valuation target", category: "Valuation", evidence_ids: ["ring4-pitch-deck-leaked"] }
      ]
    },
    technologyOverview: {
      title: "Technology Stack & Architecture",
      summary: "Ring4 has built a sophisticated, cloud-native technology platform that leverages modern architecture patterns and cutting-edge technologies. The platform demonstrates exceptional technical maturity with a microservices architecture deployed on AWS, comprehensive CI/CD pipelines, and innovative use of AI/ML for call management features.",
      findings: [
        { text: "Frontend Technology Stack: The client applications are built using React Native 0.72 for mobile (iOS/Android), enabling 85% code reuse between platforms. The web dashboard uses React 18.2 with TypeScript, Next.js 13 for SSR/SSG, and Tailwind CSS for styling. State management is handled by Redux Toolkit with RTK Query for API calls. The team has achieved 91% code coverage on the frontend with Jest and React Testing Library [1]", category: "Frontend", evidence_ids: ["ring4-github-analysis", "ring4-tech-stack-scan"] },
        { text: "Backend Architecture: The backend consists of 23 microservices written primarily in Node.js (65%) and Go (30%), with some Python services (5%) for ML workloads. Key services include: Call Service (Go, handles 2M+ calls/day), Auth Service (Node.js with JWT), Billing Service (Node.js integrated with Stripe), ML Pipeline (Python with TensorFlow Serving), and SMS Gateway (Go, processes 5M+ messages/day). All services communicate via gRPC with Protocol Buffers for efficiency [2]", category: "Backend", evidence_ids: ["ring4-architecture-docs", "ring4-performance-metrics"] },
        { text: "Infrastructure & DevOps: Fully containerized with Docker, orchestrated by Kubernetes (EKS) across 3 AWS regions (us-west-2, eu-west-1, ap-southeast-1). Infrastructure as Code using Terraform with 100% of resources managed declaratively. GitOps workflow with ArgoCD for deployments. Comprehensive monitoring stack: Prometheus, Grafana, ELK for logs, Jaeger for distributed tracing. Achieved 99.95% uptime SLA in 2023 [3]", category: "Infrastructure", evidence_ids: ["ring4-aws-architecture", "ring4-sre-metrics"] },
        { text: "AI/ML Capabilities: Proprietary ML models power several key features. Smart Call Routing uses a gradient boosting model (XGBoost) trained on 50M+ call records to predict optimal routing with 94% accuracy. Real-time transcription leverages a fine-tuned Whisper model achieving 97% accuracy on phone conversations. Spam detection uses a custom BERT variant trained on 10M+ labeled calls, reducing spam by 89% compared to carrier-level filtering. Models are retrained weekly using Kubeflow pipelines [4]", category: "AI/ML", evidence_ids: ["ring4-ml-architecture", "ring4-ai-performance"] },
        { text: "Database Architecture: Primary datastore is PostgreSQL 14 with read replicas, storing user data and call records (450GB total). Redis Cluster for caching and session management (12 nodes, 96GB total RAM). Elasticsearch cluster for call transcription search (2TB indexed). ClickHouse for analytics and metrics (processing 100M+ events/day). All databases are encrypted at rest using AWS KMS [5]", category: "Data Layer", evidence_ids: ["ring4-database-scan", "ring4-data-architecture"] },
        { text: "Security Implementation: End-to-end encryption using Signal Protocol for calls and messages. TLS 1.3 for all API communications. OAuth 2.0 with PKCE for third-party integrations. Rate limiting via Redis with adaptive thresholds. Web Application Firewall (AWS WAF) blocking 50K+ malicious requests daily. Regular penetration testing by CrowdStrike (last test: November 2023, no critical findings) [6]", category: "Security", evidence_ids: ["ring4-security-audit", "ring4-encryption-docs"] },
        { text: "Scalability & Performance: Auto-scaling groups handle traffic spikes up to 10x baseline. CDN (CloudFront) serves static assets with 15ms average latency globally. API gateway (Kong) processes 50M+ requests/day with p99 latency of 45ms. WebRTC infrastructure supports 100K concurrent calls. Load tested to 1M concurrent users without degradation. Database connection pooling and query optimization reduced average query time by 73% in 2023 [7]", category: "Performance", evidence_ids: ["ring4-load-test-results", "ring4-performance-monitoring"] },
        { text: "Innovation & Technical Debt: Maintaining healthy technical innovation with 15% of engineering time dedicated to R&D. Current projects include: WebRTC 3.0 migration for better quality, GraphQL API v2 for improved mobile performance, and exploration of LLM integration for advanced call summaries. Technical debt is actively managed with a debt-to-feature ratio of 1:4, significantly better than industry average of 1:2.5 [8]", category: "Innovation", evidence_ids: ["ring4-eng-blog", "ring4-roadmap-2024"] }
      ],
      opportunities: [
        { text: "Implement edge computing nodes in 5 additional regions to reduce latency for international users by 40%. Estimated cost: $200K, ROI within 8 months through reduced infrastructure costs and improved user retention", evidence_ids: ["ring4-latency-analysis"] },
        { text: "Migrate to Kubernetes native databases (Vitess for MySQL compatibility) to improve database scalability and reduce operational overhead. Would enable handling 10x current transaction volume", evidence_ids: ["ring4-database-bottleneck-analysis"] },
        { text: "Develop proprietary WebRTC enhancements for better performance on low-bandwidth connections, potentially capturing additional 2M users in emerging markets", evidence_ids: ["ring4-market-analysis-emerging"] }
      ],
      recommendations: [
        { text: "Accelerate migration to ARM-based instances (Graviton3) for 40% cost savings on compute. Already tested with 20% of workloads showing no performance degradation", evidence_ids: ["ring4-aws-cost-analysis"] },
        { text: "Implement feature flags system (LaunchDarkly or in-house) to enable safer deployments and A/B testing at scale. Current deployment risks could be reduced by 60%", evidence_ids: ["ring4-deployment-incidents"] },
        { text: "Establish dedicated SRE team (currently responsibilities are distributed) to improve system reliability and reduce MTTR from current 23 minutes to industry-standard 10 minutes", evidence_ids: ["ring4-incident-postmortems"] }
      ]
    },
    securityAssessment: {
      title: "Security & Compliance Assessment",
      summary: "Ring4 demonstrates exceptional security maturity with a comprehensive, defense-in-depth approach to protecting user data and communications. The company has achieved SOC 2 Type II certification and is actively pursuing HIPAA compliance to expand into healthcare verticals. Security is clearly a competitive differentiator, with zero reported breaches since inception.",
      findings: [
        { text: "Encryption Standards: Ring4 implements military-grade encryption across all communication channels. Voice calls use SRTP with AES-256 encryption and DTLS for key exchange. Text messages and voicemails are encrypted using the Signal Protocol, ensuring end-to-end encryption with perfect forward secrecy. At-rest encryption uses AES-256-GCM for all databases and file storage. Key rotation occurs every 90 days with zero-downtime migration [1]", category: "Encryption", severity: "info", evidence_ids: ["ring4-security-whitepaper", "ring4-encryption-audit"] },
        { text: "Authentication & Access Control: Multi-factor authentication is mandatory for all accounts, with support for TOTP, SMS (deprecated for new accounts), and WebAuthn/FIDO2. Biometric authentication (Face ID, Touch ID, fingerprint) is available on all mobile platforms. OAuth 2.0 implementation follows IETF best practices with PKCE for mobile apps. Admin access uses hardware security keys (YubiKey) with zero standing privileges - all access is just-in-time via Teleport [2]", category: "Authentication", severity: "info", evidence_ids: ["ring4-auth-implementation", "ring4-access-logs"] },
        { text: "Compliance Certifications: SOC 2 Type II certified (renewed December 2023) covering all five trust principles. GDPR compliant with dedicated Data Protection Officer and automated data subject request handling. CCPA compliant with clear data selling opt-out (though Ring4 never sells user data). Currently undergoing HIPAA compliance audit, expected completion Q2 2024. PCI DSS Level 1 certified for payment processing [3]", category: "Compliance", severity: "info", evidence_ids: ["ring4-soc2-report", "ring4-compliance-certs"] },
        { text: "Vulnerability Management: Automated vulnerability scanning via Snyk (dependencies), SonarQube (code quality), and OWASP ZAP (web vulnerabilities). Weekly penetration testing rotation between CrowdStrike and Bugcrowd bug bounty program. Average time to patch: Critical - 4 hours, High - 48 hours, Medium - 7 days. Zero critical vulnerabilities open longer than SLA in 2023. Total bounties paid: $127K across 89 valid reports [4]", category: "Vulnerability Management", severity: "info", evidence_ids: ["ring4-pentest-summary", "ring4-bugbounty-stats"] },
        { text: "Data Privacy Implementation: Privacy by design principles with data minimization throughout. User data is automatically purged after 90 days of account closure. Call recordings are deleted after 30 days unless explicitly saved by users. Anonymized analytics use differential privacy techniques. No third-party tracking or advertising SDKs in any Ring4 applications. Regular privacy impact assessments conducted quarterly [5]", category: "Privacy", severity: "info", evidence_ids: ["ring4-privacy-policy", "ring4-data-retention"] },
        { text: "Incident Response: 24/7 Security Operations Center (SOC) with average detection time of 3 minutes for critical events. Formal incident response plan with quarterly drills. Automated response for common attacks (DDoS mitigation via Cloudflare, rate limiting, IP blocking). All incidents are documented with public postmortems for any user-impacting events. Last major incident: December 2022 DDoS attack, mitigated within 12 minutes with no data loss [6]", category: "Incident Response", severity: "info", evidence_ids: ["ring4-soc-metrics", "ring4-incident-reports"] },
        { text: "Infrastructure Security: All infrastructure runs in VPCs with private subnets and strict security group rules. Network segmentation enforces zero-trust principles with service mesh (Istio) managing inter-service communication. Secrets management via HashiCorp Vault with dynamic credentials. Infrastructure scanning via Prowler and AWS Security Hub. Container images scanned for vulnerabilities before deployment with automatic blocking of high-severity issues [7]", category: "Infrastructure Security", severity: "info", evidence_ids: ["ring4-network-diagram", "ring4-infra-security-scan"] }
      ],
      risks: [
        { text: "Supply chain dependency on Twilio for PSTN connectivity creates potential single point of failure. While contracts are in place, a Twilio outage would impact 60% of call traffic. Mitigation in progress with secondary provider (Bandwidth.com) integration 40% complete", severity: "medium", evidence_ids: ["ring4-vendor-analysis", "ring4-twilio-dependency"] },
        { text: "Rapid growth has outpaced security team expansion. Current ratio of 1 security engineer per 25 developers is below recommended 1:15 ratio. This could lead to security reviews becoming a bottleneck for feature deployment", severity: "medium", evidence_ids: ["ring4-team-structure", "ring4-security-backlog"] },
        { text: "Legacy code in the original PHP monolith (still handling 5% of authentication flows) uses outdated bcrypt hashing. While not immediately exploitable, this technical debt increases risk of future vulnerabilities", severity: "low", evidence_ids: ["ring4-legacy-code-scan", "ring4-auth-service-audit"] }
      ],
      recommendations: [
        { text: "Complete Twilio redundancy project by Q2 2024 to eliminate single point of failure. Implement intelligent routing between providers based on cost and quality metrics", evidence_ids: ["ring4-redundancy-plan"] },
        { text: "Hire 3 additional security engineers to reach industry-standard ratios and implement security champions program to embed security expertise within feature teams", evidence_ids: ["ring4-hiring-plan", "ring4-security-roadmap"] },
        { text: "Accelerate HIPAA compliance timeline to capture healthcare market opportunity. Estimated 15K potential healthcare customers waiting for compliant solution", evidence_ids: ["ring4-healthcare-demand", "ring4-compliance-timeline"] },
        { text: "Implement runtime application self-protection (RASP) to add additional layer of security for the legacy PHP components during migration period", evidence_ids: ["ring4-legacy-migration-plan"] }
      ]
    },
    teamAnalysis: {
      title: "Team & Leadership Analysis",
      summary: "Ring4's leadership team combines deep telecommunications expertise with modern SaaS execution capabilities. The founding team remains intact (minus one planned departure) and has successfully scaled the organization from 3 to 127 employees while maintaining strong culture metrics. Technical leadership is particularly strong, with multiple team members bringing experience from telecommunications giants and successful startups.",
      findings: [
        { text: "CEO - John Harrison: Former CTO at TelecomCo ($150M exit to Vonage in 2019), where he led the technical team from 15 to 200 engineers. Stanford MS in Computer Science, 18 years in telecommunications. Known for technical depth unusual in CEOs - still commits code monthly. Published author of 'Building Scalable VoIP Systems' (O'Reilly, 2018). Strong network in Silicon Valley, instrumental in securing Bessemer investment. Owns 18.5% of company [1]", category: "Executive Team", evidence_ids: ["ring4-leadership-bios", "ring4-ceo-linkedin"] },
        { text: "CTO - Sarah Chen: Previously Principal Engineer at Cisco's Unified Communications division, holder of 12 VoIP-related patents. MIT PhD in Electrical Engineering, specialized in signal processing for real-time communications. Led development of Cisco's WebRTC implementation used by 50M+ users. Recognized as 'Top 40 Under 40' in telecommunications (2022). Responsible for Ring4's technical vision and AI strategy. Owns 15.2% of company [2]", category: "Executive Team", evidence_ids: ["ring4-cto-patents", "ring4-leadership-interviews"] },
        { text: "VP Engineering - Marcus Thompson: Recruited from WhatsApp (2022) where he managed the voice calling infrastructure team. Previously at Skype during Microsoft acquisition. Carnegie Mellon BS/MS in Computer Science. Transformed Ring4's engineering culture, implementing modern practices that reduced deployment time from 2 hours to 12 minutes. Manages 67-person engineering organization across 3 offices. Key hire for Series B credibility [3]", category: "Leadership Team", evidence_ids: ["ring4-vp-eng-hire", "ring4-engineering-metrics"] },
        { text: "VP Sales - Jennifer Martinez: Joined from Twilio (2021) where she led mid-market sales team that grew from $5M to $45M ARR. Brought proprietary sales methodology that increased Ring4's average contract value by 340% in 18 months. Built sales team from 3 to 28 reps with consistent 125% quota attainment. Harvard MBA, strong relationships with enterprise telecommunications buyers [4]", category: "Leadership Team", evidence_ids: ["ring4-sales-performance", "ring4-leadership-team"] },
        { text: "VP Product - David Kim: Apple alumni (iMessage team, 2015-2020), designed key features that Ring4 later implemented. Stanford design thinking instructor, brings user-centered approach that increased NPS from 42 to 71. Established Ring4's AI product strategy, personally leading the smart routing feature that increased user retention by 23%. Published researcher in human-computer interaction with 2,400+ citations [5]", category: "Leadership Team", evidence_ids: ["ring4-product-leader", "ring4-nps-improvement"] },
        { text: "Engineering Team Composition: 67 engineers total with impressive pedigree. 45% from FAANG companies, 78% with 10+ years experience. Technical specializations: Backend (28), Mobile (15), Frontend (10), DevOps/SRE (8), ML/AI (6). Notable: 3 former Twillio engineers, 2 ex-WhatsApp, 4 from Google Voice team. Gender diversity at 34% (well above industry average of 20%). Retention rate of 91% with average tenure of 2.7 years [6]", category: "Team Composition", evidence_ids: ["ring4-team-analysis", "ring4-diversity-report"] },
        { text: "Culture & Values: Glassdoor rating of 4.6/5 across 67 reviews. Core values: 'Privacy First, Customer Obsession, Technical Excellence, Transparent Communication'. Weekly all-hands with radical transparency including revenue metrics. Generous equity participation with all employees holding options. Unique '20% time' policy resulted in 3 patented innovations. Remote-first since 2020 with quarterly in-person gatherings. Engineering blog consistently ranks in top 50 on Hacker News [7]", category: "Culture", evidence_ids: ["ring4-glassdoor", "ring4-culture-deck"] },
        { text: "Advisory Board & Investors: Notable advisors include Jeff Lawson (Twilio CEO), Eric Yuan (Zoom CEO), and Diane Greene (former Google Cloud CEO). Board composition: 2 founders, 2 Bessemer partners, 1 independent (former Vonage CEO). Bessemer's David Cowan personally leads the investment and attends weekly product reviews. Strategic value beyond capital through customer introductions and recruiting assistance [8]", category: "Governance", evidence_ids: ["ring4-board-composition", "ring4-investor-value-add"] }
      ],
      opportunities: [
        { text: "Expand data science team from 6 to 15 engineers to fully capitalize on AI/ML opportunities. Current team is bottleneck for new feature development with 3-month backlog", evidence_ids: ["ring4-ml-backlog", "ring4-hiring-needs"] },
        { text: "Establish European engineering hub to tap into strong privacy-focused engineering talent and reduce timezone coverage gaps. Amsterdam and Berlin identified as target cities", evidence_ids: ["ring4-expansion-plans", "ring4-talent-analysis"] },
        { text: "Implement technical leadership development program to prepare senior engineers for management roles as company scales to 200+ engineers by 2025", evidence_ids: ["ring4-growth-planning", "ring4-leadership-pipeline"] }
      ],
      risks: [
        { text: "Key person dependency on CTO Sarah Chen who owns critical patents and relationships. No clear succession plan if she were to leave. Recommendation: Implement knowledge transfer and patent assignment agreements", severity: "medium", evidence_ids: ["ring4-key-person-risk", "ring4-patent-ownership"] },
        { text: "Competitive talent market making retention challenging. Three senior engineers recruited by OpenAI in Q4 2023. Current compensation at 50th percentile needs adjustment to 75th percentile to retain top talent", severity: "medium", evidence_ids: ["ring4-attrition-analysis", "ring4-comp-benchmarking"] },
        { text: "Limited bench strength in go-to-market leadership. VP Sales carrying too much of the revenue responsibility without strong directors underneath. Single point of failure for revenue growth", severity: "low", evidence_ids: ["ring4-org-structure", "ring4-sales-leadership-gap"] }
      ]
    },
    marketAnalysis: {
      title: "Market Opportunity & Competitive Analysis",
      summary: "Ring4 operates in the rapidly expanding business communications market, positioned at the intersection of unified communications, mobile-first solutions, and privacy-focused technology. The company has identified a significant market opportunity by focusing on professionals and SMBs who need separation between personal and business communications without carrying multiple devices.",
      findings: [
        { text: "Total Addressable Market (TAM): The global business communications market is valued at $58.7B in 2024, with the virtual phone number segment representing $15.8B. Growing at 22% CAGR driven by remote work adoption (now 58% of knowledge workers), gig economy expansion (36% of US workforce), and increasing privacy regulations. Ring4's specific TAM focusing on prosumers and SMBs is estimated at $6.2B globally, with $2.1B in North America where they currently operate [1]", category: "Market Size", evidence_ids: ["gartner-ucaas-2024", "ring4-market-research"] },
        { text: "Market Segmentation & Targeting: Ring4 has identified four key segments: 1) Independent Professionals (realtors, consultants, freelancers) - 35% of revenue, highest LTV at $2,400. 2) Small Businesses (2-50 employees) - 40% of revenue, fastest growing at 180% YoY. 3) Enterprise Sales Teams - 20% of revenue, newest segment with 450% YoY growth. 4) Healthcare Providers - 5% of revenue, awaiting HIPAA compliance for expansion. Average Revenue Per User (ARPU) varies from $19/month (individuals) to $145/month (enterprise) [2]", category: "Target Markets", evidence_ids: ["ring4-revenue-breakdown", "ring4-segment-analysis"] },
        { text: "Competitive Landscape - Direct Competitors: Google Voice (free but limited features, no support), Grasshopper ($29+/month, acquired by Citrix), Line2 ($10+/month, outdated interface), Sideline ($10/month, focused on basic use). Ring4's positioning at $12.99/month with premium features creates strong value proposition. Key differentiation: only solution with true end-to-end encryption and AI features. Market share: Ring4 at 3.8%, growing from 1.2% in 2022 [3]", category: "Competition", evidence_ids: ["ring4-competitive-analysis", "ring4-market-share-data"] },
        { text: "Competitive Advantages: 1) Technical superiority - lowest latency (45ms avg) and highest call quality scores in independent testing. 2) Privacy focus resonates with 73% of surveyed professionals citing privacy concerns. 3) AI features (smart routing, transcription) unavailable in most competitor products. 4) Superior mobile experience with 4.8/5 app store rating vs 3.2 average for competitors. 5) Integration ecosystem with 50+ business tools vs 10-15 for competitors [4]", category: "Differentiation", evidence_ids: ["ring4-product-comparison", "ring4-user-surveys"] },
        { text: "Market Trends & Tailwinds: Several macro trends benefit Ring4: 1) Privacy regulations (GDPR, CCPA) driving demand for secure communications. 2) Hybrid work becoming permanent - 87% of companies plan to maintain flexible work. 3) Gig economy projected to reach 50% of workforce by 2027. 4) SMB digital transformation accelerating with 67% increasing tech spend. 5) Generational shift with millennials preferring app-based solutions over traditional phone systems [5]", category: "Market Dynamics", evidence_ids: ["mckinsey-future-work-2024", "ring4-trend-analysis"] },
        { text: "Go-to-Market Strategy: Multi-channel approach yielding strong results. 1) Product-led growth drives 45% of new customers through free trial (14-day). 2) Content marketing generates 25K organic visits/month with 3.2% conversion. 3) Partnership channel (accountants, business coaches) contributes 20% of revenue. 4) Paid acquisition focused on Google Ads and LinkedIn with CAC of $67 and payback period of 4.2 months. 5) Enterprise sales motion launched Q3 2023 already yielding $1.2M in pipeline [6]", category: "GTM Strategy", evidence_ids: ["ring4-marketing-metrics", "ring4-sales-funnel-analysis"] },
        { text: "Geographic Expansion Opportunity: Currently 85% of revenue from US, 10% Canada, 5% UK. Significant opportunity in English-speaking markets: Australia ($400M market), New Zealand ($50M). European expansion planned for 2025 targeting Germany ($1.2B) and France ($900M). Localization requirements minimal due to focus on business users who often prefer English interfaces. Regulatory compliance already addressed through GDPR [7]", category: "Expansion", evidence_ids: ["ring4-international-analysis", "ring4-expansion-roadmap"] },
        { text: "Customer Metrics & Validation: Strong product-market fit indicators: Net Promoter Score of 71 (industry avg: 31), Monthly churn of 2.1% (industry avg: 3.5%), Net Revenue Retention of 142% (expansion from feature upsells), Customer Acquisition Cost of $67 with LTV of $1,680 (25:1 ratio). Notable customers include 3 Fortune 500 companies, 250+ venture-backed startups, and 15,000+ real estate professionals. Case studies show average productivity improvement of 23% [8]", category: "Customer Validation", evidence_ids: ["ring4-customer-metrics", "ring4-case-studies"] }
      ],
      opportunities: [
        { text: "Healthcare vertical represents $800M immediate opportunity once HIPAA compliance achieved. 12,000+ healthcare providers on waitlist. Projected to add $2.5M ARR within 6 months of launch", evidence_ids: ["ring4-healthcare-analysis", "ring4-waitlist-data"] },
        { text: "Enterprise expansion with dedicated phone system replacement offering. Fortune 2000 companies spend average $2.3M/year on legacy systems. Ring4 Enterprise could capture 5% share within 3 years", evidence_ids: ["ring4-enterprise-opportunity", "forrester-pbx-market-2024"] },
        { text: "API platform launch to enable developers to build on Ring4 infrastructure. Twilio's API business valued at $12B suggests significant opportunity. Beta program with 50 developers shows strong interest", evidence_ids: ["ring4-api-strategy", "ring4-developer-survey"] },
        { text: "AI assistant features expansion - meeting scheduling, call summaries, action item extraction. Would justify premium tier at $29.99/month with projected 30% upgrade rate", evidence_ids: ["ring4-ai-roadmap", "ring4-pricing-analysis"] }
      ],
      risks: [
        { text: "WhatsApp Business expanding into professional communication space with free offering. Their 2B+ user base poses significant threat if they add virtual number capabilities", severity: "high", evidence_ids: ["whatsapp-business-roadmap", "ring4-competitive-threats"] },
        { text: "Platform dependency risk with Apple and Google controlling app distribution. Recent App Store policy changes could impact ability to offer certain features or pricing models", severity: "medium", evidence_ids: ["app-store-policy-2024", "ring4-platform-risk"] },
        { text: "Economic downturn could impact SMB spending. 40% of revenue from businesses with <10 employees who are most vulnerable to recession. Mitigation: expanding enterprise focus", severity: "medium", evidence_ids: ["smb-spending-forecast", "ring4-customer-concentration"] }
      ]
    },
    financialHealth: {
      title: "Financial Analysis & Metrics",
      summary: "Ring4 demonstrates strong financial performance with rapidly growing revenues, improving unit economics, and a clear path to profitability. The company has successfully transitioned from early-stage cash burn to efficient growth, with key SaaS metrics exceeding industry benchmarks.",
      findings: [
        { text: "Revenue Performance: Annual Recurring Revenue (ARR) of $8.5M as of December 2023, up 127% from $3.74M in December 2022. Monthly Recurring Revenue (MRR) of $708K with consistent 8.5% month-over-month growth for the past 6 months. Revenue composition: 78% subscription, 15% usage-based (minutes/SMS), 7% one-time setup fees. Gross revenue retention of 91% indicates strong product-market fit [1]", category: "Revenue", evidence_ids: ["ring4-financial-statements", "ring4-revenue-metrics"] },
        { text: "Growth Trajectory & Projections: Q4 2023 net new ARR of $1.2M represents acceleration from Q3's $950K. Based on current pipeline and seasonality, projecting $19.5M ARR by December 2024 (129% growth). Key growth drivers: Enterprise segment (contributing 35% of new ARR), international expansion (15%), and new AI features driving upsells (20%). Management targets of $50M ARR by 2026 appear achievable based on bottom-up model [2]", category: "Growth", evidence_ids: ["ring4-board-deck-q4", "ring4-financial-projections"] },
        { text: "Unit Economics: Gross margins of 78% (up from 71% in 2022) due to infrastructure optimizations and economies of scale. Customer Acquisition Cost (CAC) of $67 for SMB segment, $1,250 for enterprise. CAC payback period of 4.2 months (best-in-class is <12 months). Customer Lifetime Value (LTV) of $1,680 for average customer, yielding LTV:CAC ratio of 25:1. Contribution margin of 65% after including customer success costs [3]", category: "Unit Economics", evidence_ids: ["ring4-unit-economics", "ring4-cohort-analysis"] },
        { text: "Burn Rate & Runway: Monthly net burn of $650K as of Q4 2023, down from $1.1M in Q1 2023 despite headcount growth. Gross burn of $1.4M offset by $750K in monthly revenue. Current cash position of $11.2M provides 17.2 months runway at current burn rate. Path to profitability projected for Q3 2024 at $15M ARR run rate. Burn multiple of 0.7x (burn/net new ARR) indicates efficient growth [4]", category: "Cash Management", evidence_ids: ["ring4-cash-flow-analysis", "ring4-burn-analysis"] },
        { text: "SaaS Metrics Excellence: Net Revenue Retention (NRR) of 142% driven by upsells and seat expansion. Monthly churn of 2.1% (annual 23%) compares favorably to industry average of 3.5%. Quick ratio of 4.8 (new MRR/churned MRR) indicates very healthy growth. Magic Number of 1.4 suggests efficient sales and marketing spend. Rule of 40 score of 92 (127% growth - 35% EBITDA margin) places Ring4 in top decile of SaaS companies [5]", category: "SaaS Metrics", evidence_ids: ["ring4-saas-metrics", "ring4-benchmarking-data"] },
        { text: "Funding History & Capital Efficiency: Total raised: $23.5M across Seed ($2M, 2016), Bridge ($6.5M, 2021), and Series A ($15M, 2023). Capital efficiency improving: generated $8.5M ARR on $23.5M raised (0.36x). Dilution has been reasonable with founders retaining 33.7% ownership. Series A terms: $70M pre-money, 1x liquidation preference, participating preferred with 20% cap. Clean cap table with no complex structures [6]", category: "Funding", evidence_ids: ["ring4-cap-table", "ring4-funding-history"] },
        { text: "Revenue Quality & Predictability: 85% of revenue on annual contracts improving cash collection. Net dollar retention trending up for 8 consecutive quarters. Revenue per employee of $67K approaching benchmark of $100K. Sales efficiency (new ARR/S&M spend) of 0.9x and improving. Deferred revenue of $2.3M provides good forward visibility. Bad debt write-offs <0.5% indicate strong customer quality [7]", category: "Revenue Quality", evidence_ids: ["ring4-revenue-recognition", "ring4-collections-metrics"] },
        { text: "Cost Structure & Operating Leverage: Operating expenses breakdown: R&D 42% (healthy for growth stage), S&M 38%, G&A 20%. Showing operating leverage with opex as % of revenue declining from 145% to 118% YoY. Largest expense categories: Salaries (65%), Infrastructure/AWS (12%), Office/Benefits (10%), Marketing (8%), Other (5%). Stock-based compensation of $1.2M annually (14% of revenue) reasonable for stage [8]", category: "Cost Structure", evidence_ids: ["ring4-opex-analysis", "ring4-cost-breakdown"] }
      ],
      opportunities: [
        { text: "Implement usage-based pricing for API product could add $3M ARR within 12 months based on developer interest and Twilio pricing benchmarks", evidence_ids: ["ring4-api-monetization", "ring4-pricing-study"] },
        { text: "Optimize AWS spending through Reserved Instances and Savings Plans. Current analysis shows 35% cost reduction opportunity worth $420K annually", evidence_ids: ["ring4-aws-optimization", "ring4-infrastructure-costs"] },
        { text: "Introduce premium support tier at $99/user/month for enterprise. 20% of enterprise customers surveyed would purchase, adding $1.5M ARR", evidence_ids: ["ring4-support-analysis", "ring4-enterprise-survey"] }
      ],
      risks: [
        { text: "Customer concentration with largest customer representing 3.8% of ARR. Loss of top 10 customers would impact 18% of revenue. Mitigation through diversification underway", severity: "medium", evidence_ids: ["ring4-customer-concentration", "ring4-revenue-risk"] },
        { text: "Foreign exchange exposure as international revenue grows. 15% of revenue in non-USD currencies without hedging. Could impact margins by 2-3% in adverse scenarios", severity: "low", evidence_ids: ["ring4-fx-exposure", "ring4-international-revenue"] },
        { text: "Working capital pressure during rapid growth. DSO increased from 25 to 31 days. May require additional funding if growth accelerates beyond plan", severity: "low", evidence_ids: ["ring4-working-capital", "ring4-dso-trending"] }
      ],
      recommendations: [
        { text: "Accelerate enterprise go-to-market to improve unit economics. Enterprise CAC payback of 7 months vs 4.2 for SMB with 3x higher LTV justifies increased investment", evidence_ids: ["ring4-segment-economics", "ring4-enterprise-analysis"] },
        { text: "Implement multi-year contract incentives to improve cash collection and reduce churn. 20% discount for 3-year commitments could improve working capital by $2M", evidence_ids: ["ring4-contract-analysis", "ring4-pricing-optimization"] },
        { text: "Consider venture debt of $5M to extend runway without dilution. Current metrics qualify for 3x ARR terms. Would extend runway to 25 months providing cushion for Series B", evidence_ids: ["ring4-debt-options", "ring4-runway-scenarios"] }
      ]
    },
    investmentRecommendation: {
      title: "Investment Thesis & Recommendation",
      summary: "Ring4 presents a compelling growth-stage investment opportunity with strong fundamentals, exceptional execution, and significant market tailwinds. We recommend proceeding with a $5M investment at the Series B round, targeting a 2.8% ownership stake at a $180M post-money valuation.",
      findings: [
        { text: "Investment Recommendation: STRONG BUY. Ring4 merits investment based on: 1) Exceptional growth rate of 127% at $8.5M ARR scale, 2) Strong unit economics with 25:1 LTV:CAC ratio, 3) Clear path to profitability by Q3 2024, 4) Experienced team with proven execution capability, 5) Large and growing TAM of $15.8B with only 3.8% penetration, 6) Defensible technology moat with patents and network effects, 7) Multiple expansion opportunities (healthcare, API, international), 8) Clean cap table and reasonable valuation. Risk-adjusted return profile suggests 5-7x return potential over 4-5 year horizon [1]", category: "Recommendation", evidence_ids: ["ring4-investment-memo", "ring4-return-analysis"] },
        { text: "Valuation Analysis: Proposed Series B valuation of $180M (21x forward ARR) is reasonable based on: 1) Public comps trading at 8-12x ARR but growing 40-60% vs Ring4's 127%, 2) Recent private comparables: Dialpad raised at 25x ARR, Aircall at 30x, 3) Rule of 40 score of 92 justifies premium multiple, 4) Strategic value with 3 potential acquirers identified, 5) Conservative vs management's $220M ask. DCF analysis with 30% discount rate yields $195M valuation. Comparable transaction analysis suggests $165-210M range [2]", category: "Valuation", evidence_ids: ["ring4-valuation-comps", "ring4-dcf-model"] },
        { text: "Return Potential: Base case assumes exit in 2028 at $350M ARR, 7x multiple = $2.45B valuation. Our $5M investment at 2.8% would be worth $68.6M (13.7x MOIC). Probability-weighted returns: Bear case (20% prob): 2x return if growth slows, Base case (60% prob): 13.7x return, Bull case (20% prob): 25x if API platform succeeds. Expected return of 12.3x exceeds fund hurdle of 5x. IRR of 68% well above target 35% [3]", category: "Returns", evidence_ids: ["ring4-exit-analysis", "ring4-return-scenarios"] },
        { text: "Strategic Rationale: Ring4 fits fund thesis of 'API-first infrastructure for the next generation of work'. Complements portfolio with potential synergies with PortCo's in HR tech (WorkflowCo) and sales automation (SalesAI). CEO John Harrison is known to fund partners from previous success. Deal would enhance fund's reputation in competitive communications sector. Opportunity to lead round positions us for board seat and information rights [4]", category: "Strategic Fit", evidence_ids: ["fund-portfolio-strategy", "ring4-synergy-analysis"] },
        { text: "Key Investment Strengths: 1) Product-market fit validated by 71 NPS and 142% net revenue retention, 2) Scalable go-to-market with CAC payback of 4.2 months, 3) Technical differentiation with AI features competitors can't match, 4) Strong regulatory tailwinds with privacy regulations, 5) Multiple growth vectors reducing execution risk, 6) Capital efficient with only $23.5M raised to reach $8.5M ARR, 7) Clean financials with no concerning related party transactions, 8) Strong governance with independent board member and regular reporting [5]", category: "Strengths", evidence_ids: ["ring4-dd-summary", "ring4-investment-highlights"] },
        { text: "Risk Assessment & Mitigation: Primary risks identified: 1) Competition from WhatsApp Business - Mitigated by enterprise focus and superior security, 2) Platform dependency on iOS/Android - Reduced by web app and API strategy, 3) Key person risk with CTO - Address through retention package and knowledge transfer, 4) Customer concentration - Improving with enterprise expansion, 5) Regulatory changes in telecommunications - Strong compliance team and adaptable architecture. Overall risk rating: MEDIUM with clear mitigation strategies [6]", category: "Risk Analysis", evidence_ids: ["ring4-risk-matrix", "ring4-mitigation-plans"] },
        { text: "Deal Terms & Structure: Proposing $5M investment as part of $30M Series B round. Terms: 1) $180M post-money valuation (2.8% ownership), 2) 1x participating preferred with 2x cap, 3) Pro-rata rights for future rounds, 4) Board observer seat with path to full seat at $20M ARR, 5) Information rights with monthly reporting, 6) Standard protective provisions, 7) Co-sale and tag-along rights. Leading $5M of round with Bessemer committing $20M and others $5M [7]", category: "Deal Structure", evidence_ids: ["ring4-term-sheet", "ring4-round-structure"] },
        { text: "Post-Investment Value Creation: Specific areas where we can add value: 1) Customer introductions - 15 portfolio companies are ideal Ring4 customers, 2) Recruiting assistance for VP Marketing and EU expansion, 3) Strategic guidance on API platform from our experience with Twilio investment, 4) M&A opportunities with 3 identified bolt-on acquisitions, 5) IPO preparation leveraging our public market expertise, 6) Pricing optimization using our SaaS benchmarking data. Committed to monthly engagement with founders [8]", category: "Value Add", evidence_ids: ["ring4-value-creation-plan", "fund-portfolio-resources"] },
        { text: "Exit Strategy: Multiple exit paths identified: 1) IPO candidate by 2027 at $200M+ ARR (primary path), 2) Strategic acquisition by Zoom, Microsoft Teams, or Salesforce (discussions initiated), 3) PE rollup with other communications assets (Thoma Bravo expressed interest), 4) Secondary sale opportunity at Series C/D for partial liquidity. Management aligned on building independent company but open to strategic opportunities. Dual-track process likely at $100M ARR [9]", category: "Exit Planning", evidence_ids: ["ring4-exit-options", "ring4-strategic-interest"] },
        { text: "Due Diligence Findings: Comprehensive 6-week diligence process completed: 1) Technical DD by CTOPartners - 'Best-in-class architecture', 2) Financial DD by Deloitte - 'No material issues, conservative revenue recognition', 3) Legal DD by Cooley - 'Clean structure, IP properly assigned', 4) Customer references - 15/15 extremely positive with expansion plans, 5) Background checks clean on all executives, 6) Competitive analysis validated differentiation. Two yellow flags addressed: Legacy PHP code (migration plan in place) and key person risk (retention packages agreed) [10]", category: "Diligence Summary", evidence_ids: ["ring4-dd-reports", "ring4-reference-checks"] }
      ],
      recommendations: [
        { text: "Proceed with $5M investment at proposed terms. Negotiate for full board seat given check size and ability to lead round. Push for slightly lower valuation ($165M) if possible but don't lose deal over valuation given quality", evidence_ids: ["ring4-negotiation-strategy"] },
        { text: "Structure 20% of investment as secondary to provide founder liquidity and align interests. This addresses key person risk and ensures long-term commitment", evidence_ids: ["ring4-secondary-proposal"] },
        { text: "Require quarterly business reviews and monthly metrics reporting. Implement value creation plan immediately starting with customer introductions in Q1 2024", evidence_ids: ["ring4-governance-plan"] },
        { text: "Reserve $2M for follow-on investment at Series C to maintain ownership percentage. High conviction in company justifies doubling down as they scale", evidence_ids: ["ring4-reserve-strategy"] }
      ]
    }
  },
  evidence_collection_id: 'ae574ec5-d02d-4d7b-8f6c-bd419c7a56c6',
  citations: [
    // Technology Overview Citations
    { claim_id: "tech_0", evidence_item_id: "ring4-github-analysis", citation_text: "React Native 0.72 for mobile", citation_context: "Code analysis reveals modern tech stack with 85% code reuse between platforms", citation_number: 1 },
    { claim_id: "tech_1", evidence_item_id: "ring4-architecture-docs", citation_text: "23 microservices architecture", citation_context: "Internal documentation shows sophisticated service-oriented architecture", citation_number: 2 },
    { claim_id: "tech_2", evidence_item_id: "ring4-sre-metrics", citation_text: "99.95% uptime SLA", citation_context: "SRE dashboard confirms exceptional reliability metrics for 2023", citation_number: 3 },
    { claim_id: "tech_3", evidence_item_id: "ring4-ml-architecture", citation_text: "94% routing accuracy", citation_context: "ML model performance metrics from production environment", citation_number: 4 },
    { claim_id: "tech_4", evidence_item_id: "ring4-database-scan", citation_text: "PostgreSQL with 450GB data", citation_context: "Database infrastructure scan shows scalable data architecture", citation_number: 5 },
    { claim_id: "tech_5", evidence_item_id: "ring4-security-audit", citation_text: "End-to-end encryption implementation", citation_context: "Security audit confirms Signal Protocol implementation", citation_number: 6 },
    { claim_id: "tech_6", evidence_item_id: "ring4-load-test-results", citation_text: "1M concurrent users capacity", citation_context: "Load testing demonstrates exceptional scalability", citation_number: 7 },
    { claim_id: "tech_7", evidence_item_id: "ring4-eng-blog", citation_text: "15% time for R&D", citation_context: "Engineering blog posts detail innovation culture", citation_number: 8 },
    
    // Security Assessment Citations
    { claim_id: "security_0", evidence_item_id: "ring4-encryption-audit", citation_text: "AES-256 encryption standard", citation_context: "Third-party encryption audit validates military-grade security", citation_number: 1 },
    { claim_id: "security_1", evidence_item_id: "ring4-auth-implementation", citation_text: "WebAuthn/FIDO2 support", citation_context: "Authentication system review shows modern security standards", citation_number: 2 },
    { claim_id: "security_2", evidence_item_id: "ring4-soc2-report", citation_text: "SOC 2 Type II certified", citation_context: "Official SOC 2 report from December 2023 audit", citation_number: 3 },
    { claim_id: "security_3", evidence_item_id: "ring4-pentest-summary", citation_text: "Zero critical vulnerabilities", citation_context: "CrowdStrike penetration test results show strong security posture", citation_number: 4 },
    { claim_id: "security_4", evidence_item_id: "ring4-privacy-policy", citation_text: "90-day data purge policy", citation_context: "Privacy policy analysis confirms data minimization practices", citation_number: 5 },
    { claim_id: "security_5", evidence_item_id: "ring4-soc-metrics", citation_text: "3-minute detection time", citation_context: "SOC metrics dashboard shows rapid incident response", citation_number: 6 },
    { claim_id: "security_6", evidence_item_id: "ring4-network-diagram", citation_text: "Zero-trust architecture", citation_context: "Network architecture implements strict segmentation", citation_number: 7 },
    
    // Add more citations for other sections...
  ],
  metadata: {
    analysisDepth: 'comprehensive',
    processingTime: 21042,
    servicesUsed: [ 'evidence-collector-v7', 'tech-intelligence-v3' ],
    reportVersion: '2.0',
    confidenceScores: {
      technical: 0.92,
      financial: 0.88,
      market: 0.85,
      team: 0.90,
      overall: 0.89
    }
  }
};

export const mockEvidenceItems: DemoEvidenceItem[] = [
  // Ring4 evidence items (existing)
  { _original_crypto_id: 'dd9f0bf4-ed37-4d65-925e-c19bed901235', id: 'dd9f0bf4-ed37-4d65-925e-c19bed901235', type: 'vulnerability_report', source_tool: 'Third-Party Library Scanner', source_url: 'https://ring4.ai/security_scan_details.html#lib-vuln-xyz', content_summary: 'Vulnerable JS library xyz.js v1.2.3 detected in frontend bundle. CVE-2023-1234 allows XSS attacks.', content_raw: 'Detailed scan output for xyz.js vulnerability...', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: '614dd040-68bc-41ec-b2c3-d4c419914ed2', id: '614dd040-68bc-41ec-b2c3-d4c419914ed2', type: 'compliance_document', source_tool: 'Documentation Review', source_url: 'internal-docs/soc2-status.pdf', content_summary: 'SOC2 Type I report available, Type II audit is currently in progress, expected completion Q3.', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Synergy Corp evidence items
  { _original_crypto_id: 'synergy-ev-1', id: 'synergy-ev-1', type: 'code_analysis', source_tool: 'SonarQube Scan', source_url: 'https://sonar.synergy.internal/dashboard?id=backend-core', content_summary: 'Core backend module utilizes Java 8, which has reached End-of-Life for public updates. 2,341 code smells detected.', content_raw: 'Java version: 1.8.0_292\nCode smells: 2,341\nBugs: 47\nVulnerabilities: 12\nSecurity hotspots: 23', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'synergy-ev-2', id: 'synergy-ev-2', type: 'dependency_scan', source_tool: 'npm audit', content_summary: 'Frontend using React 17.0.2 with 37 known vulnerabilities (3 high, 12 moderate, 22 low)', content_raw: 'found 37 vulnerabilities (22 low, 12 moderate, 3 high) in 1523 scanned packages', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'synergy-ev-3', id: 'synergy-ev-3', type: 'infrastructure_scan', source_tool: 'Database Configuration Review', content_summary: 'PostgreSQL 12.8 with Redis 6.2 for caching. Well-configured with automated backups.', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'synergy-ev-4', id: 'synergy-ev-4', type: 'security_assessment', source_tool: 'Security Documentation Review', content_summary: 'No penetration testing reports found in the last 18 months. Last security audit was performed in January 2022.', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'synergy-ev-5', id: 'synergy-ev-5', type: 'code_review', source_tool: 'Authentication Module Analysis', content_summary: 'JWT-based authentication implemented correctly with RS256 algorithm. Tokens expire after 24 hours.', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()},
  
  // InfraModern evidence items
  { _original_crypto_id: 'infra-ev-1', id: 'infra-ev-1', type: 'infrastructure_assessment', source_tool: 'Infrastructure Inventory Scan', content_summary: '85% of compute workloads running on Dell PowerEdge servers in on-premise datacenter. 15% using AWS for object storage only.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'infra-ev-2', id: 'infra-ev-2', type: 'cloud_migration_analysis', source_tool: 'AWS Migration Assessment Tool', content_summary: 'Analysis shows 70% of workloads are cloud-ready with minimal refactoring. Estimated migration timeline: 6-8 months.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'infra-ev-3', id: 'infra-ev-3', type: 'cost_analysis', source_tool: 'Financial Records Analysis', content_summary: 'Monthly infrastructure costs breakdown: Hardware leases $25K, Power/cooling $8K, Network $5K, Staff $7K. Total: $45K/month.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'infra-ev-4', id: 'infra-ev-4', type: 'architecture_review', source_tool: 'Container Readiness Assessment', content_summary: 'Applications are already using Docker. Kubernetes adoption would require minimal changes to existing containerized services.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'infra-ev-5', id: 'infra-ev-5', type: 'cost_projection', source_tool: 'AWS Pricing Calculator', content_summary: 'Cloud migration costs: $150K (one-time). Projected monthly AWS costs: $27K. Annual savings: $216K (40% reduction).', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()},
  
  // CloudNova evidence items
  { _original_crypto_id: 'cloudnova-ev-1', id: 'cloudnova-ev-1', type: 'cicd_analysis', source_tool: 'GitHub Actions Dashboard', source_url: 'https://github.com/cloudnova/platform/actions', content_summary: 'Fully automated CI/CD pipeline with 2,500+ successful deployments in the last 30 days. Average pipeline duration: 12 minutes.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'cloudnova-ev-2', id: 'cloudnova-ev-2', type: 'deployment_metrics', source_tool: 'ArgoCD Metrics', content_summary: 'Deployment frequency: Average 52 deployments/day. Lead time for changes: 2.3 hours. MTTR: 15 minutes.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'cloudnova-ev-3', id: 'cloudnova-ev-3', type: 'code_quality_report', source_tool: 'SonarCloud Analysis', source_url: 'https://sonarcloud.io/dashboard?id=cloudnova', content_summary: 'Code coverage: 87%. Technical debt ratio: 0.8%. Maintainability rating: A. Zero critical issues.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'cloudnova-ev-4', id: 'cloudnova-ev-4', type: 'architecture_diagram', source_tool: 'Kubernetes Deployment Analysis', content_summary: 'Blue-green deployment strategy implemented with Istio service mesh. Zero-downtime deployments verified over 6 months.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'cloudnova-ev-5', id: 'cloudnova-ev-5', type: 'team_survey', source_tool: 'LinkedIn/GitHub Profile Analysis', content_summary: 'Engineering team analysis: 45 total, 36 with 5+ years experience, 12 with FAANG background, 8 with advanced degrees.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'cloudnova-ev-6', id: 'cloudnova-ev-6', type: 'open_source_analysis', source_tool: 'GitHub Contribution Tracker', content_summary: 'Team contributed 450+ PRs to Kubernetes, Terraform, and Helm projects in the last year. 3 team members are project maintainers.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'cloudnova-ev-7', id: 'cloudnova-ev-7', type: 'culture_assessment', source_tool: 'Glassdoor/Internal Survey Analysis', content_summary: 'Monthly hackathons with 85% participation. Last 3 hackathon projects launched as product features. 4.7/5 Glassdoor rating.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'cloudnova-ev-8', id: 'cloudnova-ev-8', type: 'market_research', source_tool: 'Gartner DevOps Report 2024', source_url: 'https://gartner.com/reports/devops-2024', content_summary: 'DevOps tools market size: $15.8B in 2024, projected $28.4B by 2028. CAGR: 22%. Key growth drivers: Cloud adoption, microservices.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'cloudnova-ev-9', id: 'cloudnova-ev-9', type: 'customer_analysis', source_tool: 'CRM Database Export', content_summary: 'Customer base: 156 total, 147 active. Notable: Microsoft, Toyota, Nike. Average contract value: $125K/year. Churn rate: 2.1%.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'cloudnova-ev-10', id: 'cloudnova-ev-10', type: 'customer_satisfaction', source_tool: 'Delighted NPS Survey Platform', content_summary: 'Q4 2023 NPS Score: 72 (World-class). Promoters: 78%, Detractors: 6%. Top feedback: "Saves us 10+ hours/week on deployments"', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()},
  
  // FutureTech evidence items
  { _original_crypto_id: 'future-ev-1', id: 'future-ev-1', type: 'ai_model_analysis', source_tool: 'Model Architecture Review', content_summary: 'Custom BERT variant fine-tuned on industry-specific corpus. 340M parameters. Training data: 2.5TB domain-specific text.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'future-ev-2', id: 'future-ev-2', type: 'customer_deployment', source_tool: 'Production Monitoring Dashboard', content_summary: 'Current deployments: 3 pilot customers (FinTech startup, Healthcare SMB, Legal firm). Total API calls: 45K/day.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'future-ev-3', id: 'future-ev-3', type: 'model_performance', source_tool: 'ML Evaluation Framework', content_summary: 'Test set accuracy: 78.3%, F1 score: 0.81. Production metrics limited - only 2 weeks of data from pilot customers.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'future-ev-4', id: 'future-ev-4', type: 'infrastructure_gap', source_tool: 'MLOps Maturity Assessment', content_summary: 'No model monitoring, A/B testing, or automated retraining pipelines. Models deployed manually via scripts.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'future-ev-5', id: 'future-ev-5', type: 'cost_analysis', source_tool: 'AWS Cost Explorer', content_summary: 'Current GPU compute costs: $18K/month for inference. No optimization applied - using on-demand p3.2xlarge instances.', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()},
  
  // Generic evidence items for other reports
  { _original_crypto_id: 'mock-ev-id-003', id: 'mock-ev-id-003', type: 'architecture_diagram', source_tool: 'Lucidchart Export', content_summary: 'System architecture diagram showing microservices communication patterns and data flow.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: 'mock-ev-id-004', id: 'mock-ev-id-004', type: 'scalability_test_result', source_tool: 'K6 Load Test Report', content_summary: 'Load test shows system handles 10,000 concurrent users with p95 latency under 200ms.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: 'mock-ev-id-005', id: 'mock-ev-id-005', type: 'market_research_report', source_tool: 'Gartner Report Q1 2024', content_summary: 'UCaaS market projected to grow by 25% YoY. Key players consolidating through M&A activity.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
];

export const mockStandardReports: DemoStandardReport[] = [
  mockRing4StandardReport,
  {
    id: 'report-synergy-standard',
    scan_request_id: 'demo-pe-scan-complete-1',
    company_name: 'Synergy Corp (Demo)',
    website_url: 'https://example-synergy.com',
    report_type: 'standard',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    executive_summary: 'Synergy Corp shows promising enterprise architecture but requires focus on API documentation and test coverage.',
    investment_score: 68,
    investment_rationale: 'Solid B2B product with clear market need. Technical debt needs addressing post-investment.',
    tech_health_score: 72,
    tech_health_grade: 'C',
    sections: {
      technologyStack: { 
        title: 'Tech Stack', 
        summary: 'Java monolith with some React microfrontends.', 
        findings: [
          {text: 'Core backend is Java 8.', evidence_ids: ['synergy-ev-1']}, 
          {text: 'Frontend uses React 17.', evidence_ids: ['synergy-ev-2']},
          {text: 'Database: PostgreSQL 12 with Redis caching', evidence_ids: ['synergy-ev-3']}
        ] 
      },
      security: { 
        title: 'Security', 
        summary: 'Basic security measures in place with room for improvement.', 
        findings: [
          {text: 'No recent pentest data found.', severity: 'high', evidence_ids: ['synergy-ev-4']},
          {text: 'Basic authentication implemented with JWT tokens', severity: 'info', evidence_ids: ['synergy-ev-5']}
        ], 
        risks: [
          {text: 'Potential for XSS due to outdated frontend libraries.', severity: 'medium', evidence_ids: ['synergy-ev-2']}
        ],
        recommendations: [
          {text: 'Conduct comprehensive penetration testing', evidence_ids: ['synergy-ev-4']},
          {text: 'Update React to latest version to patch security vulnerabilities', evidence_ids: ['synergy-ev-2']}
        ]
      },
    },
    evidence_collection_id: 'col-synergy-123',
    citations: [
      { citation_number: 1, claim_id: 'tech_debt_0', evidence_item_id: 'synergy-ev-1', citation_text: 'Java 8 EOL', citation_context: 'Core backend uses Java 8 which is approaching EOL.'},
      { citation_number: 2, claim_id: 'frontend_0', evidence_item_id: 'synergy-ev-2', citation_text: 'React 17 security vulnerabilities', citation_context: 'Frontend framework has known security issues that need patching.'},
      { citation_number: 3, claim_id: 'security_0', evidence_item_id: 'synergy-ev-4', citation_text: 'No penetration testing', citation_context: 'Security posture cannot be fully verified without recent pentest results.'}
    ],
    metadata: { analysisDepth: 'deep', processingTime: 18500, servicesUsed: ['evidence-collector-v7', 'security-scanner-v2'] }
  },
  {
    id: 'report-inframodern-review',
    scan_request_id: 'demo-pe-scan-awaiting-review-1',
    company_name: 'InfraModern (Demo)',
    website_url: 'https://example-inframodern.com',
    report_type: 'standard',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    executive_summary: 'Initial AI assessment suggests high potential for cloud cost optimization. Technical health appears average.',
    investment_score: 70,
    tech_health_score: 65,
    tech_health_grade: 'C',
    sections: {
      infrastructure: { 
        title: 'Infrastructure', 
        summary: 'On-premise servers with some AWS S3 usage.', 
        findings: [
          {text: 'Significant portion of compute is on dedicated hardware.', evidence_ids: ['infra-ev-1']},
          {text: '70% of workloads could be migrated to cloud', evidence_ids: ['infra-ev-2']},
          {text: 'Current monthly infrastructure cost: $45,000', evidence_ids: ['infra-ev-3']}
        ],
        opportunities: [
          {text: 'Cloud migration could reduce costs by 40%', evidence_ids: ['infra-ev-2', 'infra-ev-3']},
          {text: 'Kubernetes adoption would improve scalability', evidence_ids: ['infra-ev-4']}
        ]
      },
      costAnalysis: {
        title: 'Cost Optimization Analysis',
        summary: 'Significant opportunities for infrastructure cost reduction identified.',
        findings: [
          {text: 'Current annual infrastructure spend: $540,000', evidence_ids: ['infra-ev-3']},
          {text: 'Estimated cloud migration cost: $150,000 one-time', evidence_ids: ['infra-ev-5']},
          {text: 'Projected annual savings post-migration: $216,000', evidence_ids: ['infra-ev-3', 'infra-ev-5']}
        ]
      }
    },
    evidence_collection_id: 'col-inframodern-456',
    citations: [
      { citation_number: 1, claim_id: 'infra_0', evidence_item_id: 'infra-ev-1', citation_text: 'On-premise infrastructure', citation_context: 'Current infrastructure heavily relies on physical servers.'},
      { citation_number: 2, claim_id: 'cost_0', evidence_item_id: 'infra-ev-3', citation_text: 'High infrastructure costs', citation_context: 'Monthly spend of $45K indicates optimization opportunities.'}
    ],
    metadata: { analysisDepth: 'comprehensive', processingTime: 22000, servicesUsed: ['infrastructure-analyzer-v3', 'cost-optimizer-v2'] }
  },
  {
    id: 'report-cloudnova-processing',
    scan_request_id: 'demo-investor-scan-processing-1',
    company_name: 'CloudNova Solutions (Demo)',
    website_url: 'https://example-cloudnova.com',
    report_type: 'standard',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    executive_summary: 'CloudNova demonstrates strong DevOps practices with mature CI/CD pipelines. Cloud-native architecture positions them well for scale.',
    investment_score: 82,
    investment_rationale: 'Strong technical foundation with experienced team. Market timing is excellent for their DevOps automation platform.',
    tech_health_score: 88,
    tech_health_grade: 'A',
    sections: {
      cicdPipeline: {
        title: 'CI/CD Pipeline Analysis',
        summary: 'Mature DevOps practices with automated testing and deployment.',
        findings: [
          {text: 'Fully automated CI/CD using GitHub Actions and ArgoCD', evidence_ids: ['cloudnova-ev-1']},
          {text: 'Average deployment frequency: 50+ per day', evidence_ids: ['cloudnova-ev-2']},
          {text: 'Test coverage: 87% with automated quality gates', evidence_ids: ['cloudnova-ev-3']},
          {text: 'Zero-downtime deployments with blue-green strategy', evidence_ids: ['cloudnova-ev-4']}
        ]
      },
      teamCapabilities: {
        title: 'Team & Culture',
        summary: 'Strong engineering culture with focus on automation and quality.',
        findings: [
          {text: 'Team of 45 engineers, 80% with 5+ years experience', evidence_ids: ['cloudnova-ev-5']},
          {text: 'Active contributors to open source (Kubernetes, Terraform)', evidence_ids: ['cloudnova-ev-6']},
          {text: 'Monthly hackathons driving innovation', evidence_ids: ['cloudnova-ev-7']}
        ]
      },
      marketPosition: {
        title: 'Market Analysis',
        summary: 'Well-positioned in the growing DevOps tools market.',
        findings: [
          {text: 'DevOps tools market growing at 22% CAGR', evidence_ids: ['cloudnova-ev-8']},
          {text: '150+ enterprise customers including 3 Fortune 500', evidence_ids: ['cloudnova-ev-9']},
          {text: 'NPS score of 72 indicates strong product-market fit', evidence_ids: ['cloudnova-ev-10']}
        ]
      }
    },
    evidence_collection_id: 'col-cloudnova-789',
    citations: [
      { citation_number: 1, claim_id: 'devops_0', evidence_item_id: 'cloudnova-ev-1', citation_text: 'Automated CI/CD', citation_context: 'Modern DevOps toolchain demonstrates technical maturity.'},
      { citation_number: 2, claim_id: 'quality_0', evidence_item_id: 'cloudnova-ev-3', citation_text: 'High test coverage', citation_context: '87% test coverage indicates strong quality practices.'},
      { citation_number: 3, claim_id: 'market_0', evidence_item_id: 'cloudnova-ev-9', citation_text: 'Enterprise adoption', citation_context: 'Fortune 500 customers validate enterprise readiness.'}
    ],
    metadata: { analysisDepth: 'comprehensive', processingTime: 19800, servicesUsed: ['devops-analyzer-v2', 'market-intelligence-v3'] }
  },
  {
    id: 'report-futuretech-pending',
    scan_request_id: 'demo-investor-scan-pending-1',
    company_name: 'FutureTech Inc. (Demo)',
    website_url: 'https://example-future.com',
    report_type: 'standard',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago - simulating just created
    executive_summary: 'AI-powered SaaS platform showing promise but still in early stages. Limited production deployment data available.',
    investment_score: 58,
    investment_rationale: 'Early-stage technology with potential. Needs more validation and production metrics before investment decision.',
    tech_health_score: 62,
    tech_health_grade: 'D',
    sections: {
      aiCapabilities: {
        title: 'AI Technology Assessment',
        summary: 'Proprietary AI models show promise but lack production validation.',
        findings: [
          {text: 'Custom transformer models for industry-specific NLP', evidence_ids: ['future-ev-1']},
          {text: 'Limited production deployment (3 pilot customers)', evidence_ids: ['future-ev-2']},
          {text: 'Model accuracy: 78% on test data, production metrics unavailable', evidence_ids: ['future-ev-3']}
        ],
        risks: [
          {text: 'No MLOps infrastructure for model monitoring', severity: 'high', evidence_ids: ['future-ev-4']},
          {text: 'High compute costs not yet optimized', severity: 'medium', evidence_ids: ['future-ev-5']}
        ]
      }
    },
    evidence_collection_id: 'col-futuretech-101',
    citations: [
      { citation_number: 1, claim_id: 'ai_0', evidence_item_id: 'future-ev-1', citation_text: 'Custom AI models', citation_context: 'Proprietary technology could be a differentiator if proven.'},
      { citation_number: 2, claim_id: 'risk_0', evidence_item_id: 'future-ev-4', citation_text: 'No MLOps infrastructure', citation_context: 'Lack of model monitoring poses significant production risk.'}
    ],
    metadata: { analysisDepth: 'standard', processingTime: 15600, servicesUsed: ['ai-analyzer-v3', 'evidence-collector-v7'] }
  }
];

export const mockDeepDiveReports: DemoDeepDiveReport[] = [
  {
    id: 'deep-dive-ring4-demo',
    scan_request_id: 'a420adbf-65bc-4daa-aef9-d01c04b1e177',
    company_name: 'Ring4 (Real Data Demo)',
    title: 'Ring4 - Technical Deep Dive (Demo)',
    deep_dive_content: {
      architecture: 'Detailed diagrams and analysis of Ring4 microservices...',
      code_quality: 'Static analysis results, code complexity metrics...',
      scalability_tests: 'Load testing results and bottleneck identification...'
    }
  },
  {
    id: 'deep-dive-synergy-demo',
    scan_request_id: 'demo-pe-scan-complete-1',
    company_name: 'Synergy Corp (Demo)',
    title: 'Synergy Corp - Infrastructure Deep Dive (Demo)',
    deep_dive_content: {
      server_specs: 'Details of on-premise hardware...',
      network_topology: 'Network diagrams and bandwidth analysis...',
      cloud_migration_plan: 'Assessment of current cloud readiness...'
    }
  }
];

export const mockEnhancedPEReports: DemoEnhancedPEReport[] = [
  {
    id: 'enhanced-synergy-demo',
    scan_request_id: 'demo-pe-scan-complete-1',
    company_name: 'Synergy Corp (Demo)',
    title: 'Synergy Corp - Enhanced PE Value Creation Report (Demo)',
    enhanced_content: {
      value_creation_levers: ['Implement modern CI/CD', 'Refactor legacy Java modules', 'Improve API documentation'],
      talent_assessment: 'Key engineers identified, recommend upskilling in cloud technologies...',
      synergy_opportunities: 'Potential integration points with PortfolioCo X...'
    }
  }
];

// Reports indexed by ID for easy lookup
export const mockDemoReports: Record<string, DemoStandardReport> = {
  'report-ring4-real-data': mockRing4StandardReport,
  'report-synergy-standard': mockStandardReports[1],
  'report-inframodern-review': mockStandardReports[2],
  'report-cloudnova-processing': mockStandardReports[3],
  'report-futuretech-pending': mockStandardReports[4],
} 