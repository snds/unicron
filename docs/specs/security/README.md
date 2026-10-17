# Security component specs

_The six components Lockdown's brief §5.7 asked unicron to grow, written as the one-page specs that `06-contributing.md` → The loop → 3 requires. Status: **built**. The specs were proposed in #10, the three tier 2 roles landed in #12 (`@unicron/tokens` 0.2.0), and the components shipped in `@unicron/ui` 0.4.0 through #15 (CodeDisplay, LargeTypeView, CrownJewel) and #16 (ApprovalSheet, RiskTierBadge, SecretField). Each spec is now v0.2 and describes what was built, so the SwiftUI and Compose builds that follow the same specs match the web build._

| Spec | Job | Composes | Owns (why it is a component) |
|---|---|---|---|
| [ApprovalSheet](approval-sheet.md) | Approve or deny a request from another device, agent, TV, or contact, with number matching and "This wasn't me" | AdaptiveSheetContent, Item, Input, DialogActions, RiskTierBadge | Origin gate, arming delay, timeout that denies, retry limit, the report action |
| [RiskTierBadge](risk-tier-badge.md) | Say in one word how much trust a path carries: `standard`, `official`, `tolerated` | badgeVariants, Icon, IconButton → Tooltip | The closed vocabulary and its copy; word, icon, and color paired by construction; `loading` and `unverified` states |
| [SecretField](secret-field.md) | Use a hidden value without exposing it longer than the job takes | Field, InputGroup, IconButton, Tooltip | One-shot value handle, reveal lifetime, hide on blur, copy with a conditional clipboard clear, gate hook |
| [CodeDisplay](code-display.md) | Read and type a one-time code before it dies | Item, IconButton, Badge, the shared copy countdown | Period maths, expiring cue, next code early, haptic, rollover announcement, digit-by-digit label |
| [LargeTypeView](large-type-view.md) | Read a secret across a room or type it into a TV | SheetContent fullscreen, IconButton, Switch | Character classes and captions, grouping in threes, fit-to-width, lifetime, brightness and wake hooks, print layout |
| [CrownJewel treatment](crown-jewel-treatment.md) | Make the strictest class of secret unmistakable, and gate its use | section with a re-mapped tier, Icon, Badge, Dialog | Context that flips children into gated mode, the `host` assertion, the inverted surface, the built-in gate |

## Spec vs built

| Component | Status | What the build decided |
|---|---|---|
| ApprovalSheet | Built as specified, plus | `matching.expected`; `open` / `onOpenChange`; `tier` defaults by kind; `device-code` refused for every origin but `scan`; report calls `onReport` only; inert-until-armed replaces the moved Approve |
| RiskTierBadge | Built as specified, plus | Tri-state `verified` (omitted = "Checking"); unknown tier → `unverified`; `explainDisabled`; the unverified announcement is the badge's own `role="status"` |
| SecretField | Built as specified, plus | `host` interface with `clipboardHolds(hash)`; `label`, `locked`, `description`, `children` as the `more` slot; knobs read from `:root` or the element at runtime. Since 0.6.0: `host.copyRef()` copies by reference (no bytes fetched for a copy; `SecretFieldReferenceHost` when there is no byte path), `errorText` for the host's own error words, and a gated reveal is always a toggle. Since 0.8.0: edit mode takes `multiline` (with `rows`) for a secret over several lines, `name`, `required` (with `aria-required`) and `onBlur`; `secretStrengthFromScore` maps a 0–4 guess score to the three strength words (the estimate stays in the core) |
| CodeDisplay | Built as specified, plus | `issuer`, `account`, `media`, `counter`, `onHaptic`, `onFixClock`, `onClipboardClear`, `loading`, `error`; `now` and `expiresAt` in Unix seconds; self-ticking when `now` is omitted; `CodeDisplayList`. Since 0.6.0: `onCopy`'s `value` may be ignored by a host that copies by id; a rejected `onCopy` starts no countdown; copy waits while an HOTP advance is pending |
| LargeTypeView | Built as specified, with two gaps | `open` / `onOpenChange`, `onCopy(bytes)`, wake and brightness hooks, `gate`, `onExpire`; the size step persists in `localStorage`. Gaps: no lock hook (the host closes it); `print` relies on the host printing in light mode |
| CrownJewel | Built as specified, with one open item | `useCrownJewel()` is `{ gated, requestProof(kind) }`; built-in gate with `onConfirm` / `onBiometric` / `onLock`, or a host `requestProof`; `appName`, `biometricName` (`null` since 0.6.0: no biometric on this device); `crownJewelGateErrors`; a core that judges the proof at call time uses a host `requestProof` and the standalone gate (the pattern is in the spec); `host="page"` logs and renders null. Open: the password step is `Input type="password"` until SecretField edit mode replaces it. `--c-crown-jewel-reveal-lifetime` is read by nested SecretFields since 0.4.1 |

## Shared behaviors

Defined once and reused: the clipboard countdown (`useCopyCountdown` in `components/security/copy-countdown.ts`, exported from the package root; SecretField, CodeDisplay, and LargeTypeView), the duration-knob reader (`readSecondsToken`, which falls back to the spec defaults when the stylesheet is absent, so a host that forgot the import still gets timers), the arming delay (`--c-approval-arm-delay`; ApprovalSheet and CrownJewelGate), the crown-jewel context (`useCrownJewel()`; read by SecretField, CodeDisplay, and LargeTypeView), and the `host` rule (every one of the six renders only in the app, an OS surface, or the extension's top-layer frame, never in web content).

Core copy names no product ("we", "the app", "device codes"); the host's localization hook is still to come.

## Tier 2 roles (shipped in `@unicron/tokens` 0.2.0)

| Role | Light | Dark | Users |
|---|---|---|---|
| `warning` / `warning-foreground` | `{amber.500}` / `{neutral.950}` | `{amber.400}` / `{neutral.950}` | CodeDisplay expiring, ApprovalSheet timer, SecretField revealed tint and fair strength, RiskTierBadge tolerated, LargeTypeView symbols |
| `info` / `info-foreground` | `{blue.500}` / `{neutral.0}` | `{blue.400}` / `{neutral.950}` | RiskTierBadge official, LargeTypeView digits |
| `protected` / `protected-foreground` | `{neutral.950}` / `{neutral.25}` | `{neutral.25}` / `{neutral.950}` | CrownJewel surface |

## Conventions every spec follows

- Sections in the PR template's order: purpose, uniqueness, anatomy, props, states, behavior and timing, tokens, keyboard and screen reader, platform notes, security notes, provenance, acceptance tests.
- Token names are unicron's: tier 2 roles unprefixed, tier 3 knobs as `--c-<component>-<part>-<property>` under a `<component>` key in `component.json`. No raw color values; literal sizes and durations only in tier 3.
- States always include loading, error, disabled (or why not), reduced motion, and high contrast.
- Codes and secrets are spoken per character, never as a number.
- Every spec carries `DSA record: none: first principles, Lockdown brief §5.7`.
- Imports: from the root of `@unicron/ui`, or the subpath `@unicron/ui/security/<name>` (`approval-sheet`, `risk-tier-badge`, `secret-field`, `code-display`, `large-type-view`, `crown-jewel`).

## Test harness

The acceptance tests are split per spec into **Vitest** (what exists) and **still needs a browser** (what does not). The Vitest harness in `packages/ui` runs on jsdom 29 under Node 22 (22.22 verified; CI pins 22) with Testing Library and jest-dom, the same shape as Lockdown's desktop app: 100 tests across six files. `src/test/setup.ts` stubs `ResizeObserver` and `matchMedia`, which jsdom lacks, and jsdom has no `IntersectionObserver`, no layout, and no computed colors. Anything about size, wrapping, color, screenshots, or a real clipboard is marked for Playwright.

## Open points for core

1. ~~The risk-tier vocabulary in `01-principles.md`~~ Done: the principles row now reads Built in / Verified / Use with care.
2. ~~RiskTierBadge as a component or a `Badge` variant~~ Done: a component on `badgeVariants` with the exported `riskTierCopy` map.
3. ~~`CrownJewel*` or `Protected*`~~ Done: the name stays.
4. CodeDisplay copies the next code in the last 3 s, as proposed. Differs from 1Password; still flagged for Sean.
5. New: swap `CrownJewelGate`'s password step for `SecretField mode="edit"`; ~~wire `--c-crown-jewel-reveal-lifetime` into nested SecretFields~~ (done in 0.4.1); a `motion-reduce:` rule on `AdaptiveSheetContent`'s travel; the host localization hook for core copy; a browser suite for the screenshot and viewport tests.
