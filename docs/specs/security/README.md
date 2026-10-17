# Security component specs

_The six components Lockdown's brief §5.7 asks unicron to grow, written as the one-page specs that `06-contributing.md` → The loop → 3 requires. Status: proposed; nothing here is built. Core arbitrates each against the uniqueness rule, then each lands as its own code PR with a playground entry in light and dark._

| Spec | Job | Composes | Owns (why it is a component) |
|---|---|---|---|
| [ApprovalSheet](approval-sheet.md) | Approve or deny a request from another device, agent, TV, or contact, with number matching and "This wasn't me" | AdaptiveSheetContent, Item, InputGroup, DialogActions, RiskTierBadge | Origin gate, arming delay, timeout that denies, retry limit, the report action |
| [RiskTierBadge](risk-tier-badge.md) | Say in one word how much trust a path carries: `standard`, `official`, `tolerated` | Badge, Icon, IconButton → Tooltip | The closed vocabulary and its copy; word, icon, and color paired by construction; `unverified` state |
| [SecretField](secret-field.md) | Use a hidden value without exposing it longer than the job takes | Field, InputGroup, IconButton, Tooltip | One-shot value handle, reveal lifetime, hide on blur, copy with a conditional clipboard clear, gate hook |
| [CodeDisplay](code-display.md) | Read and type a one-time code before it dies | Item, IconButton, Badge, SecretField's copy behavior | Period maths, expiring cue, next code early, haptic, rollover announcement, digit-by-digit label |
| [LargeTypeView](large-type-view.md) | Read a secret across a room or type it into a TV | SheetContent fullscreen, IconButton, Switch | Character classes and captions, grouping in threes, fit-to-width, lifetime, brightness and wake, print layout |
| [CrownJewel treatment](crown-jewel-treatment.md) | Make the strictest class of secret unmistakable, and gate its use | section with a re-mapped tier, Icon, Badge, Dialog, SecretField | Context that flips children into gated mode, the `host` assertion, the inverted surface |

## Shared proposals

The specs ask for three tier 2 roles the core lacks. Each is generic (Mailbird and Synapse have uses), so they belong in `semantic.json`, not an app extension. Core may decline any of them; the fallback is noted per spec.

| Role | Light | Dark | First users |
|---|---|---|---|
| `warning` / `warning-foreground` | `{amber.500}` / `{neutral.950}` | `{amber.400}` / `{neutral.950}` | CodeDisplay expiring, ApprovalSheet timer, SecretField revealed tint, RiskTierBadge tolerated |
| `info` / `info-foreground` | `{blue.500}` / `{neutral.0}` | `{blue.400}` / `{neutral.950}` | RiskTierBadge official, LargeTypeView digits |
| `protected` / `protected-foreground` | `{neutral.950}` / `{neutral.25}` | `{neutral.25}` / `{neutral.950}` | CrownJewel surface |

Shared behaviors, defined once and reused: the copy-with-timer hook (SecretField, reused by CodeDisplay and LargeTypeView), the arming delay (ApprovalSheet, reused by CrownJewelGate), and the `host` rule (every one of the six renders only in the app, an OS surface, or the extension's top-layer frame, never in web content).

## Conventions every spec follows

- Sections in the PR template's order: purpose, uniqueness, anatomy, props, states, behavior and timing, tokens, keyboard and screen reader, platform notes, security notes, provenance, acceptance tests.
- Token names are unicron's: tier 2 roles unprefixed, tier 3 knobs as `--c-<component>-<part>-<property>` under a `<component>` key in `component.json`. No raw color values; literal sizes and durations only in tier 3.
- States always include loading, error, disabled (or why not), reduced motion, and high contrast.
- Codes and secrets are spoken per character, never as a number.
- Every spec carries `DSA record: none: first principles, Lockdown brief §5.7` and `changeset: minor`.

## Open points for core

1. The risk-tier vocabulary in `01-principles.md` (`low / elevated / crown-jewel`) and the plan set's (`standard / official / tolerated`) differ; the specs use the latter and the principles row should follow.
2. Whether RiskTierBadge is a component or a `Badge` variant with an exported copy map (the spec works either way).
3. Whether the CrownJewel parts keep that name or become `Protected*`.
4. Whether CodeDisplay should copy the next code in the last 3 s (differs from 1Password; flagged for Sean).
