// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: the line variant is Figma 15:498 "Top Tab"; the default is a square segmented control; no app PR, no DSA record)
"use client"

import type * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

function Tabs({ className, orientation = "horizontal", ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:items-stretch",
  {
    variants: {
      variant: {
        // A square segmented control: a hairline box, 2px inside it, the chosen segment in
        // inverted ink (as an active Filter Chip), never the identity colour. 40 tall.
        default: "gap-0.5 rounded-lg p-0.5 rule-box group-data-horizontal/tabs:h-10",
        // Figma's Top Tab: overline labels, a 2px primary indicator under the chosen one.
        line: "gap-6 group-data-horizontal/tabs:h-10 group-data-vertical/tabs:gap-0",
      },
      // `fill`: the list takes its container's full height, as in a toolbar row taller than the
      // tabs. The line indicator then sits on the row's bottom edge, and the labels center with
      // the controls beside them. The container (and the Tabs root) must have that height.
      size: {
        default: "",
        fill: "group-data-horizontal/tabs:h-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  size = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-size={size}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    />
  )
}

// Every tab: the overline, label ink, the ink once chosen or under the pointer. Icons 16px.
const TRIGGER = cn(
  "type-overline relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-muted-foreground transition-[color,background-color] select-none hover:text-foreground focus-visible:z-10 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  // Segmented: each segment fills the list's height inside its 2px; the chosen one is inverted ink.
  "group-data-[variant=default]/tabs-list:h-full group-data-[variant=default]/tabs-list:flex-1 group-data-[variant=default]/tabs-list:rounded-lg group-data-[variant=default]/tabs-list:px-3 group-data-[variant=default]/tabs-list:not-data-active:hover:bg-state-hover group-data-[variant=default]/tabs-list:data-active:bg-foreground group-data-[variant=default]/tabs-list:data-active:text-background",
  // Line: Figma's Top Tab. The label row, 6px, the 2px indicator: label 16px from the top of a
  // 40px tab, the indicator on its bottom edge. Under the pointer the indicator shows faintly.
  "group-data-[variant=line]/tabs-list:h-full group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:pt-4 group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:pb-2 group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:items-start",
  "group-data-vertical/tabs:group-data-[variant=line]/tabs-list:h-10 group-data-vertical/tabs:group-data-[variant=line]/tabs-list:justify-start group-data-vertical/tabs:group-data-[variant=line]/tabs-list:pl-3",
  "after:absolute after:bg-primary-fill after:opacity-0 after:transition-opacity group-data-[variant=default]/tabs-list:after:hidden group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:left-0 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100 group-data-[variant=line]/tabs-list:not-data-active:hover:after:opacity-40"
)

/** One tab. `index` is Figma's folio before the label ("03"), in the faint ink. */
function TabsTrigger({ className, index, children, ...props }: TabsPrimitive.Tab.Props & { index?: React.ReactNode }) {
  return (
    <TabsPrimitive.Tab data-slot="tabs-trigger" className={cn(TRIGGER, className)} {...props}>
      {index !== undefined ? (
        <span data-slot="tabs-trigger-index" className="text-faint-foreground group-data-[variant=default]/tabs-list:in-data-active:text-background">
          {index}
        </span>
      ) : null}
      {children}
    </TabsPrimitive.Tab>
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("type-body flex-1", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
