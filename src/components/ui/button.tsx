import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
  {
    variants: {
      variant: {
        default: "bg-brand-primary text-bg-primary hover:bg-brand-primary-dark focus-visible:ring-brand-primary",
        destructive:
          "bg-action-red text-white hover:bg-action-red-dark focus-visible:ring-action-red",
        outline:
          "border-2 border-bg-tertiary text-text-primary hover:border-brand-primary focus-visible:ring-brand-primary",
        secondary:
          "bg-bg-tertiary text-text-primary hover:bg-bg-quaternary focus-visible:ring-bg-tertiary",
        ghost:
          "text-text-primary hover:bg-bg-tertiary focus-visible:ring-bg-tertiary",
        link: "text-brand-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        sm: "h-9 px-3 text-sm has-[>svg]:px-2.5",
        lg: "h-14 px-8 text-base has-[>svg]:px-6",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
