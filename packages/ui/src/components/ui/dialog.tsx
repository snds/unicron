// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/mailbird · PR snds/unicron#2 · DSA 17b338c6dfd5 (DialogActions / DialogAction); none (DialogTitle's Back-button layout, hand-raised)
"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "../../lib/utils"

import { Button } from "./button"
import { Icon, type IconName } from "../icon"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50", className)}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-xl p-4 text-sm ring-1 duration-100 sm:max-w-sm fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                // On phones a DialogActions row with a Cancel is the one way out; one × is enough.
                className="absolute top-2 right-2 max-sm:in-[[data-slot=dialog-content]:has([data-kind=cancel])]:hidden"
                size="icon-sm"
              />
            }
          >
            <Icon name="close" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("gap-2 flex flex-col", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      // A leading Back button sits inline with the title (a dialog with steps).
      className={cn("text-base leading-none font-medium has-[>[data-slot=button]]:flex has-[>[data-slot=button]]:items-center has-[>[data-slot=button]]:gap-2", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3", className)}
      {...props}
    />
  )
}

/**
 * A dialog's actions as one row, everywhere. On a phone each action becomes a round 40px
 * icon button (Apple's sheet controls: × to dismiss, ✓ to confirm, a destructive action on
 * the far left), and its words stay as its accessible name. From `sm` up they're the usual
 * text buttons, right-aligned.
 */
function DialogActions({ className, ...props }: React.ComponentProps<"div">) {
  return <DialogFooter className={cn("flex-row items-center justify-end", className)} {...props} />
}

type DialogActionKind = "confirm" | "cancel" | "destructive"
const ACTION: Record<DialogActionKind, { variant: "default" | "outline" | "ghost-destructive"; icon: IconName; className?: string }> = {
  confirm: { variant: "default", icon: "check" },
  cancel: { variant: "outline", icon: "close" },
  // Leads the row, apart from the others; tinted on phones so the icon reads as a control.
  destructive: { variant: "ghost-destructive", icon: "delete", className: "mr-auto max-sm:bg-destructive/10" },
}

/** One action in `DialogActions`. `kind` sets its look and its phone icon; `icon` overrides the icon. */
function DialogAction({
  kind = "confirm",
  icon,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { kind?: DialogActionKind; icon?: IconName }) {
  const a = ACTION[kind]
  return (
    <Button data-kind={kind} variant={a.variant} className={cn("max-sm:size-10 max-sm:rounded-full max-sm:p-0", a.className, className)} {...props}>
      <Icon name={icon ?? a.icon} className="size-5 sm:hidden" />
      <span className="max-sm:sr-only">{children}</span>
    </Button>
  )
}

export {
  Dialog,
  DialogAction,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
