// Owned component (not generated): the app's mark and wordmark, top left of every shell.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 28:2297; no app PR, no DSA record)
import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "../../lib/utils"

export type AppLockupProps = Omit<useRender.ComponentProps<"div">, "children"> & {
  /** The app's name, as written ("Vale"). The wordmark sets it in capitals; assistive tech reads it as a word. */
  name: string
  /** The letter on the placeholder mark. Default: the name's first letter. */
  initial?: string
  /**
   * Show the wordmark. The frame turns it off when the page scrolls (the mark stays); the name is
   * still the lockup's accessible name. Default true.
   */
  showName?: boolean
  /** The app's real mark, when it has one: it takes the 32px square instead of the placeholder. */
  mark?: React.ReactNode
  /**
   * `m`: the 1.x lockup, a 32 mark and the capitals wordmark. `s`: the 2.0 sidebar's (Figma Sidebar
   * Top 144:701), a 20 mark and the name as written in 14/600. The flush sidebar sets `s`. Default `m`.
   */
  size?: "m" | "s"
}

/**
 * AppLockup (Figma 28:2297): a 32px square mark and the wordmark, 10px apart, centred in the 48px
 * control height. The mark is a placeholder until real app icons exist: the primary fill holding
 * the initial in the subtitle role. The wordmark is the brand role (13/16 bold, +12%) in body ink.
 *
 * A plain box by default; `render={<a href="/" />}` (or a router link) makes it the way home.
 */
function AppLockup({ name, initial, showName = true, mark, size = "m", render, className, ...props }: AppLockupProps) {
  const small = size === "s"
  const letter = (initial ?? name.trim().charAt(0)).toUpperCase()
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn("inline-flex shrink-0 items-center rounded-sm select-none", small ? "h-8 gap-2" : "h-control gap-2.5", className),
        children: (
          <>
            <span
              data-slot="app-lockup-mark"
              aria-hidden="true"
              className={cn(
                "inline-flex shrink-0 items-center justify-center overflow-hidden",
                small ? "size-5 rounded-md" : "size-(--c-app-lockup-mark) rounded-sm",
                mark ? undefined : cn(small ? "type-overline" : "type-subtitle", "bg-primary-fill text-primary-on-fill")
              )}
            >
              {mark ?? letter}
            </span>
            <span data-slot="app-lockup-name" className={cn(small ? "type-control-strong" : "type-brand-wordmark uppercase", "text-text-body whitespace-nowrap", !showName && "sr-only")}>
              {name}
            </span>
          </>
        ),
      },
      props
    ),
    state: { slot: "app-lockup" },
  })
}

export { AppLockup }
