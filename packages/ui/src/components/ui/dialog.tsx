// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/mailbird · PR snds/unicron#2 · DSA 17b338c6dfd5 (DialogActions / DialogAction); none (DialogTitle's Back-button layout, hand-raised)
// Promoted from: snds/mailbird · PR snds/unicron#14 · DSA none (DialogContent size and scrolling: ~20 width overrides, hand-raised in Mailbird ADR-0059)
// Promoted from: Seeded in snds/unicron (2026-11 design direction, drawn dialogs on the app pages: Lockdown D05 and D09, Vale D02 and D08; sizes by name from the cross-app decisions §14; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "../../lib/utils"
import { useFocusFirstControl } from "../../lib/focus"

import { Button } from "./button"
import { DIALOG_SIZES, dialogSizeName, useFittedSize, type DialogSize } from "./dialog-size"
import { FloatButton } from "./float-button"
import { Icon, type IconName } from "../icon"

function Dialog({
  closeOnOutsideClick = true,
  disablePointerDismissal,
  ...props
}: DialogPrimitive.Root.Props & {
  /**
   * Close when someone clicks or taps outside the dialog: on the backdrop, or anywhere else when
   * there is none. On by default. Turn it off where a stray click would lose something: a form
   * with unsaved work. Escape and the close button still close it, so give such a dialog a
   * visible Cancel. Base UI's `disablePointerDismissal`, if passed, wins.
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

/** The dim behind a dialog: --surface-scrim at --c-scrim-dialog (60% on graphite, the role's own 64% on stone). Never opaque, never blurred. */
function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 scrim-dialog duration-(--motion-fast) ease-(--motion-ease) fixed inset-0 isolate z-50", className)}
      {...props}
    />
  )
}

// The sizes by name, and the rule that makes a size `full` when the space is too narrow for it,
// live in ./dialog-size (shared with the security review frame).
export { dialogSizeName, type DialogLegacySize, type DialogSize, type DialogSizeName } from "./dialog-size"

/** What DialogContent tells its parts: the header keeps clear of the close button only when there is one. */
const DialogContentContext = React.createContext<{ showCloseButton: boolean }>({ showCloseButton: false })

function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeLabel = "Close",
  beforeContent,
  container,
  size = "form",
  initialFocus,
  notice,
  ref,
  ...props
}: DialogPrimitive.Popup.Props & {
  /** The close button at the top right: a neutral FloatButton with the `close` glyph. On by default. */
  showCloseButton?: boolean
  /** The close button's accessible name and tooltip. */
  closeLabel?: string
  /** Its width, by name (DIALOG_SIZES): `form` (640) by default. */
  size?: DialogSize
  /**
   * Rendered in the portal between the backdrop and the popup, so it paints above the
   * backdrop and below the popup. A desktop app puts its window drag strip here
   * (`data-tauri-drag-region`) so the window still moves while the dialog is open. A press
   * on it does not dismiss the dialog: only a press on the backdrop does.
   */
  beforeContent?: React.ReactNode
  /** Where the portal goes: `<body>` by default. A shadow root or an extension's own frame passes its own. */
  container?: DialogPrimitive.Portal.Props["container"]
  /**
   * A line across the top of the dialog, above its header, that does not scroll: the compact
   * needs-you line (`<NeedsYou size="compact" />`) when something with a time limit arrives while
   * the dialog is open (Lockdown LA8, contract 5.1c C19). The close button moves down under it.
   */
  notice?: React.ReactNode
}) {
  const asked = dialogSizeName(size)
  const [popup, setPopup] = React.useState<HTMLElement | null>(null)
  const name = useFittedSize(asked, popup, container)
  const popupRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setPopup(node)
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )
  const context = React.useMemo(() => ({ showCloseButton }), [showCloseButton])
  const scroll = React.useRef<HTMLDivElement>(null)
  const focusFirst = useFocusFirstControl(scroll, "dialog-content")
  return (
    <DialogPortal container={container}>
      <DialogOverlay />
      {beforeContent}
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="dialog-content"
        data-size={name}
        // The size it was asked for, when the space is too narrow for it and it draws `full` instead.
        data-size-asked={name === asked ? undefined : asked}
        initialFocus={initialFocus ?? focusFirst}
        className={cn(
          // Solid and square: the raised surface, no shadow, no blur. Centred in the area below
          // --c-dialog-titlebar-inset (0px by default), so an app's title bar strip never overlaps it.
          "bg-surface-raised text-text-body type-body fixed top-[calc(50%+var(--c-dialog-titlebar-inset)/2)] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded outline-none",
          // A percentage of a fixed box is of the screen it is fixed to (or a host's frame), and unlike
          // 100dvh it never runs past a home-screen app's real height.
          "max-h-[calc(100%-2*var(--c-dialog-margin)-var(--c-dialog-titlebar-inset))]",
          // As wide as its content, between the size's min and max, never wider than the screen less the margin.
          "w-max min-w-[min(var(--dialog-min-width),calc(100%-2*var(--c-dialog-margin)))] max-w-[min(var(--dialog-max-width),calc(100%-2*var(--c-dialog-margin)))]",
          // Fades in place: no zoom, no slide.
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-(--motion-fast) ease-(--motion-ease)",
          DIALOG_SIZES[name],
          className
        )}
        {...props}
      >
        {notice ? (
          <div data-slot="dialog-notice" className="flex shrink-0 flex-col">
            {notice}
          </div>
        ) : null}
        <DialogContentContext.Provider value={context}>
          {/* The content scrolls here, inside the rule, so nothing that scrolls covers the edge. */}
          <div
            ref={scroll}
            data-slot="dialog-scroll"
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-(--c-dialog-padding) pt-(--c-dialog-padding-top)"
          >
            {children}
          </div>
        </DialogContentContext.Provider>
        {/* The 1px rule, drawn over the content so a sticky footer or a full-bleed child never covers it. */}
        <span aria-hidden data-slot="dialog-rule" className="rule-box pointer-events-none absolute inset-0 rounded" />
        {showCloseButton && (
          // Last in the tab order, so focus starts in the content; drawn at the header's top right,
          // centred on the overline and title (16 + 4).
          <span
            data-slot="dialog-close-anchor"
            className={cn("absolute right-4 flex", notice ? "top-[calc(var(--size-control)+var(--spacing)*5)]" : "top-5")}
          >
            <DialogPrimitive.Close data-slot="dialog-close" render={<FloatButton label={closeLabel} icon="close" />} />
          </span>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

/**
 * The top of a dialog: a `DialogOverline` (what the thing is), a `DialogTitle` in the lead role,
 * and an optional `DialogDescription`. It keeps clear of the close button.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  const { showCloseButton } = React.useContext(DialogContentContext)
  return (
    <div
      data-slot="dialog-header"
      data-close={showCloseButton ? "" : undefined}
      className={cn("flex min-w-0 flex-col gap-1", showCloseButton && "pr-12", className)}
      {...props}
    />
  )
}

/** The mono caps line above a dialog's title: the thing it is about (`NEW LOGIN // PERSONAL VAULT`). */
function DialogOverline({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="dialog-overline" className={cn("type-overline text-text-label", className)} {...props} />
}

/** What the dialog holds, between its header and its footer: fields, rows, a sentence. */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-body" className={cn("flex min-w-0 flex-col gap-4", className)} {...props} />
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
   * never scroll out of view. Off by default. The footer is then opaque, reaches the dialog's
   * edges, and a hairline above it shows that the content runs on under it.
   */
  sticky?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      data-sticky={sticky || undefined}
      className={cn(
        // The actions at the right, the one primary last, 16 apart (as drawn).
        "flex flex-wrap items-center justify-end gap-4",
        // Pinned over the dialog's bottom padding: reaches out by --c-dialog-padding on three
        // sides and pads back by it, and eats the gap above it, so its buttons sit where an
        // unpinned footer's do.
        sticky &&
          "bg-surface-raised rule-t sticky -bottom-(--c-dialog-padding) z-10 -mx-(--c-dialog-padding) -mt-(--c-dialog-padding) -mb-(--c-dialog-padding) p-(--c-dialog-padding)",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="secondary" />}>
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
      className={cn("type-lead text-text-body break-words has-[>[data-slot=button]]:flex has-[>[data-slot=button]]:items-center has-[>[data-slot=button]]:gap-2", className)}
      {...props}
    />
  )
}

/**
 * The sentence that describes the dialog to assistive tech. `size="caption"` (the default) is the
 * note Figma draws under a review's rows (Lockdown Desktop / 09: caption role, 13/20, secondary
 * ink). `size="body"` is for a question whose sentence is its whole content, as `ConfirmDialog`
 * and `AdaptiveDialog`'s `description` draw it.
 */
function DialogDescription({
  className,
  size = "caption",
  ...props
}: DialogPrimitive.Description.Props & { size?: "caption" | "body" }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      data-size={size}
      className={cn(
        size === "body" ? "type-body" : "type-caption",
        "text-text-secondary *:[a]:hover:text-text-body *:[a]:underline *:[a]:underline-offset-3",
        className
      )}
      {...props}
    />
  )
}

/**
 * A dialog's actions as one row at the right, the same at every width: each keeps its words, so
 * nothing rides on an icon alone. `DialogFooter` under another name.
 */
function DialogActions({ className, ...props }: React.ComponentProps<typeof DialogFooter>) {
  return <DialogFooter className={className} {...props} />
}

type DialogActionKind = "confirm" | "cancel" | "destructive"
const ACTION: Record<DialogActionKind, { variant: "default" | "secondary" | "ghost-destructive"; lead?: boolean }> = {
  // The one primary of the layer.
  confirm: { variant: "default" },
  // The ink outline.
  cancel: { variant: "secondary" },
  // A destructive side action (report, remove), apart from the others at the start of the row.
  destructive: { variant: "ghost-destructive", lead: true },
}

/**
 * One action in `DialogActions`. `kind` sets its look; `icon` adds a 16px glyph before its words.
 * The words always show.
 */
function DialogAction({
  kind = "confirm",
  icon,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { kind?: DialogActionKind; icon?: IconName }) {
  const a = ACTION[kind]
  return (
    <Button data-kind={kind} variant={a.variant} className={cn(a.lead && "mr-auto", className)} {...props}>
      {icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </Button>
  )
}

export {
  Dialog,
  DialogAction,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogOverline,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
