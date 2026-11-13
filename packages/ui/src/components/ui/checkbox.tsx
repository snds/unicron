// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction; drawn by hand on Vale's Notes frames, no Figma component; no app PR, no DSA record)
"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "../../lib/utils"

/**
 * Checkbox: a 16px square on the 2px control radius. Unchecked is the raised surface with a
 * hairline; checked is an ink fill with the check drawn in the ground colour, so the state shows
 * by shape as well as by fill. A dash stands for "some of these" (`indeterminate`).
 *
 * The marks are an inline SVG, not an icon: they need no icon set and they never take a label's
 * case or tracking. Focus is the stylesheet's one ring for every control. On a coarse pointer the
 * target widens to 44px (`hit-area`). The root is a
 * `peer`, so a label beside it can follow its state (`peer-data-checked:line-through` on a done
 * item).
 */
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group/checkbox hit-area inline-flex size-4 shrink-0 items-center justify-center rounded-lg text-background transition-[background-color,box-shadow] data-unchecked:rule-box data-unchecked:bg-surface-raised data-unchecked:hover:bg-accent data-checked:bg-foreground data-indeterminate:bg-foreground aria-invalid:inset-ring-2 aria-invalid:inset-ring-critical-fill data-disabled:pointer-events-none data-disabled:opacity-50 group-has-disabled/field:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center text-current">
        <svg
          data-slot="checkbox-mark"
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="square"
          strokeLinejoin="miter"
          className="size-4"
        >
          <path data-mark="check" className="group-data-indeterminate/checkbox:hidden" d="M4 8.5 6.75 11.25 12 5.5" />
          <path data-mark="indeterminate" className="hidden group-data-indeterminate/checkbox:block" d="M4.5 8h7" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
