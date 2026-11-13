// Owned helper (not generated): resistance for a drag that goes past its limit.

/**
 * How far an element moves when the pointer has gone `distance` past a limit. It follows the
 * pointer at `firstStep` of its speed to begin with, then less and less, and never passes `max`.
 * Negative distances mirror. Past the limit only: before it, move the element 1:1.
 *
 * @param distance  Pointer travel past the limit, in px.
 * @param max       The furthest the element may go, in px.
 * @param firstStep Share of the pointer's movement kept at the start (0–1). Default 0.5.
 */
export function rubberBand(distance: number, max: number, firstStep = 0.5): number {
  if (!(max > 0) || !Number.isFinite(distance) || distance === 0) return 0
  const sign = distance < 0 ? -1 : 1
  return sign * max * (1 - Math.exp((-Math.abs(distance) * firstStep) / max))
}
