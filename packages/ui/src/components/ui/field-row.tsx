// Owned component (not generated): a label, its value and an action on one line, with a hairline above.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:512; no app PR, no DSA record)
"use client"

import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Button, buttonVariants, type ButtonProps } from "./button"

export type FieldRowSize = "default" | "display" | "stacked"

/** Which side of a row draws its hairline. Rows put it on top, so a list of them draws one line between each. */
export type FieldRowRule = "top" | "bottom" | "both" | "none"

/** The rule classes for a row. Inset shadows, so a rule never adds height (contract §1.6). */
const RULE: Record<FieldRowRule, string> = {
  top: "rule-t",
  bottom: "rule-b",
  both: "rule-t rule-b",
  none: "",
}

/** Space-separated ids, without the empty ones; undefined when there are none. */
function joinIds(...ids: Array<string | false | null | undefined>): string | undefined {
  const list = ids.filter(Boolean).join(" ")
  return list || undefined
}

interface FieldRowContextValue {
  size: FieldRowSize
  /** The label's id: an action or a control in the row is described or labelled by it. */
  labelId: string
  /** The id of the visible reason line, when the row's control is disabled with one. */
  reasonId?: string
  /** The row's control is disabled with a reason, and stays in the tab order. */
  disabled: boolean
}

const FieldRowContext = React.createContext<FieldRowContextValue | null>(null)

/**
 * The row a control sits in: its label's id (for `aria-labelledby` on a control in the value slot),
 * the reason line's id, and whether the row is disabled with a reason. Null outside a FieldRow.
 */
export function useFieldRow(): FieldRowContextValue | null {
  return React.useContext(FieldRowContext)
}

const rowVariants = cva(
  // No left or right padding, as drawn: rows line up with the column they sit in. `inset` adds
  // the 16px a full-bleed phone row needs.
  "group/field-row flex min-w-0 gap-4",
  {
    variants: {
      size: {
        // 52 = 16 + the 20px value line + 16. Label, value and action share the text baseline.
        default: "items-baseline py-4",
        // 64 = 12 + the 40px code-display line + 12. For a value read at a glance (a one-time code).
        display: "items-baseline py-3",
        // 64 = 12 + label 16 + 4 + value 20 + 12. Label above value, for phones; the action is centred.
        stacked: "items-center py-3",
      },
      inset: {
        true: "px-4",
        false: "",
      },
    },
    defaultVariants: { size: "default", inset: false },
  }
)

/** The type role of the value: mono, as Figma draws it. */
const VALUE_TYPE: Record<FieldRowSize, string> = {
  default: "type-code-inline",
  display: "type-code-display",
  stacked: "type-code-inline",
}

export type FieldRowValueProps = Omit<React.ComponentProps<"span">, "children"> & {
  children: React.ReactNode
  /**
   * How a value too long for its column is cut. It never wraps mid-word (rules 8.5).
   * `middle` (default) keeps the start and the end ("store.steamp…ered.com"), so an address or a
   * path keeps the part that tells it apart; `end` cuts the end with an ellipsis; `wrap` lets a
   * sentence wrap between words. The full text is always in the DOM: copy and screen readers get it.
   */
  truncate?: "middle" | "end" | "wrap"
  /** For `middle`: how many characters stay at the end. Default a third of the text, at most 12. */
  keepEnd?: number
}

/**
 * A field value that never wraps mid-word. A plain string given to FieldRow uses it on its own;
 * use it directly to choose how a long value is cut. The middle cut is CSS only: the start shrinks
 * with an ellipsis, the end never does, so it adapts to any width with nothing measured.
 */
function FieldRowValue({ children, truncate = "middle", keepEnd, className, ...props }: FieldRowValueProps) {
  const text = typeof children === "string" || typeof children === "number" ? String(children) : null
  if (truncate === "middle" && text !== null) {
    const keep = Math.max(0, Math.min(keepEnd ?? Math.min(12, Math.floor(text.length / 3)), text.length))
    const head = text.slice(0, text.length - keep)
    const tail = text.slice(text.length - keep)
    return (
      <span data-slot="field-row-value" data-truncate="middle" className={cn("flex min-w-0", className)} {...props}>
        {/* `pre` keeps a space at the cut; the head alone shrinks, with the ellipsis. */}
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-pre">{head}</span>
        {tail ? <span className="shrink-0 whitespace-pre">{tail}</span> : null}
      </span>
    )
  }
  return (
    <span
      data-slot="field-row-value"
      data-truncate={truncate}
      className={cn(truncate === "wrap" ? "min-w-0 break-normal" : "block min-w-0 truncate", className)}
      {...props}
    >
      {children}
    </span>
  )
}

export type FieldRowActionProps = ButtonProps & {
  /**
   * Makes the action a link ("Open" on a website): an `<a>` drawn as the same ghost button, so it
   * keeps the link role and opens like one. `target` and `rel` go with it.
   */
  href?: string
  target?: React.HTMLAttributeAnchorTarget
  rel?: string
}

/**
 * The text action at the end of a row ("Copy", "Reveal", "Change"): a ghost Button, size S, so it
 * has a hit area, the states and the focus ring that Figma's bare text lacks. It sits in the row
 * without making it taller, its label flush with the row's right edge as drawn. In a display row
 * it takes the live ink, as drawn (contract §9.9).
 *
 * It is a Button, so it can be the `render` of a menu trigger ("Change" opening a menu); with
 * `href` it is a link drawn the same way. Inside a row disabled with a reason it is
 * disabled, stays focusable and is described by that reason. Its description also names the row
 * ("Copy", "Username"), so a list of rows with the same action stays clear to a screen reader.
 */
function FieldRowAction({
  variant = "ghost",
  size = "sm",
  disabled,
  focusableWhenDisabled,
  "aria-describedby": ariaDescribedBy,
  href,
  target,
  rel,
  ...props
}: FieldRowActionProps) {
  const row = useFieldRow()
  const blocked = Boolean(row?.disabled)
  const off = disabled ?? blocked
  const describedBy = joinIds(ariaDescribedBy, row?.reasonId, row?.labelId)
  // Only a text action is pulled flush right: its 12px padding is space, not ink. An outlined or
  // filled button keeps its edge inside the row.
  const textOnly = variant === "ghost" || variant === "ghost-muted" || variant === "link"
  const iconOnly = typeof size === "string" && size.startsWith("icon")
  return (
    <span
      data-slot="field-row-action"
      data-tone={row?.size === "display" ? "live" : undefined}
      className={cn(
        // A size S button is 32 tall; the row's line is 16 to 20. The negative margins keep the
        // row at its drawn height and let the button's box reach into the row's padding.
        "inline-flex shrink-0",
        size === "sm" || size === "icon-sm" || size === "xs" || size === "icon-xs" ? "-my-2" : "",
        textOnly && !iconOnly && "last:-mr-3",
        textOnly && iconOnly && "last:-mr-2",
        // An icon has no text baseline to share, so it centres instead.
        iconOnly && "self-center",
        "data-[tone=live]:[&>[data-slot=button]]:text-secondary-live"
      )}
    >
      {href !== undefined ? (
        // A link keeps its role. Disabled, it loses its address but stays focusable and says so.
        <a
          href={off ? undefined : href}
          target={target}
          rel={rel}
          role={off ? "link" : undefined}
          tabIndex={off ? 0 : undefined}
          aria-disabled={off || undefined}
          aria-describedby={describedBy}
          aria-label={props["aria-label"]}
          data-slot="button"
          data-variant={variant}
          data-size={size}
          className={buttonVariants({ variant, size })}
        >
          {props.children as React.ReactNode}
        </a>
      ) : (
        <Button
          variant={variant}
          size={size}
          disabled={disabled ?? (blocked || undefined)}
          focusableWhenDisabled={focusableWhenDisabled ?? (blocked || undefined)}
          aria-describedby={describedBy}
          {...props}
        />
      )}
    </span>
  )
}

export type FieldRowProps = Omit<React.ComponentProps<"div">, "children" | "role"> & {
  /** Figma's Size. `default` 52, `display` 64 (a value read at a glance), `stacked` 64 (label above value, for phones). */
  size?: FieldRowSize
  /** The label, in mono caps (type it in sentence case). It may hold a `Kbd`, which keeps its case. */
  label: React.ReactNode
  /**
   * The value. A string or a number is set in the mono value role and cut in the middle when it is
   * too long (`FieldRowValue`). Anything else is placed as it is: a control (chips, a select), a
   * `FieldRowValue` with another cut, or masked text.
   */
  children?: React.ReactNode
  /** A Badge after the value ("Weak", "Verified"). */
  badge?: React.ReactNode
  /** One caption line under the value, when the label alone is not enough. */
  description?: React.ReactNode
  /**
   * A quiet slot before the action, in label ink: where a setting applies ("Everywhere"), often a
   * `FieldRowAction variant="ghost-muted"` that opens a menu.
   */
  meta?: React.ReactNode
  /**
   * The action at the end: one or two `FieldRowAction`s ("Open", "Copy"), any trigger that renders
   * one (a menu's "Change"), or another small control (a trailing overflow button).
   */
  action?: React.ReactNode
  /** Which side draws the hairline. Default `top`, as Figma draws it. */
  rule?: FieldRowRule
  /** Add the 16px side padding of a full-bleed phone row. Default false: no side padding, as drawn. */
  inset?: boolean
  /**
   * Why the row's action or control cannot be used now, shown as a line under the value. The
   * `FieldRowAction`s become disabled but stay focusable, described by this line (contract 5.1b
   * #37). A control in the value slot reads `useFieldRow()` for the same ids.
   */
  disabledReason?: React.ReactNode
}

/**
 * FieldRow: Figma's Field Row. A mono caps label in a 140px column, the value in mono, and an
 * action at the end; a hairline on top. The label and value are one labelled group: the row is
 * named by its label, and described by its description and reason lines.
 */
function FieldRow({
  size = "default",
  label,
  children,
  badge,
  description,
  meta,
  action,
  rule = "top",
  inset = false,
  disabledReason,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: FieldRowProps) {
  const uid = React.useId()
  const labelId = `${uid}-label`
  const descriptionId = description ? `${uid}-description` : undefined
  const reasonId = disabledReason ? `${uid}-reason` : undefined
  const context = React.useMemo<FieldRowContextValue>(
    () => ({ size, labelId, reasonId, disabled: Boolean(disabledReason) }),
    [size, labelId, reasonId, disabledReason]
  )
  const stacked = size === "stacked"
  const value =
    typeof children === "string" || typeof children === "number" ? <FieldRowValue>{children}</FieldRowValue> : children

  const labelNode = (
    <span
      id={labelId}
      data-slot="field-row-label"
      className={cn(
        // A Kbd in the label keeps its case and sits on the label's line.
        "type-overline text-muted-foreground inline-flex flex-wrap items-baseline gap-x-2 [&_[data-slot=kbd]]:normal-case",
        stacked ? "min-w-0" : "w-(--c-field-row-label-width) shrink-0"
      )}
    >
      {label}
    </span>
  )
  const lines = (
    <>
      <span data-slot="field-row-value-line" className={cn("flex min-w-0 items-baseline gap-2 text-foreground", VALUE_TYPE[size])}>
        {value}
        {badge ? (
          <span data-slot="field-row-badge" className="inline-flex shrink-0">
            {badge}
          </span>
        ) : null}
      </span>
      {description ? (
        <p id={descriptionId} data-slot="field-row-description" className="type-caption text-support-foreground">
          {description}
        </p>
      ) : null}
      {disabledReason ? (
        <p id={reasonId} data-slot="field-row-reason" className="type-caption text-support-foreground">
          {disabledReason}
        </p>
      ) : null}
    </>
  )

  return (
    <FieldRowContext.Provider value={context}>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={joinIds(ariaDescribedBy, descriptionId, reasonId)}
        data-slot="field-row"
        data-size={size}
        data-disabled={disabledReason ? "" : undefined}
        className={cn(rowVariants({ size, inset }), RULE[rule], className)}
        {...props}
      >
        {stacked ? (
          <div data-slot="field-row-body" className="flex min-w-0 flex-1 flex-col gap-1">
            {labelNode}
            {lines}
          </div>
        ) : (
          <>
            {labelNode}
            <div data-slot="field-row-body" className="flex min-w-0 flex-1 flex-col">
              {lines}
            </div>
          </>
        )}
        {meta ? (
          <div data-slot="field-row-meta" className="type-overline text-muted-foreground flex shrink-0 items-baseline">
            {meta}
          </div>
        ) : null}
        {action ? (
          <div data-slot="field-row-actions" className="flex shrink-0 items-baseline">
            {action}
          </div>
        ) : null}
      </div>
    </FieldRowContext.Provider>
  )
}

export { FieldRow, FieldRowAction, FieldRowValue, rowVariants as fieldRowVariants }
