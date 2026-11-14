# 05 · Consuming unicron

How the four apps (Vale, Warpcore, Lockdown and Synapse) use the system. The shape is the same
for each: install two packages, import one stylesheet, set your theme, add your extension layer,
import components.

**Coming from 0.x?** Read [07 · Migrating to 1.0](07-migrating-to-1.0.md) first. It lists what an
app does to move, in order.

## 1. Install

Every release is a git tag (`@unicron/ui@1.0.0`), a GitHub Release with the packed tarball
attached, and, when npm publishing is configured, an npm version. Two ways in, same package either
way:

**a. From npm** (when the versions you want are published there):

```bash
pnpm add @unicron/ui@^1.0.0 @unicron/tokens@^1.0.0
```

**b. From the GitHub Release tarball** (no registry account needed; works before or without npm):

```bash
pnpm add https://github.com/snds/unicron/releases/download/%40unicron%2Fui%401.0.0/unicron-ui-1.0.0.tgz \
         https://github.com/snds/unicron/releases/download/%40unicron%2Ftokens%401.0.0/unicron-tokens-1.0.0.tgz
```

The tag is part of the URL, URL-encoded (`@` → `%40`, `/` → `%2F`); the file is
`unicron-<package>-<version>.tgz`. `@unicron/ui` declares `@unicron/tokens` as an exact-version
dependency. From npm that resolves on its own; from tarballs the registry does not have it, so
pin it with an override so pnpm resolves the dependency to the same tarball. The override lives in
`pnpm-workspace.yaml`, in every pnpm repo. A single-package repo can have that file too, with
nothing else in it:

```yaml
overrides:
  "@unicron/tokens": https://github.com/snds/unicron/releases/download/%40unicron%2Ftokens%401.0.0/unicron-tokens-1.0.0.tgz
```

Without it, pnpm looks for `@unicron/tokens@1.0.0` on the registry and the install fails. One
override means one copy of the tokens, so the app and `@unicron/ui` read the same CSS.

- **pnpm 10.6 or later** reads the override from `pnpm-workspace.yaml` (the four apps pin 10.28).
- **Not in `package.json`**, under `"pnpm": { "overrides": { … } }`. pnpm 11 and later ignore that
  field with a warning, and the install then fails as above. Only pnpm 10 and older read it;
  before 10.6 it is the one place that works.
- **npm needs no override.** The tokens tarball you install also serves `@unicron/ui`'s dependency.

Bumping is then editing the two URLs (and the override, when tokens moved too). The lockfile
records each tarball's hash, so a later install cannot pick up different bytes. Pin exact versions and bump inside the
support window (current and previous minor); a `major` ships with a codemod and a migration guide,
linked from its changeset.

Peer dependencies: `react@19`, `react-dom@19`. The app also needs `tailwindcss@4` and
`@tailwindcss/vite` (or the PostCSS plugin). Both packages ship `dist/` only, with `.d.ts` files.
`@unicron/ui` exports the root (`@unicron/ui`), per-component subpaths (`@unicron/ui/button`,
`@unicron/ui/icon`, `@unicron/ui/security/code-display`) and the stylesheet (`@unicron/ui/styles`).
The parts of the frame are one module: import them from the root or from `@unicron/ui/app-frame`.
The package also installs two tools, `unicron-codemod` and `unicron-sources`.

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

**A page with no Tailwind** (an extension's in-page frame) links `@unicron/tokens/plain.css`
instead. It is the same custom properties, flat: use the roles by name
(`var(--surface-raised)`), and load the fonts from the page's own origin. `class="system"` on its
root follows the browser's light or dark setting ([02 · Tokens → Plain CSS](02-tokens.md#plain-css-for-a-page-with-no-tailwind)).

### A smaller stylesheet

`@unicron/ui/styles` makes classes for every component in the package, whether your app uses it or
not. For an app with a CSS budget there is a second entry, `@unicron/ui/styles/lean.css`: the same
stylesheet without the line that scans the whole package. A small tool writes the entry for the
modules you name:

```sh
npx unicron-sources src/unicron.css button dialog app-frame list-row security/code-display
```

```css
@import "./unicron.css";             /* instead of @unicron/ui/styles */
@import "./app-extension.css";
```

A module is what you import: `button` for `@unicron/ui/button`, or for `Button` from the package
root. A listed module brings the files it imports with it (`dist/styles/sources.json` holds that
map). **A module you use but leave off the list loses its classes**, so list every one, and run
the tool again when the list changes. The file it writes scans the package's components and leaves
out the rest with `@source not`, because Tailwind 4.3 does not narrow a scan inside `node_modules`
to single files.

Measured on 2026-11-14, a Vite app, stylesheet minified, gzip -9:

| What the app imports | Stylesheet | gzip |
|---|---|---|
| `@unicron/ui/styles`, any app | 249 kB | 38.3 kB |
| lean, about 50 modules (a whole app: frame, lists, chat, overlays, forms) | 207 kB | 32.9 kB |
| lean, `button` alone | 99 kB | 17.6 kB |
| lean, no module (tokens, type roles, fonts, base, motion, sonner's rules) | 77 kB | 14.1 kB |

For scale: 0.24 measured 157 kB / 25.5 kB for the first row. 1.0 adds four themes on two grounds,
23 type roles, about 50 more modules and sonner's rules as a file (2.5 kB gzip; they used to
arrive in a `<style>` tag, uncounted). An app that held its initial CSS to 25 kB on 0.24 has to
set that budget again on purpose: the lean entry gets a whole app to about 33 kB, not to 25.

## 3. Add your app-extension token layer

Copy `@unicron/tokens/examples/app-extension.css` as a starting point. Put roles only your app
has there: panes, per-area hues, status markers, tints, plus `--c-*` knobs for app-only
components. Never edit the core semantic tier to add a role.

- **Alias a role, not a raw value.** `--g-neutral-*` and the other old ramps are not themed: a
  surface or an ink built on them does not follow your app's tint.
- **A role that only points at core roles** is the same on both grounds. Declare it once, on all
  four selectors, so it also follows a nested box:

  ```css
  :root, .light, .dark, [data-theme] { --unread: var(--text-body); }
  @theme inline { --color-unread: var(--unread); }
  ```

- **A role that differs by ground** swaps on the core's own two ground selectors. Copy them from
  the example as they are. A plain `.dark` would leave a `data-theme` box inside a dark page on
  the light values.
- **An app outside the four** can bring its own theme: declare all 28 theme slots under its own
  `[data-theme="…"]`. Unicron's contrast gate does not measure a theme it does not ship, so
  measure yours.

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

`Toaster` is built on sonner, and sonner's own module adds its stylesheet to the page in a
`<style>` tag as it loads. That would break the rule above, so `@unicron/ui` does not load it:
the Toaster uses a copy of sonner's module with that one step taken out
(`vendor/sonner.js`, written by `scripts/build-sonner.mjs` and checked against the installed
sonner in `pnpm test`), and `@unicron/ui/styles` carries sonner's rules as a file (it imports
`sonner/dist/styles.css`). No page gets a tag from this package, with a Toaster on it or without.

**Import `toast` from `@unicron/ui`, not from `sonner`.** The Toaster listens to the copy, so a
toast raised with sonner's own `toast` never shows in it, and importing `sonner` yourself brings
the `<style>` tag back. The Toaster warns in the console, once, when it finds that tag on the page.

Base UI adds one tag of its own, to hide a scrollbar: in a scroll area, and in a select's list as
it opens. `ScrollArea` and `SelectContent` tell Base UI not to, and the stylesheet's `no-scrollbar`
utility hides the bar instead. If your app uses a Base UI scroll area or select directly, do the
same: wrap the app in `<CSPProvider disableStyleElements>` from `@base-ui/react/csp-provider` and
put `no-scrollbar` on the part that scrolls.

`next-themes` adds a `<style>` tag too, for a moment each time it sets the ground, when it is given
`disableTransitionOnChange`. Leave that prop out under a strict policy, or set the ground with the
hook above.

Browser checks hold this: the Toaster, a `ScrollArea` and a `Select` are loaded under
`style-src 'self'` and the policy must refuse nothing of theirs
(`apps/playground/tests/parts.spec.ts`), and every view is checked for a `<style>` tag
(`shell.spec.ts`).

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
import { Button, Icon, TextField } from "@unicron/ui"

<TextField label="Website" defaultValue="github.com" />
<Button><Icon name="send" />Send</Button>
```

- **Prefer a prop over a `className`.** `dsa ratchet` counts `className` and `style` overrides and
  spread props on system components, and fails CI when a count grows. If a part cannot do what
  you need, that is a variant to propose, not a class to add.
- **Build the shell from the frame parts.** One tree of `AppFrame` parts draws the phone chrome,
  the desktop shell and everything between; an app writes no shell media query
  ([03 · Components → The frame](03-components.md#the-frame); a worked example is in
  [07 → The new shells](07-migrating-to-1.0.md#9-the-new-shells)).
- **Put the `Toaster` inside the `AppFrame`,** and raise toasts with `toast` from `@unicron/ui`.
- **The look is not yours to restyle.** One solid primary on a screen; the identity colour for
  that action, identity text and selection; `secondary-live` for live work; the yellow only for
  "this needs you". [DESIGN.md](../DESIGN.md) has the rules.

## 5a. Fit every screen

Decide from the space you have, never from the device. WebKit asks for the same: there's no iPhone
Duo check anywhere in here, and the next foldable needs no new code.

**Width classes** come from `useViewport().widthClass`. The frame parts read them, so most apps
never do:

| Class | From | What the frame draws | For example |
|---|---|---|---|
| `compact` | 0 | the phone chrome | iPhone 390 · Duo folded 382 · Duo's two windows 385 |
| `medium` | 600 | the desktop shell with one content column; the sidebar as its rail; a detail is pushed | Duo open 669 · iPad mini 744 · iPad 820 · Duo open sideways 951 |
| `expanded` | 1024 | the full desktop shell, list and detail side by side | iPad sideways 1024 to 1194 · a small laptop window |
| `wide` | 1280 | the same, with wider gutters and a wider list | iPad Pro sideways 1366 · laptops |
| `ultrawide` | 2560 | the same | ultrawide monitors |

`medium` (600) has no Tailwind twin. Decide a layout from the hook or from a frame part, never
from an `sm:` or `md:` class. (Before 1.0 `medium` began at 640 and `expanded` at 768.)

Width does not tell you a phone from a tablet: an iPhone on its side (667 to 956 wide) is as wide
as an iPad, at a third of the height. So the frame checks `short` first, and so should you before
you add a second pane.

**Short** (`useViewport().short`, or the `short:` variant) means sideways and under 480px tall, so
height is what's scarce. A phone in landscape, or a folded Duo at 594 × 368. Show one thing at a
time, and put controls beside the content, not above it. The frame already does its part: on a
short screen under 1024 wide the bottom row stands as a column at the trailing edge.

**Where the bottom row goes** (`useViewport().navPlacement`, the `nav-rail:` variant). Along the
bottom, or as `rail`, a column at the trailing edge, on a short screen, or a narrow one that is
under 600 tall and less than 1.6 times as tall as it is wide (a folded Duo at 382 × 580, two
windows at 385 × 571). A narrow window that is tall is not squat: 430 × 667 and 560 × 844 keep the
bottom row. That is where iOS puts tab bars on iPhone Duo in every pose but the inner display in
portrait. Do not use `100vh` or `100lvh` for a full-screen box: they can be taller than the
screen in a home-screen app. `AppFrame` measures instead.

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

**Touch fields are 16px.** iOS zooms the whole page into a focused field under 16px and does not
zoom back out. Every system field is 16px on a coarse pointer and 15px (`type-ui`) with a mouse.
A custom field needs the same: build it on `fieldBoxVariants`.

## 6. Regenerate or add components

Primitives are owned source in `packages/ui/src/components/ui`. To add one, run the
shadcn-material transform (`pnpm regen`, in `tools/shadcn-material`) against a `shadcn-ui/ui`
checkout (see the README → Regenerating components). An app that needs a primitive of its own,
with `@/…` aliases, runs the same tool with `--alias-mode app`. Do not fork a primitive into your app under the same name;
`dsa` reports local look-alikes of system names as violations.

## 7. Moving off the submodule (history)

Kept for the record: no app uses the submodule today. Vale, when it was called Mailbird,
consumed unicron as a git submodule at `vendor/unicron` with `workspace:*` links during week one.
The versioned packages replaced it; nothing in `src/` changed.

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
   support window (current and previous minor). A `major` arrives with a codemod and a migration
   guide; follow the guide.

Synapse, Lockdown and Warpcore never had the submodule.

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
starts under it; a full-height sheet stops short of it. Set it to the strip's height, under the
same condition the strip renders under, in your app-extension layer:

```css
/* The app sets a class or attribute on <html> while its own row is the title bar. */
html[data-own-title-bar] { --c-dialog-titlebar-inset: 3.25rem; } /* h-13 */
```

A dialog taller than the area below the inset still overflows it, as it overflows the viewport
today; give such a dialog a scrolling body.

