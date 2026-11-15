// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: Figma 32:48's Text Field box; no app PR, no DSA record)
import * as React from "react"
import { cn } from "../../lib/utils"

import { Icon } from "../icon"
import { fieldBoxVariants } from "./input"

// The Text Field's box (Figma 32:48), with room on the right for the chevron. Under the pointer it
// takes the 6% hover wash laid on its fill, so it stays opaque. `sm` is 40, for a row; on a coarse
// pointer it is the 44px touch minimum (contract 6.6), since a select cannot carry a hit-area
// pseudo-element.
const SELECT = cn(
  fieldBoxVariants(),
  "h-control w-full min-w-0 appearance-none pr-11 pl-4 select-none hover:bg-[color-mix(in_oklab,var(--text-body)_6%,var(--surface-raised))] data-[size=sm]:h-10 data-[size=sm]:pr-9 data-[size=sm]:pl-3 data-[size=sm]:pointer-coarse:h-touch-min"
)

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}

function NativeSelect({
  className,
  size = "default",
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative w-fit",
        className
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={SELECT}
        {...props}
      />
      <Icon
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-support-foreground select-none group-data-[size=sm]/native-select:right-3 group-has-[select:disabled]/native-select:opacity-50"
        aria-hidden="true"
        data-slot="native-select-icon"
        name="chevron--down"
        size={size === "sm" ? "sm" : "md"}
      />
    </div>
  )
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
