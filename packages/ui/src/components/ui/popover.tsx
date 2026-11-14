// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/warpcore · PR snds/unicron#65 · DSA none
// Promoted from: Seeded in snds/unicron (2026-11 design direction: solid and square, PopoverHeader from the cross-app merge, contract §5.1b row 18; no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "../../lib/utils"

import { FloatButton } from "./float-button"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

/**
 * Solid and square, like every overlay: the raised surface, a 1px rule, the 2px corner, no shadow
 * and no blur. `--c-popover-width` sets its width; it never outgrows the space on screen, and
 * scrolls when it is taller than that space. `scrim` dims the page behind it with the menu scrim
 * (--c-scrim-menu, 32%): an environment picker, a quick create.
 */
const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

/**
 * Where focus starts when a popover opens: its first control that is not the header's close
 * button, else the popover itself. So a picker starts on what it picks, and opening a popover
 * never lands on (and shows the tooltip of) its close button.
 */
function firstControl(inner: HTMLElement | null): HTMLElement | null {
  if (!inner) return null
  const all = Array.from(inner.querySelectorAll<HTMLElement>(TABBABLE))
  return (
    all.find((el) => !el.closest('[data-slot="popover-header"] [data-slot="popover-close"], [data-slot="popover-header"] [data-slot="float-button"]')) ??
    inner.closest<HTMLElement>('[data-slot="popover-content"]')
  )
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  scrim = false,
  container,
  initialFocus,
  children,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    /** Dim the page behind with the menu scrim. Off by default. */
    scrim?: boolean
    /** Where the portal goes: `<body>` by default. */
    container?: PopoverPrimitive.Portal.Props["container"]
  }) {
  // A box around the children that takes no layout (`contents`), so the popup's own ref stays the
  // caller's and focus can still find the first control inside.
  const inner = React.useRef<HTMLDivElement>(null)
  return (
    <PopoverPrimitive.Portal container={container}>
      {scrim ? (
        <PopoverPrimitive.Backdrop
          data-slot="popover-scrim"
          className="scrim-menu fixed inset-0 z-50 transition-opacity duration-(--motion-fast) data-ending-style:opacity-0 data-starting-style:opacity-0"
        />
      ) : null}
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          initialFocus={initialFocus ?? (() => firstControl(inner.current))}
          className={cn(
            "bg-surface-raised text-text-body type-body rule-box flex flex-col gap-4 rounded p-4 outline-hidden",
            "w-(--c-popover-width) max-w-(--available-width) max-h-(--available-height) overflow-y-auto origin-(--transform-origin) z-50",
            // Fades and moves 8px off its anchor: no zoom.
            "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 duration-(--motion-fast) ease-(--motion-ease)",
            className
          )}
          {...props}
        >
          <div ref={inner} data-slot="popover-inner" className="contents">
            {children}
          </div>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

/**
 * The top of a popover (contract §5.1b row 18): an overline, a title and a close button, the
 * dialog's header at a popover's size. Give it `overline` and `title`, or compose it from
 * `PopoverTitle` and `PopoverDescription` as children. The close is a neutral FloatButton M (44),
 * as tall as the overline and the subtitle-role title together; `showCloseButton={false}` drops it.
 */
function PopoverHeader({
  className,
  overline,
  title,
  showCloseButton = true,
  closeLabel = "Close",
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  /** The mono caps line above the title (`WHO ANSWERS // 03`). */
  overline?: React.ReactNode
  /** The title. It names the popover for assistive tech. */
  title?: React.ReactNode
  /** The close button at the right. On by default. */
  showCloseButton?: boolean
  /** The close button's accessible name and tooltip. */
  closeLabel?: string
}) {
  return (
    <div data-slot="popover-header" className={cn("flex items-center gap-3", className)} {...props}>
      <div className="flex min-w-0 flex-1 flex-col">
        {overline ? <p data-slot="popover-overline" className="type-overline text-text-label">{overline}</p> : null}
        {title ? <PopoverTitle>{title}</PopoverTitle> : null}
        {children}
      </div>
      {showCloseButton ? (
        <PopoverPrimitive.Close data-slot="popover-close" render={<FloatButton label={closeLabel} icon="close" />} />
      ) : null}
    </div>
  )
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("type-subtitle text-text-body break-words", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("type-caption text-text-secondary", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
