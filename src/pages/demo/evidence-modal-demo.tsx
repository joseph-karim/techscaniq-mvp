import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { Citation, InlineCitation } from '@/components/reports/EvidenceCitation'

// Mock citation data for demo
const mockCitation: Citation = {
  id: 'citation-1',
  claim: 'The application uses outdated authentication mechanisms that pose significant security risks, including hardcoded API keys and lack of proper session management.',
  evidence: [
    {
      id: 'evidence-1',
      type: 'code',
      title: 'Hardcoded API Keys in Configuration',
      source: 'GitHub Repository - config/api.js',
      url: 'https://github.com/example/repo/blob/main/config/api.js',
      excerpt: `const API_CONFIG = {
  apiKey: "sk-1234567890abcdef",
  secretKey: "secret_abc123def456",
  endpoint: "https://api.example.com"
};`,
      metadata: {
        fileType: 'JavaScript',
        lineNumbers: '15-19',
        lastModified: '2023-11-15',
        author: 'john.doe@company.com',
        confidence: 95
      }
    },
    {
      id: 'evidence-2',
      type: 'web',
      title: 'Public Documentation Reveals Security Issues',
      source: 'Company Developer Documentation',
      url: 'https://docs.example.com/security',
      excerpt: 'Authentication is currently handled through basic API key validation. Session management is not implemented, and tokens do not expire.',
      metadata: {
        confidence: 87
      }
    },
    {
      id: 'evidence-3',
      type: 'interview',
      title: 'Engineering Team Interview',
      source: 'Technical Lead Interview - Nov 2023',
      excerpt: 'We know the auth system needs work. It was built quickly for MVP and we haven\'t had time to implement proper OAuth or JWT tokens. The API keys are rotated manually every few months.',
      metadata: {
        confidence: 92
      }
    }
  ],
  reasoning: `The evidence clearly demonstrates multiple security vulnerabilities in the authentication system:

1. **Hardcoded Credentials**: The codebase contains hardcoded API keys and secrets directly in configuration files, which is a critical security anti-pattern. These credentials are visible to anyone with repository access and cannot be easily rotated.

2. **Lack of Session Management**: The documentation explicitly states that session management is not implemented, meaning user sessions persist indefinitely without proper timeout mechanisms.

3. **Manual Key Rotation**: The engineering team confirmed that API key rotation is a manual process, indicating poor security hygiene and operational overhead.

4. **No Modern Authentication**: The absence of OAuth, JWT, or other modern authentication mechanisms suggests the system is vulnerable to various attack vectors including token theft and replay attacks.

These findings collectively indicate a significant security debt that could expose the application to unauthorized access and data breaches.`,
  confidence: 91,
  analyst: 'Sarah Chen',
  reviewDate: '2023-11-20',
  methodology: 'Combined static code analysis, documentation review, and stakeholder interviews to assess authentication security posture.'
}

const mockNotes = [
  {
    id: 'note-1',
    author: 'Michael Rodriguez',
    role: 'pe_user' as const,
    content: 'This aligns with our security assessment. We should prioritize this in our due diligence recommendations.',
    timestamp: '2023-11-21T10:30:00Z',
    type: 'additional_info' as const,
    status: 'reviewed' as const
  },
  {
    id: 'note-2',
    author: 'TechScan Admin',
    role: 'admin' as const,
    content: 'Confirmed with latest repository scan. The hardcoded keys are still present as of Nov 21, 2023.',
    timestamp: '2023-11-21T14:15:00Z',
    type: 'correction' as const,
    status: 'incorporated' as const
  }
]

export default function EvidenceModalDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)

  const handleAddNote = (note: any) => {
    console.log('New note added:', note)
    // In a real app, this would save to the backend
  }

  const handleCitationClick = (citation: Citation) => {
    setActiveCitation(citation)
    setIsModalOpen(true)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Evidence Modal Demo</h1>
        <p className="text-muted-foreground">
          Demonstration of inline citations that open the enhanced evidence modal
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Security Assessment Report</CardTitle>
          <CardDescription>
            Click on the underlined citations to view detailed evidence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Critical Security Vulnerabilities Identified</h3>
            
            <p className="leading-relaxed">
              Our comprehensive security analysis has revealed several critical vulnerabilities in the target company's authentication system. 
              <InlineCitation 
                citationId="1" 
                citation={mockCitation} 
                onCitationClick={handleCitationClick}
              >
                The application uses outdated authentication mechanisms that pose significant security risks
              </InlineCitation>, 
              including hardcoded API keys and lack of proper session management.
            </p>

            <p className="leading-relaxed">
              The most concerning finding is the presence of 
              <InlineCitation 
                citationId="1" 
                citation={mockCitation} 
                onCitationClick={handleCitationClick}
              >
                hardcoded credentials directly in the codebase
              </InlineCitation>, 
              which creates an immediate security risk. Additionally, the system lacks modern authentication protocols, 
              relying instead on basic API key validation without proper session management or token expiration.
            </p>

            <p className="leading-relaxed">
              During our technical interviews, the engineering team acknowledged these limitations, stating that 
              <InlineCitation 
                citationId="1" 
                citation={mockCitation} 
                onCitationClick={handleCitationClick}
              >
                the authentication system was built quickly for MVP and hasn't been updated
              </InlineCitation>. 
              This technical debt represents a significant security liability that should be addressed before any potential acquisition.
            </p>

            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Recommendation</h4>
              <p className="text-sm text-red-800">
                Immediate remediation of authentication vulnerabilities is required. The presence of hardcoded credentials 
                and lack of session management creates unacceptable security risks that could lead to data breaches and 
                regulatory compliance issues.
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Demo Instructions:</strong> Click on any underlined text with citation numbers to view detailed evidence, 
              source analysis, and add notes or corrections.
            </p>
          </div>
        </CardContent>
      </Card>

      {activeCitation && (
        <EvidenceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setActiveCitation(null)
          }}
          citation={activeCitation}
          notes={mockNotes}
          onAddNote={handleAddNote}
          userRole="pe_user"
          userName="Demo User"
        />
      )}
    </div>
  )
} 