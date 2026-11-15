// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:48 "Text Field": overline label, caption helper, critical error; contract 5.1b #37 disabled with a reason; no app PR, no DSA record)
"use client"

import * as React from "react"
import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

import { Label } from "./label"
import { Separator } from "./separator"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn("flex min-w-0 flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3", className)}
      {...props}
    />
  )
}

/** A group's name: the mono caps overline, as a field's label is. */
function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn("type-overline mb-1 text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-6 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
        className
      )}
      {...props}
    />
  )
}

// Vertical: the label, 4px, the control, 4px, the help (Figma 32:48). Horizontal: a checkbox, a
// radio or a switch beside its words, which then read in the control type, not the overline.
const fieldVariants = cva("group/field flex w-full", {
  variants: {
    orientation: {
      vertical: "flex-col gap-1 *:w-full [&>.sr-only]:w-auto",
      horizontal:
        "flex-row items-center gap-3 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-0.5",
      responsive:
        "flex-col gap-1 *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-3 @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-0.5",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

/**
 * A label, a control and its help. Set `data-invalid` on it when the value is wrong: the label and
 * the help turn critical, as Figma's error field draws them.
 */
function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("group/field-content flex flex-1 flex-col gap-0", className)}
      {...props}
    />
  )
}

// Beside a checkbox, radio or switch the label is the choice's words (type-ui, ink). Wrapping a
// whole Field it is a choice card: a hairline box, and the soft fill with the 2px edge once chosen.
const FIELD_LABEL = cn(
  "group/field-label peer/field-label flex w-fit gap-2",
  "group-data-[orientation=horizontal]/field:type-ui group-data-[orientation=horizontal]/field:normal-case group-data-[orientation=horizontal]/field:text-foreground",
  "group-data-[invalid=true]/field:text-critical-text group-data-[disabled=true]/field:opacity-50",
  "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:rule-box has-[>[data-slot=field]]:normal-case has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-state-hover has-[>[data-slot=field]]:has-data-checked:bg-primary-soft has-[>[data-slot=field]]:has-data-checked:edge-l *:data-[slot=field]:p-3"
)

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" className={cn(FIELD_LABEL, className)} {...props} />
}

/** A choice's own title inside a choice card: the control type, in the ink. */
function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn("type-ui flex w-fit items-center gap-2 text-foreground group-data-[disabled=true]/field:opacity-50", className)}
      {...props}
    />
  )
}

/** The help under a field: caption, secondary ink; critical when the field is invalid. */
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "type-caption text-left text-support-foreground group-has-data-horizontal/field:text-balance group-data-[invalid=true]/field:text-critical-text",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn("relative -my-2 h-5", className)}
      {...props}
    >
      {/* Out of the flow already: no pull-back needed, the line stays on the box's middle. */}
      <Separator className="absolute inset-0 top-1/2 data-horizontal:mt-0" />
      {children && (
        <span className="type-overline relative mx-auto block w-fit bg-background px-2 text-muted-foreground" data-slot="field-separator-content">
          {children}
        </span>
      )}
    </div>
  )
}

/** What is wrong with the value, in the server's or the form's words: caption, critical ink. */
function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div role="alert" data-slot="field-error" className={cn("type-caption text-critical-text", className)} {...props}>
      {content}
    </div>
  )
}

/**
 * Why a control can't be used right now, in a line under it (contract 5.1b #37). The control
 * points at it with `aria-describedby` and stays in the tab order, so the reason can be found by
 * keyboard and is read with the control's name. Caption, secondary ink: it explains, it does not warn.
 */
function FieldDisabledReason({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="disabled-reason" className={cn("type-caption text-support-foreground", className)} {...props} />
}

export interface DisabledReason {
  /** True when the control is disabled and has a reason to show: it stays focusable, `aria-disabled`. */
  active: boolean
  /** The id of the reason line. */
  id: string
  /** `aria-describedby` for the control: what the caller passed, plus the reason's id when active. */
  describedBy: string | undefined
  /** The line to render under the control, or null. */
  line: React.ReactNode
}

/**
 * Wires a visible disabled reason to a control: `const reason = useDisabledReason(disabled, why)`,
 * then `aria-describedby={reason.describedBy}` on the control and `{reason.line}` under it. While
 * `reason.active`, keep the control focusable (`aria-disabled`, not `disabled`).
 */
function useDisabledReason(disabled: boolean | undefined, disabledReason: React.ReactNode, describedBy?: string): DisabledReason {
  const id = React.useId()
  const active = Boolean(disabled && disabledReason)
  return {
    active,
    id,
    describedBy: [describedBy, active ? id : undefined].filter(Boolean).join(" ") || undefined,
    line: active ? <FieldDisabledReason id={id}>{disabledReason}</FieldDisabledReason> : null,
  }
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldDisabledReason,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
  useDisabledReason,
}
