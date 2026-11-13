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

The builder emits `:root, .light { … }` for light and `.dark { … }` for dark. Apps switch themes by
toggling the `dark` class on `<html>` (`next-themes` with `attribute="class"` does this).

A box can hold the other mode inside a page. Put `dark` on it inside a light page, or `light` on it
inside a dark page (a light preview, the playground's light column). `@unicron/ui`'s `dark:` variant
stops at the nearest `.light`, so its dark-only styles don't leak in either. One level of nesting is
supported: a `.dark` box inside a `.light` box inside a dark page is not.

## Motion

Semantic roles carry motion; components use these, never a raw duration or curve.

**Durations**

| Role | Value | For |
|---|---|---|
| `--motion-press` | 100ms (`duration.press`) | a control going down under a press |
| `--motion-fast` | 120ms (`duration.fast`) | hover, a small state change, anything leaving |
| `--motion-base` | 200ms (`duration.base`) | a small surface arriving: a dialog, a popover, a toast |
| `--motion-state` | 280ms (`duration.state`) | a surface changing state: a sheet or a panel opening, a selection moving |
| `--motion-move` | 400ms (`duration.move`) | travel across the screen |
| `--motion-tick` | 1000ms (`duration.tick`) | one step of a countdown ring, run linear |
| `--motion-spin` | 900ms (`duration.spin`) | one turn of a spinner or a working ring; `animate-spin` runs on it |
| `--motion-pulse` | 1400ms (`duration.pulse`) | one beat of a pulse or a breathing halo; `animate-pulse` runs on it |

400ms is the ceiling: no default transition runs longer (`spin`, `pulse` and `tick` are loops, not
transitions). 120ms is the floor for a change you watch: shorter reads as a jump. A press is the
one faster role, because the hand is already on the control.

**Curves**

| Role | Value | For |
|---|---|---|
| `--motion-ease` | `cubic-bezier(0.2, 0, 0, 1)` (`ease.standard`) | the default: any transition with no better role |
| `--motion-ease-enter` | the same curve (`ease.standard`) | things arriving |
| `--motion-ease-exit` | `cubic-bezier(0.32, 0, 0.67, 0)` (`ease.in`) | things leaving, with a shorter duration than the entrance |
| `--motion-ease-move` | `cubic-bezier(0.65, 0, 0.35, 1)` (`ease.in-out`) | travel and resize |
| `--motion-ease-emphasis` | `cubic-bezier(0.34, 1.63, 0.64, 1)` (`ease.back`) | a slight overshoot (about 112%) for a rare moment |
| `--motion-ease-pulse` | `cubic-bezier(0.4, 0, 0.6, 1)` (`ease.pulse`) | a pulse loop |

**Springs**

A spring is a tier 1 token of `$type: "spring"` with `stiffness`, `damping` and `mass`. The builder
samples it into a CSS `linear()` curve, so a spring is a timing function with a matching duration:

| Role | Spring | Overshoot | Duration role | For |
|---|---|---|---|---|
| `--motion-spring-settle` | 256 / 20 (`spring.settle`) | about 8% | `--motion-spring-settle-duration` (400ms) | a thumb or a pill arriving at a new place |
| `--motion-spring-firm` | 300 / 26 (`spring.firm`) | under 3% | `--motion-spring-firm-duration` (380ms) | a sheet or another large surface; no visible bounce |

```css
transition: transform var(--motion-spring-firm-duration) var(--motion-spring-firm);
```

Each duration is the time its spring takes to stay within 1% of rest. `spring.pop` (484 / 19.8,
about 20% overshoot) exists in tier 1 as `--g-spring-pop` with no role: it is for an app's
expressive layer, never a default. For JS, `dist/tokens.json` keeps each spring's raw numbers
(`tokens["--g-spring-settle"].spring`), and `@unicron/tokens/spring` exports the solver the builder
uses (`springPosition`, `springToLinear`, …), so a gesture in an app runs the same spring as the
CSS and can start from the finger's release speed.

**Stagger and press**

| Role | Value | For |
|---|---|---|
| `--motion-stagger` | 50ms (`stagger.step`) | the delay between siblings that enter in turn |
| `--motion-stagger-max` | 6 (`stagger.max`) | siblings after this many start together |
| `--motion-press-depth` | 0.96 (`press.depth`) | scale of a pressed control |
| `--motion-press-depth-small` | 0.9 (`press.depth-small`) | scale of a pressed icon-size control |

**In Tailwind.** The theme map points Tailwind's default transition at `--motion-fast` and
`--motion-ease` (`--default-transition-duration`, `--default-transition-timing-function`), so a bare
`transition-colors` is on the system. The curves and the two springs are utilities: `ease-standard`,
`ease-enter`, `ease-exit`, `ease-move`, `ease-emphasis`, `ease-spring-settle`, `ease-spring-firm`.
A duration is written `duration-(--motion-state)`. Toasts are moved onto `--motion-base` from
`@unicron/ui`'s stylesheet, since sonner's own runs 400ms on plain `ease`.

**Rules.** No motion literals in a primitive: `pnpm lint:tokens` refuses a raw duration, a generic
or hand-written curve, a tier 1 motion variable and `transition-all` in `packages/ui/src`
([contributing](06-contributing.md#contracts-not-goodwill)). Animate transform and opacity; anything else needs a reason. Nothing in a default runs
longer than `--motion-move`. A control used many times a minute gets no visible bounce.
`pnpm --filter @unicron/tokens test` holds the numbers to this: the ceiling, each spring's overshoot
band and settle time, and the emphasis curve's peak.

**Reduced motion.** `@unicron/ui`'s stylesheet ends with one system-wide layer for
`prefers-reduced-motion: reduce`, unlayered so it wins over utilities: entrances and exits
(tw-animate-css) fade in place instead of sliding, growing or turning; transitions keep only colour
and opacity, at `--motion-fast`; `animate-spin`, `animate-pulse`, `animate-ping` and
`animate-bounce` stop; and `Spinner` stays as a still glyph at reduced opacity, so it still reads as
busy. A component with its own loop stills it in the same layer, by `data-slot`.

## Status roles

Agent UIs need "done", "waiting on you" and "working" to mean one thing in every app, whatever its
accent. Three roles, each with three steps:

| Role | Hue | Means | Fill (`bg-*`) | Foreground (`text-*-foreground`) | Surface (`bg-*-surface`) |
|---|---|---|---|---|---|
| `success` | green | done, worked | `green.500` / `400` | `green.600` / `300` | `green.50` / `900` |
| `attention` | amber | waiting on the person | `amber.500` / `400` | `amber.600` / `300` | `amber.50` / `900` |
| `running` | blue | working now | `blue.500` / `400` | `blue.600` / `300` | `blue.50` / `900` |

- The **fill** is a dot, an orb or a bar, and carries no text: Lc 30 or more against the page, a
  card, the sidebar, a selected row and its own surface.
- The **foreground** is ink (a status word, a count, an icon): Lc 75 or more on the page, a card,
  the sidebar, a selected row and its own surface, in each mode. Unlike `warning-foreground`, it is
  not a label for the fill.
- `attention` is not `warning`. `warning` says something is wrong; `attention` says the person is
  needed. Failed is `destructive`.
- Colour is never the only cue. A status also differs by shape or motion (`StatusOrb`).

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
- **Text roles sit at emphasis levels, not only above a floor.** Emphasis Engine places primary
  text at text level 5 and secondary at level 3 (`src/engine/intent.ts`). Floors alone let
  secondary drift up to the first step that cleared every surface, muted fills included, until it
  read Lc 87 under primary's 106: one level, not two. Since then there are three text levels,
  primary (5), support (4) and secondary (3), and `contrast.mjs` gates each adjacent pair at least
  Lc 10 apart, coded, on every surface they share. The coded gap stands in for the drawn one:
  rendering takes more from 13px support text than from 14px body, so equal drawn steps need
  uneven coded ones, and apps check the levels as drawn (Synapse's `scripts/emphasis-check.sh`
  measures WebKit's pixels: at least 12 apart, and no level overlapping the next).
- **On a fill, an ink re-points for its content.** A fill (`bg-muted`, `bg-accent`, `bg-secondary`,
  `bg-sidebar-accent`, a highlighted or selected item, a key) sets `--muted-foreground` to
  `--muted-foreground-on-fill` for what's inside it (`@unicron/ui`'s styles, at zero specificity).
  Secondary text keeps Lc 75 on the fill without dragging the role up everywhere else, and
  components and apps keep writing `text-muted-foreground`.
- **A role points at the weakest ramp step that clears every recipe it paints.** When no step
  does, a tier-1 step is added beside the ramp (`neutral.150`, `neutral.250`, `neutral.450`, `neutral.550`, `neutral.650`, `red.300`, `red.600`,
  `white-alpha.35`); existing tier-1 values never change.
- **Accent hues have text steps.** Apps assign the accent hues and draw them as text too, so each
  hue has a `600` (light) and a `300` (dark) held to reading text on `neutral.0`, `.50` and `.100`,
  and on `.950`, `.900` and `.800`. Point an app's text role at those, and its fills and dots at
  `500` / `400`.
- **Disabled controls are exempt.** WCAG 2 exempts text and borders of disabled controls (1.4.3,
  1.4.11: "part of an inactive user interface component"). A disabled control here draws at 50%
  opacity, so its label reads about Lc 35 in dark mode, under every floor above, on purpose: dimming
  is how it says it can't be used. No recipe in `contrast.mjs` measures a disabled state. Don't
  leave a control disabled with no other cue; say why near it, or keep it enabled and explain on
  press.
- **States differ from each other, not only from rest.** Hover, pressed (`active:`) and selected
  are three different fills. A pressed fill can't sink a label under its floor, so destructive
  presses halfway between rest and hover (`/15`, dark `/25`) rather than past it, and the default
  button presses to `bg-primary/90`. The pressed fills are recipes in the gate.
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
