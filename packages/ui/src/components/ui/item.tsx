// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded from snds/mailbird (initial copy)
// Promoted from: snds/mailbird · PR snds/unicron#9 · DSA none (hover, selected, and disabled as a link or a button; hand-raised in Mailbird ADR-0057)
// Promoted from: snds/mailbird · PR snds/unicron#14 · DSA none (ItemMain, a row with a main action and buttons of its own; hand-raised in Mailbird ADR-0058)
// Promoted from: Seeded in snds/unicron (2026-11 design direction: the generic row of Figma 9:181 "List Row": a rule on top, selected = primary-soft with the 2px edge; no app PR, no DSA record)
import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

import { IndicatorMark, indicatorLabel, type IndicatorProp } from "./indicator"
import { Separator } from "./separator"

/** True inside an `ItemGroup`: its rows are the list's items. */
const ItemGroupContext = React.createContext(false)

/**
 * A list of rows (`role="list"`). Each `Item` in it is a list item: a plain row takes the role
 * itself, and a row drawn as a link or a button, which keeps that role, sits in a list-item box of
 * its own. So assistive tech hears "list, 3 items" and then each link.
 */
function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <ItemGroupContext.Provider value={true}>
      <div
        role="list"
        data-slot="item-group"
        className={cn(
          // Rows sit edge to edge: each draws its own rule on top, so the list needs no gaps.
          "group/item-group flex w-full flex-col",
          className
        )}
        {...props}
      />
    </ItemGroupContext.Provider>
  )
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  const inGroup = React.useContext(ItemGroupContext)
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-0", className)}
      // A list owns list items only: between its rows the hairline is decoration, not a separator.
      {...(inGroup ? { role: "none", "aria-orientation": undefined, "aria-hidden": true } : null)}
      {...props}
    />
  )
}

/** Tags that carry no role of their own, so the row can be the list item itself. */
const PLAIN_TAGS = new Set(["div", "span", "section", "article"])

// The generic row (Figma 9:181's grammar): a 1px rule on top, drawn inside it so it adds no height
// (rule-t). Selected (data-selected="true") is the soft primary fill with the 2px primary edge on
// the left, and the default inks (rules 2.5). Drawn as a link or a button (render={<a />} /
// render={<button />}), or holding an ItemMain, it takes the hover and pressed washes, and its
// focus ring is drawn just inside it, so rows stacked edge to edge never cover each other's ring.
const ROW_STATES = cn(
  "[a,button]:hover:bg-state-hover [a,button]:active:bg-state-pressed has-[>[data-slot=item-main]:hover]:bg-state-hover has-[>[data-slot=item-main]:active]:bg-state-pressed",
  // A selected row under the pointer keeps its soft fill with the wash laid on it.
  "data-[selected=true]:bg-primary-soft data-[selected=true]:edge-l [a,button]:data-[selected=true]:hover:bg-[color-mix(in_oklab,var(--primary-soft),var(--text-body)_6%)] [a,button]:data-[selected=true]:active:bg-[color-mix(in_oklab,var(--primary-soft),var(--text-body)_10%)]",
  "focus-visible:-outline-offset-2 has-[>[data-slot=item-main]:focus-visible]:outline-2 has-[>[data-slot=item-main]:focus-visible]:-outline-offset-2 has-[>[data-slot=item-main]:focus-visible]:outline-ring",
  // A row that is the control (a link, a button, or one whose ItemMain covers it) is never under
  // the 44px touch minimum on a coarse pointer, whatever its size (contract 6.6).
  "[a,button]:pointer-coarse:min-h-touch-min has-[>[data-slot=item-main]]:pointer-coarse:min-h-touch-min"
)

const itemVariants = cva(
  cn(
    "group/item relative flex w-full flex-wrap items-center text-left text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    ROW_STATES
  ),
  {
    variants: {
      variant: {
        // A row in a list: the rule on top.
        default: "rule-t",
        // A row on its own: a hairline box on the 2px corner.
        outline: "rounded-lg rule-box",
        // A raised row: the raised surface, no rule.
        muted: "rounded-lg bg-surface-raised",
      },
      size: {
        // 12 / 16 in: a title and a line under it make a 64px row, as a Toggle Row.
        default: "gap-4 px-4 py-3",
        sm: "gap-3 px-3 py-2",
        xs: "gap-2 px-2 py-1.5 in-data-[slot=dropdown-menu-content]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * A row. `indicator` adds a trailing dot when something in it wants the person: `attention`
 * (waiting on them) or `unread`. Attention wins what's drawn; a screen reader hears both, with the
 * count ("2 waiting for you").
 */
function Item({
  className,
  variant = "default",
  size = "default",
  render,
  indicator,
  children,
  ...props
}: useRender.ComponentProps<"div"> & VariantProps<typeof itemVariants> & { indicator?: IndicatorProp }) {
  const said = indicatorLabel(indicator)
  const inGroup = React.useContext(ItemGroupContext)
  const tag = render === undefined ? "div" : React.isValidElement(render) && typeof render.type === "string" ? render.type : null
  // In an ItemGroup: a plain row is the list item; an <li> already is one; anything else (a link,
  // a button, a component) keeps its own role inside a list-item box.
  const plain = tag !== null && PLAIN_TAGS.has(tag)
  const boxed = inGroup && !plain && tag !== "li"
  const row = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        role: inGroup && plain ? "listitem" : undefined,
        className: cn(itemVariants({ variant, size, className })),
        children: said ? (
          <>
            {children}
            <IndicatorMark indicator={indicator} />
            <span className="sr-only">{said}</span>
          </>
        ) : (
          children
        ),
      },
      props
    ),
    render,
    state: {
      slot: "item",
      variant,
      size,
    },
  })
  if (!boxed) return row
  return (
    <div role="listitem" data-slot="item-listitem" className="flex w-full min-w-0">
      {row}
    </div>
  )
}

const itemMediaVariants = cva(
  "gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start flex shrink-0 items-center justify-center [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        // A 20px icon in the secondary ink.
        icon: "text-support-foreground [&_svg:not([class*='size-'])]:size-5",
        // A square picture on the 2px corner: 40, 32 or 24.
        image: "size-10 overflow-hidden rounded-lg group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * The row's main action, when the row also has buttons of its own (a booking
 * link with Copy, a meeting with Join). It holds the media and content, and
 * its target stretches over the whole row, so the row clicks like one
 * button while `ItemActions` stay on top as separate controls. Render a link
 * with `render={<a href… />}`.
 */
function ItemMain({ className, ...props }: ButtonPrimitive.Props) {
  return (
    <ButtonPrimitive
      data-slot="item-main"
      className={cn(
        // Its ring is drawn on the row (Item's has-[…:focus-visible]), not on itself.
        "flex min-w-0 flex-1 items-center gap-4 text-left outline-none group-data-[size=sm]/item:gap-3 group-data-[size=xs]/item:gap-2 after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        "type-ui line-clamp-1 flex w-fit items-center gap-2 text-foreground underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "type-caption line-clamp-2 text-left text-support-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      // Above an ItemMain's stretched target.
      className={cn("gap-2 relative z-10 flex items-center", className)}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "gap-2 flex basis-full items-center justify-between",
        className
      )}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "gap-2 flex basis-full items-center justify-between",
        className
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemMain,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
