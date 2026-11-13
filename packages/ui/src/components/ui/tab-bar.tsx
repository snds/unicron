// Owned component (not generated): the phone's icon-only tab bar, with the scrolled (minimized) form, slide-to-scrub, and the short-screen vertical form.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 20:1657 and 20:1656; no app PR, no DSA record)
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { NavMark, nameWithMark, resolveNavMark, rovingTarget, type NavMarkProp } from "./rail"

/**
 * `tabs`: the items are tabs in a tablist; the arrow keys move the selection (and the content
 * follows), as a scrub does. `links`: the bar is a `nav` of links, for an app whose sections are
 * addresses; the arrow keys move focus and Enter follows the link.
 */
export type TabBarNavigation = "tabs" | "links"
export type TabBarOrientation = "horizontal" | "vertical"

interface TabBarContextValue {
  /** The tab drawn as active: the value, or the one under a scrubbing finger. */
  shown: string | undefined
  /** The real value. */
  value: string | undefined
  navigation: TabBarNavigation
  orientation: TabBarOrientation
  minimized: boolean
  press: (value: string) => void
}

const TabBarContext = React.createContext<TabBarContextValue | null>(null)

/** A size token read off the element, in px, or the fallback without the stylesheet. */
function readLength(el: Element, name: string, fallback: number): number {
  if (typeof getComputedStyle !== "function") return fallback
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const match = /^([\d.]+)(px|rem)$/.exec(raw)
  if (!match) return fallback
  const n = Number.parseFloat(match[1])
  if (!Number.isFinite(n)) return fallback
  return match[2] === "px" ? n : n * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
}

const SCRUB_FALLBACK_SLOP = 8

function barItems(root: HTMLElement | null, visibleOnly = false): HTMLElement[] {
  if (!root) return []
  const all = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="tab-bar-item"]'))
  return visibleOnly ? all.filter((el) => el.dataset.collapsed === undefined) : all
}

export type TabBarProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  /** What the bar is, for assistive tech ("Sections"). */
  label: string
  /** The section showing. */
  value?: string
  /** A tap, a scrub, or an arrow key picked another section. With `links`, the link also navigates. */
  onValueChange?: (value: string) => void
  /**
   * A second tap on the active tab (cross-app decisions §8): go back to the section's root, scroll
   * to the top and fetch again. On a minimized bar the one tab showing is the active one, so this
   * is also how a scrolled screen comes back to the top.
   */
  onReselect?: (value: string) => void
  /** `tabs` (default) or `links`. */
  navigation?: TabBarNavigation
  /**
   * `horizontal` (the phone's bottom row: the bar fills the space between search and create) or
   * `vertical` (short screens: a 48px column at the trailing edge, contract 5.1b #11).
   */
  orientation?: TabBarOrientation
  /** The scrolled form: only the active tab, 48 wide (48 high when vertical). The frame drives it. */
  minimized?: boolean
}

/**
 * TabBar: the phone's floating bar of sections (Figma 20:1657). Icon-only tabs on the raised
 * surface with a hairline, 4px padding and gap, 48 high; the tabs share the width. The active tab
 * is the soft primary tile with its icon in body ink (contract 9.9).
 *
 * - Slide along the bar to scrub: the active tab follows the finger and is picked on lift. The
 *   arrow keys do the same from the keyboard (Home, End too).
 * - `minimized` shrinks the bar to the active tab on `--motion-state`; under reduced motion it
 *   snaps.
 * - Fewer than two sections: there is nothing to switch between, so it draws nothing.
 */
function TabBar({
  label,
  value,
  onValueChange,
  onReselect,
  navigation = "tabs",
  orientation = "horizontal",
  minimized = false,
  className,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
  onKeyDown,
  ...props
}: TabBarProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [scrub, setScrub] = React.useState<string | null>(null)
  const scrubRef = React.useRef<string | null>(null)
  const drag = React.useRef<{ id: number; x: number; y: number; active: boolean; slop: number } | null>(null)
  const swallowClick = React.useRef(false)
  const horizontal = orientation === "horizontal"
  const sections = React.Children.toArray(children).filter(React.isValidElement).length

  const setScrubValue = (next: string | null) => {
    scrubRef.current = next
    setScrub(next)
  }

  /** Pick a section: tabs report it; links are followed, as if tapped. */
  const commit = React.useCallback(
    (next: string) => {
      if (navigation === "links") {
        const el = barItems(ref.current).find((item) => item.dataset.value === next)
        el?.click()
        return
      }
      onValueChange?.(next)
    },
    [navigation, onValueChange]
  )

  const press = React.useCallback(
    (pressed: string) => {
      if (pressed === value) onReselect?.(pressed)
      else onValueChange?.(pressed)
    },
    [value, onReselect, onValueChange]
  )

  // Tabs: one stop in the tab order, the selected tab (or the first).
  React.useLayoutEffect(() => {
    if (navigation !== "tabs") return
    const items = barItems(ref.current)
    const stop = items.find((el) => el.dataset.value === value) ?? items[0]
    for (const el of items) el.tabIndex = el === stop ? 0 : -1
  })

  const context = React.useMemo<TabBarContextValue>(
    () => ({ shown: scrub ?? value, value, navigation, orientation, minimized, press }),
    [scrub, value, navigation, orientation, minimized, press]
  )

  if (sections < 2) return null

  const itemAt = (x: number, y: number) => {
    const items = barItems(ref.current, true)
    if (items.length === 0) return undefined
    const along = horizontal ? x : y
    for (const el of items) {
      const box = el.getBoundingClientRect()
      const end = horizontal ? box.right : box.bottom
      // Before the first tab counts as the first; between two, the one ahead.
      if (along < end) return el
    }
    // Past the end: the last tab, so a slide off the bar still lands somewhere.
    return items[items.length - 1]
  }

  const Root = navigation === "links" ? "nav" : "div"

  return (
    <TabBarContext.Provider value={context}>
      <Root
        ref={ref}
        data-slot="tab-bar"
        data-orientation={orientation}
        data-navigation={navigation}
        data-minimized={minimized ? "" : undefined}
        data-scrubbing={scrub !== null ? "" : undefined}
        role={navigation === "tabs" ? "tablist" : undefined}
        aria-label={label}
        aria-orientation={navigation === "tabs" ? orientation : undefined}
        className={cn(
          // Figma 20:1657: raised surface, a 1px rule inside the box, 4px padding and gap, the 2px corner.
          "rule-box flex shrink-0 gap-1 rounded-sm bg-surface-raised p-1 select-none",
          // The finger owns a slide along the bar; the page does not scroll or zoom from it.
          "touch-none",
          // Minimizing moves the bar's share of the row and the gaps on the state role.
          "transition-[flex-grow,flex-basis,gap] duration-(--motion-state) ease-(--motion-ease-move)",
          horizontal ? "h-control min-w-0 grow basis-0 flex-row" : "w-control flex-col",
          minimized && "gap-0 overflow-hidden",
          minimized && horizontal && "grow-0 basis-control",
          className
        )}
        onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => {
          onPointerDown?.(event)
          if (event.defaultPrevented || minimized || event.button !== 0) return
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            active: false,
            slop: readLength(event.currentTarget, "--c-tab-bar-scrub-slop", SCRUB_FALLBACK_SLOP),
          }
        }}
        onPointerMove={(event: React.PointerEvent<HTMLDivElement>) => {
          onPointerMove?.(event)
          const d = drag.current
          if (!d || d.id !== event.pointerId) return
          if (!d.active) {
            const moved = horizontal ? event.clientX - d.x : event.clientY - d.y
            if (Math.abs(moved) <= d.slop) return
            d.active = true
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }
          const el = itemAt(event.clientX, event.clientY)
          const next = el?.dataset.value ?? null
          if (next !== scrubRef.current) setScrubValue(next)
        }}
        onPointerUp={(event: React.PointerEvent<HTMLDivElement>) => {
          onPointerUp?.(event)
          const d = drag.current
          drag.current = null
          if (!d?.active) return
          const landed = scrubRef.current
          setScrubValue(null)
          // Pick first (a link's own click must not be swallowed), then swallow the click the lift makes.
          if (landed && landed !== value) commit(landed)
          swallowClick.current = true
          setTimeout(() => {
            swallowClick.current = false
          }, 0)
        }}
        onPointerCancel={(event: React.PointerEvent<HTMLDivElement>) => {
          onPointerCancel?.(event)
          drag.current = null
          setScrubValue(null)
        }}
        onClickCapture={(event: React.MouseEvent<HTMLDivElement>) => {
          onClickCapture?.(event)
          if (!swallowClick.current) return
          swallowClick.current = false
          event.preventDefault()
          event.stopPropagation()
        }}
        onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || minimized) return
          const items = barItems(ref.current, true)
          const target = rovingTarget(items, document.activeElement as HTMLElement | null, event.key, orientation)
          if (!target) return
          event.preventDefault()
          target.focus()
          // Tabs follow focus, as a scrub does. Links wait for Enter.
          if (navigation === "tabs" && target.dataset.value && target.dataset.value !== value) onValueChange?.(target.dataset.value)
        }}
        {...props}
      >
        {children}
      </Root>
    </TabBarContext.Provider>
  )
}

export type TabBarItemProps = Omit<useRender.ComponentProps<"button">, "children" | "value" | "aria-label"> & {
  /** Which section. */
  value: string
  /** The section's glyph, at 20px. The bar shows no labels on a phone. */
  icon: IconName
  /** The section's name: the tab's accessible name, with the mark's words after it. */
  label: string
  /** A count or a square at the icon's corner (the mark every navigation item shares). */
  mark?: NavMarkProp
  /** With `navigation="links"`: where it goes. Or pass a router link as `render`. */
  href?: string
}

/**
 * TabBarItem: one section in a `TabBar` (Figma 20:1656 "Dock Tab", icon only). The tabs share the
 * bar's width and fill its height (40); on a coarse pointer each takes a 44px touch. Active: the
 * soft primary tile, the icon in body ink. Resting: the icon in label ink, the contract's washes
 * under hover and press (§6).
 */
function TabBarItem({ value, icon, label, mark, render, className, onClick, ...props }: TabBarItemProps) {
  const bar = React.useContext(TabBarContext)
  const navigation = bar?.navigation ?? "tabs"
  const vertical = bar?.orientation === "vertical"
  const active = bar?.shown === value
  const selected = bar?.value === value
  const collapsed = Boolean(bar?.minimized) && !selected
  const resolved = resolveNavMark(mark)
  const isLink = navigation === "links"

  return useRender({
    defaultTagName: isLink ? "a" : "button",
    render,
    props: mergeProps<"button">(
      {
        className: cn(
          "hit-area relative inline-flex min-w-0 shrink items-center justify-center rounded-sm text-text-label",
          // Colours answer at once (fast); folding away when minimized moves on the state role.
          "[transition:color_var(--motion-fast)_var(--motion-ease),background-color_var(--motion-fast)_var(--motion-ease),flex-grow_var(--motion-state)_var(--motion-ease-move),height_var(--motion-state)_var(--motion-ease-move),opacity_var(--motion-state)_var(--motion-ease-move),visibility_var(--motion-state)]",
          "hover:bg-state-hover active:bg-state-pressed",
          vertical ? "h-10 w-full" : "h-full grow basis-0",
          active && "bg-primary-soft text-text-body hover:bg-primary-soft active:bg-primary-soft",
          // Minimized: the other tabs fold away and leave the tab order.
          collapsed && (vertical ? "invisible h-0 opacity-0" : "invisible grow-0 opacity-0"),
          className
        ),
        children: <TabBarItemIcon icon={icon} mark={resolved} />,
        type: isLink ? undefined : "button",
        role: isLink ? undefined : "tab",
        "aria-selected": isLink ? undefined : selected,
        "aria-current": isLink && selected ? "page" : undefined,
        "aria-label": nameWithMark(label, resolved),
        "data-value": value,
        "data-active": active ? "" : undefined,
        "data-collapsed": collapsed ? "" : undefined,
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event)
          if (event.defaultPrevented) return
          bar?.press(value)
        },
      } as React.ComponentProps<"button">,
      props
    ),
    state: { slot: "tab-bar-item" },
  })
}

/** The icon, with the mark at its top right. */
function TabBarItemIcon({ icon, mark }: { icon: IconName; mark: ReturnType<typeof resolveNavMark> }) {
  return (
    <span data-slot="tab-bar-item-icon" className="relative inline-flex">
      <Icon name={icon} />
      <NavMark mark={mark} placement="corner" />
    </span>
  )
}

export { TabBar, TabBarItem }
