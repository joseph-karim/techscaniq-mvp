import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Sparkles, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { generateLangGraphReport, checkReportStatus } from '@/services/langgraph-reports'

export default function GenerateLangGraphReport() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [company, setCompany] = useState('')
  const [website, setWebsite] = useState('')
  const [reportType, setReportType] = useState<'sales-intelligence' | 'pe-due-diligence'>('sales-intelligence')
  
  // Sales Intelligence specific
  const [vendor, setVendor] = useState('Adobe')
  const [products, setProducts] = useState('Adobe Experience Cloud, Real-Time CDP, Journey Optimizer')
  const [useCase, setUseCase] = useState('')
  
  // PE Due Diligence specific
  const [investmentThesis, setInvestmentThesis] = useState('')
  const [keyQuestions, setKeyQuestions] = useState('')
  const [focusAreas, setFocusAreas] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setReportId(null)
    setStatus(null)

    try {
      const params: any = {
        company,
        website,
        reportType,
      }

      if (reportType === 'sales-intelligence') {
        params.vendorContext = {
          vendor,
          products: products.split(',').map(p => p.trim()).filter(Boolean),
          useCase: useCase || undefined,
        }
      } else {
        params.thesisContext = {
          investmentThesis: investmentThesis || undefined,
          keyQuestions: keyQuestions.split('\n').filter(Boolean),
          focusAreas: focusAreas.split(',').map(f => f.trim()).filter(Boolean),
        }
      }

      const result = await generateLangGraphReport(params)
      setReportId(result.reportId)
      
      // Start polling for status
      pollStatus(result.reportId)
    } catch (err: any) {
      setError(err.message || 'Failed to generate report')
      setLoading(false)
    }
  }

  const pollStatus = async (id: string) => {
    let pollCount = 0
    let pollInterval: NodeJS.Timeout
    
    const poll = async () => {
      try {
        const statusData = await checkReportStatus(id)
        setStatus(statusData)
        
        if (statusData.status === 'completed') {
          clearInterval(pollInterval)
          setLoading(false)
          // Redirect to report view
          setTimeout(() => {
            navigate(`/admin/langgraph-report/${id}`)
          }, 2000)
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval)
          setLoading(false)
          setError(statusData.error || 'Report generation failed')
        } else {
          // Progressive polling: start frequent, then slow down
          pollCount++
          if (pollCount === 10) { // After 5 minutes (10 * 30s), switch to 1 minute
            clearInterval(pollInterval)
            pollInterval = setInterval(poll, 60000)
          } else if (pollCount === 20) { // After 15 minutes total, switch to 2 minutes
            clearInterval(pollInterval)
            pollInterval = setInterval(poll, 120000)
          }
        }
      } catch (err) {
        console.error('Error polling status:', err)
      }
    }
    
    // Start polling every 30 seconds initially
    poll() // First poll immediately
    pollInterval = setInterval(poll, 30000)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-electric-teal" />
            Generate LangGraph Report
          </h1>
          <p className="text-muted-foreground mt-2">
            Create AI-powered reports using deep research and comprehensive analysis
          </p>
        </div>

        {!reportId ? (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>
                  Configure the parameters for your AI-generated report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g., CIBC"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Company Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="e.g., https://www.cibc.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Report Type */}
                <div className="space-y-4">
                  <Label>Report Type</Label>
                  <RadioGroup value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <RadioGroupItem value="sales-intelligence" />
                        <div className="space-y-1">
                          <div className="font-medium">Sales Intelligence Report</div>
                          <div className="text-sm text-muted-foreground">
                            Analyze buying signals, technology stack, and vendor fit for B2B sales
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <RadioGroupItem value="pe-due-diligence" />
                        <div className="space-y-1">
                          <div className="font-medium">PE Due Diligence Report</div>
                          <div className="text-sm text-muted-foreground">
                            Technical and business assessment for private equity investment decisions
                          </div>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Report Type Specific Fields */}
                {reportType === 'sales-intelligence' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Sales Context</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="vendor">Vendor Name</Label>
                        <Input
                          id="vendor"
                          value={vendor}
                          onChange={(e) => setVendor(e.target.value)}
                          placeholder="e.g., Adobe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="products">Products/Solutions (comma-separated)</Label>
                        <Input
                          id="products"
                          value={products}
                          onChange={(e) => setProducts(e.target.value)}
                          placeholder="e.g., Adobe Experience Cloud, Real-Time CDP"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="useCase">Use Case (optional)</Label>
                        <Textarea
                          id="useCase"
                          value={useCase}
                          onChange={(e) => setUseCase(e.target.value)}
                          placeholder="Describe the specific use case or value proposition..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {reportType === 'pe-due-diligence' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Investment Context</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="thesis">Investment Thesis (optional)</Label>
                        <Textarea
                          id="thesis"
                          value={investmentThesis}
                          onChange={(e) => setInvestmentThesis(e.target.value)}
                          placeholder="Describe the investment thesis or hypothesis..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="questions">Key Questions (one per line)</Label>
                        <Textarea
                          id="questions"
                          value={keyQuestions}
                          onChange={(e) => setKeyQuestions(e.target.value)}
                          placeholder="What is their competitive moat?&#10;How scalable is their technology?&#10;What are the main risks?"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="focus">Focus Areas (comma-separated)</Label>
                        <Input
                          id="focus"
                          value={focusAreas}
                          onChange={(e) => setFocusAreas(e.target.value)}
                          placeholder="e.g., Technology, Market Position, Team, Financials"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Time Estimate */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Report generation typically takes {reportType === 'sales-intelligence' ? '30-60' : '45-90'} minutes.
                    You'll be able to track progress and will be notified when complete.
                  </AlertDescription>
                </Alert>

                {/* Error Display */}
                {error && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <strong>Error:</strong> {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} size="lg">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        ) : (
          // Status Display
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Report Generation Status
                {status?.status === 'completed' && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                )}
                {status?.status === 'failed' && (
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Failed
                  </Badge>
                )}
                {status?.status && status.status !== 'completed' && status.status !== 'failed' && (
                  <Badge variant="secondary">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    {status.currentPhase}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Report ID: {reportId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{status?.progress || 0}%</span>
                </div>
                <Progress value={status?.progress || 0} className="h-3" />
              </div>

              {/* Status Details */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Phase</p>
                  <p className="font-medium">{status?.currentPhase || 'Initializing'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Evidence Collected</p>
                  <p className="font-medium">{status?.evidenceCount || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Time Remaining</p>
                  <p className="font-medium">{status?.estimatedTimeRemaining || 'Calculating...'}</p>
                </div>
              </div>

              {/* Success Message */}
              {status?.status === 'completed' && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>Success!</strong> Your report has been generated. Redirecting to view...
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {status?.status === 'completed' && (
                  <Button onClick={() => navigate(`/admin/langgraph-report/${reportId}`)}>
                    View Report
                  </Button>
                )}
                {status?.status !== 'completed' && status?.status !== 'failed' && (
                  <Button variant="outline" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </Button>
                )}
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Generate Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}