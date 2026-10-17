# @unicron/ui

## 0.3.0

### Minor Changes

- 8f6617a: New, all additive (existing defaults unchanged), from Mailbird's raw-button sweep (Mailbird ADR-0057):
  
  - `Item` rendered as a button (`render={<button />}`) gets the hover a link already had, plus `data-selected="true"` and `disabled` states. Rows that were plain `<button>`s can move to `Item` without overrides.
  - `Button size="inline"`: a text action inside a sentence, with no box of its own. Pair it with `variant="link"`.
  - `Chip`, `ChipAction`, `ChipRemove`: a pill for a tag, label, or linked thing, with an optional main action and a × that says what it removes.

## 0.2.0

### Minor Changes

- 9916b79: New, all additive (existing defaults unchanged), from Mailbird's first dsa pass:
  
  - `IconButton`: an icon-only control whose `label` is both its accessible name and its tooltip; `tooltip`, `shortcut` (as `Kbd`), and `render` (a `Toggle`, or nest it in a menu trigger).
  - `DialogActions` + `DialogAction kind="confirm" | "cancel" | "destructive"`: one row of actions. On phones it's a row of round 40px icon buttons (✓, ×, and a tinted trash can on the far left), and the corner close hides when the row has a Cancel. From `sm` up it's text buttons.
  - `Button shape="pill"` (text pills get `px-3`), plus `variant="ghost-muted"` and `"ghost-destructive"`.
  - `Icon tone="muted" | "destructive"`.
  - `SheetContent fullscreen`, for full-screen phone editors.
  - `DialogTitle` lays a leading Back button out inline.

## 0.1.0

### Minor Changes

- 4d46001: First versioned release (0.1.0) of both packages, replacing the git submodule consumers used
  during week one.
  
  - `@unicron/tokens`: ships `dist/tokens.css` + `dist/tokens.json`, the DTCG sources and
    `examples/app-extension.css`. Token lint now enforces that tiers 2 and 3 alias lower tiers: the
    dark `border` / `input` values (`oklch(1 0 0 / 10%)`, `oklch(1 0 0 / 15%)`) moved into two new
    global tokens, `--g-white-alpha-10` / `--g-white-alpha-15`, and `sheet.handle` references
    `{muted-foreground}` instead of a raw `var()`. Emitted CSS values are unchanged.
  - `@unicron/ui`: publishable build (`dist/` only, with `.d.ts`). `@unicron/ui/styles` now
    resolves to `dist/styles/index.css`; per-component subpaths (`@unicron/ui/button`,
    `@unicron/ui/icon`) are exported alongside the root.

### Patch Changes

- Updated dependencies [4d46001]
  - @unicron/tokens@0.1.0
