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
- **Icon** takes `tone="muted" | "destructive"` when it stands alone, outside a control. Inside a control, it inherits the control's ink, so leave `tone` off. App roles, such as an area's hue, stay in the app's own classes, because the core can't know them.
- **IconButton** is an icon-only control whose `label` becomes both its accessible name and its tooltip, so the two never drift apart. `tooltip` gives longer text, and `shortcut` adds a `Kbd`. `render` swaps the control: pass a `Toggle` for an on/off tool, or nest the IconButton in `DropdownMenuTrigger render={…}` to open a menu. Pass `icon`, or pass children to size or tint the glyph yourself.
- **DialogActions** is the dialog's actions as one row on every screen.
  - Each `DialogAction` takes a `kind`: `confirm`, `cancel`, or `destructive`.
  - From `sm` up, the actions are text buttons: confirm filled, cancel outlined, destructive a quiet `ghost-destructive` on the far left.
  - On phones, each action is a round 40px icon button (✓, ×, trash), the layout of Apple's sheet controls. Its words stay as its accessible name. `icon` overrides the glyph.
  - Use it when a dialog has a way to back out. A dialog with one action keeps a plain `DialogFooter` with a text button, because a lone ✓ says less than the words.
- **Menus are frosted glass** (`bg-popover/70` with a backdrop blur), by decision (2026-10-15). Don't override them to solid.
- **DialogTitle** lays a leading Back button out inline with the text, for dialogs with steps.
- **SheetContent `fullscreen`** covers the whole screen edge to edge and clears the status bar: a phone editor, like Mail's compose. An app can still move its bottom edge, for example above the keyboard.
- No component imports a `--g-*` token. Everything goes through tier 2 or tier 3.
- `AdaptiveSheetContent` is the one primitive that reads tier-3 knobs directly
  (`--c-sheet-*`): a bottom sheet under the `sm` breakpoint, a side panel above it.
  Its `wide` prop widens the side panel (`--c-sheet-wide-width`, 36rem) for content like a
  photo or a drawing; on phones it's the same bottom sheet. The panel never exceeds the
  viewport (`max-w-full`). Its `className` styles the inner scroll area, not the panel.
