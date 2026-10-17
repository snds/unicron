# 03 · Components

`@unicron/ui` ships shadcn/ui primitives (`base-nova` style) on Base UI, generated once by the
shadcn-material transform (icons swapped to Material Symbols Rounded) and then owned as source.
Import everything from the package root:

```tsx
import { Button, Dialog, DialogContent, Icon } from "@unicron/ui"
```

The family column is framework 09's taxonomy (nine categories, nine questions). `dsa` uses the
same families to decide whether a repeated composition is a **variant** (one family) or a
**pattern** (two or more families).

| Module | Exports | Family | Base |
|---|---|---|---|
| `button` | `Button`, `buttonVariants` | Action | Base UI Button |
| `toggle` | `Toggle`, `toggleVariants` | Action | Base UI Toggle |
| `toggle-group` | `ToggleGroup`, `ToggleGroupItem` | Action | Base UI ToggleGroup |
| `button-group` | `ButtonGroup`, `ButtonGroupText`, `ButtonGroupSeparator`, `buttonGroupVariants` | Action | div (useRender) |
| `input` | `Input` | Form | Base UI Input |
| `textarea` | `Textarea` | Form | textarea |
| `label` | `Label` | Form | label |
| `checkbox` | `Checkbox` | Form | Base UI Checkbox |
| `switch` | `Switch` | Form | Base UI Switch |
| `native-select` | `NativeSelect`, `NativeSelectOption`, `NativeSelectOptGroup` | Form | select |
| `input-group` | `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText`, `InputGroupInput`, `InputGroupTextarea` | Form | div |
| `field` | `Field`, `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldLabel`, `FieldContent`, `FieldTitle`, `FieldDescription`, `FieldSeparator`, `FieldError` | Form | div / fieldset |
| `tabs` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `tabsListVariants` | Navigation | Base UI Tabs |
| `dropdown-menu` | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` | Navigation | Base UI Menu |
| `spinner` | `Spinner` | Feedback | Icon (`progress_activity`) |
| `skeleton` | `Skeleton` | Feedback | div |
| `empty` | `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent` | Feedback | div |
| `sonner` | `Toaster` | Feedback | sonner (+ next-themes) |
| `avatar` | `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` | Data Display | Base UI Avatar |
| `badge` | `Badge`, `badgeVariants` | Data Display | span (useRender) |
| `item` | `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemHeader`, `ItemFooter`, `ItemGroup`, `ItemSeparator` | Data Display | div (useRender) |
| `kbd` | `Kbd`, `KbdGroup` | Data Display | kbd |
| `separator` | `Separator` | Layout | Base UI Separator |
| `scroll-area` | `ScrollArea`, `ScrollBar` | Layout | Base UI ScrollArea |
| `tooltip` | `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | Overlay | Base UI Tooltip |
| `dialog` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogActions`, `DialogAction`, `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogOverlay`, `DialogPortal` | Overlay | Base UI Dialog |
| `sheet` | `Sheet`, `SheetTrigger`, `SheetContent`, `AdaptiveSheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `SheetClose` | Overlay | Base UI Dialog |
| `command` | `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator` | Overlay (command palette; a known gap in the canonical 62, composed from Dialog + InputGroup + cmdk) | cmdk |
| `icon` | `Icon`, `IconName`, `IconProps`, `IconTone` | Content | svg + Material Symbols Rounded |
| `icon-button` | `IconButton`, `IconButtonProps` | Action | Tooltip + Button (or any `render`) |
| `chip` | `Chip`, `ChipAction`, `ChipRemove`, `ChipRemoveProps` | Data Display | span (useRender) + Base UI Button + IconButton |
| `security/code-display` | `CodeDisplay`, `CodeDisplayList`, `groupCode`, `spellCode`, `CodeDisplayProps` | Data Display | Item + IconButton + Badge + Button (spec: [code-display](specs/security/code-display.md)) |
| `security/large-type-view` | `LargeTypeView`, `classifyChar`, `nameChar`, `captionFor`, `spellValue`, `LargeTypeViewProps` | Overlay | SheetContent fullscreen + IconButton + Switch + Kbd (spec: [large-type-view](specs/security/large-type-view.md)) |
| `security/crown-jewel` | `CrownJewelSurface`, `CrownJewelMark`, `CrownJewelGate`, `useCrownJewel`, `CrownJewelProof` | Layout | section with a re-mapped tier + Icon + Badge + IconButton + Dialog (spec: [crown-jewel-treatment](specs/security/crown-jewel-treatment.md)) |
| `security/approval-sheet` | `ApprovalSheet`, `approvalSheetCopy`, `approvalSheetOriginCopy`, `approvalSheetAnnouncements`, `ApprovalSheetProps`, `ApprovalKind`, `ApprovalOrigin`, `ApprovalDenyReason`, `ApprovalMatching`, `ApprovalContextRow` | Overlay (security) | Sheet → AdaptiveSheetContent + Item + Input + DialogActions + RiskTierBadge |
| `security/risk-tier-badge` | `RiskTierBadge`, `riskTierCopy`, `riskTiers`, `riskTierUnverifiedAnnouncement`, `RiskTierBadgeProps`, `RiskTier`, `RiskTierState`, `RiskTierCopy` | Data Display (security) | `badgeVariants` + Icon + IconButton → Tooltip |
| `security/secret-field` | `SecretField`, `secretFieldAnnouncements`, `secretFieldErrors`, `spellSecret`, `SecretFieldProps`, `SecretFieldReadProps`, `SecretFieldEditProps`, `SecretFieldHost`, `SecretGate`, `SecretRevealMode`, `SecretFormat`, `SecretStrength` | Form (security) | Field + InputGroup + IconButton + Skeleton + Spinner |

Also exported: `cn` (clsx + tailwind-merge).

Not yet present (next candidates, in order of need across the three products): `card`,
`popover`, `select`, `combobox`, `radio-group`, `alert`, `alert-dialog`, `progress`, `accordion`,
`collapsible`, `table`, `slider`. Generate them with the transform (README → Regenerating
components) rather than hand-writing.

## Conventions the primitives share

- Every root element carries `data-slot="<name>"`; sub-parts carry `data-slot="<name>-<part>"`.
  Styling hooks and `dsa` both key on these.
- Variants are `cva` objects exported next to the component (`buttonVariants`) so patterns can
  reuse them without wrapping.
- Icons: pass `<Icon name="…" />` as a child; shadcn's `svg` sizing rules apply unchanged
  because `Icon` renders an `<svg>`. Mark leading/trailing icons with
  `data-icon="inline-start|inline-end"` to get the tightened padding.
- **Button** has three axes: `variant`, `size`, and `shape`.
  - `variant` adds `ghost-muted` and `ghost-destructive` to shadcn's six. `ghost-muted` is a quiet secondary action ("Add holidays and more"). `ghost-destructive` is a destructive action that shouldn't shout, like Delete in a dialog footer. The filled `destructive` is for the one action a dialog exists to confirm.
  - `shape="pill"` rounds the ends fully, for chips and filter rows. Text pills (`xs`, `sm`) get `px-3`, because the round ends eat into the padding.
  - A filter chip is a pill `Button` with `aria-pressed`: `secondary` when on, `ghost` when off, with an optional count in muted ink.
  - `size="inline"` is for a text action inside a line of text ("Your account needs you to **sign in again**"). It has no height, padding, or border of its own, so it sits on the sentence's baseline in its size. Pair it with `variant="link"`. A standalone text action keeps a normal size.
- **Icon** takes `tone="muted" | "destructive"` when it stands alone, outside a control. Inside a control, it inherits the control's ink, so leave `tone` off. App roles, such as an area's hue, stay in the app's own classes, because the core can't know them.
- **IconButton** is an icon-only control whose `label` becomes both its accessible name and its tooltip, so the two never drift apart. `tooltip` gives longer text, and `shortcut` adds a `Kbd`. `render` swaps the control: pass a `Toggle` for an on/off tool, or nest the IconButton in `DropdownMenuTrigger render={…}` to open a menu. Pass `icon`, or pass children to size or tint the glyph yourself.
- **Item** is a row: media, a title, a hint, and actions. Render it as the row's one control with `render={<a href… />}` or `render={<button type="button" />}`. Then it gets hover, `data-selected="true"` for the current row, and `disabled`. A row with separate controls inside stays a `div` and puts them in `ItemActions`.
- **Chip** is a pill holding a short value: a tag, a label, or a linked thing.
  - `variant` is `muted` (the default, for labels and values in forms), `secondary` (tags), or `outline` (a linked thing, like an event or a person).
  - `ChipAction` is its main action, such as opening what it stands for. It fills the chip edge to edge. Wrap long text in a `<span>` so it truncates.
  - `ChipRemove` takes it away. It's an `IconButton`: a × whose `label` ("Remove tag trip") is its name and its tooltip.
  - The chip's padding steps aside for both parts, so text, action, and × line up the same way in every chip.
  - A chip that filters a list is a pill `Button` (above), not a `Chip`.
- **DialogActions** is the dialog's actions as one row on every screen.
  - Each `DialogAction` takes a `kind`: `confirm`, `cancel`, or `destructive`.
  - From `sm` up, the actions are text buttons: confirm filled, cancel outlined, destructive a quiet `ghost-destructive` on the far left.
  - On phones, each action is a round 40px icon button (✓, ×, trash), the layout of Apple's sheet controls. Its words stay as its accessible name. `icon` overrides the glyph.
  - Use it when a dialog has a way to back out. A dialog with one action keeps a plain `DialogFooter` with a text button, because a lone ✓ says less than the words.
- **Menus are frosted glass** (`bg-popover/70` with a backdrop blur), by decision (2026-10-15). Don't override them to solid.
- **DialogTitle** lays a leading Back button out inline with the text, for dialogs with steps.
- **SheetContent `fullscreen`** covers the whole screen edge to edge and clears the status bar: a phone editor, like Mail's compose. An app can still move its bottom edge, for example above the keyboard.
- **Security components** live in `components/security/` and are also importable as `@unicron/ui/security/<name>`. Each follows its one-page spec under `docs/specs/security/`; the host's core does the cryptography and the component only ever receives short strings or a one-shot handle.
  - **CodeDisplay** shows a one-time code grouped for reading (6 → 3+3, 8 → 4+4, Steam 5 as one group), a ring for the time left, the `warning` state at 5 s, the next code at 10 s, and a copy that takes the next code in the last 3 s. HOTP has no ring; "Next code" calls `onAdvance`. Codes are exposed to assistive tech one character at a time ("4 8 2, 9 1 7"), never as a number. `CodeDisplayList` gives a list one shared live region.
  - **LargeTypeView** is a fullscreen sheet that shows a secret in groups of three, digits in `info`, letters in `foreground`, symbols in `warning`, with captions naming every symbol and every ambiguous glyph. It fits the width, hides after `lifetime` (120 s) and on window blur, and `print` renders the same layout inline as the recovery-kit page.
  - **CrownJewel** is three parts: `CrownJewelMark` (inline lock + sr-only word), `CrownJewelSurface` (re-maps `--background`, `--foreground`, `--muted`, `--border`, … onto `protected` for its subtree, the way `.dark` does, and flips nested SecretField, CodeDisplay and LargeTypeView into gated mode through `useCrownJewel()`), and `CrownJewelGate` (the "Confirm it's you" dialog at the `biometric` or `password` level, host-driven). The surface renders only when `host` is `app`, `os` or `extension-top-layer`.
- No component imports a `--g-*` token. Everything goes through tier 2 or tier 3.
- `AdaptiveSheetContent` is the one primitive that reads tier-3 knobs directly
  (`--c-sheet-*`): a bottom sheet under the `sm` breakpoint, a side panel above it.
  Its `wide` prop widens the side panel (`--c-sheet-wide-width`, 36rem) for content like a
  photo or a drawing; on phones it's the same bottom sheet. The panel never exceeds the
  viewport (`max-w-full`). Its `className` styles the inner scroll area, not the panel.

## Security components

Three of the six from Lockdown's brief §5.7 (specs under [`docs/specs/security/`](specs/security/README.md)). They are
components, not variants, because each owns behaviour no parent has. Every one renders only in the app, an OS
surface, or the extension's top-layer frame, never in web content; every tier, state and warning carries a word.

- **ApprovalSheet** ([spec](specs/security/approval-sheet.md)). Approve or deny a request from another device, agent,
  TV, or contact.
  - *Anatomy:* `approval-sheet` (AdaptiveSheetContent, modal) → header (Icon · SheetTitle · RiskTierBadge) · context
    (`Item` rows, `aria-describedby` of the dialog) · match (prompt + one `Input` cell per digit, or three pill Buttons
    in `choose` mode) · timer (ring + "58 s left") · notice (origin line, or the error) · actions (`DialogActions`:
    Approve · Deny · This wasn't me).
  - *Variants:* `kind` = `device` · `agent` · `device-code` · `contact-request` · `bridge` (icon, title, default tier);
    `origin` = `scan` · `pairing` · `push`; `matching.mode` = `enter` · `choose`, `digits` 2 or 3.
  - *States:* default (Approve disabled, inert for the 500 ms arming delay) · matched · wrong (cells clear, "1 try
    left") · busy · error · expired (Approve removed, Deny becomes Close, `onDeny("timeout")` fired) · denied / reported
    (one line, then `onOpenChange(false)`) · refused (`device-code` not from `scan`: no approve control in the DOM) ·
    reduced motion (ring in 5 s steps) · forced colors (track becomes a border, disabled Approve says "Locked").
  - *A11y:* `role="dialog"`, labelled by the title, described by the context list and the prompt. Tab order digits →
    Approve → Deny → This wasn't me. Escape denies (`user`). Enter never approves. Polite live region for "Number
    matches", "That number does not match, one try left", "10 seconds left", "Request expired. Nothing was approved."
  - *Tokens:* `popover`, `foreground`, `muted-foreground`, `border`, `primary`, `destructive`, `warning`, `font-mono`;
    `--c-approval-{min-width,digit-size,digit-gap,timer-track,timer-progress,timer-urgent,arm-delay,lifetime}`.
- **RiskTierBadge** ([spec](specs/security/risk-tier-badge.md)). One word for how much trust a path carries.
  - *Anatomy:* `risk-tier-badge` → pill (`badgeVariants`, `data-tier`) → icon (`aria-hidden`) · label (never omitted)
    · optional explain `IconButton` (help) whose tooltip and `aria-describedby` carry one sentence plus the manifest's
    `disclosures`.
  - *Variants:* `tier` = `standard` · `official` · `tolerated` (a closed union; people see **Built in** · **Verified** ·
    **Use with care** from the component-owned `riskTierCopy`); `size` = `sm` · `md`; `explain`.
  - *States:* default · explain open · loading (`verified` omitted: "Checking") · unverified (`verified={false}` or an
    unknown tier: `destructive` outline, "Unverified"; announced only when it appears after a check) · reduced motion
    (icon fill does not animate) · high contrast (1 px border in the tier ink, tint dropped, icon weight 600).
  - *A11y:* static text "Risk tier: Use with care. Our own bridge, opt-in." (visible word + sr-only parts); the explain
    control is a button named "What does Use with care mean?".
  - *Tokens:* `secondary`, `muted-foreground`, `foreground`, `info`, `warning`, `destructive`;
    `--c-risk-tier-{standard,official,tolerated}-{ink,bg}`, `--c-risk-tier-unverified-ink`, `--c-risk-tier-height-{sm,md}`.
- **SecretField** ([spec](specs/security/secret-field.md)). Use a hidden value without exposing it longer than the job
  takes.
  - *Anatomy:* `secret-field` (`data-mode="read|edit"`) → `Field` → `FieldLabel` · control (`InputGroup`: masked span
    with a fixed 12-dot mask or the revealed mono text, written to the DOM imperatively; `IconButton` reveal with
    `aria-pressed`; `IconButton` copy → countdown ring → check; `more` slot) · meter (edit only) · description / error.
  - *Variants:* `mode` = `read` · `edit`; `revealMode` = `hold` (default: pointer or Space held) · `toggle` (30 s
    auto-hide); `format` = `plain` · `groups-of-4` · `words`; `gate` = `none` · `biometric` · `password` (inside a
    `CrownJewelSurface` the surface's `requestProof` gates use and reveal instead); `mono`.
  - *States:* masked · loading · revealed (`warning` tint, lifetime running, one per document) · copying · cleared ·
    gated (lock glyph, busy while the host's gate runs) · error ("Couldn't read this field" + Retry) · edit (strength
    weak / fair / strong, always with the word) · disabled (edit only) · reduced motion (ring becomes "28 s") · high
    contrast (dots become the word "Hidden", "Shown" added, tint dropped).
  - *A11y:* `role="textbox" aria-readonly` named "Password, hidden"; revealed text spelled per character ("capital t,
    r, 4, dash") and not announced automatically; Cmd/Ctrl+C on the control runs the timed copy; the value is never
    selectable. Live region: "Password shown. Hides in 30 seconds." · "Copied. Clipboard clears in 30 seconds." ·
    "Clipboard cleared." · "Confirm it's you to show this."
  - *Host contract:* `getSecret(): Promise<Uint8Array>` (one-shot, zeroed after use) and `host.copy(bytes)` /
    `host.clear()` / `host.clipboardHolds?(hash)` / `host.gate?(kind)`. The value never enters React state as a string.
  - *Tokens:* `input`, `border`, `foreground`, `muted-foreground`, `ring`, `primary`, `destructive`, `warning`,
    `font-mono`; `--c-secret-field-{mask-count,reveal-lifetime,clipboard-timer,revealed-bg,copy-track,copy-progress,meter-weak,meter-fair,meter-strong,letter-spacing}`.
