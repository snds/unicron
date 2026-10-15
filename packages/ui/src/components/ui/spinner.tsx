// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
import { cn } from "../../lib/utils"

import { Icon, type IconProps } from "../icon"

function Spinner({ className, ...props }: Omit<IconProps, "name">) {
  return (
    <Icon data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props} name="progress_activity" />
  )
}

export { Spinner }
