---
"@unicron/tokens": minor
---

Secondary text sits a level below primary text, as Emphasis Engine places it.

- `--muted-foreground` is Emphasis Engine's text level 3: `neutral.550` (new) in light, `neutral.300`
  in dark. It reads Lc 81 on white and Lc 77 on the dark page, still Lc 75 or more on every page
  surface (APCA Bronze), where before it read Lc 87 and 88, almost as strong as primary text.
- Secondary text on a fill or a tint (a shortcut key, an inactive tab, a highlighted row) is held to
  Lc 60 as a label; holding it to Lc 75 there was what pushed the role up everywhere else.
- `contrast.mjs` gates the gap between the levels: primary and secondary text at least Lc 20 apart on
  each surface they share. The old values fail it (18.9 apart).
