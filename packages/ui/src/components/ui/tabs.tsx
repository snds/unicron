// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2.0: every variant is the Figma Pill Tab 15:498, selection on the neutral 8% fill; no app PR, no DSA record)
"use client"

import type * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { NavMark, resolveNavMark, type NavMarkProp } from "./rail"

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
  "group/tabs-list inline-flex w-fit items-center gap-1 text-text-secondary group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:items-stretch",
  {
    variants: {
      // 2.0 has one tab: Figma's Pill Tab (15:498). "No underline, no track, no accent, no inverted
      // pill." `line` is kept so 1.x callers still build; it draws the same pill.
      variant: {
        default: "",
        line: "",
      },
      // `fill`: the list takes its container's full height, as in a toolbar row taller than the
      // tabs, and the pills center in it. The container (and the Tabs root) must have that height.
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
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-size={size}
      className={cn("relative", tabsListVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
}

// Figma's Pill Tab (15:498): 28 tall, a 6px corner, 4 and 9 inside, 6 between the parts. The label
// is ui in secondary ink; the chosen tab is ui/emphasis in body ink on the neutral 8% fill
// (surface/selected), the same in every app. Icons 20px. On a coarse pointer it takes a 44px
// target (`hit-area`).
const TRIGGER = cn(
  "type-ui hit-area relative inline-flex h-control-s shrink-0 items-center justify-center gap-1.5 rounded-full px-2.25 py-1 whitespace-nowrap text-text-secondary transition-[color,background-color] duration-(--motion-fast) ease-(--motion-ease) select-none",
  "not-data-active:hover:bg-surface-hover active:bg-surface-selected focus-visible:z-10 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  "data-active:type-ui-emphasis data-active:bg-surface-selected data-active:text-text-body",
  "group-data-vertical/tabs:justify-start",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon"
)

export type TabsTriggerProps = TabsPrimitive.Tab.Props & {
  /** A number before the label, in the label ink (Figma's Index). It is read as part of the name. */
  index?: React.ReactNode
  /**
   * A count, a square or a key after the label: the mark every navigation item shares (`rail.tsx`).
   * Its words join the tab's accessible name ("Requests, 2"), so a count people see also reaches a
   * screen reader (Lockdown 30, WCAG 1.3.1). Pass the count here, never as a hidden child.
   */
  mark?: NavMarkProp
  /**
   * Keep the label's own case. 2.0 labels are sentence case already, so this only guards a label
   * that is data, such as a person's name ("Ana McKay"), against a caller's capitals (Vale 8).
   */
  keepCase?: boolean
}

/** One tab. `index` is a number before the label; `mark` a count said in its name. */
function TabsTrigger({ className, index, mark, keepCase = false, children, ...props }: TabsTriggerProps) {
  const resolved = resolveNavMark(mark)
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      data-keep-case={keepCase ? "" : undefined}
      className={cn(TRIGGER, keepCase && "normal-case", className)}
      {...props}
    >
      {index !== undefined ? (
        <span data-slot="tabs-trigger-index" className="type-caption text-text-label">
          {index}
        </span>
      ) : null}
      {children}
      {/* The mark is drawn for the eye; its words ("2", "2 waiting on you") are said once, here. */}
      {/* The count is the tab's meta, in the label ink (Figma's Show count). */}
      <NavMark mark={resolved} placement="inline" type="caption" className="text-text-label" />
      {resolved?.words ? (
        <span data-slot="tabs-trigger-mark-words" className="sr-only">
          {`, ${resolved.words}`}
        </span>
      ) : null}
    </TabsPrimitive.Tab>
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={cn("type-body flex-1", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
