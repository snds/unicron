// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: a horizontal rule is 1px of paint that adds no height; no app PR, no DSA record)
"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "../../lib/utils"

/**
 * A hairline between two things. Horizontal, it adds no height (contract §1.6: strokes never add
 * height): its 1px is drawn over the last pixel row of what comes before it, where a `rule-b`
 * would draw, so a stack with separators is exactly as tall as its parts and stays on the 4px
 * grid. Drawn over what precedes it, not under what follows, so a row's hover fill never hides it.
 */
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:-mt-px data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
