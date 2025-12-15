import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/50 selection:bg-primary selection:text-primary-foreground h-12 w-full min-w-0 rounded-xl px-4 py-3 text-base transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Light mode
        "bg-white border border-gray-200",
        "hover:border-gray-300 hover:bg-gray-50/50",
        "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:bg-white",
        // Dark mode
        "dark:bg-white/[0.04] dark:border-white/[0.08]",
        "dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05]",
        "dark:focus-visible:bg-white/[0.06]",
        // Validation
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
