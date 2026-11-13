// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded from snds/mailbird (initial copy; AdaptiveSheetContent and its wide variant arrived with the set)
// Promoted from: snds/mailbird · PR snds/unicron#2 · DSA none (SheetContent fullscreen, raised from correct-use override counts)
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:122 "Sheet Header" and the drawn sheets on the app pages: Vale 05, Lockdown 11; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cn } from "../../lib/utils"

import { FloatButton } from "./float-button"

function Sheet({
  closeOnOutsideClick = true,
  disablePointerDismissal,
  ...props
}: SheetPrimitive.Root.Props & {
  /**
   * Close when someone clicks or taps outside the sheet: on the backdrop, or anywhere else when
   * there is none. On by default, as on `Dialog`. Turn it off for a sheet holding unsaved work or
   * a destructive step, and for a detail sheet beside a list (`backdrop={false}`), where a click
   * on another row should change the sheet, not close it. Escape and the close button still close
   * it. Base UI's `disablePointerDismissal`, if passed, wins.
   */
  closeOnOutsideClick?: boolean
}) {
  return (
    <SheetPrimitive.Root
      data-slot="sheet"
      disablePointerDismissal={disablePointerDismissal ?? !closeOnOutsideClick}
      {...props}
    />
  )
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

/** The dim behind a sheet: --surface-scrim at --c-scrim-sheet (50%). Never opaque, never blurred. */
function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "scrim-sheet fixed inset-0 z-50 transition-opacity duration-(--motion-fast) data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * How wide a left or right sheet grows from `sm` up. A sheet is a fixed width, not a range, so its
 * edge doesn't move as content changes. Top and bottom sheets span the screen and ignore it.
 */
const SHEET_SIZES = {
  sm: "data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
  md: "data-[side=left]:sm:max-w-md data-[side=right]:sm:max-w-md",
  lg: "data-[side=left]:sm:max-w-lg data-[side=right]:sm:max-w-lg",
  xl: "data-[side=left]:sm:max-w-2xl data-[side=right]:sm:max-w-2xl",
  "2xl": "data-[side=left]:sm:max-w-3xl data-[side=right]:sm:max-w-3xl",
} as const

export type SheetSize = keyof typeof SHEET_SIZES

/**
 * How tall a bottom sheet is. `content` hugs what it holds, up to the screen less 48px
 * (--c-sheet-compact-height), then its body scrolls: the sheets Figma draws. `full` takes the whole
 * screen, clear of the status bar: a list, or a form with more than three fields.
 */
export type SheetHeight = "content" | "full"

/** What a sheet tells its parts: where it is anchored, and whether it has a close button. */
const SheetContentContext = React.createContext<{ showCloseButton: boolean }>({ showCloseButton: false })

/** The close button: a neutral FloatButton L at the header's top right (Figma 25. Sheet Header). */
function SheetCloseButton({ label }: { label: string }) {
  return (
    // Last in the tab order, so focus starts in the content. 16 from the right; 20 from the top
    // under a grabber (8 + 4 + 8), 16 without one.
    <span
      data-slot="sheet-close-anchor"
      className="absolute top-4 right-4 z-10 flex in-data-[side=bottom]:top-5 in-data-[side=adaptive]:max-sm:top-5"
    >
      <SheetPrimitive.Close data-slot="sheet-close" render={<FloatButton label={label} icon="close" size="l" />} />
    </span>
  )
}

type DragHandlers = Pick<React.ComponentProps<"div">, "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel">

/**
 * The 36 x 4 bar at the top of a bottom sheet, in line-grid-dot (Figma 25. Sheet Header). Its box
 * reaches 8px above and below the bar, so a drag can start on it, but it takes only the bar's
 * height in the layout. Decoration for assistive tech: the close button and Escape close the sheet.
 */
function SheetGrabber({ className, ...handlers }: DragHandlers & { className?: string }) {
  const draggable = Boolean(handlers.onPointerDown)
  return (
    <div
      aria-hidden
      data-slot="sheet-grabber"
      data-draggable={draggable ? "" : undefined}
      className={cn("-my-2 flex shrink-0 justify-center py-2", draggable && "cursor-grab touch-none", className)}
      {...handlers}
    >
      <span className="h-1 w-9 bg-(--c-sheet-handle)" />
    </div>
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  size = "sm",
  height,
  showCloseButton = true,
  closeLabel = "Close",
  fullscreen = false,
  backdrop = true,
  beforeContent,
  container,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  /** A side sheet's width from `sm` up (SHEET_SIZES); `sm` by default, as before. */
  size?: SheetSize
  /** A bottom sheet's height: `content` (the default) or `full`. */
  height?: SheetHeight
  /** The close button at the top right: a neutral FloatButton L with the `close` glyph. On by default. */
  showCloseButton?: boolean
  /** The close button's accessible name and tooltip. */
  closeLabel?: string
  /**
   * Draw the dimming backdrop (the default). A detail sheet beside a list leaves it out, so the
   * list stays visible and clickable: pair `backdrop={false}` with
   * `<Sheet modal={false} closeOnOutsideClick={false}>`, and picking another row changes what the
   * sheet shows instead of closing it. Escape and the close button still close it.
   */
  backdrop?: boolean
  /** @deprecated Use `height="full"`. Covers the whole screen, edge to edge, clear of the status bar. */
  fullscreen?: boolean
  /**
   * Rendered in the portal between the backdrop and the popup, so it paints above the
   * backdrop and below the popup. A desktop app puts its window drag strip here
   * (`data-tauri-drag-region`) so the window still moves while the sheet is open. A press
   * on it does not dismiss the sheet: only a press on the backdrop does.
   */
  beforeContent?: React.ReactNode
  /** Where the portal goes: `<body>` by default. */
  container?: SheetPrimitive.Portal.Props["container"]
}) {
  const full = height === "full" || fullscreen
  const context = React.useMemo(() => ({ showCloseButton }), [showCloseButton])
  return (
    <SheetPortal container={container}>
      {backdrop && <SheetOverlay />}
      {beforeContent}
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        data-height={side === "bottom" ? (full ? "full" : "content") : undefined}
        className={cn(
          // Solid and square: the raised surface (as Figma's sheets are drawn), a 1px rule on the
          // edge that faces the page, no shadow, no radius.
          "bg-surface-raised text-text-body type-body fixed z-50 flex flex-col gap-2 outline-none transition duration-(--motion-base) ease-move data-ending-style:opacity-0 data-starting-style:opacity-0",
          "data-[side=left]:pl-[env(safe-area-inset-left)] data-[side=right]:pr-[env(safe-area-inset-right)] data-[side=bottom]:px-[max(env(safe-area-inset-left),env(safe-area-inset-right))]",
          // Bottom: a grabber 8 from the top, then the header 8 under it.
          "data-[side=bottom]:rule-t data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:pt-2 data-[side=bottom]:pb-[env(safe-area-inset-bottom)] data-[side=bottom]:max-h-(--c-sheet-compact-height)",
          // Sides and top: no grabber, the header 16 from the top.
          "data-[side=left]:rule-r data-[side=left]:top-(--c-dialog-titlebar-inset) data-[side=left]:bottom-0 data-[side=left]:left-0 data-[side=left]:w-3/4 data-[side=left]:pt-4",
          "data-[side=right]:rule-l data-[side=right]:top-(--c-dialog-titlebar-inset) data-[side=right]:bottom-0 data-[side=right]:right-0 data-[side=right]:w-3/4 data-[side=right]:pt-4",
          "data-[side=top]:rule-b data-[side=top]:inset-x-0 data-[side=top]:top-(--c-dialog-titlebar-inset) data-[side=top]:pt-4 data-[side=top]:pb-4",
          // They slide 40px from their edge as they fade; under reduced motion they only fade.
          "data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem]",
          SHEET_SIZES[size],
          full &&
            "data-[side=bottom]:max-h-none data-[side=bottom]:h-[calc(100dvh-var(--c-dialog-titlebar-inset))] data-[side=bottom]:pt-[calc(env(safe-area-inset-top)+0.5rem)]",
          className
        )}
        {...props}
      >
        <SheetContentContext.Provider value={context}>
          {side === "bottom" && <SheetGrabber />}
          {children}
        </SheetContentContext.Provider>
        {showCloseButton && <SheetCloseButton label={closeLabel} />}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

/** How far down (px), or what share of its height, a drag must go to dismiss. */
const DISMISS_PX = 120
const DISMISS_SHARE = 0.3

/**
 * One sheet, two metaphors: on phones a bottom sheet (full width, content height or full, a
 * grabber you can drag down to dismiss), from `sm` up a panel on the right. The close button is
 * at the top right in both, as Figma's Sheet Header draws it.
 *
 * The switch is a viewport media query, not a container query: a sheet is an overlay, so the
 * viewport is its container. `className` styles the scrolling content area, not the frame.
 */
function AdaptiveSheetContent({
  className,
  children,
  wide = false,
  height = "content",
  showCloseButton = true,
  closeLabel = "Close",
  beforeContent,
  container,
  ...props
}: SheetPrimitive.Popup.Props & {
  /** `wide`: a wider side panel from `sm` up, for content like a photo; on phones it's the same bottom sheet. */
  wide?: boolean
  /** The phone sheet's height: `content` (the default) or `full`. */
  height?: SheetHeight
  showCloseButton?: boolean
  closeLabel?: string
  /** As on `SheetContent`: rendered between the backdrop and the popup (a desktop app's drag strip). */
  beforeContent?: React.ReactNode
  container?: SheetPrimitive.Portal.Props["container"]
}) {
  const popup = React.useRef<HTMLDivElement>(null)
  const close = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{ y: number; dy: number } | null>(null)
  const context = React.useMemo(() => ({ showCloseButton }), [showCloseButton])

  // Dragging the grabber down follows the finger; far enough lets go.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { y: e.clientY, dy: 0 }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !popup.current) return
    drag.current.dy = Math.max(0, e.clientY - drag.current.y)
    popup.current.style.transition = "none"
    popup.current.style.transform = `translateY(${drag.current.dy}px)`
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    const el = popup.current
    if (!d || !el) return
    el.style.transition = ""
    el.style.transform = ""
    if (d.dy > DISMISS_PX || d.dy > el.offsetHeight * DISMISS_SHARE) {
      close.current?.querySelector<HTMLElement>('[data-slot="sheet-close"]')?.click()
    }
  }

  return (
    <SheetPortal container={container}>
      <SheetOverlay />
      {beforeContent}
      <SheetPrimitive.Popup
        ref={popup}
        data-slot="sheet-content"
        data-side="adaptive"
        data-height={height}
        className={cn(
          "bg-surface-raised text-text-body type-body fixed z-50 flex flex-col overflow-hidden outline-none transition duration-(--motion-base) ease-enter data-ending-style:opacity-0 data-starting-style:opacity-0",
          // Compact: anchored to the bottom edge, a rule on top, square.
          "max-sm:rule-t max-sm:inset-x-0 max-sm:bottom-0 max-sm:pt-2 max-sm:data-ending-style:translate-y-full max-sm:data-starting-style:translate-y-full",
          height === "full"
            ? "max-sm:h-[calc(100dvh-var(--c-dialog-titlebar-inset))] max-sm:pt-[calc(env(safe-area-inset-top)+0.5rem)]"
            : "max-sm:max-h-(--c-sheet-compact-height)",
          // Regular: a panel on the right, starting below --c-dialog-titlebar-inset (0px by default).
          "sm:rule-l sm:top-(--c-dialog-titlebar-inset) sm:bottom-0 sm:right-0 sm:max-w-full sm:pt-4 sm:data-ending-style:translate-x-[2.5rem] sm:data-starting-style:translate-x-[2.5rem]",
          wide ? "sm:w-(--c-sheet-wide-width)" : "sm:w-(--c-sheet-regular-width)"
        )}
        {...props}
      >
        <SheetGrabber
          // The popup pads 8 above; the bar's box runs 8 under it, so the header starts 8 below the bar.
          className="mb-0 sm:hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <SheetContentContext.Provider value={context}>
          <div
            data-slot="sheet-scroll"
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain",
              // Clear of the home indicator.
              "max-sm:pb-[env(safe-area-inset-bottom)]",
              className
            )}
          >
            {children}
          </div>
        </SheetContentContext.Provider>
        {showCloseButton && (
          <div ref={close} className="contents">
            <SheetCloseButton label={closeLabel} />
          </div>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

/**
 * The top of a sheet (Figma 25. Sheet Header): a `SheetOverline` and a `SheetTitle` in the lead
 * role, beside the close button, 48 tall. The grabber above it belongs to the sheet, so it shows
 * on every bottom sheet, with this header or without it.
 */
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  const { showCloseButton } = React.useContext(SheetContentContext)
  return (
    <div
      data-slot="sheet-header"
      data-close={showCloseButton ? "" : undefined}
      className={cn(
        "flex min-h-control min-w-0 shrink-0 flex-col justify-center px-4",
        // 16 from the edge, the 48 close, and 12 between: 76.
        showCloseButton && "pr-19",
        // A row of SheetHeaderActions as well: one more 48 button and 8 between.
        showCloseButton && "in-[[data-slot=sheet-content]:has([data-slot=sheet-header-actions])]:pr-33",
        className
      )}
      {...props}
    />
  )
}

/**
 * The sheet's own actions (copy a link, pin, open elsewhere), in one row with its close button:
 * pinned beside it at the same top, for `FloatButton size="l"`, the close button's size, so the
 * row's buttons line up. Put it anywhere inside `SheetContent`. Without a close button
 * (`showCloseButton={false}`), pass `className="right-4"` to take its place.
 */
function SheetHeaderActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header-actions"
      className={cn(
        "absolute top-4 right-18 z-10 flex items-center gap-2 in-data-[side=bottom]:top-5 in-data-[side=adaptive]:max-sm:top-5",
        className
      )}
      {...props}
    />
  )
}

/** What the sheet holds, under its header: rows, fields, a sentence. 16 from the sides. */
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-4", className)}
      {...props}
    />
  )
}

function SheetFooter({
  className,
  sticky = false,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * Keep the footer pinned to the bottom of whatever scrolls around it (the sheet, or
   * `AdaptiveSheetContent`'s content area), so its actions never scroll out of view. Off by
   * default. The footer is then opaque, so content scrolls under it.
   */
  sticky?: boolean
}) {
  return (
    <div
      data-slot="sheet-footer"
      data-sticky={sticky || undefined}
      className={cn(
        // At the right on a side panel; on a bottom sheet the buttons share the width (Lockdown 11).
        "mt-auto flex flex-wrap items-center justify-end gap-4 px-4 pt-2 pb-4",
        "in-data-[side=bottom]:*:flex-auto in-data-[side=adaptive]:max-sm:*:flex-auto",
        sticky && "bg-surface-raised rule-t sticky bottom-0 z-10",
        className
      )}
      {...props}
    />
  )
}

/** The mono caps line above a sheet's title: what it is about (`MAIL // PERSONAL`). */
function SheetOverline({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="sheet-overline" className={cn("type-overline text-text-label", className)} {...props} />
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("type-lead text-text-body break-words", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("type-body text-text-secondary break-words", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  AdaptiveSheetContent,
  SheetHeader,
  SheetHeaderActions,
  SheetBody,
  SheetFooter,
  SheetOverline,
  SheetTitle,
  SheetDescription,
}
