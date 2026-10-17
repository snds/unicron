# RiskTierBadge

_Spec v0.1 · 2026-10-17 · Proposed by Lockdown (brief §2.9 risk tiers, §5.7; `03-architecture.md` §9) · Status: proposed_

## Purpose and the user job

A person deciding whether to use a sign-in path, a bridge, a plug-in, or an agent grant needs to know, in one glance and one word, how much trust it carries. The badge is a closed vocabulary of three tiers with one word, one icon, and one color each, read from a signed manifest and never reinterpreted by a product. Lockdown shows it on bridge-backed items, approvals, and agent grants; Mailbird shows the same tiers on plug-ins (Lockdown D6: shared plug-in doctrine).

| Tier | Meaning | Default |
|---|---|---|
| `standard` | An open standard (passkeys, one-time codes, the sign-in-with map) | Always on |
| `official` | The vendor's own documented flow (device-code activation) | On, per use, behind the proximity rule |
| `tolerated` | Our own bridge, not the vendor's; terms-of-service risk | Off until the person opts in after a disclosure |

**The tier ids above are internal** (they come from the signed bridge manifest and type the `tier` prop). **What people see is plain words**, because the badge must be understood by non-technical, non-security-minded people (Lockdown D96): `standard` → **Built in**, `official` → **Verified**, `tolerated` → **Use with care**. The component owns this copy map (`riskTierCopy`); products pass the id and never the words, so the vocabulary cannot drift and translation happens in one place. The explain popover gives the one-sentence meaning of each.

`closed` (vendor push emulation) is never built, so it is not a value. Crown jewel is an item class with its own treatment, not a tier; the row in `01-principles.md` that lists `low / elevated / crown-jewel` should be corrected to this vocabulary when these specs land.

## Uniqueness check

Composes `Badge` (pill), `Icon`, and an optional `IconButton` → `Tooltip` (or `Popover` once it exists). This sits close to the line `06-contributing.md` draws against "a wrapper whose only job is a default prop value". It earns component status on two counts: it owns the vocabulary and its copy (products pass a tier id, never text, so the words cannot drift), and it pairs word, icon, and color by construction so no product can show color alone. If core judges that a variant, the fallback is `Badge variant="tier-standard" | …` plus an exported `riskTierCopy` map from the same module; the spec below applies either way.

## Anatomy

```
risk-tier-badge                 Badge shape="pill", data-tier
├─ risk-tier-badge-icon         Icon: verified_user · policy · warning (filled, weight 500)
├─ risk-tier-badge-label        "Standard" · "Official" · "Tolerated" (never omitted)
└─ risk-tier-badge-explain      optional IconButton (help) → one sentence + manifest disclosures
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `tier` | `standard` · `official` · `tolerated` | Type-checked union; no free text |
| `verified` | boolean | `false` renders the `unverified` state regardless of `tier` |
| `size` | `sm` · `md` | `sm` in list rows, `md` in detail and sheets |
| `explain` | boolean | Shows the help control |
| `disclosures` | `string[]` | From the signed manifest; listed in the explain popover |

When several tiers apply to one surface, the host passes the lowest-trust one. The badge does not aggregate.

## States

| State | What changes |
|---|---|
| default | Tier ink and tint, icon, word |
| explain open | Tooltip or popover in the top layer, `aria-describedby` wired |
| loading | Skeleton pill, label "Checking" (manifest not yet verified) |
| unverified | `destructive` outline, icon `gpp_bad`, word "Unverified"; hosts block the action |
| disabled | n/a: a tier is a fact, not a control. The explain button can be disabled |
| reduced motion | Icon fill does not animate |
| high contrast | 1px solid border in the tier ink; tint dropped; icon weight 600 |

## Behavior and timing

- Copy lives in the component and goes through the host's localization hook. Products never override the label.
- Explain content: one sentence per tier (for `tolerated`: "Lockdown built this itself. The vendor did not publish it, and it may stop working or break the vendor's terms.") followed by the manifest's `disclosures` as a list.
- `verified` flips to `true` only after the host has checked the manifest signature. Until then the badge is `loading`, and after a failed check it is `unverified`. No timing of its own.

## Tokens

Tier 2 used today: `secondary`, `secondary-foreground`, `muted-foreground`, `foreground`, `destructive`, `border`.

New tier 2 roles needed: **`info` / `info-foreground`** (`{blue.500}` light, `{blue.400}` dark; foreground `{neutral.0}` light, `{neutral.950}` dark) for `official`, and **`warning` / `warning-foreground`** (shared with ApprovalSheet and CodeDisplay) for `tolerated`. Blue and amber exist in tier 1 but have no semantic role, and a core primitive may not read `--g-*`.

Tier 3 to add under `risk-tier`:

| Token | Aliases | Purpose |
|---|---|---|
| `--c-risk-tier-standard-ink` | `{muted-foreground}` | Icon and text |
| `--c-risk-tier-standard-bg` | `{secondary}` | |
| `--c-risk-tier-official-ink` | `{info}` | |
| `--c-risk-tier-official-bg` | `color-mix(in oklab, {info} 14%, transparent)` | Text stays `{foreground}` for contrast; only the icon takes the ink |
| `--c-risk-tier-tolerated-ink` | `{warning}` | |
| `--c-risk-tier-tolerated-bg` | `color-mix(in oklab, {warning} 18%, transparent)` | |
| `--c-risk-tier-unverified-ink` | `{destructive}` | Outline, no fill |
| `--c-risk-tier-height-sm` | `1.25rem` | |
| `--c-risk-tier-height-md` | `1.5rem` | |

## Keyboard and screen reader

- The badge is static: `aria-label="Risk tier: Tolerated. Lockdown's own bridge, opt-in."` The icon is `aria-hidden`.
- The explain control is a real button named "What does Tolerated mean?"; its content is linked with `aria-describedby`; Escape closes it; focus returns to the button.
- `unverified` is announced as "Risk tier unverified. This action is blocked." through the host's live region when it appears after a check, not on first render.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | `Badge` + `Icon`; Base UI Tooltip in the top layer | The closed vocabulary, word always present, `unverified` state |
| SwiftUI | `Label` in a capsule; SF Symbols map: `checkmark.shield.fill`, `doc.text.magnifyingglass`, `exclamationmark.triangle.fill`, `xmark.shield.fill` | Same copy from the generated strings; the same four states |
| Compose | `AssistChip` with leading icon, Material Symbols | Same |

One generated strings file carries the copy and icon map for all three builds.

## Security notes

- The tier comes from the signed manifest after verification; the component shows `loading` or `unverified` until the host says otherwise. A page can never set it.
- Never rendered inside web content (the extension's top-layer frame counts as ours).
- Fully opaque; minimum height `--c-risk-tier-height-sm`; the explain popover is in the top layer and at least 16rem wide.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- changeset: minor (`@unicron/ui`; `@unicron/tokens` for `info`, `warning`, and `risk-tier.*`).

## Acceptance tests

**Screenshot (light and dark, each web engine):** three tiers at `sm` and `md`; `loading`; `unverified`; explain open; `prefers-contrast: more`; Windows forced colors (word and border survive).

**Playwright:**
1. Every rendered badge contains visible text equal to the tier word; no render path yields an icon-only badge.
2. `verified={false}` renders the `unverified` state for every `tier` value.
3. The explain button's accessible name includes the tier word, and its popover lists every string in `disclosures`.
4. Passing an unknown `tier` fails type-checking and, at runtime, renders `unverified`.
5. Contrast of label against tint is at least 4.5:1 in both modes (axe).
