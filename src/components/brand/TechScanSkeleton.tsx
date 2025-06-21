import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface TechScanSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'chart' | 'metric';
}

export function TechScanSkeleton({ 
  className, 
  variant = 'text',
  ...props 
}: TechScanSkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    card: 'h-48 rounded-2xl',
    chart: 'h-64 rounded-xl',
    metric: 'h-32 rounded-2xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// Specific skeleton components
export function ReportSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-64 rounded-t-2xl animate-pulse" />
      
      {/* Content skeleton */}
      <div className="px-8 space-y-8">
        {/* Section title */}
        <TechScanSkeleton className="h-8 w-3/4" />
        
        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TechScanSkeleton variant="metric" />
          <TechScanSkeleton variant="metric" />
          <TechScanSkeleton variant="metric" />
        </div>
        
        {/* Chart */}
        <TechScanSkeleton variant="chart" />
        
        {/* Text content */}
        <div className="space-y-3">
          <TechScanSkeleton className="w-full" />
          <TechScanSkeleton className="w-5/6" />
          <TechScanSkeleton className="w-4/6" />
        </div>
      </div>
    </div>
  );
}