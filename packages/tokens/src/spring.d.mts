/** A damped spring that moves a value from 0 to 1. */
export interface Spring {
  /** Pull towards rest. Higher is faster. */
  stiffness: number
  /** Friction. Higher is less bounce. */
  damping: number
  /** Defaults to 1. */
  mass?: number
}

/** Position at `seconds` after release. `velocity` is the starting speed in distances per second. */
export function springPosition(spring: Spring, seconds: number, velocity?: number): number
/** How far past rest the spring swings at its peak, as a share of the distance (0.08 = 8%). */
export function springOvershoot(spring: Spring): number
/** Milliseconds until the spring stays within `tolerance` of rest (default 1%). */
export function springSettleTime(spring: Spring, tolerance?: number): number
/** The spring as evenly spaced samples over `durationMs`, ending exactly at rest. */
export function springSamples(spring: Spring, durationMs: number, points?: number): number[]
/** The spring as a CSS `linear()` easing function. Pair it with a transition of `durationMs`. */
export function springToLinear(spring: Spring, durationMs: number, points?: number): string
