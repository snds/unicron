// Owned component (not generated): the page's heading block (overline, large title, count or side meta) and its collapsed form, a small centred title.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, drawn on every app list screen, no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { formatNavCount } from "./rail"

/**
 * The title's size, from the frames:
 * `lg`: display (72/68), a desktop list or detail head (Warpcore Tasks, Lockdown's Steam).
 * `md`: display/compact (48/48), every phone list and Vale's desktop lists. The default.
 * `sm`: title (32/36), a two-word phone title, a conversation or a detail head beside a pane.
 */
export type PageHeadSize = "lg" | "md" | "sm"

/** Which way a sideways swipe on the switcher went. */
export type PageHeadSwipe = "previous" | "next"

export type PageHeadSwitcher = Omit<ButtonPrimitive.Props, "children" | "className"> & {
  /** What pressing the head does ("Switch workspace"). Joined to the title in the button's name. */
  label: string
  /**
   * A sideways swipe across the head (starting 24px clear of the screen's left edge, for the
   * system's back gesture) steps to the previous or next account. The arrow keys do the same
   * while the head has focus.
   */
  onSwipe?: (direction: PageHeadSwipe) => void
}

export type PageHeadProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** The page's name. The head is the page's `h1`. */
  title: string
  /** The mono caps line above, with `//` between its parts ("Inbox // 012 unread"). */
  overline?: React.ReactNode
  size?: PageHeadSize
  /**
   * How many, beside the title on its baseline. A number is written as cross-app decisions §13
   * writes counts (`07`, `248`, `1,204`); a string is shown as given (`/012`). Folio ink and role;
   * at `lg` the code/display role, as Warpcore's desktop head draws it.
   */
  count?: number | string
  /** A fact beside the title on its baseline, in the folio role ("THU 11.12", a site's address). */
  meta?: React.ReactNode
  /** Makes `meta` a button (go to today, open the site). */
  onMetaClick?: () => void
  /** The meta button's name, when its text is not enough ("Go to today"). */
  metaLabel?: string
  /** A status Badge after the title ("Read-only", "Active"). */
  status?: React.ReactNode
  /** Controls at the end of the head: range chips, a text button, up to two icon buttons. They wrap under the title when the line is too short. */
  actions?: React.ReactNode
  /** The whole head is one button that switches account, vault or workspace; a chevron follows the overline. */
  switcher?: PageHeadSwitcher
  /** The scrolled form: one small centred title (subtitle role) in a 48px line. The frame drives it. */
  collapsed?: boolean
}

const TITLE: Record<PageHeadSize, string> = {
  lg: "type-display",
  md: "type-display-compact",
  sm: "type-title",
}

const SWIPE_FALLBACK = 48
const EDGE_FALLBACK = 24

/** A size token read off the element, in px, or the fallback without the stylesheet. */
function readLength(el: Element, name: string, fallback: number): number {
  if (typeof getComputedStyle !== "function") return fallback
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const match = /^([\d.]+)(px|rem)$/.exec(raw)
  if (!match) return fallback
  const n = Number.parseFloat(match[1])
  return match[2] === "px" ? n : n * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
}

/** The switcher's swipe and its keys, as button handlers. */
function useSwitcherGestures(onSwipe: ((direction: PageHeadSwipe) => void) | undefined) {
  const start = React.useRef<{ id: number; x: number; y: number } | null>(null)
  const swallowClick = React.useRef(false)
  if (!onSwipe) return {}
  return {
    onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
      if (event.button !== 0) return
      const edge = readLength(event.currentTarget, "--c-page-head-swipe-edge", EDGE_FALLBACK)
      // Too near the left edge: that swipe is the system's way back.
      start.current = event.clientX < edge ? null : { id: event.pointerId, x: event.clientX, y: event.clientY }
    },
    onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
      const from = start.current
      start.current = null
      if (!from || from.id !== event.pointerId) return
      const dx = event.clientX - from.x
      const dy = event.clientY - from.y
      const threshold = readLength(event.currentTarget, "--c-page-head-swipe-threshold", SWIPE_FALLBACK)
      if (Math.abs(dx) <= threshold || Math.abs(dx) <= 2 * Math.abs(dy)) return
      // Content follows the finger: a swipe to the left brings the next one in.
      onSwipe(dx < 0 ? "next" : "previous")
      swallowClick.current = true
      setTimeout(() => {
        swallowClick.current = false
      }, 0)
    },
    onPointerCancel() {
      start.current = null
    },
    onClick(event: React.MouseEvent<HTMLButtonElement> & { preventBaseUIHandler?: () => void }) {
      if (!swallowClick.current) return
      swallowClick.current = false
      event.preventDefault()
      event.preventBaseUIHandler?.()
    },
    onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
      event.preventDefault()
      onSwipe(event.key === "ArrowRight" ? "next" : "previous")
    },
  }
}

/**
 * PageHead: the top of a list or a detail page, as every app draws it. The overline, 4px above the
 * title; the title in the size's role; then, on the title's baseline, a count or a side meta in
 * folio ink, and a status Badge. `actions` sit at the end of the head.
 *
 * `collapsed` is the scrolled form: the large head gives way to a small centred title in the
 * subtitle role, 48 high, to sit in the top row between the lockup and its buttons. It arrives
 * on the existing `motion-pop` recipe, and only fades under reduced motion.
 *
 * With `switcher`, the whole head is the button (cross-app decisions §7), and so is the small title.
 */
function PageHead({
  title,
  overline,
  size = "md",
  count,
  meta,
  onMetaClick,
  metaLabel,
  status,
  actions,
  switcher,
  collapsed = false,
  className,
  ...props
}: PageHeadProps) {
  const { label: switcherLabel, onSwipe, ...switcherProps } = switcher ?? { label: "" }
  const gestures = useSwitcherGestures(switcher ? onSwipe : undefined)
  const switcherButtonProps = switcher
    ? mergeProps<"button">(switcherProps as React.ComponentProps<"button">, gestures, {
        "aria-label": `${title}, ${switcherLabel}`,
        "aria-keyshortcuts": onSwipe ? "ArrowLeft ArrowRight" : undefined,
      } as React.ComponentProps<"button">)
    : undefined

  const chevron = (
    <span data-slot="page-head-chevron" aria-hidden="true" className="inline-flex text-text-label">
      <Icon name="chevron--down" size="sm" />
    </span>
  )

  if (collapsed) {
    return (
      <div
        data-slot="page-head"
        data-size={size}
        data-collapsed=""
        className={cn("flex h-control min-w-0 items-center justify-center", className)}
        {...props}
      >
        <h1 data-slot="page-head-title" className="motion-pop flex min-w-0 justify-center">
          {switcherButtonProps ? (
            <ButtonPrimitive
              data-slot="page-head-switcher"
              {...(switcherButtonProps as ButtonPrimitive.Props)}
              className="hit-area flex min-w-0 items-center gap-1 rounded-sm px-2 py-1 text-text-body transition-[background-color] duration-(--motion-fast) ease-(--motion-ease) hover:bg-state-hover active:bg-state-pressed"
            >
              <span className="type-subtitle truncate">{title}</span>
              {chevron}
            </ButtonPrimitive>
          ) : (
            <span className="type-subtitle truncate text-center text-text-body">{title}</span>
          )}
        </h1>
      </div>
    )
  }

  const countText = typeof count === "number" ? formatNavCount(count) : count
  const sideInk = "text-text-label"
  // Above the switcher's stretched button, so they keep their own presses.
  const above = switcher ? "relative z-10" : undefined

  return (
    <div
      data-slot="page-head"
      data-size={size}
      className={cn("flex min-w-0 flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}
      {...props}
    >
      <div data-slot="page-head-main" className="relative flex min-w-0 grow flex-col gap-1">
        {overline || switcher ? (
          <p data-slot="page-head-overline" className="flex min-w-0 items-center gap-1">
            {overline ? <span className="type-overline min-w-0 truncate text-text-label">{overline}</span> : null}
            {switcher && overline ? chevron : null}
          </p>
        ) : null}
        <div className={cn("flex min-w-0 flex-wrap items-baseline gap-y-1", size === "lg" ? "gap-x-4" : "gap-x-3")}>
          <h1 data-slot="page-head-title" className={cn(TITLE[size], "min-w-0 text-text-body")}>
            {title}
          </h1>
          {switcher && !overline ? chevron : null}
          {countText !== undefined && countText !== "" ? (
            <span data-slot="page-head-count" className={cn(size === "lg" ? "type-code-display" : "type-folio", sideInk)}>
              {countText}
            </span>
          ) : null}
          {meta ? (
            onMetaClick ? (
              <ButtonPrimitive
                data-slot="page-head-meta"
                aria-label={metaLabel}
                onClick={onMetaClick}
                className={cn(
                  "type-folio hit-area rounded-sm underline-offset-4 transition-[color] duration-(--motion-fast) ease-(--motion-ease) hover:text-text-body hover:underline",
                  sideInk,
                  above
                )}
              >
                {meta}
              </ButtonPrimitive>
            ) : (
              <span data-slot="page-head-meta" className={cn("type-folio", sideInk)}>
                {meta}
              </span>
            )
          ) : null}
          {status ? (
            <span data-slot="page-head-status" className={cn("inline-flex", above)}>
              {status}
            </span>
          ) : null}
        </div>
        {switcherButtonProps ? (
          // The whole head is the button: stretched over it, under the parts that are their own buttons.
          <ButtonPrimitive
            data-slot="page-head-switcher"
            {...(switcherButtonProps as ButtonPrimitive.Props)}
            className="absolute -inset-1 rounded-sm transition-[background-color] duration-(--motion-fast) ease-(--motion-ease) hover:bg-state-hover active:bg-state-pressed"
          />
        ) : null}
      </div>
      {actions ? (
        <div data-slot="page-head-actions" className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export { PageHead }
