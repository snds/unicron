// Owned component (not generated): a closed vocabulary of trust tiers, each one word, one icon,
// one colour, paired by construction so no product can show colour alone.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
// Spec: docs/specs/security/risk-tier-badge.md
import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { IconButton } from "../icon-button"
import { badgeVariants } from "../ui/badge"

/**
 * The tier ids. They come from the signed bridge manifest and type the `tier` prop; people never
 * see them. `closed` (vendor push emulation) is never built, so it is not a value.
 */
export type RiskTier = "standard" | "official" | "tolerated"
export const riskTiers: readonly RiskTier[] = ["standard", "official", "tolerated"]

/** The badge's visual states: a tier, or one of the two states the host's manifest check produces. */
export type RiskTierState = RiskTier | "unverified" | "loading"

export interface RiskTierCopy {
  /** The word people see. Never omitted. */
  label: string
  /** One sentence for the explain control and the accessible description. */
  meaning: string
  /** The short form that follows the word in the accessible name ("Risk tier: Use with care. …"). */
  hint: string
  icon: IconName
}

/**
 * The copy map the component owns. Products pass a tier id and never the words, so the vocabulary
 * cannot drift and translation happens in one place. Plain words, because the badge must be
 * understood by people who are not technical and not security-minded (Lockdown D96).
 */
export const riskTierCopy: Record<RiskTierState, RiskTierCopy> = {
  standard: {
    label: "Built in",
    meaning: "An open, published method such as passkeys or one-time codes. Always on.",
    hint: "Open and always on.",
    icon: "verified_user",
  },
  official: {
    label: "Verified",
    meaning: "The vendor's own documented flow. On per use, when you are in front of the screen it shows.",
    hint: "The vendor's own flow.",
    icon: "policy",
  },
  tolerated: {
    label: "Use with care",
    meaning: "We built this ourselves. The vendor did not publish it, and it may stop working or break the vendor's terms.",
    hint: "Our own bridge, opt-in.",
    icon: "warning",
  },
  unverified: {
    label: "Unverified",
    meaning: "This could not be checked against its signed manifest. The action is blocked.",
    hint: "This action is blocked.",
    icon: "gpp_bad",
  },
  loading: {
    label: "Checking",
    meaning: "Checking the signed manifest.",
    hint: "Checking the signed manifest.",
    icon: "hourglass_empty",
  },
}

export const riskTierUnverifiedAnnouncement = "Risk tier unverified. This action is blocked."

export interface RiskTierBadgeProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** The tier id from the signed manifest. Type-checked; an unknown value renders `unverified`. */
  tier: RiskTier
  /**
   * The host's manifest check. Omit it while the check runs (the badge reads "Checking"); `false`
   * renders `unverified` whatever the tier; `true` shows the tier. A page can never set it.
   */
  verified?: boolean
  /** `sm` in list rows, `md` in detail and sheets. */
  size?: "sm" | "md"
  /** Show the help control that explains the tier and lists the manifest's disclosures. */
  explain?: boolean
  /** From the signed manifest; listed in the explain content. */
  disclosures?: string[]
  /** A tier is a fact, not a control, so only the explain button can be disabled. */
  explainDisabled?: boolean
}

const TIER_CLASSES: Record<RiskTierState, string> = {
  // Icon and text in the standard ink.
  standard: "bg-(--c-risk-tier-standard-bg) text-(--c-risk-tier-standard-ink)",
  // Text stays foreground for contrast; only the icon takes the ink.
  official: "bg-(--c-risk-tier-official-bg) text-foreground [&>svg]:text-(--c-risk-tier-official-ink)",
  tolerated: "bg-(--c-risk-tier-tolerated-bg) text-foreground [&>svg]:text-(--c-risk-tier-tolerated-ink)",
  // Outline, no fill.
  unverified: "border-(--c-risk-tier-unverified-ink) bg-transparent text-(--c-risk-tier-unverified-ink)",
  loading: "bg-muted text-muted-foreground animate-pulse motion-reduce:animate-none",
}

/**
 * Say in one word how much trust a path carries. The word is always present, the icon is
 * decorative, and the colour never carries the meaning alone.
 */
export function RiskTierBadge({
  tier,
  verified,
  size = "sm",
  explain = false,
  disclosures = [],
  explainDisabled = false,
  className,
  ...props
}: RiskTierBadgeProps) {
  const known = (riskTiers as readonly string[]).includes(tier)
  const state: RiskTierState = verified === undefined ? "loading" : verified === false || !known ? "unverified" : tier
  const copy = riskTierCopy[state]
  const descId = React.useId()

  // "Risk tier unverified…" is announced only when the state becomes unverified after a check,
  // never on first render (a page load is not news).
  const previous = React.useRef(state)
  const [announce, setAnnounce] = React.useState(false)
  React.useEffect(() => {
    if (previous.current !== "unverified" && state === "unverified") setAnnounce(true)
    previous.current = state
  }, [state])

  return (
    <span data-slot="risk-tier-badge" data-tier={state} data-size={size} className={cn("inline-flex items-center gap-0.5", className)} {...props}>
      <span
        data-slot="risk-tier-badge-pill"
        className={cn(
          badgeVariants({ variant: "secondary" }),
          "border font-medium [&>svg]:size-3.5!",
          size === "md" ? "h-(--c-risk-tier-height-md) text-sm" : "h-(--c-risk-tier-height-sm)",
          TIER_CLASSES[state],
          // High contrast: a 1px solid border in the tier ink, tint dropped, icon weight up.
          "contrast-more:border-current contrast-more:bg-transparent forced-colors:border-current forced-colors:bg-transparent",
          // Icon weight 500, 600 in high contrast. Set on the pill so the Icon inherits it.
          "[--c-icon-wght:500] contrast-more:[--c-icon-wght:600] forced-colors:[--c-icon-wght:600]",
          // Reduced motion: the icon fill does not animate.
          "motion-reduce:[&>svg>text]:transition-none!"
        )}
        aria-describedby={explain ? descId : undefined}
      >
        <span className="sr-only">Risk tier: </span>
        <Icon name={copy.icon} fill={state !== "loading"} data-icon="inline-start" />
        <span data-slot="risk-tier-badge-label">{copy.label}</span>
        <span className="sr-only">. {copy.hint}</span>
      </span>
      {explain && (
        <>
          <IconButton
            data-slot="risk-tier-badge-explain"
            icon="help"
            label={`What does ${copy.label} mean?`}
            variant="ghost-muted"
            size={size === "md" ? "icon-sm" : "icon-xs"}
            disabled={explainDisabled || state === "loading"}
            aria-describedby={descId}
            tooltip={<RiskTierExplain copy={copy} disclosures={disclosures} />}
          />
          {/* The same content as the tooltip, always in the tree, so aria-describedby resolves whether or not the tooltip is open. */}
          <span id={descId} className="sr-only">
            <RiskTierExplain copy={copy} disclosures={disclosures} />
          </span>
        </>
      )}
      {announce && (
        <span role="status" className="sr-only">
          {riskTierUnverifiedAnnouncement}
        </span>
      )}
    </span>
  )
}

function RiskTierExplain({ copy, disclosures }: { copy: RiskTierCopy; disclosures: string[] }) {
  return (
    <span data-slot="risk-tier-badge-explain-content" className="flex min-w-48 flex-col gap-1 text-left">
      <span>{copy.meaning}</span>
      {disclosures.length > 0 && (
        <ul className="list-disc pl-4">
          {disclosures.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </span>
  )
}
