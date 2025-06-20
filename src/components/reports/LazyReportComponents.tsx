import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy report components
const LangGraphReport = lazy(() => import('./LangGraphReport').then(module => ({ default: module.LangGraphReport })))
const LangGraphPEReport = lazy(() => import('./LangGraphPEReport').then(module => ({ default: module.LangGraphPEReport })))
const SalesIntelligenceReport = lazy(() => import('./SalesIntelligenceReport').then(module => ({ default: module.SalesIntelligenceReport })))
const EnhancedEvidenceAppendix = lazy(() => import('./EnhancedEvidenceAppendix').then(module => ({ default: module.EnhancedEvidenceAppendix })))

// Loading skeletons
const ReportSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="grid grid-cols-2 gap-4 mt-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-64 w-full mt-6" />
  </div>
)

const EvidenceSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-6 w-1/2" />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="border rounded p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
)

// Wrapper components with suspense
export const LazyLangGraphReport = (props: any) => (
  <Suspense fallback={<ReportSkeleton />}>
    <LangGraphReport {...props} />
  </Suspense>
)

export const LazyLangGraphPEReport = (props: any) => (
  <Suspense fallback={<ReportSkeleton />}>
    <LangGraphPEReport {...props} />
  </Suspense>
)

export const LazySalesIntelligenceReport = (props: any) => (
  <Suspense fallback={<ReportSkeleton />}>
    <SalesIntelligenceReport {...props} />
  </Suspense>
)

export const LazyEnhancedEvidenceAppendix = (props: any) => (
  <Suspense fallback={<EvidenceSkeleton />}>
    <EnhancedEvidenceAppendix {...props} />
  </Suspense>
)