# LargeTypeView

_Spec v0.2 · 2026-10-17 · Proposed by Lockdown (brief §5.7, §2.7 TV activation; D69 kit page) · Status: built in `@unicron/ui` 0.4.0 (PR #15); this spec describes the build_

## Purpose and the user job

A person has to read a secret across a room or type it into something without a keyboard: a TV remote, a console, a router's setup page, a friend's phone. The view shows the value full screen in large monospace glyphs, grouped in threes, with digits, letters, and symbols in different inks and ambiguous glyphs named underneath, and it hides itself after a while. The same layout, in print form, is the recovery kit page (D69). Lockdown opens it from Wi-Fi passwords, activation codes, the Secret Key, and recovery codes; Mailbird can open it for a locked note's key.

## Uniqueness check

Composes `Sheet` → `SheetContent fullscreen`, `IconButton`, `Button`, `Switch`, `Label`, `Kbd`, `Skeleton`, and the shared `useCopyCountdown` hook. It is not a SecretField variant: it has no field semantics and no edit mode, and its job is transcription rather than use. It owns character classification, grouping, captions, fit-to-width sizing, a lifetime, brightness and wake hooks, and a print layout.

## Anatomy

```
large-type-view                    SheetContent fullscreen, data-status; or <article data-variant="print">
├─ large-type-view-header          SheetTitle · SheetDescription (shoulder notice, then "Shown in large type. Press Escape to hide it.") · Close
├─ large-type-view-canvas          role="img", aria-label spelled; flex-wrap by group; select-none
│  └─ large-type-view-group × n    groupSize characters; 1 px border in high contrast
│     ├─ large-type-view-char      data-class="digit|letter|symbol": glyph (aria-hidden) · large-type-view-caption
│     └─ large-type-view-index     "1–3" when showIndex
├─ large-type-view-legend          swatch + word: digits · letters · symbols
├─ large-type-view-controls        Smaller − · Larger + · Captions Switch · Spell out · large-type-view-copy · large-type-view-timer · Kbd "Esc hides"
└─ large-type-view-live            polite live region
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `open`, `onOpenChange` | boolean (default `false`), callback | Controlled; Escape and Close go through `onOpenChange` |
| `getSecret` | `() => Promise<Uint8Array>` | One-shot; decoded, then the buffer is zeroed |
| `title` | string | What is being shown, never the value |
| `groupSize` | `3` (default) · `4` | 4 for card numbers and kit codes already grouped by the format |
| `captions` | `auto` (default) · `always` · `off` | `auto` names only ambiguous glyphs and every symbol |
| `caseSensitive` | boolean, default `true` | Adds "capital" and "lowercase" to letter captions |
| `showIndex` | boolean | Position ranges under groups, for long values |
| `lifetime` | seconds | Default `--c-large-type-lifetime` (120), read from the sheet when the value loads |
| `allowCopy` | boolean | Shows the copy control and enables `C` |
| `clipboardTimer` | seconds, default `30` | |
| `onCopy(bytes)` | `(Uint8Array) => void \| Promise` | The host's copy function; `navigator.clipboard` only in the pure web vault |
| `onClipboardClear` | callback | The countdown ran out |
| `onKeepAwake(on)`, `onBrightness(max)` | callbacks | Mobile: `true` on open, `false` on close |
| `gate` | `() => Promise<boolean>` | Re-run before "Show again"; inside a `CrownJewelSurface` the surface's `requestProof("reveal")` is used when omitted |
| `onExpire` | callback | The value was hidden: lifetime, blur, or hidden tab |
| `print` | boolean | Inline article, `foreground` ink only, captions `always`, no timer, no controls, title and date in the header |

Exports: `classifyChar`, `nameChar`, `captionFor`, `speakChar`, `groupValue`, `spellValue`.

**Inks.** Digits in `info`, letters in `foreground`, symbols in `warning`. Color is never the only cue: the mono font carries the slashed zero (`font-feature-settings: "zero"`) and distinct `l`/`1`/`I` forms, captions name every symbol and every ambiguous glyph, and the legend spells the mapping. Three inks on one surface is a deliberate exception to the one-hue rule; the hues carry meaning.

## States

| State (`data-status`) | What changes |
|---|---|
| `loading` | Skeleton groups, `aria-busy` |
| `shown` | Canvas filled; legend; timer "Hides in 1:58" |
| `expired` | Canvas replaced by "Hidden." and a "Show again" button, which re-runs the gate; timer "Hidden" |
| `error` | "Couldn't read this value" in `destructive`; canvas empty |
| captions on | Caption row under each glyph that has one |
| copied | Copy control shows the seconds; tooltip "Copied · clears in 30 s", then "Cleared" |
| reduced motion | Nothing to remove; no animation in this view |
| high contrast and forced colors | Inks collapse to `foreground`; captions forced on and the Switch disabled; groups get a 1 px border |
| print | Inks forced to `foreground`; captions on; 40 px glyphs; the host prints in light mode |

## Behavior and timing

- **Sizing.** Glyph size = canvas width ÷ (0.62 em per character + 0.1 em per in-group gap + 1.5 em per group gap), × 1.15 per size step, clamped between `--c-large-type-min-size` and `--c-large-type-max-size`. The − and + controls step from −4 to +4; the step persists per device in `localStorage` (`unicron:large-type:size-step`). Groups wrap whole through `flex-wrap`; a group is never split.
- **Lifetime.** Hides after `lifetime`, on window blur, and when the tab is hidden; `onExpire` fires. There is no lock hook: on lock the host sets `open={false}`. "Show again" re-runs the gate before fetching again.
- **Mobile.** `onBrightness(true)` and `onKeepAwake(true)` on open, `false` on close (the Aegis brightness-boost behavior).
- **Shoulder notice.** For 3 s after open the description reads "Anyone who can see your screen can read this."
- **Captions.** `auto` names `0`, `O`, `o`, `1`, `l`, `I`, `5`, `S`, `8`, `B`, `2`, `Z`, and every symbol; `always` names every character.
- **Copy.** `onCopy` gets the UTF-8 bytes; inside a `CrownJewelSurface` it first awaits `requestProof("use")`.

## Tokens

Tier 2: `background`, `foreground`, `muted-foreground`, `border`, `destructive`, `info`, `warning` (both shipped in `@unicron/tokens` 0.2.0), `font-mono`.

Tier 3 under `large-type`:

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

- `role="dialog"`, `aria-modal`, labelled by the title. Focus lands on Close, not the canvas, so nothing reads aloud by accident.
- The canvas is `role="img"` with one label spelled per character with case and symbol names, "pause" between groups: "capital T, r, 4, pause, dash, 9, lowercase l". Ambiguous digits are spoken as words ("zero"). Not a live region.
- "Spell out" reads one group every 1.5 s through the polite region, on request only.
- Keys: Escape closes; `+` or `=` and `-` or `_` resize; `C` copies when `allowCopy`; the captions Switch is a normal switch. Keys are ignored while an input has focus.
- Announcements: "Hides in 30 seconds" once, "Hidden.", and "Copied. Clipboard clears in 30 seconds."

## Platform notes

| Platform | Native | Spec still requires |
|---|---|---|
| Web and Tauri | `SheetContent fullscreen`; `ResizeObserver` for fit-to-width; `@media print` for the kit page | Fit-to-width, captions, lifetime, blur-hide |
| SwiftUI | `.fullScreenCover`; `UIScreen.main.brightness`; `isIdleTimerDisabled`; `.privacySensitive()`; `UIPrintInteractionController`. Dynamic Type is not applied to the canvas; `legibilityWeight` is honored | Same |
| Compose | Full-screen `Dialog`; `screenBrightness`; `FLAG_KEEP_SCREEN_ON`; `FLAG_SECURE`; `PrintManager` | Same |

## Security notes

- Never rendered inside web content. The browser extension opens the app instead.
- The canvas text is not selectable; copy goes through the timed path.
- Screen capture blocked where the OS allows; auto-hide on lifetime, blur, and hidden tab; the host closes it on lock.
- The buffer is zeroed after decoding; the decoded string lives in component state only while `shown` and is dropped on hide and close. The title never contains the value.

## Provenance and release

- DSA record: none: first principles, Lockdown brief §5.7.
- Shipped: `@unicron/ui` 0.4.0, `@unicron/tokens` 0.2.0; subpath `@unicron/ui/security/large-type-view`.

## Acceptance tests

**Vitest (jsdom, fake timers, `large-type-view.test.tsx`, 11 tests):** the six below, plus the classifier and namer, the wake and brightness hooks on open and close, the print variant (inline, every caption, no timer or controls), and the error state.

1. Every group holds at most `groupSize` characters, for 3 and 4. (Wrapping by whole groups is layout; jsdom cannot assert it.)
2. Each character carries `data-class` for its kind; in `auto`, every symbol and every ambiguous glyph has a caption, and `e` has none.
3. The canvas label spells the value per character with case and symbol names, pausing between groups.
4. Past `lifetime` the value is absent from the DOM, "Hidden." is announced, and "Show again" calls the gate when one is provided.
5. Window blur hides the value.
6. `C` calls `onCopy` only when `allowCopy`.

**Still needs a browser (Playwright viewport):** no group split across lines from 320 px up; the fit-to-width result and the − / + steps; screenshots of a mixed value (`Tr4-9lO0_bZ2`) at phone and desktop widths, captions `auto` and `always`, `groupSize` 4, expired, `print`, `prefers-contrast: more`, forced colors; blur within one frame.
