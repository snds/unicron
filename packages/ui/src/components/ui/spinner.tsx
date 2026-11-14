// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: a spinner is an arc of its own, not an icon, on a motion that is not the agent's; no app PR, no DSA record)
import type * as React from "react"

import { cn } from "../../lib/utils"

export interface SpinnerProps extends Omit<React.ComponentProps<"svg">, "children"> {
  /** What is loading, for a screen reader. */
  label?: string
}

/**
 * Busy. Three quarters of a ring, drawn on the icons' 32 grid with their 2 px line, so beside an
 * icon it has the same weight. Generic loading, so it must never move like the agent's working
 * ring (StatusOrb, RunTrace: one even, linear turn per --motion-spin; rules 1.6, contract 3): it
 * turns once a second (`--c-spinner-turn-duration`, the tick role) and eases in and out of each
 * turn on --motion-ease-move, a mechanism stepping round. With prefers-reduced-motion it stays
 * still at reduced opacity (@unicron/ui's styles), so it still reads as busy without moving.
 */
function Spinner({ className, label = "Loading", ...props }: SpinnerProps) {
  return (
    <svg
      data-slot="spinner"
      role="status"
      aria-label={label}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={cn("size-4 shrink-0 animate-[spin_var(--c-spinner-turn-duration)_var(--motion-ease-move)_infinite]", className)}
      {...props}
    >
      <path d="M16 3a13 13 0 1 1-13 13" />
    </svg>
  )
}

export { Spinner }
