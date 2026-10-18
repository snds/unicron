---
"@unicron/ui": minor
---

`CommandItemAction` is no longer a button inside the option. A `role="option"` has presentational children, and a focusable button inside one fails axe's `nested-interactive` (found by Synapse's accessibility run; Lockdown's palette uses the same part). The action is now drawn like an icon button but takes no focus and stays hidden from assistive tech, as before; a pointer clicks it, ⌘↵ / Ctrl+Enter runs it, and the item's description announces it. Hovering shows its label and keys as a native tooltip instead of the `Tooltip` popup. `CommandDialog` also takes `size` (`DialogContent`'s sizes, `sm` by default as before), so a palette with two-line results can be `lg` without a class override.
