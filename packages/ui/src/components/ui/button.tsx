// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/mailbird · PR snds/unicron#2 · DSA 389e81101949 (shape="pill"); none (ghost-muted, ghost-destructive, raised from correct-use override counts)
// Promoted from: snds/mailbird · PR snds/unicron#9 · DSA none (size="inline"; hand-raised in Mailbird ADR-0057)
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:478; no app PR, no DSA record)
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"
import { cn } from "../../lib/utils"
import { useDisabledReason } from "./field"
import { indicatorOnControl, type IndicatorProp } from "./indicator"
import { Spinner } from "./spinner"

// The label of every boxed size: mono caps. Sizes under 44px also take `hit-area` (@unicron/ui's
// styles), which widens the touch target to 44px on a coarse pointer. `inline` takes neither.
const LABEL = "type-overline"

// Transparent kinds: an ink wash on hover and a stronger one while pressed or while their menu is open.
const WASH = "hover:bg-state-hover active:bg-state-pressed aria-expanded:bg-state-pressed"
// Two washes on the needs-you yellow too, in the ink that sits on it (the page's ink is near-white
// on graphite, and would lighten the yellow instead of marking it). 5% and 9%: at 10% the label
// on the pressed wash measures Lc 74.8, just under the Lc 75 that text on a fill is held to.
// `on-needs-you` points the focus ring at that ink as well.
const WASH_ON_NEEDS_YOU = "on-needs-you hover:bg-needs-you-on-fill/5 active:bg-needs-you-on-fill/9 aria-expanded:bg-needs-you-on-fill/9"
// A 1px edge drawn inside the box, so an outlined button is exactly as wide as a solid one.
const OUTLINE = "inset-ring inset-ring-foreground text-foreground"

const variants = cva(
  // No border, and nothing about focus: the edge of an outlined kind is an inset ring, and the
  // focus ring is the stylesheet's one rule for every control (2px solid --ring, 2px clear of it).
  // A control opts out of that rule with outline-none; this one must not.
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg whitespace-nowrap select-none transition-[color,background-color,box-shadow,translate] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:not-aria-busy:opacity-50 aria-busy:[&>svg]:hidden aria-invalid:inset-ring-2 aria-invalid:inset-ring-critical-fill [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: the app's identity. One per screen.
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        // Secondary: transparent, a 1px ink edge, an ink label.
        secondary: cn(OUTLINE, WASH),
        // The same button under its older name.
        outline: cn(OUTLINE, WASH),
        // Text only. The same padding as the boxed kinds, so it lines up beside one.
        ghost: cn("text-foreground", WASH),
        destructive: "bg-critical-fill text-critical-on-fill hover:bg-critical-fill/90 active:bg-critical-fill/80",
        link: "text-primary-text underline-offset-4 hover:underline active:text-primary-text/80",
        // Quiet secondary actions ("Add holidays and more"): ghost, in label ink until hovered.
        "ghost-muted": cn("text-muted-foreground hover:text-foreground aria-expanded:text-foreground", WASH),
        // A destructive action that shouldn't shout (Delete in a dialog footer): ghost, in critical
        // ink. Under the pointer it becomes the critical fill: a wash under critical ink falls
        // below the label floor on graphite (Lc 58.6), and the fill shows on any surface.
        "ghost-destructive":
          "text-destructive hover:bg-critical-fill hover:text-critical-on-fill active:bg-critical-fill/80 active:text-critical-on-fill aria-expanded:bg-critical-fill aria-expanded:text-critical-on-fill",
        // The three kinds for the needs-you yellow, and only there. One solid action per block;
        // the second action is `needs-you-text`.
        "needs-you":
          "on-needs-you bg-needs-you-on-fill text-needs-you-fill hover:bg-needs-you-on-fill/90 active:bg-needs-you-on-fill/80",
        "needs-you-outline": cn("inset-ring inset-ring-needs-you-on-fill text-needs-you-on-fill", WASH_ON_NEEDS_YOU),
        "needs-you-text": cn("text-needs-you-on-fill", WASH_ON_NEEDS_YOU),
      },
      size: {
        // M: 40 tall, 12 / 16 padding.
        default: cn(LABEL, "hit-area h-10 px-4 py-3"),
        // S: 32 tall, 8 / 12 padding. For rows and toolbars.
        sm: cn(LABEL, "hit-area h-8 px-3 py-2"),
        // The floating-control height (size/control, 48).
        lg: cn(LABEL, "h-control px-4 py-4"),
        // Older names, kept working: each is the nearest of the three heights.
        xs: cn(LABEL, "hit-area h-8 px-3 py-2"),
        // Icon only: squares of the same heights.
        icon: "hit-area size-10",
        "icon-xs": "hit-area size-8",
        "icon-sm": "hit-area size-8",
        "icon-lg": "size-control",
        // A text action inside a line of text ("Sign in again"): no box and no caps of its own, so
        // it sits on the sentence's baseline in its size. Pair with variant="link". Underlined at
        // rest: its colour alone does not separate it from the sentence around it.
        inline: "h-auto gap-1 rounded-sm p-0 align-baseline underline underline-offset-3 text-[length:inherit] leading-[inherit] [&_svg:not([class*='size-'])]:size-[1em]",
      },
      // Deprecated: a control has one corner, the 2px control radius. `pill` is accepted and draws it.
      shape: {
        default: "",
        pill: "",
      },
      // Stretch to the container (a sidebar's "Compose").
      block: {
        true: "flex w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
      block: false,
    },
  }
)

/**
 * A button's classes, merged, so a link drawn as a button
 * (`<Link className={buttonVariants({ variant: "secondary" })}>`) gets exactly what Button gets,
 * and a caller's class replaces the variant's instead of landing beside it.
 */
function buttonVariants(props?: Parameters<typeof variants>[0]): string {
  return cn(variants(props))
}

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Something behind the button wants the person (`attention`, `unread`): a mark in its corner, and the words in its name. */
    indicator?: IndicatorProp
    /**
     * The action is running. The button says so (`aria-busy`), stops taking presses, keeps its
     * label and its place in the tab order, and shows a spinner where its icon goes.
     */
    loading?: boolean
    /**
     * Why the button is disabled, shown as a line under it (contract 5.1b #37: "Fix or remove the
     * address in red."). With `disabled`, the button then stays in the tab order (`aria-disabled`)
     * and points at the line with `aria-describedby`, so the reason is read with its name.
     */
    disabledReason?: React.ReactNode
  }

/**
 * Button: a mono caps label on a 2px corner. `default` is the screen's one primary action;
 * `secondary` (and `outline`) the ink outline; `ghost` text only; `destructive` the critical fill;
 * the `needs-you*` kinds belong on the yellow and nowhere else. Sizes `default` (40), `sm` (32,
 * rows and toolbars) and `lg` (48); `icon*` are squares of those heights and need an `aria-label`.
 * An icon is a child (`<Icon name="add" />`) and draws at 16px.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  shape = "default",
  block = false,
  loading = false,
  disabled,
  focusableWhenDisabled,
  indicator,
  disabledReason,
  children,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  ...props
}: ButtonProps) {
  const on = indicatorOnControl(indicator, ariaLabel)
  const reason = useDisabledReason(disabled && !loading, disabledReason, describedBy)
  const button = (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-label={on?.label ?? ariaLabel}
      aria-busy={loading || undefined}
      aria-describedby={reason.describedBy}
      disabled={disabled || loading}
      // A button that goes busy under the keyboard keeps focus: it is aria-disabled, not removed.
      // So does one disabled with a reason: the reason must be reachable.
      focusableWhenDisabled={focusableWhenDisabled ?? ((loading && !disabled) || reason.active)}
      className={cn(buttonVariants({ variant, size, shape, block, className: cn(on && "relative", className) }))}
      {...props}
    >
      {loading ? (
        // Decorative here: the button's own aria-busy says it, and its name stays the label.
        <span data-slot="button-spinner" aria-hidden="true" className="inline-flex">
          <Spinner />
        </span>
      ) : null}
      {children}
      {on?.mark}
      {on?.words}
    </ButtonPrimitive>
  )
  if (!reason.active) return button
  // The reason sits under the button, left-aligned with it (a `block` button keeps its width).
  return (
    <span data-slot="button-with-reason" className={cn("inline-flex flex-col items-start gap-1", block && "flex w-full items-stretch")}>
      {button}
      {reason.line}
    </span>
  )
}

export { Button, buttonVariants, type ButtonProps }
