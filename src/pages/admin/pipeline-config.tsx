import { useState, useEffect } from 'react'
import { 
  Zap,
  Save,
  RefreshCw,
  Edit3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface AiPrompt {
  id: string
  name: string
  description: string
  prompt_text: string
  category: string
  function_name?: string
  version: number
  is_active: boolean
  variables: string[]
  metadata?: any
  created_at: string
  updated_at: string
}

interface ScanConfiguration {
  id: string
  name: string
  description: string
  depth: 'shallow' | 'deep' | 'comprehensive' | 'custom'
  configuration: {
    phases: string[]
    tools: string[]
    timeout_ms: number
    evidence_types: string[]
  }
  is_default: boolean
  is_active: boolean
}

interface EdgeFunctionLog {
  id: string
  function_name: string
  status: 'started' | 'completed' | 'failed' | 'timeout'
  duration_ms?: number
  error_message?: string
  created_at: string
}

interface AdminSetting {
  id: string
  setting_key: string
  setting_value: any
  category: string
  description: string
}

export default function PipelineConfigPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('prompts')
  const [prompts, setPrompts] = useState<AiPrompt[]>([])
  const [scanConfigs, setScanConfigs] = useState<ScanConfiguration[]>([])
  const [functionLogs, setFunctionLogs] = useState<EdgeFunctionLog[]>([])
  const [adminSettings, setAdminSettings] = useState<AdminSetting[]>([])
  const [loading, setLoading] = useState(true)
  
  // Edit states
  const [editingPrompt, setEditingPrompt] = useState<AiPrompt | null>(null)
  const [editingConfig, setEditingConfig] = useState<ScanConfiguration | null>(null)
  const [showPromptDialog, setShowPromptDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  
  // Filter states
  const [promptSearch, setPromptSearch] = useState('')
  const [promptCategory, setPromptCategory] = useState('all')
  const [configSearch, setConfigSearch] = useState('')

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [promptsRes, configsRes, logsRes, settingsRes] = await Promise.all([
        supabase.from('ai_prompts').select('*').order('category, name'),
        supabase.from('scan_configurations').select('*').order('name'),
        supabase.from('edge_function_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('admin_settings').select('*').order('category, setting_key')
      ])

      if (promptsRes.error) console.error('Error loading prompts:', promptsRes.error)
      if (configsRes.error) console.error('Error loading configs:', configsRes.error)
      if (logsRes.error) console.error('Error loading logs:', logsRes.error)
      if (settingsRes.error) console.error('Error loading settings:', settingsRes.error)

      setPrompts(promptsRes.data || [])
      setScanConfigs(configsRes.data || [])
      setFunctionLogs(logsRes.data || [])
      setAdminSettings(settingsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load configuration data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const savePrompt = async () => {
    if (!editingPrompt) return

    try {
      if (editingPrompt.id) {
        // Update existing prompt
        const { error } = await supabase
          .from('ai_prompts')
          .update({
            prompt_text: editingPrompt.prompt_text,
            description: editingPrompt.description,
            is_active: editingPrompt.is_active,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', editingPrompt.id)

        if (error) throw error
      } else {
        // Create new prompt
        const { error } = await supabase
          .from('ai_prompts')
          .insert({
            ...editingPrompt,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Prompt saved successfully"
      })
      setShowPromptDialog(false)
      setEditingPrompt(null)
      loadAllData()
    } catch (error) {
      console.error('Error saving prompt:', error)
      toast({
        title: "Error",
        description: "Failed to save prompt",
        variant: "destructive"
      })
    }
  }

  const saveScanConfig = async () => {
    if (!editingConfig) return

    try {
      if (editingConfig.id) {
        // Update existing config
        const { error } = await supabase
          .from('scan_configurations')
          .update({
            name: editingConfig.name,
            description: editingConfig.description,
            configuration: editingConfig.configuration,
            is_active: editingConfig.is_active,
            is_default: editingConfig.is_default,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', editingConfig.id)

        if (error) throw error
      } else {
        // Create new config
        const { error } = await supabase
          .from('scan_configurations')
          .insert({
            ...editingConfig,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Scan configuration saved successfully"
      })
      setShowConfigDialog(false)
      setEditingConfig(null)
      loadAllData()
    } catch (error) {
      console.error('Error saving config:', error)
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      })
    }
  }

  const updateSetting = async (setting: AdminSetting) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          setting_value: setting.setting_value,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', setting.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Setting updated successfully"
      })
      loadAllData()
    } catch (error) {
      console.error('Error updating setting:', error)
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive"
      })
    }
  }

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(promptSearch.toLowerCase()) ||
                         p.description?.toLowerCase().includes(promptSearch.toLowerCase())
    const matchesCategory = promptCategory === 'all' || p.category === promptCategory
    return matchesSearch && matchesCategory
  })

  const filteredConfigs = scanConfigs.filter(c => {
    return c.name.toLowerCase().includes(configSearch.toLowerCase()) ||
           c.description?.toLowerCase().includes(configSearch.toLowerCase())
  })

  const functionStats = functionLogs.reduce((acc, log) => {
    if (!acc[log.function_name]) {
      acc[log.function_name] = { total: 0, success: 0, failed: 0, avgDuration: 0 }
    }
    acc[log.function_name].total++
    if (log.status === 'completed') acc[log.function_name].success++
    if (log.status === 'failed') acc[log.function_name].failed++
    return acc
  }, {} as Record<string, any>)

  if (loading) return <div>Loading pipeline configuration...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline Configuration</h1>
          <p className="text-muted-foreground">
            Configure prompts, scan settings, and monitor the data pipeline
          </p>
        </div>
        <Button onClick={loadAllData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
          <TabsTrigger value="scan-configs">Scan Configurations</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Prompts</CardTitle>
                  <CardDescription>
                    Manage prompts used throughout the data pipeline
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingPrompt({
                      id: '',
                      name: '',
                      description: '',
                      prompt_text: '',
                      category: 'evidence_collection',
                      version: 1,
                      is_active: true,
                      variables: [],
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    setShowPromptDialog(true)
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  New Prompt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search prompts..."
                      value={promptSearch}
                      onChange={(e) => setPromptSearch(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={promptCategory} onValueChange={setPromptCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="evidence_collection">Evidence Collection</SelectItem>
                      <SelectItem value="report_generation">Report Generation</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="classification">Classification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prompts List */}
                <div className="space-y-2">
                  {filteredPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{prompt.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {prompt.category}
                            </Badge>
                            {prompt.function_name && (
                              <Badge variant="secondary" className="text-xs">
                                {prompt.function_name}
                              </Badge>
                            )}
                            <Badge
                              variant={prompt.is_active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {prompt.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              v{prompt.version}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {prompt.description}
                          </p>
                          <div className="mt-2">
                            <p className="text-xs font-mono bg-muted p-2 rounded">
                              {prompt.prompt_text.substring(0, 150)}...
                            </p>
                          </div>
                          {prompt.variables.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">Variables:</span>
                              {prompt.variables.map((v) => (
                                <Badge key={v} variant="outline" className="text-xs">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPrompt(prompt)
                              setShowPromptDialog(true)
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scan-configs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scan Configurations</CardTitle>
                  <CardDescription>
                    Define scan depth configurations and their parameters
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingConfig({
                      id: '',
                      name: '',
                      description: '',
                      depth: 'custom',
                      configuration: {
                        phases: [],
                        tools: [],
                        timeout_ms: 600000,
                        evidence_types: []
                      },
                      is_default: false,
                      is_active: true
                    })
                    setShowConfigDialog(true)
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  New Configuration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <Input
                  placeholder="Search configurations..."
                  value={configSearch}
                  onChange={(e) => setConfigSearch(e.target.value)}
                  className="max-w-sm"
                />

                {/* Configurations List */}
                <div className="grid gap-4">
                  {filteredConfigs.map((config) => (
                    <Card key={config.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{config.name}</CardTitle>
                            <Badge variant={config.is_default ? "default" : "outline"}>
                              {config.depth}
                            </Badge>
                            {config.is_default && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            <Badge
                              variant={config.is_active ? "default" : "secondary"}
                            >
                              {config.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingConfig(config)
                              setShowConfigDialog(true)
                            }}
                          >
                            <Edit3 className="h-3 w-3 mr-2" />
                            Edit
                          </Button>
                        </div>
                        <CardDescription>{config.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Phases</h4>
                            <div className="flex flex-wrap gap-1">
                              {config.configuration.phases.map((phase) => (
                                <Badge key={phase} variant="outline" className="text-xs">
                                  {phase}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Tools</h4>
                            <div className="flex flex-wrap gap-1">
                              {config.configuration.tools.map((tool) => (
                                <Badge key={tool} variant="secondary" className="text-xs">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Evidence Types</h4>
                            <div className="flex flex-wrap gap-1">
                              {config.configuration.evidence_types.map((type) => (
                                <Badge key={type} variant="outline" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Timeout</h4>
                            <p className="text-sm text-muted-foreground">
                              {config.configuration.timeout_ms / 1000 / 60} minutes
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(functionStats).map(([name, stats]: [string, any]) => (
              <Card key={name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{name}</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Calls</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium text-green-600">
                        {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
                      </span>
                    </div>
                    {stats.failed > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed</span>
                        <span className="font-medium text-red-600">{stats.failed}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Function Executions</CardTitle>
              <CardDescription>
                Monitor edge function performance and errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {functionLogs.slice(0, 20).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          log.status === 'completed' ? 'bg-green-500' :
                          log.status === 'failed' ? 'bg-red-500' :
                          log.status === 'timeout' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm">{log.function_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.duration_ms && (
                        <Badge variant="outline" className="text-xs">
                          {log.duration_ms}ms
                        </Badge>
                      )}
                      <Badge
                        variant={
                          log.status === 'completed' ? 'default' :
                          log.status === 'failed' ? 'destructive' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure global system parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {['timeouts', 'capacity', 'ai_models'].map((category) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-lg font-medium capitalize">
                      {category.replace('_', ' ')}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {adminSettings
                          .filter((s) => s.category === category)
                          .map((setting) => (
                            <div key={setting.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>{setting.setting_key.replace(/_/g, ' ')}</Label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Simple inline edit for demo
                                    const newValue = prompt(`Enter new value for ${setting.setting_key}:`, JSON.stringify(setting.setting_value))
                                    if (newValue) {
                                      try {
                                        const parsed = JSON.parse(newValue)
                                        updateSetting({ ...setting, setting_value: parsed })
                                      } catch (e) {
                                        toast({
                                          title: "Error",
                                          description: "Invalid JSON format",
                                          variant: "destructive"
                                        })
                                      }
                                    }
                                  }}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {setting.description}
                              </p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(setting.setting_value, null, 2)}
                              </pre>
                            </div>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Prompt Edit Dialog */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt?.id ? 'Edit Prompt' : 'Create New Prompt'}
            </DialogTitle>
            <DialogDescription>
              Configure the prompt template and its parameters
            </DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingPrompt.name}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                    placeholder="Prompt name"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={editingPrompt.category}
                    onValueChange={(v) => setEditingPrompt({ ...editingPrompt, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="evidence_collection">Evidence Collection</SelectItem>
                      <SelectItem value="report_generation">Report Generation</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="classification">Classification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editingPrompt.description}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                  placeholder="Brief description of the prompt"
                />
              </div>
              <div>
                <Label>Function Name (optional)</Label>
                <Input
                  value={editingPrompt.function_name || ''}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, function_name: e.target.value })}
                  placeholder="Associated edge function"
                />
              </div>
              <div>
                <Label>Prompt Template</Label>
                <Textarea
                  value={editingPrompt.prompt_text}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_text: e.target.value })}
                  placeholder="Enter the prompt template..."
                  className="min-h-[200px] font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {'{{variable_name}}'} for template variables
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingPrompt.is_active}
                  onCheckedChange={(checked) => setEditingPrompt({ ...editingPrompt, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={savePrompt}>
              <Save className="h-4 w-4 mr-2" />
              Save Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan Config Edit Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig?.id ? 'Edit Scan Configuration' : 'Create New Configuration'}
            </DialogTitle>
            <DialogDescription>
              Define the scan parameters and evidence collection strategy
            </DialogDescription>
          </DialogHeader>
          {editingConfig && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingConfig.name}
                    onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                    placeholder="Configuration name"
                  />
                </div>
                <div>
                  <Label>Depth</Label>
                  <Select
                    value={editingConfig.depth}
                    onValueChange={(v: any) => setEditingConfig({ ...editingConfig, depth: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shallow">Shallow</SelectItem>
                      <SelectItem value="deep">Deep</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingConfig.description}
                  onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                  placeholder="Describe what this configuration does"
                />
              </div>
              <div>
                <Label>Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={editingConfig.configuration.timeout_ms / 1000 / 60}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    configuration: {
                      ...editingConfig.configuration,
                      timeout_ms: parseInt(e.target.value) * 60 * 1000
                    }
                  })}
                />
              </div>
              <div>
                <Label>Phases (comma-separated)</Label>
                <Input
                  value={editingConfig.configuration.phases.join(', ')}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    configuration: {
                      ...editingConfig.configuration,
                      phases: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                    }
                  })}
                  placeholder="basic_content, business_info, technical_analysis"
                />
              </div>
              <div>
                <Label>Tools (comma-separated)</Label>
                <Textarea
                  value={editingConfig.configuration.tools.join(', ')}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    configuration: {
                      ...editingConfig.configuration,
                      tools: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }
                  })}
                  placeholder="html-collector, google-search-collector, webtech-analyzer"
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Evidence Types (comma-separated)</Label>
                <Textarea
                  value={editingConfig.configuration.evidence_types.join(', ')}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    configuration: {
                      ...editingConfig.configuration,
                      evidence_types: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }
                  })}
                  placeholder="website_content, business_overview, technology_stack"
                  className="min-h-[80px]"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingConfig.is_active}
                    onCheckedChange={(checked) => setEditingConfig({ ...editingConfig, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingConfig.is_default}
                    onCheckedChange={(checked) => setEditingConfig({ ...editingConfig, is_default: checked })}
                  />
                  <Label>Set as Default</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveScanConfig}>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}