// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: the panel opens on the motion-collapse recipe; no app PR, no DSA record)
"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { cn } from "../../lib/utils"

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

/**
 * The part that opens and closes. It opens by height on the `motion-collapse` recipe
 * (--motion-state, --motion-ease-move), so what is below moves with it; under reduced motion it
 * only fades. `animate={false}` opens it at once.
 */
function CollapsibleContent({ className, animate = true, ...props }: CollapsiblePrimitive.Panel.Props & { animate?: boolean }) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className={typeof className === "function" ? className : cn(animate && "motion-collapse", className)}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
