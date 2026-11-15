// Owned component (not generated): pull to refresh on the phone's content scroller (the frame's columns), and the mark it shows in the gap.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.1c C9, Lockdown LA6, rules.md 7.2; no Figma node; no app PR, no DSA record)
"use client"

import * as React from "react"

import { readLength } from "../../lib/length"
import { cn } from "../../lib/utils"
import { rubberBand } from "../../lib/motion/rubber-band"
import { useReducedMotion } from "../../lib/motion/use-reduced-motion"
import { Icon } from "../icon"

const THRESHOLD_FALLBACK = 64
const MAX_FALLBACK = 128
const SLOP_FALLBACK = 8
/** How much of the finger's travel the content follows at first (rubberBand's first step). */
const FOLLOW = 0.8

/** Where a pull stands: nothing, a pull short of the line, a pull past it, or the refresh running. */
export type PullState = "idle" | "pulling" | "armed" | "busy"

/**
 * How far the content moves for a finger's travel: it follows, then less and less, and never
 * passes `max` (the same resistance a swiped row has). Zero under reduced motion: the list does
 * not stretch.
 */
export function pullOffsetFor(travel: number, max: number, reduced: boolean): number {
  if (reduced || travel <= 0) return 0
  return Math.round(rubberBand(travel, max, FOLLOW))
}

/**
 * Moves the content by `offset` (through the CSSOM, which a strict style-src allows) and says how
 * far for the mark in the gap; null takes both away.
 */
function paintPull(el: HTMLElement, offset: number | null) {
  if (offset === null) {
    el.style.removeProperty("--app-frame-pull")
    el.style.transform = ""
    return
  }
  el.style.setProperty("--app-frame-pull", `${offset}px`)
  el.style.transform = offset > 0 ? `translateY(${offset}px)` : ""
}

export interface PullToRefreshOptions {
  /** Runs once a pull is let go past the line. A promise keeps the scroller `aria-busy` until it settles. */
  onRefresh?: () => unknown
  /** Off: no pull (a desktop layout, a column that does not show). */
  enabled?: boolean
}

/**
 * Pull to refresh on a scroller (contract 5.1c C9), with pointer events:
 *
 * - It starts only at the top (scrollTop 0) and only when the finger's first move is down and more
 *   down than sideways, past a small slop. Any other move is the browser's: the content scrolls,
 *   a row swipes, and the scroll-minimize state machine never sees a pull, because the scroller
 *   does not move.
 * - At the top the scroller takes `touch-action: pan-x pan-down pinch-zoom`, so a finger moving
 *   down there is ours and not the browser's overscroll, and zoom still works. Anywhere else it is
 *   the browser's as usual.
 * - The content follows the finger with resistance; let go past `--c-app-frame-pull-threshold`
 *   (64) and `onRefresh` runs. Under reduced motion the content does not move; the mark shows and
 *   changes at the line instead.
 * - WebKit keeps a top pull for its own bounce (it has no `pan-down`) and cancels the pointer; there
 *   the bounce itself is read: a bounce past the line runs it, once.
 *
 * It is a gesture, so it is never the only way: every app keeps a plain "Check again" action
 * (decisions §8), and the app's live status shows in the status strip while it runs.
 */
export function usePullToRefresh(scroller: HTMLElement | null, { onRefresh, enabled = true }: PullToRefreshOptions = {}) {
  const reduced = useReducedMotion()
  const [state, setState] = React.useState<PullState>("idle")
  const latest = React.useRef(onRefresh)
  React.useLayoutEffect(() => {
    latest.current = onRefresh
  })
  const busy = React.useRef(false)
  const reducedRef = React.useRef(reduced)
  React.useLayoutEffect(() => {
    reducedRef.current = reduced
  })
  const active = enabled && Boolean(onRefresh) && scroller !== null

  React.useEffect(() => {
    if (!active || !scroller) return
    const el = scroller
    const threshold = readLength(el, "--c-app-frame-pull-threshold", THRESHOLD_FALLBACK)
    const max = readLength(el, "--c-app-frame-pull-max", MAX_FALLBACK)
    const slop = readLength(el, "--c-app-frame-pull-slop", SLOP_FALLBACK)

    let start: { id: number | undefined; x: number; y: number } | null = null
    let pulling = false
    let armed = false
    // WebKit: the pointer was cancelled for the browser's own bounce; read the bounce instead.
    let bounce = false

    const markTop = () => {
      if (el.scrollTop <= 0) el.setAttribute("data-pull-ready", "")
      else el.removeAttribute("data-pull-ready")
      if (bounce && el.scrollTop <= -threshold) {
        bounce = false
        run()
      }
      if (bounce && el.scrollTop >= 0 && start === null) bounce = false
    }

    const show = (offset: number) => paintPull(el, offset)

    const run = () => {
      if (busy.current) return
      busy.current = true
      setState("busy")
      let result: unknown
      try {
        result = latest.current?.()
      } catch {
        result = undefined
      }
      Promise.resolve(result)
        .catch(() => undefined)
        .finally(() => {
          busy.current = false
          setState("idle")
        })
    }

    const reset = () => {
      start = null
      pulling = false
      armed = false
      el.removeAttribute("data-pull")
      el.setAttribute("data-pull-release", "")
      show(0)
    }

    const onDown = (event: PointerEvent) => {
      el.removeAttribute("data-pull-release")
      bounce = false
      if (busy.current || event.button !== 0 || event.isPrimary === false) return
      if (el.scrollTop > 0) return
      start = { id: event.pointerId, x: event.clientX, y: event.clientY }
      pulling = false
      armed = false
    }

    const onMove = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (!pulling) {
        if (Math.abs(dx) < slop && Math.abs(dy) < slop) return
        // Up, sideways, or no longer at the top: not a pull. The browser and the rows have it.
        if (dy <= 0 || Math.abs(dx) >= dy || el.scrollTop > 0) {
          start = null
          return
        }
        pulling = true
        el.setAttribute("data-pull", "pulling")
        setState("pulling")
        try {
          el.setPointerCapture?.(event.pointerId)
        } catch {
          // A synthetic pointer cannot be captured; the move still arrives here.
        }
      }
      event.preventDefault()
      const travel = dy - slop
      const past = travel >= threshold
      if (past !== armed) {
        armed = past
        el.setAttribute("data-pull", past ? "armed" : "pulling")
        setState(past ? "armed" : "pulling")
      }
      show(pullOffsetFor(travel, max, reducedRef.current))
    }

    const onUp = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return
      const ran = pulling && armed
      reset()
      if (ran) run()
      else setState((s) => (s === "busy" ? s : "idle"))
    }

    const onCancel = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return
      // The browser took the touch. At the top that is WebKit's bounce: watch it.
      bounce = el.scrollTop <= 0 && !busy.current
      reset()
      setState((s) => (s === "busy" ? s : "idle"))
    }

    show(0)
    markTop()
    el.addEventListener("scroll", markTop, { passive: true })
    el.addEventListener("pointerdown", onDown)
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerup", onUp)
    el.addEventListener("pointercancel", onCancel)
    return () => {
      el.removeEventListener("scroll", markTop)
      el.removeEventListener("pointerdown", onDown)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerup", onUp)
      el.removeEventListener("pointercancel", onCancel)
      el.removeAttribute("data-pull-ready")
      el.removeAttribute("data-pull")
      el.removeAttribute("data-pull-release")
      paintPull(el, null)
    }
  }, [active, scroller])

  return { state: active ? state : ("idle" as PullState), reduced, active }
}

/**
 * The mark in the gap a pull opens, under the top row: a down arrow short of the line, the renew
 * glyph past it (body ink). Hidden from assistive tech: the gesture is never the only way. Under
 * reduced motion it lays over the top of the content, which does not move.
 */
export function AppFramePullMark({ state, reduced }: { state: PullState; reduced: boolean }) {
  if (state !== "pulling" && state !== "armed") return null
  const armed = state === "armed"
  return (
    <div
      data-slot="app-frame-pull-mark"
      data-state={state}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 flex items-center justify-center overflow-hidden",
        reduced
          ? // Still: over the content's top, one control high, on the ground.
            "top-(--app-frame-top-clear) h-control bg-surface-ground"
          : // In the gap: from the top row's foot, as tall as the pull.
            "top-[calc(var(--app-frame-top-clear)-var(--app-frame-pull))] h-(--app-frame-pull)",
        armed ? "text-text-body" : "text-text-label"
      )}
    >
      <Icon name={armed ? "renew" : "arrow--down"} />
    </div>
  )
}
