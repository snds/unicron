// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: ink-inverted, caption role, square, no arrow; no Figma component; no app PR, no DSA record)
"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "../../lib/utils"

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/**
 * The tip: inverted ink (the body ink as the fill, the ground as the words), the caption role, the
 * 2px corner, no arrow, no shadow. It wraps past --c-tooltip-max-width. A `Kbd` inside takes the
 * tip's own ink.
 */
function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  container,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    /** Where the portal goes: `<body>` by default. */
    container?: TooltipPrimitive.Portal.Props["container"]
  }) {
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "bg-text-body text-surface-ground type-caption z-50 inline-flex w-fit max-w-(--c-tooltip-max-width) origin-(--transform-origin) items-center gap-1.5 rounded px-2 py-1 break-words has-data-[slot=kbd]:pr-1",
            // The short pop, 120ms both ways. Moving between neighbours, Base UI marks it instant.
            "motion-pop motion-pop-fast",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
