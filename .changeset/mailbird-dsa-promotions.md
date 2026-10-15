---
"@unicron/ui": minor
---

New, all additive (existing defaults unchanged), from Mailbird's first dsa pass:

- `IconButton`: an icon-only control whose `label` is both its accessible name and its tooltip; `tooltip`, `shortcut` (as `Kbd`), and `render` (a `Toggle`, or nest it in a menu trigger).
- `DialogActions` + `DialogAction kind="confirm" | "cancel" | "destructive"`: one row of actions. On phones it's a row of round 40px icon buttons (✓, ×, and a tinted trash can on the far left), and the corner close hides when the row has a Cancel. From `sm` up it's text buttons.
- `Button shape="pill"` (text pills get `px-3`), plus `variant="ghost-muted"` and `"ghost-destructive"`.
- `Icon tone="muted" | "destructive"`.
- `SheetContent fullscreen`, for full-screen phone editors.
- `DialogTitle` lays a leading Back button out inline.
