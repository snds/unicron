// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Overrides (tools/shadcn-material/overrides.json): pressed state is the primary fill, not bg-muted (snds/unicron#6). Superseded by the 2026-11 restyle below (pressed is inverted ink); the override entry still writes the old fill on a regen, so carry this file over by hand until it is updated.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: pressed is inverted ink, as the active Filter Chip (Figma 15:503), never the identity colour; no app PR, no DSA record)
"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// Pressed is inverted ink: the ink as the fill, the ground as the label, as an active Filter Chip
// and a current FloatButton are. It is never the identity colour, so a pressed tool never reads as
// the screen's one primary action. Hover and pressed move the fill toward the ground (90%, 80%),
// as every solid does. Unpressed, a toggle is a ghost button: ink, with the hover and pressed washes.
const PRESSED =
  "aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:hover:bg-[color-mix(in_oklab,var(--foreground)_90%,var(--background))] aria-pressed:active:bg-[color-mix(in_oklab,var(--foreground)_80%,var(--background))]"

const toggleVariants = cva(
  cn(
    "group/toggle inline-flex shrink-0 items-center justify-center gap-2 rounded-lg type-overline whitespace-nowrap text-foreground transition-[color,background-color,box-shadow] select-none hover:bg-state-hover active:bg-state-pressed disabled:pointer-events-none disabled:opacity-50 aria-invalid:inset-ring-2 aria-invalid:inset-ring-critical-fill [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    PRESSED
  ),
  {
    variants: {
      variant: {
        default: "bg-transparent",
        // A hairline box around it at rest.
        outline: "bg-transparent rule-box",
      },
      // The Button's heights: 40, 32 (rows and toolbars), 48. Under 44 they take a touch target of 44.
      size: {
        default: "hit-area h-10 min-w-10 px-3",
        sm: "hit-area h-8 min-w-8 px-2",
        lg: "h-control min-w-(--spacing-control) px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** A button that stays pressed (`aria-pressed`): a tool that is on, a format that applies. */
function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive data-slot="toggle" className={cn(toggleVariants({ variant, size, className }))} {...props} />
}

export { Toggle, toggleVariants }
