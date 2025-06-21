import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechScanSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const TechScanSelect = forwardRef<HTMLSelectElement, TechScanSelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-space text-sm font-medium text-brand-black mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full px-4 py-3 rounded-lg border font-ibm transition-all duration-200 appearance-none',
              'focus:ring-2 focus:ring-brand-teal focus:border-transparent',
              'bg-white',
              error 
                ? 'border-red-400 focus:ring-red-400' 
                : 'border-gray-200 hover:border-gray-300',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400 font-ibm">{error}</p>
        )}
      </div>
    );
  }
);

TechScanSelect.displayName = 'TechScanSelect';