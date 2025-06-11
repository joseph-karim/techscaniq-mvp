# Rich Query Decomposition Architecture

## Current Context We're Not Using

### 1. Investment Thesis Details
Each thesis has specific technical and business criteria:

**Data Infrastructure**
- Technical: Scalability, real-time processing, data governance
- Business: Enterprise adoption, pricing power, platform extensibility
- Market: TAM expansion, competitive moat, integration ecosystem

**Buy-and-Build**
- Technical: API quality, modularity, integration capabilities
- Business: M&A readiness, partner ecosystem, platform economics
- Market: Consolidation opportunities, network effects

### 2. Technical Evidence Tools Available
- **HTML Analysis**: UI/UX quality, feature detection, client-side tech
- **Network Requests**: API endpoints, third-party integrations, performance
- **HAR Files**: Load times, resource optimization, CDN usage
- **Security Headers**: Security posture, compliance indicators
- **JavaScript Analysis**: Framework detection, code quality signals
- **Performance Metrics**: Core Web Vitals, scalability indicators

### 3. Weighted Scoring Framework
We know which aspects matter most for each thesis:
- Critical (40% weight): Must-have capabilities
- High (30% weight): Strong differentiators
- Medium (20% weight): Nice-to-have features
- Low (10% weight): Additional context

## Rich Query Decomposition Example

### For Snowplow (Data Infrastructure Thesis)

```typescript
interface EnrichedResearchQuestion {
  id: string
  question: string
  category: string
  priority: string
  weight: number
  
  // New: Specific evidence types needed
  evidenceTypes: {
    technical: TechnicalEvidenceNeeded[]
    business: BusinessEvidenceNeeded[]
    external: ExternalValidationNeeded[]
  }
  
  // New: Automated checks we can run
  automatedChecks: {
    tool: string
    check: string
    expectedOutcome: string
    weight: number
  }[]
  
  // New: Confidence thresholds
  confidenceRequirements: {
    minimum: number      // Below this, it's a red flag
    target: number       // Our goal
    excellent: number    // Above this, it's a strong signal
  }
}
```

### Example Decomposed Questions

#### 1. Scalability & Performance (Critical - 40% weight)
```typescript
{
  question: "Can Snowplow handle enterprise-scale data volumes with low latency?",
  evidenceTypes: {
    technical: [
      { type: "performance_metrics", specific: ["throughput", "latency", "queue_depth"] },
      { type: "architecture_docs", specific: ["scaling_strategy", "sharding", "replication"] },
      { type: "network_analysis", specific: ["cdn_usage", "edge_locations", "api_response_times"] }
    ],
    business: [
      { type: "case_studies", specific: ["volume_metrics", "customer_scale"] },
      { type: "pricing_tiers", specific: ["volume_based_pricing", "enterprise_plans"] }
    ],
    external: [
      { type: "benchmarks", queries: ["Snowplow vs Segment performance", "Snowplow benchmarks"] },
      { type: "user_reviews", queries: ["Snowplow performance issues", "Snowplow scale"] }
    ]
  },
  automatedChecks: [
    {
      tool: "network_analyzer",
      check: "API response time under load",
      expectedOutcome: "< 100ms p95 latency",
      weight: 0.3
    },
    {
      tool: "har_analyzer", 
      check: "Resource optimization and caching",
      expectedOutcome: "Efficient caching headers, CDN usage",
      weight: 0.2
    }
  ],
  confidenceRequirements: {
    minimum: 0.6,   // Need some evidence of scale
    target: 0.8,    // Strong evidence of enterprise capability
    excellent: 0.9  // Proven at massive scale with metrics
  }
}
```

#### 2. Data Governance & Compliance (High - 30% weight)
```typescript
{
  question: "Does Snowplow provide enterprise-grade data governance and compliance features?",
  evidenceTypes: {
    technical: [
      { type: "security_headers", specific: ["CSP", "HSTS", "X-Frame-Options"] },
      { type: "documentation", specific: ["GDPR", "CCPA", "SOC2", "data_retention"] },
      { type: "api_analysis", specific: ["audit_endpoints", "permission_models"] }
    ],
    business: [
      { type: "certifications", specific: ["SOC2", "ISO27001", "HIPAA"] },
      { type: "enterprise_features", specific: ["SSO", "RBAC", "audit_logs"] }
    ],
    external: [
      { type: "compliance_databases", queries: ["Snowplow SOC2 certification"] },
      { type: "security_reports", queries: ["Snowplow security vulnerabilities"] }
    ]
  },
  automatedChecks: [
    {
      tool: "security_scanner",
      check: "Security headers and SSL configuration",
      expectedOutcome: "A+ rating on SSL Labs, all critical headers present",
      weight: 0.4
    },
    {
      tool: "api_scanner",
      check: "Authentication and authorization mechanisms",
      expectedOutcome: "OAuth2/SAML support, granular permissions",
      weight: 0.3
    }
  ]
}
```

#### 3. Developer Experience & Ecosystem (Medium - 20% weight)
```typescript
{
  question: "How strong is Snowplow's developer ecosystem and tooling?",
  evidenceTypes: {
    technical: [
      { type: "github_analysis", specific: ["stars", "contributors", "commit_frequency"] },
      { type: "api_docs", specific: ["completeness", "examples", "SDKs"] },
      { type: "javascript_analysis", specific: ["sdk_quality", "error_handling"] }
    ],
    business: [
      { type: "community_metrics", specific: ["forum_activity", "stackoverflow_tags"] },
      { type: "partner_ecosystem", specific: ["integrations", "marketplace"] }
    ],
    external: [
      { type: "developer_surveys", queries: ["Snowplow developer experience"] },
      { type: "github_activity", queries: ["Snowplow SDK issues pull requests"] }
    ]
  },
  automatedChecks: [
    {
      tool: "github_analyzer",
      check: "Repository health and community engagement",
      expectedOutcome: "> 1000 stars, > 50 contributors, active maintenance",
      weight: 0.5
    }
  ]
}
```

## Intelligent Query Generation

### Phase 1: Initial Technical Profiling
```typescript
async function generateInitialTechnicalProfile(company: string, domain: string) {
  // Run automated tools first to understand the technical landscape
  const technicalProfile = {
    // From security scanner
    securityPosture: await securityScanner.analyze(domain),
    
    // From performance analyzer
    performanceMetrics: await performanceAnalyzer.check(domain),
    
    // From API detector
    apiEndpoints: await apiDetector.discover(domain),
    
    // From tech stack analyzer
    technologies: await techStackAnalyzer.detect(domain),
    
    // From network analyzer
    thirdPartyIntegrations: await networkAnalyzer.findIntegrations(domain)
  }
  
  return technicalProfile
}
```

### Phase 2: Thesis-Aligned Question Generation
```typescript
function generateThesisAlignedQuestions(
  thesis: InvestmentThesis,
  technicalProfile: TechnicalProfile,
  company: string
) {
  // Use the technical profile to generate specific, measurable questions
  
  if (thesis === 'data_infrastructure') {
    if (technicalProfile.apiEndpoints.includes('/api/v2/collector')) {
      questions.push({
        question: "What is the maximum event ingestion rate for the /api/v2/collector endpoint?",
        automatedCheck: {
          tool: "load_tester",
          endpoint: "/api/v2/collector",
          metric: "events_per_second"
        }
      })
    }
    
    if (technicalProfile.technologies.includes('kafka')) {
      questions.push({
        question: "How is Kafka configured for high-throughput event processing?",
        searchQueries: [
          "site:snowplow.io kafka configuration",
          "Snowplow kafka performance tuning"
        ]
      })
    }
  }
  
  return questions
}
```

### Phase 3: Dynamic Evidence Collection Strategy
```typescript
interface EvidenceCollectionStrategy {
  // Order matters - start with automated, then targeted search
  phases: [
    {
      name: "automated_technical_scan",
      tools: ["security_scanner", "performance_analyzer", "api_detector"],
      duration: "2 minutes",
      output: "technical_profile"
    },
    {
      name: "targeted_documentation_search",
      method: "Use technical profile to search specific features",
      example: "If AWS found, search 'Snowplow AWS architecture'"
    },
    {
      name: "competitive_validation",
      method: "Search for comparisons with detected competitors",
      example: "If Segment integration found, search 'Snowplow vs Segment'"
    },
    {
      name: "gap_filling_iteration",
      method: "Focus on unanswered critical questions",
      example: "If no pricing found, try '/pricing', '/plans', '/enterprise'"
    }
  ]
}
```

## Practical Example: Snowplow Deep Analysis

### Initial Automated Scan Results
```json
{
  "security": {
    "grade": "A",
    "headers": ["HSTS", "CSP", "X-Frame-Options"],
    "ssl": "TLS 1.3",
    "vulnerabilities": []
  },
  "performance": {
    "ttfb": "89ms",
    "cdn": "Cloudflare",
    "caching": "aggressive"
  },
  "apis": [
    "/api/v2/collector",
    "/api/v2/enrichments", 
    "/api/management"
  ],
  "technologies": [
    "React", "TypeScript", "Kafka", "AWS Kinesis",
    "PostgreSQL", "Elasticsearch"
  ],
  "integrations": [
    "segment.com", "google-analytics.com", "mixpanel.com"
  ]
}
```

### Generated Rich Questions
1. **Performance**: "Given Kafka + Kinesis architecture, what's the event processing latency at 1M events/sec?"
2. **Compliance**: "With detected PostgreSQL, how is PII data encrypted at rest and in transit?"
3. **Integration**: "How does Snowplow position against detected competitors (Segment, Mixpanel)?"
4. **Scale**: "What's the largest deployment on AWS Kinesis (found in tech stack)?"

### Evidence Collection Instructions
```typescript
{
  critical_evidence: [
    {
      claim: "Handles 1M+ events/second",
      search: ["Snowplow Kinesis throughput", "site:snowplow.io billion events"],
      automated: ["Load test /api/v2/collector endpoint"],
      confidence_boost: "Finding specific metrics = +0.3 confidence"
    }
  ]
}
```

## Benefits of Rich Query Decomposition

1. **Specific, Measurable Questions**: Not "is it scalable?" but "can it handle 1M events/sec with <100ms latency?"

2. **Tool-Driven Evidence**: Use security scanners, performance analyzers, not just web scraping

3. **Thesis-Aligned Weighting**: Critical questions for data infrastructure might be medium for other theses

4. **Automated Validation**: Many claims can be verified programmatically

5. **Competitive Context**: Automatically compare against detected competitors

6. **Confidence Gradients**: Not binary answered/unanswered, but confidence levels with thresholds