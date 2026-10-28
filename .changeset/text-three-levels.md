---
"@unicron/tokens": minor
"@unicron/ui": minor
---

Three text levels instead of two, so lower-emphasis text reads as more than one level.

- `--support-foreground` (new) is Emphasis Engine's text level 4, for the lines that explain:
  `neutral.650` (new) in light, `neutral.150` (new) in dark. `type-support` and the dialog, sheet,
  field, item and empty-state descriptions use it.
- `--muted-foreground` stays level 3, for the lines that label: meta, captions, overlines,
  placeholders, inactive tabs, keys.
- `type-overline` is weight 500 (was 600): at 600 the smallest label drew as strong as the level above.
- Icons inside secondary text take weight 300 (`--c-icon-wght`), so they draw at the text's level.
- `contrast.mjs` gates each adjacent pair of levels at least Lc 10 apart, coded.

Measured in WebKit on Synapse, the three levels draw about 99, 83 and 70 in light and 99, 85 and
73 in dark: at least 12 apart, where seven lower roles used to share one level.
