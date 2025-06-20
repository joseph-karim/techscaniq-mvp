'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Target } from 'lucide-react';
import { InvestmentThesisSelector } from './investment-thesis-selector';
import { SalesIntelligenceFields } from './sales-intelligence-fields';
// import { cn } from '@/lib/utils';

// Unified scan configuration schema
const scanConfigSchema = z.object({
  // Core fields (required for all screens)
  companyName: z.string().min(1, 'Company name is required'),
  websiteUrl: z.string().url('Please enter a valid URL'),
  companyDescription: z.string().optional(),
  reportType: z.enum(['pe_due_diligence', 'sales_intelligence']),
  
  // PE Due Diligence fields
  investmentThesis: z.string().optional(),
  thesisTags: z.array(z.string()).optional(),
  primaryCriteria: z.string().max(200).optional(),
  secondaryCriteria: z.string().max(200).optional(),
  
  // Sales Intelligence fields
  vendorOffering: z.string().optional(),
  targetIndustry: z.string().optional(),
  targetCompanySize: z.string().optional(),
  targetGeography: z.string().optional(),
  useCases: z.string().optional(),
  budgetRange: z.string().optional(),
  evaluationTimeline: z.string().optional(),
  
  // Admin-specific fields
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedAnalyst: z.string().optional(),
  clientOrganization: z.string().optional(),
  pePartner: z.string().optional(),
  investmentAmount: z.string().optional(),
  holdPeriod: z.string().optional(),
  
  // Queue-specific fields
  queuePriority: z.number().optional(),
  retryCount: z.number().optional(),
  scheduledFor: z.date().optional(),
  
  // Collection depth (for admin scan config)
  scanDepth: z.enum(['shallow', 'deep', 'comprehensive']).optional(),
  collectionNotes: z.string().optional(),
});

export type ScanConfiguration = z.infer<typeof scanConfigSchema>;

export interface UnifiedScanConfigFormProps {
  // Context information
  mode: 'user-request' | 'admin-request' | 'queue-config' | 'advisor-queue' | 'quick-scan';
  userRole: 'admin' | 'user' | 'advisor' | 'pe';
  
  // Form behavior
  onSubmit: (config: ScanConfiguration) => Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<ScanConfiguration>;
  
  // UI customization
  title?: string;
  submitButtonText?: string;
  showAdvancedOptions?: boolean;
  
  // Role-based visibility
  hideFields?: string[];
  requiredFields?: string[];
  
  // Layout options
  layout?: 'tabs' | 'single-page';
  showSavedConfigurations?: boolean;
}

export function UnifiedScanConfigForm({
  mode,
  userRole,
  onSubmit,
  onCancel,
  initialValues,
  title,
  submitButtonText = 'Submit Scan Request',
  showAdvancedOptions: _showAdvancedOptions = false,
  hideFields = [],
  requiredFields: _requiredFields = [],
  layout = 'tabs',
  showSavedConfigurations = true,
}: UnifiedScanConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('company-details');
  const [, setSelectedThesis] = useState<any>(null);

  const form = useForm<ScanConfiguration>({
    resolver: zodResolver(scanConfigSchema),
    defaultValues: {
      reportType: 'pe_due_diligence',
      priority: 'medium',
      scanDepth: 'deep',
      ...initialValues,
    },
  });

  const reportType = form.watch('reportType');

  // Handle form submission
  const handleSubmit = async (data: ScanConfiguration) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting scan configuration:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which fields to show based on mode and user role
  const shouldShowField = (fieldName: string) => {
    if (hideFields.includes(fieldName)) return false;
    
    // Role-based visibility rules
    const adminOnlyFields = ['priority', 'assignedAnalyst', 'clientOrganization', 'pePartner', 'investmentAmount', 'holdPeriod'];
    const queueFields = ['queuePriority', 'retryCount', 'scheduledFor'];
    const collectionFields = ['scanDepth', 'collectionNotes'];
    
    if (adminOnlyFields.includes(fieldName) && userRole !== 'admin') return false;
    if (queueFields.includes(fieldName) && !['queue-config', 'advisor-queue'].includes(mode)) return false;
    if (collectionFields.includes(fieldName) && mode !== 'admin-request') return false;
    
    return true;
  };

  // Render company details section
  const renderCompanyDetails = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          placeholder="Enter company name"
          {...form.register('companyName')}
        />
        {form.formState.errors.companyName && (
          <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website URL *</Label>
        <Input
          id="websiteUrl"
          type="url"
          placeholder="https://example.com"
          {...form.register('websiteUrl')}
        />
        {form.formState.errors.websiteUrl && (
          <p className="text-sm text-destructive">{form.formState.errors.websiteUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyDescription">Company Description (Optional)</Label>
        <Textarea
          id="companyDescription"
          placeholder="Brief description of the company and its business"
          rows={3}
          {...form.register('companyDescription')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportType">Report Type *</Label>
        <Select value={reportType} onValueChange={(value) => form.setValue('reportType', value as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pe_due_diligence">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                PE Due Diligence
              </div>
            </SelectItem>
            <SelectItem value="sales_intelligence">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Sales Intelligence
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {shouldShowField('priority') && (
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={form.watch('priority')} onValueChange={(value) => form.setValue('priority', value as any)}>
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
      )}
    </div>
  );

  // Render context configuration section
  const renderContextConfiguration = () => {
    if (reportType === 'pe_due_diligence') {
      return (
        <div className="space-y-6">
          {/* Investment Thesis Selector - CRITICAL: Always show this */}
          <div className="space-y-2">
            <Label>Investment Thesis *</Label>
            <InvestmentThesisSelector
              value={form.watch('investmentThesis') || ''}
              onChange={(value, thesis) => {
                form.setValue('investmentThesis', value);
                setSelectedThesis(thesis);
                if (thesis && 'tags' in thesis) {
                  form.setValue('thesisTags', (thesis as any).tags || []);
                }
              }}
              showSavedTheses={showSavedConfigurations}
            />
            {form.formState.errors.investmentThesis && (
              <p className="text-sm text-destructive">{form.formState.errors.investmentThesis.message}</p>
            )}
          </div>

          {/* Admin-only PE fields */}
          {shouldShowField('pePartner') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pePartner">PE Partner</Label>
                <Input
                  id="pePartner"
                  placeholder="Partner name"
                  {...form.register('pePartner')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentAmount">Investment Amount</Label>
                <Input
                  id="investmentAmount"
                  placeholder="$50M - $100M"
                  {...form.register('investmentAmount')}
                />
              </div>
            </div>
          )}

          {shouldShowField('holdPeriod') && (
            <div className="space-y-2">
              <Label htmlFor="holdPeriod">Expected Hold Period</Label>
              <Select value={form.watch('holdPeriod')} onValueChange={(value) => form.setValue('holdPeriod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hold period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3-5 years">3-5 years</SelectItem>
                  <SelectItem value="5-7 years">5-7 years</SelectItem>
                  <SelectItem value="7+ years">7+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      );
    } else {
      // Sales Intelligence fields
      return (
        <SalesIntelligenceFields
          form={form}
          showSavedProfiles={showSavedConfigurations}
        />
      );
    }
  };

  // Render additional criteria section
  const renderAdditionalCriteria = () => (
    <div className="space-y-4">
      {reportType === 'pe_due_diligence' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="primaryCriteria">Primary Evaluation Criteria</Label>
            <Textarea
              id="primaryCriteria"
              placeholder="Key factors for investment decision (max 200 characters)"
              rows={2}
              maxLength={200}
              {...form.register('primaryCriteria')}
            />
            <p className="text-xs text-muted-foreground">
              {form.watch('primaryCriteria')?.length || 0}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryCriteria">Secondary Evaluation Criteria</Label>
            <Textarea
              id="secondaryCriteria"
              placeholder="Additional considerations (max 200 characters)"
              rows={2}
              maxLength={200}
              {...form.register('secondaryCriteria')}
            />
            <p className="text-xs text-muted-foreground">
              {form.watch('secondaryCriteria')?.length || 0}/200 characters
            </p>
          </div>
        </>
      )}

      {shouldShowField('scanDepth') && (
        <div className="space-y-2">
          <Label>Scan Depth</Label>
          <Select value={form.watch('scanDepth')} onValueChange={(value) => form.setValue('scanDepth', value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shallow">
                <div>
                  <div className="font-medium">Shallow</div>
                  <div className="text-xs text-muted-foreground">Basic website analysis (5-10 min)</div>
                </div>
              </SelectItem>
              <SelectItem value="deep">
                <div>
                  <div className="font-medium">Deep</div>
                  <div className="text-xs text-muted-foreground">Comprehensive technical analysis (10-20 min)</div>
                </div>
              </SelectItem>
              <SelectItem value="comprehensive">
                <div>
                  <div className="font-medium">Comprehensive</div>
                  <div className="text-xs text-muted-foreground">Full analysis with market research (20-40 min)</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {shouldShowField('collectionNotes') && (
        <div className="space-y-2">
          <Label htmlFor="collectionNotes">Collection Notes</Label>
          <Textarea
            id="collectionNotes"
            placeholder="Any special instructions or notes for the scan"
            rows={3}
            {...form.register('collectionNotes')}
          />
        </div>
      )}
    </div>
  );

  // Render form based on layout preference
  const renderForm = () => {
    if (layout === 'single-page' || mode === 'quick-scan') {
      return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {renderCompanyDetails()}
          {mode !== 'quick-scan' && (
            <>
              {renderContextConfiguration()}
              {renderAdditionalCriteria()}
            </>
          )}
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitButtonText}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      );
    }

    // Tabs layout
    return (
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company-details">Company Details</TabsTrigger>
            <TabsTrigger value="context">
              {reportType === 'pe_due_diligence' ? 'Investment Thesis' : 'Sales Context'}
            </TabsTrigger>
            <TabsTrigger value="additional">Additional Criteria</TabsTrigger>
          </TabsList>

          <TabsContent value="company-details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Enter the basic information about the target company
                </CardDescription>
              </CardHeader>
              <CardContent>{renderCompanyDetails()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="context" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {reportType === 'pe_due_diligence' ? 'Investment Thesis' : 'Sales Intelligence Context'}
                </CardTitle>
                <CardDescription>
                  {reportType === 'pe_due_diligence'
                    ? 'Select your investment thesis and configure evaluation parameters'
                    : 'Define your ideal customer profile and sales context'}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderContextConfiguration()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Additional Configuration</CardTitle>
                <CardDescription>
                  Optional criteria and configuration options
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderAdditionalCriteria()}
                <div className="mt-6 flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitButtonText}
                  </Button>
                  {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {title && (
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
      )}
      {renderForm()}
    </div>
  );
}