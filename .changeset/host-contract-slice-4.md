---
"@unicron/ui": minor
"@unicron/tokens": minor
---

Desktop host-contract gaps, slice 4. All additive; existing props, sizes and defaults are unchanged.

- `SecretField` edit mode: `multiline` (with `rows`, default 4) is a textarea for a secret over several lines (a private key, a recovery phrase). It keeps line breaks, stays masked until Show (`-webkit-text-security`, or transparent ink where an engine lacks it), and blocks copy, cut and drag while masked. Edit mode also takes `name`, `required` (native, plus `aria-required`) and `onBlur`, so the browser's form check and form libraries see the field. A host drawing its own masked `Textarea` can switch to `<SecretField mode="edit" multiline … />`.
- `secretStrengthFromScore(score)` maps a zxcvbn-style 0–4 guess score to `weak` (0–2), `fair` (3) or `strong` (4). The field still never estimates: the estimate belongs in the host's core.
- `CommandItemAction` (`label`, `icon`, `onAction`, `disabled`) is a second action on a `CommandItem`. A click never selects the item; ⌘↵ (Ctrl+Enter off Apple platforms) runs the highlighted item's action through `Command`; the item is described by the action and its key and carries `aria-keyshortcuts`. A host that handles ⌘↵ itself (with `preventDefault`) keeps doing so.
- `Command match="keywords"` matches an item that has `keywords` on those alone, so an item keyed by an id is not found by the id's letters; the default (`match="value"`) is cmdk's filter, unchanged. `CommandItem`'s `value` and `keywords` are now documented.
- `Skeleton variant="row"`: one full-width list row, `--c-skeleton-row-height` tall (new token, 2.5rem). An app with a density setting re-maps that one knob.
- `DialogContent` `size`: the names are product sizes, not Tailwind's steps (`xl` is `max-w-2xl`); the mapping is documented and pinned by tests, not changed.
