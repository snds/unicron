// The playground's state lives in the address, so any view in any theme is a link:
//   ?view=<name>     which view (a file in ./views)
//   ?theme=<app>     warpcore | vale | lockdown | synapse | fontface   → <html data-theme="…">
//   ?ground=<name>   graphite | stone                        → <html class="dark"> or "light"
//   ?split=1         both grounds side by side: the view twice, graphite on the left and stone on
//                    the right (Unicron 113). ?ground= then has no effect on the view.
//   ?chrome=0        hide the playground's own bar: the view gets the whole page (screenshots,
//                    and views that are a full app frame)
// A parameter that is absent means "the default": no data-theme (Unicron's own default theme),
// the ground the system asks for, one ground at a time.
//
// The four app themes are the apps' own (Unicron 1: none lives in the core). The playground keeps
// a copy of each in ./app-themes/, loaded by index.css, so the switcher can show them.
import { useMemo, useSyncExternalStore } from "react"

export const APP_THEMES = ["warpcore", "vale", "lockdown", "synapse", "fontface"] as const
export type AppTheme = (typeof APP_THEMES)[number]

export const GROUNDS = ["graphite", "stone"] as const
export type Ground = (typeof GROUNDS)[number]

/**
 * The app a view that has to name one (an app lockup) shows when no theme is picked. The tokens
 * themselves show Unicron's own default then, not this app's colours.
 */
export const DEFAULT_APP_THEME: AppTheme = "warpcore"

/** The name of each theme the switcher shows; "default" is no data-theme, Unicron's own. */
export const THEME_NAMES: Record<AppTheme | "default", string> = {
  default: "Unicron",
  warpcore: "Warpcore",
  vale: "Vale",
  lockdown: "Lockdown",
  synapse: "Synapse",
  fontface: "Fontface",
}

export interface Address {
  view: string | null
  theme: AppTheme | null
  ground: Ground | null
  split: boolean
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
    split: params.get("split") === "1",
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
export function setAddress(patch: Partial<Pick<Address, "view" | "theme" | "ground" | "split">>) {
  const url = new URL(window.location.href)
  for (const [key, value] of Object.entries(patch)) {
    if (value === true) url.searchParams.set(key, "1")
    else if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  if (url.href === window.location.href) return
  if ("view" in patch) window.history.pushState(null, "", url)
  else window.history.replaceState(null, "", url)
  window.dispatchEvent(new Event(CHANGE))
}
