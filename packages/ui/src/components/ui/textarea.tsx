// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
import * as React from "react"
import { cn } from "../../lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-surface-raised focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/80 dark:aria-invalid:ring-destructive/50 aria-invalid:border-destructive disabled:bg-muted rounded-lg border px-2.5 py-2 text-base transition-colors focus-visible:ring-3 aria-invalid:ring-3 pointer-fine:md:text-sm flex field-sizing-content min-h-16 short:min-h-9 frame-minimal:min-h-9 w-full outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
