// Owned component helper (not generated): the copy-with-timer behavior the security specs share.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
import * as React from "react"

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

/** A media query, live. False where `matchMedia` is missing (jsdom, SSR). */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {}
      const mq = window.matchMedia(query)
      mq.addEventListener?.("change", cb)
      return () => mq.removeEventListener?.("change", cb)
    },
    [query]
  )
  const get = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false
  return React.useSyncExternalStore(subscribe, get, () => false)
}

/** `prefers-reduced-motion: reduce`, live. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)")
}

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
