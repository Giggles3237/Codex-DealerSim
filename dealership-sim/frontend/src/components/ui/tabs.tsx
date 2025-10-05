import * as TabsPrimitive from '@radix-ui/react-tabs';
import { clsx } from 'clsx';

export const Tabs = TabsPrimitive.Root;
export const TabsList = ({ className, ...props }: TabsPrimitive.TabsListProps) => (
  <TabsPrimitive.List
    className={clsx(
      'inline-flex items-center gap-1 rounded-full bg-slate-900/70 p-1 text-slate-300 shadow-inner',
      className,
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: TabsPrimitive.TabsTriggerProps) => (
  <TabsPrimitive.Trigger
    className={clsx(
      'inline-flex min-w-[120px] items-center justify-center rounded-full px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
      'data-[state=inactive]:text-slate-400 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
      className,
    )}
    {...props}
  />
);

export const TabsContent = ({ className, ...props }: TabsPrimitive.TabsContentProps) => (
  <TabsPrimitive.Content className={clsx('mt-6 focus-visible:outline-none', className)} {...props} />
);
