# 02 · Tokens

Source of truth: the JSON files in `packages/tokens/tokens/`, in the
[DTCG](https://tr.designtokens.org/format/) format. `pnpm tokens:build` writes
`packages/tokens/dist/tokens.css` and `dist/tokens.json`. Nothing reads the JSON directly at
runtime; everything reads the CSS custom properties.

The colour, type and size values are Figma's (the file "Unicron explorations", read on
2026-11-13). `pnpm test` fails if a built value differs from Figma's
([Figma parity](#figma-parity)).

## Two axes

A screen has an **app** and a **ground**. They are set apart, on the page's root:

| Axis | Values | How it is set |
|---|---|---|
| App | `warpcore`, `vale`, `lockdown`, `synapse` | `data-theme="<app>"` |
| Ground | graphite (dark), stone (light) | the `dark` class for graphite; nothing, or `light`, for stone |

```html
<html data-theme="vale" class="dark">   <!-- Figma's "vale / graphite" -->
<html data-theme="vale">                <!-- "vale / stone" -->
<html class="dark">                     <!-- no app: the default, warpcore / graphite -->
```

That gives Figma's 8 modes. An app sets `data-theme` once, in its HTML, and toggles `dark` as it
always did (`next-themes` with `attribute="class"` does this). A component never sets either.

Each app declares two colours: a **primary** (its identity) and a **secondary** (live activity
and agents). Its neutrals are tinted by the primary's hue.

| App | Primary | Live |
|---|---|---|
| Warpcore | blue-violet (hue 277) | plasma cyan (215) |
| Vale | Japanese indigo (228) | fog teal (165) |
| Lockdown | signal green (152) | steel blue (245). A proposal in the decision record, not confirmed |
| Synapse | magenta (352) | synaptic teal (195) |

**Nesting.** Either axis can also be set on a box inside the page: a `dark` or `light` box, a
`data-theme` box, or both on one element. A box takes the ground of its nearest `dark` or `light`
box.

- A `dark` or `light` box nests to any depth: it declares the roles itself.
- A `data-theme` box with no ground class of its own finds its nearest ground by selector, up to
  three dark boxes deep: a page, a box and a box again (`dark`, `light`, `dark`, `light`, `dark`).
  `@unicron/ui`'s `dark:` variant reaches as far. Deeper than that, the themed box takes the light
  values: give it its own `dark` or `light` class.

## Tiers and files

| Tier | File | CSS prefix | Holds | Example |
|---|---|---|---|---|
| 1 Global | `global.json` | `--g-` | Raw values: the theme slots (default app), the shared needs-you, critical and scrim colours, sizes, strokes, radius base, durations, easing, font stacks, and the legacy ramps | `--g-theme-stone-ground: #EFF0F5` |
| 1, per app | `themes/<app>.json` | `--g-theme-` | The same 28 theme slots, with that app's values | `[data-theme="vale"] { --g-theme-stone-ground: #ECF1F4 }` |
| 2 Semantic | `semantic.json` | `--` | Roles. Figma's theme roles, plus the shadcn/ui and sidebar contracts as aliases of them. Light = `$value`; dark = `$extensions["unicron.modes"].dark` | `--surface-ground: var(--g-theme-stone-ground)` / `.dark { --surface-ground: var(--g-theme-graphite-ground) }` |
| Type roles | `type.json` | `--type-` | 23 text styles, five variables each | `--type-body-size: 1rem` |
| 3 Component | `component.json` and `component/<area>.json` | `--c-` | Knobs the core primitives read; they alias tier 2 or hold per-component sizes | `--c-scrim-sheet: 0.5` |

The app axis lives in tier 1 and the ground axis in tier 2. Tier 3 follows tier 2 through `var()`.

## Naming

- The CSS name is the tier prefix plus the JSON path joined with `-`: `theme.stone.ground` in
  `global.json` → `--g-theme-stone-ground`; `scrim.sheet` in `component.json` → `--c-scrim-sheet`.
- A canonical role is named as in Figma, with the slash as a dash: `surface/ground` →
  `--surface-ground`, `primary/on-fill` → `--primary-on-fill`.
- The shadcn names stay (`background`, `muted-foreground`, `ring`, …), so a shadcn component and
  every existing class keep working.
- References use DTCG syntax: `{theme.stone.ground}`, `{text-body}`, `{scrim.sheet}`. The builder
  resolves them to `var(--…)` so the cascade stays live.

## Theme slots (tier 1)

A slot is one Figma primitive: one colour, for one app, on one ground. There are 14 per ground,
so 28 per app. `global.json` holds the default app's values (warpcore), so every slot exists with
no `data-theme`. Each `themes/<app>.json` re-declares all 28 and nothing else, as raw hex, with
the Figma variable id in each `$description`.

| Slot | Figma primitive | Read by the role |
|---|---|---|
| `ground` | `bg` | `surface-ground` |
| `raised` | `surf` | `surface-raised` |
| `rule` | `rule` | `line-rule` |
| `grid-dot` | `dot` | `line-grid-dot` |
| `faint` | `faint` | `text-faint` |
| `label` | `mute` | `text-label` |
| `secondary` | `sub` | `text-secondary` |
| `body` | `ink` | `text-body` |
| `primary-fill` | `org` | `primary-fill` |
| `primary-on-fill` | `onO` | `primary-on-fill` |
| `primary-text` | `ptext` | `primary-text` |
| `primary-soft` | `psoft` | `primary-soft` |
| `primary-display` | `pdisp` | `primary-display` |
| `live` | `sec` | `secondary-live` |

The CSS names are `--g-theme-graphite-<slot>` and `--g-theme-stone-<slot>`. Only tier 2 reads a
slot.

Shared by every app, so not slots (also in `global.json`):

| Token | Value |
|---|---|
| `needs-you.fill`, `needs-you.on-fill` | `#EDE54A`, `#1C1C1C`, on both grounds |
| `critical.{fill, on-fill, text, soft}.{graphite, stone}` | one red set per ground |
| `scrim.graphite`, `scrim.stone` | `#000000`; `#141618` at 64% alpha, stored in the colour as Figma stores it |

In `dist/tokens.css` the order is: `:root { …tier 1, with the default slots… }`, then one
`[data-theme="<app>"] { …28 slots… }` block per app, then the type roles, then tiers 2 and 3.

## Roles (tier 2)

### Figma's roles

Each reads its stone slot in light and its graphite slot in dark. Every one is a Tailwind colour
under its own name, so the class is the utility prefix plus the role: `bg-surface-ground`,
`text-text-label`, `border-line-rule`.

| Figma role | CSS variable | Tailwind (examples) | Use |
|---|---|---|---|
| `surface/ground` | `--surface-ground` | `bg-surface-ground` | The page. Also the label on an active Filter Chip |
| `surface/raised` | `--surface-raised` | `bg-surface-raised` | Raised controls and cards: fields, menus, dialogs, the tab bar, a chat bubble |
| `surface/scrim` | `--surface-scrim` | `bg-surface-scrim` | The dim behind sheets, dialogs and menus ([Scrim](#scrim)) |
| `line/rule` | `--line-rule` | `border-line-rule`, `bg-line-rule` | Hairline rules and 1px borders; the empty part of a progress bar |
| `line/grid-dot` | `--line-grid-dot` | `bg-line-grid-dot` | The dot grid; a sheet's grabber |
| `text/body` | `--text-body` | `text-text-body` | Main text, icons by default, the unread mark. APCA Lc 90 on the ground |
| `text/secondary` | `--text-secondary` | `text-text-secondary` | Supporting text: helper lines, descriptions. Lc 75 |
| `text/label` | `--text-label` | `text-text-label` | Labels, meta, overlines, counts, placeholders. Lc 60 |
| `text/faint` | `--text-faint` | `text-text-faint` | The faintest ink: an index number. No contrast target, so never the only way to read something |
| `primary/fill` | `--primary-fill` | `bg-primary-fill` | The identity as a solid: the one primary action, the selected-row edge, the tab indicator, a field's focus border |
| `primary/on-fill` | `--primary-on-fill` | `text-primary-on-fill` | Text on `primary-fill`. Lc 75 |
| `primary/text` | `--primary-text` | `text-primary-text` | The identity as small text, or an icon on `primary-soft`. Lc 60 |
| `primary/soft` | `--primary-soft` | `bg-primary-soft` | The quiet identity tint: a selected row, the current nav item |
| `primary/display` | `--primary-display` | `text-primary-display` | The identity as large type, 36px and up only. Lc 45 |
| `secondary/live` | `--secondary-live` | `text-secondary-live`, `bg-secondary-live` | Live activity and agents only: live status, the filled part of a progress bar |
| `needs-you/fill` | `--needs-you-fill` | `bg-needs-you-fill` | The yellow block that waits on the person. At most one per screen |
| `needs-you/on-fill` | `--needs-you-on-fill` | `text-needs-you-on-fill` | Text on the yellow; the fill of the solid needs-you button |
| `critical/fill` | `--critical-fill` | `bg-critical-fill` | Error as a solid: the destructive button, an invalid field's 2px border |
| `critical/on-fill` | `--critical-on-fill` | `text-critical-on-fill` | Text on `critical-fill` |
| `critical/text` | `--critical-text` | `text-critical-text` | Error text |
| `critical/soft` | `--critical-soft` | `bg-critical-soft` | A critical banner's background |

Two names to keep apart. `text-text-secondary` is Figma's secondary **text**. `bg-secondary` and
`text-secondary` are the shadcn neutral **fill**, an alias of `surface-raised`. And
`secondary-live` is the live colour, not that fill.

### State and diff roles

Figma draws no states. These are the system's proposal (build contract §6).

| Role | Value | Tailwind | Use |
|---|---|---|---|
| `state-hover` | 6% of `text-body`, over whatever is underneath | `bg-state-hover` | Hover on a neutral or transparent control or row |
| `state-pressed` | 10% of `text-body` | `bg-state-pressed` | Pressed |
| `diff-added` | 8% of `text-body` in `surface-ground`: a neutral wash | `bg-diff-added` | The wash behind an added line, the same rule in every app (Synapse's `primary-soft` and `critical-soft` read as one colour). The `+` mark always shows |
| `diff-removed` | `critical-soft` | `bg-diff-removed` | The wash behind a removed line. The `−` mark always shows |

A solid fill (`primary-fill`, `critical-fill`, the needs-you button) shows hover as itself at 90%
and pressed at 80%. Selected is `primary-soft` with a 2px `primary-fill` edge, never a solid.

### The shadcn contract, as aliases

Every name from before 1.0 still exists and still makes its Tailwind class. Each now points at a
Figma role. `scripts/check.mjs` pins each line of this table.

| Role (Tailwind class) | Now |
|---|---|
| `background` (`bg-background`) | `surface-ground` |
| `foreground`, `card-foreground`, `popover-foreground`, `accent-foreground`, `secondary-foreground` | `text-body` |
| `card`, `popover`, `muted`, `secondary` | `surface-raised` |
| `accent` | 8% of `text-body` in `surface-raised`: the opaque hover and highlight fill |
| `support-foreground` | `text-secondary` |
| `muted-foreground`, `muted-foreground-on-fill` | `text-label` |
| `faint-foreground` (new) | `text-faint` |
| `primary` / `primary-foreground` | `primary-fill` / `primary-on-fill` |
| `border` | `line-rule` |
| `input` | `line-rule`. A field's resting border is a hairline now ([Contrast](#contrast)) |
| `ring` | `text-body`: focus is a solid 2px ink outline, offset 2px |
| `destructive` | `critical-text` |
| `protected` / `protected-foreground` | `text-body` / `surface-ground` |
| `sidebar` | `surface-ground` |
| `sidebar-foreground` | `text-secondary` |
| `sidebar-accent` / `sidebar-accent-foreground` | `primary-soft` / `text-body` |
| `sidebar-border`, `sidebar-ring` | `line-rule`, `ring` |
| `sidebar-primary` / `sidebar-primary-foreground` | `primary` / `primary-foreground` |

**`primary` changed meaning.** Before 1.0 it was near-black (the strongest ink). It is now the
app's colour, for the one primary action of a screen. Code that used `text-primary` or
`bg-primary` to mean "strongest ink" wants `text-foreground` or `bg-foreground`.

### Status roles

| Role | Means | Fill (`bg-*`) | Text (`text-*-foreground`) | Wash (`bg-*-surface`) |
|---|---|---|---|---|
| `running` | working now | `secondary-live` | `secondary-live` | 14% of `secondary-live` in the ground |
| `attention` | waiting on the person | `needs-you-fill`, the yellow, on both grounds | amber (`amber.600`) on stone, where the yellow does not read; the yellow on graphite | pale amber (`amber.50`) on stone; 14% of the yellow in the ground on graphite |
| `success` | done, worked | `green.500` / `400` | `green.600` / `300` | `green.50` / `900` |
| `warning` | something is wrong | `amber.550` / `300`, under `warning-foreground` (white / near-black) | — | — |
| `info` | for your information | `blue.550` / `300`, under `info-foreground` (white / near-black) | — | — |

- `running` and `attention` follow the app and the direction. `success`, `warning` and `info`
  keep their accent ramps, the same in every app.
- `warning` and `info` were re-picked at 1.0. Text on a fill went from Lc 60 to Lc 75, which the
  old pairs missed (62 and 72). The light fills are darker and take a white label; the dark
  fills are lighter and take a near-black one. Both also read as an ink on the ground (Lc 60 or
  more), for a warning glyph or a digit.
- `attention` is not `warning`. `warning` says something is wrong; `attention` says the person is
  needed. Failed is `destructive`.
- Colour is never the only cue. A status also differs by shape or motion (`StatusOrb`).
- The yellow on stone is as light as the ground. A needs-you block reads there by its hue and
  its dark text, but a small yellow mark does not: give it a shape, or use
  `text-attention-foreground`.

## How the two axes resolve

A custom property keeps the value it computed on the element that declared it. So
`--background: var(--surface-ground)`, declared once on `:root`, would stay the root's colour
inside a `.dark` box. The build therefore writes:

- every colour of tiers 2 and 3 in **both** ground blocks, even when its expression is the same
  in both (an alias has to be declared again wherever its target changes);
- both ground blocks on `[data-theme]` as well, so a themed box re-reads its slots on the ground
  it sits on. The dark block reaches a themed box whose nearest ground box is `.dark`, three dark
  boxes deep.

```css
:root, .light, [data-theme] { /* tiers 2 and 3, stone */ }
.dark,
.dark [data-theme]:not(.light):not(.dark .light *),
.dark .light .dark [data-theme]:not(.light):not(.dark .light .dark .light *),
.dark .light .dark .light .dark [data-theme]:not(.light):not(.dark .light .dark .light .dark .light *)
                            { /* tiers 2 and 3, graphite */ }
```

`scripts/build.mjs` writes the dark selector (`GROUND_DEPTH`), `scripts/check.mjs` pins it, and
the playground's browser checks (`apps/playground/tests/foundations.spec.ts`) put themed boxes at
every depth in a real browser.

An app that re-points a core role in its own layer (`--sidebar: var(--surface-chrome)`) and also
nests themed boxes repeats the re-point on `[data-theme]`
([App extension layer](#app-extension-layer)).

## Type roles

23 roles, one set for every app and both grounds, in `tokens/type.json` as DTCG typography
composites. The build emits five variables per role:

```css
--type-<role>-family    /* var(--g-font-sans) or var(--g-font-mono) */
--type-<role>-weight
--type-<role>-size      /* rem */
--type-<role>-leading   /* rem; always a multiple of 4px */
--type-<role>-tracking  /* em */
```

`@unicron/ui`'s stylesheet turns each role into one `type-<role>` utility. Components use those,
never a raw `text-sm` or `font-medium`.

| Role | Family | Weight | Size / line height (px) | Tracking | For |
|---|---|---|---|---|---|
| `display` | Geist | 700 | 72 / 68 | -0.04em | Empty-state hero, big moments |
| `display-compact` | Geist | 700 | 48 / 48 | -0.03em | The compact display size |
| `title` | Geist | 700 | 32 / 36 | -0.015em | Section and view titles |
| `lead` | Geist | 500 | 24 / 32 | -0.01em | An opening paragraph; sheet and dialog titles |
| `subtitle` | Geist | 500 | 18 / 28 | -0.005em | Titles in panels and cards; phone top-bar titles |
| `body` | Geist | 400 | 16 / 24 | 0 | Default reading text |
| `body-strong` | Geist | 500 | 16 / 24 | 0 | Emphasis within body |
| `response` | Geist | 400 | 17 / 28 | 0 | Model output |
| `ui` | Geist | 500 | 15 / 20 | 0 | Controls, buttons, menus |
| `ui-emphasis` | Geist | 600 | 15 / 20 | 0 | Emphasized control text |
| `label` | Geist | 500 | 14 / 20 | 0 | Form labels, tabs |
| `caption` | Geist | 400 | 13 / 20 | 0 | Supporting text under media or tables |
| `overline` | Geist Mono | 500 | 11 / 16 | 0.04em | The small label above a title. Upper case: the only role with a case |
| `folio` | Geist Mono | 500 | 12 / 20 | 0 | Running headers, step markers |
| `meta` | Geist Mono | 400 | 12 / 20 | 0 | Timestamps, model name, counts |
| `code-inline` | Geist Mono | 400 | 15 / 20 | 0 | Inline code |
| `code-display` | Geist Mono | 500 | 36 / 40 | 0.12em | Large codes, such as a one-time code |
| `number-hero` | Geist | 700 | 168 / 148 | -0.05em | Hero numbers |
| `number-metric` | Geist | 700 | 44 / 44 | -0.02em | Metric values |
| `number-index` | Geist | 700 | 28 / 32 | -0.02em | Index numerals (item 03) |
| `number-count` | Geist Mono | 400 | 24 / 28 | 0 | Counts |
| `brand-wordmark` | Geist | 700 | 13 / 16 | 0.12em | The app wordmark in the App Lockup |
| `icon-glyph` | Geist | 400 | 32 / 32 | 0 | The letter in a placeholder mark |

- A line box shorter than its type is intended on `display` (72 / 68) and `number-hero`
  (168 / 148).
- Case and figure style are not variables. The stylesheet sets them: `type-overline` is upper
  case; the number roles and the mono roles use tabular figures.
- No role sets a colour.
- The utilities from before 1.0 stay as deprecated aliases in the stylesheet:
  `type-page-title` → `title`, `type-section-title` → `subtitle`, `type-group-title` → `label`,
  `type-support` → `caption`. `type-body`, `type-body-strong`, `type-meta` and `type-overline`
  keep their names and take the new values.

**Fonts.** `font.sans` is `"Geist Variable", Geist, ui-sans-serif, system-ui, sans-serif` and
`font.mono` is `"Geist Mono Variable", "Geist Mono", ui-monospace, SFMono-Regular, Menlo,
monospace`. The tokens only name the families. `@unicron/ui` loads the font files.

## Sizes, radius, strokes, spacing

| Figma | Tier 1 | Role | Tailwind |
|---|---|---|---|
| `size/control` 48 | `size.control` 3rem | `--size-control` | `h-control`, `size-control`, `min-h-control` |
| `size/touch-min` 44 | `size.touch-min` 2.75rem | `--size-touch-min` | `min-h-touch-min`, `size-touch-min` |
| `radius/control` 2 | `radius.base` 0.125rem | `--radius` | the bare `rounded` and every step from `rounded-xs` to `rounded-4xl` is this one 2px corner |
| `radius/none`, `radius/round` | — | — | Tailwind's own `rounded-none`, `rounded-full` |
| a 1px stroke | `stroke.rule` 1px | `--stroke-rule` | — |
| a 2px stroke | `stroke.emphasis` 2px | `--stroke-emphasis` | — |

- `size-control` is the height of every floating control, the tab bar, the status strip and a
  text field. `size-touch-min` is the floor for a touch target. Every other fixed size is a tier 3
  knob of the component that draws it.
- `rounded-full` is no longer a control shape. Marks (unread, live, an indicator) are squares.
- A stroke never adds height. On a part that hugs its content, a rule is an inset shadow, not a
  border. `@unicron/ui`'s stylesheet has the utilities.
- **Spacing has no tokens.** Tailwind's 4px unit is Figma's `space/004`, so `gap-3` is
  `space/012`. Layout spacing is a multiple of 4. The half steps 2, 6, 10 and 14 (`0.5`, `1.5`,
  `2.5`, `3.5`) are for inside a component only.

## Scrim

`bg-surface-scrim` is the colour: black on graphite, `#141618` at 64% on stone. How much of it
shows is a tier 3 knob, the same number on both grounds:

| Knob | Value | Behind |
|---|---|---|
| `--c-scrim-sheet` | 0.5 | a phone sheet |
| `--c-scrim-dialog` | 0.6 | a desktop dialog |
| `--c-scrim-menu` | 0.32 | a menu that dims the screen (quick create) |

On stone the two multiply, so a sheet's scrim draws at about 32%. A scrim is never opaque and
never blurred: no `backdrop-blur` anywhere.

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
| `--motion-stagger-max` | 4 (`stagger.max`) | siblings after this many start together, so a whole list is in within 400ms |
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

## The Tailwind map

`dist/tokens.css` ends with an `@theme inline { … }` block that exposes tier 2 to Tailwind v4:

- every semantic colour as `--color-<name>: var(--<name>)`, so `bg-surface-ground`,
  `text-text-label`, `bg-background`, `text-muted-foreground`;
- the fonts as `--font-sans`, `--font-mono`, `--font-heading`;
- the radius scale, `--radius-xs` to `--radius-4xl`, each `var(--radius)`. Tailwind's bare
  `rounded` reads a key named `--radius`, the same name as the role, so the build declares it in a
  small plain `@theme` block after the inline one (an inline key would read itself). The class
  then reads the role, `var(--radius)`, like every step;
- the two sizes as `--spacing-control` and `--spacing-touch-min`, which Tailwind's sizing and
  spacing utilities read;
- the default transition and the `ease-*` utilities ([Motion](#motion)).

The type roles are not in the map: `@unicron/ui` writes their utilities by hand.

## Contrast

Contrast is judged by APCA first; WCAG 2.x is kept for borders and rings. The method comes from
[Emphasis Engine](https://github.com/snds/emphasis-engine) (`docs/architecture.md`):
**measure outcomes, not variables.**

- **A recipe is a pair as a component paints it,** through the component's own opacity modifiers
  and mixes (a hover wash, a solid at 90%), over the stack it sits on.
- **Every recipe is measured in all 8 modes:** 4 apps × 2 grounds.
- **Its element kind sets its floor.** The text floors are the direction's targets, the ones
  Figma's values were solved to:

  | Element kind | Floor | Examples |
  |---|---|---|
  | `text-body` | APCA Lc 90 | main text |
  | `text-secondary` | Lc 75 | descriptions, helper lines |
  | `text-label` | Lc 60 | labels, meta, and any coloured text (`primary-text`, `secondary-live`, `critical-text`, a status word) |
  | `text-display` | Lc 45 | `primary-display`, at 36px and up |
  | `on-fill` | Lc 75 | text on `primary-fill`, `critical-fill`, the yellow, `warning`, `info` |
  | `solid` | Lc 30 against what it sits on | a fill, a mark, a bar |
  | `focus`, `border-error` | 3:1 (WCAG 1.4.11) | the focus ring; a field's focus border and error border |
  | `text-faint`, `border-rest`, `border-decorative`, `state`, `surface` | reported, not gated | the faintest ink; a field's resting border; separators; how far a hover or a surface moves |

- **A field's resting border is reported, not gated.** Figma draws it as a hairline
  (`line-rule`, 1.3:1 to 1.4:1). Before 1.0 the gate held control borders to 3:1. A field is found
  by its `surface-raised` box; its focus and error borders are the ones held to 3:1.
- **The three neutral text levels read apart.** Body, secondary and label are each gated at
  least Lc 10 from the next, on every surface they share (the ground, a raised surface, a
  selected row).
- **A plain alias is not measured twice.** `check.mjs` pins each shadcn name to its Figma role,
  and the role is measured.
- **Disabled controls are exempt.** A disabled control draws at 50% opacity, so its label reads
  under every floor above, on purpose (WCAG 2 exempts inactive controls). No recipe measures a
  disabled state. Do not leave a control disabled with no other cue.
- **The legacy accent ramps keep their text steps.** Apps draw the accent hues as text on the
  legacy neutral ramp: `600` in light and `300` in dark (red: `700` and `200`), still held to
  Lc 75.

### Exceptions: Figma values under a floor

Figma is the source of truth for the theme values. When a Figma value misses a floor, the value
is not changed and the miss is not hidden. `scripts/contrast.mjs` lists it by name, with what it
measures in each mode, under "Exceptions": reported, not gated. The list has to match the misses
exactly, so an exception that starts passing fails the run.

The cause is one thing. Figma solved each text role against the **ground**, with almost no room
to spare: on the graphite ground `text-label` measures Lc 60.4 to 60.7. On any surface nearer the
text's own lightness (a raised surface, a selected row, a hover wash) it lands just under.

As of 2026-11-13 the run lists 189 measures in 45 recipes. In short:

| What | Where | Measures | Floor |
|---|---|---|---|
| `text-label` on `surface-raised` (a field's placeholder) | graphite | Lc 59.3 to 59.6 | 60 |
| `text-label`, `primary-text`, `secondary-live` on `primary-soft` | both | Lc 56.5 to 59.9 | 60 |
| `text-body` on `primary-soft` and on `critical-soft` | stone | Lc 85.1 to 87.5 | 90 |
| `primary-text`, `secondary-live`, `critical-text` on `surface-raised` | graphite | Lc 59.0 to 59.97 | 60 |
| `critical-text` on `critical-soft` | graphite | Lc 58.2 | 60 |
| `primary-display` on `surface-raised` | graphite | Lc 44.0 to 44.6 | 45 |
| body over secondary text | stone | Lc 9.6 to 9.8 apart | 10 |
| `primary-fill` and `critical-fill` as solids | graphite | Lc 19.3 to 26.8 | 30 |
| the same fills as a field's focus and error border | graphite | 2.59:1 to 2.97:1 | 3:1 |
| `needs-you-fill` as a solid, and so `attention` as a mark | stone | Lc 0 to 11.9 | 30 |
| text on a hover or pressed wash, and on `accent` | both | up to Lc 12 under | 90, 75, 60 |
| `primary-on-fill` on a pressed fill (80%) | vale and lockdown stone | Lc 72.6 to 74.5 | 75 |
| `running-foreground` on `running-surface` | both | Lc 55.6 to 58.6 | 60 |

Run `pnpm --filter @unicron/tokens contrast` for the full list. These are Sean's to decide: change
a value in Figma, accept the miss, or change a floor.

### Must differ

Two watch items from the decision record are measured and reported, not gated: Lockdown's green
beside `success`, and Synapse's magenta beside `critical`. Each row gives the OKLab distance
(ΔEOK), the lightness gap and the hue gap. As a reading aid, under ΔEOK 0.05 two colours read as
the same at a glance, and under 0.15 as close. Today Lockdown's `primary-soft` and
`success-surface` on graphite are 0.007 apart, and Synapse's `primary-soft` and `critical-soft`
are 0.033 apart on both grounds.

### Recipes, and where they live

The core recipes (the roles on the surfaces they share, and the states) are in
`packages/tokens/scripts/contrast.mjs`. Each component area adds its own file,
`packages/tokens/scripts/recipes/<area>.mjs`, when its components land; the script loads every
file in that folder. The format is in
[`scripts/recipes/README.md`](../packages/tokens/scripts/recipes/README.md).

`pnpm --filter @unicron/tokens test` runs it (so CI does). It prints one line per recipe, with the
measure in each of the 8 modes, then the exceptions and the must-differ rows, and fails on any
miss that is not a named exception. `--rows` adds the drawn colours, the WCAG ratio and the APCA
Lc for every recipe and mode.

## Figma parity

`packages/tokens/tokens/figma/theme-2026-11.json` is a checked-in snapshot of the Figma read-out:
the 21 theme roles in the 8 modes, the 23 text styles, and the space, radius and size numbers.
`scripts/figma-parity.mjs` (part of `pnpm test`) resolves the built CSS as a browser would and
fails if anything differs:

- every theme role in every mode, hex and alpha, and the defaults against Figma's default app;
- every source slot's hex, and the Figma variable id in its `$description`;
- every type role: family, weight, size, line height, letter spacing, case;
- `size/control`, `size/touch-min`, `radius/control`;
- every spacing step against Tailwind's 4px unit.

A value changes in Figma first. Then a new read-out, a new snapshot
(`node scripts/figma-snapshot.mjs <figma-tokens.json>`), and the sources follow until the check
passes. The snapshot is never edited by hand.

## How to add a token

1. Decide where it goes.
   - A raw value → `global.json`.
   - A role every product shares → `semantic.json`, as a reference.
   - A knob a core primitive reads → your area's file, `tokens/component/<area>.json`. The build
     merges every file in that folder with `component.json`. A file there may re-declare a knob
     that `component.json` holds (the build prints a note); two area files may not declare the
     same knob.
   - A role only your product has → your app extension file, not this package.
2. Add the token with `$type` and `$value` (a reference where possible). A semantic colour that
   differs by ground gets a `dark` mode. One that only points at another role does not: the build
   declares it on both grounds for you.
3. Run `pnpm tokens:build && pnpm test && pnpm lint:tokens`.
   - `check.mjs` fails if a contract name is missing, an alias points somewhere else, a colour is
     missing from a ground, or an app role leaked into the core.
   - `figma-parity.mjs` fails if a built value differs from Figma's.
   - `contrast.mjs` fails if a recipe is under its floor and is not a named exception.
   - The lint fails if a tier 2 or tier 3 colour is a raw value, if a role points at the legacy
     neutral ramp, if a knob's colour reads tier 1 (`{needs-you.fill}`, the raw value, where
     `{needs-you-fill}`, the role, is meant), if a theme file is not exactly the 28 slots as hex
     with their Figma ids, if a type role is off the 4px grid, or if a primitive in
     `packages/ui/src` carries a colour or motion literal.
4. If the token should be a Tailwind utility and is not a semantic colour, add it to the theme
   extension in `semantic.json` (`radius`, `spacing`) or extend `scripts/build.mjs`.

**A value Figma holds** (a theme slot, a type role, a size) is not edited here on its own. See
[Figma parity](#figma-parity).

## App extension layer

Product-only roles live in the product, after the core import. The documented example is
`packages/tokens/examples/app-extension.css`. Rules:

- Pick the theme in the HTML (`data-theme`, the `dark` class), not in CSS.
- Alias a role (`--*`), not a raw value. The legacy `--g-neutral-*` ramp is not themed, so a
  surface or an ink built on it will not follow the app or the tint.
- A role that only points at core roles is the same on both grounds: declare it once, on
  `:root, .light, .dark, [data-theme]`, so it follows a nested box too.
- A role that differs by ground swaps on the core's two ground selectors, copied as they are
  ([How the two axes resolve](#how-the-two-axes-resolve)). A plain `.dark` leaves a `data-theme`
  box in a dark page on the light values while the core roles around it turn dark.
  `scripts/check.mjs` holds the example to this.
- Expose your roles to Tailwind with your own `@theme inline` block.

See [05-consuming.md](05-consuming.md).

## What stayed as legacy

Kept, unchanged, because apps alias them from their own layers. No core role reads them, except
that `success`, `warning` and `info` keep their accent ramps.

| Legacy | Why it stays |
|---|---|
| `--g-neutral-*` (hue 260) and `--g-white-alpha-*` | Vale and Lockdown alias them. Not themed: they do not follow the app or its tint |
| `--g-blue-*`, `--g-coral-*`, `--g-green-*`, `--g-amber-*`, `--g-red-*` | App layers use them for per-area hues. `amber.550` and `blue.550` were added at 1.0 for `warning` and `info` |
| `--g-hue-*` | Bare hue angles for an app's tinted surfaces |
| `muted-foreground-on-fill` | Fills re-point `--muted-foreground` at it. It now equals `muted-foreground`: Figma has one label ink |

Changed in value, not in name: `font.sans` and `font.mono` (Inter and the system mono stack
became Geist and Geist Mono), `radius.base` (10px became 2px), and every role in the alias table
above.

## Figma variables

Figma holds the system in three collections. The code mirrors them, under its own names:

| Figma collection | Holds | In code |
|---|---|---|
| `Unicron / Primitives` | 128 colours, one per app, ground and slot | the theme slots: `global.json` (default app) and `themes/<app>.json` |
| `Unicron / Theme` | 21 roles in 8 modes | the Figma roles in `semantic.json`; `critical/*` and `surface/scrim` hold literals in Figma, and sit in `global.json` here |
| `Unicron / Space` | 18 spacing steps, 3 radii, 2 sizes | Tailwind's 4px unit, `radius.base`, `size.control`, `size.touch-min` |

The 23 text styles of `Unicron Type/` are `type.json`. Figma has no variable for a stroke width,
a state colour, `success`, `warning` or `info`: those exist only in code.
