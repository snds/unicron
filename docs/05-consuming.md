# 05 · Consuming unicron

How Warpcore, Vale (formerly Mailbird), Lockdown and Synapse use the system. The shape is the same for each: install two
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
@import "@unicron/ui/styles";        /* tailwind + tokens + base layer + Geist + Geist Mono */
@import "./app-extension.css";       /* your roles, after the core */
```

`@unicron/ui/styles` imports Tailwind, `tw-animate-css`, Geist and Geist Mono (as font files,
so a strict `font-src 'self'` holds), `@unicron/tokens/dist/tokens.css`, registers the `dark` variant on `.dark`, and adds a
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

There are two axes, both on `<html>` (or any subtree root):

- **Your app**: `data-theme="warpcore" | "vale" | "lockdown" | "synapse"`. It picks the app's
  identity colour and tinted neutrals. Set it once; with no attribute you get warpcore's values.
- **The ground**: the `dark` class is graphite, `light` (or no class) is stone.

```html
<html data-theme="vale" class="dark">
```

A nested `.dark` / `.light` box, or a nested `data-theme` box, re-resolves every role inside it.
Ground boxes nest to any depth; a `data-theme` box with no ground class of its own finds its
ground up to three dark boxes deep, as the `dark:` variant does (docs/02-tokens.md → Two axes).
Toggle the ground with the
`dark` class. In a client-only app (Vite,
Tauri) a few lines do it, and `Toaster` takes the same setting as a prop:

```tsx
const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
useEffect(() => {
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  const apply = () => document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && mq.matches))
  apply()
  mq.addEventListener("change", apply)
  return () => mq.removeEventListener("change", apply)
}, [theme])

<Toaster theme={theme} />
```

`next-themes` is optional. It fits a server-rendered app, where its inline script prevents a
flash of the wrong theme on load:

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

In a client-only React 19 app that same script makes React log, in development only,
"Encountered a script tag while rendering React component". It is harmless in production, but
it breaks a "no console errors" bar; prefer the hook above there.

### Under a strict Content-Security-Policy

`@unicron/ui` works with `style-src 'self'; font-src 'self'` and no inline script (Lockdown's web
vault). No component adds a `<style>` tag or writes a `style` attribute into markup, the fonts
ship as files, and nothing loads from a `data:` URL.

One dependency does add a tag: sonner, which `Toaster` is built on, inserts its own stylesheet
as its script loads. That policy refuses it, and without those rules a toast would fall into the
page's flow. So `@unicron/ui/styles` carries the same rules as a file (it imports
`sonner/dist/styles.css`), and the refused tag does no harm: toasts take their place either way.
You need to do nothing, and you do not need to strip the tag at build. The browser will log one
"Refused to apply inline style" line for sonner's tag; that line is the policy working. (Base UI's
scroll area also tries one tag, for hiding scrollbars; the stylesheet's `no-scrollbar` utility
already covers it.) A browser check loads the Toaster under this policy
(`apps/playground/tests/parts.spec.ts`).

## 4a. Icons (Carbon)

Icons are IBM Carbon, drawn as inline SVG by `<Icon name="…" />`. There is no icon font to load
and nothing to configure. Coming from Material Symbols (before 1.0):

1. Run `npx unicron-codemod icons <src> --dry` and read its report, then run it once without
   `--dry`. It rewrites known Material names in `name=` / `icon=` attributes and `icon:` /
   `iconName:` properties, lists what it could not map, and never guesses. It refuses a second
   pass on a tree that already has Carbon names.
   Where `fill` marked a state (pinned, a favourite, the current item) and Carbon has a filled
   form of the glyph, it writes that name (`name={pinned ? "pin--filled" : "pin"}`); it lists
   every other `fill`, `weight`, `grade` and `opticalSize` it leaves, by file and line.
2. Run `tsc`: `IconName` no longer accepts Material names, so it finds the rest. `Icon` lost
   `fill`, `weight`, `grade` and `opticalSize`, so tsc names each one still passed
   ("Property 'fill' does not exist"). Where `fill` was the only cue for a state, keep the cue:
   pick the `--filled` name, or show the state another way; do not just delete the prop.
3. **Names that arrive as data.** Neither step reaches a name a server sends or a saved template
   stores: cast to `IconName`, it draws an empty box marked `data-icon-missing`. Change names a
   server or a build step writes at their source, with the map. Translate names already stored
   once, when they are read, with `iconFromMaterial()` from `@unicron/ui` (it returns `null` for a
   name with no match, and for anything that is not a Material name), and store the Carbon name.
   MAPPING.md → Names that arrive as data has the details.
4. Remove the `material-symbols` dependency and any `--c-icon-*` use. `IconButton` lost `fill`;
   `Spinner` takes svg props, not Icon props.

The full map, with a note for each choice and the eight names with no Carbon match, is
`node_modules/@unicron/ui/codemod/MAPPING.md`. For a glyph Carbon lacks, register your own:

```ts
import { registerIcons } from "@unicron/ui"
registerIcons({ "mail--forward": "<path d=\"…\"/>" })   // inner SVG markup on a 32 grid

declare module "@unicron/ui" {
  interface UnicronIconRegistry { "mail--forward": true }
}
```

Markup is parsed, never injected: only `path`, `circle`, `rect`, `g` and plain drawing attributes
survive, so a strict CSP has nothing to object to.

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

## 5a. Fit every screen

Decide from the space you have, never from the device. WebKit asks for the same: there's no iPhone
Duo check anywhere in here, and the next foldable needs no new code.

**Width classes** come from `useViewport().widthClass`, and match Tailwind's breakpoints:

| Class | From | Tailwind | For example |
|---|---|---|---|
| `compact` | 0 | | iPhone 390 · Duo folded 382 · Duo's two windows 385 |
| `medium` | 640 | `sm:` | small iPhone sideways 667 · Duo open 669 · iPad mini 744 |
| `expanded` | 768 | `md:` | iPad 820 · iPhone sideways 844 · Duo open sideways 951 |
| `wide` | 1280 | `xl:` | iPad Pro sideways · laptops |
| `ultrawide` | 2560 | `ultrawide:` | ultrawide monitors |

Width doesn't tell you a phone from a tablet: an iPhone on its side is as wide as an iPad mini, at a
third of the height. So check `short` before you add a second pane.

**Short** (`useViewport().short`, or the `short:` variant) means sideways and under 480px tall, so
height is what's scarce. A phone in landscape, or a folded Duo at 594 × 368. Show one thing at a
time, and put controls beside the content, not above it. `AppFrameNav`, `Textarea` and `Empty`
already do their part.

**Where the nav goes** (`useViewport().navPlacement`, the `nav-rail:` variant). A floating capsule along the bottom, or `rail`, a pill at the foot of the right edge, on a short screen or a narrow one less than 1.6 times as tall as it is wide. That's where iOS puts tab bars on iPhone Duo in every pose but the inner display in portrait, and it's what a folded Duo and an iPhone sideways have in common. Don't use `100vh` or `100lvh` for a full-screen box: they can be taller than the screen in a home-screen app. `AppFrame` measures instead.

**A keyboard** (`useViewport().keyboardOpen` and `room`, or the `frame-tight:` and `frame-minimal:`
variants inside an `AppFrame`). `AppFrame` keeps clear of it and drops its bars when `room` is
`tight`. Under `minimal`, a folded Duo in landscape has about 180px, so drop what you can. The
layout holds still while someone types: `height`, `short` and `widthClass` ignore the keyboard.

**A fold** (`useViewport().fold`, `fold-book:` and `fold-tabletop:`, and `FoldPanes`). Null when the
device is flat, including a foldable lying fully open: its crease divides nothing. This is the
Viewport Segments API, which Android Chrome has and Safari 27.1 has behind a flag, so a fold is
always an extra. The layout has to work without one.

**Folding and rotating are window resizes.** Nothing reloads, so keep state above whatever the
layout swaps out: a draft shouldn't live in a component that only exists at one size.

**Touch fields stay at 16px.** iOS zooms the whole page into a focused field under 16px and doesn't
zoom back out. `Input`, `Textarea`, `NativeSelect` and `CommandInput` only drop to 14px with a
mouse (`pointer-fine:`). A custom field needs the same.

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

## 9. Desktop title bar

A desktop app (Tauri on macOS, say) often hides the native title bar and uses its own top row as
the title bar: the window buttons sit there and pressing the row moves the window
(`data-tauri-drag-region`). A modal `Dialog` or `Sheet` backdrop covers that row, so the window
can't be moved while a dialog or the command palette is open. The app can't fix that from
outside: a `fixed` element inside the popup is positioned relative to the popup (it is
transformed), and one outside the portal sits under the backdrop.

`beforeContent` is the composition point. `DialogContent`, `SheetContent`,
`AdaptiveSheetContent` and `CommandDialog` render it in the portal after the backdrop and before
the popup, so it paints above the backdrop and below the popup. A press on it doesn't dismiss:
Base UI closes a modal dialog only on a press on the backdrop itself.

```tsx
// One strip for the whole app. It renders only while the app's own row is the title bar:
// on macOS, in the app, outside full screen. On the web, or with a native title bar, it is null.
export function TitleBarDragStrip() {
  const isOwnTitleBar = useIsOwnTitleBar() // platform === "macos" && !isFullscreen, from Tauri
  if (!isOwnTitleBar) return null
  return <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-13" data-tauri-drag-region="deep" />
}

<DialogContent beforeContent={<TitleBarDragStrip />}>…</DialogContent>
<SheetContent beforeContent={<TitleBarDragStrip />}>…</SheetContent>
<CommandDialog beforeContent={<TitleBarDragStrip />}>…</CommandDialog>
```

The popups keep clear of the strip through one knob, `--c-dialog-titlebar-inset` (`0px` by
default, so nothing moves on the web). A dialog centres in the area below it; a side or top sheet
starts under it; a `fullscreen` sheet stops short of it. Set it to the strip's height, under the
same condition the strip renders under, in your app-extension layer:

```css
/* The app sets a class or attribute on <html> while its own row is the title bar. */
html[data-own-title-bar] { --c-dialog-titlebar-inset: 3.25rem; } /* h-13 */
```

A dialog taller than the area below the inset still overflows it, as it overflows the viewport
today; give such a dialog a scrolling body.

