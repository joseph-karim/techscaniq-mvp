'use client';

// import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/auth-provider';
import { toast } from 'sonner';
import { UnifiedScanConfigForm, type ScanConfiguration } from '@/components/scans/UnifiedScanConfigForm';

export default function AdminScanRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (config: ScanConfiguration) => {
    if (!user) return;

    try {
      // Create scan request with admin metadata
      const scanRequest = {
        company_name: config.companyName,
        website_url: config.websiteUrl,
        company_description: config.companyDescription,
        report_type: config.reportType.replace('_', '-'), // Convert pe_due_diligence to pe-due-diligence
        industry: config.targetIndustry,
        priority: config.priority || 'medium',
        requestor_id: user.id,
        requestor_email: user.email,
        requestor_type: 'admin',
        status: 'pending',
        metadata: {
          admin_initiated: true,
          initiated_by: user.email,
          initiated_at: new Date().toISOString(),
          scan_depth: config.scanDepth,
          collection_notes: config.collectionNotes,
        },
      };

      // Add context based on report type
      if (config.reportType === 'pe_due_diligence') {
        (scanRequest.metadata as any).investment_thesis = {
          thesis_type: config.investmentThesis,
          thesis_tags: config.thesisTags,
          primary_criteria: config.primaryCriteria,
          secondary_criteria: config.secondaryCriteria,
          pe_partner: config.pePartner,
          investment_amount: config.investmentAmount,
          hold_period: config.holdPeriod,
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
      const { data: scan, error } = await supabase
        .from('scan_requests')
        .insert(scanRequest)
        .select()
        .single();

      if (error) throw error;

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
            priority: config.priority || 'medium',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to queue research job');
        }
      }

      toast.success('Scan request created successfully');
      navigate('/admin/scans');
    } catch (error) {
      console.error('Error creating scan:', error);
      toast.error('Failed to create scan request');
      throw error; // Re-throw to let the form handle the error state
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Request New Scan</h1>
        <p className="text-muted-foreground">
          Configure and initiate a new technology scan with admin privileges
        </p>
      </div>

      <UnifiedScanConfigForm
        mode="admin-request"
        userRole="admin"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/scans')}
        title="Admin Scan Configuration"
        submitButtonText="Create Admin Scan"
        showAdvancedOptions={true}
        layout="single-page" // Admin prefers single-page layout
        showSavedConfigurations={true}
      />
    </div>
  );
}