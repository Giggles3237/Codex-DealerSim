import { clsx } from 'clsx';
import { PropsWithChildren } from 'react';

type BadgeProps = PropsWithChildren<{ variant?: 'default' | 'success' | 'warning' | 'danger'; className?: string }>;

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-800 text-slate-100',
  success: 'bg-emerald-600/80 text-emerald-50',
  warning: 'bg-amber-500/80 text-amber-950',
  danger: 'bg-rose-500/80 text-rose-50',
};

export const Badge = ({ variant = 'default', className, children }: BadgeProps) => (
  <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', variants[variant], className)}>
    {children}
  </span>
);
