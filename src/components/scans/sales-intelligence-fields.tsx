'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, Globe, DollarSign, Calendar } from 'lucide-react';
import { ScanConfiguration } from './UnifiedScanConfigForm';

interface SalesIntelligenceFieldsProps {
  form: UseFormReturn<ScanConfiguration>;
  showSavedProfiles?: boolean;
}

export function SalesIntelligenceFields({ form, showSavedProfiles = true }: SalesIntelligenceFieldsProps) {
  // Load saved vendor profile
  const loadSavedProfile = () => {
    // TODO: Implement loading saved vendor profiles
    console.log('Loading saved vendor profile...');
  };

  return (
    <div className="space-y-6">
      {showSavedProfiles && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div>
            <p className="text-sm font-medium">Load Saved Vendor Profile</p>
            <p className="text-xs text-muted-foreground">Use a previously saved configuration</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadSavedProfile}>
            Load Profile
          </Button>
        </div>
      )}

      {/* Vendor Offering */}
      <div className="space-y-2">
        <Label htmlFor="vendorOffering">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Vendor Offering *
          </div>
        </Label>
        <Textarea
          id="vendorOffering"
          placeholder="Describe what your company offers (e.g., 'Cloud-based CRM platform with AI-powered sales automation')"
          rows={3}
          {...form.register('vendorOffering')}
        />
        {form.formState.errors.vendorOffering && (
          <p className="text-sm text-destructive">{form.formState.errors.vendorOffering.message}</p>
        )}
      </div>

      {/* Target Market */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Ideal Customer Profile</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetIndustry">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Target Industry
              </div>
            </Label>
            <Select value={form.watch('targetIndustry')} onValueChange={(value) => form.setValue('targetIndustry', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="financial-services">Financial Services</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="all">All Industries</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCompanySize">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Company Size
              </div>
            </Label>
            <Select value={form.watch('targetCompanySize')} onValueChange={(value) => form.setValue('targetCompanySize', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-50">Startup (1-50 employees)</SelectItem>
                <SelectItem value="51-200">Small (51-200 employees)</SelectItem>
                <SelectItem value="201-1000">Mid-Market (201-1000 employees)</SelectItem>
                <SelectItem value="1001-5000">Enterprise (1001-5000 employees)</SelectItem>
                <SelectItem value="5000+">Large Enterprise (5000+ employees)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetGeography">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Geography
              </div>
            </Label>
            <Select value={form.watch('targetGeography')} onValueChange={(value) => form.setValue('targetGeography', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="north-america">North America</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                <SelectItem value="latin-america">Latin America</SelectItem>
                <SelectItem value="middle-east-africa">Middle East & Africa</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="space-y-2">
        <Label htmlFor="useCases">Key Use Cases</Label>
        <Textarea
          id="useCases"
          placeholder="Describe the main problems you solve and use cases (e.g., 'Sales pipeline management, Lead scoring, Customer engagement tracking')"
          rows={3}
          {...form.register('useCases')}
        />
      </div>

      {/* Budget and Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budgetRange">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Typical Budget Range
            </div>
          </Label>
          <Select value={form.watch('budgetRange')} onValueChange={(value) => form.setValue('budgetRange', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="<10k">Less than $10K</SelectItem>
              <SelectItem value="10k-50k">$10K - $50K</SelectItem>
              <SelectItem value="50k-100k">$50K - $100K</SelectItem>
              <SelectItem value="100k-500k">$100K - $500K</SelectItem>
              <SelectItem value="500k+">$500K+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="evaluationTimeline">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Typical Evaluation Timeline
            </div>
          </Label>
          <Select value={form.watch('evaluationTimeline')} onValueChange={(value) => form.setValue('evaluationTimeline', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="<1month">Less than 1 month</SelectItem>
              <SelectItem value="1-3months">1-3 months</SelectItem>
              <SelectItem value="3-6months">3-6 months</SelectItem>
              <SelectItem value="6-12months">6-12 months</SelectItem>
              <SelectItem value="12months+">12+ months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}