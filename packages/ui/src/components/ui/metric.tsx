// Owned component (not generated): a number with its label and its change, grouped by a 2px ink rule instead of a box.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:513; hero from the Lockdown Health and Warpcore Spend frames; no app PR, no DSA record)
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"

/**
 * What the change says. `neutral` (Figma's only drawn tone) is label ink. `up` and `down` add a
 * caret and take body ink: they say which way, not whether that is good (spend going down is good,
 * checks going down are not), so the words carry the judgement. `live` is the live ink, for a
 * number that is moving now.
 */
export type MetricTone = "neutral" | "up" | "down" | "live"
export type MetricSize = "default" | "hero"

const DELTA_INK: Record<MetricTone, string> = {
  neutral: "text-muted-foreground",
  up: "text-foreground",
  down: "text-foreground",
  live: "text-secondary-live",
}

export type MetricProps = Omit<useRender.ComponentProps<"a">, "children"> & {
  /** What is counted, in mono caps ("Skills"). */
  label: React.ReactNode
  /** The number, as it should read ("145", "1,204", "$41.80"). */
  value: React.ReactNode
  /**
   * The change or the context under the number ("+3 this week", "of $200.00"). In the default
   * size it is mono caps under the value; in the hero it sits beside the number in the meta role,
   * as typed ("of $10.00 today").
   */
  delta?: React.ReactNode
  /** The delta's tone. Default `neutral`. */
  tone?: MetricTone
  /** `default` (Figma 7. Metric: number/metric under a 2px ink rule) or `hero` (number/hero, no rule). */
  size?: MetricSize
  /** Hero only: what the number is out of ("/100"), beside it in code/display and label ink. */
  unit?: React.ReactNode
  /**
   * The number's ink. `default` is body ink (Warpcore's spend). `primary` is primary/display, as the
   * Lockdown Health and Synapse Overview heroes draw it. For the hero only.
   */
  valueTone?: "default" | "primary"
  /** A Badge after the delta ("Near cap"). */
  badge?: React.ReactNode
  /** Under the number: a bar, a button. */
  children?: React.ReactNode
  /** Makes the metric a link to the place it counts (contract 5.1b #38). Or pass `render`. */
  href?: string
}

/**
 * Metric: a label, a number and its change. The 2px ink rule on top groups metrics in a row
 * without boxes (Figma 15:513). `size="hero"` is the one very large number a screen may have
 * (Lockdown Health, Warpcore Spend), with what it is out of beside it. A hero number does not
 * shrink: where it is wider than the screen (Warpcore's "$3.40" on a phone), use the default size.
 *
 * With `href` (or `render`) the whole metric is one link, named by its text in reading order
 * ("Skills 145 +3 this week"), with the hover wash and the focus ring of a control.
 */
function Metric({
  label,
  value,
  delta,
  tone = "neutral",
  size = "default",
  unit,
  valueTone = "default",
  badge,
  children,
  href,
  render,
  className,
  ...props
}: MetricProps) {
  const hero = size === "hero"
  const interactive = Boolean(href || render)
  const caret =
    tone === "up" || tone === "down" ? (
      <Icon name={tone === "up" ? "caret--up" : "caret--down"} size="sm" label={tone === "up" ? "Up" : "Down"} />
    ) : null

  const labelNode = (
    <span data-slot="metric-label" className="type-overline text-muted-foreground">
      {label}
    </span>
  )
  const deltaNode = delta ? (
    <span
      data-slot="metric-delta"
      data-tone={tone}
      className={cn("inline-flex items-center gap-1", hero ? "type-meta" : "type-overline", DELTA_INK[tone])}
    >
      {caret}
      {delta}
    </span>
  ) : null
  // On the delta's baseline: in the hero that is the bottom of the big number, not its middle.
  const badgeNode = badge ? (
    <span data-slot="metric-badge" className="inline-flex shrink-0">
      {badge}
    </span>
  ) : null

  // The spaces between the parts are not drawn (they sit between flex items) but they keep the
  // words apart in the metric's text, which is a link's name: "Skills 145 +3 this week".
  const content = hero ? (
    <>
      {labelNode}{" "}
      {/* Mixed sizes on one line share the baseline (contract §2). */}
      <span data-slot="metric-figure" className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span
          data-slot="metric-value"
          className={cn("type-number-hero", valueTone === "primary" ? "text-primary-display" : "text-foreground")}
        >
          {value}
        </span>{" "}
        {unit ? (
          <span data-slot="metric-unit" className="type-code-display text-muted-foreground">
            {unit}
          </span>
        ) : null}{" "}
        {deltaNode}{" "}
        {badgeNode}
      </span>{" "}
      {/* 16 under the number, as the Warpcore spend frame puts its bar. */}
      {children ? (
        <div data-slot="metric-extra" className="pt-2">
          {children}
        </div>
      ) : null}
    </>
  ) : (
    <>
      {labelNode}{" "}
      <span data-slot="metric-value" className="type-number-metric text-foreground">
        {value}
      </span>{" "}
      {deltaNode || badgeNode ? (
        <span className="flex flex-wrap items-center gap-2">
          {deltaNode}{" "}
          {badgeNode}
        </span>
      ) : null}
      {children}
    </>
  )

  return useRender({
    defaultTagName: href ? "a" : "div",
    render,
    props: mergeProps<"a">(
      {
        href,
        className: cn(
          "group/metric flex min-w-0 flex-col gap-2",
          // The 2px ink rule, drawn inside the box, so the metric is 104 tall as drawn (12 + 16 +
          // 8 + 44 + 8 + 16) and the rule adds nothing.
          !hero && "pt-3 shadow-[inset_0_var(--stroke-emphasis)_0_0_var(--text-body)]",
          interactive && "hover:bg-state-hover active:bg-state-pressed",
          className
        ),
        children: content,
      },
      props
    ),
    state: {
      slot: "metric",
      size,
    },
  })
}

export { Metric }
