// Owned component (not generated): the AppFrame's shared state: which shell the width picks, the phone's scroll-minimize state, and what the frame parts tell each other.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.2; no app PR, no DSA record)
"use client"

import * as React from "react"

import { classifyViewport, useViewport, type Viewport, type ViewportWidth } from "../use-viewport"
import type { PageHeadSwitcher } from "./page-head"

/**
 * Which shell the frame draws. The width picks it; a short screen overrides it (Warpcore U-03,
 * decisions §14), up to the expanded width:
 *
 * - `phone`: compact (under 600). The floating top row, the bottom row with the tab bar, the
 *   status strip, the scroll-minimize, the scroll edges.
 * - `rail`: height is scarce (a phone on its side, a folded Duo): the bottom row stands as a 48px
 *   column at the trailing edge, with the tab bar turned vertical. The content model is the phone's.
 * - `medium`: 600 to 1023. The desktop shell with one content column: the sidebar as its rail (or
 *   Warpcore's top bar), list and detail as pushed screens.
 * - `expanded`: 1024 and up. The full desktop shell with list + detail.
 */
export type AppFrameLayout = "phone" | "rail" | "medium" | "expanded"

/** A width class as the shell reads it: wide and ultrawide are expanded with more room. */
export function isExpandedWidth(width: ViewportWidth): boolean {
  return width === "expanded" || width === "wide" || width === "ultrawide"
}

/** The shell for a viewport (contract 5.2). A short screen under the expanded width takes the rail. */
export function frameLayoutFor(v: Pick<Viewport, "widthClass" | "navPlacement">): AppFrameLayout {
  if (isExpandedWidth(v.widthClass)) return "expanded"
  if (v.navPlacement === "rail") return "rail"
  return v.widthClass === "compact" ? "phone" : "medium"
}

/** A book-pose fold whose two halves can each hold a column. */
export function isBookFold(v: Pick<Viewport, "fold">): boolean {
  return v.fold?.kind === "book" && v.fold.sizes.length === 2
}

/** The phone's two shells share the content model: one screen at a time, floating chrome. */
export function isPhoneLayout(layout: AppFrameLayout): boolean {
  return layout === "phone" || layout === "rail"
}

/* ── Scroll minimize ─────────────────────────────────────────────────────────────────────────── */

/** Under this, the content counts as "back at the top": a fraction of a pixel, or iOS's rubber band. */
export const MINIMIZE_RESTORE_AT = 1
const MINIMIZE_FALLBACK = 64

/**
 * The scroll-minimize state machine (rules.md 6.5). Expanded, it minimizes once the content has
 * scrolled past `threshold`; minimized, it stays so until the content is back at the top. So a
 * small scroll back up never makes the chrome jump, and the two never flicker at the line.
 */
export function nextMinimized(minimized: boolean, scrollTop: number, threshold: number): boolean {
  return minimized ? scrollTop > MINIMIZE_RESTORE_AT : scrollTop > threshold
}

/** A size token read off the element, in px, or the fallback without the stylesheet. */
export function readLength(el: Element, name: string, fallback: number): number {
  if (typeof getComputedStyle !== "function") return fallback
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const match = /^([\d.]+)(px|rem)$/.exec(raw)
  if (!match) return fallback
  const n = Number.parseFloat(match[1])
  if (!Number.isFinite(n)) return fallback
  return match[2] === "px" ? n : n * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
}

export interface ScrollMinimizeOptions {
  /** Scrolled past this many px, the chrome minimizes. Default: `--c-app-frame-minimize-threshold` (64). */
  threshold?: number
  /** Off: always expanded (a desktop layout, a screen with nothing to minimize). */
  enabled?: boolean
}

/**
 * Watches a scroller and says whether the phone's chrome is minimized: the large title has gone
 * under the top row, the wordmark hides, the tab bar shrinks to the active tab, the strip joins
 * the bottom row and a hairline shows under the top row. It reverses back at the top.
 *
 * Pass the element (or null while there is none). The frame runs this on whichever column shows;
 * an app with its own scroller can run it too.
 */
export function useScrollMinimize(scroller: HTMLElement | null, { threshold, enabled = true }: ScrollMinimizeOptions = {}): boolean {
  // The machine's state lives with the subscription: the scroller is the store, scroll its change.
  const state = React.useRef(false)
  const subscribe = React.useCallback(
    (notify: () => void) => {
      if (!scroller || !enabled) {
        state.current = false
        return () => {}
      }
      const line = threshold ?? readLength(scroller, "--c-app-frame-minimize-threshold", MINIMIZE_FALLBACK)
      // A screen that was already scrolled (a column coming back into view) starts where it is.
      state.current = scroller.scrollTop > line
      const onScroll = () => {
        const next = nextMinimized(state.current, scroller.scrollTop, line)
        if (next === state.current) return
        state.current = next
        notify()
      }
      scroller.addEventListener("scroll", onScroll, { passive: true })
      return () => scroller.removeEventListener("scroll", onScroll)
    },
    [scroller, threshold, enabled]
  )
  const read = React.useCallback(() => state.current, [])
  const minimized = React.useSyncExternalStore(subscribe, read, () => false)
  return enabled && scroller ? minimized : false
}

/* ── List + detail shrink order (contract 5.1c C8) ─────────────────────────────────────────── */

/**
 * What a list + detail screen gives up when its content is narrower than the list's least width,
 * the gap and the detail's least width (320 + 24 + 480 = 824, knobs): first the sidebar shows as
 * its rail (`rail`); narrower still, the detail is pushed over the list as at medium width (`push`).
 */
export type AppFrameShrink = "none" | "rail" | "push"

export interface ShrinkInput {
  /** The frame's width (the window, or a contained frame's box), in px. */
  width: number
  /** The page gutter on each side: 24, or 48 from the wide width. */
  gutter: number
  /** The sidebar: none (Warpcore's top bar), shown full, or collapsed to its rail by choice. */
  sidebar: "none" | "full" | "rail"
  /** The sidebar's full and rail widths, and the space between it and the content (24). */
  sidebarWidth: number
  railWidth: number
  sidebarGap: number
  /** The least list, the gap between list and detail, and the least detail: 320, 24, 480. */
  listMin: number
  gap: number
  detailMin: number
}

/** The shrink step for a width: the sidebar's rail first, then the pushed detail (C8). Pure, for tests. */
export function shrinkFor(input: ShrinkInput): AppFrameShrink {
  const { width, gutter, sidebar, sidebarWidth, railWidth, sidebarGap, listMin, gap, detailMin } = input
  const need = listMin + gap + detailMin
  const content = (side: "none" | "full" | "rail") =>
    width - 2 * gutter - (side === "none" ? 0 : (side === "full" ? sidebarWidth : railWidth) + sidebarGap)
  if (content(sidebar) >= need) return "none"
  if (sidebar === "full" && content("rail") >= need) return "rail"
  // Narrower still: the detail is pushed, and the sidebar (if any) stays its rail, as at medium width.
  return "push"
}

/* ── The status strip and the toasts (contract 5.1c C6) ────────────────────────────────────────── */

/**
 * What the phone's status strip means for a toast (the frame tells the Toaster):
 *
 * - `none`: no strip. A toast takes the strip's slot above the bottom row.
 * - `live-action`: a strip with an action (undo send). It is never covered: toasts wait until it ends.
 * - `live`: a strip without an action (a sync running, the place strip). It gives way for the
 *   toast's time, then comes back.
 * - `needs-you`: a request that waits on the person (and a critical strip, which the person must be
 *   able to act on). It never gives way: the toast sits under the top row instead.
 */
export type AppFrameStripState = "none" | "live-action" | "live" | "needs-you"

/** A strip's state from its tone and whether it holds an action. */
export function stripStateFor(tone: "neutral" | "live" | "needs-you" | "critical" | undefined, hasAction: boolean): AppFrameStripState {
  if (tone === "needs-you" || tone === "critical") return "needs-you"
  return hasAction ? "live-action" : "live"
}

/**
 * Where a toast goes: `content` (the bottom left of the content, on a desktop), `strip` (the phone's
 * status-strip slot, just above the bottom row, so the bottom never holds three bars), `top` (under
 * the phone's top row), or `wait` (held back until the strip ends).
 */
export type AppFrameToastPlacement = "content" | "strip" | "top" | "wait"

export function toastPlacementFor(phone: boolean, strip: AppFrameStripState): AppFrameToastPlacement {
  if (!phone) return "content"
  if (strip === "needs-you") return "top"
  if (strip === "live-action") return "wait"
  return "strip"
}

/* ── One polite region (contract 5.1c C7) ──────────────────────────────────────────────────────── */

/**
 * The frame's one visually hidden polite region: status parts (StatusItem, Accessory) hand it a
 * stable sentence, so a screen reader is told once, not on every tick of a countdown.
 */
export const AppFrameAnnounceContext = React.createContext<((message: string) => void) | null>(null)

/**
 * Says `message` in the frame's polite region when it changes, and when the part first shows if
 * `onMount` (news: a strip that appears). Returns false outside a frame, where the part keeps a
 * polite region of its own.
 */
export function useFrameAnnouncement(message: string | null | undefined, onMount: boolean): boolean {
  const announce = React.useContext(AppFrameAnnounceContext)
  const said = React.useRef<string | null | undefined>(undefined)
  const ran = React.useRef(false)
  const news = React.useRef(onMount)
  React.useEffect(() => {
    if (!announce) return
    const first = !ran.current
    ran.current = true
    const before = said.current
    said.current = message
    if (!message || before === message) return
    // The first message is said only when the part's arrival is news; after that, every change.
    if (first && !news.current) return
    announce(message)
  }, [announce, message])
  return announce !== null
}

/* ── The frame's context ─────────────────────────────────────────────────────────────────────── */

/** What the page's head tells the phone chrome: the small title, and the switcher if the head is one. */
export interface AppFrameHead {
  title: string
  switcher?: PageHeadSwitcher
}

/** Where a bottom row lets the status strip sit: above it, and inside it once the page has scrolled. */
export interface AppFrameBottomSlots {
  variant: "tabs" | "detail"
  above: HTMLElement | null
  inside: HTMLElement | null
}

/** Nodes the frame draws for the short-screen column at the trailing edge. */
export interface AppFrameRailSlots {
  top: HTMLElement | null
  bottom: HTMLElement | null
}

export interface AppFrameBack {
  onBack: () => void
  label: string
}

export interface AppFrameContextValue {
  /** True inside an AppFrame; false for the fallback a part gets outside one. */
  framed: boolean
  layout: AppFrameLayout
  /** `phone` or `rail`. */
  phone: boolean
  /** The width class the layout came from (wide and ultrawide widen gutters and lists). */
  width: ViewportWidth
  /**
   * List and detail stand side by side: the expanded width, or a book-pose fold (each half holds
   * one). Otherwise the detail is a pushed screen.
   */
  split: boolean
  /** A book-pose fold divides the screen: the columns take one half each (the FoldPanes grid). */
  foldBook: boolean
  keyboardOpen: boolean
  /** The keyboard leaves too little room for the app's bars. */
  tight: boolean
  minimized: boolean
  /** The column showing now on a phone: it drives `minimized`. */
  setScroller: (el: HTMLElement | null) => void
  head: AppFrameHead | null
  setHead: (head: AppFrameHead | null) => void
  bottom: AppFrameBottomSlots | null
  setBottom: (slots: AppFrameBottomSlots | null) => void
  rail: AppFrameRailSlots
  /** A pushed detail is showing (phone, rail, medium): the list steps aside. */
  detailOpen: boolean
  setDetailOpen: (open: boolean) => void
  /** The way back from a pushed detail, for the status line's leading slot at medium width. */
  back: AppFrameBack | null
  setBack: (back: AppFrameBack | null) => void
  /** The detail has the room: the list is hidden while reading at length (Synapse Y-03 focus). */
  focus: boolean
  /** Measured chrome, so the content can keep clear of it (px). */
  setClearance: (edge: "top" | "bottom", px: number) => void
  /** The list + detail shrink step at this width (C8). `push` also makes `split` false. */
  shrink: AppFrameShrink
  /** The frame asks the sidebar to stand as its rail (C8): expanding it then opens the drawer, as at medium. */
  sidebarRail: boolean
  /** The sidebar says it is there, and whether it is collapsed by choice (null: gone). */
  setSidebar: (sidebar: { collapsed: boolean } | null) => void
  /** A list or a detail column says it is there, so the shrink order applies. Returns its removal. */
  registerSplitPart: (part: "list" | "detail") => () => void
  /** The phone's status strip, as a toast reads it (C6). */
  strip: AppFrameStripState
  setStrip: (id: string, state: AppFrameStripState | null) => void
  /** Toasts are showing: a `live` strip gives way meanwhile (C6). */
  toastShowing: boolean
  setToastShowing: (showing: boolean) => void
  /** The bottom row's bar, so the frame can place a toast just above it. */
  setBottomBar: (el: HTMLElement | null) => void
  /** The content's area on a desktop, so the frame can place a toast at its bottom left. */
  setMainArea: (el: HTMLElement | null) => void
}

const noop = () => {}

export const AppFrameContext = React.createContext<AppFrameContextValue | null>(null)

/** The frame's state. Outside an AppFrame, the shell the viewport picks, with nothing registered. */
export function useAppFrame(): AppFrameContextValue {
  const context = React.useContext(AppFrameContext)
  const viewport = useViewport()
  if (context) return context
  const layout = frameLayoutFor(viewport)
  return {
    framed: false,
    layout,
    phone: isPhoneLayout(layout),
    width: viewport.widthClass,
    split: layout === "expanded" || isBookFold(viewport),
    foldBook: isBookFold(viewport),
    keyboardOpen: viewport.keyboardOpen,
    tight: viewport.room !== "full",
    minimized: false,
    setScroller: noop,
    head: null,
    setHead: noop,
    bottom: null,
    setBottom: noop,
    rail: { top: null, bottom: null },
    detailOpen: false,
    setDetailOpen: noop,
    back: null,
    setBack: noop,
    focus: false,
    setClearance: noop,
    shrink: "none",
    sidebarRail: false,
    setSidebar: noop,
    registerSplitPart: () => noop,
    strip: "none",
    setStrip: noop,
    toastShowing: false,
    setToastShowing: noop,
    setBottomBar: noop,
    setMainArea: noop,
  }
}

/**
 * What the bottom row tells its tab bar: shrink to the active tab (the page has scrolled), and
 * stand vertical (the short screen's trailing column). Read by TabBar as the default for its
 * `minimized` and `orientation`, so a tab bar inside the app's own component follows the frame too.
 */
export const AppFrameTabBarContext = React.createContext<{ minimized: boolean; orientation: "horizontal" | "vertical" } | null>(null)

/**
 * The sidebar's collapsed state, read by NavSection and NavItem: inside a sidebar drawn as its
 * rail, every section draws its items as rail items, and a lone item (the pinned Settings) does too.
 */
export const AppFrameRailContext = React.createContext(false)

/**
 * The viewport a contained frame measures for itself (the playground, a preview), so its parts
 * switch on the box's size rather than the window's.
 */
export function useBoxViewport(el: HTMLElement | null, enabled: boolean): Viewport | null {
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null)
  React.useLayoutEffect(() => {
    if (!enabled || !el) return
    const read = () => {
      const box = el.getBoundingClientRect()
      setSize((prev) => (prev && prev.width === box.width && prev.height === box.height ? prev : { width: box.width, height: box.height }))
    }
    read()
    if (typeof ResizeObserver !== "function") return
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [el, enabled])
  return React.useMemo(() => {
    if (!enabled || !size || size.width === 0) return null
    return classifyViewport({ width: size.width, height: size.height, visualHeight: size.height, visualOffsetTop: 0, typing: false, fold: null }, null)
  }, [enabled, size])
}
