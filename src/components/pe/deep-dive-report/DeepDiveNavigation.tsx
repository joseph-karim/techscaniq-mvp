import { useState } from 'react'
import { 
  FileText, 
  Code, 
  Server, 
  Users, 
  DollarSign, 
  Shield, 
  Network, 
  TrendingUp,
  Clock,
  User,
  Layers,
  Cloud,
  CheckCircle,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DeepDiveSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  category: 'deep-dive' | 'enhanced'
}

export const deepDiveSections: DeepDiveSection[] = [
  // Deep Dive Sections
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    icon: <FileText className="h-4 w-4" />,
    description: 'High-level findings and recommendations',
    category: 'deep-dive'
  },
  {
    id: 'internal-code-analysis',
    title: 'Internal Code Analysis',
    icon: <Code className="h-4 w-4" />,
    description: 'Repository analysis, code quality, and technical debt',
    category: 'deep-dive'
  },
  {
    id: 'infrastructure-deep-dive',
    title: 'Infrastructure Deep Dive',
    icon: <Server className="h-4 w-4" />,
    description: 'Cloud infrastructure, costs, and optimization',
    category: 'deep-dive'
  },
  {
    id: 'team-process-analysis',
    title: 'Team & Process Analysis',
    icon: <Users className="h-4 w-4" />,
    description: 'Engineering culture, workflows, and documentation',
    category: 'deep-dive'
  },
  {
    id: 'financial-metrics',
    title: 'Financial & Operational Metrics',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Revenue, costs, unit economics, and profitability',
    category: 'deep-dive'
  },
  {
    id: 'compliance-audit',
    title: 'Compliance & Security Audit',
    icon: <Shield className="h-4 w-4" />,
    description: 'Security frameworks, data protection, and risk assessment',
    category: 'deep-dive'
  },
  {
    id: 'integration-analysis',
    title: 'Integration & API Analysis',
    icon: <Network className="h-4 w-4" />,
    description: 'API architecture, third-party integrations, and data flows',
    category: 'deep-dive'
  },
  {
    id: 'scalability-assessment',
    title: 'Scalability & Technical Roadmap',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Growth projections, architectural readiness, and scaling strategy',
    category: 'deep-dive'
  },
  // Enhanced Standard Sections
  {
    id: 'stack-evolution',
    title: 'Stack Evolution Timeline',
    icon: <Clock className="h-4 w-4" />,
    description: 'Technology evolution and key milestones',
    category: 'enhanced'
  },
  {
    id: 'technical-leadership',
    title: 'Technical Leadership',
    icon: <User className="h-4 w-4" />,
    description: 'Founding team and technical leadership assessment',
    category: 'enhanced'
  },
  {
    id: 'stack-architecture',
    title: 'Stack Architecture',
    icon: <Layers className="h-4 w-4" />,
    description: 'System architecture and component analysis',
    category: 'enhanced'
  },
  {
    id: 'cloud-vendor-dependencies',
    title: 'Cloud & Vendor Dependencies',
    icon: <Cloud className="h-4 w-4" />,
    description: 'Vendor risk assessment and dependency analysis',
    category: 'enhanced'
  },
  {
    id: 'code-quality-devops',
    title: 'Code Quality & DevOps',
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Development practices and operational maturity',
    category: 'enhanced'
  }
]

interface DeepDiveNavigationProps {
  currentSection: string
  onSectionChange: (sectionId: string) => void
  className?: string
}

export function DeepDiveNavigation({ currentSection, onSectionChange, className }: DeepDiveNavigationProps) {
  const [expandedCategories, setExpandedCategories] = useState({
    'deep-dive': true,
    'enhanced': false
  })

  const toggleCategory = (category: 'deep-dive' | 'enhanced') => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const deepDiveItems = deepDiveSections.filter(section => section.category === 'deep-dive')
  const enhancedItems = deepDiveSections.filter(section => section.category === 'enhanced')

  const renderSectionGroup = (title: string, items: DeepDiveSection[], category: 'deep-dive' | 'enhanced') => (
    <div className="mb-6">
      <button
        onClick={() => toggleCategory(category)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
      >
        <span>{title}</span>
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform",
          expandedCategories[category] && "rotate-90"
        )} />
      </button>
      
      {expandedCategories[category] && (
        <div className="mt-2 space-y-1">
          {items.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                onSectionChange(section.id)
                // Scroll to section with smooth behavior
                setTimeout(() => {
                  const element = document.getElementById(section.id)
                  if (element) {
                    element.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    })
                  }
                }, 100)
              }}
              className={cn(
                "flex items-start gap-3 w-full px-3 py-2 text-left text-sm rounded-lg transition-colors",
                currentSection === section.id
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <div className={cn(
                "mt-0.5",
                currentSection === section.id ? "text-blue-600" : "text-gray-400"
              )}>
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{section.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {section.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <nav className={cn("w-80 bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700", className)}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Deep Dive Report
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Navigate through comprehensive analysis sections
          </p>
        </div>

        {renderSectionGroup("Deep Dive Analysis", deepDiveItems, 'deep-dive')}
        {renderSectionGroup("Enhanced Standard Sections", enhancedItems, 'enhanced')}
      </div>
    </nav>
  )
} 