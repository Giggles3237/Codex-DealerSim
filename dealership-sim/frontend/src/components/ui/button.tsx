import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { clsx } from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-blue-600',
  outline: 'border border-slate-600 text-foreground hover:bg-slate-800',
  ghost: 'hover:bg-slate-800 text-foreground',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild, variant = 'default', size = 'md', type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={clsx(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-60',
          sizeStyles[size],
          variantStyles[variant],
          className,
        )}
        type={type}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
