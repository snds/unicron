/**
 * A length knob read off an element, in pixels: a CSS custom property that holds a plain px or rem
 * value (`--c-swipe-row-edge: 1.5rem`). One home for every part that needs a knob's number in
 * script (a swipe threshold, a width, a gap).
 *
 * `el` null reads the page's root. The fallback comes back when there is no stylesheet (a unit
 * test, a server), when the knob is missing, and when its value is anything but a plain,
 * non-negative px or rem number (an `em`, a `calc()`, a bare number, a negative): a length knob is
 * never one of those, so a wrong value falls back instead of being guessed at.
 */
export function readLength(el: Element | null | undefined, name: string, fallback: number): number {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") return fallback
  const target = el ?? document.documentElement
  let raw: string
  try {
    raw = getComputedStyle(target).getPropertyValue(name).trim()
  } catch {
    return fallback
  }
  const match = /^(\d*\.?\d+)(px|rem)$/.exec(raw)
  if (!match) return fallback
  const n = Number.parseFloat(match[1])
  if (!Number.isFinite(n)) return fallback
  if (match[2] === "px") return n
  const root = Number.parseFloat(getComputedStyle(target.ownerDocument.documentElement).fontSize)
  return n * (Number.isFinite(root) && root > 0 ? root : 16)
}
