---
"@unicron/ui": minor
---

CalendarEvent leaves the core, the icon set loses its 47 extras, and the web build watch moves into Unicron (decided 2026-11; guide: docs/08-migrating-to-1.1.md).

Removed (an app that used them follows docs/08-migrating-to-1.1.md):

- `CalendarEvent` and `calendarEventVariants` (Unicron 2). Only Vale has a calendar, and the name carries a domain noun. Vale builds it in its own layer from core parts, and gives a selected event the 2px edge of a selected row (Unicron 89).
- 47 icons from the curated set, which is now 265 (Unicron 98). The set is one object a bundler cannot trim, so every icon cost every app. Register any you need with `registerIcons()`; the guide lists them and shows how.

New API:

- The web build watch (Updates 5): `startBuildWatch({ storagePrefix, canReloadNow, mayReload, save })`, its rules as `createBuildWatch(env)` with no DOM, `readBuild`, `quietByTheClock`, `pageBuild`, `buildWatchReloadedKey`, the timing constants, and the hook `useBuildWatch(watch)`. One copy of the check Warpcore, Vale and Lockdown's web vault each carried. It reloads by itself only in a quiet moment (the wheel counts as use), when the app's `canReloadNow()` and its own rule allow, once per build; a page whose next file is gone reloads as soon as nothing would be lost. The apps keep their copies until each swaps.

Icon map (`unicron-codemod icons`, `iconFromMaterial`):

- `timer` and `snooze` map to Carbon's own `timer` and `snooze`, not `time` (Unicron 96).
- `left_panel_open` and `left_panel_close` map to Figma's `open-panel--left` and `open-panel--filled--left`, one family with the right side (Unicron 99).
- New `_aliases`: `key` → `password`, `link--off` → `unlink`, names a spec wrote that Carbon spells another way; the codemod rewrites them (Unicron 100).

Notes:

- The lean stylesheet entry (`@unicron/ui/styles/lean.css` and `unicron-sources`) is the way to a smaller CSS bundle; Warpcore moves to it (Unicron 103).
- Docs: a label length guideline for fields (short mono caps overline; long wording in the helper line; Unicron 42); a mirrored Carbon glyph as a registered icon (Vale's forward; Unicron 95).
