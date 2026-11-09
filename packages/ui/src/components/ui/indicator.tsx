// Promoted from: hand-raised from the Mercury review (none)
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

/** "9+" past nine: the badge stays one size. */
export function indicatorCount(count: number): string {
  return count > 9 ? "9+" : String(count)
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
 * The mark itself, drawn from @unicron/ui's styles by `data-kind` and `data-shape`. `dot` is a dot
 * at the top right of what it marks; `badge` is the count in a pill (a dot when there's no count).
 * Its words are said by the host (`indicatorLabel`), so the mark is hidden from screen readers.
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
      className={cn(className)}
      {...props}
    >
      {badge ? indicatorCount(top.count!) : null}
    </span>
  )
}
