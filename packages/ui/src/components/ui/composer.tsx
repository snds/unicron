// Owned component (not generated): the message box at the foot of a conversation or a thread: a field that grows, and one square send button that becomes Stop.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:91; contract 5.1 and 5.1b #46; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { Button } from "./button"

/** What the composer is doing; also its `data-state`. */
export type ComposerState = "empty" | "typing" | "sending" | "streaming" | "waiting"

/**
 * Which key sends. `enter`: Enter sends, Shift+Enter makes a line (the default). `mod-enter`:
 * Cmd or Ctrl+Enter sends, Enter makes a line. `auto`: `enter` with a fine pointer, `none` on touch.
 * `none`: Return always makes a line and only the button sends (a touch keyboard).
 */
export type ComposerSendKey = "enter" | "mod-enter" | "auto" | "none"

/** `default` grows with its text; `line` stays one line tall (a phone held sideways). */
export type ComposerSize = "default" | "line"

/** Every word the composer says on its own. Swap for another language. */
export const composerCopy = {
  /** The field's name when the host gives none. */
  field: "Message",
  send: "Send",
  stop: "Stop",
  /** The button while a message waits for the network: pressing it cancels the wait. */
  waiting: "Waiting to send. Cancel",
}

export interface ComposerProps extends Omit<React.ComponentProps<"form">, "onSubmit" | "onChange" | "children"> {
  /** The text, controlled. Pair with `onValueChange`, and clear it yourself after `onSend`. */
  value?: string
  /** The text, uncontrolled. The composer clears itself after a send. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Send was pressed, or the send key: the text as typed. Not called while it cannot send. */
  onSend?: (value: string) => void
  /** Figma `Placeholder`: "Reply to Mira", "Ask anything". */
  placeholder?: string
  /** The field's accessible name. Default "Message". */
  label?: string
  /** The message is on its way: the button keeps its name and shows a spinner, and nothing else sends. */
  sending?: boolean
  /** A reply is being written: the button is Stop. */
  streaming?: boolean
  onStop?: () => void
  /** Stop was pressed and the reply is ending: Stop keeps its name and shows a spinner. */
  stopping?: boolean
  /** Send was pressed offline: the button is a clock named "Waiting to send. Cancel". */
  waiting?: boolean
  onCancelWaiting?: () => void
  /** The whole composer is off. With `disabledReason` its parts stay in the tab order. */
  disabled?: boolean
  /** Only sending is off (no model is connected); typing still works. */
  sendDisabled?: boolean
  /**
   * Why it is off, in one visible line above the box, tied to the field and the button with
   * `aria-describedby` (contract 5.1b #37). It can hold a text button ("Connect").
   */
  disabledReason?: React.ReactNode
  /** Default `default`. */
  size?: ComposerSize
  /** Default `enter`. */
  sendKey?: ComposerSendKey
  /** A row above the box for chips: the model, the repository, the machine. 20px above the box. */
  chips?: React.ReactNode
  /** A status strip above the chips (an Accessory): a finished background task, "Sends when you're back online." */
  status?: React.ReactNode
  /** The leading slot: an attach button (`<IconButton icon="attachment" label="Attach a file" />`). */
  attach?: React.ReactNode
  /** A second leading action after it: Vale's expand to the full message form. */
  leadingAction?: React.ReactNode
  /** The textarea, for focus and selection. */
  fieldRef?: React.Ref<HTMLTextAreaElement>
  /** Anything else for the textarea: `id`, `name`, `autoComplete`, `enterKeyHint`, `onKeyDown`, `onPaste`. */
  fieldProps?: Omit<React.ComponentProps<"textarea">, "value" | "defaultValue" | "onChange" | "disabled" | "placeholder" | "ref">
}

function coarsePointer() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
}

/** Hands a node to a ref of either kind. */
function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node)
  else if (ref) (ref as React.RefObject<T | null>).current = node
}

/**
 * The message box (Figma "21. Composer"): the raised surface with a 1px hairline, 48 tall at rest
 * (`size-control`), 16px in on the left and 4 on the right, gap 8. The field is in the `ui` role
 * with the placeholder in label ink; it grows with its text up to `--c-composer-max-lines` lines,
 * then scrolls inside itself. The send button is a 40px square on the primary fill with
 * `send--alt`; it is off while the field is empty or a message is sending.
 *
 * While `streaming` the button is Stop (focus moves back to the field when it swaps). While
 * `waiting` it is a clock that cancels the wait. Enter sends and Shift+Enter makes a line, or as
 * `sendKey` says, and never while an input method is composing. Focus draws the field's 2px
 * `primary-fill` inside border on the box, as a Text Field does.
 *
 * Above the box, top to bottom: `status`, `chips`, then the `disabledReason` line. Inside it:
 * `attach` and `leadingAction` before the field.
 */
export function Composer({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSend,
  placeholder,
  label = composerCopy.field,
  sending = false,
  streaming = false,
  onStop,
  stopping = false,
  waiting = false,
  onCancelWaiting,
  disabled = false,
  sendDisabled = false,
  disabledReason,
  size = "default",
  sendKey = "enter",
  chips,
  status,
  attach,
  leadingAction,
  fieldRef,
  fieldProps,
  className,
  ...props
}: ComposerProps) {
  const [own, setOwn] = React.useState(defaultValue)
  const controlled = valueProp !== undefined
  const text = controlled ? valueProp : own
  const empty = text.trim() === ""
  const state: ComposerState = waiting ? "waiting" : streaming ? "streaming" : sending ? "sending" : empty ? "empty" : "typing"
  const canSend = !empty && !sending && !streaming && !waiting && !disabled && !sendDisabled

  const reasonId = React.useId()
  const described = disabledReason ? [fieldProps?.["aria-describedby"], reasonId].filter(Boolean).join(" ") : fieldProps?.["aria-describedby"]

  const field = React.useRef<HTMLTextAreaElement>(null)
  // The composer's own ref and the host's, both set.
  const setField = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      field.current = node
      assignRef(fieldRef, node)
    },
    [fieldRef]
  )
  const button = React.useRef<HTMLButtonElement>(null)

  const setText = (next: string) => {
    if (!controlled) setOwn(next)
    onValueChange?.(next)
  }
  const send = () => {
    if (!canSend) return
    onSend?.(text)
    if (!controlled) setOwn("")
  }

  // Grow with the text, up to the max-lines cap (CSS max-height), then scroll inside. Measured on
  // every change and whenever the box changes width, so a narrower column re-wraps and regrows.
  // A style set through the CSSOM, which a strict style-src allows.
  React.useLayoutEffect(() => {
    const el = field.current
    if (!el || size === "line") return
    const fit = () => {
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }
    fit()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text, size])

  // When Send turns into Stop under the keyboard, focus goes back to the field, not to Stop.
  React.useEffect(() => {
    if (streaming && button.current && document.activeElement === button.current) field.current?.focus()
  }, [streaming])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    fieldProps?.onKeyDown?.(e)
    // An input method composing (Japanese, Chinese, Korean) owns Enter until it commits.
    if (e.defaultPrevented || e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return
    const mode = sendKey === "auto" ? (coarsePointer() ? "none" : "enter") : sendKey
    const wants =
      mode === "enter" ? !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey : mode === "mod-enter" ? (e.metaKey || e.ctrlKey) && !e.altKey : false
    if (!wants) return
    e.preventDefault()
    send()
  }

  const focusable = Boolean(disabledReason)
  let action: React.ReactNode
  if (waiting) {
    action = (
      <Button ref={button} type="button" size="icon" aria-label={composerCopy.waiting} data-slot="composer-send" data-action="waiting" onClick={onCancelWaiting} disabled={disabled}>
        <Icon name="time" className="size-5" />
      </Button>
    )
  } else if (streaming) {
    action = (
      <Button
        ref={button}
        type="button"
        size="icon"
        aria-label={composerCopy.stop}
        data-slot="composer-send"
        data-action="stop"
        loading={stopping}
        disabled={disabled}
        onClick={onStop}
      >
        <Icon name="stop--filled--alt" className="size-5" />
      </Button>
    )
  } else {
    action = (
      <Button
        ref={button}
        type="submit"
        size="icon"
        aria-label={composerCopy.send}
        aria-describedby={disabledReason ? reasonId : undefined}
        data-slot="composer-send"
        data-action="send"
        loading={sending}
        disabled={!canSend && !sending}
        focusableWhenDisabled={focusable && (disabled || sendDisabled) ? true : undefined}
      >
        <Icon name="send--alt" className="size-5" />
      </Button>
    )
  }

  return (
    <form
      data-slot="composer"
      data-state={state}
      data-size={size}
      data-disabled={disabled ? "" : undefined}
      noValidate
      className={cn("flex min-w-0 flex-col", className)}
      onSubmit={(e) => {
        e.preventDefault()
        send()
      }}
      {...props}
    >
      {status ? (
        <div data-slot="composer-status" className="mb-4 min-w-0">
          {status}
        </div>
      ) : null}
      {chips ? (
        <div data-slot="composer-chips" className="mb-5 flex min-w-0 flex-wrap items-center gap-1">
          {chips}
        </div>
      ) : null}
      {disabledReason ? (
        <div id={reasonId} data-slot="composer-reason" className="type-caption text-text-secondary mb-2 flex min-w-0 flex-wrap items-center gap-x-2">
          {disabledReason}
        </div>
      ) : null}
      <div
        data-slot="composer-box"
        className={cn(
          "bg-surface-raised rule-box min-h-control flex min-w-0 items-end gap-2 rounded-lg py-1 pr-1",
          attach || leadingAction ? "pl-1" : "pl-4",
          // Focus in the field: Figma's 2px primary-fill inside border, as a Text Field draws it.
          "has-[[data-slot=composer-field]:focus]:rule-box-emphasis",
          disabled && !focusable && "opacity-50"
        )}
      >
        {attach || leadingAction ? (
          <div data-slot="composer-leading" className="flex shrink-0 items-center">
            {attach}
            {leadingAction}
          </div>
        ) : null}
        <textarea
          data-slot="composer-field"
          rows={1}
          aria-label={label}
          placeholder={placeholder}
          {...fieldProps}
          ref={setField}
          aria-describedby={described || undefined}
          aria-disabled={disabled && focusable ? true : fieldProps?.["aria-disabled"]}
          readOnly={(disabled && focusable) || fieldProps?.readOnly}
          disabled={disabled && !focusable}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            "type-ui text-text-body placeholder:text-text-label min-w-0 flex-1 resize-none bg-transparent py-2.5 outline-none",
            size === "line"
              ? "h-10 overflow-y-auto"
              : "max-h-[calc(var(--type-ui-leading)*var(--c-composer-max-lines)+--spacing(5))] overflow-y-auto",
            fieldProps?.className
          )}
        />
        {action}
      </div>
    </form>
  )
}
