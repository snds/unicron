---
"@unicron/ui": minor
"@unicron/tokens": minor
---

`CodeDisplay` (spec `docs/specs/security/code-display.md`): a one-time code grouped for reading (6 as 3+3, 8 as 4+4, Steam 5 as one group), a ring for the time left, the `warning` state at 5 s, the next code shown at 10 s, copy with the shared clipboard countdown that takes the next code in the last 3 s, HOTP with "Next code" and no ring, a clock-skew notice, a host `onHaptic` hook, and a digit-by-digit accessible label. `CodeDisplayList` shares one live region across a list. Tokens: the `code.*` knobs (`--c-code-size-*`, `--c-code-ring-*`, `--c-code-expiring-at`, `--c-code-next-at`, `--c-code-copy-next-at`, `--c-code-rollover-duration`, …). Also importable as `@unicron/ui/security/code-display`.
