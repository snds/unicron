// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/lockdown · PR snds/unicron (host-contract slice 4) · DSA none (a list skeleton drawn through the host's density knob; Lockdown 10-desktop-shell §10.6 gap 6)
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const skeletonVariants = cva("bg-muted animate-pulse", {
  variants: {
    variant: {
      // Sized by className: an avatar, a line of text, a card.
      default: "rounded-md",
      // One list row, full width, as tall as an `Item size="sm"` with one line (40px).
      // The height is the --c-skeleton-row-height knob, so an app with a density setting
      // re-maps that knob once (e.g. to its own row height) and every row skeleton follows.
      row: "h-(--c-skeleton-row-height) w-full shrink-0 rounded-lg",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Skeleton({ className, variant = "default", ...props }: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }
