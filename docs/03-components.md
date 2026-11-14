# 03 · Components

`@unicron/ui` ships shadcn/ui primitives (`base-nova` style) on Base UI, generated once by the
shadcn-material transform (icons swapped to IBM Carbon) and then owned as source.
Import everything from the package root:

```tsx
import { Button, Dialog, DialogContent, Icon } from "@unicron/ui"
```

The family column is framework 09's taxonomy (nine categories, nine questions). `dsa` uses the
same families to decide whether a repeated composition is a **variant** (one family) or a
**pattern** (two or more families).

| Module | Exports | Family | Base |
|---|---|---|---|
| `button` | `Button` (`variant`: default (Primary), secondary = outline (ink outline), ghost, destructive (critical fill), link, ghost-muted, ghost-destructive, needs-you, needs-you-outline, needs-you-text; `size`: default 40, sm 32, lg 48, icon, icon-sm, icon-lg, inline; `block`; `wrap`: a long label takes a second line instead of leaving the box; `loading`; `indicator`: a corner mark and its words in the name), `buttonVariants`, `ButtonProps` | Action | Base UI Button |
| `float-button` | `FloatButton` (`label`, `icon`, `kind`: neutral, primary; `size`: m 44, l 48; `current`; `onLongPress`, `longPressLabel`), `floatButtonVariants`, `floatButtonLongPressKeys`, `FloatButtonProps`, `FloatButtonKind`, `FloatButtonSize` | Action | Tooltip + Base UI Button |
| `toggle` | `Toggle`, `toggleVariants` | Action | Base UI Toggle |
| `toggle-group` | `ToggleGroup`, `ToggleGroupItem` (`indicator`, as on Button) | Action | Base UI ToggleGroup |
| `button-group` | `ButtonGroup`, `ButtonGroupText`, `ButtonGroupSeparator`, `buttonGroupVariants` | Action | div (useRender) |
| `input` | `Input` | Form | Base UI Input |
| `textarea` | `Textarea` | Form | textarea |
| `label` | `Label` | Form | label |
| `checkbox` | `Checkbox` (16 px square, ink fill, inline SVG marks, `indeterminate`) | Form | Base UI Checkbox |
| `switch` | `Switch` (Figma's Toggle: 44 × 24 track, square 16 px knob) | Form | Base UI Switch |
| `native-select` | `NativeSelect`, `NativeSelectOption`, `NativeSelectOptGroup` | Form | select |
| `select` | `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton` | Form | Base UI Select |
| `input-group` | `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText`, `InputGroupInput`, `InputGroupTextarea` | Form | div |
| `field` | `Field`, `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldLabel`, `FieldContent`, `FieldTitle`, `FieldDescription`, `FieldSeparator`, `FieldError` | Form | div / fieldset |
| `tabs` | `Tabs`, `TabsList` (`variant`: default, line; `size`: default, fill — the list takes its container's height, as in a toolbar row), `TabsTrigger`, `TabsContent`, `tabsListVariants` | Navigation | Base UI Tabs |
| `popover` | `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription`, `PopoverClose` | Overlay | Base UI Popover |
| `dropdown-menu` | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent` (`width`, `scrim`), `DropdownMenuItem` (a Nav Item row: label role, secondary ink; `variant`: default, destructive; `current`: the open place, on the `primary-soft` tile), `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` | Navigation | Base UI Menu |
| `resizable-panes` | `ResizablePanes`, `ResizablePane`, `ResizableHandle`, `useResizablePanesLayout`, `useResizablePaneRef` | Layout | react-resizable-panels |
| `spinner` | `Spinner`, `SpinnerProps` (svg props plus `label`, default "Loading"; turns at `--motion-spin`, still under reduced motion) | Feedback | an SVG arc on the icons' 32 grid |
| `status-orb` | `StatusOrb`, `statusOrbCopy`, `statusOrbStates`, `StatusOrbProps`, `StatusOrbState`, `StatusOrbSize` (ten states told apart by shape and motion as well as colour: queued, paused and stopped are still glyphs; words only in the tooltip and name) | Feedback | span + Icon + Tooltip |
| `indicator` | `IndicatorMark`, `indicatorCopy`, `indicatorLabel`, `indicatorCount`, `indicatorsOf`, `Indicator`, `IndicatorProp` (the `indicator` prop on `AppFrameNavItem` and `Item`: attention or unread, a dot or a "9+" badge, the count in the name) | Feedback | span |
| `progress` | `Progress` (`variant`: bar, segmented; `segments`, default 32; `tone`: default, live, primary, budget, critical), `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue`, `progressBudgetThresholds`, `progressDefaultSegments` | Feedback | Base UI Progress |
| `collapsible` | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | Layout | Base UI Collapsible |
| `run-trace` | `RunTrace`, `runTraceCopy`, `formatRunDuration`, `RunTraceProps`, `RunStep`, `RunStepState`, `RunMark` (an agent run: open on the current step while live, one line when done; a step can wait on you (`needs-you`); `marks` put answers, stops and pauses between steps in one quiet line each; step detail in a popover, a sheet on a phone) | Feedback | Collapsible + StatusOrb + IconButton + Popover / AdaptiveSheetContent |
| `skeleton` | `Skeleton` (`variant`: default, row = two bars over a hairline), `skeletonVariants` | Feedback | div |
| `empty` | `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent` | Feedback | div |
| `sonner` | `Toaster` (inside the `AppFrame`: it takes the frame's slot; three at most), `toast` (`toast.success`, `.info`, `.warning`, `.error`, `.dismiss`; one `action`, `takeFocus`, `returnFocus`, `tone`), `toastDurations`, `toasterVisibleToasts`, `waitingToasts`, `ToastOptions`, `ToastAction` | Feedback | sonner (+ next-themes); sonner's placement rules ship in `@unicron/ui/styles`, so it works under `style-src 'self'` |
| `avatar` | `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` | Data Display | Base UI Avatar |
| `badge` | `Badge` (`tone`: neutral, live, needs-you, critical, warning, success; `variant` deprecated), `badgeVariants`, `BadgeTone`, `BadgeVariant` | Data Display | span (useRender) |
| `item` | `Item`, `ItemMain`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemHeader`, `ItemFooter`, `ItemGroup`, `ItemSeparator` | Data Display | div (useRender) |
| `kbd` | `Kbd`, `KbdGroup` | Data Display | kbd |
| `separator` | `Separator` (horizontal: 1px of paint that adds no height) | Layout | Base UI Separator |
| `scroll-area` | `ScrollArea`, `ScrollBar` | Layout | Base UI ScrollArea |
| `tooltip` | `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | Overlay | Base UI Tooltip |
| `dialog` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogActions`, `DialogAction`, `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogOverlay`, `DialogPortal` | Overlay | Base UI Dialog |
| `sheet` | `Sheet`, `SheetTrigger`, `SheetContent`, `AdaptiveSheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `SheetClose` | Overlay | Base UI Dialog |
| `command` | `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandItemAction`, `CommandShortcut`, `CommandSeparator`, `commandItemActionShortcut`, `CommandMatch`, `CommandItemActionProps` | Overlay (command palette; a known gap in the canonical 62, composed from Dialog + InputGroup + cmdk) | cmdk |
| `icon` | `Icon`, `IconName`, `CoreIconName`, `IconProps`, `IconSize`, `IconTone`, `UnicronIconRegistry`, `registerIcons`, `isIconName`, `iconNames`, `iconFromMaterial` (a Material name that arrives as data → its Carbon name) | Content | inline SVG, IBM Carbon, curated set (`src/icons/names.json`) |
| `icon-button` | `IconButton`, `IconButtonProps` (`indicator`: the words follow the label in its name; the tooltip stays the label) | Action | Tooltip + Button (or any `render`) |
| `check-draw` | `CheckDraw`, `CheckDrawProps` (a check mark that draws itself on mount with the `motion-draw` recipe; decorative, sized by `1em`, coloured by `currentColor`; simply there under reduced motion) | Feedback | An SVG path: the icon set's filled outlines cannot draw a stroke |
| `chip` | `Chip`, `ChipAction`, `ChipRemove`, `ChipRemoveProps` | Data Display | span (useRender) + Base UI Button + IconButton |
| `update-status` | `UpdateStatusRow`, `AutoCheckSwitch`, `updateLine`, `canCheckForUpdates`, `updateWords`, `UpdateStatus`, `UpdateState`, `UpdateChannel`, `UpdateWords`, `UpdateStatusRowProps`, `AutoCheckSwitchProps` | Feedback | Button + Icon (status row); Field + Switch (switch row) |
| `security/code-display` | `CodeDisplay`, `CodeDisplayList`, `groupCode`, `spellCode`, `codeDisplayAnnouncements`, `CodeDisplayProps`, `CodeDisplayCopyRef` | Data Display | Item + IconButton + Badge + Button (spec: [code-display](specs/security/code-display.md)) |
| `security/large-type-view` | `LargeTypeView`, `classifyChar`, `nameChar`, `captionFor`, `spellValue`, `LargeTypeViewProps` | Overlay | SheetContent fullscreen + IconButton + Switch + Kbd (spec: [large-type-view](specs/security/large-type-view.md)) |
| `security/crown-jewel` | `CrownJewelSurface`, `CrownJewelMark`, `CrownJewelGate`, `useCrownJewel`, `CrownJewelProof` | Layout | section with a re-mapped tier + Icon + Badge + IconButton + Dialog (spec: [crown-jewel-treatment](specs/security/crown-jewel-treatment.md)) |
| `security/approval-sheet` | `ApprovalSheet`, `approvalSheetCopy`, `approvalSheetOriginCopy`, `approvalSheetAnnouncements`, `ApprovalSheetProps`, `ApprovalKind`, `ApprovalOrigin`, `ApprovalDenyReason`, `ApprovalMatching`, `ApprovalContextRow` | Overlay (security) | Sheet → AdaptiveSheetContent + Item + Input + DialogActions + RiskTierBadge |
| `security/agent-prompt` | `AgentPrompt`, `agentPromptCopy`, `agentPromptStateCopy`, `agentPromptAnnouncements`, `agentPromptLayout`, `formatPromptCountdown`, `AGENT_PROMPT_REPLY`, `AgentPromptProps`, `AgentPromptKind`, `AgentPromptOption` (`reply` kind for words; `pending` and `error` while sending; `expiresAt` + `safeAnswer` count down and answer safely) | Feedback (security) | section + Button / Item rows + Kbd + RiskTierBadge + Sheet → AdaptiveSheetContent (spec: [agent-prompt](specs/security/agent-prompt.md)) |
| `security/risk-tier-badge` | `RiskTierBadge` (`surface`: page, needs-you — on an asking AgentPrompt's yellow it takes that fill's ink), `riskTierCopy`, `riskTiers`, `riskTierUnverifiedAnnouncement`, `RiskTierBadgeProps`, `RiskTier`, `RiskTierState`, `RiskTierCopy` | Data Display (security) | `badgeVariants` + Icon + IconButton → Tooltip |
| `security/secret-field` | `SecretField`, `secretFieldAnnouncements`, `secretFieldErrors`, `secretStrengthFromScore`, `spellSecret`, `SecretFieldProps`, `SecretFieldReadProps`, `SecretFieldEditProps`, `SecretFieldHost`, `SecretGate`, `SecretRevealMode`, `SecretFormat`, `SecretStrength` | Form (security) | Field + InputGroup + IconButton + Skeleton + Spinner |
| `app-frame` | `AppFrame` (`layout`, `minimized`, `contained`, `focus`), `AppFrameMain`, `AppFrameList` (`size`), `AppFrameDetail` (`open`, `onBack`, `size`), `AppFrameColumn` (`reading`), `AppFrameReading`, `AppFrameInset` (`fill`), `AppFramePageHead` (`gap`: none, sm, md, the space under the head; `below`, a chip row that belongs to it), `AppFrameSidePanel`, `AppFramePeek`, `AppFrameCompanion`, `FoldPanes`; `useAppFrame`, `useScrollMinimize`, `nextMinimized`, `frameLayoutFor`, `isPhoneLayout`, `isExpandedWidth`, `MINIMIZE_RESTORE_AT`; types | Shell · Layout | div / main / section |
| `app-frame` (phone) | `AppFrameTopRow`, `AppFrameBottomRow` (`variant`, `start`, `tabs`, `fill`, `end`), `AppFrameAccessory` (`scrolledOnly`), `AppFrameScrollEdge` (`edge`) | Shell · Phone chrome | div, portals into the frame's slots |
| `app-frame` (desktop) | `AppFrameSidebar`, `AppFrameSwitcher`, `AppFrameStatusLine` (`back`), `StatusItem`, `AppFrameTopBar` (`back`: the way back from a pushed detail at medium width, in its leading slot), `formatCountdown`, types `AppFrameAction`, `AppFrameCrumb`, `StatusItemTone` | Shell · Desktop | nav, header, Base UI Button, DropdownMenu |
| `app-frame` (focus) | `AppFrameFocus` (`lockup`, `folio`) | Shell | main |
| `app-frame` | `onRefresh` on `AppFrameList` / `AppFrameDetail` / `AppFrameColumn`; `usePullToRefresh`, `pullOffsetFor`; `shrinkFor`, `stripStateFor`, `toastPlacementFor`; the frame's polite region; `data-shrink`, `data-strip`; `--frame-toast-left/bottom/top/width` | Shell · Layout | div / section |
| `app-frame` (desktop) | `StatusItem announce` goes to the frame's region; `AppFrameSidebar` shows as its rail when a list + detail needs the room | Shell · Desktop | — |
| `settings-frame` | `SettingsFrame`, `SettingsSection`, `SettingsFrameProps` | Shell · Pattern | AppFrameList + AppFrameDetail, NavItem, NavSection |
| `context-panel` | `ContextPanel`, `ContextPanelTab`, `ContextPanelState`, `ContextPanelProps` | Shell · Navigation | aside, tablist of Base UI Buttons, Rail |
| `use-viewport` | `useViewport`, `viewportWidthFor`, `detailPlacementFor`, `Viewport`, `ViewportWidth`, `ViewportDetailPlacement` (width classes: `compact` under 600, the phone chrome; `medium` 600 to 1023; `expanded` from 1024; fold and short-screen rules) | Layout | hook |
| `app-lockup` | `AppLockup` (`name`, `initial`, `showName`, `mark`, `render`), `AppLockupProps` | Shell | div (useRender) |
| `tab-bar` | `TabBar` (`label`, `value`, `onValueChange`, `onReselect`, `navigation`: tabs, links; `orientation`: horizontal, vertical; `minimized`), `TabBarItem` (`value`, `icon`, `label`, `mark`, `href`, `render`), `TabBarProps`, `TabBarItemProps`, `TabBarNavigation`, `TabBarOrientation` | Shell · Navigation | tablist / nav, buttons or links (useRender) |
| `accessory` | `Accessory` (`tone`: neutral, live, needs-you, critical; `meta`, `title`, `action`, `compact`, `onOpen`, `openLabel`, `onSwipeUp`, `onDismiss`, `progress`, `announce`), `AccessoryProps`, `AccessoryTone`, `AccessoryAction`, `AccessoryProgress`; also `countdown` (aria-hidden); `announce` goes to the frame's region inside an AppFrame | Shell · Feedback | div + Base UI Button, Button, Progress |
| `nav-item` | `NavItem` (`label`, `icon`, `index`, `mark`/`count`, `current`, `checked`, `level`, `expanded`, `action`, `description`, `tone`, `swatch`, `disabled`, `href`/`render`), `NavSection` (`title`, `count`, `action`, `collapsed`, `checkable`), their props types, `NavItemSwatch`, `NavItemTone`, `NavSectionCheckable`; also `NavSection checkable`: `multiple` = group of a list of `checkbox`es, `single` = `radiogroup` of `radio`s; `NavSection tree` (tree, treeitem, arrow keys); `NavItem level` is `aria-level` in a tree | Shell · Navigation | link or button (useRender); group + list or menu |
| `top-tabs` | `TopTabs` (`label`), `TopTab` (`label`, `index`, `icon`, `current`, `mark`, `href`/`render`), props types | Shell · Navigation | nav of links (useRender) |
| `rail` | `Rail` (`edge`), `RailItem` (`label`, `icon`, `state`: default, active, live; `mark`/`count`, `liveLabel`), `railItemVariants`; the mark: `NavMark`, `NavMarkProp`, `NavMarkTone`, `NavMarkResolved`, `NavMarkPlacement`, `formatNavCount`, `resolveNavMark`, `nameWithMark`; `rovingTarget`; also `NavMarkProp` `{ keys, shortcut?, label? }`; `markKeyShortcuts`; `NavMarkTooltipKeys` | Shell · Navigation | toolbar of Tooltip + Base UI Button |
| `page-head` | `PageHead` (`title`, `overline`, `size`: lg, md, sm; `count`, `meta`, `metaPosition`, `onMetaClick`, `metaLabel`, `status`, `actions`, `switcher`, `collapsed`), `PageHeadProps`, `PageHeadSize`, `PageHeadSwitcher`, `PageHeadSwipe` | Shell | h1 + Base UI Button |
| `top-bar` | `TopBar` (`title`, `titleAs`, `onBack`, `backLabel`, `start`, `actions`), `TopBarProps` | Shell | FloatButton |
| `text-field` | `TextField` (`label`, `helper`, `error`, `invalid`, `leading`, `trailing`, `disabledReason`; `multiline` + `minRows` 6 + `maxRows`; `type="number"` with steppers), `SearchField` (search icon, clear, Esc), `textFieldMessageRows` | Form | input / textarea; Base UI NumberField |
| `chip-field` | `ChipField` (values as chips in the field box; Enter, comma, paste, Backspace; `isInvalid` → critical chip; `renderChip`) | Form | input |
| `radio-group` | `RadioGroup`, `RadioGroupItem` (16px square, ink square when chosen), `RadioRow` (a choice with a sentence) | Form | Base UI RadioGroup, Radio |
| `toolbar` | `Toolbar` (`size` sm / default), `ToolbarButton`, `ToolbarToggle`, `ToolbarGroup`, `ToolbarSeparator` | Action | Base UI Toolbar |
| `split-button` | `SplitButton` (`menuLabel`, `menu`, Button props) | Action | Button + DropdownMenu |
| `initial-tile` | `InitialTile` (`initials`, `src`, `name`, `size` s 24 / m 40 / l 64) | Data Display | Base UI Avatar |
| `adaptive` | `AdaptiveDialog`, `AdaptiveMenu`, `AdaptiveMenuItem` (`icon`, `shortcut`, `count`, `current`, `variant`), `AdaptiveMenuGroup`, `AdaptiveMenuSeparator`, `AdaptiveMenuRadioGroup`, `AdaptiveMenuRadioItem`, `AdaptiveMenuCheckboxItem`, `AdaptivePopover`, `useAdaptiveSheet`, `useLayerOpen` (`presentation` auto/desktop/sheet); also `OverflowMenu` (`label`, rows, `trigger`), `overflowMenuLabel`, `textOfNode`; `AdaptiveDialog` `notice` | Overlay | Dialog, DropdownMenu, Popover, Sheet + `useViewport` |
| `confirm-dialog` | `ConfirmDialog` (focus on Cancel; the yes repeats the verb; `tone`, `onConfirm` promise, `error`, children); also `disabledReason`, `notice`; `ConfirmDialogConsequences`, `ConfirmDialogConsequence` (`icon`) | Overlay | AdaptiveDialog |
| `truncated-text` | `TruncatedText` (`lines`, `cut` end/middle, `side`, `render`), `middleCut`, `TRUNCATION_MARK`; also the full text pinned at the pointer's spot, from the element on focus; min/max width knobs | Data Display | Tooltip |
| `list-row` | `ListRow` (`layout` inline / message, `selected`, `tone` neutral / live, `metaStyle` label / plain, `size` default / compact, index, title, meta, status, badge, detail, `progress`, sender, time, subject, preview, `unread`, `count`, `tag`, `account`, `previewLines`, `leading`, `marks`, `action`, `menu`, `disabled`, `disabledReason`, `href` / `onClick` / `mainRender`, `render`), `formatListCount` | Data Display | div + a or Base UI Button |
| `swipe-row` | `SwipeRow` (`leading`, `trailing`, `defaultOpen`, `onOpenChange`), `SwipeAction` (`tone` primary / neutral / needs-you), `swipeActionVariants`, `useSwipeRowActions`, `SwipeRowMenuItems`, types `SwipeRowAction`, `SwipeRowRunAction`, `SwipeRowConfirmAction` | Data Display | pointer events + Base UI Menu |
| `filter-chip` | `FilterChip` (`value`, `count`, `active`), `FilterChipGroup` (`type` single / multiple, `scroll`, `action`, `label`), `filterChipVariants`; also `FilterChip` `kind` toggle / trigger / button | Form | Base UI Button |
| `section-header` | `SectionHeader` (`title`, `count`, `level`, `variant` default / index, `inset`, `action`, `collapsible`, `summary`) | Layout | h2–h6 + Base UI Collapsible |
| `log-row` | `LogRow` (`time`, `dateTime`, `href`, `link`) | Data Display | div or a (useRender) |
| `diff-block` | `DiffBlock` (`path`, `previousPath`, `state`, `lines` / `diff`, `stats`, `additions`, `deletions`, `lineNumbers`, `foldable`, `maxLines`, `wrap`, `wrapToggle`, `copy`, `actions`), `parseDiffLines`, `parseUnifiedDiff` | Data Display | section |
| `file-chip` | `FileChip` (`name`, `type`, `size`, `thumbnail`, `busy`, `critical`, `href` / `onClick`, `action`) | Data Display | div + a or button |
| `table` | `Table` (`stickyHeader`, `label`), `TableHeader`, `TableBody`, `TableFooter`, `TableRow` (`selected`), `TableHead` (`numeric`), `TableCell` (`numeric`), `TableCaption`; also `Table` `selectable` (grid, one Tab stop, arrows, Enter / Space) | Data Display | table |
| `highlight` | `Highlight` (`text` + `query`, or children), `highlightParts` | Data Display | mark |
| `field-row` | `FieldRow` (`size`: default 52, display 64, stacked 64; `label`, value as children, `badge`, `description`, `meta`, `action`, `rule`: top / bottom / both / none, `inset`, `disabledReason`), `FieldRowAction` (ghost Button S, flush right; `href` for a link), `FieldRowValue` (`truncate`: middle / end / wrap, `keepEnd`), `useFieldRow`, `fieldRowVariants`; also `menu`, `menuLabel`; `FieldRowOverflow` | Data Display | div (role group) + Base UI Button |
| `toggle-row` | `ToggleRow` (Switch props + `label`, `description`, `badge`, `meta`, `rule`, `inset`, `disabledReason`; the whole row is the target) | Form | Base UI Switch |
| `metric` | `Metric` (`label`, `value`, `delta`, `tone`: neutral / up / down / live, `size`: default / hero, `unit`, `valueTone`, `badge`, `href` / `render`) | Data Display | div or a (useRender) |
| `needs-you` | `NeedsYou` (`title`, `more`, `body`, `action`, `secondaryAction`, `secondaryActions` ≤ 2, `announce`); also `size` default / compact; `NeedsYouProvider`, `useNeedsYouCompactShowing` | Feedback | section + status region |
| `banner` | `Banner` (`tone`: critical / info / warning / success, `size`: default / compact, `icon`, `title`, `body`, `action`, `onDismiss`), `bannerVariants`, `bannerIcons`; also compact text never cut (long tokens break) | Feedback | div (alert / status) |
| `calendar-event` | `CalendarEvent` (`tone`: primary / neutral, `time`, `title`, `place`, `swatch`, `compact`, `selected`, `mark`, `href`), `calendarEventVariants` | Data Display | button or a (useRender) |
| `meta-list` | `MetaList`, `MetaItem` (`label`) | Data Display | dl |
| `steps` | `Steps`, `Step` (`title`, `status`, `statusLabel`, `live`, `index`, `leading`, `detail`, `badge`, `action`, `href` / `onClick`, `disabled`), `StepsFolio` (`current`, `total`, `title`), `stepStatusWords` | Navigation | ol |
| `tile` | `Tile` (`edge`: primary / none, `swatch`, `size`: default / compact, `selected`, `href` / `onClick`), `tileVariants`, `swatchFillClasses`, `SwatchId` | Layout | div, button or a (useRender) |
| `composer` | `Composer` (`value`/`defaultValue`/`onValueChange`, `onSend`, `placeholder`, `label`, `sending`, `streaming` + `onStop` + `stopping`, `waiting` + `onCancelWaiting`, `disabled`, `sendDisabled`, `disabledReason`, `size`: default, line; `sendKey`: enter, mod-enter, auto, none; `status`, `chips`, `attach`, `leadingAction`, `fieldRef`, `fieldProps`), `composerCopy`, `ComposerProps`, `ComposerState`, `ComposerSendKey`, `ComposerSize` | Chat | form + textarea + Button |
| `chat-message` | `ChatMessage` (`role`: user, agent; `meta`, `state`: done, streaming, error; `phase`, `orb`, `endMarks`, `error`, `retry`, `actions`), `ChatMessageMetaButton`, `chatMessageCopy`, `ChatMessageRole`, `ChatMessageState`, `ChatMessageProps` | Chat | article |
| `artifact-card` | `ArtifactCard` (`icon`, `title`, `meta`, `selected`, `href`, `render`), `ArtifactCardProps`; also `state` ready / writing | Chat | button / a (useRender) |
| `summary-block` | `SummaryBlock` (`overline`, `lines`, `children`, `footer`, `caption`, `actions`, `state`: ready, loading, error; `error`, `loadingLines`), `summaryBlockCopy`, `SummaryBlockState`, `SummaryBlockProps` | Chat (model output) | section |
| `prose` | `Prose` (`variant`: body, response), `proseVariants`, `ProseVariant`, `ProseProps`; also (unchanged) response bold / h4 at the reply's size, strong weight | Content | div |
| `code-block` | `CodeBlock` (`code`, `label`, `language`, `copy`, `copyLabel`, `wrap`, `codeLabel`), `CopyButton` (`text`, `label`, `copiedLabel`, `onCopied`, `onCopyError`), `codeBlockCopy`, `copyButtonCopy`, `COPIED_FOR_MS` | Content, Action | figure + pre; IconButton |
| `security/digit-groups` | `DigitGroups`, `digitGroupSize`, `splitDigitGroups`, `spellDigitGroups` | Security | span |
| `security/qr-code` | `QrCode`, `encodeQrModules`, `qrPath`, `qrCodeTooLongText` | Security | svg; `qrcode-generator` 2.0.4 |
| `security/copy-countdown` | `useCopyCountdown`, `CopyCountdown`, `CopyCountdownState` (the "Clears in 28 s", then "Cleared" count a copied secret shows; SecretField, CodeDisplay and LargeTypeView use it) | Feedback (security) | hook |

Also exported: `cn` (clsx + tailwind-merge).

The rows from `app-frame` down are the parts 1.0 added (the 2026-11 direction: the shell, the
rows, the chat and security parts). The `Shell` family is the app frame and its chrome; a shell
part sets the layout an app would otherwise write with classes.

Not yet present (next candidates, in order of need across the four products): `card`,
`combobox`, `alert`, `alert-dialog` (a question is `ConfirmDialog`), `accordion`, `slider`.
Generate them with the transform (README → Regenerating components) rather than hand-writing.

## Conventions the primitives share

- Every root element carries `data-slot="<name>"`; sub-parts carry `data-slot="<name>-<part>"`.
  Styling hooks and `dsa` both key on these.
- Variants are `cva` objects exported next to the component (`buttonVariants`) so patterns can
  reuse them without wrapping.
- Icons: pass `<Icon name="…" />` as a child; shadcn's `svg` sizing rules apply unchanged
  because `Icon` renders an `<svg>` and sets its size with `width`/`height`, not a class. 20 px by
  default; a compact control (Button, Top Tab, chips, inline meta) draws it at 16 px itself. Mark
  leading/trailing icons with `data-icon="inline-start|inline-end"` to get the tightened padding.
  A name not in the curated set is a type error: add it to `src/icons/names.json` (a Carbon svg
  name with 32 px art) and run `pnpm --filter @unicron/ui icons:build`.
- **One focus ring.** The stylesheet draws it for every element: 2 px solid `--ring` (ink), 2 px
  clear. A control never writes `outline-none` (a field keeps its 2 px inside border instead).
  Inside `[data-slot="needs-you"]` or `on-needs-you` the ring takes `needs-you-on-fill`.
- **Strokes never add height.** An edge on a control or row is `rule-t|r|b|l`, `rule-box`,
  `rule-box-emphasis`, `edge-l` or `inset-ring`, never a border. A control under 44 px tall takes
  `hit-area`.
- **States** (contract §6): neutral and transparent parts take `bg-state-hover` /
  `bg-state-pressed`; solid fills go to 90 % and 80 %. Selected is `primary-soft` with `edge-l`,
  never a solid primary. Disabled is 50 % with no pointer events; loading sets `aria-busy` and keeps
  the label.
- On the needs-you yellow use the `needs-you*` Button kinds; they carry `on-needs-you`. An
  icon-only action is a `FloatButton` with a `label`. A long press always has a keyboard path (on
  `FloatButton`, Shift+Enter).
- **Button** has `variant`, `size`, `block` and `loading`. The label is `type-overline` (mono caps) at every boxed size; outlined kinds draw their edge inside the box, so every kind is the same width. `shape` is deprecated: `pill` is accepted and draws the 2 px radius.
  - `variant` adds `ghost-muted` and `ghost-destructive` to shadcn's six. `ghost-muted` is a quiet secondary action ("Add holidays and more"). `ghost-destructive` is a destructive action that shouldn't shout, like Delete in a dialog footer. The filled `destructive` is for the one action a dialog exists to confirm.
  - Until `FilterChip` lands, a filter chip is a `Button` with `aria-pressed`: `secondary` when on, `ghost` when off, with an optional count in muted ink.
  - `size="inline"` is for a text action inside a line of text ("Your account needs you to **sign in again**"). It has no height, padding, or border of its own, so it sits on the sentence's baseline in its size. Pair it with `variant="link"`. It is underlined at rest: its colour alone is under 3:1 against the sentence around it, so colour can't be the only cue (WCAG 1.4.1). A standalone text action keeps a normal size.
- **Icon** takes `tone="muted" | "destructive"` when it stands alone, outside a control. Inside a control, it inherits the control's ink, so leave `tone` off. App roles, such as an area's hue, stay in the app's own classes, because the core can't know them.
- **IconButton** is an icon-only control whose `label` becomes both its accessible name and its tooltip, so the two never drift apart. `tooltip` gives longer text, and `shortcut` adds a `Kbd`. `render` swaps the control: pass a `Toggle` for an on/off tool, or nest the IconButton in `DropdownMenuTrigger render={…}` to open a menu. Pass `icon`, or pass children to size or tint the glyph yourself.
- **Item** is a row: media, a title, a hint, and actions. Render it as the row's one control with `render={<a href… />}` or `render={<button type="button" />}`. Then it gets hover, `data-selected="true"` for the current row, and `disabled`. A row with separate controls inside stays a `div` and puts them in `ItemActions`.
  - When that row also has a main action (a booking link that opens, with a Copy beside it), wrap its media and content in `ItemMain`. Its target covers the whole row, so the row clicks, hovers, and shows focus like one button, while the `ItemActions` stay separate controls on top. `ItemMain` takes `render={<a href… />}` for a link.
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
- **Menus are solid** (`bg-popover`, a 1 px rule). No glass and no `backdrop-blur` anywhere (1.0 contract §1.5, which reverses the 2026-10-15 frosted-glass decision). Backdrops are `scrim-dialog` / `scrim-sheet` / `scrim-menu`.
- **DialogContent `size`** sets how wide a dialog is from `sm` up. <a name="dialog-widths"></a>Each size is a range, not one width. The dialog fits its content: short content sits at the size's min width, and a long line, a table or a wide field pushes it out to the max width, where text starts to wrap. A dialog is never wider than the screen less 1rem each side, and on phones it is that wide. Every dialog scrolls inside itself when it's taller than the screen, so no dialog sets its own width or scrolling. A dialog with its own layout (a composer's header, body, and footer) still sets its height and padding.

    | `size` | Min width | Max width | For |
    |---|---|---|---|
    | `xs` | 16rem | 20rem | very narrow; only under the rule below |
    | `sm` (default) | 24rem | 28rem | a question |
    | `md` | 28rem | 36rem | a short form |
    | `lg` | 32rem | 42rem | settings |
    | `xl` | 42rem | 56rem | a composer |
    | `2xl` | 48rem | 64rem | a preview |

  - The widths are tokens: `--c-dialog-<size>-min-width` and `--c-dialog-<size>-max-width`. An app that needs different ranges re-maps them in its extension layer.
  - Each min width is the fixed width the size had up to 0.15. So moving to ranges made no dialog narrower; dialogs with more content got wider.
  - **When a very narrow dialog is allowed.** `xs` is the only narrow size. Use it only when all of these hold:
    1. At most one short sentence of text.
    2. At most two actions, each one word ("OK", "Cancel", "Unlock").
    3. At most one short field: a PIN, a 6-digit code.
    4. Nothing that can't wrap: no file name, email address, path, URL or table.

    If any one fails, use `sm` or wider. A question that names the thing it acts on ("Delete *Quarterly report final v3.pdf*?") is `sm`, because names run long.
  - `CommandDialog` keeps a fixed width, its size's min, so the palette doesn't change width as results come and go.
  - The names are product sizes, not Tailwind's `max-w-*` steps, and they stay fixed: renaming a size would move every dialog an app already has.
- **Closing on a click outside** (`closeOnOutsideClick` on `Dialog`, `Sheet` and `CommandDialog`). A click or tap outside the popup closes it: on the backdrop, or anywhere else when there is no backdrop. It is on by default. Turn it off (`closeOnOutsideClick={false}`) in three cases:
  - a form with unsaved work, where a stray click would throw the work away;
  - a destructive or irreversible step, where closing should be a choice, not an accident;
  - a detail sheet beside a list (`SheetContent backdrop={false}` with `Sheet modal={false}`), where a click on another row should change the sheet, not close it.

  Escape and the close button still close it, so a dialog with the prop off needs a visible Cancel. Base UI's own `disablePointerDismissal` still works and wins if both are passed. App panels and panes built outside unicron use the same prop name, with the same default.
- **Sticky footers** (`sticky` on `DialogFooter`, `DialogActions` and `SheetFooter`). The footer stays pinned to the bottom of the container that scrolls around it, so its actions never scroll out of view. Off by default. When on, the footer is opaque, so content scrolls under it, not through it. In a dialog the popup itself scrolls, so `<DialogFooter sticky>` is all it takes. In a `SheetContent`, give the sheet (or the part of it that scrolls) `overflow-y-auto`; `AdaptiveSheetContent` already scrolls its content area. Use it on any footer below content that can grow: settings, filters, long forms.
- **Dialog padding** (`--c-dialog-padding`, 1rem). `DialogContent` pads by it, and `DialogFooter` reaches out by it to run edge to edge, pads its buttons by it, and pins by it when sticky. To change one dialog's padding, set the variable: `<DialogContent className="[--c-dialog-padding:1.5rem]">`. Don't put `p-6` on `DialogContent`: the footer can't see a class, so it stops short of the edges. To change every dialog, re-map the token in the app's extension layer.
- **Select or NativeSelect.** `NativeSelect` is the default for a form: the OS draws the list, and on a phone that's the picker people know. Use `Select` when an option needs more than a line of plain text, such as an icon or a second line, or when the list has to match the frosted menus beside it. Past about 15 options, use a combobox. Pass `items` (value → label) to `Select` so the trigger shows the label before the list has opened; without it, the trigger shows the raw value. Label it with `Label htmlFor` pointing at an `id` on `SelectTrigger`.
- **Popover or Tooltip.** A `Tooltip` holds a few words and takes no focus. Use a `Popover` when the content is interactive or longer than that. It's solid, not frosted, because it holds text and controls. Give it a `PopoverTitle`, which names it for screen readers. `--c-popover-width` (18rem) sets its width, and it never outgrows the space on screen.
- **ResizablePanes** divide a space the person can resize, such as a list beside its detail. It fills its parent, so give the parent a height. Every `ResizableHandle` needs a `label` ("Resize the conversation"), since it takes focus. Sizes are percentages or pixels (`minSize="20%"`, `minSize="240px"`), and the arrow keys, Home and End move a focused handle, with F6 stepping between handles. To remember a layout, give each pane an `id`, and pass `defaultLayout` and `onLayoutChanged` from `useResizablePanesLayout({ id })` to `ResizablePanes`. Pass them by name: `dsa` counts a spread onto a system component against a consumer's ratchet. When the set of panes changes, as at a breakpoint, also pass `panelIds`, so each set keeps its own layout. On a phone, show one pane at a time instead.
- **AppFrame** is the outermost box of an app that fills the screen, and it owns what a device does to one. The page can't scroll, so a rotation can't strand it. It keeps clear of the notch, the home bar and any keyboard. Children are `AppFrameHeader`, `AppFrameMain` and `AppFrameNav`. `AppFrameNav` (with an `aria-label`) holds `AppFrameNavItem`s, each with an `icon`, a `label` for screen readers, and `current`. It's a glass capsule floating above the content, like the bars in iOS 27. When height is scarce it's a pill at the foot of the right edge, as iOS has it on iPhone Duo. `AppFrameMain` keeps clear of it; to let content run underneath, so the glass has something to show, pass `bleed` and pad what scrolls by `--app-frame-nav-clearance` and `--app-frame-nav-clearance-end`. The header goes away on a short screen, so anything that must stay reachable also goes in `AppFrameNavEnd`, which only shows there, at the head of the pill. With room to spare, `AppFramePivot` is a column of the same `AppFrameNavItem`s in place of `AppFrameNav`, with `AppFramePivotEnd` for its foot, and `AppFrameSidebar` is a list beside the content that holds its place in the layout. On a smaller screen, show that list in a `SheetContent side="left"` instead. A document or marketing page shouldn't use `AppFrame`: those need the page to scroll. [05-consuming.md](05-consuming.md) has the responsive rules.
- **AppFrameDetail** holds what belongs to the content rather than being another place, such as a conversation's documents. It follows `viewport.detailPlacement`: beside the content with a line to drag, on the far side of a book-pose fold, or in a sheet that covers a phone. Use a pivot only for places unrelated to each other, and this for anything that changes with what's open.
- **UpdateStatusRow and AutoCheckSwitch** are the updates part of an app's Settings → About, so every app shows its updates the same way. Pass the update kit's `UpdateStatus` (snds/app-updates) as it arrives, the app's name, and callbacks; neither fetches anything. `UpdateStatusRow` shows the version and channel, one status line in a polite live region (held `aria-busy` while downloading, so the percentage isn't read out at every step), **Check for updates** (disabled while off, checking or downloading), **Restart to update** once an update is ready and **Reload app** otherwise, and the release page link when an update has to be fetched by hand. A desktop shell passes `onOpenLink`, since a web view won't open a new window itself. `restartNote` adds a line once an update is ready ("Restarting locks Lockdown."), and `error` shows what went wrong with the last action as an alert. `AutoCheckSwitch` is the **Check automatically** row, a label, when the check runs, and a switch, and renders nothing when the build has no updates. The words are Lockdown's and Synapse's; pass `words` to change any of them. `updateLine(status, appName)` is the status line on its own, for a menu or a command palette.
- **FoldPanes** puts two parts either side of a fold when a device is partly folded, and otherwise shares the space. `split="columns"` is for a fold down the middle: use it when `useViewport().fold` says `book`. `split="rows"` is for a fold across the middle, so what you read stands up and what you touch lies flat, and it needs no check: it behaves as a plain fill-then-footer column on every other device. Neither is a draggable line, because the fold is the line.
- **Menu width** (`width` on `DropdownMenuContent`, `DropdownMenuSubContent` and `SelectContent`, where the default is `fit`). A list can match the control that opens it or size itself apart from it:

    | `width` | The list is | For |
    |---|---|---|
    | `trigger` (default) | exactly as wide as its trigger | a select-style field, where the list lines up under it |
    | `fit` | as wide as its items, at least as wide as the trigger, at most `--c-menu-max-width` | a small button ("Change") that opens longer choices |
    | `auto` | as wide as its items, whatever the trigger, at most `--c-menu-max-width` | an icon button; a submenu (its default) |

  Every list is at least `--c-menu-min-width` (8rem) wide. `fit` and `auto` stop at `--c-menu-max-width` (20rem) and at the space left on screen; past that an item's label wraps onto a second line instead of making the list wider. `trigger` follows the trigger, however wide. The tokens are the place to change the limits, not a `className` on one list.
- **DialogTitle** lays a leading Back button out inline with the text, for dialogs with steps.
- **Skeleton** is sized by `className` (an avatar, a line of text), or by `variant="row"` for one list row: full width and `--c-skeleton-row-height` tall (2.5rem, an `Item size="sm"` with one line), so a list skeleton is `<Skeleton variant="row" />` three times with no `className`. An app with a density setting re-maps `--c-skeleton-row-height` once, in its extension layer, to its own row height (`--c-skeleton-row-height: var(--c-row-height)`), and every row skeleton follows the density.
- **Command** is cmdk under unicron's styles. Three things it adds:
  - *Search text.* `CommandItem`'s `value` is its key: what `onSelect` and `Command`'s `value` / `onValueChange` hand back. By default it is also what a search matches, together with the item's `keywords` (cmdk's filter ranks `value` and `keywords` joined). So an item keyed by an id (`value={item.id}`) matches the id's letters. Pass the words it should be found by as `keywords` (a title, a username, a host) and set `Command match="keywords"`: an item that has keywords is then matched on those alone, and one without on its `value`, with cmdk's own ranking. A `filter` you pass still wins, for a different matching rule.
  - *Give an item with icons or an action an explicit `value`.* Without one cmdk takes the item's text, and every `Icon`'s glyph name is text (the trailing check adds "check").
  - *A second action.* `CommandItemAction` (`label`, `icon`, `onAction`, `disabled`) is a small icon button at the end of a `CommandItem`, beside its main action (`onSelect`): copy a password, open in a new window. One per item. An item is a `role="option"` and focus stays in the search field (`aria-activedescendant`), so a button inside it can't be tabbed to or announced as a button. The action is reached three ways instead:
    - A pointer clicks the button. The press is out of the item's selection: it never runs `onSelect`, and focus and the highlight stay in the search field.
    - The keyboard presses ⌘↵ on Apple platforms, Ctrl+Enter elsewhere, while the item is highlighted. `Command` runs the action; plain Enter still selects. An item without an action keeps cmdk's behaviour (Ctrl+Enter selects, as before). A disabled action swallows the keys. A host that handles the keys itself calls `preventDefault` in its `onKeyDown`, and `Command` steps aside.
    - A screen reader hears it with the item. The item is described by "Copy password, Command Enter" and carries `aria-keyshortcuts`; the button itself is `aria-hidden` and out of the tab order, since the description says it. The tooltip shows the label and the key. `commandItemActionShortcut()` gives the key's label for your own hint text (the dialog's description, say).

    ```tsx
    <Command match="keywords">
      <CommandInput placeholder="Search" />
      <CommandList>
        {items.map((it) => (
          <CommandItem key={it.id} value={it.id} keywords={[it.title, it.username]} onSelect={() => open(it.id)}>
            {it.title}
            <CommandItemAction label="Copy password" icon="content_copy" onAction={() => copy(it.id)} />
          </CommandItem>
        ))}
      </CommandList>
    </Command>
    ```
- **SheetContent `fullscreen`** covers the whole screen edge to edge and clears the status bar: a phone editor, like Mail's compose. An app can still move its bottom edge, for example above the keyboard.
- **`beforeContent`** on `DialogContent`, `SheetContent`, `AdaptiveSheetContent` and `CommandDialog` renders in the portal between the backdrop and the popup, so it paints above the backdrop and below the popup. A desktop app with the native title bar hidden puts its window drag strip there; a press on it does not dismiss (only a press on the backdrop does). The popups keep clear of `--c-dialog-titlebar-inset` (0px by default): a dialog centres in the area below it, a side or top sheet starts under it. Recipe: [05 · Consuming → Desktop title bar](05-consuming.md#9-desktop-title-bar).
- **Security components** live in `components/security/` and are also importable as `@unicron/ui/security/<name>`. Each follows its one-page spec under `docs/specs/security/`; the host's core does the cryptography and the component only ever receives short strings or a one-shot handle.
  - **CodeDisplay** shows a one-time code grouped for reading (6 → 3+3, 8 → 4+4, Steam 5 as one group), a ring for the time left, the `warning` state at 5 s, the next code at 10 s, and a copy that takes the next code in the last 3 s. HOTP has no ring; "Next code" calls `onAdvance`. Codes are exposed to assistive tech one character at a time ("4 8 2, 9 1 7"), never as a number. `CodeDisplayList` gives a list one shared live region. The clipboard clear follows SecretField's contract: `onCopy` may resolve with `{ hash }`, `clipboardHolds(hash)` is asked at the countdown's end, `onClipboardClear(ref)` gets that copy's reference and may resolve whether it cleared, and "Cleared" is said only after a real clear.
  - **LargeTypeView** is a fullscreen sheet that shows a secret in groups of three, digits in `info`, letters in `foreground`, symbols in `warning`, with captions naming every symbol and every ambiguous glyph. It fits the width, hides after `lifetime` (120 s) and on window blur, and `print` renders the same layout inline as the recovery-kit page.
  - **CrownJewel** is three parts: `CrownJewelMark` (inline lock + sr-only word), `CrownJewelSurface` (re-maps `--background`, `--foreground`, `--muted`, `--border`, … onto `protected` for its subtree, the way `.dark` does, and flips nested SecretField, CodeDisplay and LargeTypeView into gated mode through `useCrownJewel()`), and `CrownJewelGate` (the "Confirm it's you" dialog at the `biometric` or `password` level, host-driven). The surface renders only when `host` is `app`, `os` or `extension-top-layer`.
- No component imports a `--g-*` token. Everything goes through tier 2 or tier 3.
- `AdaptiveSheetContent` is the one primitive that reads tier-3 knobs directly
  (`--c-sheet-*`): a bottom sheet under the `sm` breakpoint, a side panel above it.
  Its `wide` prop widens the side panel (`--c-sheet-wide-width`, 36rem) for content like a
  photo or a drawing; on phones it's the same bottom sheet. The panel never exceeds the
  viewport (`max-w-full`). Its `className` styles the inner scroll area, not the panel.

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
    `--c-risk-tier-height-{sm,md}` (the Badge tones paint the rest).
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
  - *Edit mode:* `value` / `onChange` (controlled), `name`, `required` (native, plus `aria-required`), `onBlur`,
    `disabled`, `error`, `strength`. `multiline` (with `rows`, default 4) is a textarea for a secret over several lines
    (a private key, a recovery phrase): it keeps line breaks, is masked until Show (`-webkit-text-security`, or
    transparent ink where an engine lacks it), and blocks copy, cut and drag while masked. `strength` comes from the
    host's core; `secretStrengthFromScore(0–4)` maps a zxcvbn-style score to the three words, so every host says the
    same word.
  - *Host contract:* `getSecret(): Promise<Uint8Array>` (one-shot, zeroed after use) and `host.copy(bytes)` /
    `host.clear()` / `host.clipboardHolds?(hash)` / `host.gate?(kind)`. In read mode the value never enters React state as a string.
  - *Tokens:* `input`, `border`, `foreground`, `muted-foreground`, `ring`, `primary`, `destructive`, `warning`,
    `font-mono`; `--c-secret-field-{mask-count,reveal-lifetime,clipboard-timer,revealed-bg,copy-track,copy-progress,meter-weak,meter-fair,meter-strong,letter-spacing}`.
