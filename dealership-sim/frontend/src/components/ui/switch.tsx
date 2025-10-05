import * as SwitchPrimitive from '@radix-ui/react-switch';
import { clsx } from 'clsx';

export const Switch = (props: SwitchPrimitive.SwitchProps) => (
  <SwitchPrimitive.Root
    className={clsx(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-slate-700 transition-colors data-[state=checked]:bg-primary',
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={clsx(
        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
      )}
    />
  </SwitchPrimitive.Root>
);
