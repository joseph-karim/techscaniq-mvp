import { useState } from 'react'
import { 
  ChevronDown, 
  Server,
  Database,
  Cloud,
  Network,
  Shield,
  Zap,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ArchitectureComponent {
  name: string
  type: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'external'
  technology: string
  description: string
  scalabilityScore: number
  reliabilityScore: number
  securityScore: number
  concerns: string[]
  strengths: string[]
}

interface InfrastructureMetric {
  name: string
  value: string
  score: number
  benchmark: string
  status: 'excellent' | 'good' | 'fair' | 'poor'
  trend: 'improving' | 'stable' | 'declining'
}

interface StackArchitectureProps {
  data: {
    companyName: string
    architecturePattern: string
    overallScore: number
    scalabilityAssessment: string
    components: ArchitectureComponent[]
    infrastructureMetrics: InfrastructureMetric[]
    cloudStrategy: {
      provider: string
      multiCloud: boolean
      hybridCloud: boolean
      cloudNativeScore: number
      vendorLockRisk: 'low' | 'medium' | 'high'
    }
    dataFlow: {
      description: string
      bottlenecks: string[]
      optimizations: string[]
    }
    scalingChallenges: {
      current: string[]
      anticipated: string[]
      mitigationStrategies: string[]
    }
    recommendations: string[]
    riskFactors: string[]
  }
}

export function StackArchitecture({ data }: StackArchitectureProps) {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'fair': return <Info className="h-4 w-4 text-yellow-600" />
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <section id="stack-architecture" className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">Stack Architecture & Infrastructure</h2>
        <p className="text-muted-foreground">
          Deep dive into system architecture, infrastructure patterns, and scalability assessment
        </p>
      </div>

      {/* Architecture Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Architecture Overview
              </CardTitle>
              <CardDescription>
                {data.architecturePattern} pattern with overall score of {data.overallScore}/100
              </CardDescription>
            </div>
            <Badge className={cn('px-3 py-1', getScoreColor(data.overallScore))}>
              {data.overallScore}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <h4 className="font-medium mb-2">Scalability Assessment</h4>
            <p className="text-sm text-muted-foreground">{data.scalabilityAssessment}</p>
          </div>
        </CardContent>
      </Card>

      {/* System Components */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggleSection('components')}
            >
              <Network className="h-5 w-5" />
              System Components Analysis
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.has('components') ? "rotate-180" : ""
              )} />
            </CardTitle>
          </div>
        </CardHeader>
        {expandedSections.has('components') && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {data.components.map((component, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{component.name}</h4>
                    <Badge variant="outline">{component.type}</Badge>
                  </div>
                  
                  <div className="text-sm">
                    <p className="font-medium text-muted-foreground">Technology:</p>
                    <p>{component.technology}</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{component.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Scalability</span>
                      <span className="font-medium">{component.scalabilityScore}/100</span>
                    </div>
                    <Progress value={component.scalabilityScore} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Reliability</span>
                      <span className="font-medium">{component.reliabilityScore}/100</span>
                    </div>
                    <Progress value={component.reliabilityScore} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Security</span>
                      <span className="font-medium">{component.securityScore}/100</span>
                    </div>
                    <Progress value={component.securityScore} className="h-2" />
                  </div>

                  {component.concerns.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">Concerns:</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {component.concerns.map((concern, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {component.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Strengths:</p>
                      <ul className="text-xs text-green-600 space-y-1">
                        {component.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Infrastructure Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Infrastructure Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.infrastructureMetrics.map((metric, index) => (
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
          </div>
        </CardContent>
      </Card>

      {/* Cloud Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloud Strategy & Vendor Dependencies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Primary Provider</p>
                <p className="font-medium">{data.cloudStrategy.provider}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Multi-Cloud</p>
                <Badge variant={data.cloudStrategy.multiCloud ? "default" : "outline"}>
                  {data.cloudStrategy.multiCloud ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hybrid Cloud</p>
                <Badge variant={data.cloudStrategy.hybridCloud ? "default" : "outline"}>
                  {data.cloudStrategy.hybridCloud ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cloud-Native Score</p>
                <div className="flex items-center gap-2">
                  <Progress value={data.cloudStrategy.cloudNativeScore} className="flex-1" />
                  <span className="font-medium">{data.cloudStrategy.cloudNativeScore}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendor Lock-in Risk</p>
                <Badge variant="outline" className={cn(
                  data.cloudStrategy.vendorLockRisk === 'low' ? 'text-green-600' :
                  data.cloudStrategy.vendorLockRisk === 'medium' ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {data.cloudStrategy.vendorLockRisk.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Flow & Scaling Challenges */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggleSection('dataflow')}
            >
              <Database className="h-5 w-5" />
              Data Flow Analysis
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.has('dataflow') ? "rotate-180" : ""
              )} />
            </CardTitle>
          </CardHeader>
          {expandedSections.has('dataflow') && (
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{data.dataFlow.description}</p>
              
              {data.dataFlow.bottlenecks.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Bottlenecks</h4>
                  <ul className="space-y-1">
                    {data.dataFlow.bottlenecks.map((bottleneck, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {bottleneck}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.dataFlow.optimizations.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Optimizations</h4>
                  <ul className="space-y-1">
                    {data.dataFlow.optimizations.map((optimization, index) => (
                      <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {optimization}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggleSection('scaling')}
            >
              <Zap className="h-5 w-5" />
              Scaling Challenges
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.has('scaling') ? "rotate-180" : ""
              )} />
            </CardTitle>
          </CardHeader>
          {expandedSections.has('scaling') && (
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Challenges</h4>
                <ul className="space-y-1">
                  {data.scalingChallenges.current.map((challenge, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-yellow-600" />
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Anticipated Challenges</h4>
                <ul className="space-y-1">
                  {data.scalingChallenges.anticipated.map((challenge, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Mitigation Strategies</h4>
                <ul className="space-y-1">
                  {data.scalingChallenges.mitigationStrategies.map((strategy, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-600" />
                      {strategy}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

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
              <Shield className="h-5 w-5" />
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