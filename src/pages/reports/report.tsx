import { useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Clock, 
  Download, 
  ExternalLink, 
  FileText, 
  Globe,
  Info, 
  Lock, 
  Server, 
  ShieldCheck, 
  Terminal, 
  ThumbsDown, 
  ThumbsUp, 
  Zap 
} from 'lucide-react'
import { TechHealthScoreGauge } from '@/components/dashboard/tech-health-score-gauge'
import { RiskSummaryCards } from '@/components/dashboard/risk-summary-cards'

// Mock report data
const reportData = {
  id: 'report-1',
  companyName: 'Acme Cloud Technologies',
  scanDate: '2023-04-10T14:23:53Z',
  websiteUrl: 'https://acme-cloud.example.com',
  techHealthScore: {
    score: 7.8,
    grade: 'B',
    lastUpdated: '2023-04-10T16:30:00Z',
  },
  thesisAlignment: {
    overall: 78, // percentage
    enablers: [
      { criterion: 'Cloud-native architecture', explanation: 'Fully containerized microservices running on Kubernetes', findings: ['finding-2'] },
      { criterion: 'CI/CD maturity', explanation: 'Comprehensive CI/CD pipelines with automated testing and deployment', findings: ['finding-4'] },
    ],
    blockers: [
      { criterion: 'Security posture', explanation: 'Critical API vulnerabilities pose significant risk', findings: ['finding-1'] },
    ],
    neutral: [
      { criterion: 'Technical debt', explanation: 'Moderate technical debt but with active management', findings: ['finding-3', 'finding-5'] },
    ]
  },
  risks: [
    { 
      id: 'finding-1', 
      title: 'Unsecured API Endpoints',
      category: 'security',
      severity: 'critical', 
      description: 'Multiple API endpoints lack proper authentication and authorization controls, exposing sensitive customer data to potential unauthorized access. This represents a critical security vulnerability that could lead to data breaches.',
      evidence: [
        {
          source: 'crawl4ai', 
          url: 'https://api.acme-cloud.example.com/v1/docs',
          content: 'Documentation reveals several endpoints with "auth: optional" configuration, including user data endpoints.',
          timestamp: '2023-04-09T10:15:32Z',
          confidence: 0.95
        }
      ]
    },
    {
      id: 'finding-2',
      title: 'Database Connection Pooling Issues',
      category: 'database',
      severity: 'high',
      description: 'The application uses a naive connection management approach without proper pooling, which leads to connection exhaustion under high load and creates performance bottlenecks.',
      evidence: [
        {
          source: 'diffbot',
          url: 'https://github.com/acme-cloud/backend/db/connection.js',
          content: 'Code snippet shows direct connection creation without pooling: `new Connection()` called on each request.',
          timestamp: '2023-04-09T11:22:45Z',
          confidence: 0.89
        }
      ]
    },
    {
      id: 'finding-3',
      title: 'Outdated Node.js Version',
      category: 'devops',
      severity: 'medium',
      description: 'The application runs on Node.js 12.x, which reached end-of-life status and no longer receives security updates, potentially exposing the system to known vulnerabilities.',
      evidence: [
        {
          source: 'diffbot',
          url: 'https://github.com/acme-cloud/backend/package.json',
          content: 'Package.json specifies "engines": {"node": "^12.22.0"}',
          timestamp: '2023-04-09T09:45:10Z',
          confidence: 0.99
        }
      ]
    },
    {
      id: 'finding-4',
      title: 'Robust CI/CD Pipeline',
      category: 'devops',
      severity: 'low',
      description: 'The company has implemented a comprehensive CI/CD pipeline with thorough automated testing, including unit, integration, and end-to-end tests, leading to high-quality releases.',
      evidence: [
        {
          source: 'diffbot',
          url: 'https://github.com/acme-cloud/backend/.github/workflows/main.yml',
          content: 'GitHub Actions workflow with extensive test coverage and deployment stages.',
          timestamp: '2023-04-09T14:30:22Z',
          confidence: 0.97
        }
      ]
    },
    {
      id: 'finding-5',
      title: 'Frontend Bundle Size Optimization',
      category: 'code',
      severity: 'low',
      description: 'The React application could benefit from code splitting and lazy loading to reduce the initial bundle size and improve load times, especially on mobile devices.',
      evidence: [
        {
          source: 'crawl4ai',
          url: 'https://acme-cloud.example.com',
          content: 'Performance analysis shows 2.3MB initial JavaScript bundle size.',
          timestamp: '2023-04-09T15:12:09Z',
          confidence: 0.86
        }
      ]
    }
  ],
  architecture: {
    pattern: 'Microservices',
    components: [
      { name: 'API Gateway', technology: 'Kong', issues: 0 },
      { name: 'Auth Service', technology: 'Node.js + JWT', issues: 1 },
      { name: 'User Service', technology: 'Node.js + MongoDB', issues: 0 },
      { name: 'Product Service', technology: 'Java + PostgreSQL', issues: 0 },
      { name: 'Notification Service', technology: 'Python + RabbitMQ', issues: 0 },
      { name: 'Frontend', technology: 'React + Redux', issues: 1 },
    ],
    dependencies: [
      { from: 'Frontend', to: 'API Gateway' },
      { from: 'API Gateway', to: 'Auth Service' },
      { from: 'API Gateway', to: 'User Service' },
      { from: 'API Gateway', to: 'Product Service' },
      { from: 'User Service', to: 'Notification Service' },
      { from: 'Product Service', to: 'Notification Service' },
    ]
  },
  security: {
    overallScore: 65, // percentage
    categories: [
      { name: 'Authentication', score: 75 },
      { name: 'Authorization', score: 50 },
      { name: 'Data Protection', score: 70 },
      { name: 'API Security', score: 45 },
      { name: 'Infrastructure Security', score: 85 },
    ],
    vulnerabilities: [
      { name: 'Insecure API Endpoints', severity: 'critical', cvss: 9.1 },
      { name: 'Weak Password Policy', severity: 'medium', cvss: 5.3 },
      { name: 'Missing Content Security Policy', severity: 'low', cvss: 3.2 },
    ]
  },
  codeQuality: {
    overallScore: 72, // percentage
    metrics: [
      { name: 'Test Coverage', score: 68, benchmark: 80 },
      { name: 'Code Duplication', score: 85, benchmark: 90 },
      { name: 'Documentation', score: 60, benchmark: 75 },
      { name: 'Complexity', score: 75, benchmark: 70 },
    ],
    languages: [
      { name: 'JavaScript', percentage: 65 },
      { name: 'TypeScript', percentage: 20 },
      { name: 'Java', percentage: 10 },
      { name: 'Python', percentage: 5 },
    ]
  },
  devOps: {
    maturityScore: 82, // percentage
    practices: [
      { name: 'Continuous Integration', implemented: true },
      { name: 'Continuous Deployment', implemented: true },
      { name: 'Infrastructure as Code', implemented: true },
      { name: 'Automated Testing', implemented: true },
      { name: 'Monitoring & Alerting', implemented: false },
      { name: 'Disaster Recovery', implemented: false },
    ]
  }
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  
  // In a real app, we would fetch the report data based on the ID
  const report = reportData

  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Dashboard
              </a>
            </Button>
            <Badge variant="outline" className="rounded-sm px-1 text-xs">
              {id}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{report.companyName}</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <a 
              href={report.websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:text-primary"
            >
              {report.websiteUrl} <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {new Date(report.scanDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>
      
      {/* Tech Health Score and Risk Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tech Health Score</CardTitle>
            <CardDescription>
              Overall technical health assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TechHealthScoreGauge 
              score={report.techHealthScore.score} 
              grade={report.techHealthScore.grade as any}
            />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Risk Summary</CardTitle>
            <CardDescription>
              Categorized risk assessment by severity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiskSummaryCards />
          </CardContent>
        </Card>
      </div>
      
      {/* Main report content */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="code-quality">Code Quality</TabsTrigger>
          <TabsTrigger value="thesis">Thesis Alignment</TabsTrigger>
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Findings</CardTitle>
              <CardDescription>
                Most important insights from the technical due diligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.risks.map((risk) => (
                  <div key={risk.id} className="rounded-lg border p-4">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-2 ${
                        risk.severity === 'critical' ? 'bg-red-100 text-red-600' :
                        risk.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                        risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {risk.category === 'security' ? <Lock className="h-5 w-5" /> :
                         risk.category === 'database' ? <Server className="h-5 w-5" /> :
                         risk.category === 'devops' ? <Terminal className="h-5 w-5" /> :
                         <Info className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{risk.title}</h3>
                          <Badge variant={
                            risk.severity === 'critical' ? 'destructive' :
                            risk.severity === 'high' ? 'destructive' :
                            risk.severity === 'medium' ? 'default' :
                            'outline'
                          }>
                            {risk.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{risk.description}</p>
                        
                        {/* Evidence accordion for each finding */}
                        <div className="mt-2">
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <FileText className="h-3 w-3" />
                            View Evidence
                          </Button>
                          {/* For brevity, we're not showing the evidence details here */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Architecture Tab */}
        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>
                {report.architecture.pattern} architecture pattern with {report.architecture.components.length} main components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-lg border bg-muted/20 p-4">
                <div className="text-center">
                  {/* This would be an interactive diagram in a real implementation */}
                  <div className="relative mx-auto h-[300px] w-[600px] max-w-full border border-dashed border-muted p-4">
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Interactive Architecture Diagram</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Click on components to see details</p>
                </div>
              </div>
              
              <h3 className="mb-4 text-lg font-medium">Component Details</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {report.architecture.components.map((component) => (
                  <Card key={component.name} className={component.issues > 0 ? 'border-orange-200' : ''}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{component.name}</CardTitle>
                        {component.issues > 0 && (
                          <Badge variant="outline" className="text-orange-500">
                            {component.issues} issue{component.issues > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm">
                      <p><span className="text-muted-foreground">Technology:</span> {component.technology}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Assessment</CardTitle>
              <CardDescription>
                Analysis of security posture and identified vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-medium">Security Posture</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Overall security score: <span className="font-medium">{report.security.overallScore}%</span>
                  </p>
                  
                  <div className="space-y-3">
                    {report.security.categories.map((category) => (
                      <div key={category.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm">{category.score}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${
                              category.score >= 80 ? 'bg-green-500' :
                              category.score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${category.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-medium">Vulnerabilities</h3>
                    <Badge variant="outline">CVSS Scored</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {report.security.vulnerabilities.map((vuln, index) => (
                      <div
                        key={index}
                        className={`rounded-md border p-3 ${
                          vuln.severity === 'critical' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950' :
                          vuln.severity === 'high' ? 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950' :
                          vuln.severity === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950' :
                          'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className={`h-4 w-4 ${
                              vuln.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                              vuln.severity === 'high' ? 'text-orange-600 dark:text-orange-400' :
                              vuln.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-green-600 dark:text-green-400'
                            }`} />
                            <span className="font-medium">{vuln.name}</span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            vuln.cvss >= 9.0 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            vuln.cvss >= 7.0 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                            vuln.cvss >= 4.0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            CVSS {vuln.cvss.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Code Quality Tab */}
        <TabsContent value="code-quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Quality & DevOps Maturity</CardTitle>
              <CardDescription>
                Assessment of development practices and code quality metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 text-lg font-medium">Code Quality Metrics</h3>
                  
                  <div className="space-y-4">
                    {report.codeQuality.metrics.map((metric) => (
                      <div key={metric.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{metric.name}</span>
                            <Badge variant="outline" className={
                              metric.score >= metric.benchmark ? 'text-green-500' : 'text-orange-500'
                            }>
                              {metric.score >= metric.benchmark ? 'Meets' : 'Below'} benchmark
                            </Badge>
                          </div>
                          <span className="text-sm font-medium">{metric.score}%</span>
                        </div>
                        
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${
                              metric.score >= metric.benchmark ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${metric.score}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <span className="text-xs text-muted-foreground">
                            Benchmark: {metric.benchmark}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="mb-4 text-lg font-medium">DevOps Practices</h3>
                  <div className="rounded-md border">
                    <div className="flex items-center justify-between border-b p-3">
                      <span className="font-medium">DevOps Maturity Score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{report.devOps.maturityScore}%</span>
                        <Badge variant={
                          report.devOps.maturityScore >= 80 ? 'default' :
                          report.devOps.maturityScore >= 60 ? 'secondary' : 'outline'
                        }>
                          {report.devOps.maturityScore >= 80 ? 'Excellent' :
                           report.devOps.maturityScore >= 60 ? 'Good' :
                           report.devOps.maturityScore >= 40 ? 'Fair' : 'Poor'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <ul className="grid gap-2">
                        {report.devOps.practices.map((practice) => (
                          <li key={practice.name} className="flex items-center justify-between">
                            <span className="text-sm">{practice.name}</span>
                            {practice.implemented ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Implemented
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                Not Implemented
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <h3 className="mb-2 mt-6 text-lg font-medium">Language Distribution</h3>
                  <div className="space-y-2">
                    {report.codeQuality.languages.map((lang) => (
                      <div key={lang.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{lang.name}</span>
                          <span className="text-sm">{lang.percentage}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${lang.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Thesis Alignment Tab */}
        <TabsContent value="thesis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Thesis Alignment</CardTitle>
              <CardDescription>
                Analysis of how the technical stack and practices align with your investment criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center rounded-lg border bg-muted/20 p-6">
                <h3 className="text-lg font-medium">Overall Thesis Alignment</h3>
                <div className="my-4 h-32 w-32 rounded-full border-8 border-primary flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-bold">{report.thesisAlignment.overall}%</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-6">
                  <div className="flex items-center gap-1 text-sm">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span>{report.thesisAlignment.enablers.length} Enablers</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span>{report.thesisAlignment.blockers.length} Blockers</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                    <span>{report.thesisAlignment.neutral.length} Neutral</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 flex items-center text-lg font-medium text-green-600">
                    <ThumbsUp className="mr-2 h-5 w-5" />
                    Enablers
                  </h3>
                  
                  {report.thesisAlignment.enablers.map((item, index) => (
                    <div key={index} className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                      <h4 className="font-medium">{item.criterion}</h4>
                      <p className="mt-1 text-sm">{item.explanation}</p>
                    </div>
                  ))}
                </div>
                
                <div>
                  <h3 className="mb-3 flex items-center text-lg font-medium text-red-600">
                    <ThumbsDown className="mr-2 h-5 w-5" />
                    Blockers
                  </h3>
                  
                  {report.thesisAlignment.blockers.map((item, index) => (
                    <div key={index} className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                      <h4 className="font-medium">{item.criterion}</h4>
                      <p className="mt-1 text-sm">{item.explanation}</p>
                    </div>
                  ))}
                </div>
                
                <div>
                  <h3 className="mb-3 flex items-center text-lg font-medium text-gray-600">
                    <Info className="mr-2 h-5 w-5" />
                    Neutral Factors
                  </h3>
                  
                  {report.thesisAlignment.neutral.map((item, index) => (
                    <div key={index} className="mb-4 rounded-lg border p-4">
                      <h4 className="font-medium">{item.criterion}</h4>
                      <p className="mt-1 text-sm">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Evidence Modal would be added here in a full implementation */}
    </div>
  )
}