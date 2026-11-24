# 02 · Tokens

Source of truth: the JSON files in `packages/tokens/tokens/`, in the
[DTCG](https://tr.designtokens.org/format/) format. `pnpm tokens:build` writes
`packages/tokens/dist/tokens.css`, `dist/plain.css` ([Plain CSS](#plain-css-for-a-page-with-no-tailwind))
and `dist/tokens.json`. Nothing reads the JSON directly at runtime; everything reads the CSS custom
properties.

The colour, type and size values are Figma's (the file "Unicron explorations", read on
2026-11-13). `pnpm test` fails if a built value differs from Figma's
([Figma parity](#figma-parity)).

## Two axes

A screen has a **theme** and a **ground**. They are set apart, on the page's root:

| Axis | Values | How it is set |
|---|---|---|
| Theme | Unicron's own default, or an app's theme | nothing for the default; `data-theme="<app>"` for an app's theme, which the app declares in its own layer |
| Ground | graphite (dark), stone (light) | the `dark` class for graphite; nothing, or `light`, for stone |

```html
<html class="dark">                     <!-- the Unicron default on graphite -->
<html>                                  <!-- the Unicron default on stone -->
<html data-theme="vale" class="dark">   <!-- Vale's own theme on graphite, once Vale declares it -->
```

**No app's theme lives in the core** (Unicron 1, Sean's ruling of 2026-11-16; [principle 1](01-principles.md)).
The core ships one generic default theme, solved so that every pair the contrast gate measures
clears its floor. Each app declares its own 10 accent slots in its own layer, under its own
`[data-theme]`, and measures them with the contrast tool this package ships
([05 · Consuming → Declare your app's theme](05-consuming.md#declare-your-apps-theme)). An app
sets `data-theme` once, in its HTML, and toggles `dark` as it always did (`next-themes` with
`attribute="class"` does this). A component never sets either.

A theme declares two colours: a **primary** (its identity) and a **secondary** (live activity
and agents), with neutrals to match.

| Theme | Primary | Live | Where it lives |
|---|---|---|---|
| Unicron default | slate (hue 255, quiet) | teal (195) | `packages/tokens/tokens/global.json` |
| Warpcore | blue-violet (hue 277) | plasma cyan (215) | Warpcore's layer; the playground's copy is `apps/playground/src/app-themes/warpcore.*` |
| Vale | Japanese indigo (228) | fog teal (165) | Vale's layer; `app-themes/vale.*` |
| Lockdown | signal green (152) | steel blue (245). A proposal in the decision record, not confirmed | Lockdown's layer; `app-themes/lockdown.*` |
| Synapse | magenta (352) | synaptic teal (195) | Synapse's layer; `app-themes/synapse.*` |

The four apps' themes are Figma's eight modes of `Unicron / Theme`. Figma has no `Default` mode
yet: Sean adds one with the default's values ([Figma parity](#figma-parity)).

**Nesting.** Either axis can also be set on a box inside the page: a `dark` or `light` box, a
`data-theme` box, or both on one element. A box takes the ground of its nearest `dark` or `light`
box.

- A `dark` or `light` box nests to any depth: it declares the roles itself.
- A `data-theme` box with no ground class of its own finds its nearest ground by selector, up to
  three dark boxes deep: a page, a box and a box again (`dark`, `light`, `dark`, `light`, `dark`).
  `@unicron/ui`'s `dark:` variant reaches as far. Deeper than that, the themed box takes the light
  values: give it its own `dark` or `light` class. The core declares no `[data-theme="…"]` block
  of its own, but both ground blocks still match `[data-theme]`, so an app's theme box re-reads
  its slots on either ground.

## Tiers and files

| Tier | File | CSS prefix | Holds | Example |
|---|---|---|---|---|
| 1 Global | `global.json` | `--g-` | Raw values: the 10 accent slots (the Unicron default), the shared 2.0 neutrals (`base`), labels and charts, the shared needs-you, critical and scrim colours, the twelve swatches, sizes, strokes, radius base, durations, easing, font stacks, and the deprecated ramps | `--g-theme-stone-ground: #F3F4F6` |
| 1, an app's theme | the app's own layer | `--g-theme-` | The same 10 accent slots, with the app's values (not in this package since 1.1) | `[data-theme="vale"] { --g-theme-stone-ground: #ECF1F4 }` |
| 2 Semantic | `semantic.json` | `--` | Roles. Figma's theme roles, plus the shadcn/ui and sidebar contracts as aliases of them. Light = `$value`; dark = `$extensions["unicron.modes"].dark` | `--surface-ground: var(--g-theme-stone-ground)` / `.dark { --surface-ground: var(--g-theme-graphite-ground) }` |
| Type roles | `type.json` | `--type-` | 24 text styles (Figma's 23 and `mono-row`), five variables each | `--type-body-size: 1rem` |
| 3 Component | `component.json` and `component/<area>.json` | `--c-` | Knobs the core primitives read; they alias tier 2 or hold per-component sizes | `--c-scrim-sheet: 0.5` (graphite) |

The theme axis lives in tier 1 and the ground axis in tier 2. Tier 3 follows tier 2 through `var()`.

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

A slot is one Figma primitive: one colour, for one theme, on one ground. There are 14 per ground,
so 28 per theme. `global.json` holds the Unicron default, so every slot exists with no
`data-theme`; each slot says in its `$description` the OKLCH it was solved as, and that it is not
in Figma yet. An app's layer re-declares all 28, as raw values, under its own `[data-theme]`.
`dist/tokens.json` lists the 28 names (`themeSlots`).

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

In `dist/tokens.css` the order is: `:root { …tier 1, with the default slots… }`, then the type
roles, then tiers 2 and 3. There is no `[data-theme="<app>"]` block.

**The default theme.** Neutral surfaces and inks with a quiet slate identity (hue 255) and a teal
live colour (hue 195). Solved with room, so it clears every floor on every surface the gate
measures; the misses left in the core's list are the colours every theme shares
([Contrast](#contrast)).

| Slot | Graphite | Stone |
|---|---|---|
| `ground` / `raised` | `#181A1B` / `#1F2122` | `#F3F4F6` / `#FBFCFD` |
| `rule` / `grid-dot` / `faint` | `#2F3033` / `#353739` / `#56585B` | `#D5D8DB` / `#BEC1C5` / `#A5A8AC` |
| `label` / `secondary` / `body` | `#BABEC3` / `#D8DBDF` / `#F2F4F6` | `#606368` / `#3D4043` / `#050607` |
| `primary-fill` / `primary-on-fill` | `#4778B5` / `#FFFFFF` | `#255B9C` / `#FFFFFF` |
| `primary-text` / `primary-soft` / `primary-display` | `#A1C7F8` / `#1E2C3F` / `#7AAEEF` | `#225899` / `#E4F0FF` / `#255B9C` |
| `live` | `#57D4D4` | `#007176` |

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
| `text/faint` | `--text-faint` | `text-text-faint` | Only a disabled control's words and decoration, which WCAG exempts. Never something a person reads to act: an index number, a count, a hint or a placeholder takes `text-label` (Unicron 25) |
| `primary/fill` | `--primary-fill` | `bg-primary-fill` | The identity as a fill that holds a label: the one primary action, a switch that is on, the app mark. A mark with no words takes `primary-mark`; a focus border, `line-focus` |
| `primary/on-fill` | `--primary-on-fill` | `text-primary-on-fill` | Text on `primary-fill`. Lc 75 |
| `primary/text` | `--primary-text` | `text-primary-text` | The identity as small text, or an icon on `primary-soft`. Lc 60 |
| `primary/soft` | `--primary-soft` | `bg-primary-soft` | The quiet identity tint: a selected row, the current nav item |
| `primary/display` | `--primary-display` | `text-primary-display` | The identity as large type, 36px and up only. Lc 45 |
| `secondary/live` | `--secondary-live` | `text-secondary-live`, `bg-secondary-live` | Live activity and agents only: live status, the filled part of a progress bar |
| `needs-you/fill` | `--needs-you-fill` | `bg-needs-you-fill` | The yellow block that waits on the person. At most one per screen |
| `needs-you/on-fill` | `--needs-you-on-fill` | `text-needs-you-on-fill` | Text on the yellow; the fill of the solid needs-you button |
| `critical/fill` | `--critical-fill` | `bg-critical-fill` | Error as a fill that holds a label: the destructive button. An error border or edge takes `line-invalid` |
| `critical/on-fill` | `--critical-on-fill` | `text-critical-on-fill` | Text on `critical-fill` |
| `critical/text` | `--critical-text` | `text-critical-text` | Error text |
| `critical/soft` | `--critical-soft` | `bg-critical-soft` | A critical banner's background |

### Roles added in 1.1 (not in Figma yet)

| Role | Value | Tailwind | Use |
|---|---|---|---|
| `line-field` | three parts `text-label` to one part `line-rule` | `border-line-field`; `input` is its alias | A field's resting border, 1px: 3:1 or more against the field and the ground, on both grounds, in the default and all four apps' themes (Unicron 18) |
| `line-focus` | `primary-fill` on stone, `primary-text` on graphite | `border-line-focus`, `inset-ring-line-focus` | A field's 2px focus border, and the focus edge of a button, switch or checkbox that draws one: 3:1 or more (Unicron 17) |
| `line-invalid` | `critical-fill` on stone, `critical-text` on graphite | `inset-ring-line-invalid` | An error border or edge: an invalid field, button, switch or checkbox; a critical Banner's, Badge's or Accessory's edge. 3:1 or more |
| `primary-mark` | `primary-fill` on stone, `primary-text` on graphite | `bg-primary-mark` | The identity as a mark with no words: the selected-row edge, the tab indicator, a progress cell, a dot. Lc 30 or more (Unicron 19) |
| `small-label` | `text-label` moved towards `text-secondary` (93% on graphite, 99% on stone) | `text-small-label` | Label text under 16px where an app holds small text to Lc 75 and 4.5:1 (Synapse 1). Never stronger than secondary |
| `small-primary`, `small-critical`, `small-live` | `primary-text`, `critical-text`, `secondary-live`, each moved about half way towards `text-body` | `text-small-primary` … | The identity, error and live colours as text under 16px, at Lc 75 and 4.5:1 on the ground, `surface-raised`, `primary-soft` and `critical-soft`. Text only: fills, marks and edges keep the Figma role |

Each is held by `scripts/check.mjs` and measured by the contrast gate. On graphite the identity
and critical fills are mid-tones, dark enough to hold a white label but under Lc 30 and 3:1
against the dark surfaces. So on graphite a mark, a focus border and an error border take the
text colour, which clears both; a fill that holds a label stays the fill, and its label carries it.
Sean adds `line/field`, `line/focus`, `line/invalid` and `primary/mark` to Figma's `Unicron / Theme`.

Two names to keep apart. `text-text-secondary` is Figma's secondary **text**. `bg-secondary` and
`text-secondary` are the shadcn neutral **fill**, an alias of `surface-raised`. And
`secondary-live` is the live colour, not that fill.

### State and diff roles

Figma draws no states yet. These are the system's states (build contract §6), adopted with
lighter washes in 1.1 (Unicron 16 and 35); Sean draws them on the `Unicron / Components` page.

| Role | Value | Tailwind | Use |
|---|---|---|---|
| `state-hover` | 4% of `text-body`, over whatever is underneath (6% before 1.1) | `bg-state-hover` | Hover on a neutral or transparent control or row |
| `state-pressed` | 6% of `text-body` (10% before 1.1) | `bg-state-pressed` | Pressed |
| `diff-added` | a neutral wash of `text-body` in `surface-ground`: 8% on graphite, 3% on stone (8% before 1.1) | `bg-diff-added`, `bg-(--c-diff-added)` | The wash behind an added line, the same rule in every theme (Synapse's `primary-soft` and `critical-soft` read as one colour). On stone 3% keeps body text on it at Lc 90 (Unicron 28). The `+` mark always shows |
| `diff-removed` | `critical-soft` | `bg-diff-removed` | The wash behind a removed line. The `−` mark always shows |

A solid fill (`primary-fill`, `critical-fill`, the needs-you button) shows hover as itself at 90%
and pressed at 85% (80% before 1.1, which took the label on the lightest fills under Lc 75;
Unicron 28). Focus is one 2px `--ring` outline, 2px clear; disabled is 50%; loading keeps the label
and shows a spinner. Selected is `primary-soft` with a 2px `primary-mark` edge, never a solid.
Every floor holds in every state: a state that takes text under its floor is a miss, listed and
flagged, never a lower floor.

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
| `input` | `line-field`: a field's resting border, 3:1 (Unicron 18; it was the `line-rule` hairline in 1.0) |
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
| `running` | working now | `secondary-live` | `secondary-live` | 6% of `secondary-live` in the ground (14% before 1.1; Unicron 27) |
| `attention` | waiting on the person | `needs-you-fill`, the yellow, on both grounds | amber (`amber.600`) on stone, where the yellow does not read; the yellow on graphite | pale amber (`amber.50`) on stone; 14% of the yellow in the ground on graphite |
| `success` | done, worked | `green.500` / `400` | `green.600` / `300` | `green.50` / `900` |
| `warning` | something is wrong | `amber.575` / `300`, under `warning-foreground` (white / near-black) | — | — |
| `info` | for your information | `blue.550` / `300`, under `info-foreground` (white / near-black) | — | — |

- `running` and `attention` follow the app and the direction. `success`, `warning` and `info`
  keep their accent ramps, the same in every app.
- `warning` and `info` were re-picked at 1.0. Text on a fill went from Lc 60 to Lc 75, which the
  old pairs missed (62 and 72). The light fills are darker and take a white label; the dark
  fills are lighter and take a near-black one. Both also read as an ink on the ground (Lc 60 or
  more), for a warning glyph or a digit.
- The stone `warning` went darker again in 1.1 (`amber.550` → `amber.575`, `#906106`): as small
  text it measured 4.0:1 on the stone ground, under WCAG's 4.5:1, so an app could not put the
  warning word in it. It is now 4.7:1 or more on every stone ground and raised surface, and holds
  its white label at Lc 81 (Warpcore 2; gated as `warning-ink-*`).
- The running wash went from 14% to 6% in 1.1: live text on 14% measured Lc 55.6 to 58.6. 6% is
  the strongest wash that keeps it at Lc 60 in the default and in three of the four apps' themes
  (Vale's graphite measures 59.6; Vale lists it).
- `attention` is not `warning`. `warning` says something is wrong; `attention` says the person is
  needed. Failed is `destructive`.
- Colour is never the only cue. A status also differs by shape or motion (`StatusOrb`).
- The yellow on stone is as light as the ground. A needs-you block reads there by its hue and
  its dark text, but a small yellow mark does not: give it a shape, or use
  `text-attention-foreground`.

### Swatches

Twelve colours for things a person colours: a calendar, a note, a label, a persona, a kind in a
graph (build contract 5.1b #55). Not in Figma; the same in every app.

| Role | Tailwind | Hue | Stone | Graphite |
|---|---|---|---|---|
| `swatch-01` | `bg-swatch-01`, `text-swatch-01` | red, 25° | `#BF534F` | `#FF9F97` |
| `swatch-02` | `bg-swatch-02` | orange, 55° | `#B55E07` | `#FCA466` |
| `swatch-03` | `bg-swatch-03` | ochre, 85° | `#967000` | `#E0B24B` |
| `swatch-04` | `bg-swatch-04` | olive, 115° | `#737C00` | `#B4C158` |
| `swatch-05` | `bg-swatch-05` | green, 145° | `#318639` | `#7DCB80` |
| `swatch-06` | `bg-swatch-06` | jade, 175° | `#00856E` | `#3ACEAE` |
| `swatch-07` | `bg-swatch-07` | teal, 205° | `#00828D` | `#0BCBDB` |
| `swatch-08` | `bg-swatch-08` | azure, 235° | `#007DAF` | `#54C3FD` |
| `swatch-09` | `bg-swatch-09` | blue, 265° | `#4E73CA` | `#98B9FF` |
| `swatch-10` | `bg-swatch-10` | violet, 295° | `#8166C4` | `#C1ADFF` |
| `swatch-11` | `bg-swatch-11` | plum, 325° | `#A45AA8` | `#E8A0EB` |
| `swatch-12` | `bg-swatch-12` | rose, 355° | `#B8537F` | `#FF9AC2` |

- **How they were made.** The hues are 30° apart in OKLCH, starting at the system's red angle
  (`hue.red`, 25°). For each hue and ground, the lightness is the one that holds APCA Lc 62 (the
  floor for coloured text, 60, plus 2) against the lowest-contrast of the eight surfaces of that
  ground: `surface-ground` and `surface-raised` in all four apps. The chroma is 0.14 on stone and
  0.13 on graphite, or the most sRGB allows at that lightness where it is less (ochre, olive,
  jade, teal and azure on stone; red, blue and violet on graphite). So the twelve read as one family of equal
  weight, and each carries its hue as far as the gamut lets it.
- **Where they come from.** Tier 1 holds one hex per ground, named by hue:
  `swatch.<hue>.{stone,graphite}` → `--g-swatch-red-stone`. Tier 2 numbers them: `swatch-01`
  reads the stone value in light and the graphite value in dark.
- **How they are held.** `scripts/recipes/foundation.mjs` gates each swatch as text (Lc 60) on the
  ground and on a raised surface, and as a mark (Lc 30) on `primary-soft` (a current nav item, a
  selected row) and under the hover and pressed washes, in every theme the gate runs on: no exception.
  `scripts/check.mjs` holds the hues 30° apart, neighbours apart (ΔEOK 0.05 or more, so no two
  read as one at a glance) and every swatch clear of the needs-you yellow (ΔEOK 0.1 or more).
- **Use.** A 2px bar (a calendar event), a 2px edge (`edge-t` with `--edge-color`), an 8px square
  beside a name. A swatch holds as words too, where an app needs that. It is never a fill behind
  text and never a status: the meaning of a swatch is the person's, so the name always shows
  beside it. A thing with no colour takes the neutral bar (`line-rule`) and no square.
- **Mapping is the app's.** A calendar's server colour maps to the nearest swatch by OKLCH hue;
  past twelve the swatches repeat. The red of the set sits by `critical` (on graphite they read
  alike); it marks a person's calendar, never an error.

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

## Plain CSS, for a page with no Tailwind

`@unicron/tokens/plain.css` (`dist/plain.css`) is the same set of custom properties as
`tokens.css`, every tier on both grounds, for a page that has no Tailwind and may load nothing it
does not own: Lockdown's in-page extension frames (build contract 5.1b #54).

- **Flat.** Rules of custom properties only, on the same selectors as `tokens.css`. No `@theme`,
  no nested rule, no `@import`, no `url()`, no font file. A page whose policy is only
  `style-src 'self'` can link it from its own origin.
- **By the roles' own names.** `var(--surface-raised)`, `var(--text-body)`, `var(--swatch-03)`.
  Tailwind's `--color-*` names are not in it. The font roles, which `tokens.css` hands to
  Tailwind, are root variables here: `--font-sans`, `--font-mono`, `--font-heading`. The fonts
  themselves load from the page's own origin.
- **It follows the browser by default** (Unicron 14). A root with no ground class takes the
  browser's light or dark setting (`prefers-color-scheme`), with no script; it is the one `@media`
  block in the file. `class="stone"` forces stone and `class="graphite"` forces graphite. The
  core's `light` and `dark` classes still force a ground too, and the 1.0 `system` class still
  works (it is now the same as no class). Before 1.1 a root with no class was stone.

```html
<html data-theme="lockdown">                  <!-- follows the browser -->
<html data-theme="lockdown" class="graphite"> <!-- always graphite; class="stone" for stone -->
  <link rel="stylesheet" href="plain.css">
  <link rel="stylesheet" href="lockdown-theme.css">   <!-- the app's own 10 accent slots -->
```

`scripts/check.mjs` parses the file (whole comments, flat rules, the one `@media` block, nothing
to fetch), checks it declares what `tokens.css` declares, and resolves every role and knob on
both grounds, with no theme and with an app's theme on a box, and on a root with no ground class
under both browser settings, against `tokens.css`. The playground's
Plain CSS view (`?view=plain-css`) loads it in a frame per mode under `style-src 'self'` and
compares every colour with the page's own `tokens.css`.

## Type roles

24 roles, one set for every theme and both grounds, in `tokens/type.json` as DTCG typography
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
| `mono-row` | Geist Mono | 400 | 13 / 20 | 0 | A row's mono line that holds a person's own words (a username, a site), as typed, at 13px (Lockdown 4, 1.1). Not in Figma yet: Sean adds `Unicron Type/mono/row` |
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
  case; the mono roles (overline, folio, meta, mono-row, code-inline, code-display, number-count)
  use tabular figures.
- **Still numbers are proportional; live numbers are tabular** (Unicron 11). The three sans
  number roles (number-hero, number-metric, number-index) keep Geist's proportional figures, as
  Figma draws them ("145" is 71px wide; 77 with tabular figures). A number that changes in place
  while a person watches (a countdown, a live metric, a running total) adds the modifier
  `type-number-tabular`, so its digits keep their places as they change:
  `<span class="type-number-metric type-number-tabular">`. `Metric` does it for you with `live`.
  The countdowns of `StatusItem` and `Accessory` already use tabular figures.
- One exception to "every text is a role": on a touch screen a field's value is 16px, on the ui
  role's weight and 20px line (the code-inline role's, in a mono field). iOS zooms the page into
  any field set under 16px when it takes focus. Every field does it (`fieldTextOnTouch`: Input,
  Textarea, TextField, ChipField, Select, the command menu's search, the Composer, SecretField's
  edit input), and nothing else may. The browser gate (`apps/playground/tests/rules.spec.ts`)
  names it, with bold text in response prose (17/28 strong, contract 5.1c C20) and the fitted
  characters of the large type view.
- No role holds a colour. Three utilities add a default ink: `type-overline` and `type-meta`
  take the label ink, and the old `type-support` takes the secondary ink. A colour class on the
  same element wins; a colour set on a parent does not reach them.
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
shows is a tier 3 knob, set per ground as Figma draws it:

| Knob | Graphite | Stone | Behind |
|---|---|---|---|
| `--c-scrim-sheet` | 0.5 | 1 | a phone sheet |
| `--c-scrim-dialog` | 0.6 | 1 | a desktop dialog |
| `--c-scrim-menu` | 0.32 | 1 | a menu that dims the screen (quick create) |

On stone the knob is 1, so the role's own 64% is the whole dim behind every layer: Figma's stone
frames dim 64% behind sheets, dialogs and menus alike. (Until 2026-11-14 the stone knobs were the
graphite numbers, which multiplied to about 32%, 38% and 20%: half of what the frames draw.) A
scrim is never opaque and never blurred: no `backdrop-blur` anywhere.

## Motion

Semantic roles carry motion; components use these, never a raw duration or curve. How the parts
use them, the rules, and how to add a motion: [09 · Motion](09-motion.md).

**Durations**

| Role | Value | For |
|---|---|---|
| `--motion-press` | 100ms (`duration.press`) | a control going down under a press |
| `--motion-fast` | 120ms (`duration.fast`) | hover, a small state change, a tooltip or a menu appearing, anything leaving |
| `--motion-base` | 200ms (`duration.base`) | a small surface arriving: a dialog, a popover, a toast |
| `--motion-state` | 280ms (`duration.state`) | a surface changing state: a sheet or a panel opening, a selection moving |
| `--motion-move` | 400ms (`duration.move`) | travel across the screen |
| `--motion-tick` | 1000ms (`duration.tick`) | one second of a countdown, run linear; one turn of `Spinner` (`--c-spinner-turn-duration`), eased on `--motion-ease-move` |
| `--motion-spin` | 900ms (`duration.spin`) | one even turn of the working ring (`StatusOrb`, `RunTrace`); `animate-spin` runs on it. Generic loading (`Spinner`) is on the tick role, so it never reads as an agent at work |
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
A duration is written `duration-(--motion-state)`. Toasts are moved onto `--motion-base` (arriving) and
`--motion-fast` (leaving) from `@unicron/ui`'s stylesheet, since sonner's own runs 400 to 500ms on
plain `ease`.

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
`animate-bounce` stop, with or without a variant in front (an indeterminate `Progress` pulses
through `group-data-indeterminate/progress:animate-pulse`); and `Spinner` stays as a still glyph at reduced opacity, so it still reads as
busy. A component with its own loop stills it in the same layer, by `data-slot`.

## The Tailwind map

`dist/tokens.css` ends with an `@theme inline { … }` block that exposes tier 2 to Tailwind v4:

- every semantic colour as `--color-<name>: var(--<name>)`, so `bg-surface-ground`,
  `text-text-label`, `bg-background`, `text-muted-foreground`, `bg-swatch-01`;
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
- **Every recipe is measured on both grounds.** In `pnpm test`: the Unicron default theme, which
  is the core's gate; the example app layer's theme; and the four apps' themes the playground
  carries, each with its own list of misses. An app runs the same tool on its own theme
  (`unicron-contrast`, [05 · Consuming](05-consuming.md#declare-your-apps-theme)).
- **Its element kind sets its floor.** The text floors are the direction's targets, the ones
  Figma's values were solved to:

  | Element kind | Floor | Examples |
  |---|---|---|
  | `text-body` | APCA Lc 90 | main text |
  | `text-secondary` | Lc 75 | descriptions, helper lines |
  | `text-label` | Lc 60 | labels, meta, and any coloured text (`primary-text`, `secondary-live`, `critical-text`, a status word) |
  | `text-display` | Lc 45 | `primary-display`, at 36px and up |
  | `on-fill` | Lc 75 | text on `primary-fill`, `critical-fill`, the yellow, `warning`, `info` |
  | `solid` | Lc 30 against what it sits on | a mark with no words: a progress cell, a dot, an edge, a tab indicator |
  | `text-small` | Lc 75 and 4.5:1 | the small-text inks (`small-label`, `small-primary`, `small-critical`, `small-live`) |
  | `text-aa` | 4.5:1 (WCAG 1.4.3) | the warning ink as small text on stone |
  | `focus`, `border-error` | 3:1 (WCAG 1.4.11) | the focus ring; a field's focus border and error border (`line-focus`, `line-invalid`) |
  | `control-edge` | 3:1 (WCAG 1.4.11) | the edge that alone shows a control: an unchecked checkbox, a field's resting border (`line-field`) |
  | `fill`, `text-faint`, `border-rest`, `border-decorative`, `state`, `surface` | reported, not gated | a fill that holds a label (a button); the faintest ink; a decorative 1px edge; separators; how far a hover or a surface moves |

- **A field's resting border is gated again** (Unicron 18). `line-field` holds 3:1 against the
  field's `surface-raised` box and the ground outside it, on both grounds, in every theme the run
  measures; it is still 1px. In 1.0 it was the `line-rule` hairline (1.3:1 to 1.4:1), reported. A
  resting edge that something else backs up (a switch's knob, a float button's glyph, a button's
  label) is still reported.
- **A mark with no words is gated; a fill with a label is not** (Unicron 19). A progress cell, a
  dot, an edge or a tab indicator has only its lightness to show it, so it holds Lc 30. A button
  is found by its label, which is gated as `on-fill`; its fill is reported (`fill`). On graphite
  the identity and critical fills are under Lc 30, so marks there take `primary-mark` and
  `line-invalid` (the text colours), and the progress knobs (`--c-progress-primary`,
  `--c-progress-critical`) do the same: a countdown's last ticks are the critical text colour on
  graphite.
- **An edge that is all a control shows is gated.** An unchecked checkbox has no glyph, no knob
  and no text inside it, and its raised fill barely moves off the ground, so its edge is held to
  3:1 (`control-edge`). It is drawn in the label ink (`--c-checkbox-edge`, 4.8:1 or more), not the
  hairline.
- **The three neutral text levels read apart.** Body, secondary and label are each gated at
  least Lc 10 from the next, on every surface they share (the ground, a raised surface, a
  selected row). The default theme's stone secondary sits 11.7 under body (Unicron 21); and
  `small-label` is gated never to read stronger than secondary on the ground and a raised surface.
- **A plain alias is not measured twice.** `check.mjs` pins each shadcn name to its Figma role,
  and the role is measured.
- **Disabled controls are exempt.** A disabled control draws at 50% opacity, so its label reads
  under every floor above, on purpose (WCAG 2 exempts inactive controls). No recipe measures a
  disabled state. Do not leave a control disabled with no other cue.
- **`text-faint` is for disabled words and decoration only** (Unicron 25), which WCAG exempts,
  so it is reported. Anything a person reads to act takes `text-label`.
- **The deprecated accent ramps keep their text steps** until 2.0. Apps draw the accent hues as
  text on the deprecated neutral ramp: `600` in light and `300` in dark (red: `700` and `200`),
  still held to Lc 75.

### Exceptions: misses, named and reported

A miss is never hidden and no value is changed to hide one. `scripts/contrast.mjs` lists each by
name, with what it measures in each mode, under "Exceptions": reported, not gated. Every list
has to match its run's misses exactly, so an exception that starts passing fails the run.

- **The core's list** holds only misses the default theme has because of colours every theme
  shares: Figma's critical colours (`critical-text` was solved to Lc 60 on the graphite ground
  with no room; black ink tops out at Lc 88.6 on the stone `critical-soft`) and the needs-you
  yellow (as light as the stone surfaces), plus a contract state laid over one of them, and the
  pressed wash on a stone selection tint, where no ink is dark enough.
- **An app's list** is its own file, passed to the tool. The four apps' lists are in
  `apps/playground/src/app-themes/<app>.exceptions.json`: their Figma values were solved to the
  ground with no room, so a label on a raised surface, any text under the hover and pressed washes,
  and body and secondary on stone (under Lc 10 apart, which Unicron 21 asks Figma to fix by
  lightening stone secondary about 0.5 Lc) land just under.

The core's list, in short:

<!-- contrast:exceptions start · written by `node scripts/contrast.mjs --write-docs` (packages/tokens); do not edit by hand -->
The run lists 122 measures in 91 recipes. In short:

| What | Where | Measures | Floor |
|---|---|---|---|
| `critical-text` and `text-body` on the critical washes (Figma's shared critical colours) | both | up to Lc 3.3 under | Lc 90, 60 |
| `attention` (the needs-you amber) as a mark on a wash | stone | Lc 24.6 to 29.4 | Lc 30 |
| Unicron 2.0's shared neutrals, status and count colours under an APCA floor (solved to WCAG 2 4.5:1) | both | up to Lc 34.6 under | Lc 90, 75, 60, 30, 4.5, 3 |
<!-- contrast:exceptions end -->

The table is written from the default run (`node scripts/contrast.mjs --write-docs`), and every
default run fails when it differs, so its numbers stay current. Run
`pnpm --filter @unicron/tokens contrast` for the full list. These are Sean's to decide: change a
value in Figma, accept the miss, or change a floor.

### Must differ

An identity must not pass for a status. In every mode a run measures, the gate reports how far
the identity sits from `success` and from `critical` (fill, text and wash), as the OKLab distance
(ΔEOK), the lightness gap and the hue gap: reported, not gated. As a reading aid, under ΔEOK 0.05
two colours read as the same at a glance, and under 0.15 as close. The watch items from the
decision record show in the apps' runs: Lockdown's `primary-soft` and `success-surface` on
graphite are 0.007 apart, and Synapse's `primary-soft` and `critical-soft` 0.033 apart.

### Recipes, and where they live

The core recipes (the roles on the surfaces they share, and the states) are in
`packages/tokens/scripts/contrast.mjs`. Each component area adds its own file,
`packages/tokens/scripts/recipes/<area>.mjs`, when its components land; the script loads every
file in that folder. The format is in
[`scripts/recipes/README.md`](../packages/tokens/scripts/recipes/README.md). `foundation.mjs`
measures the twelve swatches ([Swatches](#swatches)).

`pnpm --filter @unicron/tokens test` runs it three times (so CI does): on the default theme, on
the example app layer (`examples/app-extension.css`), and on the four apps' themes in the
playground. Each run prints one line per recipe, with the measure in each mode, then the
exceptions and the must-differ rows, and fails on any miss that is not a named exception.
`--rows` adds the drawn colours, the WCAG ratio and the APCA Lc for every recipe and mode;
`--print-exceptions` prints the misses as entries to paste into a list, and justify.

## Figma parity

`packages/tokens/tokens/figma/theme-2026-11-24.json` is a checked-in snapshot of the Figma read-out:
the 21 theme roles in the 8 modes, the 23 text styles, and the space, radius and size numbers.
`scripts/figma-parity.mjs` (part of `pnpm test`) resolves the built CSS as a browser would and
fails if anything differs:

- the roles every theme shares (needs-you, critical, scrim), on both grounds, against every Figma
  mode of that ground;
- the default theme against Figma's `Default` mode. **A known gap:** Figma has no `Default` mode
  yet, so until Sean adds one these 14 roles per ground are reported, not compared;
- the four apps' themes the playground carries (`apps/playground/src/app-themes/<app>.json`),
  laid over the build, in their 8 modes: every role, every slot's hex and the Figma variable id
  in its `$description`. Each app owns its theme now; these copies still have to be Figma's;
- every type role: family, weight, size, line height, letter spacing, case. A role marked
  `"figma": "pending"` (`mono-row`) is reported until Figma has its style;
- `size/control`, `size/touch-min`, `radius/control`;
- every spacing step against Tailwind's 4px unit.

A value changes in Figma first. Then a new read-out, a new snapshot
(`node scripts/figma-snapshot.mjs <figma-tokens.json>`), and the sources follow until the check
passes. The snapshot is never edited by hand. The roles added in 1.1 (`line-field`,
`line-focus`, `line-invalid`, `primary-mark`, the small inks) are not Figma variables yet.

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
     `{needs-you-fill}`, the role, is meant), if a default theme slot is not a hex that says where
     it came from, if an app's theme turns up in the core, if a type role is off the 4px grid, or if a primitive in
     `packages/ui/src` carries a colour or motion literal.
4. If the token should be a Tailwind utility and is not a semantic colour, add it to the theme
   extension in `semantic.json` (`radius`, `spacing`) or extend `scripts/build.mjs`.

**A value Figma holds** (a theme slot, a type role, a size) is not edited here on its own. See
[Figma parity](#figma-parity).

## App extension layer

Product-only roles, and the product's own theme, live in the product, after the core import. The
documented example is `packages/tokens/examples/app-extension.css`. Rules:

- Declare the theme in the layer: all 10 accent slots under `[data-theme="<app>"]`, as raw values
  (the example's first block). Switch it on in the HTML (`data-theme`, the `dark` class), not in
  CSS. Measure it with `unicron-contrast` in CI ([05 · Consuming](05-consuming.md#declare-your-apps-theme)).
- Alias a role (`--*`), not a raw value. The deprecated `--g-neutral-*` ramp is not themed, so a
  surface or an ink built on it will not follow the theme or the tint.
- A role that only points at core roles is the same on both grounds: declare it once, on
  `:root, .light, .dark, [data-theme]`, so it follows a nested box too.
- A role that differs by ground swaps on the core's two ground selectors, copied as they are
  ([How the two axes resolve](#how-the-two-axes-resolve)). A plain `.dark` leaves a `data-theme`
  box in a dark page on the light values while the core roles around it turn dark.
  `scripts/check.mjs` holds the example to this, and to declaring all 10 accent slots; `pnpm test`
  measures the example's theme, which clears every floor.
- Expose your roles to Tailwind with your own `@theme inline` block.

See [05-consuming.md](05-consuming.md).

## Deprecated, and what stayed as legacy

**Deprecated in 1.1, removed in 2.0** (Unicron 7). They stay, unchanged, for all of 1.x, because
app layers alias them. 2.0 removes them once no app reads them; `docs/` will carry the 2.0
migration guide.

| Deprecated | Why it stays for now | Use instead |
|---|---|---|
| `--g-neutral-*` (hue 260) and `--g-white-alpha-*` | Vale and Lockdown alias them. Not themed: they do not follow the theme or its tint | a role: `surface-ground`, `surface-raised`, `line-rule`, `line-field`, `text-body`, `text-secondary`, `text-label` |
| `--g-blue-*`, `--g-coral-*`, `--g-green-*`, `--g-amber-*`, `--g-red-*` | App layers use them for per-area hues. `success`, `warning` and `info` still read their steps; 2.0 moves those to status-named tokens | a status role (`success`, `warning`, `info`, `critical-*`) or a swatch (`swatch-01` … `swatch-12`) |

Kept as legacy, not deprecated:

| Legacy | Why it stays |
|---|---|
| `--g-hue-*` | Bare hue angles for an app's tinted surfaces |
| `muted-foreground-on-fill` | Fills re-point `--muted-foreground` at it. It now equals `muted-foreground`: Figma has one label ink |

Changed in value, not in name: `font.sans` and `font.mono` (Inter and the system mono stack
became Geist and Geist Mono), `radius.base` (10px became 2px), and every role in the alias table
above.

## Figma variables

Figma holds the system in three collections. The code mirrors them, under its own names:

| Figma collection | Holds | In code |
|---|---|---|
| `Unicron / Primitives` | 128 colours, one per app, ground and slot | the theme slots: `global.json` holds the Unicron default (not in Figma yet); each app's slots are in the app's own layer (the playground's copies: `apps/playground/src/app-themes/`) |
| `Unicron / Theme` | 21 roles in 8 modes; Sean adds a `Default` pair | the Figma roles in `semantic.json`; `critical/*` and `surface/scrim` hold literals in Figma, and sit in `global.json` here |
| `Unicron / Space` | 18 spacing steps, 3 radii, 2 sizes | Tailwind's 4px unit, `radius.base`, `size.control`, `size.touch-min` |

The 23 text styles of `Unicron Type/` are `type.json`, with `mono-row` waiting on its style. Figma has no variable for a stroke width,
a state colour, `success`, `warning` or `info`: those exist only in code.
