// Promoted from: snds/warpcore · PR snds/unicron#68 · DSA none
"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { useViewport } from "../use-viewport"

/**
 * The outermost box of an app that fills the screen. It owns everything a device can do to one:
 *
 * - The page can't scroll, so a rotation can't leave it scrolled and hide the app's top bar.
 * - It keeps clear of the notch, the home bar and any keyboard.
 * - Header and nav share the screen edge's colour, so they seem to reach the edges.
 * - Under a keyboard, or on a short screen, it gives the height back to the content.
 *
 * Children: `AppFrameHeader` (optional), `AppFrameMain`, `AppFrameNav` (optional).
 */
function AppFrame({ className, style, children, ...props }: React.ComponentProps<"div">) {
  const viewport = useViewport()

  // iOS pans the page to show a focused field and can keep that pan through a rotation. Everything
  // here already stays in view, so put it back whenever the screen changes.
  React.useLayoutEffect(() => {
    if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0)
  }, [viewport])

  return (
    <div
      data-slot="app-frame"
      data-keyboard={viewport.keyboardOpen ? "open" : undefined}
      data-room={viewport.room}
      data-nav={viewport.navPlacement}
      className={cn("text-foreground", className)}
      style={
        {
          ...(viewport.pageHeight > 0 && { "--viewport-page-height": `${viewport.pageHeight}px` }),
          "--viewport-keyboard-inset": `${viewport.keyboardInset}px`,
          "--viewport-offset-top": `${viewport.offsetTop}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}

/** The bar along the top. Gone on a short screen and under a keyboard, so give its controls another home there. */
function AppFrameHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="app-frame-header"
      className={cn(
        "bg-(--c-app-frame-edge) flex h-(--c-app-frame-header-height) shrink-0 items-center gap-3 border-b px-4 short:hidden frame-tight:hidden",
        className
      )}
      {...props}
    />
  )
}

/**
 * The content. It keeps clear of a floating nav by itself. `bleed` lets it run underneath the nav, so
 * the glass has something to show: pad what scrolls by `--app-frame-nav-clearance` and
 * `--app-frame-nav-clearance-end`, so the end of it can still be reached.
 */
function AppFrameMain({ bleed, className, ...props }: React.ComponentProps<"main"> & { bleed?: boolean }) {
  return (
    <main
      data-slot="app-frame-main"
      data-bleed={bleed ? "" : undefined}
      className={cn("bg-background flex min-h-0 min-w-0 overflow-hidden", className)}
      {...props}
    />
  )
}

/**
 * Moves between an app's top-level places. A glass capsule floating above the content: along the
 * bottom, or as a pill at the foot of the right edge when height is scarce (`data-nav="rail"` on the
 * frame). Needs an `aria-label`. Goes away under a keyboard when it would crowd the content, unless
 * it's a rail, which costs no height.
 */
function AppFrameNav({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="app-frame-nav"
      className={cn(
        "bg-popover/70 ring-foreground/10 flex gap-0.5 rounded-full p-1 shadow-lg ring-1 backdrop-blur-2xl backdrop-saturate-150",
        className
      )}
      {...props}
    />
  )
}

/**
 * One place in the nav: an icon, with the label for screen readers. `current` marks where the person
 * is. At least 44px each way, so it's easy to hit without a label to aim at.
 */
function AppFrameNavItem({
  icon,
  label,
  current,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  icon: IconName
  label: string
  current?: boolean
}) {
  return (
    <button
      type="button"
      data-slot="app-frame-nav-item"
      aria-current={current ? "page" : undefined}
      className={cn(
        "text-foreground hover:bg-muted focus-visible:ring-ring/50 flex size-11 w-(--c-app-frame-nav-item-width) shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-3 focus-visible:ring-inset nav-rail:w-full",
        "aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground aria-[current=page]:[--c-icon-fill:1]",
        className
      )}
      {...props}
    >
      <Icon name={icon} />
      <span className="sr-only">{label}</span>
    </button>
  )
}

/**
 * Controls that belong in the nav only when the header is gone: at the head of the pill on a short
 * screen, and otherwise hidden.
 */
function AppFrameNavEnd({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-frame-nav-end"
      className={cn(
        "order-first hidden shrink-0 flex-col items-center border-b pb-0.5 *:size-11 *:rounded-full short:flex frame-minimal:hidden",
        className
      )}
      {...props}
    />
  )
}

/**
 * Two parts that land either side of a fold when the device is partly folded (the Viewport Segments
 * API), and otherwise share the space:
 *
 * - `split="columns"`: the first left, the second right, with the gap on a book-pose fold.
 * - `split="rows"`: the first fills, the second sits at the end. In a tabletop pose the second starts
 *   at the fold, so what you read stands up and what you touch lies flat.
 */
function FoldPanes({
  split,
  className,
  ...props
}: React.ComponentProps<"div"> & { split: "columns" | "rows" }) {
  return <div data-slot="fold-panes" data-split={split} className={cn("min-h-0 min-w-0 flex-1", className)} {...props} />
}

export { AppFrame, AppFrameHeader, AppFrameMain, AppFrameNav, AppFrameNavEnd, AppFrameNavItem, FoldPanes }
