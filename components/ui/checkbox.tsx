'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon, MinusIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-slate-300 dark:border-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 data-[state=checked]:text-slate-50 data-[state=checked]:border-slate-900 data-[state=indeterminate]:bg-slate-900 data-[state=indeterminate]:text-slate-50 data-[state=indeterminate]:border-slate-900 dark:border-slate-700 dark:focus-visible:ring-slate-300 dark:data-[state=checked]:bg-slate-50 dark:data-[state=checked]:text-slate-900 dark:data-[state=checked]:border-slate-50 dark:data-[state=indeterminate]:bg-slate-50 dark:data-[state=indeterminate]:text-slate-900 dark:data-[state=indeterminate]:border-slate-50 transition-colors',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      <CheckIcon className="h-3.5 w-3.5 hidden [[data-state=checked]>&]:block" />
      <MinusIcon className="h-3.5 w-3.5 hidden [[data-state=indeterminate]>&]:block" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
