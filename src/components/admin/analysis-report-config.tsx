import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Brain, AlertCircle, CheckCircle2, Clock, 
  Copy, Save, TestTube, BarChart3,
  Terminal, Info, TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisStage {
  id: string
  name: string
  description: string
  model: string
  prompt: string
  tokens: { input: number; output: number }
  duration?: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  output?: string
}

interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google'
  version: string
  contextWindow: number
  costPer1kTokens: { input: number; output: number }
  capabilities: string[]
  status: 'available' | 'unavailable'
}

const modelConfigs: ModelConfig[] = [
  {
    id: 'claude-opus-4',
    name: 'Claude 4 Opus',
    provider: 'anthropic',
    version: '20250514',
    contextWindow: 200000,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    capabilities: ['Complex reasoning', 'Code analysis', 'Long context', 'Investment analysis'],
    status: 'available'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    version: '2024-04-09',
    contextWindow: 128000,
    costPer1kTokens: { input: 0.01, output: 0.03 },
    capabilities: ['General analysis', 'Code review', 'Technical writing'],
    status: 'unavailable'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    version: 'experimental',
    contextWindow: 1000000,
    costPer1kTokens: { input: 0.0001, output: 0.0004 },
    capabilities: ['Search grounding', 'Fast inference', 'Multimodal'],
    status: 'available'
  }
]

const analysisStages: AnalysisStage[] = [
  {
    id: 'evidence-chunking',
    name: 'Evidence Chunking',
    description: 'Splits evidence by category to manage context limits',
    model: 'System Process',
    prompt: 'Categories: technical, security, team, market, financial\nMax items per category: 10\nSorting: By confidence score',
    tokens: { input: 0, output: 0 },
    status: 'completed'
  },
  {
    id: 'tech-analysis',
    name: 'Technical Stack Analysis',
    description: 'Analyzes technology stack, architecture, and infrastructure',
    model: 'claude-opus-4',
    prompt: `You are an expert technical due diligence analyst for a PE firm...

Analyze the technology stack focusing on:
1. Core technologies and frameworks
2. Architecture patterns and scalability
3. Infrastructure and deployment
4. Development practices and CI/CD
5. Technical debt and modernization needs

Evidence: {TECHNICAL_EVIDENCE}

Provide structured analysis with confidence scores...`,
    tokens: { input: 15000, output: 3000 },
    status: 'completed'
  },
  {
    id: 'security-analysis',
    name: 'Security Assessment',
    description: 'Evaluates security posture and vulnerabilities',
    model: 'claude-3-opus',
    prompt: `Analyze security evidence for investment risk assessment...

Focus areas:
- Security headers and configurations
- Known vulnerabilities (CVEs)
- SSL/TLS implementation
- API security and exposed secrets
- Compliance considerations

Evidence: {SECURITY_EVIDENCE}

Rate security maturity 1-10 with justification...`,
    tokens: { input: 10000, output: 2500 },
    status: 'completed'
  },
  {
    id: 'report-generation',
    name: 'Investment Report Generation',
    description: 'Generates comprehensive investment thesis and recommendations',
    model: 'claude-3-opus',
    prompt: `Generate PE investment report based on technical analysis...

Company: {COMPANY_INFO}
Investment Thesis: {INVESTMENT_THESIS}
Technical Findings: {TECH_ANALYSIS}
Security Assessment: {SECURITY_ANALYSIS}

Structure:
1. Executive Summary (3-5 key points)
2. Investment Score (0-100) with rationale
3. Technology Overview
4. Risk Assessment
5. Value Creation Opportunities
6. Due Diligence Recommendations

Tone: Professional, data-driven, action-oriented...`,
    tokens: { input: 25000, output: 5000 },
    status: 'completed'
  }
]

export function AnalysisReportConfig() {
  const [selectedStage, setSelectedStage] = useState<AnalysisStage | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('claude-opus-4')
  const [testMode] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<string>('')
  const [stats] = useState({
    totalReports: 247,
    avgProcessingTime: 45.3,
    successRate: 94.5,
    totalTokensUsed: 15420000,
    estimatedCost: 2315.40
  })

  const calculatePipelineCost = () => {
    let totalCost = 0
    analysisStages.forEach(stage => {
      if (stage.model !== 'System Process') {
        const model = modelConfigs.find(m => m.id === stage.model)
        if (model) {
          const inputCost = (stage.tokens.input / 1000) * model.costPer1kTokens.input
          const outputCost = (stage.tokens.output / 1000) * model.costPer1kTokens.output
          totalCost += inputCost + outputCost
        }
      }
    })
    return totalCost.toFixed(2)
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis & Report Configuration</CardTitle>
          <CardDescription>
            Configure how evidence is analyzed and reports are generated using AI models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalReports}</div>
              <p className="text-sm text-muted-foreground">Reports Generated</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.avgProcessingTime}s</div>
              <p className="text-sm text-muted-foreground">Avg Processing</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.successRate}%</div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{(stats.totalTokensUsed / 1000000).toFixed(1)}M</div>
              <p className="text-sm text-muted-foreground">Tokens Used</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">${stats.estimatedCost}</div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
            </div>
          </div>

          {/* Analysis Pipeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Analysis Pipeline Flow</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Est. cost per report:</span>
                <Badge variant="secondary">${calculatePipelineCost()}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              {analysisStages.map((stage, idx) => (
                <Card 
                  key={stage.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedStage?.id === stage.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedStage(stage)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            stage.status === 'completed' ? "bg-green-100 text-green-700" :
                            stage.status === 'processing' ? "bg-blue-100 text-blue-700" :
                            stage.status === 'error' ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {idx + 1}
                          </div>
                          {stage.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {stage.status === 'processing' && <Clock className="h-4 w-4 text-blue-500 animate-pulse" />}
                          {stage.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        </div>
                        <div>
                          <div className="font-medium">{stage.name}</div>
                          <div className="text-sm text-muted-foreground">{stage.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">
                          {stage.model === 'System Process' ? (
                            <Terminal className="h-3 w-3 mr-1" />
                          ) : (
                            <Brain className="h-3 w-3 mr-1" />
                          )}
                          {stage.model}
                        </Badge>
                        {stage.tokens.input > 0 && (
                          <div className="text-muted-foreground">
                            {(stage.tokens.input / 1000).toFixed(1)}k → {(stage.tokens.output / 1000).toFixed(1)}k tokens
                          </div>
                        )}
                        {stage.duration && (
                          <div className="text-muted-foreground">
                            {stage.duration}s
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {modelConfigs.map((model) => (
          <Card key={model.id} className={cn(
            "relative",
            model.status === 'unavailable' && "opacity-60"
          )}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{model.name}</CardTitle>
                  <CardDescription>{model.provider} • {model.version}</CardDescription>
                </div>
                <Badge variant={model.status === 'available' ? 'default' : 'secondary'}>
                  {model.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Context Window</span>
                  <span className="font-medium">{(model.contextWindow / 1000).toFixed(0)}k tokens</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Input Cost</span>
                  <span className="font-medium">${model.costPer1kTokens.input}/1k</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Output Cost</span>
                  <span className="font-medium">${model.costPer1kTokens.output}/1k</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.map((cap) => (
                      <Badge key={cap} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stage Details */}
      {selectedStage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedStage.name} Configuration</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedStage(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="prompt">
              <TabsList>
                <TabsTrigger value="prompt">Prompt Template</TabsTrigger>
                <TabsTrigger value="test">Test & Debug</TabsTrigger>
                <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="prompt" className="space-y-4">
                <div>
                  <Label>Model Selection</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelConfigs.filter(m => m.status === 'available').map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} - ${model.costPer1kTokens.input}/1k input
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Prompt Template</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={editingPrompt || selectedStage.prompt}
                    onChange={(e) => setEditingPrompt(e.target.value)}
                    className="font-mono text-sm min-h-[300px]"
                    placeholder="Enter prompt template..."
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    Variables: {'{COMPANY_INFO}'}, {'{EVIDENCE}'}, {'{INVESTMENT_THESIS}'}, etc.
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Token Usage Estimation</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1 text-sm">
                      <div>Input tokens: ~{selectedStage.tokens.input.toLocaleString()}</div>
                      <div>Output tokens: ~{selectedStage.tokens.output.toLocaleString()}</div>
                      <div>Estimated cost: ${(
                        (selectedStage.tokens.input / 1000 * 0.015) + 
                        (selectedStage.tokens.output / 1000 * 0.075)
                      ).toFixed(2)}</div>
                    </div>
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="test">
                <div className="space-y-4">
                  <Alert>
                    <TestTube className="h-4 w-4" />
                    <AlertTitle>Test Mode</AlertTitle>
                    <AlertDescription>
                      Run this analysis stage with sample data to test prompt effectiveness
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Test Input</Label>
                    <Textarea 
                      className="font-mono text-sm min-h-[150px]"
                      placeholder="Paste sample evidence or input data..."
                    />
                  </div>

                  <Button className="w-full" disabled={testMode}>
                    <TestTube className="h-4 w-4 mr-2" />
                    {testMode ? 'Running Test...' : 'Run Test Analysis'}
                  </Button>

                  {selectedStage.output && (
                    <div className="space-y-2">
                      <Label>Test Output</Label>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap">{selectedStage.output}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="metrics">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">98.5%</div>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">12.3s</div>
                        <p className="text-sm text-muted-foreground">Avg Duration</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Token Usage Trend (Last 7 Days)</h4>
                    <div className="h-32 bg-muted rounded flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recent Errors</h4>
                    <div className="space-y-2">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Context length exceeded - Evidence too large (2 hours ago)
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis & Optimization</CardTitle>
          <CardDescription>
            Monitor and optimize AI model usage costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Month Spend</span>
              <span className="text-2xl font-bold">${stats.estimatedCost}</span>
            </div>
            
            <Progress value={75} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-medium">$3,000</div>
                <p className="text-xs text-muted-foreground">Monthly Budget</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">77%</div>
                <p className="text-xs text-muted-foreground">Budget Used</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">5 days</div>
                <p className="text-xs text-muted-foreground">Until Reset</p>
              </div>
            </div>

            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>Cost Optimization Tips</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                  <li>Consider using Gemini 2.0 Flash for initial analysis (400x cheaper)</li>
                  <li>Implement better evidence chunking to reduce token usage</li>
                  <li>Cache common analysis patterns to avoid redundant processing</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}