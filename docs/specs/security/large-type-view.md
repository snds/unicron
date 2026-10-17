# LargeTypeView

_Spec v0.1 · 2026-10-17 · Proposed by Lockdown (brief §5.7, §2.7 TV activation; D69 kit page) · Status: proposed_

## Purpose and the user job

A person has to read a secret across a room or type it into something without a keyboard: a TV remote, a console, a router's setup page, a friend's phone. The view shows the value full screen in large monospace glyphs, grouped in threes, with digits, letters, and symbols in different inks and ambiguous glyphs named underneath, and it hides itself after a while. The same layout, in print form, is the recovery kit page (D69). Lockdown opens it from Wi-Fi passwords, activation codes, the Secret Key, and recovery codes; Mailbird can open it for a locked note's key.

## Uniqueness check

Composes `Sheet` → `SheetContent fullscreen`, `IconButton`, `Switch`, `Kbd`, and the copy-with-timer behavior from SecretField. It is not a SecretField variant: it has no field semantics and no edit mode, and its job is transcription rather than use. It owns character classification, grouping, captions, fit-to-width sizing, a lifetime, brightness and wake handling on mobile, and a print layout.

## Anatomy

```
large-type-view                    SheetContent fullscreen, or a print page
├─ large-type-view-header          title "Wi-Fi password · Home" · close
├─ large-type-view-canvas          fit-to-width, wraps by group
│  └─ large-type-view-group × n    3 characters per group
│     └─ large-type-view-char      glyph · caption ("zero", "capital O", "dash") · optional index
├─ large-type-view-legend          swatch + word: digits · letters · symbols
├─ large-type-view-controls        size − / + · captions Switch · copy · Spell out
└─ large-type-view-timer           "Hides in 1:58"
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `getSecret` | `() => Promise<Uint8Array>` | One-shot, as SecretField |
| `title` | string | What is being shown, never the value |
| `groupSize` | `3` (default) · `4` | 4 for card numbers and kit codes already grouped by the format |
| `captions` | `auto` · `always` · `off` | `auto` names only ambiguous glyphs and every symbol |
| `caseSensitive` | boolean, default `true` | Adds "capital" and "lowercase" to letter captions |
| `showIndex` | boolean | Position numbers under groups, for long values |
| `lifetime` | seconds, default `120` | TV transcription takes longer than a reveal |
| `allowCopy` | boolean | Copy uses the clipboard timer |
| `print` | boolean | Black on white, captions on, no timer, no controls |

**Inks.** Digits in `info`, letters in `foreground`, symbols in `warning`. Color is never the only cue: the mono font carries the slashed zero and distinct `l`/`1`/`I` forms, captions name every symbol and every ambiguous glyph, and the legend spells the mapping. The tradeoff is three inks on one surface against the "one hue per surface" rule; the view is a special surface and the hues carry meaning, not decoration.

## States

| State | What changes |
|---|---|
| default | Canvas filled; timer running |
| captions on | Caption row under each group |
| copied | Copy control runs the shared countdown |
| expired | Canvas cleared; "Hidden. Show again" button (re-runs the gate if there is one) |
| loading | Skeleton groups |
| error | "Couldn't read this value" in `destructive`; canvas empty |
| disabled | n/a; the view is modal and closes |
| reduced motion | Nothing to remove; no animation in this view |
| high contrast | All inks collapse to `foreground`; captions forced on; group boxes get a 1px solid border |
| print | White page, `foreground` ink only, captions on, title and date in the header |

## Behavior and timing

- **Sizing.** Fit the longest line to the canvas width between `--c-large-type-min-size` and `--c-large-type-max-size`; wrap whole groups, never split one. The − and + controls step through the range; the choice persists per device.
- **Lifetime.** Hides after `lifetime`, on window blur, and on lock. Showing again re-runs the host's gate for gated values.
- **Mobile.** Raise screen brightness to maximum and keep the screen awake while shown; restore on close (the Aegis brightness-boost behavior for QR transfer).
- **Shoulder notice.** For 3 s after open, a line reads "Anyone who can see your screen can read this." The person chose to show it; the notice is the only friction.
- **Captions.** `auto` names `0`, `O`, `o`, `1`, `l`, `I`, `5`, `S`, `8`, `B`, `2`, `Z`, and every symbol; `always` names every character.

## Tokens

Tier 2 used today: `background`, `foreground`, `muted-foreground`, `border`, `destructive`, `font-mono`.

New tier 2 roles needed: **`info`** and **`warning`** (shared with RiskTierBadge, CodeDisplay, ApprovalSheet).

Tier 3 to add under `large-type`:

| Token | Aliases | Purpose |
|---|---|---|
| `--c-large-type-min-size` | `2.5rem` | |
| `--c-large-type-max-size` | `6rem` | |
| `--c-large-type-group-gap` | `1.5em` | |
| `--c-large-type-char-gap` | `0.1em` | |
| `--c-large-type-digit-ink` | `{info}` | |
| `--c-large-type-letter-ink` | `{foreground}` | |
| `--c-large-type-symbol-ink` | `{warning}` | |
| `--c-large-type-caption-ink` | `{muted-foreground}` | |
| `--c-large-type-caption-size` | `0.75rem` | |
| `--c-large-type-lifetime` | `120s` | |

## Keyboard and screen reader

- `role="dialog"`, `aria-modal`, labelled by the title. Focus lands on the close control, not the canvas, so nothing reads aloud by accident.
- The canvas is one `aria-label` spelled per character with case and symbol names, grouped with "pause": "capital T, r, 4, pause, dash, 9, lowercase l". It is not a live region.
- "Spell out" is a button; it reads the value through a polite live region one group at a time, on request only.
- Keys: Escape closes; `+` and `-` resize; `C` copies when `allowCopy`; the captions Switch is a normal switch.
- Timer announcements: "Hides in 30 seconds" once, then "Hidden."

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | `SheetContent fullscreen`; `@media print` stylesheet for the kit page | Fit-to-width, captions, lifetime, blur-hide |
| SwiftUI | `.fullScreenCover`; `UIScreen.main.brightness`; `isIdleTimerDisabled`; `.privacySensitive()`; `UIPrintInteractionController`. Dynamic Type is not applied to the canvas (it is already large type); `legibilityWeight` is honored | Same |
| Compose | Full-screen `Dialog`; `screenBrightness`; `FLAG_KEEP_SCREEN_ON`; `FLAG_SECURE`; `PrintManager` | Same |

## Security notes

- Never rendered inside web content. The browser extension opens the app instead.
- The canvas text is not selectable; copy goes through the timed path.
- Screen capture blocked where the OS allows; auto-hide on lifetime, blur, and lock.
- The value comes from a one-shot handle and is zeroed on close; the title never contains the value.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- changeset: minor (`@unicron/ui`; `@unicron/tokens` for `large-type.*`, `info`, and `warning`).

## Acceptance tests

**Screenshot (light and dark, each web engine):** a mixed value (`Tr4-9lO0_bZ2`) at phone and desktop widths; captions `auto` and `always`; `groupSize` 4; expired; `print`; `prefers-contrast: more`; forced colors.

**Playwright:**
1. Every group contains at most `groupSize` characters, and no group is split across lines at any viewport from 320 px up.
2. Each digit, letter, and symbol carries `data-class` matching its kind; in `auto`, every symbol and every ambiguous glyph has a caption, and `e` has none.
3. The canvas `aria-label` spells the value per character with case and symbol names.
4. With a fake clock past `lifetime`, the canvas is empty and the value is absent from the DOM; "Show again" calls the gate when one is provided.
5. Window blur hides the value within one frame.
6. `C` calls `onCopy` only when `allowCopy`.
