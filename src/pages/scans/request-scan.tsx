import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Globe, Info, Target, TrendingUp, Briefcase, ShoppingCart } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/auth/auth-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ThesisTagSelector } from '@/components/scans/thesis-tag-selector'
import { InvestmentThesisSelector, type InvestmentThesisData } from '@/components/scans/investment-thesis-selector'

const requestScanSchema = z.object({
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  websiteUrl: z.string().url({ message: 'Please enter a valid URL' }),
  description: z.string().optional(),
  reportType: z.enum(['pe-due-diligence', 'sales-intelligence']).default('pe-due-diligence'),
  thesisTags: z.array(z.string()).optional(), // Made optional since we now use investment thesis
  primaryCriteria: z.string().max(200, { message: 'Primary criteria must be 200 characters or less' }).optional(),
  secondaryCriteria: z.string().max(200, { message: 'Secondary criteria must be 200 characters or less' }).optional(),
  // Sales Intelligence specific fields
  vendorOffering: z.string().optional(),
  targetIndustry: z.string().optional(),
  targetCompanySize: z.string().optional(),
  targetGeography: z.string().optional(),
  salesUseCases: z.array(z.string()).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  evaluationTimeline: z.string().optional(),
})

type RequestScanForm = z.infer<typeof requestScanSchema>

export default function RequestScanPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  // Initialize with default thesis instead of null
  const [investmentThesis, setInvestmentThesis] = useState<InvestmentThesisData>(() => ({
    thesisType: 'accelerate-organic-growth',
    criteria: [
      { id: 'criterion-0', name: 'Cloud Architecture Scalability', weight: 30, description: 'Auto-scaling capabilities, microservices architecture, infrastructure headroom for 10x growth' },
      { id: 'criterion-1', name: 'Development Velocity & Pipeline', weight: 25, description: 'CI/CD maturity, test coverage, deployment frequency, feature delivery speed' },
      { id: 'criterion-2', name: 'Market Expansion Readiness', weight: 25, description: 'Geographic reach, customer acquisition systems, product-market fit indicators' },
      { id: 'criterion-3', name: 'Code Quality & Technical Debt', weight: 20, description: 'Modular architecture, maintainability, technical debt burden affecting velocity' }
    ],
    focusAreas: ['cloud-native', 'scalable-architecture', 'devops-maturity', 'test-coverage', 'microservices'],
    timeHorizon: '3-5 years',
    targetMultiple: '5-10x',
    notes: ''
  }))
  
  const handleInvestmentThesisChange = (newThesis: InvestmentThesisData) => {
    // Debounce: ignore if trying to set the same value
    if (newThesis.thesisType === investmentThesis.thesisType) {
      return
    }
    
    setInvestmentThesis(newThesis)
  }

  // Handle navigation after successful submission
  useEffect(() => {
    if (success) {
      console.log('Success detected, setting up navigation...')
      const timeoutId = setTimeout(() => {
        console.log('Navigating to /reports...')
        navigate('/reports')
      }, 2000)
      
      // Cleanup timeout if component unmounts
      return () => {
        console.log('Cleaning up navigation timeout')
        clearTimeout(timeoutId)
      }
    }
  }, [success, navigate])

  const form = useForm<RequestScanForm>({
    resolver: zodResolver(requestScanSchema),
    defaultValues: {
      companyName: '',
      websiteUrl: '',
      description: '',
      reportType: 'pe-due-diligence',
      thesisTags: [],
      primaryCriteria: '',
      secondaryCriteria: '',
      vendorOffering: '',
      targetIndustry: '',
      targetCompanySize: '',
      targetGeography: '',
      salesUseCases: [],
      budgetMin: undefined,
      budgetMax: undefined,
      evaluationTimeline: '',
    },
  })

  async function onSubmit(data: RequestScanForm) {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    // Investment thesis is now always available (initialized with default)
    // No validation needed since it can't be null
    
    try {
      // Prepare metadata based on report type
      let metadata: any = {
        report_type: data.reportType,
      }
      
      if (data.reportType === 'sales-intelligence') {
        metadata.sales_context = {
          company: data.companyName,
          offering: data.vendorOffering || '',
          idealCustomerProfile: {
            industry: data.targetIndustry,
            companySize: data.targetCompanySize,
            geography: data.targetGeography,
          },
          useCases: data.salesUseCases || [],
          budgetRange: (data.budgetMin || data.budgetMax) ? {
            min: data.budgetMin,
            max: data.budgetMax,
            currency: 'USD',
          } : undefined,
          evaluationTimeline: data.evaluationTimeline,
        }
      }

      // Create the scan request in the database
      const { data: scanRequest, error: dbError } = await supabase
        .from('scan_requests')
        .insert({
          company_name: data.companyName,
          website_url: data.websiteUrl,
          company_description: data.description || null,
          thesis_tags: data.thesisTags || investmentThesis.focusAreas || [],
          primary_criteria: data.primaryCriteria || investmentThesis.criteria?.[0]?.description || '',
          secondary_criteria: data.secondaryCriteria || investmentThesis.criteria?.[1]?.description || null,
          requested_by: user?.id,
          requestor_name: user?.user_metadata?.name || user?.email || 'Unknown',
          organization_name: user?.user_metadata?.workspace_name || 'Unknown Organization',
          status: 'pending',
          report_type: data.reportType,
          sections: [],
          risks: [],
          metadata: metadata,
          investment_thesis_data: data.reportType === 'pe-due-diligence' ? {
            ...investmentThesis,
            thesis_tags: data.thesisTags || investmentThesis.focusAreas || [],
            primary_criteria: data.primaryCriteria || investmentThesis.criteria?.[0]?.description || '',
            secondary_criteria: data.secondaryCriteria || investmentThesis.criteria?.[1]?.description || '',
            submitted_at: new Date().toISOString()
          } : null
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Also trigger via API for background processing
      console.log('✅ Scan request created:', scanRequest.id)
      console.log('🚀 Triggering background processing...')
      
      // Call the API to start background processing
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: data.companyName,
          website_url: data.websiteUrl,
          company_description: data.description,
          report_type: data.reportType,
          metadata: metadata,
          thesis_tags: data.thesisTags || investmentThesis.focusAreas || [],
          primary_criteria: data.primaryCriteria || investmentThesis.criteria?.[0]?.description || '',
          requestor_name: user?.user_metadata?.name || user?.email || 'Unknown',
          organization_name: user?.user_metadata?.workspace_name || 'Unknown Organization',
          investment_thesis_data: data.reportType === 'pe-due-diligence' ? investmentThesis : null,
        }),
      })
      
      if (!response.ok) {
        console.error('⚠️ Background processing initiation failed')
        // Don't throw error - scan is created, just background processing failed
      } else {
        console.log('✅ Background processing initiated successfully')
      }
      
      // Call the report orchestrator to start analysis
      const { data: reportResult, error: reportError } = await supabase.functions.invoke('report-orchestrator-v3', {
        body: {
          scan_request_id: scanRequest.id,
          analysisDepth: 'comprehensive'
        }
      })

      if (reportError) {
        console.error('⚠️ Report generation failed:', reportError)
        // Don't throw error - scan is created, just report generation failed
        // User can still see the scan in their list and it can be manually triggered
      } else {
        console.log('✅ Report generation initiated successfully')
        console.log('📊 Report ID:', reportResult.reportId)
      }
      
      // Success
      setSuccess(true)
      form.reset()
      // Reset to default thesis
      setInvestmentThesis({
        thesisType: 'accelerate-organic-growth',
        criteria: [
          { id: 'criterion-0', name: 'Cloud Architecture Scalability', weight: 30, description: 'Auto-scaling capabilities, microservices architecture, infrastructure headroom for 10x growth' },
          { id: 'criterion-1', name: 'Development Velocity & Pipeline', weight: 25, description: 'CI/CD maturity, test coverage, deployment frequency, feature delivery speed' },
          { id: 'criterion-2', name: 'Market Expansion Readiness', weight: 25, description: 'Geographic reach, customer acquisition systems, product-market fit indicators' },
          { id: 'criterion-3', name: 'Code Quality & Technical Debt', weight: 20, description: 'Modular architecture, maintainability, technical debt burden affecting velocity' }
        ],
        focusAreas: ['cloud-native', 'scalable-architecture', 'devops-maturity', 'test-coverage', 'microservices'],
        timeHorizon: '3-5 years',
        targetMultiple: '5-10x',
        notes: ''
      })
      
      // Navigation will be handled by useEffect
    } catch (err) {
      setError('Failed to submit scan request. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request a Scan</h1>
        <p className="text-muted-foreground">
          Submit a request for PE due diligence or sales intelligence analysis on a target company
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Scan request submitted successfully!</p>
              <p className="text-sm">Your request for {form.getValues('companyName')} has been added to the queue. The technical analysis will begin shortly.</p>
              <p className="text-sm">Redirecting to your reports dashboard...</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Company Details
          </TabsTrigger>
          <TabsTrigger value="context" className="flex items-center gap-2">
            {form.watch('reportType') === 'pe-due-diligence' ? (
              <>
                <TrendingUp className="h-4 w-4" />
                Investment Thesis
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Sales Context
              </>
            )}
          </TabsTrigger>
          <TabsTrigger value="criteria" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Additional Criteria
          </TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Target Company Information</CardTitle>
                  <CardDescription>
                    Enter basic information about the company you want to analyze
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Ring4, Acme Technologies, etc." {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the full legal name of the target company
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <div className="flex items-center rounded-md border bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <span className="flex select-none items-center px-3 text-muted-foreground">
                              <Globe className="mr-1 h-4 w-4" />
                            </span>
                            <Input 
                              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" 
                              type="url" 
                              placeholder="https://ring4.com" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The main website or product URL for the company
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the company, their products, target market, and business model..."
                            className="min-h-[100px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional context about the company and their technology that will help focus the analysis
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a report type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pe-due-diligence">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                PE Due Diligence
                              </div>
                            </SelectItem>
                            <SelectItem value="sales-intelligence">
                              <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Sales Intelligence
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the type of analysis report you need
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="context" className="space-y-6">
              {form.watch('reportType') === 'pe-due-diligence' ? (
                <InvestmentThesisSelector 
                  value={investmentThesis}
                  onChange={handleInvestmentThesisChange}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Intelligence Context</CardTitle>
                    <CardDescription>
                      Configure your solution and target customer profile for sales intelligence analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="vendorOffering"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Product/Service Offering</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Cloud Infrastructure Platform, Data Analytics Solution"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The solution you're selling to this prospect
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Ideal Customer Profile</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="targetIndustry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Industry</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Financial Services, Healthcare"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="targetCompanySize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Size</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 1000-5000 employees"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="targetGeography"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Geography</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., North America, EMEA"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="evaluationTimeline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Evaluation Timeline</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Q1 2024, 3-6 months"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="salesUseCases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Use Cases</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter use cases (one per line)&#10;e.g.:&#10;- Real-time data processing&#10;- Customer analytics&#10;- Predictive maintenance"
                              className="min-h-[100px]"
                              onChange={(e) => {
                                const useCases = e.target.value.split('\n').filter(Boolean).map(uc => uc.replace(/^[-•]\s*/, ''))
                                field.onChange(useCases)
                              }}
                              value={field.value?.join('\n') || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Specific use cases your solution addresses
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Budget Range (Optional)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="budgetMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum ($K)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="100"
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="budgetMax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum ($K)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="500"
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="criteria" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Legacy Thesis Tags & Criteria</CardTitle>
                  <CardDescription>
                    Additional technical criteria and tags for backward compatibility with existing workflows
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="thesisTags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technical Focus Tags</FormLabel>
                        <FormControl>
                          <ThesisTagSelector 
                            value={field.value || []}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Select specific technical areas that are most important for your evaluation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="primaryCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Technical Criteria</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., 'We invest in companies with scalable architecture that can handle 10x growth'"
                            className="min-h-[100px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your most important technical evaluation criteria (max 200 chars)
                          <div className="mt-1 text-right text-xs">
                            {(field.value || '').length}/200 characters
                          </div>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="secondaryCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Technical Criteria (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., 'We prefer teams using modern frameworks and CI/CD practices'"
                            className="min-h-[100px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional technical criteria to consider (max 200 chars)
                          <div className="mt-1 text-right text-xs">
                            {field.value?.length || 0}/200 characters
                          </div>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {form.watch('reportType') === 'pe-due-diligence' ? (
                    investmentThesis ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Investment thesis configured: {investmentThesis.thesisType === 'custom' ? investmentThesis.customThesisName || 'Custom Thesis' : investmentThesis.thesisType}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Please configure your investment thesis in the previous tab
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Sales intelligence context configured
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || (form.watch('reportType') === 'pe-due-diligence' && !investmentThesis)}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Scan Request'}
                </Button>
              </div>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}