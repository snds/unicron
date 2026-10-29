// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/mailbird · PR snds/unicron#2 · DSA 389e81101949 (shape="pill"); none (ghost-muted, ghost-destructive, raised from correct-use override counts)
// Promoted from: snds/mailbird · PR snds/unicron#9 · DSA none (size="inline"; hand-raised in Mailbird ADR-0057)
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const variants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/60 dark:aria-invalid:ring-destructive/50 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-[color,background-color,border-color,box-shadow,translate] outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80 active:bg-primary/90",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground active:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_8%)] dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:active:bg-input/70 aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] active:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_10%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 active:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_8%)] dark:active:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: "bg-destructive/10 hover:bg-destructive/20 active:bg-destructive/15 dark:bg-destructive/20 text-destructive dark:hover:bg-destructive/30 dark:active:bg-destructive/25",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
        // Quiet secondary actions ("Add holidays and more"): ghost, in muted ink until hovered.
        "ghost-muted": "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 active:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_8%)] dark:active:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        // A destructive action that shouldn't shout (Delete in a dialog footer): ghost, in destructive ink.
        // It hovers on its own tint, not bg-muted, so the hover still shows on a muted fill (a footer).
        "ghost-destructive": "text-destructive hover:bg-destructive/10 active:bg-destructive/15 dark:hover:bg-destructive/20 dark:active:bg-destructive/25 aria-expanded:bg-destructive/10 dark:aria-expanded:bg-destructive/20",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        // A text action inside a line of text ("Sign in again"): no box of its own, so it sits
        // on the sentence's baseline in its size. Pair with variant="link". Underlined at rest:
        // its colour alone is under 3:1 against the sentence around it (2.98:1 light, 1.29:1 dark).
        inline: "h-auto gap-1 rounded-sm border-0 p-0 align-baseline underline underline-offset-3 text-[length:inherit] leading-[inherit] [&_svg:not([class*='size-'])]:size-[1em]",
      },
      // Pill: fully rounded, for chips and filter rows. Text pills get a little more
      // side padding, because the round ends eat into it.
      shape: {
        default: "",
        pill: "rounded-full",
      },
    },
    compoundVariants: [
      { shape: "pill", size: ["xs", "sm"], className: "px-3" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
)

/**
 * A button's classes, merged. The base carries `border-transparent` and a variant its own border
 * colour (`outline`: `border-border`); unmerged, both land in the class list and the stylesheet's
 * order picks the winner, which was the transparent one in light mode. So a link drawn as a button
 * (`<Link className={buttonVariants({ variant: "outline" })}>`) had no edge beside a real button.
 * Merging here makes every caller get what Button gets.
 */
function buttonVariants(props?: Parameters<typeof variants>[0]): string {
  return cn(variants(props))
}

function Button({
  className,
  variant = "default",
  size = "default",
  shape = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
