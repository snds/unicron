# 03 · Components

`@unicron/ui` is the set of React parts the four apps share. Most of the small ones began as
shadcn/ui primitives (`base-nova` style) on Base UI, generated once and then owned as source.
The parts 1.0 added (the shell, the rows, the chat and security parts) are hand-written from the
2026-11 Figma file. Every one draws with the tokens in [02 · Tokens](02-tokens.md) and follows
the look in [DESIGN.md](../DESIGN.md).

Import from the package root:

```tsx
import { Button, Dialog, DialogContent, Icon } from "@unicron/ui"
```

Each module is also a subpath (`@unicron/ui/button`, `@unicron/ui/security/code-display`). The
parts of the frame are not: import them from `@unicron/ui/app-frame`. A few modules keep helpers
for their sibling files; those helpers are not exported from the root
(`packages/ui/src/index.test.ts` holds the list).

## Modules

The family column is framework 09's taxonomy. `dsa` uses the same families to tell a **variant**
(one family) from a **pattern** (two or more). `Shell`, `Chat` and `Security` are this system's
own families: a shell part sets the layout an app would otherwise write with classes.

"1.0" in the last column marks a module that is new in 1.0. Every other module existed before and
was restyled; [07 · Migrating to 1.0](07-migrating-to-1.0.md) lists what changed in each.

### Shell: the frame and its chrome

| Module | Exports | Family | Base |
|---|---|---|---|
| `app-frame` | `AppFrame` (`layout`, `minimized`, `contained`, `focus`), `AppFrameMain`, `AppFrameList` (`size`: default, narrow, fill), `AppFrameDetail` (`open`, `onBack`, `size`), `AppFrameColumn` (`reading`), `AppFrameReading`, `AppFrameInset` (`fill`), `AppFramePageHead` (PageHead's props, plus `gap` and `below`), `AppFrameSidePanel`, `AppFramePeek`, `AppFrameCompanion`, `FoldPanes`. `onRefresh` on a list, a detail or a column is pull to refresh. Hooks: `useAppFrame`, `useScrollMinimize`, `usePullToRefresh`, `useAppFrameColumnShown`. Helpers: `isPhoneLayout`, `isExpandedWidth`, `toastPlacementFor`, `MINIMIZE_RESTORE_AT` | Shell · Layout | div / main / section. Restructured in 1.0 |
| `app-frame` (phone) | `AppFrameTopRow` (`lockup`, `actions`, `title`, `switcher`), `AppFrameBottomRow` (`variant`: tabs, detail; `start`, `tabs`, `fill`, `end`), `AppFrameAccessory` (Accessory's props, plus `scrolledOnly`), `AppFrameScrollEdge` (`edge`) | Shell · Phone chrome | div; portals into the frame's slots. 1.0 |
| `app-frame` (desktop) | `AppFrameSidebar` (`lockup`, `switcher`, `action`, `footer`, `footerControl`, `collapsed`, `drawerOpen`, `leadingInset`), `AppFrameSwitcher`, `AppFrameStatusLine` (`crumbs`, `badge`, `back`), `StatusItem` (`tone`: neutral, live, warning, critical; `mark`, `text`, `short`, `countdown`, `progress`, `action`, `announce`), `AppFrameTopBar` (`lockup`, `tabs`, `status`, `action`, `actions`, `back`), `formatCountdown` | Shell · Desktop | nav, header, Base UI Button, DropdownMenu. 1.0 |
| `app-frame` (focus) | `AppFrameFocus` (`lockup`, `folio`): one centred column for sign-in, unlock and first run | Shell | main. 1.0 |
| `app-frame` (deprecated) | `AppFrameNav`, `AppFrameNavItem`, `AppFrameNavEnd`: the 0.x capsule's names, drawn as a plain row of float buttons so old code compiles. They will be removed | Shell | nav |
| `settings-frame` | `SettingsFrame` (`sections`, `value`, `onValueChange`, `search`, `overview`, `head`), `SettingsSection` | Shell · Pattern | AppFrameList + AppFrameDetail, NavItem, NavSection. 1.0 |
| `context-panel` | `ContextPanel` (`state`: open, rail, hidden; `tabs`, `value`, `sheet`, `artifact`), `ContextPanelTab`, `ContextPanelState` | Shell · Navigation | aside, a tablist of Base UI Buttons, Rail. 1.0 |
| `use-viewport` | `useViewport`, `viewportWidthFor`, `detailPlacementFor`, `VIEWPORT_WIDTHS`, `SHORT_HEIGHT`, `DETAIL_MIN_WIDTH`, types `Viewport`, `ViewportWidth`, `ViewportFold`, `ViewportRoom`, `ViewportNavPlacement`, `ViewportDetailPlacement`. Width classes: `compact` under 600, `medium` 600 to 1023, `expanded` from 1024, `wide` from 1280, `ultrawide` from 2560 | Layout | hook. Widths changed in 1.0 |
| `app-lockup` | `AppLockup` (`name`, `initial`, `showName`, `mark`, `render`) | Shell | div (useRender). 1.0 |
| `tab-bar` | `TabBar` (`label`, `value`, `onValueChange`, `onReselect`, `navigation`: tabs, links; `orientation`: horizontal, vertical; `minimized`), `TabBarItem` (`value`, `icon`, `label`, `mark`, `href`, `render`) | Shell · Navigation | tablist or nav; buttons or links (useRender). 1.0 |
| `accessory` | `Accessory` (`tone`: neutral, live, needs-you, critical; `meta`, `title`, `action`, `compact`, `onOpen`, `openLabel`, `onSwipeUp`, `onDismiss`, `progress`, `countdown`, `announce`) | Shell · Feedback | div + Base UI Button, Button, Progress. 1.0 |
| `nav-item` | `NavItem` (`label`, `icon`, `index`, `mark` or `count`, `current`, `checked`, `level`, `expanded`, `action`, `description`, `tone`, `swatch`, `disabled`, `href` or `render`), `NavSection` (`title`, `count`, `action`, `collapsed`, `checkable`: multiple, single; `tree`) | Shell · Navigation | a link or a button (useRender) in a list; a radio group or a tree when asked. 1.0 |
| `top-tabs` | `TopTabs` (`label`), `TopTab` (`label`, `index`, `icon`, `current`, `mark`, `href` or `render`) | Shell · Navigation | nav of links (useRender). 1.0 |
| `rail` | `Rail` (`edge`), `RailItem` (`label`, `icon`, `state`: default, active, live; `mark` or `count`, `liveLabel`), `railItemVariants`. The shared mark: `NavMark`, `NavMarkTooltipKeys`, `formatNavCount`, types `NavMarkProp`, `NavMarkTone`, `NavMarkResolved`, `NavMarkPlacement` | Shell · Navigation | toolbar of Tooltip + Base UI Button. 1.0 |
| `page-head` | `PageHead` (`title`, `overline`, `size`: lg, md, sm, xs; `count`, `meta`, `metaPosition`, `onMetaClick`, `metaLabel`, `status`, `actions`, `switcher`, `collapsed`) | Shell | h1 + Base UI Button. 1.0 |
| `top-bar` | `TopBar` (`title`, `titleAs`, `onBack`, `backLabel`, `start`, `actions`): a phone's pushed screen | Shell | FloatButton. 1.0 |

### Actions

| Module | Exports | Family | Base |
|---|---|---|---|
| `button` | `Button` (`variant`: default (Primary), secondary = outline (the ink outline), ghost, destructive (the critical fill), link, ghost-muted, ghost-destructive, needs-you, needs-you-outline, needs-you-text; `size`: default 40, sm 32, lg 48, icon, icon-sm, icon-lg, inline; `block`; `wrap`; `loading`; `disabledReason`; `indicator`), `buttonVariants`, `ButtonProps` | Action | Base UI Button |
| `float-button` | `FloatButton` (`label`, `icon`, `kind`: neutral, primary; `size`: m 44, l 48; `current`; `extended`; `mark`; `onLongPress`, `longPressLabel`; `tooltip`), `floatButtonVariants`, `floatButtonLongPressKeys` | Action | Tooltip + Base UI Button. 1.0 |
| `icon-button` | `IconButton` (`label`, `icon`, `tooltip`, `shortcut`, `render`, `indicator`; Button's `variant` and `size`) | Action | Tooltip + Button, or any `render` |
| `split-button` | `SplitButton` (`menuLabel`, `menu`, `menuProps`, `menuDisabled`; Button's props) | Action | Button + DropdownMenu. 1.0 |
| `toggle` | `Toggle` (`size`: default 40, sm 32, lg 48; pressed is inverted ink), `toggleVariants` | Action | Base UI Toggle |
| `toggle-group` | `ToggleGroup`, `ToggleGroupItem` (`indicator`, as on Button) | Action | Base UI ToggleGroup |
| `button-group` | `ButtonGroup`, `ButtonGroupText`, `ButtonGroupSeparator`, `buttonGroupVariants`. Joined parts share one 1px edge | Action | div (useRender) |
| `toolbar` | `Toolbar` (`size`: sm, default; `orientation`), `ToolbarButton` (`label`, `icon`, `shortcut`), `ToolbarToggle`, `ToolbarGroup`, `ToolbarSeparator` | Action | Base UI Toolbar. 1.0 |

### Forms

| Module | Exports | Family | Base |
|---|---|---|---|
| `text-field` | `TextField` (`label`, `helper`, `error`, `invalid`, `leading`, `trailing`, `disabledReason`; `multiline` with `minRows` and `maxRows`; `type="number"` with steppers), `SearchField` (search glyph, clear, Escape) | Form | input / textarea; Base UI NumberField. 1.0 |
| `chip-field` | `ChipField` (values as chips in the field box; Enter, comma, paste, Backspace; `isInvalid`, `renderChip`) | Form | input. 1.0 |
| `input` | `Input`, `fieldBoxVariants` (the Text Field box, for a part that draws its own field) | Form | Base UI Input |
| `textarea` | `Textarea` (as tall as `rows`; for a field that grows, `TextField multiline`) | Form | textarea |
| `input-group` | `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText`, `InputGroupInput`, `InputGroupTextarea` | Form | div |
| `label` | `Label` (`variant`: field, the mono caps overline; choice, running text beside a checkbox, radio or switch), `labelVariants` | Form | label |
| `field` | `Field`, `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldLabel`, `FieldContent`, `FieldTitle`, `FieldDescription`, `FieldSeparator`, `FieldError`, `FieldDisabledReason`, `useDisabledReason` | Form | div / fieldset |
| `checkbox` | `Checkbox` (a 16px square; checked is ink with a check; `indeterminate`) | Form | Base UI Checkbox |
| `radio-group` | `RadioGroup`, `RadioGroupItem` (a 16px square; chosen is an ink square inside), `RadioRow` (a choice with a sentence; `rule`) | Form | Base UI RadioGroup, Radio. 1.0 |
| `switch` | `Switch` (Figma's Toggle: a 44 × 24 track and a square knob; one size) | Form | Base UI Switch |
| `toggle-row` | `ToggleRow` (Switch's props, plus `label`, `description`, `badge`, `meta`, `rule`, `inset`, `disabledReason`; the whole row is the target) | Form | Base UI Switch. 1.0 |
| `select` | `Select`, `SelectTrigger` (`size`: default 48, sm 40), `SelectValue`, `SelectContent` (`width`, `alignItemWithTrigger`), `SelectGroup`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton` | Form | Base UI Select |
| `native-select` | `NativeSelect` (`size`: default, sm), `NativeSelectOption`, `NativeSelectOptGroup` | Form | select |
| `filter-chip` | `FilterChip` (`value`, `count`, `active`; `kind`: toggle, trigger, button), `FilterChipGroup` (`type`: single, multiple; `scroll`, `action`, `label`), `filterChipVariants` | Form | Base UI Button. 1.0 |

### Rows and data

| Module | Exports | Family | Base |
|---|---|---|---|
| `list-row` | `ListRow` (`layout`: inline, message; `selected`, `tone`: neutral, live; `metaStyle`: label, plain; `size`: default, compact; inline: `index`, `title`, `meta`, `status`, `badge`, `detail`, `progress`; message: `sender`, `time`, `subject`, `preview`, `unread`, `count`, `tag`, `account`, `previewLines`; both: `leading`, `marks`, `action`, `menu`, `disabled`, `disabledReason`, `href` or `onClick` or `mainRender`, `render`), `formatListCount` | Data Display | div + a link or a Base UI Button. 1.0 |
| `swipe-row` | `SwipeRow` (`leading`, `trailing`, `defaultOpen`, `onOpenChange`, `menuLabel`), `SwipeAction` (`tone`: primary, neutral, needs-you), `swipeActionVariants`, `useSwipeRowActions`, `SwipeRowMenuItems`, types `SwipeRowAction`, `SwipeRowRunAction`, `SwipeRowConfirmAction` | Data Display | pointer events + Base UI Menu. 1.0 |
| `field-row` | `FieldRow` (`size`: default 52, display 64, stacked 64; `label`, the value as children, `badge`, `description`, `meta`, `action`, `menu`, `menuLabel`, `rule`, `inset`, `disabledReason`), `FieldRowAction` (a text action, flush right; `href` for a link), `FieldRowValue` (`truncate`: middle, end, wrap; `keepEnd`), `FieldRowOverflow`, `useFieldRow`, `fieldRowVariants` | Data Display | div (role group) + Button. 1.0 |
| `item` | `Item` (`variant`: default, outline, muted; `size`: default, sm, xs; `indicator`), `ItemMain`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemHeader`, `ItemFooter`, `ItemGroup` (a list; each row is a list item), `ItemSeparator` | Data Display | div (useRender) |
| `section-header` | `SectionHeader` (`title`, `count`, `level`, `variant`: default, index; `inset`, `action`, `collapsible`, `summary`) | Layout | h2 to h6 + Base UI Collapsible. 1.0 |
| `table` | `Table` (`stickyHeader`, `selectable`, `label`), `TableHeader`, `TableBody`, `TableFooter`, `TableRow` (`selected`), `TableHead` (`numeric`), `TableCell` (`numeric`), `TableCaption` | Data Display | table. 1.0 |
| `metric` | `Metric` (`label`, `value`, `delta`, `tone`: neutral, up, down, live; `size`: default, hero; `unit`, `valueTone`, `badge`, `href` or `render`) | Data Display | div or a link (useRender). 1.0 |
| `meta-list` | `MetaList`, `MetaItem` (`label`): a mono label over a value, in columns | Data Display | dl. 1.0 |
| `steps` | `Steps`, `Step` (`title`, `status`: done, current, upcoming, failed; `statusLabel`, `live`, `index`, `leading`, `detail`, `badge`, `action`, `href` or `onClick`, `disabled`), `StepsFolio` (`current`, `total`, `title`), `stepStatusWords` | Navigation | ol. 1.0 |
| `tile` | `Tile` (`edge`: primary, none; `swatch`, `size`: default, compact; `selected`, `href` or `onClick`), `tileVariants`, `swatchFillClasses`, `SwatchId` | Layout | div, button or link (useRender). 1.0 |
| `calendar-event` | `CalendarEvent` (`tone`: primary, neutral; `time`, `title`, `place`, `swatch`, `compact`, `selected`, `mark`, `href`), `calendarEventVariants` | Data Display | button or link (useRender). 1.0 |
| `log-row` | `LogRow` (`time`, `dateTime`, `href`, `link`) | Data Display | div or link (useRender). 1.0 |
| `diff-block` | `DiffBlock` (`path`, `previousPath`, `state`, `lines` or `diff`, `stats`, `additions`, `deletions`, `lineNumbers`, `foldable`, `maxLines`, `wrap`, `wrapToggle`, `copy`, `actions`), `parseDiffLines`, `parseUnifiedDiff` | Data Display | section. 1.0 |
| `file-chip` | `FileChip` (`name`, `type`, `size`, `thumbnail`, `busy`, `critical`, `href` or `onClick`, `action`) | Data Display | div + a link or a button. 1.0 |
| `highlight` | `Highlight` (`text` and `query`, or children), `highlightParts` | Data Display | mark. 1.0 |
| `truncated-text` | `TruncatedText` (`lines`, `cut`: end, middle; `side`, `render`), `middleCut`, `TRUNCATION_MARK` | Data Display | Base UI Tooltip. 1.0 |
| `initial-tile` | `InitialTile` (`initials`, `src`, `name`, `size`: s 24, m 40, l 64), `initialTileVariants` | Data Display | Base UI Avatar. 1.0 |
| `avatar` | `Avatar` (`size`: default, sm, lg), `AvatarImage`, `AvatarFallback`, `AvatarBadge` (`tone`: neutral, live), `AvatarGroup`, `AvatarGroupCount` | Data Display | Base UI Avatar |
| `badge` | `Badge` (`tone`: neutral, live, needs-you, critical, warning, success; `variant` is deprecated), `badgeVariants`, `BadgeTone`, `BadgeVariant` | Data Display | span (useRender) |
| `chip` | `Chip` (`variant`: muted, secondary, outline; `tone`: neutral, critical), `ChipAction`, `ChipRemove` | Data Display | span (useRender) + Base UI Button |
| `kbd` | `Kbd`, `KbdGroup` | Data Display | kbd |

### Feedback

| Module | Exports | Family | Base |
|---|---|---|---|
| `needs-you` | `NeedsYou` (`title`, `more`, `body`, `action`, `secondaryAction`, `secondaryActions` (two at most), `size`: default, compact; `announce`), `NeedsYouProvider`, `useNeedsYouCompactShowing` | Feedback | section + a status region. 1.0 |
| `banner` | `Banner` (`tone`: critical, info, warning, success; `size`: default, compact; `icon`, `title`, `body`, `action`, `onDismiss`), `bannerVariants`, `bannerIcons` | Feedback | div (alert or status). 1.0 |
| `empty` | `EmptyState` (`overline`, `title`, `body`, `action` or `actionLabel` with `onAction`, `tone`: neutral, critical; `size`); the parts: `Empty` (`size`), `EmptyHeader`, `EmptyOverline`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`, `emptyVariants` | Feedback | div |
| `progress` | `Progress` (`variant`: bar, segmented; `segments`, 32 by default; `tone`: default, neutral, primary, live, warning, critical, budget; `tick`), `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue`, `progressBudgetThresholds`, `progressDefaultSegments` | Feedback | Base UI Progress |
| `skeleton` | `Skeleton` (`variant`: default, row), `skeletonVariants` | Feedback | div |
| `spinner` | `Spinner` (svg props, plus `label`, "Loading" by default). One eased turn a second; still under reduced motion | Feedback | an SVG arc on the icons' 32 grid |
| `sonner` | `Toaster`, `toast` (`toast.success`, `.info`, `.warning`, `.error`, `.dismiss`; options `description`, `action`, `takeFocus`, `returnFocus`, `tone`, `duration`), `toastDurations`, `ToastOptions`, `ToastAction` | Feedback | a copy of sonner with no style tag (`vendor/sonner.js`) |
| `status-orb` | `StatusOrb` (ten states, told apart by shape and motion as well as colour), `statusOrbCopy`, `statusOrbStates` | Feedback · Agent | span + Icon + Tooltip |
| `indicator` | `IndicatorMark`, `indicatorCopy`, `indicatorLabel`, `indicatorCount`, `indicatorsOf`, `indicatorOnControl`, types `Indicator`, `IndicatorProp` (the `indicator` prop on Button, IconButton, ToggleGroupItem and Item: unread or attention, a square or a count, the words in the name) | Feedback | span |
| `run-trace` | `RunTrace` (an agent run: open on the current step while live, one line when done; `marks` between steps; step detail in a popover, a sheet on a phone), `runTraceCopy`, `formatRunDuration`, types `RunStep`, `RunStepState`, `RunMark` | Feedback · Agent | Collapsible + StatusOrb + IconButton + Popover / AdaptiveSheetContent |
| `check-draw` | `CheckDraw` (a check mark that draws itself once; decorative) | Feedback | an SVG path |
| `update-status` | `UpdateStatusRow`, `AutoCheckSwitch`, `updateLine`, `canCheckForUpdates`, `updateWords`, types `UpdateStatus`, `UpdateState`, `UpdateChannel`, `UpdateWords` | Feedback · Settings | the Field Row look; ToggleRow |

### Overlays and menus

| Module | Exports | Family | Base |
|---|---|---|---|
| `dialog` | `Dialog` (`closeOnOutsideClick`), `DialogTrigger`, `DialogContent` (`size`: question, review, form, compose, viewer, full; `showCloseButton`, `closeLabel`, `notice`, `container`, `beforeContent`, `initialFocus`), `DialogHeader`, `DialogOverline`, `DialogTitle`, `DialogDescription` (`size`: caption, body), `DialogBody`, `DialogFooter` (`sticky`), `DialogActions`, `DialogAction` (`kind`: confirm, cancel, destructive; `icon`), `DialogClose`, `DialogOverlay`, `DialogPortal`, `dialogSizeName`, `DialogSize` | Overlay | Base UI Dialog |
| `confirm-dialog` | `ConfirmDialog` (`title`, `description`, `confirmLabel`, `cancelLabel`, `tone`: default, destructive; `onConfirm`, `confirmDisabled`, `disabledReason`, `error`, `notice`, children), `ConfirmDialogConsequences`, `ConfirmDialogConsequence` (`icon`) | Overlay | AdaptiveDialog. 1.0 |
| `sheet` | `Sheet` (`closeOnOutsideClick`), `SheetTrigger`, `SheetContent` (`side`, `size`, `height`: content, full; `showCloseButton`, `backdrop`, `notice`, `container`, `beforeContent`), `AdaptiveSheetContent` (`wide`, `height`), `SheetHeader`, `SheetHeaderActions`, `SheetOverline`, `SheetTitle`, `SheetDescription` (`size`), `SheetBody`, `SheetFooter` (`sticky`), `SheetClose` | Overlay | Base UI Dialog |
| `adaptive` | `AdaptiveDialog`, `AdaptiveMenu`, `AdaptiveMenuItem` (`icon`, `shortcut`, `count`, `current`, `variant`), `AdaptiveMenuGroup`, `AdaptiveMenuSeparator`, `AdaptiveMenuRadioGroup`, `AdaptiveMenuRadioItem`, `AdaptiveMenuCheckboxItem`, `AdaptivePopover`, `OverflowMenu` (`label`, rows, `trigger`), `overflowMenuLabel`, `useAdaptiveSheet`, `useLayerOpen`; `presentation`: auto, desktop, sheet | Overlay | Dialog, DropdownMenu, Popover, Sheet + `useViewport`. 1.0 |
| `popover` | `Popover`, `PopoverTrigger`, `PopoverContent` (`scrim`, `container`), `PopoverHeader` (`overline`, `title`, `showCloseButton`), `PopoverTitle`, `PopoverDescription`, `PopoverClose` | Overlay | Base UI Popover |
| `tooltip` | `Tooltip`, `TooltipTrigger`, `TooltipContent` (`container`), `TooltipProvider` | Overlay | Base UI Tooltip |
| `dropdown-menu` | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent` (`width`, `scrim`, `container`), `DropdownMenuItem` (`variant`: default, destructive; `current`), `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuWidth` | Navigation | Base UI Menu |
| `command` | `Command` (`match`), `CommandDialog` (`size`, `container`, `beforeContent`), `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandItemAction`, `CommandShortcut`, `CommandSeparator`, `commandItemActionShortcut` | Overlay | cmdk + Dialog |
| `tabs` | `Tabs`, `TabsList` (`variant`: default, a square segmented control; line, the Top Tab look; `size`: default, fill), `TabsTrigger` (`index`), `TabsContent`, `tabsListVariants` | Navigation | Base UI Tabs |

### Chat and content

| Module | Exports | Family | Base |
|---|---|---|---|
| `composer` | `Composer` (`value`, `onValueChange`, `onSend`, `placeholder`, `label`, `sending`, `streaming` with `onStop` and `stopping`, `waiting` with `onCancelWaiting`, `disabled`, `sendDisabled`, `disabledReason`, `size`: default, line; `sendKey`: enter, mod-enter, auto, none; `status`, `chips`, `attach`, `leadingAction`), `composerCopy` | Chat | form + textarea + Button. 1.0 |
| `chat-message` | `ChatMessage` (`role`: user, agent; `meta`, `state`: done, streaming, error; `phase`, `orb`, `endMarks`, `error`, `retry`, `actions`), `ChatMessageMetaButton`, `chatMessageCopy` | Chat | article. 1.0 |
| `artifact-card` | `ArtifactCard` (`icon`, `title`, `meta`, `selected`, `state`: ready, writing; `href`, `render`) | Chat | button or link (useRender). 1.0 |
| `summary-block` | `SummaryBlock` (`overline`, `lines`, children, `footer`, `caption`, `actions`, `state`: ready, loading, error; `error`), `summaryBlockCopy` | Chat | section. 1.0 |
| `prose` | `Prose` (`variant`: body, 16/24 with blocks 16 apart; response, 17/28 with blocks 24 apart, for what a model wrote and for a mail's body), `proseVariants` | Content | div. 1.0 |
| `code-block` | `CodeBlock` (`code`, `label`, `language`, `copy`, `wrap`), `CopyButton` (`text`, `label`, `copiedLabel`), `COPIED_FOR_MS`, `codeBlockCopy`, `copyButtonCopy` | Content · Action | figure + pre; IconButton. 1.0 |
| `icon` | `Icon` (`name`, `size`: md 20, sm 16, or a number; `label`, `tone`), `IconName`, `CoreIconName`, `IconSize`, `IconTone`, `UnicronIconRegistry`, `registerIcons`, `isIconName`, `iconNames`, `iconFromMaterial` | Content | inline SVG; IBM Carbon, a curated set (`src/icons/names.json`) |

### Layout helpers

| Module | Exports | Family | Base |
|---|---|---|---|
| `separator` | `Separator` (horizontal: 1px of paint that adds no height) | Layout | Base UI Separator |
| `scroll-area` | `ScrollArea`, `ScrollBar` | Layout | Base UI ScrollArea |
| `collapsible` | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` (`animate`) | Layout | Base UI Collapsible |
| `resizable-panes` | `ResizablePanes`, `ResizablePane`, `ResizableHandle`, `useResizablePanesLayout`, `useResizablePaneRef` | Layout | react-resizable-panels |

### Security

Each has a one-page spec in [`docs/specs/security/`](specs/security/README.md), and each is also a
subpath (`@unicron/ui/security/<name>`).

| Module | Exports | Family | Base |
|---|---|---|---|
| `security/secret-field` | `SecretField` (read: `size`: auto, default, stacked; `revealMode`, `format`, `gate`, `remote`, `fillOnly`, `menu`; edit: `value`, `onChange`, `strength`, `placeholder`, `stateText`, `actions`), `SecretFieldRemoteButton`, `useSecretFieldRemote`, `SecretFieldMenuItem`, `secretStrengthFromScore`, `spellSecret`, `secretFieldWords`, `secretFieldAnnouncements`, `secretFieldErrors`, `secretFieldFillOnlyText` | Form (security) | the Field Row look; the Text Field box; FloatButton |
| `security/code-display` | `CodeDisplay` (`layout`: field, row, tile, compact; `label`, `rule`, `menu`; `density` is deprecated), `CodeDisplayList` (`layout`: list, grid), `CodeDisplayMenuItem`, `codeDisplaySegments`, `groupCode`, `spellCode`, `codeDisplayAnnouncements` | Data Display (security) | segmented Progress, Badge |
| `security/approval-sheet` | `ApprovalSheet` (`kind`, `origin`, `context`, `matching`: enter, choose, compare, none; `title`, `overline`, `note`, `approveLabel`, `approveIcon`, `denyLabel`, `dismiss`: deny, keep), `approvalSheetCopy`, `approvalSheetOverline`, `approvalSheetWords`, `approvalSheetComparePrompt`, `approvalSheetOriginCopy`, `approvalSheetAnnouncements` | Overlay (security) | the review frame (Base UI Dialog), DigitGroups, Button, Progress |
| `security/agent-prompt` | `AgentPrompt` (`kind`: permission, continue, choice, reply; `options` with `safe`, `key` and `standing`; `overline`, `more`, `tier`, `expiresAt` with `safeAnswer`, `listen`, `autoFocus`, `sendLabel`, `layout`: adaptive, inline), `agentPromptKeys`, `agentPromptCopy`, `agentPromptLayout`, `formatPromptCountdown`, `AGENT_PROMPT_REPLY` | Feedback (security) | section + Button + Kbd + RiskTierBadge + TextField; a sheet on a phone |
| `security/crown-jewel` | `CrownJewelSurface`, `CrownJewelMark`, `CrownJewelGate`, `useCrownJewel`, `crownJewelGateErrors`, `CrownJewelProof` | Layout (security) | a section with re-mapped roles; the review frame |
| `security/risk-tier-badge` | `RiskTierBadge` (`tier`, `verified`, `size`, `explain`, `surface`: page, needs-you), `riskTierCopy`, `riskTiers`, `riskTierUnverifiedAnnouncement` | Data Display (security) | Badge's tones, Tooltip |
| `security/large-type-view` | `LargeTypeView` (a viewer; `print` draws the same layout in the page), `classifyChar`, `nameChar`, `captionFor`, `spellValue` | Overlay (security) | the review frame |
| `security/digit-groups` | `DigitGroups` (`value`, `groupSize`, `size`: sm, md, lg; `label`), `digitGroupSize`, `splitDigitGroups`, `spellDigitGroups` | Data Display (security) | span. 1.0 |
| `security/qr-code` | `QrCode` (`value` or `modules`, `label`, `errorCorrection`, `size`, `quietZone`), `encodeQrModules`, `qrPath`, `qrCodeTooLongText` | Data Display (security) | svg; `qrcode-generator` 2.0.4. 1.0 |
| `security/copy-countdown` | `useCopyCountdown` (the "Clears in 28 s", then "Cleared" a copied secret shows) | Feedback (security) | hook |

Also exported: `cn` (clsx + tailwind-merge), and the motion helpers and contracts
([Motion recipes](#motion-recipes)).

Not yet present (next candidates, in order of need across the four apps): `card`, `combobox`,
`alert-dialog` (a question is `ConfirmDialog`), `accordion`, `slider`. Generate them with the
transform (README → Regenerating components) rather than hand-writing.

## Conventions every component shares

**Structure**

- Every root element carries `data-slot="<name>"`; sub-parts carry `data-slot="<name>-<part>"`.
  Styling hooks, the browser gate and `dsa` all key on these.
- Variants are `cva` objects exported next to the component (`buttonVariants`), so a pattern can
  reuse them without wrapping.
- `kind`, `size` and `tone` props mirror the Figma properties of the same names.
- No component reads a `--g-*` token. Everything goes through tier 2 (roles) or tier 3 (knobs).
  No colour, px or motion literal sits in `packages/ui/src`; `pnpm lint:tokens` holds that.
- **Text is a type role.** A component writes `type-ui`, `type-overline`, `type-caption`, never
  `text-sm` or `font-medium`. Mixed sizes on one line sit on the baseline (`items-baseline`).
  `type-overline` and `type-meta` carry the label ink by default; a colour class on the same
  element wins.
- **Works under a strict policy.** No component adds a `<style>` tag at run time, writes a `style`
  attribute into static markup, or loads a font or an image from a `data:` URL. Setting a style
  through React's `style` prop is fine. Lockdown's web vault runs with `style-src 'self'`.
  Base UI adds a tag of its own to hide a scrollbar, in a scroll area and in a select's list.
  `ScrollArea` and `SelectContent` tell it not to (Base UI's `CSPProvider`, `disableStyleElements`),
  and the `no-scrollbar` utility hides the bar. That setting reaches everything inside the two: a
  Base UI part of your own placed there adds no tag either, and gets no nonce from a
  `CSPProvider` further up.

**Edges and space**

- **Strokes never add height.** An edge on a control or a row is an inset shadow, never a border:
  `rule-t`, `rule-r`, `rule-b`, `rule-l` (1px `line-rule`), `rule-box` (all four),
  `rule-box-emphasis` (2px; `--rule-color`, `primary-fill` by default), and the 2px identity edges
  `edge-l`, `edge-t`, `edge-b` (`--edge-color`, `primary-fill` by default). Each has its own
  layer, so they compose with each other and with a state's ring. On an element with a rule, set
  a shadow through those utilities, never a raw `box-shadow`.
- **A row draws its hairline on top** (`rule="top"`), so a list that mixes List Rows, Field Rows
  and Toggle Rows has one line between each.
- **Everything sits on the 4px grid.** A component's box is a multiple of 4px tall, and a gap
  between parts is a 4px step (2, 6, 10 and 14 only inside a component). The browser gate measures
  it on every view (`apps/playground/tests/rules.spec.ts`).
- **Every radius is 2px** (`rounded` and every `rounded-*` step). Marks are squares: unread, live,
  an indicator, a status orb's dot. `rounded-full` is not a control shape.
- **A control under 44px tall takes `hit-area`.** It widens the target to `size-touch-min` on a
  coarse pointer without moving anything drawn.

**States** (Figma draws none; these are the system's, and each is a question for Sean)

- **Hover and pressed.** Neutral and transparent parts take `bg-state-hover` and
  `bg-state-pressed` (6% and 10% of the body ink). A solid fill goes to 90% and 80% of itself.
- **Focus.** The stylesheet draws one ring for every element: 2px solid `--ring` (the body ink),
  2px clear. A control never writes `outline-none`. Three parts draw focus another way on purpose:
  a field shows a 2px inside border in `primary-fill` (`critical-fill` when invalid); a row draws
  the ring inside itself, so a scroller never clips it; inside a needs-you block, or on
  `on-needs-you`, the ring takes `needs-you-on-fill`.
- **Selected and current.** `primary-soft` with a 2px `primary-fill` left edge (`edge-l`), text
  in its usual inks. Never a solid primary. A pressed toggle, a chosen segment and an active
  Filter Chip are inverted ink (the body ink as the fill), never the identity colour.
- **Disabled.** 50% opacity and no pointer events. A control that is off for a reason the person
  can fix takes `disabledReason` instead: a visible line under it, tied by `aria-describedby`, and
  the control stays in the tab order (`aria-disabled`). Button, SplitButton, TextField, ChipField,
  FieldRow, ToggleRow, ListRow, Composer and ConfirmDialog's yes take it.
- **Loading.** `aria-busy`, a `Spinner` where the icon goes, the label kept. A loading button is
  not dimmed: it is busy, not unavailable.

**Emphasis** (the rules are in [DESIGN.md](../DESIGN.md#emphasis))

- One solid primary on a screen. The identity colour is for that action, for identity text and
  for selection. Live work is `secondary-live`. Only "this needs you" is yellow.
- On the yellow, use the `needs-you*` Button kinds: `needs-you` (the one solid action),
  `needs-you-text` (the second action) and `needs-you-outline`. They carry `on-needs-you`.
- Colour never carries a meaning alone: a status has a word, a shape or a glyph beside it.

**Words, counts and time**

- A count is written one way everywhere (`formatListCount`, `formatNavCount`): `07`, `12`, `248`,
  `1,204`; at an icon's corner it stops at `99+`. Zero draws nothing.
- A countdown reads `08 S` under a minute and `01:34` from a minute up (`formatCountdown`). Its
  ticking text is `aria-hidden`; a stable sentence goes to a polite region.
- Labels in mono caps (`type-overline`) are typed in sentence case; CSS sets the capitals, so a
  screen reader reads a word. `//` separates facts on one line (`Inbox // 12 unread`).
- A copy control shows "Copied" for 2 seconds and raises no toast (`CopyButton`).
- What a model wrote is marked by `SummaryBlock` or an agent's `ChatMessage`, never by a sparkle.

**Access**

- Real semantics first: a button, a link, a tab, a radio, a switch. An icon-only control has a
  name (`FloatButton label`, `IconButton label`).
- **Every gesture has a key or a press.** Slide to scrub is the arrow keys; a swipe up on a strip
  is a press on its text; the switcher's swipe is ArrowLeft and ArrowRight; a long press is
  Shift+Enter; a row's swipe actions are in its menu; a pull to refresh always sits beside a
  plain "Check again".
- **One polite region per frame.** Inside an `AppFrame`, a `StatusItem` and an `Accessory` hand
  their sentence to the frame's one `role="status"` region. A status part never owns a live region
  there.
- A key hint rides in `aria-keyshortcuts`, never in the name.

## Notes by component

### Icons

`<Icon name="arrow--right" />` draws an inline SVG from the curated Carbon set. The name is typed
(`IconName`); a name not in the set is a type error. Add one to `src/icons/names.json` (a Carbon
svg name with 32px art) and run `pnpm --filter @unicron/ui icons:build`.

- 20px by default. A compact control (Button, Top Tab, a chip, inline meta) draws its icon at
  16px itself; callers do not pass a size. `Icon` sets its size with `width` and `height`, not a
  class, so a control's own svg sizing rule still applies.
- The colour is the parent's text colour. `tone="muted" | "destructive"` is for an icon that
  stands alone, outside a control.
- With `label` it is `role="img"`; without one it is `aria-hidden`.
- An app registers a glyph Carbon lacks with `registerIcons` ([consuming](05-consuming.md#4a-icons-carbon)).
- No sparkle icons.

### Button, FloatButton, IconButton

- **Button.** The label is `type-overline` (mono caps) at every boxed size. An outlined kind draws
  its 1px edge inside the box, so every kind is the same width. `default` is the Primary;
  `secondary` (and its alias `outline`) is the ink outline; `ghost` is text only with the same
  padding; `destructive` is the solid critical fill, for the one action a dialog exists to
  confirm; `ghost-muted` is a quiet secondary action; `ghost-destructive` is a destructive action
  that should not shout. `block` stretches it; `wrap` lets a long label take a second line.
  `shape` is deprecated: `pill` is accepted and draws the 2px corner.
- **`size="inline"`** is a text action inside a sentence ("Your account needs you to **sign in
  again**"). It has no height or padding of its own and sits on the sentence's baseline. Pair it
  with `variant="link"`. It is underlined at rest, because its colour alone is under 3:1 against
  the sentence around it (WCAG 1.4.1).
- **FloatButton** is the square button of the floating chrome, and the close button of a layer.
  `label` is its name and its tooltip. `current` draws inverted ink. `extended` shows the label as
  a word beside the glyph. `onLongPress` has a keyboard path: Shift+Enter, the context-menu key or
  a right click.
- **IconButton** is an icon-only control inside content. One `label` is both its accessible name
  and its tooltip, so the two never drift apart. `tooltip` gives longer text, `shortcut` adds a
  `Kbd`. `render` swaps the control: pass a `Toggle` for an on/off tool, or let a
  `DropdownMenuTrigger` render it to open a menu.

### Marks on navigation

`TabBarItem`, `TopTab`, `RailItem`, `NavItem` and `FloatButton` share one `mark` prop:

| `mark` | Draws | Joins the name as |
|---|---|---|
| `12` or `{ count: 12 }` | the count | "12", or its `label` |
| `{ count: 1, tone: "needs-you" }` | the count on the yellow | "1 waiting on you" |
| `{ square: true, label: "Update ready" }` | a 6px square | its `label` (required) |
| `{ keys: "/" }` | a `Kbd` after a label; in the tooltip on an icon | nothing; it sets `aria-keyshortcuts` |

The mark is `aria-hidden`; its words are in the host's name. The older `indicator` prop
(`Button`, `IconButton`, `ToggleGroupItem`, `Item`) does the same job with two kinds, `unread` and
`attention`.

### Fields

- **The Text Field box.** `TextField`, `Input`, `Textarea`, `Select`'s trigger, `NativeSelect`,
  `InputGroup`, `ChipField`, `CommandInput`, the Composer and SecretField's edit box are one box:
  the raised surface, a 1px rule, 48 tall, 16 inside, the value in `type-ui`. Focus is a 2px
  inside border in `primary-fill`; an error is the same in `critical-fill`, with the label and the
  help in `critical-text`. A read-only field drops the fill.
- **16px on touch.** On a coarse pointer a field's value is 16px, so iOS does not zoom the page.
  Every field does it and nothing else may; a custom field uses `fieldBoxVariants`.
- **Use `TextField`** for a labelled field: it wires the label, the helper and the error. The
  error replaces the helper and is `role="alert"`.
- **Label.** Above a field it is a mono caps overline. Beside a checkbox, a radio or a switch it
  is running text, and takes that look by itself. A `Label` used anywhere else as running text
  needs `variant="choice"`.
- **Select or NativeSelect.** `NativeSelect` is the default for a form: the system draws the list,
  and on a phone that is the picker people know. Use `Select` when an option needs more than a
  line of plain text, or when the list has to match the menus beside it. Past about 15 options,
  use a combobox. Pass `items` (value → label) to `Select`, so the trigger shows the label before
  the list has opened. Label it with `Label htmlFor` pointing at an `id` on `SelectTrigger`.
  `SelectContent alignItemWithTrigger` lays the chosen option over the trigger (a pointer only);
  a list taller than the screen then scrolls behind an arrow, with no bar.
- **A radio shows a square inside; a checkbox shows a check.** Both are 16px squares, ink when
  chosen. `RadioRow` is a choice with a sentence.

### Rows

- **ListRow or Item.** `ListRow` is the drawn row of a list of things (a task, a message, a vault
  item): 88, 92 or 100 tall, with an index or a leading part, a title, meta and a status. `Item`
  is the generic row for everything else: media, a title, a hint and actions.
- **A row's whole surface is its main control.** Its `action` and its `menu` are separate controls
  on top, never nested in it. `ListRow` does this itself. In an `Item`, render the row as its one
  control (`render={<a href… />}`, `render={<button type="button" />}`), or wrap the media and the
  content in `ItemMain` when the row also has buttons of its own in `ItemActions`.
- **Actions without a gesture are the row's menu**: the overflow button (⋯), the Menu key,
  Shift+F10 or a right click. On a touch screen the button always shows.
- **FieldRow** is a label and a value. A string value is set in mono and cut in the middle when it
  is too long (an identifier never wraps mid-word); `FieldRowValue truncate="wrap"` is for a
  sentence. Its text action is `FieldRowAction`, never bare text. On a phone a row with a control
  in its value slot uses `size="stacked"`.
- **ToggleRow** makes the whole row the switch's target. There is one switch for assistive tech:
  the label names it and the description describes it.
- **A row's ⋯** is `OverflowMenu` (`menu` on FieldRow, SecretField and CodeDisplay): always shown,
  a menu on a desktop and a sheet on a phone. A security row's copy and show rows are
  `SecretFieldMenuItem` and `CodeDisplayMenuItem`, never the app's own copy.
- **Side padding is opt-in** (`inset` on FieldRow, ToggleRow and SectionHeader). A desktop column
  draws rows flush; a phone draws them 16 in with a full-bleed rule.
- **A swatch** (`swatch-01` to `swatch-12`) is only a bar, an edge or a square
  (`swatchFillClasses`), never text and never a fill behind text. Its meaning is the person's, so
  the name always shows beside it.

### SwipeRow

Wrap a `ListRow` in a `SwipeRow` and pass the actions as data (`leading`, `trailing`), so the row
can apply the safety rules and build its menu from one list.

- Nothing moves under 24px. Let go under half the tiles' width and the row closes; past half it
  opens.
- A full swipe (past 60% of the row) runs the outermost action only when that action is
  `reversible`. Otherwise the row opens and stops.
- An action marked `confirm` (an approval) is never run by a swipe. It only opens its review
  (`onReview`), from a swipe, a tap or the menu.
- A right swipe that starts within 24px of the screen's left edge does nothing: that edge is the
  system's way back.
- Every action is also in the row's menu. Under reduced motion the row snaps.

### Chip and FilterChip

- **Chip** holds a short value: a tag, a label, a linked thing. `variant` is `muted` (the default,
  for values in forms), `secondary` (tags) or `outline` (a linked thing). `tone="critical"` marks
  a wrong value; say what is wrong in words too. `ChipAction` is its main action and fills the
  chip; wrap long text in a `<span>` so it truncates. `ChipRemove` takes it away: a 24px button
  whose `label` ("Remove tag trip") is its name and its tooltip.
- **FilterChip** filters a list. A `FilterChipGroup type="single"` (the default) is a radio group:
  the arrow keys move and choose. `type="multiple"` is a group of toggles. On is inverted ink.
  `kind="trigger"` opens a picker (a trailing chevron, no on look); `kind="button"` is a plain
  action.

### Overlays

Every layer is solid and square: the raised surface, a 1px rule, the 2px corner. No glass, no
blur, no shadow. (This reverses the frosted menus of 2026-10-15; see the
[promotion log](04-patterns.md#promotion-log).) The dim behind a layer is `scrim-dialog`,
`scrim-sheet` or `scrim-menu`, never an opaque fill.

- **A layer's close is a `FloatButton`**: M (44) in a dialog and a popover, L (48) in a sheet. It
  is last in the tab order and never takes focus first; focus starts on the first control inside.
  It has no tooltip, so one Escape closes the layer.
- **Phone layers come from `Adaptive*`**, not from media queries in an app. `AdaptiveDialog`,
  `AdaptiveMenu` and `AdaptivePopover` draw a dialog, a menu or a popover on a desktop and a
  bottom sheet with the Sheet Header under 600. `presentation` pins one form.
- **Every layer takes `container`** (its portal's parent: a shadow root, an extension frame).

**Dialog sizes** (`DialogContent size`) are named for the job:

| `size` | Width | For |
|---|---|---|
| `question` | 480 | a confirmation, one field, the gate |
| `review` | 560 | read one thing and answer it |
| `form` (default) | 640 | a form; the command menu |
| `compose` | 720 | writing at length |
| `viewer` | 960 | a diff, a merge, a page to read large |
| `full` | all | the window less 24 on every side |

- Each size is two knobs, `--c-dialog-<size>-min-width` and `-max-width`, both the drawn width.
  An app that wants a size to widen for a table or a long path raises its max.
- A dialog is never wider than the window less 24 a side. In a window narrower than a size plus
  48, the dialog draws `full` (and `data-size-asked` keeps the name it was given).
- The names from before 1.0 still work and take the nearest size: `xs` and `sm` → question, `md` →
  review, `lg` → form, `xl` → compose, `2xl` → viewer.
- Every dialog scrolls inside itself when it is taller than the window. No dialog sets its own
  width or scrolling.
- **Header.** `DialogOverline` over `DialogTitle` (`type-lead`). `DialogTitle` lays a leading Back
  button out inline with the text, for a dialog with steps. `DialogDescription` is the caption
  note under a review's rows by default; `size="body"` is for a question whose sentence is its
  whole content.
- **Padding** is `--c-dialog-padding` (1.5rem; 1rem above the header). `DialogFooter` reads the
  same knob to run edge to edge when sticky. To change one dialog, set the variable on
  `DialogContent`; do not put `p-8` on it, because the footer cannot see a class.
- **DialogActions** is the dialog's actions as one row on every screen: each `DialogAction` keeps
  its words. `kind` is `confirm` (the one primary), `cancel` (the ink outline) or `destructive`
  (a quiet `ghost-destructive`, apart at the start of the row). `icon` adds a 16px glyph.
- **ConfirmDialog** asks one question. Focus starts on Cancel. The yes repeats the verb ("Delete
  series"), never "OK". Its body takes `RadioRow`s, a `ConfirmDialogConsequences` list, a
  `Checkbox`, or a `TextField` that arms the yes (`confirmDisabled` with a `disabledReason`).
- **`notice`** on `DialogContent`, `SheetContent`, `AdaptiveDialog` and `ConfirmDialog` is a line
  across the very top of the layer that does not scroll. It holds a compact `NeedsYou` when
  something that waits on the person arrives under an open layer.
- **Closing on a click outside** (`closeOnOutsideClick` on `Dialog`, `Sheet` and `CommandDialog`).
  It is on by default. Turn it off for a form with unsaved work, for a destructive or
  irreversible step, and for a detail sheet beside a list (`SheetContent backdrop={false}` with
  `Sheet modal={false}`), where a click on another row should change the sheet, not close it.
  Escape and the close button still close it, so such a dialog needs a visible Cancel. Base UI's
  own `disablePointerDismissal` wins if both are passed.
- **Sticky footers** (`sticky` on `DialogFooter`, `DialogActions` and `SheetFooter`). The footer
  stays at the bottom of what scrolls around it and is opaque, so content scrolls under it. In a
  dialog the popup scrolls, so `<DialogFooter sticky>` is all it takes. In a sheet, `SheetBody`
  scrolls and a `SheetFooter` after it already stays put; `sticky` is for a footer inside
  something that scrolls.
- **`beforeContent`** on `DialogContent`, `SheetContent`, `AdaptiveSheetContent` and
  `CommandDialog` renders between the backdrop and the popup. A desktop app with its own title
  bar puts its window drag strip there. The popups keep clear of `--c-dialog-titlebar-inset`
  (0px by default). Recipe: [05 · Consuming → Desktop title bar](05-consuming.md#9-desktop-title-bar).

**Sheet**

- A bottom sheet draws a grabber and hugs its content (`height="content"`, up to the screen less
  48) or takes the whole screen (`height="full"`; `fullscreen` is the deprecated name).
- `SheetHeader` is an overline over a `type-lead` title. Content goes in `SheetBody`, which
  carries the 16px sides and scrolls.
- `AdaptiveSheetContent` is a bottom sheet under Tailwind's `sm` (640) and a panel at the right
  above it. Its grabber drags to dismiss. `wide` widens the panel (`--c-sheet-wide-width`). Its
  `className` styles the inner scroll area, not the panel.

**Popover or Tooltip.** A `Tooltip` holds a few words and takes no focus: inverted ink, the
caption role, no arrow. Use a `Popover` when the content is interactive or longer. Give it a
`PopoverTitle` (or `PopoverHeader title`), which names it for a screen reader.
`--c-popover-width` (20rem) sets its width. Its header draws a close button only when asked
(`showCloseButton`): a popover closes on a press outside.

**TruncatedText** cuts one line (or `lines`) with an ellipsis, or in the middle for an identifier.
Only when it is cut does it become a tab stop. The full text opens where the pointer was and stays
put; from the element on keyboard focus; on a tap on a touch screen.

### Menus and the command menu

- **Menu rows are Nav Items**: the label role in the secondary ink, body ink when highlighted,
  checked or `current`; 36 tall (44 on touch); a 20px glyph. `DropdownMenuLabel` is an overline.
  `DropdownMenuShortcut` and `CommandShortcut` draw a `Kbd`.
- **Menu width** (`width` on `DropdownMenuContent`, `DropdownMenuSubContent` and `SelectContent`,
  where the default is `fit`):

  | `width` | The list is | For |
  |---|---|---|
  | `trigger` (default) | exactly as wide as its trigger | a select-style field, where the list lines up under it |
  | `fit` | as wide as its items, at least as wide as the trigger, at most `--c-menu-max-width` | a small button ("Change") that opens longer choices |
  | `auto` | as wide as its items, whatever the trigger, at most `--c-menu-max-width` | an icon button; a submenu (its default) |

  Every list is at least `--c-menu-min-width` (8rem) wide. Past `--c-menu-max-width` (20rem) an
  item's label wraps onto a second line. The knobs are the place to change the limits, not a
  `className` on one list.
- **`scrim`** on `DropdownMenuContent` and `PopoverContent` dims the screen behind it
  (`scrim-menu`): quick create on a phone.
- **Command** is cmdk under unicron's styles. Three things it adds:
  - *Search text.* `CommandItem`'s `value` is its key: what `onSelect` and `Command`'s `value` /
    `onValueChange` hand back. By default it is also what a search matches, with the item's
    `keywords`. So an item keyed by an id matches the id's letters. Pass the words it should be
    found by as `keywords` and set `Command match="keywords"`: an item that has keywords is then
    matched on those alone. A `filter` you pass still wins.
  - *Give an item with icons or an action an explicit `value`.* Without one cmdk takes the item's
    text.
  - *A second action.* `CommandItemAction` (`label`, `icon`, `onAction`, `disabled`) is a small
    icon button at the end of a `CommandItem`, beside its main action. One per item. An item is a
    `role="option"` and focus stays in the search field, so a button inside it cannot be tabbed
    to. It is reached three ways: a pointer clicks it (the press never runs `onSelect`); the
    keyboard presses ⌘↵ on Apple platforms and Ctrl+Enter elsewhere while the item is highlighted;
    a screen reader hears it with the item ("Copy password, Command Enter") through
    `aria-keyshortcuts` and the item's description. `commandItemActionShortcut()` gives the key's
    label for your own hint text.

    ```tsx
    <Command match="keywords">
      <CommandInput placeholder="Search" />
      <CommandList>
        {items.map((it) => (
          <CommandItem key={it.id} value={it.id} keywords={[it.title, it.username]} onSelect={() => open(it.id)}>
            {it.title}
            <CommandItemAction label="Copy password" icon="copy" onAction={() => copy(it.id)} />
          </CommandItem>
        ))}
      </CommandList>
    </Command>
    ```
  - `CommandDialog` is the `form` size (640) and keeps that width as results come and go.

### Toasts

- **Raise a toast with `toast` from `@unicron/ui`**, not from `sonner`. The Toaster listens to its
  own copy of sonner (one with no `<style>` tag), so sonner's `toast` never reaches it.
- One action at most (`action: { label, onClick }`). A plain toast stays 4 seconds, one with an
  action 6. `toast.error` is the only tone with colour.
- **Put the `Toaster` inside the `AppFrame`.** It then stands where the frame says: the bottom
  left of the content on a desktop, three at most; the status strip's slot above the bottom row
  on a phone, one at a time, the rest waiting in order.
- **On a phone a toast obeys the strip.** A live strip with no action gives way for the toast's
  time. A live strip with an action (undo send) is never covered: new toasts wait until it ends.
  A needs-you or critical strip never gives way: the toast sits under the top row instead.

### The frame

`AppFrame` is the outermost box of an app that fills the screen. The page cannot scroll, so a
rotation cannot strand it, and it keeps clear of the notch, the home bar and any keyboard. An app
writes **one tree of frame parts**; each part draws itself only where it belongs, so an app writes
no shell CSS and no media query, and puts no `className` on a system component to lay it out.

| Shell (`data-layout`) | When | What draws |
|---|---|---|
| `phone` | compact (under 600) | `AppFrameTopRow`, `AppFrameAccessory` and `AppFrameBottomRow` float over full-bleed content |
| `rail` | under 1024 wide, and short (sideways and under 480 tall) or squat (a folded phone) | the bottom row stands as a 48 column at the trailing edge; the page head is its small title |
| `medium` | 600 to 1023 | the sidebar as its rail (a drawer when expanded), or the top bar; one content column; a detail is pushed, with its way back in the status line or the top bar |
| `expanded` | 1024 and up | the full sidebar or top bar; list and detail side by side; gutters 48 from 1280, 24 below |

- **Phone chrome.** Top row: `AppLockup` left, one or two `FloatButton`s right. Bottom row: a
  search `FloatButton` (L), the `TabBar` (it fills), the create `FloatButton` (L, primary). The
  status strip (`AppFrameAccessory`) sits 8 above the row. `variant="detail"` is a pushed screen's
  row: `start`, `fill` (a composer), `end`, and no tab bar.
- **Scrolled.** Past 64px (`--c-app-frame-minimize-threshold`) the chrome minimizes: the wordmark
  hides, the page head becomes a small centred title, the tab bar shrinks to its active tab, the
  strip moves into the bottom row, and a hairline shows under the top row. It comes back only at
  the top. There are never more than two bars at the foot.
- **Scroll edge.** `AppFrameScrollEdge` is a masked fill of the ground under the chrome. No blur.
- **Desktop with a sidebar** (Vale, Lockdown, Synapse). `AppFrameSidebar` (204 wide) holds the
  lockup, an optional switcher, an optional primary action, `NavSection`s of `NavItem`s, and a
  pinned foot. It is on the page's ground, set apart by space. `AppFrameStatusLine` is the top
  line: crumbs left, up to two `StatusItem`s right, a hairline below.
- **Desktop with a top bar** (Warpcore). `AppFrameTopBar` holds the lockup, `TopTabs` and a right
  cluster. When it runs out of room it gives up one thing at a time: the short status, the
  wordmark, the primary's word, the tab numbers, the tab words.
- **Columns.** `AppFrameList` beside `AppFrameDetail` is a list + detail: side by side when
  expanded, the detail pushed over the list (which stays mounted and keeps its scroll) below
  that. `AppFrameColumn` is a column that is always the screen; `AppFrameReading` centres text at
  720. `AppFrameInset` gives non-row content the phone's 16px. Each column draws its own rule.
- **Shrink order.** When a list + detail has less than 320 + 24 + 480 of content, the sidebar
  shows as its rail first; narrower still, the detail is pushed. The frame decides; the knobs are
  `--c-app-frame-list-compact`, `-split-gap` and `-detail-min`.
- **Beside the content.** `AppFrameSidePanel` is a 312 column when the content keeps its room,
  and a sheet the person opens otherwise. `AppFramePeek` lies over the right 648 with no scrim.
  `AppFrameCompanion` is a resizable pane for what belongs to the content (a conversation's
  documents, an artifact): beside it, on the far side of a book fold, or in a sheet on a phone.
- **`AppFrameFocus`** is a frame with no chrome: one centred column (432) for sign-in, unlock and
  first run.
- **Pull to refresh.** `onRefresh` on a list, a detail or a column, on a phone. A pull past 64px
  runs it once on lift. Keep a plain "Check again" beside it.
- **`PageHead`** is the page's `h1`: an overline, a large title, a count on the baseline.
  `AppFramePageHead` gives it the frames' spacing and registers its title as the phone's small
  title. `TopBar` is a pushed phone screen's row: back, a small centred title, up to two actions.
- **`SettingsFrame`** is the settings layout: a section list (204) beside one column up to 720;
  groups under overlines past seven sections; "Find a setting" from ten. On a phone the list
  pushes each section.
- **`ContextPanel`** has three states: open (400, with tabs), a rail of icons and counts, and
  hidden.
- **`FoldPanes`** puts two parts either side of a fold when a device is partly folded, and
  otherwise shares the space. `split="columns"` is for a fold down the middle: use it when
  `useViewport().fold` says `book`. `split="rows"` is for a fold across the middle and needs no
  check: it is a plain fill-then-footer column everywhere else. Neither has a line to drag,
  because the fold is the line.
- **`ResizablePanes`** divide a space the person can resize. It fills its parent, so give the
  parent a height. Every `ResizableHandle` needs a `label` ("Resize the conversation"), since it
  takes focus. Sizes are percentages or pixels, and the arrow keys, Home and End move a focused
  handle. To remember a layout, give each pane an `id` and pass `defaultLayout` and
  `onLayoutChanged` from `useResizablePanesLayout({ id })`. Pass them by name: `dsa` counts a
  spread onto a system component. When the set of panes changes, also pass `panelIds`.

A document or a marketing page should not use `AppFrame`: those need the page to scroll.
[05 · Consuming → Fit every screen](05-consuming.md#5a-fit-every-screen) has the responsive rules.

### Needs you, banners and status

- **NeedsYou** is the yellow block for something that waits on the person. At most one shows on a
  screen. It holds one solid action (`Button variant="needs-you"`) and up to two text actions. It
  has no corner and no dismiss. `more` adds `// +1` when more wait behind it.
- **`size="compact"`** is one 48px line for the top of an open layer (`notice`). While it shows,
  the full block behind the scrim hides by itself, so one yellow shape shows.
- **A strip, not a block, on a phone.** There the same thing is an `Accessory tone="needs-you"`
  above the bottom row. It cannot be dismissed or swiped away.
- **Banner** is for the page's own news. `critical` is `role="alert"`; the others are
  `role="status"`. Each tone has its own glyph, so the tone never rests on colour. `compact` is
  one caption paragraph; its text wraps and is never cut.
- **`Accessory tone="critical"`** borrows the critical Banner's look at strip size.
- **StatusOrb** tells ten states apart by shape and motion as well as colour. Its "working" ring
  is the one agent motion: generic loading (`Spinner`, `Skeleton`) never uses it.
- **Skeleton** is sized by `className` (a tile, a line of text), or by `variant="row"` for one
  list row: two 12px bars over a hairline, 76 tall. `--c-skeleton-row-height` is the row's least
  height; an app with a density setting re-maps it once.
- **Progress.** `variant="segmented"` cuts `segments` cells (32 by default; 3 to 64), 4 tall and 2
  apart. A lit cell is the live colour by default. `tone="primary"` is for a quantity that is not
  live (a spend, a score); `critical` for a countdown near its end. For a checklist pass
  `segments={max}`.

### Chat

- **Composer.** Enter sends and Shift+Enter makes a line (`sendKey` changes that); it never sends
  while an input method composes. While a reply streams the button is Stop. An empty composer's
  Send is at full strength but does nothing (`aria-disabled`). `status`, `chips` and `attach` are
  slots above and inside the box.
- **ChatMessage.** A person's message is a raised bubble at the right, up to 300 wide. An agent's
  has no bubble, runs the full width in `type-response`, and its meta is in the live colour. While
  it streams, one polite line says "Reply finished" at the end, never the text.
- **Prose** styles plain elements (headings, lists, links, quotes, inline code, tables) from the
  roles. `variant="response"` is for what a model wrote and for a mail's body.

### Updates

`UpdateStatusRow` and `AutoCheckSwitch` are the updates part of an app's Settings → About, so
every app shows its updates the same way. Pass the update kit's `UpdateStatus`
(snds/app-updates) as it arrives, the app's name, and callbacks; neither fetches anything.

- `UpdateStatusRow` is a Field Row: a "Version" label, the version and channel, one status line
  in a polite region (held `aria-busy` while downloading), and its actions as words: **Check for
  updates**, **Restart to update** once an update is ready and **Reload app** otherwise, and the
  release page link when an update has to be fetched by hand. A desktop shell passes
  `onOpenLink`. `restartNote` adds a line once an update is ready; `error` shows what went wrong.
- `AutoCheckSwitch` is a Toggle Row named **Check for updates automatically**. It renders nothing
  when the build has no updates.
- Pass `words` to change any of the words. `updateLine(status, appName)` is the status line on its
  own, for a menu or a command palette.

## Motion recipes

A primitive never writes its own duration or curve. It picks a recipe from
`packages/ui/src/styles/motion.css`, and each recipe is built only from the motion roles
([tokens → Motion](02-tokens.md#motion)).

| Recipe | Class or attribute | For | Runs | Under reduced motion |
|---|---|---|---|---|
| press | `motion-press`, `motion-press-sm` | a control going down under a press | scale to `--motion-press-depth` in `--motion-press`; back in `--motion-fast` | no scale; colour still changes |
| pop | `motion-pop` | a small surface arriving from its anchor | opacity and scale from 0.96, `--motion-base` in, `--motion-fast` out | fades in place |
| slide | `motion-slide` + `motion-slide-from-{top,bottom,left,right}` | a surface arriving from an edge | opacity and translate on `--motion-spring-firm`; `--motion-base` out | fades in place |
| collapse | `motion-collapse` | a panel opening by height | height and opacity, `--motion-state`, move curve | height changes at once; content fades |
| stagger | `motion-stagger` on the parent | a list appearing for the first time | children rise 4px, `--motion-stagger` apart, capped at `--motion-stagger-max` steps | every row is there at once |
| draw | `motion-draw` (`CheckDraw`) | a success mark | a stroke draws in `--motion-base` | the mark is simply there |
| shake | `data-shake` (`useShake`) | a refusal | three swings that die away, `--motion-state` | no movement; the error colour and text carry it |

- **Entrances and exits are transitions.** pop, slide and collapse read Base UI's `data-starting-style`
  and `data-ending-style` (and `@starting-style` for a plain mount), so closing mid-open turns round
  from where it is. Nothing restarts.
- **Two exceptions to "transform and opacity".** collapse animates height, because the content below
  has to move with the panel. draw animates a stroke offset, because that is the only way to draw a
  line. Each is written into its contract.
- **Contracts are data.** `motionContracts` (`@unicron/ui/motion`) lists, for each recipe, its
  trigger, the properties it may animate, its duration role, how often it is met, what happens when
  it is interrupted, and what is left under reduced motion. The playground's Motion view
  (`?view=motion`) draws a card per contract, and `pnpm --filter playground test:motion` checks
  each one in a real browser: it moves only what it lists, for no longer than its role, never past
  400ms, not at all under reduced motion, and a reversal carries on from where it was. It also
  saves a start, middle and end frame of each.
- **Helpers** (`@unicron/ui/motion`): `useReducedMotion`, `useShake`, `rubberBand(distance, max)`
  for a drag past its limit, and `withViewTransition(update)` for a shared-element change on
  `--motion-move`.
- **One box, another mode.** `data-motion="reduced"` on any element puts everything inside it on
  the reduced path, whatever the user's setting; `data-motion="off"` removes motion. For previews
  and tests.


## Security components

Lockdown needs parts that are safe by construction, and every app gets the same guarantees, so
they live here. Each owns behaviour no parent has, and each renders only in the app, an OS
surface, or the extension's top-layer frame, never in web content. Every tier, state and warning
carries a word. The host's core does the cryptography; a component only ever receives short
strings or a one-shot handle.

Each has a one-page spec under [`docs/specs/security/`](specs/security/README.md) that opens with
what 1.0 changed. The specs are the reference; this is the summary.

- **SecretField** ([spec](specs/security/secret-field.md)). Use a hidden value without exposing it
  longer than the job takes.
  - *Read mode* is a Field Row: a label column, twelve dots, and its actions as words ("Show" or
    "Hold to show", "Copy"). The clipboard countdown is words in the live colour ("Clears in
    28 s", then "Cleared", said only after a real clear). `size="auto"` stacks the row in a narrow
    column by itself.
  - *Edit mode* is the Text Field box, with the strength as three cells and a word.
  - *Host contract.* `getSecret(): Promise<Uint8Array>` is one-shot and zeroed after use;
    `host.copy`, `host.clear`, `host.clipboardHolds?` and `host.gate?` do the rest. In read mode
    the value never enters React state as a string.
  - `remote` lets a float button elsewhere run the field's own reveal and copy
    (`SecretFieldRemoteButton`). `fillOnly` is a value that can be filled but never shown.
- **CodeDisplay** ([spec](specs/security/code-display.md)). A one-time code grouped for reading
  (6 → 3+3, 8 → 4+4, Steam's 5 as one group), with its time left as 30 cells: the live colour,
  then critical in the last 5 seconds. The next code shows early, and a copy in the last seconds
  takes the next code. Four layouts: `field` (on an item), `row` (a phone's Codes list), `tile`
  (the desktop grid) and `compact` (one line). The code itself is the copy control. A counter
  code has no countdown; "Next code" calls `onAdvance`. A code is exposed to assistive tech one
  character at a time, never as a number.
- **ApprovalSheet** ([spec](specs/security/approval-sheet.md)). Approve or deny a request from
  another device, an agent, a TV or a contact. It opens in one review frame: a bottom sheet under
  600, a 560 dialog above. The facts are Field Rows, the trust tier is a row, and the time left
  is in the overline and a 30-cell rule. `matching` is `enter` (type the number), `choose` (pick
  it from three), `compare` (two codes, in `DigitGroups`) or `none`.
  - *Safety, unchanged in 1.0:* the yes is inert for a 500ms arming delay; the timeout denies;
    two tries at a number; "This wasn't me" reports; a `device-code` request approves only from a
    `scan`; Enter never approves; Escape denies (or decides nothing with `dismiss="keep"`).
- **AgentPrompt** ([spec](specs/security/agent-prompt.md)). An agent's question in the
  conversation, in the needs-you look while it waits. The safe answer (Deny, Stop) is first, is
  the one solid button and takes focus on arrival; the others are text buttons. Keys answer by
  meaning: an option's own `key`, else N the safe answer and Y the yes. Three guards keep a stray
  key from answering: keys are inert for 500ms after a prompt starts listening, a `standing`
  answer ("Always") takes its key only with focus inside the prompt, and `listen={false}` turns
  the keys off. On a phone the options open in a sheet, or stay in place with `layout="inline"`.
- **CrownJewel** ([spec](specs/security/crown-jewel-treatment.md)). The treatment for secrets that
  never autofill and never reach agents. `CrownJewelMark` is the inline lock and its word.
  `CrownJewelSurface` is an inverted panel that re-maps the roles for its subtree and flips a
  nested SecretField, CodeDisplay or LargeTypeView into gated mode through `useCrownJewel()`.
  `CrownJewelGate` is the "Confirm it's you" question, at the `biometric` or `password` level.
  The surface renders only when `host` is `app`, `os` or `extension-top-layer`.
- **RiskTierBadge** ([spec](specs/security/risk-tier-badge.md)). One word for how much trust a
  path carries. The tiers are a closed set (`standard`, `official`, `tolerated`); people read
  **Built in**, **Verified** and **Use with care**. With `verified` omitted it reads "Checking";
  a failed check reads "Unverified", in the critical tone.
- **LargeTypeView** ([spec](specs/security/large-type-view.md)). A secret in large type, for
  reading across a room or typing on another device: groups of three, digits, letters and symbols
  each in their own ink, with a caption naming every symbol and every ambiguous glyph. It hides
  after its lifetime (120 s) and when the window loses focus. `print` draws the same layout in
  the page, for a recovery kit.
- **DigitGroups** ([spec](specs/security/digit-groups.md)) draws digits in groups, for reading
  aloud and comparing, and speaks them one character at a time with a pause per group.
- **QrCode** ([spec](specs/security/qr-code.md)) is one SVG, dark on light on both grounds, with
  no `data:` URL. Pass `value`, or `modules` when the host already has the grid (Lockdown's core
  makes it in Rust).
