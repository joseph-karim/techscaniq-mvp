import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Info, Plus, Settings, Trash2 } from 'lucide-react'

// Enhanced PE Thesis Framework based on real-world investment strategies
export const PE_THESIS_TYPES = {
  'accelerate-organic-growth': {
    name: 'Accelerate Organic Growth',
    description: 'Pour fuel on a proven product - sustain 20-40%+ ARR growth, handle traffic jumps, launch features faster',
    investorGoals: [
      'Sustain 20-40%+ ARR growth',
      'Handle big traffic jumps',
      'Launch features faster'
    ],
    techDDFocus: 'Scalability & Dev Velocity',
    techDDDetails: [
      'Cloud architecture headroom (auto-scaling, micro-services)',
      'Clean release pipeline (CI/CD, test coverage)',
      'Road-map agility (modular code, low tech-debt)'
    ],
    scoreReweighting: {
      'Product/Tech': { weight: 30, change: '↑' },
      'Market': { weight: 25, change: '↑' },
      'Profitability': { weight: 10, change: '↓' },
      'Security': { weight: 15, change: '=' },
      'Team': { weight: 20, change: '=' }
    },
    criteria: [
      { name: 'Cloud Architecture Scalability', weight: 30, description: 'Auto-scaling capabilities, microservices architecture, infrastructure headroom for 10x growth' },
      { name: 'Development Velocity & Pipeline', weight: 25, description: 'CI/CD maturity, test coverage, deployment frequency, feature delivery speed' },
      { name: 'Market Expansion Readiness', weight: 25, description: 'Geographic reach, customer acquisition systems, product-market fit indicators' },
      { name: 'Code Quality & Technical Debt', weight: 20, description: 'Modular architecture, maintainability, technical debt burden affecting velocity' }
    ],
    focusAreas: ['cloud-native', 'scalable-architecture', 'devops-maturity', 'test-coverage', 'microservices'],
    timeHorizon: '3-5 years',
    targetMultiple: '5-10x'
  },
  'buy-and-build': {
    name: 'Buy-and-Build / Roll-Up',
    description: 'Bolt-on acquisitions every 6-12 months - integrate data, users, brand quickly',
    investorGoals: [
      'Bolt-on acquisitions every 6-12 mo.',
      'Integrate data, users, brand quickly'
    ],
    techDDFocus: 'Integration Readiness',
    techDDDetails: [
      'API coverage & documentation',
      'Single-tenant vs multi-tenant conversion effort',
      'Data-model flexibility / shared auth'
    ],
    scoreReweighting: {
      'Architecture/Integration': { weight: 25, change: '↑' },
      'Team Depth': { weight: 20, change: '↑' },
      'Product/Tech': { weight: 20, change: '=' },
      'Market': { weight: 15, change: '=' },
      'Profitability': { weight: 20, change: '=' }
    },
    criteria: [
      { name: 'API Architecture & Documentation', weight: 25, description: 'Comprehensive API coverage, developer documentation, integration-ready architecture' },
      { name: 'Multi-tenant Conversion Effort', weight: 25, description: 'Assessment of single-tenant to multi-tenant migration complexity and timeline' },
      { name: 'Data Model Flexibility', weight: 20, description: 'Database schema flexibility, shared authentication systems, data integration capabilities' },
      { name: 'Team Depth for Multi-Codebase', weight: 20, description: 'Engineering team capability to manage multiple codebases and integration projects' },
      { name: 'Operational Standardization', weight: 10, description: 'Process standardization potential, deployment pipeline replication' }
    ],
    focusAreas: ['api-driven', 'microservices', 'documentation', 'distributed-systems', 'scalable-architecture'],
    timeHorizon: '5-7 years',
    targetMultiple: '3-7x'
  },
  'margin-expansion': {
    name: 'Margin Expansion / Cost-Out',
    description: 'Lift EBITDA by cutting 10-15 pts of cost through operational excellence',
    investorGoals: [
      'Lift EBITDA by cutting 10-15 pts of cost'
    ],
    techDDFocus: 'Efficiency Levers',
    techDDDetails: [
      'Hosting $ per user (cloud cost)',
      'Automatable workflows (manual QA, deployment)',
      'Licensing or third-party spend that can be renegotiated'
    ],
    scoreReweighting: {
      'Profitability': { weight: 30, change: '↑' },
      'Tech-Debt': { weight: 20, change: '↑' },
      'Market Size': { weight: 5, change: '↓' },
      'Security': { weight: 15, change: '=' },
      'Team': { weight: 15, change: '=' },
      'Product/Tech': { weight: 15, change: '=' }
    },
    criteria: [
      { name: 'Cloud Cost Optimization', weight: 30, description: 'Hosting cost per user analysis, infrastructure efficiency opportunities, cloud spend optimization' },
      { name: 'Process Automation Potential', weight: 25, description: 'Manual QA elimination, deployment automation, workflow optimization opportunities' },
      { name: 'Third-party Licensing Optimization', weight: 20, description: 'Vendor consolidation opportunities, license renegotiation potential, build vs buy analysis' },
      { name: 'Technical Debt Impact on Costs', weight: 15, description: 'Development inefficiencies, maintenance overhead, refactoring ROI analysis' },
      { name: 'Operational Monitoring & Analytics', weight: 10, description: 'Performance monitoring maturity, cost visibility, continuous improvement culture' }
    ],
    focusAreas: ['cloud-native', 'devops-maturity', 'containerized', 'test-coverage', 'low-technical-debt'],
    timeHorizon: '2-4 years',
    targetMultiple: '3-5x'
  },
  'turnaround-distressed': {
    name: 'Turnaround / Distressed',
    description: 'Fix a struggling asset, sell in 3-4 years',
    investorGoals: [
      'Fix a struggling asset, sell in 3–4 yrs'
    ],
    techDDFocus: 'Risk Hot-Spots',
    techDDDetails: [
      'Critical security holes or compliance gaps',
      'Obsolete frameworks hindering hires',
      'Estimate time-to-refactor'
    ],
    scoreReweighting: {
      'Security & Tech-Debt': { weight: 35, change: '↑' },
      'Team Capability': { weight: 20, change: '↑' },
      'Product/Tech': { weight: 20, change: '=' },
      'Market': { weight: 15, change: '=' },
      'Profitability': { weight: 10, change: '=' }
    },
    criteria: [
      { name: 'Critical Security & Compliance Gaps', weight: 35, description: 'Security vulnerabilities, compliance violations, immediate risk assessment' },
      { name: 'Framework Obsolescence & Hiring Impact', weight: 20, description: 'Technology stack modernity, talent acquisition challenges, skill availability' },
      { name: 'Technical Debt Remediation Scope', weight: 20, description: 'Time-to-refactor estimates, modernization roadmap, investment requirements' },
      { name: 'Team Capability & Knowledge Risk', weight: 15, description: 'Key person dependencies, knowledge transfer needs, team rebuilding requirements' },
      { name: 'Platform Stability & Performance', weight: 10, description: 'System reliability, performance issues, infrastructure stability' }
    ],
    focusAreas: ['security-focus', 'modern-tech-stack', 'low-technical-debt', 'documentation', 'test-coverage'],
    timeHorizon: '3-4 years',
    targetMultiple: '2-5x',
    specialFlags: ['remediation_budget_required', 'high_execution_risk']
  },
  'carve-out': {
    name: 'Carve-Out from Corporate',
    description: 'Stand-alone ops in <12 mo., clean IP ownership',
    investorGoals: [
      'Stand-alone ops in <12 mo.',
      'Clean IP ownership'
    ],
    techDDFocus: 'Separation Complexity',
    techDDDetails: [
      'Hardwired parent dependencies (SSO, data lakes)',
      'License entanglements',
      'Needed rebuild vs simple lift-and-shift'
    ],
    scoreReweighting: {
      'Dependency Analysis': { weight: 25, change: '↑' },
      'IP/Licensing': { weight: 20, change: '↑' },
      'Architecture': { weight: 20, change: '=' },
      'Team': { weight: 15, change: '=' },
      'Product/Tech': { weight: 20, change: '=' }
    },
    criteria: [
      { name: 'Parent System Dependencies', weight: 25, description: 'SSO dependencies, shared data lakes, infrastructure entanglements, service dependencies' },
      { name: 'IP & Licensing Complexity', weight: 20, description: 'License entanglements, IP ownership clarity, third-party dependencies' },
      { name: 'Separation Architecture Assessment', weight: 20, description: 'Rebuild vs lift-and-shift analysis, microservices separation potential' },
      { name: 'Standalone Operations Readiness', weight: 20, description: 'Independent infrastructure capability, operational process requirements' },
      { name: 'Team Independence & Knowledge', weight: 15, description: 'Team completeness, knowledge transfer needs, operational capability' }
    ],
    focusAreas: ['microservices', 'api-driven', 'documentation', 'distributed-systems', 'containerized'],
    timeHorizon: '2-4 years',
    targetMultiple: '3-6x'
  },
  'geographic-vertical-expansion': {
    name: 'Geographic or Vertical Expansion',
    description: 'Enter EU/Asia or a new regulated niche',
    investorGoals: [
      'Enter EU/Asia or a new regulated niche'
    ],
    techDDFocus: 'Localization & Compliance',
    techDDDetails: [
      'Multi-region deployment support (GDPR, data residency)',
      'Feature toggles / i18n readiness',
      'Industry-specific certs (HIPAA, SOC-2)'
    ],
    scoreReweighting: {
      'Compliance & Config Flex': { weight: 20, change: '↑' },
      'Scalability': { weight: 20, change: '↑' },
      'Security': { weight: 20, change: '=' },
      'Architecture': { weight: 20, change: '=' },
      'Market': { weight: 20, change: '=' }
    },
    criteria: [
      { name: 'Multi-region Deployment Support', weight: 20, description: 'GDPR compliance, data residency capabilities, geographic infrastructure distribution' },
      { name: 'Internationalization Readiness', weight: 20, description: 'Feature toggles, i18n framework, localization architecture' },
      { name: 'Industry-specific Compliance', weight: 20, description: 'HIPAA, SOC-2, industry certifications, regulatory framework support' },
      { name: 'Scalability for New Markets', weight: 20, description: 'Architecture scalability, performance across regions, capacity planning' },
      { name: 'Configuration Flexibility', weight: 20, description: 'Multi-tenant configuration, feature flags, market-specific customization' }
    ],
    focusAreas: ['security-focus', 'scalable-architecture', 'cloud-native', 'api-driven', 'high-availability'],
    timeHorizon: '3-5 years',
    targetMultiple: '4-8x'
  },
  'digital-transformation': {
    name: 'Digital Transformation / Product Extension',
    description: 'Modernize legacy software, add new modules',
    investorGoals: [
      'Modernize legacy software, add new modules'
    ],
    techDDFocus: 'Platform Extensibility',
    techDDDetails: [
      'Service-oriented architecture',
      'Plugin/API framework',
      'Code quality for rapid new-feature dev'
    ],
    scoreReweighting: {
      'Architecture': { weight: 25, change: '↑' },
      'Dev Velocity': { weight: 20, change: '↑' },
      'Product/Tech': { weight: 20, change: '=' },
      'Team': { weight: 20, change: '=' },
      'Market': { weight: 15, change: '=' }
    },
    criteria: [
      { name: 'Service-Oriented Architecture', weight: 25, description: 'Microservices readiness, service decomposition potential, API-first design' },
      { name: 'Plugin/API Framework Maturity', weight: 20, description: 'Extension architecture, third-party integration capabilities, developer ecosystem' },
      { name: 'Code Quality for Feature Development', weight: 20, description: 'Maintainability, test coverage, development velocity indicators' },
      { name: 'Legacy System Modernization Path', weight: 20, description: 'Migration strategy, modernization roadmap, technology debt assessment' },
      { name: 'Platform Extensibility Design', weight: 15, description: 'Module architecture, configuration flexibility, customization capabilities' }
    ],
    focusAreas: ['microservices', 'api-driven', 'modern-tech-stack', 'test-coverage', 'documentation'],
    timeHorizon: '4-6 years',
    targetMultiple: '3-8x'
  }
} as const

export type ThesisType = keyof typeof PE_THESIS_TYPES
export type CustomCriterion = {
  id: string
  name: string
  weight: number
  description: string
}

export interface InvestmentThesisData {
  thesisType: ThesisType | 'custom'
  customThesisName?: string
  customThesisDescription?: string
  criteria: CustomCriterion[]
  focusAreas: string[]
  timeHorizon: string
  targetMultiple: string
  notes?: string
}

interface InvestmentThesisSelectorProps {
  value: InvestmentThesisData | null
  onChange: (value: InvestmentThesisData) => void
}

const FOCUS_AREAS = [
  { value: 'scalable-architecture', label: 'Scalable Architecture' },
  { value: 'modern-tech-stack', label: 'Modern Tech Stack' },
  { value: 'security-focus', label: 'Security Focus' },
  { value: 'devops-maturity', label: 'DevOps Maturity' },
  { value: 'cloud-native', label: 'Cloud Native' },
  { value: 'api-driven', label: 'API-Driven' },
  { value: 'microservices', label: 'Microservices' },
  { value: 'data-intensive', label: 'Data-Intensive' },
  { value: 'mobile-first', label: 'Mobile-First' },
  { value: 'low-technical-debt', label: 'Low Technical Debt' },
  { value: 'distributed-systems', label: 'Distributed Systems' },
  { value: 'high-availability', label: 'High Availability' },
  { value: 'test-coverage', label: 'Strong Test Coverage' },
  { value: 'containerized', label: 'Containerized' },
  { value: 'documentation', label: 'Well-Documented' }
]

export function InvestmentThesisSelector({ value, onChange }: InvestmentThesisSelectorProps) {
  const [showCustomization, setShowCustomization] = useState(false)
  
  // Initialize with default if no value
  const currentValue = value || {
    thesisType: 'accelerate-organic-growth',
    criteria: PE_THESIS_TYPES['accelerate-organic-growth'].criteria.map((c, i) => ({
      id: `criterion-${i}`,
      name: c.name,
      weight: c.weight,
      description: c.description
    })),
    focusAreas: [...PE_THESIS_TYPES['accelerate-organic-growth'].focusAreas],
    timeHorizon: PE_THESIS_TYPES['accelerate-organic-growth'].timeHorizon,
    targetMultiple: PE_THESIS_TYPES['accelerate-organic-growth'].targetMultiple
  }
  
  const handleThesisTypeChange = (thesisType: ThesisType | 'custom') => {
    if (thesisType === 'custom') {
      onChange({
        thesisType: 'custom',
        customThesisName: '',
        customThesisDescription: '',
        criteria: [
          { id: 'custom-1', name: 'Technical Excellence', weight: 40, description: 'Quality of technology implementation' },
          { id: 'custom-2', name: 'Scalability Potential', weight: 30, description: 'Ability to handle growth efficiently' },
          { id: 'custom-3', name: 'Market Opportunity', weight: 30, description: 'Size and accessibility of target market' }
        ],
        focusAreas: ['scalable-architecture', 'modern-tech-stack'],
        timeHorizon: '3-5 years',
        targetMultiple: '5-10x'
      })
    } else {
      const thesis = PE_THESIS_TYPES[thesisType]
      onChange({
        thesisType,
        criteria: thesis.criteria.map((c, i) => ({
          id: `criterion-${i}`,
          name: c.name,
          weight: c.weight,
          description: c.description
        })),
        focusAreas: [...thesis.focusAreas],
        timeHorizon: thesis.timeHorizon,
        targetMultiple: thesis.targetMultiple
      })
    }
  }
  
  const updateCriterion = (id: string, updates: Partial<CustomCriterion>) => {
    const newCriteria = currentValue.criteria.map(c => 
      c.id === id ? { ...c, ...updates } : c
    )
    
    // Ensure weights sum to 100
    const totalWeight = newCriteria.reduce((sum, c) => sum + c.weight, 0)
    if (totalWeight !== 100) {
      // Proportionally adjust other weights
      const adjustment = 100 / totalWeight
      newCriteria.forEach(c => {
        if (c.id !== id) {
          c.weight = Math.round(c.weight * adjustment)
        }
      })
    }
    
    onChange({ ...currentValue, criteria: newCriteria })
  }
  
  const addCriterion = () => {
    const newCriterion: CustomCriterion = {
      id: `criterion-${Date.now()}`,
      name: 'New Criterion',
      weight: 10,
      description: 'Description of evaluation criterion'
    }
    onChange({
      ...currentValue,
      criteria: [...currentValue.criteria, newCriterion]
    })
  }
  
  const removeCriterion = (id: string) => {
    onChange({
      ...currentValue,
      criteria: currentValue.criteria.filter(c => c.id !== id)
    })
  }
  
  const toggleFocusArea = (area: string) => {
    const newFocusAreas = currentValue.focusAreas.includes(area)
      ? currentValue.focusAreas.filter(a => a !== area)
      : [...currentValue.focusAreas, area]
    onChange({ ...currentValue, focusAreas: newFocusAreas })
  }
  
  const selectedThesis = currentValue.thesisType !== 'custom' 
    ? PE_THESIS_TYPES[currentValue.thesisType as ThesisType]
    : null
  
  return (
    <div className="space-y-6">
      {/* Thesis Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Investment Thesis Framework
          </CardTitle>
          <CardDescription>
            Select your investment strategy to customize the technical analysis weighting and focus areas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="thesis-type">Thesis Type</Label>
            <Select
              value={currentValue.thesisType}
              onValueChange={handleThesisTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select investment thesis type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PE_THESIS_TYPES).map(([key, thesis]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span className="font-medium">{thesis.name}</span>
                      <span className="text-xs text-muted-foreground">{thesis.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <div className="flex flex-col">
                    <span className="font-medium">Custom Thesis</span>
                    <span className="text-xs text-muted-foreground">Create your own investment framework</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedThesis && (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div>
                <h4 className="font-medium">{selectedThesis.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedThesis.description}</p>
              </div>
              
              {(selectedThesis as any).investorGoals && (
                <div>
                  <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300">What the Investor Wants:</h5>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {(selectedThesis as any).investorGoals.map((goal: string, i: number) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(selectedThesis as any).techDDFocus && (
                <div>
                  <h5 className="text-sm font-medium text-green-700 dark:text-green-300">Tech-DD Focus: {(selectedThesis as any).techDDFocus}</h5>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {(selectedThesis as any).techDDDetails?.map((detail: string, i: number) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(selectedThesis as any).scoreReweighting && (
                <div>
                  <h5 className="text-sm font-medium text-purple-700 dark:text-purple-300">Score Re-weighting:</h5>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries((selectedThesis as any).scoreReweighting).map(([area, config]: [string, any]) => (
                      <Badge 
                        key={area} 
                        variant={config.change === '↑' ? 'default' : config.change === '↓' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {config.change} {area} {config.weight}%
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 text-xs pt-2 border-t">
                <Badge variant="outline">Timeline: {selectedThesis.timeHorizon}</Badge>
                <Badge variant="outline">Target: {selectedThesis.targetMultiple}</Badge>
                {(selectedThesis as any).specialFlags && (selectedThesis as any).specialFlags.map((flag: string) => (
                  <Badge key={flag} variant="destructive" className="text-xs">
                    {flag.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {currentValue.thesisType === 'custom' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="custom-name">Custom Thesis Name</Label>
                <Input
                  id="custom-name"
                  value={currentValue.customThesisName || ''}
                  onChange={(e) => onChange({ ...currentValue, customThesisName: e.target.value })}
                  placeholder="e.g., AI-First Growth Strategy"
                />
              </div>
              <div>
                <Label htmlFor="custom-description">Description</Label>
                <Textarea
                  id="custom-description"
                  value={currentValue.customThesisDescription || ''}
                  onChange={(e) => onChange({ ...currentValue, customThesisDescription: e.target.value })}
                  placeholder="Describe your investment thesis and key value creation levers..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Scoring Criteria Customization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scoring Criteria</CardTitle>
              <CardDescription>
                Customize the evaluation criteria and their weights. Total weight must equal 100%.
              </CardDescription>
            </div>
            <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Customize Scoring Criteria</DialogTitle>
                  <DialogDescription>
                    Adjust the evaluation criteria and their weights to match your investment priorities.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {currentValue.criteria.map((criterion) => (
                    <div key={criterion.id} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <Input
                          value={criterion.name}
                          onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                          className="font-medium"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCriterion(criterion.id)}
                          disabled={currentValue.criteria.length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Textarea
                        value={criterion.description}
                        onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                        placeholder="Describe what this criterion evaluates..."
                        rows={2}
                      />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Weight: {criterion.weight}%</Label>
                        </div>
                        <Slider
                          value={[criterion.weight]}
                          onValueChange={([value]) => updateCriterion(criterion.id, { weight: value })}
                          max={80}
                          min={5}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button onClick={addCriterion} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Criterion
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Total Weight: {currentValue.criteria.reduce((sum, c) => sum + c.weight, 0)}%
                    {currentValue.criteria.reduce((sum, c) => sum + c.weight, 0) !== 100 && (
                      <span className="text-red-500 ml-2">Must equal 100%</span>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentValue.criteria.map((criterion) => (
              <div key={criterion.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{criterion.name}</span>
                    <Badge variant="secondary">{criterion.weight}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Technical Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Focus Areas</CardTitle>
          <CardDescription>
            Select specific technology areas that are most important for your investment thesis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FOCUS_AREAS.map((area) => (
              <div key={area.value} className="flex items-center space-x-2">
                <Checkbox
                  id={area.value}
                  checked={currentValue.focusAreas.includes(area.value)}
                  onCheckedChange={() => toggleFocusArea(area.value)}
                />
                <Label
                  htmlFor={area.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {area.label}
                </Label>
              </div>
            ))}
          </div>
          
          {currentValue.focusAreas.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Selected Focus Areas:</p>
              <div className="flex flex-wrap gap-2">
                {currentValue.focusAreas.map((area) => {
                  const areaData = FOCUS_AREAS.find(a => a.value === area)
                  return (
                    <Badge key={area} variant="secondary">
                      {areaData?.label || area}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Investment Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Parameters</CardTitle>
          <CardDescription>
            Define the timeline and return expectations for this investment
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="time-horizon">Investment Timeline</Label>
            <Select
              value={currentValue.timeHorizon}
              onValueChange={(value) => onChange({ ...currentValue, timeHorizon: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2-3 years">2-3 years</SelectItem>
                <SelectItem value="3-5 years">3-5 years</SelectItem>
                <SelectItem value="4-6 years">4-6 years</SelectItem>
                <SelectItem value="5-7 years">5-7 years</SelectItem>
                <SelectItem value="5-8 years">5-8 years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="target-multiple">Target Multiple</Label>
            <Select
              value={currentValue.targetMultiple}
              onValueChange={(value) => onChange({ ...currentValue, targetMultiple: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2-3x">2-3x</SelectItem>
                <SelectItem value="3-5x">3-5x</SelectItem>
                <SelectItem value="5-10x">5-10x</SelectItem>
                <SelectItem value="5-12x">5-12x</SelectItem>
                <SelectItem value="10-25x">10-25x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any specific requirements, red flags, or additional context for the analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={currentValue.notes || ''}
            onChange={(e) => onChange({ ...currentValue, notes: e.target.value })}
            placeholder="e.g., Must have SOC 2 compliance, avoid companies with PHP legacy systems, focus on API-first architecture..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  )
}