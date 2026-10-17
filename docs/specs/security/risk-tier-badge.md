# RiskTierBadge

_Spec v0.2 · 2026-10-17 · Proposed by Lockdown (brief §2.9 risk tiers, §5.7; `03-architecture.md` §9) · Status: built in `@unicron/ui` 0.4.0 (PR #16); this spec describes the build_

## Purpose and the user job

A person deciding whether to use a sign-in path, a bridge, a plug-in, or an agent grant needs to know, in one glance and one word, how much trust it carries. The badge is a closed vocabulary of three tiers with one word, one icon, and one color each, read from a signed manifest and never reinterpreted by a product. Lockdown shows it on bridge-backed items, approvals, and agent grants; Mailbird shows the same tiers on plug-ins (Lockdown D6).

| Tier | Meaning | Default |
|---|---|---|
| `standard` | An open standard (passkeys, one-time codes, the sign-in-with map) | Always on |
| `official` | The vendor's own documented flow (device-code activation) | On, per use, behind the proximity rule |
| `tolerated` | Our own bridge, not the vendor's; terms-of-service risk | Off until the person opts in after a disclosure |

**The tier ids are internal** (they come from the signed bridge manifest and type the `tier` prop). **What people see is plain words** (Lockdown D96): `standard` → **Built in**, `official` → **Verified**, `tolerated` → **Use with care**. The component owns the copy map (`riskTierCopy`, keyed by `RiskTierState`, with `label`, `meaning`, `hint`, `icon`); products pass the id and never the words. No sentence in the map says "standard", so the id never appears as text. Core copy names no product: the tolerated meaning reads "We built this ourselves. The vendor did not publish it, and it may stop working or break the vendor's terms."

`closed` (vendor push emulation) is never built, so it is not a value. Crown jewel is an item class with its own treatment, not a tier; `01-principles.md` now uses this vocabulary.

## Uniqueness check

Composes `badgeVariants` (the pill classes, not the `Badge` element), `Icon`, and an optional `IconButton` with a `Tooltip`. Core kept it a component: it owns the vocabulary and its copy, and it pairs word, icon, and color by construction so no product can show color alone. The fallback (`Badge` variants plus an exported map) was not needed.

## Anatomy

```
risk-tier-badge                 span, data-tier (the resolved state), data-size
├─ risk-tier-badge-pill         badgeVariants secondary + tier classes; sr-only "Risk tier: " … ". <hint>"
│  ├─ (icon)                    Icon, aria-hidden, filled except while loading
│  └─ risk-tier-badge-label     "Built in" · "Verified" · "Use with care" · "Unverified" · "Checking" (never omitted)
├─ risk-tier-badge-explain      optional IconButton help → Tooltip with risk-tier-badge-explain-content
└─ (sr-only)                    the same explain content, always in the tree, for aria-describedby; role="status" on a transition to unverified
```

Icons: `verified_user` · `policy` · `warning` · `gpp_bad` (unverified) · `hourglass_empty` (loading).

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `tier` | `standard` · `official` · `tolerated` | Type-checked union; an unknown value at runtime renders `unverified` |
| `verified` | omitted · `false` · `true` | Tri-state: omitted means the check is running (`loading`, "Checking"); `false` renders `unverified` whatever the tier; `true` shows the tier. Fails closed |
| `size` | `sm` (default) · `md` | `sm` in list rows, `md` in detail and sheets |
| `explain` | boolean | Shows the help control |
| `disclosures` | `string[]` | From the signed manifest; listed in the explain content |
| `explainDisabled` | boolean | A tier is a fact, not a control, so only the help button can be disabled; it is also disabled while loading |

Other `span` props pass through. Exports: `RiskTier`, `RiskTierState`, `riskTiers`, `riskTierCopy`, `riskTierUnverifiedAnnouncement`. When several tiers apply to one surface, the host passes the lowest-trust one.

## States

| State | What changes |
|---|---|
| default | Tier tint and ink, icon, word. `standard`: icon and text in the standard ink. `official` and `tolerated`: text stays `foreground`, only the icon takes the ink |
| explain open | Tooltip in the top layer; `aria-describedby` already points at the sr-only copy |
| loading | `verified` omitted: muted pill, pulse (none under reduced motion), hourglass, "Checking" |
| unverified | `verified={false}` or an unknown tier: `destructive` outline, no fill, `gpp_bad`, "Unverified"; hosts block the action |
| disabled | n/a for the badge; `explainDisabled` for the help button |
| reduced motion | Icon fill does not animate |
| high contrast and forced colors | 1 px border in the current ink, tint dropped, icon weight 600 |

## Behavior and timing

- Copy lives in the component; the host's localization hook is still to come. Products never override the label.
- Explain content: the tier's `meaning` sentence, then `disclosures` as a list. The content is rendered twice: in the tooltip, and sr-only in the tree so the description resolves whether or not the tooltip is open.
- `verified` flips to `true` only after the host has checked the manifest signature. No timing of its own.

## Tokens

Tier 2: `secondary`, `muted`, `muted-foreground`, `foreground`, `destructive`, `border`, `info`, `warning` (both shipped in `@unicron/tokens` 0.2.0).

Tier 3 under `risk-tier`:

| Token | Aliases | Purpose |
|---|---|---|
| `--c-risk-tier-standard-ink` | `{muted-foreground}` | Icon and text |
| `--c-risk-tier-standard-bg` | `{secondary}` | |
| `--c-risk-tier-official-ink` | `{info}` | Icon only |
| `--c-risk-tier-official-bg` | `color-mix(in oklab, {info} 14%, transparent)` | |
| `--c-risk-tier-tolerated-ink` | `{warning}` | Icon only |
| `--c-risk-tier-tolerated-bg` | `color-mix(in oklab, {warning} 18%, transparent)` | |
| `--c-risk-tier-unverified-ink` | `{destructive}` | Outline, no fill |
| `--c-risk-tier-height-sm` | `1.25rem` | |
| `--c-risk-tier-height-md` | `1.5rem` | |

## Keyboard and screen reader

- The badge is static text, built from parts rather than an `aria-label`: sr-only "Risk tier: ", the visible word, sr-only ". " plus the hint ("Open and always on." · "The vendor's own flow." · "Our own bridge, opt-in." · "This action is blocked." · "Checking the signed manifest."). The icon is `aria-hidden`.
- The explain control is a real button named "What does Use with care mean?", described by the sentence and the disclosures; Escape closes the tooltip; focus stays on the button.
- "Risk tier unverified. This action is blocked." is spoken through the badge's own `role="status"` only when the state becomes `unverified` after a check, never on first render.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | `badgeVariants` + `Icon`; Base UI Tooltip in the top layer | The closed vocabulary, word always present, the tri-state `verified` |
| SwiftUI | `Label` in a capsule; SF Symbols: `checkmark.shield.fill`, `doc.text.magnifyingglass`, `exclamationmark.triangle.fill`, `xmark.shield.fill`, `hourglass` | Same copy from the generated strings; the same five states |
| Compose | `AssistChip` with leading icon, Material Symbols | Same |

One generated strings file should carry `riskTierCopy` for all three builds; today the web map is the source.

## Security notes

- The tier comes from the signed manifest after verification; the badge reads "Checking" or "Unverified" until the host says otherwise. A page can never set it.
- Never rendered inside web content (the extension's top-layer frame counts as ours).
- Fully opaque; minimum height `--c-risk-tier-height-sm`. The explain content is a tooltip with a 12rem minimum width; the spec's 16rem floor applies once it moves to a `Popover`.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- Shipped: `@unicron/ui` 0.4.0, `@unicron/tokens` 0.2.0; subpath `@unicron/ui/security/risk-tier-badge`.

## Acceptance tests

**Vitest (jsdom, `risk-tier-badge.test.tsx`, 6 tests):**

1. Every tier renders its plain word from the copy map; no render path yields an icon-only badge.
2. `verified` omitted reads "Checking"; `verified={false}` renders `unverified` for every tier.
3. The explain button's name includes the word, and its description lists every string in `disclosures`.
4. An unknown `tier` at runtime renders `unverified` (the type error is `pnpm typecheck`'s job).
5. "Risk tier unverified…" is announced only on a transition, not on first render.
6. The forced-colors and high-contrast class hooks are present.

**Still needs a browser:** screenshots of the three tiers at `sm` and `md`, loading, unverified, explain open, `prefers-contrast: more`, forced colors; axe contrast of label against tint at 4.5:1 in both modes; the tooltip's placement and width in the top layer.
