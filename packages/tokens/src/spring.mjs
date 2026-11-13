// A damped spring, solved in closed form. One file, two users:
//   - scripts/build.mjs samples each `spring.*` token into a CSS linear() curve;
//   - an app (or @unicron/ui) imports it as @unicron/tokens/spring to run the same spring in JS,
//     where a gesture's release velocity matters.
// The spring moves a value from 0 to 1. Scale the result to any distance.

/**
 * @typedef {object} Spring
 * @property {number} stiffness  Pull towards rest. Higher is faster.
 * @property {number} damping    Friction. Higher is less bounce.
 * @property {number} [mass]     Defaults to 1.
 */

/**
 * Position at `seconds` after release, starting at 0 and resting at 1.
 * @param {Spring} spring
 * @param {number} seconds
 * @param {number} [velocity]  Starting speed, in distances per second (0 = from rest).
 * @returns {number}
 */
export function springPosition({ stiffness, damping, mass = 1 }, seconds, velocity = 0) {
  if (seconds <= 0) return 0
  const w = Math.sqrt(stiffness / mass) // natural frequency
  const z = damping / (2 * Math.sqrt(stiffness * mass)) // damping ratio
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z)
    const decay = Math.exp(-z * w * seconds)
    return 1 - decay * (Math.cos(wd * seconds) + ((z * w - velocity) / wd) * Math.sin(wd * seconds))
  }
  if (z === 1) return 1 - Math.exp(-w * seconds) * (1 + (w - velocity) * seconds)
  const root = w * Math.sqrt(z * z - 1)
  const r1 = -z * w + root
  const r2 = -z * w - root
  const c1 = (velocity + r2) / (r1 - r2)
  return 1 + c1 * Math.exp(r1 * seconds) + (-1 - c1) * Math.exp(r2 * seconds)
}

/**
 * How far past rest the spring swings at its peak, as a share of the distance (0.08 = 8%).
 * @param {Spring} spring
 * @returns {number}
 */
export function springOvershoot(spring) {
  let peak = 1
  for (let ms = 0; ms <= 3000; ms++) peak = Math.max(peak, springPosition(spring, ms / 1000))
  return peak - 1
}

/**
 * Milliseconds until the spring stays within `tolerance` of rest (default 1% of the distance).
 * @param {Spring} spring
 * @param {number} [tolerance]
 * @returns {number}
 */
export function springSettleTime(spring, tolerance = 0.01) {
  let last = 0
  for (let ms = 0; ms <= 3000; ms++) {
    if (Math.abs(springPosition(spring, ms / 1000) - 1) > tolerance) last = ms
  }
  return last + 1
}

/**
 * The spring as evenly spaced samples over `durationMs`, ending exactly at rest.
 * @param {Spring} spring
 * @param {number} durationMs
 * @param {number} [points]
 * @returns {number[]}
 */
export function springSamples(spring, durationMs, points = 32) {
  const out = []
  for (let i = 0; i < points; i++) {
    const value = i === points - 1 ? 1 : springPosition(spring, ((i / (points - 1)) * durationMs) / 1000)
    out.push(Math.round(value * 1000) / 1000)
  }
  return out
}

/**
 * The spring as a CSS easing function. Pair it with a transition of `durationMs`.
 * @param {Spring} spring
 * @param {number} durationMs
 * @param {number} [points]
 * @returns {string}
 */
export function springToLinear(spring, durationMs, points = 32) {
  return `linear(${springSamples(spring, durationMs, points).join(", ")})`
}
