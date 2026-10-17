# CrownJewel treatment

_Spec v0.2 · 2026-10-17 · Proposed by Lockdown (brief §2.9 point 5, §5.7; `02-model.md` §3; `04-security.md` §10) · Status: built in `@unicron/ui` 0.4.0 (PR #15); this spec describes the build_

## Purpose and the user job

Some secrets can end a person's digital life if they leak: seed phrases, recovery codes, the master login of the mailbox everything recovers through. The crown-jewel class gives them stricter rules (a fresh biometric to use, the full password to reveal, never autofilled, never in search previews, never to agents, optionally never synced). The treatment makes the class unmistakable wherever it appears, so the extra friction reads as protection rather than a bug, and so a person learns what the real thing looks like. Mailbird's locked notes with a Lockdown recovery path (D5) are the second consumer.

## Uniqueness check

Three parts and one hook, one module. `CrownJewelMark` composes `Icon` and sr-only text. `CrownJewelSurface` composes a `section` with a re-mapped semantic tier, `Icon`, `Badge`, an `IconButton` that opens an explain `Dialog`, and the built-in gate. `CrownJewelGate` composes `Dialog`, `DialogActions`, `Field`, and `Input`. It is a component because it carries behavior: the surface flips every SecretField, CodeDisplay, and LargeTypeView inside it into gated mode through context, and it refuses to render in web content. Core kept the name; `Protected*` was not taken.

## Anatomy

```
crown-jewel-surface                 section, role="region", data-protected, data-gated, data-device-only; roles re-mapped inline
├─ crown-jewel-banner
│  ├─ crown-jewel-icon              Icon lock (fill and weight from the knobs)
│  ├─ crown-jewel-label             "Crown jewel"
│  ├─ crown-jewel-device-only       Badge outline "This device only"
│  └─ crown-jewel-explain           IconButton "What crown jewel means" → crown-jewel-explain-dialog
├─ crown-jewel-content              children, or Skeleton (loading), or the error (role="alert")
└─ (sr-only)                        polite live region, first-focus announcement

crown-jewel-mark                    inline: filled lock + sr-only "Crown jewel"

crown-jewel-gate                    DialogContent, data-level, data-armed
├─ DialogTitle                      "Confirm it's you"
├─ crown-jewel-gate-reason          "To show Ledger recovery phrase"
├─ crown-jewel-gate-step            password: Field + Input type="password" · biometric: one sentence; error line aria-live
└─ DialogActions                    Cancel · Confirm (submit)
```

## Props and the hook

`useCrownJewel()` returns `{ gated: boolean, requestProof(kind: "use" | "reveal"): Promise<boolean> }`. Outside a surface `gated` is `false` and the proof resolves `true`. `use` (copy, sign) asks for a biometric; `reveal` (show, export) asks for the password.

| Part | Prop | Values | Notes |
|---|---|---|---|
| Surface | `host` | `app` · `os` · `extension-top-layer` | Anything else logs `console.error` in development and renders `null` in every build; nothing throws |
| Surface | `title` | string | Names the region and the gate's reason |
| Surface | `deviceOnly` | boolean | Badge, and the sync rule in the explain copy |
| Surface | `loading`, `error` | boolean, string | Banner stays; content shows a Skeleton or the error |
| Surface | `appName` | string | "the Lockdown app" in the explain copy; "the app" without it |
| Surface | `biometricName` | string, default `"Touch ID"` | The platform's word in copy and announcements |
| Surface | `requestProof` | `(kind) => Promise<boolean>` | Host-owned gate; the host shows its own prompt |
| Surface | `onConfirm` | `(proof, kind) => boolean \| Promise<boolean>` | Built-in gate: hand the proof to the core; `true` accepts. Nothing is cached |
| Surface | `onBiometric` | `() => Promise<unknown>` | Built-in gate: ask the OS; a token, or `null` when backed out. Omit where there is none (Linux); use then gates on the password |
| Surface | `onLock` | callback | After the last password try the host locks the vault |
| Mark | `size` | `sm` · `md` | |
| Gate | `open`, `onOpenChange`, `onCancel` | | The standalone gate is controlled |
| Gate | `level`, `reason` | `biometric` · `password`; string | The reason is always shown, never generic |
| Gate | `onConfirm(proof)` | `{ level: "biometric", token }` · `{ level: "password", password }` | Opaque to the component |
| Gate | `onBiometric`, `attemptsLeft`, `error`, `busy`, `biometricName` | | Host-driven |

## States

| State | What changes |
|---|---|
| default | Inverted surface: `protected` behind `protected-foreground`; lock filled; 20rem minimum width |
| gated | Nested SecretField, CodeDisplay, and LargeTypeView read `gated`: copy and reveal carry a lock glyph, CodeDisplay is concealed |
| gate open | Dialog; focus in the password field; at `biometric` the OS is asked as the dialog opens |
| biometric refused | The built-in gate drops to `password`: "Touch ID didn't confirm it's you. Use your account password instead." |
| denied | "Password incorrect. 2 tries left." in `destructive`; at 0 the gate closes, the request resolves `false`, `onLock` fires |
| confirmed | The one action proceeds; the surface stays gated; the next request opens a new gate |
| preview | Rows and search results: mark, title, kind, nothing else (host layout) |
| device-only | Badge; the explain copy adds "It stays on this device and is not synced." |
| loading, error | Skeletons, or the error in `destructive`; banner drawn in both |
| reduced motion | Lock fill does not animate |
| high contrast and forced colors | A 2 px border, the lock, and the word carry the treatment when the inversion is lost |

## Behavior and timing

- **Gate levels.** `requestProof("use")` opens the built-in gate at `biometric` when `onBiometric` is given, else `password`; `requestProof("reveal")` always opens it at `password`. A new request settles any open gate as `false`; no proof is cached (`04-security.md` §10).
- **Attempts.** `--c-crown-jewel-gate-attempts` (3), read from the surface. The last wrong password calls `onLock`.
- **Arming delay.** Cancel and Confirm are inert for `--c-approval-arm-delay` (500 ms); closing disarms and forgets the typed password.
- **Explain copy** ends with "You will only ever see this frame inside the Lockdown app or a system prompt, never on a web page." That sentence is how a person learns to distrust a page-drawn imitation.
- **Reveal lifetime.** A SecretField inside the surface reads `--c-crown-jewel-reveal-lifetime` (20 s) at reveal time instead of its own `--c-secret-field-reveal-lifetime` (30 s); an explicit `revealLifetime` prop wins over both. The announcement says the shorter number.

## Tokens

Tier 2: `background`, `foreground`, `muted`, `border`, `destructive`, `protected` and `protected-foreground` (shipped in `@unicron/tokens` 0.2.0).

Tier 3 under `crown-jewel`; the surface assigns each to the roles listed, inline:

| Token | Aliases | Assigned to |
|---|---|---|
| `--c-crown-jewel-surface` | `{protected}` | `--background`, `--card`, `--popover`, `--primary-foreground` |
| `--c-crown-jewel-ink` | `{protected-foreground}` | `--foreground`, `--card-foreground`, `--popover-foreground`, `--primary`, `--secondary-foreground`, `--accent-foreground` |
| `--c-crown-jewel-muted` | `color-mix(in oklab, {protected-foreground} 12%, transparent)` | `--muted`, `--secondary`, `--accent` |
| `--c-crown-jewel-muted-ink` | `color-mix(in oklab, {protected-foreground} 72%, transparent)` | `--muted-foreground`, `--ring`; one knob beyond v0.1 so hints keep contrast |
| `--c-crown-jewel-border` | `color-mix(in oklab, {protected-foreground} 24%, transparent)` | `--border`, `--input` |
| `--c-crown-jewel-icon-fill` | `1` | `--c-icon-fill` |
| `--c-crown-jewel-icon-wght` | `500` | `--c-icon-wght` |
| `--c-crown-jewel-reveal-lifetime` | `20s` | Read by nested SecretFields (above) |
| `--c-crown-jewel-gate-attempts` | `3` | Default attempts |

The re-mapping is the trick `.dark` uses, so nested primitives invert without any override.

## Keyboard and screen reader

- Surface: `role="region"`, `aria-label="Crown jewel: Ledger recovery phrase"`. On first focus inside, once: "Crown jewel. Using it needs Touch ID. Showing it needs your account password." (`biometricName` swaps the word.)
- Mark: icon `aria-hidden`, sr-only "Crown jewel".
- Gate: `role="dialog"`, `aria-modal`, no close button; focus in the password field; Enter submits; Escape cancels; the error reads through an `aria-live="polite"` line. The biometric step asks the OS on open and takes focus back on return.
- Explain: a Dialog with the rules as a list and a "Got it" button.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | Context provider; Tauri calls the OS biometric through `onBiometric`; Linux omits it | The `host` assertion, no cached proof, the re-mapped tier |
| SwiftUI | `LocalAuthentication` with `.deviceOwnerAuthenticationWithBiometrics` (no passcode fallback); `.privacySensitive()`; `.redacted(reason: .privacy)` in previews | Same; the inverted surface uses the generated `protected` colors |
| Compose | `BiometricPrompt` with `BIOMETRIC_STRONG` only, no `DEVICE_CREDENTIAL`; `FLAG_SECURE` | Same |

## Security notes

- Never rendered inside web content. The extension shows "Open Lockdown to use this item" instead, and the OS providers never see crown-jewel items (`02-model.md` §3).
- The treatment is a cue; the guarantee is placement. Pixels can be imitated; a surface that only exists in the app cannot.
- The gate hands an opaque proof to the host; the component never evaluates a password. The password step is `Input type="password"` until SecretField edit mode replaces it (open item: the gate holds a focus ref and its own autocomplete).
- Opaque, minimum 20rem wide; the gate sits in the top layer with the arming delay.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- Shipped: `@unicron/ui` 0.4.0, `@unicron/tokens` 0.2.0; subpath `@unicron/ui/security/crown-jewel`.

## Acceptance tests

**Vitest (jsdom, `crown-jewel.test.tsx`, 11 tests; the SecretField case is in `secret-field.test.tsx`):** the five below, plus the banner parts, the first-focus announcement, `useCrownJewel()` outside a surface, the standalone gate (reason, arming delay, password proof, biometric on open), and the mark.

1. Inside the surface the inline `--background` points at `--c-crown-jewel-surface` (the tokens map it to `protected`).
2. A CodeDisplay or SecretField inside asks for proof before copying or `getSecret`; one outside does not.
3. `host="page"` renders nothing and logs a development error.
4. Two confirmed uses in a row open the gate twice.
5. After the attempts reach 0 `onLock` fires and the dialog closes.

**Still needs a browser:** the computed `--background` equalling `--protected` and a nested `Button variant="secondary"` drawn with the re-mapped roles; screenshots of the surface with a SecretField and a CodeDisplay, the preview row, device-only, the gate at both levels, denied, `prefers-contrast: more`, forced colors.
