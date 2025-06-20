// Service for loading LangGraph-generated reports
import { API_BASE_URL } from '@/lib/api-client'

interface LangGraphReport {
  thesis: {
    id: string
    company: string
    website: string
    statement: string
    type: string
    pillars: Array<{
      id: string
      name: string
      weight: number
      description?: string
    }>
  }
  evidence: Array<{
    id: string
    researchQuestionId: string
    pillarId: string
    source: {
      type: string
      name: string
      url?: string
      credibilityScore: number
      publishDate?: string
      author?: string
    }
    content: string
    metadata?: {
      extractedAt?: string
      extractionMethod?: string
      wordCount?: number
      language?: string
      keywords?: string[]
      confidence?: number
    }
    qualityScore: {
      overall: number
      components?: {
        relevance: number
        credibility: number
        recency: number
        specificity: number
        bias: number
        depth?: number
      }
      reasoning?: string
    }
    createdAt?: string
  }>
  report: {
    executiveSummary?: string
    techHealthScore?: number
    techHealthGrade?: string
    investmentScore?: number
    recommendation?: {
      decision: string
      confidence: number
      keyDrivers: string[]
      risks: string[]
      nextSteps: string[]
      timeline?: string
    }
    technicalAssessment?: {
      architecture: { score: number; findings: string[] }
      scalability: { score: number; findings: string[] }
      security: { score: number; findings: string[] }
      teamCapability: { score: number; findings: string[] }
      codeQuality: { score: number; findings: string[] }
      infrastructure: { score: number; findings: string[] }
    }
    sections: Array<{
      title: string
      content: string
      confidence?: number
      citations?: string[]
      riskLevel?: 'low' | 'medium' | 'high' | 'critical'
    }>
    metadata?: {
      confidenceLevel?: string
      inferenceApproach?: string
      informationGatheringRecommendations?: string[]
    }
  }
  metadata?: {
    evidenceCount: number
    averageQualityScore: number
    reportGeneratedAt?: string
    vendorContext?: any
    thesisContext?: any
  }
}

// API implementation
export async function loadLangGraphReport(reportId: string): Promise<LangGraphReport | null> {
  // If no API_BASE_URL is configured, skip API call
  if (!API_BASE_URL) {
    throw new Error('API not configured - using fallback data')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/langgraph/${reportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      if (response.status === 202) {
        const data = await response.json()
        throw new Error(`Report is still being generated. Status: ${data.status}, Progress: ${data.progress}%`)
      }
      throw new Error(`Failed to load report: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading LangGraph report:', error)
    throw error
  }
}

// Generate a new LangGraph report
export async function generateLangGraphReport(params: {
  company: string
  website: string
  reportType: 'sales-intelligence' | 'pe-due-diligence'
  vendorContext?: {
    vendor: string
    products?: string[]
    useCase?: string
  }
  thesisContext?: {
    investmentThesis?: string
    keyQuestions?: string[]
    focusAreas?: string[]
  }
  metadata?: Record<string, any>
}): Promise<{ reportId: string; status: string; message: string; estimatedTime: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/langgraph/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error generating LangGraph report:', error)
    throw error
  }
}

// Check report generation status
export async function checkReportStatus(reportId: string): Promise<{
  reportId: string
  status: string
  progress: number
  currentPhase: string
  evidenceCount: number
  lastUpdated: string
  estimatedTimeRemaining: string
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/langgraph/${reportId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to check report status: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error checking report status:', error)
    throw error
  }
}

// List available reports
export async function listLangGraphReports(params?: {
  reportType?: 'sales-intelligence' | 'pe-due-diligence'
  status?: 'processing' | 'completed' | 'failed'
  limit?: number
  offset?: number
}): Promise<{ reports: any[]; total: number }> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.reportType) queryParams.append('reportType', params.reportType)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(`${API_BASE_URL}/api/langgraph/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to list reports: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error listing LangGraph reports:', error)
    throw error
  }
}

// Mock data fallback for demo - remove in production
const MOCK_CIBC_REPORT: LangGraphReport = {
      thesis: {
        id: "cibc-adobe-sales-2024",
        company: "CIBC",
        website: "https://www.cibc.com",
        statement: "Adobe can help CIBC accelerate their digital transformation with Adobe Experience Cloud",
        type: "sales-intelligence",
        pillars: [
          {
            id: "tech-architecture",
            name: "Technology Architecture & Integration",
            weight: 0.25,
            description: "CIBC technology stack and integration opportunities"
          },
          {
            id: "market-position",
            name: "Market Position & Strategy",
            weight: 0.25,
            description: "CIBC market position and strategic priorities"
          },
          {
            id: "financial-health",
            name: "Financial Health & Budget",
            weight: 0.2,
            description: "CIBC financial capacity for technology investments"
          },
          {
            id: "customer-experience",
            name: "Customer Experience Initiatives",
            weight: 0.2,
            description: "CIBC customer experience gaps and opportunities"
          },
          {
            id: "decision-makers",
            name: "Key Stakeholders & Decision Makers",
            weight: 0.1,
            description: "CIBC key stakeholders and decision-making process"
          }
        ]
      },
      evidence: [
        {
          id: "recovered_1_22",
          researchQuestionId: "general",
          pillarId: "tech-architecture",
          source: {
            type: "web",
            name: "Perplexity Deep Research - CIBC technology challenges",
            url: "https://perplexity.ai",
            credibilityScore: 0.9,
            publishDate: "2025-06-20T00:53:44.400Z",
            author: "Perplexity AI"
          },
          content: "CIBC is heavily investing in technology transformation, with a $4.5 billion annual budget allocated to innovation and new capabilities. The bank's current technology stack shows fragmentation across multiple platforms, creating data silos that prevent unified customer experiences. Key challenges include legacy system constraints, inconsistent data across channels, and the need for comprehensive experience management solutions to compete with digital-first competitors.",
          metadata: {
            extractedAt: "2025-06-20T00:53:44.400Z",
            extractionMethod: "perplexity_deep_research",
            wordCount: 31338,
            language: "en",
            keywords: ["CIBC", "technology", "challenges", "digital transformation", "legacy systems"],
            confidence: 85
          },
          qualityScore: {
            overall: 0.897,
            components: {
              relevance: 0.9,
              credibility: 0.9,
              recency: 1,
              specificity: 0.8,
              bias: 0.1,
              depth: 0.9
            },
            reasoning: "Deep research from Perplexity with multiple citations and comprehensive analysis"
          },
          createdAt: "2025-06-20T00:53:44.400Z"
        },
        {
          id: "recovered_0_17",
          researchQuestionId: "general",
          pillarId: "market-position",
          source: {
            type: "web",
            name: "Perplexity Deep Research - CIBC technology initiatives",
            url: "https://perplexity.ai",
            credibilityScore: 0.9,
            publishDate: "2025-06-20T00:53:44.400Z",
            author: "Perplexity AI"
          },
          content: "CIBC's 'Digital First' strategy and 'Ambition 2025' goals represent a multi-billion dollar commitment to digital transformation. The bank aims to achieve a 15-point NPS improvement and reach 75% digital transaction adoption. Competitive pressure from RBC and TD Bank, who have already implemented Adobe solutions with significant success (35% and 40% conversion improvements respectively), creates urgency for CIBC to modernize their customer experience technology stack.",
          metadata: {
            confidence: 90
          },
          qualityScore: {
            overall: 0.85
          }
        },
        {
          id: "recovered_2_45",
          researchQuestionId: "general",
          pillarId: "financial-health",
          source: {
            type: "web",
            name: "CIBC Investor Relations - Q2 2025 Report",
            url: "https://www.cibc.com/investor-relations",
            credibilityScore: 0.95,
            publishDate: "2025-05-01T00:00:00.000Z"
          },
          content: "CIBC reported strong financial performance with $3.5 billion allocated for technology transformation through 2026. Focus areas include AI/ML capabilities, cloud migration, and customer experience platforms. The bank's preference for operational expenses over capital expenditures aligns with SaaS deployment models.",
          metadata: {
            confidence: 95
          },
          qualityScore: {
            overall: 0.92
          }
        }
      ],
      report: {
        executiveSummary: `CIBC is undergoing a significant digital transformation journey, investing heavily in modernizing its technology infrastructure and enhancing customer experiences across digital channels. The bank has demonstrated strong commitment to innovation through multiple strategic initiatives, including cloud migration, AI/ML adoption, and comprehensive digital banking enhancements. However, our analysis reveals critical gaps in customer experience orchestration, personalization capabilities, and cross-channel journey optimization that present compelling opportunities for Adobe Experience Cloud solutions.

The bank's current technology ecosystem shows both strengths and vulnerabilities. While CIBC has made substantial progress in core banking modernization and mobile app development, achieving industry recognition for its digital offerings, the organization faces challenges in creating unified customer experiences across touchpoints, leveraging real-time data for personalization, and scaling content management across multiple brands and channels. These gaps directly align with Adobe's core competencies in experience management, analytics, and marketing automation.`,
        recommendation: {
          decision: "Strong Buy",
          confidence: 95,
          keyDrivers: [
            "CIBC's $4.5 billion annual investment in technology initiatives, focusing on digital transformation",
            "The bank's need for unified experience management across its 11+ million clients",
            "CIBC's fragmented marketing technology stack and legacy system challenges",
            "Adobe's proven success with competitor banks (RBC, TD) in the Canadian market",
            "Strong executive commitment to 'Digital First' strategy and 'Ambition 2025' goals"
          ],
          risks: [
            "Integration complexities with existing vendor relationships (Microsoft, IBM, Salesforce)",
            "Potential resistance to change due to legacy system constraints",
            "CIBC's digital adoption rate lagging behind peers, indicating possible internal challenges",
            "Competitive pressure from fintech disruptors requiring faster implementation"
          ],
          nextSteps: [
            "Engage with CIBC's Chief Digital Officer and technology leadership team",
            "Demonstrate Adobe's unified customer data platform capabilities with proof of concept",
            "Present ROI analysis based on RBC and TD Bank implementations",
            "Develop phased implementation roadmap starting with high-impact use cases",
            "Coordinate with Adobe's Canadian banking practice for local expertise"
          ],
          timeline: "Q1 2025 - Initial engagement and discovery phase"
        },
        sections: [
          {
            title: "Technology Architecture & Integration Analysis",
            content: `CIBC's technology landscape reveals a complex ecosystem characterized by both modernization initiatives and legacy constraints. The bank operates a multi-cloud strategy with significant investments in AWS for core banking transformation and Azure for specialized workloads. This distributed architecture creates data silos that prevent the bank from achieving a unified customer view - a critical gap that Adobe Experience Platform can address.

Our analysis identified fragmented customer data across multiple systems, limiting CIBC's ability to deliver personalized experiences at scale. The bank currently lacks a centralized customer data platform, resulting in inconsistent experiences across channels and missed opportunities for cross-sell and upsell. Adobe's Real-Time CDP would serve as the unifying layer, integrating data from all touchpoints while respecting the bank's existing technology investments.

The integration opportunity is particularly compelling given CIBC's existing Adobe footprint. The bank already uses Adobe Analytics for web analytics and Adobe Target in their insurance division, demonstrating both familiarity with Adobe solutions and proven success in implementation. This foundation significantly reduces adoption risk and accelerates time-to-value for expanded Adobe deployments.

Technical assessment reveals CIBC's API-first architecture and microservices adoption provide ideal integration points for Adobe Experience Platform. The bank's investment in Dynatrace for observability and Wiz for cloud security demonstrates commitment to enterprise-grade technology standards that align with Adobe's security and compliance frameworks.`,
            confidence: 85,
            citations: ["recovered_1_22", "recovered_0_17"]
          },
          {
            title: "Market Position & Strategic Alignment",
            content: `CIBC's "Digital First" strategy and "Ambition 2025" goals create perfect alignment with Adobe's value proposition. The bank has publicly committed to becoming a digitally-enabled, future-ready institution, with specific targets including a 15-point NPS improvement and 75% digital transaction adoption. These ambitious goals cannot be achieved with their current fragmented technology stack.

Competitive pressure adds urgency to CIBC's digital transformation. RBC and TD Bank have already implemented comprehensive Adobe solutions, achieving significant improvements in digital sales conversion (35% and 40% respectively). CIBC risks falling further behind without immediate action to modernize their customer experience technology. Market analysis shows CIBC's digital adoption metrics lag 20-30% behind these competitors, creating both a challenge and an opportunity.

The timing is optimal for Adobe engagement. CIBC has allocated $3.5 billion for technology transformation over the next three years, with explicit focus on AI/ML capabilities, cloud migration, and customer experience platforms. Adobe's solutions directly address each of these investment priorities, positioning us as a strategic partner rather than just another vendor.

Industry trends further support this opportunity. Canadian banking customers increasingly expect personalized, real-time experiences similar to those provided by tech giants. CIBC's current inability to deliver these experiences at scale creates customer churn risk and limits growth potential in key demographics, particularly millennials and Gen Z who represent the future of banking relationships.`,
            confidence: 90,
            citations: ["recovered_0_17", "recovered_2_45"]
          },
          {
            title: "Financial Capacity & Investment Readiness",
            content: `CIBC demonstrates strong financial capacity for significant technology investments. With $3.5 billion allocated for digital transformation through 2026, the bank has both the budget and executive commitment necessary for enterprise-wide Adobe adoption. Our financial analysis indicates Adobe solutions would represent less than 5% of their technology budget while delivering outsized impact on their strategic objectives.

The business case for Adobe investment is compelling. Based on peer bank implementations, CIBC can expect 25-40% improvement in digital conversion rates, 30% reduction in customer acquisition costs, and 15-20% increase in cross-sell success. These improvements translate to $60M+ in annual value creation, delivering ROI within 8 months of implementation.

Budget approval processes at CIBC favor solutions with proven ROI and peer validation. Adobe's extensive success with RBC and TD Bank provides the social proof necessary for executive buy-in. Additionally, CIBC's focus on recurring operational expenses over capital expenditures aligns perfectly with Adobe's SaaS model.

Financial modeling shows Adobe implementation would be cash-flow positive by month 6, with cumulative benefits exceeding $150M over three years. This includes both revenue enhancement through improved conversion and cross-sell, as well as operational savings through marketing efficiency and reduced time-to-market for campaigns.`,
            confidence: 80,
            citations: ["recovered_2_45"]
          },
          {
            title: "Customer Experience Gaps & Opportunities",
            content: `CIBC's customer experience capabilities lag significantly behind their stated ambitions. Despite recent investments in mobile app development and digital banking features, the bank struggles with fundamental experience management challenges that create friction and reduce customer satisfaction.

Key gaps include inability to maintain context across channels (customers must repeat information when moving from mobile to call center), lack of real-time personalization (generic offers and communications), slow campaign execution (3-week average time to market), and no unified view of customer journey analytics. Each of these gaps represents a specific Adobe solution opportunity.

Customer feedback analysis reveals frustration with disjointed experiences. NPS scores vary dramatically by channel, with digital lagging branch by 20+ points. This inconsistency damages brand perception and drives customers to competitors offering more seamless experiences. Adobe Journey Optimizer would enable CIBC to orchestrate consistent experiences across all touchpoints.

The opportunity extends beyond fixing problems to enabling new capabilities. With Adobe Experience Cloud, CIBC could implement predictive next-best-actions, real-time offer management, journey orchestration across all touchpoints, and AI-driven content optimization. These capabilities would transform CIBC from a traditional bank to a truly digital-first institution capable of competing with both traditional rivals and fintech disruptors.`,
            confidence: 85,
            citations: []
          },
          {
            title: "Stakeholder Analysis & Engagement Strategy",
            content: `Success with CIBC requires engaging multiple stakeholders across the organization. The Chief Digital Officer leads the transformation agenda and serves as our primary champion. The CMO owns customer experience metrics and budget for marketing technology. The CTO/CIO must approve all technology decisions and integration requirements.

Key influencers include the EVP of Retail Banking (owns P&L impact), Chief Data Officer (owns data strategy and governance), and Head of Innovation (champions new technologies). Each stakeholder has different priorities and success metrics that Adobe must address. The CDO focuses on transformation speed and digital adoption metrics. The CMO prioritizes customer acquisition cost and campaign ROI. The CTO emphasizes security, scalability, and integration simplicity.

Our engagement strategy should follow a phased approach: Start with proof of value in a controlled pilot (recommend expanding Adobe Target from insurance to retail banking), build coalition of champions through demonstrated quick wins, and expand to enterprise-wide transformation with executive sponsorship. This approach minimizes risk while building momentum for larger investments.

Political dynamics favor vendors who can demonstrate both innovation and stability. CIBC's risk-averse culture requires careful change management and clear communication of benefits. Adobe's established presence in Canadian banking and proven track record with peer institutions provides the credibility necessary to navigate these dynamics successfully.`,
            confidence: 75,
            citations: []
          },
          {
            title: "Implementation Roadmap & Success Planning",
            content: `CIBC's Adobe implementation should follow a carefully orchestrated three-phase approach designed to deliver quick wins while building toward transformational impact. Phase 1 (Months 1-6) focuses on foundation building with Real-Time CDP implementation to create unified customer profiles and Customer Journey Analytics for visibility into cross-channel behavior. Expected outcomes include 360-degree customer view and 20% improvement in targeting accuracy.

Phase 2 (Months 6-12) activates intelligence through Journey Optimizer for real-time orchestration and expanded Target deployment for AI-driven personalization. This phase delivers the majority of business value through improved conversion rates and customer satisfaction scores. We anticipate 30% conversion improvement and 25% reduction in customer churn based on peer benchmarks.

Phase 3 (Months 12-18) achieves enterprise transformation by implementing Workfront for marketing operations efficiency and Marketo Engage for B2B/wealth management sophistication. This phase establishes CIBC as a digital leader in Canadian banking. Success metrics include 40% improvement in digital conversion, 50% reduction in time-to-market, 15-point NPS improvement, and 30% increase in marketing efficiency.

Critical success factors include dedicated program management office, executive steering committee with bi-weekly reviews, change management program for 500+ marketing and digital team members, and technical center of excellence for ongoing optimization. Regular business reviews ensure alignment with CIBC's evolving needs and maximize value realization. Adobe's commitment includes dedicated customer success team, quarterly executive business reviews, and access to banking industry best practices.`,
            confidence: 85,
            citations: []
          }
        ],
        metadata: {
          confidenceLevel: "high",
          inferenceApproach: "Direct evidence-based analysis with strong supporting data from comprehensive deep research",
          informationGatheringRecommendations: [
            "Obtain CIBC's detailed technology roadmap and current vendor contracts to identify integration dependencies",
            "Interview key stakeholders to understand internal politics and decision-making criteria",
            "Analyze competitive implementations at RBC and TD Bank for detailed benchmarking data",
            "Request CIBC's current marketing technology spend and ROI metrics for baseline comparison",
            "Gather information on CIBC's data governance policies and compliance requirements",
            "Understand CIBC's change management capabilities and previous transformation successes/failures"
          ]
        }
      },
      metadata: {
        evidenceCount: 2544,
        averageQualityScore: 0.81,
        reportGeneratedAt: "2025-06-20T00:56:06.992Z"
      }
    }

// Fallback to mock data in development/demo
export async function loadLangGraphReportWithFallback(reportId: string): Promise<LangGraphReport | null> {
  try {
    // Try API first
    return await loadLangGraphReport(reportId)
  } catch (error) {
    console.warn('API call failed, falling back to mock data:', error)
    // Fallback to mock data
    if (reportId === 'cibc-adobe-sales-2024') {
      return MOCK_CIBC_REPORT
    }
    return null
  }
}