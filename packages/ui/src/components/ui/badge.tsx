// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction; status words on the Synapse and Warpcore frames, no Figma component; no app PR, no DSA record)
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

/** What a badge says about its subject. The word carries it; the tone only backs it up. */
export type BadgeTone = "neutral" | "live" | "needs-you" | "critical" | "warning" | "success"

/** The names from before 1.0. Each draws as a tone. */
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"

const TONE_OF_VARIANT: Record<BadgeVariant, BadgeTone> = {
  default: "neutral",
  secondary: "neutral",
  outline: "neutral",
  ghost: "neutral",
  link: "neutral",
  destructive: "critical",
}

const tones = cva(
  // A mono caps word in a 20px box on the 2px control radius. Edges are inset, so they add no size.
  // Focus (a badge drawn as a link) is the stylesheet's one ring; nothing here resets it.
  "group/badge type-overline inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-lg px-1.5 whitespace-nowrap transition-[color,background-color,box-shadow] [a]:underline-offset-2 [a]:hover:underline [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      tone: {
        // A plain fact ("Stale", "No triggers"): label ink in a hairline box.
        neutral: "rule-box text-muted-foreground",
        // Live or agent activity ("Running"): the app's live ink in a hairline box.
        live: "rule-box text-secondary-live",
        // Waits on the person: the one solid tone, the yellow.
        "needs-you": "on-needs-you bg-needs-you-fill text-needs-you-on-fill",
        // An error ("Failed", "Clash"): the critical banner at badge size. Ink on the soft critical
        // ground inside a critical edge; critical ink on that ground falls under the label floor.
        critical: "bg-critical-soft text-foreground inset-ring inset-ring-critical-fill",
        // Worth a look, not an error: ink inside a warning edge. No wash: any tint under body ink
        // takes it below its floor on stone.
        warning: "text-foreground inset-ring inset-ring-warning",
        // Finished well ("Passing").
        success: "bg-success-surface text-success-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

type BadgeVariantProps = {
  /** What it says about its subject. Default `neutral`. */
  tone?: BadgeTone | null
  /** @deprecated Use `tone`. Kept so older call sites still draw: each name maps to a tone. */
  variant?: BadgeVariant | null
}

function toneOf({ tone, variant }: BadgeVariantProps): BadgeTone {
  return tone ?? (variant ? TONE_OF_VARIANT[variant] : "neutral")
}

/** A badge's classes, for something that is drawn as one (a link). `tone` wins over a legacy `variant`. */
function badgeVariants(props?: BadgeVariantProps & { className?: string }): string {
  return cn(tones({ tone: toneOf(props ?? {}) }), props?.className)
}

/**
 * Badge: one or two status words with a tone, in mono caps ("Running", "Stale", "Clash"). Type the
 * word in sentence case; the type role sets the capitals. The tone never carries the meaning by
 * itself: the word does. Only `needs-you` is solid, and a screen has at most one needs-you mark.
 */
function Badge({
  className,
  tone,
  variant,
  render,
  ...props
}: useRender.ComponentProps<"span"> & BadgeVariantProps) {
  const resolved = toneOf({ tone, variant })
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: badgeVariants({ tone: resolved, className }),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      tone: resolved,
    },
  })
}

export { Badge, badgeVariants }
