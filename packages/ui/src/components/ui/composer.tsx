// Owned component (not generated): the message box at the foot of a conversation or a thread: a field that grows, and one square send button that becomes Stop.
// Promoted from: Seeded in snds/unicron (2.0: Figma Composer 32:91, the floating raised bar; contract 5.1 and 5.1b #46; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { IconButton } from "../icon-button"
import { Button } from "./button"
import { fieldTextOnTouch } from "./input"

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

/** The box as one row: the field beside its tools, 4px above and below the 32px tools. */
const ONE_ROW_ALWAYS = "flex-row items-center gap-2 py-1"
const ONE_ROW =
  "short:flex-row short:items-center short:gap-2 short:py-1 group-data-[keyboard=open]/frame:flex-row group-data-[keyboard=open]/frame:items-center group-data-[keyboard=open]/frame:gap-2 group-data-[keyboard=open]/frame:py-1"

/** Every word the composer says on its own. Swap for another language. */
export const composerCopy = {
  /** The field's name when the host gives none. */
  field: "Message",
  /** The quote's × when the host gives no name. */
  cancelReply: "Cancel reply",
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
  /**
   * A reply's quote, inside the box at its top, over the field: a `ComposerQuote`. It stays on its
   * own line when the box is one row.
   */
  quote?: React.ReactNode
  /** The tools row's first slot: an attach button (`<IconButton icon="add" size="icon-sm" label="Attach a file" />`). */
  attach?: React.ReactNode
  /** A second leading action after it: Vale's expand to the full message form. */
  leadingAction?: React.ReactNode
  /** The textarea, for focus and selection. */
  fieldRef?: React.Ref<HTMLTextAreaElement>
  /** Anything else for the textarea: `id`, `name`, `autoComplete`, `enterKeyHint`, `onKeyDown`, `onPaste`. */
  fieldProps?: Omit<React.ComponentProps<"textarea">, "value" | "defaultValue" | "onChange" | "disabled" | "placeholder" | "ref">
}

// Figma's Send is a 32px circle (radius/round) on the accent fill: the round shape marks the one
// action that leaves the bar.
const SEND = "rounded-full"

function coarsePointer() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
}

/** Hands a node to a ref of either kind. */
function assignRef<T>(ref: React.Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node)
  else if (ref) (ref as React.RefObject<T | null>).current = node
}

/**
 * The message box (Figma Composer, 2.0): a floating raised bar with 16px corners and a 1px
 * line/field edge, 88 tall at rest. The field sits on top in the `body` role with the placeholder
 * in label ink; it grows with its text up to `--c-composer-max-lines` lines, then scrolls inside
 * itself. Under it, 10 below, the tools row: `attach` and `leadingAction` (small ghost Icon
 * Buttons), then the send button at the end, a 32px circle on the primary fill with an up arrow.
 * 12 in at the top and right, 10 at the bottom, 16 on the left. On a touch screen the field's text
 * is 16px, as every field's, so iOS does not zoom into it.
 *
 * While the field is only empty, Send is unavailable: `aria-disabled`, dimmed to 50%, and still in
 * the tab order, so a keyboard reaches it and hears why; a press does nothing (Unicron 51: a
 * full-strength button that does nothing feels broken). Figma draws only the full-strength state
 * (21. Composer). A composer that is `disabled`, or whose sending is turned off, dims to 50% too.
 *
 * While `streaming` the button is Stop (focus moves back to the field when it swaps, and again
 * when the reply ends under the keyboard and Stop turns back into a Send that cannot send). While
 * `waiting` it is a clock that cancels the wait. Enter sends and Shift+Enter makes a line, or as
 * `sendKey` says, and never while an input method is composing. Focus draws the field's 2px
 * inside border in the focus line (`--line-focus`) on the box, as a Text Field does.
 *
 * Above the box, top to bottom: `status`, `chips`, then the `disabledReason` line. Inside it: a
 * reply's `quote` at the top, then the field, then `attach` and `leadingAction` before Send.
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
  quote,
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
  // Nothing but the empty field stands in the way: Send is unavailable, at full strength.
  const idle = empty && !sending && !streaming && !waiting && !disabled && !sendDisabled

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

  // The other way round: a reply ends by itself (or a wait does) while focus is on Stop or on the
  // clock. The button turns back into a Send that cannot send, and a browser drops focus from a
  // button that becomes disabled to the page's body. Focus goes to the field instead. Whether the
  // button held focus is kept from its own focus events, since by now the browser may have moved it.
  const buttonFocused = React.useRef(false)
  const busy = streaming || waiting
  const wasBusy = React.useRef(busy)
  React.useEffect(() => {
    const ended = wasBusy.current && !busy
    wasBusy.current = busy
    if (!ended || !buttonFocused.current || canSend) return
    const active = document.activeElement
    if (active && active !== document.body && active !== button.current) return
    field.current?.focus()
  }, [busy, canSend])
  const trackFocus = {
    onFocus: () => {
      buttonFocused.current = true
    },
    onBlur: () => {
      buttonFocused.current = false
    },
  }

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
  // Stop, the waiting clock and Send are one DOM node (the ref and focus stay on it). A host
  // usually ends streaming or waiting inside the press, and React then re-renders this node as the
  // submit button before the browser runs the click's own action, which reads the button's type
  // at that moment and submits the form: Stop sent the draft, and cancelling a wait sent the
  // message it was holding. Cancelling the click's default action keeps a press on Stop or on the
  // clock to what it says. By mouse and by keyboard: Enter and Space arrive as the same click.
  const press = (handler: (() => void) | undefined) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    handler?.()
  }
  let action: React.ReactNode
  if (waiting) {
    action = (
      <Button ref={button} type="button" size="icon" className={SEND} aria-label={composerCopy.waiting} data-slot="composer-send" data-action="waiting" onClick={press(onCancelWaiting)} disabled={disabled} {...trackFocus}>
        <Icon name="time" className="size-5" />
      </Button>
    )
  } else if (streaming) {
    action = (
      <Button
        ref={button}
        type="button"
        size="icon"
        className={SEND}
        aria-label={composerCopy.stop}
        data-slot="composer-send"
        data-action="stop"
        loading={stopping}
        disabled={disabled}
        onClick={press(onStop)}
        {...trackFocus}
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
        className={SEND}
        aria-label={composerCopy.send}
        aria-describedby={disabledReason ? reasonId : undefined}
        data-slot="composer-send"
        data-action="send"
        data-idle={idle ? "" : undefined}
        loading={sending}
        disabled={!canSend && !sending}
        // Only empty: it stays in the tab order and says it is unavailable, dimmed to 50% by the
        // button's own aria-disabled rule (Unicron 51). A press does nothing.
        focusableWhenDisabled={idle || (focusable && (disabled || sendDisabled)) ? true : undefined}
        {...trackFocus}
      >
        <Icon name="arrow--up" className="size-5" />
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
          "bg-surface-raised inset-ring inset-ring-line-field flex min-w-0 flex-col gap-2.5 rounded-xl pt-3 pr-3 pb-2.5 pl-4",
          // One row, the field beside its tools, wherever height is scarce: a phone on its side, an open keyboard,
          // or the line size. Two rows there would leave almost nothing of the conversation to read.
          ONE_ROW,
          size === "line" && ONE_ROW_ALWAYS,
          // A quote keeps its own line over a one-row box: the row wraps under it.
          quote && "flex-wrap",
          // Focus in the field: Figma's 2px inside border in the focus line (--line-focus), as a Text Field draws it.
          "has-[[data-slot=composer-field]:focus]:rule-box-emphasis has-[[data-slot=composer-field]:focus]:[--rule-color:var(--line-focus)]",
          disabled && !focusable && "opacity-50"
        )}
      >
        {quote ? (
          <div data-slot="composer-quote-slot" className="min-w-0 basis-full">
            {quote}
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
            // 16px on a touch screen, as every field: iOS zooms the page into a field set under 16px.
            fieldTextOnTouch,
            "type-body text-text-body placeholder:text-text-label min-w-0 resize-none bg-transparent outline-none",
            "short:flex-1 group-data-[keyboard=open]/frame:flex-1",
            size === "line" && "flex-1",
            size === "line"
              ? "h-6 overflow-y-auto"
              : "max-h-[calc(var(--type-body-leading)*var(--c-composer-max-lines))] overflow-y-auto",
            fieldProps?.className
          )}
        />
        <div data-slot="composer-tools" className="flex min-w-0 items-center gap-0.5">
          {attach || leadingAction ? (
            <div data-slot="composer-leading" className="flex shrink-0 items-center gap-0.5">
              {attach}
              {leadingAction}
            </div>
          ) : null}
          <span aria-hidden="true" className="flex-1" />
          {action}
        </div>
      </div>
    </form>
  )
}

export interface ComposerQuoteProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** The quoted words, cut to one line with an ellipsis; the full text is the line's title. */
  children: string
  /** Who is being answered, for a screen reader: "Replying to Claude". */
  label?: string
  /** The × takes the quote back. Without it, no ×. */
  onDismiss?: () => void
  /** The ×'s name. Default "Cancel reply". */
  dismissLabel?: string
}

/**
 * The quote a reply carries, inside the Composer's box at its top (Warpcore's Reply, coverage
 * canvas "Reply quote in composer"): the reply glyph, the quoted words on one line in secondary
 * ink on the hover wash, and a small × that takes it back. Pass it as the Composer's `quote`.
 */
export function ComposerQuote({ children, label, onDismiss, dismissLabel = composerCopy.cancelReply, className, ...props }: ComposerQuoteProps) {
  return (
    <div
      data-slot="composer-quote"
      role="group"
      aria-label={label}
      className={cn("bg-surface-hover text-text-secondary type-caption flex min-w-0 items-center gap-2 rounded py-1 pr-1 pl-2", className)}
      {...props}
    >
      <Icon name="reply" className="size-4 shrink-0" />
      <span data-slot="composer-quote-text" title={children} className="min-w-0 flex-1 truncate">
        {children}
      </span>
      {onDismiss ? <IconButton size="icon-xs" variant="ghost" icon="close" label={dismissLabel} onClick={onDismiss} /> : null}
    </div>
  )
}
