// Promoted from: snds/warpcore · PR snds/unicron#68 · DSA none
"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { DETAIL_MIN_WIDTH, useViewport } from "../use-viewport"
import { Button } from "./button"
import { IndicatorMark, indicatorLabel, indicatorsOf, type IndicatorProp } from "./indicator"
import { ResizableHandle, ResizablePane, ResizablePanes, useResizablePanesLayout } from "./resizable-panes"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet"

/**
 * The outermost box of an app that fills the screen. It owns everything a device can do to one:
 *
 * - The page can't scroll, so a rotation can't leave it scrolled and hide the app's top bar.
 * - It keeps clear of the notch, the home bar and any keyboard.
 * - Header and nav share the screen edge's colour, so they seem to reach the edges.
 * - Under a keyboard, or on a short screen, it gives the height back to the content.
 *
 * Children: `AppFrameHeader` (optional), `AppFrameMain`, `AppFrameNav` (optional). With room to spare,
 * `AppFramePivot` and `AppFrameSidebar` add columns on the left: places, then a list, then the content.
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
        "bg-popover ring-foreground/10 flex gap-0.5 rounded-full p-1 shadow-lg ring-1",
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
/**
 * A top-level place. `indicator` marks it when something there wants the person: `attention`
 * (waiting on them) or `unread`, with an optional count. A dot at the icon's top right on the rail
 * and the pivot; a count badge on the bottom bar, "9+" past nine. Attention wins what's drawn; the
 * name says both, with the count ("Conversations, 2 waiting for you").
 */
function AppFrameNavItem({
  icon,
  label,
  current,
  indicator,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  icon: IconName
  label: string
  current?: boolean
  indicator?: IndicatorProp
}) {
  const said = indicatorLabel(indicator)
  const [top] = indicatorsOf(indicator)
  return (
    <button
      type="button"
      data-slot="app-frame-nav-item"
      aria-current={current ? "page" : undefined}
      className={cn(
        "text-foreground hover:bg-muted focus-visible:ring-ring/50 flex size-11 w-(--c-app-frame-nav-item-width) shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-3 focus-visible:ring-inset nav-rail:w-full in-data-[slot=app-frame-pivot]:w-full in-data-[slot=app-frame-pivot]:rounded-lg",
        "aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="relative inline-flex">
        <Icon name={icon} />
        {top?.count !== undefined ? (
          <>
            {/* The bar has room for a count; the rail and the pivot show a dot. */}
            <IndicatorMark indicator={indicator} shape="badge" className="absolute -top-2 left-1/2 nav-rail:hidden in-data-[slot=app-frame-pivot]:hidden" />
            <IndicatorMark indicator={indicator} className="absolute -top-0.5 -right-0.5 hidden nav-rail:inline-block in-data-[slot=app-frame-pivot]:inline-block" />
          </>
        ) : (
          <IndicatorMark indicator={indicator} className="absolute -top-0.5 -right-0.5" />
        )}
      </span>
      <span className="sr-only">{said ? `${label}, ${said}` : label}</span>
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
 * The column of top-level places on a large screen, in place of `AppFrameNav`. Holds
 * `AppFrameNavItem`s, and needs an `aria-label`. Anything for the foot of it goes in `AppFramePivotEnd`.
 */
function AppFramePivot({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="app-frame-pivot"
      className={cn(
        "bg-(--c-app-frame-edge) flex w-(--c-app-frame-pivot-width) shrink-0 flex-col items-center gap-1 overflow-y-auto border-r p-1.5",
        className
      )}
      {...props}
    />
  )
}

function AppFramePivotEnd({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-frame-pivot-end"
      className={cn("mt-auto flex w-full shrink-0 flex-col items-center gap-1", className)}
      {...props}
    />
  )
}

/**
 * A list beside the content, such as conversations. It holds its place in the layout, so it suits a
 * screen with room for it. On a smaller screen, show the same content in a `SheetContent side="left"`,
 * which handles focus and dismissal. Render it only while it's open, and it collapses to nothing.
 */
function AppFrameSidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="app-frame-sidebar"
      className={cn(
        "bg-(--c-app-frame-edge) flex w-(--c-app-frame-sidebar-width) min-h-0 shrink-0 flex-col border-r",
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

/**
 * What belongs to the content, beside the content: a conversation's documents, an email's attachments.
 * Unlike a pivot it isn't another place, because it changes with what's open. Where it goes follows
 * `viewport.detailPlacement`:
 *
 * - `beside`: shares the width, with a line to drag. `id` remembers where that line was.
 * - `fold`: takes the far side of a book-pose fold, always, since the content alone would straddle it.
 *   There's nothing to close, so check the placement before offering a button that opens it.
 * - `sheet`: slides over, covering the screen on a phone. It takes over focus until dismissed, so an
 *   app that remembers `open` for `beside` should start this one closed.
 *
 * `children` stays mounted while this opens and closes, so a scroll position or a reply survives it.
 * It does remount when the placement itself changes, as on a rotation, so keep state that matters above.
 */
function AppFrameDetail({
  open,
  onOpenChange,
  title,
  detail,
  id = "app-frame-detail",
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  detail: React.ReactNode
  id?: string
  children: React.ReactNode
}) {
  const { detailPlacement, widthClass, short } = useViewport()
  const covers = widthClass === "compact" || short
  const panelIds = React.useMemo(() => (open ? ["main", "detail"] : ["main"]), [open])
  const { defaultLayout, onLayoutChanged } = useResizablePanesLayout({ id, panelIds })

  const main = (
    <div data-slot="app-frame-detail-main" className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {children}
    </div>
  )
  const body = (
    <div data-slot="app-frame-detail-body" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {detail}
    </div>
  )

  if (detailPlacement === "sheet") {
    return (
      <>
        {main}
        <Sheet open={open} onOpenChange={onOpenChange}>
          {/* A full-screen sheet rises from the bottom, as a phone's do. */}
          <SheetContent side={covers ? "bottom" : "right"} size="md" fullscreen={covers} aria-label={title}>
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            {body}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  const panel = (closable: boolean) => (
    <aside aria-label={title} data-slot="app-frame-detail" className="bg-background flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <h2 className="truncate text-sm font-medium">{title}</h2>
        {closable && (
          <Button variant="ghost" size="icon" aria-label={`Close ${title}`} onClick={() => onOpenChange(false)}>
            <Icon name="close" />
          </Button>
        )}
      </div>
      {body}
    </aside>
  )

  if (detailPlacement === "fold") {
    return (
      <FoldPanes split="columns">
        {main}
        {panel(false)}
      </FoldPanes>
    )
  }

  return (
    <ResizablePanes defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
      <ResizablePane id="main" minSize={`${DETAIL_MIN_WIDTH}px`}>
        {main}
      </ResizablePane>
      {open && (
        <>
          {/* Nothing hovers on touch, so anything short of a laptop draws a grip to show the line moves. */}
          <ResizableHandle label={`Resize ${title}`} withGrip={widthClass === "expanded"} />
          <ResizablePane id="detail" defaultSize="36%" minSize={`${DETAIL_MIN_WIDTH}px`}>
            {panel(true)}
          </ResizablePane>
        </>
      )}
    </ResizablePanes>
  )
}

export {
  AppFrame,
  AppFrameDetail,
  AppFrameHeader,
  AppFrameMain,
  AppFrameNav,
  AppFrameNavEnd,
  AppFrameNavItem,
  AppFramePivot,
  AppFramePivotEnd,
  AppFrameSidebar,
  FoldPanes,
}
