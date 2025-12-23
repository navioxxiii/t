import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border border-bg-tertiary bg-bg-quaternary px-4 py-2 text-base text-text-primary placeholder:text-text-tertiary transition-all outline-none",
        "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "selection:bg-brand-primary selection:text-bg-primary",
        className
      )}
      {...props}
    />
  )
}

export { Input }
