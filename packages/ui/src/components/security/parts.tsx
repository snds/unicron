// Owned component (not generated): the security set's own three looks beside the shared parts: the
// Field Row look (Figma 15:512, data-b's FieldRow), a text action in the overline role (Field Row's
// bare "Copy"), and the review frame (Sheet Header 32:122 on a phone, the dialog of Lockdown's
// Desktop / 09 wider; overlays' Sheet and AdaptiveDialog). They read the shared parts' own knobs
// and rules (the Field Row's label column, the Dialog's sizes, margin and `full` rule, the
// adaptive layers' width class), so they cannot drift from them; what the shared parts still lack
// for a full swap is listed on each part. Internal: not exported from the package root.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:512, 32:122; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "../../lib/utils"
import { formatCountdown } from "../../lib/format"
import { Icon, type IconName } from "../icon"
import { useViewport } from "../use-viewport"
import { useFittedSize } from "../ui/dialog-size"
import { FloatButton } from "../ui/float-button"
import { Spinner } from "../ui/spinner"

// ── Words for time ────────────────────────────────────────────────────────────────────────────

/** A countdown in the cross-app words (decisions §13): `NN S` under a minute, `MM:SS` from it. One home: lib/format. */
export { formatCountdown }

// ── Text action ───────────────────────────────────────────────────────────────────────────────

export type TextActionTone = "body" | "live" | "critical"

const ACTION_TONE: Record<TextActionTone, string> = {
  body: "text-text-body",
  // Field Row's Display size draws its action in the live colour (contract §9.9).
  live: "text-secondary-live",
  critical: "text-critical-text",
}

export type TextActionProps = Omit<ButtonPrimitive.Props, "className"> & {
  tone?: TextActionTone
  /** A 16px glyph before the word (the lock on a gated action). */
  icon?: IconName
  /** Waiting on something (a gate): a spinner takes the glyph's place and the word stays. */
  busy?: boolean
  className?: string
}

/**
 * A word in the overline role that does one thing: Field Row's bare action ("Copy", "Open"). No
 * box at rest, so it lines up with the row's edge; the wash reaches a step past the word under the
 * pointer (contract §6.1); the stylesheet's ring shows focus; under 44px it takes `hit-area`.
 * Becomes the shared FieldRow's `action` when that lands.
 */
export const TextAction = React.forwardRef<HTMLButtonElement, TextActionProps>(function TextAction(
  { tone = "body", icon, busy = false, className, children, ...props },
  ref
) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="text-action"
      className={cn(
        // The word gives the action its baseline. With `items-center` and a glyph first, the box
        // took its baseline from the glyph's bottom edge, so "Show" and "Copy" sat 4px above the
        // label and value they share a row with, and the row grew a pixel. The glyph and the
        // spinner centre themselves and stay out of the baseline.
        "type-overline hit-area -mx-1 inline-flex shrink-0 items-baseline gap-1 rounded px-1 whitespace-nowrap select-none [&>[data-slot=spinner]]:self-center [&>svg]:self-center",
        "transition-[background-color,color] duration-(--motion-fast) hover:bg-state-hover active:bg-state-pressed",
        "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        ACTION_TONE[tone],
        className
      )}
      {...props}
    >
      {busy ? <Spinner /> : icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </ButtonPrimitive>
  )
})

// ── Field Row look ────────────────────────────────────────────────────────────────────────────

/**
 * Field Row's three sizes (Figma 15:512): `default` (label column, value, action on one baseline;
 * 52 tall), `stacked` (label over value, action centred; 64 tall, for phones) and `display` (the
 * value in a display role; 64 tall). `auto` is `default` in a container 32rem wide or more and
 * `stacked` below it, so a row in a phone column stacks by itself and the same row in a desktop
 * pane does not.
 */
export type RowSize = "auto" | "default" | "stacked" | "display" | "display-auto"

/** The classes of the row's parts for a size. The row is its own container, so `auto` reads its own width. */
export function rowClasses(size: RowSize) {
  const auto = size === "auto"
  const displayAuto = size === "display-auto"
  const stacked = size === "stacked"
  const display = size === "display" || displayAuto
  return {
    // The rule is drawn on top, inside the box: it adds no height (contract §1.6).
    root: "@container/row rule-t",
    inner: cn(
      "flex min-w-0 gap-4",
      stacked && "items-center py-3",
      size === "default" && "items-baseline py-4",
      display && "items-baseline py-3",
      auto && "items-baseline py-4 @max-lg/row:items-center @max-lg/row:py-3",
      displayAuto && "@max-lg/row:items-center"
    ),
    // Default and Display: the label sits in a fixed column, on the value's baseline. Stacked: the
    // label and the value share a column, 4 apart.
    body: cn(
      "flex min-w-0 flex-1",
      stacked ? "flex-col gap-1" : "items-baseline gap-4",
      auto && "@max-lg/row:flex-col @max-lg/row:items-stretch @max-lg/row:gap-1",
      displayAuto && "@max-lg/row:flex-col @max-lg/row:items-stretch @max-lg/row:gap-1"
    ),
    label: cn(
      "type-overline text-text-label",
      // The shared Field Row's own label column (140): one knob for every row that draws the look.
      stacked ? "min-w-0" : "w-(--c-field-row-label-width) shrink-0",
      (auto || displayAuto) && "@max-lg/row:w-auto"
    ),
    actions: "flex shrink-0 items-baseline gap-4",
  }
}

// ── Review frame ──────────────────────────────────────────────────────────────────────────────

export type ReviewSize = "question" | "review" | "viewer"

/**
 * The dialog form's width: the shared Dialog's own size (its `--c-dialog-<size>-min-width` knob:
 * question 480, review 560, viewer 960), never wider than the screen less --c-dialog-margin on
 * each side (48 in all, contract 5.1c C10). One set of knobs for every dialog: the review frame
 * had its own widths and a 32px cap, and had drifted from the shared Dialog.
 */
const WIDTH: Record<ReviewSize, string> = {
  question: "data-[form=dialog]:w-[min(var(--c-dialog-question-min-width),calc(100%-2*var(--c-dialog-margin)))]",
  review: "data-[form=dialog]:w-[min(var(--c-dialog-review-min-width),calc(100%-2*var(--c-dialog-margin)))]",
  viewer: "data-[form=dialog]:w-[min(var(--c-dialog-viewer-min-width),calc(100%-2*var(--c-dialog-margin)))]",
}

export interface ReviewFrameProps extends Omit<DialogPrimitive.Popup.Props, "title" | "className" | "children"> {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Desktop width by name (decisions §14): question 480, review 560, viewer 960. A phone gets a sheet. */
  size?: ReviewSize
  /** A phone shows the frame full screen instead of as a sheet from the bottom (large type). */
  fullscreenOnPhone?: boolean
  /** Mono caps above the title. */
  overline?: React.ReactNode
  /** The frame's accessible name. */
  title: React.ReactNode
  /** Under the header, above the body: a countdown rule. */
  headerAfter?: React.ReactNode
  /** The footer: actions, one primary at most. */
  footer?: React.ReactNode
  /** The close control's name. */
  closeLabel?: string
  /** Draw the close control (default). A gate leaves it out: its Cancel is the way out. */
  showClose?: boolean
  closeRef?: React.Ref<HTMLButtonElement>
  /** Clicks on the scrim close it (Escape and the close control always do). Off by default: these frames hold decisions. */
  closeOnOutsideClick?: boolean
  children?: React.ReactNode
  bodyClassName?: string
}

/**
 * The frame a security decision opens in. It takes the form every adaptive layer takes, at the
 * same width (`useViewport`'s compact class, under 600: it used a CSS breakpoint at 640, so
 * between 600 and 639 it was a full-width sheet while every other layer was a dialog).
 *
 * - Compact: a sheet from the bottom edge: square, `surface-raised` with a hairline on top, the
 *   36 × 4 grabber, Sheet Header's overline, `lead` title and a 48 float button to close, over
 *   the sheet scrim.
 * - Wider: a dialog of the size's width (the shared Dialog's knobs), centred, with a hairline all
 *   round and the dialog scrim, 24 clear of the screen on every side (--c-dialog-margin). Where
 *   the screen is too narrow for the size it draws `full`, the whole screen less the margin both
 *   ways, as the shared Dialog does (`data-size-asked` keeps the name it was given).
 *
 * No blur, no shadow. The form is on the frame as `data-form`, and the parts inside read it
 * (`group-data-[form=dialog]/review:`), so nothing in a review depends on a CSS breakpoint.
 *
 * Still its own frame, not overlays' `AdaptiveDialog`: that one lacks a fixed slot between the
 * header and the scrolling body (the countdown rule), a ref to its close control (large type
 * focuses it first) and a full-screen phone form without the grabber.
 */
export function ReviewFrame({
  open,
  onOpenChange,
  size = "review",
  fullscreenOnPhone = false,
  overline,
  title,
  headerAfter,
  footer,
  closeLabel = "Close",
  showClose = true,
  closeRef,
  closeOnOutsideClick = false,
  children,
  bodyClassName,
  ref,
  ...popupProps
}: ReviewFrameProps) {
  const sheet = useViewport().widthClass === "compact"
  const [popup, setPopup] = React.useState<HTMLElement | null>(null)
  // The frame measures itself, and a part (large type) holds a ref to it too: both get the node.
  const attach = React.useCallback(
    (node: HTMLDivElement | null) => {
      setPopup(node)
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )
  // Below the size's own width the dialog is `full`. A sheet has no size to fit.
  const fitted = useFittedSize(size, sheet ? null : popup, undefined)
  const full = !sheet && fitted === "full"
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => onOpenChange(next)} disablePointerDismissal={!closeOnOutsideClick} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-slot="review-scrim"
          className={cn(
            sheet ? "scrim-sheet" : "scrim-dialog",
            "fixed inset-0 z-50 transition-opacity duration-(--motion-fast) data-ending-style:opacity-0 data-starting-style:opacity-0"
          )}
        />
        <DialogPrimitive.Popup
          ref={attach}
          data-slot="review-frame"
          data-form={sheet ? "sheet" : "dialog"}
          data-size={full ? "full" : size}
          // The size it was asked for, when the screen is too narrow for it and it draws `full`.
          data-size-asked={full ? size : undefined}
          className={cn(
            "group/review bg-surface-raised text-text-body fixed z-50 flex flex-col overflow-hidden outline-none",
            "transition-[opacity,translate] duration-(--motion-base) ease-enter data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-opacity",
            // A phone: a sheet from the bottom edge, square, a hairline on top; or the whole screen.
            fullscreenOnPhone
              ? "data-[form=sheet]:inset-0 data-[form=sheet]:h-dvh data-[form=sheet]:pt-[env(safe-area-inset-top)]"
              : "data-[form=sheet]:rule-t data-[form=sheet]:inset-x-0 data-[form=sheet]:bottom-0 data-[form=sheet]:max-h-[calc(100dvh-var(--c-review-sheet-top-gap))] data-[form=sheet]:data-ending-style:translate-y-full data-[form=sheet]:data-starting-style:translate-y-full",
            // Wider: a dialog in the middle (of the area under an app's own title bar, as the shared
            // Dialog), the one 2px corner, a hairline all round, the margin clear on every side.
            "data-[form=dialog]:rule-box data-[form=dialog]:top-[calc(50%+var(--c-dialog-titlebar-inset)/2)] data-[form=dialog]:left-1/2 data-[form=dialog]:max-h-[calc(100%-2*var(--c-dialog-margin)-var(--c-dialog-titlebar-inset))] data-[form=dialog]:-translate-x-1/2 data-[form=dialog]:-translate-y-1/2 data-[form=dialog]:rounded",
            WIDTH[size],
            // `full`: the whole screen less the margin, in height too.
            full && "data-[form=dialog]:h-[calc(100%-2*var(--c-dialog-margin)-var(--c-dialog-titlebar-inset))]"
          )}
          {...popupProps}
        >
          <div
            data-slot="review-header"
            className="flex shrink-0 flex-col items-center gap-2 px-4 pt-2 pb-2 group-data-[form=dialog]/review:items-stretch group-data-[form=dialog]/review:px-6 group-data-[form=dialog]/review:pt-5 group-data-[form=dialog]/review:pb-0"
          >
            {/* The grabber: a mark, not a control (the close button and Escape close the sheet). */}
            {!fullscreenOnPhone && <span aria-hidden data-slot="review-grabber" className="bg-line-grid-dot h-1 w-9 shrink-0 group-data-[form=dialog]/review:hidden" />}
            <div className="flex w-full items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col">
                {overline !== undefined && overline !== null && (
                  <p data-slot="review-overline" className="type-overline text-text-label">
                    {overline}
                  </p>
                )}
                <DialogPrimitive.Title data-slot="review-title" className="type-lead text-text-body break-words">
                  {title}
                </DialogPrimitive.Title>
              </div>
              {showClose && (
                <DialogPrimitive.Close
                  data-slot="review-close"
                  render={<FloatButton ref={closeRef} label={closeLabel} icon="close" size={sheet ? "l" : "m"} tooltip={false} />}
                />
              )}
            </div>
          </div>
          {headerAfter}
          <div
            data-slot="review-body"
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pt-4 group-data-[form=dialog]/review:px-6",
              !footer && "pb-[calc(--spacing(10)+env(safe-area-inset-bottom))] group-data-[form=dialog]/review:pb-6",
              bodyClassName
            )}
          >
            {children}
          </div>
          {footer && (
            <div
              data-slot="review-footer"
              className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-[calc(--spacing(10)+env(safe-area-inset-bottom))] group-data-[form=dialog]/review:px-6 group-data-[form=dialog]/review:pt-6 group-data-[form=dialog]/review:pb-6"
            >
              {footer}
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** The countdown rule under a review's header: 30 cells by default, critical near the end. Decorative; the words carry the time. */
export function ReviewCountdownRule({ children }: { children: React.ReactNode }) {
  return (
    <div data-slot="review-countdown" aria-hidden className="shrink-0 px-4 pt-2 group-data-[form=dialog]/review:px-6 group-data-[form=dialog]/review:pt-4">
      {children}
    </div>
  )
}
