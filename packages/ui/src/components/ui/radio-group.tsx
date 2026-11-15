// Owned component (not generated): one choice of several, as square radios, and as rows of a choice with a sentence.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.1b #23: Vale settings and questions, Lockdown "Keep which?", Synapse merge choices; no Figma frame; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cn } from "../../lib/utils"

/**
 * RadioGroup: one value of several. Base UI gives it `role="radiogroup"`, one Tab stop and the arrow
 * keys between its radios. Name it (`aria-label`, or `aria-labelledby` to a heading or a FieldLegend).
 * Its children are `RadioGroupItem`s beside their labels, or `RadioRow`s.
 */
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-3 has-[>[data-slot=radio-row]]:gap-0", className)}
      {...props}
    />
  )
}

/**
 * One radio: the Checkbox's 16px square on the 2px corner, raised, with a 1px edge in the label ink
 * (`--c-radio-edge`, held to 3:1: it is all that shows an empty radio). Chosen, the edge turns to
 * ink and an 8px ink square sits in the middle: a radio shows a square inside, a checkbox a check,
 * so the two never read alike. 44px to a finger (`hit-area`).
 */
function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "peer group/radio hit-area inline-flex size-4 shrink-0 items-center justify-center rounded-lg bg-surface-raised rule-box transition-[background-color,box-shadow] [--line-rule:var(--c-radio-edge)] hover:bg-accent data-checked:[--line-rule:var(--c-radio-mark)] aria-invalid:inset-ring-2 aria-invalid:inset-ring-critical-fill data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator data-slot="radio-group-indicator" className="size-2 bg-(--c-radio-mark) data-unchecked:hidden" />
    </RadioPrimitive.Root>
  )
}

export type RadioRowProps = Omit<RadioPrimitive.Root.Props, "children" | "className"> & {
  /** The choice, in the control type ("Ask"). */
  label: React.ReactNode
  /** The sentence that says what the choice does ("Blocked until you load them, message by message."). */
  description?: React.ReactNode
  /** Where the row's rule is: on top (the default, as List Row and Field Row), at the bottom, or none. */
  rule?: "top" | "bottom" | "none"
  className?: string
}

/**
 * RadioRow (contract 5.1b #23): a choice that needs a sentence, as a row. The radio leads, at the
 * label's first line; the label in `ui`, the sentence in `caption`, secondary ink; 12 / 16 in, as
 * a Toggle Row. The whole row takes the press. The radio's name is the label and the sentence is
 * its description, so a screen reader says both.
 */
function RadioRow({ label, description, rule = "top", className, disabled, ...props }: RadioRowProps) {
  const id = React.useId()
  const labelId = `${id}-label`
  const descriptionId = `${id}-description`
  return (
    <label
      data-slot="radio-row"
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-state-hover has-[:active]:bg-state-pressed data-disabled:cursor-not-allowed data-disabled:hover:bg-transparent",
        rule === "top" && "rule-t",
        rule === "bottom" && "rule-b",
        className
      )}
    >
      <span className="flex h-5 shrink-0 items-center">
        <RadioGroupItem aria-labelledby={labelId} aria-describedby={description ? descriptionId : undefined} disabled={disabled} {...props} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col group-data-disabled:opacity-50 in-data-disabled:opacity-50">
        <span id={labelId} data-slot="radio-row-label" className="type-ui text-foreground">
          {label}
        </span>
        {description ? (
          <span id={descriptionId} data-slot="radio-row-description" className="type-caption text-support-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

export { RadioGroup, RadioGroupItem, RadioRow }
