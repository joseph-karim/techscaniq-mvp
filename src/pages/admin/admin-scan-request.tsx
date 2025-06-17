import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/auth-provider'
import { toast } from 'sonner'
import { Loader2, Search, Building2, FileText, Briefcase, ShoppingCart } from 'lucide-react'

// Define schemas for different report types
const peContextSchema = z.object({
  description: z.string().min(10, 'Investment thesis must be at least 10 characters'),
  pePartner: z.string().optional(),
  investmentAmount: z.number().optional(),
  targetHoldPeriod: z.number().optional(),
})

const salesContextSchema = z.object({
  offering: z.string().min(3, 'Product/service offering is required'),
  idealCustomerProfile: z.object({
    industry: z.string().optional(),
    companySize: z.string().optional(),
    geography: z.string().optional(),
    techStack: z.array(z.string()).optional(),
    painPoints: z.array(z.string()).optional(),
  }),
  useCases: z.array(z.string()).min(1, 'At least one use case is required'),
  budgetRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('USD'),
  }).optional(),
  decisionCriteria: z.array(z.string()).optional(),
  competitiveAlternatives: z.array(z.string()).optional(),
  evaluationTimeline: z.string().optional(),
})

const adminScanSchema = z.object({
  company: z.string().min(2, 'Company name is required'),
  website: z.string().url('Valid URL required').optional(),
  companyDescription: z.string().optional(),
  reportType: z.enum(['pe-due-diligence', 'sales-intelligence']),
  industry: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  peContext: peContextSchema.optional(),
  salesContext: salesContextSchema.optional(),
}).refine((data) => {
  if (data.reportType === 'pe-due-diligence' && !data.peContext) {
    return false
  }
  if (data.reportType === 'sales-intelligence' && !data.salesContext) {
    return false
  }
  return true
}, {
  message: 'Context is required for the selected report type',
  path: ['reportType'],
})

type AdminScanFormData = z.infer<typeof adminScanSchema>

export default function AdminScanRequest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AdminScanFormData>({
    resolver: zodResolver(adminScanSchema),
    defaultValues: {
      reportType: 'pe-due-diligence',
      priority: 'medium',
    },
  })

  const watchReportType = watch('reportType')

  const onSubmit = async (data: AdminScanFormData) => {
    if (!user) return
    
    setIsSubmitting(true)
    try {
      // Create scan request with admin metadata
      const scanRequest = {
        company_name: data.company,
        website_url: data.website,
        company_description: data.companyDescription,
        report_type: data.reportType,
        industry: data.industry,
        priority: data.priority,
        requestor_id: user.id,
        requestor_email: user.email,
        requestor_type: 'admin',
        status: 'pending',
        metadata: {
          admin_initiated: true,
          initiated_by: user.email,
          initiated_at: new Date().toISOString(),
        },
      }

      // Add context based on report type
      if (data.reportType === 'pe-due-diligence' && data.peContext) {
        (scanRequest.metadata as any).investment_thesis = {
          company: data.company,
          ...data.peContext,
        }
      } else if (data.reportType === 'sales-intelligence' && data.salesContext) {
        (scanRequest.metadata as any).sales_context = {
          company: data.company,
          ...data.salesContext,
        }
      }

      // Insert scan request
      const { data: scan, error } = await supabase
        .from('scan_requests')
        .insert(scanRequest)
        .select()
        .single()

      if (error) throw error

      // Trigger research orchestrator
      if (scan) {
        // Queue the research job via API
        const response = await fetch('/api/scans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            scanId: scan.id,
            priority: data.priority,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to queue research job')
        }
      }

      toast.success('Scan request created successfully')
      navigate('/admin/scans')
    } catch (error) {
      console.error('Error creating scan:', error)
      toast.error('Failed to create scan request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Admin Scan Request
            </CardTitle>
            <CardDescription>
              Initiate a scan for any company with flexible context and priority settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Information
                </h3>
                
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    {...register('company')}
                    placeholder="e.g., Acme Corporation"
                  />
                  {errors.company && (
                    <p className="text-sm text-red-500 mt-1">{errors.company.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    {...register('website')}
                    placeholder="https://example.com"
                  />
                  {errors.website && (
                    <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea
                    id="companyDescription"
                    {...register('companyDescription')}
                    placeholder="Brief description of the company's business..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    {...register('industry')}
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>
              </div>

              {/* Report Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Report Configuration
                </h3>

                <div>
                  <Label htmlFor="reportType">Report Type *</Label>
                  <Select
                    value={watchReportType}
                    onValueChange={(value: 'pe-due-diligence' | 'sales-intelligence') => {
                      setValue('reportType', value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={watch('priority')}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => {
                      setValue('priority', value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Context Based on Report Type */}
              {watchReportType === 'pe-due-diligence' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Investment Context</h3>
                  
                  <div>
                    <Label htmlFor="peContext.description">Investment Thesis *</Label>
                    <Textarea
                      id="peContext.description"
                      {...register('peContext.description')}
                      placeholder="Describe the investment opportunity and strategy..."
                      rows={4}
                    />
                    {errors.peContext?.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.peContext.description.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="peContext.pePartner">PE Partner (Optional)</Label>
                    <Input
                      id="peContext.pePartner"
                      {...register('peContext.pePartner')}
                      placeholder="e.g., Silver Lake, KKR"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="peContext.investmentAmount">Investment Amount ($M)</Label>
                      <Input
                        id="peContext.investmentAmount"
                        type="number"
                        {...register('peContext.investmentAmount', { valueAsNumber: true })}
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="peContext.targetHoldPeriod">Hold Period (years)</Label>
                      <Input
                        id="peContext.targetHoldPeriod"
                        type="number"
                        {...register('peContext.targetHoldPeriod', { valueAsNumber: true })}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {watchReportType === 'sales-intelligence' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sales Intelligence Context</h3>
                  
                  <div>
                    <Label htmlFor="salesContext.offering">Product/Service Offering *</Label>
                    <Input
                      id="salesContext.offering"
                      {...register('salesContext.offering')}
                      placeholder="e.g., Cloud Infrastructure Platform"
                    />
                    {errors.salesContext?.offering && (
                      <p className="text-sm text-red-500 mt-1">{errors.salesContext.offering.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Use Cases *</Label>
                    <Textarea
                      placeholder="Enter use cases (one per line)"
                      onChange={(e) => {
                        const useCases = e.target.value.split('\n').filter(Boolean)
                        setValue('salesContext.useCases', useCases)
                      }}
                      rows={3}
                    />
                    {errors.salesContext?.useCases && (
                      <p className="text-sm text-red-500 mt-1">{errors.salesContext.useCases.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Ideal Customer Profile</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        {...register('salesContext.idealCustomerProfile.industry')}
                        placeholder="Industry"
                      />
                      <Input
                        {...register('salesContext.idealCustomerProfile.companySize')}
                        placeholder="Company Size"
                      />
                      <Input
                        {...register('salesContext.idealCustomerProfile.geography')}
                        placeholder="Geography"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salesContext.budgetRange.min">Budget Min ($K)</Label>
                      <Input
                        id="salesContext.budgetRange.min"
                        type="number"
                        {...register('salesContext.budgetRange.min', { valueAsNumber: true })}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salesContext.budgetRange.max">Budget Max ($K)</Label>
                      <Input
                        id="salesContext.budgetRange.max"
                        type="number"
                        {...register('salesContext.budgetRange.max', { valueAsNumber: true })}
                        placeholder="500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="salesContext.evaluationTimeline">Evaluation Timeline</Label>
                    <Input
                      id="salesContext.evaluationTimeline"
                      {...register('salesContext.evaluationTimeline')}
                      placeholder="e.g., Q1 2024, 3-6 months"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Scan Request...
                  </>
                ) : (
                  'Create Scan Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
    </div>
  )
}