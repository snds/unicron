// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction; no Figma component; no app PR, no DSA record)
import { cn } from "../../lib/utils"

/**
 * A key, or a short run of them: mono, as typed (a key's case can matter), in a 20px hairline box
 * on the 2px control radius. Inside a tooltip it takes the tooltip's own ink and a hairline in
 * that ink, so it reads on whatever surface the tooltip is.
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "type-meta rule-box bg-surface-raised text-support-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-lg px-1 select-none in-data-[slot=tooltip-content]:bg-transparent in-data-[slot=tooltip-content]:text-inherit in-data-[slot=tooltip-content]:inset-ring in-data-[slot=tooltip-content]:inset-ring-current/30 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("gap-1 inline-flex items-center", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
