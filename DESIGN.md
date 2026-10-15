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
- Dark mode swaps only tier 2. Borders and inputs become translucent white (10% / 15%) so they
  sit on any dark surface. Accents step one stop lighter (500 → 400) to keep contrast.

## Typography

Inter Variable for everything, including headings (`--font-heading` aliases `--font-sans`). Body
is 14px (`text-sm`); headings use weight, not size jumps. Monospace is the platform stack.

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
