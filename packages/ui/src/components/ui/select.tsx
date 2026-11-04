// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/warpcore · PR snds/unicron#65 · DSA none
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { useRender } from "@base-ui/react/use-render"
import { MENU_WIDTHS, type MenuWidth } from "../menu-width"
import { cn } from "../../lib/utils"

import { Icon } from "../icon"

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

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/60 dark:aria-invalid:ring-destructive/50 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors select-none focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-4 flex w-fit max-w-full min-w-0 items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <Icon className="text-muted-foreground size-4 shrink-0 pointer-events-none" name="keyboard_arrow_down" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

/**
 * Glass and widths are a menu's (`MENU_WIDTHS`), and the list opens under the trigger, as a menu
 * does. `width` is `fit` by default: a trigger is only as wide as its value unless it is sized, and a
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
            "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 rounded-lg shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 animate-none! bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 relative isolate z-50 max-h-(--available-height) origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none",
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

const LABEL = "text-muted-foreground px-1.5 py-1 text-xs"

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
        "focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 items-center gap-2">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />}
      >
        <Icon className="pointer-events-none" name="check" />
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
      className={cn("bg-border -mx-1 my-1 h-px pointer-events-none", className)}
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
      className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 top-0 w-full", className)}
      {...props}
    >
      <Icon name="keyboard_arrow_up" />
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
      className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 bottom-0 w-full", className)}
      {...props}
    >
      <Icon name="keyboard_arrow_down" />
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
