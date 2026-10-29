// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/mailbird · PR snds/unicron#2 · DSA 17b338c6dfd5 (DialogActions / DialogAction); none (DialogTitle's Back-button layout, hand-raised)
// Promoted from: snds/mailbird · PR snds/unicron#14 · DSA none (DialogContent size and scrolling: ~20 width overrides, hand-raised in Mailbird ADR-0059)
"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "../../lib/utils"

import { Button } from "./button"
import { Icon, type IconName } from "../icon"

function Dialog({
  closeOnOutsideClick = true,
  disablePointerDismissal,
  ...props
}: DialogPrimitive.Root.Props & {
  /**
   * Close when someone clicks or taps outside the dialog: on the backdrop, or anywhere else when
   * there is none. On by default. Turn it off where a stray click would lose something: a
   * destructive confirmation, or a form with unsaved work. Escape and the close button still
   * close it, so give such a dialog a visible Cancel. Base UI's `disablePointerDismissal`, if
   * passed, wins.
   */
  closeOnOutsideClick?: boolean
}) {
  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      disablePointerDismissal={disablePointerDismissal ?? !closeOnOutsideClick}
      {...props}
    />
  )
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
      className={cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-(--motion-fast) ease-(--motion-ease) supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50", className)}
      {...props}
    />
  )
}

/**
 * How wide the dialog is from `sm` up (on phones it's the screen less 1rem each side). Each size
 * is a range: the dialog fits its content, never narrower than the size's min width and never
 * wider than its max width (`--c-dialog-<size>-min-width` / `-max-width`). Short content sits at
 * the min; a long line, a table or a wide field pushes it out to the max, then wraps. Neither
 * ever exceeds the screen less 1rem each side.
 *
 * | size  | min    | max    | job        |
 * |-------|--------|--------|------------|
 * | `xs`  | 16rem  | 20rem  | very narrow; see the rule below |
 * | `sm`  | 24rem  | 28rem  | a question |
 * | `md`  | 28rem  | 36rem  | a short form |
 * | `lg`  | 32rem  | 42rem  | settings   |
 * | `xl`  | 42rem  | 56rem  | a composer |
 * | `2xl` | 48rem  | 64rem  | a preview  |
 *
 * Each min is the fixed width the size had up to 0.15 (Tailwind's `max-w-sm`, `-md`, `-lg`,
 * `-2xl`, `-3xl`), so no dialog got narrower when the ranges arrived.
 *
 * `xs` is the one narrow size, and it has a rule. Use it only when all of these hold: at most one
 * short sentence; at most two actions, each one word; at most one short field (a PIN, a 6-digit
 * code); nothing that can't wrap (a file name, an email address, a path, a table). Anything else
 * takes `sm` or wider. docs/03-components.md (Dialog widths) has the same rule.
 */
const DIALOG_SIZES = {
  xs: "sm:[--dialog-min-width:var(--c-dialog-xs-min-width)] sm:[--dialog-max-width:var(--c-dialog-xs-max-width)]",
  sm: "sm:[--dialog-min-width:var(--c-dialog-sm-min-width)] sm:[--dialog-max-width:var(--c-dialog-sm-max-width)]",
  md: "sm:[--dialog-min-width:var(--c-dialog-md-min-width)] sm:[--dialog-max-width:var(--c-dialog-md-max-width)]",
  lg: "sm:[--dialog-min-width:var(--c-dialog-lg-min-width)] sm:[--dialog-max-width:var(--c-dialog-lg-max-width)]",
  xl: "sm:[--dialog-min-width:var(--c-dialog-xl-min-width)] sm:[--dialog-max-width:var(--c-dialog-xl-max-width)]",
  "2xl": "sm:[--dialog-min-width:var(--c-dialog-2xl-min-width)] sm:[--dialog-max-width:var(--c-dialog-2xl-max-width)]",
} as const

export type DialogSize = keyof typeof DIALOG_SIZES

function DialogContent({
  className,
  children,
  showCloseButton = true,
  beforeContent,
  size = "sm",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  size?: DialogSize
  /**
   * Rendered in the portal between the backdrop and the popup, so it paints above the
   * backdrop and below the popup. A desktop app puts its window drag strip here
   * (`data-tauri-drag-region`) so the window still moves while the dialog is open. A press
   * on it does not dismiss the dialog: only a press on the backdrop does.
   */
  beforeContent?: React.ReactNode
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      {beforeContent}
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        data-size={size}
        className={cn(
          // Centred in the area below --c-dialog-titlebar-inset (0px by default), so an app's
          // title bar strip never overlaps the popup. A dialog taller than that area scrolls
          // inside itself instead of running off it.
          "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-h-[calc(100dvh-2rem-var(--c-dialog-titlebar-inset))] max-w-[calc(100%-2rem)] gap-4 overflow-y-auto rounded-xl p-4 text-sm ring-1 duration-(--motion-fast) ease-(--motion-ease) fixed top-[calc(50%+var(--c-dialog-titlebar-inset)/2)] left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none",
          // From sm up: as wide as its content, between the size's min and max (DIALOG_SIZES).
          "sm:w-max sm:min-w-[min(var(--dialog-min-width),calc(100%-2rem))] sm:max-w-[min(var(--dialog-max-width),calc(100%-2rem))]",
          DIALOG_SIZES[size],
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
  sticky = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
  /**
   * Keep the footer pinned to the bottom of the dialog while its content scrolls, so the actions
   * never scroll out of view. Off by default. The footer is then opaque, so content scrolls under
   * it, not through it.
   */
  sticky?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      data-sticky={sticky || undefined}
      className={cn(
        "bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        // Pinned to the popup's bottom edge, over its 1rem padding (a sticky box stops at the
        // padding otherwise, and content would show under it). The popover colour sits under the
        // muted tint, so nothing shows through.
        sticky && "sticky -bottom-4 z-10 bg-popover bg-linear-to-r from-muted/50 to-muted/50",
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
      className={cn("text-support-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3", className)}
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
function DialogActions({ className, ...props }: React.ComponentProps<typeof DialogFooter>) {
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
