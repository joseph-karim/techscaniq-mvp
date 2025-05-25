import { useState } from 'react'
import { 
  Code, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  GitBranch,
  FileText,
  Bug,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface InternalCodeAnalysisProps {
  data: {
    companyName: string
    analysisDate: string
    repositoriesAnalyzed: number
    totalLinesOfCode: number
    overallCodeQuality: number
    securityScore: number
    maintainabilityScore: number
    codebaseMetrics: {
      languages: Array<{
        name: string
        lines: number
        percentage: number
        quality: string
        testCoverage: number
      }>
      complexity: {
        averageCyclomaticComplexity: number
        highComplexityFunctions: number
        technicalDebtRatio: number
        duplicatedCodePercentage: number
      }
      dependencies: {
        totalPackages: number
        outdatedPackages: number
        vulnerablePackages: number
        licenseIssues: number
      }
    }
    securityAnalysis: {
      vulnerabilities: Array<{
        severity: string
        count: number
        trend: string
      }>
      securityPractices: Array<{
        practice: string
        implemented: boolean
        score: number
      }>
    }
    technicalDebt: Array<{
      category: string
      severity: 'high' | 'medium' | 'low'
      impact: string
      effort: string
      cost: string
      priority: number
      affectedComponents: string[]
    }>
    codeReviewProcess: {
      averageReviewTime: string
      reviewParticipation: number
      automatedChecks: boolean
      requiredApprovals: number
      branchProtection: boolean
    }
    recommendations: string[]
  }
}

export function InternalCodeAnalysis({ data }: InternalCodeAnalysisProps) {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    languages: false,
    security: false,
    debt: false,
    process: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityBadgeColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`
    return num.toString()
  }

  return (
    <div id="internal-code-analysis" className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Internal Code Analysis</h2>
        <p className="text-muted-foreground">
          Comprehensive analysis of {data.companyName}'s codebase with full repository access
        </p>
      </div>

      {/* Overview Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('overview')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Code Quality Overview
              </CardTitle>
              <CardDescription>
                High-level metrics across {data.repositoriesAnalyzed} repositories
              </CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.overview && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.overview && (
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className={cn("text-3xl font-bold", getQualityColor(data.overallCodeQuality))}>
                  {data.overallCodeQuality}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Quality</p>
              </div>
              <div className="text-center">
                <div className={cn("text-3xl font-bold", getQualityColor(data.securityScore))}>
                  {data.securityScore}%
                </div>
                <p className="text-sm text-muted-foreground">Security Score</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{formatNumber(data.totalLinesOfCode)}</div>
                <p className="text-sm text-muted-foreground">Lines of Code</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{data.repositoriesAnalyzed}</div>
                <p className="text-sm text-muted-foreground">Repositories</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Code Quality</span>
                  <span>{data.overallCodeQuality}%</span>
                </div>
                <Progress value={data.overallCodeQuality} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Security</span>
                  <span>{data.securityScore}%</span>
                </div>
                <Progress value={data.securityScore} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Maintainability</span>
                  <span>{data.maintainabilityScore}%</span>
                </div>
                <Progress value={data.maintainabilityScore} className="h-2" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Language Breakdown */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('languages')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Language & Technology Analysis
              </CardTitle>
              <CardDescription>
                Breakdown by programming languages and quality metrics
              </CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.languages && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.languages && (
          <CardContent className="space-y-4">
            {data.codebaseMetrics.languages.map((lang, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{lang.name}</h4>
                    <span className={cn("px-2 py-1 rounded text-xs", getQualityBadgeColor(lang.quality))}>
                      {lang.quality}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(lang.lines)} lines ({lang.percentage}%)
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Code Distribution</span>
                      <span>{lang.percentage}%</span>
                    </div>
                    <Progress value={lang.percentage} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Test Coverage</span>
                      <span>{lang.testCoverage}%</span>
                    </div>
                    <Progress value={lang.testCoverage} className="h-1" />
                  </div>
                </div>
              </div>
            ))}

            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <div className="space-y-2">
                <h4 className="font-medium">Code Complexity</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Avg Cyclomatic Complexity:</span>
                    <span>{data.codebaseMetrics.complexity.averageCyclomaticComplexity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Complexity Functions:</span>
                    <span>{data.codebaseMetrics.complexity.highComplexityFunctions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Technical Debt Ratio:</span>
                    <span>{data.codebaseMetrics.complexity.technicalDebtRatio}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duplicated Code:</span>
                    <span>{data.codebaseMetrics.complexity.duplicatedCodePercentage}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Dependencies</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Packages:</span>
                    <span>{data.codebaseMetrics.dependencies.totalPackages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outdated Packages:</span>
                    <span className="text-yellow-600">{data.codebaseMetrics.dependencies.outdatedPackages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vulnerable Packages:</span>
                    <span className="text-red-600">{data.codebaseMetrics.dependencies.vulnerablePackages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>License Issues:</span>
                    <span>{data.codebaseMetrics.dependencies.licenseIssues}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Security Analysis */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('security')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Analysis
              </CardTitle>
              <CardDescription>
                Vulnerability assessment and security practices
              </CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.security && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.security && (
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-3">Vulnerability Summary</h4>
                <div className="space-y-2">
                  {data.securityAnalysis.vulnerabilities.map((vuln, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span className={cn("capitalize", getSeverityColor(vuln.severity))}>
                          {vuln.severity}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({vuln.trend})
                        </span>
                      </div>
                      <span className="font-medium">{vuln.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Security Practices</h4>
                <div className="space-y-2">
                  {data.securityAnalysis.securityPractices.map((practice, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{practice.practice}</span>
                        <div className="flex items-center gap-2">
                          {practice.implemented ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">{practice.score}%</span>
                        </div>
                      </div>
                      <Progress value={practice.score} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Technical Debt */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('debt')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Technical Debt Analysis
              </CardTitle>
              <CardDescription>
                Identified technical debt and remediation costs
              </CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.debt && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.debt && (
          <CardContent className="space-y-4">
            {data.technicalDebt.map((debt, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{debt.category}</h4>
                    <span className={cn("text-sm capitalize", getSeverityColor(debt.severity))}>
                      {debt.severity} severity
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">{debt.cost}</div>
                    <div className="text-sm text-muted-foreground">{debt.effort}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{debt.impact}</p>
                <div className="flex flex-wrap gap-1">
                  {debt.affectedComponents.map((component, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {component}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Code Review Process */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('process')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Code Review Process
              </CardTitle>
              <CardDescription>
                Development workflow and review practices
              </CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.process && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.process && (
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Average Review Time:</span>
                  <span className="font-medium">{data.codeReviewProcess.averageReviewTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Review Participation:</span>
                  <span className="font-medium">{data.codeReviewProcess.reviewParticipation}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Required Approvals:</span>
                  <span className="font-medium">{data.codeReviewProcess.requiredApprovals}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Automated Checks:</span>
                  <span className="flex items-center gap-1">
                    {data.codeReviewProcess.automatedChecks ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    {data.codeReviewProcess.automatedChecks ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Branch Protection:</span>
                  <span className="flex items-center gap-1">
                    {data.codeReviewProcess.branchProtection ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    {data.codeReviewProcess.branchProtection ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Recommendations
          </CardTitle>
          <CardDescription>
            Strategic recommendations for code quality improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 