# 05 · Consuming unicron

How Mailbird, Synapse and Lockdown use the system. The shape is the same for each: install two
packages, import one stylesheet, add your extension layer, import components.

## 1. Install

Every release is a git tag (`@unicron/ui@0.1.0`), a GitHub Release with the packed tarball
attached, and, when npm publishing is configured, an npm version. Two ways in, same package either
way:

**a. From npm** (when the versions you want are published there):

```bash
pnpm add @unicron/ui@^0.1.0 @unicron/tokens@^0.1.0
```

**b. From the GitHub Release tarball** (no registry account needed; works before or without npm):

```bash
pnpm add https://github.com/snds/unicron/releases/download/%40unicron%2Fui%400.1.0/unicron-ui-0.1.0.tgz          https://github.com/snds/unicron/releases/download/%40unicron%2Ftokens%400.1.0/unicron-tokens-0.1.0.tgz
```

The tag is part of the URL, URL-encoded (`@` → `%40`, `/` → `%2F`); the file is
`unicron-<package>-<version>.tgz`. `@unicron/ui` declares `@unicron/tokens` as an exact-version
dependency. From npm that resolves on its own; from tarballs the registry does not have it, so
pin it with an override so pnpm resolves the dependency to the same tarball. In a pnpm workspace
the override lives in `pnpm-workspace.yaml`:

```yaml
overrides:
  "@unicron/tokens": https://github.com/snds/unicron/releases/download/%40unicron%2Ftokens%400.1.0/unicron-tokens-0.1.0.tgz
```

In a single-package repo, the same entry goes under `"pnpm": { "overrides": { … } }` in
`package.json`. Without it, pnpm looks for `@unicron/tokens@0.1.0` on the registry and the install
fails. One override means one copy of the tokens, so the app and `@unicron/ui` read the same CSS.

Bumping is then editing the two URLs (and the override, when tokens moved too). The lockfile
records each tarball's hash, so a later install cannot pick up different bytes. Pin exact versions and bump inside the
support window (current and previous minor); a `major` ships with a codemod linked from its PR.

Peer dependencies: `react@19`, `react-dom@19`. The app also needs `tailwindcss@4` and
`@tailwindcss/vite` (or the PostCSS plugin). Both packages ship `dist/` only, with `.d.ts` files.
`@unicron/ui` exports the root (`@unicron/ui`), per-component subpaths (`@unicron/ui/button`,
`@unicron/ui/icon`) and the stylesheet (`@unicron/ui/styles`).

## 2. Import the stylesheet once

In your CSS entry (what `main.tsx` imports):

```css
@import "@unicron/ui/styles";        /* tailwind + tokens + base layer + icon font + Inter */
@import "./app-extension.css";       /* your roles, after the core */
```

`@unicron/ui/styles` imports Tailwind, `tw-animate-css`, Inter Variable, Material Symbols
Rounded, `@unicron/tokens/dist/tokens.css`, registers the `dark` variant on `.dark`, and adds a
`@source` for the primitives so Tailwind generates their classes from the installed package. This
is verified against a plain Vite + React app outside the workspace on every release; if your
bundler still misses classes, add `@source "../node_modules/@unicron/ui/dist/components";` to your
entry (adjust the relative path to your CSS file).

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
shadcn-material transform (`pnpm regen`, in `tools/shadcn-material`) against a `shadcn-ui/ui`
checkout (see the README → Regenerating components). An app that needs a primitive of its own,
with `@/…` aliases, runs the same tool with `--alias-mode app`. Do not fork a primitive into your app under the same name;
`dsa` reports local look-alikes of system names as violations.

## 7. Moving off the submodule (Mailbird)

Mailbird consumed unicron as a git submodule at `vendor/unicron` with `workspace:*` links during
week one. The versioned packages replace it; nothing in `src/` changes.

1. **Remove the submodule.** `git submodule deinit -f vendor/unicron && git rm -f vendor/unicron`,
   delete the `vendor/unicron` entry from `.gitmodules` (and the directory under `.git/modules`),
   and drop `vendor/unicron/packages/*` from `pnpm-workspace.yaml`.
2. **Replace the links.** In the app's `package.json`, change
   `"@unicron/ui": "workspace:*"` and `"@unicron/tokens": "workspace:*"` to the versioned
   dependencies from step 1 above (npm ranges, or the two release-tarball URLs plus the
   `@unicron/tokens` override in `pnpm-workspace.yaml`, which the `workspace:*` link used to make
   unnecessary). Run `pnpm install` so the lockfile re-resolves. Mailbird's move is ADR-0052 in
   its repo: 68 screens and 133 tokens identical before and after.
3. **Keep your extension layer.** `src/styles/app-extension.css` stays exactly where it is and
   keeps importing after `@unicron/ui/styles`; the core never ships your roles. Remove any
   `@source` that pointed into `vendor/unicron`, and any `paths` alias in `tsconfig.json` that did.
4. **Check.** `pnpm typecheck && pnpm build && pnpm dsa ratchet`. The ratchet baseline does not
   move: the components are the same, only the path they come from changed.
5. **Bump inside the window.** Watch the unicron Releases page; take each `minor` within the
   support window (current and previous minor). A `major` arrives with a codemod linked from its
   PR; run it, then bump.

Synapse and Lockdown start at step 2: they never had the submodule.

## 8. Measure

Add `dsa.config.json` to your app (copy unicron's; set `system.packages` to `["@unicron/ui"]`,
and `localAliases` to your shadcn alias, e.g. `["@/components/ui"]`), then:

```bash
pnpm dsa scan      # adoption + correct use
pnpm dsa patterns  # candidate compositions to promote
pnpm dsa ratchet   # keep violations from growing
```
