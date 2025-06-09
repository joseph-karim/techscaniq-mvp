import { useState, useEffect } from 'react'
import { 
  FileText, 
  Globe, 
  Database, 
  Code2, 
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Clock,
  Copy,
  AlertTriangle,
  TrendingUp,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { ComprehensiveScore } from '@/lib/scoring/comprehensive-scoring'

interface EnhancedEvidenceItem {
  id: string
  evidence_id: string
  type: string
  evidence_type?: string
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
    category?: string
  }
  metadata: any
  company_name: string
  confidence_score?: number
  created_at: string
}

interface EnhancedEvidenceAppendixProps {
  companyName: string
  reportId?: string
  comprehensiveScore?: ComprehensiveScore
  className?: string
}

// Map evidence types to categories for comprehensive scoring
const EVIDENCE_CATEGORY_MAP: Record<string, string> = {
  'technology_stack': 'technical',
  'tech_deep_dive': 'technical',
  'security_analysis': 'technical',
  'ssl_analysis': 'technical',
  'vulnerability_scan': 'technical',
  'performance_metrics': 'technical',
  'business_overview': 'business',
  'team_info': 'team',
  'market_analysis': 'market',
  'financial_info': 'financial',
  'website_content': 'business',
  'deep_crawl': 'technical'
}

// Critical evidence types from comprehensive scoring
const CRITICAL_EVIDENCE_TYPES = [
  'tech_stack',
  'api_architecture',
  'infrastructure',
  'security_headers',
  'performance_metrics',
  'integration_ecosystem'
]

// Get evidence category
const getEvidenceCategory = (item: EnhancedEvidenceItem): string => {
  const type = item.evidence_type || item.type
  return item.metadata?.category || 
         item.content_data?.category || 
         EVIDENCE_CATEGORY_MAP[type] || 
         'uncategorized'
}

// Check if evidence is critical
const isCriticalEvidence = (item: EnhancedEvidenceItem): boolean => {
  const type = item.evidence_type || item.type
  return CRITICAL_EVIDENCE_TYPES.includes(type)
}

// Get confidence color
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-green-600'
  if (confidence >= 0.6) return 'text-yellow-600'
  return 'text-red-600'
}

// Get confidence icon
const getConfidenceIcon = (confidence: number) => {
  if (confidence >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />
  if (confidence >= 0.6) return <AlertCircle className="h-4 w-4 text-yellow-600" />
  return <XCircle className="h-4 w-4 text-red-600" />
}

export function EnhancedEvidenceAppendix({ 
  companyName, 
  comprehensiveScore,
  className 
}: EnhancedEvidenceAppendixProps) {
  const { toast } = useToast()
  const [evidenceItems, setEvidenceItems] = useState<EnhancedEvidenceItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [confidenceFilter, setConfidenceFilter] = useState('all')
  const [criticalOnlyFilter, setCriticalOnlyFilter] = useState(false)
  
  // UI states
  const [activeTab, setActiveTab] = useState('by-category')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadEvidenceData()
  }, [companyName])

  const loadEvidenceData = async () => {
    if (!companyName) return
    
    setLoading(true)
    try {
      // Load evidence items
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('company_name', companyName)
        .order('confidence_score', { ascending: false })

      if (evidenceError) throw evidenceError

      setEvidenceItems(evidenceData || [])
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


  // Filter evidence items
  const filteredEvidence = evidenceItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content_data.summary?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const category = getEvidenceCategory(item)
    const matchesCategory = categoryFilter === 'all' || category === categoryFilter
    
    const confidence = item.confidence_score || 0.7
    const matchesConfidence = confidenceFilter === 'all' ||
      (confidenceFilter === 'high' && confidence >= 0.8) ||
      (confidenceFilter === 'medium' && confidence >= 0.6 && confidence < 0.8) ||
      (confidenceFilter === 'low' && confidence < 0.6)
    
    const matchesCritical = !criticalOnlyFilter || isCriticalEvidence(item)
    
    return matchesSearch && matchesCategory && matchesConfidence && matchesCritical
  })

  // Group evidence by category
  const evidenceByCategory = filteredEvidence.reduce((acc, item) => {
    const category = getEvidenceCategory(item)
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, EnhancedEvidenceItem[]>)

  // Calculate category statistics
  const categoryStats = Object.entries(evidenceByCategory).map(([category, items]) => {
    const avgConfidence = items.reduce((sum, item) => sum + (item.confidence_score || 0.7), 0) / items.length
    const criticalCount = items.filter(isCriticalEvidence).length
    return {
      category,
      count: items.length,
      avgConfidence,
      criticalCount
    }
  })

  // Get missing critical evidence
  const collectedTypes = new Set(evidenceItems.map(e => e.evidence_type || e.type))
  const missingCritical = CRITICAL_EVIDENCE_TYPES.filter(type => !collectedTypes.has(type))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Evidence Appendix</CardTitle>
          <CardDescription>Loading evidence data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Enhanced Evidence Appendix
              </CardTitle>
              <CardDescription>
                Complete evidence trail with confidence scoring and gap analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {evidenceItems.length} total items
              </Badge>
              <Badge variant="outline" className="text-green-600">
                {evidenceItems.filter(e => (e.confidence_score || 0.7) >= 0.8).length} high confidence
              </Badge>
              {missingCritical.length > 0 && (
                <Badge variant="destructive">
                  {missingCritical.length} missing critical
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Confidence Score Integration */}
          {comprehensiveScore && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-3">Evidence Impact on Scoring</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Evidence Quality</p>
                  <p className="text-lg font-semibold">
                    {Math.round(comprehensiveScore.confidenceBreakdown.evidenceQuality * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Evidence Coverage</p>
                  <p className="text-lg font-semibold">
                    {Math.round(comprehensiveScore.confidenceBreakdown.evidenceCoverage * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overall Confidence</p>
                  <p className="text-lg font-semibold">
                    {comprehensiveScore.confidenceBreakdown.overallConfidence}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Missing Critical</p>
                  <p className="text-lg font-semibold text-red-600">
                    {comprehensiveScore.confidenceBreakdown.missingCriticalEvidence.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Missing Critical Evidence Alert */}
          {missingCritical.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Missing Critical Evidence:</strong> The following tech-focused evidence types were not collected:
                <ul className="list-disc list-inside mt-2">
                  {missingCritical.map(type => (
                    <li key={type}>{type.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  Collecting these would improve confidence from {comprehensiveScore?.confidenceBreakdown.overallConfidence || 'N/A'}% to approximately {Math.min(100, (comprehensiveScore?.confidenceBreakdown.overallConfidence || 0) + missingCritical.length * 10)}%
                </p>
              </AlertDescription>
            </Alert>
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by confidence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Confidence</SelectItem>
                  <SelectItem value="high">High (&ge;80%)</SelectItem>
                  <SelectItem value="medium">Medium (60-79%)</SelectItem>
                  <SelectItem value="low">Low (&lt;60%)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={criticalOnlyFilter ? "default" : "outline"}
                onClick={() => setCriticalOnlyFilter(!criticalOnlyFilter)}
                className="min-w-fit"
              >
                <Target className="h-4 w-4 mr-2" />
                Critical Only
              </Button>
            </div>
          </div>

          {/* Category Overview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Evidence by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {categoryStats.map(stat => (
                <Card key={stat.category} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{stat.category}</span>
                    <Badge variant="outline" className="text-xs">
                      {stat.count}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Avg Confidence</span>
                      <span className={getConfidenceColor(stat.avgConfidence)}>
                        {Math.round(stat.avgConfidence * 100)}%
                      </span>
                    </div>
                    {stat.criticalCount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Critical</span>
                        <span className="font-medium">{stat.criticalCount}</span>
                      </div>
                    )}
                  </div>
                  <Progress 
                    value={stat.avgConfidence * 100} 
                    className="h-1 mt-2"
                  />
                </Card>
              ))}
            </div>
          </div>

          {/* Evidence Display */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="by-category">By Category</TabsTrigger>
              <TabsTrigger value="by-confidence">By Confidence</TabsTrigger>
              <TabsTrigger value="critical">Critical Evidence</TabsTrigger>
            </TabsList>

            <TabsContent value="by-category" className="mt-6">
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(evidenceByCategory).map(([category, items]) => (
                  <AccordionItem key={category} value={category} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon({ category })}
                          <span className="font-medium capitalize">{category}</span>
                          <Badge variant="outline">{items.length} items</Badge>
                        </div>
                        <div className="flex items-center gap-2 mr-4">
                          <span className="text-xs text-muted-foreground">
                            Avg: {Math.round(items.reduce((sum, item) => sum + (item.confidence_score || 0.7), 0) / items.length * 100)}%
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <EvidenceItemsList 
                        items={items} 
                        expandedItems={expandedItems}
                        setExpandedItems={setExpandedItems}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="by-confidence" className="mt-6">
              <div className="space-y-4">
                {filteredEvidence
                  .sort((a, b) => (b.confidence_score || 0.7) - (a.confidence_score || 0.7))
                  .map(item => (
                    <EvidenceItemCard 
                      key={item.id} 
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      onToggleExpand={() => {
                        const newExpanded = new Set(expandedItems)
                        if (expandedItems.has(item.id)) {
                          newExpanded.delete(item.id)
                        } else {
                          newExpanded.add(item.id)
                        }
                        setExpandedItems(newExpanded)
                      }}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="critical" className="mt-6">
              <div className="space-y-4">
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    Critical evidence types are essential for tech-focused due diligence and significantly impact confidence scores.
                  </AlertDescription>
                </Alert>
                {filteredEvidence
                  .filter(isCriticalEvidence)
                  .map(item => (
                    <EvidenceItemCard 
                      key={item.id} 
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      onToggleExpand={() => {
                        const newExpanded = new Set(expandedItems)
                        if (expandedItems.has(item.id)) {
                          newExpanded.delete(item.id)
                        } else {
                          newExpanded.add(item.id)
                        }
                        setExpandedItems(newExpanded)
                      }}
                      isCritical={true}
                    />
                  ))}
              </div>
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
  items: EnhancedEvidenceItem[]
  expandedItems: Set<string>
  setExpandedItems: (items: Set<string>) => void
}

function EvidenceItemsList({ items, expandedItems, setExpandedItems }: EvidenceItemsListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <EvidenceItemCard
          key={item.id}
          item={item}
          isExpanded={expandedItems.has(item.id)}
          onToggleExpand={() => {
            const newExpanded = new Set(expandedItems)
            if (expandedItems.has(item.id)) {
              newExpanded.delete(item.id)
            } else {
              newExpanded.add(item.id)
            }
            setExpandedItems(newExpanded)
          }}
        />
      ))}
    </div>
  )
}

// Individual evidence item card
interface EvidenceItemCardProps {
  item: EnhancedEvidenceItem
  isExpanded: boolean
  onToggleExpand: () => void
  isCritical?: boolean
}

function EvidenceItemCard({ item, isExpanded, onToggleExpand, isCritical }: EvidenceItemCardProps) {
  const { toast } = useToast()
  const confidence = item.confidence_score || 0.7
  const category = getEvidenceCategory(item)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Evidence content copied to clipboard"
    })
  }

  const downloadEvidence = () => {
    const content = JSON.stringify({
      id: item.evidence_id,
      type: item.type,
      category,
      confidence: confidence,
      source: item.source_data,
      content: item.content_data,
      metadata: item.metadata,
      timestamp: item.created_at
    }, null, 2)
    
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evidence-${item.type}-${item.evidence_id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className={`border-l-4 ${isCritical ? 'border-l-orange-400' : 'border-l-blue-200'}`}>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">
                    {item.content_data.summary || item.type}
                  </CardTitle>
                  <Badge className="text-xs" variant="outline">
                    {item.type.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {category}
                  </Badge>
                  {isCritical && (
                    <Badge variant="default" className="text-xs bg-orange-500">
                      Critical
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    {getConfidenceIcon(confidence)}
                    <span className={getConfidenceColor(confidence)}>
                      {Math.round(confidence * 100)}% confidence
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(item.created_at)}
                  </span>
                  {item.source_data.url && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Source
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isExpanded ? (
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
              {/* Confidence Details */}
              <div>
                <h4 className="text-sm font-medium mb-2">Confidence Analysis</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Evidence Confidence</span>
                    <div className="flex items-center gap-2">
                      <Progress value={confidence * 100} className="w-32" />
                      <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This evidence contributes to the {category} dimension score with {
                      confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'moderate' : 'low'
                    } confidence.
                  </p>
                </div>
              </div>

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
                  onClick={() => copyToClipboard(item.content_data.raw)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadEvidence}
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
  )
}

// Get icon for category
function getCategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'technical':
      return <Code2 className="h-4 w-4" />
    case 'business':
      return <TrendingUp className="h-4 w-4" />
    case 'market':
      return <Target className="h-4 w-4" />
    case 'team':
      return <Award className="h-4 w-4" />
    case 'financial':
      return <TrendingUp className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}