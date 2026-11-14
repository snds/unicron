// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: a square thumb in the label ink, on the rule; no app PR, no DSA record)
"use client"

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
import { cn } from "../../lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      // min-h-0: in a flex or grid parent it takes the height it is given, and scrolls inside it.
      className={cn("relative min-h-0 min-w-0", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        // Base UI hides the native scrollbar with an inline <style>; a strict CSP (Lockdown:
        // style-src 'self') blocks that tag, so the stylesheet's utility does it too. A viewport
        // that scrolls by keyboard takes the one focus ring, drawn inside it.
        className="size-full rounded-[inherit] no-scrollbar focus-visible:-outline-offset-2"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        // 8px of track, 2px in from the edge: a 4px thumb.
        "group/scrollbar flex touch-none p-0.5 transition-opacity select-none data-horizontal:h-2 data-horizontal:flex-col data-vertical:h-full data-vertical:w-2",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        // Square, as every mark is; the label ink, so it shows on the ground and on a raised surface.
        className="relative flex-1 bg-(--c-scroll-area-thumb)"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
