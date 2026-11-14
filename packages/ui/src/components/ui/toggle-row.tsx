// Owned component (not generated): a setting that turns on and off: a label, a line on what it does, and a Switch; the whole row is the target.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:54; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import type { FieldRowRule } from "./field-row"
import { Switch } from "./switch"

/** The rule classes, as Field Row draws them: inset shadows, so a rule adds no height. */
const RULE: Record<FieldRowRule, string> = {
  top: "rule-t",
  bottom: "rule-b",
  both: "rule-t rule-b",
  none: "",
}

function joinIds(...ids: Array<string | false | null | undefined>): string | undefined {
  const list = ids.filter(Boolean).join(" ")
  return list || undefined
}

type SwitchProps = React.ComponentProps<typeof Switch>

export type ToggleRowProps = Omit<SwitchProps, "className" | "children" | "render" | "size" | "style"> & {
  /** What the switch turns on, in the ui role ("Lock after 5 minutes"). It names the switch. It may hold a `Kbd`. */
  label: React.ReactNode
  /** One caption line on what it does ("Also locks when the screen sleeps."). It describes the switch. */
  description?: React.ReactNode
  /** A Badge after the label ("Beta"). Not part of the switch's name. */
  badge?: React.ReactNode
  /** A quiet slot before the switch, in label ink: where the setting applies, often a text button that opens a menu. */
  meta?: React.ReactNode
  /** Which side draws the hairline. Default `top`, to match List Row and Field Row (contract §9.9). */
  rule?: FieldRowRule
  /** Add the 16px side padding of a full-bleed phone row (Figma's Toggle Row draws it at phone width). Default false. */
  inset?: boolean
  /**
   * Why the switch cannot be turned now, shown as a line under the description. The switch stays
   * focusable and is described by this line; it does not turn (contract 5.1b #37).
   */
  disabledReason?: React.ReactNode
  /** Classes for the row (not the switch). */
  className?: string
}

/**
 * ToggleRow: Figma's Toggle Row. A label in the ui role, an optional description, and the Switch,
 * with the props of the Switch passed through. The whole row is the target: a press anywhere on it
 * turns the switch, through a label stretched over the row, so there is one switch for assistive
 * tech and keyboard focus goes to the switch alone. 48 tall without a description, 64 with one.
 */
function ToggleRow({
  label,
  description,
  badge,
  meta,
  rule = "top",
  inset = false,
  disabledReason,
  className,
  id: idProp,
  disabled,
  readOnly,
  "aria-describedby": ariaDescribedBy,
  ...switchProps
}: ToggleRowProps) {
  const uid = React.useId()
  const id = idProp ?? `${uid}-switch`
  const labelId = `${uid}-label`
  const descriptionId = description ? `${uid}-description` : undefined
  const reasonId = disabledReason ? `${uid}-reason` : undefined
  // Disabled with a reason: the switch keeps its place in the tab order, says it is unavailable,
  // and does not turn (read-only). Plain `disabled` is the Switch's own, out of the tab order.
  const blocked = Boolean(disabledReason)
  const off = Boolean(disabled) || blocked

  return (
    <div
      data-slot="toggle-row"
      data-disabled={off ? "" : undefined}
      data-blocked={blocked ? "" : undefined}
      className={cn(
        "group/toggle-row relative flex min-w-0 items-center gap-4 py-3",
        inset && "px-4",
        RULE[rule],
        // The row is the target, so it takes the contract's washes (§6.1).
        !off && "hover:bg-state-hover active:bg-state-pressed",
        // A switch disabled with a reason is not `disabled`, so it is dimmed from here.
        blocked && "[&_[data-slot=switch]]:opacity-50",
        className
      )}
    >
      <div data-slot="toggle-row-text" className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-baseline gap-2 group-data-disabled/toggle-row:opacity-50">
          <label
            id={labelId}
            htmlFor={id}
            data-slot="toggle-row-label"
            className={cn(
              // Stretched over the whole row: a press on the padding, the description or the gap
              // reaches the label, which turns the switch. The switch and the meta slot sit above it.
              "type-ui text-foreground min-w-0 cursor-pointer select-none after:absolute after:inset-0",
              off && "cursor-not-allowed"
            )}
          >
            {label}
          </label>
          {badge ? (
            <span data-slot="toggle-row-badge" className="inline-flex shrink-0">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? (
          <p id={descriptionId} data-slot="toggle-row-description" className="type-caption text-support-foreground group-data-disabled/toggle-row:opacity-50">
            {description}
          </p>
        ) : null}
        {disabledReason ? (
          <p id={reasonId} data-slot="toggle-row-reason" className="type-caption text-support-foreground">
            {disabledReason}
          </p>
        ) : null}
      </div>
      {meta ? (
        <div data-slot="toggle-row-meta" className="type-overline text-muted-foreground relative flex shrink-0 items-center">
          {meta}
        </div>
      ) : null}
      <Switch
        id={id}
        aria-labelledby={labelId}
        aria-describedby={joinIds(ariaDescribedBy, descriptionId, reasonId)}
        {...(blocked ? { "aria-disabled": true } : null)}
        disabled={blocked ? false : disabled}
        readOnly={blocked || readOnly}
        {...switchProps}
      />
    </div>
  )
}

export { ToggleRow }
