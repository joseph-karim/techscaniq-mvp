import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TechScanInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const TechScanInput = forwardRef<HTMLInputElement, TechScanInputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-space text-sm font-medium text-brand-black mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3 rounded-lg border font-ibm transition-all duration-200',
              'focus:ring-2 focus:ring-brand-teal focus:border-transparent',
              'placeholder:text-gray-400',
              icon && 'pl-10',
              error 
                ? 'border-red-400 focus:ring-red-400' 
                : 'border-gray-200 hover:border-gray-300',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-risk-red font-ibm">{error}</p>
        )}
      </div>
    );
  }
);

TechScanInput.displayName = 'TechScanInput';