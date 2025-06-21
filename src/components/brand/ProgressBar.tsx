import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'teal' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ 
  value, 
  max = 100, 
  label,
  showValue = true,
  color = 'teal',
  size = 'md'
}: ProgressBarProps) {
  const percentage = (value / max) * 100;
  
  const colorClasses = {
    teal: 'bg-brand-teal',
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
  };
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="font-ibm text-sm text-gray-700">{label}</span>
          )}
          {showValue && (
            <span className="font-mono text-sm text-gray-600">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            'h-full rounded-full',
            colorClasses[color]
          )}
        />
      </div>
    </div>
  );
}