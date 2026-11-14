// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/warpcore · PR snds/unicron#65 · DSA none
// Promoted from: Seeded in snds/unicron (2026-11 design direction: the trigger is Figma 32:48's Text Field box; the list is solid, square 2px, a rule, no blur; no app PR, no DSA record)
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { useRender } from "@base-ui/react/use-render"
import { MENU_WIDTHS, type MenuWidth } from "../menu-width"
import { cn } from "../../lib/utils"

import { Icon } from "../icon"
import { fieldBoxVariants } from "./input"

/**
 * Pass `items` (value → label) so the trigger shows an option's label before the list has opened.
 * Without it, `SelectValue` shows the raw value.
 */
const Select = SelectPrimitive.Root

/** Set by a group, so a label inside one can name it (Base UI's GroupLabel needs a group). */
const InSelectGroup = React.createContext(false)

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <InSelectGroup.Provider value>
      <SelectPrimitive.Group
        data-slot="select-group"
        className={cn("scroll-my-1", className)}
        {...props}
      />
    </InSelectGroup.Provider>
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("min-w-0 flex-1 truncate text-left", className)}
      {...props}
    />
  )
}

// The trigger is the Text Field's box (Figma 32:48): raised, a 1px rule inside, 48 tall, 16px in,
// the value in the `ui` role. Under the pointer it takes the 6% hover wash laid on its fill, so it
// stays opaque; while its list is open it keeps the 2px focus border. `sm` is 40, for a row.
const TRIGGER = cn(
  fieldBoxVariants(),
  "flex w-fit max-w-full min-w-0 items-center justify-between gap-2 whitespace-nowrap select-none",
  "data-[size=default]:h-control data-[size=default]:px-4 data-[size=sm]:h-10 data-[size=sm]:px-3 data-[size=sm]:hit-area",
  "hover:bg-[color-mix(in_oklab,var(--text-body)_6%,var(--surface-raised))] data-popup-open:rule-box-emphasis data-placeholder:text-muted-foreground",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0"
)

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger data-slot="select-trigger" data-size={size} className={cn(TRIGGER, className)} {...props}>
      {children}
      <SelectPrimitive.Icon
        render={<Icon className="pointer-events-none shrink-0 text-support-foreground" name="chevron--down" size={size === "sm" ? "sm" : "md"} />}
      />
    </SelectPrimitive.Trigger>
  )
}

/**
 * The list: solid `surface-raised`, a 1px rule drawn inside it, the 2px corner, no blur and no
 * shadow (contract 5.1a). Widths are a menu's (`MENU_WIDTHS`), and the list opens under the
 * trigger, as a menu does. `width` is `fit` by default: a trigger is only as wide as its value unless it is sized, and a
 * list that matched it would wrap every longer option. `alignItemWithTrigger` lays the chosen item
 * over the trigger instead.
 */
function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  width = "fit",
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  > & {
    /** How wide the list is (MENU_WIDTHS): `fit` by default. */
    width?: MenuWidth
  }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-width={width}
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "bg-popover text-popover-foreground rule-box rounded-lg data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 duration-(--motion-fast) data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 animate-none! relative isolate z-50 max-h-(--available-height) origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none",
            // Base UI hides the list's scrollbar with an inline <style> when the chosen item sits
            // over the trigger. A strict CSP (Lockdown: style-src 'self') blocks that tag, so the
            // stylesheet's own utility does it too.
            "data-[align-trigger=true]:no-scrollbar",
            MENU_WIDTHS[width],
            className
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List data-slot="select-list" className="p-1">
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

// A heading in the list: the overline, as a field's label.
const LABEL = "type-overline px-3 pt-2 pb-1 text-muted-foreground"

/**
 * A small heading in the list. Inside a `SelectGroup` it names the group for screen readers (Base
 * UI's `Select.GroupLabel`). On its own it is a plain label, because Base UI's GroupLabel throws
 * outside a group (the same blank page `DropdownMenuLabel` guards against).
 */
function SelectLabel({
  className,
  render,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  const inGroup = React.useContext(InSelectGroup)
  const alone = useRender({
    defaultTagName: "div",
    render: inGroup ? undefined : (render as useRender.RenderProp | undefined),
    props: mergeProps<"div">(
      {
        "data-slot": "select-label",
        className: cn(LABEL, typeof className === "string" ? className : undefined),
      } as React.ComponentProps<"div">,
      props as React.ComponentProps<"div">
    ),
    state: { slot: "select-label" },
    enabled: !inGroup,
  })
  if (!inGroup) return alone
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(LABEL, className)}
      render={render}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // 40 tall, and the 44px touch minimum on a coarse pointer, as a menu row (contract 6.6). The
        // value in the `ui` role. The highlighted item takes the opaque accent; the chosen one shows
        // a check at the end, in the ink.
        "type-ui relative flex min-h-10 w-full cursor-default items-center gap-2 rounded-lg py-2.5 pr-10 pl-3 text-foreground outline-hidden select-none pointer-coarse:min-h-touch-min data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 items-center gap-2">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={<span className="pointer-events-none absolute right-3 flex size-4 items-center justify-center" />}
      >
        <Icon className="pointer-events-none" name="checkmark" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      // The 1px it draws comes out of the space under it (4 above, 3 below): strokes add no height.
      className={cn("pointer-events-none -mx-1 mt-1 mb-0.75 h-px bg-line-rule", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 text-support-foreground [&_svg:not([class*='size-'])]:size-4 top-0 w-full", className)}
      {...props}
    >
      <Icon name="chevron--up" />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 text-support-foreground [&_svg:not([class*='size-'])]:size-4 bottom-0 w-full", className)}
      {...props}
    >
      <Icon name="chevron--down" />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
