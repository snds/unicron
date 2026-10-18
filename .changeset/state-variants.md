---
"@unicron/ui": patch
---

State styles match shadcn's: `styles/index.css` now defines shadcn's `data-open`, `data-closed`, `data-checked`, `data-unchecked`, `data-selected`, `data-disabled` and `data-active` variants, exactly as its own stylesheet does. Tailwind's built-in forms match an attribute with any value, and cmdk marks every item that isn't highlighted `data-selected="false"`, so every `CommandItem` drew highlighted at once. Now only the highlighted one does. The other variants still match Base UI's bare attributes and Radix's `data-state`, and also respect an explicit `"false"`.
