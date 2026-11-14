// Owned component (not generated): a closed vocabulary of trust tiers, each one word, one icon,
// one colour, paired by construction so no product can show colour alone.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
// Promoted from: Seeded in snds/unicron (2026-11 design direction: Badge's mono caps and square corner; no app PR, no DSA record)
// Spec: docs/specs/security/risk-tier-badge.md
"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { badgeVariants, type BadgeTone } from "../ui/badge"
import { Tooltip, TooltipContent } from "../ui/tooltip"
import { TextAction } from "./parts"

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
    icon: "security",
  },
  official: {
    label: "Verified",
    meaning: "The vendor's own documented flow. On per use, when you are in front of the screen it shows.",
    hint: "The vendor's own flow.",
    icon: "rule",
  },
  tolerated: {
    label: "Use with care",
    meaning: "We built this ourselves. The vendor did not publish it, and it may stop working or break the vendor's terms.",
    hint: "Our own bridge, opt-in.",
    icon: "warning--alt",
  },
  unverified: {
    label: "Unverified",
    meaning: "This could not be checked against its signed manifest. The action is blocked.",
    hint: "This action is blocked.",
    icon: "rule--cancelled",
  },
  loading: {
    label: "Checking",
    meaning: "Checking the signed manifest.",
    hint: "Checking the signed manifest.",
    icon: "hourglass",
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
  /**
   * What the badge sits on. `needs-you`: the yellow of an asking AgentPrompt. The word, the glyph
   * and the edge then take the ink that sits on that fill; the page's own inks are near-white on
   * graphite and cannot be read on the yellow. Default `page`.
   */
  surface?: "page" | "needs-you"
}

/**
 * Each state as a Badge tone: the word carries the tier, the glyph backs it up, and the tone only
 * sorts them into quiet (built in, verified, checking), careful (use with care) and blocked
 * (unverified). No tier takes the live colour or the primary: neither is about trust.
 */
const TIER_TONE: Record<RiskTierState, BadgeTone> = {
  standard: "neutral",
  official: "neutral",
  tolerated: "warning",
  unverified: "critical",
  loading: "neutral",
}

const TIER_CLASSES: Record<RiskTierState, string> = {
  // Built in: the label ink, as any neutral badge.
  standard: "",
  // Verified: the word in body ink, so it reads a step above Built in without a colour of its own.
  official: "text-text-body",
  tolerated: "",
  unverified: "",
  loading: "animate-pulse motion-reduce:animate-none",
}

/**
 * On the needs-you yellow every state but the blocked one is the yellow's own ink inside a 1px
 * edge of that ink: the word and the glyph still tell the tiers apart, as they must anywhere.
 * `unverified` keeps its critical tile, which brings its own ground and its own ink.
 */
const ON_NEEDS_YOU = "text-needs-you-on-fill inset-ring inset-ring-needs-you-on-fill"

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
  surface = "page",
  className,
  ...props
}: RiskTierBadgeProps) {
  const known = (riskTiers as readonly string[]).includes(tier)
  const state: RiskTierState = verified === undefined ? "loading" : verified === false || !known ? "unverified" : tier
  const copy = riskTierCopy[state]
  const descId = React.useId()
  const onYellow = surface === "needs-you"

  // "Risk tier unverified…" is announced only when the state becomes unverified after a check,
  // never on first render (a page load is not news).
  const previous = React.useRef(state)
  const [announce, setAnnounce] = React.useState(false)
  React.useEffect(() => {
    if (previous.current !== "unverified" && state === "unverified") setAnnounce(true)
    previous.current = state
  }, [state])

  return (
    <span data-slot="risk-tier-badge" data-tier={state} data-size={size} data-surface={surface} className={cn("inline-flex items-center gap-2", className)} {...props}>
      <span
        data-slot="risk-tier-badge-pill"
        className={cn(
          badgeVariants({ tone: TIER_TONE[state] }),
          size === "md" ? "h-(--c-risk-tier-height-md) px-2" : "h-(--c-risk-tier-height-sm)",
          TIER_CLASSES[state],
          onYellow && state !== "unverified" && ON_NEEDS_YOU,
          // High contrast and forced colours: the inset edges are dropped by the browser, so a real
          // 1px border in the tier ink takes their place, and any tint goes.
          "contrast-more:border contrast-more:border-current contrast-more:bg-transparent forced-colors:border forced-colors:border-current forced-colors:bg-transparent"
        )}
        aria-describedby={explain ? descId : undefined}
      >
        <span className="sr-only">Risk tier: </span>
        <Icon name={copy.icon} size="sm" data-icon="inline-start" />
        <span data-slot="risk-tier-badge-label">{copy.label}</span>
        <span className="sr-only">. {copy.hint}</span>
      </span>
      {explain && (
        <>
          <Tooltip>
            <TooltipPrimitive.Trigger
              render={
                <TextAction
                  data-slot="risk-tier-badge-explain"
                  icon="help"
                  aria-label={`What does ${copy.label} mean?`}
                  className={onYellow ? "text-needs-you-on-fill" : "text-text-label hover:text-text-body"}
                  disabled={explainDisabled || state === "loading"}
                  aria-describedby={descId}
                />
              }
            />
            <TooltipContent>
              <RiskTierExplain copy={copy} disclosures={disclosures} />
            </TooltipContent>
          </Tooltip>
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
    <span data-slot="risk-tier-badge-explain-content" className="type-caption flex min-w-48 flex-col gap-1 text-left">
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
