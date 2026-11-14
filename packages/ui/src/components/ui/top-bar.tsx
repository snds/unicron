// Owned component (not generated): the top row of a phone detail screen: back, a small centred title, up to two actions.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, drawn on every app's phone detail screens, no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { FloatButton } from "./float-button"

export type TopBarProps = Omit<React.ComponentProps<"div">, "title"> & {
  /**
   * The small centred title (subtitle role). Leave it out while the page's own head shows the
   * title; the frame passes it once that head has scrolled away.
   */
  title?: React.ReactNode
  /** The title's element. `p` by default, since the page head below is the page's `h1`; `h1` for a screen with no head (a full-screen form). */
  titleAs?: "p" | "h1" | "h2"
  /** Go back. Draws the back float button (48, `arrow--left`). */
  onBack?: () => void
  /** The back button's name. Default "Back". */
  backLabel?: string
  /** Something else in the back button's place (a close button on a full-screen form). Wins over `onBack`. */
  start?: React.ReactNode
  /** Up to two neutral float buttons at the end (edit, more), 8px apart. */
  actions?: React.ReactNode
}

/**
 * TopBar: a phone detail screen's top row, 48 high (the phone frames: back at the start, edit and
 * more at the end, 8px apart, 16px from the screen's edges, which the frame owns). The title is
 * centred on the row whatever the two ends hold, and cut with an ellipsis before it reaches them.
 */
function TopBar({ title, titleAs = "p", onBack, backLabel = "Back", start, actions, className, ...props }: TopBarProps) {
  const Title = titleAs
  return (
    <div
      data-slot="top-bar"
      className={cn(
        // The ends size to what they hold and share what is left; the middle takes at most its text.
        "grid h-control min-w-0 grid-cols-[minmax(max-content,1fr)_minmax(0,max-content)_minmax(max-content,1fr)] items-center gap-2",
        className
      )}
      {...props}
    >
      <div data-slot="top-bar-start" className="flex items-center justify-start gap-2">
        {start ?? (onBack ? <FloatButton label={backLabel} icon="arrow--left" size="l" onClick={onBack} /> : null)}
      </div>
      {title ? (
        <Title data-slot="top-bar-title" className="type-subtitle motion-pop min-w-0 truncate text-center text-text-body">
          {title}
        </Title>
      ) : (
        <span aria-hidden="true" />
      )}
      <div data-slot="top-bar-actions" className="flex items-center justify-end gap-2">
        {actions}
      </div>
    </div>
  )
}

export { TopBar }
