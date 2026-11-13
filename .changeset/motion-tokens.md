---
"@unicron/tokens": minor
---

Motion tokens widen from two durations and one curve to a full set. New roles: `--motion-press` (100ms), `--motion-state` (280ms), `--motion-move` (400ms, the ceiling), `--motion-tick` (1s, countdown rings); curves `--motion-ease-enter`, `-exit`, `-move`, `-emphasis`, `-pulse`; springs `--motion-spring-settle` and `--motion-spring-firm`, each a CSS `linear()` curve with a `-duration` role; `--motion-stagger`, `--motion-stagger-max`, `--motion-press-depth`, `--motion-press-depth-small`. Tailwind gains `ease-enter`, `ease-exit`, `ease-move`, `ease-emphasis`, `ease-spring-settle` and `ease-spring-firm`. A new `$type: "spring"` (stiffness, damping, mass) is built to `linear()`; the raw numbers are in `tokens.json`, and `@unicron/tokens/spring` exports the solver for JS. `--c-code-rollover-duration` now aliases `--motion-base` (still 200ms). Nothing existing changes value; no component uses the new roles yet.
