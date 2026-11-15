---
"@unicron/tokens": major
"@unicron/ui": major
---

Unicron 1.0: the 2026-11 design direction, "Industrial Spec". Four app themes on two grounds, Geist and Geist Mono, IBM Carbon icons, one square 2px corner, flat solid surfaces, and the shells, rows, chat and security parts the four apps share. Everything looks different, and several names changed their job.

**To move an app, follow the migration guide, in order: https://github.com/snds/unicron/blob/main/docs/07-migrating-to-1.0.md**

The three things to do first:

1. Set the app on `<html>`: `data-theme="warpcore" | "vale" | "lockdown" | "synapse"`. The ground is still the `dark` class (graphite) or none (stone).
2. Run `npx unicron-codemod icons <src> --dry`, read its report, run it once without `--dry`, then fix what `tsc` reports. Icons are Carbon, drawn as inline SVG. `Icon` lost `fill`, `weight`, `grade` and `opticalSize`. Remove the `material-symbols` dependency.
3. Search your own code for `bg-primary` and `text-primary` used as "the strongest ink": `primary` is now the app's identity colour, for the one primary action. Write `bg-foreground` or `text-foreground` for ink.

What else breaks, by area (the guide has each one, with what to write instead):

- **Roles.** Roles are named as in Figma (`surface-ground`, `text-label`, `primary-fill`, `secondary-live`, `needs-you-fill`, `critical-*`). Every shadcn name stays as an alias, with a new meaning: `muted`, `secondary`, `card` and `popover` are one colour, so `hover:bg-muted` on a raised surface no longer shows (use `bg-state-hover`); `sidebar` is the page ground; `input` is a hairline; `ring` is the body ink.
- **Type.** 23 roles (`type-display` to `type-icon-glyph`). Body text is 16px, was 14. `type-page-title`, `type-section-title`, `type-group-title` and `type-support` are deprecated aliases; the `--type-page-*`, `-section-*`, `-group-*` and `-support-*` variables are gone.
- **Radius.** `--radius` and every `rounded-*` step are 2px, was 10px and a scale. `rounded-full` is not a control shape; marks are squares. No shadows, no blur.
- **Fonts.** Inter is gone. `@unicron/ui/styles` loads Geist and Geist Mono as files.
- **Controls.** `Button variant="secondary"` is the ink outline, was a grey fill; `destructive` is the solid critical fill; sizes grew (`default` 32 → 40); labels are mono caps. Fields are 48 tall. `Label` is a mono caps overline above a field. A pressed `Toggle` and a checked `Checkbox` are ink, not the primary colour. `Badge` takes `tone`. `Tabs` default is a square segmented control. Segmented `Progress` cuts `segments` cells, 32 by default.
- **Overlays.** `Dialog` sizes have names (`question` 480, `review` 560, `form` 640, `compose` 720, `viewer` 960, `full`); the default is `form`, so a dialog with no `size` is wider. `DialogAction` keeps its words on a phone. Sheets are square with a rule, and a bottom sheet hugs its content. Menus are solid: the frosted glass is gone. Import `toast` from `@unicron/ui`, not `sonner`, and put the `Toaster` inside the `AppFrame`.
- **The frame.** `AppFrameDetail` (the companion pane) is now `AppFrameCompanion`; `AppFrameDetail` is the detail column of a list + detail. `AppFrameSidebar` (the list beside the content) is now `AppFrameList`; `AppFrameSidebar` is the navigation column. `AppFrameHeader`, `AppFramePivot` and `AppFramePivotEnd` are removed. `AppFrameNav`, `AppFrameNavItem` and `AppFrameNavEnd` are deprecated shims: use `AppFrameBottomRow` with a `TabBar`. `useViewport`'s width classes moved: `medium` from 600, `expanded` from 1024.
- **Security.** `SecretField` shows word actions and lays out as a Field Row. `CodeDisplay` takes `layout`, not `density`. `ApprovalSheet` is a centred dialog on a desktop and its `matching` is a union. `AgentPrompt` puts the safe answer first and answers keys by meaning (N and Y), so 1 and 2 no longer answer the defaults.
- **Knobs.** Removed: `--c-icon-*`, `--c-dialog-{xs…2xl}-*-width` (now by size name), `--c-app-frame-header-height`, `-nav-item-width` and `-pivot-width`, and the old code, approval-timer, risk-tier and agent-prompt-edge colours. Moved: `--c-dialog-padding` 1rem → 1.5rem, `--c-popover-width` 18rem → 20rem, `--c-app-frame-sidebar-width` 18rem → 12.75rem, `--c-progress-fill` is the live colour.

New in 1.0: the phone chrome and the desktop shells (`AppFrameTopRow`, `AppFrameBottomRow`, `AppFrameSidebar`, `AppFrameStatusLine`, `AppFrameTopBar`, `AppFrameFocus`, `SettingsFrame`, `ContextPanel`), `AppLockup`, `FloatButton`, `TabBar`, `Accessory`, `NavItem`, `TopTabs`, `Rail`, `PageHead`, `TopBar`; `ListRow`, `SwipeRow`, `FieldRow`, `ToggleRow`, `FilterChip`, `SectionHeader`, `Metric`, `NeedsYou`, `Banner`, `CalendarEvent`, `MetaList`, `Steps`, `Tile`, `Table`, `DiffBlock`, `LogRow`, `FileChip`, `Highlight`; `TextField`, `SearchField`, `ChipField`, `RadioGroup`, `Toolbar`, `SplitButton`, `InitialTile`, `EmptyState`; `AdaptiveDialog`, `AdaptiveMenu`, `AdaptivePopover`, `OverflowMenu`, `ConfirmDialog`, `TruncatedText`; `Composer`, `ChatMessage`, `ArtifactCard`, `SummaryBlock`, `Prose`, `CodeBlock`; `DigitGroups`, `QrCode`. In the tokens: `swatch-01` to `swatch-12`, `state-hover`, `state-pressed`, `diff-added`, `diff-removed`, `size-control`, `size-touch-min`, and `@unicron/tokens/plain.css` for a page with no Tailwind.

The stylesheet is larger: about 249 kB (38 kB gzip) for `@unicron/ui/styles` in a Vite app, from 157 kB (25.5 kB). An app with a CSS budget can use `@unicron/ui/styles/lean.css` through `npx unicron-sources`, which makes classes for the modules it names (a whole app lands near 33 kB gzip).

Reference: `docs/03-components.md` (components), `docs/02-tokens.md` (tokens), `DESIGN.md` (the look).
