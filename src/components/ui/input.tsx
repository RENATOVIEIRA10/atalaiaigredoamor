import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-2xl border border-input/75 bg-background/78 px-4 py-2 text-base shadow-[inset_0_1px_0_hsl(0_0%_100%/0.35)] ring-offset-background placeholder:text-muted-foreground/68 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-1 focus-visible:border-primary/35 focus-visible:bg-background disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 md:text-sm',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
