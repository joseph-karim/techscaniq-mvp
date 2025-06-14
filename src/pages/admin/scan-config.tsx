import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Play, 
  Clock,
  AlertCircle,
  Zap,
  Database,
  Activity,
  Eye,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { mockDemoScanRequests } from '@/lib/mock-demo-data'
import { formatDate } from '@/lib/utils'

interface ScanRequest {
  id: string
  company_name: string
  website_url?: string
  company_website?: string
  status: string
  created_at: string
  requestor_name: string
  organization_name: string
  ai_confidence?: number | null
  is_demo?: boolean
}

interface EvidenceCollection {
  id: string
  company_name: string
  company_website: string
  evidence_count: number
  status: 'processing' | 'completed' | 'failed'
  collection_type: 'shallow' | 'deep' | 'comprehensive'
  created_at: string
  metadata?: {
    duration?: number
    tools?: string[]
    finalStoredCount?: number
  }
}

export default function ScanConfigPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  
  const [scanRequest, setScanRequest] = useState<ScanRequest | null>(null)
  const [selectedDepth, setSelectedDepth] = useState<'shallow' | 'deep' | 'comprehensive'>('deep')
  const [notes, setNotes] = useState('')
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectionProgress, setCollectionProgress] = useState(0)
  const [currentCollection, setCurrentCollection] = useState<EvidenceCollection | null>(null)
  const [collectionHistory, setCollectionHistory] = useState<EvidenceCollection[]>([])
  const [collectionStatus, setCollectionStatus] = useState<string>('')

  useEffect(() => {
    // Load scan request from database or demo data
    const loadScanRequest = async () => {
      if (!id) return
      
      // First try to find in demo data
      const demoRequest = mockDemoScanRequests.find(r => r.id === id)
      if (demoRequest) {
        setScanRequest({ ...demoRequest, is_demo: true })
        await loadCollectionHistory(demoRequest.company_name)
        return
      }
      
      // If not found in demo data, try database
      try {
        const { data, error } = await supabase
          .from('scan_requests')
          .select('*')
          .eq('id', id)
          .single()
        
        if (data && !error) {
          setScanRequest({ ...data, is_demo: false })
          await loadCollectionHistory(data.company_name)
        }
      } catch (error) {
        console.error('Failed to load scan request:', error)
      }
    }
    
    loadScanRequest()
  }, [id])

  const loadCollectionHistory = async (companyName?: string) => {
    const targetCompanyName = companyName || scanRequest?.company_name
    if (!targetCompanyName) return
    
    try {
      const { data, error } = await supabase
        .from('evidence_collections')
        .select('*')
        .eq('company_name', targetCompanyName)
        .order('created_at', { ascending: false })
      
      if (data && !error) {
        setCollectionHistory(data)
      }
    } catch (error) {
      console.error('Failed to load collection history:', error)
    }
  }

  const triggerEvidenceCollection = async () => {
    if (!scanRequest) return
    
    setIsCollecting(true)
    setCollectionProgress(10)
    setCollectionStatus('Initializing evidence collection...')
    
    try {
      // Call the evidence-orchestrator function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evidence-orchestrator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyName: scanRequest.company_name,
          companyWebsite: scanRequest.website_url || scanRequest.company_website,
          depth: selectedDepth
        })
      })

      setCollectionProgress(30)
      setCollectionStatus('Evidence collection in progress...')

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          // If JSON parsing fails, use the default error message
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      if (result.success) {
        setCollectionProgress(100)
        setCollectionStatus('Evidence collection completed successfully!')
        
        // Update current collection with results
        setCurrentCollection({
          id: result.collectionId,
          company_name: scanRequest.company_name,
          company_website: scanRequest.website_url || scanRequest.company_website || '',
          evidence_count: result.summary.total,
          status: 'completed',
          collection_type: selectedDepth,
          created_at: new Date().toISOString(),
          metadata: {
            duration: result.summary.duration,
            tools: result.summary.tools,
            finalStoredCount: result.summary.successCount
          }
        })
        
        // Update scan request status (only for real requests, not demo)
        if (!scanRequest.is_demo) {
          await supabase
            .from('scan_requests')
            .update({ 
              status: 'awaiting_review',
              ai_confidence: 85 // Default confidence for successful evidence collection
            })
            .eq('id', scanRequest.id)
        }
        
        // Reload collection history
        await loadCollectionHistory()
        
        // Add notes if provided
        if (notes.trim()) {
          await supabase
            .from('scan_request_notes')
            .insert({
              scan_request_id: scanRequest.id,
              note_type: 'collection_config',
              content: notes,
              created_by: 'admin'
            })
        }
        
      } else {
        throw new Error(result.error || 'Evidence collection failed')
      }
      
    } catch (error) {
      console.error('Evidence collection failed:', error)
      
      // Check if it's a CORS or network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setCollectionStatus('Failed: Unable to connect to evidence collection service')
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to the evidence collection service. Please check if the service is running.',
          variant: 'destructive'
        })
      } else {
        setCollectionStatus(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        toast({
          title: 'Evidence Collection Failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          variant: 'destructive'
        })
      }
      
      setCurrentCollection(null)
    } finally {
      setIsCollecting(false)
    }
  }

  const getDepthDescription = (depth: string) => {
    switch (depth) {
      case 'shallow':
        return 'Basic website analysis and business information (5-10 minutes)'
      case 'deep':
        return 'Comprehensive technical analysis with security scans (10-20 minutes)'
      case 'comprehensive':
        return 'Full analysis including market research and team info (20-40 minutes)'
      default:
        return ''
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!scanRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Scan request not found</h3>
          <p className="text-gray-500">The requested scan configuration could not be loaded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-heading font-medium">{scanRequest.company_name}</h1>
              {scanRequest.is_demo && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Demo Data
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{scanRequest.website_url || scanRequest.company_website}</p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize">
          {(scanRequest as any).priority || 'medium'} Priority
        </Badge>
      </div>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Request Details</CardTitle>
          <CardDescription>
            Review the details before configuring evidence collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Requested By</Label>
              <p className="text-sm">{scanRequest.requestor_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Organization</Label>
              <p className="text-sm">{scanRequest.organization_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Submitted</Label>
              <p className="text-sm">{formatDate(scanRequest.created_at)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant="outline">{scanRequest.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configure">Configure Collection</TabsTrigger>
          <TabsTrigger value="progress">Collection Progress</TabsTrigger>
          <TabsTrigger value="history">Collection History</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Collection Configuration</CardTitle>
              <CardDescription>
                Configure the depth and scope of evidence collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Collection Depth</Label>
                <Select value={selectedDepth} onValueChange={(value: 'shallow' | 'deep' | 'comprehensive') => setSelectedDepth(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shallow">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Shallow Scan</div>
                          <div className="text-xs text-muted-foreground">Basic analysis</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="deep">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Deep Scan</div>
                          <div className="text-xs text-muted-foreground">Comprehensive technical analysis</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="comprehensive">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Comprehensive Scan</div>
                          <div className="text-xs text-muted-foreground">Full analysis with market research</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {getDepthDescription(selectedDepth)}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Collection Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any specific instructions or context for this evidence collection..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={triggerEvidenceCollection}
                  disabled={isCollecting}
                  className="bg-brand-digital-teal hover:bg-brand-digital-teal/90 font-medium"
                >
                  {isCollecting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Collecting Evidence...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Evidence Collection
                    </>
                  )}
                </Button>
                
                {currentCollection && (
                  <Button variant="outline" asChild>
                    <Link to={`/scans/${id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Scan Details
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection Progress</CardTitle>
              <CardDescription>
                Real-time status of evidence collection process
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCollecting || currentCollection ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">{collectionProgress}%</span>
                  </div>
                  <Progress value={collectionProgress} className="h-2" />
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{collectionStatus}</p>
                  </div>

                  {currentCollection && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-brand-digital-teal">{currentCollection.evidence_count}</div>
                        <div className="text-sm text-muted-foreground">Evidence Items</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {currentCollection.metadata?.duration ? `${(currentCollection.metadata.duration / 1000).toFixed(1)}s` : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {currentCollection.metadata?.tools?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Tools Used</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active collection. Start a new collection to see progress here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collection History</CardTitle>
              <CardDescription>
                Previous evidence collections for {scanRequest.company_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collectionHistory.length > 0 ? (
                <div className="space-y-4">
                  {collectionHistory.map((collection) => (
                    <div key={collection.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(collection.status)}>
                              {collection.status}
                            </Badge>
                            <span className="text-sm font-medium capitalize">
                              {collection.collection_type} Collection
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(collection.created_at)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Evidence Items: <span className="font-medium">{collection.evidence_count}</span></p>
                            {collection.metadata?.duration && (
                              <p>Duration: <span className="font-medium">{(collection.metadata.duration / 1000).toFixed(1)}s</span></p>
                            )}
                            {collection.metadata?.tools && (
                              <p>Tools: <span className="font-medium">{collection.metadata.tools.join(', ')}</span></p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {collection.status === 'completed' && (
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/evidence-review/${collection.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No previous collections found for this company.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}