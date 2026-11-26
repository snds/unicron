// Owned component (not generated): an icon on a small tinted square, a project's mark.
// Promoted from: Seeded in snds/unicron (2026-11-25 Warpcore IA canvas, project tiles in the sidebar and the project head; no Figma component yet; no DSA record)
"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import type { SwatchId } from "./tile"

// One class pair per swatch, written out so Tailwind finds each. The fill is the swatch at 16% over
// the raised surface; the glyph is the swatch deepened with the body ink, so it reads in both themes.
const tint: Record<SwatchId, string> = {
  "01": "bg-[color-mix(in_oklab,var(--swatch-01)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-01)_70%,var(--text-body))]",
  "02": "bg-[color-mix(in_oklab,var(--swatch-02)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-02)_70%,var(--text-body))]",
  "03": "bg-[color-mix(in_oklab,var(--swatch-03)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-03)_70%,var(--text-body))]",
  "04": "bg-[color-mix(in_oklab,var(--swatch-04)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-04)_70%,var(--text-body))]",
  "05": "bg-[color-mix(in_oklab,var(--swatch-05)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-05)_70%,var(--text-body))]",
  "06": "bg-[color-mix(in_oklab,var(--swatch-06)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-06)_70%,var(--text-body))]",
  "07": "bg-[color-mix(in_oklab,var(--swatch-07)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-07)_70%,var(--text-body))]",
  "08": "bg-[color-mix(in_oklab,var(--swatch-08)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-08)_70%,var(--text-body))]",
  "09": "bg-[color-mix(in_oklab,var(--swatch-09)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-09)_70%,var(--text-body))]",
  "10": "bg-[color-mix(in_oklab,var(--swatch-10)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-10)_70%,var(--text-body))]",
  "11": "bg-[color-mix(in_oklab,var(--swatch-11)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-11)_70%,var(--text-body))]",
  "12": "bg-[color-mix(in_oklab,var(--swatch-12)_16%,var(--surface-raised))] text-[color-mix(in_oklab,var(--swatch-12)_70%,var(--text-body))]",
}

/** Every swatch an icon tile can take, in order: what a colour picker offers. */
export const ICON_TILE_SWATCHES = Object.keys(tint) as SwatchId[]

const iconTileVariants = cva("relative inline-flex shrink-0 items-center justify-center select-none", {
  variants: {
    size: {
      // In a sidebar row, in the icon's 20px place: 22 square on the 6px corner, a 14px glyph.
      s: "size-5.5 -mx-px rounded-md",
      // A project's head: 32 square on the 8px corner, a 20px glyph.
      m: "size-8 rounded-lg",
    },
  },
  defaultVariants: { size: "s" },
})

export type IconTileSwatch = SwatchId | number

export type IconTileProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The project's glyph. */
  icon: IconName
  /** Its colour, one of the twelve swatch roles. Without one the tile is neutral. */
  swatch?: IconTileSwatch | null
  /** `s` 22 (a sidebar row, a list row) or `m` 32 (a page head). */
  size?: "s" | "m"
  /** Read the tile out under this name. Without it the tile is decoration (the name beside it says what). */
  label?: string
}

/** The swatch id for a number or an id; null for one that isn't 1 to 12. */
export function iconTileSwatch(swatch: IconTileSwatch | null | undefined): SwatchId | null {
  if (swatch === null || swatch === undefined) return null
  const id = String(swatch).padStart(2, "0") as SwatchId
  return id in tint ? id : null
}

/**
 * Icon Tile: a glyph on a small tinted square, the mark a project carries in the sidebar, its rows
 * and its head. The person picks the glyph and the colour; neither ever carries meaning.
 */
function IconTile({ icon, swatch, size = "s", label, className, ...props }: IconTileProps) {
  const id = iconTileSwatch(swatch)
  return (
    <span
      data-slot="icon-tile"
      data-size={size}
      data-swatch={id ?? undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(iconTileVariants({ size }), id ? tint[id] : "bg-surface-selected text-text-body", className)}
      {...props}
    >
      <Icon name={icon} size={size === "s" ? 14 : 20} />
    </span>
  )
}

export { IconTile, iconTileVariants }
