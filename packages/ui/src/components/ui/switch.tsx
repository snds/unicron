// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:53 "Toggle"; no app PR, no DSA record)
"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "../../lib/utils"

/**
 * Switch: Figma's Toggle. A 44 × 24 track with 4px of padding and a square 16px knob that travels
 * 20px. On is the primary fill with an on-fill knob; off is the raised surface with a hairline and
 * a label-ink knob, so the two states differ by position and by fill, never by colour alone.
 * (`Toggle` in code is the pressed button, a different control.)
 *
 * Focus is the stylesheet's one ring for every control. The switch is 24px tall, so on a coarse
 * pointer its target widens to 44px (`hit-area`). Where it ends a row, make the whole row the
 * target (ToggleRow). Name it with a label (`id` + `htmlFor`) or `aria-label`.
 */
function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  /** @deprecated There is one size. `sm` is accepted and draws the same switch. */
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch hit-area inline-flex h-6 w-11 shrink-0 items-center rounded-lg p-1 transition-[background-color,box-shadow] data-checked:bg-primary data-checked:hover:bg-primary/90 data-checked:active:bg-primary/80 data-unchecked:rule-box data-unchecked:bg-surface-raised data-unchecked:hover:bg-accent aria-invalid:inset-ring-2 aria-invalid:inset-ring-critical-fill data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        // The knob slides on --motion-fast; under reduced motion it changes place without sliding.
        className="pointer-events-none block size-4 rounded-none transition-transform duration-(--motion-fast) ease-(--motion-ease) data-checked:translate-x-5 data-checked:bg-primary-foreground data-unchecked:translate-x-0 data-unchecked:bg-muted-foreground"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
