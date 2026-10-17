# CodeDisplay

_Spec v0.1 · 2026-10-17 · Proposed by Lockdown (brief §5.7; `02-model.md` §4 Code type) · Status: proposed_

## Purpose and the user job

A person has seconds to read a one-time code and type it somewhere else. The component shows the code grouped for reading, how long it is still valid, a warning before it expires, the next code early so nobody types a code that dies mid-entry (as Aegis does), and a copy with a clipboard timer. It handles 6-digit and 8-digit TOTP, HOTP counters, and Steam's 5-character codes. Lockdown is the first consumer; the standalone authenticator view and the quick-access palette reuse it at other densities.

## Uniqueness check

Composes `Item` (list density), `IconButton`, `Badge`, `Tooltip`, and the copy-with-timer behavior exported by SecretField. It is a component rather than a SecretField variant because the job differs (a code is shown by default and expires on a clock; a secret is hidden by default and expires on a timer the person started), and because it owns period maths, the early next code, the expiring state, haptics, a rollover announcement, and a digit-by-digit accessible label.

## Anatomy

```
code-display                       data-density, data-variant
├─ code-display-issuer             Avatar or Icon + "GitHub · sean" (list and detail)
├─ code-display-code
│  ├─ code-display-group × n       font-mono, tabular, 3+3 · 4+4 · 5
│  └─ code-display-next            next code in muted ink, visible from --c-code-next-at
├─ code-display-timer              ring (TOTP) · counter + "Next code" Button (HOTP)
├─ code-display-copy               IconButton with the shared countdown
└─ code-display-notice             Badge warning: clock skew · issuer equals sync login
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `variant` | `totp` · `hotp` · `steam` | `steam`: 5 characters, one group, alphabet `23456789BCDFGHJKMNPQRTVWXY` |
| `digits` | `5` · `6` · `8` | Grouping: 6 → 3+3, 8 → 4+4, 5 → one group |
| `code`, `next` | strings | Both computed by the host's core; the component never sees the secret |
| `period`, `expiresAt`, `now` | numbers | `now` is the core's skew-corrected clock, ticked by the host |
| `density` | `detail` · `list` · `compact` | Palette rows use `compact` |
| `concealed` | boolean | Tap to reveal (an Aegis option); default `false` |
| `skewSeconds` | number | Shows the clock notice past ±15 s |
| `warnings` | `("issuer-equals-login")[]` | From `02-model.md` §4 |
| `clipboardTimer` | seconds | As SecretField |
| `onCopy`, `onAdvance` | callbacks | `onAdvance` for HOTP |

## States

| State | What changes |
|---|---|
| default | Code in `foreground`; ring in `foreground` on a `border` track |
| expiring | From `--c-code-expiring-at` (5 s): ring and code in `warning`, code weight 600; haptic once on mobile |
| next shown | From `--c-code-next-at` (10 s): next code appears beneath in `muted-foreground` |
| rollover | Next becomes current: 200 ms crossfade with the standard ease; reduced motion swaps instantly |
| copied | Copy button runs the shared countdown; tooltip "Copied · clears in 30 s" |
| concealed | Groups replaced by dots; tap or Enter reveals for one period |
| loading | Skeleton boxes the size of the groups |
| error | "Can't make a code" with the reason (unsupported algorithm, unreadable secret) in `destructive`; no digits drawn |
| disabled | HOTP "Next code" while `onAdvance` is busy |
| reduced motion | Ring updates in 5 s steps; no crossfade |
| high contrast | Ring becomes text "5 s"; expiring adds an underline, not only color |

## Behavior and timing

| Rule | Value | Why |
|---|---|---|
| Expiring cue | ≤ 5 s | Aegis and Ente both color late; 5 s is long enough to stop typing |
| Next code early | ≤ 10 s | Enough time to read and type the next one instead |
| Haptic | once at 5 s, mobile only | Aegis; desktop has no haptics |
| Copy near expiry | ≤ 3 s left copies `next` and says "Copied the next code" | A copied code that dies before paste is the top support complaint. Tradeoff: differs from 1Password; flagged for Sean |
| Rollover announcement | only while the row has focus or was copied in the last period | Lists of twenty codes must not chatter |
| HOTP | no timer; "Next code" advances the counter through `onAdvance` and shows the new code | RFC 4226 |
| Skew | notice past ±15 s with "Fix clock" that calls the host | Ente does clock correction |

Steam codes render uppercase in mono with tabular figures. The alphabet has no `0`, `1`, `I`, `O`, or `S`, so no disambiguation is needed; 8-digit codes use `font-feature-settings: "zero"` for the slashed zero.

## Tokens

Tier 2 used today: `foreground`, `muted-foreground`, `border`, `card`, `destructive`, `font-mono`.

New tier 2 role needed: **`warning`** (shared).

Tier 3 to add under `code`:

| Token | Aliases | Purpose |
|---|---|---|
| `--c-code-size-detail` | `2.25rem` | |
| `--c-code-size-list` | `1.25rem` | |
| `--c-code-size-compact` | `1rem` | |
| `--c-code-group-gap` | `0.75em` | |
| `--c-code-letter-spacing` | `0.08em` | |
| `--c-code-ring-track` | `{border}` | |
| `--c-code-ring-progress` | `{foreground}` | |
| `--c-code-ring-expiring` | `{warning}` | |
| `--c-code-next-ink` | `{muted-foreground}` | |
| `--c-code-expiring-at` | `5s` | |
| `--c-code-next-at` | `10s` | |
| `--c-code-copy-next-at` | `3s` | |
| `--c-code-rollover-duration` | `200ms` | Literal; tier 2 has no duration role |

## Keyboard and screen reader

- The code element has `aria-label="Code for GitHub, sean: 4 8 2, 9 1 7. 18 seconds left."` Digits are space-separated so they read one by one; a comma marks the group break. Never the number as a quantity.
- The label updates on rollover and at the expiring threshold, not every second.
- Shared polite live region per list: "New code for GitHub: 3 3 0, 5 5 8" only under the rule above; "Copied. Clipboard clears in 30 seconds." on copy.
- Row is focusable; Enter or Space copies; in `concealed` the first Enter reveals. HOTP: "Next code" is a named button.
- Timer ring is `aria-hidden`; time remaining lives in the label.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | `font-variant-numeric: tabular-nums`; `requestAnimationFrame` paused when hidden | Tick from the core's clock, thresholds, announcement rule |
| SwiftUI | `TimelineView`, `.monospacedDigit()`, `.sensoryFeedback(.warning)`; the iOS one-time-code keyboard bar is Apple's and out of scope | Same; `concealed` honors `.privacySensitive()` |
| Compose | `FontFeatureSettings("tnum")`, `HapticFeedbackType`, `FLAG_SECURE` | Same |

## Security notes

- The component receives `code` and `next` as short strings; it never holds the secret or computes HMAC.
- Never rendered inside web content; in the extension it lives in the top-layer frame and needs the second deliberate action before fill (`04-security.md` §12).
- `user-select: none` on the code so copying goes through the timed path; opaque; the row is at least 44 px tall in `list` density.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- changeset: minor (`@unicron/ui`; `@unicron/tokens` for `code.*` and `warning`).

## Acceptance tests

**Screenshot (light and dark, each web engine):** 6, 8, and Steam at three densities; expiring; next shown; HOTP; concealed; skew notice; error; `prefers-reduced-motion`; `prefers-contrast: more`.

**Playwright (fake clock):**
1. At 10 s left `code-display-next` is visible; at 5 s the root has `data-state="expiring"`; at 0 the next code is the current one and `next` is hidden.
2. Copy at 4 s left copies `code`; copy at 2 s left copies `next` and the tooltip says so.
3. The accessible label contains each digit separated by spaces and never the contiguous six-digit string.
4. In a list of ten codes with none focused, the live region stays empty across a rollover; with one focused, it announces that one only.
5. HOTP renders no ring; "Next code" calls `onAdvance` once per activation and is disabled while pending.
