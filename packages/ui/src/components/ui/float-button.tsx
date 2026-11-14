// Owned component (not generated): the square icon-only button of the floating phone chrome, also the close button of a sheet or a dialog; extended, it shows its word.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 20:1690; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { NavMark, nameWithMark, resolveNavMark, type NavMarkProp } from "./rail"
import { Tooltip, TooltipContent } from "./tooltip"

export type FloatButtonKind = "neutral" | "primary"
export type FloatButtonSize = "m" | "l"

/** The keys that run the long-press action. Said to assistive tech through `aria-keyshortcuts`. */
export const floatButtonLongPressKeys = "Shift+Enter"

const variants = cva(
  // A floating control sits over content, so every fill here is opaque: a hover is a mix towards
  // the ground, never a see-through fill. No shadow: nothing in the system casts one. Focus is the
  // stylesheet's one ring for every control; nothing here resets it.
  "group/float-button motion-press-sm inline-flex shrink-0 items-center justify-center rounded-lg select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      look: {
        // Raised surface, hairline edge, ink glyph. Hover is the opaque highlight fill (accent: 8% of
        // the ink in the raised surface); pressed is the contract's pressed wash (state-pressed,
        // 10% of the ink) laid on the raised surface, so it stays opaque.
        neutral:
          "rule-box bg-surface-raised text-foreground hover:bg-accent active:bg-[color-mix(in_oklab,var(--text-body)_10%,var(--surface-raised))] aria-expanded:bg-accent",
        // The create action, bottom right: the identity fill.
        primary:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklab,var(--primary)_90%,var(--background))] active:bg-[color-mix(in_oklab,var(--primary)_80%,var(--background))]",
        // Current or pressed: inverted ink, as the active Filter Chip is. Never a second primary fill.
        current:
          "bg-foreground text-background hover:bg-[color-mix(in_oklab,var(--foreground)_90%,var(--background))] active:bg-[color-mix(in_oklab,var(--foreground)_80%,var(--background))]",
      },
      size: {
        // 44: the touch floor.
        m: "size-touch-min",
        // 48: every floating control.
        l: "size-control",
      },
    },
    defaultVariants: {
      look: "neutral",
      size: "m",
    },
  }
)

// Extended: the same height, as wide as its glyph and word. The word is a Button's label (mono
// caps, overline), on the root so the kind's ink colours it.
const EXTENDED: Record<FloatButtonSize, string> = {
  m: "type-overline h-touch-min gap-2 px-4",
  l: "type-overline h-control gap-2 px-4",
}

/**
 * A float button's classes, for something drawn as one. `current` takes the inverted look of
 * either kind; `extended` the form with a visible word.
 */
function floatButtonVariants({
  kind = "neutral",
  size = "m",
  current = false,
  extended = false,
  className,
}: { kind?: FloatButtonKind | null; size?: FloatButtonSize | null; current?: boolean; extended?: boolean; className?: string } = {}): string {
  const look = current ? "current" : (kind ?? "neutral")
  return cn(extended ? cn(variants({ look, size: null }), EXTENDED[size ?? "m"]) : variants({ look, size }), className)
}

/** A token read off the element as milliseconds or pixels, or the fallback without the stylesheet. */
function readNumberToken(el: Element, name: string, fallback: number, unit: "time" | "length"): number {
  if (typeof getComputedStyle !== "function") return fallback
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const match = /^([\d.]+)(ms|s|px|rem)$/.exec(raw)
  if (!match) return fallback
  const n = Number.parseFloat(match[1])
  if (!Number.isFinite(n)) return fallback
  if (unit === "time") return match[2] === "ms" ? n : match[2] === "s" ? n * 1000 : fallback
  if (match[2] === "px") return n
  if (match[2] === "rem") return n * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
  return fallback
}

const LONG_PRESS_FALLBACK_MS = 500
const LONG_PRESS_FALLBACK_SLOP = 10

type ButtonHandlers = Pick<
  ButtonPrimitive.Props,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel" | "onPointerLeave" | "onClick" | "onKeyDown" | "onContextMenu"
>

/**
 * The handlers behind `onLongPress`. Holding for --c-float-button-long-press-delay (500ms) runs
 * it; moving past --c-float-button-long-press-slop (10px), lifting, or the browser taking the
 * touch for a scroll calls it off. The click that ends a long press is swallowed, so the button's
 * own action does not run as well. The same action runs from the keyboard on Shift+Enter, and from
 * the context-menu key (or a right click), which is where a pointer user's "more" already lives.
 */
function useLongPress(onLongPress: (() => void) | undefined): ButtonHandlers {
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const origin = React.useRef<{ x: number; y: number; slop: number } | null>(null)
  // True from the moment a hold runs the action until the pointer that held it has been lifted.
  const fired = React.useRef(false)
  const stopWatching = React.useRef<(() => void) | undefined>(undefined)
  const action = React.useRef(onLongPress)
  React.useEffect(() => {
    action.current = onLongPress
  })

  const cancel = React.useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current)
    timer.current = undefined
    origin.current = null
  }, [])
  React.useEffect(
    () => () => {
      cancel()
      stopWatching.current?.()
    },
    [cancel]
  )

  if (!onLongPress) return {}
  return {
    onPointerDown(event) {
      cancel()
      fired.current = false
      // The main button or a touch only: a right click arrives as the context menu.
      if (event.button !== 0) return
      const el = event.currentTarget
      origin.current = {
        x: event.clientX,
        y: event.clientY,
        slop: readNumberToken(el, "--c-float-button-long-press-slop", LONG_PRESS_FALLBACK_SLOP, "length"),
      }
      timer.current = setTimeout(() => {
        timer.current = undefined
        origin.current = null
        fired.current = true
        // The pointer may be lifted anywhere (a hold that slides on into the menu it opened). Once
        // it is, and the click that lift may cause has passed, the next press is its own again.
        const doc = el.ownerDocument
        const lifted = () => {
          stopWatching.current?.()
          setTimeout(() => {
            fired.current = false
          }, 0)
        }
        stopWatching.current?.()
        stopWatching.current = () => {
          doc.removeEventListener("pointerup", lifted, true)
          doc.removeEventListener("pointercancel", lifted, true)
          stopWatching.current = undefined
        }
        doc.addEventListener("pointerup", lifted, true)
        doc.addEventListener("pointercancel", lifted, true)
        action.current?.()
      }, readNumberToken(el, "--c-float-button-long-press-delay", LONG_PRESS_FALLBACK_MS, "time"))
    },
    onPointerMove(event) {
      const from = origin.current
      if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > from.slop) cancel()
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onClick(event) {
      if (!fired.current) return
      // This click is the end of the long press, not a press of its own.
      fired.current = false
      event.preventDefault()
      event.preventBaseUIHandler()
    },
    onKeyDown(event) {
      if (event.key !== "Enter" || !event.shiftKey || event.repeat) return
      // Stops the button's own action: Enter would otherwise click it.
      event.preventDefault()
      event.preventBaseUIHandler()
      action.current?.()
    },
    onContextMenu(event) {
      // A touch long press also raises this, after the timer has already run the action.
      event.preventDefault()
      if (fired.current) return
      cancel()
      action.current?.()
    },
  }
}

export type FloatButtonProps = Omit<TooltipPrimitive.Trigger.Props, "children" | "render" | "className"> & {
  /** What the button does, in a few words. It is the accessible name and the tooltip. */
  label: string
  /** The glyph, drawn at 20px. Omit it and pass children to draw something else. */
  icon?: IconName
  /** `neutral`: raised surface, hairline, ink glyph. `primary`: the identity fill, for the one create action. */
  kind?: FloatButtonKind
  /** `m` is 44 (the touch floor); `l` is 48, the size of every floating control. */
  size?: FloatButtonSize
  /**
   * The place or panel this button stands for is the one showing. It draws inverted (ink fill,
   * ground glyph) and says `aria-current`: `"page"` for a place in the app, `true` otherwise.
   * For an on/off tool pass `aria-pressed` instead; it draws the same.
   */
  current?: boolean | "page"
  /**
   * Runs when the button is held for about half a second, without also running its click. Always
   * reachable without the gesture: Shift+Enter, the context-menu key, or a right click.
   */
  onLongPress?: () => void
  /** What the long press does, in a few words ("Quick create"). Shown in the tooltip and described to assistive tech. */
  longPressLabel?: string
  /**
   * Shows `label` as a word beside the glyph (contract 5.1b #3): a phone button that approves,
   * allows or spends says so (cross-app decisions §10). The same height; as wide as it needs.
   * There is no tooltip, since the word is there.
   */
  extended?: boolean
  /** A count or a square at the glyph's corner (the mark every navigation item shares): the update mark on Settings. Its words join the name. */
  mark?: NavMarkProp
  className?: string
  children?: React.ReactNode
}

/**
 * FloatButton: a square, icon-only button. Two kinds, two sizes, no shadow. `label` names it for
 * assistive tech and for the tooltip, so no float button ships without a name. The props and ref
 * pass through to the button, so it can be the `render` of a menu trigger or a sheet's close.
 */
function FloatButton({
  label,
  icon,
  kind = "neutral",
  size = "m",
  current = false,
  onLongPress,
  longPressLabel,
  extended = false,
  mark,
  disabled,
  className,
  children,
  ...props
}: FloatButtonProps) {
  const press = useLongPress(disabled ? undefined : onLongPress)
  const pressed = props["aria-pressed"] === true || props["aria-pressed"] === "true"
  const on = Boolean(current) || pressed
  const hintId = React.useId()
  const hint = onLongPress && longPressLabel ? longPressLabel : undefined
  // The caller's handlers run after the long press has had the event, and not at all when it took it.
  const handlers = mergeProps<"button">(
    {
      onPointerDown: props.onPointerDown,
      onPointerMove: props.onPointerMove,
      onPointerUp: props.onPointerUp,
      onPointerCancel: props.onPointerCancel,
      onPointerLeave: props.onPointerLeave,
      onClick: props.onClick,
      onKeyDown: props.onKeyDown,
      onContextMenu: props.onContextMenu,
    },
    press
  )
  const resolved = resolveNavMark(mark)
  const glyph = children ?? (icon ? <Icon name={icon} /> : null)
  const own = {
    disabled,
    "data-slot": "float-button",
    "data-kind": kind,
    "data-size": size,
    "data-extended": extended ? "" : undefined,
    "data-current": on ? "" : undefined,
    "aria-label": nameWithMark(label, resolved),
    "aria-current": current === true ? ("true" as const) : current || undefined,
    "aria-keyshortcuts": onLongPress ? floatButtonLongPressKeys : undefined,
    "aria-describedby": hint ? hintId : undefined,
    className: floatButtonVariants({ kind, size, current: on, extended, className }),
  }
  const content = (
    <>
      {resolved ? (
        <span data-slot="float-button-glyph" className="relative inline-flex">
          {glyph}
          <NavMark mark={resolved} placement="corner" />
        </span>
      ) : (
        glyph
      )}
      {extended ? <span data-slot="float-button-word">{label}</span> : null}
      {hint ? (
        // Not drawn, and not part of the name: only what aria-describedby reads.
        <span id={hintId} hidden>
          {`${hint}: hold, or press ${floatButtonLongPressKeys}`}
        </span>
      ) : null}
    </>
  )

  // The word is on the button, so an extended one needs no tooltip.
  if (extended) {
    return (
      <ButtonPrimitive {...own} {...(props as ButtonPrimitive.Props)} {...handlers}>
        {content}
      </ButtonPrimitive>
    )
  }

  return (
    <Tooltip>
      <TooltipPrimitive.Trigger
        // TooltipTrigger's own `disabled` only stops the tooltip opening, so the button gets it too.
        render={<ButtonPrimitive disabled={disabled} />}
        {...own}
        {...props}
        {...handlers}
      >
        {content}
      </TooltipPrimitive.Trigger>
      <TooltipContent>
        {label}
        {hint ? <span data-slot="float-button-hint">{`Hold: ${hint}`}</span> : null}
      </TooltipContent>
    </Tooltip>
  )
}

export { FloatButton, floatButtonVariants }
