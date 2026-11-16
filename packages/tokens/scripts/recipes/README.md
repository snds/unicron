# Contrast recipes, one file per component area

`scripts/contrast.mjs` loads every `*.mjs` file in this folder and measures its recipes with the
core ones, on both grounds: the Unicron default theme in `pnpm test`, and an app's own theme
when the app runs the tool on it (`unicron-contrast <theme>`; docs/05-consuming.md). A component area adds its own file here
(`primitives.mjs`, `overlays.mjs`, `shell.mjs` …) when its components land. The file's name is
put in front of each recipe id (`shell:tab-bar-active`), so ids only have to be unique in a file.

A recipe is one pair as a component paints it: the paint, the stack it sits on (bottom first),
and what it is for.

```js
// scripts/recipes/shell.mjs
export default ({ r, mix }) => [
  // The active dock tab: the icon in text-body on a primary-soft tile.
  { id: "tab-bar-active", source: "TabBarItem current: bg-primary-soft text-text-body", kind: "text-body", paint: r("text-body"), over: [r("surface-raised"), r("primary-soft")] },
  // A hover wash over the tab bar, under a label-level icon.
  { id: "tab-bar-hover", source: "TabBarItem: hover:bg-state-hover", kind: "text-label", paint: r("text-label"), over: [r("surface-raised"), r("state-hover")] },
]
```

- `r(role, alpha)` is a role, or a role at an opacity (`r("primary-fill", 0.9)` is Tailwind's
  `bg-primary-fill/90`). `mix(a, b, k)` is `color-mix(in oklab, a, b k)`. A plain array of recipes
  works too, and a paint may be a string: `"text-body"`, `"primary-fill/90"`.
- A role is any tier 2 name (`text-label`, `muted-foreground`) or a tier 3 knob with its prefix
  (`c-status-orb-working`).
- `modes` limits a recipe: a ground (`"graphite"`, `"stone"`), a theme (`"vale"`), or a mode
  (`"vale / stone"`). Leave it out to measure every mode the run has.

## Kinds and floors

| `kind` | Floor | For |
|---|---|---|
| `text-body` | APCA Lc 90 | main text |
| `text-secondary` | Lc 75 | supporting text |
| `text-label` | Lc 60 | labels, meta, and any coloured text |
| `text-display` | Lc 45 | large display type, 36px and up |
| `on-fill` | Lc 75 | text on a solid fill |
| `solid` | Lc 30 | a mark with no words against what it sits on: a progress cell, a dot, an edge, a tab indicator (WCAG 1.4.11) |
| `text-small` | Lc 75 and 4.5:1 | text under 16px in the small-* inks |
| `text-aa` | 4.5:1 | a coloured ink used as small text where WCAG 1.4.3 is the rule (the warning ink) |
| `focus` | 3:1 | a focus ring or focus border (WCAG 1.4.11) |
| `border-error` | 3:1 | an error border |
| `control-edge` | 3:1 | the edge that alone shows a control, where no glyph, knob or text inside it does (an unchecked checkbox) |
| `fill`, `text-faint`, `border-rest`, `border-decorative`, `state`, `surface` | reported | a fill that holds a label (a button: its label is gated as `on-fill`; Unicron 19), the faintest ink (disabled words and decoration only), a decorative 1px edge, separators, how far a state or a surface moves |

The kind names from before 1.0 still load: `text-primary` (now `text-body`), `text-on-tint`
(`text-label`), `on-solid` (`on-fill`). `border-control` is gone: a resting border is
`border-rest`, and a border held to 3:1 is `focus`, `border-error` or `control-edge`. A resting
edge is `border-rest` only when something else shows the control: a field's box and its text, a
switch's knob, a float button's glyph. When the edge is all there is, it is `control-edge`, and
so is a field's resting border since 1.1 (`line-field`, Unicron 18). The `large` flag is gone
too: a floor follows the kind, not the type size, except `text-display`.

Pick the kind by the ink, as the direction does. Text in `text-label`, or in a colour
(`primary-text`, `secondary-live`, `critical-text`, a status foreground), is `text-label`. Only
`text-secondary` ink is `text-secondary`.

## When a recipe misses

Change the recipe's paint or stack to what the component really draws, or change the component.
A role's value is not changed to make a recipe pass.

Only one kind of miss is kept in this folder: one the Unicron default theme has because of a value
every theme shares (Figma's critical and needs-you colours), or a contract state over one. List it
by name, with the modes it misses in, and it is reported instead of gated:

```js
export const exceptions = [
  { id: "tab-bar-hover", modes: "graphite", reason: "Figma value under a contract state (§6), flagged for Sean" },
]
```

The list must match the default theme's misses exactly. An entry that no longer misses fails the
run. A miss in an app's theme goes in that app's exceptions file (`--exceptions`), not here.
`node scripts/contrast.mjs --print-exceptions` prints every miss as an entry;
`--rows=<text>` prints the drawn colours for the recipes whose id contains the text.
