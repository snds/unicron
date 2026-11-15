// Owned component (not generated): the words a search matched, marked with primary-soft behind them.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.1b #45 and cross-app decisions §6; no Figma frame, no app PR, no DSA record)
import * as React from "react"

import { cn } from "../../lib/utils"

/** One piece of a text cut at its matches. */
export interface HighlightPart {
  text: string
  match: boolean
}

function escape(word: string) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Cuts `text` at every match of `query` (a phrase, or several words), case and accents aside.
 * The pieces join back to `text` exactly. An empty query matches nothing.
 */
export function highlightParts(text: string, query: string | readonly string[]): HighlightPart[] {
  const words = (typeof query === "string" ? [query] : query).map((w) => w.trim()).filter(Boolean)
  if (!text || words.length === 0) return text ? [{ text, match: false }] : []
  // Match on a folded copy (café = cafe) when folding keeps the length, then cut the original.
  const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "")
  const folded = fold(text)
  const sameLength = folded.length === text.length
  const haystack = sameLength ? folded : text
  // Longest first, so "drift check" wins over "drift".
  const alternatives = (sameLength ? words.map(fold) : words).sort((a, b) => b.length - a.length).map(escape)
  const pattern = new RegExp(alternatives.join("|"), "giu")
  const parts: HighlightPart[] = []
  let at = 0
  for (const found of haystack.matchAll(pattern)) {
    const start = found.index ?? 0
    if (found[0].length === 0) continue
    if (start > at) parts.push({ text: text.slice(at, start), match: false })
    parts.push({ text: text.slice(start, start + found[0].length), match: true })
    at = start + found[0].length
  }
  if (at < text.length) parts.push({ text: text.slice(at), match: false })
  return parts
}

export type HighlightProps = Omit<React.ComponentProps<"mark">, "children"> & {
  /** The whole text to show. With `query`, every match in it is marked. */
  text?: string
  /** What the person searched for: a phrase, or several words. */
  query?: string | readonly string[]
  /** Without `text`: these words are the match, marked as they are. */
  children?: React.ReactNode
}

// On a selected row (itself primary-soft) the wash would vanish, so there the match also takes the
// 2px primary edge under it.
const MARK =
  "rounded-none bg-primary-soft [color:inherit] in-[[data-selected]]:shadow-[inset_0_calc(var(--stroke-emphasis)*-1)_0_var(--primary-fill)]"

/**
 * Highlight: the words a search matched (decisions §6), with `primary-soft` behind them and the
 * text's own colour, so it reads in any role and on any row. `<Highlight text={title} query={q} />`
 * marks every match in a text; `<Highlight>drift</Highlight>` marks its children. A `<mark>`, so
 * assistive tech can say it; the colour is never the only sign, as the text around it is the same.
 */
function Highlight({ text, query, children, className, ...props }: HighlightProps) {
  if (text === undefined) {
    return (
      <mark data-slot="highlight" className={cn(MARK, className)} {...props}>
        {children}
      </mark>
    )
  }
  const parts = query === undefined ? [{ text, match: false }] : highlightParts(text, query)
  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} data-slot="highlight" className={cn(MARK, className)} {...props}>
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        )
      )}
    </>
  )
}

export { Highlight }
