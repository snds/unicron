---
"@unicron/tokens": minor
"@unicron/ui": minor
---

Add the `success`, `attention` and `running` status roles (fill, `-foreground`, `-surface`) and the `--motion-spin` and `--motion-pulse` roles. `@unicron/ui` adds a system-wide reduced-motion layer, runs `animate-spin` and `animate-pulse` on the motion roles, and gives `Spinner` a `label` (it now reaches screen readers; it was `aria-hidden`).
