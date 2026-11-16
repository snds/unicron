// Owned source (not generated).
// Promoted from: Seeded in snds/unicron (motion layer, slice 9; no app PR, no DSA record)
"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

type RollingNumberProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The number to show. */
  value: number
  /** How to write it (`Intl.NumberFormat`): a currency, a percent, grouping. */
  format?: Intl.NumberFormatOptions
  /** The locale to write it in. Default: the page's. */
  locales?: Intl.LocalesArgument
}

interface Shown {
  text: string
  /** What was shown before the latest change. */
  before: string
  /** Up when the value grew, down when it shrank. */
  direction: "up" | "down"
  /** Counts the changes, so a cell that changes twice in a row animates twice. */
  change: number
  value: number
}

/**
 * RollingNumber: a number whose changed characters roll to their new value: the old one leaves
 * as the new one arrives, upward when the value grows and downward when it shrinks, on
 * --motion-state and the move curve (`motion-roll`). Characters that did not change hold still,
 * and figures are tabular, so nothing beside them moves. Under reduced motion the new value is
 * there at once.
 *
 * The rolling characters are hidden from assistive tech; the whole value is read once, as text.
 * It does not announce changes: put it in a live region if a change must be heard.
 */
function RollingNumber({ value, format, locales, className, ...props }: RollingNumberProps) {
  const text = new Intl.NumberFormat(locales, format).format(value)
  const [shown, setShown] = React.useState<Shown>({ text, before: text, direction: "up", change: 0, value })
  if (shown.text !== text) {
    setShown({ text, before: shown.text, direction: value < shown.value ? "down" : "up", change: shown.change + 1, value })
  }
  const { before, direction, change } = shown
  // Characters line up from the right (the ones place), whatever the lengths.
  const length = Math.max(text.length, before.length)
  const cells = Array.from({ length }, (_, i) => {
    const now = text[text.length - length + i] ?? ""
    const was = before[before.length - length + i] ?? ""
    return { now, was, changed: change > 0 && now !== was }
  })
  return (
    <span data-slot="rolling-number" data-direction={direction} className={cn("inline-flex tabular-nums", className)} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {cells.map(({ now, was, changed }, i) =>
          now || changed ? (
            <span key={`${length - i}`} data-slot="rolling-number-cell" className="relative inline-block overflow-hidden">
              <span key={changed ? change : 0} className={cn("inline-block whitespace-pre", changed && "motion-roll-in")}>
                {now}
              </span>
              {changed && was ? (
                <span key={`out-${change}`} className="motion-roll-out absolute inset-0 whitespace-pre">
                  {was}
                </span>
              ) : null}
            </span>
          ) : null
        )}
      </span>
    </span>
  )
}

export { RollingNumber, type RollingNumberProps }
