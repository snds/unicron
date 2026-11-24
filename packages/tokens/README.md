# @unicron/tokens

Design tokens for [unicron](https://github.com/snds/unicron), Sean Sands' shared design system.
DTCG JSON in three tiers (global → semantic → component), with two axes: a theme (Unicron's own
generic default, or the one your app declares) on two grounds (graphite = dark, stone = light).
The shared colour, type and size values are Figma's, and the tests hold them to it. No app's
theme lives here since 1.1: each app declares its own and measures it with the contrast tool this
package ships. Built to:

- `dist/tokens.css` — CSS custom properties (`--g-*`, `--*`, `--c-*`, `--type-*`), plus a
  Tailwind v4 `@theme inline` map (`bg-surface-ground`, `text-text-label`, `bg-background`,
  `h-control`, …).
- `dist/plain.css` (`@unicron/tokens/plain.css`) — the same custom properties with no Tailwind
  map, no nesting and nothing to fetch, for a page with no Tailwind (an extension's in-page
  frame). With no class its root follows the browser's light or dark setting; `class="stone"` or
  `class="graphite"` forces one.
- `dist/tokens.json` — the same tokens, flat, for tooling. `themeSlots` lists the 10 accent slots a
  theme declares, and `type` the 24 type roles.
- `unicron-contrast` (bin) — the contrast gate, for your own theme:
  `unicron-contrast src/app-extension.css --exceptions src/contrast-exceptions.json`.
- `@unicron/tokens/spring` — the small spring solver the builder uses to turn each `spring.*` token
  into a CSS `linear()` curve. Import it to run the same spring in JS:

  ```js
  import tokens from "@unicron/tokens" with { type: "json" }
  import { springPosition } from "@unicron/tokens/spring"

  const firm = tokens.tokens["--g-spring-firm"].spring // { stiffness, damping, mass }
  const x = springPosition(firm, 0.12 /* seconds */, 3 /* release speed, distances per second */)
  ```

```css
@import "@unicron/tokens/dist/tokens.css";
```

Most apps do not import this directly: `@unicron/ui/styles` already does.

## Set the theme

Declare your app's 10 accent slots in your own layer (`examples/app-extension.css` shows a whole
one), then switch it on in the app's HTML, not in CSS:

```html
<html data-theme="vale" class="dark">  <!-- your theme on graphite -->
<html data-theme="vale">               <!-- your theme on stone -->
<html>                                 <!-- Unicron's default theme, on stone -->
```

`data-theme` picks the theme your layer declares. The `dark` class picks the ground, as before.
Measure the theme in CI:

```sh
pnpm exec unicron-contrast src/app-extension.css --exceptions src/contrast-exceptions.json
```

It prints every pair the components paint, on both grounds, and fails on a miss your exceptions
file does not name (`--print-exceptions` writes the first list for you). See
[05 · Consuming → Declare your app's theme](https://github.com/snds/unicron/blob/main/docs/05-consuming.md#3a-declare-your-apps-theme).

## Sources

| File | Holds |
|---|---|
| `tokens/global.json` | tier 1: raw values: the 10 accent slots with Unicron's default accent, and the shared 2.0 neutrals, status, labels and charts |
| `tokens/semantic.json` | tier 2: Figma's roles, and the shadcn contract as aliases of them |
| `tokens/type.json` | the 24 type roles |
| `tokens/component.json`, `tokens/component/<area>.json` | tier 3: component knobs |
| `tokens/figma/theme-2026-11-24.json` | a snapshot of the Figma read-out; the parity check compares against it |

## Checks

`pnpm test` builds, then runs these scripts:

| Script | Fails when |
|---|---|
| `scripts/check.mjs` | a contract name is missing, an alias points somewhere else, the block layout is wrong |
| `scripts/figma-parity.mjs` | a built value differs from Figma's (the four apps' themes are checked as the playground's copies in `apps/playground/src/app-themes/`) |
| `scripts/contrast.mjs` | a painted pair is under its floor and is not a named exception: on the default theme, on the example layer's theme, and on the four apps' themes in the playground, each with its own exceptions |
| `scripts/lint.mjs` (`pnpm lint:tokens`, from the repo root) | a role or a knob holds a raw colour, or a source file breaks its shape |

Component areas add their contrast recipes in `scripts/recipes/<area>.mjs`
([format](./scripts/recipes/README.md)).

**Coming from 1.0?** The four app themes left this package: copy your app's 28 slots into your
own layer (the playground has them, with their Figma ids, in `apps/playground/src/app-themes/`).
With no `data-theme` the values are now Unicron's default, not Warpcore's. `plain.css` with no
class now follows the browser. The neutral and accent ramps are deprecated (removed in 2.0). The
changelog has the rest.

**Coming from 0.x?** `primary` now means the app's identity colour, not the strongest ink;
`--radius` is 2px; the fonts are Geist and Geist Mono. Follow
[Migrating to 1.0](https://github.com/snds/unicron/blob/main/docs/07-migrating-to-1.0.md).

Docs: [tokens](https://github.com/snds/unicron/blob/main/docs/02-tokens.md) ·
[consuming](https://github.com/snds/unicron/blob/main/docs/05-consuming.md) ·
[the look](https://github.com/snds/unicron/blob/main/DESIGN.md) ·
[changelog](./CHANGELOG.md).

## Licence

Apache-2.0 ([LICENSE](./LICENSE); attributions in [NOTICE](./NOTICE)). The tokens name two font families, Geist and Geist Mono (SIL
Open Font License 1.1, by the Geist Project Authors). This package holds no font file: an app
gets the fonts through `@unicron/ui`'s stylesheet, or loads them itself.
