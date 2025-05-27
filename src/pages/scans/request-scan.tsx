import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Globe, Info } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/auth/auth-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

const requestScanSchema = z.object({
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  websiteUrl: z.string().url({ message: 'Please enter a valid URL' }),
  description: z.string().optional(),
  thesisTags: z.array(z.string()).min(1, { message: 'Please select at least one thesis tag' }),
  primaryCriteria: z.string().max(200, { message: 'Primary criteria must be 200 characters or less' }),
  secondaryCriteria: z.string().max(200, { message: 'Secondary criteria must be 200 characters or less' }).optional(),
})

type RequestScanForm = z.infer<typeof requestScanSchema>

export default function RequestScanPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    
    try {
      // Create the scan request in the database
      const { data: scanRequest, error: dbError } = await supabase
        .from('scan_requests')
        .insert({
          company_name: data.companyName,
          website_url: data.websiteUrl,
          requested_by: user?.id,
          requestor_name: user?.user_metadata?.name || user?.email || 'Unknown',
          organization_name: user?.user_metadata?.workspace_name || 'Unknown Organization',
          status: 'pending',
          sections: [],
          risks: []
        })
        .select()
        .single()

      if (dbError) throw dbError
      
      // Success
      setSuccess(true)
      form.reset()
      
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
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request a Scan</h1>
        <p className="text-muted-foreground">
          Submit a request for technical due diligence on a target company
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
      
      <Card>
        <CardHeader>
          <CardTitle>Scan Details</CardTitle>
          <CardDescription>
            Enter information about the target company and your investment thesis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Technologies" {...field} />
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
                            placeholder="https://example.com" 
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the company and what they do..."
                          className="min-h-[100px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional context about the company and their technology
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-4 flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                  <div>
                    <h3 className="font-medium">Investment Thesis</h3>
                    <p className="text-sm text-muted-foreground">
                      Tell us what matters most in your investment decision. This helps us tailor the analysis to your specific criteria.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="thesisTags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Thesis Tags</FormLabel>
                        <FormControl>
                          <ThesisTagSelector 
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Select all relevant thesis criteria that apply
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
                        <FormLabel>Primary Criteria</FormLabel>
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
                            {field.value.length}/200 characters
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
                        <FormLabel>Secondary Criteria (Optional)</FormLabel>
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
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Scan Request'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}