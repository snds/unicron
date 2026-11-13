// Owned component (not generated): the phone's status strip above the bottom row (live status, a waiting request), and its compact form inside the row.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 20:1713; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { Button } from "./button"
import { Progress, type ProgressTone } from "./progress"

/**
 * `neutral`: a fact (offline, the place you are in). `live`: something running now (a task, a
 * sync). `needs-you`: something waits on the person (a sign-in request, a review); never
 * dismissable, never swiped away. `critical`: it stopped and the person can act (spend paused).
 */
export type AccessoryTone = "neutral" | "live" | "needs-you" | "critical"

/** The strip's one action: a node (a `Button size="sm"`), or what to draw one from. */
export type AccessoryAction =
  | React.ReactNode
  | {
      label: string
      onClick?: () => void
      /** A 16px glyph. In the compact strip an action shows only as this glyph, named by `label`. */
      icon?: IconName
    }

export interface AccessoryProgress {
  value: number
  max?: number
  /** Cells in the segmented bar (the undo-send window draws 10). Default 10. */
  segments?: number
  /** Default: the strip's own tone (live, critical) or the bar's default fill. */
  tone?: ProgressTone
}

const strip = cva(
  // Figma 20:1713: 48 high, 4px top and bottom, 16px sides, 12px gap, the 2px corner.
  "group/accessory relative flex h-control min-w-0 items-center gap-3 rounded-sm px-4 py-1",
  {
    variants: {
      tone: {
        neutral: "rule-box bg-surface-raised",
        live: "rule-box bg-surface-raised",
        // No border on the yellow. `on-needs-you`: rings inside take the yellow's ink.
        "needs-you": "on-needs-you bg-needs-you-fill",
        // Not drawn in Figma: the critical Banner's look at strip size (soft ground, critical edge).
        critical: "bg-critical-soft inset-ring inset-ring-critical-fill",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
)

/** Meta ink, title ink and the wash under the text area, per tone (Figma: Meta, Title). */
const INK: Record<AccessoryTone, { meta: string; title: string; wash: string }> = {
  neutral: { meta: "text-text-label", title: "text-text-body", wash: "hover:bg-state-hover active:bg-state-pressed" },
  live: { meta: "text-secondary-live", title: "text-text-body", wash: "hover:bg-state-hover active:bg-state-pressed" },
  // The yellow's own ink, and the 5% and 9% washes Button uses on it.
  "needs-you": {
    meta: "text-needs-you-on-fill",
    title: "text-needs-you-on-fill",
    wash: "hover:bg-needs-you-on-fill/5 active:bg-needs-you-on-fill/9",
  },
  critical: { meta: "text-text-body", title: "text-text-body", wash: "hover:bg-state-hover active:bg-state-pressed" },
}

const SWIPE_FALLBACK = 24

/** A size token read off the element, in px, or the fallback without the stylesheet. */
function readLength(el: Element, name: string, fallback: number): number {
  if (typeof getComputedStyle !== "function") return fallback
  const raw = getComputedStyle(el).getPropertyValue(name).trim()
  const match = /^([\d.]+)(px|rem)$/.exec(raw)
  if (!match) return fallback
  const n = Number.parseFloat(match[1])
  return match[2] === "px" ? n : n * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
}

function isActionObject(action: AccessoryAction): action is Exclude<AccessoryAction, React.ReactNode> & { label: string } {
  return typeof action === "object" && action !== null && !React.isValidElement(action) && "label" in action
}

export type AccessoryProps = Omit<React.ComponentProps<"div">, "title"> & {
  tone?: AccessoryTone
  /** The mono caps line above the title, with `//` between its parts ("SEA-48 // Running 04:12"). One line, cut with an ellipsis. */
  meta?: React.ReactNode
  /** What it is about ("Add baseline drift check"). One line, cut with an ellipsis. */
  title: React.ReactNode
  /** One action at the end: a secondary Button, or the solid dark one on the yellow. */
  action?: AccessoryAction
  /**
   * The form inside the phone's bottom row, once the page has scrolled: the text is cut to fit,
   * and an action shows only as its glyph (or not at all).
   */
  compact?: boolean
  /**
   * The strip's text area is one button that opens the strip's place (its sheet, the Outbox). A
   * swipe up on the strip does the same. The action stays a separate button beside it.
   */
  onOpen?: () => void
  /** What opening does, in a few words ("Open the Outbox"). Read as the text area's description. */
  openLabel?: string
  /** A swipe up on the strip. Defaults to `onOpen`; with no `onOpen`, the text area's press runs it too, so it has a keyboard path. */
  onSwipeUp?: () => void
  /** Puts a close button at the end. Never on `needs-you`: a waiting request cannot be put away. */
  onDismiss?: () => void
  /** The close button's name. Default "Dismiss". */
  dismissLabel?: string
  /** A segmented bar along the bottom edge (the undo-send window, a run, the idle lock). Hidden from assistive tech: use `announce`. */
  progress?: AccessoryProgress
  /**
   * What a screen reader is told when the strip changes, in a polite status region. Default: the
   * title. A ticking countdown in `meta` is not announced on every tick; put a stable sentence
   * here instead ("Sending. 10 seconds to undo.").
   */
  announce?: string
}

/**
 * Accessory: the status strip (Figma 20:1713), 48 high, above the phone's bottom row. A live mark
 * (an 8px square) in the live tone, a meta overline and a title, an optional action. Tones as
 * drawn: neutral and live on the raised surface with a hairline; needs-you on the yellow.
 */
function Accessory({
  tone = "neutral",
  meta,
  title,
  action,
  compact = false,
  onOpen,
  openLabel,
  onSwipeUp,
  onDismiss,
  dismissLabel = "Dismiss",
  progress,
  announce,
  className,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
  ...props
}: AccessoryProps) {
  const descriptionId = React.useId()
  const gesture = React.useRef<{ id: number; x: number; y: number } | null>(null)
  const swallowClick = React.useRef(false)
  const swipe = onSwipeUp ?? onOpen
  const open = onOpen ?? onSwipeUp
  const ink = INK[tone]
  // A request that waits on the person stays until it is answered.
  const dismissable = Boolean(onDismiss) && tone !== "needs-you"

  const text = (
    <>
      {tone === "live" ? <span data-slot="accessory-live-mark" aria-hidden="true" className="size-(--c-accessory-live-mark) shrink-0 bg-secondary-live" /> : null}
      {tone === "critical" ? <Icon name="warning--alt" /> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        {meta ? (
          <span data-slot="accessory-meta" className={cn("type-overline truncate", ink.meta)}>
            {meta}
          </span>
        ) : null}
        <span data-slot="accessory-title" className={cn("type-ui truncate", ink.title)}>
          {title}
        </span>
      </span>
    </>
  )

  let actionNode: React.ReactNode = null
  if (action !== undefined && action !== null && action !== false) {
    if (isActionObject(action)) {
      const variant = tone === "needs-you" ? "needs-you" : "secondary"
      if (!compact) {
        actionNode = (
          <Button size="sm" variant={variant} onClick={action.onClick}>
            {action.icon ? <Icon name={action.icon} size="sm" /> : null}
            {action.label}
          </Button>
        )
      } else if (action.icon) {
        actionNode = (
          <Button size="icon-sm" variant={variant} aria-label={action.label} onClick={action.onClick}>
            <Icon name={action.icon} size="sm" />
          </Button>
        )
      }
    } else {
      actionNode = action
    }
  }

  return (
    <div
      data-slot="accessory"
      data-tone={tone}
      data-compact={compact ? "" : undefined}
      className={cn(strip({ tone }), swipe && "touch-none", className)}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (!swipe || event.button !== 0) return
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        const start = gesture.current
        gesture.current = null
        if (!swipe || !start || start.id !== event.pointerId) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        const threshold = readLength(event.currentTarget, "--c-accessory-swipe-threshold", SWIPE_FALLBACK)
        if (-dy > threshold && Math.abs(dy) > Math.abs(dx)) {
          swipe()
          // The lift may also click whatever it ended on.
          swallowClick.current = true
          setTimeout(() => {
            swallowClick.current = false
          }, 0)
        }
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        gesture.current = null
      }}
      onClickCapture={(event) => {
        onClickCapture?.(event)
        if (!swallowClick.current) return
        swallowClick.current = false
        event.preventDefault()
        event.stopPropagation()
      }}
      {...props}
    >
      {open ? (
        <ButtonPrimitive
          data-slot="accessory-open"
          aria-describedby={openLabel ? descriptionId : undefined}
          onClick={open}
          className={cn(
            // Reaches the strip's start and its top and bottom, so the whole text area takes the press.
            "-my-1 -ms-4 flex min-w-0 flex-1 items-center gap-3 self-stretch rounded-s-sm py-1 ps-4 text-start transition-[background-color] duration-(--motion-fast) ease-(--motion-ease)",
            ink.title,
            ink.wash
          )}
        >
          {text}
        </ButtonPrimitive>
      ) : (
        <div data-slot="accessory-text" className={cn("flex min-w-0 flex-1 items-center gap-3", ink.title)}>
          {text}
        </div>
      )}
      {openLabel ? (
        <span id={descriptionId} hidden>
          {openLabel}
        </span>
      ) : null}
      {actionNode ? (
        <div data-slot="accessory-action" className="flex shrink-0 items-center">
          {actionNode}
        </div>
      ) : null}
      {dismissable ? (
        <div data-slot="accessory-dismiss" className="-me-2 flex shrink-0 items-center">
          <Button variant="ghost" size="icon-sm" aria-label={dismissLabel} onClick={onDismiss}>
            <Icon name="close" size="sm" />
          </Button>
        </div>
      ) : null}
      {progress ? (
        <div data-slot="accessory-progress" aria-hidden="true" className="pointer-events-none absolute inset-x-4 bottom-0.5">
          <Progress
            variant="segmented"
            value={progress.value}
            max={progress.max ?? 100}
            segments={progress.segments ?? 10}
            tone={progress.tone ?? (tone === "critical" ? "critical" : tone === "live" ? "live" : "default")}
          />
        </div>
      ) : null}
      {/* One polite region: the strip's news, said once, not each tick of a countdown. */}
      <span data-slot="accessory-status" role="status" className="sr-only">
        {announce ?? (typeof title === "string" ? title : null)}
      </span>
    </div>
  )
}

export { Accessory }
