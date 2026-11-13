# @unicron/tokens

Design tokens for [unicron](https://github.com/snds/unicron), Sean Sands' shared design system.
DTCG JSON in three tiers (global → semantic → component), built to:

- `dist/tokens.css` — CSS custom properties (`--g-*`, `--*`, `--c-*`), light in `:root`, dark in
  `.dark`, plus a Tailwind v4 `@theme inline` map (`bg-background`, `text-muted-foreground`, …).
- `dist/tokens.json` — the same tokens, flat, for tooling.
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

Most apps do not import this directly: `@unicron/ui/styles` already does. Copy
`examples/app-extension.css` to add the roles only your app has. The DTCG sources are shipped under
`tokens/` for Figma sync and other build pipelines.

Docs: [tokens](https://github.com/snds/unicron/blob/main/docs/02-tokens.md) ·
[consuming](https://github.com/snds/unicron/blob/main/docs/05-consuming.md) ·
[changelog](./CHANGELOG.md). Apache-2.0.
