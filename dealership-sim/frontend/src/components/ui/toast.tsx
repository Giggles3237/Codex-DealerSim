import * as ToastPrimitive from '@radix-ui/react-toast';
import { clsx } from 'clsx';
import { PropsWithChildren } from 'react';

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = ToastPrimitive.Viewport;

export const Toast = ({ className, ...props }: ToastPrimitive.ToastProps) => (
  <ToastPrimitive.Root
    className={clsx(
      'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl backdrop-blur',
      className,
    )}
    {...props}
  />
);

export const ToastTitle = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <ToastPrimitive.Title className={clsx('text-sm font-semibold text-foreground', className)}>{children}</ToastPrimitive.Title>
);

export const ToastDescription = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <ToastPrimitive.Description className={clsx('text-sm text-slate-300', className)}>{children}</ToastPrimitive.Description>
);

export const ToastClose = ToastPrimitive.Close;
