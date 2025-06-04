import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Globe, Info, Target, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/auth/auth-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  thesisTags: z.array(z.string()).optional(), // Made optional since we now use investment thesis
  primaryCriteria: z.string().max(200, { message: 'Primary criteria must be 200 characters or less' }).optional(),
  secondaryCriteria: z.string().max(200, { message: 'Secondary criteria must be 200 characters or less' }).optional(),
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
  
  // Debug logging for parent state changes with debouncing
  const handleInvestmentThesisChange = (newThesis: InvestmentThesisData) => {
    console.log('Parent: setInvestmentThesis called with:', newThesis.thesisType)
    console.log('Parent: current investmentThesis state:', investmentThesis.thesisType)
    console.trace('Parent: Call stack for setInvestmentThesis')
    
    // Debounce: ignore if trying to set the same value
    if (newThesis.thesisType === investmentThesis.thesisType) {
      console.log('Parent: Ignoring duplicate state change to:', newThesis.thesisType)
      return
    }
    
    setInvestmentThesis(newThesis)
    console.log('Parent: after setState call')
  }

  const form = useForm<RequestScanForm>({
    resolver: zodResolver(requestScanSchema),
    defaultValues: {
      companyName: '',
      websiteUrl: '',
      description: '',
      thesisTags: [],
      primaryCriteria: '',
      secondaryCriteria: '',
    },
  })

  async function onSubmit(data: RequestScanForm) {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    // Investment thesis is now always available (initialized with default)
    // No validation needed since it can't be null
    
    try {
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
          sections: [],
          risks: [],
          investment_thesis_data: {
            ...investmentThesis,
            thesis_tags: data.thesisTags || investmentThesis.focusAreas || [],
            primary_criteria: data.primaryCriteria || investmentThesis.criteria?.[0]?.description || '',
            secondary_criteria: data.secondaryCriteria || investmentThesis.criteria?.[1]?.description || '',
            submitted_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (dbError) throw dbError
      
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
      
      // Navigate to the scan details page after a short delay
      setTimeout(() => {
        navigate(`/scans/${scanRequest.id}`)
      }, 2000)
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
          Submit a request for technical due diligence on a target company with customized investment thesis analysis
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
            Scan request submitted successfully! You'll be notified when the analysis is complete.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Company Details
          </TabsTrigger>
          <TabsTrigger value="thesis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Investment Thesis
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
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="thesis" className="space-y-6">
              <InvestmentThesisSelector 
                value={investmentThesis}
                onChange={handleInvestmentThesisChange}
              />
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
                  {investmentThesis ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Investment thesis configured: {investmentThesis.thesisType === 'custom' ? investmentThesis.customThesisName || 'Custom Thesis' : investmentThesis.thesisType}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Please configure your investment thesis in the previous tab
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={isSubmitting || !investmentThesis}>
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