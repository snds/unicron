# @unicron/tokens

## 0.5.0

### Minor Changes

- 7d1fdf4: Accent hues get text steps: `blue`, `coral`, `green` and `amber` each add a `600` for text in light mode and a `300` for text in dark mode, held by `scripts/contrast.mjs` to Lc 75 (reading text) on the page, the chrome and a selected row (`neutral.0`, `.50`, `.100`; `.950`, `.900`, `.800`). Apps draw these hues as text (an area's name, a status word, a link), and `500` / `400`, which are fills, read only Lc 32-67 there. Point an app's text roles at `600` / `300`; keep fills and dots on `500` / `400`. Additive: no existing step changes.

## 0.4.0

### Minor Changes

- c77e17b: Contrast is now checked the way Emphasis Engine checks it: every pair a component paints, through its own opacity (`bg-input/30`, `ring-ring/50`, `hover:bg-primary/80`, `bg-destructive/10`), held to its element kind's floor, APCA first. Reading text Lc 75 (APCA Bronze, under 16px); a label on a fill or tint Lc 60; solids Lc 30; control borders and focus 3:1 as drawn. `scripts/contrast.mjs` measures 101 recipes (73 gated, 28 reported) with no waivers left.
  
  What moves, so every recipe passes:
  
  - `--input` (control borders): `neutral.450` light (new step, 3.4:1), `white-alpha.35` dark (new step, 3.1:1). Was `neutral.200` / 15% white, about 1.3:1 and 1.5:1. Field and switch edges get visibly stronger.
  - `--muted-foreground` dark: `neutral.200` (Lc 86 on every surface). `neutral.300` read Lc 74 on `--muted` and `--accent`, under Bronze for the 12px `Kbd` and secondary text on selected rows.
  - `--destructive`: `red.600` light (new, Lc 84 as text, 73 on its 10% tint), `red.300` dark (new, Lc 76 as text, 70 on its 20% tint). Was Lc 47-70.
  - `--warning` light: `amber.400` (label Lc 71, was 59). `--info` dark: `blue.500` with white `--info-foreground` (Lc 72, was 52).
  - Components, one job per role: inactive tabs use `text-muted-foreground` in both modes (light used `text-foreground/60`, Lc 69); disabled fields fill with `bg-muted` instead of `bg-input/50`; the command palette's search field fills with `bg-muted`; the button-group divider is `bg-border`.
  
  The four contrast waivers from 0.3 are gone: their pairs pass. Expect screenshot baselines to shift for field borders, destructive text, dark muted text and status fills.

## 0.3.0

### Minor Changes

- 0cacf00: Core contrast fixes for #6, judged by APCA with WCAG 2 as the floor. `--muted-foreground` moves from `neutral.500` to `neutral.600` in light and from `neutral.400` to `neutral.300` in dark (Lc 74–87 on background, card, popover, sidebar, accent and muted; WCAG 6.7:1–12.6:1, was 4.05:1 on accent in light). `--ring` moves from `neutral.400` / `neutral.500` to `neutral.900` light / `neutral.100` dark, so the 50% ring the primitives draw clears Lc 30 (Lc 57–63 light, 33–36 dark; WCAG 3.4:1–4.7:1, was 1.5:1). `--sidebar-ring` follows `--ring`. New `scripts/contrast.mjs` runs in `pnpm test`: it resolves every tier-2 role from `dist/tokens.css`, measures the role pairs in both modes with the reference `apca-w3` package (devDependency), prints Lc and WCAG for each, and fails on an APCA floor miss. Floors are written up in `docs/02-tokens.md → Contrast`. Consumers: screenshot baselines shift wherever muted text or a focus ring is visible. Synapse can drop its `--muted-foreground` and `--ring` overrides.

### Patch Changes

- 7536674: New tier-3 knob `--c-dialog-titlebar-inset` (`dialog.titlebar-inset`, default `0px`): the height of an app's own title bar, which Dialog and Sheet popups keep clear of. No visual change at the default.

## 0.2.0

### Minor Changes

- 2dc0b50: `ApprovalSheet` (spec: `docs/specs/security/approval-sheet.md`): approve or deny a request from another device, agent, TV, or contact, with number matching. Approve stays disabled until the digits match; every action is inert for a 500 ms arming delay; two wrong entries deny with reason `retries`; at `expiresAt` (60 s by default) it denies with `timeout`; `kind="device-code"` approves only from `origin="scan"` and otherwise renders no approve control; "This wasn't me" is a third action that calls `onReport`. Tokens: `--c-approval-*` (min width, digit size and gap, timer track/progress/urgent, arm delay, lifetime). Also exported as `@unicron/ui/approval-sheet`.
- bc935b4: `CodeDisplay` (spec `docs/specs/security/code-display.md`): a one-time code grouped for reading (6 as 3+3, 8 as 4+4, Steam 5 as one group), a ring for the time left, the `warning` state at 5 s, the next code shown at 10 s, copy with the shared clipboard countdown that takes the next code in the last 3 s, HOTP with "Next code" and no ring, a clock-skew notice, a host `onHaptic` hook, and a digit-by-digit accessible label. `CodeDisplayList` shares one live region across a list. Tokens: the `code.*` knobs (`--c-code-size-*`, `--c-code-ring-*`, `--c-code-expiring-at`, `--c-code-next-at`, `--c-code-copy-next-at`, `--c-code-rollover-duration`, …). Also importable as `@unicron/ui/security/code-display`.
- bc935b4: CrownJewel treatment (spec `docs/specs/security/crown-jewel-treatment.md`): `CrownJewelMark` (inline lock plus sr-only "Crown jewel"), `CrownJewelSurface` (an inverted `protected` frame that re-maps `--background`, `--foreground`, `--card`, `--muted`, `--border`, … for its subtree, so nested primitives invert with no overrides; refuses to render unless `host` is `app`, `os` or `extension-top-layer`; flips nested SecretField, CodeDisplay and LargeTypeView into gated mode through the exported `useCrownJewel()` context `{ gated, requestProof }`), and `CrownJewelGate` (the "Confirm it's you" dialog at the `biometric` or `password` level, with the arming delay, host-driven `attemptsLeft`, `error` and `busy`). Tokens: the `crown-jewel.*` knobs (`--c-crown-jewel-surface`, `-ink`, `-muted`, `-muted-ink`, `-border`, `-icon-fill`, `-icon-wght`, `-reveal-lifetime`, `-gate-attempts`). Also importable as `@unicron/ui/security/crown-jewel`.
- bc935b4: `LargeTypeView` (spec `docs/specs/security/large-type-view.md`): a fullscreen sheet that shows a secret in groups of three (or four), digits in `info`, letters in `foreground`, symbols in `warning`, with captions naming every symbol and every ambiguous glyph, fit-to-width sizing with − / + steps, a 120 s lifetime, hide on window blur, "Spell out" through a polite live region, keep-awake and brightness host hooks, and a `print` variant that is the recovery-kit page. Tokens: the `large-type.*` knobs (`--c-large-type-min-size`, `--c-large-type-max-size`, `--c-large-type-*-ink`, `--c-large-type-lifetime`, …). Also importable as `@unicron/ui/security/large-type-view`.
- 2dc0b50: `RiskTierBadge` (spec: `docs/specs/security/risk-tier-badge.md`): a closed `tier` union (`standard` · `official` · `tolerated`) shown as plain words from the component-owned `riskTierCopy` map (**Built in** · **Verified** · **Use with care**), with one icon and one colour each. `verified` omitted reads "Checking"; `verified={false}` or an unknown tier renders `unverified`; `explain` adds a help control that lists the manifest's `disclosures`. Tokens: `--c-risk-tier-*` (inks and tints per tier, heights). Also exported as `@unicron/ui/risk-tier-badge`.
- 2dc0b50: `SecretField` (spec: `docs/specs/security/secret-field.md`): a hidden value with a one-shot `getSecret(): Promise<Uint8Array>` handle, a fixed 12-dot mask, hold-to-reveal by default (`revealMode="toggle"` for the 30 s auto-hide), hide on blur / tab hidden / lock / leaving the viewport, one revealed field per document, copy through `host.copy(bytes)` with a countdown and a clear that runs only while the clipboard still holds our value, a `gate` hook (prop or `SecretGateContext`), and an edit mode with the strength word. The value never enters React state as a string. Tokens: `--c-secret-field-*` (mask count, lifetimes, revealed tint, copy ring, meter steps, letter spacing). Also exported as `@unicron/ui/secret-field`.
- a0253d1: Three tier 2 roles for the security components (Lockdown brief §5.7, specs under `docs/specs/security/`): `warning` / `warning-foreground` (amber; expiring codes, approval timers, the tolerated tier), `info` / `info-foreground` (blue; the verified tier, large-type digits), and `protected` / `protected-foreground` (an inverted neutral surface for the crown-jewel treatment). Each swaps in `.dark` and is exposed to Tailwind as `bg-warning`, `text-info-foreground`, and so on. Existing roles are unchanged.

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
