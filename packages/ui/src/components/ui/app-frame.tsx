// Promoted from: snds/warpcore · PR snds/unicron#68 · DSA none
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.2 and 5.1b #1, #2, #4, #9 to #11, #13, #14; no app PR, no DSA record)
"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { DETAIL_MIN_WIDTH, useViewport } from "../use-viewport"
import {
  AppFrameAnnounceContext,
  AppFrameContext,
  frameLayoutFor,
  isBookFold,
  isExpandedWidth,
  isPhoneLayout,
  readLength,
  shrinkFor,
  useAppFrame,
  useBoxViewport,
  useScrollMinimize,
  type AppFrameBack,
  type AppFrameBottomSlots,
  type AppFrameContextValue,
  type AppFrameHead,
  type AppFrameLayout,
  type AppFrameStripState,
} from "./app-frame-context"
import { AppFramePullMark, usePullToRefresh } from "./app-frame-pull"
import { FloatButton } from "./float-button"
import { PageHead, type PageHeadProps } from "./page-head"
import { ResizableHandle, ResizablePane, ResizablePanes, useResizablePanesLayout } from "./resizable-panes"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet"

/* ── AppFrame ────────────────────────────────────────────────────────────────────────────────── */

export type AppFrameProps = React.ComponentProps<"div"> & {
  /**
   * Pin the shell instead of taking the one the width picks (contract 5.2): a preview, a test.
   * Apps leave it out; the frame parts switch by themselves.
   */
  layout?: AppFrameLayout
  /** Pin the phone's minimized state (a preview of the scrolled chrome). Left out, the content's scroll drives it. */
  minimized?: boolean
  /**
   * A box inside a page instead of the whole screen (the playground, a preview): it measures its
   * own size to pick its shell, and neither locks the page nor follows the keyboard.
   */
  contained?: boolean
  /**
   * Reading at length (Synapse Y-03 "focus"): the list column steps aside at the expanded width
   * so the detail takes the room. The app keeps it, and a toggle with `aria-pressed` drives it.
   */
  focus?: boolean
}

/**
 * The outermost box of an app that fills the screen. It owns everything a device can do to one:
 *
 * - The page can't scroll, so a rotation can't leave it scrolled and hide the app's chrome.
 * - It keeps clear of the notch, the home bar and any keyboard.
 * - Under a keyboard, or on a short screen, it gives the height back to the content.
 *
 * And it picks the shell from the width (contract 5.2), so an app writes one composition and no
 * shell CSS. Every part draws itself only where it belongs:
 *
 * - Phone (under 600): `AppFrameTopRow`, `AppFrameMain`, `AppFrameAccessory`, `AppFrameBottomRow`.
 *   The chrome floats over full-bleed content; scrolling minimizes it (`useScrollMinimize`).
 * - Short screens (a phone on its side): the bottom row stands at the trailing edge as a column.
 * - Medium (600 to 1023): `AppFrameSidebar` as its rail (or `AppFrameTopBar`), the status line,
 *   one content column; a detail is a pushed screen.
 * - Expanded (1024 up): the sidebar or the top bar, the status line, list + detail side by side.
 */
function AppFrame({ layout: pinnedLayout, minimized: pinnedMinimized, contained = false, focus = false, className, style, children, ...props }: AppFrameProps) {
  const screen = useViewport()
  const [box, setBox] = React.useState<HTMLDivElement | null>(null)
  const measured = useBoxViewport(box, contained)
  const viewport = contained ? (measured ?? screen) : screen
  const layout = pinnedLayout ?? frameLayoutFor(viewport)
  const phone = isPhoneLayout(layout)
  const foldBook = isBookFold(viewport)
  const wide = viewport.widthClass === "wide" || viewport.widthClass === "ultrawide"

  // The list + detail shrink order (C8): the sidebar's rail first, then the detail pushed.
  const [sidebar, setSidebarState] = React.useState<{ collapsed: boolean } | null>(null)
  const setSidebar = React.useCallback((next: { collapsed: boolean } | null) => {
    setSidebarState((prev) => (prev?.collapsed === next?.collapsed && (prev === null) === (next === null) ? prev : next))
  }, [])
  const [parts, setParts] = React.useState({ list: 0, detail: 0 })
  const registerSplitPart = React.useCallback((part: "list" | "detail") => {
    setParts((p) => ({ ...p, [part]: p[part] + 1 }))
    return () => setParts((p) => ({ ...p, [part]: p[part] - 1 }))
  }, [])
  // The knobs, read once the frame's box is on the page (the stylesheet is there by then).
  const knobs = React.useMemo(
    () =>
      box
        ? {
            sidebarWidth: readLength(box, "--c-app-frame-sidebar-width", SHRINK_FALLBACK.sidebarWidth),
            railWidth: readLength(box, "--c-app-frame-sidebar-rail", SHRINK_FALLBACK.railWidth),
            listMin: readLength(box, "--c-app-frame-list-compact", SHRINK_FALLBACK.listMin),
            gap: readLength(box, "--c-app-frame-split-gap", SHRINK_FALLBACK.gap),
            detailMin: readLength(box, "--c-app-frame-detail-min", SHRINK_FALLBACK.detailMin),
          }
        : SHRINK_FALLBACK,
    [box]
  )
  const shrink =
    layout === "expanded" && parts.list > 0 && parts.detail > 0
      ? shrinkFor({
          width: viewport.width,
          gutter: wide ? GUTTER_WIDE : GUTTER,
          sidebar: sidebar ? (sidebar.collapsed ? "rail" : "full") : "none",
          sidebarGap: GUTTER,
          ...knobs,
        })
      : "none"
  const split = (layout === "expanded" && shrink !== "push") || (foldBook && !phone)

  const [scroller, setScroller] = React.useState<HTMLElement | null>(null)
  const scrolled = useScrollMinimize(scroller, { enabled: phone && pinnedMinimized === undefined })
  const minimized = phone && (pinnedMinimized ?? scrolled)

  const [head, setHead] = React.useState<AppFrameHead | null>(null)
  const [bottom, setBottom] = React.useState<AppFrameBottomSlots | null>(null)
  const [railTop, setRailTop] = React.useState<HTMLDivElement | null>(null)
  const [railBottom, setRailBottom] = React.useState<HTMLDivElement | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [back, setBack] = React.useState<AppFrameBack | null>(null)
  const [clearance, setClearanceState] = React.useState({ top: 0, bottom: 0 })
  const setClearance = React.useCallback((edge: "top" | "bottom", px: number) => {
    setClearanceState((c) => (c[edge] === px ? c : { ...c, [edge]: px }))
  }, [])

  // The status strip and the toasts (C6): the first strip that shows is the one that counts.
  const [strips, setStrips] = React.useState<readonly (readonly [string, AppFrameStripState])[]>([])
  const setStrip = React.useCallback((id: string, state: AppFrameStripState | null) => {
    setStrips((list) => {
      const at = list.findIndex(([key]) => key === id)
      if (state === null) return at < 0 ? list : list.filter(([key]) => key !== id)
      if (at >= 0 && list[at][1] === state) return list
      if (at >= 0) return list.map((entry, i) => (i === at ? ([id, state] as const) : entry))
      return [...list, [id, state] as const]
    })
  }, [])
  const strip: AppFrameStripState = strips[0]?.[1] ?? "none"
  const [toastShowing, setToastShowing] = React.useState(false)
  const [bottomBar, setBottomBar] = React.useState<HTMLElement | null>(null)
  const [mainArea, setMainArea] = React.useState<HTMLElement | null>(null)
  const [toastBox, setToastBox] = React.useState<ToastBox | null>(null)

  // The one polite region (C7): sentences from the status parts, said once.
  const [said, setSaid] = React.useState("")
  const pending = React.useRef<string[]>([])
  const flush = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(flush.current), [])
  const announce = React.useCallback((message: string) => {
    pending.current.push(message)
    if (flush.current !== undefined) return
    // Sentences that arrive together are said together, in order, once each.
    flush.current = setTimeout(() => {
      flush.current = undefined
      const words = Array.from(new Set(pending.current)).join(" ")
      pending.current = []
      setSaid((prev) => (prev === words ? `${words}\u00a0` : words))
    }, 0)
  }, [])

  const keyboardOpen = !contained && viewport.keyboardOpen
  const tight = !contained && viewport.room !== "full"

  // iOS pans the page to show a focused field and can keep that pan through a rotation. Everything
  // here already stays in view, so put it back whenever the screen changes.
  React.useLayoutEffect(() => {
    if (contained) return
    if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0)
  }, [screen, contained])

  const context = React.useMemo<AppFrameContextValue>(
    () => ({
      framed: true,
      layout,
      phone,
      width: viewport.widthClass,
      split,
      foldBook,
      keyboardOpen,
      tight,
      minimized,
      setScroller,
      head,
      setHead,
      bottom,
      setBottom,
      rail: { top: railTop, bottom: railBottom },
      detailOpen,
      setDetailOpen,
      back,
      setBack,
      focus,
      setClearance,
      shrink,
      sidebarRail: shrink !== "none",
      setSidebar,
      registerSplitPart,
      strip,
      setStrip,
      toastShowing,
      setToastShowing,
      setBottomBar,
      setMainArea,
    }),
    [
      layout,
      phone,
      viewport.widthClass,
      split,
      foldBook,
      keyboardOpen,
      tight,
      minimized,
      head,
      bottom,
      railTop,
      railBottom,
      detailOpen,
      back,
      focus,
      setClearance,
      shrink,
      setSidebar,
      registerSplitPart,
      strip,
      setStrip,
      toastShowing,
      setBottomBar,
      setMainArea,
    ]
  )

  // Where a toast goes (C6), measured off the frame's own box, so a contained frame (which is the
  // containing block of its fixed descendants) places its toasts inside itself:
  // - phone: 16 from the sides, as wide as the strip, the bottom just above the bottom row's bar
  //   (the strip's slot), or 16 from the foot with no row; the top just under the top row;
  // - desktop: the bottom left of the content, 24 above the screen's foot.
  React.useLayoutEffect(() => {
    if (!box) return
    const measure = () => {
      const frameBox = box.getBoundingClientRect()
      const inset = readLength(box, "--c-toaster-offset-compact", 16)
      let next: ToastBox
      if (phone) {
        const top = box.querySelector('[data-slot="app-frame-top-row"]')?.getBoundingClientRect()
        const bar = bottomBar?.isConnected ? bottomBar.getBoundingClientRect() : null
        const gap = readLength(box, "--c-toaster-gap", 8)
        next = {
          left: inset,
          width: Math.max(0, frameBox.width - 2 * inset),
          bottom: bar && bar.height > 0 ? frameBox.bottom - bar.top + gap : inset,
          top: top && top.height > 0 ? top.bottom - frameBox.top : inset,
        }
      } else {
        const area = mainArea?.isConnected ? mainArea.getBoundingClientRect() : null
        next = {
          left: area ? area.left - frameBox.left : readLength(box, "--c-toaster-offset", 24),
          width: null,
          bottom: area ? Math.max(0, frameBox.bottom - area.bottom) + readLength(box, "--c-toaster-offset", 24) : readLength(box, "--c-toaster-offset", 24),
          top: readLength(box, "--c-toaster-offset", 24),
        }
      }
      const round = (n: number | null) => (n === null ? null : Math.round(n))
      setToastBox((prev) =>
        prev && prev.left === round(next.left) && prev.width === round(next.width) && prev.bottom === round(next.bottom) && prev.top === round(next.top)
          ? prev
          : { left: round(next.left)!, width: round(next.width), bottom: round(next.bottom)!, top: round(next.top)! }
      )
    }
    measure()
    if (typeof ResizeObserver !== "function") return
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    if (bottomBar) observer.observe(bottomBar)
    if (mainArea) observer.observe(mainArea)
    return () => observer.disconnect()
  }, [box, phone, bottomBar, mainArea, clearance, minimized, layout])

  return (
    <div
      ref={setBox}
      // The stylesheet's app-frame rules (fixed to the screen, the page lock, the safe areas, the
      // keyboard) belong to the screen's frame only; a contained one is a plain box.
      data-slot={contained ? "app-frame-contained" : "app-frame"}
      data-layout={layout}
      data-minimized={minimized ? "" : undefined}
      data-keyboard={keyboardOpen ? "open" : undefined}
      data-room={contained ? "full" : viewport.room}
      data-nav={viewport.navPlacement}
      data-shrink={shrink === "none" ? undefined : shrink}
      data-strip={phone && strip !== "none" ? strip : undefined}
      className={cn(
        "group/frame text-foreground",
        // A contained frame holds its own fixed layers (its toasts): `contain: paint` makes it their box.
        contained && "relative isolate grid h-full w-full overflow-hidden bg-surface-ground [contain:paint]",
        className
      )}
      style={
        {
          ...(!contained && viewport.pageHeight > 0 && { "--viewport-page-height": `${viewport.pageHeight}px` }),
          ...(!contained && {
            "--viewport-keyboard-inset": `${viewport.keyboardInset}px`,
            "--viewport-offset-top": `${viewport.offsetTop}px`,
          }),
          "--app-frame-top-clear": `${clearance.top}px`,
          "--app-frame-bottom-clear": `${clearance.bottom}px`,
          // Read by the Toaster inside the frame (C6).
          ...(toastBox && {
            "--frame-toast-left": `${toastBox.left}px`,
            "--frame-toast-bottom": `${toastBox.bottom}px`,
            "--frame-toast-top": `${toastBox.top}px`,
            ...(toastBox.width !== null && { "--frame-toast-width": `${toastBox.width}px` }),
          }),
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <AppFrameContext.Provider value={context}>
        <AppFrameAnnounceContext.Provider value={announce}>
        <div
          data-slot="app-frame-body"
          className={cn(
            // One cell: the whole frame. The stylesheet's grid places nothing else.
            "relative col-[1/-1] row-[1/-1] min-h-0 min-w-0 bg-surface-ground",
            phone
              ? "overflow-hidden"
              : // Sidebar on the left the whole height; the status line or top bar over the content.
                cn(
                  "grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] [grid-template-areas:'sidebar_header'_'sidebar_main']",
                  // The page gutters: 48 at 1440 as every desktop frame draws them, 24 below 1280.
                  wide ? "px-12" : "px-6"
                )
          )}
        >
          {children}
          {layout === "rail" ? (
            // The short screen's trailing column (Warpcore U-03): the top row's buttons at the top,
            // the bottom row's search, tab bar and create at the foot. 16 from each edge.
            <div
              data-slot="app-frame-rail"
              className={cn(
                "pointer-events-none absolute inset-y-0 end-0 z-20 flex w-[calc(var(--spacing-control)+--spacing(8))] flex-col justify-between gap-2 p-4",
                keyboardOpen && "hidden"
              )}
            >
              <div ref={setRailTop} data-slot="app-frame-rail-top" className="pointer-events-auto flex flex-col items-center gap-2" />
              <div ref={setRailBottom} data-slot="app-frame-rail-bottom" className="pointer-events-auto flex flex-col items-center gap-2" />
            </div>
          ) : null}
        </div>
        {/* The frame's one polite region (C7): status parts say their sentence here, once. */}
        <div data-slot="app-frame-announcer" role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {said}
        </div>
        </AppFrameAnnounceContext.Provider>
      </AppFrameContext.Provider>
    </div>
  )
}

/** Where the frame puts its toasts, in px from its own box (C6). `width` only on a phone. */
interface ToastBox {
  left: number
  width: number | null
  bottom: number
  top: number
}

/** The page gutters (24, 48 from the wide width) and the sidebar's space to the content: the spacing scale. */
const GUTTER = 24
const GUTTER_WIDE = 48
/** The shrink knobs' values without the stylesheet (C8): sidebar 204, rail 48, list 320, gap 24, detail 480. */
const SHRINK_FALLBACK = { sidebarWidth: 204, railWidth: 48, listMin: 320, gap: 24, detailMin: 480 }

/* ── Content ─────────────────────────────────────────────────────────────────────────────────── */

/**
 * The content. Holds the columns: `AppFrameList`, `AppFrameDetail`, `AppFrameColumn`, and beside
 * them `AppFrameSidePanel`, `ContextPanel`, `AppFrameCompanion`; `AppFramePeek` lays over them.
 *
 * On a phone it fills the screen under the floating chrome (each column scrolls under it, padded
 * clear of it). On a desktop it sits under the status line, 24 below its rule and 24 above the
 * screen's foot, and its columns stand side by side with a rule between them, as the frames draw.
 */
function AppFrameMain({ className, children, ...props }: React.ComponentProps<"main">) {
  const frame = useAppFrame()
  const { setMainArea } = frame
  const [el, setEl] = React.useState<HTMLElement | null>(null)
  React.useLayoutEffect(() => {
    if (!el) return
    setMainArea(el)
    return () => setMainArea(null)
  }, [el, setMainArea])
  return (
    <main
      ref={setEl}
      data-slot="app-frame-main"
      data-layout={frame.layout}
      className={cn("min-h-0 min-w-0", frame.phone ? "absolute inset-0" : "flex [grid-area:main]", className)}
      {...props}
    >
      <div
        // A book-pose fold: the stylesheet's FoldPanes grid puts the first column on one side and
        // the last on the other, with the hinge between.
        data-slot={frame.foldBook && !frame.phone ? "fold-panes" : "app-frame-columns"}
        data-split={frame.foldBook && !frame.phone ? "columns" : undefined}
        className={cn("relative flex h-full min-h-0 min-w-0 flex-1", !frame.phone && "py-6")}
      >
        {children}
      </div>
    </main>
  )
}

type ColumnKind = "side" | "content"

interface ColumnContextValue {
  /** The column shows now (a pushed-away list is still mounted, but not shown). */
  shown: boolean
}

const ColumnContext = React.createContext<ColumnContextValue | null>(null)

/**
 * The room a desktop content column keeps past the content line when it is the last one: 16 of the
 * page gutter (24 at least), taken with a negative margin and given back as padding. A fixed-width
 * column adds the same 16 to its width (`AppFrameDetail size="narrow"`).
 */
const LAST_COLUMN_ROOM = "last:-me-4 last:pe-4"

/** Whether the column the part sits in is showing. True outside a column. */
export function useAppFrameColumnShown(): boolean {
  return React.useContext(ColumnContext)?.shown ?? true
}

/**
 * The classes and behaviour every column shares. A column shown on a phone scrolls under the
 * floating chrome and drives its minimize; a column not shown stays mounted (its scroll place and
 * its state survive) but is invisible and inert. On a desktop, a column that follows a shown one
 * draws the rule at its start; the padding to the rule is 12 on a side column (a list, a panel)
 * and 24 on a content column, as the frames draw (Vale: list to x 708, rule at 720, detail at 744).
 * The last content column keeps room past the content line (`LAST_COLUMN_ROOM`).
 */
function useColumn(kind: ColumnKind, shown: boolean, onRefresh?: () => unknown) {
  const frame = useAppFrame()
  const [el, setEl] = React.useState<HTMLElement | null>(null)
  const { setScroller } = frame
  const drives = frame.phone && shown
  // Pull to refresh (C9): on the phone's shown column only, the frame's main scroller there.
  const pull = usePullToRefresh(el, { onRefresh, enabled: drives })

  React.useLayoutEffect(() => {
    if (!drives || !el) return
    setScroller(el)
    return () => setScroller(null)
  }, [drives, el, setScroller])

  const className = cn(
    "min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain",
    frame.phone
      ? cn(
          "absolute inset-0",
          // Clear of the floating chrome; a focused field scrolls clear of it too.
          "pt-(--app-frame-top-clear) pb-(--app-frame-bottom-clear) scroll-pt-(--app-frame-top-clear) scroll-pb-(--app-frame-bottom-clear)",
          // The short screen's trailing column: 16 + 48 + 16.
          frame.layout === "rail" && "pe-20",
          // At the top a finger pulling down is the pull's, not the browser's bounce; zoom stays (C9).
          pull.active && "data-pull-ready:touch-pan-x data-pull-ready:touch-pan-down data-pull-ready:touch-pinch-zoom",
          // Let go: the content goes back on the state role (snaps under reduced motion).
          pull.active && "data-pull-release:transition-transform data-pull-release:duration-(--motion-state) data-pull-release:ease-(--motion-ease-move)"
        )
      : cn(
          "h-full pt-2",
          !shown && "absolute inset-y-6 start-0 w-full",
          kind === "side"
            ? "pe-3 [[data-column][data-shown]+&]:ps-3 [[data-column][data-shown]+&]:rule-l"
            : "has-[+[data-column][data-shown]]:pe-6 [[data-column][data-shown]+&]:ps-6 [[data-column][data-shown]+&]:rule-l",
          // The last content column ends at the content line, and its own clip (overflow-x) would
          // end there too: a row action that reaches past the row's end (a Field Row's Copy, the
          // trailing ⋯) and any focus ring at that edge would be cut. So its box keeps 16 of the
          // page gutter (the action's 12 and the ring's 4); the content is exactly as wide as before.
          kind === "content" && shown && LAST_COLUMN_ROOM
        ),
    !shown && "pointer-events-none invisible"
  )

  return {
    attach: setEl,
    className,
    attrs: {
      "data-column": kind,
      "data-shown": shown ? "" : undefined,
      inert: !shown || undefined,
      "aria-hidden": shown ? undefined : true,
      "aria-busy": pull.state === "busy" || undefined,
    },
    context: { shown },
    /** The mark a pull shows in its gap; render it first in the column. */
    pullMark: pull.active ? <AppFramePullMark state={pull.state} reduced={pull.reduced} /> : null,
  }
}

/** A list or a detail says it is there while mounted, so the frame's shrink order applies (C8). */
function useSplitPart(part: "list" | "detail") {
  const { registerSplitPart } = useAppFrame()
  React.useLayoutEffect(() => registerSplitPart(part), [part, registerSplitPart])
}

/** What every column takes for pull to refresh (C9). */
export interface AppFrameRefreshProps {
  /**
   * On a phone, a pull down from the top of this column past 64 runs it (contract 5.1c C9). Return
   * a promise to keep the column `aria-busy` until it settles, and show the app's live status in the
   * status strip meanwhile. It is a gesture: keep a plain "Check again" action too (decisions §8).
   */
  onRefresh?: () => unknown
}

export type AppFrameListSize = "default" | "narrow" | "fill"

export type AppFrameListProps = React.ComponentProps<"section"> &
  AppFrameRefreshProps & {
  /**
   * `default`: 432 beside the detail (the sidebar apps; 320 in an expanded window under 1280).
   * `narrow`: 270 (Warpcore's chat list). `fill`: the list takes the room and the detail is narrow
   * (Warpcore's Tasks and Docs).
   */
  size?: AppFrameListSize
}

/**
 * The list column. At the expanded width it stands beside the detail; narrower, it is the screen
 * until a detail is pushed over it (`AppFrameDetail open`), and it comes back with its scroll place.
 * Name it (`aria-label`) when the page has more than one list.
 */
function AppFrameList({ size = "default", onRefresh, className, children, ...props }: AppFrameListProps) {
  const frame = useAppFrame()
  useSplitPart("list")
  const shown = frame.split ? !frame.focus : !frame.detailOpen
  const { attach, className: columnClass, attrs, context, pullMark } = useColumn("side", shown, onRefresh)
  const wide = frame.width === "wide" || frame.width === "ultrawide"
  return (
    <ColumnContext.Provider value={context}>
      <section
        ref={attach}
        data-slot="app-frame-list"
        data-size={size}
        {...attrs}
        className={cn(
          columnClass,
          !frame.phone && frame.split && shown && (size === "fill" ? "flex-1" : "shrink-0"),
          !frame.phone && frame.split && size === "default" && (wide ? "w-[calc(var(--c-app-frame-list)+--spacing(3))]" : "w-[calc(var(--c-app-frame-list-compact)+--spacing(3))]"),
          !frame.phone && frame.split && size === "narrow" && "w-[calc(var(--c-app-frame-list-narrow)+--spacing(3))]",
          !frame.phone && !frame.split && shown && "flex-1",
          className
        )}
        {...props}
      >
        {pullMark}
        {children}
      </section>
    </ColumnContext.Provider>
  )
}

export type AppFrameDetailProps = React.ComponentProps<"section"> &
  AppFrameRefreshProps & {
  /**
   * Something is open. Narrower than expanded the detail is then pushed over the list; at the
   * expanded width it always stands beside it (show "Nothing open." when nothing is, decisions §9).
   */
  open?: boolean
  /**
   * The way back from a pushed detail. At medium width the frame puts it in the status line's
   * leading slot (decisions §14); on a phone the app's `TopBar` takes it.
   */
  onBack?: () => void
  /** The back button's name. Default "Back". */
  backLabel?: string
  /** `fill` (default): the detail takes the room. `narrow`: 534 beside a list that fills (Warpcore). */
  size?: "fill" | "narrow"
}

/** The detail column: what is open, beside the list or pushed over it. */
function AppFrameDetail({ open = false, onBack, backLabel = "Back", size = "fill", onRefresh, className, children, ...props }: AppFrameDetailProps) {
  const frame = useAppFrame()
  useSplitPart("detail")
  const shown = frame.split || open
  const { attach, className: columnClass, attrs, context, pullMark } = useColumn("content", shown, onRefresh)
  const { setDetailOpen, setBack } = frame
  const pushed = !frame.split && open

  React.useLayoutEffect(() => {
    setDetailOpen(pushed)
    return () => setDetailOpen(false)
  }, [pushed, setDetailOpen])

  const latestBack = React.useRef(onBack)
  React.useLayoutEffect(() => {
    latestBack.current = onBack
  })
  const hasBack = Boolean(onBack)
  React.useLayoutEffect(() => {
    if (!pushed || !hasBack) return
    setBack({ label: backLabel, onBack: () => latestBack.current?.() })
    return () => setBack(null)
  }, [pushed, hasBack, backLabel, setBack])

  return (
    <ColumnContext.Provider value={context}>
      <section
        ref={attach}
        data-slot="app-frame-detail"
        data-size={size}
        data-pushed={pushed ? "" : undefined}
        {...attrs}
        className={cn(
          columnClass,
          !frame.phone &&
            shown &&
            (frame.split && size === "narrow"
              ? // 24 to the rule at its start; as the last column, 16 more for the room past the content line.
                "w-[calc(var(--c-app-frame-detail-narrow)+--spacing(6))] last:w-[calc(var(--c-app-frame-detail-narrow)+--spacing(10))] shrink-0"
              : "flex-1"),
          className
        )}
        {...props}
      >
        {pullMark}
        {children}
      </section>
    </ColumnContext.Provider>
  )
}

export type AppFrameColumnProps = React.ComponentProps<"section"> &
  AppFrameRefreshProps & {
  /** Center the content in the reading column (720 at most). */
  reading?: boolean
}

/**
 * A content column that is always the screen: a page with one column (Search, Spend, Overview), or
 * the conversation between a chat list and a context panel. It fills the room.
 */
function AppFrameColumn({ reading = false, onRefresh, className, children, ...props }: AppFrameColumnProps) {
  const frame = useAppFrame()
  const { attach, className: columnClass, attrs, context, pullMark } = useColumn("content", true, onRefresh)
  return (
    <ColumnContext.Provider value={context}>
      <section
        ref={attach}
        data-slot="app-frame-column"
        {...attrs}
        className={cn(columnClass, !frame.phone && "flex-1", className)}
        {...props}
      >
        {pullMark}
        {reading ? <AppFrameReading>{children}</AppFrameReading> : children}
      </section>
    </ColumnContext.Provider>
  )
}

/** The reading column: centred, 720 at most (UX Patterns: 720 to 768), the phone's 16 on each side. */
function AppFrameReading({ className, ...props }: React.ComponentProps<"div">) {
  const frame = useAppFrame()
  return (
    <InsetContext.Provider value={true}>
      <div
        data-slot="app-frame-reading"
        className={cn("mx-auto w-full max-w-(--c-app-frame-reading)", frame.phone && "px-4", className)}
        {...props}
      />
    </InsetContext.Provider>
  )
}

/** Inside an inset (or the reading column) the phone's 16 is already kept. */
const InsetContext = React.createContext(false)

export type AppFrameInsetProps = React.ComponentProps<"div"> & {
  /**
   * Fill the column's height as a column of its own, so the last thing in it can sit at the
   * column's foot (Vale's reply field, Warpcore's needs-you block): give that thing `mt-auto`, or
   * let a child grow.
   */
  fill?: boolean
}

/**
 * Content that is not a full-bleed row: on a phone it keeps the 16 from the screen's edges the
 * frames draw (the page head, a chip row, a form); on a desktop the column's own edge is the line.
 */
function AppFrameInset({ fill = false, className, ...props }: AppFrameInsetProps) {
  const frame = useAppFrame()
  const nested = React.useContext(InsetContext)
  return (
    <InsetContext.Provider value={true}>
      <div data-slot="app-frame-inset" className={cn(frame.phone && !nested && "px-4", fill && "flex min-h-full flex-col", className)} {...props} />
    </InsetContext.Provider>
  )
}

/**
 * The page head of a column: `PageHead`, with the space the frames draw around it, and wired to the
 * phone's chrome. While its column shows, its title (and switcher) is the small centred title the
 * top row shows once the page has scrolled; on a short screen it draws in that collapsed form.
 */
function AppFramePageHead({ title, switcher, collapsed, className, ...props }: PageHeadProps) {
  const frame = useAppFrame()
  const shown = useAppFrameColumnShown()
  const { setHead } = frame
  const registers = frame.phone && shown

  const latest = React.useRef(switcher)
  React.useLayoutEffect(() => {
    latest.current = switcher
  })
  const switcherLabel = switcher?.label
  const swipes = Boolean(switcher?.onSwipe)
  const popup = switcher?.["aria-haspopup"]

  React.useLayoutEffect(() => {
    if (!registers) return
    setHead({
      title,
      // The latest handlers, through a stable object: the head's own props change every render.
      switcher:
        switcherLabel !== undefined
          ? {
              label: switcherLabel,
              "aria-haspopup": popup,
              onClick: (event) => latest.current?.onClick?.(event),
              onSwipe: swipes ? (direction) => latest.current?.onSwipe?.(direction) : undefined,
            }
          : undefined,
    })
    return () => setHead(null)
  }, [registers, title, switcherLabel, swipes, popup, setHead])

  const inset = React.useContext(InsetContext)
  return (
    <div data-slot="app-frame-page-head" className={cn(frame.phone ? cn("pb-4", !inset && "px-4") : "pb-8", className)}>
      <PageHead title={title} switcher={switcher} collapsed={collapsed ?? frame.layout === "rail"} {...props} />
    </div>
  )
}

/* ── Beside the detail ───────────────────────────────────────────────────────────────────────── */

export type AppFrameSidePanelProps = Omit<React.ComponentProps<"aside">, "title"> & {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Its name: the panel's label, and the sheet's title when it is one. */
  title: string
  /**
   * What the content column must keep beside it for the panel to stand as a column: `room`, 960
   * (Vale 3.2: a panel beside a message), or `detail`, the least a detail gets, 480 (Synapse's
   * activity beside the overview).
   */
  minContent?: "room" | "detail"
}

/**
 * A third column beside the detail (Vale's sender panel, Synapse's activity), 312 wide, with a
 * rule at its start. It stands as a column only when the content keeps `minContent` beside it;
 * with less room, and on a phone, it is a sheet from the side.
 */
function AppFrameSidePanel({ open, onOpenChange, title, minContent = "room", className, children, ...props }: AppFrameSidePanelProps) {
  const frame = useAppFrame()
  const [el, setEl] = React.useState<HTMLElement | null>(null)
  const [anchor, setAnchor] = React.useState<HTMLSpanElement | null>(null)
  const [room, setRoom] = React.useState(true)

  // The room is measured on the columns: what the content column would keep with the panel beside it.
  React.useLayoutEffect(() => {
    const probe = el ?? anchor
    const columns = probe?.parentElement
    if (!columns || frame.phone || !frame.split) return
    const measure = () => {
      const panel = readLength(columns, "--c-app-frame-side-panel", 312) + 36
      const need = minContent === "detail" ? readLength(columns, "--c-app-frame-detail-min", 480) : readLength(columns, "--c-app-frame-side-panel-room", 960)
      let content = 0
      for (const child of Array.from(columns.children)) {
        if (child === el || child === anchor) continue
        if (child instanceof HTMLElement && child.dataset.column === "content" && child.dataset.shown !== undefined) content = child.getBoundingClientRect().width
      }
      const without = content + (el ? panel : 0)
      setRoom(without - panel >= need)
    }
    measure()
    if (typeof ResizeObserver !== "function") return
    const observer = new ResizeObserver(measure)
    observer.observe(columns)
    return () => observer.disconnect()
  }, [el, anchor, frame.phone, frame.split, minContent])

  const asColumn = !frame.phone && frame.split && room
  if (asColumn) {
    if (!open) return null
    return (
      <aside
        ref={setEl}
        data-slot="app-frame-side-panel"
        data-column="side"
        data-shown=""
        aria-label={title}
        className={cn(
          "h-full w-[calc(var(--c-app-frame-side-panel)+--spacing(3))] min-h-0 shrink-0 overflow-y-auto pt-2 [[data-column][data-shown]+&]:ps-3 [[data-column][data-shown]+&]:rule-l",
          className
        )}
        {...props}
      >
        {children}
      </aside>
    )
  }
  return (
    <>
      {/* Holds the panel's place among the columns, so the room is still measured. */}
      <span ref={setAnchor} hidden />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" aria-label={title}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div data-slot="app-frame-side-panel" className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export type AppFramePeekProps = Omit<React.ComponentProps<"aside">, "title"> & {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The item's name: the peek's heading and its label. */
  title: string
  /** The kind, as the overline ("Check // K-14"). */
  overline?: React.ReactNode
  /** In the head before close: "Open in Checks" (a text Button with `launch`), an overflow menu, a back button. */
  actions?: React.ReactNode
  /** The close button's name. Default "Close". */
  closeLabel?: string
}

/**
 * A peek (Synapse Y-03, contract 5.1b #10): an item of another section, laid over the right 648
 * of the content with no scrim. It is not modal: the page under it stays usable, and picking
 * another row changes it. Esc closes it; focus moves to its heading when it opens. Narrower than
 * expanded it is a pushed screen.
 */
function AppFramePeek({ open, onOpenChange, title, overline, actions, closeLabel = "Close", className, children, onKeyDown, ...props }: AppFramePeekProps) {
  const frame = useAppFrame()
  const headingId = React.useId()
  const heading = React.useRef<HTMLHeadingElement>(null)

  React.useEffect(() => {
    if (open) heading.current?.focus()
  }, [open, title])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      // A dialog or menu over the page takes its own Esc.
      if ((event.target as Element | null)?.closest?.("[role=dialog],[role=menu],[role=listbox]")) return
      onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  if (!open) return null
  const over = frame.split && !frame.phone
  return (
    <aside
      data-slot="app-frame-peek"
      aria-labelledby={headingId}
      className={cn(
        "z-10 flex min-h-0 flex-col bg-surface-ground",
        over
          ? "absolute inset-y-6 end-0 w-[calc(var(--c-app-frame-detail)+--spacing(6))] ps-6 pt-2 rule-l"
          : frame.phone
            ? cn("absolute inset-0 pt-(--app-frame-top-clear) pb-(--app-frame-bottom-clear)", frame.layout === "rail" && "pe-20")
            : "absolute inset-0 py-6",
        className
      )}
      onKeyDown={onKeyDown}
      {...props}
    >
      <div data-slot="app-frame-peek-head" className={cn("flex items-start gap-3 pb-6", frame.phone && "px-4")}>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {overline ? <p className="type-overline text-text-label">{overline}</p> : null}
          <h2 ref={heading} id={headingId} tabIndex={-1} className="type-title min-w-0 text-text-body outline-none">
            {title}
          </h2>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        <FloatButton label={closeLabel} icon="close" onClick={() => onOpenChange(false)} />
      </div>
      <div data-slot="app-frame-peek-body" className={cn("min-h-0 flex-1 overflow-y-auto", frame.phone && "px-4")}>
        {children}
      </div>
    </aside>
  )
}

const BESIDE_FALLBACK = 696
const BESIDE_MIN_FALLBACK = 480

/* ── The companion pane (was AppFrameDetail) ─────────────────────────────────────────────────── */

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

export type AppFrameCompanionProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** What belongs to the content (a conversation's documents, an artifact): the pane's body. */
  detail: React.ReactNode
  /** Remembers where the line between the two was dragged. */
  id?: string
  children: React.ReactNode
}

/**
 * The resizable companion pane (contract 5.1b #10): what belongs to the content, beside the
 * content: a conversation's documents, an artifact. Unlike the detail it is not another item; it
 * changes with what is open. Where it goes follows `viewport.detailPlacement`:
 *
 * - `beside`: shares the width, with a line to drag (and arrow keys on it); `id` remembers where
 *   the line was. It starts at the beside width (696) and keeps 480 at least.
 * - `fold`: takes the far side of a book-pose fold, always, since the content alone would straddle
 *   it. There's nothing to close, so check the placement before offering a button that opens it.
 * - `sheet`: slides over, covering the screen on a phone. It takes over focus until dismissed, so
 *   an app that remembers `open` for `beside` should start this one closed.
 *
 * `children` stays mounted while this opens and closes, so a scroll position or a reply survives it.
 * It does remount when the placement itself changes, as on a rotation, so keep state that matters above.
 */
function AppFrameCompanion({ open, onOpenChange, title, detail, id = "app-frame-companion", children }: AppFrameCompanionProps) {
  const { detailPlacement, widthClass, short } = useViewport()
  const covers = widthClass === "compact" || short
  // The pane's sizes are knobs; the panes library takes pixels, so they are read once from the page.
  const [sizes] = React.useState(() => {
    const root = typeof document === "undefined" ? null : document.documentElement
    return {
      beside: root ? readLength(root, "--c-app-frame-beside", BESIDE_FALLBACK) : BESIDE_FALLBACK,
      min: root ? readLength(root, "--c-app-frame-beside-min", BESIDE_MIN_FALLBACK) : BESIDE_MIN_FALLBACK,
    }
  })
  const panelIds = React.useMemo(() => (open ? ["main", "detail"] : ["main"]), [open])
  const { defaultLayout, onLayoutChanged } = useResizablePanesLayout({ id, panelIds })

  const main = (
    <div data-slot="app-frame-companion-main" className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {children}
    </div>
  )
  const body = (
    <div data-slot="app-frame-companion-body" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
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
    <aside aria-label={title} data-slot="app-frame-companion" className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-surface-ground ps-6 rule-l">
      <div data-slot="app-frame-companion-head" className="flex shrink-0 items-center justify-between gap-2 pb-4">
        <h2 className="type-subtitle min-w-0 truncate text-text-body">{title}</h2>
        {closable && <FloatButton label={`Close ${title}`} icon="close" onClick={() => onOpenChange(false)} />}
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
          <ResizableHandle label={`Resize ${title}`} withGrip={isExpandedWidth(widthClass)} />
          <ResizablePane id="detail" defaultSize={`${sizes.beside}px`} minSize={`${sizes.min}px`}>
            {panel(true)}
          </ResizablePane>
        </>
      )}
    </ResizablePanes>
  )
}

export {
  AppFrame,
  AppFrameColumn,
  AppFrameCompanion,
  AppFrameDetail,
  AppFrameInset,
  AppFrameList,
  AppFrameMain,
  AppFramePageHead,
  AppFramePeek,
  AppFrameReading,
  AppFrameSidePanel,
  FoldPanes,
}

// The frame's parts live beside it; they are one family, and one import.
// The frame's state for apps; the context objects and the helpers the parts share stay inside.
export {
  MINIMIZE_RESTORE_AT,
  frameLayoutFor,
  isExpandedWidth,
  isPhoneLayout,
  nextMinimized,
  shrinkFor,
  stripStateFor,
  toastPlacementFor,
  useAppFrame,
  useScrollMinimize,
  type AppFrameBack,
  type AppFrameContextValue,
  type AppFrameHead,
  type AppFrameLayout,
  type AppFrameShrink,
  type AppFrameStripState,
  type AppFrameToastPlacement,
  type ScrollMinimizeOptions,
  type ShrinkInput,
} from "./app-frame-context"
export { pullOffsetFor, usePullToRefresh, type PullState, type PullToRefreshOptions } from "./app-frame-pull"
export * from "./app-frame-phone"
export * from "./app-frame-desktop"
export * from "./app-frame-focus"
// Deprecated 0.x names (the capsule): kept compiling until the apps and the showcase move off them.
export * from "./app-frame-deprecated"
