import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ScanReportNavigation, scanReportSections } from '@/components/reports/ScanReportNavigation'
import { Breadcrumbs } from '@/components/pe/deep-dive-report/Breadcrumbs'
import { InlineCitation, Citation } from '@/components/reports/EvidenceCitation'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { EnhancedEvidenceAppendix } from '@/components/reports/EnhancedEvidenceAppendix'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Home, FileText, Search, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, Shield } from 'lucide-react'

// Comprehensive citations covering all sections and facts
const mockCitations: Citation[] = [
  {
    id: 'c1',
    claim: 'The application uses React 18.2.0 with TypeScript for the frontend implementation',
    evidence: [
      {
        id: 'e1',
        type: 'code',
        title: 'package.json dependencies',
        source: 'frontend/package.json',
        url: 'https://github.com/company/repo/blob/main/frontend/package.json',
        excerpt: '"react": "^18.2.0",\n"typescript": "^4.9.5",\n"@types/react": "^18.0.28"',
        metadata: {
          fileType: 'JSON',
          lineNumbers: '12-14',
          lastModified: '2025-01-10',
          author: 'john.doe@company.com',
          confidence: 95
        }
      },
      {
        id: 'e2',
        type: 'code',
        title: 'TypeScript configuration',
        source: 'frontend/tsconfig.json',
        excerpt: '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "lib": ["DOM", "DOM.Iterable", "ES6"],\n    "allowJs": true,\n    "skipLibCheck": true\n  }\n}',
        metadata: {
          fileType: 'JSON',
          lineNumbers: '1-8',
          lastModified: '2025-01-08',
          confidence: 90
        }
      }
    ],
    reasoning: 'Analysis of the package.json file shows explicit React 18.2.0 dependency declaration. The presence of TypeScript configuration files and @types/react dependency confirms TypeScript integration. The tsconfig.json shows modern ES2020 target compilation, indicating a contemporary React setup.',
    confidence: 93,
    analyst: 'Sarah Chen, Frontend Specialist',
    reviewDate: '2025-01-15',
    methodology: 'Static code analysis of dependency files and configuration'
  },
  {
    id: 'c2',
    claim: 'The backend implements a microservices architecture with Node.js and Express',
    evidence: [
      {
        id: 'e3',
        type: 'code',
        title: 'User service implementation',
        source: 'services/user-service/src/app.js',
        excerpt: 'const express = require("express");\nconst app = express();\n\napp.use("/api/users", userRoutes);\napp.use("/api/auth", authRoutes);',
        metadata: {
          fileType: 'JavaScript',
          lineNumbers: '1-5',
          lastModified: '2025-01-12',
          confidence: 88
        }
      },
      {
        id: 'e4',
        type: 'document',
        title: 'Architecture documentation',
        source: 'docs/architecture.md',
        excerpt: '## Microservices Architecture\n\nOur system is composed of the following services:\n- User Service (Port 3001)\n- Payment Service (Port 3002)\n- Notification Service (Port 3003)',
        metadata: {
          fileType: 'Markdown',
          lastModified: '2025-01-05',
          confidence: 85
        }
      },
      {
        id: 'e5',
        type: 'api',
        title: 'Service discovery response',
        source: 'Consul API /v1/catalog/services',
        excerpt: '{\n  "user-service": [],\n  "payment-service": [],\n  "notification-service": [],\n  "api-gateway": []\n}',
        metadata: {
          confidence: 92
        }
      }
    ],
    reasoning: 'Multiple evidence sources confirm microservices architecture: (1) Separate service directories with independent Express.js applications, (2) Official architecture documentation describing service separation, (3) Service discovery registry showing multiple registered services. The consistent port allocation and service naming convention indicates deliberate microservices design.',
    confidence: 88,
    analyst: 'Michael Rodriguez, Backend Architect',
    reviewDate: '2025-01-14',
    methodology: 'Code structure analysis, documentation review, and runtime service discovery inspection'
  },
  {
    id: 'c3',
    claim: 'Code quality metrics show 78% test coverage with consistent ESLint configuration',
    evidence: [
      {
        id: 'e6',
        type: 'code',
        title: 'Jest coverage report',
        source: 'coverage/lcov-report/index.html',
        excerpt: 'Lines: 78.2% (1,247 of 1,594)\nFunctions: 82.1% (234 of 285)\nBranches: 71.3% (156 of 219)',
        metadata: {
          fileType: 'HTML',
          lastModified: '2025-01-14',
          confidence: 95
        }
      },
      {
        id: 'e7',
        type: 'code',
        title: 'ESLint configuration',
        source: '.eslintrc.js',
        excerpt: 'module.exports = {\n  extends: ["@typescript-eslint/recommended"],\n  rules: {\n    "@typescript-eslint/no-unused-vars": "error",\n    "prefer-const": "error"\n  }\n}',
        metadata: {
          fileType: 'JavaScript',
          confidence: 90
        }
      }
    ],
    reasoning: 'Coverage reports generated by Jest show comprehensive test coverage above industry standards. ESLint configuration enforces TypeScript best practices and code consistency across the codebase.',
    confidence: 91,
    analyst: 'Alex Thompson, QA Engineer',
    reviewDate: '2025-01-13',
    methodology: 'Automated testing tool analysis and configuration review'
  },
  {
    id: 'c4',
    claim: 'Security vulnerabilities identified in dependencies with medium to high severity',
    evidence: [
      {
        id: 'e8',
        type: 'analysis',
        title: 'npm audit results',
        source: 'npm audit --json',
        excerpt: '{\n  "vulnerabilities": {\n    "high": 2,\n    "moderate": 5,\n    "low": 12\n  },\n  "metadata": {\n    "totalDependencies": 847\n  }\n}',
        metadata: {
          confidence: 94
        }
      },
      {
        id: 'e9',
        type: 'analysis',
        title: 'Snyk security scan',
        source: 'snyk test --json',
        excerpt: 'Found 7 vulnerabilities:\n- 2 high severity\n- 3 medium severity\n- 2 low severity',
        metadata: {
          confidence: 92
        }
      }
    ],
    reasoning: 'Multiple security scanning tools (npm audit, Snyk) consistently identify dependency vulnerabilities. The presence of high-severity issues requires immediate attention, while moderate issues should be addressed in the next development cycle.',
    confidence: 93,
    analyst: 'Marcus Johnson, Security Analyst',
    reviewDate: '2025-01-12',
    methodology: 'Automated vulnerability scanning and dependency analysis'
  },
  {
    id: 'c5',
    claim: 'Application deployed on AWS with Kubernetes orchestration and CloudFront CDN',
    evidence: [
      {
        id: 'e10',
        type: 'code',
        title: 'Kubernetes deployment configuration',
        source: 'k8s/deployment.yaml',
        excerpt: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: app-deployment\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: main-app',
        metadata: {
          fileType: 'YAML',
          confidence: 95
        }
      },
      {
        id: 'e11',
        type: 'document',
        title: 'Infrastructure documentation',
        source: 'docs/infrastructure.md',
        excerpt: '# Infrastructure Overview\n\n## AWS Services Used\n- EKS for Kubernetes\n- CloudFront for CDN\n- ALB for load balancing\n- RDS for PostgreSQL',
        metadata: {
          fileType: 'Markdown',
          confidence: 88
        }
      }
    ],
    reasoning: 'Kubernetes deployment files show container orchestration setup. Infrastructure documentation confirms AWS as primary cloud provider with specific services identified.',
    confidence: 91,
    analyst: 'David Park, DevOps Engineer',
    reviewDate: '2025-01-13',
    methodology: 'Infrastructure configuration analysis and documentation review'
  },
  {
    id: 'c6',
    claim: 'Performance metrics show 1.8s Largest Contentful Paint and 245ms average API response time',
    evidence: [
      {
        id: 'e12',
        type: 'analysis',
        title: 'Lighthouse performance report',
        source: 'lighthouse-report.json',
        excerpt: '{\n  "lcp": 1.8,\n  "fid": 45,\n  "cls": 0.08,\n  "performance-score": 85\n}',
        metadata: {
          confidence: 94
        }
      },
      {
        id: 'e13',
        type: 'analysis',
        title: 'API monitoring dashboard',
        source: 'DataDog API metrics',
        excerpt: 'Average Response Time: 245ms\n95th Percentile: 580ms\nError Rate: 0.12%\nThroughput: 1,250 req/min',
        metadata: {
          confidence: 96
        }
      }
    ],
    reasoning: 'Lighthouse automated testing provides Core Web Vitals measurements. API monitoring dashboard shows consistent performance metrics over 30-day period.',
    confidence: 95,
    analyst: 'Lisa Park, Performance Engineer',
    reviewDate: '2025-01-11',
    methodology: 'Automated performance testing and continuous monitoring analysis'
  },
  {
    id: 'c7',
    claim: 'SQL injection vulnerability identified in search endpoint requiring immediate remediation',
    evidence: [
      {
        id: 'e14',
        type: 'code',
        title: 'Vulnerable search endpoint',
        source: 'api/routes/search.js',
        excerpt: 'app.get("/search", (req, res) => {\n  const query = req.query.q;\n  const sql = `SELECT * FROM products WHERE name LIKE \'%${query}%\'`;\n  db.query(sql, callback);\n});',
        metadata: {
          fileType: 'JavaScript',
          lineNumbers: '15-19',
          confidence: 98
        }
      },
      {
        id: 'e15',
        type: 'analysis',
        title: 'OWASP ZAP security scan',
        source: 'zap-report.xml',
        excerpt: '<alertitem>\n  <risk>High</risk>\n  <name>SQL Injection</name>\n  <url>/api/search?q=test</url>\n  <description>SQL injection vulnerability detected</description>\n</alertitem>',
        metadata: {
          confidence: 97
        }
      }
    ],
    reasoning: 'Code review reveals direct string concatenation in SQL query construction without parameterization. OWASP ZAP automated security testing confirms exploitable SQL injection vulnerability.',
    confidence: 98,
    analyst: 'Marcus Johnson, Security Analyst',
    reviewDate: '2025-01-12',
    methodology: 'Manual code review and automated security testing'
  },
  {
    id: 'c8',
    claim: 'GDPR compliance at 75% with missing data portability implementation',
    evidence: [
      {
        id: 'e16',
        type: 'document',
        title: 'Privacy policy analysis',
        source: 'legal/privacy-policy.md',
        excerpt: '## Data Processing\nWe collect and process personal data with explicit consent.\n\n## Right to be Forgotten\nUsers can request data deletion via support ticket.',
        metadata: {
          fileType: 'Markdown',
          confidence: 85
        }
      },
      {
        id: 'e17',
        type: 'code',
        title: 'Data export endpoint missing',
        source: 'api/routes/user.js',
        excerpt: '// TODO: Implement data export functionality\n// Required for GDPR Article 20 - Right to data portability',
        metadata: {
          fileType: 'JavaScript',
          lineNumbers: '45-46',
          confidence: 92
        }
      }
    ],
    reasoning: 'Privacy policy demonstrates consent mechanisms and deletion procedures. Code analysis reveals missing data export functionality required for GDPR Article 20 compliance.',
    confidence: 88,
    analyst: 'Jennifer Walsh, Compliance Officer',
    reviewDate: '2025-01-10',
    methodology: 'Legal document analysis and code audit for compliance requirements'
  },
  {
    id: 'c9',
    claim: 'Technical debt estimated at 12.5 days with 23 code smells identified',
    evidence: [
      {
        id: 'e18',
        type: 'analysis',
        title: 'SonarQube analysis report',
        source: 'sonarqube-report.json',
        excerpt: '{\n  "technical_debt": "12d 4h",\n  "code_smells": 23,\n  "duplicated_lines_density": 3.2,\n  "maintainability_rating": "B"\n}',
        metadata: {
          confidence: 94
        }
      },
      {
        id: 'e19',
        type: 'analysis',
        title: 'Code complexity analysis',
        source: 'complexity-report.json',
        excerpt: 'High complexity functions:\n- calculateUserMetrics() - Complexity: 15\n- processPayment() - Complexity: 12\n- validateUserInput() - Complexity: 11',
        metadata: {
          confidence: 91
        }
      }
    ],
    reasoning: 'SonarQube static analysis provides technical debt calculations based on code complexity and maintainability issues. Complexity analysis identifies specific functions requiring refactoring.',
    confidence: 92,
    analyst: 'Alex Thompson, QA Engineer',
    reviewDate: '2025-01-13',
    methodology: 'Static code analysis and complexity measurement tools'
  },
  {
    id: 'c10',
    claim: 'Database queries show 3 slow queries exceeding 500ms response time',
    evidence: [
      {
        id: 'e20',
        type: 'analysis',
        title: 'Database performance monitoring',
        source: 'pg_stat_statements',
        excerpt: 'SELECT query, mean_time FROM pg_stat_statements WHERE mean_time > 500;\n\nquery: SELECT * FROM users u JOIN orders o...\nmean_time: 847ms\n\nquery: SELECT COUNT(*) FROM analytics...\nmean_time: 623ms',
        metadata: {
          confidence: 96
        }
      },
      {
        id: 'e21',
        type: 'analysis',
        title: 'APM slow query alerts',
        source: 'New Relic APM',
        excerpt: 'Slow Query Alert: getUserAnalytics - Avg: 847ms\nSlow Query Alert: generateReport - Avg: 623ms\nSlow Query Alert: searchProducts - Avg: 534ms',
        metadata: {
          confidence: 94
        }
      }
    ],
    reasoning: 'PostgreSQL statistics show queries with mean execution times exceeding 500ms threshold. APM monitoring confirms consistent slow performance across multiple database operations.',
    confidence: 95,
    analyst: 'Lisa Park, Performance Engineer',
    reviewDate: '2025-01-11',
    methodology: 'Database performance monitoring and APM analysis'
  }
]

// Expanded analyst reviews
const analystReviews = [
  {
    section: 'executive-summary',
    reviewer: 'David Kim, Lead Analyst',
    reviewDate: '2025-01-15',
    confidence: 92,
    notes: 'Comprehensive scan completed using automated tools and manual verification. High confidence in technology stack identification and architecture assessment.'
  },
  {
    section: 'technology-overview',
    reviewer: 'Sarah Chen, Frontend Specialist',
    reviewDate: '2025-01-14',
    confidence: 89,
    notes: 'Frontend technology analysis based on package.json, build configurations, and source code patterns. Modern React/TypeScript stack confirmed.'
  },
  {
    section: 'code-analysis',
    reviewer: 'Alex Thompson, QA Engineer',
    reviewDate: '2025-01-13',
    confidence: 85,
    notes: 'Code quality assessment using SonarQube, ESLint reports, and manual review of critical components. Technical debt analysis based on cyclomatic complexity metrics.'
  },
  {
    section: 'security-analysis',
    reviewer: 'Marcus Johnson, Security Analyst',
    reviewDate: '2025-01-12',
    confidence: 88,
    notes: 'Security analysis using OWASP ZAP, Snyk, and manual penetration testing. Identified several dependency vulnerabilities requiring attention.'
  },
  {
    section: 'performance-analysis',
    reviewer: 'Lisa Park, Performance Engineer',
    reviewDate: '2025-01-11',
    confidence: 87,
    notes: 'Performance testing using Lighthouse, WebPageTest, and load testing tools. Application shows good performance with room for optimization.'
  }
]

export default function ScanReportPaginated() {
  const { id } = useParams()
  const [currentSection, setCurrentSection] = useState('executive-summary')
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const currentSectionData = scanReportSections.find(section => section.id === currentSection)
  
  const breadcrumbItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-4 w-4" />
    },
    {
      label: 'Scan Reports',
      href: '/reports',
      icon: <Search className="h-4 w-4" />
    },
    {
      label: `Scan Report #${id}`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: currentSectionData?.title || 'Section',
      current: true,
      icon: currentSectionData?.icon
    }
  ]

  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation)
    setIsModalOpen(true)
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'executive-summary':
        return (
          <div id="executive-summary" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
              <p className="text-muted-foreground mb-6">
                Comprehensive technical analysis of the scanned application with evidence-based findings.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Findings</CardTitle>
                <CardDescription>High-level technical assessment results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">85%</div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">12</div>
                    <p className="text-sm text-muted-foreground">Technologies</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">3</div>
                    <p className="text-sm text-muted-foreground">Risk Areas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">8</div>
                    <p className="text-sm text-muted-foreground">Recommendations</p>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <p className="text-sm leading-relaxed">
                    The scanned application demonstrates a modern technology stack with{' '}
                    <InlineCitation 
                      citationId="1" 
                      citation={mockCitations[0]}
                      onCitationClick={handleCitationClick}
                    >
                      React 18.2.0 and TypeScript for frontend development
                    </InlineCitation>
                    {' '}and{' '}
                    <InlineCitation 
                      citationId="2" 
                      citation={mockCitations[1]}
                      onCitationClick={handleCitationClick}
                    >
                      a microservices architecture using Node.js and Express
                    </InlineCitation>
                    . The overall architecture shows good separation of concerns and follows modern development practices.
                  </p>

                  <p className="text-sm leading-relaxed">
                    <InlineCitation 
                      citationId="3" 
                      citation={mockCitations[2]}
                      onCitationClick={handleCitationClick}
                    >
                      Code quality metrics show 78% test coverage with consistent ESLint configuration
                    </InlineCitation>
                    , indicating strong development practices. However,{' '}
                    <InlineCitation 
                      citationId="4" 
                      citation={mockCitations[3]}
                      onCitationClick={handleCitationClick}
                    >
                      security analysis reveals dependency vulnerabilities requiring attention
                    </InlineCitation>
                    , with 2 high-severity and 5 moderate-severity issues identified.
                  </p>
                </div>
              </CardContent>
            </Card>


          </div>
        )

      case 'risk-assessment':
        return (
          <div id="risk-assessment" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Risk Assessment</h2>
              <p className="text-muted-foreground mb-6">
                Comprehensive risk analysis across security, technical, and operational dimensions.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    High Risk Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-red-900">Dependency Vulnerabilities</p>
                      <p className="text-sm text-red-700">2 high-severity security issues</p>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-orange-900">API Rate Limiting</p>
                      <p className="text-sm text-orange-700">Missing rate limiting on public endpoints</p>
                    </div>
                    <Badge variant="secondary">High</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Low Risk Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">Code Quality</p>
                      <p className="text-sm text-green-700">Strong test coverage and linting</p>
                    </div>
                                         <Badge variant="outline" className="text-green-700 border-green-300">Low</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">Architecture</p>
                      <p className="text-sm text-blue-700">Well-structured microservices design</p>
                    </div>
                    <Badge variant="outline" className="text-blue-700">Low</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Risk Matrix</CardTitle>
                <CardDescription>Impact vs. Probability assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-red-100 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <p className="text-sm text-red-800">High Impact, High Probability</p>
                  </div>
                  <div className="p-4 bg-yellow-100 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">5</div>
                    <p className="text-sm text-yellow-800">Medium Impact/Probability</p>
                  </div>
                  <div className="p-4 bg-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">12</div>
                    <p className="text-sm text-green-800">Low Impact, Low Probability</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      case 'technology-overview':
        return (
          <div id="technology-overview" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Technology Overview</h2>
              <p className="text-muted-foreground mb-6">
                Detailed analysis of the technology stack and architectural patterns.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Frontend Technologies</CardTitle>
                  <CardDescription>Client-side technology stack analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          <InlineCitation 
                            citationId="1" 
                            citation={mockCitations[0]}
                            onCitationClick={handleCitationClick}
                          >
                            React
                          </InlineCitation>
                        </span>
                        <span className="font-medium">18.2.0</span>
                      </div>
                      <Progress value={95} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Latest stable version, excellent</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          <InlineCitation 
                            citationId="1" 
                            citation={mockCitations[0]}
                            onCitationClick={handleCitationClick}
                          >
                            TypeScript
                          </InlineCitation>
                        </span>
                        <span className="font-medium">4.9.5</span>
                      </div>
                      <Progress value={90} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Strong type safety implementation</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tailwind CSS</span>
                        <span className="font-medium">3.3.0</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Modern utility-first CSS framework</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Vite</span>
                        <span className="font-medium">5.0.0</span>
                      </div>
                      <Progress value={88} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Fast build tool and dev server</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backend Technologies</CardTitle>
                  <CardDescription>Server-side technology stack analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          <InlineCitation 
                            citationId="2" 
                            citation={mockCitations[1]}
                            onCitationClick={handleCitationClick}
                          >
                            Node.js
                          </InlineCitation>
                        </span>
                        <span className="font-medium">18.17.0</span>
                      </div>
                      <Progress value={92} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">LTS version, well supported</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          <InlineCitation 
                            citationId="2" 
                            citation={mockCitations[1]}
                            onCitationClick={handleCitationClick}
                          >
                            Express.js
                          </InlineCitation>
                        </span>
                        <span className="font-medium">4.18.2</span>
                      </div>
                      <Progress value={88} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Mature web framework</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>PostgreSQL</span>
                        <span className="font-medium">15.3</span>
                      </div>
                      <Progress value={90} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Modern relational database</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Redis</span>
                        <span className="font-medium">7.0.11</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Caching and session storage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Architecture Patterns</CardTitle>
                <CardDescription>Design patterns and architectural decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">Microservices</div>
                    <p className="text-sm text-muted-foreground">Service-oriented architecture with clear boundaries</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">RESTful APIs</div>
                    <p className="text-sm text-muted-foreground">Standard HTTP-based API design</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">Event-Driven</div>
                    <p className="text-sm text-muted-foreground">Asynchronous communication patterns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'code-analysis':
        return (
          <div id="code-analysis" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Code Analysis</h2>
              <p className="text-muted-foreground mb-6">
                Comprehensive analysis of code quality, patterns, and technical debt.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Code Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                                         <div>
                       <div className="flex justify-between text-sm mb-1">
                         <span>
                           <InlineCitation 
                             citationId="3" 
                             citation={mockCitations[2]}
                             onCitationClick={handleCitationClick}
                           >
                             Test Coverage
                           </InlineCitation>
                         </span>
                         <span className="font-medium">78.2%</span>
                       </div>
                       <Progress value={78} className="h-2" />
                     </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Code Complexity</span>
                        <span className="font-medium">Low</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Maintainability Index</span>
                        <span className="font-medium">82/100</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Documentation Coverage</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Debt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                                     <div className="text-center">
                     <div className="text-3xl font-bold text-yellow-600 mb-2">
                       <InlineCitation 
                         citationId="9" 
                         citation={mockCitations[8]}
                         onCitationClick={handleCitationClick}
                       >
                         12.5 days
                       </InlineCitation>
                     </div>
                     <p className="text-sm text-muted-foreground">Estimated remediation time</p>
                   </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Code Smells</span>
                      <span className="font-medium">23</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duplicated Lines</span>
                      <span className="font-medium">3.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cognitive Complexity</span>
                      <span className="font-medium">Medium</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Code Quality Issues</CardTitle>
                <CardDescription>Identified issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="font-medium">Unused Variables</p>
                        <p className="text-sm text-muted-foreground">8 instances across 5 files</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Minor</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium">Complex Functions</p>
                        <p className="text-sm text-muted-foreground">3 functions exceed complexity threshold</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Moderate</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">Consistent Formatting</p>
                        <p className="text-sm text-muted-foreground">Prettier and ESLint properly configured</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-700">Good</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'infrastructure-analysis':
        return (
          <div id="infrastructure-analysis" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Infrastructure Analysis</h2>
              <p className="text-muted-foreground mb-6">
                Analysis of deployment infrastructure, scaling patterns, and operational setup.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Deployment Environment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                                     <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <span className="text-sm">
                         <InlineCitation 
                           citationId="5" 
                           citation={mockCitations[4]}
                           onCitationClick={handleCitationClick}
                         >
                           Platform
                         </InlineCitation>
                       </span>
                       <Badge>AWS</Badge>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm">
                         <InlineCitation 
                           citationId="5" 
                           citation={mockCitations[4]}
                           onCitationClick={handleCitationClick}
                         >
                           Container Orchestration
                         </InlineCitation>
                       </span>
                       <Badge>Kubernetes</Badge>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm">
                         <InlineCitation 
                           citationId="5" 
                           citation={mockCitations[4]}
                           onCitationClick={handleCitationClick}
                         >
                           Load Balancer
                         </InlineCitation>
                       </span>
                       <Badge>ALB</Badge>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm">
                         <InlineCitation 
                           citationId="5" 
                           citation={mockCitations[4]}
                           onCitationClick={handleCitationClick}
                         >
                           CDN
                         </InlineCitation>
                       </span>
                       <Badge>CloudFront</Badge>
                     </div>
                   </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU Usage</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>62%</span>
                      </div>
                      <Progress value={62} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Storage Usage</span>
                        <span>38%</span>
                      </div>
                      <Progress value={38} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Scaling Configuration</CardTitle>
                <CardDescription>Auto-scaling and capacity management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">3-10</div>
                    <p className="text-sm text-muted-foreground">Pod Replicas Range</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">70%</div>
                    <p className="text-sm text-muted-foreground">CPU Scale Threshold</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">2min</div>
                    <p className="text-sm text-muted-foreground">Scale-up Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'performance-analysis':
        return (
          <div id="performance-analysis" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Performance Analysis</h2>
              <p className="text-muted-foreground mb-6">
                Performance metrics, bottlenecks, and optimization opportunities.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Core Web Vitals</CardTitle>
                  <CardDescription>Google Lighthouse metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                                         <div>
                       <div className="flex justify-between text-sm mb-1">
                         <span>
                           <InlineCitation 
                             citationId="6" 
                             citation={mockCitations[5]}
                             onCitationClick={handleCitationClick}
                           >
                             Largest Contentful Paint
                           </InlineCitation>
                         </span>
                         <span className="font-medium">1.8s</span>
                       </div>
                       <Progress value={85} className="h-2" />
                       <p className="text-xs text-green-600 mt-1">Good (&lt; 2.5s)</p>
                     </div>
                     <div>
                       <div className="flex justify-between text-sm mb-1">
                         <span>
                           <InlineCitation 
                             citationId="6" 
                             citation={mockCitations[5]}
                             onCitationClick={handleCitationClick}
                           >
                             First Input Delay
                           </InlineCitation>
                         </span>
                         <span className="font-medium">45ms</span>
                       </div>
                       <Progress value={90} className="h-2" />
                       <p className="text-xs text-green-600 mt-1">Good (&lt; 100ms)</p>
                     </div>
                     <div>
                       <div className="flex justify-between text-sm mb-1">
                         <span>
                           <InlineCitation 
                             citationId="6" 
                             citation={mockCitations[5]}
                             onCitationClick={handleCitationClick}
                           >
                             Cumulative Layout Shift
                           </InlineCitation>
                         </span>
                         <span className="font-medium">0.08</span>
                       </div>
                       <Progress value={75} className="h-2" />
                       <p className="text-xs text-yellow-600 mt-1">Needs improvement (&lt; 0.1)</p>
                     </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Performance</CardTitle>
                  <CardDescription>Backend response times</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                                         <div>
                       <div className="flex justify-between text-sm mb-1">
                         <span>
                           <InlineCitation 
                             citationId="6" 
                             citation={mockCitations[5]}
                             onCitationClick={handleCitationClick}
                           >
                             Average Response Time
                           </InlineCitation>
                         </span>
                         <span className="font-medium">245ms</span>
                       </div>
                       <Progress value={80} className="h-2" />
                     </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>95th Percentile</span>
                        <span className="font-medium">580ms</span>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Error Rate</span>
                        <span className="font-medium">0.12%</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Bottlenecks</CardTitle>
                <CardDescription>Identified areas for optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                                             <div>
                         <p className="font-medium">
                           <InlineCitation 
                             citationId="10" 
                             citation={mockCitations[9]}
                             onCitationClick={handleCitationClick}
                           >
                             Database Query Optimization
                           </InlineCitation>
                         </p>
                         <p className="text-sm text-muted-foreground">
                           <InlineCitation 
                             citationId="10" 
                             citation={mockCitations[9]}
                             onCitationClick={handleCitationClick}
                           >
                             3 slow queries identified (&gt;500ms)
                           </InlineCitation>
                         </p>
                       </div>
                    </div>
                    <Badge variant="secondary">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="font-medium">Image Optimization</p>
                        <p className="text-sm text-muted-foreground">Large images without compression</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Low</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">Caching Strategy</p>
                        <p className="text-sm text-muted-foreground">Redis caching properly implemented</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-700">Good</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'security-analysis':
        return (
          <div id="security-analysis" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Security Analysis</h2>
              <p className="text-muted-foreground mb-6">
                Comprehensive security assessment including vulnerabilities and best practices.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Vulnerability Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">2</div>
                      <p className="text-xs text-red-800">High</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">5</div>
                      <p className="text-xs text-yellow-800">Medium</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <p className="text-xs text-blue-800">Low</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600 mb-2">72/100</div>
                    <p className="text-sm text-muted-foreground">Overall Security Rating</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Authentication</span>
                      <span className="font-medium text-green-600">Good</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Data Protection</span>
                      <span className="font-medium text-yellow-600">Fair</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Input Validation</span>
                      <span className="font-medium text-red-600">Poor</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Critical Security Issues</CardTitle>
                <CardDescription>High-priority vulnerabilities requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <div>
                                                 <p className="font-medium text-red-900">
                           <InlineCitation 
                             citationId="7" 
                             citation={mockCitations[6]}
                             onCitationClick={handleCitationClick}
                           >
                             SQL Injection Vulnerability
                           </InlineCitation>
                         </p>
                         <p className="text-sm text-red-700">
                           <InlineCitation 
                             citationId="7" 
                             citation={mockCitations[6]}
                             onCitationClick={handleCitationClick}
                           >
                             User input not properly sanitized in search endpoint
                           </InlineCitation>
                         </p>
                      </div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium text-orange-900">Outdated Dependencies</p>
                        <p className="text-sm text-orange-700">2 packages with known security vulnerabilities</p>
                      </div>
                    </div>
                    <Badge variant="secondary">High</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="font-medium text-yellow-900">Missing Rate Limiting</p>
                        <p className="text-sm text-yellow-700">API endpoints vulnerable to brute force attacks</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Medium</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'compliance-check':
        return (
          <div id="compliance-check" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Compliance Check</h2>
              <p className="text-muted-foreground mb-6">
                Assessment against industry standards and regulatory requirements.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>GDPR Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Processing Consent</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Right to be Forgotten</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Portability</span>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Privacy by Design</span>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SOC 2 Type II</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Controls</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Availability Monitoring</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Processing Integrity</span>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confidentiality</span>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Summary</CardTitle>
                <CardDescription>Overall compliance status across frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>GDPR</span>
                      <span className="font-medium">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>SOC 2</span>
                      <span className="font-medium">60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>ISO 27001</span>
                      <span className="font-medium">68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'recommendations':
        return (
          <div id="recommendations" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
              <p className="text-muted-foreground mb-6">
                Prioritized actionable recommendations for improvement.
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Critical Priority
                  </CardTitle>
                  <CardDescription>Immediate action required</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 border-l-4 border-red-500 bg-red-50">
                    <h4 className="font-medium text-red-900 mb-2">Fix SQL Injection Vulnerability</h4>
                    <p className="text-sm text-red-800 mb-2">
                      Implement parameterized queries and input validation for all user-facing endpoints.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="destructive">Security</Badge>
                      <Badge variant="outline">1-2 days</Badge>
                    </div>
                  </div>
                  <div className="p-4 border-l-4 border-red-500 bg-red-50">
                    <h4 className="font-medium text-red-900 mb-2">Update Vulnerable Dependencies</h4>
                    <p className="text-sm text-red-800 mb-2">
                      Update lodash and axios to latest versions to patch known security vulnerabilities.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="destructive">Security</Badge>
                      <Badge variant="outline">4-6 hours</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    High Priority
                  </CardTitle>
                  <CardDescription>Address within 2 weeks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                    <h4 className="font-medium text-yellow-900 mb-2">Implement API Rate Limiting</h4>
                    <p className="text-sm text-yellow-800 mb-2">
                      Add rate limiting to prevent abuse and improve API reliability.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Performance</Badge>
                      <Badge variant="outline">2-3 days</Badge>
                    </div>
                  </div>
                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                    <h4 className="font-medium text-yellow-900 mb-2">Optimize Database Queries</h4>
                    <p className="text-sm text-yellow-800 mb-2">
                      Add indexes and optimize the 3 slowest queries identified in performance analysis.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Performance</Badge>
                      <Badge variant="outline">3-5 days</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Medium Priority
                  </CardTitle>
                  <CardDescription>Address within 1 month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-medium text-blue-900 mb-2">Improve Documentation Coverage</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Increase API documentation coverage from 65% to 85% minimum.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Documentation</Badge>
                      <Badge variant="outline">1-2 weeks</Badge>
                    </div>
                  </div>
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-medium text-blue-900 mb-2">Implement Image Optimization</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Add automatic image compression and WebP format support.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Performance</Badge>
                      <Badge variant="outline">1 week</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'timeline':
        return (
          <div id="timeline" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Implementation Timeline</h2>
              <p className="text-muted-foreground mb-6">
                Suggested timeline for implementing recommendations and improvements.
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Week 1-2: Critical Security Fixes</CardTitle>
                  <CardDescription>Immediate security vulnerabilities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Fix SQL injection vulnerability</span>
                      <Badge variant="destructive" className="ml-auto">Critical</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Update vulnerable dependencies</span>
                      <Badge variant="destructive" className="ml-auto">Critical</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Implement API rate limiting</span>
                      <Badge variant="secondary" className="ml-auto">High</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Week 3-4: Performance Optimization</CardTitle>
                  <CardDescription>Database and application performance improvements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Optimize database queries</span>
                      <Badge variant="secondary" className="ml-auto">High</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Implement image optimization</span>
                      <Badge variant="outline" className="ml-auto">Medium</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Add caching layers</span>
                      <Badge variant="outline" className="ml-auto">Medium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Month 2: Code Quality & Documentation</CardTitle>
                  <CardDescription>Improve maintainability and developer experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Improve documentation coverage</span>
                      <Badge variant="outline" className="ml-auto">Medium</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Refactor complex functions</span>
                      <Badge variant="outline" className="ml-auto">Low</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Increase test coverage</span>
                      <Badge variant="outline" className="ml-auto">Low</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Month 3+: Long-term Improvements</CardTitle>
                  <CardDescription>Strategic enhancements and compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">GDPR compliance improvements</span>
                      <Badge variant="outline" className="ml-auto">Compliance</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">SOC 2 certification preparation</span>
                      <Badge variant="outline" className="ml-auto">Compliance</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Architecture modernization</span>
                      <Badge variant="outline" className="ml-auto">Strategic</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'evidence-appendix':
        return (
          <div id="evidence-appendix" className="p-6">
            <EnhancedEvidenceAppendix 
              companyName="Ring4" // This should be dynamic based on the actual report
              reportId={id}
              comprehensiveScore={undefined} // TODO: Pass actual comprehensive score from report metadata
            />
          </div>
        )

      default:
        return (
          <div id={currentSection} className="p-8">
            <h2 className="text-2xl font-bold mb-4">{currentSectionData?.title}</h2>
            <p className="text-gray-600">This section is under development. It will include:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>{currentSectionData?.description}</li>
              <li>Evidence-based analysis with source citations</li>
              <li>Detailed findings with confidence scores</li>
              <li>Actionable recommendations</li>
            </ul>
          </div>
        )
    }
  }

  return (
    // Main container for the report page content, designed to fit within DashboardLayout's Outlet
    <div className="flex flex-col lg:flex-row h-full bg-white dark:bg-gray-900">
      {/* Report Section Navigation (Internal Sidebar for the report page) */}
      <ScanReportNavigation 
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        // Adjusted classes: not fixed, normal flow, specific width, and scroll if needed
        className="w-full lg:w-72 lg:h-full lg:border-r border-b lg:border-b-0 dark:border-gray-700 p-4 shrink-0 overflow-y-auto"
      />
      
      {/* Main Report Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <Breadcrumbs 
          items={breadcrumbItems}
          currentSection={currentSection}
          analystReviews={analystReviews}
        />
        
        {/* Section Content rendered here */}
        <div className="mt-6">
          {renderCurrentSection()}
        </div>
      </div>

      {/* Evidence Modal */}
      {selectedCitation && (
        <EvidenceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCitation(null)
          }}
          citation={selectedCitation}
          notes={[]}
          onAddNote={(note) => {
            console.log('New note added:', note)
          }}
          userRole="pe_user"
          userName="Demo User"
        />
      )}
    </div>
  );
} 