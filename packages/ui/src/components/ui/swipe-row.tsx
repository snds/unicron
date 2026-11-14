// Owned component (not generated): a list row that swipes to reveal its actions, with every action also in the row's menu.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 25:2042; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"

import { rubberBand } from "../../lib/motion/rubber-band"
import { useReducedMotion } from "../../lib/motion/use-reduced-motion"
import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { Button } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"

/** Figma's Tone: the outermost trailing tile and the leading one are `primary`; the rest `neutral`. */
export type SwipeActionTone = "primary" | "neutral" | "needs-you"

interface SwipeRowActionBase {
  /** The words on the tile and in the row's menu, in sentence case ("Archive"). The tile sets the capitals. */
  label: string
  /** A Carbon name, drawn at 20 px above the label. */
  icon: IconName
  /** Default: `primary` for the outermost trailing action and for the leading one, `neutral` for the rest. */
  tone?: SwipeActionTone
  /** Shown, dimmed, and never run: not by a tap, not by a full swipe, not from the menu. */
  disabled?: boolean
}

/** An action a tap, the menu or (when `reversible`) a full swipe runs. */
export interface SwipeRowRunAction extends SwipeRowActionBase {
  confirm?: false
  onAction: () => void
  /**
   * The action can be taken back (archive, mark read, flag). Only a reversible action runs on a
   * full swipe; any other opens the row and stops, so the person taps the tile on purpose.
   */
  reversible?: boolean
}

/**
 * An approval (a sign-in, a merge). Nothing in the row ever runs it: a full swipe, a tap on its
 * tile and its menu item each call `onReview`, which opens the review where the person decides.
 */
export interface SwipeRowConfirmAction extends SwipeRowActionBase {
  confirm: true
  onReview: () => void
}

export type SwipeRowAction = SwipeRowRunAction | SwipeRowConfirmAction

export type SwipeRowSide = "leading" | "trailing"

/** What a tap or a menu item does: run it, or for an approval, open its review. */
function activate(action: SwipeRowAction) {
  if (action.disabled) return
  if (action.confirm) action.onReview()
  else action.onAction()
}

/** A full swipe may finish on this action: a reversible one runs, an approval opens its review. */
function takesFullSwipe(action: SwipeRowAction | undefined): action is SwipeRowAction {
  if (!action || action.disabled) return false
  return action.confirm === true || action.reversible === true
}

// ── The tile ─────────────────────────────────────────────────────────────────────────────────

const swipeActionVariants = cva(
  // Figma 25:2042: a fixed-width tile, no padding, no radius, content centred, the icon 6 px above
  // the overline label. It stretches to the row's height (Figma's 96 fits no List Row height).
  "group/swipe-action flex w-(--c-swipe-action-width) shrink-0 flex-col items-center justify-center gap-1.5 self-stretch type-overline select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        // The outermost action, which a full swipe runs: the identity fill. Pressed is the fill at 80%.
        primary: "bg-primary text-primary-foreground active:bg-primary/80",
        // Raised surface, a hairline on its left, ink. Pressed is the pressed wash laid on the
        // surface, so the tile stays opaque over the row's ground.
        neutral: "rule-l bg-surface-raised text-foreground active:bg-[color-mix(in_oklab,var(--text-body)_10%,var(--surface-raised))]",
        // The yellow. Figma draws the tone and does not say what it is for: an approval's tile,
        // which only ever opens its review. Focus inside it takes the yellow's ink.
        "needs-you": "on-needs-you bg-needs-you-fill text-needs-you-on-fill",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
)

export type SwipeActionProps = Omit<ButtonPrimitive.Props, "children"> & {
  tone?: SwipeActionTone
  icon: IconName
  label: string
  /** The outermost tile: it grows past its width as a full swipe goes on, so the swipe shows what it reaches. */
  grow?: boolean
}

/**
 * SwipeAction: one action tile behind a swiped row (Figma 13). The tile is a button, but it is
 * only reached by a swipe; SwipeRow keeps it out of the tab order and puts the same action in the
 * row's menu, which is the keyboard and screen reader path.
 */
function SwipeAction({ tone = "neutral", icon, label, grow = false, className, ...props }: SwipeActionProps) {
  return (
    <ButtonPrimitive
      data-slot="swipe-action"
      data-tone={tone}
      className={cn(swipeActionVariants({ tone }), grow && "min-w-(--c-swipe-action-width) flex-1", className)}
      {...props}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </ButtonPrimitive>
  )
}

// ── The row's menu (shared with ListRow) ─────────────────────────────────────────────────────

interface SwipeRowMenuValue {
  /** Every action of the row, leading first, then trailing from the inside out. */
  actions: readonly SwipeRowAction[]
  /** What a menu item does: the same as a tap on the tile. */
  activate: (action: SwipeRowAction) => void
  /** A row part that draws the menu itself (ListRow) claims it, so SwipeRow draws no second button. */
  claim: () => () => void
}

const SwipeRowMenuContext = React.createContext<SwipeRowMenuValue | null>(null)

/** For a row part inside a SwipeRow (ListRow): the swipe actions, to list in its own menu. */
function useSwipeRowActions(): SwipeRowMenuValue | null {
  const ctx = React.useContext(SwipeRowMenuContext)
  const claim = ctx?.claim
  React.useLayoutEffect(() => claim?.(), [claim])
  return ctx
}

/** The swipe actions as menu items, for a row part's own overflow menu. */
function SwipeRowMenuItems({ menu }: { menu: SwipeRowMenuValue }) {
  return menu.actions.map((action, i) => (
    <DropdownMenuItem key={`${i}-${action.label}`} disabled={action.disabled} onClick={() => menu.activate(action)}>
      <Icon name={action.icon} />
      {action.label}
    </DropdownMenuItem>
  ))
}

// ── Thresholds, read from the knobs ──────────────────────────────────────────────────────────

const FALLBACK = { reveal: 24, edge: 24, tile: 80, snap: 0.5, full: 0.6 }

function readKnob(el: Element, name: string): string {
  if (typeof getComputedStyle !== "function") return ""
  return getComputedStyle(el).getPropertyValue(name).trim()
}

function readLength(el: Element, name: string, fallback: number): number {
  const match = /^(-?[\d.]+)(px|rem)$/.exec(readKnob(el, name))
  if (!match) return fallback
  const n = Number.parseFloat(match[1])
  if (!Number.isFinite(n)) return fallback
  if (match[2] === "px") return n
  const root = Number.parseFloat(getComputedStyle(el.ownerDocument.documentElement).fontSize)
  return n * (Number.isFinite(root) && root > 0 ? root : 16)
}

function readShare(el: Element, name: string, fallback: number): number {
  const n = Number.parseFloat(readKnob(el, name))
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : fallback
}

interface Measure {
  /** The row's width, for the full swipe. */
  width: number
  tile: number
  reveal: number
  edge: number
  snap: number
  full: number
}

function measure(el: HTMLElement): Measure {
  return {
    width: el.getBoundingClientRect().width,
    tile: readLength(el, "--c-swipe-action-width", FALLBACK.tile),
    reveal: readLength(el, "--c-swipe-row-reveal", FALLBACK.reveal),
    edge: readLength(el, "--c-swipe-row-edge", FALLBACK.edge),
    snap: readShare(el, "--c-swipe-row-snap", FALLBACK.snap),
    full: readShare(el, "--c-swipe-row-full", FALLBACK.full),
  }
}

interface Drag extends Measure {
  pointerId: number
  x: number
  y: number
  /** The offset the row rested at when the press began. */
  base: number
  /** Started this far from the screen's left edge or more: a right swipe may reach the leading action. */
  clearOfEdge: boolean
  /** Moving: the pointer went past `reveal` sideways. Until then a press is a tap. */
  engaged: boolean
  /** The `reveal` distance taken off the travel, so the row does not jump when it starts to move. */
  shift: number
}

export type SwipeRowProps = Omit<React.ComponentProps<"div">, "children"> & {
  children: React.ReactNode
  /** The one action a right swipe reaches (read, favourite, review, open). */
  leading?: SwipeRowAction
  /**
   * What a left swipe reveals, in the order drawn from the content outwards. The last is the
   * outermost: the one a full swipe reaches, and `primary` unless it says otherwise.
   */
  trailing?: readonly SwipeRowAction[]
  /** Called when the row comes to rest open on a side, or closed (`null`). */
  onOpenChange?: (side: SwipeRowSide | null) => void
  /** Start open on a side, as if swiped there (a specimen, a restored state). */
  defaultOpen?: SwipeRowSide
  /** The name of the menu button SwipeRow draws when its content does not draw one (ListRow does). */
  menuLabel?: string
}

/**
 * SwipeRow: wraps one row (a ListRow) and gives it swipe actions (contract §6.4).
 *
 * - A left swipe reveals `trailing`; past half their width the row snaps open, under it it closes.
 *   Past 60% of the row's width a full swipe runs the outermost action, only when it is
 *   `reversible`; otherwise the row opens and stops. A right swipe reaches `leading` the same way,
 *   and only when it starts 24 px clear of the screen's left edge (the system's back gesture).
 * - An action marked `confirm` (an approval) is never run by the row: every way in opens its review.
 * - Past the furthest it may go the row resists (`rubberBand`). It settles on the spring-settle
 *   motion role, and snaps under reduced motion.
 * - Pointer events only, with `touch-action: pan-y`, so a vertical drag still scrolls the list.
 * - Every action is also in the row's menu: the overflow button (shown on hover and focus with a
 *   mouse, always on touch), the Menu key or Shift+F10, and a right click. A ListRow inside draws
 *   that menu itself; any other content gets SwipeRow's own button.
 * - Escape, or a press outside the row, closes it.
 */
const NO_ACTIONS: readonly SwipeRowAction[] = []

function SwipeRow({
  children,
  leading,
  trailing = NO_ACTIONS,
  onOpenChange,
  defaultOpen,
  menuLabel = "More actions",
  className,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
  onKeyDown,
  ...props
}: SwipeRowProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [offset, setOffsetState] = React.useState(0)
  const offsetRef = React.useRef(0)
  const [dragging, setDragging] = React.useState(false)
  const drag = React.useRef<Drag | null>(null)
  const swallowClick = React.useRef(false)
  const [claims, setClaims] = React.useState(0)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [armed, setArmed] = React.useState(false)
  const claim = React.useCallback(() => {
    setClaims((n) => n + 1)
    return () => setClaims((n) => n - 1)
  }, [])

  const setOffset = React.useCallback((next: number) => {
    offsetRef.current = next
    setOffsetState(next)
  }, [])

  // Opened on mount when asked: the tiles' width is a knob, read once the row is in the page.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!defaultOpen || !root) return
    const tile = measure(root).tile
    if (defaultOpen === "trailing" && trailing.length > 0) setOffset(-trailing.length * tile)
    if (defaultOpen === "leading" && leading) setOffset(tile)
    // Only the first mount opens it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const restSide: SwipeRowSide | null = dragging ? null : offset < 0 ? "trailing" : offset > 0 ? "leading" : null
  const reported = React.useRef<SwipeRowSide | null>(null)
  React.useEffect(() => {
    if (dragging || reported.current === restSide) return
    reported.current = restSide
    onOpenChange?.(restSide)
  }, [dragging, restSide, onOpenChange])

  const outer = trailing.at(-1)
  const actions = React.useMemo(() => [...(leading ? [leading] : []), ...trailing], [leading, trailing])

  const close = React.useCallback(() => setOffset(0), [setOffset])

  const menu = React.useMemo<SwipeRowMenuValue>(
    () => ({
      actions,
      activate(action) {
        close()
        activate(action)
      },
      claim,
    }),
    [actions, close, claim]
  )

  // Open, a press anywhere outside the row closes it.
  React.useEffect(() => {
    if (!restSide) return
    const root = rootRef.current
    const doc = root?.ownerDocument
    if (!root || !doc) return
    const onDown = (event: PointerEvent) => {
      if (!root.contains(event.target as Node)) close()
    }
    doc.addEventListener("pointerdown", onDown, true)
    return () => doc.removeEventListener("pointerdown", onDown, true)
  }, [restSide, close])

  /** Where the row may be for a raw travel: 0 on a side with nothing, resisting past its furthest. */
  function constrain(raw: number, d: Drag): number {
    const side = raw < 0 ? trailing : leading ? [leading] : []
    if (raw === 0 || side.length === 0) return 0
    if (raw > 0 && d.base === 0 && !d.clearOfEdge) return 0
    const travel = Math.abs(raw)
    const open = side.length * d.tile
    const last = raw < 0 ? outer : leading
    const furthest = takesFullSwipe(last) ? Math.max(open, d.width) : open
    const shown = travel <= furthest ? travel : furthest + rubberBand(travel - furthest, d.tile / 2)
    return Math.sign(raw) * shown
  }

  /** Where the row comes to rest when let go at `at`, and what a full swipe runs. */
  function settle(at: number, d: Drag) {
    const side = at < 0 ? trailing : at > 0 && leading ? [leading] : []
    if (side.length === 0) return close()
    const travel = Math.abs(at)
    const open = side.length * d.tile
    const last = at < 0 ? outer : leading
    if (d.width > 0 && travel >= d.full * d.width && takesFullSwipe(last)) {
      close()
      activate(last)
      return
    }
    setOffset(travel >= d.snap * open ? Math.sign(at) * open : 0)
  }

  function end(event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const d = drag.current
    if (!d || event.pointerId !== d.pointerId) return
    drag.current = null
    if (!d.engaged) return
    setDragging(false)
    setArmed(false)
    // A mouse sends the click that ends a drag in the same task as its pointerup; a touch that moved
    // sends none. Either way the flag is gone by the next task, so no later click is lost.
    swallowClick.current = !cancelled
    if (!cancelled) setTimeout(() => (swallowClick.current = false), 0)
    if (cancelled) setOffset(d.base)
    else settle(offsetRef.current, d)
  }

  const handlers = {
    onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
      onPointerDown?.(event)
      swallowClick.current = false
      if (event.defaultPrevented || event.button !== 0 || event.isPrimary === false || actions.length === 0) return
      const root = rootRef.current
      if (!root) return
      const m = measure(root)
      drag.current = {
        ...m,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        base: offsetRef.current,
        clearOfEdge: event.clientX >= m.edge,
        engaged: false,
        shift: 0,
      }
    },
    onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
      onPointerMove?.(event)
      const d = drag.current
      if (!d || event.pointerId !== d.pointerId) return
      const dx = event.clientX - d.x
      const dy = event.clientY - d.y
      if (!d.engaged) {
        // More down than sideways: a scroll, not a swipe.
        if (Math.abs(dy) >= d.reveal && Math.abs(dy) >= Math.abs(dx)) {
          drag.current = null
          return
        }
        if (Math.abs(dx) < d.reveal || Math.abs(dx) <= Math.abs(dy)) return
        // A right swipe from rest that starts at the screen's edge is the system's back gesture.
        if (dx > 0 && d.base === 0 && (!leading || !d.clearOfEdge)) {
          drag.current = null
          return
        }
        d.engaged = true
        d.shift = Math.sign(dx) * d.reveal
        try {
          event.currentTarget.setPointerCapture?.(event.pointerId)
        } catch {
          // A synthetic pointer has nothing to capture.
        }
        setDragging(true)
      }
      const next = constrain(d.base + dx - d.shift, d)
      setOffset(next)
      // Past the full-swipe line, on an action a full swipe may finish: the row says so.
      setArmed(d.width > 0 && Math.abs(next) >= d.full * d.width && takesFullSwipe(next < 0 ? outer : leading))
    },
    onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
      onPointerUp?.(event)
      end(event, false)
    },
    onPointerCancel(event: React.PointerEvent<HTMLDivElement>) {
      onPointerCancel?.(event)
      end(event, true)
    },
    onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
      onClickCapture?.(event)
      const target = event.target as Node
      const onTile = !contentRef.current?.contains(target)
      // The click that ends a swipe is not a tap on the row.
      if (swallowClick.current) {
        swallowClick.current = false
        event.preventDefault()
        event.stopPropagation()
        return
      }
      // Open, a tap on the row's content closes it and does nothing else.
      if (restSide && !onTile) {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    },
    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event)
      if (event.defaultPrevented) return
      if (event.key === "Escape" && restSide) {
        event.preventDefault()
        close()
        return
      }
      // With no row part drawing the menu, SwipeRow's own button answers the menu keys.
      if (claims === 0 && actions.length > 0 && (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) {
        event.preventDefault()
        setMenuOpen(true)
      }
    },
    onContextMenu(event: React.MouseEvent<HTMLDivElement>) {
      if (claims === 0 && actions.length > 0 && !event.defaultPrevented) {
        event.preventDefault()
        setMenuOpen(true)
      }
    },
  }

  // The settle runs on the spring-settle role; a drag follows the pointer with no transition, and
  // under reduced motion the row snaps.
  const animate = !dragging && !reduced
  const settleMotion = animate ? "transition-[transform,width] duration-(--motion-spring-settle-duration) ease-(--motion-spring-settle)" : ""
  const leadingWidth = Math.max(0, offset)
  const trailingWidth = Math.max(0, -offset)

  return (
    <SwipeRowMenuContext.Provider value={menu}>
      <div
        ref={rootRef}
        data-slot="swipe-row"
        data-open={restSide ?? undefined}
        data-dragging={dragging || undefined}
        data-armed={armed || undefined}
        className={cn("group/swipe-row relative touch-pan-y overflow-hidden data-dragging:select-none", className)}
        {...props}
        {...handlers}
      >
        {leading ? (
          <div
            data-slot="swipe-row-leading"
            aria-hidden="true"
            className={cn("absolute inset-y-0 left-0 flex justify-end overflow-hidden", settleMotion)}
            style={{ width: leadingWidth }}
          >
            {leadingWidth > 0 ? (
              <SwipeAction
                tone={leading.tone ?? "primary"}
                icon={leading.icon}
                label={leading.label}
                disabled={leading.disabled}
                tabIndex={-1}
                grow
                onClick={() => menu.activate(leading)}
              />
            ) : null}
          </div>
        ) : null}
        {trailing.length > 0 ? (
          <div
            data-slot="swipe-row-trailing"
            aria-hidden="true"
            className={cn("absolute inset-y-0 right-0 flex justify-start overflow-hidden", settleMotion)}
            style={{ width: trailingWidth }}
          >
            {trailingWidth > 0
              ? trailing.map((action, i) => {
                  const isOuter = i === trailing.length - 1
                  return (
                    <SwipeAction
                      key={`${i}-${action.label}`}
                      tone={action.tone ?? (isOuter ? "primary" : "neutral")}
                      icon={action.icon}
                      label={action.label}
                      disabled={action.disabled}
                      tabIndex={-1}
                      grow={isOuter}
                      onClick={() => menu.activate(action)}
                    />
                  )
                })
              : null}
          </div>
        ) : null}
        <div
          ref={contentRef}
          data-slot="swipe-row-content"
          className={cn("relative bg-background", settleMotion)}
          style={{ transform: offset === 0 ? undefined : `translateX(${offset}px)` }}
        >
          {children}
          {claims === 0 && actions.length > 0 ? (
            <span
              data-slot="swipe-row-menu"
              className="absolute top-1/2 right-4 z-10 -translate-y-1/2 opacity-0 group-focus-within/swipe-row:opacity-100 group-hover/swipe-row:opacity-100 pointer-coarse:opacity-100 has-aria-expanded:opacity-100"
            >
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={menuLabel} />}>
                  <Icon name="overflow-menu--horizontal" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" width="auto">
                  <SwipeRowMenuItems menu={menu} />
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          ) : null}
        </div>
      </div>
    </SwipeRowMenuContext.Provider>
  )
}

export { SwipeRow, SwipeAction, swipeActionVariants, useSwipeRowActions, SwipeRowMenuItems, type SwipeRowMenuValue }
