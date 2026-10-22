---
name: unicron
version: 0.1.0
description: Shared visual identity for Mailbird, Synapse and Lockdown. Calm, cool-neutral, high-contrast, quiet motion.
colors:
  neutral:
    "0": oklch(1 0 0)
    "50": oklch(0.974 0.003 260)
    "100": oklch(0.948 0.004 260)
    "200": oklch(0.91 0.006 260)
    "400": oklch(0.71 0.01 260)
    "500": oklch(0.556 0.012 260)
    "800": oklch(0.26 0.01 260)
    "900": oklch(0.185 0.008 260)
    "950": oklch(0.145 0.006 260)
  primary: "{colors.neutral.900}"
  secondary: "{colors.neutral.100}"
  tertiary: oklch(0.6 0.19 255)
  danger: oklch(0.577 0.245 27.3)
typography:
  sans: '"Inter Variable", ui-sans-serif, system-ui, sans-serif'
  mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace
  body-size: 0.875rem
rounded:
  base: 0.625rem
  sm: 0.375rem
  lg: 0.625rem
  xl: 0.875rem
spacing:
  unit: 0.25rem
motion:
  fast: 120ms
  base: 200ms
  ease: cubic-bezier(0.2, 0, 0, 1)
iconography:
  family: Material Symbols Rounded
  weight: 400
  optical-size: 20
---

# unicron — visual identity

## Overview

unicron is the look that Mailbird (mail, calendar, contacts, notes), Synapse and Lockdown (a
password manager and authenticator) share. It should feel like a well-made native utility, not a
marketing site: calm surfaces, strong text contrast, one accent at a time, and motion you only
notice when it is missing. Brand lives in tokens; behaviour follows the platform. The reference
point is Apple's first-party productivity apps rendered with shadcn's restraint.

## Colors

- The neutral ramp is slightly cool (hue 260) so long reading sessions feel quiet. Everything
  structural (`background`, `card`, `popover`, `border`, `muted`) is drawn from it.
- `primary` is near-black in light mode and near-white in dark mode. It is the default button and
  the strongest text, never a brand colour.
- Accent hues (blue, coral, green, amber) exist in tier 1 but are not semantic roles. Apps assign
  them (one hue per area for wayfinding). `destructive` is the only chromatic role in the core.
- Dark mode swaps only tier 2. Separators and control borders become translucent white (10% / 35%)
  so they sit on any dark surface. Accents step one stop lighter (500 → 400) to keep contrast.
- An accent hue drawn as text (an area's name, a status word, a link) uses its text step: `600` in
  light, `300` in dark (`blue`, `coral`, `green`, `amber`). They read Lc 75 or more on the page, the
  chrome and a selected row. `500` and `400` are fills: as text they read Lc 32-67. Red's text
  steps are `700` and `200` (`--destructive`), because red is drawn at more chroma.
- Text has three inks, a level apart each, placed as Emphasis Engine places them: `foreground` is
  text level 5 (titles, body), `support-foreground` level 4 (the lines that explain: descriptions,
  an empty state's text, `type-support`), `muted-foreground` level 3 (the lines that label: meta,
  captions, overlines, placeholders, inactive tabs, keys). Drawn in WebKit, they land about 99, 83
  and 70 in light and 99, 85 and 73 in dark: at least 12 apart, where two inks gave one level for
  every lower role. Icons inside secondary text take weight 300 so they draw at its level.
- Before the support level, `foreground` was text level 5 and `muted-foreground` level 3. Secondary text reads Lc 75 or more on every surface and at
  least Lc 20 under primary text (Lc 81 under 106 on white; Lc 80 under 105 in dark), so it reads
  as secondary, not as a slightly greyer primary. Inside a fill (`bg-muted`, `bg-accent`,
  `bg-secondary`, a highlighted or selected item, a key) it takes `muted-foreground-on-fill`, a
  shade stronger in light mode, so it still reads Lc 75 there; components and apps keep writing
  `text-muted-foreground`.
- Control borders are strong enough to find a field (3:1, `neutral.450` in light); separators stay
  quiet (`neutral.200`). Every pair a component paints is held to its element kind's contrast floor,
  APCA first (docs/02-tokens.md → Contrast).

## Typography

Inter Variable for everything, including headings (`--font-heading` aliases `--font-sans`). Body
is 14px. Monospace is the platform stack.

Every size comes from a **text role**, never a hand-picked pixel size (`text-[11px]`). The roles
step by about 1.2, so each level reads as one; weight and ink do the rest:

| Role | Size / leading | Weight | Ink | For |
|---|---|---|---|---|
| `type-page-title` | 20 / 28 | 600 | inherits | a screen's subject |
| `type-section-title` | 16 / 24 | 600 | inherits | a section of a page |
| `type-group-title` | 14 / 20 | 600 | inherits | a card's heading, a group |
| `type-body` | 14 / 22 | 400 | inherits | reading text |
| `type-body-strong` | 14 / 20 | 500 | inherits | the phrase that matters in a row |
| `type-support` | 13 / 20 | 400 | support (level 4) | what explains the line above |
| `type-meta` | 12 / 16 | 400, tabular | muted | when, how many, where |
| `type-overline` | 11 / 16, +0.06em, caps | 500 | muted | a short label above what it names |

`type-measure` caps prose at 72ch. Titles and body inherit their ink so a selected row's accent ink
reaches them; a single-purpose utility (`text-primary`, `font-medium`) still overrides a role.

## Layout

Four-pixel spacing unit. Components are compact (buttons 32px tall by default, 28px small,
36px large). Group one-subject content in cards; separate sections with whitespace first and a
`Separator` only when whitespace fails. Scroll areas keep page scroll native.

## Elevation & depth

Mostly flat. Popovers and menus get a 1px `ring-foreground/10` and a soft shadow; menus blur what
is behind them. Dialog backdrops are a 10% black wash with a slight blur, not a blackout.

## Shapes

Base radius 10px (`--radius`). The Tailwind scale is derived from it (sm 0.6×, md 0.8×, lg 1×,
xl 1.4×, 2xl 1.8×, 3xl 2.2×, 4xl 2.6×), so one token change re-rounds the whole system. Avatars,
badges and toggles are fully round; cards and dialogs use `xl`.

## Components

Every primitive comes from shadcn/ui (`base-nova`) on Base UI and uses Material Symbols Rounded
through the `Icon` component. Icons are variable-font axes (`fill`, `weight`, `grade`, `optical
size`) driven by `--c-icon-*`, so state changes animate (outline → filled) instead of swapping
glyphs. Component semantics, anatomy and states are owned by the component docs, not this file.

## Do's and Don'ts

- Do reach for a semantic token (`bg-background`, `text-muted-foreground`); never a `--g-*` value
  in a component.
- Do add app-only roles in the app's extension layer, never in the core semantic tier.
- Don't introduce a second accent inside one surface; one hue carries one meaning.
- Don't animate layout; animate opacity, transform and the icon axes, at 120–200ms with the
  standard ease.
- Don't restyle a primitive with `className` overrides to make a new component; add a variant or
  compose a pattern and let `dsa` see it.

## Semantic token list (tier 2, the shadcn contract)

`background` `foreground` `card` `card-foreground` `popover` `popover-foreground` `primary`
`primary-foreground` `secondary` `secondary-foreground` `muted` `muted-foreground` `accent`
`accent-foreground` `destructive` `border` `input` `ring` `radius` `sidebar` `sidebar-foreground`
`sidebar-primary` `sidebar-primary-foreground` `sidebar-accent` `sidebar-accent-foreground`
`sidebar-border` `sidebar-ring` · fonts: `font-sans` `font-mono` `font-heading`.
