// Owned component (not generated): a raised panel with a hairline and a 4px top edge: card art, a note card, a guest card.
// Promoted from: Seeded in snds/unicron (2026-11 design direction; Lockdown card art and Vale note cards, no Figma component; no app PR, no DSA record)
"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

/** One of the twelve swatch roles (`--swatch-01` … `--swatch-12`) for calendars, notes and labels (contract 5.1b #55). */
export type SwatchId = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12"

/**
 * A swatch as a fill, for a 4px edge, a 2px bar or an 8px square. Never behind text, never as
 * text (Vale 1.3). Written out in full so Tailwind finds every class.
 */
export const swatchFillClasses: Record<SwatchId, string> = {
  "01": "bg-(--swatch-01)",
  "02": "bg-(--swatch-02)",
  "03": "bg-(--swatch-03)",
  "04": "bg-(--swatch-04)",
  "05": "bg-(--swatch-05)",
  "06": "bg-(--swatch-06)",
  "07": "bg-(--swatch-07)",
  "08": "bg-(--swatch-08)",
  "09": "bg-(--swatch-09)",
  "10": "bg-(--swatch-10)",
  "11": "bg-(--swatch-11)",
  "12": "bg-(--swatch-12)",
}

export type TileEdge = "primary" | "none"
export type TileSize = "default" | "compact"

const tile = cva(
  // A raised neutral surface with a hairline, never a primary-filled area (rules 2.5.6). The
  // hairline is inset, so it adds no size.
  "group/tile relative flex min-w-0 flex-col gap-4 bg-surface-raised rule-box text-foreground",
  {
    variants: {
      size: {
        // Lockdown's card art on desktop: 24 in from every side.
        default: "p-6",
        // On a phone: 20.
        compact: "p-5",
      },
      interactive: {
        // Opaque hover and press, as on any raised control (contract §6.1).
        true: "text-left hover:bg-accent active:bg-[color-mix(in_oklab,var(--text-body)_10%,var(--surface-raised))]",
        false: "",
      },
      // Selected: the 2px box in the primary fill, never a solid fill (rules 2.5.3).
      selected: {
        true: "rule-box-emphasis",
        false: "",
      },
    },
    defaultVariants: { size: "default", interactive: false, selected: false },
  }
)

export type TileProps = useRender.ComponentProps<"a"> & {
  /** The 4px top edge. Default `primary` (Lockdown's card art); `none` for a note with no colour. */
  edge?: TileEdge
  /** The edge in a swatch instead of the primary (a note's colour). */
  swatch?: SwatchId
  /** `default` (24 in) or `compact` (20 in, phones). */
  size?: TileSize
  /** The tile is the chosen one in a set: a 2px primary box. Sets `aria-current`. */
  selected?: boolean
  /** Makes the whole tile a link. Or pass `render`, or `onClick` for a button. */
  href?: string
}

/**
 * Tile: a raised panel with a hairline and a 4px top edge in the primary fill or a swatch. The
 * edge is a bar laid over the top of the panel, so it adds no height. Its content is the caller's:
 * card art (Lockdown), a note card (Vale), a guest card around a QR code. With `href`, `onClick`
 * or `render` the whole tile is the control; it then holds inline content only (spans, not
 * paragraphs or other controls), as a button or a link must.
 */
function Tile({
  edge = "primary",
  swatch,
  size = "default",
  selected = false,
  href,
  render,
  onClick,
  className,
  children,
  ...props
}: TileProps) {
  const interactive = Boolean(href || onClick || render)
  const bar = swatch ? swatchFillClasses[swatch] : edge === "primary" ? "bg-primary-fill" : null
  return useRender({
    defaultTagName: href ? "a" : onClick ? "button" : "div",
    render,
    props: mergeProps<"a">(
      {
        href,
        onClick,
        ...(!href && onClick && !render ? { type: "button" } : null),
        "aria-current": selected ? "true" : undefined,
        className: cn(tile({ size, interactive, selected }), className),
        children: (
          <>
            {bar ? (
              <span aria-hidden="true" data-slot="tile-edge" className={cn("pointer-events-none absolute inset-x-0 top-0 h-1", bar)} />
            ) : null}
            {children}
          </>
        ),
      },
      props
    ),
    state: {
      slot: "tile",
      edge: swatch ? "swatch" : edge,
      selected,
    },
  })
}

export { Tile, tile as tileVariants }
