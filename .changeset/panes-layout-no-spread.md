---
"@unicron/ui": patch
---

Docs: pass `useResizablePanesLayout`'s `defaultLayout` and `onLayoutChanged` by name. Spreading them onto `ResizablePanes` counts against a consumer's `dsa` ratchet.
