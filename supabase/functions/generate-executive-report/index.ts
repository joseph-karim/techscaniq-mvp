// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Comprehensive schema that merges standard scan report with executive assessment
const comprehensiveReportSchema = {
  type: "object",
  properties: {
    // Basic Information
    id: { type: "string" },
    companyName: { type: "string" },
    websiteUrl: { type: "string" },
    scanDate: { type: "string" },
    reportType: { type: "string", enum: ["standard", "executive", "deep-dive"] },
    
    // Investor Profile (for executive reports)
    investorProfile: {
      type: "object",
      properties: {
        firmName: { type: "string" },
        website: { type: "string" },
        overview: {
          type: "object",
          properties: {
            type: { type: "string" },
            headquarters: { type: "string" },
            yearFounded: { type: "string" },
            aum: { type: "string" },
            fundStage: { type: "string" }
          }
        },
        investmentThesis: {
          type: "object",
          properties: {
            targetCompanySize: { type: "string" },
            sectorFocus: { type: "array", items: { type: "string" } },
            revenueProfile: { type: "string" },
            holdingPeriod: { type: "string" },
            valueCreationStrategy: { type: "array", items: { type: "string" } },
            operatingPlaybook: { type: "array", items: { type: "string" } }
          }
        },
        technologyLens: {
          type: "object",
          properties: {
            digitalTransformationEmphasis: { type: "boolean" },
            preferences: { type: "array", items: { type: "string" } },
            priorCaseStudies: { type: "array", items: { type: "string" } }
          }
        }
      }
    },
    
    // Executive Summary
    executiveSummary: {
      type: "object",
      properties: {
        overallAssessment: { type: "string" },
        keyFindings: { type: "array", items: { type: "string" } },
        strategicRecommendations: { type: "array", items: { type: "string" } },
        techHealthScore: {
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 10 },
            grade: { type: "string", enum: ["A", "B", "C", "D", "F"] },
            confidence: { type: "number", minimum: 0, maximum: 100 }
          }
        },
        riskSummary: {
          type: "object",
          properties: {
            critical: { type: "number" },
            high: { type: "number" },
            medium: { type: "number" },
            low: { type: "number" }
          }
        }
      }
    },
    
    // Technology Overview
    technologyOverview: {
      type: "object",
      properties: {
        stackSummary: { type: "string" },
        primaryTechnologies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              technology: { type: "string" },
              version: { type: "string" },
              purpose: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              source: { type: "string" }
            }
          }
        },
        architecturePattern: { type: "string" },
        deploymentModel: { type: "string" },
        scalabilityAssessment: { type: "string" }
      }
    },
    
    // Stack Evolution (Temporal Intelligence)
    stackEvolution: {
      type: "array",
      items: {
        type: "object",
        properties: {
          year: { type: "string" },
          change: { type: "string" },
          signalType: { type: "string", enum: ["verified", "inferred", "partial"] },
          confidence: { type: "number", minimum: 0, maximum: 100 },
          source: { type: "string" }
        }
      }
    },
    
    // Technical Leadership & Team
    technicalLeadership: {
      type: "object",
      properties: {
        founders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              role: { type: "string" },
              background: { type: "string" },
              techStrength: { type: "string", enum: ["high", "medium", "low"] },
              linkedinProfile: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        },
        teamSize: { type: "number" },
        engineeringHeadcount: { type: "number" },
        keyHires: { type: "array", items: { type: "string" } },
        teamAssessment: { type: "string" }
      }
    },
    
    // Code Analysis
    codeAnalysis: {
      type: "object",
      properties: {
        overallQuality: { type: "number", minimum: 0, maximum: 100 },
        publicRepositories: { type: "number" },
        languageDistribution: {
          type: "array",
          items: {
            type: "object",
            properties: {
              language: { type: "string" },
              percentage: { type: "number" },
              linesOfCode: { type: "number" }
            }
          }
        },
        openSourceContributions: { type: "boolean" },
        codePatterns: { type: "array", items: { type: "string" } },
        estimatedTechnicalDebt: { type: "string" }
      }
    },
    
    // Infrastructure Analysis
    infrastructureAnalysis: {
      type: "object",
      properties: {
        hostingProvider: { type: "string" },
        cdnProvider: { type: "string" },
        deploymentRegions: { type: "array", items: { type: "string" } },
        certificatesAndCompliance: { type: "array", items: { type: "string" } },
        performanceMetrics: {
          type: "object",
          properties: {
            pageLoadTime: { type: "number" },
            uptime: { type: "number" },
            responseTime: { type: "number" }
          }
        },
        scalingCapabilities: { type: "string" }
      }
    },
    
    // Security Analysis
    securityAnalysis: {
      type: "object",
      properties: {
        overallSecurityScore: { type: "number", minimum: 0, maximum: 100 },
        sslCertificate: { type: "boolean" },
        securityHeaders: { type: "array", items: { type: "string" } },
        authenticationMethods: { type: "array", items: { type: "string" } },
        dataProtection: { type: "string" },
        vulnerabilities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
              description: { type: "string" },
              recommendation: { type: "string" }
            }
          }
        }
      }
    },
    
    // AI Capabilities
    aiCapabilities: {
      type: "object",
      properties: {
        hasAI: { type: "boolean" },
        aiFeatures: {
          type: "array",
          items: {
            type: "object",
            properties: {
              feature: { type: "string" },
              model: { type: "string" },
              purpose: { type: "string" },
              maturity: { type: "string", enum: ["experimental", "production", "advanced"] },
              confidence: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        },
        aiReadiness: { type: "number", minimum: 0, maximum: 100 },
        potentialAIApplications: { type: "array", items: { type: "string" } }
      }
    },
    
    // Third-party Integrations
    integrations: {
      type: "object",
      properties: {
        totalIntegrations: { type: "number" },
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              services: { type: "array", items: { type: "string" } },
              criticality: { type: "string", enum: ["critical", "important", "optional"] }
            }
          }
        },
        apiAvailability: { type: "boolean" },
        webhooksSupport: { type: "boolean" }
      }
    },
    
    // Competitive Analysis
    competitiveAnalysis: {
      type: "object",
      properties: {
        marketPosition: { type: "string" },
        competitors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company: { type: "string" },
              techStackSimilarity: { type: "number", minimum: 0, maximum: 100 },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } }
            }
          }
        },
        differentiators: { type: "array", items: { type: "string" } },
        marketTrends: { type: "array", items: { type: "string" } }
      }
    },
    
    // Financial Technology Indicators
    financialIndicators: {
      type: "object",
      properties: {
        estimatedTechSpend: { type: "string" },
        techSpendAsPercentage: { type: "string" },
        costOptimizationOpportunities: { type: "array", items: { type: "string" } },
        revenueEnablingTech: { type: "array", items: { type: "string" } }
      }
    },
    
    // Thesis Alignment (for investor reports)
    thesisAlignment: {
      type: "object",
      properties: {
        overallAlignment: { type: "number", minimum: 0, maximum: 100 },
        enablers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              criterion: { type: "string" },
              explanation: { type: "string" },
              evidence: { type: "array", items: { type: "string" } }
            }
          }
        },
        blockers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              criterion: { type: "string" },
              explanation: { type: "string" },
              evidence: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    },
    
    // Source Evidence Log
    sourceLog: {
      type: "array",
      items: {
        type: "object",
        properties: {
          insightArea: { type: "string" },
          insight: { type: "string" },
          source: { type: "string" },
          url: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 100 },
          timestamp: { type: "string" }
        }
      }
    },
    
    // Recommendations
    recommendations: {
      type: "object",
      properties: {
        immediate: { type: "array", items: { type: "string" } },
        shortTerm: { type: "array", items: { type: "string" } },
        longTerm: { type: "array", items: { type: "string" } },
        investmentDecision: { type: "string" }
      }
    }
  },
  required: [
    "id", 
    "companyName", 
    "websiteUrl", 
    "scanDate", 
    "reportType",
    "executiveSummary",
    "technologyOverview",
    "stackEvolution",
    "codeAnalysis",
    "infrastructureAnalysis",
    "securityAnalysis",
    "recommendations",
    "sourceLog"
  ]
}

const buildComprehensivePrompt = (investorProfile: any, targetCompany: any, contextDocs: string = "") => {
  // Build URL list for direct analysis
  const urlsToAnalyze = [
    targetCompany.website,
    investorProfile?.website,
    ...(investorProfile?.supplementalLinks ? Object.values(investorProfile.supplementalLinks).filter(Boolean) : [])
  ].filter(Boolean);

  // Few-shot example for technology detection
  const techDetectionExample = `
Example Technology Detection:
URL: https://example-saas.com
Finding: "React framework detected from _next/static/chunks/framework-*.js files"
Confidence: 95%
Source: "Direct page source analysis"
Technology: React/Next.js
Category: Frontend Framework
Version: "13.x" (inferred from bundle patterns)`;

  // Few-shot example for source evidence
  const sourceEvidenceExample = `
Example Source Evidence:
insightArea: "Technology Stack"
insight: "Company uses Kubernetes for container orchestration"
source: "Job posting analysis"
url: "https://careers.example.com/senior-devops-engineer"
confidence: 85
timestamp: "${new Date().toISOString()}"`;

  return `You are an expert technology due diligence analyst with deep expertise in software architecture, infrastructure analysis, and investment evaluation. Your task is to create a comprehensive technology assessment report using structured analysis and evidence-based insights.

## ANALYSIS INSTRUCTIONS

### Step 1: Direct Website Analysis
Use the url_context tool to analyze these URLs directly:
${urlsToAnalyze.map(url => `- ${url}`).join('\n')}

For each URL, extract:
1. Technology signals from page source (scripts, stylesheets, meta tags)
2. Infrastructure indicators (CDN headers, server signatures, SSL info)
3. Performance metrics (resource sizes, load patterns)
4. Security implementations (headers, authentication flows)
5. Team/culture signals (job postings, about pages, engineering blog)

${techDetectionExample}

### Step 2: Enhanced Research Using Google Search
Perform targeted searches to fill information gaps:

Primary searches:
- "${targetCompany.name} technology stack site:stackshare.com"
- "${targetCompany.name} github repository"
- "${targetCompany.name} engineering blog"
- "site:linkedin.com/in ${targetCompany.name} CTO OR VP Engineering"
- "${targetCompany.name} API documentation"
- "site:builtwith.com ${targetCompany.website.replace(/https?:\/\//, '')}"

Historical analysis:
- "site:web.archive.org/web/*/${targetCompany.website} technology"

Competitive intelligence:
- "${targetCompany.name} competitors technology comparison"
- "${targetCompany.name} vs [competitor] tech stack"

### Step 3: Structured Analysis Framework

#### Technology Stack Analysis Pattern:
Input: Raw technology signals from website and searches
Process: 
1. Identify each technology component
2. Determine its role in the architecture
3. Assess version/maturity
4. Evaluate implementation quality
Output: Structured technology entry with confidence score

#### Team Assessment Pattern:
Input: LinkedIn profiles, job postings, about pages
Process:
1. Identify key technical leadership
2. Analyze backgrounds and expertise
3. Assess team size and composition
4. Evaluate hiring velocity and focus areas
Output: Leadership profiles with tech strength ratings

#### Security Analysis Pattern:
Input: Headers, SSL config, authentication flows
Process:
1. Check security headers implementation
2. Analyze authentication methods
3. Review data protection measures
4. Identify potential vulnerabilities
Output: Security score with specific findings

## CONSTRAINTS AND REQUIREMENTS

1. **Evidence-Based Only**: Every claim must reference a specific source URL
2. **Confidence Scoring**: Rate each insight 0-100% based on:
   - Direct observation: 90-100%
   - Multiple corroborating sources: 70-90%
   - Single indirect source: 40-70%
   - Industry inference: 20-40%
3. **Completeness**: If data is unavailable, explicitly state it and provide industry context
4. **Specificity**: Include version numbers, specific technologies, not generic terms
5. **Temporal Awareness**: Note when findings are dated or may have changed

## SOURCE EVIDENCE FORMAT

Every significant finding must have a source log entry:
${sourceEvidenceExample}

## ANALYSIS CONTEXT

${investorProfile ? 
`### Investor Profile Analysis
Firm: ${investorProfile.firmName}
First, analyze ${investorProfile.website} to understand:
- Investment thesis and technology preferences
- Portfolio patterns and success cases
- Value creation playbooks
- Technology team and advisors

Then evaluate target company alignment with these criteria.` : 
`### Objective Technology Assessment
Provide unbiased technology evaluation suitable for any investor or strategic buyer.`}

### Target Company
Company: ${targetCompany.name}
Website: ${targetCompany.website}
Context: ${targetCompany.assessmentContext || 'General technology due diligence'}

${contextDocs ? `### Additional Context Documents
${contextDocs}` : ''}

## OUTPUT REQUIREMENTS

Generate a comprehensive JSON report following the exact schema provided. For each section:

1. **Executive Summary**: Start with overall assessment, then key findings ranked by importance
2. **Technology Overview**: List all detected technologies with evidence
3. **Stack Evolution**: Show technology changes over time using web archive and job posting analysis
4. **Technical Leadership**: Profile founders and key hires with LinkedIn data
5. **Code Analysis**: Use GitHub data if available, otherwise infer from job postings
6. **Infrastructure**: Detail hosting, CDN, regions from technical analysis
7. **Security**: Comprehensive security posture assessment
8. **AI Capabilities**: Identify any AI/ML implementations or potential
9. **Integrations**: Map all third-party services and APIs
10. **Competitive Analysis**: Position vs market leaders
11. **Financial Indicators**: Estimate tech spend based on stack and team size
12. **Source Log**: Complete evidence trail for all findings

Remember: The url_context and googleSearch tools will provide real data. Base all findings on actual retrieved content, not assumptions.

IMPORTANT: Return your complete analysis as a valid JSON object that matches the comprehensive report schema. Wrap the JSON in markdown code blocks like this:
\`\`\`json
{
  "companyName": "...",
  "websiteUrl": "...",
  // ... all other required fields
}
\`\`\``
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { investorProfile, targetCompany, contextDocs, apiKey } = await req.json()

    // Use provided API key or fall back to environment variable
    const geminiApiKey = apiKey || Deno.env.get('GOOGLE_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Google API key is required')
    }

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    
    // Use Gemini 2.5 Pro preview for enhanced capabilities
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro-preview-05-06",
      generationConfig: {
        temperature: 0.3,  // Lower temperature for more consistent, factual output
        topK: 20,          // Narrower selection for more focused responses
        topP: 0.85,        // Slightly lower for more deterministic output
        maxOutputTokens: 30000,
      },
      tools: [
        { googleSearch: {} },
        { codeExecution: {} },  // Enable code execution for analysis
        { url_context: {} }
      ]
    })

    const prompt = buildComprehensivePrompt(investorProfile, targetCompany, contextDocs)

    console.log('Generating comprehensive report for:', targetCompany.name)
    console.log('Report type:', investorProfile ? 'Executive' : 'Standard')

    // Generate the report
    const result = await model.generateContent(prompt)
    const response = await result.response
    const reportText = response.text()
    
    // Parse the JSON from the response text
    let reportData
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = reportText.match(/```json\n?([\s\S]*?)\n?```/) || reportText.match(/({[\s\S]*})/)
      const jsonString = jsonMatch ? jsonMatch[1] : reportText
      reportData = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError)
      // If parsing fails, create a basic structure with the raw response
      reportData = {
        companyName: targetCompany.name,
        websiteUrl: targetCompany.website,
        executiveSummary: {
          overallAssessment: "Report generation completed but JSON parsing failed. Raw response included below.",
          keyFindings: [reportText],
          strategicRecommendations: [],
          techHealthScore: { score: 0, grade: "N/A", confidence: 0 },
          riskSummary: { critical: 0, high: 0, medium: 0, low: 0 }
        },
        technologyOverview: { stackSummary: "See raw response", primaryTechnologies: [] },
        stackEvolution: [],
        codeAnalysis: { overallQuality: 0, publicRepositories: 0, languageDistribution: [] },
        infrastructureAnalysis: {},
        securityAnalysis: { overallSecurityScore: 0 },
        recommendations: { immediate: [], shortTerm: [], longTerm: [] },
        sourceLog: []
      }
    }

    // Add metadata
    const finalReport = {
      ...reportData,
      id: crypto.randomUUID(),
      scanDate: new Date().toISOString(),
      reportType: investorProfile ? 'executive' : 'standard',
      generatedAt: new Date().toISOString(),
      modelUsed: "gemini-2.5-pro-preview-05-06",
      context: targetCompany.assessmentContext || 'general'
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: finalReport,
        tokenUsage: {
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
          totalTokens: response.usageMetadata?.totalTokenCount
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error generating report:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-executive-report' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
