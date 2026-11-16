// Applies the theme in the address to the document: the app as <html data-theme="…"> (none for
// Unicron's own default), the ground as the `dark` or `light` class. Components never set either
// axis; the page root does. In the split view each half sets its own ground on a box (App.tsx).
import { useEffect, useLayoutEffect } from "react"
import { useTheme } from "next-themes"

import { useAddress, type AppTheme, type Ground } from "./address"

export interface PlaygroundTheme {
  /** The app's theme, or null for Unicron's own default (no data-theme). */
  theme: AppTheme | null
  ground: Ground
  /** Both grounds side by side. */
  split: boolean
}

/**
 * Apply the address to the document, and say what is showing. Call it once, in the app shell.
 * The ground goes through next-themes, which owns the class on <html> (main.tsx), so the Toaster
 * and anything else that asks next-themes agrees with the page.
 */
export function usePlaygroundTheme(): PlaygroundTheme {
  const address = useAddress()
  const { resolvedTheme, setTheme } = useTheme()

  useLayoutEffect(() => {
    const root = document.documentElement
    if (address.theme) root.dataset.theme = address.theme
    else delete root.dataset.theme
  }, [address.theme])

  useEffect(() => {
    if (address.ground) setTheme(address.ground === "graphite" ? "dark" : "light")
  }, [address.ground, setTheme])

  return {
    theme: address.theme,
    ground: address.ground ?? (resolvedTheme === "dark" ? "graphite" : "stone"),
    split: address.split,
  }
}
