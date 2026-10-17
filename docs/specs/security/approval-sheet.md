# ApprovalSheet

_Spec v0.2 · 2026-10-17 · Proposed by Lockdown (brief §5.7, `04-security.md` §10–§12) · Status: built in `@unicron/ui` 0.4.0 (PR #16); this spec describes the build_

## Purpose and the user job

A person is shown a request that came from somewhere else (a new device, an agent, a TV, a trusted contact) and must decide, with enough context to decide well, whether it was them. The sheet exists to resist approval fatigue: the person proves they are looking at the other screen by entering the number it shows, and "This wasn't me" is as easy to reach as "Approve".

One sheet serves every request kind, because they all reduce to "approve a sign-in I am being shown" (Lockdown brief §2.9 point 4).

## Uniqueness check

Composes `Sheet` → `AdaptiveSheetContent`, `Item` (context rows), `Input` (digit cells), `Button`, `DialogActions`, `Icon`, and `RiskTierBadge`. It is a component rather than a `Dialog` variant because it owns behavior no parent has: an origin gate that can remove the approve control entirely, number matching that gates the confirm action, a timeout that denies by itself, a retry limit, an arming delay, and a third action kind (report) that `DialogActions` does not model.

## Anatomy

```
approval-sheet                      AdaptiveSheetContent, modal, top layer; data-kind, data-origin, data-phase, data-armed
├─ approval-sheet-header
│  ├─ approval-sheet-icon           Icon: devices · smart_toy · tv · group · extension
│  ├─ approval-sheet-title          "Approve a new device?"
│  └─ approval-sheet-tier           RiskTierBadge size="sm", verified
├─ approval-sheet-context           ItemGroup of Item rows: what · who · where · when
├─ approval-sheet-match
│  ├─ approval-sheet-match-prompt   "Enter the two digits shown on the other device"
│  ├─ approval-sheet-match-input    role="group"; one Input cell per digit  (mode="enter")
│  └─ approval-sheet-match-choice   role="group"; three pill Buttons        (mode="choose")
├─ approval-sheet-timer-ring        SVG ring, aria-hidden
├─ approval-sheet-timer             role="timer", aria-live="off": "58 s left" · "Expired"
├─ approval-sheet-notice            origin line, the match error, the error prop, or the decision line
├─ approval-sheet-actions           DialogActions: Approve · Deny · This wasn't me (DOM order; row reversed visually)
└─ (sr-only)                        role="status" polite live region
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `kind` | `device` · `agent` · `device-code` · `contact-request` · `bridge` | Sets icon, title, prompt, and the default tier (`approvalSheetCopy`) |
| `origin` | `scan` · `pairing` · `push` | `device-code` approves only from `scan`; any other origin renders no approve control, and the notice says why |
| `context` | `{ label, value, emphasis? }[]` | From the signed request; the sheet never infers facts |
| `matching` | `{ mode: "enter" \| "choose", digits: 2 \| 3, expected: string, choices?: string[] }` | `expected` is what the other device shows, from the signed request. `digits` is the count. `choices` for `choose` mode |
| `expiresAt` | number (ms) or `Date` | Default: mount time plus `--c-approval-lifetime` read from `:root` (60 s) |
| `tier` | `RiskTier` | Default by kind: `official` for `device-code`, `tolerated` for `bridge`, `standard` otherwise |
| `busy`, `error` | boolean, string | |
| `onApprove`, `onDeny(reason)`, `onReport` | callbacks | `reason`: `user` · `timeout` · `retries` · `origin` |
| `open`, `onOpenChange` | boolean (default `true`), callback | Controlled. `onOpenChange(false)` fires 1 s after a decision has been shown |

Exported copy: `approvalSheetCopy` (title, icon, prompt, default tier per kind), `approvalSheetOriginCopy`, `approvalSheetAnnouncements`. The prompt says "two" or "three" from `digits`.

## States

`data-phase` is `default` · `matched` · `expired` · `denied` · `reported` · `refused`; `busy` and `error` are props.

| State | What changes |
|---|---|
| default | Approve disabled; focus in the first digit cell; every action inert for the arming delay (`data-armed="false"`, `aria-busy`) |
| matched | Approve enabled and focused; "Number matches"; cells read-only |
| wrong | Cells clear; focus back to the first; notice "That number does not match. 1 try left." (`role="alert"`) |
| busy | Spinner in Approve; cells read-only; Deny disabled; Report enabled |
| error | Notice "Error: …" in `destructive`; Approve disabled |
| expired | Timer "Expired"; Approve removed; Deny becomes Close with focus; `onDeny("timeout")` already fired; the sheet stays until Close |
| denied / reported | Match and Report removed; one line ("Denied. Nothing was approved." · "Reported. This request was denied, and the host will sign that session out."); `onOpenChange(false)` after 1 s |
| refused | `device-code` not from `scan`: no approve control in the DOM; notice "Device codes are approved only when you scan the screen in front of you."; focus on Deny |
| reduced motion | Ring and timer text step every 5 s; no ring transition |
| forced colors | Ring track becomes a border; a disabled Approve adds a struck "Locked" word |

## Behavior and timing

- **Arming delay.** For `--c-approval-arm-delay` (500 ms, read from the sheet) after open, the action row is inert (`pointer-events: none`, Approve disabled, `choose` pills disabled) and Escape or a backdrop click is ignored. A double click that opened the request can neither approve nor dismiss. This replaces v0.1's "draw Approve where the pointer was not".
- **Number matching.** `enter` wherever there is a keyboard or a number pad; `choose` for the watch and the compact extension popup. The entry is compared with `matching.expected` when the last cell fills. After two wrong entries the sheet denies with reason `retries`.
- **Timeout.** Ticks once a second from mount; at `expiresAt` it denies with `timeout`. Timer ink turns `warning` at 10 s left. Nothing auto-approves, ever.
- **Report.** "This wasn't me" calls `onReport` only; the host treats a report as a denial, revokes the session, logs it, and offers follow-ups. Dismissing a refused sheet denies with reason `origin`.
- **Rate limits** live in the host's approval service; the sheet only shows the resulting `error`.

## Tokens

Tier 2: `popover`, `foreground`, `muted-foreground`, `border`, `primary`, `destructive`, `ring`, `warning` (shipped in `@unicron/tokens` 0.2.0), `font-mono`.

Tier 3 under `approval`:

| Token | Aliases | Purpose |
|---|---|---|
| `--c-approval-min-width` | `20rem` | Never smaller at any breakpoint |
| `--c-approval-digit-size` | `2rem` | Digit cell type size |
| `--c-approval-digit-gap` | `0.5rem` | |
| `--c-approval-timer-track` | `{border}` | |
| `--c-approval-timer-progress` | `{foreground}` | |
| `--c-approval-timer-urgent` | `{warning}` | Under 10 s |
| `--c-approval-arm-delay` | `500ms` | Inert window after open; also read by `CrownJewelGate` |
| `--c-approval-lifetime` | `60s` | Default `expiresAt` offset |

Duration knobs are read at runtime with the spec defaults as fallback, so a host without the stylesheet still gets the timers.

## Keyboard and screen reader

- `role="dialog"`, `aria-modal`, named by the title, described by the context list and the prompt. Focus: first digit cell on open (Deny in `choose` mode or when refused), Approve on match, Close on expiry; back to the trigger on close.
- Digit cells: `aria-label="Digit 1 of 2"`, `inputmode="numeric"`, `autocomplete="one-time-code"`, one character, auto-advance, Backspace moves back, paste distributes. Enter in a cell does nothing; after a match focus is already on Approve.
- Tab order: digits → Approve → Deny → This wasn't me. Escape denies (`user`) once armed. No key approves without focus on Approve.
- Polite live region (`approvalSheetAnnouncements`): "Number matches" · "That number does not match, one try left" · "10 seconds left" (once) · "Request expired. Nothing was approved." Never per second; the timer is `aria-live="off"`.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | Base UI Dialog in a portal; `AdaptiveSheetContent` gives a bottom sheet under `sm`. Its travel under reduced motion is the primitive's to fix | Origin gate, arming delay, timeout, retry limit, the three actions |
| SwiftUI | `.sheet` with `.interactiveDismissDisabled(true)`, `.keyboardType(.numberPad)`, haptic `.error` on a wrong match | Same; watchOS uses `choose` mode |
| Compose | `ModalBottomSheet` with `FLAG_SECURE`, `KeyboardType.NumberPassword` | Same |

## Security notes

- Never rendered inside web content. The browser extension requests it; the app or OS hosts it.
- Fully opaque; sits in the top layer; minimum `--c-approval-min-width`.
- `matching.expected`, `context`, and `origin` come from the signed request, not from anything a page could influence. Core copy names no product; the host's localization hook is still to come.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- Shipped: `@unicron/ui` 0.4.0, `@unicron/tokens` 0.2.0; subpath `@unicron/ui/security/approval-sheet`.

## Acceptance tests

**Vitest (jsdom, `approval-sheet.test.tsx`, 15 tests):** the seven below, plus `choose` mode counting tries, report calling `onReport` then closing, busy, error, the default tier by kind as a plain word, the forced-colors "Locked" word (class hook), reduced-motion 5 s steps.

1. Approve is `disabled` until the digits match; clicking it before then does nothing.
2. Within 500 ms of open, clicks on any action are ignored.
3. Two wrong entries call `onDeny("retries")` and close.
4. Past `expiresAt`, `onDeny("timeout")` fires, no approve control remains, Deny becomes Close.
5. `kind="device-code" origin="push"` renders no approve action; `origin="scan"` keeps it.
6. Escape calls `onDeny("user")`; Enter in the match input never calls `onApprove`.
7. The dialog's accessible description contains every `context` value.

**Still needs a browser:** screenshots (light and dark, each engine) of each `kind`, unmatched and matched, wrong, expired, refused, reduced motion, `prefers-contrast: more`, forced colors; the bottom-sheet breakpoint; focus return to the trigger through a real portal.
