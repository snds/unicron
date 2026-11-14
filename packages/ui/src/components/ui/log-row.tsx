// Owned component (not generated): one line of an activity log: a mono time, then what happened.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, the activity lines on the Warpcore and Synapse frames; no app PR, no DSA record)
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "../../lib/utils"

export type LogRowProps = Omit<useRender.ComponentProps<"div">, "children"> & {
  /** When it happened, as the app writes it ("14:20"). Set in the meta role, mono, label ink. */
  time: React.ReactNode
  /** A machine-readable time (`2026-11-12T14:20`): the time is then a `<time>` element. */
  dateTime?: string
  /** What happened, one sentence ("Read harness/visual-qa/config.ts"). Wraps; never cut. */
  children: React.ReactNode
  /** The line opens what it is about: the row is a link (contract 5.1b #38). */
  href?: string
  /** The row is a link that `render` draws (a router link): it takes the link's washes. Implied by `href`. */
  link?: boolean
}

// The time sits on the words' baseline. Its own line box is cut to its glyphs, so the two line
// heights (meta 12/20 under ui 15/20) cannot stack into a 21px line and take the row off the grid.
const TIME = "shrink-0 type-meta leading-none! text-muted-foreground"

/**
 * LogRow: one line of an activity log ("Activity 06" on a running task, Synapse's "Activity //
 * today"). A mono time in the meta role, 16 before the words in the ui role; 40 tall on the 4px
 * grid, growing by a line (20) when the words wrap. Put the rows in a list (`render={<li />}` in an
 * `<ol>`). With `href` (or a link as `render`) the whole line is the link, with the washes and the
 * focus ring of any control.
 */
function LogRow({ time, dateTime, href, link = false, children, render, className, ...props }: LogRowProps) {
  const linked = Boolean(href) || link
  const content = (
    <>
      {dateTime ? (
        <time data-slot="log-row-time" dateTime={dateTime} className={TIME}>
          {time}
        </time>
      ) : (
        <span data-slot="log-row-time" className={TIME}>
          {time}
        </span>
      )}
      {/* A space for the name of a linked line ("14:20 Opened …"); the gap draws it. */}{" "}
      <span data-slot="log-row-text" className="min-w-0 flex-1 type-ui text-foreground">
        {children}
      </span>
    </>
  )
  return useRender({
    defaultTagName: linked ? "a" : "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(
          // 10 + 20 + 10 = 40. The time and the words share a baseline.
          "flex min-h-10 min-w-0 items-baseline gap-4 py-2.5",
          linked &&
            "-mx-2 rounded-lg px-2 hover:bg-state-hover active:bg-state-pressed [&[href]_[data-slot=log-row-text]]:underline-offset-4 [&[href]:hover_[data-slot=log-row-text]]:underline",
          className
        ),
        children: content,
      },
      (href ? { href, ...props } : props) as React.ComponentProps<"div">
    ),
    state: { slot: "log-row", linked: linked || undefined },
  })
}

export { LogRow }
