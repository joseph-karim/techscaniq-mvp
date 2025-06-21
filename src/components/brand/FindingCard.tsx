import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FindingCardProps {
  type: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  evidence?: string[];
  recommendation?: string;
}

export function FindingCard({ 
  type, 
  title, 
  description, 
  evidence,
  recommendation 
}: FindingCardProps) {
  const typeConfig = {
    critical: {
      icon: XCircle,
      bgColor: 'bg-risk-red/5',
      borderColor: 'border-red-400',
      iconColor: 'text-risk-red',
      titleColor: 'text-risk-red',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-400',
      iconColor: 'text-orange-600',
      titleColor: 'text-orange-900',
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-signal-green/5',
      borderColor: 'border-green-400',
      iconColor: 'text-signal-green',
      titleColor: 'text-signal-green',
    },
    info: {
      icon: Info,
      bgColor: 'bg-brand-teal/10',
      borderColor: 'border-brand-teal',
      iconColor: 'text-brand-teal',
      titleColor: 'text-brand-black',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={cn(
        'rounded-xl p-6 border-l-4',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-4">
        <Icon className={cn('h-6 w-6 flex-shrink-0 mt-0.5', config.iconColor)} />
        <div className="flex-1">
          <h3 className={cn('font-space text-lg font-medium mb-2', config.titleColor)}>
            {title}
          </h3>
          <p className="font-ibm text-gray-700 mb-4">
            {description}
          </p>
          
          {evidence && evidence.length > 0 && (
            <div className="mb-4">
              <h4 className="font-space text-sm font-medium text-gray-900 mb-2">
                Evidence:
              </h4>
              <ul className="space-y-1">
                {evidence.map((item, index) => (
                  <li key={index} className="font-ibm text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-brand-teal mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {recommendation && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-space text-sm font-medium text-gray-900 mb-1">
                Recommendation:
              </h4>
              <p className="font-ibm text-sm text-gray-700">
                {recommendation}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}