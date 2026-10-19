# @unicron/ui

## 0.13.0

### Minor Changes

- 8c134bf: `TabsList` takes `size="fill"`: the list takes its container's full height, so line tabs in a toolbar row taller than 32px center their labels with the controls beside them and keep the marker on the row's bottom border.

## 0.12.0

### Minor Changes

- 6882807: `CommandItemAction` is no longer a button inside the option. A `role="option"` has presentational children, and a focusable button inside one fails axe's `nested-interactive` (found by Synapse's accessibility run; Lockdown's palette uses the same part). The action is now drawn like an icon button but takes no focus and stays hidden from assistive tech, as before; a pointer clicks it, ⌘↵ / Ctrl+Enter runs it, and the item's description announces it. Hovering shows its label and keys as a native tooltip instead of the `Tooltip` popup. `CommandDialog` also takes `size` (`DialogContent`'s sizes, `sm` by default as before), so a palette with two-line results can be `lg` without a class override.

## 0.11.1

### Patch Changes

- eb65f9e: State styles match shadcn's: `styles/index.css` now defines shadcn's `data-open`, `data-closed`, `data-checked`, `data-unchecked`, `data-selected`, `data-disabled` and `data-active` variants, exactly as its own stylesheet does. Tailwind's built-in forms match an attribute with any value, and cmdk marks every item that isn't highlighted `data-selected="false"`, so every `CommandItem` drew highlighted at once. Now only the highlighted one does. The other variants still match Base UI's bare attributes and Radix's `data-state`, and also respect an explicit `"false"`.

## 0.11.0

### Minor Changes

- 8517ba9: `SheetContent size` gives a side sheet the dialog's widths (`sm` 24rem by default, `md`, `lg`, `xl` 42rem, `2xl` 48rem), so a size means the same width on a sheet as on a dialog. The header now keeps clear of the close button (a long title wraps before it, not under it), titles and descriptions wrap long words, and `SheetFooter` puts its actions in a row from `sm` up, right-aligned like `DialogFooter` (still stacked on phones). Found building Synapse's detail sheets, which needed five class overrides for these.

## 0.10.0

### Minor Changes

- 6a99aa4: `SheetContent backdrop={false}` leaves the dimming backdrop out, for a detail sheet beside a list. Pair it with `<Sheet modal={false} disablePointerDismissal>`: the list stays visible and clickable, picking another row changes what the sheet shows instead of closing it, and Escape or the close button still close it. The default is unchanged (backdrop drawn).

### Patch Changes

- 9d78100: Orientation styles work again. The generated components style orientation with `data-horizontal:` and `data-vertical:`, as shadcn's own stylesheet defines them, but Unicron's stylesheet never defined those variants and Base UI only sets `data-orientation`. So those classes matched nothing: a line tab's active marker, a separator's 1px size, the scroll area's bars, the button group's separator and the field description's balance all drew at zero size or not at all. `styles/index.css` now maps both to `data-orientation`, exactly as shadcn does, and a test pins it. Line tabs also preview the marker at 40% on hover, so hover reads as more than a text color change. Expect screenshot baselines to shift where these appear.

## 0.9.0

### Minor Changes

- 023c1f6: `CodeDisplay` gains SecretField's copy reference. Additive: a host that resolves `onCopy` with nothing and passes `onClipboardClear()` keeps working.
  
  - `onCopy` may resolve with `{ hash }` (`CodeDisplayCopyRef`, the same shape as `SecretFieldCopyRef`). The component keeps it for that copy; a later copy restarts the countdown and supersedes it.
  - `clipboardHolds?(hash)`, the same signature as `SecretFieldHost.clipboardHolds`, is asked at the countdown's end. `false` (or a rejection) skips the clear and ends the countdown without "Cleared".
  - `onClipboardClear(ref?)` receives the reference of the copy whose countdown ended and may resolve `true` (cleared) or `false` (left the clipboard alone).
  - "Cleared" (check, sr-only word, tooltip, and the live region's "Clipboard cleared.") is said only when `clipboardHolds` answered yes or `onClipboardClear` resolved `true`. A host whose `onClipboardClear` returns nothing and passes no `clipboardHolds` now sees the countdown end without "Cleared"; resolve `true` when your clear ran to keep the word.
  - `codeDisplayAnnouncements` exports the live-region texts. In a `CodeDisplayList` each row's reference reaches its own callbacks through the one shared live region.

## 0.8.1

### Patch Changes

- Updated dependencies [b3684f2]
  - @unicron/tokens@0.7.0

## 0.8.0

### Minor Changes

- f00ae3d: Desktop host-contract gaps, slice 4. All additive; existing props, sizes and defaults are unchanged.
  
  - `SecretField` edit mode: `multiline` (with `rows`, default 4) is a textarea for a secret over several lines (a private key, a recovery phrase). It keeps line breaks, stays masked until Show (`-webkit-text-security`, or transparent ink where an engine lacks it), and blocks copy, cut and drag while masked. Edit mode also takes `name`, `required` (native, plus `aria-required`) and `onBlur`, so the browser's form check and form libraries see the field. A host drawing its own masked `Textarea` can switch to `<SecretField mode="edit" multiline … />`.
  - `secretStrengthFromScore(score)` maps a zxcvbn-style 0–4 guess score to `weak` (0–2), `fair` (3) or `strong` (4). The field still never estimates: the estimate belongs in the host's core.
  - `CommandItemAction` (`label`, `icon`, `onAction`, `disabled`) is a second action on a `CommandItem`. A click never selects the item; ⌘↵ (Ctrl+Enter off Apple platforms) runs the highlighted item's action through `Command`; the item is described by the action and its key and carries `aria-keyshortcuts`. A host that handles ⌘↵ itself (with `preventDefault`) keeps doing so.
  - `Command match="keywords"` matches an item that has `keywords` on those alone, so an item keyed by an id is not found by the id's letters; the default (`match="value"`) is cmdk's filter, unchanged. `CommandItem`'s `value` and `keywords` are now documented.
  - `Skeleton variant="row"`: one full-width list row, `--c-skeleton-row-height` tall (new token, 2.5rem). An app with a density setting re-maps that one knob.
  - `DialogContent` `size`: the names are product sizes, not Tailwind's steps (`xl` is `max-w-2xl`); the mapping is documented and pinned by tests, not changed.

### Patch Changes

- Updated dependencies [f00ae3d]
  - @unicron/tokens@0.6.0

## 0.7.1

### Patch Changes

- Updated dependencies [7d1fdf4]
  - @unicron/tokens@0.5.0

## 0.7.0

### Minor Changes

- c77e17b: Contrast is now checked the way Emphasis Engine checks it: every pair a component paints, through its own opacity (`bg-input/30`, `ring-ring/50`, `hover:bg-primary/80`, `bg-destructive/10`), held to its element kind's floor, APCA first. Reading text Lc 75 (APCA Bronze, under 16px); a label on a fill or tint Lc 60; solids Lc 30; control borders and focus 3:1 as drawn. `scripts/contrast.mjs` measures 101 recipes (73 gated, 28 reported) with no waivers left.
  
  What moves, so every recipe passes:
  
  - `--input` (control borders): `neutral.450` light (new step, 3.4:1), `white-alpha.35` dark (new step, 3.1:1). Was `neutral.200` / 15% white, about 1.3:1 and 1.5:1. Field and switch edges get visibly stronger.
  - `--muted-foreground` dark: `neutral.200` (Lc 86 on every surface). `neutral.300` read Lc 74 on `--muted` and `--accent`, under Bronze for the 12px `Kbd` and secondary text on selected rows.
  - `--destructive`: `red.600` light (new, Lc 84 as text, 73 on its 10% tint), `red.300` dark (new, Lc 76 as text, 70 on its 20% tint). Was Lc 47-70.
  - `--warning` light: `amber.400` (label Lc 71, was 59). `--info` dark: `blue.500` with white `--info-foreground` (Lc 72, was 52).
  - Components, one job per role: inactive tabs use `text-muted-foreground` in both modes (light used `text-foreground/60`, Lc 69); disabled fields fill with `bg-muted` instead of `bg-input/50`; the command palette's search field fills with `bg-muted`; the button-group divider is `bg-border`.
  
  The four contrast waivers from 0.3 are gone: their pairs pass. Expect screenshot baselines to shift for field borders, destructive text, dark muted text and status fills.
- 698f28a: Security components close the host-contract gaps a desktop host found, all additive. `SecretField`: `host.copyRef()` copies by reference, so a host that copies in its own process never gets the bytes for a copy (its `{ hash }` goes to `clipboardHolds`; no hash means an unconditional clear, and the tooltip says so); `SecretFieldReferenceHost` lets such a host leave out `copy`; `errorText` (a string, or a function given the rejection and `"read"` / `"copy"`) replaces "Couldn't read this field"; a gated reveal (a `gate`, or inside a `CrownJewelSurface`) is always a tap with the lifetime, because the check takes focus and ends any hold, so drop any `revealMode="toggle"` you forced inside a crown jewel. `CrownJewelSurface` and `CrownJewelGate` take `biometricName={null}` for a device with no biometric; `crownJewelGateErrors` exports the gate's sentences for a host whose core judges the proof at call time (pattern in the spec). `CodeDisplay`: a rejected `onCopy` starts no countdown, copy waits while an HOTP advance is pending, and a host that copies by id may ignore `onCopy`'s `value`.

### Patch Changes

- 72116f8: `IconButton`: `disabled` now disables the control itself (the default `Button`, or whatever `render` passes), not only its tooltip. Base UI's `TooltipTrigger` reads `disabled` as "don't open the tooltip" and never sets it on the element, so a disabled `IconButton` used to stay clickable and was drawn enabled.
- Updated dependencies [c77e17b]
  - @unicron/tokens@0.4.0

## 0.6.0

### Minor Changes

- eb87511: `DialogContent` takes `size` (`sm` default, `md`, `lg`, `xl`, `2xl`) for how wide it grows from `sm` up, and every dialog now scrolls inside itself when it's taller than the screen (`max-h-[calc(100dvh-2rem)] overflow-y-auto`). `ItemMain` is a row's main action when the row also has buttons of its own: it holds the media and content, its target covers the whole row (hover and focus ring included), and `ItemActions` stay on top as separate controls.

## 0.5.0

### Minor Changes

- 7536674: `DialogContent`, `SheetContent`, `AdaptiveSheetContent` and `CommandDialog` take `beforeContent`, a slot rendered in the portal between the backdrop and the popup. A desktop app with the native title bar hidden puts its window drag strip there (`<div aria-hidden className="fixed inset-x-0 top-0 z-50 h-13" data-tauri-drag-region="deep" />`), so the window still moves while a dialog, sheet or the command palette is open; a press on the strip does not dismiss. The popups now read `--c-dialog-titlebar-inset` (0px by default, so nothing moves): a dialog centres in the area below it, a side or top sheet starts under it (docs/05-consuming.md → Desktop title bar).

### Patch Changes

- 0cacf00: `Toggle` and `ToggleGroupItem` draw the pressed state as the primary fill (`bg-primary text-primary-foreground`) instead of `bg-muted`, which measured about Lc 8 / 1.1:1 against the page (#6). The pressed item now measures Lc 96+ / 17:1 against the page and the unpressed item in both modes. `aria-pressed` and `data-[state=on]` are unchanged. The change lives in `tools/shadcn-material/overrides.json`, so `pnpm regen` keeps it. Consumers: screenshot baselines shift for pressed toggles; Synapse can drop its `data-pressed:bg-primary data-pressed:text-primary-foreground` override on severity filters.
- 6711844: `SecretField` inside a `CrownJewelSurface` now reads `--c-crown-jewel-reveal-lifetime` (20 s) for its reveal lifetime instead of its own `--c-secret-field-reveal-lifetime` (30 s). An explicit `revealLifetime` prop still wins. Closes the open item in `docs/specs/security/crown-jewel-treatment.md`.
- 137bf59: `SecretField`: a reveal whose `getSecret` resolves after the loading render has committed (any host that fetches over a bridge) no longer falls back to masked. The value span stays mounted while loading, with the skeleton drawn inside it. Found by the Lockdown desktop; its pnpm patch can be dropped.
- Updated dependencies [0cacf00]
- Updated dependencies [7536674]
  - @unicron/tokens@0.3.0

## 0.4.0

### Minor Changes

- 2dc0b50: `ApprovalSheet` (spec: `docs/specs/security/approval-sheet.md`): approve or deny a request from another device, agent, TV, or contact, with number matching. Approve stays disabled until the digits match; every action is inert for a 500 ms arming delay; two wrong entries deny with reason `retries`; at `expiresAt` (60 s by default) it denies with `timeout`; `kind="device-code"` approves only from `origin="scan"` and otherwise renders no approve control; "This wasn't me" is a third action that calls `onReport`. Tokens: `--c-approval-*` (min width, digit size and gap, timer track/progress/urgent, arm delay, lifetime). Also importable as `@unicron/ui/security/approval-sheet`.
- bc935b4: `CodeDisplay` (spec `docs/specs/security/code-display.md`): a one-time code grouped for reading (6 as 3+3, 8 as 4+4, Steam 5 as one group), a ring for the time left, the `warning` state at 5 s, the next code shown at 10 s, copy with the shared clipboard countdown that takes the next code in the last 3 s, HOTP with "Next code" and no ring, a clock-skew notice, a host `onHaptic` hook, and a digit-by-digit accessible label. `CodeDisplayList` shares one live region across a list. Tokens: the `code.*` knobs (`--c-code-size-*`, `--c-code-ring-*`, `--c-code-expiring-at`, `--c-code-next-at`, `--c-code-copy-next-at`, `--c-code-rollover-duration`, …). Also importable as `@unicron/ui/security/code-display`.
- bc935b4: CrownJewel treatment (spec `docs/specs/security/crown-jewel-treatment.md`): `CrownJewelMark` (inline lock plus sr-only "Crown jewel"), `CrownJewelSurface` (an inverted `protected` frame that re-maps `--background`, `--foreground`, `--card`, `--muted`, `--border`, … for its subtree, so nested primitives invert with no overrides; refuses to render unless `host` is `app`, `os` or `extension-top-layer`; flips nested SecretField, CodeDisplay and LargeTypeView into gated mode through the exported `useCrownJewel()` context `{ gated, requestProof }`), and `CrownJewelGate` (the "Confirm it's you" dialog at the `biometric` or `password` level, with the arming delay, host-driven `attemptsLeft`, `error` and `busy`). Tokens: the `crown-jewel.*` knobs (`--c-crown-jewel-surface`, `-ink`, `-muted`, `-muted-ink`, `-border`, `-icon-fill`, `-icon-wght`, `-reveal-lifetime`, `-gate-attempts`). Also importable as `@unicron/ui/security/crown-jewel`.
- bc935b4: `LargeTypeView` (spec `docs/specs/security/large-type-view.md`): a fullscreen sheet that shows a secret in groups of three (or four), digits in `info`, letters in `foreground`, symbols in `warning`, with captions naming every symbol and every ambiguous glyph, fit-to-width sizing with − / + steps, a 120 s lifetime, hide on window blur, "Spell out" through a polite live region, keep-awake and brightness host hooks, and a `print` variant that is the recovery-kit page. Tokens: the `large-type.*` knobs (`--c-large-type-min-size`, `--c-large-type-max-size`, `--c-large-type-*-ink`, `--c-large-type-lifetime`, …). Also importable as `@unicron/ui/security/large-type-view`.
- 2dc0b50: `RiskTierBadge` (spec: `docs/specs/security/risk-tier-badge.md`): a closed `tier` union (`standard` · `official` · `tolerated`) shown as plain words from the component-owned `riskTierCopy` map (**Built in** · **Verified** · **Use with care**), with one icon and one colour each. `verified` omitted reads "Checking"; `verified={false}` or an unknown tier renders `unverified`; `explain` adds a help control that lists the manifest's `disclosures`. Tokens: `--c-risk-tier-*` (inks and tints per tier, heights). Also importable as `@unicron/ui/security/risk-tier-badge`.
- 2dc0b50: `SecretField` (spec: `docs/specs/security/secret-field.md`): a hidden value with a one-shot `getSecret(): Promise<Uint8Array>` handle, a fixed 12-dot mask, hold-to-reveal by default (`revealMode="toggle"` for the 30 s auto-hide), hide on blur / tab hidden / lock / leaving the viewport, one revealed field per document, copy through `host.copy(bytes)` with a countdown and a clear that runs only while the clipboard still holds our value, a `gate` hook (`SecretFieldHost.gate`, or the surrounding `CrownJewelSurface`), and an edit mode with the strength word. The value never enters React state as a string. Tokens: `--c-secret-field-*` (mask count, lifetimes, revealed tint, copy ring, meter steps, letter spacing). Also importable as `@unicron/ui/security/secret-field`.

### Patch Changes

- Updated dependencies [2dc0b50]
- Updated dependencies [bc935b4]
- Updated dependencies [bc935b4]
- Updated dependencies [bc935b4]
- Updated dependencies [2dc0b50]
- Updated dependencies [2dc0b50]
- Updated dependencies [a0253d1]
  - @unicron/tokens@0.2.0

## 0.3.0

### Minor Changes

- 8f6617a: New, all additive (existing defaults unchanged), from Mailbird's raw-button sweep (Mailbird ADR-0057):
  
  - `Item` rendered as a button (`render={<button />}`) gets the hover a link already had, plus `data-selected="true"` and `disabled` states. Rows that were plain `<button>`s can move to `Item` without overrides.
  - `Button size="inline"`: a text action inside a sentence, with no box of its own. Pair it with `variant="link"`.
  - `Chip`, `ChipAction`, `ChipRemove`: a pill for a tag, label, or linked thing, with an optional main action and a × that says what it removes.

## 0.2.0

### Minor Changes

- 9916b79: New, all additive (existing defaults unchanged), from Mailbird's first dsa pass:
  
  - `IconButton`: an icon-only control whose `label` is both its accessible name and its tooltip; `tooltip`, `shortcut` (as `Kbd`), and `render` (a `Toggle`, or nest it in a menu trigger).
  - `DialogActions` + `DialogAction kind="confirm" | "cancel" | "destructive"`: one row of actions. On phones it's a row of round 40px icon buttons (✓, ×, and a tinted trash can on the far left), and the corner close hides when the row has a Cancel. From `sm` up it's text buttons.
  - `Button shape="pill"` (text pills get `px-3`), plus `variant="ghost-muted"` and `"ghost-destructive"`.
  - `Icon tone="muted" | "destructive"`.
  - `SheetContent fullscreen`, for full-screen phone editors.
  - `DialogTitle` lays a leading Back button out inline.

## 0.1.0

### Minor Changes

- 4d46001: First versioned release (0.1.0) of both packages, replacing the git submodule consumers used
  during week one.
  
  - `@unicron/tokens`: ships `dist/tokens.css` + `dist/tokens.json`, the DTCG sources and
    `examples/app-extension.css`. Token lint now enforces that tiers 2 and 3 alias lower tiers: the
    dark `border` / `input` values (`oklch(1 0 0 / 10%)`, `oklch(1 0 0 / 15%)`) moved into two new
    global tokens, `--g-white-alpha-10` / `--g-white-alpha-15`, and `sheet.handle` references
    `{muted-foreground}` instead of a raw `var()`. Emitted CSS values are unchanged.
  - `@unicron/ui`: publishable build (`dist/` only, with `.d.ts`). `@unicron/ui/styles` now
    resolves to `dist/styles/index.css`; per-component subpaths (`@unicron/ui/button`,
    `@unicron/ui/icon`) are exported alongside the root.

### Patch Changes

- Updated dependencies [4d46001]
  - @unicron/tokens@0.1.0
