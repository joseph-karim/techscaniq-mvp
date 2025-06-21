import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TechScanButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDrag' | 'onDragEnd'> {
  variant?: 'primary' | 'secondary' | 'white' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  asChild?: boolean;
}

export function TechScanButton({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  icon,
  loading = false,
  className,
  disabled,
  asChild = false,
  ...props 
}: TechScanButtonProps) {
  const variants = {
    primary: 'bg-brand-teal text-brand-white hover:bg-brand-teal/90',
    secondary: 'border-2 border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white',
    white: 'border-2 border-white text-brand-black bg-white hover:bg-white/90',
    ghost: 'hover:bg-gray-100 text-brand-black',
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6',
    lg: 'h-14 px-8 text-lg',
  };

  const buttonClasses = cn(
    'font-space font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group',
    'focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    className
  );

  const buttonContent = loading ? (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ) : (
    <>
      {children}
      {icon && (
        <span className="group-hover:translate-x-1 transition-transform">
          {icon}
        </span>
      )}
    </>
  );

  if (asChild) {
    // When asChild is true, apply the styling to the child element
    return (
      <div className={buttonClasses}>
        {buttonContent}
      </div>
    );
  }

  const buttonProps = {
    className: buttonClasses,
    disabled: disabled || loading,
    ...props
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...buttonProps}
    >
      {buttonContent}
    </motion.button>
  );
}