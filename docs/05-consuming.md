# 05 · Consuming unicron

How Mailbird, Synapse and Lockdown use the system. The shape is the same for each: install two
packages, import one stylesheet, add your extension layer, import components.

## 1. Install

```bash
pnpm add @unicron/ui @unicron/tokens
# while unpublished, from git:
pnpm add github:snds/unicron#main --filter <your-app>   # or a workspace: link in a monorepo
```

Peer dependencies: `react@19`, `react-dom@19`. The app also needs `tailwindcss@4` and
`@tailwindcss/vite` (or the PostCSS plugin), which `@unicron/ui` already depends on.

## 2. Import the stylesheet once

In your CSS entry (what `main.tsx` imports):

```css
@import "@unicron/ui/styles";        /* tailwind + tokens + base layer + icon font + Inter */
@import "./app-extension.css";       /* your roles, after the core */
```

`@unicron/ui/styles` imports Tailwind, `tw-animate-css`, Inter Variable, Material Symbols
Rounded, `@unicron/tokens/dist/tokens.css`, registers the `dark` variant on `.dark`, and adds a
`@source` for the primitives so Tailwind generates their classes. If your app lives outside the
unicron workspace and Tailwind misses classes, add
`@source "../node_modules/@unicron/ui/src/components";` to your entry.

## 3. Add your app-extension token layer

Copy `@unicron/tokens/examples/app-extension.css` as a starting point. Put roles only your app
has there: panes, per-area hues, status markers, tints, plus `--c-*` knobs for app-only
components. Alias core tokens, swap only in `.dark`, expose to Tailwind with your own
`@theme inline` block. Never edit the core semantic tier to add a role.

```css
:root  { --unread: var(--g-blue-500); }
.dark  { --unread: var(--g-blue-400); }
@theme inline { --color-unread: var(--unread); }
```

## 4. Switch themes

Toggle the `dark` class on `<html>`. With `next-themes`:

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

## 5. Use the components

```tsx
import { Button, Icon, Field, FieldLabel, Input } from "@unicron/ui"

<Field>
  <FieldLabel htmlFor="q">Search</FieldLabel>
  <Input id="q" />
</Field>
<Button><Icon name="send" data-icon="inline-start" />Send</Button>
```

Prefer a variant prop over a `className` override. `dsa ratchet` counts overrides on system
components and fails CI when the count grows.

## 6. Regenerate or add components

Primitives are owned source in `packages/ui/src/components/ui`. To add one, run the
shadcn-material transform against a `shadcn-ui/ui` checkout and rewrite the alias imports (see
the README → Regenerating components). Do not fork a primitive into your app under the same name;
`dsa` reports local look-alikes of system names as violations.

## 7. Measure

Add `dsa.config.json` to your app (copy unicron's; set `system.packages` to `["@unicron/ui"]`,
and `localAliases` to your shadcn alias, e.g. `["@/components/ui"]`), then:

```bash
pnpm dsa scan      # adoption + correct use
pnpm dsa patterns  # candidate compositions to promote
pnpm dsa ratchet   # keep violations from growing
```
