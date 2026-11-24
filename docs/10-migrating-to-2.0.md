# 10 · Migrating an app to 2.0

2.0 brings the code up to the published Unicron library (Figma "Unicron — Theme Studies v0.2",
published 2026-11-24): the calm look shared by Warpcore, Synapse, Vale, Lockdown and Fontface.
This first 2.0 release is the **foundations**: tokens, type and the theme model. The parts that
draw with them are restyled in the next releases, one area at a time.

**The short version**

1. Bump both packages to 2.0.0.
2. Cut your theme down to the 10 accent slots (below): `npx unicron-codemod theme <dir>` deletes
   the 18 neutral slots and lists any line that still reads one.
3. Stop reading the legacy ramps (`--g-neutral-*`, `--g-blue-*`, `--g-coral-*`, `--g-green-*`,
   `--g-amber-*`, `--g-red-*`, `--g-white-alpha-*`). They are gone. Read a role.
4. Rerun your contrast tool and regenerate your exceptions file
   (`unicron-contrast <theme> --print-exceptions`), then justify each line.
5. Look at your screens: corners are rounder, type is smaller, and menus can float.

---

## A theme is the accent only

Sean's rule (2026-11-23): every app looks the same, and only the accent differs. So the theme
axis shrinks from 28 slots to 10: `primary-fill`, `primary-on-fill`, `primary-text`,
`primary-soft` and `primary-display`, per ground. `primary-soft` is now a wash with its alpha
(eight hex digits, the fill at 18% on graphite and 10% on stone), as Figma holds it.

Everything else is shared and lives in the core (`global.json` → `base`, `label`, `viz`):

| Role | Graphite | Stone | For |
|---|---|---|---|
| `surface-sunken` | `#0F1012` | `#F6F6F7` | window edge, the left sidebar |
| `surface-ground` | `#16171A` | `#FFFFFF` | the page, the chat |
| `surface-raised` | `#1C1D20` | `#FFFFFF` | cards, the right panel, the composer |
| `surface-popover` | `#232428` | `#FFFFFF` | solid menus and dialogs |
| `surface-popover-frost` | popover at 72% | popover at 72% | frosted menus and floating bars |
| `surface-hover` / `-selected` | ink at 5% / 8% | ink at 5% / 8% | hover; selected and pressed |
| `line-rule` / `-strong` / `-field` | ink at 8% / 14% / 14% | the same | hairlines, inputs |
| `text-body` / `-secondary` / `-label` / `-faint` | `#ECEDEF` `#D3D4D7` `#B9BABE` `#5E6066` | `#1A1B1E` `#4F5157` `#6A6C72` `#9A9CA1` | inks |

New roles: `status-done`, `status-working`, `status-failed`, `status-idle` (and
`status-needs-you`, the amber), `info-fill` / `info-on-fill` (counts and unread dots, the deep
blue), `severity-concerning-*` and `severity-urgent-*` (Count Badge), twelve `label-*` hues,
the `viz-*` chart colours, `secondary-soft` and `qr-*`.

Changed meanings: `secondary-live` is the shared Working blue in every app. `needs-you-fill` is
amber (`#F0B429`). `ring` is the accent (2px, offset 2px). `sidebar` is `surface-sunken`.
`sidebar-accent`, `state-pressed` read `surface-selected`; `accent`, `state-hover` read
`surface-hover`; `popover` reads `surface-popover`. `warning`, `info`, `success` and `running`
read the new status and severity roles.

## Shape, type and elevation

- **Radius scale.** `rounded-xs` 4, bare `rounded` and `rounded-sm` 6 (controls), `rounded-md`
  8 (menus, rows), `rounded-lg` 12 (cards, dialogs), `rounded-xl` 16 (the composer),
  `rounded-full` round (pills, chips, dots, avatars). Roles: `--radius-xs`, `--radius-control`,
  `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-round`. In 1.1 every step drew 2px.
- **Sizes.** `--size-control-s` 28, `--size-control-m` 32, `--size-control-l` 44, `--size-icon`
  20, plus `--size-check`, `--size-index`, `--size-track`. Tailwind: `h-control-s`, `size-icon`.
- **Type.** One sans for every interface role; mono only for code. `title` is 20/28, `body` and
  `response` 15/24, `ui` 13/20, `meta` and `caption` 12/16, `overline` 11/16 caps in the sans.
  New roles: `control` and `control-strong` (14/20), `crumb` (15/20), `large-title` (28/34, the
  phone), `tab-label` and `tab-label-selected` (10/12), `code-reveal` (mono 15/24). The eight
  styles Figma retired (`display`, `display-compact`, `code-display`, `number-hero`,
  `number-metric`, `number-index`, `brand-wordmark`, `icon-glyph`) stay for parts not yet
  restyled and leave in 2.1.
- **Elevation.** `shadow-popover` and `shadow-dialog` (Tailwind `shadow-popover`,
  `shadow-dialog`), and `--blur-frost` (24px) under a frosted surface. Only things that float
  take them; panels and cards keep a hairline.

## Contrast

The first published 2.0 neutrals were solved to WCAG 2 (4.5:1). On graphite, `text-secondary` and
`text-label` missed this gate's APCA floors. Sean chose to lighten them (2026-11-24):
`text-secondary` `#B3B5BA` → `#D3D4D7` (Lc 75 on every everyday surface) and `text-label`
`#8A8C92` → `#B9BABE` (Lc 60). Code has the new values now and Figma follows; until it does,
`figma-parity.mjs` reports the two as ahead of Figma (`AHEAD_OF_FIGMA`), not as failures.

The status, count and severity colours still sit under some APCA floors. They are named in the
core's list with that reason; an app's own list holds only misses of its accent.
