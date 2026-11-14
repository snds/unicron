// Owned component (not generated): the square mono caps chip that filters a list, and the row that holds them.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:503; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { formatListCount } from "./list-row"

export type FilterChipGroupType = "single" | "multiple"

const chip = cva(
  // Figma 15:503: 24 tall, 4 / 8 padding, square corners (the one control without the 2px radius,
  // contract §9.9), overline label. Under 44, so a touch reaches it across 44 (hit-area).
  "hit-area inline-flex h-6 shrink-0 items-center rounded-none px-2 py-1 type-overline whitespace-nowrap select-none transition-colors duration-(--motion-fast) disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      active: {
        // Label ink, no fill. Hover and pressed are the contract's washes.
        false: "text-muted-foreground hover:bg-state-hover active:bg-state-pressed",
        // Inverted ink, never the identity colour, so it never competes with a selected row.
        // Hover and pressed take the ink to 90% and 80% over the ground, as a solid does.
        true: "bg-foreground text-background hover:bg-[color-mix(in_oklab,var(--foreground)_90%,var(--background))] active:bg-[color-mix(in_oklab,var(--foreground)_80%,var(--background))]",
      },
    },
    defaultVariants: { active: false },
  }
)

/** A filter chip's classes, for something drawn as one. */
function filterChipVariants({ active = false, className }: { active?: boolean; className?: string } = {}): string {
  return cn(chip({ active }), className)
}

interface GroupValue {
  type: FilterChipGroupType
  isActive: (value: string) => boolean
  toggle: (value: string) => void
  /** Single: which chip takes the Tab stop (the checked one, else the first). */
  tabStop: string | null
  register: (value: string, disabled: boolean, element: HTMLElement | null) => () => void
}

const GroupContext = React.createContext<GroupValue | null>(null)

export type FilterChipProps = Omit<ButtonPrimitive.Props, "value" | "children" | "className"> & {
  className?: string
  /** The words, in sentence case ("All"). The chip sets the capitals. */
  children: React.ReactNode
  /** In a group: what this chip stands for. */
  value?: string
  /** After the label: how many rows the filter shows ("All 12"). A number is written as decisions §13 says. */
  count?: number | React.ReactNode
  /** Outside a group: on or off, as a toggle (`aria-pressed`). */
  active?: boolean
  defaultActive?: boolean
  onActiveChange?: (active: boolean) => void
}

/**
 * FilterChip (Figma 5): a square chip in mono caps. Off is label ink with no fill; on is inverted
 * ink. In a `FilterChipGroup` of `type="single"` it is a radio (`aria-checked`, arrow keys); of
 * `type="multiple"`, or on its own, a toggle button (`aria-pressed`).
 */
function FilterChip({
  children,
  value,
  count,
  active: activeProp,
  defaultActive = false,
  onActiveChange,
  disabled,
  className,
  onClick,
  onKeyDown,
  ...props
}: FilterChipProps) {
  const group = React.useContext(GroupContext)
  const [own, setOwn] = React.useState(defaultActive)
  const inGroup = group !== null && value !== undefined
  const active = inGroup ? group.isActive(value) : (activeProp ?? own)
  const register = group?.register
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(
    () => (register && value !== undefined ? register(value, Boolean(disabled), ref.current) : undefined),
    [register, value, disabled]
  )

  const radio = inGroup && group.type === "single"
  const countShown = count !== undefined && count !== null && count !== false

  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="filter-chip"
      data-value={value}
      data-active={active || undefined}
      role={radio ? "radio" : undefined}
      aria-checked={radio ? active : undefined}
      aria-pressed={radio ? undefined : active}
      tabIndex={radio ? (group.tabStop === value ? 0 : -1) : undefined}
      disabled={disabled}
      className={filterChipVariants({ active, className })}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (inGroup) group.toggle(value)
        else {
          const next = !active
          if (activeProp === undefined) setOwn(next)
          onActiveChange?.(next)
        }
      }}
      onKeyDown={onKeyDown}
      {...props}
    >
      {/* One inline run, so the space before the count survives the chip's flex box ("All 12"). */}
      <span data-slot="filter-chip-label">
        {children}
        {countShown ? (
          <>
            {" "}
            <span data-slot="filter-chip-count">{typeof count === "number" ? formatListCount(count) : count}</span>
          </>
        ) : null}
      </span>
    </ButtonPrimitive>
  )
}

type SingleProps = {
  /** One of many, as radios (the default): one chip is on, and the arrow keys move and choose. */
  type?: "single"
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
}
type MultipleProps = {
  /** Any of many, as toggle buttons. */
  type: "multiple"
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: string[]) => void
}

export type FilterChipGroupProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> &
  (SingleProps | MultipleProps) & {
    /** One line that scrolls sideways, cut at the column's edge with no fade. Default: chips wrap. */
    scroll?: boolean
    /** One control after the chips, outside the scroll (a severity filter, a "More" menu). */
    action?: React.ReactNode
    /** The group's name ("Filter tasks"), when no visible heading names it. */
    label?: string
  }

const NONE: readonly string[] = []

/**
 * FilterChipGroup: a row of FilterChips, 8 apart. `type="single"` is a radio group (Left/Right or
 * Up/Down move and choose, Home and End, one Tab stop); `type="multiple"` is a group of toggles.
 * `scroll` keeps it to one line that scrolls; `action` sits after the chips.
 */
function FilterChipGroup(props: FilterChipGroupProps) {
  const {
    type = "single",
    value: valueProp,
    defaultValue,
    onValueChange,
    scroll = false,
    action,
    label,
    children,
    className,
    onKeyDown,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...rest
  } = props as FilterChipGroupProps & { value?: string | null | readonly string[]; defaultValue?: string | null | readonly string[]; onValueChange?: (value: never) => void }

  const multiple = type === "multiple"
  const [own, setOwn] = React.useState<string | null | readonly string[]>(defaultValue ?? (multiple ? NONE : null))
  const value = valueProp !== undefined ? valueProp : own
  const selected = React.useMemo<readonly string[]>(
    () => (multiple ? ((value as readonly string[] | null) ?? NONE) : value ? [value as string] : NONE),
    [multiple, value]
  )

  // The chips in the group, in the page's order, so the Tab stop falls on the first enabled one
  // when none is checked.
  const [chips, setChips] = React.useState<{ value: string; disabled: boolean; element: HTMLElement | null }[]>([])
  const register = React.useCallback((chipValue: string, disabled: boolean, element: HTMLElement | null) => {
    setChips((list) =>
      [...list.filter((c) => c.value !== chipValue), { value: chipValue, disabled, element }].sort((a, b) =>
        a.element && b.element && a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1
      )
    )
    return () => setChips((list) => list.filter((c) => c.value !== chipValue))
  }, [])

  const rootRef = React.useRef<HTMLDivElement>(null)
  const checked = !multiple && typeof value === "string" ? value : null
  const enabled = chips.filter((c) => !c.disabled)
  const tabStop = checked !== null && enabled.some((c) => c.value === checked) ? checked : (enabled[0]?.value ?? null)

  const commit = React.useCallback(
    (next: string | readonly string[]) => {
      if (valueProp === undefined) setOwn(next)
      ;(onValueChange as ((v: unknown) => void) | undefined)?.(Array.isArray(next) ? [...next] : next)
    },
    [valueProp, onValueChange]
  )

  const ctx = React.useMemo<GroupValue>(
    () => ({
      type,
      isActive: (chipValue) => selected.includes(chipValue),
      toggle: (chipValue) => {
        if (multiple) commit(selected.includes(chipValue) ? selected.filter((v) => v !== chipValue) : [...selected, chipValue])
        else if (chipValue !== checked) commit(chipValue)
      },
      tabStop,
      register,
    }),
    [type, selected, multiple, commit, checked, tabStop, register]
  )

  const moveRadio = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (multiple || event.defaultPrevented) return
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]
    if (!keys.includes(event.key)) return
    const radios = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-slot="filter-chip"][role="radio"]') ?? []).filter(
      (el) => !el.hasAttribute("disabled") && !el.hasAttribute("data-disabled")
    )
    if (radios.length === 0) return
    const at = radios.indexOf(event.target as HTMLElement)
    const last = radios.length - 1
    const to =
      event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowRight" || event.key === "ArrowDown" ? (at + 1) % radios.length : (at - 1 + radios.length) % radios.length
    event.preventDefault()
    const target = radios[to]
    target.focus()
    target.scrollIntoView?.({ block: "nearest", inline: "nearest" })
    const next = target.dataset.value
    if (next !== undefined && next !== checked) commit(next)
  }

  return (
    <GroupContext.Provider value={ctx}>
      <div
        data-slot="filter-chip-group"
        data-type={type}
        data-scroll={scroll || undefined}
        className={cn("flex min-w-0 items-center gap-2", className)}
        {...rest}
      >
        <div
          ref={rootRef}
          role={multiple ? "group" : "radiogroup"}
          aria-label={ariaLabel ?? label}
          aria-labelledby={ariaLabelledBy}
          data-slot="filter-chip-list"
          onKeyDown={moveRadio}
          className={cn(
            "flex min-w-0 items-center gap-2",
            // One line that scrolls; room above and below for a 44px touch target, which a
            // scroller would otherwise clip.
            scroll ? "no-scrollbar flex-1 flex-nowrap overflow-x-auto overscroll-x-contain pointer-coarse:-my-2.5 pointer-coarse:py-2.5" : "flex-wrap"
          )}
        >
          {children}
        </div>
        {action ? (
          <span data-slot="filter-chip-group-action" className="inline-flex shrink-0 items-center">
            {action}
          </span>
        ) : null}
      </div>
    </GroupContext.Provider>
  )
}

export { FilterChip, FilterChipGroup, filterChipVariants }
