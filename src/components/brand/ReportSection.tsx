import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ReportSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function ReportSection({ 
  title, 
  subtitle, 
  children, 
  className,
  icon 
}: ReportSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className={cn('py-8 md:py-12', className)}
    >
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          {icon && (
            <div className="p-2 bg-brand-teal/10 rounded-lg">
              {icon}
            </div>
          )}
          <h2 className="font-space text-2xl md:text-3xl font-medium text-brand-black">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="font-ibm text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </motion.section>
  );
}