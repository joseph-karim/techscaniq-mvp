import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Building2, Calendar, FileText, MessageSquare, Shield, Server, Code, AlertTriangle, Send } from 'lucide-react'
import { useAuth } from '@/lib/auth/mock-auth-provider'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ScanRequest {
  id: string
  company_name: string
  website_url: string
  status: string
  created_at: string
  requestor_name: string
  organization_name: string
  ai_confidence: number | null
  tech_health_score: number | null
  tech_health_grade: string | null
  sections: any[]
  risks: any[]
  executive_report_data: any
  reviewer_notes: string | null
  published_at: string | null
}

interface AdditionalNote {
  id: string
  scan_request_id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
}

export default function ViewReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [scanRequest, setScanRequest] = useState<ScanRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [additionalNotes, setAdditionalNotes] = useState<AdditionalNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [sendingNote, setSendingNote] = useState(false)
  
  // Fetch scan request and additional notes
  useEffect(() => {
    async function fetchData() {
      if (!id) return
      
      try {
        // Fetch scan request
        const { data: scanData, error: scanError } = await supabase
          .from('scan_requests')
          .select('*')
          .eq('id', id)
          .single()
        
        if (scanError) throw scanError
        
        setScanRequest(scanData)
        
        // Fetch additional notes (from a notes table we'll create)
        const { data: notesData, error: notesError } = await supabase
          .from('scan_request_notes')
          .select('*')
          .eq('scan_request_id', id)
          .order('created_at', { ascending: false })
        
        if (notesData && !notesError) {
          setAdditionalNotes(notesData)
        }
      } catch (error) {
        console.error('Error fetching report:', error)
        toast({
          title: "Error",
          description: "Failed to load report",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Set up realtime subscription for notes
    const subscription = supabase
      .channel(`scan_request_notes:${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'scan_request_notes',
        filter: `scan_request_id=eq.${id}`
      }, (payload) => {
        setAdditionalNotes(prev => [payload.new as AdditionalNote, ...prev])
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [id, toast])
  
  const handleSendNote = async () => {
    if (!newNote.trim() || !scanRequest) return
    
    setSendingNote(true)
    try {
      const { error } = await supabase
        .from('scan_request_notes')
        .insert({
          scan_request_id: scanRequest.id,
          author_id: user?.id,
          author_name: user?.user_metadata?.name || user?.email || 'Unknown',
          content: newNote.trim()
        })
      
      if (error) throw error
      
      setNewNote('')
      toast({
        title: "Note added",
        description: "Your note has been added to the report"
      })
    } catch (error) {
      console.error('Error sending note:', error)
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive"
      })
    } finally {
      setSendingNote(false)
    }
  }
  
  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading report...</div>
  }
  
  if (!scanRequest) {
    return <div className="flex items-center justify-center h-64">Report not found</div>
  }
  
  const isRequestor = user?.email === scanRequest.requestor_name || user?.user_metadata?.name === scanRequest.requestor_name
  const isAdmin = user?.user_metadata?.role === 'admin'
  const canViewFullReport = scanRequest.status === 'complete' && (isRequestor || isAdmin)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mt-2">{scanRequest.company_name} - Technical Due Diligence</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(scanRequest.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {scanRequest.organization_name}
            </span>
            {scanRequest.published_at && (
              <Badge variant="outline" className="text-green-600">
                Published {formatDate(scanRequest.published_at)}
              </Badge>
            )}
          </div>
        </div>
        
        {isAdmin && scanRequest.status !== 'complete' && (
          <Button onClick={() => navigate(`/advisor/review/${scanRequest.id}`)}>
            Continue Review
          </Button>
        )}
      </div>
      
      {/* Status Alert */}
      {!canViewFullReport && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This report is currently {scanRequest.status === 'processing' ? 'being processed' : 
            scanRequest.status === 'awaiting_review' ? 'awaiting review' : 
            scanRequest.status === 'in_review' ? 'under review' : 
            'in progress'}. You'll be notified once it's complete.
          </AlertDescription>
        </Alert>
      )}
      
      {canViewFullReport && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            {scanRequest.executive_report_data && (
              <TabsTrigger value="executive">Executive Report</TabsTrigger>
            )}
            <TabsTrigger value="notes">Notes & Updates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
                <CardDescription>Overall assessment and key findings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tech Health Score */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">Technology Health Score</h3>
                    <p className="text-sm text-muted-foreground">Overall technical assessment</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{scanRequest.tech_health_score || 'N/A'}</div>
                    {scanRequest.tech_health_grade && (
                      <Badge className="text-lg" variant="outline">
                        Grade: {scanRequest.tech_health_grade}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* AI Confidence */}
                {scanRequest.ai_confidence !== null && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">AI Analysis Confidence</h3>
                      <p className="text-sm text-muted-foreground">Reliability of automated findings</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-electric-teal"
                          style={{ width: `${scanRequest.ai_confidence}%` }}
                        />
                      </div>
                      <span className="font-medium">{scanRequest.ai_confidence}%</span>
                    </div>
                  </div>
                )}
                
                {/* Reviewer Notes */}
                {scanRequest.reviewer_notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Advisor Insights</h3>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{scanRequest.reviewer_notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="technical">
            <div className="space-y-4">
              {scanRequest.sections?.filter(s => s.id === 'architecture' || s.id === 'code-quality').map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {section.id === 'architecture' ? <Server className="h-5 w-5" /> : <Code className="h-5 w-5" />}
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans">{section.aiContent}</pre>
                      {section.reviewerNotes && (
                        <div className="mt-4 p-4 border-l-4 border-electric-teal bg-electric-teal/5">
                          <h4 className="font-semibold text-electric-teal mb-2">Advisor Notes</h4>
                          <p>{section.reviewerNotes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scanRequest.sections?.find(s => s.id === 'security') ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">
                      {scanRequest.sections.find(s => s.id === 'security')?.aiContent}
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No security analysis available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="risks">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Identified risks and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scanRequest.risks?.map((risk: any) => (
                    <div key={risk.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{risk.title}</h4>
                        <Badge 
                          variant="outline"
                          className={
                            risk.severity === 'critical' ? 'text-red-600' :
                            risk.severity === 'high' ? 'text-orange-500' :
                            risk.severity === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{risk.description}</p>
                      {risk.evidence && (
                        <div className="text-sm">
                          <span className="font-medium">Evidence: </span>
                          <span className="text-muted-foreground">{risk.evidence}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {scanRequest.executive_report_data && (
            <TabsContent value="executive">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Executive Report
                  </CardTitle>
                  <CardDescription>
                    Comprehensive investor-aligned assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h3>Executive Summary</h3>
                    <p>{scanRequest.executive_report_data.executiveSummary?.overallAssessment}</p>
                    
                    <h3>Key Findings</h3>
                    <ul>
                      {scanRequest.executive_report_data.executiveSummary?.keyFindings?.map((finding: string, i: number) => (
                        <li key={i}>{finding}</li>
                      ))}
                    </ul>
                    
                    <h3>Investment Decision</h3>
                    <p>{scanRequest.executive_report_data.recommendations?.investmentDecision}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Additional Notes & Updates
                </CardTitle>
                <CardDescription>
                  Post-report communications and evidence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new note */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add additional notes, evidence, or updates..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSendNote}
                      disabled={!newNote.trim() || sendingNote}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendingNote ? 'Sending...' : 'Send Note'}
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                {/* Notes list */}
                <div className="space-y-4">
                  {additionalNotes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No additional notes yet
                    </p>
                  ) : (
                    additionalNotes.map((note) => (
                      <div key={note.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{note.author_name}</span>
                          <span className="text-muted-foreground">
                            {formatDate(note.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
} 