'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TechScanButton, TechScanInput, TechScanTextarea } from '@/components/brand';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Target } from 'lucide-react';
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
      <TechScanInput
        id="companyName"
        label="Company Name *"
        placeholder="Enter company name"
        error={form.formState.errors.companyName?.message}
        {...form.register('companyName')}
      />

      <TechScanInput
        id="websiteUrl"
        type="url"
        label="Website URL *"
        placeholder="https://example.com"
        error={form.formState.errors.websiteUrl?.message}
        {...form.register('websiteUrl')}
      />

      <TechScanTextarea
        id="companyDescription"
        label="Company Description (Optional)"
        placeholder="Brief description of the company and its business"
        rows={3}
        {...form.register('companyDescription')}
      />

      <div className="space-y-2">
        <Label htmlFor="reportType" className="font-space">Report Type *</Label>
        <Select value={reportType} onValueChange={(value) => form.setValue('reportType', value as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pe_due_diligence">
              <div className="flex items-center gap-2 font-ibm">
                <Building2 className="h-4 w-4" />
                PE Due Diligence
              </div>
            </SelectItem>
            <SelectItem value="sales_intelligence">
              <div className="flex items-center gap-2 font-ibm">
                <Target className="h-4 w-4" />
                Sales Intelligence
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {shouldShowField('priority') && (
        <div className="space-y-2">
          <Label htmlFor="priority" className="font-space">Priority</Label>
          <Select value={form.watch('priority')} onValueChange={(value) => form.setValue('priority', value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low" className="font-ibm">Low</SelectItem>
              <SelectItem value="medium" className="font-ibm">Medium</SelectItem>
              <SelectItem value="high" className="font-ibm">High</SelectItem>
              <SelectItem value="urgent" className="font-ibm">Urgent</SelectItem>
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
            <Label className="font-space">Investment Thesis *</Label>
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
              <p className="text-sm text-destructive font-ibm">{form.formState.errors.investmentThesis.message}</p>
            )}
          </div>

          {/* Admin-only PE fields */}
          {shouldShowField('pePartner') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pePartner" className="font-space">PE Partner</Label>
                <Input
                  id="pePartner"
                  placeholder="Partner name"
                  {...form.register('pePartner')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentAmount" className="font-space">Investment Amount</Label>
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
              <Label htmlFor="holdPeriod" className="font-space">Expected Hold Period</Label>
              <Select value={form.watch('holdPeriod')} onValueChange={(value) => form.setValue('holdPeriod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hold period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3-5 years" className="font-ibm">3-5 years</SelectItem>
                  <SelectItem value="5-7 years" className="font-ibm">5-7 years</SelectItem>
                  <SelectItem value="7+ years" className="font-ibm">7+ years</SelectItem>
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
            <Label htmlFor="primaryCriteria" className="font-space">Primary Evaluation Criteria</Label>
            <Textarea
              id="primaryCriteria"
              placeholder="Key factors for investment decision (max 200 characters)"
              rows={2}
              maxLength={200}
              {...form.register('primaryCriteria')}
            />
            <p className="text-xs text-muted-foreground font-ibm">
              {form.watch('primaryCriteria')?.length || 0}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryCriteria" className="font-space">Secondary Evaluation Criteria</Label>
            <Textarea
              id="secondaryCriteria"
              placeholder="Additional considerations (max 200 characters)"
              rows={2}
              maxLength={200}
              {...form.register('secondaryCriteria')}
            />
            <p className="text-xs text-muted-foreground font-ibm">
              {form.watch('secondaryCriteria')?.length || 0}/200 characters
            </p>
          </div>
        </>
      )}

      {shouldShowField('scanDepth') && (
        <div className="space-y-2">
          <Label className="font-space">Scan Depth</Label>
          <Select value={form.watch('scanDepth')} onValueChange={(value) => form.setValue('scanDepth', value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shallow">
                <div>
                  <div className="font-medium font-space">Shallow</div>
                  <div className="text-xs text-muted-foreground font-ibm">Basic website analysis (5-10 min)</div>
                </div>
              </SelectItem>
              <SelectItem value="deep">
                <div>
                  <div className="font-medium font-space">Deep</div>
                  <div className="text-xs text-muted-foreground font-ibm">Comprehensive technical analysis (10-20 min)</div>
                </div>
              </SelectItem>
              <SelectItem value="comprehensive">
                <div>
                  <div className="font-medium font-space">Comprehensive</div>
                  <div className="text-xs text-muted-foreground font-ibm">Full analysis with market research (20-40 min)</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {shouldShowField('collectionNotes') && (
        <TechScanTextarea
          id="collectionNotes"
          label="Collection Notes"
          placeholder="Any special instructions or notes for the scan"
          rows={3}
          {...form.register('collectionNotes')}
        />
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
            <TechScanButton type="submit" disabled={isSubmitting} loading={isSubmitting}>
              {submitButtonText}
            </TechScanButton>
            {onCancel && (
              <TechScanButton type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </TechScanButton>
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
            <TabsTrigger value="company-details" className="font-space">Company Details</TabsTrigger>
            <TabsTrigger value="context" className="font-space">
              {reportType === 'pe_due_diligence' ? 'Investment Thesis' : 'Sales Context'}
            </TabsTrigger>
            <TabsTrigger value="additional" className="font-space">Additional Criteria</TabsTrigger>
          </TabsList>

          <TabsContent value="company-details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-space">Company Information</CardTitle>
                <CardDescription className="font-ibm">
                  Enter the basic information about the target company
                </CardDescription>
              </CardHeader>
              <CardContent>{renderCompanyDetails()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="context" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-space">
                  {reportType === 'pe_due_diligence' ? 'Investment Thesis' : 'Sales Intelligence Context'}
                </CardTitle>
                <CardDescription className="font-ibm">
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
                <CardTitle className="font-space">Additional Configuration</CardTitle>
                <CardDescription className="font-ibm">
                  Optional criteria and configuration options
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderAdditionalCriteria()}
                <div className="mt-6 flex gap-4">
                  <TechScanButton type="submit" disabled={isSubmitting} loading={isSubmitting}>
                    {submitButtonText}
                  </TechScanButton>
                  {onCancel && (
                    <TechScanButton type="button" variant="secondary" onClick={onCancel}>
                      Cancel
                    </TechScanButton>
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
          <h2 className="text-2xl font-space font-bold">{title}</h2>
        </div>
      )}
      {renderForm()}
    </div>
  );
}