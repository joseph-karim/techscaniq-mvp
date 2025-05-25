import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Cloud, 
  Shield, 
  DollarSign, 
  Activity, 
  Server, 
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface InfrastructureDeepDiveProps {
  data: {
    companyName: string
    environment: string
    analysisDate: string
    infrastructureScore: number
    cloudInfrastructure: {
      provider: string
      regions: string[]
      multiRegion: boolean
      disasterRecovery: boolean
      rto: string
      rpo: string
      services: Array<{
        name: string
        count: number
        type: string
        cost: string
        utilization: number
      }>
      costOptimization: {
        currentMonthlyCost: number
        optimizedMonthlyCost: number
        potentialSavings: number
        savingsOpportunities: string[]
      }
    }
    securityConfiguration: {
      networkSecurity: {
        vpcConfiguration: string
        securityGroups: number
        nacls: number
        wafEnabled: boolean
        ddosProtection: boolean
      }
      accessControl: {
        iamPolicies: number
        roleBasedAccess: boolean
        mfaEnforced: boolean
        privilegedAccessManagement: boolean
        accessReviewFrequency: string
      }
      dataProtection: {
        encryptionAtRest: boolean
        encryptionInTransit: boolean
        keyManagement: string
        backupEncryption: boolean
        dataClassification: boolean
      }
    }
    monitoring: {
      observability: {
        metricsCollection: string
        logAggregation: string
        distributedTracing: string
        alerting: string
        dashboards: number
        slos: number
      }
      performance: {
        averageResponseTime: string
        p99ResponseTime: string
        errorRate: string
        availability: string
        throughput: string
      }
    }
    deploymentPipeline: {
      cicdPlatform: string
      deploymentFrequency: string
      leadTime: string
      changeFailureRate: string
      meanTimeToRecovery: string
      automatedTesting: boolean
      canaryDeployments: boolean
      rollbackCapability: boolean
    }
    recommendations: string[]
  }
}

export function InfrastructureDeepDive({ data }: InfrastructureDeepDiveProps) {
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-green-600'
    if (utilization >= 60) return 'text-yellow-600'
    return 'text-red-600'
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
    <section id="infrastructure-deep-dive" className="space-y-8">
      <div className="border-l-4 border-blue-500 pl-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Infrastructure Deep Dive</h2>
        <p className="text-gray-600">
          Comprehensive infrastructure analysis with cost optimization, security assessment, and performance metrics
        </p>
      </div>

      {/* Infrastructure Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Infrastructure Score</p>
                <p className="text-2xl font-bold text-blue-600">{data.infrastructureScore}/100</p>
              </div>
              <Cloud className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cloud Provider</p>
                <p className="text-lg font-semibold">{data.cloudInfrastructure.provider}</p>
                <p className="text-xs text-gray-500">{data.cloudInfrastructure.regions.length} regions</p>
              </div>
              <Server className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.cloudInfrastructure.costOptimization.currentMonthlyCost)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Availability</p>
                <p className="text-2xl font-bold text-green-600">{data.monitoring.performance.availability}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cloud Services Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloud Services & Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.cloudInfrastructure.services.map((service, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{service.name}</h4>
                    <Badge variant="outline">{service.type}</Badge>
                    <span className="text-sm text-gray-600">Count: {service.count}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{service.cost}</p>
                    <p className="text-sm text-gray-600">monthly</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Utilization</span>
                      <span className={`text-sm font-medium ${getUtilizationColor(service.utilization)}`}>
                        {service.utilization}%
                      </span>
                    </div>
                    <Progress value={service.utilization} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Optimization Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Current Spending</h4>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(data.cloudInfrastructure.costOptimization.currentMonthlyCost)}
                </p>
                <p className="text-sm text-blue-600">per month</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Optimized Cost</h4>
                <p className="text-3xl font-bold text-green-900">
                  {formatCurrency(data.cloudInfrastructure.costOptimization.optimizedMonthlyCost)}
                </p>
                <p className="text-sm text-green-600">per month</p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Potential Savings</h4>
                <p className="text-3xl font-bold text-yellow-900">
                  {formatCurrency(data.cloudInfrastructure.costOptimization.potentialSavings)}
                </p>
                <p className="text-sm text-yellow-600">per month</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Savings Opportunities</h4>
              <div className="space-y-3">
                {data.cloudInfrastructure.costOptimization.savingsOpportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Network Security */}
            <div>
              <h4 className="font-semibold mb-4">Network Security</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">VPC Configuration</span>
                  <Badge variant="outline">{data.securityConfiguration.networkSecurity.vpcConfiguration}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Security Groups</span>
                  <span className="font-medium">{data.securityConfiguration.networkSecurity.securityGroups}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">NACLs</span>
                  <span className="font-medium">{data.securityConfiguration.networkSecurity.nacls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WAF Enabled</span>
                  {data.securityConfiguration.networkSecurity.wafEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">DDoS Protection</span>
                  {data.securityConfiguration.networkSecurity.ddosProtection ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Access Control */}
            <div>
              <h4 className="font-semibold mb-4">Access Control</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">IAM Policies</span>
                  <span className="font-medium">{data.securityConfiguration.accessControl.iamPolicies}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Role-Based Access</span>
                  {data.securityConfiguration.accessControl.roleBasedAccess ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">MFA Enforced</span>
                  {data.securityConfiguration.accessControl.mfaEnforced ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">PAM</span>
                  {data.securityConfiguration.accessControl.privilegedAccessManagement ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Access Reviews</span>
                  <Badge variant="outline">{data.securityConfiguration.accessControl.accessReviewFrequency}</Badge>
                </div>
              </div>
            </div>

            {/* Data Protection */}
            <div>
              <h4 className="font-semibold mb-4">Data Protection</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Encryption at Rest</span>
                  {data.securityConfiguration.dataProtection.encryptionAtRest ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Encryption in Transit</span>
                  {data.securityConfiguration.dataProtection.encryptionInTransit ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Key Management</span>
                  <Badge variant="outline">{data.securityConfiguration.dataProtection.keyManagement}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Backup Encryption</span>
                  {data.securityConfiguration.dataProtection.backupEncryption ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Classification</span>
                  {data.securityConfiguration.dataProtection.dataClassification ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance & Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Performance Metrics</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Average Response Time</span>
                  <span className="text-lg font-bold text-green-600">{data.monitoring.performance.averageResponseTime}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">P99 Response Time</span>
                  <span className="text-lg font-bold text-yellow-600">{data.monitoring.performance.p99ResponseTime}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-lg font-bold text-green-600">{data.monitoring.performance.errorRate}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Throughput</span>
                  <span className="text-lg font-bold text-blue-600">{data.monitoring.performance.throughput}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Observability Stack</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Metrics Collection</span>
                  <Badge variant="outline">{data.monitoring.observability.metricsCollection}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Log Aggregation</span>
                  <Badge variant="outline">{data.monitoring.observability.logAggregation}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Distributed Tracing</span>
                  <Badge variant="outline">{data.monitoring.observability.distributedTracing}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alerting</span>
                  <Badge variant="outline">{data.monitoring.observability.alerting}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dashboards</span>
                  <span className="font-medium">{data.monitoring.observability.dashboards}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SLOs</span>
                  <span className="font-medium">{data.monitoring.observability.slos}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Deployment Pipeline & DevOps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Pipeline Metrics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CI/CD Platform</span>
                  <Badge variant="outline">{data.deploymentPipeline.cicdPlatform}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Deployment Frequency</span>
                  <span className="font-medium">{data.deploymentPipeline.deploymentFrequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Lead Time</span>
                  <span className="font-medium">{data.deploymentPipeline.leadTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Change Failure Rate</span>
                  <span className="font-medium">{data.deploymentPipeline.changeFailureRate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">MTTR</span>
                  <span className="font-medium">{data.deploymentPipeline.meanTimeToRecovery}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Deployment Capabilities</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Automated Testing</span>
                  {data.deploymentPipeline.automatedTesting ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Canary Deployments</span>
                  {data.deploymentPipeline.canaryDeployments ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rollback Capability</span>
                  {data.deploymentPipeline.rollbackCapability ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Infrastructure Recommendations</CardTitle>
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