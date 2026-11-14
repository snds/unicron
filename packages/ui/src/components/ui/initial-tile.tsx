// Owned component (not generated): a person's initials, or their photo, in a square tile.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:121 "Initial Tile"; S and the photo from contract 5.1a for Vale; no app PR, no DSA record)
"use client"

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// Figma 32:121: the raised surface, a 1px rule inside, the 2px corner, the initials in the ink.
// M 40 in `ui/emphasis`, L 64 in `lead` (as drawn); S 24 (Vale's rows and chips) in the overline,
// the one type that fits two letters in 24px.
const initialTileVariants = cva(
  "group/initial-tile relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-raised text-foreground select-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:rule-box",
  {
    variants: {
      size: {
        s: "size-6 type-overline text-foreground",
        m: "size-10 type-ui-emphasis",
        l: "size-16 type-lead",
      },
    },
    defaultVariants: { size: "m" },
  }
)

export type InitialTileProps = Omit<AvatarPrimitive.Root.Props, "children" | "className"> &
  VariantProps<typeof initialTileVariants> & {
    /** The letters to show: one or two, as written ("MC"). */
    initials: string
    /** The person's photo. While it loads, or if it fails, the initials show. */
    src?: string
    /**
     * Who it is. Give it when nothing next to the tile says the name: the tile is then an image
     * with that name. Without it the tile is decoration (the name beside it says who).
     */
    name?: string
    className?: string
  }

/**
 * Initial Tile (Figma 32:121): a square with a person's initials, or their photo when `src` is
 * given. `size`: `s` 24, `m` 40 (default), `l` 64.
 */
function InitialTile({ initials, src, name, size = "m", className, ...props }: InitialTileProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="initial-tile"
      data-size={size}
      role={name ? "img" : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      className={cn(initialTileVariants({ size }), className)}
      {...props}
    >
      {src ? <AvatarPrimitive.Image data-slot="initial-tile-image" src={src} alt="" className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback data-slot="initial-tile-initials" className="flex size-full items-center justify-center">
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

export { InitialTile, initialTileVariants }
