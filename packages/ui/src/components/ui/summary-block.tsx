// Owned component (not generated): the one mark for "a model wrote this" in every app: a 2px live edge, a live overline, and the lines.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 53:2448 (Vale desktop inbox, stone; drawn by hand on the app page); contract 5.1a and 5.1b #48; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { StatusOrb } from "./status-orb"

/** `ready`: the lines are in. `loading`: the model is writing them. `error`: it could not. */
export type SummaryBlockState = "ready" | "loading" | "error"

/** The words SummaryBlock says when the host gives none. */
export const summaryBlockCopy = {
  /** The orb's name while the model writes. */
  loading: "Writing",
}

export interface SummaryBlockProps extends Omit<React.ComponentProps<"section">, "title"> {
  /**
   * The mono caps line in the live colour that names the block and counts it
   * ("Summary // 03 points", "Replies // 03"). Type it in sentence case. It also names the region.
   */
  overline: React.ReactNode
  /** The points, one per line, in the body role. Drawn as a list without markers. */
  lines?: readonly React.ReactNode[]
  /** Anything else the block holds, after the lines: suggested replies as button rows, a paragraph. */
  children?: React.ReactNode
  /** A mono line under the body: where it came from ("Newest 12 of 30 messages // qwen3"). */
  footer?: React.ReactNode
  /** One sentence under that, in caption: "It can be wrong. Check what matters." */
  caption?: React.ReactNode
  /** Text actions in a row at the foot (Copy, close, Try again). */
  actions?: React.ReactNode
  /** Default `ready`. */
  state?: SummaryBlockState
  /** With `state="error"`: one line in critical ink, saying what went wrong. */
  error?: React.ReactNode
  /** How many lines to hold while loading. Default 3. */
  loadingLines?: number
}

/**
 * What a model wrote, marked as such: a 2px `secondary-live` edge on the left, 16px clear of the
 * text; a mono caps overline in `secondary-live`; then the lines in the body role, 4px apart (Figma,
 * Vale desktop inbox). This is the one "model output" mark for every app. Use it for a summary, a
 * set of suggested replies, an answer that sits inside a page; a chat reply is a ChatMessage.
 *
 * While `loading`, a thinking StatusOrb sits before the overline (the agent's own motion) and live
 * bars hold the lines' places; the region is busy. On `error`, one line in critical ink and the
 * actions. The edge stays live in every state: the block is still the model's.
 */
export function SummaryBlock({
  overline,
  lines,
  children,
  footer,
  caption,
  actions,
  state = "ready",
  error,
  loadingLines = 3,
  className,
  ...props
}: SummaryBlockProps) {
  const overlineId = React.useId()
  const loading = state === "loading"
  return (
    <section
      data-slot="summary-block"
      data-state={state}
      aria-labelledby={overlineId}
      aria-busy={loading || undefined}
      className={cn("flex min-w-0 gap-4", className)}
      {...props}
    >
      <span aria-hidden data-slot="summary-block-edge" className="bg-secondary-live w-(--stroke-emphasis) shrink-0 self-stretch" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 pb-2">
        <p id={overlineId} data-slot="summary-block-overline" className="type-overline text-secondary-live flex items-center gap-2">
          {loading ? <StatusOrb state="thinking" size="xs" tooltip={false} label={summaryBlockCopy.loading} /> : null}
          <span className="min-w-0">{overline}</span>
        </p>
        {loading ? (
          <div data-slot="summary-block-loading" className="flex flex-col gap-1">
            {Array.from({ length: loadingLines }, (_, i) => (
              // A line box of the body role (24) holding a 12px bar in the live wash. Lengths step
              // down, so the bars read as lines of text, not as a table.
              <span key={i} aria-hidden className="flex h-6 items-center">
                <span className={cn("bg-running-surface block h-3", i % 3 === 0 ? "w-11/12" : i % 3 === 1 ? "w-3/4" : "w-2/3")} />
              </span>
            ))}
          </div>
        ) : null}
        {!loading && lines?.length ? (
          <ul data-slot="summary-block-lines" className="flex flex-col gap-1">
            {lines.map((line, i) => (
              <li key={i} className="type-body text-text-body">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
        {!loading && children ? <div data-slot="summary-block-body" className="type-body text-text-body min-w-0">{children}</div> : null}
        {state === "error" && error ? (
          // Said once, as it arrives.
          <p role="alert" data-slot="summary-block-error" className="type-body text-critical-text">
            {error}
          </p>
        ) : null}
        {footer ? <p data-slot="summary-block-footer" className="type-overline text-text-label pt-1">{footer}</p> : null}
        {caption ? <p data-slot="summary-block-caption" className="type-caption text-text-secondary">{caption}</p> : null}
        {actions ? (
          <div data-slot="summary-block-actions" className="flex flex-wrap items-center gap-2 pt-2">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  )
}
