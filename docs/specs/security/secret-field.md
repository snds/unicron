# SecretField

_Spec v0.1 · 2026-10-17 · Proposed by Lockdown (brief §5.7; `02-model.md` §5 `hidden` kind; `03-architecture.md` §8) · Status: proposed_

## Purpose and the user job

A person needs to use a hidden value (password, key, CVC, PIN, Secret Key, recovery code) without exposing it longer than the job takes. The field shows a mask, reveals on request for a bounded time, copies with a clipboard timer, and never holds the value as a string in the UI layer. In edit mode it is where a new secret is typed, with the strength meter and a slot for the generator. Mailbird's locked notes and Synapse tokens use it too.

## Uniqueness check

Composes `Field` → `FieldLabel`, `InputGroup` → `InputGroupInput`, `InputGroupButton`, `IconButton`, `Tooltip`, and `FieldError`. It is not an `Input type="password"` variant: that control keeps the value in the DOM and only toggles visibility. This component owns a one-shot fetch of the value through a handle, a reveal lifetime, hide-on-blur, copy with a countdown and a conditional clear, a gate hook for crown jewels, and native screen-capture flags. Those are behaviors, not styles, so it is a component.

## Anatomy

```
secret-field                      Field, data-mode="read|edit"
├─ secret-field-label             FieldLabel
├─ secret-field-control           InputGroup
│  ├─ secret-field-value          read: masked span (fixed dot count) or revealed mono text; edit: InputGroupInput
│  ├─ secret-field-reveal         IconButton visibility / visibility_off, aria-pressed
│  ├─ secret-field-copy           IconButton content_copy → countdown ring → check → "Cleared"
│  └─ secret-field-more           optional slot: large type, generate, history
├─ secret-field-meter             edit only: strength bar + word
└─ secret-field-description       FieldDescription / FieldError
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `mode` | `read` · `edit` | |
| `getSecret` | `() => Promise<Uint8Array>` | One-shot; the component zeroes its copy after use. Read mode only |
| `revealMode` | `toggle` (default) · `hold` | `hold` reveals on pointer down or Space held |
| `revealLifetime` | seconds, default `30` | Also hides on blur, lock, and leaving the viewport |
| `clipboardTimer` | seconds, `10`–`90`, default `30` | Host-configured; no "never" |
| `gate` | `none` · `biometric` · `password` | Crown-jewel surfaces set `password` through context |
| `format` | `plain` · `groups-of-4` · `words` | Cards, recovery codes, word lists |
| `mono` | boolean, default `true` | |
| `onReveal`, `onCopy` | callbacks | For the audit log |
| `value`, `onChange`, `strength` | edit mode | `strength` is computed by the host's core |

**Mask length.** Read mode shows a fixed `--c-secret-field-mask-count` dots, never the true length, so a shoulder-surfer learns nothing. Edit mode follows what is typed.

## States

| State | What changes |
|---|---|
| masked | Dots in `muted-foreground`; value not selectable; reveal `aria-pressed=false` |
| revealed | Mono text; faint `warning` tint behind the value so exposure is visible; reveal `aria-pressed=true`; lifetime running |
| copying | Ring counts down on the copy button; tooltip "Copied · clears in 28 s" |
| cleared | Button shows check then "Cleared" for 2 s, then `content_copy` |
| gated | Reveal and copy carry a lock glyph; activating runs the gate first; `busy` while it runs |
| loading | Skeleton bar the height of the control |
| error | "Couldn't read this field" in `destructive`, with Retry; no value shown |
| disabled | Edit mode only; read mode is never disabled, it is gated |
| edit | Input with strength meter: weak `destructive`, fair `warning`, strong `primary`, always with the word |
| reduced motion | Ring becomes numeric text "28 s"; no tint fade |
| high contrast | Dots become text glyphs in `foreground`; solid borders; tint dropped, "Shown" word added |

## Behavior and timing

- **Reveal.** Fetch through `getSecret`, render, start the lifetime. One revealed field per document: revealing another masks the first. Hide on window blur, `visibilitychange`, lock, or the element leaving the viewport. `hold` mode masks on pointer up or Space release, which also satisfies pointer cancellation (WCAG 2.5.2).
- **Copy.** Fetch, hand the buffer to the host's copy function (the core on Tauri and native; `navigator.clipboard` only in the pure web vault), start the timer. At expiry, clear **only if the clipboard still holds our value** (compare a hash); where the platform cannot read the clipboard, clear unconditionally and say so in the tooltip.
- **Gate.** `biometric` for use (copy), `password` for reveal, per `04-security.md` §10. The field asks the host; it never decides.
- **Edit.** `autocomplete="new-password"`, no spellcheck, no autocorrect, the generator slot on the right.

## Tokens

Tier 2 used today: `input`, `border`, `foreground`, `muted-foreground`, `ring`, `primary`, `destructive`, `font-mono`.

New tier 2 role needed: **`warning`** (shared; the revealed tint and the fair strength step).

Tier 3 to add under `secret-field`:

| Token | Aliases | Purpose |
|---|---|---|
| `--c-secret-field-mask-count` | `12` | Dots in read mode |
| `--c-secret-field-reveal-lifetime` | `30s` | |
| `--c-secret-field-clipboard-timer` | `30s` | Default; host may override within 10–90 s |
| `--c-secret-field-revealed-bg` | `color-mix(in oklab, {warning} 10%, transparent)` | Exposure cue |
| `--c-secret-field-copy-track` | `{border}` | |
| `--c-secret-field-copy-progress` | `{foreground}` | |
| `--c-secret-field-meter-weak` | `{destructive}` | |
| `--c-secret-field-meter-fair` | `{warning}` | |
| `--c-secret-field-meter-strong` | `{primary}` | |
| `--c-secret-field-letter-spacing` | `0.04em` | Revealed mono text |

## Keyboard and screen reader

- Read mode value: `aria-label="Password, hidden"` while masked. When revealed, the text node is spelled per character with case ("capital T, r, 4, dash") so a screen-reader user can move through it; it is **not** announced automatically.
- Live region, polite: "Password shown. Hides in 30 seconds." · "Copied. Clipboard clears in 30 seconds." · "Clipboard cleared." · "Confirm it's you to show this."
- Reveal: Tab, then Space or Enter toggles; `aria-pressed` reflects state. In `hold` mode Space held reveals.
- Copy: Tab, then Enter. Cmd/Ctrl+C while the control has focus runs the same timed copy, because the masked value is not selectable and the revealed value has `user-select: none`.
- Edit mode: ordinary input semantics; the strength word is `aria-describedby`.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | Tauri: copy via a command into the core, which sets `org.nspasteboard.ConcealedType` (macOS) and `ExcludeClipboardContentFromMonitorProcessing` + `CanIncludeInClipboardHistory=0` (Windows); Linux Wayland copies only with focus, say so | Lifetime, one-revealed rule, conditional clear |
| SwiftUI | `SecureField` for edit; `.privacySensitive()`; `UIPasteboard.setItems(_, options: [.expirationDate, .localOnly])` | Fixed mask count in read mode; gate hook |
| Compose | `PasswordVisualTransformation`; `FLAG_SECURE`; `ClipData` with `EXTRA_IS_SENSITIVE`; `clearPrimaryClip()` at expiry | Same |

## Security notes

- The value never enters React state as a string, never sits in the DOM while masked, and is zeroed after reveal or copy. Buffers come from and return to the core (`03-architecture.md` §8).
- Masked and revealed values are not selectable; copy goes through the timed path only.
- Never rendered inside web content; the extension's top-layer frame shows read mode without reveal for gated items.
- Opaque; icon buttons are 32 px (above the 24 px minimum target size).

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- changeset: minor (`@unicron/ui`; `@unicron/tokens` for `secret-field.*` and `warning`).

## Acceptance tests

**Screenshot (light and dark, each web engine):** masked; revealed; copying at 28 s; cleared; gated; error; edit with each strength step; `prefers-reduced-motion`; `prefers-contrast: more`; forced colors.

**Playwright:**
1. The DOM contains no text node equal to the secret until reveal; after the lifetime it is gone again.
2. Revealing field B masks field A.
3. Window blur masks within one frame.
4. Copy starts a timer; with a fake clock at expiry, the host's clear is called once when the clipboard hash matches and not when it differs.
5. Cmd/Ctrl+C on the focused control calls `onCopy`; selecting the value with the pointer yields an empty selection.
6. `gate="password"` calls the gate before `getSecret`, and never calls `getSecret` when the gate rejects.
