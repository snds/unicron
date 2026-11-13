// Owned component (not generated): a check mark that draws itself. Material Symbols is a font, and
// a font glyph cannot be drawn stroke by stroke, so this one mark is an SVG path.
// Promoted from: Seeded in snds/unicron (motion layer; no app PR, no DSA record)
import * as React from "react"

import { cn } from "../lib/utils"

export interface CheckDrawProps extends Omit<React.ComponentProps<"svg">, "children"> {
  /** Stroke width in the 24-unit box. Default 2.5, close to the icon font's weight 400 at 20px. */
  weight?: number
}

/**
 * Draws on mount with the `motion-draw` recipe (styles/motion.css); under reduced motion it is
 * simply there. Decorative: say the outcome in text or a live region. Sized by `1em`, coloured by
 * `currentColor`. To draw again, mount it again (give it a new `key`).
 */
function CheckDraw({ className, weight = 2.5, ...props }: CheckDrawProps) {
  return (
    <svg
      data-slot="check-draw"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block size-[1em] shrink-0", className)}
      {...props}
    >
      <path className="motion-draw" pathLength={1} d="M5 12.75 9.75 17.5 19 7.5" />
    </svg>
  )
}

export { CheckDraw }
