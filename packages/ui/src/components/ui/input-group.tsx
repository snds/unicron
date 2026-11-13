// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:48 "Text Field" box with its 8px gap for slots; no app PR, no DSA record)
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

import { Input as InputPrimitive } from "@base-ui/react/input"

import { Button } from "./button"
import { fieldTextOnTouch, fieldBoxVariants } from "./input"

/**
 * A field with add-ons: the Text Field's box (Figma 32:48) holding the control and, before or
 * after it, an icon, a word or a small button, 8px apart. The box takes the 2px focus border
 * while anything in it has focus, and the critical one while its control is invalid.
 */
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        fieldBoxVariants({ focus: "within" }),
        "group/input-group relative flex min-h-control w-full min-w-0 items-center has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:flex-col has-[>textarea]:items-stretch",
        // Beside an add-on the control keeps the 8px gap, not the box's 16px.
        "has-[>[data-align=inline-start]]:*:data-[slot=input-group-control]:pl-2 has-[>[data-align=inline-end]]:*:data-[slot=input-group-control]:pr-2",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "type-ui flex cursor-text items-center justify-center gap-2 text-support-foreground select-none group-has-[[data-slot=input-group-control]:disabled]/input-group:opacity-50 [&>svg:not([class*='size-'])]:size-5",
  {
    variants: {
      align: {
        // A button in the slot sits 8px from the box's edge, so its own padding lines up.
        "inline-start": "order-first pl-4 has-[>button]:pl-2",
        "inline-end": "order-last pr-4 has-[>button]:pr-2",
        "block-start": "order-first w-full justify-start px-4 pt-3",
        "block-end": "order-last w-full justify-start px-4 pb-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus()
      }}
      {...props}
    />
  )
}

// Older sizes map onto Button's own: a word is S (32), an icon is the 32px square. The box is 48.
const BUTTON_SIZES = { xs: "sm", sm: "sm", "icon-xs": "icon-sm", "icon-sm": "icon-sm" } as const

function InputGroupButton({
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> & {
  size?: keyof typeof BUTTON_SIZES | null
  type?: "button" | "submit" | "reset"
}) {
  return <Button type={type} data-size={size} variant={variant} size={BUTTON_SIZES[size ?? "xs"]} {...props} />
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("type-ui flex items-center gap-2 text-support-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5", className)}
      {...props}
    />
  )
}

// The control inside the box has no box of its own. It runs the box's full height, so a click
// anywhere in it lands in the field, and takes the box's 16px in from the sides itself.
const CONTROL =
  fieldTextOnTouch + " " + "min-w-0 flex-1 self-stretch bg-transparent px-4 type-ui text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed aria-disabled:cursor-not-allowed"

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return <InputPrimitive data-slot="input-group-control" className={cn(CONTROL, "h-auto min-h-control", className)} {...props} />
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="input-group-control" className={cn(CONTROL, "field-sizing-content resize-none py-3", className)} {...props} />
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
