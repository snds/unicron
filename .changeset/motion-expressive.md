---
"@unicron/ui": minor
---

An opt-in expressive motion stylesheet: `@unicron/ui/styles/motion-expressive.css`, active only inside `data-motion="expressive"`. There a pressed control scales instead of moving 1px (no bounce: it is met too often), a dialog arrives from 0.96 on the emphasis curve, and `motion-burst` pops in a success mark with a fading ring. It stands down under reduced motion and in `data-motion="reduced"` or `"off"` boxes. The token lint allows `--g-spring-pop` in that file only. New contracts: expressive-press, burst.
