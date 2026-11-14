// Owned component (not generated): Figma's Text Field (label, box, helper, error), with a search field and a number field on top.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:48; no app PR, no DSA record)
"use client"

import * as React from "react"
import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { cn } from "../../lib/utils"

import { Icon } from "../icon"
import { Button } from "./button"
import { useDisabledReason } from "./field"
import { fieldTextOnTouch, fieldBoxVariants } from "./input"
import { labelVariants } from "./label"

/** Lines a message field starts at (rules 8.5: a multi-line message field shows 6 lines, 144px). */
export const textFieldMessageRows = 6

interface TextFieldOwnProps {
  /** The field's name, above the box, in the overline. Without one, pass `aria-label`. */
  label?: React.ReactNode
  /** One line under the box that helps fill it in. */
  helper?: React.ReactNode
  /** What is wrong with the value. It takes the helper's place, and the field turns critical. */
  error?: React.ReactNode
  /** Critical without a message of its own (the helper turns critical instead). */
  invalid?: boolean
  /** Inside the box, before the value: an icon (20px, secondary ink) or a small ghost Button. */
  leading?: React.ReactNode
  /** Inside the box, after the value: an icon, a word, or a small ghost Button (reveal, copy). */
  trailing?: React.ReactNode
  /**
   * Why the field is disabled, shown as a line under it (contract 5.1b #37). With `disabled`, the
   * field then stays in the tab order (read-only and `aria-disabled`) so the reason can be found.
   */
  disabledReason?: React.ReactNode
  /** Classes for the field's root (the column of label, box and help). */
  className?: string
}

type InputOnly = Omit<React.ComponentProps<"input">, "type" | "size" | "className" | "children">

export type TextFieldTextProps = TextFieldOwnProps &
  InputOnly & {
    multiline?: false
    type?: Exclude<React.HTMLInputTypeAttribute, "number">
  }

export type TextFieldMultilineProps = TextFieldOwnProps &
  Omit<React.ComponentProps<"textarea">, "className" | "children" | "rows"> & {
    /** Several lines. The box grows with the text, from `minRows` to `maxRows`. */
    multiline: true
    type?: never
    /** Lines it starts at. Default 6, a message field's height. */
    minRows?: number
    /** Lines it grows to before it scrolls. Default: no limit. */
    maxRows?: number
  }

export type TextFieldNumberProps = TextFieldOwnProps &
  Omit<InputOnly, "value" | "defaultValue" | "onChange" | "min" | "max" | "step"> & {
    /** A number, typed or stepped: − and + in the box, the arrow keys, Page Up and Down, Home and End. */
    type: "number"
    multiline?: false
    value?: number | null
    defaultValue?: number
    onValueChange?: (value: number | null) => void
    min?: number
    max?: number
    step?: number
    /** The step for Page Up and Down, and Shift with an arrow. Default 10. */
    largeStep?: number
    /** How the number is written in the box (`Intl.NumberFormat` options). */
    format?: Intl.NumberFormatOptions
    /** The steppers' names. Default "Decrease" and "Increase", plus the field's label when it is text. */
    decrementLabel?: string
    incrementLabel?: string
  }

export type TextFieldProps = TextFieldTextProps | TextFieldMultilineProps | TextFieldNumberProps

// The value inside the box: no box of its own. A one-line control runs the box's full height, so
// a click anywhere on the box lands in it; the box's 16px sides are its own padding.
const CONTROL =
  fieldTextOnTouch + " " + "min-w-0 flex-1 self-stretch bg-transparent type-ui text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed aria-disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"

// Icons take the secondary ink. A button in a slot sits 8px from the box's edge, so its own
// padding lines up with the value. On several lines a slot sits at the first line.
const SLOT =
  "flex shrink-0 items-center gap-1 self-center text-support-foreground [&>svg:not([class*='size-'])]:size-5 group-data-multiline/text-field:self-start group-data-multiline/text-field:pt-3 group-data-multiline/text-field:has-[>button]:pt-2"

function slotLabel(label: React.ReactNode) {
  return typeof label === "string" ? label : undefined
}

/** Grow a textarea with its text, from minRows to maxRows lines, in every engine (WebKit too). */
function useAutosize(ref: React.RefObject<HTMLTextAreaElement | null>, minRows: number, maxRows: number | undefined, value: unknown) {
  const resize = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    const style = getComputedStyle(el)
    const line = parseFloat(style.lineHeight) || 0
    const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
    if (!line) return
    el.style.height = "auto"
    const min = minRows * line + pad
    const max = maxRows ? maxRows * line + pad : Number.POSITIVE_INFINITY
    const next = Math.min(max, Math.max(min, el.scrollHeight))
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden"
  }, [ref, minRows, maxRows])
  React.useLayoutEffect(resize, [resize, value])
  return resize
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value)
  else if (ref) (ref as React.RefObject<T | null>).current = value
}

/**
 * Text Field (Figma 32:48): the overline label, the box (raised, a 1px rule inside it, at least
 * 48 tall, 12 / 16 in), the value in the `ui` role, and a caption under it. Focus draws Figma's
 * 2px inside border in the primary fill and no outer ring; an error draws it in the critical
 * fill and turns the label and the help critical. `multiline` grows with its text from 6 lines.
 * `type="number"` adds − and + steppers. `leading` and `trailing` hold an icon or a small button.
 */
function TextField(props: TextFieldProps) {
  if (isNumber(props)) return <NumberTextField {...props} />
  if (isMultiline(props)) return <MultilineTextField {...props} />
  return <LineTextField {...(props as TextFieldTextProps)} />
}

function isNumber(props: TextFieldProps): props is TextFieldNumberProps {
  return props.type === "number"
}

function isMultiline(props: TextFieldProps): props is TextFieldMultilineProps {
  return props.multiline === true
}

interface Parts {
  id: string
  invalid: boolean
  /** Props for the control: id, the error and help wiring, disabled or focusable-disabled. */
  control: {
    id: string
    "data-slot": "text-field-control"
    "aria-invalid": true | undefined
    "aria-describedby": string | undefined
    "aria-disabled": true | undefined
    disabled: boolean | undefined
    readOnly: boolean | undefined
  }
  label: React.ReactNode
  help: React.ReactNode
  rootProps: {
    "data-slot": "text-field"
    "data-invalid": "" | undefined
    "data-disabled": "" | undefined
    "data-readonly": "" | undefined
    className: string
  }
}

function useParts(own: TextFieldOwnProps & { id?: string; disabled?: boolean; readOnly?: boolean; "aria-describedby"?: string }): Parts {
  const { label, helper, error, invalid, disabledReason, className, disabled, readOnly } = own
  const auto = React.useId()
  const id = own.id ?? auto
  const helpId = `${id}-help`
  const isInvalid = Boolean(invalid || error)
  const help = error ?? helper
  const reason = useDisabledReason(disabled, disabledReason, [own["aria-describedby"], help ? helpId : undefined].filter(Boolean).join(" ") || undefined)
  return {
    id,
    invalid: isInvalid,
    control: {
      id,
      "data-slot": "text-field-control",
      "aria-invalid": isInvalid || undefined,
      "aria-describedby": reason.describedBy,
      // Disabled with a reason stays in the tab order: read-only, and said to be disabled.
      "aria-disabled": reason.active || undefined,
      disabled: reason.active ? undefined : disabled,
      readOnly: reason.active ? true : readOnly,
    },
    label: label ? (
      <label htmlFor={id} data-slot="text-field-label" className={cn(labelVariants(), "group-data-invalid/text-field:text-critical-text")}>
        {label}
      </label>
    ) : null,
    help: (
      <>
        {help ? (
          <p
            id={helpId}
            data-slot={error ? "text-field-error" : "text-field-helper"}
            role={error ? "alert" : undefined}
            className="type-caption text-support-foreground group-data-invalid/text-field:text-critical-text"
          >
            {help}
          </p>
        ) : null}
        {reason.line}
      </>
    ),
    rootProps: {
      "data-slot": "text-field",
      "data-invalid": isInvalid ? "" : undefined,
      "data-disabled": disabled ? "" : undefined,
      "data-readonly": readOnly ? "" : undefined,
      className: cn("group/text-field flex w-full min-w-0 flex-col gap-1", className),
    },
  }
}

/** The box, as Input's: the control inside it, slots 8px from it. */
function Box({ children, multiline }: { children: React.ReactNode; multiline?: boolean }) {
  return (
    <div
      data-slot="text-field-box"
      className={cn(
        fieldBoxVariants({ focus: "within" }),
        "relative flex min-h-control w-full min-w-0 cursor-text gap-2 px-4",
        multiline ? "items-stretch" : "items-center",
        "has-[>[data-slot=text-field-leading]>button]:pl-2 has-[>[data-slot=text-field-trailing]>button]:pr-2"
      )}
      // A press on the box's own padding goes to the control, as a click on a native field would.
      onPointerDown={(event) => {
        if (event.target !== event.currentTarget) return
        const control = event.currentTarget.querySelector<HTMLElement>("[data-slot=text-field-control]")
        if (!control) return
        event.preventDefault()
        control.focus()
      }}
    >
      {children}
    </div>
  )
}

function Slot({ side, children }: { side: "leading" | "trailing"; children: React.ReactNode }) {
  if (children === undefined || children === null || children === false) return null
  return (
    <span data-slot={`text-field-${side}`} className={SLOT}>
      {children}
    </span>
  )
}

function LineTextField({ label, helper, error, invalid, leading, trailing, disabledReason, className, multiline: _m, type = "text", ...input }: TextFieldTextProps) {
  const parts = useParts({ label, helper, error, invalid, disabledReason, className, ...input })
  return (
    <div {...parts.rootProps}>
      {parts.label}
      <Box>
        <Slot side="leading">{leading}</Slot>
        <input type={type} {...input} {...parts.control} className={CONTROL} />
        <Slot side="trailing">{trailing}</Slot>
      </Box>
      {parts.help}
    </div>
  )
}

function MultilineTextField({
  label,
  helper,
  error,
  invalid,
  leading,
  trailing,
  disabledReason,
  className,
  multiline: _m,
  minRows = textFieldMessageRows,
  maxRows,
  ref,
  onInput,
  ...textarea
}: TextFieldMultilineProps) {
  const parts = useParts({ label, helper, error, invalid, disabledReason, className, ...textarea })
  const own = React.useRef<HTMLTextAreaElement | null>(null)
  const resize = useAutosize(own, minRows, maxRows, textarea.value)
  return (
    <div {...parts.rootProps} data-multiline="">
      {parts.label}
      <Box multiline>
        <Slot side="leading">{leading}</Slot>
        <textarea
          rows={minRows}
          {...textarea}
          {...parts.control}
          ref={(el) => {
            own.current = el
            setRef(ref, el)
          }}
          onInput={(event) => {
            resize()
            onInput?.(event)
          }}
          className={cn(CONTROL, "resize-none py-3")}
        />
        <Slot side="trailing">{trailing}</Slot>
      </Box>
      {parts.help}
    </div>
  )
}

function NumberTextField({
  label,
  helper,
  error,
  invalid,
  leading,
  trailing,
  disabledReason,
  className,
  type: _type,
  multiline: _m,
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step,
  largeStep,
  format,
  name,
  required,
  decrementLabel,
  incrementLabel,
  ref,
  ...input
}: TextFieldNumberProps) {
  const parts = useParts({ label, helper, error, invalid, disabledReason, className, ...input })
  const named = slotLabel(label) ?? input["aria-label"]
  const { disabled, readOnly, ...control } = parts.control
  return (
    <NumberFieldPrimitive.Root
      {...parts.rootProps}
      id={parts.id}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next)}
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      format={format}
      name={name}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
    >
      {parts.label}
      <Box>
        <Slot side="leading">{leading}</Slot>
        <NumberFieldPrimitive.Input {...input} {...control} ref={ref} className={cn(CONTROL, "tabular-nums")} />
        <Slot side="trailing">
          {trailing}
          <NumberFieldPrimitive.Decrement
            aria-label={decrementLabel ?? (named ? `Decrease ${named}` : "Decrease")}
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Icon name="subtract" />
          </NumberFieldPrimitive.Decrement>
          <NumberFieldPrimitive.Increment
            aria-label={incrementLabel ?? (named ? `Increase ${named}` : "Increase")}
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Icon name="add" />
          </NumberFieldPrimitive.Increment>
        </Slot>
      </Box>
      {parts.help}
    </NumberFieldPrimitive.Root>
  )
}

export type SearchFieldProps = Omit<TextFieldTextProps, "type" | "leading" | "value" | "defaultValue"> & {
  value?: string
  defaultValue?: string
  /** The words as they change, and "" when the clear button or Escape empties the field. */
  onValueChange?: (value: string) => void
  /** Called when the field is emptied by the clear button or Escape. */
  onClear?: () => void
  /** The clear button's name. Default "Clear search". */
  clearLabel?: string
}

/**
 * SearchField (contract 5.1a): a Text Field with the `search` icon before the words and a clear
 * button after them once there are words. Escape clears it; with nothing in it, Escape goes on to
 * the page (to leave the search). Its name is "Search" unless it has a label or an `aria-label`.
 */
function SearchField({
  value,
  defaultValue = "",
  onValueChange,
  onChange,
  onClear,
  onKeyDown,
  clearLabel = "Clear search",
  trailing,
  ref,
  ...props
}: SearchFieldProps) {
  const [own, setOwn] = React.useState(defaultValue)
  const words = value ?? own
  const input = React.useRef<HTMLInputElement | null>(null)
  const canClear = Boolean(words) && !props.disabled && !props.readOnly
  const clear = () => {
    setOwn("")
    onValueChange?.("")
    onClear?.()
    input.current?.focus()
  }
  return (
    <TextField
      {...props}
      aria-label={props.label ? props["aria-label"] : (props["aria-label"] ?? "Search")}
      type="search"
      value={words}
      ref={(el: HTMLInputElement | null) => {
        input.current = el
        setRef(ref, el)
      }}
      onChange={(event) => {
        setOwn(event.target.value)
        onValueChange?.(event.target.value)
        onChange?.(event)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "Escape" && words) {
          event.preventDefault()
          event.stopPropagation()
          clear()
        }
      }}
      leading={<Icon name="search" />}
      trailing={
        trailing || canClear ? (
          <>
            {trailing}
            {canClear ? (
              <Button variant="ghost" size="icon-sm" aria-label={clearLabel} data-slot="search-field-clear" onClick={clear}>
                <Icon name="close" />
              </Button>
            ) : null}
          </>
        ) : undefined
      }
    />
  )
}

export { TextField, SearchField }
