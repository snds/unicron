# @unicron/ui

React primitives for [unicron](https://github.com/snds/unicron), Sean Sands' shared design system:
shadcn/ui (`base-nova` style) on Base UI, Material Symbols Rounded icons, Tailwind v4 classes bound
to `@unicron/tokens`.

```bash
pnpm add @unicron/ui @unicron/tokens
```

```css
/* your CSS entry */
@import "@unicron/ui/styles";   /* tailwind + tokens + base layer + Inter + icon font */
@import "./app-extension.css";  /* your roles, after the core */
```

```tsx
import { Button, Icon } from "@unicron/ui"
// or per component: import { Button } from "@unicron/ui/button"

<Button><Icon name="send" data-icon="inline-start" />Send</Button>
```

Peer dependencies: `react@19`, `react-dom@19`. Your app needs Tailwind v4 wired into its bundler
(`@tailwindcss/vite` or the PostCSS plugin).

Docs: [components](https://github.com/snds/unicron/blob/main/docs/03-components.md) ·
[consuming](https://github.com/snds/unicron/blob/main/docs/05-consuming.md) ·
[changelog](./CHANGELOG.md). Apache-2.0; portions derived from shadcn/ui (MIT).
