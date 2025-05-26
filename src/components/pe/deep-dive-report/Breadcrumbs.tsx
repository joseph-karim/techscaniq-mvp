import { Link } from 'react-router-dom'
import { ChevronRight, FileText, Eye, User } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  current?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  currentSection?: string
  analystReviews?: {
    section: string
    reviewer: string
    reviewDate: string
    confidence: number
    notes?: string
  }[]
}

export function Breadcrumbs({ items, currentSection, analystReviews }: BreadcrumbsProps) {
  const currentReview = analystReviews?.find(review => review.section === currentSection)

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <nav className="flex items-center space-x-2 text-sm">
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />}
              {item.href && !item.current ? (
                <Link to={item.href} className={`flex items-center gap-1 text-gray-600 hover:text-blue-600 cursor-pointer`}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div className={`flex items-center gap-1 ${
                  item.current 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-400'
                }`}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Human Analyst Review Badge */}
        {currentReview && (
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
              <Eye className="h-3 w-3" />
              Human Reviewed
            </div>
            <div className="text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {currentReview.reviewer}
              </div>
              <div>{currentReview.reviewDate}</div>
              <div className="flex items-center gap-1">
                <span>Confidence:</span>
                <span className={`font-medium ${
                  currentReview.confidence >= 90 ? 'text-green-600' :
                  currentReview.confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {currentReview.confidence}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analyst Notes */}
      {currentReview?.notes && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Analyst Notes
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                {currentReview.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 