// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: pressed is inverted ink; a joined outline group draws one hairline box with rules between, never a double edge; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

import { indicatorOnControl, type IndicatorProp } from "./indicator"
import { toggleVariants } from "./toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }
>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg data-vertical:flex-col data-vertical:items-stretch",
        // Joined outline items: the group draws the one hairline box, the items a rule between them.
        "data-[spacing=0]:data-[variant=outline]:rule-box",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

/** `indicator` marks the item when something behind it wants the person: a dot in its corner, and the words in its name. */
function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  indicator,
  "aria-label": ariaLabel,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants> & { indicator?: IndicatorProp }) {
  const context = React.useContext(ToggleGroupContext)
  const on = indicatorOnControl(indicator, ariaLabel)
  const look = context.variant || variant
  // Joined outline items draw no box of their own: the group draws it, and each item after the
  // first a rule on its leading side. Two boxes side by side would draw a 2px seam.
  const joinedOutline = context.spacing === 0 && look === "outline"

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={look}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:rounded-none group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-lg",
        toggleVariants({
          variant: joinedOutline ? "default" : look,
          size: context.size || size,
        }),
        joinedOutline && "group-data-horizontal/toggle-group:not-first:rule-l group-data-vertical/toggle-group:not-first:rule-t",
        on && "relative",
        className
      )}
      aria-label={on?.label ?? ariaLabel}
      {...props}
    >
      {children}
      {on?.mark}
      {on?.words}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem }
