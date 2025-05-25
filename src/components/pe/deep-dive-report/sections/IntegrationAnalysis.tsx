import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Network, 
  Database, 
  Globe, 
  Shield, 
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

interface IntegrationAnalysisProps {
  data: {
    companyName: string
    analysisDate: string
    overallIntegrationScore: number
    
    apiArchitecture: {
      totalEndpoints: number
      publicApis: number
      internalApis: number
      webhooks: number
      documentationQuality: number
      versioningStrategy: string
      authenticationMethods: string[]
      rateLimiting: boolean
      monitoring: boolean
      
      endpoints: Array<{
        name: string
        type: 'REST' | 'GraphQL' | 'WebSocket' | 'gRPC'
        version: string
        status: 'active' | 'deprecated' | 'beta'
        usage: number
        responseTime: number
        errorRate: number
        documentation: 'excellent' | 'good' | 'fair' | 'poor'
      }>
    }
    
    thirdPartyIntegrations: {
      totalIntegrations: number
      criticalIntegrations: number
      integrationHealth: number
      
      integrations: Array<{
        provider: string
        category: 'payment' | 'analytics' | 'communication' | 'storage' | 'security' | 'other'
        criticality: 'critical' | 'important' | 'optional'
        status: 'healthy' | 'degraded' | 'failing'
        uptime: number
        lastIncident: string
        dataFlow: 'bidirectional' | 'inbound' | 'outbound'
        compliance: boolean
        cost: number
        alternatives: string[]
      }>
    }
    
    dataFlowAnalysis: {
      totalDataSources: number
      realTimeStreams: number
      batchProcesses: number
      dataQuality: number
      
      flows: Array<{
        source: string
        destination: string
        dataType: string
        volume: string
        frequency: string
        latency: number
        encryption: boolean
        monitoring: boolean
        businessCritical: boolean
      }>
    }
    
    securityAssessment: {
      apiSecurity: number
      dataEncryption: number
      accessControl: number
      auditLogging: number
      
      vulnerabilities: Array<{
        type: string
        severity: 'critical' | 'high' | 'medium' | 'low'
        affected: string[]
        status: 'open' | 'in-progress' | 'resolved'
        discoveredDate: string
      }>
    }
    
    performanceMetrics: {
      averageResponseTime: number
      p95ResponseTime: number
      throughput: number
      errorRate: number
      availability: number
      
      bottlenecks: Array<{
        component: string
        issue: string
        impact: string
        recommendation: string
        effort: string
      }>
    }
    
    recommendations: string[]
  }
}

export function IntegrationAnalysis({ data }: IntegrationAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'beta':
      case 'degraded':
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'deprecated':
      case 'failing':
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'important': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'optional': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <section id="integration-analysis" className="space-y-8">
      <div className="border-l-4 border-purple-500 pl-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Integration & API Analysis</h2>
        <p className="text-gray-600">
          Comprehensive analysis of API architecture, third-party integrations, and data flow patterns
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Integration Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(data.overallIntegrationScore)}`}>
                  {data.overallIntegrationScore}/100
                </p>
              </div>
              <Network className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Endpoints</p>
                <p className="text-2xl font-bold text-gray-900">{data.apiArchitecture.totalEndpoints}</p>
                <p className="text-xs text-gray-500">{data.apiArchitecture.publicApis} public</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Integrations</p>
                <p className="text-2xl font-bold text-gray-900">{data.thirdPartyIntegrations.totalIntegrations}</p>
                <p className="text-xs text-gray-500">{data.thirdPartyIntegrations.criticalIntegrations} critical</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Sources</p>
                <p className="text-2xl font-bold text-gray-900">{data.dataFlowAnalysis.totalDataSources}</p>
                <p className="text-xs text-gray-500">{data.dataFlowAnalysis.realTimeStreams} real-time</p>
              </div>
              <Database className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            API Architecture & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">API Overview</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{data.apiArchitecture.publicApis}</p>
                    <p className="text-sm text-blue-800">Public APIs</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-600">{data.apiArchitecture.internalApis}</p>
                    <p className="text-sm text-green-800">Internal APIs</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-xl font-bold text-purple-600">{data.apiArchitecture.webhooks}</p>
                    <p className="text-sm text-purple-800">Webhooks</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-xl font-bold text-orange-600">{data.apiArchitecture.documentationQuality}%</p>
                    <p className="text-sm text-orange-800">Doc Quality</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Versioning Strategy</span>
                    <Badge variant="outline">{data.apiArchitecture.versioningStrategy}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Rate Limiting</span>
                    {data.apiArchitecture.rateLimiting ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Monitoring</span>
                    {data.apiArchitecture.monitoring ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Key API Endpoints</h4>
              <div className="space-y-3">
                {data.apiArchitecture.endpoints.map((endpoint, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{endpoint.name}</span>
                        <Badge variant="outline">{endpoint.type}</Badge>
                        <Badge variant="outline" className={getStatusColor(endpoint.status)}>
                          {endpoint.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">v{endpoint.version}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Usage: </span>
                        <span className="font-medium">{endpoint.usage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Response: </span>
                        <span className="font-medium">{endpoint.responseTime}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Errors: </span>
                        <span className="font-medium">{endpoint.errorRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Third-Party Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Third-Party Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Integration Health</span>
              <span className="text-sm font-medium">{data.thirdPartyIntegrations.integrationHealth}%</span>
            </div>
            <Progress value={data.thirdPartyIntegrations.integrationHealth} className="h-2" />
          </div>
          
          <div className="space-y-4">
            {data.thirdPartyIntegrations.integrations.map((integration, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{integration.provider}</h4>
                    <Badge variant="outline" className={getCriticalityColor(integration.criticality)}>
                      {integration.criticality}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                    <Badge variant="outline">{integration.category}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(integration.cost)}/month
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Uptime</span>
                      <span className="text-sm font-medium">{integration.uptime}%</span>
                    </div>
                    <Progress value={integration.uptime} className="h-1" />
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Data Flow: </span>
                    <span className="font-medium capitalize">{integration.dataFlow}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Last Incident: </span>
                    <span className="font-medium">{integration.lastIncident}</span>
                  </div>
                </div>
                
                {integration.alternatives.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Alternatives:</p>
                    <div className="flex flex-wrap gap-2">
                      {integration.alternatives.map((alt, altIndex) => (
                        <Badge key={altIndex} variant="outline" className="text-xs">
                          {alt}
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

      {/* Data Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Flow & Processing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Data Processing Overview</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{data.dataFlowAnalysis.realTimeStreams}</p>
                    <p className="text-sm text-blue-800">Real-time Streams</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{data.dataFlowAnalysis.batchProcesses}</p>
                    <p className="text-sm text-green-800">Batch Processes</p>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Data Quality Score</span>
                    <span className="text-sm font-medium">{data.dataFlowAnalysis.dataQuality}%</span>
                  </div>
                  <Progress value={data.dataFlowAnalysis.dataQuality} className="h-2" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Critical Data Flows</h4>
              <div className="space-y-3">
                {data.dataFlowAnalysis.flows.map((flow, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">{flow.source}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium">{flow.destination}</span>
                      {flow.businessCritical && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                          Critical
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Type: {flow.dataType}</div>
                      <div>Volume: {flow.volume}</div>
                      <div>Frequency: {flow.frequency}</div>
                      <div>Latency: {flow.latency}ms</div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {flow.encryption && <CheckCircle className="h-3 w-3 text-green-600" />}
                      {flow.monitoring && <CheckCircle className="h-3 w-3 text-blue-600" />}
                      <span className="text-xs text-gray-600">
                        {flow.encryption ? 'Encrypted' : 'Not encrypted'} • {flow.monitoring ? 'Monitored' : 'Not monitored'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Integration Security Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Security Metrics</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">API Security</span>
                    <span className="text-sm font-medium">{data.securityAssessment.apiSecurity}%</span>
                  </div>
                  <Progress value={data.securityAssessment.apiSecurity} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Data Encryption</span>
                    <span className="text-sm font-medium">{data.securityAssessment.dataEncryption}%</span>
                  </div>
                  <Progress value={data.securityAssessment.dataEncryption} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Access Control</span>
                    <span className="text-sm font-medium">{data.securityAssessment.accessControl}%</span>
                  </div>
                  <Progress value={data.securityAssessment.accessControl} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Audit Logging</span>
                    <span className="text-sm font-medium">{data.securityAssessment.auditLogging}%</span>
                  </div>
                  <Progress value={data.securityAssessment.auditLogging} className="h-2" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Security Vulnerabilities</h4>
              <div className="space-y-3">
                {data.securityAssessment.vulnerabilities.map((vuln, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{vuln.type}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getSeverityColor(vuln.severity)}>
                          {vuln.severity}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(vuln.status)}>
                          {vuln.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Discovered: {vuln.discoveredDate}
                    </div>
                    <div className="text-xs text-gray-600">
                      Affected: {vuln.affected.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance & Bottleneck Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Performance Overview</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{data.performanceMetrics.averageResponseTime}ms</p>
                    <p className="text-sm text-blue-800">Avg Response</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{data.performanceMetrics.p95ResponseTime}ms</p>
                    <p className="text-sm text-green-800">P95 Response</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">{data.performanceMetrics.throughput}</p>
                    <p className="text-sm text-purple-800">Throughput/min</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-lg font-bold text-orange-600">{data.performanceMetrics.availability}%</p>
                    <p className="text-sm text-orange-800">Availability</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className="text-sm font-bold text-red-600">{data.performanceMetrics.errorRate}%</span>
                  </div>
                  <Progress value={100 - data.performanceMetrics.errorRate} className="h-2" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Performance Bottlenecks</h4>
              <div className="space-y-3">
                {data.performanceMetrics.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{bottleneck.component}</span>
                      <Badge variant="outline">{bottleneck.effort}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{bottleneck.issue}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Impact:</span> {bottleneck.impact}
                    </p>
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Recommendation:</span> {bottleneck.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Integration & API Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
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