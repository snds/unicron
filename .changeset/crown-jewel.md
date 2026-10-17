---
"@unicron/ui": minor
"@unicron/tokens": minor
---

CrownJewel treatment (spec `docs/specs/security/crown-jewel-treatment.md`): `CrownJewelMark` (inline lock plus sr-only "Crown jewel"), `CrownJewelSurface` (an inverted `protected` frame that re-maps `--background`, `--foreground`, `--card`, `--muted`, `--border`, … for its subtree, so nested primitives invert with no overrides; refuses to render unless `host` is `app`, `os` or `extension-top-layer`; flips nested SecretField, CodeDisplay and LargeTypeView into gated mode through the exported `useCrownJewel()` context `{ gated, requestProof }`), and `CrownJewelGate` (the "Confirm it's you" dialog at the `biometric` or `password` level, with the arming delay, host-driven `attemptsLeft`, `error` and `busy`). Tokens: the `crown-jewel.*` knobs (`--c-crown-jewel-surface`, `-ink`, `-muted`, `-muted-ink`, `-border`, `-icon-fill`, `-icon-wght`, `-reveal-lifetime`, `-gate-attempts`). Also importable as `@unicron/ui/security/crown-jewel`.
