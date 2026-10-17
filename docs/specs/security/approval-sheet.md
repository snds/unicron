# ApprovalSheet

_Spec v0.1 · 2026-10-17 · Proposed by Lockdown (brief §5.7, `04-security.md` §10–§12) · Status: proposed_

## Purpose and the user job

A person is shown a request that came from somewhere else (a new device, an agent, a TV, a trusted contact) and must decide, with enough context to decide well, whether it was them. The sheet exists to resist approval fatigue: the person proves they are looking at the other screen by entering the number it shows, and "This wasn't me" is as easy to reach as "Approve".

One sheet serves every request kind, because they all reduce to "approve a sign-in I am being shown" (Lockdown brief §2.9 point 4).

## Uniqueness check

Composes `Sheet` → `AdaptiveSheetContent`, `Item` (context rows), `InputGroup` (digit cells), `Button`, `DialogActions`, `Icon`, and `RiskTierBadge`. It is a component rather than a `Dialog` variant because it owns behavior no parent has: an origin gate that can remove the approve control entirely, number matching that gates the confirm action, a timeout that denies by itself, a retry limit, an arming delay, and a third action kind (report) that `DialogActions` does not model. The Confirmation pattern prevents a local mistake; this authorizes a remote party, which is a different job with different anatomy.

## Anatomy

```
approval-sheet                      AdaptiveSheetContent, modal, top layer
├─ approval-sheet-header
│  ├─ approval-sheet-icon           Icon: devices · smart_toy · tv · group · extension
│  ├─ approval-sheet-title          "Approve a new device?"
│  └─ approval-sheet-tier           RiskTierBadge (official for device codes, tolerated for bridges)
├─ approval-sheet-context           Item rows: what · who · where · when; full domain for device codes
├─ approval-sheet-match
│  ├─ approval-sheet-match-prompt   "Enter the two digits shown on the other device"
│  ├─ approval-sheet-match-input    InputGroup, one cell per digit  (mode="enter")
│  └─ approval-sheet-match-choice   three pill Buttons               (mode="choose", watch and compact only)
├─ approval-sheet-timer             ring + "58 s left"
├─ approval-sheet-notice            origin line, or the error
└─ approval-sheet-actions           DialogActions: Deny (cancel) · Approve (confirm) · This wasn't me (report)
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `kind` | `device` · `agent` · `device-code` · `contact-request` · `bridge` | Sets icon, title template, and which context rows are required |
| `origin` | `scan` · `pairing` · `push` | `device-code` with `push` renders no approve control; a notice says why |
| `context` | `{ label, value, emphasis? }[]` | The host supplies real facts; the sheet never infers them |
| `matching` | `{ mode: "enter" \| "choose", digits: 2 \| 3, choices?: string[] }` | Digits come from the approval service, never from the UI |
| `expiresAt` | timestamp | Default lifetime 60 s |
| `tier` | see RiskTierBadge | |
| `busy`, `error` | boolean, string | |
| `onApprove`, `onDeny`, `onReport` | callbacks | `onDeny(reason)` with `user`, `timeout`, `retries`, `origin` |

## States

| State | What changes |
|---|---|
| default | Approve disabled; focus in the first digit cell; the sheet is inert for the arming delay |
| matched | Approve enabled; focus moves to Approve; `aria-live` says "Number matches" |
| wrong | Cells clear; notice reads "That number does not match. 1 try left." |
| busy | Spinner in Approve; cells and Deny disabled; Report stays enabled |
| error | Notice in `destructive` ink with a word, Approve disabled |
| expired | Timer reads "Expired"; Approve removed; Deny becomes Close; `onDeny("timeout")` already fired |
| denied / reported | One-line confirmation, then the sheet closes and focus returns to the trigger |
| disabled (origin refused) | No approve control in the DOM; notice: "Lockdown approves TV codes only when you scan the screen in front of you." |
| reduced motion | Ring updates in steps every 5 s; no slide, no shake |
| high contrast | Ring track becomes a solid border; disabled Approve shows a strike word "Locked" not only lower opacity |

## Behavior and timing

- **Arming delay.** For `--c-approval-arm-delay` (500 ms) after open, every action is inert and Approve is drawn where the pointer was not. A double click that opened the request cannot land on Approve.
- **Number matching.** `enter` mode is the default on every surface with a keyboard or a number pad. `choose` (three options) is for the watch and the compact extension popup only. Two digits by default; three where the host's threat model asks. A wrong entry clears the cells; after two wrong entries the sheet denies with reason `retries` and the host applies a cool-down.
- **Timeout.** At `expiresAt` the sheet denies with reason `timeout`. The timer turns to `warning` at 10 s left. Nothing auto-approves, ever.
- **Report.** "This wasn't me" denies, calls `onReport`, and the host revokes the requesting session, logs it, and offers follow-ups (rotate the password, review devices).
- **Rate limits** live in the host's approval service; the sheet only shows the resulting error.

## Tokens

Tier 2 used today: `popover`, `popover-foreground`, `foreground`, `muted-foreground`, `border`, `primary`, `primary-foreground`, `destructive`, `ring`, `font-mono`.

New tier 2 role needed: **`warning` / `warning-foreground`** (`{amber.500}` light, `{amber.400}` dark; foreground `{neutral.950}` in both). Shared with CodeDisplay and RiskTierBadge.

Tier 3 to add in `component.json` under `approval`:

| Token | Aliases | Purpose |
|---|---|---|
| `--c-approval-min-width` | `20rem` | Never smaller than this at any breakpoint |
| `--c-approval-digit-size` | `2rem` | Digit cell type size |
| `--c-approval-digit-gap` | `0.5rem` | |
| `--c-approval-timer-track` | `{border}` | |
| `--c-approval-timer-progress` | `{foreground}` | |
| `--c-approval-timer-urgent` | `{warning}` | Under 10 s |
| `--c-approval-arm-delay` | `500ms` | Inert window after open |
| `--c-approval-lifetime` | `60s` | Default `expiresAt` offset |

## Keyboard and screen reader

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title, `aria-describedby` the context list. Focus trap; focus returns to the trigger on close.
- On open, announced once: "Approve a new device? Lockdown on Sean's MacBook, Berlin, just now. Enter the two digits shown on the other device."
- Digit cells are `inputmode="numeric"`, one character each, auto-advance, Backspace moves back. Enter after a correct match moves focus to Approve; it does not approve.
- Tab order: digits → Approve → Deny → This wasn't me. Escape denies (reason `user`). No key approves without focus on Approve.
- `aria-live="polite"` for "Number matches", "That number does not match, one try left", "10 seconds left", and "Request expired. Nothing was approved." Never per-second announcements.

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | Base UI Dialog in a portal in the top layer; `AdaptiveSheetContent` gives bottom sheet under `sm` | Origin gate, arming delay, timeout, retry limit, the three actions |
| SwiftUI | `.sheet` with `.interactiveDismissDisabled(true)`, `.keyboardType(.numberPad)`, haptic `.error` on a wrong match | Same; watchOS uses `choose` mode |
| Compose | `ModalBottomSheet` with `FLAG_SECURE`, `KeyboardType.NumberPassword` | Same |

## Security notes

- Never rendered inside web content. The browser extension requests it; the app or OS hosts it.
- Fully opaque; sits in the top layer; minimum `--c-approval-min-width` by at least 12rem tall.
- The matching digits, context rows, and `origin` come from the signed request, not from props the page could influence.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- changeset: minor (`@unicron/ui`, `@unicron/tokens` for the new `warning` role and `approval.*` knobs).

## Acceptance tests

**Screenshot (light and dark, each web engine):** each `kind`; unmatched and matched; `wrong` with one try left; `expired`; `origin="push"` for `device-code`; `prefers-reduced-motion`; `prefers-contrast: more` and Windows forced colors.

**Playwright:**
1. Approve is `disabled` until the digits match; clicking it before then does nothing.
2. Within 500 ms of open, clicks on any action are ignored.
3. Two wrong entries call `onDeny("retries")` and close.
4. With a fake clock past `expiresAt`, `onDeny("timeout")` fires and no approve control remains.
5. `kind="device-code" origin="push"` renders no element with the approve action in the DOM.
6. Escape calls `onDeny("user")`; Enter in the match input never calls `onApprove`.
7. The dialog's accessible description contains every `context` value.
