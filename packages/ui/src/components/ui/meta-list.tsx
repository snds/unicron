// Owned component (not generated): facts about a thing in columns, each a mono caps label over its value (a message head's From, Received, Attached).
// Promoted from: Seeded in snds/unicron (2026-11 design direction; Vale desktop message head, no Figma component; no app PR, no DSA record)
import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * MetaList: a description list laid out in columns that wrap. Each column hugs its widest line,
 * 32px from the next, 16px between wrapped lines. Holds `MetaItem`s.
 */
function MetaList({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      data-slot="meta-list"
      className={cn("flex min-w-0 flex-wrap items-start gap-x-8 gap-y-4", className)}
      {...props}
    />
  )
}

export type MetaItemProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** What the value is, in mono caps ("From", "Received"). */
  label: React.ReactNode
  /** The value, in the meta role and body ink ("Mira Chen", "09:14", "01"). A link or a button is fine. */
  children: React.ReactNode
}

/** MetaItem: one fact. The label sits 4px over the value (R03: an overline and its text). */
function MetaItem({ label, children, className, ...props }: MetaItemProps) {
  return (
    <div data-slot="meta-item" className={cn("flex min-w-0 flex-col gap-1", className)} {...props}>
      <dt data-slot="meta-item-label" className="type-overline text-muted-foreground">
        {label}
      </dt>
      <dd data-slot="meta-item-value" className="type-meta text-foreground min-w-0">
        {children}
      </dd>
    </div>
  )
}

export { MetaList, MetaItem }
