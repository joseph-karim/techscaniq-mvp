import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TechScanSectionProps {
  children: ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'black' | 'gradient';
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function TechScanSection({ 
  children, 
  className,
  background = 'white',
  containerSize = 'lg'
}: TechScanSectionProps) {
  const backgrounds = {
    white: 'bg-brand-white',
    gray: 'bg-gray-50',
    black: 'bg-brand-black text-white',
    gradient: 'bg-gradient-to-b from-white to-gray-50',
  };

  const containerSizes = {
    sm: 'max-w-4xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'w-full',
  };

  return (
    <section className={cn(
      'py-16 md:py-24 lg:py-32',
      backgrounds[background],
      className
    )}>
      <div className={cn(
        'mx-auto px-6 md:px-8',
        containerSizes[containerSize]
      )}>
        {children}
      </div>
    </section>
  );
}