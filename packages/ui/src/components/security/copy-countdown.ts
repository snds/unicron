// Owned component helper (not generated): the copy-with-timer behavior the security specs share.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
import * as React from "react"

import { useMediaQuery, useReducedMotion } from "../../lib/motion/use-reduced-motion"
import { AppFrameAnnounceContext } from "../ui/app-frame-context"

/** Parse a CSS duration ("5s", "200ms") or bare number of seconds. `undefined` when it is not one. */
export function parseSeconds(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined
  const v = raw.trim()
  if (!v) return undefined
  const m = /^(-?\d*\.?\d+)\s*(ms|s)?$/.exec(v)
  if (!m) return undefined
  const n = Number(m[1])
  if (!Number.isFinite(n)) return undefined
  return m[2] === "ms" ? n / 1000 : n
}

/**
 * Read a tier 3 duration knob (`--c-…`) from the element's computed style, in seconds. Falls back
 * to the spec's default when the stylesheet is absent (tests, a host that forgot the import), so
 * behavior never silently becomes "no timer".
 */
export function readSecondsToken(el: Element | null, name: string, fallback: number): number {
  if (!el || typeof getComputedStyle !== "function") return fallback
  try {
    return parseSeconds(getComputedStyle(el).getPropertyValue(name)) ?? fallback
  } catch {
    return fallback
  }
}

// The media-query hooks live in lib/motion; re-exported here so existing imports keep working.
export { useMediaQuery, useReducedMotion }

/** `prefers-contrast: more` or forced colors (Windows high contrast), live. */
export function useHighContrast(): boolean {
  const more = useMediaQuery("(prefers-contrast: more)")
  const forced = useMediaQuery("(forced-colors: active)")
  return more || forced
}

export type CopyCountdownState = "idle" | "counting" | "cleared"

export interface CopyCountdown {
  /** `idle` → `counting` (seconds left ticking) → `cleared` for two seconds → `idle`. */
  state: CopyCountdownState
  /** Whole seconds left while counting; 0 otherwise. */
  secondsLeft: number
  /** Start (or restart) the countdown. */
  start: () => void
  /** Stop without clearing (the host navigated away). */
  cancel: () => void
}

/**
 * The shared clipboard countdown: a copy starts `seconds` of counting; at zero `onExpire` runs
 * once (the host clears the clipboard, conditionally where it can) and the control reads "Cleared"
 * for two seconds. One interval per hook, torn down on unmount.
 */
export function useCopyCountdown(seconds: number, onExpire?: () => void): CopyCountdown {
  const [state, setState] = React.useState<CopyCountdownState>("idle")
  const [secondsLeft, setSecondsLeft] = React.useState(0)
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const clearedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const onExpireRef = React.useRef(onExpire)
  React.useEffect(() => {
    onExpireRef.current = onExpire
  })

  const stop = React.useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    if (clearedTimer.current) clearTimeout(clearedTimer.current)
    timer.current = null
    clearedTimer.current = null
  }, [])

  const start = React.useCallback(() => {
    stop()
    const total = Math.max(1, Math.round(seconds))
    setState("counting")
    setSecondsLeft(total)
    let left = total
    timer.current = setInterval(() => {
      left -= 1
      if (left > 0) {
        setSecondsLeft(left)
        return
      }
      if (timer.current) clearInterval(timer.current)
      timer.current = null
      setSecondsLeft(0)
      setState("cleared")
      onExpireRef.current?.()
      clearedTimer.current = setTimeout(() => setState("idle"), 2000)
    }, 1000)
  }, [seconds, stop])

  const cancel = React.useCallback(() => {
    stop()
    setState("idle")
    setSecondsLeft(0)
  }, [stop])

  React.useEffect(() => stop, [stop])

  return { state, secondsLeft, start, cancel }
}

/**
 * Where a copied secret's countdown is said (Unicron 33): inside an AppFrame, the frame's one
 * polite region, so the copy's "Copied. Clipboard clears in 30 seconds." and "Clipboard cleared."
 * never talk over a status line or a strip. Returns a function that says a sentence there, read
 * when it is called (stable across renders), and false as its second value outside a frame, where
 * the part keeps its own region.
 */
export function useCopyAnnouncer(fallback: (message: string) => void): [(message: string) => void, boolean] {
  const frame = React.useContext(AppFrameAnnounceContext)
  const latest = React.useRef({ frame, fallback })
  React.useEffect(() => {
    latest.current = { frame, fallback }
  })
  const say = React.useCallback((message: string) => {
    const { frame: announce, fallback: own } = latest.current
    if (announce) announce(message)
    else own(message)
  }, [])
  return [say, frame !== null]
}
