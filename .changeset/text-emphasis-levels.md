---
"@unicron/tokens": minor
"@unicron/ui": minor
---

Secondary text sits a level below primary text, as Emphasis Engine places it, and still reads APCA
Bronze everywhere.

- `--muted-foreground` is Emphasis Engine's text level 3: `neutral.550` (new) in light, `neutral.250`
  (new) in dark. It reads Lc 81 on white and Lc 80 on the dark page, where before it read Lc 87 and
  88, almost as strong as primary text.
- `--muted-foreground-on-fill` (new): secondary text on a fill, a shade stronger in light
  (`neutral.600`) so it reads Lc 77 on `bg-muted`. `@unicron/ui`'s styles re-point
  `--muted-foreground` at it inside a fill (`bg-muted`, `bg-accent`, `bg-secondary`,
  `bg-sidebar-accent`, highlighted and selected items, keys), so nothing else changes.
- `contrast.mjs` gates the gap between the levels: primary and secondary text at least Lc 20 apart
  on each surface they share (now 24.7 in light, 25.5 in dark). The old values fail it (18.9).
