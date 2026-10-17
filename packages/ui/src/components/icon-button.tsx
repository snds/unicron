// Promoted from: snds/mailbird · PR snds/unicron#2 · DSA 503c2fad12b5, b6400588fc4c
import * as React from "react"
import type { VariantProps } from "class-variance-authority"

import { Icon, type IconName } from "./icon"
import { Button, type buttonVariants } from "./ui/button"
import { Kbd } from "./ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

// Pass-through props land on the trigger, which merges them into whatever renders.
export type IconButtonProps = Omit<React.ComponentProps<typeof TooltipTrigger>, "children" | "render"> &
  Pick<VariantProps<typeof buttonVariants>, "variant" | "size"> & {
  /** What the button does, in a few words. It is both the accessible name and the tooltip. */
  label: string
  /** The glyph. Omit it and pass children instead to size or tint the icon yourself. */
  icon?: IconName
  /** Fill the glyph (an on state: pinned, flagged). */
  fill?: boolean
  /** Longer tooltip text, when the label alone undersells the action. Defaults to `label`. */
  tooltip?: React.ReactNode
  /** Keyboard shortcut shown in the tooltip, e.g. "E" or "⌘⇧L". */
  shortcut?: string
  /**
   * The control to render, Base UI style. Defaults to a ghost icon `Button`. Pass a
   * `Toggle` for an on/off tool, or nest this inside `DropdownMenuTrigger render={…}` to
   * open a menu: props and ref pass through to whatever renders.
   */
  render?: React.ReactElement
  children?: React.ReactNode
}

/**
 * An icon-only control with its label said twice: to assistive tech (aria-label) and to
 * sighted pointer users (tooltip), from one prop, so the two never drift apart and no icon
 * button ships without a name.
 */
export function IconButton({
  label,
  icon,
  fill,
  tooltip,
  shortcut,
  render,
  variant = "ghost",
  size = "icon",
  children,
  disabled,
  ...props
}: IconButtonProps) {
  // TooltipTrigger's own `disabled` only stops the tooltip opening; it never reaches the element.
  // So the control gets it through `render`, and the tooltip stays shut while it is disabled.
  const control = render
    ? React.cloneElement(render as React.ReactElement<{ disabled?: boolean }>, { disabled })
    : <Button variant={variant} size={size} disabled={disabled} />
  return (
    <Tooltip>
      <TooltipTrigger aria-label={label} render={control} disabled={disabled} {...props}>
        {children ?? (icon && <Icon name={icon} fill={fill} />)}
      </TooltipTrigger>
      <TooltipContent>
        {tooltip ?? label}
        {shortcut && <Kbd className="ml-1">{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}
