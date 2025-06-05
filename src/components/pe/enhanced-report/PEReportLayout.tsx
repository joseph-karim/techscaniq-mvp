import { useState } from 'react'
import { 
  ChevronRight, 
  Download, 
  Share2, 
  Printer, 
  Search,
  Menu,
  X,
  HelpCircle,
  BookOpen,
  BarChart3,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  title: string
  icon: React.ElementType
  subsections?: Section[]
  tier: 'executive' | 'insights' | 'detailed'
}

const reportSections: Section[] = [
  // Executive Overview (1-2 pages)
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    icon: FileText,
    tier: 'executive'
  },
  {
    id: 'key-findings',
    title: 'Key Findings & Recommendations',
    icon: BarChart3,
    tier: 'executive'
  },
  
  // Key Insights Dashboard (5-10 pages)
  {
    id: 'tech-health-overview',
    title: 'Technical Health Overview',
    icon: BarChart3,
    tier: 'insights',
    subsections: [
      { id: 'health-score', title: 'Overall Health Score', icon: BarChart3, tier: 'insights' },
      { id: 'risk-summary', title: 'Risk Summary', icon: BarChart3, tier: 'insights' },
      { id: 'thesis-alignment', title: 'Thesis Alignment', icon: BarChart3, tier: 'insights' }
    ]
  },
  {
    id: 'stack-evolution',
    title: 'Stack Evolution Timeline',
    icon: BarChart3,
    tier: 'insights'
  },
  {
    id: 'peer-benchmarking',
    title: 'Peer Benchmarking Snapshot',
    icon: BarChart3,
    tier: 'insights'
  },
  
  // Detailed Analysis (30-50 pages)
  {
    id: 'technical-leadership',
    title: 'Founding Team & Technical Leadership',
    icon: BookOpen,
    tier: 'detailed',
    subsections: [
      { id: 'founder-profiles', title: 'Founder Profiles', icon: BookOpen, tier: 'detailed' },
      { id: 'tech-team-assessment', title: 'Technical Team Assessment', icon: BookOpen, tier: 'detailed' },
      { id: 'leadership-gaps', title: 'Leadership Gaps & Recommendations', icon: BookOpen, tier: 'detailed' }
    ]
  },
  {
    id: 'architecture-infrastructure',
    title: 'Stack Architecture & Infrastructure',
    icon: BookOpen,
    tier: 'detailed',
    subsections: [
      { id: 'system-design', title: 'System Design & Patterns', icon: BookOpen, tier: 'detailed' },
      { id: 'infrastructure-analysis', title: 'Infrastructure Analysis', icon: BookOpen, tier: 'detailed' },
      { id: 'scalability-assessment', title: 'Scalability Assessment', icon: BookOpen, tier: 'detailed' }
    ]
  },
  {
    id: 'cloud-dependencies',
    title: 'Cloud & Vendor Dependencies',
    icon: BookOpen,
    tier: 'detailed',
    subsections: [
      { id: 'vendor-landscape', title: 'Vendor Landscape', icon: BookOpen, tier: 'detailed' },
      { id: 'dependency-risks', title: 'Dependency Risks', icon: BookOpen, tier: 'detailed' },
      { id: 'cost-optimization', title: 'Cost Optimization Opportunities', icon: BookOpen, tier: 'detailed' }
    ]
  },
  {
    id: 'ai-automation',
    title: 'AI Models & Automation Stack',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'code-quality',
    title: 'Codebase Quality Signals',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'data-governance',
    title: 'Data Architecture & Governance',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'automation-readiness',
    title: 'Agent & Automation Readiness',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'revenue-attribution',
    title: 'Revenue Attribution to Stack',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'disaster-recovery',
    title: 'Disaster Recovery & Redundancy',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'modularity',
    title: 'Modularity & Componentization',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'shadow-it',
    title: 'Shadow IT & Legacy Tech',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'integratability',
    title: 'Integratability & Interoperability',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'source-log',
    title: 'Source Log & Confidence Ledger',
    icon: BookOpen,
    tier: 'detailed'
  },
  {
    id: 'final-narrative',
    title: 'Final Narrative Summary',
    icon: BookOpen,
    tier: 'detailed'
  },
  
  // Appendix
  {
    id: 'evidence-appendix',
    title: 'Evidence Appendix',
    icon: Search,
    tier: 'detailed'
  }
]

interface PEReportLayoutProps {
  children: React.ReactNode
}

export function PEReportLayout({ children }: PEReportLayoutProps) {
  const [activeSection, setActiveSection] = useState('executive-summary')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tech-health-overview']))
  const [searchQuery, setSearchQuery] = useState('')
  const [readingProgress] = useState(15)

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const navigateToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    // Smooth scroll to section
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'executive': return 'text-purple-600 dark:text-purple-400'
      case 'insights': return 'text-blue-600 dark:text-blue-400'
      case 'detailed': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-gray-600'
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'executive': return 'Executive'
      case 'insights': return 'Insights'
      case 'detailed': return 'Detailed'
      default: return ''
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-20 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>

        {/* Sidebar Navigation */}
        <aside className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-80 transform bg-white transition-transform dark:bg-gray-900 md:relative md:transform-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          !isSidebarOpen && "md:w-0"
        )}>
          <div className="flex h-full flex-col border-r">
            {/* Search */}
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search report..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Navigation Tree */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {reportSections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        navigateToSection(section.id)
                        if (section.subsections) {
                          toggleSection(section.id)
                        }
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                        activeSection === section.id && "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <section.icon className={cn("h-4 w-4", getTierColor(section.tier))} />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-medium",
                          getTierColor(section.tier)
                        )}>
                          {getTierBadge(section.tier)}
                        </span>
                        {section.subsections && (
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            expandedSections.has(section.id) && "rotate-90"
                          )} />
                        )}
                      </div>
                    </button>
                    
                    {section.subsections && expandedSections.has(section.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {section.subsections.map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() => navigateToSection(subsection.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                              activeSection === subsection.id && "bg-gray-100 dark:bg-gray-800"
                            )}
                          >
                            <span className="text-gray-600 dark:text-gray-400">
                              {subsection.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Reading Progress */}
            <div className="border-t p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Reading Progress</span>
                  <span className="font-medium">{readingProgress}%</span>
                </div>
                <Progress value={readingProgress} className="h-2" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Quick Actions Bar */}
          <div className="sticky top-16 z-30 flex items-center justify-between border-b bg-white px-6 py-3 dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Ring4 Technical Stack Diligence Report</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use keyboard shortcuts: ↑↓ to navigate, Space to expand</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button className="bg-electric-teal hover:bg-electric-teal/90" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Report Content */}
          <ScrollArea className="flex-1">
            <div className="mx-auto max-w-5xl p-6">
              {children}
            </div>
          </ScrollArea>
        </div>
      </div>
    </TooltipProvider>
  )
} 