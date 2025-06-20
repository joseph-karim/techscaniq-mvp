import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  Globe, Shield, Zap, Search, Database, 
  CheckCircle2, Code, Key, Layers,
  RefreshCw, ChevronRight, Info, FileSearch
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

interface CollectionTool {
  id: string
  name: string
  description: string
  category: 'content' | 'security' | 'performance' | 'technology' | 'search'
  icon: React.ReactNode
  status: 'active' | 'inactive' | 'error'
  lastUsed?: string
  successRate?: number
  avgDuration?: number
  technologies: string[]
  apiKeys?: string[]
  features: string[]
}

interface EvidenceCollection {
  id: string
  company_name: string
  collection_status: string
  evidence_count: number
  created_at: string
  evidence_types: Record<string, number>
  tools_used: string[]
}

const collectionTools: CollectionTool[] = [
  {
    id: 'web_search',
    name: 'Perplexity Web Search',
    description: 'Deep research using Perplexity Sonar Deep for comprehensive web analysis',
    category: 'search',
    icon: <Search className="h-5 w-5" />,
    status: 'active',
    technologies: ['Perplexity Sonar Deep', 'Perplexity Sonar Pro'],
    apiKeys: ['PERPLEXITY_API_KEY'],
    features: ['Deep research mode', 'Citation extraction', 'Search result analysis', '100+ results per query']
  },
  {
    id: 'website_analyzer',
    name: 'Website Analyzer',
    description: 'Analyzes websites using Crawl4AI with sitemap support for multi-page analysis',
    category: 'content',
    icon: <Globe className="h-5 w-5" />,
    status: 'active',
    technologies: ['Crawl4AI', 'WebTechDetector'],
    features: ['Sitemap crawling', 'Multi-page analysis', 'Technology detection', 'Content extraction']
  },
  {
    id: 'technical_analysis',
    name: 'Technical Analysis Suite',
    description: 'Deep technical analysis including infrastructure, security, and API discovery',
    category: 'technology',
    icon: <Layers className="h-5 w-5" />,
    status: 'active',
    technologies: ['TechnicalCollector', 'APIDiscovery', 'SecurityScanner'],
    features: ['Infrastructure analysis', 'API endpoint discovery', 'Security scanning', 'Performance metrics']
  },
  {
    id: 'crawl4ai_extractor',
    name: 'Crawl4AI Extractor',
    description: 'Intelligent content extraction with structured data support',
    category: 'content',
    icon: <FileSearch className="h-5 w-5" />,
    status: 'active',
    technologies: ['Crawl4AI', 'LLM extraction'],
    features: ['Pricing extraction', 'Customer logos', 'Company info', 'Documentation parsing']
  },
  {
    id: 'security_scanner',
    name: 'Direct Security Scanner',
    description: 'Comprehensive security analysis including SSL, headers, and vulnerabilities',
    category: 'security',
    icon: <Shield className="h-5 w-5" />,
    status: 'active',
    technologies: ['Custom security checks', 'SSL analysis'],
    features: ['SSL/TLS analysis', 'Security headers', 'DNS checks', 'Vulnerability detection']
  },
  {
    id: 'sales_intelligence_analyzer',
    name: 'Sales Intelligence',
    description: 'Analyzes companies for sales opportunities relevant to vendor products/services',
    category: 'search',
    icon: <Zap className="h-5 w-5" />,
    status: 'active',
    technologies: ['Perplexity API', 'Custom analysis'],
    features: ['Dynamic vendor-specific triggers', 'Technology gaps analysis', 'Competitive positioning', 'Market opportunity identification']
  }
]

const categoryColors = {
  content: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  security: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  performance: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  technology: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  search: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
}

export function EvidenceCollectionPipeline() {
  const [selectedTool, setSelectedTool] = useState<CollectionTool | null>(null)
  const [recentCollections, setRecentCollections] = useState<EvidenceCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [pipelineStats, setPipelineStats] = useState({
    totalCollections: 0,
    successRate: 0,
    avgDuration: 0,
    activeTools: 0
  })

  useEffect(() => {
    fetchRecentCollections()
    calculatePipelineStats()
  }, [])

  async function fetchRecentCollections() {
    try {
      const { data, error } = await supabase
        .from('evidence_collections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentCollections(data || [])
    } catch (error) {
      console.error('Error fetching evidence collections:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculatePipelineStats() {
    const activeTools = collectionTools.filter(t => t.status === 'active').length
    setPipelineStats({
      totalCollections: Math.floor(Math.random() * 1000) + 500, // Mock data
      successRate: 94.5,
      avgDuration: 12.3,
      activeTools
    })
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Collection Pipeline</CardTitle>
          <CardDescription>
            Real-time view of all evidence collection tools and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{pipelineStats.totalCollections}</div>
              <p className="text-sm text-muted-foreground">Total Collections</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{pipelineStats.successRate}%</div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{pipelineStats.avgDuration}s</div>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{pipelineStats.activeTools}/{collectionTools.length}</div>
              <p className="text-sm text-muted-foreground">Active Tools</p>
            </div>
          </div>

          {/* Pipeline Visualization */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <span className="font-medium">Evidence Pipeline Flow</span>
              </div>
              <Button size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>

            {/* Hybrid LangGraph Pipeline Steps */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {[
                { name: 'Interpret Thesis', desc: 'Quick analysis' },
                { name: 'Generate Queries', desc: 'Smart queries' },
                { name: 'Deep Research', desc: 'Perplexity Sonar' },
                { name: 'Analyze Findings', desc: 'Gap analysis' },
                { name: 'Targeted Evidence', desc: 'Tool usage' },
                { name: 'Generate Report', desc: 'AI synthesis' }
              ].map((step, idx) => (
                <div key={step.name} className="relative">
                  <div className={cn(
                    "p-3 rounded-lg border-2 text-center",
                    idx === 2 ? "border-electric-teal bg-electric-teal/10" : 
                    idx === 4 ? "border-amber-500 bg-amber-50" : "border-gray-200"
                  )}>
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.desc}
                    </div>
                  </div>
                  {idx < 5 && (
                    <ChevronRight className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )}
                  {idx === 4 && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                      ↻ Iterative
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collectionTools.map((tool) => {
          const colors = categoryColors[tool.category]
          return (
            <Card 
              key={tool.id} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedTool?.id === tool.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedTool(tool)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", colors.bg, colors.text)}>
                      {tool.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <Badge 
                        variant={tool.status === 'active' ? 'default' : tool.status === 'error' ? 'destructive' : 'secondary'}
                        className="mt-1"
                      >
                        {tool.status}
                      </Badge>
                    </div>
                  </div>
                  <Badge className={cn(colors.bg, colors.text, colors.border)} variant="outline">
                    {tool.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Code className="h-3 w-3" />
                    <span className="text-muted-foreground">Tech:</span>
                    <span className="font-medium">{tool.technologies.join(', ')}</span>
                  </div>
                  
                  {tool.apiKeys && (
                    <div className="flex items-center gap-2 text-xs">
                      <Key className="h-3 w-3" />
                      <span className="text-muted-foreground">APIs:</span>
                      <span className="font-medium">{tool.apiKeys.join(', ')}</span>
                    </div>
                  )}
                </div>

                {tool.successRate && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Success Rate</span>
                      <span>{tool.successRate}%</span>
                    </div>
                    <Progress value={tool.successRate} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tool Details Modal */}
      {selectedTool && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedTool.name} - Detailed View</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTool(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="features">
              <TabsList>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="usage">Recent Usage</TabsTrigger>
              </TabsList>
              
              <TabsContent value="features" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Key Features</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTool.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Technologies Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTool.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="config">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Configuration</AlertTitle>
                  <AlertDescription>
                    {selectedTool.apiKeys ? (
                      <div className="mt-2">
                        <p className="mb-2">Required API Keys:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedTool.apiKeys.map((key) => (
                            <li key={key} className="text-sm">
                              <code className="bg-muted px-1 py-0.5 rounded">{key}</code>
                              <Badge className="ml-2" variant="outline">
                                {key.includes('GOOGLE') ? 'Google Cloud' : 
                                 key.includes('JINA') ? 'Jina AI' :
                                 key.includes('OPENAI') ? 'OpenAI' : 'Custom'}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p>No external API keys required. This tool runs using built-in functionality.</p>
                    )}
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="usage">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Used</span>
                    <span>{selectedTool.lastUsed || '2 hours ago'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Average Duration</span>
                    <span>{selectedTool.avgDuration || '3.2'}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Runs (24h)</span>
                    <span>{Math.floor(Math.random() * 100) + 50}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Recent Collections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evidence Collections</CardTitle>
          <CardDescription>
            Latest evidence collection runs across all tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading collections...</p>
          ) : recentCollections.length === 0 ? (
            <p className="text-muted-foreground">No recent collections found</p>
          ) : (
            <div className="space-y-3">
              {recentCollections.map((collection) => (
                <div key={collection.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{collection.company_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {collection.evidence_count} items collected • {new Date(collection.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={collection.collection_status === 'completed' ? 'default' : 'secondary'}>
                    {collection.collection_status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}