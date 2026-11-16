---
"@unicron/ui": minor
---

The 1.1 lanes, joined up: parts that still drew 1.0 values now read the 1.1 roles.

- Critical edges and invalid borders read `--line-invalid`: `Banner tone="critical"`, `Accessory tone="critical"`, `FileChip` in error, `SecretField` in error and `Toggle` when invalid. On graphite that is the critical text colour, which holds 3:1; the critical fill measured under it (Unicron 17).
- Tab indicators (`TabsTrigger` line variant, `TopTab`) draw in `--primary-mark`, the colour for a mark with no words (Unicron 19).
- Hand-written washes follow the lighter states: hover 4% and pressed 6% of the ink on `Select`, `NativeSelect`, `Tile`, `CodeDisplay`, a neutral `SwipeRow` tile and a selected `Item` (they were 6% and 10%; Unicron 16).
- A pressed `Toggle` goes to 86% of the ink, as a current `FloatButton` and an on `FilterChip` do, so its label holds Lc 75 on graphite (it was 80%; Unicron 28).
- `PageHead size="md"` in a desktop frame: the overline touches the title, as Vale's desktop lists draw it. On a phone it stays 4 above (Unicron 77).
- The desktop sidebar's collapse and expand controls draw Figma's `open-panel--filled--left` and `open-panel--left` (Unicron 99).
