// Owned component (not generated): a compact pill for a tag, a label, or a linked thing, with an
// optional main action and an optional remove.
// Promoted from: snds/mailbird · hand-raised (ADR-0057 raw-button sweep) · DSA none
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"
import { IconButton, type IconButtonProps } from "./icon-button"
import { Button } from "./ui/button"

// The chip's own padding steps aside for its parts: a leading ChipAction brings its own left
// padding, and a trailing ChipRemove sits 2px from the round end.
const chipVariants = cva(
  "inline-flex h-7 max-w-full shrink-0 items-center gap-1 overflow-hidden rounded-full px-2.5 text-xs has-[>[data-slot=chip-action]:first-child]:pl-0 has-[>[data-slot=chip-remove]:last-child]:pr-0.5 has-[>[data-slot=chip-remove]:last-child]:gap-0.5 [&>svg:not([class*='size-'])]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        // A linked thing (an event, a person): quiet, with an edge.
        outline: "border border-border bg-muted/50",
        // A tag.
        secondary: "bg-secondary text-secondary-foreground",
        // A label or a value in a form.
        muted: "bg-muted",
      },
    },
    defaultVariants: { variant: "muted" },
  }
)

/**
 * A pill holding a short value. Text on its own, or with parts:
 *
 *   <Chip variant="secondary">#trip <ChipRemove label="Remove tag trip" onClick={…} /></Chip>
 *   <Chip variant="outline"><ChipAction onClick={open}><Icon name="event" /><span>Design crit</span></ChipAction><ChipRemove label="Unlink Design crit" onClick={…} /></Chip>
 */
function Chip({ className, variant = "muted", render, ...props }: useRender.ComponentProps<"span"> & VariantProps<typeof chipVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">({ className: cn(chipVariants({ variant, className })) }, props),
    render,
    state: { slot: "chip", variant },
  })
}

/**
 * The chip's main action (open what it stands for), filling it edge to edge so the whole label
 * is the target. Long text truncates when wrapped in a <span>. Pass it to a TooltipTrigger's
 * `render` to explain where it goes.
 */
function ChipAction({ className, ...props }: ButtonPrimitive.Props) {
  return (
    <ButtonPrimitive
      data-slot="chip-action"
      className={cn(
        "flex h-full min-w-0 items-center gap-1 pr-1 pl-2.5 text-left outline-none transition-colors last:pr-2.5 hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-60 [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:shrink-0 [&>span]:truncate",
        className
      )}
      {...props}
    />
  )
}

export type ChipRemoveProps = Omit<IconButtonProps, "icon" | "render" | "variant" | "size" | "children">

/** Takes the chip away. `label` says what it removes ("Remove tag trip"); it's also the tooltip. */
function ChipRemove(props: ChipRemoveProps) {
  return <IconButton data-slot="chip-remove" icon="close" render={<Button variant="ghost-muted" size="icon-xs" shape="pill" />} {...props} />
}

export { Chip, ChipAction, ChipRemove }
