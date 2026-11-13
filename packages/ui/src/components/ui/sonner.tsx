// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction: solid toasts; the Toaster of the cross-app decisions §1 and contract §5.1b row 19 (offset from the frame, one action, focus hand-back, default times, three at most); no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast as sonnerToast, type ExternalToast, type ToasterProps } from "sonner"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { Button } from "./button"
import { Spinner } from "./spinner"

/**
 * How long a toast stays, in milliseconds (cross-app decisions §1, Warpcore's times): 6 s when it
 * offers an action, so there is time to reach it, 4 s when it only says something. Pointer hover
 * and keyboard focus pause it, as sonner does.
 */
export const toastDurations = { plain: 4000, action: 6000 } as const

/** Three toasts at most; a fourth waits until one leaves. */
export const toasterVisibleToasts = 3

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
  return kind === "default" ? sonnerToast(title, data) : sonnerToast[kind](title, data)
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
/** Take a toast away; without an id, all of them. */
toast.dismiss = (id?: string | number) => sonnerToast.dismiss(id)

/** A length knob read once, in pixels, or the fallback without the stylesheet. */
function readPx(name: string, fallback: number) {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") return fallback
  const root = document.documentElement
  const raw = getComputedStyle(root).getPropertyValue(name).trim()
  const match = /^([\d.]+)(px|rem)$/.exec(raw)
  if (!match) return fallback
  const n = Number.parseFloat(match[1])
  if (!Number.isFinite(n)) return fallback
  return match[2] === "px" ? n : n * (Number.parseFloat(getComputedStyle(root).fontSize) || 16)
}

const TOAST_GAP_FALLBACK = 8

/**
 * The place for toasts (contract §5.1b row 19): the bottom left of the content on a desktop, above
 * the bottom row on a phone. The frame says where that is with two CSS variables on an ancestor
 * (or the root): `--frame-toast-left` and `--frame-toast-bottom`. Without them toasts sit
 * --c-toaster-offset from the window's corner (--c-toaster-offset-compact on a phone).
 *
 * Each toast is solid: the raised surface, a 1px rule, the 2px corner, no shadow. The title is in
 * the ui-emphasis role, the description in the caption role, the glyph in the body ink, and in the
 * critical ink only for an error. Three show at most, in a column. Use this module's `toast()`:
 * it sets the default times and the one action.
 *
 * sonner still injects its own small stylesheet as it loads, as before 1.0; an app under a strict
 * `style-src` strips it at build and loads `sonner/dist/styles.css` as a file instead. The toasts'
 * look comes from these classes either way (`unstyled`), so only placement and motion are sonner's.
 */
const Toaster = ({ className, style, toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [gap] = React.useState(() => readPx("--c-toaster-gap", TOAST_GAP_FALLBACK))

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-left"
      visibleToasts={toasterVisibleToasts}
      duration={toastDurations.plain}
      gap={gap}
      expand
      offset={{ left: "var(--frame-toast-left, var(--c-toaster-offset))", bottom: "var(--frame-toast-bottom, var(--c-toaster-offset))" }}
      mobileOffset={{
        left: "var(--frame-toast-left, var(--c-toaster-offset-compact))",
        right: "var(--frame-toast-left, var(--c-toaster-offset-compact))",
        bottom: "var(--frame-toast-bottom, var(--c-toaster-offset-compact))",
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
          "--width": "var(--c-toaster-width)",
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        unstyled: true,
        classNames: {
          toast:
            "group/toast bg-surface-raised text-text-body rule-box flex w-(--width) items-center gap-3 rounded px-4 py-3 outline-none",
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
