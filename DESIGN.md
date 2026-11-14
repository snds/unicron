---
name: unicron
version: 1.0.0
description: Shared visual identity for Warpcore, Vale, Lockdown and Synapse. Square, flat, ink-first; one identity colour per app; quiet motion.
themes:
  apps: [warpcore, vale, lockdown, synapse]
  default: warpcore
  grounds: { graphite: dark, stone: light }
colors:
  # The default app (warpcore). Each app sets the same slots in packages/tokens/tokens/themes/<app>.json.
  graphite:
    surface-ground: "#18191D"
    surface-raised: "#212125"
    line-rule: "#313238"
    text-body: "#EFF0F3"
    text-secondary: "#D3D4D8"
    text-label: "#B2B4BA"
    text-faint: "#5F6066"
    primary-fill: "#5146EE"
    primary-text: "#A1AEFF"
    primary-soft: "#1F2343"
    secondary-live: "#1EC5E4"
  stone:
    surface-ground: "#EFF0F5"
    surface-raised: "#F7F8FD"
    line-rule: "#D1D2D9"
    text-body: "#151618"
    text-secondary: "#3C3D40"
    text-label: "#67696E"
    text-faint: "#A3A4AB"
    primary-fill: "#4837E0"
    primary-text: "#4E4DCD"
    primary-soft: "#D5DDFF"
    secondary-live: "#007491"
  needs-you: { fill: "#EDE54A", on-fill: "#1C1C1C" }
  critical: { graphite-fill: "#BE2323", stone-fill: "#B7191C" }
typography:
  sans: '"Geist Variable", Geist, ui-sans-serif, system-ui, sans-serif'
  mono: '"Geist Mono Variable", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
  roles: 23
rounded:
  base: 0.125rem
  every-step: 0.125rem
  round: 999px
spacing:
  unit: 0.25rem
size:
  control: 3rem
  touch-min: 2.75rem
stroke:
  rule: 1px
  emphasis: 2px
motion:
  fast: 120ms
  base: 200ms
  ease: cubic-bezier(0.2, 0, 0, 1)
iconography:
  family: IBM Carbon (inline SVG, 32 px art)
  sizes: { md: 20px, sm: 16px }
---

# unicron — visual identity

## Overview

unicron is the look that Warpcore (agent work), Vale (mail, calendar, contacts, notes), Lockdown (a
password manager and authenticator) and Synapse share. It is square and flat: hairline rules
instead of cards and shadows, ink for text and outlines, one identity colour per app, and a single
yellow for "this needs you". Brand lives in tokens; behaviour follows the platform. The source of
the drawn values is the Figma file's `Unicron / Theme` collection (8 modes) and `Unicron Type/`
styles; `@unicron/tokens` checks every built value against a snapshot of it (`figma-parity`).

## Theme model

Two axes, set on `<html>` or any subtree root; components never set either.

- **App**: `data-theme="warpcore" | "vale" | "lockdown" | "synapse"`. With no attribute the values
  are warpcore's (Figma's default mode).
- **Ground**: `.dark` is graphite, `:root` / `.light` is stone.

So Figma's mode `vale / graphite` is `<html data-theme="vale" class="dark">`.

## Colors

- **Surfaces and lines**: `surface-ground` (the page), `surface-raised` (fields, menus, popovers),
  `surface-scrim` (behind overlays), `line-rule` (every hairline), `line-grid-dot`.
- **Text, three levels and a faint**: `text-body` (titles, reading), `text-secondary` (the lines
  that explain), `text-label` (labels, meta, overlines, placeholders), `text-faint` (never the only
  way to read something).
- **Primary is the app's identity**: `primary-fill` / `primary-on-fill` (the one solid action),
  `primary-text` (identity-coloured words), `primary-soft` (a selected row), `primary-display`.
- **Secondary is live**: `secondary-live` marks work happening now (agents, sync, progress).
- **Needs you** is the same yellow in every app and both grounds. It is a block with dark ink, never
  a small mark on stone (the yellow has no lightness contrast with stone).
- **Critical** is the same for every app and differs by ground: fill, on-fill, text, soft.
- **States** (not drawn in Figma; contract §6): hover is `state-hover` (a 6 % ink wash) on neutral
  parts and 90 % on solid fills; pressed is `state-pressed` (10 %) and 80 %. Selected is
  `primary-soft` with a 2 px `primary-fill` left edge, never a solid primary.
- `success`, `warning`, `info` keep their accent ramps. The shadcn names (`background`, `foreground`,
  `muted`, `border`, `ring`, `sidebar*`, …) still work: each is an alias of a role above.
- Every pair a component paints is measured in all 8 modes (`pnpm --filter @unicron/tokens
  contrast`, APCA first). Misses that are Figma's own values are named exceptions, reported for a
  decision, not hidden.

## Typography

Geist for words, Geist Mono for labels, numbers and code. Every size is one of 23 **type roles**
(`type-<role>` utilities that read `--type-<role>-{family,weight,size,leading,tracking}`), never a
hand-picked size or `text-sm` / `font-medium` in a component:

`display` 72/68 · `display-compact` 48/48 · `title` 32/36 · `lead` 24/32 · `subtitle` 18/28 ·
`body` 16/24 · `body-strong` · `response` 17/28 · `ui` 15/20 · `ui-emphasis` · `label` 14/20 ·
`caption` 13/20 · `overline` mono 11/16 caps · `folio` mono 12/20 · `meta` mono 12/20 ·
`code-inline` mono 15/20 · `code-display` mono 36/40 · `number-hero` 168/148 · `number-metric`
44/44 · `number-index` 28/32 · `number-count` mono 24/28 · `brand-wordmark` 13/16 · `icon-glyph`.

`type-overline` is the only role with a case. The mono roles use tabular figures; the three sans
number roles (hero, metric, index) keep proportional figures, as Figma draws them. Mixed
sizes on one line align on the baseline. The old names stay as aliases: `type-page-title` → title,
`type-section-title` → subtitle, `type-group-title` → label, `type-support` → caption.
`type-measure` caps prose at 72ch.

## Layout

A 4 px unit (Tailwind's own); half steps (2, 6, 10, 14) only inside a component. Controls are
`size-control` (48) tall at most and never smaller than `size-touch-min` (44) to touch: a control
under 44 px takes `hit-area`, which widens its target on a coarse pointer. Sections are separated by
space and hairlines, not by fills.

## Rules, elevation and scrims

- **Strokes never add height.** A rule is an inset shadow: `rule-t`, `rule-r`, `rule-b`, `rule-l`,
  `rule-box` (1 px `line-rule`), `rule-box-emphasis` (2 px, `--rule-color`, default
  `primary-fill`), `edge-l` (the 2 px selected edge). They compose, with each other and with a
  Tailwind ring, inset ring or shadow, even one that arrives with a state (`focus-visible:ring-2`).
  On an element with a rule, set a shadow through those utilities, never a raw `box-shadow`.
- **Flat.** No shadows on surfaces, no glass, no `backdrop-blur` anywhere.
- **Scrims** are `surface-scrim` at a knob: on graphite `scrim-sheet` (0.5), `scrim-dialog` (0.6),
  `scrim-menu` (0.32); on stone all three are the role's own 64%. Never opaque, never blurred.
- **Focus** is one rule in the stylesheet: a 2 px solid outline in `--ring` (ink), 2 px clear. Inside
  a needs-you block it takes `needs-you-on-fill`. Fields draw a 2 px inside border instead.

## Shapes

Every radius step is 2 px (`--radius`), so `rounded-*` classes all draw the control radius.
`rounded-none` and `rounded-full` are Tailwind's own; `rounded-full` is no longer a control shape.
Marks (unread, live, indicator dots) are squares.

## Components and icons

Primitives come from shadcn/ui (`base-nova`) on Base UI and are owned source. Icons are IBM Carbon,
drawn as inline SVG by `Icon` from a curated, typed set (`IconName`); 20 px by default, 16 px inside
compact controls (the control sets it). Apps register a glyph Carbon lacks with `registerIcons`.
`unicron-codemod icons <dir>` moves an app from Material names. Component semantics, anatomy and
states are owned by the component docs (`docs/03-components.md`), not this file.

## Do's and Don'ts

- Do reach for a role (`bg-surface-raised`, `text-text-label`, `border-line-rule`); never a `--g-*`
  value in a component, never a colour, px or motion literal in `packages/ui/src`.
- Do add app-only roles in the app's extension layer, never in the core semantic tier.
- Don't use the identity colour for anything but the one primary action, identity text and
  selection; live work is `secondary-live`, and only "needs you" is yellow.
- Don't animate layout; animate opacity and transform on the motion roles. Let reduced motion win.
- Don't restyle a primitive with `className` overrides to make a new component; add a variant or
  compose a pattern and let `dsa` see it.

## Role list (tier 2)

Figma roles: `surface-ground` `surface-raised` `surface-scrim` `line-rule` `line-grid-dot`
`text-body` `text-secondary` `text-label` `text-faint` `primary-fill` `primary-on-fill`
`primary-text` `primary-soft` `primary-display` `secondary-live` `needs-you-fill` `needs-you-on-fill`
`critical-fill` `critical-on-fill` `critical-text` `critical-soft`. States and diff: `state-hover`
`state-pressed` `diff-added` `diff-removed`.

Aliases (the shadcn contract): `background` `foreground` `card` `card-foreground` `popover`
`popover-foreground` `primary` `primary-foreground` `secondary` `secondary-foreground` `muted`
`muted-foreground` `muted-foreground-on-fill` `support-foreground` `faint-foreground` `accent`
`accent-foreground` `destructive` `border` `input` `ring` `protected` `protected-foreground`
`sidebar` `sidebar-foreground` `sidebar-primary` `sidebar-primary-foreground` `sidebar-accent`
`sidebar-accent-foreground` `sidebar-border` `sidebar-ring`.

Status: `success` `success-foreground` `success-surface` `warning` `warning-foreground` `info`
`info-foreground` `attention` `attention-foreground` `attention-surface` `running`
`running-foreground` `running-surface`. Sizes: `--size-control` `--size-touch-min`; strokes:
`--stroke-rule` `--stroke-emphasis`; fonts: `font-sans` `font-mono` `font-heading` (an alias of sans).
