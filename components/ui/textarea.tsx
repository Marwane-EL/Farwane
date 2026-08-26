import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-md',
        'border-2 border-border bg-input px-3 py-2 text-base',
        'shadow-[2px_2px_0px_var(--border)] transition-all duration-150 outline-none',
        'focus-visible:border-primary focus-visible:shadow-[3px_3px_0px_oklch(0.75_0.25_300_/_0.6)] focus-visible:-translate-x-[1px] focus-visible:-translate-y-[1px]',
        'aria-invalid:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
