import { useState } from 'react'
import { 
  ExternalLink, 
  FileText, 
  Code, 
  Globe, 
  Database,
  ChevronDown,
  ChevronRight,
  Eye,
  Brain,
  Search,
  Link
} from 'lucide-react'

import { cn } from '@/lib/utils'

export interface Evidence {
  id: string
  type: 'code' | 'document' | 'web' | 'database' | 'api' | 'interview' | 'analysis'
  title: string
  source: string
  url?: string
  excerpt?: string
  metadata?: {
    fileType?: string
    lineNumbers?: string
    lastModified?: string
    author?: string
    confidence?: number
  }
}

export interface Citation {
  id: string
  claim: string
  evidence: Evidence[]
  reasoning: string
  confidence: number
  analyst: string
  reviewDate: string
  methodology?: string
}

interface EvidenceCitationProps {
  citation: Citation
  className?: string
}

export function EvidenceCitation({ citation, className }: EvidenceCitationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)

  const getEvidenceIcon = (type: Evidence['type']) => {
    switch (type) {
      case 'code': return <Code className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'web': return <Globe className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'api': return <Link className="h-4 w-4" />
      case 'interview': return <Eye className="h-4 w-4" />
      case 'analysis': return <Brain className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getEvidenceTypeLabel = (type: Evidence['type']) => {
    switch (type) {
      case 'code': return 'Code Repository'
      case 'document': return 'Documentation'
      case 'web': return 'Web Source'
      case 'database': return 'Database Query'
      case 'api': return 'API Response'
      case 'interview': return 'Team Interview'
      case 'analysis': return 'Technical Analysis'
      default: return 'Source'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={cn("border border-blue-200 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800", className)}>
      {/* Citation Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Evidence-Based Finding
              </span>
              <span className={cn("text-sm font-medium", getConfidenceColor(citation.confidence))}>
                {citation.confidence}% confidence
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {citation.claim}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>Analyst: {citation.analyst}</span>
              <span>Reviewed: {citation.reviewDate}</span>
              <span>{citation.evidence.length} evidence sources</span>
            </div>
          </div>
          <div className="ml-4">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-blue-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-blue-600" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-blue-200 dark:border-blue-800">
          {/* Reasoning Section */}
          <div className="p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Analysis & Reasoning
              </h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              {citation.reasoning}
            </p>
            {citation.methodology && (
              <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <strong>Methodology:</strong> {citation.methodology}
              </div>
            )}
          </div>

          {/* Evidence Sources */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Supporting Evidence ({citation.evidence.length} sources)
              </h4>
            </div>
            
            <div className="space-y-3">
              {citation.evidence.map((evidence) => (
                <div key={evidence.id} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                  <div 
                    className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setSelectedEvidence(selectedEvidence?.id === evidence.id ? null : evidence)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-gray-500 mt-0.5">
                          {getEvidenceIcon(evidence.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {evidence.title}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                              {getEvidenceTypeLabel(evidence.type)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {evidence.source}
                          </p>
                          {evidence.excerpt && (
                            <p className="text-xs text-gray-500 italic line-clamp-2">
                              "{evidence.excerpt}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {evidence.url && (
                          <ExternalLink className="h-3 w-3 text-blue-500" />
                        )}
                        {selectedEvidence?.id === evidence.id ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Evidence Details */}
                  {selectedEvidence?.id === evidence.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                      <div className="space-y-3">
                        {/* Full Excerpt */}
                        {evidence.excerpt && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Relevant Excerpt:
                            </h5>
                            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded border font-mono">
                              {evidence.excerpt}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        {evidence.metadata && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Source Details:
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {evidence.metadata.fileType && (
                                <div>
                                  <span className="text-gray-500">File Type:</span>
                                  <span className="ml-1 text-gray-700 dark:text-gray-300">{evidence.metadata.fileType}</span>
                                </div>
                              )}
                              {evidence.metadata.lineNumbers && (
                                <div>
                                  <span className="text-gray-500">Lines:</span>
                                  <span className="ml-1 text-gray-700 dark:text-gray-300">{evidence.metadata.lineNumbers}</span>
                                </div>
                              )}
                              {evidence.metadata.lastModified && (
                                <div>
                                  <span className="text-gray-500">Modified:</span>
                                  <span className="ml-1 text-gray-700 dark:text-gray-300">{evidence.metadata.lastModified}</span>
                                </div>
                              )}
                              {evidence.metadata.author && (
                                <div>
                                  <span className="text-gray-500">Author:</span>
                                  <span className="ml-1 text-gray-700 dark:text-gray-300">{evidence.metadata.author}</span>
                                </div>
                              )}
                              {evidence.metadata.confidence && (
                                <div>
                                  <span className="text-gray-500">Source Confidence:</span>
                                  <span className={cn("ml-1 font-medium", getConfidenceColor(evidence.metadata.confidence))}>
                                    {evidence.metadata.confidence}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          {evidence.url && (
                            <button 
                              onClick={() => window.open(evidence.url, '_blank')}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Source
                            </button>
                          )}
                          <button className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                            Copy Reference
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component for inline citations within text
interface InlineCitationProps {
  citationId: string
  children: React.ReactNode
  citation: Citation
  onCitationClick?: (citation: Citation) => void
}

export function InlineCitation({ citationId, children, citation, onCitationClick }: InlineCitationProps) {
  return (
    <span className="relative group">
      <span 
        className="underline decoration-blue-400 decoration-dotted cursor-pointer hover:decoration-solid hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        onClick={() => onCitationClick?.(citation)}
      >
        {children}
      </span>
      <sup className="text-xs text-blue-600 ml-0.5 cursor-pointer" onClick={() => onCitationClick?.(citation)}>
        [{citationId}]
      </sup>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded p-2 whitespace-nowrap max-w-xs">
          <div className="font-medium mb-1">Evidence: {citation.evidence.length} sources</div>
          <div>Confidence: {citation.confidence}%</div>
          <div className="text-gray-300">Click to view details</div>
        </div>
      </div>
    </span>
  )
} 