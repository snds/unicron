// Promoted from: snds/warpcore · PR snds/unicron#68 · DSA none
"use client"

import { useSyncExternalStore } from "react"

/**
 * Minimum widths in CSS pixels, widest first. They are Tailwind's `sm`, `md` and `xl`, plus the
 * `ultrawide` breakpoint in the stylesheet, so a class and this hook always agree.
 *
 * The measured sizes these were checked against, width × height:
 *   iPhone 382–440 × 620–956, or 660–956 × 375–440 turned sideways.
 *   iPhone Duo folded 382 × 580 and 594 × 368; open 669 × 867 and 951 × 585; two windows 385 × 571.
 *   iPad 744–1024 × 1133–1366 either way round.
 * (Duo sizes: Safari's, from https://webkit.org/blog/18486/webkit-features-for-safari-27-1/)
 */
export const VIEWPORT_WIDTHS = [
  { name: "ultrawide", minWidth: 2560 },
  { name: "wide", minWidth: 1280 },
  { name: "expanded", minWidth: 768 },
  { name: "medium", minWidth: 640 },
  { name: "compact", minWidth: 0 },
] as const

export type ViewportWidth = (typeof VIEWPORT_WIDTHS)[number]["name"]

/** Under this height, turned sideways, a screen is "short". The `short:` variant uses the same line. */
export const SHORT_HEIGHT = 480
/** A keyboard is taller than this. A hardware keyboard's little accessory bar isn't. */
const KEYBOARD_MIN_HEIGHT = 120
/** With a keyboard up, less room than these leaves no space for an app's bars. */
const TIGHT_HEIGHT = 560
const MINIMAL_HEIGHT = 400

/**
 * - `book`: folded along a vertical line, so there's a left and a right part.
 * - `tabletop`: folded along a horizontal line, so there's a top and a bottom part, like a laptop.
 *
 * Null when flat or closed, including a foldable lying fully open: its crease doesn't split anything.
 */
export type ViewportFold = { kind: "book" | "tabletop"; sizes: number[] } | null

/** How much room is left around a keyboard. `full` whenever no keyboard is up. */
export type ViewportRoom = "full" | "tight" | "minimal"

export type Viewport = {
  width: number
  /** The height without any keyboard. Layout decisions use this, so they don't flip while typing. */
  height: number
  /** What can be seen right now: `height`, less any keyboard. */
  visibleHeight: number
  /** Which width class this is. Decide what to show from this, never from the device. */
  widthClass: ViewportWidth
  landscape: boolean
  /** Sideways and under `SHORT_HEIGHT`: height is what's scarce. A phone in landscape, or a folded Duo. */
  short: boolean
  keyboardOpen: boolean
  /** How far a keyboard covers the page, for a frame to keep clear of it. */
  keyboardInset: number
  /** How far iOS has panned the page to show a focused field. */
  offsetTop: number
  room: ViewportRoom
  fold: ViewportFold
}

export function viewportWidthFor(width: number): ViewportWidth {
  for (const w of VIEWPORT_WIDTHS) if (width >= w.minWidth) return w.name
  return "compact"
}

export type ViewportReading = {
  width: number
  height: number
  /** visualViewport's height and offsetTop. iOS leaves the page's height alone under a keyboard. */
  visualHeight: number
  visualOffsetTop: number
  /** A touch keyboard could be up: a text field has focus, on a touch screen. */
  typing: boolean
  fold: ViewportFold
}

/**
 * Pure, so every form factor can be tested without one. `previous` is how a keyboard that resizes
 * the page (Android) is told from a smaller window: the width stays, the height drops, and someone
 * is typing.
 */
export function classifyViewport(r: ViewportReading, previous: Viewport | null): Viewport {
  const sameWindow = previous !== null && previous.width === r.width
  const height = r.typing && sameWindow ? Math.max(previous.height, r.height) : r.height

  const covered = Math.max(0, r.height - r.visualHeight - r.visualOffsetTop)
  const keyboardOpen = r.typing && (covered >= KEYBOARD_MIN_HEIGHT || height - r.height >= KEYBOARD_MIN_HEIGHT)
  const visibleHeight = keyboardOpen ? Math.min(r.visualHeight, r.height) : height

  const landscape = r.width >= height
  let room: ViewportRoom = "full"
  if (keyboardOpen) room = visibleHeight < MINIMAL_HEIGHT ? "minimal" : visibleHeight < TIGHT_HEIGHT ? "tight" : "full"

  return {
    width: r.width,
    height,
    visibleHeight,
    widthClass: viewportWidthFor(r.width),
    landscape,
    short: landscape && height < SHORT_HEIGHT,
    keyboardOpen,
    keyboardInset: keyboardOpen ? covered : 0,
    offsetTop: keyboardOpen ? r.visualOffsetTop : 0,
    room,
    fold: r.fold,
  }
}

function matches(query: string) {
  return window.matchMedia?.(query).matches ?? false
}

function isTextField(el: Element | null) {
  if (!el) return false
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLInputElement) return !/^(button|checkbox|color|file|image|radio|range|reset|submit)$/.test(el.type)
  return el instanceof HTMLElement && el.isContentEditable
}

function readFold(): ViewportFold {
  // Not in every browser. Safari 27.1 has it behind a flag, so this has to work without it.
  const kind = matches("(horizontal-viewport-segments: 2)") ? "book" : matches("(vertical-viewport-segments: 2)") ? "tabletop" : null
  if (!kind) return null
  const segments = (window as unknown as { viewport?: { segments?: DOMRectReadOnly[] | null } }).viewport?.segments ?? []
  return { kind, sizes: segments.map((s) => (kind === "book" ? s.width : s.height)) }
}

function sameViewport(a: Viewport, b: Viewport) {
  return (
    a.width === b.width &&
    a.height === b.height &&
    a.visibleHeight === b.visibleHeight &&
    a.keyboardOpen === b.keyboardOpen &&
    a.keyboardInset === b.keyboardInset &&
    a.offsetTop === b.offsetTop &&
    a.fold?.kind === b.fold?.kind &&
    a.fold?.sizes.join() === b.fold?.sizes.join()
  )
}

let current: Viewport | null = null

function read(): Viewport {
  const visual = window.visualViewport
  const next = classifyViewport(
    {
      width: window.innerWidth,
      height: window.innerHeight,
      visualHeight: visual?.height ?? window.innerHeight,
      visualOffsetTop: visual?.offsetTop ?? 0,
      typing: isTextField(document.activeElement) && matches("(pointer: coarse)"),
      fold: readFold(),
    },
    current
  )
  // The same object while nothing changed, so React doesn't re-render on every resize tick.
  if (!current || !sameViewport(current, next)) current = next
  return current
}

const SERVER_VIEWPORT: Viewport = {
  width: 1280,
  height: 800,
  visibleHeight: 800,
  widthClass: "wide",
  landscape: true,
  short: false,
  keyboardOpen: false,
  keyboardInset: 0,
  offsetTop: 0,
  room: "full",
  fold: null,
}

function subscribe(onChange: () => void) {
  // After a rotation iOS keeps reporting the old sizes for a moment, and sends no second event.
  const timers: ReturnType<typeof setTimeout>[] = []
  const settle = () => {
    onChange()
    for (const t of timers.splice(0)) clearTimeout(t)
    timers.push(setTimeout(onChange, 100), setTimeout(onChange, 400))
  }
  const visual = window.visualViewport
  const posture = (navigator as unknown as { devicePosture?: EventTarget }).devicePosture
  // Bending a device can change the segments with no resize at all.
  const folds = ["(horizontal-viewport-segments: 2)", "(vertical-viewport-segments: 2)"].map((q) => window.matchMedia?.(q))

  for (const fold of folds) fold?.addEventListener?.("change", settle)
  window.addEventListener("resize", onChange)
  window.addEventListener("orientationchange", settle)
  window.addEventListener("pageshow", settle)
  document.addEventListener("focusin", onChange)
  document.addEventListener("focusout", onChange)
  visual?.addEventListener("resize", onChange)
  visual?.addEventListener("scroll", onChange)
  posture?.addEventListener("change", settle)
  return () => {
    for (const t of timers) clearTimeout(t)
    for (const fold of folds) fold?.removeEventListener?.("change", settle)
    window.removeEventListener("resize", onChange)
    window.removeEventListener("orientationchange", settle)
    window.removeEventListener("pageshow", settle)
    document.removeEventListener("focusin", onChange)
    document.removeEventListener("focusout", onChange)
    visual?.removeEventListener("resize", onChange)
    visual?.removeEventListener("scroll", onChange)
    posture?.removeEventListener("change", settle)
  }
}

/**
 * The space an app actually has: width class, short screens, a keyboard, a fold. Use it when a size
 * decides what to render. When it only decides how something looks, use the `short:`, `fold-book:`
 * and `fold-tabletop:` variants instead, which don't need a render.
 */
export function useViewport(): Viewport {
  return useSyncExternalStore(subscribe, read, () => SERVER_VIEWPORT)
}
