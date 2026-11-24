// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2.0: Figma Menu 76:415 and Menu Item 76:325, frosted by default per Sean's 2026-11-23 ruling; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { MENU_WIDTHS, type MenuWidth } from "../menu-width"
import { cn } from "../../lib/utils"

import { Icon } from "../icon"

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

export type DropdownMenuWidth = MenuWidth

/**
 * The panel, frosted (Figma Menu, 2.0): the popover frost at 72% over a 24px backdrop blur, the
 * popover shadow and a 1px rule (the `surface-frost` utility), 8px corners, 4 inside. Rows sit 4
 * apart, not Figma's 2, so a menu stays on the 4px grid; a separator takes 4 (its hairline and 3
 * under it). With reduced transparency it is the solid popover surface.
 */
const PANEL =
  "surface-frost text-text-body relative flex flex-col gap-1 rounded-md p-1 outline-none max-h-(--available-height) origin-(--transform-origin) overflow-x-hidden overflow-y-auto data-closed:overflow-hidden"

/**
 * It fades and moves 8px off its anchor: no zoom. 120ms both ways, and still when opened or closed
 * from the keyboard (motion-anchor-fast).
 */
const PANEL_MOTION = "motion-anchor motion-anchor-fast"

/**
 * Over the scrim the menu is solid: the scrim already sets it apart, and 72% of the popover over a dimmed page
 * left its label ink under 4.5:1 (Warpcore's quick create on a phone, stone).
 */
const OVER_SCRIM = "[--surface-popover-frost:var(--surface-popover)]"

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  width = "trigger",
  scrim = false,
  container,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    /** How wide the list is (MENU_WIDTHS): `trigger` by default, as before. */
    width?: DropdownMenuWidth
    /**
     * Dim the page behind with the menu scrim (--c-scrim-menu: 32% on graphite, the role's 64% on stone): quick
     * create, the environment menu. Off by default. Only the root menu draws it, never a submenu.
     */
    scrim?: boolean
    /** Where the portal goes: `<body>` by default. */
    container?: MenuPrimitive.Portal.Props["container"]
  }) {
  return (
    <MenuPrimitive.Portal container={container}>
      {scrim ? (
        <MenuPrimitive.Backdrop
          data-slot="dropdown-menu-scrim"
          className="scrim-menu fixed inset-0 z-50 transition-opacity duration-(--motion-fast) data-ending-style:opacity-0 data-starting-style:opacity-0"
        />
      ) : null}
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          data-width={width}
          className={cn(PANEL, PANEL_MOTION, "z-50", MENU_WIDTHS[width], scrim && OVER_SCRIM, className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

/** Set by a group, so a label inside one can name it (Base UI's GroupLabel needs a group). */
const InMenuGroup = React.createContext(false)

function DropdownMenuGroup({ className, ...props }: MenuPrimitive.Group.Props) {
  return (
    <InMenuGroup.Provider value>
      <MenuPrimitive.Group data-slot="dropdown-menu-group" className={cn("flex flex-col gap-1", className)} {...props} />
    </InMenuGroup.Provider>
  )
}

/** A section label: an overline, in label ink, flush with the panel's padding (as Figma draws `CREATE // LONG PRESS`). */
const LABEL = "type-overline text-text-label select-none px-2.5 py-1 data-inset:pl-10"

/**
 * A small heading in a menu, set as an overline. Inside a `DropdownMenuGroup` or
 * `DropdownMenuRadioGroup` it names the group for screen readers (Base UI's `Menu.GroupLabel`). On
 * its own, at the top of a menu, it is a plain label: Base UI's GroupLabel throws outside a group,
 * which blanked the whole page (Lockdown #10, and the playground's Options menu).
 */
function DropdownMenuLabel({
  className,
  inset,
  render,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  const inGroup = React.useContext(InMenuGroup)
  const alone = useRender({
    defaultTagName: "div",
    render: inGroup ? undefined : (render as useRender.RenderProp | undefined),
    props: mergeProps<"div">(
      {
        "data-slot": "dropdown-menu-label",
        className: cn(LABEL, typeof className === "string" ? className : undefined),
        "data-inset": inset ? "" : undefined,
      } as React.ComponentProps<"div">,
      props as React.ComponentProps<"div">
    ),
    state: { slot: "dropdown-menu-label" },
    enabled: !inGroup,
  })
  if (!inGroup) return alone
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(LABEL, className)}
      render={render}
      {...props}
    />
  )
}

/**
 * One row, as Figma draws the rows of its two menus (the quick-create menu, Vale and Lockdown
 * States 03, and Vale 05's folder sheet): a Nav Item. 36 tall (44 on a touch screen), 10 in from
 * the panel's padding, a 20px glyph 10 from the words; the words in the label role (14/20 Medium)
 * and, with the glyph, in secondary ink. The highlighted row (pointer or keys) takes the opaque
 * highlight fill (`bg-accent`) and body ink. The row that is current, or checked, is body ink too;
 * a current row also takes the `primary-soft` tile, as a current Nav Item does.
 */
const ITEM =
  "type-ui text-text-body group/dropdown-menu-item relative flex min-h-8 cursor-default items-center gap-2.5 rounded px-2.5 py-1.5 outline-hidden select-none pointer-coarse:min-h-touch-min data-highlighted:bg-surface-hover data-checked:text-text-body data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5"

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  current = false,
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  /** `destructive`: the words and glyph in the critical ink. */
  variant?: "default" | "destructive"
  /** The row for where the person already is (the open folder): the 8% selected fill, `aria-current`. */
  current?: boolean
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      data-current={current ? "" : undefined}
      aria-current={current ? "true" : undefined}
      className={cn(
        ITEM,
        "data-current:bg-surface-selected",
        // Critical ink holds through the highlight: the highlight's body ink must not replace it.
        "data-[variant=destructive]:text-critical-text data-[variant=destructive]:data-highlighted:text-critical-text",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(ITEM, "data-popup-open:bg-surface-hover", className)}
      {...props}
    >
      {children}
      <span className="ml-auto flex">
        <Icon name="chevron--right" size="sm" />
      </span>
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -9,
  side = "right",
  sideOffset = 0,
  width = "auto",
  className,
  ...props
}: Omit<React.ComponentProps<typeof DropdownMenuContent>, "scrim">) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={className}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      width={width}
      {...props}
    />
  )
}

/** The mark at the end of a checked row: a 16px check, in the row's ink (body ink: a checked row is the current one). */
function Indicator({ children, slot }: { children: React.ReactNode; slot: string }) {
  return (
    <span className="pointer-events-none absolute right-2.5 flex items-center justify-center" data-slot={slot}>
      {children}
    </span>
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(ITEM, "pr-9", className)}
      checked={checked}
      {...props}
    >
      <Indicator slot="dropdown-menu-checkbox-item-indicator">
        <MenuPrimitive.CheckboxItemIndicator>
          <Icon name="checkmark" size="sm" />
        </MenuPrimitive.CheckboxItemIndicator>
      </Indicator>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ className, ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <InMenuGroup.Provider value>
      <MenuPrimitive.RadioGroup
        data-slot="dropdown-menu-radio-group"
        className={cn("flex flex-col gap-1", className)}
        {...props}
      />
    </InMenuGroup.Provider>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(ITEM, "pr-9", className)}
      {...props}
    >
      <Indicator slot="dropdown-menu-radio-item-indicator">
        <MenuPrimitive.RadioItemIndicator>
          <Icon name="checkmark" size="sm" />
        </MenuPrimitive.RadioItemIndicator>
      </Indicator>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

/**
 * A hairline across the panel, edge to edge. Strokes never add height (contract §1.6): the 1px it
 * draws is taken back from the space under it (4 above, 3 below), so a menu with separators is as
 * tall as its rows and gaps, and what follows stays on the 4px grid.
 */
function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-line-rule mb-0.75 h-px shrink-0", className)}
      {...props}
    />
  )
}

/** The row's keys at its end (`⌘N`), in the meta role and label ink, as Figma Menu Item draws them. Said with the row for assistive tech; set `aria-keyshortcuts` on the item too. */
function DropdownMenuShortcut({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span data-slot="dropdown-menu-shortcut" className={cn("ml-auto shrink-0 pl-4 type-meta text-text-label", className)} {...props}>
      {children}
    </span>
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
