# 08 · Migrating an app to 1.1

1.1 settles the 126 questions of the 1.0 build (decided 2026-11-16). Most of it is new API and
fixes an app gets by bumping. A few things leave the core or change a default; this page is what an
app does about each, in the order to do it.

**The short version**

1. Bump both packages to 1.1.0.
2. Declare your app's theme in your own layer: the four app themes left the core.
3. If you are Vale: build `CalendarEvent` in your own layer.
4. Register any icon you used from the 47 extras that left the set.
5. Read the changed defaults below (counts, toasts on a phone, the chrome, a critical strip).
6. Swap your own build watch for the shared one when you are ready.

**On the version.** Removing the four themes, `CalendarEvent`, 47 icons and `Accessory`'s critical
tone breaks an app that used them, which SemVer calls a major. Sean called this release 1.1, so it
ships as 1.1.0 with this guide, and deprecates instead of removing wherever it can (`Accessory
tone="critical"` still draws; the legacy ramps keep their names until 2.0). If strict SemVer is
wanted, the same release is 2.0.0 with nothing else changed.

---

## Themes leave the core

`tokens/themes/` is gone, and with it the `[data-theme="warpcore|vale|lockdown|synapse"]` blocks.
With no theme of your own, `data-theme="<app>"` shows Unicron's default theme.

1. Copy your app's 28 slots into your own layer under `[data-theme="<app>"]`. The playground keeps
   each app's copy, with its Figma ids, in `apps/playground/src/app-themes/<app>.json` and `.css`.
2. Add `unicron-contrast src/app-extension.css --exceptions src/contrast-exceptions.json` to your
   checks, so your theme is measured on both grounds as the core's was.
3. A page that relied on the default being Warpcore's colours sets `data-theme="warpcore"` and
   declares Warpcore's theme.

[05 · Consuming → Declare your app's theme](05-consuming.md) has the details. In a development
build `AppFrame` warns once when no `data-theme` is set.

## CalendarEvent moves to Vale

`CalendarEvent`, `calendarEventVariants` and their knobs (`--c-calendar-event-*`) are gone from the
core. It carries a domain noun, and only Vale has a calendar. **Build it in your app from core
parts.** Everything it drew is a core role or part:

- A button or link (`useRender` from Base UI, as the core does, or a plain `<button>`), full width,
  `bg-surface-raised` (`bg-primary-soft` for the next event), with the hover and press washes laid
  over the fill: `after:absolute after:inset-0 hover:after:bg-state-hover active:after:bg-state-pressed`.
- The 2px bar on the left, inside the top and bottom padding: `bg-line-rule`, `bg-primary-fill`
  for the next event, or the calendar's colour with `swatchFillClasses[swatch]` (from Tile).
- The time in `type-meta text-muted-foreground`, the title in `type-ui-emphasis`, the place in
  `type-caption text-support-foreground`. Compact (a week strip, a month cell): one line, title
  first, 24 tall, with `hit-area` so a touch target is 44.
- Name it by its text in reading order ("16:30 – 17:15 Dentist Sierra Dental, Roseville").

**A selected event needs its own look** (Unicron 89). In 1.0 a selected event looked exactly like
the next one, so people could not tell what they picked. Give the selected event the 2px edge of a
selected row, as `ListRow selected` draws it (`edge-l` on `--primary-mark`, the full height), and
`aria-current="true"`. The next event keeps its soft fill and bar.

The 1.0 source is in the 1.0.0 tag (`packages/ui/src/components/ui/calendar-event.tsx`) if you want
a starting point; copy it into your layer and add the selected edge.

## Icons

The curated set is 265 icons. It was 312. The data is one object a bundler cannot trim, so every
icon cost every app.

**47 extras left the set** (Unicron 98):

`arrow--up-right`, `badge`, `bookmark`, `bookmark--filled`, `box`, `caret--left`, `caret--right`,
`caret--sort`, `category`, `chart--network`, `circle-dash`, `currency`, `data-backup`, `dot-mark`,
`drag--horizontal`, `drag--vertical`, `draggable`, `error--filled`, `export`, `favorite--filled`,
`flag--filled`, `in-progress`, `incomplete`, `information--filled`, `information--square`, `menu`,
`microphone`, `microphone--off`, `minimize`, `misuse`, `notification--new`, `pause--filled`,
`play--filled--alt`, `pull-request`, `purchase`, `reply--all`, `star--filled`, `stop`,
`task--approved`, `thumbs-down`, `thumbs-up`, `volume--mute`, `volume--up`,
`warning--alt--filled`, `warning--diamond`, `zoom--in`, `zoom--out`.

`tsc` names every use (`Type '"star--filled"' is not assignable to type 'IconName'`). For each,
pick a name in the set, or register Carbon's drawing in your app:

```ts
import starFilled from "@carbon/icons/svg/32/star--filled.svg?raw" // Vite; any loader that gives the text
import { registerIcons } from "@unicron/ui"

registerIcons({ "star--filled": starFilled.replace(/^<svg[^>]*>|<\/svg>\s*$/g, "") })

declare module "@unicron/ui" {
  interface UnicronIconRegistry { "star--filled": true }
}
```

Seen in the apps on 2026-11-16: `star--filled` (Vale, Lockdown), `zoom--in` and `zoom--out` (Vale),
`chart--network` (Vale), `currency` (Warpcore), `category` and `data-backup` (Lockdown). Five of
the 52 extras stayed, because the core or the map needs them: `caret--up`, `caret--down`,
`recently-viewed`, `timer`, `snooze`.

**The map changed in four places.** It only matters if you run `unicron-codemod icons` again on
code that still has Material names, or translate stored names with `iconFromMaterial()`:

- `timer` → `timer` (Carbon's stopwatch) and `snooze` → `snooze` (its alarm clock with a z), no
  longer `time` (Unicron 96). Lockdown's Codes and Expiring no longer both show a clock.
- `left_panel_open` → `open-panel--left`, `left_panel_close` → `open-panel--filled--left`: Figma's
  `open-panel` family on both sides (Unicron 99). `side-panel--open` and `side-panel--close` stay in
  the set (the core's sidebar control draws them).
- `key` → `password` and `link--off` → `unlink`: names a spec wrote that Carbon spells another
  way (Unicron 100). The codemod rewrites them.

**Vale's forward** (Unicron 95) stays out of the core: register Carbon's `reply`, mirrored. The
example is in [03 · Components → Icons](03-components.md#icons).

## Counts read three digits

`formatCount` pads to three digits, as every Figma sidebar draws them: `012`, `003`, `248`, then a
comma from 1,000 (Unicron 13). A mark on an icon still stops at `99+` (`cap`). Everything that
shows a count through the core (nav items, the rail, list rows, filter chips, tabs, indicators,
the status strip) changes with it. Sentences keep plain numbers ("3 new senders"); format those
yourself (Vale 6). If a test of yours pins a count, it now reads `012`.

## Changed defaults

- **The phone's chrome comes back on any scroll up**, as Safari's bar does, not only at the top
  (Unicron 68).
- **Toasts on a phone** stack 8 above a strip that shows (needs-you, offline, a sync), and never
  sit under the top row (Synapse 10).
- **`Accessory tone="critical"` is deprecated**, and goes in 2.0: a status strip is never critical.
  Show something broken that the person can fix as a critical `Banner` at the top of its section.
  It still draws, with a development warning.
- **A critical `Banner` cannot be dismissed**, even with `onDismiss`.
- **`plain.css` follows the browser** with no class on the root. Add `class="stone"` to keep stone.
- **No `data-theme` is no longer Warpcore**: see [Themes leave the core](#themes-leave-the-core).

Each package's `CHANGELOG.md` lists every new prop and changed behaviour of 1.1.

## The build watch

Warpcore, Vale and Lockdown's web vault each carry a copy of the "new version ready" check. 1.1 has
one shared copy (Updates 5): `startBuildWatch` and `useBuildWatch` from `@unicron/ui`, with no app
logic in it. [03 · Components → Updates](03-components.md#updates) shows the call. To swap:

1. Start it once from `main.tsx` with your storage key prefix (`warpcore`, `vale`, `lockdown`), your
   `canReloadNow()`, and your reload rule as `mayReload` (Lockdown: nobody is signed in; Warpcore:
   updating by itself is on). Vale passes its draft saver as `save`.
2. Keep your `<meta name="<prefix>-build">` and `build.json` as they are; the key it notes the
   reloaded build under is `<prefix>.build.reloadedFor`, which is Vale's and Lockdown's today.
   Warpcore's was `warpcore.reloadedFor`: a tab mid-update reloads once more, at most.
3. Point the screen that shows the sign at `useBuildWatch(watch)`, and the Reload action at
   `watch.reloadNow()`.
4. Delete your copy and its tests (the shared tests carry all three apps' cases).

Two behaviours are now the same in every app: the mouse wheel counts as use, and a page whose
next file is gone (`needed`) reloads as soon as nothing would be lost, without waiting for a quiet
moment. Vale and Lockdown waited for one before.

## Checked by hand

Three things rest on reading the code alone, because no browser check can reach them. Sean runs
VoiceOver on an iPhone and NVDA on Windows over each before this release is called done (Unicron
107):

1. **The scroll edge's mask** under the phone chrome: content fading under the bars is never read
   out twice, and focus never lands behind the chrome.
2. **Pull to refresh on iOS**, which has no `pan-down`: the page reads the bounce instead. The
   plain "Check again" action is announced, and the gesture is never the only way.
3. **The diff box taking focus in WebKit**: Tab reaches a long diff, the arrow keys scroll it, and
   the screen reader names it.

The playground's browser checks can now run in WebKit and Firefox as well as Chromium
(`PW_PROJECT=webkit`); CI turns them on once the differences their first run found are fixed.
