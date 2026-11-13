// Owned helper (not generated): the media-query hooks motion and the security components share.
import * as React from "react"

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
