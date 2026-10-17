# SecretField

_Spec v0.3 · 2026-10-17 · Proposed by Lockdown (brief §5.7; `02-model.md` §5 `hidden` kind; `03-architecture.md` §8) · Status: built in `@unicron/ui` 0.4.0 (PR #16); v0.3 adds the host-contract items a desktop host found (copy by reference, the host's error words, a gated reveal is a toggle); this spec describes the build_

## Purpose and the user job

A person needs to use a hidden value (password, key, CVC, PIN, Secret Key, recovery code) without exposing it longer than the job takes. The field shows a mask, reveals on request for a bounded time, copies with a clipboard timer, and never holds the value as a string in the UI layer. In edit mode it is where a new secret is typed, with the strength meter and a slot for the generator. Mailbird's locked notes and Synapse tokens use it too.

## Uniqueness check

Composes `Field`, `InputGroup` → `InputGroupAddon` (and `InputGroupInput` in edit mode), `IconButton`, `Skeleton`, `Spinner`. It is not an `Input type="password"` variant: that control keeps the value in the DOM and only toggles visibility. This component owns a one-shot fetch through a handle, a reveal lifetime, hide-on-blur, copy with a countdown and a conditional clear, and a gate hook. Those are behaviors, not styles.

## Anatomy

```
secret-field                      div, data-mode="read|edit", data-state="masked|loading|revealed|error", data-gate
├─ FieldLabel                     the `label` prop
├─ secret-field-control           InputGroup
│  ├─ secret-field-value          read: role="textbox" aria-readonly; dot mask, or secret-field-revealed written imperatively; edit: InputGroupInput
│  ├─ secret-field-reveal         IconButton visibility / visibility_off, aria-pressed; secret-field-gate lock glyph when gated
│  ├─ secret-field-copy           IconButton content_copy → secret-field-copy-countdown (ring, or "28 s") → check + sr-only "Cleared"
│  └─ secret-field-more           `children`: large type, generate, history
├─ secret-field-meter             edit only: three segments + word, data-strength
├─ FieldDescription / FieldError
└─ (sr-only)                      role="status" polite live region (read mode)
```

## Props and variants

`SecretFieldProps` is a union on `mode`. Common: `label` (required; names the field and the live-region texts), `mono` (default `true`), `description`, `children` (the `more` slot), `id`, `className`.

| Prop | Mode | Values | Notes |
|---|---|---|---|
| `getSecret` | read | `() => Promise<Uint8Array>` | One-shot; the field zeroes the buffer after use |
| `host` | read | `SecretFieldHost` · `SecretFieldReferenceHost` | `copy(bytes)`, `clear()`, optional `copyRef()`, `clipboardHolds(hash)` and `gate(kind)`; see below |
| `revealMode` | read | `hold` (default) · `toggle` | `hold` reveals while the pointer or Space is held (Lockdown D97); `toggle` is the per-person setting with the auto-hide. A gated field always reveals as `toggle` (see Behavior) |
| `revealLifetime` | read | seconds | Default `--c-secret-field-reveal-lifetime` (30), or `--c-crown-jewel-reveal-lifetime` (20) inside a `CrownJewelSurface`; read from the element when a reveal starts, so a surface can re-map it |
| `clipboardTimer` | read | seconds, clamped `10`–`90` | Default `--c-secret-field-clipboard-timer` (30), read from `:root` once; no "never" |
| `gate` | read | `none` (default) · `biometric` · `password` | Runs `host.gate(kind)` first. Inside a `CrownJewelSurface` the surface gates the field whatever this says |
| `format` | read | `plain` · `groups-of-4` · `words` | Display only; the spelled name uses the raw value |
| `locked` | read | boolean | The vault locked: the field masks at once |
| `onReveal`, `onCopy` | read | callbacks | For the audit log |
| `errorText` | read | string · `(error, action) => string \| undefined` | The host's own words for a failed reveal or copy, in place of the defaults. A string is shown for either action; a function gets what `getSecret`, `copy` or `copyRef` rejected with and `"read"` or `"copy"`, and returns `undefined` to keep the default words. Shown only in the error state, with Retry |
| `value`, `onChange`, `strength`, `disabled`, `error` | edit | | `strength` (`weak` · `fair` · `strong`) is computed by the host's core |

**`SecretFieldHost`.** `copy(bytes)` puts the bytes on the clipboard (the core on Tauri and native; `navigator.clipboard` only in the pure web vault); the timer starts when it resolves. `clear()` runs at expiry. `clipboardHolds(hash)` answers whether the clipboard still holds our value; `hash` is hex SHA-256 of the copied bytes (FNV-1a where SubtleCrypto is missing). Omit it where the platform cannot read the clipboard, and the clear runs unconditionally. `gate(kind)` resolves `true` when the person passed; the field asks, it never decides.

**Copy by reference (`copyRef`).** A host that copies inside its own process (the core on Tauri and native) passes `copyRef(): Promise<{ hash?: string } | void>`. When it is present the field never calls `getSecret` or `copy` to copy, so no bytes cross to the UI for a copy; the reveal still uses `getSecret`. What `copyRef` resolves with decides the clear: `{ hash }` is handed back to `clipboardHolds(hash)` at expiry (the string is opaque to the field: a digest, or the host's own record of the copy, such as a generation counter); nothing, or no `clipboardHolds`, means the clear runs unconditionally and the tooltip says ", even if you copy something else". A rejection is the copy error. `SecretFieldReferenceHost` is the same interface with `copyRef` required and `copy` optional, for a host that has no byte path at all; `SecretFieldHost` itself is unchanged apart from the optional `copyRef`.

**Mask length.** Read mode shows `--c-secret-field-mask-count` dots (12, read from `:root` once), never the true length. Edit mode follows what is typed.

Exports: `spellSecret`, `secretFieldAnnouncements`, `secretFieldErrors`, and the types (`SecretFieldHost`, `SecretFieldReferenceHost`, `SecretFieldCopyRef`, `SecretFieldAction`, …).

## States

| State | What changes |
|---|---|
| masked | Dots in `muted-foreground`; not selectable; `aria-pressed=false`; name "Password, hidden" |
| loading | Skeleton in place of the value while `getSecret` runs |
| revealed | Mono text with `warning` tint; `aria-pressed=true`; lifetime running; one revealed field per document |
| copying | Ring drains on the copy button; tooltip "Copied · clears in 28 s" (plus ", even if you copy something else" without `clipboardHolds`) |
| cleared | Check plus sr-only "Cleared" for 2 s; not shown when the clipboard held something else |
| gated | Reveal and copy carry a lock glyph; the waiting control shows a Spinner; tooltip "Copy Password (confirm it's you first)"; the reveal is a tap (`data-reveal-mode="toggle"`) |
| error | "Couldn't read this field" or "Couldn't copy this field", or the host's `errorText`, in `destructive` with Retry; no value |
| disabled | Edit mode only; read mode is gated or `locked`, never disabled |
| edit | `InputGroupInput` with its own show toggle; meter weak `destructive`, fair `warning`, strong `primary`, always with the word |
| reduced motion | Ring becomes text "28 s"; no tint transition |
| high contrast and forced colors | Dots become the word "Hidden"; "Shown" is added while revealed; tint dropped |

## Behavior and timing

- **Reveal.** Gate, then `getSecret`, then one imperative DOM write of the text and its spelled name; React state holds only a phase. One revealed field per document: revealing another masks the first. Mask on window blur, `visibilitychange`, leaving the viewport (`IntersectionObserver`), `locked`, and unmount. `hold` masks on pointer up, cancel, leave, blur, or Space release; a release while the gate or fetch is pending drops the buffer unshown.
- **Copy.** Gate, `getSecret`, hash, `host.copy`, zero the buffer, start the countdown. With `copyRef`: gate, `host.copyRef()`, start the countdown; no bytes are fetched. At expiry: if `clipboardHolds` answers `false`, stop silently; otherwise `host.clear()` and "Clipboard cleared." A reference copy with no hash skips `clipboardHolds`.
- **Gate.** `biometric` for use (copy), `password` for reveal, per `04-security.md` §10. Inside a `CrownJewelSurface`, `useCrownJewel().requestProof("use" | "reveal")` is called instead of `host.gate`.
- **A gated reveal is a toggle.** A hold cannot survive a gate: the check opens a dialog or an OS prompt, which takes focus, and losing focus ends a hold. So when the reveal is gated (`gate` is not `none`, or the field is inside a `CrownJewelSurface`) the field reveals as `toggle` whatever `revealMode` says: one tap runs the gate and shows the value for the lifetime (20 s inside a crown jewel), Hide or the usual triggers mask it. When the host asked for `hold`, the live region says so on reveal: "Password shown. Hides in 20 seconds, or when you select Hide." The rule is automatic, not a prop, because a gated hold cannot work on any host: before 0.6.0 such a field dropped the reveal when the gate took focus. An ungated field keeps `hold`.
- **Edit.** `autocomplete="new-password"`, no spellcheck, autocorrect, or autocapitalize; the generator goes in `children`.

## Tokens

Tier 2: `input`, `border`, `foreground`, `muted-foreground`, `ring`, `primary`, `destructive`, `warning` (shipped in `@unicron/tokens` 0.2.0), `font-mono`.

Tier 3 under `secret-field`:

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

- Read value: `role="textbox" aria-readonly`, focusable, named "Password, hidden" while masked. When revealed its name is the value spelled per character with case and symbol names ("capital t, r, 4, dash"); it is **not** announced automatically.
- Live region (`secretFieldAnnouncements`): "Password shown. Hides in 30 seconds." · "Password shown. Hides in 20 seconds, or when you select Hide." (`shownUntilHidden`: a hold that went through a gate) · "Copied. Clipboard clears in 30 seconds." · "Clipboard cleared." · "Confirm it's you to show this." · "Confirm it's you to copy this."
- Reveal button named "Hold to show Password" · "Show Password" · "Hide Password". A gated field is never "Hold to show". `hold`: Space held reveals, release hides, Enter does nothing, a bare click never reveals. `toggle`: Space or Enter toggles; `aria-pressed` reflects state.
- Copy: Enter on the button, or Cmd/Ctrl+C anywhere in the control runs the same timed copy; the value is `user-select: none`.
- Edit mode: ordinary input semantics; the meter is `aria-describedby` with sr-only "Strength: " before the word.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | Tauri: `host.copy` runs a command into the core, which sets `org.nspasteboard.ConcealedType` (macOS) and `ExcludeClipboardContentFromMonitorProcessing` + `CanIncludeInClipboardHistory=0` (Windows); Linux Wayland copies only with focus, say so | Lifetime, one-revealed rule, conditional clear |
| SwiftUI | `SecureField` for edit; `.privacySensitive()`; `UIPasteboard.setItems(_, options: [.expirationDate, .localOnly])` | Fixed mask count; the host interface; the gate hook |
| Compose | `PasswordVisualTransformation`; `FLAG_SECURE`; `ClipData` with `EXTRA_IS_SENSITIVE`; `clearPrimaryClip()` at expiry | Same |

## Security notes

- The value never enters React state as a string, never sits in the DOM while masked, and is zeroed after reveal or copy. Buffers come from and return to the core (`03-architecture.md` §8).
- Masked and revealed values are not selectable; copy goes through the timed path only.
- Never rendered inside web content; the extension's top-layer frame shows read mode without reveal for gated items.
- Opaque; icon buttons are 32 px, which is why the countdown and the "Cleared" word live in the tooltip and live region.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- Shipped: `@unicron/ui` 0.4.0, `@unicron/tokens` 0.2.0; subpath `@unicron/ui/security/secret-field`.

## Acceptance tests

**Vitest (jsdom, `secret-field.test.tsx`, 29 tests):** the nine below, plus the 12-dot mask, buffer zeroing, a slow reveal landing, `hold` by pointer and Space, mask on tab hidden and on `locked`, `groups-of-4`, error with Retry, the unconditional clear, the 10–90 s clamp, the crown-jewel lifetime, reduced-motion text, high-contrast hooks, edit mode, a reference copy inside a crown jewel, `errorText` falling back to the defaults.

1. The DOM contains no text node equal to the secret until reveal; after the lifetime it is gone again.
2. Revealing field B masks field A.
3. Window blur masks.
4. At expiry the host's clear is called once when the clipboard hash matches and not when it differs.
5. Cmd/Ctrl+C on the focused control runs the copy; the value is not selectable.
6. `gate="password"` runs the gate before `getSecret` and never fetches when it rejects; inside a `CrownJewelSurface` it asks the surface (`use` for copy, `reveal` for show).
7. With `copyRef`, a copy never calls `getSecret` or `copy`; the hash it resolves with reaches `clipboardHolds`; with no hash `clipboardHolds` is skipped and the clear runs.
8. `errorText` (a string, or a function given the rejection and the action) replaces the default error words.
9. A gated field with `revealMode="hold"` is named "Show Password", reveals on a tap that survives the gate taking focus, and announces `shownUntilHidden`; an ungated field keeps the hold.

**Still needs a browser:** screenshots of every state in light and dark; blur within one frame; leaving the viewport (jsdom has no `IntersectionObserver`); an empty pointer selection; the real clipboard on each platform.
