---
"@unicron/ui": minor
---

Toasts and numbers. A toast now leaves on `--motion-fast` and the exit curve, and arrives on `--motion-base` and the enter curve, in every one of sonner's states (sonner's own 500ms exit for a toast behind the front one no longer wins). New `RollingNumber`: a number whose changed characters roll to their new value, up when it grew and down when it shrank, on `--motion-state` (`motion-roll-in`, `motion-roll-out`); still under reduced motion. New contracts: toast, rolling-number.
