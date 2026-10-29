---
"@unicron/tokens": minor
"@unicron/ui": minor
---

Menus sized apart from their trigger, wider dialogs, a prop for closing on an outside click, and sticky footers. From Synapse's app review (2026-10-28).

- **Menu width.** `DropdownMenuContent width`: `"trigger"` (the default, as before: exactly the
  trigger's width), `"fit"` (as wide as its items, at least the trigger), or `"auto"` (as wide as
  its items, whatever the trigger). `fit` and `auto` stop at `--c-menu-max-width` (20rem, new) and
  wrap long labels past it; every list is at least `--c-menu-min-width` (8rem, new).
  `DropdownMenuSubContent` defaults to `"auto"`, so a submenu's floor moves from 6rem to 8rem.
- **Dialog widths are ranges.** Each `DialogContent size` now fits its content between a min and a
  max width (`--c-dialog-<size>-min-width` / `-max-width`, new). Each min is the old fixed width,
  so no dialog gets narrower; one with long lines or wide content gets wider, up to `sm` 28rem,
  `md` 36rem, `lg` 42rem, `xl` 56rem, `2xl` 64rem. Check dialogs that relied on a fixed width.
  New size `xs` (16–20rem), allowed only under the rule in docs/03-components.md (Dialog widths).
  `CommandDialog` keeps a fixed width, its size's min. The popup carries `data-size`.
- **`closeOnOutsideClick`** on `Dialog`, `Sheet` and `CommandDialog`: on by default, as before.
  Pass `false` for unsaved work, a destructive step, or a detail sheet beside a list. Escape and
  the close button still close. Base UI's `disablePointerDismissal` still works and wins.
- **`sticky`** on `DialogFooter`, `DialogActions` and `SheetFooter`: pins the footer to the bottom
  of what scrolls around it and makes it opaque. Off by default.
