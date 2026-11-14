# ApprovalSheet

_Spec v0.2 · 2026-10-17 · Proposed by Lockdown (brief §5.7, `04-security.md` §10–§12) · Status: built in `@unicron/ui` 0.4.0 (PR #16); this spec describes the build. v1.0 (2026-11-13) opens it in the review frame and adds the matching modes, the host's words and `dismiss`; the 1.0 section says what changed and wins where an older section disagrees_

## 1.0: the 2026-11 look (contract 5.1a, 5.1b row 51)

**The review frame** (Lockdown 40:1441 on a phone, 41:3394 on the desktop): a sheet from the bottom edge on a phone (square, `surface-raised`, a hairline on top, the 36 × 4 grabber, the sheet scrim), a 560 dialog from 600 wide, where every adaptive layer switches (the shared Dialog's `--c-dialog-review-min-width`, 24 clear of the screen on every side by `--c-dialog-margin`, `full` where the screen is narrower than the size; a hairline round it, the dialog scrim). No blur, no shadow. Header as Sheet Header (32:122): an overline with the time left ("Sign-in request // 01:40 left"; decisions §13: `MM:SS` past a minute, `NN s` up to it), the title in `type-lead`, a close float button (L on a phone, M wider). Under the header a 30-cell countdown rule that empties, critical in the last 20 s (`--c-approval-urgent-at`); the overline's words turn critical at 10 s, when the announcement is made. Then the facts as Field Rows (overline label, `type-code-inline` value, a rule on top; stacked on a phone), the trust tier as one more row, the match step, one sentence, and the footer: the no (secondary, with `close`) and the yes (primary) share the last line, the report action ("This wasn't me", critical text) apart on the left, or above them on a phone. The swap to overlays' `AdaptiveDialog` and `SheetHeader` is a frame change only.

| Prop | Values | Notes |
|---|---|---|
| `matching` | `{ mode: "enter" or "choose", digits, expected, choices? }` · `{ mode: "compare", code, prompt? }` · `{ mode: "none" }` | **compare**: the code this side shows, in `DigitGroups size="lg"`; the yes says "They match" and is live once armed; the no says "They don't match" and denies with `mismatch`. **none**: nothing to match (a passkey request on this device, a server to trust); the yes is live once armed. Focus never moves to the yes by itself in either |
| `title` | string | The request in its own words ("Steam on a Windows PC"). The frame's accessible name. Default: the kind's question |
| `overline` | string | Default by kind (`approvalSheetOverline`) |
| `note` | node | The one sentence. Default: the origin line |
| `approveLabel`, `approveIcon` | string, `IconName` | The yes, named by the gate's route ("Approve with Touch ID", `fingerprint-recognition`) |
| `denyLabel` | string | Default "Deny" ("They don't match" for compare) |
| `dismiss` | `deny` (default) · `keep` | What closing decides. `deny` is the behaviour before 1.0. `keep`: Escape, the close button and the scrim decide nothing; `onOpenChange(false)` only, and the request keeps waiting with the host (Lockdown brief A1) |

`ApprovalDenyReason` gains `mismatch`. Exported: `approvalSheetOverline`, `approvalSheetWords`, `approvalSheetComparePrompt`, `ApprovalNumberMatching`, `ApprovalCompareMatching`, `ApprovalNoMatching`.

Unchanged: the origin rule (a `device-code` from anything but `scan` renders no approve control in any mode), the arming delay on every action and on closing, the timeout that denies, two tries, Enter never approves, the DOM order Approve → Deny → This wasn't me, the announcements and the accessible description. The kind's icon is no longer drawn. Tokens added: `--c-approval-urgent-at`, `--c-review-sheet-top-gap` (the review widths are the shared Dialog's size knobs since 2026-11-14). Removed in 1.0 (no longer read): `--c-approval-timer-*`.

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
| `--c-approval-digit-gap` | `0.5rem` | |
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
