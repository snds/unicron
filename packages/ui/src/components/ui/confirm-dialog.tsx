// Owned component (not generated): the question before a loss: overline, question, one line, Cancel and a yes that repeats the verb; focus starts on Cancel; a dialog on a desktop, a sheet on a phone.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract §5.1b row 17 and the cross-app decisions §10; Vale U2, Lockdown L-02 and LA3, Synapse SY-18, Warpcore N-16, Vale NA4; no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { AdaptiveDialog, useLayerOpen, type AdaptivePresentation } from "./adaptive"
import { Button } from "./button"
import { type DialogSize } from "./dialog"
import { useDisabledReason } from "./field"

export interface ConfirmDialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The control that opens it, if the question owns one. */
  trigger?: React.ReactElement<Record<string, unknown>>
  /** The thing it is about, as a mono caps line (`STEAM // PERSONAL VAULT`). */
  overline?: React.ReactNode
  /** The question ("Delete Steam for good?"). */
  title: React.ReactNode
  /** One line: what happens, and whether it can be undone. */
  description?: React.ReactNode
  /** The yes, which repeats the verb that opened it (`Delete`, `Revoke`, `Discard`). Never "OK" or "Yes". */
  confirmLabel: string
  /** The no. `Cancel` by default; "Keep editing" when the question is "Discard changes?". */
  cancelLabel?: string
  /** `destructive` when something is removed or lost: the yes takes the critical fill. */
  tone?: "default" | "destructive"
  /** A 16px glyph before the yes. */
  confirmIcon?: IconName
  /**
   * Runs on the yes. Return a promise to keep the question open, with the yes busy, until it
   * settles: it closes when the promise resolves and stays open when it rejects (show why with
   * `error`).
   */
  onConfirm: () => void | Promise<unknown>
  /** Runs on the no, Escape, the close button or a press outside. */
  onCancel?: () => void
  /**
   * The yes is off until the person has done what the body asks: typed the word that arms it
   * (`reset`), ticked a box, picked a scope. Focus still starts on Cancel.
   */
  confirmDisabled?: boolean
  /**
   * Why the yes is off, while `confirmDisabled` holds ("Type reset to turn this on."): one visible
   * line at the foot of the body, above the yes, tied to it with `aria-describedby`. With a reason
   * the yes stays in the tab order (`aria-disabled`), so the reason is read with its name
   * (contract 5.1b #37).
   */
  disabledReason?: React.ReactNode
  /** A failed yes, in the server's words: one critical line in the body. */
  error?: React.ReactNode
  /**
   * More for the body, under the one line (contract 5.1c C11): `RadioRow`s (which events of a
   * series), a short list of consequences (`ConfirmDialogConsequences`), a `Checkbox` ("Also forget
   * the backup password"), or a Text Field that arms the yes with `confirmDisabled` and
   * `disabledReason`. The size stays `question` (480).
   */
  children?: React.ReactNode
  presentation?: AdaptivePresentation
  /** `question` (480) by default. */
  size?: DialogSize
  /** A line across the top of the question: the compact needs-you line (see `AdaptiveDialog`). */
  notice?: React.ReactNode
  container?: React.ComponentProps<typeof AdaptiveDialog>["container"]
}

/**
 * ConfirmDialog: ask once, in plain words, before something that cannot be undone (decisions
 * §10: undo if the code can, ask if it cannot). Focus starts on the no, so Enter never confirms
 * by accident; the yes repeats the verb and is the layer's one primary. A question-size dialog on
 * a desktop, a bottom sheet on a phone.
 */
function ConfirmDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  overline,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  confirmIcon,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  disabledReason,
  error,
  children,
  presentation = "auto",
  size = "question",
  container,
  notice,
}: ConfirmDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const [isOpen, setOpen] = useLayerOpen(open, defaultOpen, onOpenChange)
  const [busy, setBusy] = React.useState(false)
  // Set while the yes closes it, so closing is not taken for a no.
  const confirming = React.useRef(false)
  const reason = useDisabledReason(confirmDisabled && !busy, disabledReason)

  const change = (next: boolean) => {
    if (!next && busy) return
    if (!next && !confirming.current) onCancel?.()
    confirming.current = false
    setOpen(next)
  }

  const confirm = async () => {
    const result = onConfirm()
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setBusy(true)
      try {
        await result
      } catch {
        // The host shows why through `error`; the question stays open.
        setBusy(false)
        return
      }
      setBusy(false)
    }
    confirming.current = true
    change(false)
  }

  return (
    <AdaptiveDialog
      open={isOpen}
      onOpenChange={change}
      trigger={trigger}
      presentation={presentation}
      size={size}
      overline={overline}
      title={title}
      description={description}
      initialFocus={cancelRef}
      container={container}
      notice={notice}
      footer={
        <>
          <Button ref={cancelRef} type="button" variant="secondary" data-slot="confirm-dialog-cancel" disabled={busy} onClick={() => change(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "destructive" ? "destructive" : "default"}
            data-slot="confirm-dialog-confirm"
            loading={busy}
            disabled={confirmDisabled}
            // With a reason the yes stays reachable, and its reason is read with its name.
            focusableWhenDisabled={reason.active || undefined}
            aria-describedby={reason.describedBy}
            onClick={() => void confirm()}
          >
            {confirmIcon ? <Icon name={confirmIcon} size="sm" /> : null}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {reason.active ? (
        // At the foot of the body, at the end of the line: right above the yes it explains.
        <div data-slot="confirm-dialog-reason" className="flex justify-end text-end">
          {reason.line}
        </div>
      ) : null}
      {error ? (
        <p data-slot="confirm-dialog-error" role="alert" className="type-caption text-critical-text">
          {error}
        </p>
      ) : null}
    </AdaptiveDialog>
  )
}

/**
 * The short list of what a yes will do, for a question that needs more than one line (Vale's
 * "Turn on end-to-end encryption?"): two to four `ConfirmDialogConsequence`s, each an icon and one
 * sentence. A list, so a screen reader says how many there are.
 */
function ConfirmDialogConsequences({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="confirm-dialog-consequences" className={cn("flex flex-col gap-3", className)} {...props} />
}

/** One consequence: a 20px glyph (decorative) and one sentence in the body role. */
function ConfirmDialogConsequence({
  icon,
  className,
  children,
  ...props
}: React.ComponentProps<"li"> & { icon: IconName }) {
  return (
    <li data-slot="confirm-dialog-consequence" className={cn("type-body text-text-body flex items-start gap-3", className)} {...props}>
      {/* The glyph sits on the sentence's first 24px line. */}
      <span aria-hidden data-slot="confirm-dialog-consequence-icon" className="text-text-secondary flex h-6 shrink-0 items-center">
        <Icon name={icon} />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  )
}

export { ConfirmDialog, ConfirmDialogConsequence, ConfirmDialogConsequences }
