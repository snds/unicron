// Promoted from: hand-raised from the Mercury review (none)
// Promoted from: Seeded in snds/unicron (2026-11 design direction: square marks, unread in ink, attention in the yellow with an ink outline, counts as decisions §13 writes them; contract 5.1; no app PR, no DSA record)
import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * Where the person is wanted, on a nav item, a row, or a control (Button, IconButton,
 * ToggleGroupItem). `attention`: something waits on them (a
 * question, an approval). `unread`: something new. Count only what the person can reach from here.
 */
export interface Indicator {
  kind: "attention" | "unread"
  count?: number
}

/** One indicator, or both kinds. Attention wins what's drawn; both are said. */
export type IndicatorProp = Indicator | readonly Indicator[]

/** The words a screen reader hears. Hosts pass only the kind and the count. */
export const indicatorCopy = {
  attention: (count?: number) => (count ? `${count} waiting for you` : "Waiting for you"),
  unread: (count?: number) => (count ? `${count} unread` : "Unread"),
}

/** Normalised, attention first; empty when nothing is wanted (a count of 0 is nothing). */
export function indicatorsOf(indicator: IndicatorProp | undefined): Indicator[] {
  if (!indicator) return []
  const list = (Array.isArray(indicator) ? indicator : [indicator]) as Indicator[]
  return list
    .filter((i) => i.count === undefined || i.count > 0)
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "attention" ? -1 : 1))
}

/** "Conversations, 2 waiting for you, 5 unread": what's said, attention first. */
export function indicatorLabel(indicator: IndicatorProp | undefined): string {
  return indicatorsOf(indicator)
    .map((i) => indicatorCopy[i.kind](i.count))
    .join(", ")
}

/**
 * A count as the four apps write it on a mark (cross-app decisions §13): two digits ("07", "14"),
 * capped at "99+".
 */
export function indicatorCount(count: number): string {
  return count > 99 ? "99+" : String(Math.max(0, Math.floor(count))).padStart(2, "0")
}

/**
 * What a control needs to carry an indicator: the mark in its top-right corner, and the words in its
 * name ("Tasks, 2 waiting for you"). With an `aria-label` the words join it; without one they ride
 * in an sr-only span after the control's own text. Null when nothing is wanted.
 */
export function indicatorOnControl(indicator: IndicatorProp | undefined, ariaLabel?: string) {
  const said = indicatorLabel(indicator)
  if (!said) return null
  return {
    mark: <IndicatorMark indicator={indicator} data-placement="corner" className="absolute top-1 right-1" />,
    label: ariaLabel ? `${ariaLabel}, ${said}` : undefined,
    words: ariaLabel ? null : <span className="sr-only">{`, ${said}`}</span>,
  }
}

/**
 * The mark itself, drawn from @unicron/ui's styles by `data-kind` and `data-shape`. `dot` is a
 * square at the top right of what it marks: unread is a 6px ink square (Figma's Unread mark),
 * attention the yellow square with a 1px outline in the yellow's ink, so it reads on stone where
 * the yellow has no lightness contrast. `badge` is the count on the same two fills, square, in
 * mono (a dot when there's no count). Its words are said by the host (`indicatorLabel`), so the
 * mark is hidden from screen readers.
 */
export function IndicatorMark({
  indicator,
  shape = "dot",
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & { indicator: IndicatorProp | undefined; shape?: "dot" | "badge" }) {
  const [top] = indicatorsOf(indicator)
  if (!top) return null
  const badge = shape === "badge" && top.count !== undefined
  return (
    <span
      data-slot="indicator"
      data-kind={top.kind}
      data-shape={badge ? "badge" : "dot"}
      aria-hidden
      className={cn(
        // The outline in the yellow's ink: a ring outside a dot (it keeps its 6px), an inset ring
        // inside a badge (it keeps its size). Over the stylesheet's own edge, which is the yellow.
        top.kind === "attention" && (badge ? "inset-ring inset-ring-(--c-indicator-attention-edge)" : "ring-(length:--stroke-rule) ring-(--c-indicator-attention-edge)"),
        badge && "[font-family:var(--type-overline-family)]",
        className
      )}
      {...props}
    >
      {badge ? indicatorCount(top.count!) : null}
    </span>
  )
}
