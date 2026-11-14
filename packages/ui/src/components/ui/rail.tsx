// Owned component (not generated): the collapsed rail (an icon over a count), and the one mark every navigation item carries.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 44:106; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { formatCount } from "../../lib/format"
import { Icon, type IconName } from "../icon"
import { Kbd } from "./kbd"
import { Tooltip, TooltipContent } from "./tooltip"

/* ── The mark ────────────────────────────────────────────────────────────────────────────────── */

/** `neutral`: a plain fact. `needs-you`: something there waits on the person (the yellow). */
export type NavMarkTone = "neutral" | "needs-you"

/**
 * What a navigation item says about its place, beside its name. One shape for `TabBarItem`,
 * `TopTab`, `RailItem`, `NavItem` and `FloatButton`:
 *
 * - a number, or `{ count }`: how many (unread, items, waiting). Drawn as cross-app decisions §13
 *   writes counts: `07`, `12`, `248`, `1,204`; at an icon's corner it stops at `99+`.
 * - `{ square: true, label }`: something with no number (an update is ready). `label` says what.
 * - `{ keys }`: the key that reaches the place ("/" on Search), drawn as a `Kbd`.
 *
 * The words join the item's accessible name ("Inbox, 12 unread"): `label` when given, otherwise
 * the number, or "{n} waiting on you" in the needs-you tone. A count of 0 draws nothing.
 */
export type NavMarkProp =
  | number
  | { count: number; tone?: NavMarkTone; label?: string }
  | { square: true; tone?: NavMarkTone; label: string }
  | { keys: string; label?: string }

/** A mark, read once: what to draw and what to say. */
export interface NavMarkResolved {
  kind: "count" | "square" | "keys"
  tone: NavMarkTone
  /** The number, for a count. */
  count?: number
  /** The keys, for a key hint. */
  keys?: string
  /** What joins the item's name; empty for a key hint, which rides in `aria-keyshortcuts`. */
  words: string
}

/**
 * A count the way cross-app decisions §13 writes one: two digits (`07`), three from 100 (`248`),
 * a comma from 1,000 (`1,204`). `cap` stops at `99+`, for a mark at an icon's corner.
 */
export function formatNavCount(count: number, { cap = false }: { cap?: boolean } = {}): string {
  return formatCount(count, { cap })
}

/** Reads a mark prop. Null when there is nothing to draw (no mark, or a count of 0). */
export function resolveNavMark(mark: NavMarkProp | undefined | null): NavMarkResolved | null {
  if (mark === undefined || mark === null) return null
  if (typeof mark === "number") return resolveNavMark({ count: mark })
  if ("keys" in mark) {
    if (!mark.keys) return null
    return { kind: "keys", tone: "neutral", keys: mark.keys, words: mark.label ?? "" }
  }
  if ("square" in mark) {
    return { kind: "square", tone: mark.tone ?? "neutral", words: mark.label }
  }
  const n = Math.max(0, Math.floor(mark.count))
  if (n === 0) return null
  const tone = mark.tone ?? "neutral"
  const said = n.toLocaleString("en-US")
  return { kind: "count", tone, count: n, words: mark.label ?? (tone === "needs-you" ? `${said} waiting on you` : said) }
}

/** "Inbox, 12 unread": an item's name with its mark's words, and any words of its own after. */
export function nameWithMark(label: string, mark: NavMarkResolved | null, ...more: (string | false | null | undefined)[]): string {
  return [label, mark?.words, ...more].filter(Boolean).join(", ")
}

/** Where a host draws its mark. */
export type NavMarkPlacement = "inline" | "corner" | "below"

const SQUARE = {
  // An ink square: the strongest neutral there is, so a quiet "something new" still shows.
  neutral: "bg-foreground",
  // The yellow, inside a hairline of the ink that sits on it: on stone the yellow alone has no
  // lightness against the surface (tokens hand-off §8.4), so the edge is what shows there.
  "needs-you": "on-needs-you bg-needs-you-fill inset-ring inset-ring-needs-you-on-fill",
} as const

/**
 * The mark itself, hidden from assistive tech: its words are in the host's name. The host passes
 * `className` for a count's ink (the overline and folio roles carry a default ink of their own, so
 * the colour has to sit on the same element).
 *
 * - `inline`: after a label, in the folio role (`NavItem`, `TopTab`).
 * - `corner`: at an icon's top right, an overline-high count (`TabBarItem`, `FloatButton`).
 * - `below`: under an icon, in the overline role (`RailItem`).
 */
export function NavMark({
  mark,
  placement,
  type,
  className,
}: {
  mark: NavMarkResolved | null
  placement: NavMarkPlacement
  /** The type role of a count: folio inline, overline below and at a corner. A Top Tab's count is overline, as its label is. */
  type?: "folio" | "overline"
  className?: string
}) {
  if (!mark) return null
  if (mark.kind === "keys") {
    return (
      <Kbd data-kind="keys" aria-hidden="true">
        {mark.keys}
      </Kbd>
    )
  }
  if (mark.kind === "square") {
    return (
      <span
        data-slot="nav-mark"
        data-kind="square"
        data-tone={mark.tone}
        aria-hidden="true"
        className={cn(
          "inline-block size-(--c-nav-mark-square) shrink-0",
          SQUARE[mark.tone],
          placement === "corner" && "absolute -top-0.5 -right-0.5",
          className
        )}
      />
    )
  }
  const needsYou = mark.tone === "needs-you"
  const text = formatNavCount(mark.count ?? 0, { cap: placement === "corner" })
  if (placement === "corner") {
    return (
      <span
        data-slot="nav-mark"
        data-kind="count"
        data-tone={mark.tone}
        aria-hidden="true"
        className={cn(
          // One overline line high, the digits set tight: a count, not a badge with its own box rules.
          "type-overline absolute -top-2 left-3 inline-flex h-(--c-nav-mark-badge-height) min-w-(--c-nav-mark-badge-height) items-center justify-center rounded-sm px-0.5",
          // Inverted ink, as a current float button is; the yellow when it waits on the person.
          needsYou ? "on-needs-you bg-needs-you-fill text-needs-you-on-fill" : "bg-foreground text-background",
          className
        )}
      >
        {text}
      </span>
    )
  }
  return (
    <span
      data-slot="nav-mark"
      data-kind="count"
      data-tone={mark.tone}
      aria-hidden="true"
      className={cn(
        (type ?? (placement === "inline" ? "folio" : "overline")) === "folio" ? "type-folio" : "type-overline",
        "shrink-0",
        // Waiting on the person: the yellow behind the number, its own ink on it (any ink the host passed gives way).
        needsYou ? "on-needs-you rounded-sm bg-needs-you-fill px-1 text-needs-you-on-fill" : className
      )}
    >
      {text}
    </span>
  )
}

/* ── Roving focus, shared by the bars ────────────────────────────────────────────────────────── */

/**
 * The next item for an arrow key along an orientation, wrapping at the ends; Home and End jump.
 * Undefined for any other key. `items` are in document order.
 */
export function rovingTarget<T extends HTMLElement>(
  items: readonly T[],
  current: T | null,
  key: string,
  orientation: "horizontal" | "vertical"
): T | undefined {
  if (items.length === 0) return undefined
  const next = orientation === "vertical" ? "ArrowDown" : "ArrowRight"
  const prev = orientation === "vertical" ? "ArrowUp" : "ArrowLeft"
  const at = current ? items.indexOf(current) : -1
  if (key === "Home") return items[0]
  if (key === "End") return items[items.length - 1]
  if (key === next) return items[(at + 1 + items.length) % items.length]
  if (key === prev) return items[(at - 1 + items.length) % items.length]
  return undefined
}

/* ── Rail ────────────────────────────────────────────────────────────────────────────────────── */

export type RailItemState = "default" | "active" | "live"

const RailContext = React.createContext<{ tooltipSide: "left" | "right" }>({ tooltipSide: "left" })

/**
 * The collapsed form of a panel or a sidebar: a column of `RailItem`s, 8px apart. It is a toolbar,
 * so it is one stop in the tab order and the arrow keys move along it (Home, End). Needs an
 * `aria-label`. `edge` is the side of the screen it sits on, so the items' tooltips open away from
 * it: `right` (Warpcore's context panel, the default) or `left` (a sidebar).
 */
function Rail({
  edge = "right",
  className,
  onKeyDown,
  children,
  ...props
}: React.ComponentProps<"div"> & { edge?: "left" | "right" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const context = React.useMemo(() => ({ tooltipSide: edge === "right" ? ("left" as const) : ("right" as const) }), [edge])

  // One stop in the tab order: the active item, or the first. Kept true after every render.
  React.useLayoutEffect(() => {
    const items = railItems(ref.current)
    if (items.length === 0) return
    const focused = items.find((el) => el === document.activeElement)
    const stop = focused ?? items.find((el) => el.dataset.state === "active") ?? items[0]
    for (const el of items) el.tabIndex = el === stop ? 0 : -1
  })

  return (
    <RailContext.Provider value={context}>
      <div
        ref={ref}
        data-slot="rail"
        role="toolbar"
        aria-orientation="vertical"
        className={cn("flex w-(--c-rail-item-width) shrink-0 flex-col items-center gap-2", className)}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          const items = railItems(ref.current)
          const target = rovingTarget(items, document.activeElement as HTMLElement | null, event.key, "vertical")
          if (!target) return
          event.preventDefault()
          for (const el of items) el.tabIndex = el === target ? 0 : -1
          target.focus()
        }}
        {...props}
      >
        {children}
      </div>
    </RailContext.Provider>
  )
}

function railItems(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>('[data-slot="rail-item"]:not([disabled])'))
}

/**
 * A rail item's classes, for something drawn as one (NavItem in a collapsed NavSection). Figma
 * 44:106: 48 × 56, the icon over the count, 4px apart, on the 2px corner. `active` is the soft
 * primary tile with the icon in primary text; `live` puts the icon and the count in the live ink.
 * Hover and pressed are the contract's washes (§6).
 */
const railItemCva = cva(
  "group/rail-item relative inline-flex h-(--c-rail-item-height) w-(--c-rail-item-width) shrink-0 flex-col items-center justify-center gap-1 rounded-sm select-none transition-[color,background-color] duration-(--motion-fast) ease-(--motion-ease) hover:bg-state-hover active:bg-state-pressed disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      state: {
        default: "text-foreground",
        active: "bg-primary-soft text-primary-text hover:bg-primary-soft active:bg-primary-soft",
        live: "text-secondary-live",
      },
    },
    defaultVariants: { state: "default" },
  }
)

/** Merged, so the active tile's own hover and pressed fills replace the washes. */
function railItemVariants({ state = "default", className }: { state?: RailItemState | null; className?: string } = {}): string {
  return cn(railItemCva({ state }), className)
}

/** The ink of the count under the icon, per state: label ink, except a live item's. */
const RAIL_COUNT_INK: Record<RailItemState, string> = {
  default: "text-muted-foreground",
  active: "text-muted-foreground",
  live: "text-secondary-live",
}

export type RailItemProps = Omit<TooltipPrimitive.Trigger.Props, "children" | "render" | "className"> & {
  /** The place or panel it stands for. Its accessible name and its tooltip. */
  label: string
  icon: IconName
  /**
   * `default`; `active`: the panel or place showing (says `aria-current`, `true` unless you pass
   * `aria-current="page"`); `live`: something there is running now (Figma calls it Alert).
   */
  state?: RailItemState
  /** The count under the icon, or a square, in the mark API every navigation item shares. */
  mark?: NavMarkProp
  /** Shorthand for `mark={count}`. */
  count?: number
  /** Words for the live state, joined to the name. Default "live". */
  liveLabel?: string
  className?: string
}

/**
 * RailItem: an icon over a count, 48 × 56. A button with a name; the label shows as a tooltip,
 * away from the screen's edge. Inside a `Rail` the arrow keys move between items.
 */
function RailItem({
  label,
  icon,
  state = "default",
  mark,
  count,
  liveLabel = "live",
  className,
  "aria-current": ariaCurrent,
  ...props
}: RailItemProps) {
  const { tooltipSide } = React.useContext(RailContext)
  const resolved = resolveNavMark(mark ?? count)
  const name = nameWithMark(label, resolved, state === "live" && liveLabel)
  return (
    <Tooltip>
      <TooltipPrimitive.Trigger
        render={<ButtonPrimitive />}
        data-slot="rail-item"
        data-state={state}
        aria-label={name}
        aria-current={ariaCurrent ?? (state === "active" ? "true" : undefined)}
        className={railItemVariants({ state, className })}
        {...props}
      >
        <Icon name={icon} />
        <NavMark mark={resolved} placement="below" className={RAIL_COUNT_INK[state]} />
      </TooltipPrimitive.Trigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  )
}

export { Rail, RailItem, railItemVariants }
