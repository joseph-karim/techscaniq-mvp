import { useState } from 'react'
import { ScanReportNavigation } from '@/components/reports/ScanReportNavigation'
import { Breadcrumbs } from '@/components/pe/deep-dive-report/Breadcrumbs'
import { Citation } from '@/components/reports/EvidenceCitation'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, FileText, Search } from 'lucide-react'
import { mockDemoReports } from '@/lib/mock-demo-data'

// Get the comprehensive Ring4 report from mock data
const ring4Report = mockDemoReports['report-ring4-comprehensive']

// Note: Citations will be integrated in future version

export default function ViewReport() {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [activeSection, setActiveSection] = useState('executive-summary')

  const handleCloseModal = () => {
    setSelectedCitation(null)
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-4 w-4" /> },
    { label: 'Reports', href: '/reports', icon: <FileText className="h-4 w-4" /> },
    { label: ring4Report?.company_name || 'Ring4', icon: <Search className="h-4 w-4" /> }
  ]

  if (!ring4Report) {
    return <div>Report not found</div>
  }

  const renderSection = () => {
    // Check if sections is an array (new format) or object (legacy format)
    if (Array.isArray(ring4Report.sections)) {
      // New format - render sections array
      const currentSectionIndex = ring4Report.sections.findIndex(section => 
        section.title.toLowerCase().replace(/\s+/g, '-') === activeSection
      )
      const currentSection = ring4Report.sections[currentSectionIndex]
      
      if (!currentSection) return <div>Section not found</div>
      
      return (
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">{currentSection.title}</h2>
          </div>
          
          <div className="prose max-w-none">
            <div 
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: currentSection.content.replace(/\n/g, '<br />') }}
            />
          </div>
          
          {currentSection.subsections && currentSection.subsections.map((subsection, index) => (
            <Card key={index} className="mt-6">
              <CardHeader>
                <CardTitle>{subsection.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: subsection.content.replace(/\n/g, '<br />') }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }
    
    // Legacy fallback (shouldn't be used but just in case)
    return <div>Legacy format not supported in this view</div>
  }

  // Navigation handled by ScanReportNavigation component

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      <div className="flex">
        <ScanReportNavigation
          currentSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <main className="flex-1 min-h-screen">
          {renderSection()}
        </main>
      </div>

      {selectedCitation && (
        <EvidenceModal
          isOpen={true}
          onClose={handleCloseModal}
          citation={selectedCitation}
        />
      )}
    </div>
  )
}