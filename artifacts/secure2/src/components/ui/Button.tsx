import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-[#075BE8] hover:bg-[#0878FF] text-white focus:ring-[#075BE8] shadow-sm',
      secondary: 'bg-[#E0E7FF] hover:bg-[#D1E0FF] text-[#075BE8] focus:ring-[#075BE8]',
      outline: 'border border-[#DCE7FA] bg-transparent hover:bg-[#F3F7FF] text-[#071747] focus:ring-[#DCE7FA]',
      ghost: 'bg-transparent hover:bg-[#F3F7FF] text-[#071747] focus:ring-[#DCE7FA]',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600',
    };
    
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth ? 'w-full' : '',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';