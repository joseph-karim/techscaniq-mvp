import { useState } from 'react'
import { 
  ChevronDown, 
  Cloud,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Shield,
  DollarSign,
  Clock,
  Zap,
  Database,
  Globe
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface VendorDependency {
  name: string
  category: 'infrastructure' | 'communication' | 'payment' | 'analytics' | 'security' | 'development'
  criticality: 'critical' | 'high' | 'medium' | 'low'
  description: string
  monthlySpend: string
  contractTerms: string
  riskLevel: 'low' | 'medium' | 'high'
  alternatives: string[]
  migrationComplexity: 'low' | 'medium' | 'high'
  dataExposure: 'none' | 'limited' | 'moderate' | 'extensive'
}

interface CloudVendorDependenciesProps {
  data: {
    companyName: string
    overallRiskScore: number
    totalMonthlySpend: string
    vendorCount: number
    dependencies: VendorDependency[]
    riskAssessment: {
      singlePointsOfFailure: string[]
      vendorConcentrationRisk: string
      dataPrivacyRisks: string[]
      costOptimizationOpportunities: string[]
    }
    recommendations: string[]
    contingencyPlans: {
      criticalVendorFailure: string[]
      costEscalation: string[]
      dataBreachResponse: string[]
    }
  }
}

export function CloudVendorDependencies({ data }: CloudVendorDependenciesProps) {
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'infrastructure': return <Cloud className="h-4 w-4" />
      case 'communication': return <Globe className="h-4 w-4" />
      case 'payment': return <DollarSign className="h-4 w-4" />
      case 'analytics': return <Zap className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'development': return <Database className="h-4 w-4" />
      default: return <ExternalLink className="h-4 w-4" />
    }
  }

  return (
    <section id="cloud-vendor-dependencies" className="space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold">Cloud & Vendor Dependencies</h2>
        <p className="text-muted-foreground">
          Analysis of third-party service dependencies, vendor risk assessment, and mitigation strategies
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold">{data.overallRiskScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Spend</p>
                <p className="text-2xl font-bold">{data.totalMonthlySpend}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Vendors</p>
                <p className="text-2xl font-bold">{data.vendorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Critical Deps</p>
                <p className="text-2xl font-bold">
                  {data.dependencies.filter(d => d.criticality === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => toggleSection('dependencies')}
          >
            <Cloud className="h-5 w-5" />
            Vendor Dependencies Analysis
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.has('dependencies') ? "rotate-180" : ""
            )} />
          </CardTitle>
          <CardDescription>
            Detailed analysis of all third-party service dependencies
          </CardDescription>
        </CardHeader>
        {expandedSections.has('dependencies') && (
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {data.dependencies.map((vendor, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(vendor.category)}
                      <h4 className="font-medium">{vendor.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs', getCriticalityColor(vendor.criticality))}>
                        {vendor.criticality.toUpperCase()}
                      </Badge>
                      <Badge className={cn('text-xs', getRiskColor(vendor.riskLevel))}>
                        {vendor.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{vendor.description}</p>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Monthly Spend</p>
                      <p className="text-sm font-medium">{vendor.monthlySpend}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Contract Terms</p>
                      <p className="text-sm">{vendor.contractTerms}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Data Exposure</p>
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        vendor.dataExposure === 'none' ? 'text-green-600' :
                        vendor.dataExposure === 'limited' ? 'text-blue-600' :
                        vendor.dataExposure === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {vendor.dataExposure.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Migration Complexity</p>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={vendor.migrationComplexity === 'low' ? 25 : vendor.migrationComplexity === 'medium' ? 50 : 75} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-xs font-medium">{vendor.migrationComplexity.toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Alternatives Available</p>
                      <p className="text-xs">{vendor.alternatives.length} options: {vendor.alternatives.slice(0, 2).join(', ')}{vendor.alternatives.length > 2 ? '...' : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => toggleSection('risk-assessment')}
          >
            <AlertTriangle className="h-5 w-5" />
            Risk Assessment
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.has('risk-assessment') ? "rotate-180" : ""
            )} />
          </CardTitle>
        </CardHeader>
        {expandedSections.has('risk-assessment') && (
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-red-600 mb-3">Single Points of Failure</h4>
                <ul className="space-y-2">
                  {data.riskAssessment.singlePointsOfFailure.map((risk, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-600" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-yellow-600 mb-3">Data Privacy Risks</h4>
                <ul className="space-y-2">
                  {data.riskAssessment.dataPrivacyRisks.map((risk, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <Shield className="h-3 w-3 mt-0.5 flex-shrink-0 text-yellow-600" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Vendor Concentration Risk</h4>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">{data.riskAssessment.vendorConcentrationRisk}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-green-600 mb-3">Cost Optimization Opportunities</h4>
              <ul className="space-y-2">
                {data.riskAssessment.costOptimizationOpportunities.map((opportunity, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <DollarSign className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-600" />
                    {opportunity}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contingency Plans */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => toggleSection('contingency')}
          >
            <Shield className="h-5 w-5" />
            Contingency Plans
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              expandedSections.has('contingency') ? "rotate-180" : ""
            )} />
          </CardTitle>
        </CardHeader>
        {expandedSections.has('contingency') && (
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h4 className="font-medium text-red-600 mb-3">Critical Vendor Failure</h4>
                <ul className="space-y-2">
                  {data.contingencyPlans.criticalVendorFailure.map((plan, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <Clock className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-600" />
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-yellow-600 mb-3">Cost Escalation</h4>
                <ul className="space-y-2">
                  {data.contingencyPlans.costEscalation.map((plan, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <DollarSign className="h-3 w-3 mt-0.5 flex-shrink-0 text-yellow-600" />
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-blue-600 mb-3">Data Breach Response</h4>
                <ul className="space-y-2">
                  {data.contingencyPlans.dataBreachResponse.map((plan, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <Shield className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                      {plan}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Strategic Recommendations */}
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
    </section>
  )
} 