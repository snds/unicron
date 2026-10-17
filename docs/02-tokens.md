# 02 · Tokens

Source of truth: `packages/tokens/tokens/*.json`, in the
[DTCG](https://tr.designtokens.org/format/) format. `pnpm tokens:build` writes
`packages/tokens/dist/tokens.css` and `dist/tokens.json`. Nothing reads the JSON directly at
runtime; everything reads the CSS custom properties.

## Three tiers

| Tier | File | CSS prefix | Holds | Example |
|---|---|---|---|---|
| 1 Global | `global.json` | `--g-` | Raw values: the neutral ramp, accent hues, bare hue angles, radius base, durations, easing, font stacks | `--g-neutral-900: oklch(0.185 0.008 260)` |
| 2 Semantic | `semantic.json` | `--` | Roles. Exactly the shadcn/ui contract plus the sidebar contract. Light = `$value`; dark = `$extensions["unicron.modes"].dark` | `--primary: var(--g-neutral-900)` / `.dark { --primary: var(--g-neutral-100) }` |
| 3 Component | `component.json` | `--c-` | Knobs the core primitives read; they alias tier 2 or hold per-component sizes | `--c-icon-fill: 0`, `--c-sheet-regular-width: 24rem` |

Only tier 2 swaps between light and dark. Tier 1 is theme-agnostic. Tier 3 follows tier 2 through
`var()` and may carry a dark override for perceptual corrections only (icons are graded down
slightly on dark surfaces).

## Naming

- The CSS name is the tier prefix plus the JSON path joined with `-`: `neutral.900` in
  `global.json` → `--g-neutral-900`; `icon.fill` in `component.json` → `--c-icon-fill`.
- Semantic names follow shadcn exactly (`background`, `muted-foreground`, `ring`, …) so any
  shadcn component drops in unchanged.
- References use DTCG syntax and are tier-agnostic: `{neutral.0}`, `{foreground}`, `{icon.fill}`.
  The builder resolves them to `var(--…)` so the cascade stays live.

## Modes

Light and dark are modes of the semantic tier, kept on the token itself:

```json
"primary": {
  "$type": "color",
  "$value": "{neutral.900}",
  "$extensions": { "unicron.modes": { "dark": "{neutral.100}" } }
}
```

The builder emits `:root { … }` for light and `.dark { … }` for dark. Apps switch themes by
toggling the `dark` class on `<html>` (`next-themes` with `attribute="class"` does this).

## The Tailwind map

`dist/tokens.css` ends with an `@theme inline { … }` block that exposes tier 2 to Tailwind v4
utilities: every semantic colour becomes `--color-<name>: var(--<name>)` (so `bg-background`,
`text-muted-foreground`), the fonts become `--font-sans` / `--font-mono` / `--font-heading`, and the
radius scale is derived from `--radius` using the multipliers in
`semantic.json → $extensions["unicron.theme"].radius`.

## Contrast

Contrast is judged by APCA first; WCAG 2.x is the fallback, printed beside every pair. The method
comes from [Emphasis Engine](https://github.com/snds/emphasis-engine) (`docs/architecture.md`):
**measure outcomes, not variables.**

- **A recipe is a pair as a component paints it,** through the component's own opacity modifiers
  and mixes (`bg-input/30`, `ring-ring/50`, `hover:bg-primary/80`, `bg-destructive/10`), over the
  stack it sits on. A role painted by five components is measured five ways.
- **Its element kind sets its floor,** not the role or the system:

  | Element kind | Floor | Examples |
  |---|---|---|
  | Reading text (primary, secondary) | APCA Lc 75, Bronze's mark for text under 16px (Lc 60 at 16px+) | body, descriptions, placeholders, shortcut keys, inactive tabs |
  | A label on a fill or tint | APCA Lc 60; Lc 75 reported (★) as the target | buttons, badges, status fills, destructive labels |
  | Solid | APCA Lc 30 against the page | `bg-primary` |
  | Control border | 3:1 (WCAG 1.4.11): a field has to be findable | `border-input` |
  | Focus | 3:1 as drawn, the ring at 50% | `ring-ring/50` |
  | Surface, state, separator | reported as OKLCH ΔL | cards, hovers, `border-border` |

  Non-text keeps the WCAG ratio because APCA has no calibrated target for 1px lines and rings.
- **A role points at the weakest ramp step that clears every recipe it paints.** When no step
  does, a tier-1 step is added beside the ramp (`neutral.450`, `red.300`, `red.600`,
  `white-alpha.35`); existing tier-1 values never change.
- **One job per role.** When a role serves two jobs that want different values, the component is
  pointed at the role that matches the second job: disabled fields fill with `muted`, not
  `input/50`; the button-group divider is a `border`, not an `input`.

`packages/tokens/scripts/contrast.mjs` (run by `pnpm --filter @unicron/tokens test`, so in CI)
resolves every role from `dist/tokens.css`, measures each recipe in both modes, prints the measure,
its floor, the WCAG ratio and the APCA Lc, and fails on a miss. A waived recipe is listed in the
script with its reason, and a waiver that starts passing fails the run. A new component recipe goes
in the table when the component lands.

## How to add a token

1. Decide the tier. A raw value → `global.json`. A role every product shares → `semantic.json`.
   A knob a core primitive reads → `component.json`. A role only your product has → your app
   extension file, not this package.
2. Add the token with `$type` and `$value` (a reference where possible), and a `dark` mode for
   semantic colours.
3. Run `pnpm tokens:build && pnpm test && pnpm lint:tokens`. The check fails if a core semantic
   name is missing, if a reference does not resolve, if an app role leaked into the core, or if a
   role pair in the contrast table is under its APCA floor (see [Contrast](#contrast)). The
   lint fails if a tier-2 or tier-3 colour is a raw value instead of a `{reference}` (tier 3 may
   hold literal sizes and axis numbers), or if a primitive in `packages/ui/src` carries a colour
   literal.
4. If the token should be a Tailwind utility and is not a semantic colour, add it to the theme
   extension in `semantic.json` (or extend `scripts/build.mjs`).

## App extension layer

Product-only roles live in the product, after the core import. The documented example is
`packages/tokens/examples/app-extension.css` (Mailbird's panes, per-area hues, unread marker and
note tints). Rules: alias `--g-*` or `--*`, swap only in `.dark`, expose to Tailwind with your own
`@theme inline` block. See [05-consuming.md](05-consuming.md).

## Figma variables

The three tiers map to three Figma variable collections:

| Figma collection | Modes | Source |
|---|---|---|
| `global` | one mode | `global.json` |
| `semantic` | `light`, `dark` | `semantic.json` (`$value` → light, `unicron.modes.dark` → dark) |
| `component` | one mode (dark overrides as a second mode where present) | `component.json` |

Variable names use `/` where the CSS uses `-` (`neutral/900`, `muted-foreground`, `icon/fill`).
Aliases in Figma mirror DTCG references, so `semantic/primary` aliases `global/neutral/900` in the
light mode and `global/neutral/100` in dark. `dist/tokens.json` is the flat form intended for a
Figma import script; the planned Style Dictionary build will emit a Figma-ready file directly.
