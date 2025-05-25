import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Target, 
  Layers, 
  Cloud,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react'

interface ScalabilityAssessmentProps {
  data: {
    companyName: string
    assessmentDate: string
    overallScalabilityScore: number
    currentScale: {
      users: number
      transactions: number
      dataVolume: string
      regions: number
    }
    
    architecturalReadiness: {
      overallScore: number
      microservicesAdoption: number
      cloudNativeScore: number
      apiMaturity: number
      dataArchitecture: number
      
      patterns: Array<{
        pattern: string
        implemented: boolean
        maturity: 'basic' | 'intermediate' | 'advanced' | 'expert'
        scalabilityImpact: 'high' | 'medium' | 'low'
        effort: string
      }>
    }
    
    performanceProjections: {
      currentCapacity: {
        maxUsers: number
        maxThroughput: number
        responseTime: number
        availability: number
      }
      projectedGrowth: Array<{
        timeframe: string
        expectedUsers: number
        expectedLoad: string
        infrastructureNeeds: string
        estimatedCost: number
        bottlenecks: string[]
      }>
    }
    
    technicalRoadmap: {
      overallMaturity: number
      planningHorizon: string
      roadmapQuality: number
      
      initiatives: Array<{
        initiative: string
        category: 'infrastructure' | 'architecture' | 'performance' | 'security' | 'platform'
        priority: 'critical' | 'high' | 'medium' | 'low'
        timeline: string
        effort: string
        cost: number
        scalabilityImpact: number
        dependencies: string[]
        status: 'planned' | 'in-progress' | 'completed' | 'delayed'
      }>
    }
    
    infrastructureScaling: {
      autoScalingCapability: number
      loadBalancing: boolean
      caching: boolean
      cdn: boolean
      multiRegion: boolean
      
      scalingStrategies: Array<{
        component: string
        currentStrategy: string
        recommendedStrategy: string
        effort: string
        timeline: string
        cost: number
      }>
    }
    
    dataScaling: {
      databaseSharding: boolean
      readReplicas: boolean
      caching: boolean
      dataPartitioning: boolean
      archivalStrategy: boolean
      
      challenges: Array<{
        challenge: string
        impact: string
        solution: string
        timeline: string
        complexity: 'low' | 'medium' | 'high'
      }>
    }
    
    teamScaling: {
      currentTeamSize: number
      projectedTeamSize: number
      hiringPlan: boolean
      knowledgeTransfer: number
      documentationQuality: number
      
      scalingChallenges: Array<{
        area: string
        challenge: string
        mitigation: string
        timeline: string
      }>
    }
    
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high' | 'critical'
      
      risks: Array<{
        risk: string
        category: 'technical' | 'operational' | 'financial' | 'market'
        probability: 'low' | 'medium' | 'high'
        impact: 'low' | 'medium' | 'high' | 'critical'
        mitigation: string
        timeline: string
        cost: number
      }>
    }
    
    recommendations: string[]
  }
}

export function ScalabilityAssessment({ data }: ScalabilityAssessmentProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMaturityColor = (maturity: string) => {
    switch (maturity) {
      case 'expert': return 'bg-green-100 text-green-800 border-green-200'
      case 'advanced': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'basic': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'planned': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`
    }
    return num.toLocaleString()
  }

  return (
    <section id="scalability-assessment" className="space-y-8">
      <div className="border-l-4 border-green-500 pl-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Scalability & Technical Roadmap Assessment</h2>
        <p className="text-gray-600">
          Comprehensive analysis of scalability readiness, technical roadmap, and growth projections
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scalability Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(data.overallScalabilityScore)}`}>
                  {data.overallScalabilityScore}/100
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Users</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.currentScale.users)}</p>
                <p className="text-xs text-gray-500">{data.currentScale.regions} regions</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Architecture Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(data.architecturalReadiness.overallScore)}`}>
                  {data.architecturalReadiness.overallScore}/100
                </p>
              </div>
              <Layers className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Roadmap Quality</p>
                <p className={`text-2xl font-bold ${getScoreColor(data.technicalRoadmap.roadmapQuality)}`}>
                  {data.technicalRoadmap.roadmapQuality}/100
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Scale Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Scale & Capacity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{formatNumber(data.currentScale.users)}</p>
              <p className="text-sm text-blue-800">Active Users</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{formatNumber(data.currentScale.transactions)}</p>
              <p className="text-sm text-green-800">Daily Transactions</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{data.currentScale.dataVolume}</p>
              <p className="text-sm text-purple-800">Data Volume</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{data.currentScale.regions}</p>
              <p className="text-sm text-orange-800">Regions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Architectural Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Architectural Readiness for Scale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Architecture Scores</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Microservices Adoption</span>
                    <span className="text-sm font-medium">{data.architecturalReadiness.microservicesAdoption}%</span>
                  </div>
                  <Progress value={data.architecturalReadiness.microservicesAdoption} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Cloud Native Score</span>
                    <span className="text-sm font-medium">{data.architecturalReadiness.cloudNativeScore}%</span>
                  </div>
                  <Progress value={data.architecturalReadiness.cloudNativeScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">API Maturity</span>
                    <span className="text-sm font-medium">{data.architecturalReadiness.apiMaturity}%</span>
                  </div>
                  <Progress value={data.architecturalReadiness.apiMaturity} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Data Architecture</span>
                    <span className="text-sm font-medium">{data.architecturalReadiness.dataArchitecture}%</span>
                  </div>
                  <Progress value={data.architecturalReadiness.dataArchitecture} className="h-2" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Architectural Patterns</h4>
              <div className="space-y-3">
                {data.architecturalReadiness.patterns.map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{pattern.pattern}</span>
                      <div className="flex items-center gap-2">
                        {pattern.implemented ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge className={getMaturityColor(pattern.maturity)}>
                          {pattern.maturity}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>Impact: {pattern.scalabilityImpact}</div>
                      <div>Effort: {pattern.effort}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Projections & Growth Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h4 className="font-semibold mb-4">Current Capacity Limits</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{formatNumber(data.performanceProjections.currentCapacity.maxUsers)}</p>
                <p className="text-sm text-blue-800">Max Users</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{formatNumber(data.performanceProjections.currentCapacity.maxThroughput)}</p>
                <p className="text-sm text-green-800">Max Throughput/min</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{data.performanceProjections.currentCapacity.responseTime}ms</p>
                <p className="text-sm text-purple-800">Response Time</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-lg font-bold text-orange-600">{data.performanceProjections.currentCapacity.availability}%</p>
                <p className="text-sm text-orange-800">Availability</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Growth Projections</h4>
            <div className="space-y-4">
              {data.performanceProjections.projectedGrowth.map((projection, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">{projection.timeframe}</h5>
                    <div className="text-sm text-gray-600">
                      Est. Cost: {formatCurrency(projection.estimatedCost)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-gray-600">Expected Users: </span>
                      <span className="font-medium">{formatNumber(projection.expectedUsers)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Expected Load: </span>
                      <span className="font-medium">{projection.expectedLoad}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Infrastructure: </span>
                      <span className="font-medium">{projection.infrastructureNeeds}</span>
                    </div>
                  </div>
                  
                  {projection.bottlenecks.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">Potential Bottlenecks:</p>
                      <div className="flex flex-wrap gap-2">
                        {projection.bottlenecks.map((bottleneck, idx) => (
                          <Badge key={idx} className="text-xs bg-red-50 text-red-700">
                            {bottleneck}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Technical Roadmap & Strategic Initiatives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{data.technicalRoadmap.overallMaturity}%</p>
                <p className="text-sm text-blue-800">Roadmap Maturity</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{data.technicalRoadmap.planningHorizon}</p>
                <p className="text-sm text-green-800">Planning Horizon</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{data.technicalRoadmap.roadmapQuality}%</p>
                <p className="text-sm text-purple-800">Quality Score</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {data.technicalRoadmap.initiatives.map((initiative, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{initiative.initiative}</h4>
                    <Badge className={getPriorityColor(initiative.priority)}>
                      {initiative.priority}
                    </Badge>
                    <Badge className={getStatusColor(initiative.status)}>
                      {initiative.status}
                    </Badge>
                    <Badge>{initiative.category}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(initiative.cost)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-gray-600">Timeline: </span>
                    <span className="font-medium">{initiative.timeline}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Effort: </span>
                    <span className="font-medium">{initiative.effort}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Scalability Impact: </span>
                    <span className="font-medium">{initiative.scalabilityImpact}%</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Impact</span>
                    </div>
                    <Progress value={initiative.scalabilityImpact} className="h-1" />
                  </div>
                </div>
                
                {initiative.dependencies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Dependencies:</p>
                    <div className="flex flex-wrap gap-2">
                      {initiative.dependencies.map((dep, depIndex) => (
                        <Badge key={depIndex} className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Scaling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Infrastructure Scaling Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Scaling Capabilities</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Auto-scaling Capability</span>
                    <span className="text-sm font-medium">{data.infrastructureScaling.autoScalingCapability}%</span>
                  </div>
                  <Progress value={data.infrastructureScaling.autoScalingCapability} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Load Balancing</span>
                    {data.infrastructureScaling.loadBalancing ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Caching</span>
                    {data.infrastructureScaling.caching ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">CDN</span>
                    {data.infrastructureScaling.cdn ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Multi-Region</span>
                    {data.infrastructureScaling.multiRegion ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Scaling Strategies</h4>
              <div className="space-y-3">
                {data.infrastructureScaling.scalingStrategies.map((strategy, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{strategy.component}</span>
                      <span className="text-sm text-gray-600">{formatCurrency(strategy.cost)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Current:</span> {strategy.currentStrategy}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Recommended:</span> {strategy.recommendedStrategy}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Effort: {strategy.effort}</div>
                      <div>Timeline: {strategy.timeline}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Scalability Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg font-semibold">Overall Risk Level:</span>
              <Badge className={getRiskColor(data.riskAssessment.overallRisk)}>
                {data.riskAssessment.overallRisk.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            {data.riskAssessment.risks.map((risk, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{risk.risk}</h4>
                      <Badge className={getRiskColor(risk.probability)}>
                        {risk.probability.toUpperCase()} PROB
                      </Badge>
                      <Badge className={getRiskColor(risk.impact)}>
                        {risk.impact.toUpperCase()} IMPACT
                      </Badge>
                      <span className="text-sm text-gray-600 capitalize">{risk.category}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Timeline: {risk.timeline} | Cost: {formatCurrency(risk.cost)}
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 mb-1">Mitigation Strategy:</p>
                  <p className="text-sm text-blue-700">{risk.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Scalability Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
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