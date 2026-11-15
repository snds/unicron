// Applies the theme in the address to the document: the app as <html data-theme="…">, the ground
// as the `dark` or `light` class. Components never set either axis; the page root does.
import { useEffect, useLayoutEffect } from "react"
import { useTheme } from "next-themes"

import { DEFAULT_APP_THEME, useAddress, type AppTheme, type Ground } from "./address"

export interface PlaygroundTheme {
  theme: AppTheme
  ground: Ground
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
    theme: address.theme ?? DEFAULT_APP_THEME,
    ground: address.ground ?? (resolvedTheme === "dark" ? "graphite" : "stone"),
  }
}
