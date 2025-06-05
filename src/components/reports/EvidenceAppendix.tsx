import { useState, useEffect } from 'react'
import { 
  FileText, 
  Globe, 
  Database, 
  Search, 
  Code2, 
  Shield, 
  Gauge, 
  Brain,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Clock,
  Copy,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface EvidenceItem {
  id: string
  evidence_id: string
  type: string
  source_data: {
    url?: string
    query?: string
    tool?: string
    timestamp: string
  }
  content_data: {
    raw: string
    processed?: string
    summary?: string
  }
  metadata: any
  company_name: string
  breadcrumbs: Array<{
    tool: string
    timestamp: string
  }>
  classifications: Array<{
    category: string
    score: number
  }>
  created_at: string
}

interface EvidenceCollection {
  id: string
  company_name: string
  company_website: string
  evidence_count: number
  status: string
  collection_type: string
  created_at: string
  metadata?: {
    duration?: number
    tools?: string[]
    finalStoredCount?: number
  }
}

interface EvidenceAppendixProps {
  companyName: string
  reportId?: string
  className?: string
}

export function EvidenceAppendix({ companyName, className }: EvidenceAppendixProps) {
  const { toast } = useToast()
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([])
  const [collections, setCollections] = useState<EvidenceCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [toolFilter, setToolFilter] = useState('all')
  
  // UI states
  const [activeTab, setActiveTab] = useState('by-type')

  useEffect(() => {
    loadEvidenceData()
  }, [companyName])

  const loadEvidenceData = async () => {
    if (!companyName) return
    
    setLoading(true)
    try {
      // Load evidence collections for this company
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('evidence_collections')
        .select('*')
        .eq('company_name', companyName)
        .order('created_at', { ascending: false })

      if (collectionsError) throw collectionsError

      setCollections(collectionsData || [])

      // Load evidence items for this company
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('company_name', companyName)
        .order('created_at', { ascending: false })

      if (evidenceError) throw evidenceError

      setEvidenceItems(evidenceData || [])
      
      // Set active collection to the most recent one
      if (collectionsData && collectionsData.length > 0) {
        setActiveCollection(collectionsData[0].id)
      }

    } catch (error) {
      console.error('Error loading evidence data:', error)
      toast({
        title: "Error",
        description: "Failed to load evidence data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'website_content':
      case 'deep_crawl':
        return <Globe className="h-4 w-4" />
      case 'technology_stack':
      case 'tech_deep_dive':
        return <Code2 className="h-4 w-4" />
      case 'security_analysis':
      case 'ssl_analysis':
      case 'vulnerability_scan':
        return <Shield className="h-4 w-4" />
      case 'performance_metrics':
        return <Gauge className="h-4 w-4" />
      case 'business_overview':
      case 'team_info':
      case 'market_analysis':
      case 'financial_info':
        return <Search className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'html-collector':
      case 'playwright-crawler':
        return <Globe className="h-3 w-3" />
      case 'webtech-analyzer':
        return <Code2 className="h-3 w-3" />
      case 'security-scanner':
      case 'testssl-scanner':
      case 'nuclei-scanner':
        return <Shield className="h-3 w-3" />
      case 'performance-analyzer':
        return <Gauge className="h-3 w-3" />
      case 'google-search-collector':
        return <Search className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Evidence content copied to clipboard"
    })
  }

  const downloadEvidence = (evidence: EvidenceItem) => {
    const content = JSON.stringify({
      id: evidence.evidence_id,
      type: evidence.type,
      source: evidence.source_data,
      content: evidence.content_data,
      metadata: evidence.metadata,
      timestamp: evidence.created_at
    }, null, 2)
    
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evidence-${evidence.type}-${evidence.evidence_id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Filter evidence items
  const filteredEvidence = evidenceItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content_data.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.source_data.tool?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    
    const matchesCategory = categoryFilter === 'all' || 
      item.classifications.some(c => c.category === categoryFilter)
    
    const matchesTool = toolFilter === 'all' || item.source_data.tool === toolFilter
    
    return matchesSearch && matchesType && matchesCategory && matchesTool
  })

  // Group evidence by different criteria
  const evidenceByType = filteredEvidence.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, EvidenceItem[]>)

  const evidenceByTool = filteredEvidence.reduce((acc, item) => {
    const tool = item.source_data.tool || 'unknown'
    if (!acc[tool]) acc[tool] = []
    acc[tool].push(item)
    return acc
  }, {} as Record<string, EvidenceItem[]>)

  const evidenceByCategory = filteredEvidence.reduce((acc, item) => {
    item.classifications.forEach(classification => {
      if (!acc[classification.category]) acc[classification.category] = []
      acc[classification.category].push(item)
    })
    return acc
  }, {} as Record<string, EvidenceItem[]>)

  const uniqueTypes = [...new Set(evidenceItems.map(item => item.type))]
  const uniqueTools = [...new Set(evidenceItems.map(item => item.source_data.tool).filter(Boolean))] as string[]
  const uniqueCategories = [...new Set(evidenceItems.flatMap(item => 
    item.classifications.map(c => c.category)
  ))]

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Evidence Appendix</CardTitle>
            <CardDescription>Loading evidence data...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Evidence Appendix
              </CardTitle>
              <CardDescription>
                Complete evidence trail and source materials used in this report
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {evidenceItems.length} evidence items
              </Badge>
              <Badge variant="outline">
                {collections.length} collections
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Collection Summary */}
          {collections.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Evidence Collections</h3>
              <div className="grid gap-3">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      activeCollection === collection.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{collection.collection_type} scan</h4>
                            <Badge
                              variant={collection.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {collection.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {collection.evidence_count} items • {formatDate(collection.created_at)}
                            {collection.metadata?.duration && (
                              <> • {Math.round(collection.metadata.duration / 1000)}s</>
                            )}
                          </p>
                        </div>
                      </div>
                      {collection.metadata?.tools && (
                        <div className="flex flex-wrap gap-1">
                          {collection.metadata.tools.slice(0, 3).map((tool: string) => (
                            <Badge key={tool} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                          {collection.metadata.tools.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{collection.metadata.tools.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search evidence items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={toolFilter} onValueChange={setToolFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tools</SelectItem>
                  {uniqueTools.map(tool => (
                    <SelectItem key={tool} value={tool}>
                      {tool}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Evidence Display */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="by-type">By Type</TabsTrigger>
              <TabsTrigger value="by-tool">By Tool</TabsTrigger>
              <TabsTrigger value="by-category">By Category</TabsTrigger>
            </TabsList>

            <TabsContent value="by-type" className="mt-6">
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(evidenceByType).map(([type, items]) => (
                  <AccordionItem key={type} value={type} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        {getEvidenceIcon(type)}
                        <span className="font-medium">{type.replace(/_/g, ' ')}</span>
                        <Badge variant="outline">{items.length} items</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <EvidenceItemsList items={items} onCopy={copyToClipboard} onDownload={downloadEvidence} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="by-tool" className="mt-6">
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(evidenceByTool).map(([tool, items]) => (
                  <AccordionItem key={tool} value={tool} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        {getToolIcon(tool)}
                        <span className="font-medium">{tool}</span>
                        <Badge variant="outline">{items.length} items</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <EvidenceItemsList items={items} onCopy={copyToClipboard} onDownload={downloadEvidence} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="by-category" className="mt-6">
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(evidenceByCategory).map(([category, items]) => (
                  <AccordionItem key={category} value={category} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Brain className="h-4 w-4" />
                        <span className="font-medium capitalize">{category}</span>
                        <Badge variant="outline">{items.length} items</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <EvidenceItemsList items={items} onCopy={copyToClipboard} onDownload={downloadEvidence} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>

          {filteredEvidence.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No evidence found</h3>
              <p className="text-gray-500">
                No evidence items match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Component to display a list of evidence items
interface EvidenceItemsListProps {
  items: EvidenceItem[]
  onCopy: (text: string) => void
  onDownload: (evidence: EvidenceItem) => void
}

function EvidenceItemsList({ items, onCopy, onDownload }: EvidenceItemsListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (expandedItems.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="border-l-4 border-l-blue-200">
          <Collapsible
            open={expandedItems.has(item.id)}
            onOpenChange={() => toggleExpanded(item.id)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{item.content_data.summary || item.type}</CardTitle>
                      <Badge className="text-xs" variant="outline">
                        {item.type.replace(/_/g, ' ')}
                      </Badge>
                      {item.source_data.tool && (
                        <Badge variant="secondary" className="text-xs">
                          {item.source_data.tool}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.created_at)}
                      </span>
                      {item.source_data.url && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Source URL
                        </span>
                      )}
                      {item.classifications.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          {item.classifications.length} classifications
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedItems.has(item.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Source Information */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Source Information</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid gap-2 text-sm">
                        {item.source_data.url && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 min-w-16">URL:</span>
                            <a 
                              href={item.source_data.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {item.source_data.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {item.source_data.query && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 min-w-16">Query:</span>
                            <span className="font-mono text-xs bg-white p-1 rounded">
                              {item.source_data.query}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 min-w-16">Tool:</span>
                          <span>{item.source_data.tool || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 min-w-16">Timestamp:</span>
                          <span>{formatDate(item.source_data.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Classifications */}
                  {item.classifications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Classifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.classifications.map((classification, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {classification.category} ({Math.round(classification.score * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Content</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {item.content_data.processed ? (
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Processed:</span>
                            <p className="text-sm">{item.content_data.processed}</p>
                          </div>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                              View raw content
                            </summary>
                            <pre className="mt-2 bg-white p-2 rounded border overflow-x-auto text-xs">
                              {typeof item.content_data.raw === 'string' 
                                ? item.content_data.raw.substring(0, 500) + (item.content_data.raw.length > 500 ? '...' : '')
                                : JSON.stringify(JSON.parse(item.content_data.raw), null, 2).substring(0, 500) + '...'
                              }
                            </pre>
                          </details>
                        </div>
                      ) : (
                        <pre className="text-xs overflow-x-auto">
                          {typeof item.content_data.raw === 'string' 
                            ? item.content_data.raw.substring(0, 500) + (item.content_data.raw.length > 500 ? '...' : '')
                            : JSON.stringify(JSON.parse(item.content_data.raw), null, 2).substring(0, 500) + '...'
                          }
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCopy(item.content_data.raw)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownload(item)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    {item.source_data.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(item.source_data.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Source
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  )
}