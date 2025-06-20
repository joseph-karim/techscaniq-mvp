import { useState } from 'react'
import { 
  FileText, 
  BarChart3, 
  Shield, 
  TrendingUp,
  Code,
  CheckCircle,
  ChevronRight,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ScanReportSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  category: 'overview' | 'technical' | 'security' | 'recommendations' | 'appendix'
}

export const scanReportSections: ScanReportSection[] = [
  // Overview Sections
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    icon: <FileText className="h-4 w-4" />,
    description: 'Investment analysis and key insights',
    category: 'overview'
  },
  {
    id: 'company-overview',
    title: 'Company Overview',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Business model and market position',
    category: 'overview'
  },
  {
    id: 'technology-overview',
    title: 'Technology Stack',
    icon: <Code className="h-4 w-4" />,
    description: 'Technology architecture and stack analysis',
    category: 'technical'
  },
  
  // Analysis Sections
  {
    id: 'security-assessment',
    title: 'Security Assessment',
    icon: <Shield className="h-4 w-4" />,
    description: 'Security analysis and compliance',
    category: 'security'
  },
  {
    id: 'team-analysis',
    title: 'Team Analysis',
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Leadership and team capabilities',
    category: 'overview'
  },
  {
    id: 'financial-overview',
    title: 'Financial Overview',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Financial metrics and funding history',
    category: 'overview'
  },
  
  // Appendix
  {
    id: 'evidence-appendix',
    title: 'Evidence Appendix',
    icon: <Search className="h-4 w-4" />,
    description: 'Complete evidence trail and source materials',
    category: 'appendix'
  }
]

interface ScanReportNavigationProps {
  currentSection: string
  onSectionChange: (sectionId: string) => void
  className?: string
}

export function ScanReportNavigation({ currentSection, onSectionChange, className }: ScanReportNavigationProps) {
  const [expandedCategories, setExpandedCategories] = useState({
    'overview': true,
    'technical': false,
    'security': false,
    'recommendations': false,
    'appendix': false
  })

  const toggleCategory = (category: 'overview' | 'technical' | 'security' | 'recommendations' | 'appendix') => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'overview': return 'Overview & Assessment'
      case 'technical': return 'Technical Analysis'
      case 'security': return 'Security & Compliance'
      case 'recommendations': return 'Recommendations'
      case 'appendix': return 'Appendix'
      default: return category
    }
  }

  const renderSectionGroup = (category: 'overview' | 'technical' | 'security' | 'recommendations' | 'appendix') => {
    const items = scanReportSections.filter(section => section.category === category)
    const title = getCategoryTitle(category)
    
    return (
      <div key={category} className="mb-6">
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
  }

  return (
    <nav className={cn("w-80 bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700", className)}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Scan Report
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Navigate through comprehensive analysis sections
          </p>
        </div>

        {(['overview', 'technical', 'security', 'recommendations', 'appendix'] as const).map(category => 
          renderSectionGroup(category)
        )}
      </div>
    </nav>
  )
} 