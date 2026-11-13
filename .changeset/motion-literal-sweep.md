---
"@unicron/ui": patch
---

Every transition and animation in `@unicron/ui` now runs on a motion role; the token lint refuses motion literals from here on. Visible changes are small: Popover opens in 120ms instead of 100ms, and Tooltip in 120ms instead of 150ms, both on the system curve instead of plain `ease`; the sheet overlay fades in 120ms instead of 150ms, and sheets slide on the system curves; StatusOrb's "needs you" ping uses the enter curve. Badge, Switch, Tabs and Toggle animate colour, border and shadow only (they used `transition-all`). Countdown rings step on `--motion-tick`, and Icon's axis transition reads `--motion-base` and `--motion-ease`. `useReducedMotion` and `useMediaQuery` moved to `lib/motion`; the old import path still works.
