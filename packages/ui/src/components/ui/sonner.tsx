// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: solid toasts; the Toaster of the cross-app decisions §1 and contract §5.1b row 19 (offset from the frame, one action, focus hand-back, default times, three at most); no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import type { ExternalToast, ToasterProps } from "sonner"

// sonner's own module, less the <style> tag it adds to the page as it loads (contract section 7:
// no run-time style tags, for a strict `style-src 'self'`). scripts/build-sonner.mjs writes it.
import { Toaster as Sonner, toast as sonnerToast, useSonner } from "../../../vendor/sonner"

import { readLength } from "../../lib/length"
import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { AppFrameContext, toastPlacementFor, type AppFrameToastPlacement } from "./app-frame-context"
import { Button } from "./button"
import { Spinner } from "./spinner"

/**
 * How long a toast stays, in milliseconds (cross-app decisions §1, Warpcore's times): 6 s when it
 * offers an action, so there is time to reach it, 4 s when it only says something. Pointer hover
 * and keyboard focus pause it, as sonner does.
 */
export const toastDurations = { plain: 4000, action: 6000 } as const

/** Three toasts at most on a desktop, in a column. */
export const toasterVisibleToasts = 3

/**
 * One toast at a time on a phone (contract 5.1c C6, 5.2): a toast stands in the status strip's
 * slot, so with the bottom row the bottom holds two bars, never more. The next one waits, in
 * order, until this one leaves.
 */
export const toasterVisibleToastsPhone = 1

/** A toast's one action: its words (`Undo`) and what it does. Pressing it also dismisses the toast. */
export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions
  extends Omit<ExternalToast, "action" | "cancel" | "closeButton" | "icon" | "unstyled" | "classNames" | "style" | "invert" | "richColors"> {
  /** One sentence under the title, in the caption role. */
  description?: React.ReactNode
  /** The one action a toast may hold (decisions §1). There is no second button. */
  action?: ToastAction
  /**
   * Move focus to the action as the toast arrives, and back when it leaves. Use it after a
   * keyboard action removed the focused row: focus goes to Undo, and when the toast leaves it
   * returns to `returnFocus`, or to the element that had focus before, if it is still on the page.
   */
  takeFocus?: boolean
  /** Where focus goes when a toast that took it leaves: an element, or a function that finds one then. */
  returnFocus?: HTMLElement | null | (() => HTMLElement | null | undefined)
  /** `critical` draws the glyph in the critical ink: the only colour a toast carries. `toast.error` sets it. */
  tone?: "neutral" | "critical"
}

let nextId = 0

function resolve(target: ToastOptions["returnFocus"]) {
  return typeof target === "function" ? target() : target
}

/**
 * The action button. It takes focus when asked, and when it goes away (the toast timed out, or was
 * pressed) with focus still on it or on nothing, it hands focus back, so a keyboard user is never
 * left on the page's body. A person who has moved on keeps their place.
 */
function ToastActionButton({
  id,
  action,
  takeFocus,
  returnFocus,
}: {
  id: string | number
  action: ToastAction
  takeFocus: boolean
  returnFocus: ToastOptions["returnFocus"]
}) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el || !takeFocus) return
    const doc = el.ownerDocument
    const before = doc.activeElement
    el.focus({ preventScroll: true })
    return () => {
      const active = doc.activeElement
      const lost = !active || active === doc.body || !active.isConnected || el.contains(active) || active.closest("[data-sonner-toast]") !== null
      if (!lost) return
      const target = resolve(returnFocus) ?? (before instanceof HTMLElement && before.isConnected ? before : null)
      target?.focus({ preventScroll: true })
    }
  }, [takeFocus, returnFocus])
  return (
    <Button
      ref={ref}
      type="button"
      size="sm"
      variant="ghost"
      data-slot="toast-action"
      onClick={() => {
        action.onClick()
        sonnerToast.dismiss(id)
      }}
    >
      {action.label}
    </Button>
  )
}

type ToastKind = "default" | "success" | "info" | "warning" | "error"

/**
 * Toasts that wait their turn, per Toaster (`id`), so two frames on one page keep their own. Two
 * things make a toast wait (contract 5.1c C6):
 *
 * - `held`: a phone's status strip with an action shows (undo send). It is never covered, so every
 *   new toast waits until the strip ends.
 * - `limit`: how many toasts may be up at once. One on a phone, where a toast stands in the strip's
 *   slot and the bottom never holds three bars; no limit of its own on a desktop (sonner shows
 *   three).
 *
 * The waiting ones come out in the order they were raised, each for its full time.
 */
type Hold = { held: boolean; limit: number; waiting: { id: string | number; fire: () => void }[]; listeners: Set<() => void> }
const holds = new Map<string, Hold>()

function holdOf(toasterId: string | undefined) {
  const key = toasterId ?? ""
  let hold = holds.get(key)
  if (!hold) {
    hold = { held: false, limit: Number.POSITIVE_INFINITY, waiting: [], listeners: new Set() }
    holds.set(key, hold)
  }
  return hold
}

function changed(hold: Hold) {
  for (const listener of hold.listeners) listener()
}

/** The ids of the toasts that are up in a Toaster right now. */
function liveToasts(toasterId: string | undefined) {
  const ids = new Set<string | number>()
  for (const t of sonnerToast.getToasts()) if (((t as { toasterId?: string }).toasterId ?? "") === (toasterId ?? "")) ids.add(t.id)
  return ids
}

/** Let waiting toasts out, oldest first, while there is room and nothing holds them. */
function pump(toasterId: string | undefined) {
  const hold = holdOf(toasterId)
  if (hold.held || hold.waiting.length === 0) return
  let room = hold.limit - liveToasts(toasterId).size
  let let_out = false
  while (room > 0 && hold.waiting.length > 0) {
    hold.waiting.shift()!.fire()
    room -= 1
    let_out = true
  }
  if (let_out) changed(hold)
}

/** How many toasts wait their turn, for a Toaster `id` (or the default one). */
export function waitingToasts(toasterId?: string): number {
  return holds.get(toasterId ?? "")?.waiting.length ?? 0
}

function show(kind: ToastKind, title: React.ReactNode, options: ToastOptions = {}) {
  const { action, takeFocus = false, returnFocus, tone = kind === "error" ? "critical" : "neutral", duration, id: given, className, ...rest } = options
  const id = given ?? `unicron-toast-${++nextId}`
  const data: ExternalToast = {
    ...rest,
    id,
    duration: duration ?? (action ? toastDurations.action : toastDurations.plain),
    action: action ? <ToastActionButton id={id} action={action} takeFocus={takeFocus} returnFocus={returnFocus} /> : undefined,
    className: cn(tone === "critical" && "[&_[data-icon]]:text-critical-text", className),
  }
  const fire = () => (kind === "default" ? sonnerToast(title, data) : sonnerToast[kind](title, data))
  const hold = holdOf(rest.toasterId)
  const live = liveToasts(rest.toasterId)
  // A toast that is already up is changed in place; it never joins the queue.
  if (!live.has(id) && (hold.held || hold.waiting.length > 0 || live.size >= hold.limit)) {
    // Behind a strip with an action, or behind the toast that is up on a phone: it waits, then
    // shows its full time.
    hold.waiting.push({ id, fire })
    changed(hold)
    return id
  }
  return fire()
}

/**
 * Show a toast: one line that names the thing, no full stop (decisions §12), at most one action.
 * Its time follows `toastDurations` unless `duration` says otherwise. Returns the toast's id, for
 * `toast.dismiss(id)`.
 *
 *   toast("Archived Budget for audits", { action: { label: "Undo", onClick: unarchive }, takeFocus: true })
 */
function toast(title: React.ReactNode, options?: ToastOptions) {
  return show("default", title, options)
}
/** A finished action, with a check. */
toast.success = (title: React.ReactNode, options?: ToastOptions) => show("success", title, options)
/** News, with an i. */
toast.info = (title: React.ReactNode, options?: ToastOptions) => show("info", title, options)
/** Something to watch, with a warning glyph in the body ink. */
toast.warning = (title: React.ReactNode, options?: ToastOptions) => show("warning", title, options)
/**
 * Something failed: the one toast with colour, its glyph in the critical ink. A broken thing the
 * person can fix is a critical Banner, not a toast (decisions §1).
 */
toast.error = (title: React.ReactNode, options?: ToastOptions) => show("error", title, options)
/** Take a toast away; without an id, all of them, the waiting ones too. */
toast.dismiss = (id?: string | number) => {
  for (const hold of holds.values()) {
    const before = hold.waiting.length
    hold.waiting = id === undefined ? [] : hold.waiting.filter((entry) => entry.id !== id)
    if (hold.waiting.length !== before) changed(hold)
  }
  return sonnerToast.dismiss(id)
}

const TOAST_GAP_FALLBACK = 8

let warnedOfSecondCopy = false
/**
 * sonner's own module leaves a `<style>` tag in the page as it loads; this package's copy does
 * not. So such a tag means the app also imports `sonner` itself, and toasts raised with that
 * `toast` go to a second store this Toaster never hears. Say so once, where the developer looks.
 */
function warnOfSecondCopy() {
  if (warnedOfSecondCopy || typeof document === "undefined") return
  for (const style of Array.from(document.head.querySelectorAll("style"))) {
    if (!style.textContent?.includes("[data-sonner-toaster]")) continue
    warnedOfSecondCopy = true
    console.warn(
      '@unicron/ui: this page also loads the "sonner" package. Toasts raised with its `toast` do not show in @unicron/ui\'s Toaster, and it adds a <style> tag that a strict Content-Security-Policy refuses. Import `toast` from "@unicron/ui" instead.'
    )
    return
  }
}

/**
 * The place for toasts (contract §5.1b row 19, 5.1c C6). Put it inside the `AppFrame`; the frame
 * then tells it where to go, with CSS variables (`--frame-toast-left`, `--frame-toast-bottom`,
 * `--frame-toast-top`, `--frame-toast-width`) and its status strip's state:
 *
 * - Desktop: the bottom left of the content, three at most, in a column.
 * - Phone: the status strip's slot, just above the bottom row, as wide as the strip, one toast at a
 *   time, so the bottom never holds three bars: a second toast waits until the first leaves, and
 *   they come in the order they were raised. A strip with an action (undo send) is never covered: new toasts wait
 *   until it ends, and toasts already up move under the top row. A strip without an action gives
 *   way for the toast's time, then comes back (the frame hides it meanwhile). A needs-you strip
 *   never gives way: toasts sit under the top row instead.
 *
 * Outside a frame toasts sit --c-toaster-offset from the window's corner (--c-toaster-offset-compact
 * on a phone).
 *
 * Each toast is solid: the raised surface, a 1px rule, the 2px corner, no shadow. The title is in
 * the ui-emphasis role, the description in the caption role, the glyph in the body ink, and in the
 * critical ink only for an error. Use this module's `toast()`: it sets the default times, the one
 * action and the phone's queue. A toast raised with sonner's own `toast` (`import { toast } from
 * "sonner"`) does not reach this Toaster: it listens to the copy of sonner described next.
 *
 * Placement, stacking and motion are sonner's own rules. sonner's module adds them to the page in
 * a `<style>` tag as it loads, which contract section 7 rules out (a strict `style-src 'self'`,
 * Lockdown's web vault, refuses the tag). So the Toaster loads `vendor/sonner.js`, sonner's module
 * with that one step taken out (scripts/build-sonner.mjs), and the @unicron/ui stylesheet carries
 * the rules as a file (`@import "sonner/dist/styles.css"` in styles/index.css). No page gets a tag
 * from this package. The toasts' look comes from these classes (`unstyled`). Two of sonner's rules
 * still reached an unstyled toast, its focus shadow and its dark description grey; the stylesheet
 * hands both back to the system (styles/index.css → Toasts), so a focused toast keeps its 1px rule
 * and shows the one 2px ink ring (contract 6.2), and the description is `text-secondary` on every
 * ground. That is why the toast's class has no `outline-none`.
 */
const Toaster = ({ className, style, toastOptions, id, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [gap] = React.useState(() => readLength(null, "--c-toaster-gap", TOAST_GAP_FALLBACK))
  const frame = React.useContext(AppFrameContext)
  const phone = frame?.phone ?? false
  const placement: AppFrameToastPlacement = frame ? toastPlacementFor(frame.phone, frame.strip) : "content"
  const held = placement === "wait"
  const limit = phone ? toasterVisibleToastsPhone : Number.POSITIVE_INFINITY
  const { toasts } = useSonner()
  const up = toasts.filter((t) => ((t as { toasterId?: string }).toasterId ?? undefined) === (id ?? undefined)).length
  const subscribe = React.useCallback(
    (listener: () => void) => {
      const hold = holdOf(id)
      hold.listeners.add(listener)
      return () => {
        hold.listeners.delete(listener)
      }
    },
    [id]
  )
  const waiting = React.useSyncExternalStore(
    subscribe,
    () => holdOf(id).waiting.length,
    () => 0
  )
  // A toast is up, or the next one is about to take its place: the slot stays the toasts'.
  const showing = up > 0 || (!held && waiting > 0)

  // Hold new toasts while the strip with an action shows, and on a phone while one is up; let the
  // waiting ones out, in order, as room comes.
  React.useLayoutEffect(() => {
    const hold = holdOf(id)
    hold.held = held
    hold.limit = limit
    pump(id)
  }, [id, held, limit, up, waiting])
  React.useEffect(
    () => () => {
      const hold = holdOf(id)
      hold.held = false
      hold.limit = Number.POSITIVE_INFINITY
      pump(id)
    },
    [id]
  )

  React.useEffect(warnOfSecondCopy, [])

  // The frame hides a strip without an action while toasts take its slot.
  const setToastShowing = frame?.setToastShowing
  React.useLayoutEffect(() => {
    if (!setToastShowing) return
    setToastShowing(showing)
  }, [showing, setToastShowing])
  React.useEffect(() => () => setToastShowing?.(false), [setToastShowing])

  // Under the top row for a needs-you strip, and for toasts already up when a held strip arrives.
  const top = placement === "top" || (held && showing)

  return (
    <Sonner
      id={id}
      theme={theme as ToasterProps["theme"]}
      position={top ? "top-left" : "bottom-left"}
      visibleToasts={phone ? toasterVisibleToastsPhone : toasterVisibleToasts}
      duration={toastDurations.plain}
      gap={gap}
      expand
      offset={{
        left: "var(--frame-toast-left, var(--c-toaster-offset))",
        bottom: "var(--frame-toast-bottom, var(--c-toaster-offset))",
        top: "var(--frame-toast-top, var(--c-toaster-offset))",
      }}
      mobileOffset={{
        left: "var(--frame-toast-left, var(--c-toaster-offset-compact))",
        right: "var(--frame-toast-left, var(--c-toaster-offset-compact))",
        bottom: "var(--frame-toast-bottom, var(--c-toaster-offset-compact))",
        top: "var(--frame-toast-top, var(--c-toaster-offset-compact))",
      }}
      className={cn("toaster group", className)}
      icons={{
        success: <Icon name="checkmark--outline" />,
        info: <Icon name="information" />,
        warning: <Icon name="warning--alt" />,
        error: <Icon name="misuse--outline" />,
        loading: <Spinner />,
      }}
      style={
        {
          // On a phone the frame gives the strip's width, so a toast is exactly the bar it stands in for.
          "--width": "var(--frame-toast-width, var(--c-toaster-width))",
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        unstyled: true,
        classNames: {
          toast: cn(
            "group/toast bg-surface-raised text-text-body rule-box flex w-(--width) items-center gap-3 rounded px-4 py-3",
            // A desktop frame in a window under 600 (a pinned preview): sonner's phone rule would size
            // the toast from the content's left offset; the frame's width is the one that holds.
            frame && !frame.phone && "w-(--width)!"
          ),
          content: "flex min-w-0 flex-1 flex-col",
          title: "type-ui-emphasis text-text-body",
          description: "type-caption text-text-secondary",
          icon: "flex shrink-0 self-start text-text-body [&_[data-slot=spinner]]:size-5",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
