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
| `dialog` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`, `DialogOverlay`, `DialogPortal` | Overlay | Base UI Dialog |
| `sheet` | `Sheet`, `SheetTrigger`, `SheetContent`, `AdaptiveSheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `SheetClose` | Overlay | Base UI Dialog |
| `command` | `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator` | Overlay (command palette; a known gap in the canonical 62, composed from Dialog + InputGroup + cmdk) | cmdk |
| `icon` | `Icon`, `IconName`, `IconProps` | Content | svg + Material Symbols Rounded |

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
- No component imports a `--g-*` token. Everything goes through tier 2 or tier 3.
- `AdaptiveSheetContent` is the one primitive that reads tier-3 knobs directly
  (`--c-sheet-*`): a bottom sheet under the `sm` breakpoint, a side panel above it.
  Its `wide` prop widens the side panel (`--c-sheet-wide-width`, 36rem) for content like a
  photo or a drawing; on phones it's the same bottom sheet. The panel never exceeds the
  viewport (`max-w-full`). Its `className` styles the inner scroll area, not the panel.
