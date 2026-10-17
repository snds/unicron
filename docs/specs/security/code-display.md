# CodeDisplay

_Spec v0.2 · 2026-10-17 · Proposed by Lockdown (brief §5.7; `02-model.md` §4 Code type) · Status: built in `@unicron/ui` 0.4.0 (PR #15); this spec describes the build_

## Purpose and the user job

A person has seconds to read a one-time code and type it somewhere else. The component shows the code grouped for reading, how long it is still valid, a warning before it expires, the next code early so nobody types a code that dies mid-entry (as Aegis does), and a copy with a clipboard timer. It handles 6-digit and 8-digit TOTP, HOTP counters, and Steam's 5-character codes. Lockdown is the first consumer; the standalone authenticator view and the quick-access palette reuse it at other densities.

## Uniqueness check

Composes `Item`, `IconButton`, `Badge`, `Button`, `Skeleton`, and the shared `useCopyCountdown` hook from `components/security/copy-countdown.ts` (exported from the package root). It is a component rather than a SecretField variant because the job differs (a code is shown by default and expires on a clock; a secret is hidden by default and expires on a timer the person started), and because it owns period maths, the early next code, the expiring state, haptics, a rollover announcement, and a digit-by-digit accessible label.

## Anatomy

```
code-display                       Item, role="group", tabIndex=0; data-variant, data-density, data-state, data-gated, data-copied
├─ ItemMedia                       `media` (detail and list)
├─ code-display-issuer             "GitHub · sean" (detail and list)
├─ code-display-code               aria-hidden; data-rolling during the crossfade
│  └─ code-display-group × n       font-mono, tabular, 3+3 · 4+4 · 5; data-concealed when dots
├─ code-display-next               "Next 330 558" in --c-code-next-ink
├─ code-display-notice             Badge outline: "Clock is off by 40 s · Fix clock" · "Same account you sign in with"
├─ code-display-timer              ring (TOTP, Steam), aria-hidden; text "N s" in high contrast
├─ code-display-counter            "#7" (HOTP) · "Next code" Button
├─ code-display-copy               IconButton with the shared countdown
└─ code-display-live               polite live region, or CodeDisplayList's shared one
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `variant` | `totp` (default) · `hotp` · `steam` | `steam`: 5 characters, one group, uppercase |
| `digits` | `5` · `6` · `8` | Default from the variant. 6 → 3+3, 8 → 4+4, 5 → one group |
| `code`, `next` | strings | Computed by the host's core; the component never sees the secret |
| `period` | seconds, default `30` | |
| `expiresAt`, `now` | Unix **seconds** | `now` is the core's skew-corrected clock, ticked by the host; omit it and the component ticks itself once a second. `expiresAt` defaults to the end of the current period |
| `density` | `detail` (default) · `list` · `compact` | `compact` drops media and issuer |
| `concealed` | boolean | Tap or Enter reveals for this code; forced inside a `CrownJewelSurface` |
| `skewSeconds` | number | Shows the clock notice past ±15 s |
| `warnings` | `("issuer-equals-login")[]` | From `02-model.md` §4 |
| `issuer`, `account`, `media` | string, string, node | "GitHub", "sean", an Avatar or Icon |
| `clipboardTimer` | seconds, default `30` | As SecretField |
| `onCopy(value, which)` | callback | `which` is `code` or `next` |
| `onAdvance`, `counter` | HOTP | "Next code" is disabled while `onAdvance` is pending |
| `onHaptic` | callback | Once per code at the expiring threshold; mobile hosts vibrate |
| `onFixClock`, `onClipboardClear` | callbacks | The skew notice's action; the countdown ran out |
| `loading`, `error` | boolean, string | |

Exports: `groupCode`, `spellCode`, `CodeDisplayList`, `CodeDisplayState`. Other `div` props pass through to the `Item`.

## States

| State (`data-state`) | What changes |
|---|---|
| `default` | Code in `foreground`; ring in `foreground` on a `border` track |
| `expiring` | From `--c-code-expiring-at` (5 s): ring and code in `warning`, weight 600; `onHaptic` once |
| `concealed` | Dots (`*` in high contrast); label "Code for GitHub, sean, hidden. Press Enter to show it." |
| `loading` | Skeleton boxes, one per group |
| `error` | "Can't make a code: reason" in `destructive`; no digits, no copy button |
| next shown | From `--c-code-next-at` (10 s): next code beneath in `--c-code-next-ink` |
| rollover | `--c-code-rollover-duration` (200 ms) fade-in; instant under reduced motion |
| copied (`data-copied`) | Seconds on the copy button; tooltip "Copied · clears in 30 s" or "Copied the next code · …"; then "Cleared" |
| HOTP busy | "Next code" disabled while `onAdvance` is pending, or when it is absent |
| reduced motion | Ring in 5 s steps; no crossfade |
| high contrast and forced colors | Ring hidden, "N s" text shown; expiring adds an underline |

## Behavior and timing

| Rule | Value | Why |
|---|---|---|
| Expiring cue | ≤ 5 s | Aegis and Ente both color late; 5 s is long enough to stop typing |
| Next code early | ≤ 10 s | Enough time to read and type the next one instead |
| Haptic | once per code at 5 s | Aegis; desktop hosts leave `onHaptic` out |
| Copy near expiry | ≤ 3 s left copies `next`; the button is named "Copy the next code" and the region says so | A copied code that dies before paste is the top support complaint. Differs from 1Password; still flagged for Sean |
| Rollover announcement | only while the row has focus or was copied within the last period, never while concealed | Lists of twenty codes must not chatter |
| HOTP | no timer; "Next code" calls `onAdvance` once per activation | RFC 4226 |
| Skew | notice past ±15 s with "Fix clock" calling `onFixClock` | Ente does clock correction |

Thresholds and the rollover duration are read from the tier 3 knobs once after mount, with the spec values as fallback when the stylesheet is absent. Inside a `CrownJewelSurface`, copy first awaits `requestProof("use")` and the copy glyph carries a lock. Steam codes render uppercase; 8-digit codes set `font-feature-settings: "zero"`.

## Tokens

Tier 2: `foreground`, `muted-foreground`, `border`, `card`, `destructive`, `warning` (shipped in `@unicron/tokens` 0.2.0), `font-mono`.

Tier 3 under `code`:

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

- The row is `role="group"` with `aria-label="Code for GitHub, sean: 4 8 2, 9 1 7. 18 seconds left."` (`spellCode`: space-separated digits, a comma at the group break, never the number as a quantity). Without an issuer the label says "this account". HOTP omits the seconds.
- The label's seconds refresh on rollover and at the expiring threshold, not every second. The visible code is `aria-hidden`.
- Polite live region, one per row or one per `CodeDisplayList`: "New code for GitHub: 3 3 0, 5 5 8" under the rule above; "Copied. Clipboard clears in 30 seconds." or "Copied the next code. …" on copy.
- Row focusable; Enter or Space copies; in `concealed` the first Enter, Space, or click reveals. The copy button, "Next code", and "Fix clock" are named controls.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | `tabular-nums`; the self-ticking interval runs only when `now` is omitted | Tick from the core's clock, thresholds, announcement rule |
| SwiftUI | `TimelineView`, `.monospacedDigit()`, `.sensoryFeedback(.warning)`; the iOS one-time-code keyboard bar is Apple's and out of scope | Same; `concealed` honors `.privacySensitive()` |
| Compose | `FontFeatureSettings("tnum")`, `HapticFeedbackType`, `FLAG_SECURE` | Same |

## Security notes

- The component receives `code` and `next` as short strings; it never holds the secret or computes HMAC.
- Never rendered inside web content; in the extension it lives in the top-layer frame and needs the second deliberate action before fill (`04-security.md` §12).
- `user-select: none` on the row so copying goes through the timed path; opaque; at least 44 px tall in `list` density, 36 px in `compact`.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- Shipped: `@unicron/ui` 0.4.0, `@unicron/tokens` 0.2.0; subpath `@unicron/ui/security/code-display`.

## Acceptance tests

**Vitest (jsdom, fake timers, `code-display.test.tsx`, 15 tests):** the five below, plus the helpers, `onHaptic` once, Enter copies and the countdown clears once, the label refresh rule, concealed reveal per code, the skew notice, error and loading, Steam and 8-digit rendering, reduced motion skipping the crossfade.

1. At 10 s left `code-display-next` is visible; at 5 s `data-state="expiring"`; at 0 the next code is current and `next` is hidden.
2. Copy at 4 s left copies `code`; at 2 s it copies `next` and the tooltip says so.
3. The label contains each digit separated by spaces and never the contiguous code.
4. In a `CodeDisplayList` of ten with none focused, the live region stays empty across a rollover; with one focused, it announces that one only.
5. HOTP renders no ring; "Next code" calls `onAdvance` once per activation and is disabled while pending.

**Still needs a browser:** screenshots of 6, 8, and Steam at three densities, expiring, next shown, HOTP, concealed, skew, error, reduced motion, `prefers-contrast: more`; the ring's drain and the crossfade; the 44 px row height.
