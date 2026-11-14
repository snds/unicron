// Owned component (not generated): text cut to one line (or a few) with an ellipsis, at the end or in the middle, that shows all of itself in a Tooltip on hover (at the pointer's spot, where it stays) and keyboard focus (from the element), and only when it is cut.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract §5.1a and §5.1b row 20, Synapse f-hovercard and SNA3, Lockdown X6; no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "../../lib/utils"
import { Tooltip, TooltipTrigger } from "./tooltip"

/** The mark a cut leaves: one ellipsis character. */
export const TRUNCATION_MARK = "…"

/**
 * The text with its middle replaced by an ellipsis, as long as `fits` allows: the start and the
 * end both kept, the end never shorter than the start by more than one character, so a path keeps
 * its file name and a host keeps its domain. Returns the text itself when it fits whole, and the
 * mark alone when nothing else fits. `fits` is asked O(log n) times.
 */
export function middleCut(text: string, fits: (candidate: string) => boolean): string {
  if (fits(text)) return text
  const chars = Array.from(text)
  let lo = 0
  let hi = chars.length - 1
  let best = TRUNCATION_MARK
  // How many characters to keep, around the mark.
  while (lo <= hi) {
    const keep = (lo + hi) >> 1
    const tail = Math.ceil(keep / 2)
    const head = keep - tail
    const candidate = chars.slice(0, head).join("") + TRUNCATION_MARK + (tail > 0 ? chars.slice(chars.length - tail).join("") : "")
    if (fits(candidate)) {
      best = candidate
      lo = keep + 1
    } else {
      hi = keep - 1
    }
  }
  return best
}

/** A canvas's text measure with the element's own font, or null where there is none (jsdom, SSR). */
function measurerFor(el: HTMLElement): ((s: string) => number) | null {
  if (typeof document === "undefined") return null
  let context: CanvasRenderingContext2D | null = null
  try {
    context = document.createElement("canvas").getContext("2d")
  } catch {
    return null
  }
  if (!context) return null
  const style = getComputedStyle(el)
  context.font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const spacing = Number.parseFloat(style.letterSpacing) || 0
  const ctx = context
  return (s) => ctx.measureText(s).width + spacing * Array.from(s).length
}

export type TruncatedTextCut = "end" | "middle"

export interface TruncatedTextProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The whole text. It is what assistive tech reads, cut or not. */
  children: string
  /**
   * How many lines before the cut: 1 by default. More than one clamps at the end (a row title at
   * two lines). A middle cut is always one line.
   */
  lines?: number
  /**
   * Where the ellipsis goes. `end` (the default) for words. `middle` for a path, a site, an
   * address or a host, whose end is what tells them apart (`~/code/…/src/app.tsx`).
   */
  cut?: TruncatedTextCut
  /**
   * Where the full text shows: above by default. Opened by the pointer, it sits on that side of
   * the spot where the pointer was, its start at the pointer; opened by keyboard focus, on that side
   * of the text, its start at the start of the text.
   */
  side?: "top" | "bottom"
  /** Another element to draw as (`<h3 />`, `<p />`). A span by default. */
  render?: React.ReactElement<Record<string, unknown>>
}

/** A point on the screen, as an anchor the tooltip can be placed against. */
function pointAnchor(x: number, y: number, contextElement: Element | null) {
  return {
    contextElement: contextElement ?? undefined,
    getBoundingClientRect: () => DOMRect.fromRect({ x, y, width: 0, height: 0 }),
  }
}

/**
 * TruncatedText: one line with an ellipsis (or `lines` lines, or a cut in the middle). When, and
 * only when, the text is cut, hovering it or focusing it from the keyboard shows the whole text in
 * a Tooltip: it joins the tab order then, and reads its whole text. Text that fits is plain text,
 * with no tooltip and no tab stop.
 *
 * Synapse's `f-hovercard` (contract 5.1c C17): from the pointer, the full text opens at the spot
 * where the pointer was when it opened and stays there while the pointer moves over the text; from
 * the keyboard, it opens from the element. On a touch screen, which has no hover, a tap on the cut
 * text opens it from the element; a second tap, a tap anywhere else, or a scroll puts it away.
 * It wraps between --c-truncated-text-min-width and
 * --c-truncated-text-max-width (never wider than the room the screen leaves) and reads from the
 * start of the line.
 *
 * It measures itself (a ResizeObserver), so it stays right as its column changes width. It takes
 * the type role and ink of where it sits; pass `render` to make it another element (`<h3 />`).
 */
function TruncatedText({ children: text, lines = 1, cut = "end", side = "top", render, className, style, ...props }: TruncatedTextProps) {
  const ref = React.useRef<HTMLElement>(null)
  const middle = cut === "middle"
  const clamp = !middle && lines > 1
  const [shown, setShown] = React.useState(text)
  const [truncated, setTruncated] = React.useState(false)
  // Where the pointer is while it rests on the text, and where it was when the full text opened.
  const pointer = React.useRef<{ x: number; y: number } | null>(null)
  const [openAt, setOpenAt] = React.useState<{ x: number; y: number; element: Element | null } | null>(null)
  const follow = (event: React.PointerEvent) => {
    pointer.current = event.pointerType === "touch" ? null : { x: event.clientX, y: event.clientY }
  }
  const anchor = React.useMemo(() => (openAt ? pointAnchor(openAt.x, openAt.y, openAt.element) : undefined), [openAt])
  // Open or not, held here so a tap can open it: a touch screen has no hover, and a tap's focus is
  // not a keyboard's, so without this a sighted person on a phone could never read the cut part.
  const [open, setOpen] = React.useState(false)
  // The press in hand: whether it is a finger, and whether the full text was open when it landed.
  const press = React.useRef<{ touch: boolean; wasOpen: boolean }>({ touch: false, wasOpen: false })
  const byTouch = React.useRef(false)

  const measure = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    if (middle) {
      const width = el.clientWidth
      const measureText = width > 0 ? measurerFor(el) : null
      if (!measureText) {
        // No layout or no canvas: show it whole, cut at the end by CSS, and ask the box.
        setShown(text)
        setTruncated(el.scrollWidth > el.clientWidth + 1)
        return
      }
      const next = middleCut(text, (s) => measureText(s) <= width + 0.5)
      setShown(next)
      setTruncated(next !== text)
      return
    }
    setShown(text)
    setTruncated(clamp ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1)
  }, [text, middle, clamp])

  React.useLayoutEffect(() => {
    measure()
  }, [measure, lines])

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    // A web font that arrives after the first measure changes every width.
    document.fonts?.ready.then(() => measure()).catch(() => {})
    return () => observer.disconnect()
  }, [measure])

  // Opened by a tap, it closes on a tap anywhere else and when anything scrolls (it is anchored to
  // text that would move from under it).
  React.useEffect(() => {
    if (!open || !byTouch.current) return
    const el = ref.current
    const doc = el?.ownerDocument
    if (!el || !doc) return
    const close = () => setOpen(false)
    const onDown = (event: PointerEvent) => {
      if (!el.contains(event.target as Node)) close()
    }
    doc.addEventListener("pointerdown", onDown, true)
    doc.addEventListener("scroll", close, true)
    return () => {
      doc.removeEventListener("pointerdown", onDown, true)
      doc.removeEventListener("scroll", close, true)
    }
  }, [open])

  const cutText = middle && shown !== text
  return (
    // One tree whether or not it is cut, so measuring never remounts it: the tooltip is off until
    // the text is cut.
    <Tooltip
      disabled={!truncated}
      open={open && truncated}
      onOpenChange={(next, details) => {
        if (next) {
          // Opened by the pointer: pin it where the pointer is now. By focus: from the element.
          const at = details.reason === "trigger-hover" ? pointer.current : null
          setOpenAt(at ? { ...at, element: ref.current } : null)
          byTouch.current = false
        }
        setOpen(next)
      }}
    >
      <TooltipTrigger
        // A trigger is a button by default; this one is text, so it draws as a span (or `render`).
        ref={ref as React.Ref<HTMLButtonElement>}
        render={render ?? <span />}
        data-slot="truncated-text"
        data-cut={cut}
        data-lines={clamp ? lines : undefined}
        data-truncated={truncated ? "" : undefined}
        // Only a cut text is a tab stop, so a keyboard can reach the rest of it.
        tabIndex={truncated ? 0 : undefined}
        className={cn(
          "block min-w-0 max-w-full",
          clamp ? "line-clamp-(--truncated-text-lines) break-words" : "truncate",
          truncated && "cursor-default",
          className
        )}
        style={clamp ? ({ "--truncated-text-lines": lines, ...style } as React.CSSProperties) : style}
        {...(props as React.ComponentProps<"button">)}
        onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
          press.current = { touch: event.pointerType === "touch", wasOpen: open }
          props.onPointerDown?.(event as unknown as React.PointerEvent<HTMLSpanElement>)
        }}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          // A tap on cut text shows all of it, from the text itself; a second tap puts it away.
          if (truncated && press.current.touch) {
            const next = !press.current.wasOpen
            press.current = { touch: false, wasOpen: false }
            byTouch.current = next
            if (next) setOpenAt(null)
            setOpen(next)
          }
          props.onClick?.(event as unknown as React.MouseEvent<HTMLSpanElement>)
        }}
        onPointerEnter={(event: React.PointerEvent<HTMLButtonElement>) => {
          follow(event)
          props.onPointerEnter?.(event as unknown as React.PointerEvent<HTMLSpanElement>)
        }}
        onPointerMove={(event: React.PointerEvent<HTMLButtonElement>) => {
          follow(event)
          props.onPointerMove?.(event as unknown as React.PointerEvent<HTMLSpanElement>)
        }}
      >
        {cutText ? (
          <>
            {/* What is drawn: the cut. What is read: the whole text. */}
            <span aria-hidden data-slot="truncated-text-visible">
              {shown}
            </span>
            <span className="sr-only">{text}</span>
          </>
        ) : (
          text
        )}
      </TooltipTrigger>
      {/* The Tooltip's own look; wraps between the two knobs; reads from the start of the line. */}
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          anchor={anchor}
          side={side}
          sideOffset={4}
          align="start"
          className="isolate z-50"
          data-anchor={openAt ? "pointer" : "element"}
        >
          <TooltipPrimitive.Popup
            data-slot="truncated-text-full"
            className={cn(
              "bg-text-body text-surface-ground type-caption z-50 block rounded px-2 py-1 text-start whitespace-normal wrap-break-word",
              "w-max min-w-[min(var(--c-truncated-text-min-width),var(--available-width,100vw))] max-w-[min(var(--c-truncated-text-max-width),var(--available-width,100vw))]",
              // Fades in place: no zoom, no slide.
              "data-open:animate-in data-open:fade-in-0 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-(--motion-fast) ease-(--motion-ease)"
            )}
          >
            {text}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </Tooltip>
  )
}

export { TruncatedText }
