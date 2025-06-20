'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UnifiedScanConfigForm, type ScanConfiguration } from '@/components/scans/UnifiedScanConfigForm';

export default function RequestScanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (config: ScanConfiguration) => {
    if (!user) {
      setError('You must be logged in to request a scan');
      return;
    }

    setError(null);

    try {
      // Prepare scan request data
      const scanRequest = {
        company_name: config.companyName,
        website_url: config.websiteUrl,
        company_description: config.companyDescription,
        report_type: config.reportType.replace('_', '-'), // Convert pe_due_diligence to pe-due-diligence
        status: 'pending',
        user_id: user.id,
        organization_id: user.user_metadata?.organization_id || null,
        metadata: {
          created_at: new Date().toISOString(),
          requestor_email: user.email,
        },
      };

      // Add context based on report type
      if (config.reportType === 'pe_due_diligence') {
        (scanRequest.metadata as any).investment_thesis = {
          thesis_type: config.investmentThesis,
          thesis_tags: config.thesisTags,
          primary_criteria: config.primaryCriteria,
          secondary_criteria: config.secondaryCriteria,
        };
      } else if (config.reportType === 'sales_intelligence') {
        (scanRequest.metadata as any).sales_context = {
          offering: config.vendorOffering,
          ideal_customer_profile: {
            industry: config.targetIndustry,
            companySize: config.targetCompanySize,
            geography: config.targetGeography,
          },
          use_cases: config.useCases?.split('\n').filter(Boolean) || [],
          budget_range: config.budgetRange,
          evaluation_timeline: config.evaluationTimeline,
        };
      }

      // Insert scan request
      const { error: insertError } = await supabase
        .from('scan_requests')
        .insert(scanRequest)
        .select()
        .single();

      if (insertError) throw insertError;

      // Save investment thesis if configured
      if (config.reportType === 'pe_due_diligence' && config.investmentThesis) {
        // This could be extended to save the thesis configuration for reuse
        console.log('Investment thesis configured:', config.investmentThesis);
      }

      setSuccess(true);
      
      // Redirect to scans list after a short delay
      setTimeout(() => {
        navigate('/scans');
      }, 2000);
    } catch (err) {
      console.error('Error creating scan request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create scan request');
      throw err; // Re-throw to let the form handle the error state
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Request Technology Scan</h1>
        <p className="text-muted-foreground">
          Analyze any website's technology stack, performance, and security
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Scan request submitted successfully! Redirecting to your scans...
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
        <div className="flex gap-2">
          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">What happens after you submit:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Our AI analyzes the company's technology stack and digital presence</li>
              <li>We generate a comprehensive report based on your selected criteria</li>
              <li>You'll receive an email when the report is ready (typically 5-10 minutes)</li>
            </ul>
          </div>
        </div>
      </div>

      <UnifiedScanConfigForm
        mode="user-request"
        userRole={(user?.user_metadata?.role as 'admin' | 'user' | 'advisor' | 'pe') || 'user'}
        onSubmit={handleSubmit}
        title="Scan Configuration"
        submitButtonText="Start Scan"
        layout="tabs" // Preserve the tabs layout as this is the reference implementation
        showSavedConfigurations={true}
      />
    </div>
  );
}