import { clsx } from 'clsx';
import { PropsWithChildren } from 'react';

export const Card = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <div className={clsx('rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg backdrop-blur', className)}>
    {children}
  </div>
);

export const CardHeader = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <div className={clsx('mb-3 flex items-center justify-between', className)}>{children}</div>
);

export const CardTitle = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <h3 className={clsx('text-lg font-semibold text-foreground', className)}>{children}</h3>
);

export const CardDescription = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <p className={clsx('text-sm text-slate-400', className)}>{children}</p>
);

export const CardContent = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <div className={clsx('space-y-3', className)}>{children}</div>
);
