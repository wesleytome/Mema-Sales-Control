import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground",
        "flex field-sizing-content min-h-20 w-full rounded-2xl border border-border/80 bg-input px-3.5 py-2.5",
        "text-base shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary/60 focus-visible:ring-primary/15 focus-visible:ring-2",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
