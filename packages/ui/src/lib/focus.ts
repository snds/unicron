// Where focus starts when a layer opens. Shared by Dialog, Sheet and Popover (one list of what can
// take focus, one rule for the first control).
import * as React from "react"

/** Elements that take focus from the Tab key. */
export const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

/**
 * Where focus starts when the layer opens from a keyboard or a pointer: its first control, else the
 * layer itself, never the close button (it is drawn at the top but read last, and focusing it
 * would also show its tooltip). Opened by touch, Base UI's own choice stands: the layer itself, so
 * no keyboard springs up. Pass the result as the popup's `initialFocus`.
 */
export function useFocusFirstControl(inner: React.RefObject<HTMLElement | null>, popupSlot: string) {
  return React.useCallback(
    (openType: string) => {
      if (openType === "touch") return true
      const el = inner.current
      if (!el) return true
      return el.querySelector<HTMLElement>(TABBABLE) ?? el.closest<HTMLElement>(`[data-slot="${popupSlot}"]`) ?? true
    },
    [inner, popupSlot],
  )
}
