// Owned component (not generated): a sidebar row (index, icon, label, count) and the titled group that holds a few of them.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:487; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { AppFrameRailContext } from "./app-frame-context"
import { NavMark, formatNavCount, nameWithMark, railItemVariants, resolveNavMark, rovingTarget, type NavMarkProp } from "./rail"
import { swatchFillClasses, type SwatchId } from "./tile"
import { Tooltip, TooltipContent } from "./tooltip"

/* ── Section ─────────────────────────────────────────────────────────────────────────────────── */

/** `multiple`: each item turns on and off (calendars shown). `single`: one of them (an account). */
export type NavSectionCheckable = "multiple" | "single"

interface NavSectionContextValue {
  collapsed: boolean
  checkable: NavSectionCheckable | undefined
}

const NavSectionContext = React.createContext<NavSectionContextValue | null>(null)

export type NavSectionProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** The group's name, in sentence case: the overline sets the capitals ("Mail // folders"). */
  title: string
  /** How many, joined to the title as `// 04` (cross-app decisions §13). */
  count?: number
  /** One small control beside the heading: a ghost icon Button ("New vault"). Hidden while collapsed. */
  action?: React.ReactNode
  /**
   * The sidebar's rail: every item draws as a `RailItem` (icon over count, its label in a tooltip),
   * and the heading stays only for assistive tech. The frame drives it: inside `AppFrameSidebar`
   * drawn as its rail it defaults to true.
   */
  collapsed?: boolean
  /**
   * Items that turn on and off (`multiple`: calendars to show) or pick one (`single`): the list is
   * a menu, each `NavItem checked` a menu item checkbox or radio, and the arrow keys move along it.
   */
  checkable?: NavSectionCheckable
}

/**
 * NavSection: a group of `NavItem`s under an overline heading, as the sidebars draw them
 * ("Apps // 04", "Mail // folders"): the heading, then the items, each 4px apart. The space
 * between two sections is the sidebar's (Vale draws 28). The group is named by its heading.
 */
function NavSection({ title, count, action, collapsed: collapsedProp, checkable, className, children, ...props }: NavSectionProps) {
  const rail = React.useContext(AppFrameRailContext)
  const collapsed = collapsedProp ?? rail
  const headingId = React.useId()
  const listRef = React.useRef<HTMLUListElement>(null)
  const context = React.useMemo(() => ({ collapsed, checkable }), [collapsed, checkable])

  // A checkable list is one stop in the tab order (the first checked item, or the first).
  React.useLayoutEffect(() => {
    if (!checkable) return
    const items = checkableItems(listRef.current)
    if (items.length === 0) return
    const focused = items.find((el) => el === document.activeElement)
    const stop = focused ?? items.find((el) => el.getAttribute("aria-checked") === "true") ?? items[0]
    for (const el of items) el.tabIndex = el === stop ? 0 : -1
  })

  return (
    <NavSectionContext.Provider value={context}>
      <div
        data-slot="nav-section"
        data-collapsed={collapsed ? "" : undefined}
        role="group"
        aria-labelledby={headingId}
        className={cn("flex min-w-0 flex-col gap-1", collapsed && "items-center gap-2", className)}
        {...props}
      >
        <div data-slot="nav-section-head" className={cn("flex min-h-4 items-center gap-2", collapsed && "sr-only")}>
          <p id={headingId} className="type-overline text-text-label min-w-0 flex-1 truncate">
            {title}
            {count !== undefined ? (
              <>
                <span aria-hidden="true">{` // ${formatNavCount(count)}`}</span>
                <span className="sr-only">{`, ${count.toLocaleString("en-US")}`}</span>
              </>
            ) : null}
          </p>
          {action && !collapsed ? (
            // Out of the heading's line box, so a 32px button keeps the heading 16px high.
            <div data-slot="nav-section-action" className="-my-2 flex shrink-0 items-center">
              {action}
            </div>
          ) : null}
        </div>
        <ul
          ref={listRef}
          data-slot="nav-section-list"
          role={checkable ? "menu" : "list"}
          aria-labelledby={checkable ? headingId : undefined}
          className={cn("flex min-w-0 flex-col gap-1", collapsed && "items-center gap-2")}
          onKeyDown={
            checkable
              ? (event) => {
                  const items = checkableItems(listRef.current)
                  const target = rovingTarget(items, document.activeElement as HTMLElement | null, event.key, "vertical")
                  if (!target) return
                  event.preventDefault()
                  for (const el of items) el.tabIndex = el === target ? 0 : -1
                  target.focus()
                }
              : undefined
          }
        >
          {children}
        </ul>
      </div>
    </NavSectionContext.Provider>
  )
}

function checkableItems(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"], [role="menuitemradio"]'))
}

/* ── Item ────────────────────────────────────────────────────────────────────────────────────── */

/** A calendar's, a note's or a persona's colour: one of the twelve swatch roles (contract 5.1b #55). */
export type NavItemSwatch = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** The swatch's fill: the one shared class map (Tile's), so a NavItem square and a CalendarEvent bar read the same role. */
function swatchFill(swatch: NavItemSwatch): string {
  return swatchFillClasses[String(swatch).padStart(2, "0") as SwatchId]
}

export type NavItemTone = "neutral" | "critical"

export type NavItemProps = Omit<useRender.ComponentProps<"a">, "children" | "aria-label"> & {
  /** The place's name, as written. It is the accessible name, with the mark's words after it. */
  label: string
  /** 20px glyph before the label. */
  icon?: IconName
  /** A folio before everything ("01"): the item's number in its list. Not read out. */
  index?: string
  /** The count at the end, or a square, or a key: the mark every navigation item shares. */
  mark?: NavMarkProp
  /** Shorthand for `mark={count}`. */
  count?: number
  /** The place showing now: the soft primary tile, body ink, and `aria-current="page"`. */
  current?: boolean
  /**
   * An item that turns on and off (a calendar shown in the grid). It becomes a checkbox: a menu
   * item checkbox (or radio, for `NavSection checkable="single"`) inside a checkable NavSection,
   * a plain checkbox elsewhere. A square box before the icon shows it.
   */
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** How deep in a tree (folders, nested tags): 0 at the top. Each level steps in by `--c-nav-item-indent`. */
  level?: number
  /**
   * Its children are showing. With `href`, `render` or `onClick` the item still goes to its place,
   * and a chevron button after it opens and closes; without them the whole item opens and closes.
   */
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /**
   * One small control at the end: a ghost icon Button (edit a folder, more). With a mouse it
   * shows on hover and focus, over the count; on touch it is always there.
   */
  action?: React.ReactNode
  /** A second line under the label (a vault's owner, why the item is off). Read as its description. */
  description?: React.ReactNode
  /** `critical`: something there is broken (an account that stopped syncing). Ink and a glyph, and words in the name. */
  tone?: NavItemTone
  /** The words `tone="critical"` adds to the name. Default "error". */
  toneLabel?: string
  /** A colour square in the icon's place: a calendar, a persona. */
  swatch?: NavItemSwatch
  /** Off: half strength, still in the tab order so its `description` (the reason) can be read. */
  disabled?: boolean
}

/**
 * NavItem: one place in a sidebar (Figma 15:487). Index (folio), icon (20), label (label 14/20),
 * count (folio), 8 / 10 padding, 10 apart, on the 2px corner. Current is the soft primary tile with
 * every part in body ink; resting parts are secondary, faint and label ink, as drawn.
 *
 * A link when it has `href` (or a router link through `render`), otherwise a button. Inside a
 * collapsed `NavSection` it draws as a `RailItem`.
 */
function NavItem({
  label,
  icon,
  index,
  mark,
  count,
  current = false,
  checked,
  onCheckedChange,
  level = 0,
  expanded,
  onExpandedChange,
  action,
  description,
  tone = "neutral",
  toneLabel = "error",
  swatch,
  disabled = false,
  render,
  className,
  style,
  onClick,
  ...props
}: NavItemProps) {
  const section = React.useContext(NavSectionContext)
  // In a section, the section says; alone (the sidebar's pinned Settings), the sidebar's rail does.
  const rail = React.useContext(AppFrameRailContext)
  const collapsed = section?.collapsed ?? rail
  const descriptionId = React.useId()
  const resolved = resolveNavMark(mark ?? count)
  const critical = tone === "critical"
  const name = nameWithMark(label, resolved, critical && toneLabel)

  const checkable = checked !== undefined
  const isLink = Boolean(props.href) || Boolean(render)
  // An item with nowhere to go and children to show is its own disclosure.
  const selfDisclosure = expanded !== undefined && !checkable && !isLink && !onClick
  const role = checkable
    ? section?.checkable === "single"
      ? "menuitemradio"
      : section?.checkable === "multiple"
        ? "menuitemcheckbox"
        : "checkbox"
    : undefined

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
    if (event.defaultPrevented) return
    if (checkable) onCheckedChange?.(section?.checkable === "single" ? true : !checked)
    if (selfDisclosure) onExpandedChange?.(!expanded)
  }

  const ownProps = {
    "aria-label": name,
    "aria-current": current ? ("page" as const) : undefined,
    "aria-checked": checkable ? checked : undefined,
    "aria-expanded": selfDisclosure ? expanded : undefined,
    "aria-disabled": disabled || undefined,
    "aria-describedby": description && !collapsed ? descriptionId : undefined,
    "aria-keyshortcuts": resolved?.kind === "keys" ? resolved.keys : undefined,
    role,
    type: isLink ? undefined : ("button" as const),
    onClick: handleClick,
  }

  const Wrapper = section ? "li" : "div"
  const wrapperRole = section?.checkable ? "none" : undefined

  // Ink per part, as Figma binds it (Default, then Active).
  // On the current tile everything is body ink, a critical item too: critical text on the soft
  // tile falls under the label floor, so there the glyph and the words in the name carry it.
  const ink = {
    index: current ? "text-text-secondary" : "text-text-faint",
    icon: current ? "text-text-body" : critical ? "text-critical-text" : "text-text-secondary",
    label: current ? "text-text-body" : critical ? "text-critical-text" : "text-text-secondary",
    count: current ? "text-text-body" : "text-text-label",
    description: current ? "text-text-secondary" : "text-text-label",
  }

  const content = (
    <>
      {index ? (
        <span data-slot="nav-item-index" aria-hidden="true" className={cn("type-folio shrink-0", ink.index)}>
          {index}
        </span>
      ) : null}
      {checkable ? <CheckMark checked={Boolean(checked)} radio={section?.checkable === "single"} /> : null}
      {icon ? <Icon name={icon} /> : null}
      {swatch ? (
        <span data-slot="nav-item-swatch" aria-hidden="true" className="inline-flex size-5 shrink-0 items-center justify-center">
          <span className={cn("size-2", swatchFill(swatch))} />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span data-slot="nav-item-label" className={cn("type-label truncate", ink.label)}>
          {label}
        </span>
        {description ? (
          <span id={descriptionId} data-slot="nav-item-description" className={cn("type-caption", ink.description)}>
            {description}
          </span>
        ) : null}
      </span>
      {critical ? <Icon name="warning--alt" size="sm" /> : null}
      <span
        data-slot="nav-item-count"
        className={cn(
          "inline-flex shrink-0 items-center empty:hidden",
          // A mouse finds the action over the count: the count steps aside while it shows.
          action && "pointer-fine:group-hover/nav-item:invisible pointer-fine:group-focus-within/nav-item:invisible"
        )}
      >
        <NavMark mark={resolved} placement="inline" className={ink.count} />
      </span>
      {selfDisclosure ? (
        // The item is its own disclosure: the chevron shows which way it opens.
        <span data-slot="nav-item-chevron" aria-hidden="true" className={cn("inline-flex shrink-0 text-text-label transition-[rotate] duration-(--motion-fast) ease-(--motion-ease)", !expanded && "-rotate-90")}>
          <Icon name="chevron--down" size="sm" />
        </span>
      ) : null}
    </>
  )

  const main = useRender({
    defaultTagName: isLink ? "a" : "button",
    render,
    props: mergeProps<"a">(
      {
        className: cn(
          // Padding 8 / 10, gap 10. The start padding grows by one indent per level.
          "flex min-w-0 flex-1 items-center gap-2.5 rounded-sm py-2 ps-[calc(--spacing(2.5)+var(--nav-item-level,0)*var(--c-nav-item-indent))] pe-2.5 text-start select-none",
          // The glyphs take this ink; the index, label and count set their own.
          ink.icon,
          disabled && "pointer-events-none"
        ),
        style: level > 0 ? ({ "--nav-item-level": level } as React.CSSProperties) : undefined,
      },
      props,
      ownProps,
      { children: content }
    ),
    state: { slot: "nav-item-main" },
  })

  if (collapsed) {
    return (
      <Wrapper role={wrapperRole} data-slot="nav-item" data-collapsed="" className="flex">
        <Tooltip>
          <TooltipPrimitive.Trigger
            render={render ?? (isLink ? <a /> : <ButtonPrimitive />)}
            data-slot="nav-item-main"
            data-state={current ? "active" : "default"}
            className={railItemVariants({ state: current ? "active" : "default", className })}
            style={style}
            {...(mergeProps<"a">(props, { ...ownProps, type: undefined }) as TooltipPrimitive.Trigger.Props)}
          >
            {icon ? <Icon name={icon} /> : null}
            <NavMark mark={resolved} placement="below" className="text-text-label" />
          </TooltipPrimitive.Trigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </Wrapper>
    )
  }

  const disclosure =
    expanded !== undefined && !selfDisclosure ? (
      <ButtonPrimitive
        data-slot="nav-item-disclosure"
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
        onClick={() => onExpandedChange?.(!expanded)}
        className="hit-area me-1 inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-text-label transition-[color,background-color] duration-(--motion-fast) ease-(--motion-ease) hover:bg-state-hover hover:text-text-body active:bg-state-pressed"
      >
        <span className={cn("inline-flex transition-[rotate] duration-(--motion-fast) ease-(--motion-ease)", !expanded && "-rotate-90")}>
          <Icon name="chevron--down" size="sm" />
        </span>
      </ButtonPrimitive>
    ) : null

  return (
    <Wrapper
      role={wrapperRole}
      data-slot="nav-item"
      data-current={current ? "" : undefined}
      data-tone={tone}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "group/nav-item relative flex min-w-0 items-center rounded-sm transition-[background-color] duration-(--motion-fast) ease-(--motion-ease)",
        // Hover and pressed are the contract's washes on the row; the current tile keeps its fill.
        "hover:bg-state-hover has-[>[data-slot=nav-item-main]:active]:bg-state-pressed",
        "data-current:bg-primary-soft data-current:hover:bg-primary-soft data-current:has-[>[data-slot=nav-item-main]:active]:bg-primary-soft",
        disabled && "opacity-50",
        className
      )}
      style={style}
    >
      {main}
      {disclosure}
      {action ? (
        <div
          data-slot="nav-item-action"
          className="flex shrink-0 items-center pe-1 pointer-fine:absolute pointer-fine:inset-y-0 pointer-fine:end-1 pointer-fine:pe-0 pointer-fine:opacity-0 pointer-fine:group-hover/nav-item:opacity-100 pointer-fine:group-focus-within/nav-item:opacity-100"
        >
          {action}
        </div>
      ) : null}
    </Wrapper>
  )
}

/** The box a checkable item shows: a hairline square, filled with ink and a check when on (a square in a square, for one-of-many). */
function CheckMark({ checked, radio }: { checked: boolean; radio: boolean }) {
  return (
    <span
      data-slot="nav-item-check"
      data-checked={checked ? "" : undefined}
      aria-hidden="true"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-sm",
        checked && !radio ? "bg-text-body text-surface-ground" : "bg-surface-raised inset-ring inset-ring-text-label"
      )}
    >
      {checked && radio ? <span className="bg-text-body size-2" /> : null}
      {checked && !radio ? (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" className="size-4">
          <path d="M4 8.5 6.75 11.25 12 5.5" />
        </svg>
      ) : null}
    </span>
  )
}

export { NavItem, NavSection }
