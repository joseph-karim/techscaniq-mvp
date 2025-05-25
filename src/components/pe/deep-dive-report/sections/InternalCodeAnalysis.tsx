import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Shield, Code, GitBranch, Clock, DollarSign } from 'lucide-react'

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
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'decreasing': return '↓'
      case 'increasing': return '↑'
      default: return '→'
    }
  }

  return (
    <section id="internal-code-analysis" className="space-y-8">
      <div className="border-l-4 border-purple-500 pl-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Internal Code Analysis</h2>
        <p className="text-gray-600">
          Comprehensive codebase review with security analysis, technical debt assessment, and quality metrics
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Repositories</p>
                <p className="text-2xl font-bold text-gray-900">{data.repositoriesAnalyzed}</p>
              </div>
              <GitBranch className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lines of Code</p>
                <p className="text-2xl font-bold text-gray-900">{(data.totalLinesOfCode / 1000).toFixed(0)}k</p>
              </div>
              <Code className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Code Quality</p>
                <p className={`text-2xl font-bold ${getQualityColor(data.overallCodeQuality)}`}>
                  {data.overallCodeQuality}/100
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className={`text-2xl font-bold ${getQualityColor(data.securityScore)}`}>
                  {data.securityScore}/100
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Language Distribution & Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.codebaseMetrics.languages.map((lang, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{lang.name}</span>
                                         <Badge variant={lang.quality === 'excellent' ? 'default' : 'secondary'}>
                       {lang.quality}
                     </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {lang.lines.toLocaleString()} lines ({lang.percentage}%)
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={lang.percentage} className="h-2" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Test Coverage: {lang.testCoverage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Vulnerability Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vulnerabilities */}
            <div>
              <h4 className="font-semibold mb-4">Vulnerability Count by Severity</h4>
              <div className="space-y-3">
                {data.securityAnalysis.vulnerabilities.map((vuln, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                                             <Badge variant="outline" className={getSeverityColor(vuln.severity)}>
                         {vuln.severity.toUpperCase()}
                       </Badge>
                      <span className="font-medium">{vuln.count} issues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Trend:</span>
                      <span className={`text-sm ${vuln.trend === 'decreasing' ? 'text-green-600' : vuln.trend === 'increasing' ? 'text-red-600' : 'text-gray-600'}`}>
                        {getTrendIcon(vuln.trend)} {vuln.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Practices */}
            <div>
              <h4 className="font-semibold mb-4">Security Practice Implementation</h4>
              <div className="space-y-3">
                {data.securityAnalysis.securityPractices.map((practice, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{practice.practice}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={practice.implemented ? 'default' : 'destructive'}>
                          {practice.implemented ? 'Implemented' : 'Missing'}
                        </Badge>
                        <span className="text-sm text-gray-600">{practice.score}%</span>
                      </div>
                    </div>
                    <Progress value={practice.score} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Debt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Technical Debt Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.technicalDebt.map((debt, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{debt.category}</h4>
                      <Badge className={getSeverityColor(debt.severity)}>
                        {debt.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">Priority {debt.priority}</Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{debt.impact}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {debt.effort}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {debt.cost}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Affected Components:</p>
                  <div className="flex flex-wrap gap-2">
                    {debt.affectedComponents.map((component, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {component}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Review Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Code Review Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Review Time</p>
                <p className="text-2xl font-bold text-gray-900">{data.codeReviewProcess.averageReviewTime}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Review Participation</p>
                <p className="text-2xl font-bold text-gray-900">{data.codeReviewProcess.reviewParticipation}%</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Required Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{data.codeReviewProcess.requiredApprovals}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={data.codeReviewProcess.automatedChecks ? 'default' : 'destructive'}>
                  {data.codeReviewProcess.automatedChecks ? 'Automated Checks Enabled' : 'No Automated Checks'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={data.codeReviewProcess.branchProtection ? 'default' : 'destructive'}>
                  {data.codeReviewProcess.branchProtection ? 'Branch Protection Enabled' : 'No Branch Protection'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
} 