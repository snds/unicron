---
"@unicron/ui": minor
"@unicron/tokens": patch
---

Motion recipes. `@unicron/ui/styles` now carries seven named recipes built only from the motion roles: `motion-press` / `motion-press-sm`, `motion-pop`, `motion-slide` (+ `motion-slide-from-*`), `motion-collapse`, `motion-stagger`, `motion-draw` and `data-shake`, each with a reduced-motion form. New `@unicron/ui/motion` entry (also exported from the root): `useShake`, `rubberBand`, `withViewTransition`, `useReducedMotion`, and `motionContracts`, the recipes' contracts as data. New `CheckDraw` component, a check mark that draws itself. `data-motion="reduced"` on any element puts everything inside it on the reduced-motion path, and `data-motion="off"` removes motion. No existing component changes yet. Tokens: `--motion-stagger-max` drops from 6 to 4, so a whole staggered list lands within the 400ms ceiling.
