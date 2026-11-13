// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/lockdown · PR snds/unicron (host-contract slice 4) · DSA none (a list skeleton drawn through the host's density knob; Lockdown 10-desktop-shell §10.6 gap 6)
// Promoted from: Seeded in snds/unicron (2026-11 design direction; the States 04 "loading" frames of all four apps, no Figma component; no app PR, no DSA record)
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// One bar: a square block of the raised surface. It beats on --motion-pulse (the generic loading
// beat, never the agent-working motion) and holds still under reduced motion.
const BAR = "bg-surface-raised animate-pulse"

const skeletonVariants = cva("", {
  variants: {
    variant: {
      // One bar, sized by className: a line of text, a number, a tile.
      default: cn(BAR, "rounded-none"),
      // One list row, full width: two 12px bars 20px apart over a hairline, as the loading frames
      // draw it (76px tall). --c-skeleton-row-height is its least height, so an app whose own
      // rows are taller re-maps that knob once and every row skeleton follows.
      row: "group/skeleton rule-b flex min-h-(--c-skeleton-row-height) w-full shrink-0 flex-col justify-center gap-5 py-4",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Skeleton({ className, variant = "default", children, ...props }: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    >
      {variant === "row" ? (
        <>
          {/* Bar lengths alternate from row to row, so a list of them does not read as a table. */}
          <span data-slot="skeleton-bar" className={cn(BAR, "block h-3 w-1/2 group-even/skeleton:w-3/5")} />
          <span data-slot="skeleton-bar" className={cn(BAR, "block h-3 w-3/4 group-even/skeleton:w-1/2")} />
        </>
      ) : (
        children
      )}
    </div>
  )
}

export { Skeleton, skeletonVariants }
