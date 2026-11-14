// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: square on the 2px corner, as Figma 32:121 "Initial Tile"; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cn } from "../../lib/utils"

function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        // Square on the 2px corner (Figma 32:121). The 1px rule is drawn over the picture, inside
        // the box, so a photo never runs to a soft edge and the rule never adds size.
        "group/avatar relative flex size-8 shrink-0 rounded-lg bg-surface-raised select-none data-[size=lg]:size-10 data-[size=sm]:size-6 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:rule-box",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-[inherit] object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "type-ui-emphasis flex size-full items-center justify-center rounded-[inherit] bg-surface-raised text-foreground group-data-[size=sm]/avatar:type-overline group-data-[size=sm]/avatar:text-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * A mark on an avatar. A mark, so a square (contract 1.6), and never the solid primary fill, which
 * a screen keeps for its one primary action (rules 2.5.1). `tone="neutral"` (the default) is the
 * body ink, as Figma's unread mark; `tone="live"` is `secondary-live`, for presence.
 */
function AvatarBadge({ className, tone = "neutral", ...props }: React.ComponentProps<"span"> & { tone?: "neutral" | "live" }) {
  return (
    <span
      data-slot="avatar-badge"
      data-tone={tone}
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center text-surface-ground ring-2 ring-background select-none",
        tone === "live" ? "bg-secondary-live" : "bg-text-body",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        // Square tiles side by side, 4px apart: overlapped, a square hides its neighbour's letters.
        "group/avatar-group flex gap-1",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "type-overline relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-foreground rule-box group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
