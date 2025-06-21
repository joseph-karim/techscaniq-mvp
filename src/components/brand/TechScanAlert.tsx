import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TechScanAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function TechScanAlert({ 
  type, 
  title, 
  description,
  dismissible = true,
  onDismiss
}: TechScanAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-900',
    },
    info: {
      icon: Info,
      bgColor: 'bg-brand-teal/10',
      borderColor: 'border-brand-teal/20',
      iconColor: 'text-brand-teal',
      textColor: 'text-brand-black',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'rounded-lg border p-4',
            config.bgColor,
            config.borderColor
          )}
        >
          <div className="flex items-start gap-3">
            <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
            <div className="flex-1">
              <h3 className={cn('font-space font-medium', config.textColor)}>
                {title}
              </h3>
              {description && (
                <p className={cn('mt-1 font-ibm text-sm', config.textColor, 'opacity-90')}>
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  'hover:bg-black/5',
                  config.textColor
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}