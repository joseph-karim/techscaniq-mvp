import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TechScanCardProps {
  variant?: 'default' | 'highlighted' | 'dark' | 'gradient';
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverable?: boolean;
  onClick?: () => void;
}

export function TechScanCard({ 
  variant = 'default', 
  children, 
  className,
  delay = 0,
  hoverable = true,
  onClick
}: TechScanCardProps) {
  const variants = {
    default: 'bg-white border border-gray-200',
    highlighted: 'bg-white border-2 border-brand-teal',
    dark: 'bg-gradient-to-br from-gray-900 to-gray-800 text-white',
    gradient: 'bg-gradient-to-br from-brand-teal/10 to-brand-teal/5 border border-brand-teal/20',
  };

  const hoverAnimation = hoverable ? {
    whileHover: { y: -5, boxShadow: '0 25px 50px -12px rgba(0, 194, 178, 0.35)' }
  } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      viewport={{ once: true }}
      onClick={onClick}
      {...hoverAnimation}
      className={cn(
        'rounded-2xl p-8 shadow-lg transition-all duration-300',
        onClick && 'cursor-pointer',
        variants[variant],
        className
      )}
    >
      {children}
    </motion.div>
  );
}