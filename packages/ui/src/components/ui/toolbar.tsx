// Owned component (not generated): a row of ghost icon buttons, toggles and separators, one Tab stop with arrow keys between them.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.1b #35: Vale message, format and note actions, Warpcore's editor toolbar, Synapse; no Figma frame; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"
import { cn } from "../../lib/utils"

import { Icon, type IconName } from "../icon"
import { IconButton } from "../icon-button"
import { Button } from "./button"
import { Toggle } from "./toggle"

type ToolbarSize = "sm" | "default"

const ToolbarSizeContext = React.createContext<ToolbarSize>("sm")

/**
 * Toolbar: actions on one thing (a message, a note, a format bar), as ghost buttons in a row, with
 * hairline separators between groups. It is one stop in the tab order; the arrow keys move along
 * it, Home and End jump to its ends (WAI-ARIA toolbar). Name it with `aria-label`.
 * `size`: `sm` (default) is the 32px square of Button S, for a meta line or a row; `default` is 40.
 */
function Toolbar({
  className,
  size = "sm",
  orientation = "horizontal",
  ...props
}: ToolbarPrimitive.Root.Props & { size?: ToolbarSize }) {
  return (
    <ToolbarSizeContext.Provider value={size}>
      <ToolbarPrimitive.Root
        data-slot="toolbar"
        data-size={size}
        orientation={orientation}
        className={cn("flex w-fit items-center gap-1 data-[orientation=vertical]:flex-col", className)}
        {...props}
      />
    </ToolbarSizeContext.Provider>
  )
}

/** Buttons that belong together, between separators. */
function ToolbarGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      className={cn("flex items-center gap-1 group-data-[orientation=vertical]:flex-col", className)}
      {...props}
    />
  )
}

/** A hairline between groups: 20px of the 1px rule, 4px clear of the buttons either side. */
function ToolbarSeparator({ className, orientation, ...props }: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-line-rule data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-5 data-[orientation=vertical]:w-px data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-5",
        className
      )}
      {...props}
    />
  )
}

type ToolbarItemProps = Omit<React.ComponentProps<"button">, "children"> & {
  /** What it does, in a few words: the accessible name, and the tooltip of an icon-only button. */
  label: string
  /** An icon-only button. Without one, the label is the button's visible word. */
  icon?: IconName
  /** Keyboard shortcut shown in the tooltip. */
  shortcut?: string
}

/**
 * One action. With `icon` it is an icon-only ghost button with its label as name and tooltip (as
 * IconButton); without, the label is its word, in the overline. To open a menu, pass it as the
 * menu trigger's `render`.
 */
function ToolbarButton({ label, icon, shortcut, disabled, className, ...props }: ToolbarItemProps) {
  const size = React.useContext(ToolbarSizeContext)
  if (!icon) {
    return (
      <ToolbarPrimitive.Button
        data-slot="toolbar-button"
        disabled={disabled}
        className={className}
        render={<Button variant="ghost" size={size === "sm" ? "sm" : "default"} />}
        {...props}
      >
        {label}
      </ToolbarPrimitive.Button>
    )
  }
  return (
    <IconButton
      label={label}
      shortcut={shortcut}
      disabled={disabled}
      className={className}
      render={<ToolbarPrimitive.Button data-slot="toolbar-button" render={<Button variant="ghost" size={size === "sm" ? "icon-sm" : "icon"} />} />}
      {...props}
    >
      <Icon name={icon} />
    </IconButton>
  )
}

type ToolbarToggleProps = Omit<ToolbarItemProps, "onClick"> & {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

/**
 * An action that stays on (Bold, Snooze in the Snoozed lane, a pen among the sketch tools):
 * `aria-pressed`, drawn in inverted ink while on, as Toggle.
 */
function ToolbarToggle({ label, icon, shortcut, disabled, className, pressed, defaultPressed, onPressedChange, ...props }: ToolbarToggleProps) {
  const size = React.useContext(ToolbarSizeContext)
  const toggle = (
    <Toggle size={size === "sm" ? "sm" : "default"} pressed={pressed} defaultPressed={defaultPressed} onPressedChange={(next) => onPressedChange?.(next)} />
  )
  if (!icon) {
    return (
      <ToolbarPrimitive.Button data-slot="toolbar-toggle" disabled={disabled} className={className} render={toggle} {...props}>
        {label}
      </ToolbarPrimitive.Button>
    )
  }
  return (
    <IconButton
      label={label}
      shortcut={shortcut}
      disabled={disabled}
      className={className}
      render={<ToolbarPrimitive.Button data-slot="toolbar-toggle" render={toggle} />}
      {...props}
    >
      <Icon name={icon} />
    </IconButton>
  )
}

export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator, ToolbarToggle, type ToolbarSize }
