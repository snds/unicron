// Owned component (not generated): the page's heading block (overline, large title, count or side meta) and its collapsed form, a small centred title.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, drawn on every app list screen, no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"

import { readLength } from "../../lib/length"
import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { formatNavCount } from "./rail"

/**
 * The title's size, from the frames:
 * `lg`: display (72/68), a desktop list or detail head (Warpcore Tasks, Lockdown's Steam). Its
 *   overline and meta line sit directly on the title's line box, with no gap, as drawn.
 * `md`: display/compact (48/48), every phone list and Vale's desktop lists. The default.
 * `sm`: title (32/36), a two-word phone title or a detail head beside a pane.
 * `xs`: lead (24/32), a conversation's head, as Warpcore's chat workspace draws it (cw-01:
 *   "OPAQUE login" 24px medium, 4 under its overline).
 */
export type PageHeadSize = "lg" | "md" | "sm" | "xs"

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
  /**
   * Where `meta` sits: on the title's baseline (default; the phone frames, Vale's desktop list), or
   * on its own line under the title (Lockdown's desktop detail: the site and the date added).
   */
  metaPosition?: "baseline" | "below"
  /** Makes `meta` a button (go to today, open the site). */
  onMetaClick?: () => void
  /**
   * What pressing the meta button does, when its text does not say ("Go to today"). It is read as
   * the button's description; the button's name stays the text it shows ("THU 11.12").
   */
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
  xs: "type-lead",
}

const SWIPE_FALLBACK = 48
const EDGE_FALLBACK = 24

/** The switcher's swipe and its keys, as button handlers. */
function useSwitcherGestures(onSwipe: ((direction: PageHeadSwipe) => void) | undefined) {
  const latest = React.useRef(onSwipe)
  const stop = React.useRef<(() => void) | undefined>(undefined)
  const swallowClick = React.useRef(false)
  React.useEffect(() => {
    latest.current = onSwipe
  })
  React.useEffect(() => () => stop.current?.(), [])
  if (!onSwipe) return {}
  return {
    onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
      stop.current?.()
      if (event.button !== 0) return
      const el = event.currentTarget
      // Too near the left edge: that swipe is the system's way back.
      if (event.clientX < readLength(el, "--c-page-head-swipe-edge", EDGE_FALLBACK)) return
      const { pointerId: id, clientX: x, clientY: y } = event
      const doc = el.ownerDocument
      // The lift is watched on the page: a swipe often ends past the head.
      const up = (e: PointerEvent) => {
        if (e.pointerId !== id) return
        stop.current?.()
        const dx = e.clientX - x
        const dy = e.clientY - y
        const threshold = readLength(el, "--c-page-head-swipe-threshold", SWIPE_FALLBACK)
        if (Math.abs(dx) <= threshold || Math.abs(dx) <= 2 * Math.abs(dy)) return
        // Content follows the finger: a swipe to the left brings the next one in.
        latest.current?.(dx < 0 ? "next" : "previous")
        swallowClick.current = true
        setTimeout(() => {
          swallowClick.current = false
        }, 0)
      }
      const cancel = (e: PointerEvent) => {
        if (e.pointerId === id) stop.current?.()
      }
      doc.addEventListener("pointerup", up, true)
      doc.addEventListener("pointercancel", cancel, true)
      stop.current = () => {
        doc.removeEventListener("pointerup", up, true)
        doc.removeEventListener("pointercancel", cancel, true)
        stop.current = undefined
      }
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
      latest.current?.(event.key === "ArrowRight" ? "next" : "previous")
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
  metaPosition = "baseline",
  onMetaClick,
  metaLabel,
  status,
  actions,
  switcher,
  collapsed = false,
  className,
  ...props
}: PageHeadProps) {
  const metaHintId = React.useId()
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
  const metaNode = !meta ? null : onMetaClick ? (
    <ButtonPrimitive
      data-slot="page-head-meta"
      // Its name is the text it shows (WCAG 2.5.3: a screen reader hears the date, voice control
      // can say it); what the press does is its description.
      aria-describedby={metaLabel ? metaHintId : undefined}
      onClick={onMetaClick}
      className={cn(
        "type-folio hit-area w-fit rounded-sm underline-offset-4 transition-[color] duration-(--motion-fast) ease-(--motion-ease) hover:text-text-body hover:underline",
        sideInk,
        above
      )}
    >
      {meta}
      {metaLabel ? (
        <span id={metaHintId} hidden>
          {metaLabel}
        </span>
      ) : null}
    </ButtonPrimitive>
  ) : (
    <span data-slot="page-head-meta" className={cn("type-folio", sideInk)}>
      {meta}
    </span>
  )

  return (
    <div
      data-slot="page-head"
      data-size={size}
      className={cn("flex min-w-0 flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}
      {...props}
    >
      {/* 4 between the overline, the title and a meta line under it, as the phone frames draw a
          head. At `lg` nothing: the desktop frames set the overline and the meta line directly on
          the display title's own line box (Lockdown Desktop / 01: overline at y 96, the title's
          68px line from 112, the meta line from 180). */}
      <div data-slot="page-head-main" className={cn("relative flex min-w-0 grow flex-col", size === "lg" ? "gap-0" : "gap-1")}>
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
          {metaPosition === "baseline" ? metaNode : null}
          {status ? (
            <span data-slot="page-head-status" className={cn("inline-flex", above)}>
              {status}
            </span>
          ) : null}
        </div>
        {metaPosition === "below" ? metaNode : null}
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
