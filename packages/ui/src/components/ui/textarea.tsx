// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:48 "Text Field" box; no app PR, no DSA record)
import * as React from "react"
import { cn } from "../../lib/utils"

import { fieldBoxVariants } from "./input"

/**
 * Several lines in the Text Field's box: 12 / 16 in from its edges, the value in the `ui` role.
 * It starts at `rows` lines and grows with its text where the browser can size a field to its
 * content (`field-sizing`); for growth everywhere, WebKit included, use `TextField multiline`.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldBoxVariants(),
        "flex field-sizing-content min-h-control w-full px-4 py-3 placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
