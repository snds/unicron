---
"@unicron/tokens": minor
"@unicron/ui": minor
---

**App themes leave the core; Unicron ships its own default theme and a contrast tool for yours** (Unicron 1).

- `tokens/themes/` is gone, and with it the `[data-theme="warpcore|vale|lockdown|synapse"]` blocks in `tokens.css` and `plain.css` and `themes` / `defaultApp` in `tokens.json`. With no `data-theme` the 28 theme slots now hold Unicron's own default theme (neutral surfaces, a quiet slate identity, a teal live colour), which clears every contrast pair the gate measures. `tokens.json` lists the slot names as `themeSlots`.
- New bin `unicron-contrast <theme.json|theme.css|dir> [--exceptions file.json]`: lays an app's 28 slots over the built roles and knobs and measures every recipe on graphite and stone. Each app passes its own exceptions file; the core's list now holds only misses every theme shares (the critical and needs-you colours). `apca-w3` is now a dependency.
- `examples/app-extension.css` declares a whole app theme. `NOTICE` added (shadcn/ui MIT, snds/mailbird Apache-2.0).

**New roles** (not in Figma yet): `line-field` (a field's resting border, 3:1; `input` now points at it; Unicron 18), `line-focus` and `line-invalid` (focus and error borders: the fills on stone, the text colours on graphite, 3:1; Unicron 17), `primary-mark` (a mark with no words; Unicron 19), and the small-text inks `small-label`, `small-primary`, `small-critical`, `small-live` (Lc 75 and 4.5:1 on the ground, a raised surface and both washes; Synapse 1). New knobs: `--c-popover-width-wide` (420), `--c-progress-height-large` (8px), `--c-diff-added`. New type role `mono-row` (Geist Mono 13/20; Lockdown 4) and its `type-mono-row` utility.

**Changed values.** `state-hover` 6% → 4%, `state-pressed` 10% → 6% of the ink (Unicron 16); a solid's pressed state is modelled at 85% (Unicron 28); `running-surface` 14% → 6% (Unicron 27); `diff-added` on stone 8% → 3% (Unicron 28); stone `warning` `amber.550` → new `amber.575`, 4.7:1 as small text (Warpcore 2); `--c-progress-primary` and `--c-progress-critical` take the text colours on graphite (Unicron 19). `text-faint` is narrowed to disabled words and decoration (Unicron 25).

**`@unicron/ui`.** `type-number-tabular`, a modifier for a number that changes while you watch; `Metric` takes `live` to turn it on (Unicron 11). `rule-box-emphasis` defaults to `--line-focus` and the `edge-*` utilities to `--primary-mark`.

### Migrating

1. **Declare your app's theme.** Copy your 28 slots into your own layer under `[data-theme="<app>"]` (the playground's copies, with their Figma ids, are in `apps/playground/src/app-themes/<app>.json` and `.css`). Without it, `data-theme="<app>"` shows Unicron's default theme. Then add `unicron-contrast src/app-extension.css --exceptions src/contrast-exceptions.json` to your checks (`--print-exceptions` writes the first list). See docs/05-consuming.md → Declare your app's theme.
2. **No `data-theme` is no longer Warpcore.** A page that relied on the default being Warpcore's colours sets `data-theme="warpcore"` and declares Warpcore's theme.
3. **`plain.css` follows the browser by default** (Unicron 14). A root with no class used to be stone; now it follows `prefers-color-scheme`. Add `class="stone"` (or `light`) to keep stone; `class="graphite"` (or `dark`) forces graphite. `class="system"` still works.
4. **Point borders and marks at the new roles** (no class goes silent; these are the ones that measure right): a field's resting border `--input` / `line-field`; focus and error borders `line-focus` / `line-invalid` (not `primary-fill` / `critical-fill`); a selected edge, tab indicator or progress cell `primary-mark`; reading text in `text-faint` → `text-label`.
5. **Deprecated, removed in 2.0** (Unicron 7): `--g-neutral-*`, `--g-white-alpha-*` and the accent ramps `--g-blue-*`, `--g-coral-*`, `--g-green-*`, `--g-amber-*`, `--g-red-*`. They keep their names and values for all of 1.x. Alias a role (`surface-*`, `text-*`, `line-*`), a status role or a swatch instead; 2.0's migration guide lists each replacement, and the core's own status roles move to status-named tokens there.
