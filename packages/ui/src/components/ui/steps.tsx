// Owned component (not generated): a vertical list of the steps of a flow, each with its number, title and state; one folio line on a phone.
// Promoted from: Seeded in snds/unicron (2026-11 design direction; Synapse import and new workspace, Lockdown "Something happened?", no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "../../lib/utils"

export type StepStatus = "done" | "current" | "upcoming" | "failed"

/** The word each state shows when no `statusLabel` is given (Synapse's DONE, NOW, LATER, FAILED). */
export const stepStatusWords: Record<StepStatus, string> = {
  done: "Done",
  current: "Now",
  upcoming: "Later",
  failed: "Failed",
}

/** Two digits, three from 100 (decisions §13). */
function folio(n: number): string {
  return String(n).padStart(2, "0")
}

/**
 * Steps: an ordered list of `Step`s, one per row, each under a hairline. Rows follow the inline
 * List Row (Figma 9:3): 20px above and below, a 40px number column, 24px gaps, the title in the
 * subtitle role. The list numbers itself (01, 02, …) unless a step is given its own `index`.
 */
function Steps({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol data-slot="steps" className={cn("flex min-w-0 flex-col [counter-reset:step]", className)} {...props} />
}

export type StepProps = Omit<React.ComponentProps<"li">, "title" | "onClick"> & {
  /** The step's name ("Deep scan", "Connect a model."). */
  title: React.ReactNode
  /** Default `upcoming`. `current` sets `aria-current="step"`. */
  status?: StepStatus
  /** The state word, if not the default for `status` ("128 / 128 pass", "Waiting on you"). `null` shows none. */
  statusLabel?: React.ReactNode
  /** The step is agent work running now: the state word takes the live ink. */
  live?: boolean
  /** The number shown in the first column. Default the step's place in the list, in two digits. */
  index?: React.ReactNode
  /** Replaces the number: a Checkbox for a step the person ticks off (Lockdown's "Something happened?"). */
  leading?: React.ReactNode
  /** One mono caps line under the title ("Claude Code", "3 files"). */
  detail?: React.ReactNode
  /** A Badge after the title ("Next"). */
  badge?: React.ReactNode
  /** A text action at the end of the row ("Go to devices"). Not with `href` or `onClick`. */
  action?: React.ReactNode
  /** The whole row is a link to the step. */
  href?: string
  /** The whole row is a button ("a press scrolls to the step"). */
  onClick?: React.MouseEventHandler<HTMLElement>
  /** A step not reached yet, which cannot be opened. */
  disabled?: boolean
  /** The row's element, for a router link: passed to `useRender`. */
  render?: useRender.ComponentProps<"div">["render"]
  /** Under the detail line: the step's own content (a sentence, its items). */
  children?: React.ReactNode
}

const STATUS_INK: Record<StepStatus, string> = {
  done: "text-muted-foreground",
  current: "text-foreground",
  upcoming: "text-muted-foreground",
  failed: "text-destructive",
}

/** Step: one row of `Steps`. */
function Step({
  title,
  status = "upcoming",
  statusLabel,
  live = false,
  index,
  leading,
  detail,
  badge,
  action,
  href,
  onClick,
  disabled = false,
  render,
  className,
  children,
  ...props
}: StepProps) {
  const current = status === "current"
  const interactive = Boolean(href || onClick || render)
  const word = statusLabel === undefined ? stepStatusWords[status] : statusLabel

  const row = (
    <>
      <span
        data-slot="step-index"
        aria-hidden={leading ? undefined : "true"}
        className={cn(
          "type-folio w-10 shrink-0",
          current ? "text-foreground" : "text-muted-foreground",
          // The list's own count, unless the step brings a number or a control.
          !leading && index === undefined && "before:content-[counter(step,decimal-leading-zero)]"
        )}
      >
        {leading ?? index}
      </span>{" "}
      <span data-slot="step-body" className="flex min-w-0 grow basis-32 flex-col gap-1">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <span data-slot="step-title" className="type-subtitle text-foreground min-w-0">
            {title}
          </span>{" "}
          {badge ? (
            <span data-slot="step-badge" className="inline-flex shrink-0 self-center">
              {badge}
            </span>
          ) : null}
        </span>{" "}
        {detail ? (
          <span data-slot="step-detail" className="type-overline text-muted-foreground">
            {detail}
          </span>
        ) : null}
        {children ? (
          <span data-slot="step-content" className="type-body text-support-foreground flex min-w-0 flex-col gap-2">
            {children}
          </span>
        ) : null}
      </span>{" "}
      {word || (action && !interactive) ? (
        // The state word and the action stay together; on a narrow row they move under the body,
        // at the right, so the title keeps its width.
        <span data-slot="step-trailing" className="ml-auto flex shrink-0 items-baseline gap-6">
          {word ? (
            <span
              data-slot="step-status"
              data-status={status}
              className={cn("type-overline text-right", live ? "text-secondary-live" : STATUS_INK[status])}
            >
              {word}
            </span>
          ) : null}
          {action && !interactive ? (
            <span data-slot="step-action" className="-my-2 inline-flex">
              {action}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  )

  const rowClasses = cn(
    "flex w-full min-w-0 flex-wrap items-baseline gap-x-6 gap-y-2 px-4 py-5 text-left rule-t",
    interactive &&
      "hover:bg-state-hover active:bg-state-pressed disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
  )
  const element = useRender({
    defaultTagName: href && !disabled ? "a" : interactive ? "button" : "div",
    render,
    props: mergeProps<"button">(
      {
        ...(href && !disabled ? { href } : null),
        ...(interactive && !href && !render ? { type: "button" as const } : null),
        ...(interactive && disabled ? (href ? { "aria-disabled": true } : { disabled: true }) : null),
        onClick: disabled ? undefined : onClick,
        "aria-current": interactive && current ? "step" : undefined,
        className: rowClasses,
        children: row,
      },
      {}
    ),
    state: { slot: "step-row" },
  })

  return (
    <li
      data-slot="step"
      data-status={status}
      aria-current={!interactive && current ? "step" : undefined}
      className={cn("flex min-w-0 [counter-increment:step]", className)}
      {...props}
    >
      {element}
    </li>
  )
}

export type StepsFolioProps = Omit<React.ComponentProps<"p">, "title"> & {
  /** The step showing, counted from 1. */
  current: number
  /** How many steps there are. */
  total: number
  /** The step's name ("Deep scan"). */
  title?: React.ReactNode
  /** The word before the numbers. Default "Step". */
  label?: string
}

/**
 * StepsFolio: the one line a phone shows instead of the list, under the top row:
 * `STEP 02 // 07  Deep scan`. Read as "Step 2 of 7: Deep scan".
 */
function StepsFolio({ current, total, title, label = "Step", className, ...props }: StepsFolioProps) {
  return (
    <p data-slot="steps-folio" className={cn("flex min-w-0 items-baseline gap-3", className)} {...props}>
      {/* On the title's baseline. Its own line box is cut to its glyphs, so the two line heights
          (folio 12/20 beside ui 15/20) cannot stack into a 21px line (as LogRow's time). */}
      <span aria-hidden="true" data-slot="steps-folio-count" className="type-folio text-muted-foreground shrink-0 leading-none!">
        {`${label.toUpperCase()} ${folio(current)} // ${folio(total)}`}
      </span>
      {title ? (
        <span aria-hidden="true" data-slot="steps-folio-title" className="type-ui text-foreground min-w-0 truncate">
          {title}
        </span>
      ) : null}
      <span className="sr-only">
        {`${label} ${current} of ${total}`}
        {title ? ": " : null}
        {title}
      </span>
    </p>
  )
}

export { Steps, Step, StepsFolio }
