import { useState } from 'react'
import { 
  FileText, 
  TrendingUp, 
  Users,
  Code,
  Server,
  Cloud,
  Brain,
  Database,
  DollarSign,
  Shield,
  Package,
  GitBranch,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Building2,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExecutiveReportSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  category: 'investor' | 'executive' | 'technical' | 'operational' | 'strategic'
  subsections?: ExecutiveReportSection[]
}

export const executiveReportSections: ExecutiveReportSection[] = [
  // Investor Profile
  {
    id: 'investor-profile',
    title: 'Investor Profile',
    icon: <Building2 className="h-4 w-4" />,
    description: 'PE/VC firm analysis and investment thesis',
    category: 'investor',
    subsections: [
      {
        id: 'firm-overview',
        title: 'Firm Overview',
        icon: <Building2 className="h-4 w-4" />,
        description: 'Investment firm details and focus',
        category: 'investor'
      },
      {
        id: 'investment-thesis',
        title: 'Investment Thesis',
        icon: <Target className="h-4 w-4" />,
        description: 'Strategic priorities and value creation',
        category: 'investor'
      }
    ]
  },
  
  // Executive Summary
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    icon: <FileText className="h-4 w-4" />,
    description: 'High-level assessment and key findings',
    category: 'executive',
    subsections: [
      {
        id: 'overall-assessment',
        title: 'Overall Assessment',
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'Summary scores and strategic fit',
        category: 'executive'
      },
      {
        id: 'key-recommendations',
        title: 'Strategic Recommendations',
        icon: <TrendingUp className="h-4 w-4" />,
        description: 'Priority actions for value creation',
        category: 'executive'
      }
    ]
  },
  
  // Technical Deep Dive
  {
    id: 'temporal-intelligence',
    title: 'Stack Evolution Timeline',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Historical technology evolution and trajectory',
    category: 'technical'
  },
  {
    id: 'technical-leadership',
    title: 'Technical Leadership',
    icon: <Users className="h-4 w-4" />,
    description: 'Founding team and engineering assessment',
    category: 'technical'
  },
  {
    id: 'stack-architecture',
    title: 'Stack Architecture',
    icon: <Server className="h-4 w-4" />,
    description: 'Infrastructure and technology layers',
    category: 'technical'
  },
  {
    id: 'cloud-dependencies',
    title: 'Cloud & Vendor Dependencies',
    icon: <Cloud className="h-4 w-4" />,
    description: 'Third-party services and risk assessment',
    category: 'technical'
  },
  {
    id: 'ai-capabilities',
    title: 'AI Models & Automation',
    icon: <Brain className="h-4 w-4" />,
    description: 'Current AI implementation and roadmap',
    category: 'technical'
  },
  {
    id: 'code-quality',
    title: 'Code Quality Signals',
    icon: <Code className="h-4 w-4" />,
    description: 'Codebase analysis and technical debt',
    category: 'technical'
  },
  {
    id: 'data-architecture',
    title: 'Data Architecture & Governance',
    icon: <Database className="h-4 w-4" />,
    description: 'Data management and compliance',
    category: 'technical'
  },
  
  // Operational Analysis
  {
    id: 'automation-readiness',
    title: 'Agent & Automation Readiness',
    icon: <Brain className="h-4 w-4" />,
    description: 'Workflow automation potential',
    category: 'operational'
  },
  {
    id: 'revenue-attribution',
    title: 'Revenue Attribution to Stack',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Technology impact on revenue',
    category: 'operational'
  },
  {
    id: 'disaster-recovery',
    title: 'Disaster Recovery & Redundancy',
    icon: <Shield className="h-4 w-4" />,
    description: 'Business continuity planning',
    category: 'operational'
  },
  {
    id: 'modularity',
    title: 'Modularity & Componentization',
    icon: <Package className="h-4 w-4" />,
    description: 'System flexibility and reusability',
    category: 'operational'
  },
  {
    id: 'shadow-it',
    title: 'Shadow IT & Legacy Tech',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Hidden technical risks',
    category: 'operational'
  },
  
  // Strategic Analysis
  {
    id: 'integratability',
    title: 'Integratability & Interoperability',
    icon: <GitBranch className="h-4 w-4" />,
    description: 'M&A readiness and integration potential',
    category: 'strategic'
  },
  {
    id: 'peer-benchmarking',
    title: 'Peer Benchmarking',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Competitive positioning analysis',
    category: 'strategic'
  },
  {
    id: 'source-log',
    title: 'Source Log & Confidence',
    icon: <FileText className="h-4 w-4" />,
    description: 'Evidence and confidence tracking',
    category: 'strategic'
  },
  {
    id: 'final-narrative',
    title: 'Final Narrative Summary',
    icon: <FileText className="h-4 w-4" />,
    description: 'Comprehensive findings and next steps',
    category: 'strategic'
  }
]

interface ExecutiveReportNavigationProps {
  currentSection: string
  onSectionChange: (section: string) => void
  className?: string
}

export function ExecutiveReportNavigation({ 
  currentSection, 
  onSectionChange, 
  className 
}: ExecutiveReportNavigationProps) {
  const [expandedCategories, setExpandedCategories] = useState({
    investor: true,
    executive: true,
    technical: true,
    operational: true,
    strategic: true
  })

  const toggleCategory = (category: keyof typeof expandedCategories) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const categories = {
    investor: { title: 'Investor Analysis', color: 'text-purple-600' },
    executive: { title: 'Executive Overview', color: 'text-blue-600' },
    technical: { title: 'Technical Deep Dive', color: 'text-green-600' },
    operational: { title: 'Operational Analysis', color: 'text-orange-600' },
    strategic: { title: 'Strategic Assessment', color: 'text-red-600' }
  }

  const renderSection = (section: ExecutiveReportSection, depth = 0) => {
    const isActive = currentSection === section.id
    const hasSubsections = section.subsections && section.subsections.length > 0
    
    return (
      <div key={section.id}>
        <button
          onClick={() => onSectionChange(section.id)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors",
            depth > 0 && "pl-8",
            isActive 
              ? "bg-primary/10 text-primary font-medium" 
              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex-shrink-0",
              isActive && categories[section.category]?.color
            )}>
              {section.icon}
            </div>
            <span>{section.title}</span>
          </div>
        </button>
        
        {hasSubsections && section.subsections?.map(subsection => 
          renderSection(subsection, depth + 1)
        )}
      </div>
    )
  }

  const renderCategoryGroup = (category: keyof typeof categories) => {
    const sections = executiveReportSections.filter(s => s.category === category)
    if (sections.length === 0) return null

    return (
      <div key={category} className="mb-4">
        <button
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{categories[category].title}</span>
          {expandedCategories[category] ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        
        {expandedCategories[category] && (
          <div className="mt-1">
            {sections.map(section => renderSection(section))}
          </div>
        )}
      </div>
    )
  }

  return (
    <nav className={cn("w-80 bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700", className)}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Executive Assessment Report
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Investor-aligned comprehensive analysis
          </p>
        </div>

        {(['investor', 'executive', 'technical', 'operational', 'strategic'] as const).map(category => 
          renderCategoryGroup(category)
        )}
      </div>
    </nav>
  )
} 