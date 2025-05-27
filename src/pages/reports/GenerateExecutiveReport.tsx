import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useExecutiveReport } from '@/hooks/useExecutiveReport'
import { Building2, Target, FileText, Loader2, AlertCircle } from 'lucide-react'

export default function GenerateExecutiveReport() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { generateReport, loading, error, progress } = useExecutiveReport()
  
  // Get scan data from URL params if coming from review page
  const scanId = searchParams.get('scanId')
  const companyFromScan = searchParams.get('company')
  const websiteFromScan = searchParams.get('website')
  const requestorFromScan = searchParams.get('requestor')
  const organizationFromScan = searchParams.get('organization')
  
  const [investorProfile, setInvestorProfile] = useState({
    firmName: '',
    website: '',
    supplementalLinks: {
      crunchbase: '',
      linkedin: '',
      portfolio: '',
      blog: ''
    }
  })
  
  const [targetCompany, setTargetCompany] = useState({
    name: '',
    website: '',
    assessmentContext: 'diligence' as 'diligence' | 'optimization' | 'exit-planning'
  })
  
  const [contextDocs, setContextDocs] = useState('')
  const [apiKey, setApiKey] = useState('')
  
  // Pre-fill form if coming from scan review
  useEffect(() => {
    if (companyFromScan && websiteFromScan) {
      setTargetCompany({
        name: companyFromScan,
        website: websiteFromScan,
        assessmentContext: 'diligence'
      })
    }
    if (organizationFromScan) {
      setInvestorProfile(prev => ({
        ...prev,
        firmName: organizationFromScan
      }))
    }
  }, [companyFromScan, websiteFromScan, organizationFromScan])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const report = await generateReport({
      investorProfile: {
        ...investorProfile,
        supplementalLinks: Object.entries(investorProfile.supplementalLinks)
          .filter(([_, value]) => value)
          .length > 0 ? investorProfile.supplementalLinks : undefined
      },
      targetCompany,
      contextDocs: contextDocs || undefined,
      apiKey: apiKey || undefined
    })
    
    if (report) {
      // If this was generated from a scan request, navigate back to review
      if (scanId) {
        // In a real app, we would save the report to the scan request here
        // For now, navigate back to the review page
        navigate(`/advisor/review/${scanId}`, {
          state: { 
            executiveReportGenerated: true,
            reportId: report.id 
          }
        })
      } else {
        // Otherwise navigate to the report view
        navigate(`/reports/${report.id}`)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generate Executive Report</h1>
        <p className="text-muted-foreground">
          Create a comprehensive investor-aligned technology assessment using AI
        </p>
        {scanId && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Generating report for scan request <strong>#{scanId}</strong> from {requestorFromScan}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Investor Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Investor Profile
            </CardTitle>
            <CardDescription>
              Enter details about the PE/VC firm
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firmName">Firm Name *</Label>
                <Input
                  id="firmName"
                  value={investorProfile.firmName}
                  onChange={(e) => setInvestorProfile({ ...investorProfile, firmName: e.target.value })}
                  placeholder="e.g., Inturact Capital"
                  required
                />
              </div>
              <div>
                <Label htmlFor="firmWebsite">Website *</Label>
                <Input
                  id="firmWebsite"
                  type="url"
                  value={investorProfile.website}
                  onChange={(e) => setInvestorProfile({ ...investorProfile, website: e.target.value })}
                  placeholder="https://capital.inturact.com"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Supplemental Links (Optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Crunchbase URL"
                  value={investorProfile.supplementalLinks.crunchbase}
                  onChange={(e) => setInvestorProfile({
                    ...investorProfile,
                    supplementalLinks: { ...investorProfile.supplementalLinks, crunchbase: e.target.value }
                  })}
                />
                <Input
                  placeholder="LinkedIn URL"
                  value={investorProfile.supplementalLinks.linkedin}
                  onChange={(e) => setInvestorProfile({
                    ...investorProfile,
                    supplementalLinks: { ...investorProfile.supplementalLinks, linkedin: e.target.value }
                  })}
                />
                <Input
                  placeholder="Portfolio Page URL"
                  value={investorProfile.supplementalLinks.portfolio}
                  onChange={(e) => setInvestorProfile({
                    ...investorProfile,
                    supplementalLinks: { ...investorProfile.supplementalLinks, portfolio: e.target.value }
                  })}
                />
                <Input
                  placeholder="Blog URL"
                  value={investorProfile.supplementalLinks.blog}
                  onChange={(e) => setInvestorProfile({
                    ...investorProfile,
                    supplementalLinks: { ...investorProfile.supplementalLinks, blog: e.target.value }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Company Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Target Company
            </CardTitle>
            <CardDescription>
              Company to assess
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={targetCompany.name}
                  onChange={(e) => setTargetCompany({ ...targetCompany, name: e.target.value })}
                  placeholder="e.g., Ring4"
                  required
                />
              </div>
              <div>
                <Label htmlFor="companyWebsite">Website *</Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  value={targetCompany.website}
                  onChange={(e) => setTargetCompany({ ...targetCompany, website: e.target.value })}
                  placeholder="https://www.ring4.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="assessmentContext">Assessment Context *</Label>
              <Select
                value={targetCompany.assessmentContext}
                onValueChange={(value: 'diligence' | 'optimization' | 'exit-planning') => 
                  setTargetCompany({ ...targetCompany, assessmentContext: value })
                }
              >
                <SelectTrigger id="assessmentContext">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diligence">Due Diligence</SelectItem>
                  <SelectItem value="optimization">Portfolio Optimization</SelectItem>
                  <SelectItem value="exit-planning">Exit Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Additional Context Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Context
            </CardTitle>
            <CardDescription>
              Optional information to enhance the analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contextDocs">Context Documents</Label>
              <Textarea
                id="contextDocs"
                value={contextDocs}
                onChange={(e) => setContextDocs(e.target.value)}
                placeholder="Paste any additional context, previous reports, or specific areas of focus..."
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="apiKey">Google API Key (Optional)</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your Google API key (if not configured in environment)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use the default API key
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status and Actions */}
        {progress && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>{progress}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/reports')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              'Generate Report'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 