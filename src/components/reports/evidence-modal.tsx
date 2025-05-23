import { useState } from 'react'
import { Check, Copy, ExternalLink, FileText, Info, ThumbsUp, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDateTime } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface Evidence {
  source: string
  url?: string
  content: string
  timestamp: string
  confidence: number
}

interface EvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  evidence: Evidence
  title: string
}

export function EvidenceModal({ isOpen, onClose, evidence, title }: EvidenceModalProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(evidence.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FileText className="mr-2 h-5 w-5 text-electric-teal" />
            Evidence for: {title}
          </DialogTitle>
          <DialogDescription>
            Source data supporting this finding
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="evidence" className="h-full flex flex-col">
            <TabsList className="mx-auto">
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="evidence" className="h-full m-0 overflow-hidden">
                <div className="rounded-md border bg-muted/50 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-slate-100">
                        {evidence.source === 'diffbot' ? 'Diffbot' :
                         evidence.source === 'crawl4ai' ? 'Crawl4ai' :
                         evidence.source === 'manual' ? 'Manual Entry' : evidence.source}
                      </Badge>
                      
                      {evidence.url && (
                        <a 
                          href={evidence.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-electric-teal flex items-center hover:underline"
                        >
                          {evidence.url.length > 50 ? `${evidence.url.substring(0, 50)}...` : evidence.url}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[calc(100%-3rem)] mt-2 rounded-md border p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{evidence.content}</p>
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="metadata" className="h-full m-0 overflow-auto p-4">
                <div className="space-y-4">
                  <div className="rounded-md border p-4">
                    <h3 className="mb-2 font-medium">Source Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source Type:</span>
                        <span className="font-medium">{evidence.source}</span>
                      </div>
                      
                      {evidence.url && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Source URL:</span>
                          <a 
                            href={evidence.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-electric-teal flex items-center hover:underline"
                          >
                            Open URL
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timestamp:</span>
                        <span className="font-medium">{formatDateTime(evidence.timestamp)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Content Length:</span>
                        <span className="font-medium">{evidence.content.length} characters</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <h3 className="mb-2 font-medium">Confidence Score</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>AI Confidence:</span>
                        <span className="font-medium">{evidence.confidence * 100}%</span>
                      </div>
                      
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${
                            evidence.confidence >= 0.9 ? 'bg-signal-green' :
                            evidence.confidence >= 0.7 ? 'bg-electric-teal' :
                            evidence.confidence >= 0.5 ? 'bg-caution-amber' : 'bg-risk-red'
                          }`}
                          style={{ width: `${evidence.confidence * 100}%` }}
                        />
                      </div>
                      
                      <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                        <Info className="inline-block mr-1 h-4 w-4" />
                        Confidence scores represent how certain our AI models are about this evidence. Scores above 90% indicate high reliability, while scores below 70% warrant additional verification.
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="verification" className="h-full m-0 overflow-auto p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border p-4">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-electric-teal" />
                      <span className="font-medium">Human Verified</span>
                    </div>
                    
                    <Badge variant="outline" className="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    <h3 className="mb-3 font-medium">Verification Trail</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-md border p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">AI Extraction</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(evidence.timestamp)}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Initial evidence extraction by AI system</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 rounded-md border border-electric-teal bg-electric-teal/5 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-teal/20">
                          <Check className="h-4 w-4 text-electric-teal" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Human Verification</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(new Date().toISOString())}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Evidence manually verified by TechScan IQ advisor</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <h3 className="mb-2 font-medium">Advisor Notes</h3>
                      <p className="text-sm text-muted-foreground">
                        This evidence was verified against the source repository and confirmed to be accurate. The API endpoint authentication issue is present in the code as described.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline" size="sm">
            <X className="mr-1 h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}