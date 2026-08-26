import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive select-none active:translate-x-[2px] active:translate-y-[2px]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-2 border-primary shadow-[3px_3px_0px_oklch(0.55_0.25_300)] hover:shadow-[5px_5px_0px_oklch(0.55_0.25_300)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_oklch(0.55_0.25_300)]',
        destructive:
          'bg-destructive text-white border-2 border-destructive shadow-[3px_3px_0px_oklch(0.45_0.25_25)] hover:shadow-[5px_5px_0px_oklch(0.45_0.25_25)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_oklch(0.45_0.25_25)]',
        outline:
          'border-2 border-border bg-transparent text-foreground shadow-[3px_3px_0px_var(--border)] hover:border-primary hover:text-primary hover:shadow-[3px_3px_0px_oklch(0.75_0.25_300_/_0.6)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_var(--border)]',
        secondary:
          'bg-secondary text-secondary-foreground border-2 border-secondary shadow-[3px_3px_0px_oklch(0.65_0.2_90)] hover:shadow-[5px_5px_0px_oklch(0.65_0.2_90)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_oklch(0.65_0.2_90)]',
        accent:
          'bg-accent text-accent-foreground border-2 border-accent shadow-[3px_3px_0px_oklch(0.6_0.22_145)] hover:shadow-[5px_5px_0px_oklch(0.6_0.22_145)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_oklch(0.6_0.22_145)]',
        ghost:
          'hover:bg-muted/60 hover:text-foreground border-2 border-transparent hover:border-border/50',
        link: 'text-primary underline-offset-4 hover:underline border-2 border-transparent',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-11 rounded-md px-6 has-[>svg]:px-4 text-base',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
