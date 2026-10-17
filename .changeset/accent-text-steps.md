---
"@unicron/tokens": minor
---

Accent hues get text steps: `blue`, `coral`, `green` and `amber` each add a `600` for text in light mode and a `300` for text in dark mode, held by `scripts/contrast.mjs` to Lc 75 (reading text) on the page, the chrome and a selected row (`neutral.0`, `.50`, `.100`; `.950`, `.900`, `.800`). Apps draw these hues as text (an area's name, a status word, a link), and `500` / `400`, which are fills, read only Lc 32-67 there. Point an app's text roles at `600` / `300`; keep fills and dots on `500` / `400`. Additive: no existing step changes.
