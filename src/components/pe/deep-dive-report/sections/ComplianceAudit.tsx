import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Lock, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Database,
  Users,
  Clock,
  Target
} from 'lucide-react'

interface ComplianceAuditProps {
  data: {
    companyName: string
    auditDate: string
    overallComplianceScore: number
    auditScope: string[]
    
    securityCompliance: {
      overallScore: number
      frameworks: Array<{
        framework: string
        status: 'compliant' | 'partial' | 'non-compliant' | 'in-progress'
        score: number
        lastAudit: string
        nextAudit: string
        criticalGaps: string[]
        requirements: Array<{
          requirement: string
          status: 'met' | 'partial' | 'not-met'
          evidence: string
          riskLevel: 'high' | 'medium' | 'low'
        }>
      }>
    }
    
    dataProtectionCompliance: {
      overallScore: number
      regulations: Array<{
        regulation: string
        applicability: 'required' | 'recommended' | 'not-applicable'
        status: 'compliant' | 'partial' | 'non-compliant'
        score: number
        dataTypes: string[]
        controls: Array<{
          control: string
          implemented: boolean
          effectiveness: number
          lastReview: string
        }>
      }>
      dataInventory: {
        personalDataTypes: number
        dataRetentionPolicies: boolean
        dataMinimization: boolean
        consentManagement: boolean
        rightToErasure: boolean
      }
    }
    
    industryCompliance: {
      overallScore: number
      standards: Array<{
        standard: string
        industry: string
        mandatory: boolean
        status: 'certified' | 'in-progress' | 'planned' | 'not-started'
        certificationDate?: string
        expiryDate?: string
        auditFirm?: string
        scope: string[]
        findings: Array<{
          finding: string
          severity: 'critical' | 'high' | 'medium' | 'low'
          status: 'open' | 'in-progress' | 'closed'
          dueDate: string
        }>
      }>
    }
    
    accessControlAudit: {
      overallScore: number
      userAccess: {
        totalUsers: number
        privilegedUsers: number
        inactiveUsers: number
        lastAccessReview: string
        mfaAdoption: number
        passwordPolicy: boolean
      }
      systemAccess: {
        adminAccounts: number
        serviceAccounts: number
        sharedAccounts: number
        accessLogging: boolean
        sessionManagement: boolean
      }
      dataAccess: {
        dataClassification: boolean
        accessControls: boolean
        encryptionAtRest: boolean
        encryptionInTransit: boolean
        backupSecurity: boolean
      }
    }
    
    auditReadiness: {
      overallScore: number
      documentation: {
        policiesAndProcedures: number
        incidentResponsePlan: boolean
        businessContinuityPlan: boolean
        riskAssessments: boolean
        vendorAssessments: boolean
      }
      monitoring: {
        securityMonitoring: boolean
        complianceMonitoring: boolean
        auditLogging: boolean
        alerting: boolean
        reporting: boolean
      }
      training: {
        securityAwareness: number
        complianceTraining: number
        incidentResponse: number
        lastTrainingDate: string
      }
    }
    
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high' | 'critical'
      riskFactors: Array<{
        factor: string
        category: 'security' | 'privacy' | 'regulatory' | 'operational'
        severity: 'critical' | 'high' | 'medium' | 'low'
        likelihood: 'very-high' | 'high' | 'medium' | 'low' | 'very-low'
        impact: string
        mitigation: string
        timeline: string
        owner: string
      }>
    }
    
    remediationPlan: Array<{
      priority: number
      item: string
      category: string
      effort: string
      timeline: string
      cost: number
      impact: string
      dependencies: string[]
    }>
    
    recommendations: string[]
  }
}

export function ComplianceAudit({ data }: ComplianceAuditProps) {
  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'certified':
      case 'met':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'partial':
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'non-compliant':
      case 'not-met':
      case 'not-started':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'planned':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'certified':
      case 'met':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'partial':
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'non-compliant':
      case 'not-met':
      case 'not-started':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
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
    <section id="compliance-audit" className="space-y-8">
      <div className="border-l-4 border-red-500 pl-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Compliance & Security Audit</h2>
        <p className="text-gray-600">
          Comprehensive compliance assessment covering security frameworks, data protection, and regulatory requirements
        </p>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Compliance</p>
                <p className={`text-2xl font-bold ${getComplianceColor(data.overallComplianceScore)}`}>
                  {data.overallComplianceScore}/100
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Compliance</p>
                <p className={`text-2xl font-bold ${getComplianceColor(data.securityCompliance.overallScore)}`}>
                  {data.securityCompliance.overallScore}/100
                </p>
              </div>
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Protection</p>
                <p className={`text-2xl font-bold ${getComplianceColor(data.dataProtectionCompliance.overallScore)}`}>
                  {data.dataProtectionCompliance.overallScore}/100
                </p>
              </div>
              <Database className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Audit Readiness</p>
                <p className={`text-2xl font-bold ${getComplianceColor(data.auditReadiness.overallScore)}`}>
                  {data.auditReadiness.overallScore}/100
                </p>
              </div>
              <FileCheck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Compliance Frameworks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Compliance Frameworks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.securityCompliance.frameworks.map((framework, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{framework.framework}</h4>
                    <Badge variant="outline" className={getStatusColor(framework.status)}>
                      {framework.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <span className={`text-sm font-medium ${getComplianceColor(framework.score)}`}>
                      {framework.score}/100
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Last Audit: {framework.lastAudit} | Next: {framework.nextAudit}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium mb-3">Requirements Status</h5>
                    <div className="space-y-2">
                      {framework.requirements.map((req, reqIndex) => (
                        <div key={reqIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(req.status)}
                            <span className="text-sm">{req.requirement}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getRiskColor(req.riskLevel)}>
                              {req.riskLevel.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-3">Critical Gaps</h5>
                    {framework.criticalGaps.length > 0 ? (
                      <div className="space-y-2">
                        {framework.criticalGaps.map((gap, gapIndex) => (
                          <div key={gapIndex} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <span className="text-sm text-red-800">{gap}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">No critical gaps identified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Protection Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Protection & Privacy Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Regulatory Compliance</h4>
              <div className="space-y-3">
                {data.dataProtectionCompliance.regulations.map((regulation, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{regulation.regulation}</span>
                        {getStatusIcon(regulation.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(regulation.applicability)}>
                          {regulation.applicability.replace('-', ' ')}
                        </Badge>
                        <span className="text-sm">{regulation.score}/100</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      Data Types: {regulation.dataTypes.join(', ')}
                    </div>
                    <div className="space-y-1">
                      {regulation.controls.map((control, controlIndex) => (
                        <div key={controlIndex} className="flex items-center justify-between text-xs">
                          <span>{control.control}</span>
                          <div className="flex items-center gap-2">
                            {control.implemented ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-600" />
                            )}
                            <span>{control.effectiveness}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Data Inventory & Controls</h4>
              <div className="space-y-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{data.dataProtectionCompliance.dataInventory.personalDataTypes}</p>
                  <p className="text-sm text-blue-800">Personal Data Types Identified</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Data Retention Policies</span>
                    {data.dataProtectionCompliance.dataInventory.dataRetentionPolicies ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Data Minimization</span>
                    {data.dataProtectionCompliance.dataInventory.dataMinimization ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Consent Management</span>
                    {data.dataProtectionCompliance.dataInventory.consentManagement ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Right to Erasure</span>
                    {data.dataProtectionCompliance.dataInventory.rightToErasure ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Access Control & Identity Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-4">User Access Management</h4>
              <div className="space-y-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{data.accessControlAudit.userAccess.totalUsers}</p>
                  <p className="text-sm text-blue-800">Total Users</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Privileged Users</span>
                    <span className="font-medium">{data.accessControlAudit.userAccess.privilegedUsers}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Inactive Users</span>
                    <span className="font-medium text-red-600">{data.accessControlAudit.userAccess.inactiveUsers}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">MFA Adoption</span>
                    <span className="font-medium">{data.accessControlAudit.userAccess.mfaAdoption}%</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Password Policy</span>
                    {data.accessControlAudit.userAccess.passwordPolicy ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">System Access</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Admin Accounts</span>
                    <span className="font-medium">{data.accessControlAudit.systemAccess.adminAccounts}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Service Accounts</span>
                    <span className="font-medium">{data.accessControlAudit.systemAccess.serviceAccounts}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Shared Accounts</span>
                    <span className="font-medium text-red-600">{data.accessControlAudit.systemAccess.sharedAccounts}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Access Logging</span>
                    {data.accessControlAudit.systemAccess.accessLogging ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Session Management</span>
                    {data.accessControlAudit.systemAccess.sessionManagement ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Data Access Controls</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Data Classification</span>
                    {data.accessControlAudit.dataAccess.dataClassification ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Access Controls</span>
                    {data.accessControlAudit.dataAccess.accessControls ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Encryption at Rest</span>
                    {data.accessControlAudit.dataAccess.encryptionAtRest ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Encryption in Transit</span>
                    {data.accessControlAudit.dataAccess.encryptionInTransit ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Backup Security</span>
                    {data.accessControlAudit.dataAccess.backupSecurity ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
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
            Compliance Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg font-semibold">Overall Risk Level:</span>
              <Badge variant="outline" className={getRiskColor(data.riskAssessment.overallRisk)}>
                {data.riskAssessment.overallRisk.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            {data.riskAssessment.riskFactors.map((risk, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{risk.factor}</h4>
                      <Badge variant="outline" className={getRiskColor(risk.severity)}>
                        {risk.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getRiskColor(risk.likelihood)}>
                        {risk.likelihood.replace('-', ' ').toUpperCase()} LIKELIHOOD
                      </Badge>
                      <span className="text-sm text-gray-600 capitalize">{risk.category}</span>
                    </div>
                    <p className="text-gray-600 mb-2">{risk.impact}</p>
                    <div className="text-sm text-gray-600">
                      Owner: {risk.owner} | Timeline: {risk.timeline}
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

      {/* Remediation Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Compliance Remediation Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.remediationPlan.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {item.priority}
                      </div>
                      <h4 className="font-semibold">{item.item}</h4>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{item.impact}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Effort:</span> {item.effort}
                      </div>
                      <div>
                        <span className="font-medium">Timeline:</span> {item.timeline}
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span> {formatCurrency(item.cost)}
                      </div>
                    </div>
                  </div>
                </div>
                {item.dependencies.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Dependencies:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.dependencies.map((dep, depIndex) => (
                        <Badge key={depIndex} variant="outline" className="text-xs">
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

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
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