import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  AlertTriangle, 
  ArrowLeft, 
  Bug, 
  Check, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Globe, 
  GripVertical, 
  Info, 
  Lock, 
  MessageSquare, 
  PenSquare, 
  Server, 
  Shield, 
  ThumbsDown, 
  ThumbsUp, 
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

// Mock review data
const mockScanData = {
  id: 'scan-2',
  company: 'DevSecOps Solutions',
  websiteUrl: 'https://devsecops-solutions.example.com',
  status: 'awaiting_review',
  date: '2023-04-05T09:15:22Z',
  user: 'John Investor',
  organization: 'Acme Capital',
  aiConfidence: 87,
  techHealthScore: {
    score: 6.2,
    grade: 'C',
    ai_generated_score: 6.5,
  },
  sections: [
    {
      id: 'architecture',
      title: 'Architecture Analysis',
      icon: Server,
      aiContent: `DevSecOps Solutions employs a microservices architecture deployed on Kubernetes with an event-driven approach for inter-service communication. Their backend is primarily built using Node.js (Express) and Go, with a React frontend. Data persistence layers include PostgreSQL for relational data and MongoDB for document storage.

Key architectural decisions include:
1. Service mesh implementation via Istio for traffic management
2. CI/CD pipeline through GitHub Actions and ArgoCD
3. Stateless services wherever possible for horizontal scaling
4. Infrastructure-as-Code using Terraform

The architecture exhibits strong scalability characteristics and has well-defined service boundaries. However, several concerns were identified:
- Event-driven communication lacks comprehensive error handling and retries
- Data consistency challenges across services without proper saga patterns
- Performance bottlenecks in the reporting service under high load
- Insufficient caching strategy causing redundant database calls`,
      confidence: 89,
      reviewerNotes: '',
      status: 'pending',
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      icon: Shield,
      aiContent: `DevSecOps Solutions demonstrates mixed security practices with several concerning findings. Their authentication system uses OAuth 2.0 with JWT, but token validation has implementation issues. Key findings include:

Critical Concerns:
- Multiple API endpoints lack proper authorization checks
- Customer data is stored unencrypted in MongoDB collections
- Development credentials found in GitHub repository history
- Container images run as root with excessive privileges

Positive Security Practices:
+ Regular dependency scanning through Dependabot
+ Network segmentation between production environments
+ Web Application Firewall (WAF) in front of public endpoints

Compliance Status:
- GDPR: Several gaps in data protection processes
- SOC2: Missing audit trails for system access
- PCI DSS: Does not meet requirements for data storage

Overall, the security posture requires significant improvement, particularly in API security, data protection, and secret management.`,
      confidence: 92,
      reviewerNotes: '',
      status: 'pending',
    },
    {
      id: 'code-quality',
      title: 'Code Quality & DevOps',
      icon: Bug,
      aiContent: `DevSecOps Solutions demonstrates moderate code quality and DevOps practices. Static analysis of their GitHub repositories reveals:

Code Quality Metrics:
- Test Coverage: 62% (below industry standard of 80%)
- Cyclomatic Complexity: Average 15 per method (higher than recommended 10)
- Duplication: 12% of code is duplicated across repositories
- Documentation: Inconsistent, particularly for backend services

DevOps Maturity:
+ CI/CD: Well-implemented automation for builds and deployments
+ Monitoring: Prometheus and Grafana cover most services
+ Infrastructure: Terraform used consistently for all environments
- Incident Management: No clear process or tooling identified

Notable Technical Debt:
1. Legacy authentication service with outdated dependencies
2. Inconsistent error handling patterns across services
3. Lack of proper database migration strategy
4. Manual deployment steps for database schema changes

The development practices show an organization in transition, with some modern approaches but significant areas for improvement.`,
      confidence: 85,
      reviewerNotes: '',
      status: 'pending',
    },
    {
      id: 'thesis-alignment',
      title: 'Thesis Alignment',
      icon: ThumbsUp,
      aiContent: `Based on the investment thesis criteria provided by Acme Capital, DevSecOps Solutions shows mixed alignment:

Strong Enablers:
+ Cloud-native architecture aligns well with scalability requirements
+ Modern tech stack featuring Kubernetes, Node.js, and React matches technology preferences
+ DevOps automation demonstrates operational efficiency focus

Key Blockers:
- Security vulnerabilities contradict the "security-first" requirement
- Data protection practices fall short of compliance expectations
- Technical debt in legacy components introduces scaling risk

Neutral Factors:
• Team size and structure appears appropriate for current stage
• Documentation practices are average for the industry
• Use of managed services is balanced with self-hosted components

Overall Alignment Score: 68%

The thesis alignment suggests this company has strong technical foundations but requires significant improvements in security practices and technical debt management before it would fully meet Acme Capital's investment criteria.`,
      confidence: 81,
      reviewerNotes: '',
      status: 'pending',
    },
  ],
  risks: [
    { 
      id: 'risk-1', 
      title: 'Unencrypted Customer Data Storage',
      category: 'security',
      severity: 'critical', 
      description: 'Customer data including PII is stored unencrypted in MongoDB collections, creating significant regulatory and security risks.',
      evidence: 'Database schema review and sample data analysis',
    },
    {
      id: 'risk-2',
      title: 'Missing API Authorization Checks',
      category: 'security',
      severity: 'high',
      description: 'Multiple API endpoints lack proper authorization verification, allowing potential privilege escalation.',
      evidence: 'API endpoint analysis and security testing',
    },
    {
      id: 'risk-3',
      title: 'Legacy Authentication Service',
      category: 'code',
      severity: 'medium',
      description: 'The authentication service uses deprecated libraries and has limited maintenance, creating a security and stability risk.',
      evidence: 'Repository dependency analysis',
    },
    {
      id: 'risk-4',
      title: 'Insufficient Error Handling in Event System',
      category: 'architecture',
      severity: 'medium',
      description: 'The event-driven communication system lacks comprehensive error handling and retry logic, potentially leading to data loss or inconsistency.',
      evidence: 'Code review and system architecture analysis',
    },
    {
      id: 'risk-5',
      title: 'Manual Database Migration Process',
      category: 'devops',
      severity: 'low',
      description: 'Database schema changes require manual deployment steps, increasing the risk of errors during updates.',
      evidence: 'DevOps workflow analysis',
    },
  ],
}

export default function AdvisorReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // In a real app, we would fetch the scan data based on the ID
  const scanData = mockScanData

  const [reviewData, setReviewData] = useState(scanData.sections.map(section => ({
    ...section,
    reviewerNotes: section.reviewerNotes,
    status: section.status,
    edited: false,
  })))
  
  const [activeSection, setActiveSection] = useState(reviewData[0]?.id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  
  const handleSectionUpdate = (sectionId: string, updates: Partial<typeof reviewData[0]>) => {
    setReviewData(prevData => 
      prevData.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates, edited: true }
          : section
      )
    )
  }
  
  const handleApproveAll = () => {
    setReviewData(prevData => 
      prevData.map(section => ({
        ...section,
        status: 'approved',
        edited: true,
      }))
    )
    
    toast({
      title: "All sections approved",
      description: "You can still make individual edits if needed",
    })
  }
  
  const handlePublishReport = () => {
    setIsSubmitting(true)
    
    // Simulate API call delay
    setTimeout(() => {
      toast({
        title: "Report published successfully!",
        description: "The investor has been notified that their report is ready.",
      })
      setIsSubmitting(false)
      setShowPublishDialog(false)
      
      // Navigate back to queue page after publishing
      setTimeout(() => {
        navigate('/advisor/queue')
      }, 1500)
    }, 2000)
  }
  
  const activeSectionData = reviewData.find(section => section.id === activeSection)
  const canPublish = reviewData.every(section => section.status === 'approved')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/advisor/queue">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Queue
              </a>
            </Button>
            <Badge variant="outline" className="rounded-sm px-1 text-xs">
              {id}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{scanData.company}</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <a 
              href={scanData.websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:text-primary"
            >
              {scanData.websiteUrl}
            </a>
            <span className="text-muted-foreground">•</span>
            <span>Requested by: {scanData.user} ({scanData.organization})</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleApproveAll}>
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            Approve All Sections
          </Button>
          
          <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-electric-teal hover:bg-electric-teal/90"
                disabled={!canPublish}
              >
                <FileText className="mr-2 h-4 w-4" />
                Publish Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publish Technical Due Diligence Report</DialogTitle>
                <DialogDescription>
                  This will publish the report and notify the investor that it's ready to view.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <h3 className="mb-2 font-medium">Report Summary</h3>
                <div className="space-y-2 rounded-md border bg-muted/50 p-3 text-sm">
                  <div><strong>Company:</strong> {scanData.company}</div>
                  <div><strong>Tech Health Score:</strong> {scanData.techHealthScore.score} ({scanData.techHealthScore.grade})</div>
                  <div><strong>Critical Risks:</strong> {scanData.risks.filter(r => r.severity === 'critical').length}</div>
                  <div><strong>High Risks:</strong> {scanData.risks.filter(r => r.severity === 'high').length}</div>
                </div>
                
                {!canPublish && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      All sections must be approved before publishing the report.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-electric-teal hover:bg-electric-teal/90"
                  disabled={!canPublish || isSubmitting}
                  onClick={handlePublishReport}
                >
                  {isSubmitting ? 'Publishing...' : 'Confirm & Publish'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Tech Health Score Card */}
      <Card className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-2">
          <div className="flex flex-col justify-between sm:flex-row sm:items-center">
            <div>
              <CardTitle>Tech Health Score Review</CardTitle>
              <CardDescription>
                Verify or adjust the AI-calculated technology health score
              </CardDescription>
            </div>
            
            <div className="mt-2 flex items-center gap-4 sm:mt-0">
              <div className="text-sm text-muted-foreground">AI Score: <span className="font-medium">{scanData.techHealthScore.ai_generated_score}</span></div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" 
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground"
                  onClick={() => {
                    // Decrease score logic
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Decrease</span>
                </Button>
                
                <div className="flex h-10 w-16 items-center justify-center rounded border text-lg font-medium">
                  {scanData.techHealthScore.score}
                </div>
                
                <Button
                  variant="outline" 
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground"
                  onClick={() => {
                    // Increase score logic
                  }}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="sr-only">Increase</span>
                </Button>
                
                <Badge 
                  variant="outline" 
                  className="ml-1 text-lg font-bold"
                >
                  {scanData.techHealthScore.grade}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Split Panel Review Interface */}
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[600px] rounded-lg border"
      >
        {/* Left Panel - Navigation */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="flex h-full flex-col">
            <div className="flex-1 p-4">
              <h2 className="mb-2 text-sm font-medium">Report Sections</h2>
              
              {reviewData.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-electric-teal/10 font-medium text-electric-teal'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center">
                    {React.createElement(section.icon, { className: "mr-2 h-4 w-4" })}
                    <span>{section.title}</span>
                  </div>
                  
                  {section.status === 'approved' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="mr-1 h-3 w-3" />
                      Approved
                    </Badge>
                  ) : section.status === 'flagged' ? (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Flagged
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Info className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </button>
              ))}
            </div>
            
            <div className="border-t p-4">
              <h3 className="mb-2 text-sm font-medium">Key Risks</h3>
              <div className="space-y-1">
                {scanData.risks
                  .filter(risk => risk.severity === 'critical' || risk.severity === 'high')
                  .map((risk) => (
                    <div 
                      key={risk.id}
                      className="flex items-center rounded-md px-2 py-1.5 text-xs hover:bg-muted/50"
                    >
                      <div className={`mr-2 h-2 w-2 rounded-full ${
                        risk.severity === 'critical' ? 'bg-risk-red' : 
                        risk.severity === 'high' ? 'bg-orange-500' : 
                        risk.severity === 'medium' ? 'bg-caution-amber' : 'bg-signal-green'
                      }`} />
                      <span className="truncate">{risk.title}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle className="bg-border">
          <GripVertical className="h-4 w-4" />
        </ResizableHandle>
        
        {/* Right Panel - Content */}
        <ResizablePanel defaultSize={80}>
          {activeSectionData && (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  {React.createElement(activeSectionData.icon, { className: "h-5 w-5" })}
                  <h2 className="text-xl font-medium">{activeSectionData.title}</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="text-electric-teal"
                  >
                    AI Confidence: {activeSectionData.confidence}%
                  </Badge>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant={activeSectionData.status === 'approved' ? 'default' : 'outline'}
                      size="sm"
                      className={activeSectionData.status === 'approved' ? 'bg-signal-green text-white hover:bg-signal-green/90' : ''}
                      onClick={() => handleSectionUpdate(activeSectionData.id, { status: 'approved' })}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    
                    <Button
                      variant={activeSectionData.status === 'flagged' ? 'default' : 'outline'}
                      size="sm"
                      className={activeSectionData.status === 'flagged' ? 'bg-caution-amber text-white hover:bg-caution-amber/90' : ''}
                      onClick={() => handleSectionUpdate(activeSectionData.id, { status: 'flagged' })}
                    >
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      Flag
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid flex-1 grid-rows-2 overflow-hidden md:grid-cols-2 md:grid-rows-1">
                {/* AI Generated Content */}
                <div className="border-b border-r p-0 md:border-b-0">
                  <div className="flex h-10 items-center border-b bg-muted/50 px-4">
                    <Badge variant="outline" className="bg-deep-navy text-white dark:bg-deep-navy">AI Generated</Badge>
                  </div>
                  <ScrollArea className="h-[calc(100%-40px)] p-4">
                    <div className="prose prose-sm dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {activeSectionData.aiContent}
                      </pre>
                    </div>
                  </ScrollArea>
                </div>
                
                {/* Advisor Review */}
                <div className="flex flex-col">
                  <div className="flex h-10 items-center justify-between border-b bg-muted/50 px-4">
                    <Badge variant="outline" className="bg-electric-teal text-white">Advisor Review</Badge>
                    <div className="flex items-center text-sm">
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <PenSquare className="h-3 w-3" />
                        Edit Content
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4">
                    <Tabs defaultValue="notes">
                      <TabsList className="w-full">
                        <TabsTrigger value="notes" className="flex-1">Reviewer Notes</TabsTrigger>
                        <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="notes" className="mt-4 space-y-4">
                        <Textarea
                          placeholder="Add your notes, corrections, or additional insights here..."
                          className="min-h-[200px] resize-none"
                          value={activeSectionData.reviewerNotes}
                          onChange={(e) => handleSectionUpdate(activeSectionData.id, { reviewerNotes: e.target.value })}
                        />
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Quick Actions:</span>
                          <Toggle aria-label="Add comment" size="sm">
                            <MessageSquare className="h-4 w-4" />
                            Comment
                          </Toggle>
                          <Toggle aria-label="Mark as incorrect" size="sm">
                            <X className="h-4 w-4" />
                            Incorrect
                          </Toggle>
                          <Toggle aria-label="Highlight" size="sm">
                            <PenSquare className="h-4 w-4" />
                            Highlight
                          </Toggle>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="preview" className="mt-4">
                        <div className="rounded border p-4">
                          <p className="text-sm text-muted-foreground">
                            Preview of how this section will appear to the investor after your review.
                          </p>
                          
                          <div className="mt-4 prose prose-sm dark:prose-invert">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                              {activeSectionData.aiContent}
                            </pre>
                            
                            {activeSectionData.reviewerNotes && (
                              <div className="mt-4 rounded-md border-l-4 border-electric-teal bg-electric-teal/5 p-4">
                                <h4 className="mb-2 font-medium text-electric-teal">Advisor Insights</h4>
                                <p>{activeSectionData.reviewerNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t p-4">
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentIndex = reviewData.findIndex(s => s.id === activeSection)
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : reviewData.length - 1
                      setActiveSection(reviewData[prevIndex].id)
                    }}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Previous Section
                  </Button>
                </div>
                
                <div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const currentIndex = reviewData.findIndex(s => s.id === activeSection)
                      const nextIndex = currentIndex < reviewData.length - 1 ? currentIndex + 1 : 0
                      setActiveSection(reviewData[nextIndex].id)
                    }}
                  >
                    Next Section
                    <ArrowLeft className="ml-1 h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Risks Review */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Review</CardTitle>
          <CardDescription>
            Review the AI-identified risks and their severity ratings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {scanData.risks.map((risk) => (
              <AccordionItem key={risk.id} value={risk.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center">
                    <div className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${
                      risk.severity === 'critical' ? 'bg-red-100 text-risk-red dark:bg-red-950/30' :
                      risk.severity === 'high' ? 'bg-orange-100 text-orange-500 dark:bg-orange-950/30' :
                      risk.severity === 'medium' ? 'bg-yellow-100 text-caution-amber dark:bg-yellow-950/30' :
                      'bg-green-100 text-signal-green dark:bg-green-950/30'
                    }`}>
                      {risk.category === 'security' ? <Lock className="h-4 w-4" /> :
                       risk.category === 'architecture' ? <Server className="h-4 w-4" /> :
                       risk.category === 'code' || risk.category === 'devops' ? <Bug className="h-4 w-4" /> :
                       <Info className="h-4 w-4" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{risk.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {risk.category.charAt(0).toUpperCase() + risk.category.slice(1)} • {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)} Risk
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mr-4">
                      <Toggle size="sm" aria-label="Approve risk">
                        <Check className="h-4 w-4" />
                      </Toggle>
                      <Toggle size="sm" aria-label="Flag risk">
                        <AlertTriangle className="h-4 w-4" />
                      </Toggle>
                      <Toggle size="sm" aria-label="Edit risk">
                        <PenSquare className="h-4 w-4" />
                      </Toggle>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pl-14">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Description</h4>
                      <p className="text-sm">{risk.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Evidence</h4>
                      <p className="text-sm">{risk.evidence}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Advisor Notes</h4>
                      <Textarea 
                        placeholder="Add additional context or adjustments to this risk..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Severity:</span>
                      <div className="flex gap-1">
                        <Toggle 
                          variant="outline"
                          size="sm"
                          pressed={risk.severity === 'critical'}
                          className={risk.severity === 'critical' ? 'border-risk-red bg-red-50 text-risk-red dark:bg-red-950/30' : ''}
                        >
                          Critical
                        </Toggle>
                        <Toggle 
                          variant="outline"
                          size="sm"
                          pressed={risk.severity === 'high'}
                          className={risk.severity === 'high' ? 'border-orange-500 bg-orange-50 text-orange-500 dark:bg-orange-950/30' : ''}
                        >
                          High
                        </Toggle>
                        <Toggle 
                          variant="outline"
                          size="sm"
                          pressed={risk.severity === 'medium'}
                          className={risk.severity === 'medium' ? 'border-caution-amber bg-yellow-50 text-caution-amber dark:bg-yellow-950/30' : ''}
                        >
                          Medium
                        </Toggle>
                        <Toggle 
                          variant="outline"
                          size="sm"
                          pressed={risk.severity === 'low'}
                          className={risk.severity === 'low' ? 'border-signal-green bg-green-50 text-signal-green dark:bg-green-950/30' : ''}
                        >
                          Low
                        </Toggle>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Adjust risk severities as needed before publishing</span>
          </div>
          <Button variant="outline" size="sm">
            <PenSquare className="mr-2 h-4 w-4" />
            Add Custom Risk
          </Button>
        </CardFooter>
      </Card>
      
      {/* Thesis Alignment Review */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Thesis Alignment</CardTitle>
          <CardDescription>
            Review how the company aligns with the investor's thesis criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col items-center rounded-md border bg-muted/20 p-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold">Overall Alignment Score:</div>
                <div className="text-2xl font-bold text-electric-teal">68%</div>
              </div>
              
              <div className="mt-4 flex items-center gap-4 sm:mt-0">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4 text-signal-green" />
                  <span className="text-sm">Enablers: <strong>2</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4 text-risk-red" />
                  <span className="text-sm">Blockers: <strong>1</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Neutral: <strong>3</strong></span>
                </div>
                
                <Button variant="outline" size="sm">
                  <PenSquare className="mr-2 h-4 w-4" />
                  Adjust Score
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="mb-2 flex items-center text-lg font-medium text-green-600">
                <ThumbsUp className="mr-2 h-5 w-5" />
                Enablers
              </h3>
              <Separator className="mb-4" />
              
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                  <h4 className="font-medium">Cloud-native architecture</h4>
                  <p className="mt-1 text-sm">Aligns well with scalability requirements</p>
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <PenSquare className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                  <h4 className="font-medium">Modern tech stack</h4>
                  <p className="mt-1 text-sm">Kubernetes, Node.js, and React matches technology preferences</p>
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <PenSquare className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="mb-2 flex items-center text-lg font-medium text-red-600">
                <ThumbsDown className="mr-2 h-5 w-5" />
                Blockers
              </h3>
              <Separator className="mb-4" />
              
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                  <h4 className="font-medium">Security vulnerabilities</h4>
                  <p className="mt-1 text-sm">Contradicts the "security-first" requirement</p>
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <PenSquare className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Final Review and Submission */}
      <Card className="border-electric-teal bg-electric-teal/5">
        <CardHeader>
          <CardTitle>Final Review Checklist</CardTitle>
          <CardDescription>
            Complete these checks before publishing the report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Toggle aria-label="Tech health score verified">
                  <Check className="h-4 w-4" />
                </Toggle>
              </div>
              <div>
                <div className="font-medium">Tech Health Score is accurate</div>
                <p className="text-sm text-muted-foreground">
                  Review and confirm the overall technical health assessment
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Toggle aria-label="All sections reviewed">
                  <Check className="h-4 w-4" />
                </Toggle>
              </div>
              <div>
                <div className="font-medium">All sections have been reviewed</div>
                <p className="text-sm text-muted-foreground">
                  Ensure each section has been thoroughly reviewed and approved
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Toggle aria-label="Risk assessment verified">
                  <Check className="h-4 w-4" />
                </Toggle>
              </div>
              <div>
                <div className="font-medium">Risk assessment is thorough</div>
                <p className="text-sm text-muted-foreground">
                  Confirm all significant risks are identified with accurate severities
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Toggle aria-label="Thesis alignment assessed">
                  <Check className="h-4 w-4" />
                </Toggle>
              </div>
              <div>
                <div className="font-medium">Thesis alignment accurately reflects investor criteria</div>
                <p className="text-sm text-muted-foreground">
                  Verify that enablers and blockers match the investment thesis
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Toggle aria-label="Evidence validated">
                  <Check className="h-4 w-4" />
                </Toggle>
              </div>
              <div>
                <div className="font-medium">Evidence has been validated</div>
                <p className="text-sm text-muted-foreground">
                  Confirm that all evidence citations are accurate and relevant
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full bg-electric-teal hover:bg-electric-teal/90"
            onClick={() => setShowPublishDialog(true)}
            disabled={!canPublish}
          >
            <FileText className="mr-2 h-4 w-4" />
            Publish Technical Due Diligence Report
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}