// Owned component (not generated): the focus frame: one centred column for sign-in, unlock and first run, with the app's lockup at its top.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, cross-app decisions §4, contract 5.1b #1; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { useAppFrame } from "./app-frame-context"

export type AppFrameFocusProps = React.ComponentProps<"main"> & {
  /** `AppLockup`, at the top of the column. */
  lockup?: React.ReactNode
  /**
   * Where a flow of several steps is: `Step 01 // 02`, in the folio role at the end of the lockup's
   * row. Leave it out for a flow of one step (decisions §4).
   */
  folio?: React.ReactNode
}

/**
 * AppFrameFocus (contract 5.1b #1, decisions §4): the whole app is closed until the person signs
 * in, unlocks or finishes the first run, so the frame draws no chrome and one column: 432 wide,
 * centred, the lockup at its top, then the content with its one primary. On a phone the column
 * is the screen's width, 16 from its sides. Use it as the frame's only child (in place of
 * `AppFrameMain`), or on its own.
 */
function AppFrameFocus({ lockup, folio, className, children, ...props }: AppFrameFocusProps) {
  const frame = useAppFrame()
  return (
    <main
      data-slot="app-frame-focus"
      className={cn(
        "min-h-0 min-w-0 overflow-y-auto overscroll-contain",
        frame.framed ? (frame.phone ? "absolute inset-0" : "col-[1/-1] row-[1/-1]") : "h-full",
        className
      )}
      {...props}
    >
      <div
        data-slot="app-frame-focus-column"
        className={cn(
          "mx-auto flex min-h-full w-full max-w-(--c-app-frame-focus) flex-col justify-center gap-8 py-12",
          frame.phone && "px-4 pt-[max(--spacing(12),calc(env(safe-area-inset-top)+--spacing(4)))]"
        )}
      >
        {lockup || folio ? (
          <div data-slot="app-frame-focus-head" className="flex items-center justify-between gap-4">
            {lockup}
            {folio ? <p className="type-folio text-text-label">{folio}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </main>
  )
}

export { AppFrameFocus }
