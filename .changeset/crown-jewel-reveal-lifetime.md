---
"@unicron/ui": patch
---

`SecretField` inside a `CrownJewelSurface` now reads `--c-crown-jewel-reveal-lifetime` (20 s) for its reveal lifetime instead of its own `--c-secret-field-reveal-lifetime` (30 s). An explicit `revealLifetime` prop still wins. Closes the open item in `docs/specs/security/crown-jewel-treatment.md`.
