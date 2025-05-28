import { Scan, Evidence, Citation, Risk, ThesisAlignment, TechHealthScore } from '@/types';

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
  company_name: 'Ring4 (Real Data Demo)',
  website_url: 'https://ring4.ai',
  report_type: 'standard',
  created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  executive_summary: "Ring4 presents a good investment opportunity due to its strong technology, growing market, and healthy financial performance.",
  investment_score: 75,
  investment_rationale: "Ring4 presents a good investment opportunity due to its strong technology, growing market, and healthy financial performance.",
  tech_health_score: 85, 
  tech_health_grade: 'B', 
  sections: {
    companyInfo: {
      title: "Company Information",
      summary: "Ring4 provides a second phone line solution for professionals and businesses, founded in 2015 and headquartered in San Francisco.",
      findings: [
        { text: "Name: Ring4" },
        { text: "Website: https://ring4.ai" },
        { text: "Founded: 2015" },
        { text: "Headquarters: San Francisco, CA" },
        { text: "Description: Ring4 provides a second phone line solution for professionals and businesses." },
        { text: "Mission: To provide secure and reliable communication solutions." },
        { text: "Vision: To be the leading provider of second phone line solutions." },
        { text: "Employee Count: 50-100" },
        { text: "Revenue: $5M-10M ARR" },
        { text: "Funding Total: $15M" },
        { text: "Last Valuation: $50M" }
      ]
    },
    technologyOverview: {
      title: "Technology Overview",
      summary: "Ring4 leverages a modern technology stack to deliver its communication solutions.",
      findings: [
        { text: "Primary Stack (Frontend): React - Modern stack for user interface", category: "Frontend" },
        { text: "Primary Stack (Backend): Node.js - Scalable backend", category: "Backend" },
        { text: "Architecture Highlights: Cloud-native microservices architecture" },
        { text: "Scalability Features: Auto-scaling infrastructure to handle peak loads" },
        { text: "Innovative Aspects: AI-powered features for call management and analytics" }
      ],
      opportunities: [],
      recommendations: []
    },
    securityAssessment: {
      title: "Security Assessment",
      summary: "Ring4 demonstrates a strong commitment to security, employing various measures to protect user data and communications. Overall Score: 85.",
      findings: [
        { text: "End-to-end encryption for secure calls and messages", category: "Strengths", severity: "info" },
        { text: "Compliance: SOC2 reported", category: "Compliance", severity: "info" }
      ],
      risks: [
        { text: "Potential vulnerability in third-party library", severity: "medium", evidence_ids: ["dd9f0bf4-ed37-4d65-925e-c19bed901235"] }
      ],
      recommendations: [
        { text: "Update library to the latest version" },
        { text: "Conduct regular penetration testing to identify and address potential vulnerabilities" }
      ]
    },
    teamAnalysis: {
      title: "Team Analysis",
      summary: "Ring4 is led by an experienced team with a strong background in telecommunications and technology. Leadership Score: 80.",
      findings: [
        { text: "Key Member: John Doe, CEO - Experienced in telecom", category: "Key Members" },
        { text: "Team Strengths: Strong technical expertise" },
        { text: "Team Gaps: Limited sales and marketing presence" },
        { text: "Culture Values: Innovation, Customer Focus" },
        { text: "WorkStyle: Remote-friendly" },
        { text: "Diversity: Diverse and inclusive" }
      ],
      risks: [],
      opportunities: []
    },
    marketAnalysis: {
      title: "Market Analysis",
      summary: "The market for second phone line solutions is growing, driven by the increasing need for privacy and flexibility in communication. Market Trends: Increasing adoption of cloud-based communication solutions, Growing demand for privacy features.",
      findings: [
        { text: "Market Size: $10B" },
        { text: "Growth Rate: 25%" },
        { text: "Target Market: SMBs and professionals" },
        { text: "Competitive Position: Growing player in a competitive market" },
        { text: "Differentiators: User-friendly interface and advanced features" },
        { text: "Competitor A: Market leader, Strong brand recognition, Higher price point" }
      ],
      opportunities: [
        { text: "Expansion into new markets" },
        { text: "Partnerships with other businesses" }
      ],
      risks: [
        { text: "Intense competition" },
        { text: "Evolving regulatory landscape" }
      ]
    },
    financialHealth: {
      title: "Financial Health",
      summary: "Ring4 demonstrates healthy financial performance with strong revenue growth and a reasonable burn rate. Financial Strengths: High revenue growth rate.",
      findings: [
        { text: "Revenue: $5M" },
        { text: "Growth Rate: 150%" },
        { text: "Burn Rate: $500K" },
        { text: "Runway: 18 months" },
        { text: "Funding History: 2023 - $10M, Series A, Investors: VC Firm X" },
        { text: "Key Metric (MRR): $400K, Trend: up" }
      ],
      risks: [
        { text: "Relatively high burn rate" }
      ],
      opportunities: []
    },
    investmentRecommendation: {
      title: "Investment Recommendation",
      summary: "Recommendation: Buy. Ring4 presents a good investment opportunity due to its strong technology, growing market, and healthy financial performance. Score: 75, Grade: B.",
      findings: [
        { text: "Key Strengths: Innovative technology and strong security measures" },
        { text: "Key Risks: Intense competition and relatively high burn rate" },
        { text: "Due Diligence Gaps: Need to conduct thorough customer reference checks" },
        { text: "Next Steps: Meet with the team and conduct further due diligence" }
      ]
    }
  },
  evidence_collection_id: 'ae574ec5-d02d-4d7b-8f6c-bd419c7a56c6',
  citations: [
    {
      claim_id: "security_0",
      evidence_item_id: "dd9f0bf4-ed37-4d65-925e-c19bed901235",
      citation_text: "End-to-end encryption",
      citation_context: "Ring4 maintains strong security practices with focus on communication privacy and data protection",
      citation_number: 1
    },
    {
      claim_id: "security_0",
      evidence_item_id: "614dd040-68bc-41ec-b2c3-d4c419914ed2",
      citation_text: "End-to-end encryption",
      citation_context: "Ring4 maintains strong security practices with focus on communication privacy and data protection",
      citation_number: 2
    },
    {
      claim_id: "security_1",
      evidence_item_id: "dd9f0bf4-ed37-4d65-925e-c19bed901235",
      citation_text: "Multi-factor authentication",
      citation_context: "Ring4 maintains strong security practices with focus on communication privacy and data protection",
      citation_number: 3
    },
    {
      claim_id: "security_1",
      evidence_item_id: "614dd040-68bc-41ec-b2c3-d4c419914ed2",
      citation_text: "Multi-factor authentication",
      citation_context: "Ring4 maintains strong security practices with focus on communication privacy and data protection",
      citation_number: 4
    },
    {
      claim_id: "security_2",
      evidence_item_id: "dd9f0bf4-ed37-4d65-925e-c19bed901235",
      citation_text: "Regular security audits",
      citation_context: "Ring4 maintains strong security practices with focus on communication privacy and data protection",
      citation_number: 5
    }
  ],
  metadata: {
    analysisDepth: 'comprehensive',
    processingTime: 21042, // from fad36a44... run
    servicesUsed: [ 'evidence-collector-v7', 'tech-intelligence-v3' ]
  }
};

export const mockEvidenceItems: DemoEvidenceItem[] = [
  { _original_crypto_id: 'dd9f0bf4-ed37-4d65-925e-c19bed901235', id: 'dd9f0bf4-ed37-4d65-925e-c19bed901235', type: 'vulnerability_report', source_tool: 'Third-Party Library Scanner', source_url: 'https://ring4.ai/security_scan_details.html#lib-vuln-xyz', content_summary: 'Vulnerable JS library xyz.js v1.2.3 detected.', content_raw: 'Detailed scan output for xyz.js vulnerability...', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: '614dd040-68bc-41ec-b2c3-d4c419914ed2', id: '614dd040-68bc-41ec-b2c3-d4c419914ed2', type: 'compliance_document', source_tool: 'Documentation Review', source_url: 'internal-docs/soc2-status.pdf', content_summary: 'SOC2 Type I report available, Type II audit is currently in progress, expected completion Q3.', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: 'synergy-ev-1', id: 'synergy-ev-1', type: 'code_analysis', source_tool: 'SonarQube Scan', content_summary: 'Core backend module utilizes Java 8, which has an End-of-Life (EOL) for public updates.', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()},
  { _original_crypto_id: 'mock-ev-id-003', id: 'mock-ev-id-003', type: 'architecture_diagram', source_tool: 'Lucidchart Export', content_summary: 'System architecture diagram showing microservices.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: 'mock-ev-id-004', id: 'mock-ev-id-004', type: 'scalability_test_result', source_tool: 'K6 Load Test Report', content_summary: 'Load test shows system handles 10,000 concurrent users.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { _original_crypto_id: 'mock-ev-id-005', id: 'mock-ev-id-005', type: 'market_research_report', source_tool: 'Gartner Report Q1 2024', content_summary: 'UCaaS market projected to grow by 25% YoY.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
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
      technologyStack: { title: 'Tech Stack', summary: 'Java monolith with some React microfrontends.', findings: [{text: 'Core backend is Java 8.'}, {text: 'Frontend uses React 17.'}] },
      security: { title: 'Security', summary: 'Basic security measures in place.', findings: [{text: 'No recent pentest data found.'}], risks: [{text: 'Potential for XSS due to outdated frontend libraries.', severity: 'medium'}] },
    },
    evidence_collection_id: 'col-synergy-123',
    citations: [
      { citation_number: 1, claim_id: 'tech_debt_0', evidence_item_id: 'synergy-ev-1', citation_text: 'Java 8 EOL', citation_context: 'Core backend uses Java 8 which is approaching EOL.'},
    ],
    metadata: { analysisDepth: 'deep' }
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
      infrastructure: { title: 'Infrastructure', summary: 'On-premise servers with some AWS S3 usage.', findings: [{text: 'Significant portion of compute is on dedicated hardware.'}] },
    },
    evidence_collection_id: 'col-inframodern-456',
    citations: [],
    metadata: { analysisDepth: 'comprehensive' }
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
  // Add more reports here as needed
} 