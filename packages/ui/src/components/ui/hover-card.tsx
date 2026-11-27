// Owned component (not generated): a short card that a pointer resting on a row opens, with what the row stands for at a glance.
// Promoted from: Seeded in snds/unicron (Warpcore's pi-desktop teardown, 2026-11-27: a chat row's card and a project's counts; the Info Hovercard ruling of 2026-11-24 for its look; no app PR, no DSA record)
"use client"

import * as React from "react"
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "../../lib/utils"

/** How long a pointer rests on a row before its card opens: long enough that moving down a list opens none. */
export const HOVER_CARD_DELAY_MS = 500

function HoverCard(props: PreviewCardPrimitive.Root.Props) {
  return <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />
}

/** The row it belongs to. Opens after `HOVER_CARD_DELAY_MS` of rest, and only for a pointer that hovers. */
function HoverCardTrigger({ delay = HOVER_CARD_DELAY_MS, closeDelay = 100, ...props }: PreviewCardPrimitive.Trigger.Props) {
  return <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" delay={delay} closeDelay={closeDelay} {...props} />
}

/**
 * The card: the raised surface, a 1px rule, the 2px corner, no shadow, as every overlay. 12px in, a 240px
 * column, the caption role. Short and read-only: a title line, then a few facts. Nothing in it is the only
 * way to reach anything, because touch never opens it.
 */
function HoverCardContent({
  className,
  side = "right",
  sideOffset = 8,
  align = "start",
  children,
  ...props
}: PreviewCardPrimitive.Popup.Props & Pick<PreviewCardPrimitive.Positioner.Props, "align" | "side" | "sideOffset">) {
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} className="isolate z-50">
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "bg-surface-raised text-text-body type-caption rule-box flex w-60 max-w-(--available-width) flex-col gap-2 rounded p-3 origin-(--transform-origin)",
            "motion-anchor",
            className
          )}
          {...props}
        >
          {children}
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

/** The card's first line: the row's name, in the body ink. */
function HoverCardTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="hover-card-title" className={cn("type-ui text-text-body min-w-0 truncate", className)} {...props} />
}

export { HoverCard, HoverCardTrigger, HoverCardContent, HoverCardTitle }
