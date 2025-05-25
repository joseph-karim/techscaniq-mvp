import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calculator,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface FinancialMetricsProps {
  data: {
    companyName: string
    analysisDate: string
    reportingPeriod: string
    overallFinancialHealth: number
    
    revenueMetrics: {
      totalRevenue: number
      recurringRevenue: number
      growthRate: number
      churnRate: number
      ltv: number
      cac: number
      ltvCacRatio: number
      paybackPeriod: number
      revenueStreams: Array<{
        stream: string
        amount: number
        percentage: number
        growth: number
        margin: number
      }>
    }
    
    operationalCosts: {
      totalCosts: number
      costBreakdown: Array<{
        category: string
        amount: number
        percentage: number
        trend: 'increasing' | 'decreasing' | 'stable'
        efficiency: number
      }>
      costPerCustomer: number
      grossMargin: number
      operatingMargin: number
      ebitdaMargin: number
    }
    
    unitEconomics: {
      averageRevenuePerUser: number
      customerLifetimeValue: number
      customerAcquisitionCost: number
      grossMarginPerCustomer: number
      paybackPeriodMonths: number
      cohortAnalysis: Array<{
        cohort: string
        month0: number
        month3: number
        month6: number
        month12: number
        retentionRate: number
      }>
    }
    
    technologyCosts: {
      totalTechSpend: number
      cloudInfrastructure: number
      softwareLicenses: number
      developmentTools: number
      securityTools: number
      costPerUser: number
      costOptimizationOpportunities: Array<{
        area: string
        currentCost: number
        optimizedCost: number
        savings: number
        effort: string
        timeline: string
      }>
    }
    
    profitabilityAnalysis: {
      grossProfit: number
      operatingProfit: number
      netProfit: number
      profitMargins: {
        gross: number
        operating: number
        net: number
      }
      breakEvenAnalysis: {
        monthsToBreakEven: number
        breakEvenRevenue: number
        currentRunRate: number
        burnRate: number
      }
    }
    
    cashFlowAnalysis: {
      operatingCashFlow: number
      freeCashFlow: number
      cashBurnRate: number
      runwayMonths: number
      workingCapital: number
      cashConversionCycle: number
      seasonalityImpact: Array<{
        quarter: string
        revenue: number
        cashFlow: number
        variance: number
      }>
    }
    
    investmentMetrics: {
      totalFunding: number
      lastRoundValuation: number
      revenueMultiple: number
      growthEfficiency: number
      capitalEfficiency: number
      investmentInTech: number
      techInvestmentRoi: number
    }
    
    riskFactors: Array<{
      factor: string
      severity: 'high' | 'medium' | 'low'
      impact: string
      mitigation: string
      financialImpact: number
    }>
    
    recommendations: string[]
  }
}

export function FinancialMetrics({ data }: FinancialMetricsProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'decreasing': return <ArrowDownRight className="h-4 w-4 text-green-600" />
      default: return <div className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <section id="financial-metrics" className="space-y-8">
      <div className="border-l-4 border-blue-500 pl-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Financial & Operational Metrics</h2>
        <p className="text-gray-600">
          Comprehensive financial analysis with unit economics, cost optimization, and profitability assessment
        </p>
      </div>

      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Financial Health</p>
                <p className={`text-2xl font-bold ${getHealthColor(data.overallFinancialHealth)}`}>
                  {data.overallFinancialHealth}/100
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.revenueMetrics.totalRevenue)}</p>
                <p className="text-xs text-green-600">+{data.revenueMetrics.growthRate}% growth</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">LTV:CAC Ratio</p>
                <p className="text-2xl font-bold text-gray-900">{data.revenueMetrics.ltvCacRatio.toFixed(1)}:1</p>
                <p className="text-xs text-gray-500">Payback: {data.revenueMetrics.paybackPeriod}mo</p>
              </div>
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gross Margin</p>
                <p className="text-2xl font-bold text-gray-900">{data.operationalCosts.grossMargin}%</p>
                <p className="text-xs text-gray-500">Operating: {data.operationalCosts.operatingMargin}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Analysis & Growth Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Key Revenue Metrics</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(data.revenueMetrics.recurringRevenue)}</p>
                    <p className="text-sm text-blue-800">Recurring Revenue</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-600">{data.revenueMetrics.growthRate}%</p>
                    <p className="text-sm text-green-800">Growth Rate</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(data.revenueMetrics.ltv)}</p>
                    <p className="text-sm text-purple-800">LTV</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(data.revenueMetrics.cac)}</p>
                    <p className="text-sm text-orange-800">CAC</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Churn Rate</span>
                    <span className="text-sm font-bold text-red-600">{data.revenueMetrics.churnRate}%</span>
                  </div>
                  <Progress value={100 - data.revenueMetrics.churnRate} className="h-2" />
                  <p className="text-xs text-gray-600 mt-1">Retention: {(100 - data.revenueMetrics.churnRate).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Revenue Streams</h4>
              <div className="space-y-3">
                {data.revenueMetrics.revenueStreams.map((stream, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{stream.stream}</span>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(stream.amount)}</p>
                        <p className="text-xs text-gray-600">{stream.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Growth:</span>
                        <span className={`font-medium ${stream.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stream.growth >= 0 ? '+' : ''}{stream.growth}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-medium">{stream.margin}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Operational Cost Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Cost Breakdown</h4>
              <div className="space-y-3">
                {data.operationalCosts.costBreakdown.map((cost, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cost.category}</span>
                        {getTrendIcon(cost.trend)}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(cost.amount)}</p>
                        <p className="text-xs text-gray-600">{cost.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Efficiency Score</span>
                      <div className="flex items-center gap-2">
                        <Progress value={cost.efficiency} className="h-2 w-20" />
                        <span className="text-sm font-medium">{cost.efficiency}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Profitability Metrics</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Gross Margin</span>
                    <span className="text-lg font-bold text-green-600">{data.operationalCosts.grossMargin}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Operating Margin</span>
                    <span className="text-lg font-bold text-blue-600">{data.operationalCosts.operatingMargin}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">EBITDA Margin</span>
                    <span className="text-lg font-bold text-purple-600">{data.operationalCosts.ebitdaMargin}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium">Cost per Customer</span>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(data.operationalCosts.costPerCustomer)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Economics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Unit Economics & Cohort Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Key Unit Economics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">ARPU</span>
                  <span className="font-bold">{formatCurrency(data.unitEconomics.averageRevenuePerUser)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Customer LTV</span>
                  <span className="font-bold">{formatCurrency(data.unitEconomics.customerLifetimeValue)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">CAC</span>
                  <span className="font-bold">{formatCurrency(data.unitEconomics.customerAcquisitionCost)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Gross Margin per Customer</span>
                  <span className="font-bold">{formatCurrency(data.unitEconomics.grossMarginPerCustomer)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Payback Period</span>
                  <span className="font-bold">{data.unitEconomics.paybackPeriodMonths} months</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Cohort Retention Analysis</h4>
              <div className="space-y-3">
                {data.unitEconomics.cohortAnalysis.map((cohort, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{cohort.cohort}</span>
                      <span className="text-sm text-gray-600">Retention: {cohort.retentionRate}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-medium">{formatCurrency(cohort.month0)}</p>
                        <p className="text-gray-600">Month 0</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{formatCurrency(cohort.month3)}</p>
                        <p className="text-gray-600">Month 3</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{formatCurrency(cohort.month6)}</p>
                        <p className="text-gray-600">Month 6</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{formatCurrency(cohort.month12)}</p>
                        <p className="text-gray-600">Month 12</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Technology Cost Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Technology Spend Breakdown</h4>
              <div className="space-y-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg mb-4">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.technologyCosts.totalTechSpend)}</p>
                  <p className="text-sm text-blue-800">Total Tech Spend</p>
                  <p className="text-xs text-gray-600">{formatCurrency(data.technologyCosts.costPerUser)} per user</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Cloud Infrastructure</span>
                    <span className="font-medium">{formatCurrency(data.technologyCosts.cloudInfrastructure)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Software Licenses</span>
                    <span className="font-medium">{formatCurrency(data.technologyCosts.softwareLicenses)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Development Tools</span>
                    <span className="font-medium">{formatCurrency(data.technologyCosts.developmentTools)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Security Tools</span>
                    <span className="font-medium">{formatCurrency(data.technologyCosts.securityTools)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Cost Optimization Opportunities</h4>
              <div className="space-y-3">
                {data.technologyCosts.costOptimizationOpportunities.map((opportunity, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{opportunity.area}</span>
                      <span className="text-sm font-bold text-green-600">
                        Save {formatCurrency(opportunity.savings)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                      <div>Current: {formatCurrency(opportunity.currentCost)}</div>
                      <div>Optimized: {formatCurrency(opportunity.optimizedCost)}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Effort: {opportunity.effort}</span>
                      <span>Timeline: {opportunity.timeline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cash Flow & Runway Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Cash Flow Metrics</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(data.cashFlowAnalysis.operatingCashFlow)}</p>
                    <p className="text-sm text-green-800">Operating Cash Flow</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(data.cashFlowAnalysis.freeCashFlow)}</p>
                    <p className="text-sm text-blue-800">Free Cash Flow</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-lg font-bold text-red-600">{formatCurrency(data.cashFlowAnalysis.cashBurnRate)}</p>
                    <p className="text-sm text-red-800">Monthly Burn Rate</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">{data.cashFlowAnalysis.runwayMonths}</p>
                    <p className="text-sm text-purple-800">Runway (Months)</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Working Capital</span>
                    <span className="font-medium">{formatCurrency(data.cashFlowAnalysis.workingCapital)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Cash Conversion Cycle</span>
                    <span className="font-medium">{data.cashFlowAnalysis.cashConversionCycle} days</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Seasonal Cash Flow Impact</h4>
              <div className="space-y-3">
                {data.cashFlowAnalysis.seasonalityImpact.map((quarter, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{quarter.quarter}</span>
                      <span className={`text-sm font-medium ${quarter.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {quarter.variance >= 0 ? '+' : ''}{quarter.variance}% variance
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Revenue: </span>
                        <span className="font-medium">{formatCurrency(quarter.revenue)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Cash Flow: </span>
                        <span className="font-medium">{formatCurrency(quarter.cashFlow)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Financial Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.riskFactors.map((risk, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{risk.factor}</h4>
                      <Badge variant="outline" className={getSeverityColor(risk.severity)}>
                        {risk.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Impact: {formatCurrency(risk.financialImpact)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{risk.impact}</p>
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
          <CardTitle>Financial Optimization Recommendations</CardTitle>
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