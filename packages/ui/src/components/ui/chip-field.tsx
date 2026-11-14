// Owned component (not generated): the Text Field's box holding a list of values as chips, and the text you type to add one.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.1b #24: Vale recipients, labels, tags; Lockdown tags; Synapse; no Figma frame; no app PR, no DSA record)
"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

import { Chip, ChipRemove } from "../chip"
import { useDisabledReason } from "./field"
import { fieldTextOnTouch, fieldBoxVariants } from "./input"
import { labelVariants } from "./label"

export interface ChipFieldChipHelpers {
  /** Take this value out. */
  remove: () => void
  /** `isInvalid` said this value is wrong: draw it in the critical tone. */
  invalid: boolean
  index: number
  /** The field cannot be changed (disabled or read-only): draw no remove. */
  locked: boolean
}

export type ChipFieldProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "className" | "children" | "type" | "size"> & {
  /** The field's name, above the box, in the overline. Without one, pass `aria-label`. */
  label?: React.ReactNode
  /** One line under the box: what goes in it ("An address, or a domain with @ in front."). */
  helper?: React.ReactNode
  /** What is wrong. It takes the helper's place, and the field turns critical. */
  error?: React.ReactNode
  invalid?: boolean
  /** Why it is disabled, in a line under it; with `disabled` it stays focusable (contract 5.1b #37). */
  disabledReason?: React.ReactNode
  /** The values. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (values: string[]) => void
  /** Turn typed text into a value, or null to refuse it. Default: the text, trimmed; empty is refused. */
  parse?: (text: string) => string | null
  /** True for a value that is wrong (an address that is not one): its chip is critical. Say why in `error`. */
  isInvalid?: (value: string) => boolean
  /** Allow the same value twice. Default false: a repeat is dropped. */
  allowDuplicates?: boolean
  /** Draw a chip your own way (a person's name with their address in a tooltip). */
  renderChip?: (value: string, helpers: ChipFieldChipHelpers) => React.ReactNode
  /** The remove button's name for a value. Default "Remove {value}". */
  removeLabel?: (value: string) => string
  /** The text being typed, to drive suggestions from outside. */
  inputValue?: string
  onInputValueChange?: (text: string) => void
  /** Classes for the field's root. */
  className?: string
}

// Text that adds a value as it is typed: Enter, a comma or a semicolon. A paste splits on those
// and on line breaks.
const SEPARATORS = /[,;\n]+/

/**
 * ChipField (contract 5.1b #24): the Text Field's box (Figma 32:48) holding the values as chips
 * and a text input after them. Enter, a comma or a semicolon adds what was typed; a paste splits;
 * Backspace in the empty input takes the last chip off; every chip has its own remove. A value
 * `isInvalid` calls wrong is a critical chip. Each change is said aloud, politely.
 */
function ChipField({
  label,
  helper,
  error,
  invalid,
  disabledReason,
  value,
  defaultValue = [],
  onValueChange,
  parse = (text) => text.trim() || null,
  isInvalid,
  allowDuplicates = false,
  renderChip,
  removeLabel = (v) => `Remove ${v}`,
  inputValue,
  onInputValueChange,
  className,
  id: idProp,
  disabled,
  readOnly,
  onKeyDown,
  onPaste,
  onBlur,
  name,
  "aria-describedby": describedByProp,
  ...input
}: ChipFieldProps) {
  const auto = React.useId()
  const id = idProp ?? auto
  const helpId = `${id}-help`
  const [ownValues, setOwnValues] = React.useState(defaultValue)
  const values = value ?? ownValues
  const [ownText, setOwnText] = React.useState("")
  const text = inputValue ?? ownText
  const [said, setSaid] = React.useState("")
  const isWrong = Boolean(invalid || error)
  const help = error ?? helper
  const reason = useDisabledReason(disabled, disabledReason, [describedByProp, help ? helpId : undefined].filter(Boolean).join(" ") || undefined)
  const locked = Boolean(disabled || readOnly || reason.active)

  const commitValues = (next: string[], words: string) => {
    if (value === undefined) setOwnValues(next)
    onValueChange?.(next)
    setSaid(words)
  }
  const setText = (next: string) => {
    if (inputValue === undefined) setOwnText(next)
    onInputValueChange?.(next)
  }
  const add = (raw: string[]) => {
    const next = [...values]
    const added: string[] = []
    for (const piece of raw) {
      const parsed = parse(piece)
      if (parsed === null) continue
      if (!allowDuplicates && next.includes(parsed)) continue
      next.push(parsed)
      added.push(parsed)
    }
    if (added.length) commitValues(next, `Added ${added.join(", ")}`)
    return added.length > 0
  }
  const removeAt = (index: number) => {
    const gone = values[index]
    if (gone === undefined) return
    commitValues(
      values.filter((_, i) => i !== index),
      `Removed ${gone}`
    )
  }

  return (
    <div
      data-slot="chip-field"
      data-invalid={isWrong ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn("group/text-field flex w-full min-w-0 flex-col gap-1", className)}
    >
      {label ? (
        <label htmlFor={id} data-slot="chip-field-label" className={cn(labelVariants(), "group-data-invalid/text-field:text-critical-text")}>
          {label}
        </label>
      ) : null}
      <div
        data-slot="chip-field-box"
        className={cn(fieldBoxVariants({ focus: "within" }), "flex min-h-control w-full min-w-0 cursor-text flex-wrap items-center gap-1 px-4 py-3")}
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget) return
          event.preventDefault()
          event.currentTarget.querySelector<HTMLInputElement>("[data-slot=chip-field-control]")?.focus()
        }}
      >
        {values.map((v, index) => {
          const wrong = Boolean(isInvalid?.(v))
          const helpers: ChipFieldChipHelpers = { remove: () => removeAt(index), invalid: wrong, index, locked }
          // A hairline chip on the raised box; the critical tone for a wrong value.
          return (
            <span key={`${v}-${index}`} data-slot="chip-field-value" className="flex max-w-full min-w-0">
              {renderChip ? (
                renderChip(v, helpers)
              ) : (
                <Chip variant="outline" tone={wrong ? "critical" : "neutral"}>
                  <span>{v}</span>
                  {locked ? null : <ChipRemove label={removeLabel(v)} onClick={helpers.remove} />}
                </Chip>
              )}
            </span>
          )
        })}
        <input
          {...input}
          id={id}
          data-slot="chip-field-control"
          value={text}
          disabled={reason.active ? undefined : disabled}
          readOnly={reason.active ? true : readOnly}
          aria-disabled={reason.active || undefined}
          aria-invalid={isWrong || undefined}
          aria-describedby={reason.describedBy}
          className={cn(fieldTextOnTouch, "h-6 min-w-24 flex-1 bg-transparent type-ui text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed aria-disabled:cursor-not-allowed")}
          onChange={(event) => {
            const next = event.target.value
            if (SEPARATORS.test(next)) {
              const parts = next.split(SEPARATORS)
              const rest = parts.pop() ?? ""
              add(parts)
              setText(rest)
            } else setText(next)
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.defaultPrevented || locked) return
            if (event.key === "Enter" && text.trim()) {
              event.preventDefault()
              if (add([text])) setText("")
            } else if (event.key === "Backspace" && !text && values.length) {
              event.preventDefault()
              removeAt(values.length - 1)
            }
          }}
          onPaste={(event) => {
            onPaste?.(event)
            if (event.defaultPrevented || locked) return
            const pasted = event.clipboardData.getData("text")
            if (!SEPARATORS.test(pasted)) return
            event.preventDefault()
            add(`${text}${pasted}`.split(SEPARATORS))
            setText("")
          }}
          onBlur={(event) => {
            onBlur?.(event)
            // What was typed and left is kept as a value, as a mail client does with an address.
            if (!locked && text.trim() && add([text])) setText("")
          }}
        />
        {name ? <input type="hidden" name={name} value={values.join(",")} /> : null}
      </div>
      {help ? (
        <p
          id={helpId}
          data-slot={error ? "chip-field-error" : "chip-field-helper"}
          role={error ? "alert" : undefined}
          className="type-caption text-support-foreground group-data-invalid/text-field:text-critical-text"
        >
          {help}
        </p>
      ) : null}
      {reason.line}
      <span data-slot="chip-field-status" role="status" className="sr-only">
        {said}
      </span>
    </div>
  )
}

export { ChipField }
