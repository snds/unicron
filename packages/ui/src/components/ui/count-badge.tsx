// Owned component (not generated): a round count beside a row, a tab or a sidebar item.
// Promoted from: Seeded in snds/unicron (Unicron 2.0 library, Figma Count Badge 193:593; no app PR, no DSA record)
import type * as React from "react"

import { cn } from "../../lib/utils"

/**
 * How much the count matters. The badge takes the worst item's severity (the shared rule):
 * - `minor`: a ghost outline (line/strong) in secondary ink, for a count that is only information.
 * - `default`: the shared count blue (info/fill), for unread or new.
 * - `concerning`: the amber, for something going wrong.
 * - `urgent`: the red, for something that is broken now.
 */
export type CountBadgeSeverity = "minor" | "default" | "concerning" | "urgent"

export type CountBadgeProps = Omit<React.ComponentProps<"span">, "children"> & {
  count: number
  severity?: CountBadgeSeverity
  /** Past this the badge reads `max+` (99+ by default). */
  max?: number
}

/** The number a badge shows: plain digits, no zero padding, `99+` past the cap. */
export function countBadgeText(count: number, max = 99): string {
  return count > max ? `${max}+` : String(Math.max(0, Math.floor(count)))
}

/**
 * Figma Count Badge: 18 tall and round, 5 in, the overline role's size and weight with tabular
 * figures. The count is decoration for a name that already says it, so it is hidden from screen
 * readers unless it is the only label (pass `aria-hidden={false}` and an `aria-label`).
 */
export function CountBadge({ count, severity = "default", max = 99, className, ...props }: CountBadgeProps) {
  return (
    <span data-slot="count-badge" data-severity={severity} aria-hidden className={cn(className)} {...props}>
      {countBadgeText(count, max)}
    </span>
  )
}
