import { useState } from 'react'
import { 
  ChevronDown, 
  AlertTriangle, 
  CheckCircle,
  Target,
  Calendar,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { InlineCitation, Citation } from '@/components/reports/EvidenceCitation'
import { cn } from '@/lib/utils'

interface ExecutiveSummaryProps {
  data: {
    companyName: string
    evaluationDate: string
    overallScore: number
    investmentThesis: string
    keyFindings: {
      enablers: string[]
      blockers: string[]
      risks: string[]
    }
    recommendations: string[]
    dealBreakers: string[]
  }
  citations?: Citation[]
  onCitationClick?: (citation: Citation) => void
}

export function ExecutiveSummary({ data, citations = [], onCitationClick }: ExecutiveSummaryProps) {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    keyFindings: true,
    recommendations: false,
    dealBreakers: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  return (
    <div id="executive-summary" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{data.companyName}</h1>
        <p className="text-lg text-muted-foreground">Technical Stack Diligence Report</p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className={cn("text-3xl font-bold", getScoreColor(data.overallScore))}>
                  {data.overallScore}%
                </p>
                <Badge variant="outline" className="mt-1">
                  Grade: {getScoreGrade(data.overallScore)}
                </Badge>
              </div>
              <div className={cn(
                "rounded-full p-3",
                data.overallScore >= 70 ? "bg-green-100" : "bg-red-100"
              )}>
                {data.overallScore >= 70 ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Evaluation Date</p>
                <p className="text-lg font-semibold">{data.evaluationDate}</p>
              </div>
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deal Confidence</p>
                <Progress value={data.overallScore} className="mt-2 h-2" />
              </div>
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investment Fit</p>
                <p className="text-lg font-semibold">
                  {data.dealBreakers.length === 0 ? 'Strong' : 'Conditional'}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Thesis */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('overview')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Investment Thesis Overview</CardTitle>
              <CardDescription>Strategic alignment with investment criteria</CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.overview && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.overview && (
          <CardContent>
            <div className="text-sm leading-relaxed space-y-3">
              <p>
                {data.companyName} demonstrates exceptional technical execution with{' '}
                <InlineCitation 
                  citationId="dd2" 
                  citation={citations.find(c => c.id === 'dd2')!}
                  onCitationClick={onCitationClick}
                >
                  internal access revealing sophisticated engineering practices
                </InlineCitation>
                ,{' '}
                <InlineCitation 
                  citationId="dd3" 
                  citation={citations.find(c => c.id === 'dd3')!}
                  onCitationClick={onCitationClick}
                >
                  robust security implementations
                </InlineCitation>
                , and clear scalability roadmap.
              </p>
              <p>
                The deep dive analysis confirms{' '}
                <InlineCitation 
                  citationId="dd1" 
                  citation={citations.find(c => c.id === 'dd1')!}
                  onCitationClick={onCitationClick}
                >
                  strong operational fundamentals with 99.97% uptime
                </InlineCitation>
                {' '}and identifies{' '}
                <InlineCitation 
                  citationId="dd8" 
                  citation={citations.find(c => c.id === 'dd8')!}
                  onCitationClick={onCitationClick}
                >
                  specific optimization opportunities worth $180k in annual savings
                </InlineCitation>
                .
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Key Findings */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('keyFindings')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Key Findings</CardTitle>
              <CardDescription>Critical insights from technical analysis</CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.keyFindings && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.keyFindings && (
          <CardContent className="space-y-4">
            {/* Enablers */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-600">Enablers</h4>
                <Badge variant="outline" className="bg-green-50">
                  {data.keyFindings.enablers.length}
                </Badge>
              </div>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                  <span>
                    <InlineCitation 
                      citationId="dd1" 
                      citation={citations.find(c => c.id === 'dd1')!}
                      onCitationClick={onCitationClick}
                    >
                      Sophisticated microservices architecture with 99.97% uptime
                    </InlineCitation>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                  <span>
                    <InlineCitation 
                      citationId="dd3" 
                      citation={citations.find(c => c.id === 'dd3')!}
                      onCitationClick={onCitationClick}
                    >
                      Advanced security practices including zero-trust architecture
                    </InlineCitation>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                  <span>
                    <InlineCitation 
                      citationId="dd4" 
                      citation={citations.find(c => c.id === 'dd4')!}
                      onCitationClick={onCitationClick}
                    >
                      Automated testing coverage at 94% with comprehensive CI/CD
                    </InlineCitation>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                  <span>
                    <InlineCitation 
                      citationId="dd7" 
                      citation={citations.find(c => c.id === 'dd7')!}
                      onCitationClick={onCitationClick}
                    >
                      Strong engineering culture with detailed code review processes
                    </InlineCitation>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                  <span>Clear technical roadmap with quarterly OKRs and milestone tracking</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                  <span>
                    <InlineCitation 
                      citationId="dd8" 
                      citation={citations.find(c => c.id === 'dd8')!}
                      onCitationClick={onCitationClick}
                    >
                      Efficient cost management with $180k annual cloud optimization
                    </InlineCitation>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                  <span>Robust disaster recovery with 15-minute RTO/RPO targets</span>
                </li>
              </ul>
            </div>

            {/* Blockers */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h4 className="font-medium text-red-600">Blockers</h4>
                <Badge variant="outline" className="bg-red-50">
                  {data.keyFindings.blockers.length}
                </Badge>
              </div>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-600" />
                  <span>
                    <InlineCitation 
                      citationId="dd6" 
                      citation={citations.find(c => c.id === 'dd6')!}
                      onCitationClick={onCitationClick}
                    >
                      Legacy authentication service requires $120k modernization investment
                    </InlineCitation>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-600" />
                  <span>
                    <InlineCitation 
                      citationId="dd5" 
                      citation={citations.find(c => c.id === 'dd5')!}
                      onCitationClick={onCitationClick}
                    >
                      Database sharding needed for 10x scale ($200k implementation cost)
                    </InlineCitation>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-600" />
                  <span>Missing SOC2 Type II certification limiting enterprise sales</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-600" />
                  <span>Technical debt in payment processing system (6-month remediation)</span>
                </li>
              </ul>
            </div>

            {/* Risks */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <h4 className="font-medium text-yellow-600">Key Risks</h4>
                <Badge variant="outline" className="bg-yellow-50">
                  {data.keyFindings.risks.length}
                </Badge>
              </div>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-600" />
                  <span>
                    <InlineCitation 
                      citationId="dd9" 
                      citation={citations.find(c => c.id === 'dd9')!}
                      onCitationClick={onCitationClick}
                    >
                      Key person dependency on lead architect (succession planning needed)
                    </InlineCitation>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-600" />
                  <span>
                    <InlineCitation 
                      citationId="dd10" 
                      citation={citations.find(c => c.id === 'dd10')!}
                      onCitationClick={onCitationClick}
                    >
                      Vendor concentration risk with 70% infrastructure on single provider
                    </InlineCitation>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-600" />
                  <span>Compliance gaps for international expansion (GDPR, SOX readiness)</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-600" />
                  <span>Performance bottlenecks identified at 50k concurrent users</span>
                </li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('recommendations')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Strategic actions for value creation</CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.recommendations && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.recommendations && (
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge className="mt-0.5">{index + 1}</Badge>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {/* Deal Breakers */}
      {data.dealBreakers.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('dealBreakers')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-red-600">Potential Deal Breakers</CardTitle>
                <CardDescription>Critical issues requiring immediate attention</CardDescription>
              </div>
              <ChevronDown className={cn(
                "h-5 w-5 transition-transform text-red-600",
                expandedSections.dealBreakers && "rotate-180"
              )} />
            </div>
          </CardHeader>
          {expandedSections.dealBreakers && (
            <CardContent>
              <ul className="space-y-2">
                {data.dealBreakers.map((dealBreaker, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                    <span className="text-sm">{dealBreaker}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quick Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Continue reading for detailed technical analysis
        </p>
        <Button variant="outline" size="sm">
          View Key Insights <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 