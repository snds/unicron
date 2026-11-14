# @unicron/ui

The React components of [unicron](https://github.com/snds/unicron), Sean Sands' shared design
system: the app frame and its chrome, rows, forms, overlays, chat and security parts. Base UI for
behaviour, IBM Carbon icons as inline SVG, Tailwind v4 classes bound to `@unicron/tokens`. The
small primitives began as shadcn/ui (`base-nova`); all of it is owned source.

```bash
pnpm add @unicron/ui @unicron/tokens
```

```css
/* your CSS entry */
@import "@unicron/ui/styles";   /* tailwind + tokens + base layer + Geist + Geist Mono */
@import "./app-extension.css";  /* your roles, after the core */
```

```html
<html data-theme="vale" class="dark">  <!-- your app, on graphite; no class is stone -->
```

```tsx
import { Button, Icon } from "@unicron/ui"
// or per component: import { Button } from "@unicron/ui/button"

<Button><Icon name="send" />Send</Button>
```

Peer dependencies: `react@19`, `react-dom@19`. Your app needs Tailwind v4 wired into its bundler
(`@tailwindcss/vite` or the PostCSS plugin).

Two tools come with the package:

- `npx unicron-codemod icons <dir>` moves an app's Material icon names to Carbon.
- `npx unicron-sources <out.css> <module>…` writes a smaller stylesheet entry, with classes for
  the modules you name only.

**Coming from 0.x?** Follow
[Migrating to 1.0](https://github.com/snds/unicron/blob/main/docs/07-migrating-to-1.0.md).

Docs: [components](https://github.com/snds/unicron/blob/main/docs/03-components.md) ·
[consuming](https://github.com/snds/unicron/blob/main/docs/05-consuming.md) ·
[the look](https://github.com/snds/unicron/blob/main/DESIGN.md) ·
[changelog](./CHANGELOG.md).

## Licence

Apache-2.0 ([LICENSE](./LICENSE)). Third-party material is listed in [NOTICE](./NOTICE):

- Portions derived from shadcn/ui (MIT).
- The icon drawings are IBM Carbon's (Apache-2.0), 32 px art, unchanged.
- `vendor/sonner.js` is a copy of sonner (MIT) without the `<style>` tag it adds at load.
- The fonts, Geist and Geist Mono (SIL Open Font License 1.1), are not in this package. They come
  from its dependencies `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`.
