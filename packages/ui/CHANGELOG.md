# @unicron/ui

## 2.3.0

### Minor Changes

- Composer: `quote` puts a reply's quote inside the box, at its top over the field. `ComposerQuote` draws it: the reply glyph, the quoted words on one line on the hover wash, and a × named "Cancel reply". In a one-row box it keeps its own line.
- ContextPanel: `collapsible={false}` leaves out the open head's collapse button, for an app whose title row already shows and hides the panel.

## 2.2.0

### Minor Changes

- IconTile: a glyph on a small tinted square, a project's mark (Warpcore's sidebar and project head). `s` is 22 with a 14px glyph, `m` is 32 with a 20px glyph. It takes one of the twelve swatch roles, or none for a neutral tile. `ICON_TILE_SWATCHES` lists them for a colour picker.
- NavItem: `tile` puts an IconTile in the icon's place, in the sidebar and on its rail.
- NavSection: `open` and `onOpenChange` make the heading a button with a chevron that shows and hides the list (Recents).

## 2.1.6

### Patch Changes

- Icons: four more names for Warpcore's chat, drawn with Material Symbols Rounded like the rest: `microphone` (mic, reply by voice), `face--add` (add_reaction), `markdown` (markdown) and `return` (keyboard_return). The codemod maps those Material names to them.

## 2.1.5

### Patch Changes

- ContextPanel: the rail's Expand is a `RailItem`, the first tile of the rail, so it has the same size, corner and hover as the tabs under it (it was a FloatButton with its own box). It is also the first stop of the rail's arrow keys.
- AppFrameColumn: `bleed` runs the column the frame's full height on a desktop (no 24 above and below, no 8 on top), so a context panel inside it and the column's rule reach the top bar and the window's foot. The content pads itself where it should sit as before.

## 2.1.4

### Patch Changes

- PageHead: the collapsed form keeps its `actions` at the end of the row, with the title still centred. A short screen draws the head collapsed, so its buttons (New task, Check again) no longer vanish there.

## 2.1.3

### Patch Changes

- AppFrame: beside the flush sidebar, the last content column keeps 4 px at its end, as at its start, so a centred reading column stays centred (2.1.2 kept 16 and pulled it 6 px off centre).

## 2.1.2

### Patch Changes

- AppFrame: beside the flush 2.0 sidebar, the content columns keep their room inside their own box instead of stepping into a page gutter that isn't there. They, and their scroll bars, now end at the window's edge (they ran 16 px past it).

## 2.1.1

### Patch Changes

- SidebarFoot: in the rail, the tile is the way into Settings (with its tooltip, shortcut, dot, and Current fill), so Settings stays reachable when the sidebar is collapsed. In the full row the tile is hidden from screen readers, so the account reads its name once.
- AppFrameSidebar: at medium width the drawer closes once a place in it is chosen (a link, the primary action, or Settings in the foot).
- Indicator: an optional `said` gives a mark its own words where the kind's don't fit ("Settings, update ready").

## 2.1.0

### Minor Changes

- 9e77fc9: The 2.0 sidebar. `AppFrameSidebar flush` is 240 wide on the sunken ground, edge to edge, and the frame drops its page gutters beside it. Its top row holds the lockup and the primary as an icon button; `windowButtons` adds the Mac row (the window buttons' room and Hide sidebar) over a 36 row. Collapsed it is a 56 rail. New `SidebarFoot` (Figma 178:4541): a status line, an edge-to-edge rule, and the account row with Settings, filled while Settings is open. `TitleRow` takes the frame's header area. New tokens: `--c-app-frame-sidebar-flush-width` (15rem) and `--c-app-frame-sidebar-flush-rail` (3.5rem). The 1.x sidebar stays the default until 3.0. In the rail the lockup keeps its 20 mark, the primary stays an icon button, and a group whose rows have no icons (a list of conversations) leaves the rail.

### Patch Changes

- Updated dependencies [9e77fc9]
  - @unicron/tokens@2.1.0

## 2.0.3

### Patch Changes

- A menu over the scrim (`DropdownMenuContent scrim`, as in quick create) is solid instead of frosted. The scrim already sets it apart, and the frosted popover over a dimmed page left its label ink at 3.7:1 on stone.

## 2.0.2

### Patch Changes

- e27ec7e: The Composer goes to one row, the field beside its tools, wherever height is scarce: a phone on its side, an open keyboard, and the `line` size. On a phone (and the rail layout) the frame's edge is the ground, so an installed app's status bar matches the top row with no seam.
- Updated dependencies
  - @unicron/tokens@2.0.1

## 2.0.1

### Patch Changes

- ca5c157: The last parts that still drew `//` between facts now draw ` · `, as the rest of 2.0 does: Chat Message end marks (`cut off · stopped`), Needs You and Agent Prompt "more" (`· +1`), the Agent Prompt timer, the Approval Sheet timer, and Run Trace's one line.

## 2.0.0

### Major Changes

- 7b687ef: Unicron 2.0 foundations, from the published Figma library (2026-11-24): a theme is the accent only (10 slots); shared neutrals in four surface layers with alpha lines, hover and selection; status, count, severity, label and chart roles; the radius scale (4, 6, 8, 12, 16, round); app-sized type in one sans with seven new roles; popover and dialog shadows and the frost blur. The legacy ramps are gone. See docs/10-migrating-to-2.0.md.

### Minor Changes

- 86a81df: `Composer` takes the 2.0 library's Composer (Figma 32:91), the floating raised bar. It has 16px corners and a 1px line/field edge, and is 88 tall at rest. The field sits on top in the body role. Under it is a tools row: `attach` and `leadingAction` first, then Send at the end, now a 32px circle on the accent fill with an up arrow. The bar is padded 12 at the top and right, 10 at the bottom, and 16 on the left. The one-line size keeps a 24px field.
- d33e2d7: 2.0 controls, from the Figma library: Button is M 32 / S 28 / L 44 with a ui/emphasis label in sentence case, a 6px corner and a line/field edge on Secondary, plus a new `quiet` kind; Icon Button is a 32 or 28 square. Filter Chip is a round 28px pill (ui role, line/rule edge; on is the selected wash). New `CountBadge` (minor, default, concerning, urgent). Unread marks and counts use the shared count blue (info/fill). `cn` now merges the named sizes (h-control-m, size-icon).
- 5cba40c: Counts are plain numbers, as the 2.0 library draws them: `formatCount` writes `7`, `12`, `146`, and `1,204` (1.x wrote `007`), and a capped mark stops at `99+` without a leading zero. The parts that joined words with " // " now use " · ": a NavSection's count, a SectionHeader index count, a ChatMessage's phase, and the countdown in an Accessory and a StatusItem. The status line's crumbs use " / ". StepsFolio reads `STEP 2 OF 7`.
- 6bc83e7: `Dialog` takes the 2.0 Dialog (Figma 76:139). The popup sits on the popover surface under the dialog's edge shadow (the new `surface-dialog` utility), with 12px corners. The header and footer are bands of their own, each with a rule that runs edge to edge. The header has 20 above and 16 under the title, the footer has 16 above and below its actions, and the actions sit 12 apart. The title takes the title role (20/28 semibold). The `dialog.padding-top` knob is now 1.25rem: 20 above, below, and between the bands. A sticky footer pins on the popover surface.
- 8fadaa0: Fields match the 2.0 Text Field: 32px tall boxes (44px on touch), 10px side padding, and the 6px control radius. Input, Textarea, TextField, ChipField, InputGroup, Select, and NativeSelect all follow it. The small Select and NativeSelect are 28px.
- b518aff: Icons draw Material Symbols Rounded (outlined, weight 400), as the 2.0 Figma library does. The names do not change: every curated name keeps its 1.x Carbon spelling, and `src/icons/drawings.json` maps it to the Material file that draws it (the 2.0 noun map included: an agent is `smart_toy`, a skill `school`, a tool `build`, a tag `label`). The drawings come from `@material-symbols/svg-400` at build time, scaled onto the same 32 grid, so `registerIcons` glyphs and every size rule still work. `CARBON_ICONS_VERSION` is now `MATERIAL_SYMBOLS_VERSION`.
- 911f015: `ListRow` takes the 2.0 library's List Row (Figma 9:181). Rows have no dividers; they sit inset in their list with 8px corners. Selected is the 8% fill (surface/selected) with the 2px inset bar, replacing primary-soft and the edge. Inline rows are 56 tall (label meta) or 60 (plain), padded 8 / 10 with 12 between columns; the title is ui-emphasis, and the meta and status are in the meta role in label ink, no longer overline caps. A message is 84 tall, padded 10 / 12: a round unread dot in info/fill, the time as a caption, and the preview cut at one line by default (was two). `tone="live"` is retired (it now colours the status in the working ink); put a working `StatusOrb` in `leading` instead. The account and time are joined by " · ".
- ae8cb48: `DropdownMenu` takes the 2.0 library's Menu (Figma 76:415) and Menu Item (76:325). The panel is frosted by default: the new `surface-frost` utility draws the popover frost at 72% over a 24px backdrop blur, the popover shadow, and a 1px rule, and falls back to the solid popover surface when a person asks for reduced transparency. It has 8px corners and 4 inside. Rows are 32 tall (44 on touch), in the ui role and body ink, with the 5% hover fill; the current row takes the 8% selected fill. The keys at a row's end are plain meta-role text in label ink, no longer a Kbd. Rows sit 4 apart, not Figma's 2, to keep menus on the 4px grid. `AdaptiveMenu`'s sheet rows follow the same look.
- 903c446: `ContextPanel` open takes the 2.0 Right Panel (Figma 127:460): 360 wide (the `app-frame.context-panel` knob drops from 400), on the ground with a rule at its start. A 48 head holds pill tabs, drawn as Tabs draws them (the 8% selected fill, the count in caption type and label ink), and a ghost 28 collapse button. The body sits 16 in from the sides. A new `composer` prop docks a Composer under the body, 12 in, for panels that can be asked questions.
- 903c446: `SearchField` follows the 2.0 Search Field (Figma 171:493): a 16px search icon, and a new `shortcut` prop that shows its key as a Kbd while the field is empty. The clear button takes the Kbd's place once there are words. `Kbd` takes the 2.0 xs radius (4) in place of 12.
- 1cfc4f9: 2.0 Pill Tab and Status Mark. Every `TabsList` variant now draws the Figma Pill Tab: 28 tall, a 6px corner, the chosen tab on the neutral 8% fill with body ink. The line indicator and the segmented track are gone; `variant="line"` still builds and draws the same pill. `StatusOrb` draws the Figma Status Mark: round marks in the shared status colours, a quarter arc turning over a faint track for working, a hollow ring for idle, and a disc with a check or a cross for done and failed.
- b98d0bc: New `TaskRow` and `AskRow`, from the 2.0 library. `TaskRow` (Figma Task Row) is one task or thread: the Status Mark, the title and its time, one line of what is happening, the meta, and the unread dot; selected is the neutral 8% fill with the inset bar. `AskRow` (Figma Ask Row) is one ask from a session, answered in one click: the session's choices as small buttons with the recommended one primary, one Reply button for an open question, and once answered, the answer with Undo.
- 7d72246: New `TitleRow`, from the 2.0 library (Figma Title Row). The 48px desktop title row every app shares: room for the Mac window buttons, the sidebar toggle, the breadcrumb (the parent in secondary ink as a link back, a chevron, the current page), an optional status, then the actions and the panel toggle (⌘., with the needs-you dot). `kind="settings"` draws the Settings location label, "Settings | Page", with a 1 × 16 rule and a plain parent.

### Patch Changes

- Updated dependencies [d33e2d7]
- Updated dependencies [6bc83e7]
- Updated dependencies [7b687ef]
- Updated dependencies [911f015]
- Updated dependencies [903c446]
- Updated dependencies [1cfc4f9]
  - @unicron/tokens@2.0.0

## 1.1.1

### Patch Changes

- 030b0b2: Switch, sidebar and switcher fixes from Synapse's Stage L review.
  
  - **Switch:** an off switch is now edged in `line-field` (`--input`, 3:1 on both grounds) instead of the `line-rule` hairline. On a raised row, such as a settings card, the off track had disappeared and only the knob showed, as a bare square.
  - **AppFrameSidebar:** the collapse control (and the drawer's close control) moved from the foot to the end of the lockup's row, so the foot's item (Settings) takes the foot's full width and its current fill reaches the sidebar's edge. The scrolling middle now fades its last 32px into the ground and pads its end by the same 32, so a long list scrolls instead of cutting a row's words in half.
  - **AppFrameSwitcher:** the chevron is a ghost icon button on the title's line (32), not a bordered 48px float button, so it reads as part of the name it opens and no longer pushes the sidebar's middle down. Its name and menu are unchanged.

## 1.1.0

### Minor Changes

- 05d6a85: Controls, chips, tabs and rows for 1.1 (decided 2026-11).
  
  New API:
  
  - `Progress`: `size` 4 or 8 on a segmented bar. 8 is Warpcore's Spend bar; 4 stays the default (Unicron 49).
  - `FilterChip`, `TabsTrigger` and `TopTab`: `keepCase`. The label keeps its own case instead of the overline's capitals, for a label that is data, such as a person's name. `Chip` already keeps case: its value is in `caption` (Vale 8).
  - `TabsTrigger`: `mark` (a count, a square or a key, as `TopTab` and the nav items take it). Its words join the tab's accessible name: "Requests, 2". Pass a count here, never as a hidden child (Lockdown 30).
  - `SwipeRow` actions: `menuLabel`. The tile keeps its short word ("Fix"); the row's menu and the tile's accessible name use the full words ("Fix with Claude Code") (Synapse 21).
  - `ListRow`: `statusMark` (`{ icon, label, tone }`, tone neutral, live, needs-you or critical). For a narrow column: the status is a 16px mark, and its word is said with the row, not drawn. It takes the place of `status` (Warpcore 18).
  - `CodeDisplay`: `copy={false}` makes it display only: no copy on a click, Enter or the menu, no clipboard countdown, no Tab stop of its own (a concealed code still shows on Enter). For a row whose own button is the one copy, such as Lockdown's popup with `layout="compact"` (Lockdown 27).
  - `swipeRowCrowdedTiles` (3): from this many tiles on a side, a full swipe needs more travel.
  
  Changed behaviour:
  
  - `RadioGroupItem` and `RadioRow`: the radio is round, a 16px circle with an 8px dot. It is the system's one round control, so one choice of many never looks like a checkbox (Unicron 41).
  - `FloatButton` long press: from the keyboard it is Shift+F10 or the context-menu key (and a right click), no longer Shift+Enter, which means a new line in a text field. `floatButtonLongPressKeys` is now `"Shift+F10 ContextMenu"`. `ListRow` and `SwipeRow` already open their menus on the same keys. A Composer's Shift+Enter still makes a new line (Unicron 48).
  - `Composer`: an empty composer's Send is dimmed to 50%. It stays `aria-disabled` and in the tab order; a press does nothing (Unicron 51).
  - `FilterChip kind="trigger"`: while its picker is open it draws inverted ink, as Figma draws it, and still says `aria-expanded` (Unicron 50).
  - `SwipeRow`: on a side with three tiles or more, a full swipe starts one tile past the open tiles (320 at 390), at most the row's width. Three 80px tiles already reached the 60% line (234 at 390), so opening the row ran its outermost action (Lockdown 18).
  - Focus and invalid borders: a field's focus border (Input, Textarea, InputGroup, Select, TextField, Composer) reads `--line-focus`; its invalid border, and the invalid edge of Button, Switch, Checkbox and Radio, reads `--line-invalid`. These line roles (from @unicron/tokens) hold 3:1 on both grounds; the primary and critical fills measured 2.59:1 to 3.21:1 on graphite (Unicron 17).
  - Pressed solids: Button default, destructive, ghost-destructive and needs-you, Switch on, the primary FloatButton and the primary swipe tile go to 85% when pressed (was 80%). Inverted ink (a current FloatButton, an on or open FilterChip) goes to 86%. The labels now hold Lc 75 on Vale and Lockdown stone and on graphite (Unicron 28).
  - `FloatButton` neutral pressed lays the `state-pressed` role over the raised surface, instead of a hand-written 10% mix.
  - `TabsTrigger`: the index is in the label ink, not the faint ink: it is read as part of the name (Unicron 25).
- 05d6a85: CalendarEvent leaves the core, the icon set loses its 47 extras, and the web build watch moves into Unicron (decided 2026-11; guide: docs/08-migrating-to-1.1.md).
  
  Removed (an app that used them follows docs/08-migrating-to-1.1.md):
  
  - `CalendarEvent` and `calendarEventVariants` (Unicron 2). Only Vale has a calendar, and the name carries a domain noun. Vale builds it in its own layer from core parts, and gives a selected event the 2px edge of a selected row (Unicron 89).
  - 47 icons from the curated set, which is now 265 (Unicron 98). The set is one object a bundler cannot trim, so every icon cost every app. Register any you need with `registerIcons()`; the guide lists them and shows how.
  
  New API:
  
  - The web build watch (Updates 5): `startBuildWatch({ storagePrefix, canReloadNow, mayReload, save })`, its rules as `createBuildWatch(env)` with no DOM, `readBuild`, `quietByTheClock`, `pageBuild`, `buildWatchReloadedKey`, the timing constants, and the hook `useBuildWatch(watch)`. One copy of the check Warpcore, Vale and Lockdown's web vault each carried. It reloads by itself only in a quiet moment (the wheel counts as use), when the app's `canReloadNow()` and its own rule allow, once per build; a page whose next file is gone reloads as soon as nothing would be lost. The apps keep their copies until each swaps.
  
  Changed behaviour:
  
  - Counts read three digits, as every Figma sidebar draws them: `formatCount`, `formatListCount` and `formatNavCount` write `007`, `012`, `248`, then `1,204` (Unicron 13, Vale 6). A mark at an icon's corner (`cap`) keeps a badge's two digits and stops at `99+`. Every part that shows a count changes with it: nav items, the rail, list rows, filter chips, section headers, tabs, the context panel. Sentences keep plain numbers ("3 new senders"); the formatter does not write those.
  
  Icon map (`unicron-codemod icons`, `iconFromMaterial`):
  
  - `timer` and `snooze` map to Carbon's own `timer` and `snooze`, not `time` (Unicron 96).
  - `left_panel_open` and `left_panel_close` map to Figma's `open-panel--left` and `open-panel--filled--left`, one family with the right side (Unicron 99).
  - New `_aliases`: `key` → `password`, `link--off` → `unlink`, names a spec wrote that Carbon spells another way; the codemod rewrites them (Unicron 100).
  
  Notes:
  
  - The lean stylesheet entry (`@unicron/ui/styles/lean.css` and `unicron-sources`) is the way to a smaller CSS bundle; Warpcore moves to it (Unicron 103).
  - Docs: a label length guideline for fields (short mono caps overline; long wording in the helper line; Unicron 42); a mirrored Carbon glyph as a registered icon (Vale's forward; Unicron 95).
- f90430b: The 1.1 lanes, joined up: parts that still drew 1.0 values now read the 1.1 roles.
  
  - Critical edges and invalid borders read `--line-invalid`: `Banner tone="critical"`, `Accessory tone="critical"`, `FileChip` in error, `SecretField` in error and `Toggle` when invalid. On graphite that is the critical text colour, which holds 3:1; the critical fill measured under it (Unicron 17).
  - Tab indicators (`TabsTrigger` line variant, `TopTab`) draw in `--primary-mark`, the colour for a mark with no words (Unicron 19).
  - Hand-written washes follow the lighter states: hover 4% and pressed 6% of the ink on `Select`, `NativeSelect`, `Tile`, `CodeDisplay`, a neutral `SwipeRow` tile and a selected `Item` (they were 6% and 10%; Unicron 16).
  - A pressed `Toggle` goes to 86% of the ink, as a current `FloatButton` and an on `FilterChip` do, so its label holds Lc 75 on graphite (it was 80%; Unicron 28).
  - `PageHead size="md"` in a desktop frame: the overline touches the title, as Vale's desktop lists draw it. On a phone it stays 4 above (Unicron 77).
  - The desktop sidebar's collapse and expand controls draw Figma's `open-panel--filled--left` and `open-panel--left` (Unicron 99).
- 05d6a85: The frame, its bars, layers, toasts and live announcements for 1.1 (decided 2026-11).
  
  New API:
  
  - `Accessory`, `StatusItem` and `AgentPrompt`: `announceAt`, a list of seconds left at which the countdown is said once ("Chrome on Windows, 1 minute left"), never each tick (WCAG 2.2.1). Each app sets its own: Warpcore `[300, 60]`, Synapse `[60, 30, 10]`. `AgentPrompt` defaults to `[60]`; the status parts to none (Unicron 33).
  - `AgentPrompt`: `details`, a slot between the question and the options for what the call carries, such as a `CodeBlock` of its arguments. It is not capped, and it is in the phone's sheet too (Synapse 18).
  - `AppFrameSwitcher`: `accounts`, `value`, `onValueChange`, `accountsLabel` and `add`. The chevron opens the accounts as a menu of radio items: the arrow keys only move, and Enter, Space or a click switches, so passing over an account never loads it (Unicron 73). `menu` still takes a menu of your own.
  - `PopoverContent`: `width`, `default` (320) or `wide` (420, Figma's one drawn popover, Warpcore's environment picker). `wide` reads `--c-popover-width-wide` from @unicron/tokens (Unicron 60).
  
  Changed behaviour:
  
  - `AppFrame`: in a development build it warns once when no `data-theme` is set on the root (or on a box around the frame): the core's generic default theme is then in use. See docs/05-consuming.md (Unicron 4).
  - Phone chrome: it comes back on any scroll up, as Safari's bar does, not only at the top. It minimizes again on a scroll down past the line. The rubber band below the end of a page does not count as a scroll up (Unicron 68).
  - Toasts on a phone: a strip that shows (a needs-you request, offline, a sync) stays shown, and the toast stacks 8 above it. Toasts no longer sit under the top row, where they covered the page head and the switcher. A strip with an action (undo send) is still never covered: new toasts wait. `toastPlacementFor` returns `above-strip` for a strip that shows; `top` stays in its type, unused, until 2.0 (Synapse 10, Vale 15).
  - Desktop sidebar: from 1024 to 1099 px it is its rail on every screen, not only on a list + detail screen, so it no longer changes width from one section to the next. Expanding it opens the drawer, as at medium width (Unicron 74).
  - `TabBar` vertical (the short screen's trailing column): every tab is 44 tall (`size/touch-min`), never squeezed. When the tabs do not fit (four tabs at 667 × 320) the bar scrolls, a slide along it scrolls it, and the create button under it stays on screen (Unicron 29, 64).
  - `TabBar` minimized: keyboard focus coming in expands it until focus leaves, and the arrow keys work again. A tap on the one tab still goes back to the top (Unicron 65).
  - `Banner tone="critical"`: it cannot be dismissed. It draws no close button even when `onDismiss` is passed, and a development build warns once. Info, success and warning banners keep theirs (Unicron 62).
  - `Accessory tone="critical"` is deprecated and goes in 2.0: a status strip is never critical. Show something broken that the person can fix as a critical `Banner` at the top of its section. It still draws as before, with a development warning (Unicron 67).
  - Sheets: only the sheet that drags draws a grabber, `AdaptiveSheetContent` on a phone. A plain bottom `SheetContent`, and the phone sheets of `AdaptiveDialog`, `AdaptivePopover` and `AdaptiveMenu`, have none; their header starts 16 from the top and the close button sits 16 from the top, as on a side sheet (Unicron 54, Lockdown 29).
  - `NeedsYou size="compact"`: its action is 40 high, 44 on a coarse pointer, whatever size the Button asks for. It is said to a screen reader each time it appears (Unicron 88).
  - `AgentPrompt`: the countdown says what happens at zero: `QUESTION // DENIES IN 28:14` (the timer's name is "Denies in 28:14"). Once time runs out it says the core's "Timed out" in every app (Unicron 92, Synapse 18).
  - `SecretField`: inside an `AppFrame`, a copy's "Copied. Clipboard clears in 30 seconds." and "Clipboard cleared." are said through the frame's one polite region, not the field's own, so they never talk over a status line or a strip (Unicron 33).
  - `NavItem`: the index is in the label ink, not the faint ink: it is read as part of the row (Unicron 25). Measured on the ground: 4.83 to 8.50 to 1 (Lc 60.4 to 68.6), was 2.17 to 2.82 to 1.
  - `AppFrameSidebar` primary: quick create (`onLongPress`) answers Shift+F10 and the context-menu key as well as a right click, and says so in `aria-keyshortcuts` (Unicron 48).
- 05d6a85: **App themes leave the core; Unicron ships its own default theme and a contrast tool for yours** (Unicron 1).
  
  - `tokens/themes/` is gone, and with it the `[data-theme="warpcore|vale|lockdown|synapse"]` blocks in `tokens.css` and `plain.css` and `themes` / `defaultApp` in `tokens.json`. With no `data-theme` the 28 theme slots now hold Unicron's own default theme (neutral surfaces, a quiet slate identity, a teal live colour), which clears every contrast pair the gate measures. `tokens.json` lists the slot names as `themeSlots`.
  - New bin `unicron-contrast <theme.json|theme.css|dir> [--exceptions file.json]`: lays an app's 28 slots over the built roles and knobs and measures every recipe on graphite and stone. Each app passes its own exceptions file; the core's list now holds only misses every theme shares (the critical and needs-you colours). `apca-w3` is now a dependency.
  - `examples/app-extension.css` declares a whole app theme. `NOTICE` added (shadcn/ui MIT, snds/mailbird Apache-2.0).
  
  **New roles** (not in Figma yet): `line-field` (a field's resting border, 3:1; `input` now points at it; Unicron 18), `line-focus` and `line-invalid` (focus and error borders: the fills on stone, the text colours on graphite, 3:1; Unicron 17), `primary-mark` (a mark with no words; Unicron 19), and the small-text inks `small-label`, `small-primary`, `small-critical`, `small-live` (Lc 75 and 4.5:1 on the ground, a raised surface and both washes; Synapse 1). New knobs: `--c-popover-width-wide` (420), `--c-progress-height-large` (8px), `--c-diff-added`. New type role `mono-row` (Geist Mono 13/20; Lockdown 4) and its `type-mono-row` utility.
  
  **Changed values.** `state-hover` 6% → 4%, `state-pressed` 10% → 6% of the ink (Unicron 16); a solid's pressed state is modelled at 85% (Unicron 28); `running-surface` 14% → 6% (Unicron 27); `diff-added` on stone 8% → 3% (Unicron 28); stone `warning` `amber.550` → new `amber.575`, 4.7:1 as small text (Warpcore 2); `--c-progress-primary` and `--c-progress-critical` take the text colours on graphite (Unicron 19). `text-faint` is narrowed to disabled words and decoration (Unicron 25).
  
  **`@unicron/ui`.** `type-number-tabular`, a modifier for a number that changes while you watch; `Metric` takes `live` to turn it on (Unicron 11). `rule-box-emphasis` defaults to `--line-focus` and the `edge-*` utilities to `--primary-mark`.
  
  ### Migrating
  
  1. **Declare your app's theme.** Copy your 28 slots into your own layer under `[data-theme="<app>"]` (the playground's copies, with their Figma ids, are in `apps/playground/src/app-themes/<app>.json` and `.css`). Without it, `data-theme="<app>"` shows Unicron's default theme. Then add `unicron-contrast src/app-extension.css --exceptions src/contrast-exceptions.json` to your checks (`--print-exceptions` writes the first list). See docs/05-consuming.md → Declare your app's theme.
  2. **No `data-theme` is no longer Warpcore.** A page that relied on the default being Warpcore's colours sets `data-theme="warpcore"` and declares Warpcore's theme.
  3. **`plain.css` follows the browser by default** (Unicron 14). A root with no class used to be stone; now it follows `prefers-color-scheme`. Add `class="stone"` (or `light`) to keep stone; `class="graphite"` (or `dark`) forces graphite. `class="system"` still works.
  4. **Point borders and marks at the new roles** (no class goes silent; these are the ones that measure right): a field's resting border `--input` / `line-field`; focus and error borders `line-focus` / `line-invalid` (not `primary-fill` / `critical-fill`); a selected edge, tab indicator or progress cell `primary-mark`; reading text in `text-faint` → `text-label`.
  5. **Deprecated, removed in 2.0** (Unicron 7): `--g-neutral-*`, `--g-white-alpha-*` and the accent ramps `--g-blue-*`, `--g-coral-*`, `--g-green-*`, `--g-amber-*`, `--g-red-*`. They keep their names and values for all of 1.x. Alias a role (`surface-*`, `text-*`, `line-*`), a status role or a swatch instead; 2.0's migration guide lists each replacement, and the core's own status roles move to status-named tokens there.
- 9f4c60b: An opt-in expressive motion stylesheet: `@unicron/ui/styles/motion-expressive.css`, active only inside `data-motion="expressive"`. There a pressed control scales instead of moving 1px (no bounce: it is met too often), a dialog arrives from 0.96 on the emphasis curve, and `motion-burst` pops in a success mark with a fading ring. It stands down under reduced motion and in `data-motion="reduced"` or `"off"` boxes. The token lint allows `--g-spring-pop` in that file only. New contracts: expressive-press, burst.
- 3fda778: Motion for panels and measures. A Progress bar's fill now grows on `scale` from its start edge instead of animating `width` (`ProgressIndicator` takes an optional `share`, 0 to 1; without it Base UI's width is used as before). StatusOrb's needs-you ping is a growing, fading copy of its ring (`::after`, scale and opacity) instead of an animated `box-shadow`, and is not drawn under reduced motion. New contracts: collapsible, progress.
- 16ea88b: Motion for selection, in the 1.0 look. Button, IconButton and a lone Toggle press 1px into the page with a new `motion-push` recipe (a popup trigger does not move; a joined ToggleGroup's items change colour only). A Checkbox's mark fades in and out. The line Tabs get one indicator that slides to the chosen tab (`motion-indicator`, Base UI's `Tabs.Indicator`); the per-tab `::after` line now only shows on hover. New contracts: push, indicator, button-press, switch, checkbox, tabs.
- 6cfac66: The phone sheet's drag gets physics. AdaptiveSheetContent follows the grabber 1:1 down and resists past open (24px at most); let go, it reads the release speed, so a short flick dismisses it and carries through faster, a slow short drag settles back on the firm spring, and a re-grab mid-settle carries on from where it is. The fixed 120px dismiss distance is gone (it is now 30% of the sheet's height, or a flick). New `data-release` recipe and `@unicron/ui/motion` helpers: `releaseVelocity`, `shouldDismiss`, `releaseShare`, `DragSample`, `DISMISS_SHARE`, `FLICK_SPEED`, `RELEASE_WINDOW_MS`. New contract: sheet.
- 103844d: Toasts and numbers. A toast now leaves on `--motion-fast` and the exit curve, and arrives on `--motion-base` and the enter curve, in every one of sonner's states (sonner's own 500ms exit for a toast behind the front one no longer wins). New `RollingNumber`: a number whose changed characters roll to their new value, up when it grew and down when it shrank, on `--motion-state` (`motion-roll-in`, `motion-roll-out`); still under reduced motion. New contracts: toast, rolling-number.

### Patch Changes

- c6ec965: Motion docs and the last keyframes. TruncatedText's full text and CodeDisplay's next code now use the system recipes (`motion-fade motion-fade-fast`, `motion-appear`) instead of tw-animate-css classes, so no `@unicron/ui` part uses tw-animate-css any more. Its import stays in `@unicron/ui/styles` for apps that use it, marked deprecated, and goes in the next major. New docs page: docs/09-motion.md (the rules, every part's motion, going further in an app, adding a motion); DESIGN.md's motion section names the timing, press, layer and bounce rules.
- Updated dependencies [05d6a85]
  - @unicron/tokens@1.1.0

## 1.0.0

### Major Changes

- f8a9512: Unicron 1.0: the 2026-11 design direction, "Industrial Spec". Four app themes on two grounds, Geist and Geist Mono, IBM Carbon icons, one square 2px corner, flat solid surfaces, and the shells, rows, chat and security parts the four apps share. Everything looks different, and several names changed their job.
  
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

### Minor Changes

- e53fb57: Lockdown's feedback gets motion, in the 1.0 look. The clipboard countdown's words on SecretField and CodeDisplay ("Clears in 28 s", "Cleared") fade in over 120ms when they appear and when the phase changes, and hold still as the seconds tick. A SecretField's value fades in where the dots were when shown, and the dots fade back in when hidden. The strength rule's three cells change colour one after another, 50ms apart. New recipes `motion-appear` and `motion-fill-in-turn`, and three new entries in `motionContracts` (copy-words, reveal, strength). Shake stays opt-in: no field shakes by default, and `useShake` works on `Input` for an app that wants it on a refusal (documented).
- 841e389: Overlays move onto the motion recipes, in the 1.0 look (fade, or fade and an 8px step off the trigger; no zoom, no blur). They are transitions now rather than keyframes, so dismissing one mid-open turns round from where it is instead of restarting. Dialog and its dim fade in place, 200ms in and 120ms out (was 120ms both ways). Popover fades and steps off its trigger, 200ms in and 120ms out. Tooltip and the command palette fade, 120ms both ways. DropdownMenu and Select fade and step off the trigger in 120ms both ways, and stay still when opened or closed from the keyboard; Select animates for the first time. New recipes `motion-fade-fast`, `motion-anchor` and `motion-anchor-fast` (with `motion-fade` already there), and seven new entries in `motionContracts` (fade, anchor, dialog, popover, tooltip, menu, select). If you restyled these popups with `data-open:animate-in`, `fade-in-*` or `slide-in-from-*` classes, those no longer apply; use the recipes. Tokens: the descriptions of `--motion-fast` and `--motion-base` say what each is for now; no value changes.
- 32578e1: Motion recipes. `@unicron/ui/styles` now carries seven named recipes built only from the motion roles: `motion-press` / `motion-press-sm`, `motion-pop`, `motion-slide` (+ `motion-slide-from-*`), `motion-collapse`, `motion-stagger`, `motion-draw` and `data-shake`, each with a reduced-motion form. New `@unicron/ui/motion` entry (also exported from the root): `useShake`, `rubberBand`, `withViewTransition`, `useReducedMotion`, and `motionContracts`, the recipes' contracts as data. New `CheckDraw` component, a check mark that draws itself. `data-motion="reduced"` on any element puts everything inside it on the reduced-motion path, and `data-motion="off"` removes motion. No existing component changes yet. Tokens: `--motion-stagger-max` drops from 6 to 4, so a whole staggered list lands within the 400ms ceiling.

### Patch Changes

- 5fab384: Every transition and animation in `@unicron/ui` now runs on a motion role; the token lint refuses motion literals from here on. Visible changes are small: Popover opens in 120ms instead of 100ms, and Tooltip in 120ms instead of 150ms, both on the system curve instead of plain `ease`; the sheet overlay fades in 120ms instead of 150ms, and sheets slide on the system curves; StatusOrb's "needs you" ping uses the enter curve. Badge, Switch, Tabs and Toggle animate colour, border and shadow only (they used `transition-all`). Countdown rings step on `--motion-tick`, and Icon's axis transition reads `--motion-base` and `--motion-ease`. `useReducedMotion` and `useMediaQuery` moved to `lib/motion`; the old import path still works.
- 23675a5: TruncatedText: a tap on cut text now shows all of it and keeps it shown. The tap's own focus opened the tooltip a moment before the press landed, so the press read as "put it away" and closed it in the same tap; the closing fade hid this. A second tap still puts it away.
- Updated dependencies [841e389]
- Updated dependencies [32578e1]
- Updated dependencies [bba91eb]
- Updated dependencies [f8a9512]
  - @unicron/tokens@1.0.0

## 0.24.0

### Minor Changes

- 9e46ed1: AgentPrompt: `kind="reply"` takes words (Enter sends); `pending` and `error` cover sending and a failed send; `expiresAt` + `safeAnswer` count down and answer with the safe option when time runs out (`onExpire` to let the server do it). `onAnswer` gets the reply text as a second argument.
- 3b2b83c: `indicator` prop on Button, IconButton and ToggleGroupItem, as on AppFrameNavItem and Item: a dot in the top-right corner, and the words in the name ("Tasks, 2 waiting for you"). Apps can drop their own IndicatorMark placement rules.
- f995814: RunTrace: a step can be `needs-you` (waiting on an answer), and the run's line shows it while live. New `marks` prop puts answers, stops and pauses between steps, one quiet line each. Stopped steps and runs use the new `stopped` orb.
- 7b3fc1c: StatusOrb: add `queued`, `paused` and `stopped`, each a still glyph (clock, pause, stop) on its own `--c-status-orb-*` token. A run someone stopped no longer has to borrow `idle`.

### Patch Changes

- 79a2d40: RunTrace fades its reasoning with a plain mask-image instead of Tailwind's mask-t-* utilities, so no app ships their @property rules: 0.2 KB gzipped off every app's CSS. No visual change.
- Updated dependencies [7b3fc1c]
  - @unicron/tokens@0.16.0

## 0.23.0

### Minor Changes

- 1399505: Add `AgentPrompt` (security family): an agent's permission, continue or choice question inline in the conversation, with an attention edge, buttons or numbered rows, Y/N and 1-9 keys for the newest prompt, a bottom sheet on a phone, and a "Waiting for you" announcement. New `--c-agent-prompt-*` knobs.
- 7aac96b: Add `Progress` (Base UI, through the transform): a bar, or `variant="segmented"` for "3 of 7"; the fill turns `success` when complete, and `tone="budget"` warns past 70% and turns destructive past 90%. New `--c-progress-*` knobs.
- 11d63e2: Add `Collapsible` (Base UI, through the transform) and `RunTrace`: an agent run's steps, open on the current step while live, folded to one line (time, steps, failures) when done; step detail opens in a popover, or a sheet on a phone.
- 57731d3: Add `StatusOrb` (idle, thinking, working, needs-you, done, failed, offline; told apart by shape and motion as well as colour, its words in the tooltip and name) and an `indicator` prop on `AppFrameNavItem` and `Item` (`{ kind: "attention" | "unread", count }`: a dot on the rail, the pivot and rows, a count badge on the bottom bar). New `--c-status-orb-*` and `--c-indicator-*` knobs.
- 0a0b34b: Add the `success`, `attention` and `running` status roles (fill, `-foreground`, `-surface`) and the `--motion-spin` and `--motion-pulse` roles. `@unicron/ui` adds a system-wide reduced-motion layer, runs `animate-spin` and `animate-pulse` on the motion roles, and gives `Spinner` a `label` (it now reaches screen readers; it was `aria-hidden`).

### Patch Changes

- af6a948: Docs: pass `useResizablePanesLayout`'s `defaultLayout` and `onLayoutChanged` by name. Spreading them onto `ResizablePanes` counts against a consumer's `dsa` ratchet.
- Updated dependencies [1399505]
- Updated dependencies [7aac96b]
- Updated dependencies [57731d3]
- Updated dependencies [0a0b34b]
  - @unicron/tokens@0.15.0

## 0.22.0

### Minor Changes

- ba743b6: Add `UpdateStatusRow` and `AutoCheckSwitch`, the updates part of an app's Settings → About: pass the update kit's `UpdateStatus`, the app's name and callbacks (`onCheck`, `onRestart`, `onReload`, `onCheckedChange`), and drop your own section. Also exports `updateLine(status, appName)` for a menu or palette, `canCheckForUpdates`, `updateWords` and the `UpdateStatus` types.

## 0.21.0

### Minor Changes

- 40efd30: Add `AppFrameDetail`, for what belongs to the content rather than being another place: it sits beside the content, takes the far side of a book-pose fold, or slides over, following the new `viewport.detailPlacement`.

## 0.20.0

### Minor Changes

- bb9b169: `AppFrame` can now hold columns on the left: `AppFramePivot` and `AppFramePivotEnd` for top-level places, and `AppFrameSidebar` for a list beside the content. New tokens: `--c-app-frame-pivot-width` and `--c-app-frame-sidebar-width`. Existing frames are unchanged, because unused columns take no room.

### Patch Changes

- Updated dependencies [bb9b169]
  - @unicron/tokens@0.14.0

## 0.19.0

### Minor Changes

- caa53e0: `AppFrame` no longer runs off the screen in a home-screen app: it measures the page rather than trusting `100vh`. `AppFrameNav` is now a floating glass capsule of icons, like the bars in iOS 27, and a pill at the foot of the right edge when height is scarce, as on iPhone Duo. `AppFrameNavItem`'s `label` is now for screen readers only. New: `useViewport().navPlacement` and `pageHeight`, the `nav-rail:` variant, `bleed` on `AppFrameMain`, `--c-app-frame-nav-gap` and `--c-app-frame-nav-item-width`.

### Patch Changes

- Updated dependencies [caa53e0]
  - @unicron/tokens@0.13.0

## 0.18.0

### Minor Changes

- cf2005f: Adds what an app needs to fit every screen: phones on their side, tablets, foldables and the iPhone Duo. `AppFrame` (the outermost box: page lock, safe areas, keyboard), `AppFrameNav` (a tab bar that becomes a rail on a short screen), `FoldPanes`, `useViewport`, the `short:`, `fold-book:`, `fold-tabletop:`, `standalone:`, `frame-tight:` and `frame-minimal:` variants, an `ultrawide:` breakpoint, and `--c-app-frame-*` tokens. See docs/05-consuming.md, "Fit every screen". Every app gets these without changing anything: `Input`, `Textarea`, `NativeSelect` and `CommandInput` stay at 16px on touch, so iOS no longer zooms into them on a tablet or a phone on its side (their text is 14px only with a mouse now). `Textarea` and `Empty` tighten up on a short screen, side and bottom `Sheet`s keep clear of the notch, and a finger beside a `ResizableHandle` grabs it even when the pane under it scrolls.

### Patch Changes

- Updated dependencies [cf2005f]
  - @unicron/tokens@0.12.0

## 0.17.0

### Minor Changes

- f7efbba: Dialog footers stay edge to edge when a dialog's padding changes.
  
  - **New token `--c-dialog-padding`** (1rem, the `p-4` the dialog always had). `DialogContent` pads by
    it. `DialogFooter` (and `DialogActions`) reaches out by it to the popup's edges, pads its buttons by
    it so they line up with the content, and a sticky footer pins by it.
  - **Before**, the footer's bleed was fixed at `-mx-4 -mb-4`. A dialog with `p-6` got a footer that
    stopped 0.5rem short of each edge.
  - **To change one dialog's padding**, set the variable: `className="[--c-dialog-padding:1.5rem]"`.
    Don't use `p-*` on `DialogContent`; the footer can't follow a class. To change every dialog,
    re-map the token in the app's extension layer.
  - Nothing changes for a dialog that keeps the default padding.
- dd50ba2: Adds `Popover` and `Select`.
  
  - **`Popover`** is for content a tooltip can't hold: interactive, or longer than a few words. New token `--c-popover-width` (18rem).
  - **`Select`** is a styled list for options that need more than plain text. `NativeSelect` stays the default for a form. Pass `items` so the trigger shows an option's label before the list has opened.
  - `SelectContent` takes the same `width` as `DropdownMenuContent` (`trigger`, `fit`, `auto`), with `fit` as its default. Nothing changes for existing menus.
- bae6d51: Adds `ResizablePanes`, `ResizablePane` and `ResizableHandle`, for panes a person can drag to resize.
  
  - `ResizableHandle` needs a `label`, its screen reader name. `withGrip` adds a visible grip for touch.
  - `useResizablePanesLayout` remembers a layout between visits, and `useResizablePaneRef` collapses or resizes a pane from code.
  - Adds one dependency, `react-resizable-panels`.

### Patch Changes

- Updated dependencies [f7efbba]
- Updated dependencies [dd50ba2]
  - @unicron/tokens@0.11.0

## 0.16.0

### Minor Changes

- f63af14: Menus sized apart from their trigger, wider dialogs, a prop for closing on an outside click, and sticky footers. From Synapse's app review (2026-10-28).
  
  - **Menu width.** `DropdownMenuContent width`: `"trigger"` (the default, as before: exactly the
    trigger's width), `"fit"` (as wide as its items, at least the trigger), or `"auto"` (as wide as
    its items, whatever the trigger). `fit` and `auto` stop at `--c-menu-max-width` (20rem, new) and
    wrap long labels past it; every list is at least `--c-menu-min-width` (8rem, new).
    `DropdownMenuSubContent` defaults to `"auto"`, so a submenu's floor moves from 6rem to 8rem.
  - **Dialog widths are ranges.** Each `DialogContent size` now fits its content between a min and a
    max width (`--c-dialog-<size>-min-width` / `-max-width`, new). Each min is the old fixed width,
    so no dialog gets narrower; one with long lines or wide content gets wider, up to `sm` 28rem,
    `md` 36rem, `lg` 42rem, `xl` 56rem, `2xl` 64rem. Check dialogs that relied on a fixed width.
    New size `xs` (16–20rem), allowed only under the rule in docs/03-components.md (Dialog widths).
    `CommandDialog` keeps a fixed width, its size's min. The popup carries `data-size`.
  - **`closeOnOutsideClick`** on `Dialog`, `Sheet` and `CommandDialog`: on by default, as before.
    Pass `false` for unsaved work, a destructive step, or a detail sheet beside a list. Escape and
    the close button still close. Base UI's `disablePointerDismissal` still works and wins.
  - **`sticky`** on `DialogFooter`, `DialogActions` and `SheetFooter`: pins the footer to the bottom
    of what scrolls around it and makes it opaque. Off by default.
- e8e7c4f: Visual QA fixes from 2026-10-28, and a pressed state for buttons and rows.
  
  - **`DropdownMenuLabel` no longer crashes outside a group.** On its own it draws a plain label; inside
    `DropdownMenuGroup` or `DropdownMenuRadioGroup` it still names the group.
  - **Rings clear 3:1.** The destructive Button and Badge use the shared focus ring (theirs was 1.43:1
    in light). The `aria-invalid` ring on every control is now `ring-destructive/60` (dark `/50`), up
    from `/20` (`/40`). Both are in the contrast gate. Invalid fields draw a stronger red ring.
  - **`Button size="inline"` is underlined at rest.**
  - **`.light` scope.** Light tokens are emitted on `:root, .light`, and the `dark:` variant stops at a
    nested `.light`, so a light box inside a dark page stays light.
  - **Command scrolls only its list.** cmdk's `scrollIntoView` used to scroll the page to an inline
    Command on mount.
  - **ghost-destructive hovers on its own tint** (`bg-destructive/10`, dark `/20`), so the hover shows
    on a muted footer.
  - **Motion roles.** New `--motion-fast` (120ms), `--motion-base` (200ms), `--motion-ease`. Tailwind's
    default transition runs on them (`--default-transition-duration`, `-timing-function`,
    `ease-standard`). Dialogs enter in 120ms (were 100ms); toasts move on 200ms (sonner's 400ms ease);
    Button transitions only the properties it changes.
  - **Pressed (`active:`) state** on every Button variant and interactive `Item` row, different from
    hover, with its contrast gated.
  - Docs: the disabled-control contrast exemption, `.light`, motion and pressed states.

### Patch Changes

- Updated dependencies [f63af14]
- Updated dependencies [e8e7c4f]
  - @unicron/tokens@0.10.0

## 0.15.0

### Minor Changes

- 8b6b9cd: Three text levels instead of two, so lower-emphasis text reads as more than one level.
  
  - `--support-foreground` (new) is Emphasis Engine's text level 4, for the lines that explain:
    `neutral.650` (new) in light, `neutral.150` (new) in dark. `type-support` and the dialog, sheet,
    field, item and empty-state descriptions use it.
  - `--muted-foreground` stays level 3, for the lines that label: meta, captions, overlines,
    placeholders, inactive tabs, keys.
  - `type-overline` is weight 500 (was 600): at 600 the smallest label drew as strong as the level above.
  - Icons inside secondary text take weight 300 (`--c-icon-wght`), so they draw at the text's level.
  - `contrast.mjs` gates each adjacent pair of levels at least Lc 10 apart, coded.
  
  Measured in WebKit on Synapse, the three levels draw about 99, 83 and 70 in light and 99, 85 and
  73 in dark: at least 12 apart, where seven lower roles used to share one level.

### Patch Changes

- Updated dependencies [8b6b9cd]
  - @unicron/tokens@0.9.0

## 0.14.1

### Patch Changes

- 7b5c300: `buttonVariants` merges its own classes, so a link drawn as a button keeps its outline. Before, the
  base's `border-transparent` and the outline variant's `border-border` both landed in the class list,
  and the transparent one won in light mode: a `<Link className={buttonVariants({ variant: "outline" })}>`
  had no edge beside a real `Button`.

## 0.14.0

### Minor Changes

- 5f7a8c7: Secondary text sits a level below primary text, as Emphasis Engine places it, and still reads APCA
  Bronze everywhere.
  
  - `--muted-foreground` is Emphasis Engine's text level 3: `neutral.550` (new) in light, `neutral.250`
    (new) in dark. It reads Lc 81 on white and Lc 80 on the dark page, where before it read Lc 87 and
    88, almost as strong as primary text.
  - `--muted-foreground-on-fill` (new): secondary text on a fill, a shade stronger in light
    (`neutral.600`) so it reads Lc 77 on `bg-muted`. `@unicron/ui`'s styles re-point
    `--muted-foreground` at it inside a fill (`bg-muted`, `bg-accent`, `bg-secondary`,
    `bg-sidebar-accent`, highlighted and selected items, keys), so nothing else changes.
  - `contrast.mjs` gates the gap between the levels: primary and secondary text at least Lc 20 apart
    on each surface they share (now 24.7 in light, 25.5 in dark). The old values fail it (18.9).
- 6c9e3d3: Text roles, icons that keep their case, and sheet actions beside the close button.
  
  - **Text roles** (`type-page-title`, `type-section-title`, `type-group-title`, `type-body`,
    `type-body-strong`, `type-support`, `type-meta`, `type-overline`, `type-measure`), documented
    in DESIGN.md: every size comes from a role, never a hand-picked pixel size.
  - **`Icon`** never takes the surrounding text's case or tracking: in an uppercase label, "link"
    became "LINK", which isn't an icon, and the letters showed.
  - **`SheetHeaderActions`**: a sheet's own actions in one row with its close button, at its top
    and size (`IconButton size="icon-sm"`), so the icons line up; the header keeps clear of both.

### Patch Changes

- Updated dependencies [5f7a8c7]
  - @unicron/tokens@0.8.0

## 0.13.1

### Patch Changes

- 7895e13: Icon: icons show in WebKit (Safari and Mac app web views). The glyph is anchored at the left edge instead of centred with `text-anchor="middle"`, which WebKit measures before the ligature joins the letters, pushing the icon out of its box. No change in Chromium or Firefox.

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
