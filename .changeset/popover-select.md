---
"@unicron/tokens": minor
"@unicron/ui": minor
---

Adds `Popover` and `Select`.

- **`Popover`** is for content a tooltip can't hold: interactive, or longer than a few words. New token `--c-popover-width` (18rem).
- **`Select`** is a styled list for options that need more than plain text. `NativeSelect` stays the default for a form. Pass `items` so the trigger shows an option's label before the list has opened.
- `SelectContent` takes the same `width` as `DropdownMenuContent` (`trigger`, `fit`, `auto`), with `fit` as its default. Nothing changes for existing menus.
