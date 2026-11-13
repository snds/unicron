// Owned component (not generated): one icon from the curated Carbon set, drawn as inline SVG.
// Promoted from: Seeded from snds/mailbird; tone: snds/mailbird · PR snds/unicron#2 · DSA none (raised from correct-use override counts)
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 18:738; no app PR, no DSA record)
import type { SVGProps } from "react"

import { iconNodes, type IconName } from "../icons/registry"
import { cn } from "../lib/utils"

// The types travel with the component. The functions (registerIcons, isIconName, iconNames) live
// in ../icons/registry and are exported from the package root.
export type { CoreIconName, IconName, UnicronIconRegistry } from "../icons/registry"

/** `md` is 20 px, the default. `sm` is 16 px, for compact controls. A number is that many px. */
export type IconSize = "md" | "sm" | number

const SIZES = { md: 20, sm: 16 } as const

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name" | "children"> {
  /** A Carbon icon name from the curated set, e.g. "arrow--right", or a name the app registered. */
  name: IconName
  /**
   * `md` 20 px (default), `sm` 16 px, or a number of px. Compact controls (Button, Top Tab, chips)
   * size their own icons to 16, so a caller rarely sets this.
   */
  size?: IconSize
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  label?: string
  /** Ink. Omit to take the surrounding text color (the usual case inside a control). */
  tone?: IconTone
}

/** Semantic inks an icon can take on its own, outside a control that colors it. */
export type IconTone = "muted" | "destructive"
const TONES: Record<IconTone, string> = {
  muted: "text-muted-foreground",
  destructive: "text-destructive",
}

/**
 * One icon: Carbon's 32 px drawing, scaled to the box and filled with the current text color.
 *
 * The size is set with `width` and `height` attributes, not classes. Attributes lose to any CSS
 * rule, so a control that sizes its icons (`[&_svg:not([class*='size-'])]:size-4`) and a caller's
 * own `size-*` class both still win. At 20 px Carbon's 2 px line draws at 1.25 px; at 16, 1 px.
 *
 * A name with nothing registered under it draws an empty box of the same size and carries
 * `data-icon-missing`, so the layout holds and the gap can be found.
 */
export function Icon({ name, size = "md", label, tone, className, ...props }: IconProps) {
  const px = typeof size === "number" ? size : SIZES[size]
  const nodes = iconNodes(name)
  return (
    <svg
      data-slot="icon"
      data-icon-name={name}
      data-icon-missing={nodes ? undefined : ""}
      viewBox="0 0 32 32"
      width={px}
      height={px}
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", tone && TONES[tone], className)}
      {...props}
    >
      {nodes}
    </svg>
  )
}
