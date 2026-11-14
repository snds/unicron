// Owned module (not generated): a dialog's sizes by name and the rule that turns a size into `full`
// when the space is too narrow for it. Shared by Dialog and by the security review frame, so the
// two cannot drift (one set of width knobs, one margin). Internal: not exported from the package
// root and not a subpath (`"./dialog-size": null` in package.json); Dialog re-exports the public
// names (`dialogSizeName` and the size types).
// Promoted from: Seeded in snds/unicron (2026-11 design direction; cross-app decisions §14, contract 5.1b #15 and 5.1c C10; no app PR, no DSA record)
"use client"

import * as React from "react"
import type { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

/**
 * Sizes by name (cross-app decisions §14; contract §5.1b row 15). Each is a range between two
 * knobs, `--c-dialog-<size>-min-width` and `-max-width`; both are the drawn width by default, so a
 * question is 480 whatever it holds. Raise a size's max to let wide content (a table, a long path)
 * widen it. Every size is capped at the screen less --c-dialog-margin on each side (48px in all);
 * below a size's own width the dialog uses `full` (`useFittedSize`, Synapse SNA5), and
 * `data-size-asked` keeps the name it was given.
 *
 * | size       | width | job                                                          |
 * |------------|-------|--------------------------------------------------------------|
 * | `question` | 480   | a confirmation, a one-field layer, the gate                  |
 * | `review`   | 560   | read one thing and answer it                                 |
 * | `form`     | 640   | a form (the default)                                         |
 * | `compose`  | 720   | writing at length                                            |
 * | `viewer`   | 960   | a diff review, a merge, a page to read large                 |
 * | `full`     | all   | the whole window less the margin, in both directions         |
 *
 * The names before 1.0 still work and take the nearest new one: `xs` and `sm` → question,
 * `md` → review, `lg` → form, `xl` → compose, `2xl` → viewer.
 */
export const DIALOG_SIZES = {
  question: "[--dialog-min-width:var(--c-dialog-question-min-width)] [--dialog-max-width:var(--c-dialog-question-max-width)]",
  review: "[--dialog-min-width:var(--c-dialog-review-min-width)] [--dialog-max-width:var(--c-dialog-review-max-width)]",
  form: "[--dialog-min-width:var(--c-dialog-form-min-width)] [--dialog-max-width:var(--c-dialog-form-max-width)]",
  compose: "[--dialog-min-width:var(--c-dialog-compose-min-width)] [--dialog-max-width:var(--c-dialog-compose-max-width)]",
  viewer: "[--dialog-min-width:var(--c-dialog-viewer-min-width)] [--dialog-max-width:var(--c-dialog-viewer-max-width)]",
  full: "[--dialog-min-width:100%] [--dialog-max-width:100%] h-[calc(100%-2*var(--c-dialog-margin)-var(--c-dialog-titlebar-inset))]",
} as const

export type DialogSizeName = keyof typeof DIALOG_SIZES
/** @deprecated The names before 1.0. Each takes the nearest named size (see `dialogSizeName`). */
export type DialogLegacySize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
export type DialogSize = DialogSizeName | DialogLegacySize

const LEGACY_SIZES: Record<DialogLegacySize, DialogSizeName> = {
  xs: "question",
  sm: "question",
  md: "review",
  lg: "form",
  xl: "compose",
  "2xl": "viewer",
}

/** The named size a dialog draws at: a name passes through, a name from before 1.0 maps to the nearest one. */
export function dialogSizeName(size: DialogSize): DialogSizeName {
  return size in LEGACY_SIZES ? LEGACY_SIZES[size as DialogLegacySize] : (size as DialogSizeName)
}

/** A length knob read off the element, in px; NaN when it is missing or not a plain px or rem value. */
function readKnob(el: Element, name: string): number {
  if (typeof getComputedStyle !== "function") return Number.NaN
  const match = /^([\d.]+)(px|rem)$/.exec(getComputedStyle(el).getPropertyValue(name).trim())
  if (!match) return Number.NaN
  const n = Number.parseFloat(match[1])
  return match[2] === "px" ? n : n * (Number.parseFloat(getComputedStyle(el.ownerDocument.documentElement).fontSize) || 16)
}

export type PortalContainer = DialogPrimitive.Portal.Props["container"]

/**
 * The box a dialog opens in: the portal's container when it is an element of its own (an
 * extension's frame, a stage with a transform, which is what a fixed dialog is placed in), else the
 * window.
 */
function containerElement(container: PortalContainer): HTMLElement | null {
  const value = container && "current" in container ? container.current : container
  if (!value || !(value instanceof HTMLElement)) return null
  const doc = value.ownerDocument
  return value === doc.body || value === doc.documentElement ? null : value
}

function availableWidth(box: HTMLElement | null, view: Window): number {
  if (box) return box.clientWidth
  return view.document.documentElement.clientWidth || view.innerWidth
}

/**
 * Below a size's own width, a dialog uses `full` (Synapse SNA5, contract 5.1c C10): when the space
 * it opens in, less --c-dialog-margin on each side, is narrower than the size's
 * `--c-dialog-<size>-min-width`, it takes the whole space less the margin, both ways, instead of a
 * squeezed copy of its size. Read again when the window or the container changes width. Without
 * the knobs (no stylesheet) it keeps the size it was given.
 */
export function useFittedSize(name: DialogSizeName, popup: HTMLElement | null, container: PortalContainer): DialogSizeName {
  const [fits, setFits] = React.useState(true)
  React.useLayoutEffect(() => {
    if (!popup || name === "full") return
    const view = popup.ownerDocument.defaultView
    if (!view) return
    const box = containerElement(container)
    const measure = () => {
      const width = readKnob(popup, `--c-dialog-${name}-min-width`)
      const margin = readKnob(popup, "--c-dialog-margin")
      if (!Number.isFinite(width) || !Number.isFinite(margin)) return setFits(true)
      setFits(availableWidth(box, view) - 2 * margin >= width)
    }
    measure()
    view.addEventListener("resize", measure)
    const observer = box && typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null
    if (box) observer?.observe(box)
    return () => {
      view.removeEventListener("resize", measure)
      observer?.disconnect()
    }
  }, [popup, name, container])
  return fits ? name : "full"
}
