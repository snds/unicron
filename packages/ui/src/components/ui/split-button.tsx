// Owned component (not generated): a primary action and, joined to it, a chevron that opens its other forms; the pair counts as one primary.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.1b #36: Vale's SEND with its Send later half; no Figma frame; no app PR, no DSA record)
"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

import { Icon } from "../icon"
import { Button, type ButtonProps } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./dropdown-menu"

export type SplitButtonProps = Omit<ButtonProps, "children" | "render"> & {
  /** The action's word ("Send"). */
  children: React.ReactNode
  /** The chevron's name: what its menu holds ("Send later"). */
  menuLabel: string
  /** The menu's items (`DropdownMenuItem`s). The menu opens under the pair, aligned to its end. */
  menu: React.ReactNode
  /** Props for the menu's content: width, side, align. */
  menuProps?: Omit<React.ComponentProps<typeof DropdownMenuContent>, "children">
  /** Disable only the chevron (the action stays). `disabled` disables both. */
  menuDisabled?: boolean
}

/**
 * SplitButton: the screen's one primary action with a joined half that opens its other forms
 * (SEND, and Send later). The pair counts as one primary (rules 2.5): the same fill, side by side,
 * 1px of the surface between them. The action keeps every Button prop (`loading`,
 * `disabledReason`, `size`); the chevron is a square of the same height with its own name.
 */
function SplitButton({
  children,
  menuLabel,
  menu,
  menuProps,
  menuDisabled,
  variant = "default",
  size = "default",
  disabled,
  loading,
  disabledReason,
  className,
  ...props
}: SplitButtonProps) {
  const square = size === "sm" || size === "xs" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon"
  return (
    <div
      data-slot="split-button"
      role="group"
      // The inner corners square off; the two halves sit 1px apart, on the surface.
      className={cn("inline-flex items-start gap-px [&>:last-child]:rounded-l-none [&_[data-slot=split-button-action]_[data-slot=button]]:rounded-r-none", className)}
    >
      <span data-slot="split-button-action" className="inline-flex">
        <Button variant={variant} size={size} disabled={disabled} loading={loading} disabledReason={disabledReason} {...props}>
          {children}
        </Button>
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="split-button-menu"
          disabled={disabled || menuDisabled || loading}
          render={<Button variant={variant} size={square} aria-label={menuLabel} />}
        >
          <Icon name="chevron--down" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" {...menuProps}>
          {menu}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export { SplitButton }
