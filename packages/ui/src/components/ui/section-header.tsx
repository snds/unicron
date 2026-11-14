// Owned component (not generated): the overline that heads a group of rows: title, count, a rule that fills, an action.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:60; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { formatListCount } from "./list-row"

export type SectionHeaderLevel = 2 | 3 | 4 | 5 | 6
export type SectionHeaderVariant = "default" | "index"

const header = cva(
  // Figma 32:60: 32 tall, children centred, 12 between them, the rule a 1px line that fills.
  "group/section-header flex h-8 min-w-0 items-center gap-3",
  {
    variants: {
      variant: {
        default: "",
        // Letter headers (A to Z): the same line, kept in view at the top of the list's scroller,
        // on the ground so rows pass under it.
        index: "sticky top-0 z-10 bg-background",
      },
      inset: {
        // Figma draws 16 at each side (the phone, full bleed). A desktop column draws none.
        true: "px-4",
        false: "",
      },
    },
    defaultVariants: { variant: "default", inset: false },
  }
)

export type SectionHeaderProps = Omit<React.ComponentProps<"div">, "title" | "children"> & {
  /** The overline: a section's name ("Mail // folders", "A – P"). Type it in sentence case. */
  title: React.ReactNode
  /** After the title, in the meta role. A number is written as decisions §13 says (`02`, `146`, `1,204`). */
  count?: number | React.ReactNode
  /** The heading level the title is (`h2` by default). */
  level?: SectionHeaderLevel
  /** `index`: a letter header that stays in view while its rows scroll under it. */
  variant?: SectionHeaderVariant
  /** Adds Figma's 16 px at each side, for a full-bleed phone list. Default false (a column's edge). */
  inset?: boolean
  /** One small control after the rule: a text Button `size="sm"` ("Show all", "Patch"). */
  action?: React.ReactNode
  /**
   * The section shuts to one `summary` line, and the title is the button that opens it
   * (`aria-expanded`). The rows go in `children`.
   */
  collapsible?: boolean
  /** Collapsible: one line shown while the section is shut ("Coding // $2.00 cap // 06 files"). */
  summary?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Collapsible only: what the section holds. */
  children?: React.ReactNode
}

const HEADINGS = { 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const

function Count({ count }: { count: number | React.ReactNode }) {
  return (
    <span data-slot="section-header-count" className="type-meta whitespace-nowrap text-muted-foreground">
      {typeof count === "number" ? formatListCount(count) : count}
    </span>
  )
}

/**
 * SectionHeader (Figma 18): an overline title, its count in the meta role, a hairline that fills
 * the rest of the line, and an optional action. The title and count are one heading; the rule is
 * drawn, not read. `collapsible` turns the heading's words into a disclosure button over a panel.
 */
function SectionHeader({
  title,
  count,
  level = 2,
  variant = "default",
  inset = false,
  action,
  collapsible = false,
  summary,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  className,
  ...props
}: SectionHeaderProps) {
  const Heading = HEADINGS[level]
  const summaryId = React.useId()
  const [openState, setOpenState] = React.useState(defaultOpen)
  const isOpen = open ?? openState
  const hasCount = count !== undefined && count !== null && count !== false

  // A letter header (A to Z, #) draws its letter as Lockdown's Desktop / 01 does: the index role,
  // then `// 04` in the meta role, and no rule beside it (the first row's rule is under it).
  // A longer index title ("Favorites", "A – P") keeps the overline.
  const letter = variant === "index" && typeof title === "string" && [...title.trim()].length <= 2
  const words = (
    <>
      <span data-slot="section-header-title" className={cn(letter ? "type-number-index" : "type-overline", "text-muted-foreground")}>
        {title}
      </span>
      {/* A space for the name ("Mail // folders 12"); the gap draws it. */}
      {hasCount ? " " : null}
      {hasCount && letter ? (
        <>
          <span aria-hidden="true" className="type-meta text-muted-foreground -me-1.5">
            {"//"}
          </span>{" "}
        </>
      ) : null}
      {hasCount ? <Count count={count} /> : null}
    </>
  )
  const rule = letter ? null : <span data-slot="section-header-rule" aria-hidden="true" className="h-(--stroke-rule) min-w-4 flex-1 bg-line-rule" />
  const actionSlot = action ? (
    <span data-slot="section-header-action" className="inline-flex shrink-0 items-center">
      {action}
    </span>
  ) : null

  if (!collapsible) {
    return (
      <div data-slot="section-header" data-variant={variant} className={cn(header({ variant, inset }), letter && "h-12", className)} {...props}>
        <Heading className="flex min-w-0 shrink-0 items-baseline gap-3">{words}</Heading>
        {rule}
        {actionSlot}
      </div>
    )
  }

  return (
    <CollapsiblePrimitive.Root
      open={isOpen}
      onOpenChange={(next) => {
        setOpenState(next)
        onOpenChange?.(next)
      }}
      data-slot="section"
      className="flex flex-col"
    >
      <div
        data-slot="section-header"
        data-variant={variant}
        data-collapsible=""
        className={cn(header({ variant, inset }), className)}
        {...props}
      >
        <Heading className="flex min-w-0 shrink-0">
          <CollapsiblePrimitive.Trigger
            data-slot="section-header-trigger"
            aria-describedby={!isOpen && summary ? summaryId : undefined}
            className="hit-area -mx-1 inline-flex min-w-0 items-baseline gap-3 rounded-lg px-1 text-left hover:bg-state-hover active:bg-state-pressed"
          >
            {words}
            <span
              data-slot="section-header-chevron"
              aria-hidden="true"
              className={cn(
                "inline-flex self-center text-muted-foreground transition-transform duration-(--motion-fast) motion-reduce:transition-none",
                isOpen && "rotate-180"
              )}
            >
              <Icon name="chevron--down" size="sm" />
            </span>
          </CollapsiblePrimitive.Trigger>
        </Heading>
        {rule}
        {actionSlot}
      </div>
      {!isOpen && summary ? (
        <p id={summaryId} data-slot="section-header-summary" className={cn("truncate type-meta text-support-foreground", inset && "px-4")}>
          {summary}
        </p>
      ) : null}
      <CollapsiblePrimitive.Panel data-slot="section-panel">{children}</CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
  )
}

export { SectionHeader }
