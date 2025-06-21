import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import React, { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'number' | 'percentage' | 'currency';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon?: ReactNode;
}

export function MetricCard({ 
  label, 
  value, 
  format = 'number',
  trend,
  trendValue,
  icon 
}: MetricCardProps) {
  const animatedValue = useAnimatedNumber(value);
  
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    down: {
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        {icon ? (
          <div className="p-3 bg-brand-teal/10 rounded-lg">
            {icon}
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-brand-teal" />
        )}
        
        {trend && trendValue !== undefined && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
            trendConfig[trend].bgColor,
            trendConfig[trend].color
          )}>
            {React.createElement(trendConfig[trend].icon, { className: 'h-3 w-3' })}
            <span>{Math.abs(trendValue)}%</span>
          </div>
        )}
      </div>
      
      <h3 className="font-ibm text-gray-600 text-sm mb-1">{label}</h3>
      <p className="font-space text-3xl font-medium text-brand-black">
        {formatValue(animatedValue)}
      </p>
    </motion.div>
  );
}