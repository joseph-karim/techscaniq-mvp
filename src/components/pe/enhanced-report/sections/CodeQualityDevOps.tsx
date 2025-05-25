import { useState } from 'react'
import { 
  ChevronDown, 
  Code,
  GitBranch,
  Shield,
  Bug,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  Target,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface CodeMetric {
  name: string
  value: string
  score: number
  benchmark: string
  trend: 'improving' | 'stable' | 'declining'
  status: 'excellent' | 'good' | 'fair' | 'poor'
}

interface DevOpsPractice {
  name: string
  implemented: boolean
  maturityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert'
  description: string
  impact: 'high' | 'medium' | 'low'
}

interface TechnicalDebt {
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  estimatedEffort: string
  businessImpact: string
}

interface CodeQualityDevOpsProps {
  data: {
    companyName: string
    overallScore: number
    codeQualityScore: number
    devOpsMaturityScore: number
    technicalDebtScore: number
    codeMetrics: CodeMetric[]
    devOpsPractices: DevOpsPractice[]
    technicalDebt: TechnicalDebt[]
    testingStrategy: {
      unitTestCoverage: number
      integrationTestCoverage: number
      e2eTestCoverage: number
      testAutomation: boolean
      performanceTesting: boolean
      securityTesting: boolean
    }
    cicdPipeline: {
      automatedBuilds: boolean
      automatedTesting: boolean
      automatedDeployment: boolean
      rollbackCapability: boolean
      environmentParity: boolean
      deploymentFrequency: string
      leadTime: string
      mttr: string
    }
    codebaseHealth: {
      languageDistribution: { name: string; percentage: number; quality: string }[]
      dependencyManagement: string
      securityVulnerabilities: { severity: string; count: number }[]
      performanceBottlenecks: string[]
    }
    recommendations: string[]
    riskFactors: string[]
  }
}

export function CodeQualityDevOps({ data }: CodeQualityDevOpsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }



  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'fair': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'poor': return <Bug className="h-4 w-4 text-red-600" />
      default: return <Bug className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <section id="code-quality-devops" className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">Code Quality & DevOps Maturity</h2>
        <p className="text-muted-foreground">
          Assessment of development practices, code quality metrics, and operational maturity
        </p>
      </div>

      {/* Overview Scores */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-2xl font-bold">{data.overallScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Code Quality</p>
                <p className="text-2xl font-bold">{data.codeQualityScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">DevOps Maturity</p>
                <p className="text-2xl font-bold">{data.devOpsMaturityScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tech Debt</p>
                <p className="text-2xl font-bold">{data.technicalDebtScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => toggleSection('code-metrics')}
          >
            <BarChart3 className="h-5 w-5" />
            Code Quality Metrics
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.has('code-metrics') ? "rotate-180" : ""
            )} />
          </CardTitle>
        </CardHeader>
        {expandedSections.has('code-metrics') && (
          <CardContent className="space-y-4">
            {data.codeMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {getStatusIcon(metric.status)}
                  <div>
                    <p className="font-medium">{metric.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Benchmark: {metric.benchmark}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{metric.value}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      'text-xs',
                      metric.status === 'excellent' ? 'text-green-600' :
                      metric.status === 'good' ? 'text-blue-600' :
                      metric.status === 'fair' ? 'text-yellow-600' : 'text-red-600'
                    )}>
                      {metric.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {metric.trend}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Testing Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Testing Strategy & Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Unit Test Coverage</p>
              <div className="flex items-center gap-2">
                <Progress value={data.testingStrategy.unitTestCoverage} className="flex-1" />
                <span className="font-medium">{data.testingStrategy.unitTestCoverage}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Integration Test Coverage</p>
              <div className="flex items-center gap-2">
                <Progress value={data.testingStrategy.integrationTestCoverage} className="flex-1" />
                <span className="font-medium">{data.testingStrategy.integrationTestCoverage}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">E2E Test Coverage</p>
              <div className="flex items-center gap-2">
                <Progress value={data.testingStrategy.e2eTestCoverage} className="flex-1" />
                <span className="font-medium">{data.testingStrategy.e2eTestCoverage}%</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Test Automation</span>
              <Badge variant={data.testingStrategy.testAutomation ? "default" : "outline"}>
                {data.testingStrategy.testAutomation ? "Implemented" : "Not Implemented"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Performance Testing</span>
              <Badge variant={data.testingStrategy.performanceTesting ? "default" : "outline"}>
                {data.testingStrategy.performanceTesting ? "Implemented" : "Not Implemented"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Security Testing</span>
              <Badge variant={data.testingStrategy.securityTesting ? "default" : "outline"}>
                {data.testingStrategy.securityTesting ? "Implemented" : "Not Implemented"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CI/CD Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => toggleSection('cicd')}
          >
            <GitBranch className="h-5 w-5" />
            CI/CD Pipeline Maturity
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.has('cicd') ? "rotate-180" : ""
            )} />
          </CardTitle>
        </CardHeader>
        {expandedSections.has('cicd') && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Pipeline Capabilities</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Automated Builds', value: data.cicdPipeline.automatedBuilds },
                    { name: 'Automated Testing', value: data.cicdPipeline.automatedTesting },
                    { name: 'Automated Deployment', value: data.cicdPipeline.automatedDeployment },
                    { name: 'Rollback Capability', value: data.cicdPipeline.rollbackCapability },
                    { name: 'Environment Parity', value: data.cicdPipeline.environmentParity }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.name}</span>
                      <Badge variant={item.value ? "default" : "outline"}>
                        {item.value ? "Yes" : "No"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Performance Metrics</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Deployment Frequency</p>
                    <p className="font-medium">{data.cicdPipeline.deploymentFrequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Time</p>
                    <p className="font-medium">{data.cicdPipeline.leadTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mean Time to Recovery</p>
                    <p className="font-medium">{data.cicdPipeline.mttr}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Technical Debt */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => toggleSection('tech-debt')}
          >
            <Bug className="h-5 w-5" />
            Technical Debt Assessment
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.has('tech-debt') ? "rotate-180" : ""
            )} />
          </CardTitle>
        </CardHeader>
        {expandedSections.has('tech-debt') && (
          <CardContent className="space-y-4">
            {data.technicalDebt.map((debt, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{debt.category}</h4>
                  <Badge className={cn('text-xs', getSeverityColor(debt.severity))}>
                    {debt.severity.toUpperCase()}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">{debt.description}</p>
                
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Estimated Effort</p>
                    <p className="text-sm">{debt.estimatedEffort}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Business Impact</p>
                    <p className="text-sm">{debt.businessImpact}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Codebase Health */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => toggleSection('codebase-health')}
          >
            <Code className="h-5 w-5" />
            Codebase Health Analysis
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.has('codebase-health') ? "rotate-180" : ""
            )} />
          </CardTitle>
        </CardHeader>
        {expandedSections.has('codebase-health') && (
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Language Distribution</h4>
              <div className="space-y-2">
                {data.codebaseHealth.languageDistribution.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{lang.name}</span>
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        lang.quality === 'excellent' ? 'text-green-600' :
                        lang.quality === 'good' ? 'text-blue-600' :
                        lang.quality === 'fair' ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {lang.quality}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={lang.percentage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{lang.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Security Vulnerabilities</h4>
              <div className="grid gap-2 md:grid-cols-4">
                {data.codebaseHealth.securityVulnerabilities.map((vuln, index) => (
                  <div key={index} className="text-center p-3 rounded-lg border">
                    <p className="text-2xl font-bold">{vuln.count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{vuln.severity}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Performance Bottlenecks</h4>
              <ul className="space-y-2">
                {data.codebaseHealth.performanceBottlenecks.map((bottleneck, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <Clock className="h-3 w-3 mt-0.5 flex-shrink-0 text-yellow-600" />
                    {bottleneck}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recommendations & Risk Factors */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-600" />
                  {recommendation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.riskFactors.map((risk, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-600" />
                  {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  )
} 