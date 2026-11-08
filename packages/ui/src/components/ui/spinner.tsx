// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
import { cn } from "../../lib/utils"

import { Icon, type IconProps } from "../icon"

/**
 * Busy. Turns once per --motion-spin. With prefers-reduced-motion it stays still at reduced
 * opacity (@unicron/ui's styles), so it still reads as busy without moving.
 */
function Spinner({ className, label = "Loading", ...props }: Omit<IconProps, "name">) {
  return (
    <Icon data-slot="spinner"
      role="status"
      label={label}
      className={cn("size-4 animate-spin", className)}
      {...props} name="progress_activity" />
  )
}

export { Spinner }
