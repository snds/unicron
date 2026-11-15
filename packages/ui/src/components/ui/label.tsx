// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:48 "Text Field" label; no app PR, no DSA record)
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// A label that follows a checkbox, a radio or a switch (they are `peer`s), or wraps one, names a
// choice whatever its variant: it takes the choice look by itself.
const CHOICE_BY_PLACE =
  "peer-[:is([role=checkbox],[role=radio],[role=switch])]:type-ui peer-[:is([role=checkbox],[role=radio],[role=switch])]:normal-case peer-[:is([role=checkbox],[role=radio],[role=switch])]:text-foreground has-[[role=checkbox],[role=radio],[role=switch]]:type-ui has-[[role=checkbox],[role=radio],[role=switch]]:normal-case has-[[role=checkbox],[role=radio],[role=switch]]:text-foreground"

const labelVariants = cva(
  cn(
    "flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
    CHOICE_BY_PLACE
  ),
  {
    variants: {
      variant: {
        // A field's name, above its box: the mono caps overline in label ink (Figma 32:48).
        field: "type-overline text-muted-foreground",
        // The words beside a checkbox, a radio or a switch: they read as the choice, in the ink.
        choice: "type-ui text-foreground",
      },
    },
    defaultVariants: { variant: "field" },
  }
)

/**
 * A label. `field` (the default) names a field above its box, in mono caps; `choice` is the words
 * beside a checkbox, radio or switch, in the control type. Point it at its control with `htmlFor`.
 */
function Label({ className, variant = "field", ...props }: React.ComponentProps<"label"> & VariantProps<typeof labelVariants>) {
  return <label data-slot="label" data-variant={variant} className={cn(labelVariants({ variant }), className)} {...props} />
}

export { Label, labelVariants }
