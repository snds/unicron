// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: solid menus, the quick-create menu drawn on the app pages (Vale and Lockdown States 03: raised, 1px rule, padding 8, gap 4, overline, Nav Item rows); the frosted menu of 2026-10-15 reversed; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { MENU_WIDTHS, type MenuWidth } from "../menu-width"
import { cn } from "../../lib/utils"

import { Icon } from "../icon"
import { Kbd } from "./kbd"

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
 * The panel, solid and square like every overlay: the raised surface, a 1px rule, the 2px corner,
 * 8 inside and 4 between rows, no shadow and no blur (the frosted menu of 2026-10-15 is reversed).
 */
const PANEL =
  "bg-surface-raised text-text-body rule-box relative flex flex-col gap-1 rounded p-2 outline-none max-h-(--available-height) origin-(--transform-origin) overflow-x-hidden overflow-y-auto data-closed:overflow-hidden"

/** It fades and moves 8px off its anchor: no zoom. */
const PANEL_MOTION =
  "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 duration-(--motion-fast) ease-(--motion-ease)"

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
     * Dim the page behind with the menu scrim (--c-scrim-menu, 32%; about 20% on stone): quick
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
          className={cn(PANEL, PANEL_MOTION, "z-50", MENU_WIDTHS[width], className)}
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
const LABEL = "type-overline text-text-label select-none data-inset:pl-2.5"

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
 * One row, as the quick-create menu draws its Nav Items: 36 tall (44 on a touch screen), 10 in from
 * the panel's padding, a 20px glyph 10 from the words, words in the ui role. The highlighted row
 * (pointer or keys) takes the opaque highlight fill (`bg-accent`).
 */
const ITEM =
  "type-ui text-text-body group/dropdown-menu-item relative flex min-h-9 cursor-default items-center gap-2.5 rounded px-2.5 py-2 outline-hidden select-none pointer-coarse:min-h-touch-min data-highlighted:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5"

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  /** `destructive`: the words and glyph in the critical ink. */
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(ITEM, "data-[variant=destructive]:text-critical-text", className)}
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
      className={cn(ITEM, "data-popup-open:bg-accent", className)}
      {...props}
    >
      {children}
      <span className="ml-auto flex text-text-secondary">
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

/** The mark at the end of a checked row: a 16px check, in the row's ink. */
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

/** A hairline across the panel, edge to edge. */
function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-line-rule -mx-2 my-1 h-px shrink-0", className)}
      {...props}
    />
  )
}

/** The row's keys, in a Kbd at its end (`⌘N`). Said with the row for assistive tech; set `aria-keyshortcuts` on the item too. */
function DropdownMenuShortcut({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span data-slot="dropdown-menu-shortcut" className={cn("ml-auto flex shrink-0 pl-4", className)} {...props}>
      <Kbd>{children}</Kbd>
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
