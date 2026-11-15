// The playground's state lives in the address, so any view in any theme is a link:
//   ?view=<name>     which view (a file in ./views)
//   ?theme=<app>     warpcore | vale | lockdown | synapse   → <html data-theme="…">
//   ?ground=<name>   graphite | stone                        → <html class="dark"> or "light"
//   ?chrome=0        hide the playground's own bar: the view gets the whole page (screenshots,
//                    and views that are a full app frame)
// A parameter that is absent means "the default": no data-theme (the tokens' own default), and
// the ground the system asks for.
import { useMemo, useSyncExternalStore } from "react"

export const APP_THEMES = ["warpcore", "vale", "lockdown", "synapse"] as const
export type AppTheme = (typeof APP_THEMES)[number]

export const GROUNDS = ["graphite", "stone"] as const
export type Ground = (typeof GROUNDS)[number]

/** What the tokens show with no data-theme (unicron-contract → Theme model). */
export const DEFAULT_APP_THEME: AppTheme = "warpcore"

export interface Address {
  view: string | null
  theme: AppTheme | null
  ground: Ground | null
  chrome: boolean
}

const CHANGE = "playground:address"

function oneOf<T extends string>(list: readonly T[], value: string | null): T | null {
  return list.includes(value as T) ? (value as T) : null
}

function parse(search: string): Address {
  const params = new URLSearchParams(search)
  return {
    view: params.get("view") || null,
    theme: oneOf(APP_THEMES, params.get("theme")),
    ground: oneOf(GROUNDS, params.get("ground")),
    chrome: params.get("chrome") !== "0",
  }
}

function subscribe(notify: () => void) {
  window.addEventListener("popstate", notify)
  window.addEventListener(CHANGE, notify)
  return () => {
    window.removeEventListener("popstate", notify)
    window.removeEventListener(CHANGE, notify)
  }
}

export function useAddress(): Address {
  const search = useSyncExternalStore(subscribe, () => window.location.search)
  return useMemo(() => parse(search), [search])
}

/**
 * Write parameters to the address without a page load. A new view is a history entry, so Back
 * returns to the last one; a theme or ground change replaces the entry it is on.
 */
export function setAddress(patch: Partial<Pick<Address, "view" | "theme" | "ground">>) {
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(patch)) {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  if (url.href === window.location.href) return
  if ("view" in patch) window.history.pushState(null, "", url)
  else window.history.replaceState(null, "", url)
  window.dispatchEvent(new Event(CHANGE))
}
