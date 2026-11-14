// Owned component (not generated): a compact tile for a tag, a label, or a linked thing, with an
// optional main action and an optional remove.
// Promoted from: snds/mailbird · PR snds/unicron#9 · DSA none (hand-raised in Mailbird ADR-0057)
// Promoted from: Seeded in snds/unicron (2026-11 design direction: square on the 2px corner, 24 tall as a Filter Chip (Figma 15:503); tone critical from contract 5.1b #24; no app PR, no DSA record)
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"
import { IconButton, type IconButtonProps } from "./icon-button"

// 24 tall, as a Filter Chip, on the 2px corner. The value in `caption`, as written (a name, an
// address, a tag: never forced to capitals). A leading ChipAction brings its own left padding; a
// trailing ChipRemove is the chip's full height and sits at its end.
const chipVariants = cva(
  "type-caption inline-flex h-6 max-w-full min-w-0 shrink-0 items-center gap-1 rounded-lg px-2 text-foreground [&>span]:min-w-0 [&>span]:truncate has-[>[data-slot=chip-action]:first-child]:pl-0 has-[>[data-slot=chip-remove]:last-child]:pr-0 has-[>[data-slot=chip-remove]:last-child]:gap-0.5 [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // A linked thing (an event, a person): a hairline box on the ground.
        outline: "rule-box",
        // A tag: the raised surface with its hairline.
        secondary: "bg-surface-raised rule-box",
        // A label or a value in a form: the raised surface.
        muted: "bg-surface-raised",
      },
      // `critical`: a value that is wrong (an address that is not one). The critical Banner and
      // Badge at chip size: ink on the soft critical ground, inside a 1px critical edge.
      tone: {
        neutral: "",
        critical: "bg-critical-soft inset-ring inset-ring-critical-fill",
      },
    },
    defaultVariants: { variant: "muted", tone: "neutral" },
  }
)

/**
 * A small tile holding a short value. Text on its own, or with parts:
 *
 *   <Chip variant="secondary">#trip <ChipRemove label="Remove tag trip" onClick={…} /></Chip>
 *   <Chip variant="outline"><ChipAction onClick={open}><Icon name="calendar" /><span>Design crit</span></ChipAction><ChipRemove label="Unlink Design crit" onClick={…} /></Chip>
 *
 * `tone="critical"` marks a wrong value. Say what is wrong in words too (a line under the field):
 * colour is never the only signal.
 */
function Chip({
  className,
  variant = "muted",
  tone = "neutral",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof chipVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">({ className: cn(chipVariants({ variant, tone, className })), "data-tone": tone } as React.ComponentProps<"span">, props),
    render,
    state: { slot: "chip", variant },
  })
}

// The chip's own controls: the hover and pressed washes, the stylesheet's focus ring drawn just
// inside the chip (a ring outside would be clipped by the chip's edge), 44px to a finger.
// No `outline-none` here: in Tailwind 4 it sets --tw-outline-style to none, and `outline-2` reads
// that variable, so the two together draw no ring at all. The stylesheet's one :focus-visible rule
// draws the 2px ink ring; this only moves it inside the chip.
const CHIP_CONTROL =
  "hit-area transition-colors hover:bg-state-hover active:bg-state-pressed focus-visible:-outline-offset-2 disabled:pointer-events-none disabled:opacity-50"

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
        CHIP_CONTROL,
        "flex h-full min-w-0 items-center gap-1 pr-1 pl-2 text-left last:pr-2 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&>span]:truncate",
        className
      )}
      {...props}
    />
  )
}

export type ChipRemoveProps = Omit<IconButtonProps, "icon" | "render" | "variant" | "size" | "children">

/**
 * Takes the chip away. `label` says what it removes ("Remove tag trip"); it's also the tooltip.
 * A 24px square, the chip's own height, with a 16px close glyph; 44px to a finger.
 */
function ChipRemove(props: ChipRemoveProps) {
  return (
    <IconButton
      data-slot="chip-remove"
      icon="close"
      render={<ButtonPrimitive className={cn(CHIP_CONTROL, "flex size-6 shrink-0 items-center justify-center text-support-foreground hover:text-foreground [&_svg]:size-4")} />}
      {...props}
    />
  )
}

export { Chip, ChipAction, ChipRemove }
