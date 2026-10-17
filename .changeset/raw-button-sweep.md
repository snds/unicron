---
"@unicron/ui": minor
---

New, all additive (existing defaults unchanged), from Mailbird's raw-button sweep (Mailbird ADR-0057):

- `Item` rendered as a button (`render={<button />}`) gets the hover a link already had, plus `data-selected="true"` and `disabled` states. Rows that were plain `<button>`s can move to `Item` without overrides.
- `Button size="inline"`: a text action inside a sentence, with no box of its own. Pair it with `variant="link"`.
- `Chip`, `ChipAction`, `ChipRemove`: a pill for a tag, label, or linked thing, with an optional main action and a × that says what it removes.
