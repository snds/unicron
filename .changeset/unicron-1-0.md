---
"@unicron/tokens": major
"@unicron/ui": major
---

Unicron 1.0: the 2026-11 design direction, read from the Figma file `Unicron / Components` and the four app files. Four app themes on two grounds, Geist and Geist Mono, IBM Carbon icons, a square 2px corner, flat solid surfaces, and the shells, rows, chat and security parts the four apps share. Everything below breaks something an app built on 0.x does. The component reference is `docs/03-components.md`; the token reference is `docs/02-tokens.md`.

**Do first**

1. Icons are IBM Carbon, drawn as inline SVG. Run `npx unicron-codemod icons <src> --dry`, read its report, then run it once without `--dry`, and fix what `tsc` reports. `Icon` lost `fill`, `weight`, `grade` and `opticalSize`; `IconButton` lost `fill`; `Spinner` takes svg props. Remove the `material-symbols` dependency and any `--c-icon-*` use. Names that arrive as data (a server, a saved template) go through `iconFromMaterial()` once. Details: `docs/05-consuming.md` section 4a and `codemod/MAPPING.md`.
2. Set the app on `<html>`: `data-theme="warpcore" | "vale" | "lockdown" | "synapse"`. The ground is still the `dark` class (graphite) or none (stone).
3. Move the shell to the new frame parts (the table under "Shell").

**Tokens (`@unicron/tokens`)**

- Roles are named as in Figma (`surface-ground`, `surface-raised`, `line-rule`, `text-body`, `text-secondary`, `text-label`, `text-faint`, `primary-fill`, `primary-on-fill`, `primary-text`, `primary-soft`, `secondary-live`, `needs-you-fill`, `critical-*`). The shadcn names stay as aliases, with new meanings: `primary` is the app's identity fill, not an ink; `muted`, `secondary`, `card` and `popover` are one colour (`surface-raised`); `sidebar` is the page ground; `input` is a hairline and no longer holds 3:1; `ring` is the body ink.
- `--radius` and every `--radius-*` step are 2px (were 10px and a scale). `rounded-full` is no longer a control shape; marks are squares.
- Type: 23 roles (`type-display` … `type-icon-glyph`) in Geist and Geist Mono. Inter is gone. `type-page-title`, `type-section-title`, `type-group-title` and `type-support` are deprecated aliases.
- New: `size-control` 48, `size-touch-min` 44, `swatch-01` to `swatch-12`, `state-hover`, `state-pressed`, `diff-added`, `diff-removed`, `@unicron/tokens/plain.css` (no `@theme`, no nesting) for extension frames.
- Scrims: `--c-scrim-sheet`, `-dialog` and `-menu` are 0.5, 0.6 and 0.32 on graphite and 1 on stone, where the role's own 64% is the whole dim, as every stone frame draws it.
- Knob values that moved: `--c-dialog-padding` 1rem → 1.5rem, `--c-popover-width` 18rem → 20rem, `--c-sheet-compact-height` 75dvh → `calc(100% - 3rem)`, `--c-progress-fill` is the live colour. Knobs no longer read are removed (`--c-icon-*`, `--c-agent-prompt-edge*`, the old code, approval-timer and risk-tier colours, `--c-nav-*`).

**Controls**

- `Button`: `secondary` is the ink outline (was a grey fill); `destructive` is the solid critical fill; labels are mono caps; sizes grew (`default` 32 → 40, `sm` 28 → 32, `lg` 36 → 48, icons the same); `shape="pill"` does nothing; edges are inset rings, so a `border-*` class does nothing. New: `block`, `wrap`, `loading`, `disabledReason`, the three `needs-you*` kinds.
- Fields are 48 tall with a 2px inside border on focus; `Label` and `FieldLabel` are mono caps overlines (`variant="choice"` for running text); `Textarea` no longer grows with its text (use `TextField multiline`).
- `Switch` is one size, 44 × 24. `Checkbox` checked is ink. `Toggle` pressed is inverted ink. `Badge` takes `tone` (`data-variant` became `data-tone`). `Chip` is 24 tall and square. `Avatar` is square. `Tabs` default is a square segmented control; the line variant is the Top Tab. `Empty` is left aligned. Segmented `Progress` cuts `segments` cells (32), not one per step: pass `segments={max}` for a checklist. `Skeleton variant="row"` is 76 tall. A horizontal `Separator` adds no height.

**Overlays**

- `Dialog`: default size is `form` (640); sizes have names (`question` 480, `review` 560, `form` 640, `compose` 720, `viewer` 960, `full`), and the old names map to the nearest; padding 24; in a window narrower than a size plus 48 the dialog is `full`. `Sheet`: square, raised, a rule instead of a shadow, a grabber on bottom sheets; `SheetHeader` lost its padding (use `SheetBody`). `Popover` is 20rem with 16 of padding and its header draws a close button. `Tooltip` has no arrow.
- `DropdownMenu`: rows are Nav Items (36 tall, 44 on touch; the label role in secondary ink; 20px glyphs), labels are overlines, the panel is solid. `DropdownMenuItem` takes `current`.
- `Toaster`: bottom left, three at most. Put it inside the `AppFrame` and import `toast` from `@unicron/ui` (one action, 4 s or 6 s). sonner's placement rules now ship in `@unicron/ui/styles`, so toasts work under `style-src 'self'`.
- New: `AdaptiveDialog`, `AdaptiveMenu`, `AdaptivePopover`, `OverflowMenu`, `ConfirmDialog`, `TruncatedText`.

**Shell (`app-frame`)**

| 0.x | 1.0 |
|---|---|
| `AppFrameHeader` (removed) | `AppFrameStatusLine` (sidebar apps), `AppFrameTopBar` (Warpcore), `AppFrameTopRow` (phone) |
| `AppFramePivot`, `AppFramePivotEnd` (removed) | `AppFrameSidebar` (its rail) or `AppFrameTopBar` |
| `AppFrameNav`, `AppFrameNavItem`, `AppFrameNavEnd` (deprecated shims, not floating) | `AppFrameBottomRow` with `TabBar` and `TabBarItem` (`indicator` → `mark`); the extras go to `AppFrameTopRow actions` |
| `AppFrameDetail` as a companion (`onOpenChange`, `detail`) | `AppFrameCompanion` (same props). `AppFrameDetail` is now the detail column of a list + detail (`open`, `onBack`, `size`) |
| `AppFrameSidebar` as the list beside the content | `AppFrameList`. `AppFrameSidebar` is now the 204 navigation column |
| `AppFrameMain bleed` | removed: a phone is always full bleed |
| `--app-frame-nav-clearance(-end)` | `--app-frame-top-clear`, `--app-frame-bottom-clear` |
| `useViewport().widthClass`: `medium` from 640, `expanded` from 768 | `compact` under 600, `medium` 600 to 1023, `expanded` from 1024 |

New chrome: `AppLockup`, `FloatButton`, `TabBar`, `Accessory`, `NavItem` and `NavSection`, `TopTabs`, `Rail`, `PageHead`, `TopBar`, `ContextPanel`, `SettingsFrame`, `AppFrameFocus`, `AppFrameSidePanel`, `AppFramePeek`, `StatusItem`. Counts read `12`, not `012`. A `StatusItem` or `Accessory` inside a frame speaks through the frame's one polite region. `NavSection checkable` items are `checkbox` or `radio`, not menu items.

**Rows, data, chat**

All new: `ListRow`, `SwipeRow`, `FieldRow`, `ToggleRow`, `FilterChip`, `SectionHeader`, `Metric`, `NeedsYou`, `Banner`, `CalendarEvent`, `MetaList`, `Steps`, `Tile`, `Table`, `DiffBlock`, `LogRow`, `FileChip`, `Highlight`, `TextField` and `SearchField`, `ChipField`, `RadioGroup` and `RadioRow`, `Toolbar`, `SplitButton`, `InitialTile`, `Composer`, `ChatMessage`, `ArtifactCard`, `SummaryBlock`, `Prose`, `CodeBlock`. `Item` rows draw a top rule and sit edge to edge. `IndicatorMark` counts read `07`, `99+`; `StatusOrb` running is the app's live colour; `RunTrace` writes `//` for `·`.

**Security**

- `SecretField`: word actions ("Show", "Copy") replace the icon buttons; the countdown is words; the default size lays the row out as a Field Row. `CodeDisplay` is no longer an `Item`; the code itself is the copy control. `ApprovalSheet` is a centred 560 dialog on a desktop and a sheet under 600; `ApprovalMatching` is a union; the timer reads `01:40 left`. `CrownJewelGate` uses SecretField's edit box. `LargeTypeView` is a viewer frame with a Done button. `UpdateStatusRow` and `AutoCheckSwitch` are a Field Row and a Toggle Row; the switch's default name is "Check for updates automatically".
- `AgentPrompt` is the needs-you yellow while it waits; the defaults are Deny, Allow once and Stop, Continue (the safe answer first); keys follow meaning (Y, N), so 1 and 2 no longer answer the defaults; `formatPromptCountdown` returns `01:05` and `45 S`.
- New: `DigitGroups`, `QrCode` (SVG, no `data:` URL), the `qrcode-generator` dependency. The review frame reads the shared Dialog's size knobs (`--c-review-*-width` and `--c-security-row-label-width` are removed).
