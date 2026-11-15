# @unicron/tokens

Design tokens for [unicron](https://github.com/snds/unicron), Sean Sands' shared design system.
DTCG JSON in three tiers (global → semantic → component), with two axes: four app themes
(`warpcore`, `vale`, `lockdown`, `synapse`) on two grounds (graphite = dark, stone = light).
The colour, type and size values are Figma's, and the tests hold them to it. Built to:

- `dist/tokens.css` — CSS custom properties (`--g-*`, `--*`, `--c-*`, `--type-*`), plus a
  Tailwind v4 `@theme inline` map (`bg-surface-ground`, `text-text-label`, `bg-background`,
  `h-control`, …).
- `dist/plain.css` (`@unicron/tokens/plain.css`) — the same custom properties with no Tailwind
  map, no nesting and nothing to fetch, for a page with no Tailwind (an extension's in-page
  frame). `class="system"` on its root follows the browser's light or dark setting.
- `dist/tokens.json` — the same tokens, flat, for tooling. `themes` holds each app's slots and
  `type` the 23 type roles.
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

In the app's HTML, not in CSS:

```html
<html data-theme="vale" class="dark">  <!-- Vale on graphite -->
<html data-theme="vale">               <!-- Vale on stone -->
```

`data-theme` picks the app. The `dark` class picks the ground, as before. With no `data-theme`
the values are warpcore's. Copy `examples/app-extension.css` to add the roles only your app has.

## Sources

| File | Holds |
|---|---|
| `tokens/global.json` | tier 1: raw values, and the theme slots with the default app's values |
| `tokens/themes/<app>.json` | the 28 theme slots for one app |
| `tokens/semantic.json` | tier 2: Figma's roles, and the shadcn contract as aliases of them |
| `tokens/type.json` | the 23 type roles |
| `tokens/component.json`, `tokens/component/<area>.json` | tier 3: component knobs |
| `tokens/figma/theme-2026-11.json` | a snapshot of the Figma read-out; the parity check compares against it |

## Checks

`pnpm test` builds, then runs four scripts:

| Script | Fails when |
|---|---|
| `scripts/check.mjs` | a contract name is missing, an alias points somewhere else, the block layout is wrong |
| `scripts/figma-parity.mjs` | a built value differs from Figma's |
| `scripts/contrast.mjs` | a painted pair is under its floor in any of the 8 modes and is not a named exception |
| `scripts/lint.mjs` (`pnpm lint:tokens`, from the repo root) | a role or a knob holds a raw colour, or a source file breaks its shape |

Component areas add their contrast recipes in `scripts/recipes/<area>.mjs`
([format](./scripts/recipes/README.md)).

**Coming from 0.x?** `primary` now means the app's identity colour, not the strongest ink;
`--radius` is 2px; the fonts are Geist and Geist Mono. Follow
[Migrating to 1.0](https://github.com/snds/unicron/blob/main/docs/07-migrating-to-1.0.md).

Docs: [tokens](https://github.com/snds/unicron/blob/main/docs/02-tokens.md) ·
[consuming](https://github.com/snds/unicron/blob/main/docs/05-consuming.md) ·
[the look](https://github.com/snds/unicron/blob/main/DESIGN.md) ·
[changelog](./CHANGELOG.md).

## Licence

Apache-2.0 ([LICENSE](./LICENSE)). The tokens name two font families, Geist and Geist Mono (SIL
Open Font License 1.1, by the Geist Project Authors). This package holds no font file: an app
gets the fonts through `@unicron/ui`'s stylesheet, or loads them itself.
