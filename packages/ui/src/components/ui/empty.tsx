// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:64 "Empty State": overline, title, body, one secondary action, left aligned, no illustration; tone critical from contract 5.1b #28; no app PR, no DSA record)
import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

import { Icon } from "../icon"
import { Button } from "./button"

// Figma 32:64: a column, left aligned, 32 / 16 in, 12 between the parts. `sm` is the same grammar
// for a pane or a column (a detail with nothing open): the title one size down, 24 / 16 in.
const emptyVariants = cva("group/empty flex w-full min-w-0 flex-col items-start gap-3 text-left", {
  variants: {
    size: {
      default: "px-4 py-8 short:py-4",
      sm: "px-4 py-6 short:py-3",
    },
  },
  defaultVariants: { size: "default" },
})

function Empty({ className, size = "default", ...props }: React.ComponentProps<"div"> & VariantProps<typeof emptyVariants>) {
  return <div data-slot="empty" data-size={size} className={cn(emptyVariants({ size }), className)} {...props} />
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-header" className={cn("flex max-w-[--spacing(140)] flex-col items-start gap-3", className)} {...props} />
}

/** The overline above the title: where this is and how much is in it (`INBOX // 000 UNREAD`). */
function EmptyOverline({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-overline"
      className={cn("type-overline flex items-center gap-2 text-muted-foreground group-data-[tone=critical]/empty:text-critical-text", className)}
      {...props}
    />
  )
}

// No illustration (the direction: delight comes from structure and type). Kept for an icon that
// names the thing, in a square tile on the 2px corner.
const emptyMediaVariants = cva("flex shrink-0 items-center justify-center short:hidden [&_svg]:pointer-events-none [&_svg]:shrink-0", {
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "size-10 rounded-lg bg-surface-raised text-foreground rule-box [&_svg:not([class*='size-'])]:size-5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function EmptyMedia({ className, variant = "default", ...props }: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return <div data-slot="empty-icon" data-variant={variant} className={cn(emptyMediaVariants({ variant, className }))} {...props} />
}

/** The title: Figma's `title` role (32/36), one size down in `size="sm"`. */
function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("type-title text-foreground group-data-[size=sm]/empty:type-subtitle", className)}
      {...props}
    />
  )
}

/** What comes next, in body text, secondary ink. */
function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn("type-body type-measure text-support-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-foreground", className)}
      {...props}
    />
  )
}

/** The action, under the text: one secondary Button (Figma 32:64), left aligned. */
function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-content" className={cn("flex w-full min-w-0 flex-wrap items-center gap-3", className)} {...props} />
}

export type EmptyStateProps = Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof emptyVariants> & {
    /** Where this is and its count, as a mono caps line: "Inbox // 000 unread". */
    overline?: React.ReactNode
    title: React.ReactNode
    body?: React.ReactNode
    /** The one action, as a node (a `Button variant="secondary"`, a link drawn as one). */
    action?: React.ReactNode
    /** Or the action's word, drawn as the secondary Button M that Figma draws. */
    actionLabel?: string
    onAction?: () => void
    /**
     * `critical`: nothing to show because a read failed (decisions §9): the overline turns critical
     * and leads with the warning icon; the action is usually "Try again".
     */
    tone?: "neutral" | "critical"
  }

/**
 * Empty State (Figma 32:64): an overline, a title, a line of body and one secondary action, left
 * aligned, no illustration. `tone="critical"` for a list that could not be read.
 */
function EmptyState({ overline, title, body, action, actionLabel, onAction, tone = "neutral", size, ...props }: EmptyStateProps) {
  return (
    <Empty data-tone={tone} size={size} {...props}>
      <EmptyHeader>
        {overline ? (
          <EmptyOverline>
            {tone === "critical" ? <Icon name="warning--alt" size="sm" /> : null}
            {overline}
          </EmptyOverline>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        {body ? <EmptyDescription>{body}</EmptyDescription> : null}
      </EmptyHeader>
      {action || actionLabel ? (
        <EmptyContent>
          {action ?? (
            <Button variant="secondary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </EmptyContent>
      ) : null}
    </Empty>
  )
}

export { Empty, EmptyHeader, EmptyOverline, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia, EmptyState, emptyVariants }
