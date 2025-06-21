import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TechScanTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TechScanTextarea = forwardRef<HTMLTextAreaElement, TechScanTextareaProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-space text-sm font-medium text-brand-black mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-lg border font-ibm transition-all duration-200',
            'focus:ring-2 focus:ring-brand-teal focus:border-transparent',
            'placeholder:text-gray-400 resize-none',
            error 
              ? 'border-red-400 focus:ring-red-400' 
              : 'border-gray-200 hover:border-gray-300',
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-600 font-ibm">{helperText}</p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-400 font-ibm">{error}</p>
        )}
      </div>
    );
  }
);

TechScanTextarea.displayName = 'TechScanTextarea';