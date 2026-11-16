// Owned helper (not generated): what a drag does when it is let go. A bottom sheet uses it; an
// app's own gesture (a swipe row) can too. Pure functions, so they test without a pointer.

/** One pointer position along the drag's axis, with the time it was seen (ms). */
export interface DragSample {
  t: number
  /** Position in px along the axis the drag dismisses toward (down for a bottom sheet). */
  at: number
}

/** How far back the release speed looks: the last moment of the drag, not the whole of it. */
export const RELEASE_WINDOW_MS = 100
/** Past this share of its own size, a let-go surface goes, however slowly it was dragged. */
export const DISMISS_SHARE = 0.3
/** A flick: px per ms toward dismissal at release. Faster than this, it goes, however short the drag. */
export const FLICK_SPEED = 0.5

/**
 * The speed at release, in px per ms (positive = toward dismissal), from the samples in the last
 * RELEASE_WINDOW_MS before the newest one. Fewer than two samples there: 0.
 */
export function releaseVelocity(samples: readonly DragSample[]): number {
  const last = samples.at(-1)
  if (!last) return 0
  const recent = samples.filter((s) => last.t - s.t <= RELEASE_WINDOW_MS)
  const first = recent[0]
  if (!first || recent.length < 2 || last.t === first.t) return 0
  return (last.at - first.at) / (last.t - first.t)
}

/**
 * Whether a surface let go `offset` px toward dismissal, `size` px long, at `velocity` px/ms
 * should go: past DISMISS_SHARE of its size, or flicked faster than FLICK_SPEED while moving
 * toward dismissal. A flick back toward open always keeps it.
 */
export function shouldDismiss({ offset, size, velocity }: { offset: number; size: number; velocity: number }): boolean {
  if (offset <= 0 || velocity < 0) return false
  return offset > size * DISMISS_SHARE || velocity > FLICK_SPEED
}

/**
 * The share (0.5 to 1) of the exit's duration role a release should take: a flick carries
 * through faster than a slow let-go. Multiply the role by it in CSS (`--motion-release-share`).
 */
export function releaseShare(velocity: number): number {
  const speed = Math.max(0, velocity)
  return Math.min(1, Math.max(0.5, 1 / (1 + speed)))
}
