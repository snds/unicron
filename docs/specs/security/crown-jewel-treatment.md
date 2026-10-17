# CrownJewel treatment

_Spec v0.1 · 2026-10-17 · Proposed by Lockdown (brief §2.9 point 5, §5.7; `02-model.md` §3; `04-security.md` §10) · Status: proposed_

## Purpose and the user job

Some secrets can end a person's digital life if they leak: seed phrases, recovery codes, the master login of the mailbox everything recovers through. The crown-jewel class gives them stricter rules (a fresh biometric to use, the full password to reveal, never autofilled, never in search previews, never to agents, optionally never synced). The treatment makes the class unmistakable wherever it appears, so the extra friction reads as protection rather than a bug, and so a person learns what the real thing looks like. Mailbird's locked notes with a Lockdown recovery path (D5) are the second consumer.

## Uniqueness check

Three small parts, one module. `CrownJewelMark` composes `Icon` and sr-only text. `CrownJewelSurface` composes a `section` with a re-mapped semantic tier, `Icon`, `Badge`, and an `IconButton` explain. `CrownJewelGate` composes `Dialog`, `DialogActions`, and `SecretField` in edit mode. It is a component rather than a `Badge` variant plus a class name because it carries behavior: the surface flips every SecretField and CodeDisplay inside it into gated mode through context, hides copy in previews, and refuses to render in web content. On naming: `06-contributing.md` declines app domain nouns, but "crown jewel" is already unicron's own vocabulary (`01-principles.md`) and names an ecosystem class, not one app's feature. If core prefers, the parts rename to `Protected*` with no other change.

## Anatomy

```
crown-jewel-surface                 section, data-protected; re-maps --background/--foreground/--muted/--border for its subtree
├─ crown-jewel-banner
│  ├─ crown-jewel-icon              Icon lock, fill 1, weight 500
│  ├─ crown-jewel-label             "Crown jewel"
│  ├─ crown-jewel-device-only       Badge "This device only" (when set)
│  └─ crown-jewel-explain           IconButton → the rules in plain words, and where this surface can appear
└─ crown-jewel-content              children: SecretField gate="password", CodeDisplay concealed, no fill hints

crown-jewel-mark                    inline: lock icon + sr-only "Crown jewel" (rows, titles, search results)

crown-jewel-gate                    Dialog
├─ title                            "Confirm it's you"
├─ reason                           "To show the recovery phrase for Ledger"
├─ step                             biometric: OS prompt · password: SecretField mode="edit"
└─ DialogActions                    Cancel · Confirm
```

## Props and variants

| Part | Prop | Values | Notes |
|---|---|---|---|
| Surface | `host` | `app` · `os` · `extension-top-layer` | Anything else throws in development and renders nothing in production |
| Surface | `deviceOnly` | boolean | Shows the badge |
| Surface | `title` | string | For the region's accessible name |
| Mark | `size` | `sm` · `md` | |
| Gate | `level` | `biometric` · `password` | Use → biometric; reveal or export → password |
| Gate | `reason` | string | Always shown; never generic |
| Gate | `onConfirm` | `(proof) => void` | `proof` is an opaque token from the OS or core; the component never judges it |
| Gate | `attemptsLeft`, `error`, `busy` | | Host-driven |

## States

| State | What changes |
|---|---|
| default | Inverted surface: `protected` behind `protected-foreground`; lock filled |
| gated | Children masked; reveal and copy controls carry a lock glyph |
| gate open | Dialog; focus in the password field or the OS prompt |
| denied | "Password incorrect. 2 tries left." in `destructive`; after the last try the host locks the vault |
| confirmed | The one action proceeds; the surface stays gated (no cached unlock, `04-security.md` §10) |
| preview | Rows and search results: mark, title, kind, nothing else |
| device-only | Badge in the banner; the explain copy adds the sync rule |
| loading | Skeleton inside the surface, banner already drawn |
| error | Item failed to decrypt: banner stays, content shows the error |
| reduced motion | Lock icon fill does not animate on gate |
| high contrast | The inversion may be lost under forced colors; a 2px solid border, the lock, and the word carry the treatment |

## Behavior and timing

- **Use** (copy a value, sign a confirmation) opens the gate at `biometric`. **Reveal or export** opens it at `password`. The gate hands the host's proof to the core, which performs the action. No proof is cached; the next use asks again.
- A reveal inside the surface uses `--c-crown-jewel-reveal-lifetime` (20 s), shorter than SecretField's default.
- The surface sets context so SecretField, CodeDisplay, and LargeTypeView inside it adopt `gate="password"` for reveal and `gate="biometric"` for copy, and so fill affordances do not render.
- The explain copy ends with: "You will only ever see this frame inside the Lockdown app or a system prompt, never on a web page." That sentence is how a person learns to distrust a page-drawn imitation.

## Tokens

Tier 2 used today: `background`, `foreground`, `muted`, `border`, `destructive`, `radius`.

New tier 2 role needed: **`protected` / `protected-foreground`**: light `{neutral.950}` / `{neutral.25}`, dark `{neutral.25}` / `{neutral.950}`. An inverted neutral surface needs no new hue, keeps the one-accent rule, and reads as "different kind of thing" in both modes.

Tier 3 to add under `crown-jewel`:

| Token | Aliases | Purpose |
|---|---|---|
| `--c-crown-jewel-surface` | `{protected}` | Assigned to `--background` and `--card` inside the surface |
| `--c-crown-jewel-ink` | `{protected-foreground}` | Assigned to `--foreground` inside |
| `--c-crown-jewel-muted` | `color-mix(in oklab, {protected-foreground} 12%, transparent)` | Assigned to `--muted` inside |
| `--c-crown-jewel-border` | `color-mix(in oklab, {protected-foreground} 24%, transparent)` | Assigned to `--border` inside |
| `--c-crown-jewel-icon-fill` | `1` | Via `--c-icon-fill` |
| `--c-crown-jewel-icon-wght` | `500` | Via `--c-icon-wght` |
| `--c-crown-jewel-reveal-lifetime` | `20s` | |
| `--c-crown-jewel-gate-attempts` | `3` | Default `attemptsLeft` |

The re-mapping trick is the same one `.dark` uses: inside the surface the semantic roles point at the protected values, so nested primitives invert without any override.

## Keyboard and screen reader

- Surface: `role="region"`, `aria-label="Crown jewel: Ledger recovery phrase"`. On first focus inside, a polite announcement: "Crown jewel. Using it needs Touch ID. Showing it needs your account password."
- Mark: icon `aria-hidden`, sr-only "Crown jewel" after the title.
- Gate: `role="dialog"`, `aria-modal`, focus in the password field; Enter submits; Escape cancels; "Password incorrect, 2 tries left" through the dialog's live region. The biometric step hands focus to the OS prompt and takes it back on return.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | Context provider; Tauri calls the OS biometric (Touch ID, Windows Hello) through a plug-in; Linux has no biometric, so use also gates on the password | The `host` assertion, no cached proof, re-mapped tier |
| SwiftUI | `LocalAuthentication` with `.deviceOwnerAuthenticationWithBiometrics` (no passcode fallback at this level); `.privacySensitive()`; `.redacted(reason: .privacy)` in previews | Same; the inverted surface uses the generated `protected` colors |
| Compose | `BiometricPrompt` with `BIOMETRIC_STRONG` only, no `DEVICE_CREDENTIAL`; `FLAG_SECURE` | Same |

## Security notes

- Never rendered inside web content. The extension shows "Open Lockdown to use this item" instead, and the OS providers never see crown-jewel items (`02-model.md` §3).
- The treatment is a cue; the guarantee is placement. Pixels can be imitated, a surface that only exists in the app cannot.
- The gate's proof is an opaque token from the OS or core; the component never evaluates a password itself.
- Opaque, minimum 20rem wide, and the gate dialog sits in the top layer with the same arming delay as ApprovalSheet (`--c-approval-arm-delay`).

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- changeset: minor (`@unicron/ui`; `@unicron/tokens` for `protected` and `crown-jewel.*`).

## Acceptance tests

**Screenshot (light and dark, each web engine):** surface with a SecretField and a CodeDisplay inside; preview row with the mark; device-only; gate at both levels; denied with one try left; `prefers-contrast: more`; forced colors (border and word survive).

**Playwright:**
1. Inside the surface, the computed `--background` equals `--protected` and nested `Button variant="secondary"` renders with the re-mapped roles.
2. A SecretField inside the surface calls the gate before `getSecret`; one outside does not.
3. `host="page"` renders nothing and logs a development error.
4. Two confirmed uses in a row call the gate twice.
5. After `attemptsLeft` reaches 0 the host's lock callback fires and the dialog closes.
