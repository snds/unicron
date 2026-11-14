#!/usr/bin/env node
// Round-trip check: the emitted CSS must carry the whole contract, laid out as the two axes need
// (docs/02-tokens.md), and must NOT carry app roles — those live in a consumer's extension layer
// (examples/app-extension.css), never in the core.
//
//   - the theme slots: 28 on :root (the default app's values) and the same 28 in one
//     [data-theme="<app>"] block per app
//   - Figma's theme roles, each reading its stone slot in light and its graphite slot in dark
//   - the shadcn/ui contract and the sidebar contract, each pinned to the role it aliases
//   - every colour of tiers 2 and 3 declared on both grounds, and every tier 2 colour in the
//     Tailwind theme map under its own name
//   - the type roles, sizes, strokes, the 2px radius scale, the scrim knobs
//   - motion: the roles, the 400ms ceiling, the springs

import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { springOvershoot, springPosition, springSettleTime } from "../src/spring.mjs"
import { difference, oklabToOklch, parseColor, toSrgb } from "./lib/color.mjs"
import { parseTokensCss, resolveValue } from "./lib/css.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const css = fs.readFileSync(path.join(here, "..", "dist", "tokens.css"), "utf8")
const { tokens, themes, defaultApp, type: typeRoles } = JSON.parse(fs.readFileSync(path.join(here, "..", "dist", "tokens.json"), "utf8"))
const built = parseTokensCss(css)
const { root, light, dark, theme } = built

// The ground selectors, written out (scripts/build.mjs computes them).
const LIGHT = ":root, .light, [data-theme]"
const DARK = [
  ".dark",
  ".dark [data-theme]:not(.light):not(.dark .light *)",
  ".dark .light .dark [data-theme]:not(.light):not(.dark .light .dark .light *)",
  ".dark .light .dark .light .dark [data-theme]:not(.light):not(.dark .light .dark .light .dark .light *)",
].join(", ")

// ── The file parses as CSS ───────────────────────────────────────────────────────────────────
// The other checks read the file by pattern, so they would not notice a comment that ends early
// and swallows the selector after it. With the comments taken out, what is left must be whole
// rules: nothing but selectors we know, and no stray comment marks.
{
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "")
  assert.ok(!/\/\*|\*\//.test(bare), "a comment in tokens.css is not closed where it should be")
  const selectors = [...bare.matchAll(/(?:^|\})\s*([^{}]+?)\s*\{/g)].map((m) => m[1])
  const known = [":root", LIGHT, DARK, "@theme inline", "@theme"]
  for (const selector of selectors) {
    assert.ok(known.includes(selector) || /^\[data-theme="[\w-]+"\]$/.test(selector), `unexpected selector in tokens.css: "${selector}"`)
  }
  assert.equal(selectors[0], ":root", "tokens.css must open with the tier 1 :root block")
}

// ── The two axes, as selectors ───────────────────────────────────────────────────────────────
// Both ground blocks match [data-theme], so a themed box re-reads its slots on the ground it is on.
// A themed box with no ground class of its own is dark when its nearest ground box is `.dark`:
// in `.dark` with no `.light` after it, or in `.dark .light .dark` with no `.light` after that,
// three dark boxes deep (docs/02-tokens.md → How the two axes resolve). The browser suite
// (apps/playground/tests/foundations.spec.ts) applies these selectors to nested boxes.
for (const title of ["Tier 2 · Semantic roles (--*)", "Tier 3 · Component knobs (--c-*)"]) {
  for (const [ground, selector] of [["light (stone)", LIGHT], ["dark (graphite)", DARK]]) {
    assert.ok(css.includes(`${title} · ${ground} ── */\n${selector} {`), `${title}: expected the ${ground} block on "${selector}"`)
  }
}
assert.ok(light.size && dark.size && theme.size && root.size, "expected :root, light, dark and @theme blocks")

// The documented app extension layer swaps its own ground roles on the core's two selectors, so
// a themed box in a dark page takes its dark values with the core roles around it.
{
  const example = fs.readFileSync(path.join(here, "..", "examples", "app-extension.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  const rules = [...example.matchAll(/(?:^|\})\s*([^{}@]+?)\s*\{/g)].map((m) => m[1].replace(/\s+/g, " "))
  assert.ok(rules.includes(LIGHT), `examples/app-extension.css: expected a block on the core's light selector "${LIGHT}"`)
  assert.ok(rules.includes(DARK), `examples/app-extension.css: a role that differs by ground must swap on the core's dark selector "${DARK}"`)
  for (const rule of rules) {
    if (/\.dark/.test(rule) && rule !== DARK && !/^:root, \.light, \.dark, \[data-theme\]$/.test(rule)) {
      assert.fail(`examples/app-extension.css: "${rule}" swaps on a ground selector that is not the core's`)
    }
  }
}

// ── Theme slots: the app axis ────────────────────────────────────────────────────────────────
const APPS = ["warpcore", "vale", "lockdown", "synapse"]
const SLOTS = [
  "ground", "raised", "rule", "grid-dot", "faint", "label", "secondary", "body",
  "primary-fill", "primary-on-fill", "primary-text", "primary-soft", "primary-display", "live",
]
const slotNames = ["graphite", "stone"].flatMap((ground) => SLOTS.map((slot) => `--g-theme-${ground}-${slot}`))
assert.deepEqual(Object.keys(built.themes), APPS, "expected one [data-theme] block per app, in Figma's order")
assert.deepEqual(Object.keys(themes), APPS, "tokens.json: expected the same four app themes")
assert.equal(defaultApp, "warpcore", "the default theme is Figma's default mode (warpcore)")
for (const name of slotNames) assert.match(root.get(name) ?? "", /^#[0-9A-F]{6}$/, `missing theme slot ${name} on :root`)
for (const app of APPS) {
  assert.deepEqual([...built.themes[app].keys()], slotNames, `[data-theme="${app}"] must declare the 28 theme slots and nothing else`)
  for (const [name, value] of built.themes[app]) {
    assert.match(value, /^#[0-9A-F]{6}$/, `[data-theme="${app}"] ${name}: a theme slot is a raw hex`)
    assert.equal(themes[app][name], value, `tokens.json themes.${app}.${name} differs from the CSS`)
  }
}
for (const name of slotNames) {
  assert.equal(root.get(name), built.themes[defaultApp].get(name), `${name}: the default on :root must be ${defaultApp}'s value`)
}

// ── Figma's theme roles (contract §1.3) ──────────────────────────────────────────────────────
const slotRole = (slot) => [`var(--g-theme-stone-${slot})`, `var(--g-theme-graphite-${slot})`]
const FIGMA_ROLES = {
  "surface-ground": slotRole("ground"),
  "surface-raised": slotRole("raised"),
  "surface-scrim": ["var(--g-scrim-stone)", "var(--g-scrim-graphite)"],
  "line-rule": slotRole("rule"),
  "line-grid-dot": slotRole("grid-dot"),
  "text-body": slotRole("body"),
  "text-secondary": slotRole("secondary"),
  "text-label": slotRole("label"),
  "text-faint": slotRole("faint"),
  "primary-fill": slotRole("primary-fill"),
  "primary-on-fill": slotRole("primary-on-fill"),
  "primary-text": slotRole("primary-text"),
  "primary-soft": slotRole("primary-soft"),
  "primary-display": slotRole("primary-display"),
  "secondary-live": slotRole("live"),
  "needs-you-fill": ["var(--g-needs-you-fill)", "var(--g-needs-you-fill)"],
  "needs-you-on-fill": ["var(--g-needs-you-on-fill)", "var(--g-needs-you-on-fill)"],
  "critical-fill": ["var(--g-critical-fill-stone)", "var(--g-critical-fill-graphite)"],
  "critical-on-fill": ["var(--g-critical-on-fill-stone)", "var(--g-critical-on-fill-graphite)"],
  "critical-text": ["var(--g-critical-text-stone)", "var(--g-critical-text-graphite)"],
  "critical-soft": ["var(--g-critical-soft-stone)", "var(--g-critical-soft-graphite)"],
}
for (const [name, [stone, graphite]] of Object.entries(FIGMA_ROLES)) {
  assert.equal(light.get(`--${name}`), stone, `--${name} (light) must read ${stone}`)
  assert.equal(dark.get(`--${name}`), graphite, `--${name} (dark) must read ${graphite}`)
}

// ── The shadcn contract, the sidebar contract and the state roles, as aliases (contract §1.4) ─
// Each is the same expression on both grounds: the role it points at carries the ground.
const same = (...names) => (value) => Object.fromEntries(names.map((n) => [n, value]))
const ALIASES = {
  ...same("background", "sidebar", "protected-foreground")("var(--surface-ground)"),
  ...same("foreground", "card-foreground", "popover-foreground", "accent-foreground", "secondary-foreground", "sidebar-accent-foreground", "protected", "ring")("var(--text-body)"),
  ...same("card", "popover", "muted", "secondary")("var(--surface-raised)"),
  accent: "color-mix(in oklab, var(--text-body) 8%, var(--surface-raised))",
  ...same("support-foreground", "sidebar-foreground")("var(--text-secondary)"),
  ...same("muted-foreground", "muted-foreground-on-fill")("var(--text-label)"),
  "faint-foreground": "var(--text-faint)",
  primary: "var(--primary-fill)",
  "primary-foreground": "var(--primary-on-fill)",
  ...same("border", "input", "sidebar-border")("var(--line-rule)"),
  destructive: "var(--critical-text)",
  attention: "var(--needs-you-fill)",
  ...same("running", "running-foreground")("var(--secondary-live)"),
  "running-surface": "color-mix(in oklab, var(--secondary-live) 14%, var(--surface-ground))",
  "sidebar-accent": "var(--primary-soft)",
  "sidebar-primary": "var(--primary)",
  "sidebar-primary-foreground": "var(--primary-foreground)",
  "sidebar-ring": "var(--ring)",
  "state-hover": "color-mix(in oklab, var(--text-body) 6%, transparent)",
  "state-pressed": "color-mix(in oklab, var(--text-body) 10%, transparent)",
  "diff-added": "color-mix(in oklab, var(--text-body) 8%, var(--surface-ground))",
  "diff-removed": "var(--critical-soft)",
}
for (const [name, value] of Object.entries(ALIASES)) {
  assert.equal(light.get(`--${name}`), value, `--${name} (light) must be ${value}`)
  assert.equal(dark.get(`--${name}`), value, `--${name} (dark) must be ${value}`)
}

const CORE = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "border", "input", "ring", "radius",
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
]
const APP_ONLY = ["--vertical-", "--unread", "--surface-chrome", "--surface-canvas", "--surface-selected", "--tint-"]
const THEME = [
  "--font-sans", "--font-mono", "--font-heading",
  "--spacing-control", "--spacing-touch-min",
  // Tailwind's default transition runs on the motion roles (VQA 2026-10-28).
  "--default-transition-duration", "--default-transition-timing-function", "--ease-standard",
]
for (const name of CORE) assert.ok(light.has(`--${name}`), `missing --${name} (light)`)
for (const t of THEME) assert.ok(theme.has(t), `missing ${t} in @theme`)
// Status roles: done, waiting on you, working, something is wrong, for your information.
const STATUS = [
  ...["success", "attention", "running"].flatMap((r) => [r, `${r}-foreground`, `${r}-surface`]),
  "warning", "warning-foreground", "info", "info-foreground",
]
for (const name of STATUS) assert.ok(light.has(`--${name}`) && dark.has(`--${name}`), `missing --${name}`)

// Every colour of tiers 2 and 3 is declared on both grounds (an alias has to be declared again
// wherever its target changes), and every tier 2 colour reaches Tailwind under its own name.
let colors = 0
for (const [name, t] of Object.entries(tokens)) {
  if (t.type !== "color" || t.tier === "global") continue
  colors++
  assert.ok(light.has(name), `${name}: missing from the light block`)
  assert.ok(dark.has(name), `${name}: a colour above tier 1 must be declared in the dark block too`)
  if (t.tier === "semantic") {
    assert.equal(theme.get(`--color-${name.slice(2)}`), `var(${name})`, `missing --color-${name.slice(2)} in @theme`)
  }
  // The legacy neutral ramp is for app layers. No core role reads it; success, warning and info
  // keep their accent ramps, labels included (contract §1.2).
  const keepsRamp = /^--(success|warning|info)(-|$)/.test(name)
  for (const value of [light.get(name), dark.get(name)]) {
    assert.ok(keepsRamp || !/--g-(neutral|white-alpha)-/.test(value), `${name} points at the legacy neutral ramp (${value}); point it at a role`)
    assert.ok(t.tier !== "component" || !/var\(--g-/.test(value), `${name} reads tier 1 directly (${value}); a knob reads a role`)
  }
}

// ── Sizes, strokes, radius, fonts, scrim (contract §1.5, §1.6, §2) ───────────────────────────
const px = (name) => {
  let value = light.get(name) ?? root.get(name)
  for (let hop = 0; hop < 4 && /^var\(/.test(value ?? ""); hop++) value = root.get(/^var\((--[\w-]+)\)$/.exec(value)[1])
  const m = /^([\d.]+)(rem|px)$/.exec(value ?? "")
  assert.ok(m, `${name}: expected a length, got ${value}`)
  return Number(m[1]) * (m[2] === "rem" ? 16 : 1)
}
assert.equal(px("--size-control"), 48, "--size-control is 48px")
assert.equal(px("--size-touch-min"), 44, "--size-touch-min is 44px")
assert.equal(theme.get("--spacing-control"), "var(--size-control)")
assert.equal(theme.get("--spacing-touch-min"), "var(--size-touch-min)")
assert.equal(px("--radius"), 2, "--radius is 2px")
for (const step of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"]) {
  assert.equal(theme.get(`--radius-${step}`), "var(--radius)", `--radius-${step} must be the one 2px corner`)
}
// The bare `rounded` reads Tailwind's --radius key. It shares the role's name, so it is in a plain
// (not inline) @theme block, with the role's value: Tailwind then writes var(--radius), the role.
assert.match(css, /\n@theme \{\n  --radius: var\(--g-radius-base\);\n\}\n/, "Tailwind's bare `rounded` must read --radius from a plain @theme block")
assert.equal(theme.get("--radius"), light.get("--radius"), "Tailwind's --radius key must hold the radius role's value, the one 2px corner")
assert.equal(px("--stroke-rule"), 1, "--stroke-rule is 1px")
assert.equal(px("--stroke-emphasis"), 2, "--stroke-emphasis is 2px")
assert.match(root.get("--g-font-sans"), /^"Geist Variable", Geist, /, "font.sans names Geist Variable, then Geist")
assert.match(root.get("--g-font-mono"), /^"Geist Mono Variable", "Geist Mono", /, "font.mono names Geist Mono Variable, then Geist Mono")
for (const [knob, value] of [["sheet", "0.5"], ["dialog", "0.6"], ["menu", "0.32"]]) {
  assert.equal(light.get(`--c-scrim-${knob}`), value, `--c-scrim-${knob} must be ${value}`)
}
assert.equal(root.get("--g-scrim-stone"), "rgb(20 22 24 / 0.64)", "the stone scrim carries its 64% alpha, as Figma stores it")

// ── Type roles (contract §2) ─────────────────────────────────────────────────────────────────
const TYPE_ROLES = [
  "display", "display-compact", "title", "lead", "subtitle", "body", "body-strong", "response", "ui", "ui-emphasis",
  "label", "caption", "overline", "folio", "meta", "code-inline", "code-display", "number-hero", "number-metric",
  "number-index", "number-count", "brand-wordmark", "icon-glyph",
]
assert.deepEqual(Object.keys(typeRoles), TYPE_ROLES, "expected the 23 type roles, in Figma's order")
const TYPE_PARTS = {
  family: /^var\(--g-font-(sans|mono)\)$/,
  weight: /^[4-7]00$/,
  size: /^[\d.]+rem$/,
  leading: /^[\d.]+rem$/,
  tracking: /^-?[\d.]+em$/,
}
for (const role of TYPE_ROLES) {
  for (const [part, shape] of Object.entries(TYPE_PARTS)) {
    const name = `--type-${role}-${part}`
    assert.match(root.get(name) ?? "", shape, `${name}: missing, or not the expected shape`)
    assert.equal(typeRoles[role][part], root.get(name), `tokens.json type.${role}.${part} differs from the CSS`)
  }
  // Every line height sits on the 4px grid.
  assert.equal((parseFloat(root.get(`--type-${role}-leading`)) * 16) % 4, 0, `--type-${role}-leading is not a multiple of 4px`)
}
assert.equal(typeRoles.overline.case, "upper", "overline is the one role with a case")

for (const name of ["motion-spin", "motion-pulse"]) assert.ok(light.has(`--${name}`), `missing --${name}`)

// ── Motion: the roles, the 400ms ceiling, and the springs (docs/02-tokens.md → Motion). ──
const MOTION = [
  "motion-press", "motion-fast", "motion-base", "motion-state", "motion-move", "motion-tick",
  "motion-ease", "motion-ease-enter", "motion-ease-exit", "motion-ease-move", "motion-ease-emphasis", "motion-ease-pulse",
  "motion-spring-settle", "motion-spring-settle-duration", "motion-spring-firm", "motion-spring-firm-duration",
  "motion-stagger", "motion-stagger-max", "motion-press-depth", "motion-press-depth-small",
]
for (const name of MOTION) assert.ok(light.has(`--${name}`), `missing --${name}`)
for (const t of ["--ease-enter", "--ease-exit", "--ease-move", "--ease-emphasis", "--ease-spring-settle", "--ease-spring-firm"]) {
  assert.ok(theme.has(t), `missing ${t} in @theme`)
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
// A staggered list is one motion: the last sibling's delay plus its entrance stays under the ceiling.
const staggerRun = ms(literal("--motion-stagger")) * Number(literal("--motion-stagger-max")) + ms(literal("--motion-base"))
assert.ok(staggerRun <= CEILING_MS, `a full stagger runs ${staggerRun}ms (delay of the last sibling + --motion-base): over the ${CEILING_MS}ms ceiling`)

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

console.log(
  `✓ round-trip: ${APPS.length} app themes × ${slotNames.length} slots (default ${defaultApp}), ${Object.keys(FIGMA_ROLES).length} Figma roles on both grounds, ` +
    `${Object.keys(ALIASES).length} aliases pinned, ${colors} colours of tiers 2 and 3 on both grounds, ${TYPE_ROLES.length} type roles, theme map complete, ` +
    `${STATUS.length} status roles, ${MOTION.length} motion roles (${durationRoles.length} durations ≤ ${CEILING_MS}ms, ${springs.length} springs in band), no app roles`
)

// ── Swatches (contract 5.1b #55) ─────────────────────────────────────────────────────────────
// Twelve roles, swatch-01 … swatch-12, each reading a tier 1 value per ground (global.json →
// swatch, named by hue) and the same in every app. Their hues are evenly spaced: 30° apart from
// the system's red hue angle (hue.red). Neighbours must not read as one colour at a glance, and
// none may pass for the needs-you yellow. Their contrast is gated in scripts/recipes/foundation.mjs.
const SWATCHES = ["red", "orange", "ochre", "olive", "green", "jade", "teal", "azure", "blue", "violet", "plum", "rose"]
// Two colours closer than this in OKLab read as one at a glance (the reading aid of contrast.mjs).
const SWATCH_SAME = 0.05
// No swatch may pass for the needs-you yellow (Vale U23: "the yellow of the set is an ochre").
const SWATCH_NEEDS_YOU = 0.1
let swatchMeasures = 0
{
  const start = Number(literal("--g-hue-red"))
  assert.ok(Number.isFinite(start), "--g-hue-red must be a hue angle")
  const rgb = (name) => toSrgb(parseColor(root.get(name))).rgb
  const needsYou = rgb("--g-needs-you-fill")
  for (const ground of ["stone", "graphite"]) {
    const colors = SWATCHES.map((hue, i) => {
      const n = String(i + 1).padStart(2, "0")
      const raw = `--g-swatch-${hue}-${ground}`
      assert.match(root.get(raw) ?? "", /^#[0-9A-F]{6}$/, `${raw}: a swatch is a raw six-digit hex`)
      const role = `--swatch-${n}`
      assert.equal((ground === "stone" ? light : dark).get(role), `var(${raw})`, `${role} (${ground}) must read ${raw}`)
      assert.equal(theme.get(`--color-swatch-${n}`), `var(${role})`, `missing --color-swatch-${n} in @theme`)
      const want = (start + 30 * i) % 360
      const { h } = oklabToOklch(parseColor(root.get(raw)))
      const off = Math.min(Math.abs(h - want), 360 - Math.abs(h - want))
      assert.ok(off <= 2, `${raw}: hue ${h.toFixed(1)}° is ${off.toFixed(1)}° off ${want}°; the twelve are 30° apart from hue.red`)
      return { raw, rgb: rgb(raw) }
    })
    colors.forEach((a, i) => {
      const b = colors[(i + 1) % colors.length]
      const near = difference(a.rgb, b.rgb).dE
      assert.ok(near >= SWATCH_SAME, `${a.raw} and ${b.raw} are ΔEOK ${near.toFixed(3)} apart: under ${SWATCH_SAME}, they read as one colour`)
      const yellow = difference(a.rgb, needsYou).dE
      assert.ok(yellow >= SWATCH_NEEDS_YOU, `${a.raw} is ΔEOK ${yellow.toFixed(3)} from the needs-you yellow: under ${SWATCH_NEEDS_YOU}`)
      swatchMeasures += 2
    })
  }
}

// ── The plain sheet (contract 5.1b #54): dist/plain.css, published as @unicron/tokens/plain.css ─
// For a page with no Tailwind (the extension's in-page frames). Held to:
//   - nothing to load and nothing Tailwind-only: no @import, url(), @font-face, @theme, @apply …
//   - it parses: whole comments, then flat rules of custom properties only, no style rule inside
//     another, and one @media (prefers-color-scheme: dark) block for the `system` ground
//   - the same custom properties as tokens.css outside its Tailwind blocks, plus the font roles
//   - every role and knob resolves to the same value as tokens.css in every mode (the 8, and no
//     data-theme), and a `system` root takes the graphite values while the browser prefers dark
let plainChecked = 0
{
  const plainCss = fs.readFileSync(path.join(here, "..", "dist", "plain.css"), "utf8")
  const SYSTEM = ":root.system:not(.light), :root.system:not(.light) [data-theme]:not(.light):not(:root.system .light *)"
  const MEDIA = "@media (prefers-color-scheme: dark)"

  // Nothing to fetch, nothing a strict style-src would refuse, nothing only Tailwind reads.
  const bare = plainCss.replace(/\/\*[\s\S]*?\*\//g, "")
  assert.ok(!/\/\*|\*\//.test(bare), "plain.css: a comment is not closed where it should be")
  for (const banned of [/@import/i, /url\(/i, /@font-face/i, /@theme/i, /@apply/i, /@utility/i, /@layer/i, /@custom-variant/i, /@source/i, /@plugin/i, /expression\(/i, /\bdata:/i, /&/]) {
    assert.ok(!banned.test(bare), `plain.css must not contain ${banned}: it loads under style-src 'self' with no build step`)
  }

  // Parse it: rules of custom properties, and one @media block of the same.
  const parsedPlain = { root: new Map(), themes: {}, light: new Map(), dark: new Map(), system: new Map() }
  let at = 0
  const ws = () => {
    while (at < bare.length && /\s/.test(bare[at])) at++
  }
  const rule = (inMedia) => {
    const open = bare.indexOf("{", at)
    assert.ok(open > at, `plain.css: expected a rule at offset ${at}`)
    const selector = bare.slice(at, open).trim().replace(/\s+/g, " ")
    const close = bare.indexOf("}", open)
    assert.ok(close > open, `plain.css: "${selector}" is not closed`)
    const body = bare.slice(open + 1, close)
    assert.ok(!body.includes("{"), `plain.css: "${selector}" holds a nested rule; the sheet is flat`)
    const declarations = new Map()
    for (const part of body.split(";")) {
      if (!part.trim()) continue
      const d = /^\s*(--[\w-]+)\s*:\s*(\S[\s\S]*?)\s*$/.exec(part)
      assert.ok(d, `plain.css: "${selector}" holds "${part.trim()}", which is not a custom property`)
      let depth = 0
      for (const ch of d[2]) {
        depth += ch === "(" ? 1 : ch === ")" ? -1 : 0
        assert.ok(depth >= 0, `plain.css: ${d[1]} has a ")" with no "("`)
      }
      assert.equal(depth, 0, `plain.css: ${d[1]} leaves a "(" open`)
      declarations.set(d[1], d[2])
    }
    at = close + 1
    const app = /^\[data-theme="([\w-]+)"\]$/.exec(selector)?.[1]
    let target
    if (inMedia) target = selector === SYSTEM ? parsedPlain.system : null
    else if (app) target = parsedPlain.themes[app] ??= new Map()
    else target = { ":root": parsedPlain.root, [LIGHT]: parsedPlain.light, [DARK]: parsedPlain.dark }[selector]
    assert.ok(target, `plain.css: unexpected selector "${selector}"${inMedia ? ` inside ${MEDIA}` : ""}`)
    for (const [k, v] of declarations) target.set(k, v)
  }
  let medias = 0
  for (ws(); at < bare.length; ws()) {
    if (bare.startsWith("@", at)) {
      const open = bare.indexOf("{", at)
      const prelude = bare.slice(at, open).trim().replace(/\s+/g, " ")
      assert.equal(prelude, MEDIA, `plain.css: the one at-rule allowed is "${MEDIA}"`)
      medias++
      at = open + 1
      for (ws(); bare[at] !== "}"; ws()) {
        assert.ok(at < bare.length, `plain.css: "${MEDIA}" is not closed`)
        rule(true)
      }
      at++
    } else rule(false)
  }
  assert.equal(medias, 1, `plain.css: expected one "${MEDIA}" block`)
  assert.deepEqual(Object.keys(parsedPlain.themes), APPS, "plain.css: expected one [data-theme] block per app")

  // The same custom properties as tokens.css outside @theme, and the font roles.
  const FONT_ROLES = ["--font-sans", "--font-mono", "--font-heading"]
  const names = (b) => new Set([...b.root.keys(), ...Object.values(b.themes).flatMap((m) => [...m.keys()]), ...b.light.keys(), ...b.dark.keys()])
  const inTokens = names(built)
  const inPlain = names(parsedPlain)
  for (const name of [...inTokens, ...FONT_ROLES]) assert.ok(inPlain.has(name), `plain.css is missing ${name}`)
  for (const name of inPlain) assert.ok(inTokens.has(name) || FONT_ROLES.includes(name), `plain.css declares ${name}, which tokens.css does not`)
  assert.deepEqual([...parsedPlain.system.keys()], [...parsedPlain.dark.keys()], "plain.css: the system block must re-declare every graphite role and knob")
  for (const name of [...built.light.keys(), ...built.dark.keys()]) {
    if (!parsedPlain.dark.has(name) && built.dark.has(name)) assert.fail(`plain.css: ${name} is missing from the dark block`)
  }

  // Every role and knob, in every mode, resolves as it does from tokens.css.
  const tokenFonts = new Map(FONT_ROLES.map((name) => [name, theme.get(name)]))
  const vars = (b, app, ground, extra = new Map()) =>
    new Map([...b.root, ...extra, ...(app ? b.themes[app] : []), ...b.light, ...(ground === "graphite" ? b.dark : ground === "system-dark" ? b.system : [])])
  const checked = [...new Set([...built.light.keys(), ...built.dark.keys(), ...FONT_ROLES])]
  for (const app of [null, ...APPS]) {
    for (const ground of ["stone", "graphite"]) {
      const want = vars(built, app, ground, tokenFonts)
      const got = vars(parsedPlain, app, ground)
      const system = vars(parsedPlain, app, ground === "graphite" ? "system-dark" : "stone")
      for (const name of checked) {
        const expected = resolveValue(want.get(name), want)
        assert.equal(resolveValue(got.get(name), got), expected, `plain.css: ${name} in ${app ?? "default"} / ${ground} differs from tokens.css`)
        assert.equal(resolveValue(system.get(name), system), expected, `plain.css: ${name} on a \`system\` root (browser prefers ${ground === "graphite" ? "dark" : "light"}) in ${app ?? "default"} differs from ${ground}`)
        plainChecked++
      }
    }
  }
}

console.log(
  `✓ foundation: ${SWATCHES.length} swatches on both grounds, 30° apart from hue.red (${swatchMeasures} distance checks); ` +
    `plain.css parses flat with nothing to load, and ${plainChecked} role and knob values equal tokens.css in 10 modes and on a system root`
)
