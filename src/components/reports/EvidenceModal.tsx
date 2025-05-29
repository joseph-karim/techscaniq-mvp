import { useState } from 'react'
import { 
  X, 
  FileText, 
  Code, 
  Globe, 
  Database,
  Link,
  Eye,
  Brain,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Send,
  User,
  Calendar,
  TrendingUp,
  Info,
  Edit3,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Citation } from './EvidenceCitation'
import { Evidence } from './EvidenceCitation'

interface EvidenceNote {
  id: string
  author: string
  role: 'pe_user' | 'admin'
  content: string
  timestamp: string
  type: 'correction' | 'additional_info' | 'question' | 'clarification'
  status: 'pending' | 'reviewed' | 'incorporated'
}

interface EvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  citation: Citation
  onAddNote?: (note: Omit<EvidenceNote, 'id' | 'timestamp'>) => void
  notes?: EvidenceNote[]
  userRole?: 'pe_user' | 'admin'
  userName?: string
}

export function EvidenceModal({ 
  isOpen, 
  onClose, 
  citation, 
  onAddNote,
  notes = [],
  userRole = 'pe_user',
  userName = 'Current User'
}: EvidenceModalProps) {
  const [copied, setCopied] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<EvidenceNote['type']>('question')
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null)
  const [isAddingNote, setIsAddingNote] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    
    onAddNote?.({
      author: userName,
      role: userRole,
      content: newNote,
      type: noteType,
      status: 'pending'
    })
    
    setNewNote('')
    setIsAddingNote(false)
  }

  const getEvidenceIcon = (type: Evidence['type']) => {
    switch (type) {
      case 'code': return <Code className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'web': return <Globe className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'api': return <Link className="h-4 w-4" />
      case 'interview': return <Eye className="h-4 w-4" />
      case 'analysis': return <Brain className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getNoteTypeColor = (type: EvidenceNote['type']) => {
    switch (type) {
      case 'correction': return 'bg-red-100 text-red-800 border-red-200'
      case 'additional_info': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'question': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'clarification': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: EvidenceNote['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'incorporated': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 w-[90vw]">
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
          <DialogTitle className="flex items-center text-xl">
            <Brain className="mr-2 h-5 w-5 text-blue-600" />
            Evidence Analysis
          </DialogTitle>
          <DialogDescription>
            Detailed evidence supporting this finding with reasoning and conclusions
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4 mb-2 flex-shrink-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="evidence">Evidence Sources</TabsTrigger>
              <TabsTrigger value="reasoning">Analysis & Reasoning</TabsTrigger>
              <TabsTrigger value="notes" className="relative">
                Notes & Corrections
                {notes.length > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                    {notes.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-6">
                  {/* Main Claim */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Key Finding</span>
                        <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", getConfidenceBadgeColor(citation.confidence))}>
                          {citation.confidence}% Confidence
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg leading-relaxed">{citation.claim}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Analyst: {citation.analyst}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Reviewed: {citation.reviewDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{citation.evidence.length} Evidence Sources</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Evidence Quality</p>
                            <p className="text-2xl font-bold text-green-600">High</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Source Diversity</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {new Set(citation.evidence.map(e => e.type)).size}
                            </p>
                          </div>
                          <Database className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Verification Status</p>
                            <p className="text-2xl font-bold text-purple-600">Verified</p>
                          </div>
                          <Check className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Methodology */}
                  {citation.methodology && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Info className="mr-2 h-4 w-4" />
                          Analysis Methodology
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{citation.methodology}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Evidence Sources Tab */}
              <TabsContent value="evidence" className="mt-0">
                <div className="space-y-4">
                  {citation.evidence.map((evidence) => (
                    <Card key={evidence.id} className="border-l-4 border-l-blue-500">
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => setExpandedEvidence(
                          expandedEvidence === evidence.id ? null : evidence.id
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getEvidenceIcon(evidence.type)}
                            <div>
                              <CardTitle className="text-base">{evidence.title}</CardTitle>
                              <CardDescription>{evidence.source}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {evidence.metadata?.confidence && (
                              <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", getConfidenceBadgeColor(evidence.metadata.confidence))}>
                                {evidence.metadata.confidence}%
                              </div>
                            )}
                            {expandedEvidence === evidence.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {expandedEvidence === evidence.id && (
                        <CardContent className="pt-0">
                          <Separator className="mb-4" />
                          
                          {/* Evidence Excerpt */}
                          {evidence.excerpt && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-2">Relevant Content:</h4>
                              <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                {evidence.excerpt}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => handleCopy(evidence.excerpt!)}
                              >
                                {copied ? (
                                  <>
                                    <Check className="mr-1 h-3 w-3" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="mr-1 h-3 w-3" />
                                    Copy Content
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            {evidence.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(evidence.url, '_blank')}
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                View Source
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(JSON.stringify(evidence, null, 2))}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Copy Reference
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Reasoning Tab */}
              <TabsContent value="reasoning" className="mt-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Brain className="mr-2 h-4 w-4" />
                        Analysis & Reasoning
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{citation.reasoning}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Conclusions & Confidence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Key Conclusion:</h4>
                          <p className="text-sm leading-relaxed">{citation.claim}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Confidence Assessment:</h4>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Confidence Level</span>
                                <span className="font-medium">{citation.confidence}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    citation.confidence >= 90 ? "bg-green-500" :
                                    citation.confidence >= 70 ? "bg-yellow-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${citation.confidence}%` }}
                                />
                              </div>
                            </div>
                            <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", getConfidenceBadgeColor(citation.confidence))}>
                              {citation.confidence >= 90 ? 'High' :
                               citation.confidence >= 70 ? 'Medium' : 'Low'}
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-900 mb-1">Confidence Factors:</p>
                              <ul className="text-blue-800 space-y-1">
                                <li>• Multiple independent evidence sources</li>
                                <li>• Direct access to technical systems</li>
                                <li>• Verified through team interviews</li>
                                <li>• Consistent with industry benchmarks</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Notes & Corrections Tab */}
              <TabsContent value="notes" className="mt-0">
                <div className="space-y-4">
                  {/* Add Note Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Add Note or Correction
                      </CardTitle>
                      <CardDescription>
                        Share additional information, corrections, or questions about this evidence
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isAddingNote ? (
                        <Button onClick={() => setIsAddingNote(true)} className="w-full">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Add Note or Correction
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Note Type:</label>
                            <div className="flex gap-2 flex-wrap">
                              {(['question', 'correction', 'additional_info', 'clarification'] as const).map((type) => (
                                <Button
                                  key={type}
                                  variant={noteType === type ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setNoteType(type)}
                                >
                                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-2 block">Your Note:</label>
                            <Textarea
                              value={newNote}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
                              placeholder="Share your insights, corrections, or questions..."
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                              <Send className="mr-2 h-4 w-4" />
                              Submit Note
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Existing Notes */}
                  {notes.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">Previous Notes & Corrections</h3>
                      {notes.map((note) => (
                        <Card key={note.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{note.author}</span>
                                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", getNoteTypeColor(note.type))}>
                                  {note.type.replace('_', ' ')}
                                </span>
                                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", getStatusColor(note.status))}>
                                  {note.status}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">{note.timestamp}</span>
                            </div>
                            <p className="text-sm leading-relaxed">{note.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-1 h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 