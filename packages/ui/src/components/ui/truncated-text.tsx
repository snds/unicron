// Owned component (not generated): text cut to one line (or a few) with an ellipsis, at the end or in the middle, that shows all of itself in a Tooltip on hover and keyboard focus, and only when it is cut.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract §5.1a and §5.1b row 20, Synapse f-hovercard and SNA3, Lockdown X6; no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

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
  /** Where the full text shows: above by default. It lines up with the start of the text. */
  side?: "top" | "bottom"
  /** Another element to draw as (`<h3 />`, `<p />`). A span by default. */
  render?: React.ReactElement<Record<string, unknown>>
}

/**
 * TruncatedText: one line with an ellipsis (or `lines` lines, or a cut in the middle). When, and
 * only when, the text is cut, hovering it or focusing it from the keyboard shows the whole text in
 * a Tooltip: it joins the tab order then, and reads its whole text. Text that fits is plain text,
 * with no tooltip and no tab stop.
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

  const cutText = middle && shown !== text
  return (
    // One tree whether or not it is cut, so measuring never remounts it: the tooltip is off until
    // the text is cut.
    <Tooltip disabled={!truncated}>
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
      {/* Wraps at the tooltip's most width; starts where the text starts. */}
      <TooltipContent side={side} align="start" data-slot="truncated-text-full">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

export { TruncatedText }
