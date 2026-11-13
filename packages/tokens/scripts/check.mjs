#!/usr/bin/env node
// Round-trip check: the emitted CSS must carry the full shadcn/ui semantic contract
// (the core set Mailbird's tokens.css defines), and must NOT carry app roles — those live
// in a consumer's extension layer (examples/app-extension.css), never in the core.

import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { springOvershoot, springPosition, springSettleTime } from "../src/spring.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const css = fs.readFileSync(path.join(here, "..", "dist", "tokens.css"), "utf8")
const { tokens } = JSON.parse(fs.readFileSync(path.join(here, "..", "dist", "tokens.json"), "utf8"))

const CORE = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "border", "input", "ring", "radius",
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
]
const DARK_SWAPPED = CORE.filter((n) => !n.startsWith("sidebar-") && n !== "radius")
const APP_ONLY = ["--vertical-", "--unread", "--surface-chrome", "--surface-canvas", "--surface-selected", "--tint-"]
const THEME = [
  "--font-sans", "--font-heading", "--radius-sm", "--radius-lg", "--radius-4xl",
  // Tailwind's default transition runs on the motion roles (VQA 2026-10-28).
  "--default-transition-duration", "--default-transition-timing-function", "--ease-standard",
]

const [, lightBlock, darkBlock, themeBlock] = [
  null,
  css.match(/Tier 2[^\n]*light[^\n]*\n:root, \.light \{([\s\S]*?)\n\}/)?.[1],
  css.match(/Tier 2[^\n]*dark[^\n]*\n\.dark \{([\s\S]*?)\n\}/)?.[1],
  css.match(/@theme inline \{([\s\S]*?)\n\}/)?.[1],
]
assert.ok(lightBlock && darkBlock && themeBlock, "expected light, dark and @theme blocks")

for (const name of CORE) assert.match(lightBlock, new RegExp(`^  --${name}: `, "m"), `missing --${name} (light)`)
for (const name of DARK_SWAPPED) assert.match(darkBlock, new RegExp(`^  --${name}: `, "m"), `missing --${name} (dark)`)
for (const name of CORE.filter((n) => n !== "radius")) {
  assert.match(themeBlock, new RegExp(`^  --color-${name}: var\\(--${name}\\);`, "m"), `missing --color-${name} in @theme`)
}
for (const t of THEME) assert.match(themeBlock, new RegExp(`^  ${t}: `, "m"), `missing ${t} in @theme`)
// Status roles (agent UIs: done, waiting on you, working) and the live-state motion roles.
const STATUS = ["success", "attention", "running"].flatMap((r) => [r, `${r}-foreground`, `${r}-surface`])
for (const name of STATUS) {
  assert.match(lightBlock, new RegExp(`^  --${name}: `, "m"), `missing --${name} (light)`)
  assert.match(darkBlock, new RegExp(`^  --${name}: `, "m"), `missing --${name} (dark)`)
  assert.match(themeBlock, new RegExp(`^  --color-${name}: var\\(--${name}\\);`, "m"), `missing --color-${name} in @theme`)
}
for (const name of ["motion-spin", "motion-pulse"]) assert.match(lightBlock, new RegExp(`^  --${name}: `, "m"), `missing --${name}`)

// ── Motion: the roles, the 400ms ceiling, and the springs (docs/02-tokens.md → Motion). ──
const MOTION = [
  "motion-press", "motion-fast", "motion-base", "motion-state", "motion-move", "motion-tick",
  "motion-ease", "motion-ease-enter", "motion-ease-exit", "motion-ease-move", "motion-ease-emphasis", "motion-ease-pulse",
  "motion-spring-settle", "motion-spring-settle-duration", "motion-spring-firm", "motion-spring-firm-duration",
  "motion-stagger", "motion-stagger-max", "motion-press-depth", "motion-press-depth-small",
]
for (const name of MOTION) assert.match(lightBlock, new RegExp(`^  --${name}: `, "m"), `missing --${name}`)
for (const t of ["--ease-enter", "--ease-exit", "--ease-move", "--ease-emphasis", "--ease-spring-settle", "--ease-spring-firm"]) {
  assert.match(themeBlock, new RegExp(`^  ${t}: `, "m"), `missing ${t} in @theme`)
}

/** Follow var(--…) aliases down to the literal value. */
function literal(name) {
  let value = tokens[name]?.value
  for (let hop = 0; hop < 8; hop++) {
    const alias = /^var\((--[\w-]+)\)$/.exec(value ?? "")
    if (!alias) return value
    value = tokens[alias[1]]?.value
  }
  throw new Error(`${name}: alias chain too deep`)
}
const ms = (value) => Number(/^([\d.]+)ms$/.exec(value)?.[1] ?? NaN)

// No default motion runs longer than the ceiling. Loops and the countdown step are not transitions.
const CEILING_MS = 400
const LOOPS = new Set(["--motion-spin", "--motion-pulse", "--motion-tick"])
const durationRoles = Object.entries(tokens).filter(
  ([name, t]) => t.tier === "semantic" && t.type === "duration" && name.startsWith("--motion-") && !LOOPS.has(name)
)
for (const [name] of durationRoles) {
  const value = ms(literal(name))
  assert.ok(value <= CEILING_MS, `${name} is ${value}ms: no default motion runs longer than ${CEILING_MS}ms`)
}
assert.equal(ms(literal("--motion-stagger")) * Number(literal("--motion-stagger-max")) <= CEILING_MS, true, "a full stagger must fit under the ceiling")

// Springs: each curve starts at 0 and ends at rest, peaks inside its band, and its hand-written
// duration is the time the solver says it takes to settle (within 1% of rest).
const SPRING_BANDS = { settle: [0.05, 0.1], firm: [0, 0.04], pop: [0.15, 0.25] }
const springs = Object.entries(tokens).filter(([, t]) => t.tier === "global" && t.spring)
assert.equal(springs.length, Object.keys(SPRING_BANDS).length, "every spring needs an overshoot band in check.mjs")
for (const [name, t] of springs) {
  const key = t.path.split(".").pop()
  const points = /^linear\((.+)\)$/.exec(t.value)?.[1].split(",").map(Number)
  assert.ok(points?.length >= 16 && points.every(Number.isFinite), `${name}: expected a linear() curve`)
  assert.equal(points[0], 0, `${name}: curve must start at 0`)
  assert.equal(points.at(-1), 1, `${name}: curve must end at rest`)
  const [low, high] = SPRING_BANDS[key] ?? assert.fail(`${name}: no overshoot band`)
  const overshoot = springOvershoot(t.spring)
  assert.ok(overshoot >= low && overshoot <= high, `${name}: overshoot ${(overshoot * 100).toFixed(1)}% is outside ${low * 100}–${high * 100}%`)
  const authored = ms(tokens[`${name}-duration`]?.value)
  const settles = springSettleTime(t.spring)
  assert.ok(Math.abs(authored - settles) <= 20, `${name}-duration is ${authored}ms but the spring settles in ${settles}ms`)
}
// The solver itself: it starts at 0, comes to rest at 1, only an underdamped spring overshoots, and
// a starting velocity (a flick) shows in the first frames.
{
  const under = { stiffness: 256, damping: 20 }
  const critical = { stiffness: 100, damping: 20 }
  const over = { stiffness: 100, damping: 40 }
  for (const spring of [under, critical, over]) {
    assert.equal(springPosition(spring, 0), 0, "a spring starts at 0")
    assert.ok(Math.abs(springPosition(spring, 10) - 1) < 1e-6, "a spring comes to rest at 1")
  }
  assert.ok(springOvershoot(under) > 0.05, "an underdamped spring overshoots")
  assert.ok(springOvershoot(critical) < 1e-9 && springOvershoot(over) < 1e-9, "a critical or overdamped spring does not overshoot")
  assert.ok(springPosition(under, 0.016, 8) > springPosition(under, 0.016) + 0.1, "a starting velocity carries into the first frame")
  assert.ok(Math.abs(springPosition(critical, 0.05) - springPosition({ ...critical, damping: 20.0001 }, 0.05)) < 1e-4, "the solver is continuous across critical damping")
}

// The bouncy spring is tier 1 only: an app's expressive layer may alias it, the core never does.
for (const [name, t] of Object.entries(tokens)) {
  if (t.tier !== "global") assert.ok(!/--g-spring-pop\b/.test(t.value), `${name} points at spring.pop, which is expressive only`)
}

// The emphasis curve overshoots a little, and only a little.
{
  const [, y1, , y2] = /^cubic-bezier\((.+)\)$/.exec(literal("--motion-ease-emphasis"))[1].split(",").map(Number)
  let peak = 0
  for (let i = 0; i <= 1000; i++) {
    const u = i / 1000
    peak = Math.max(peak, 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3)
  }
  assert.ok(peak >= 1.1 && peak <= 1.14, `--motion-ease-emphasis peaks at ${(peak * 100).toFixed(1)}%, expected 110–114%`)
}

for (const prefix of APP_ONLY) assert.ok(!css.includes(prefix), `${prefix}* is an app role and must not be in the core`)
assert.ok(!/\{[a-z][\w.-]*\}/.test(css), "unresolved DTCG reference leaked into CSS")

console.log(`✓ round-trip: ${CORE.length} core semantic tokens present in light, ${DARK_SWAPPED.length} swapped in dark, theme map complete, ${STATUS.length} status roles, ${MOTION.length} motion roles (${durationRoles.length} durations ≤ ${CEILING_MS}ms, ${springs.length} springs in band), no app roles`)
