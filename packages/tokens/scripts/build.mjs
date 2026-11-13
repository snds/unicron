#!/usr/bin/env node
// Builds dist/tokens.css and dist/tokens.json from the DTCG sources in tokens/.
//
// Three tiers, three CSS prefixes:
//   tokens/global.json          → --g-*   raw values. Includes the theme slots (--g-theme-*), with
//                                         the default app's values.
//   tokens/semantic.json        → --*     roles: Figma's theme roles, with the shadcn contract as
//                                         aliases of them. light = $value, dark = $extensions["unicron.modes"].dark
//   tokens/component.json       → --c-*   per-component knobs that alias semantic tokens
//   + tokens/component/*.json             the same tier, one file per component area, merged in
//
// Two axes (docs/02-tokens.md → Two axes):
//   app     tokens/themes/<app>.json re-declares the 28 theme slots under [data-theme="<app>"].
//           No attribute = the defaults in global.json.
//   ground  graphite (dark) and stone (light). Tier 2 reads the stone slot in light and the
//           graphite slot in dark.
// Every colour of tiers 2 and 3 is written in both ground blocks, even when its expression is the
// same in both: a custom property keeps the value it computed where it was declared, so an alias
// (`--background: var(--surface-ground)`) has to be declared again wherever its target changes.
// For the same reason both ground blocks also match [data-theme]: a themed box re-reads its slots.
//
// Type roles: tokens/type.json holds 23 typography composites. Each becomes five variables,
// --type-<role>-family, -weight, -size, -leading, -tracking (px → rem for size and leading).
//
// Springs (`$type: "spring"`, `$value: { stiffness, damping, mass }`, tier 1) have no CSS form of
// their own. Each is sampled into a `linear()` easing curve that runs over its sibling
// `<name>-duration` token; the raw numbers stay in tokens.json (`spring`) for JS.
//
// References use DTCG syntax: "{neutral.0}" (global), "{foreground}" (semantic), "{icon.fill}" (component).
// They resolve to var(--…) so the cascade stays live (a dark override of a semantic token
// flows into every component token that aliases it).
//
// This is a deliberately small hand-rolled build. Style Dictionary (or Terrazzo) is the
// planned replacement once we need more than one output platform; the JSON is already
// in DTCG shape so that swap is a build change, not a source change.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { springToLinear } from "../src/spring.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, "..")
const src = path.join(root, "tokens")
const out = path.join(root, "dist")

const MODES_KEY = "unicron.modes"
const THEME_KEY = "unicron.theme"
const APP_KEY = "unicron.app"
const DEFAULT_APP_KEY = "unicron.default-app"
const TYPE_KEY = "unicron.type"
const REM_PX = 16

// The two ground blocks. `.light` mirrors `.dark` so a light box can sit in a dark page, and
// [data-theme] is in both so a themed box takes its own slots on the ground it sits on. One
// level of nesting, the same as @unicron/ui's `dark:` variant.
const LIGHT_SELECTOR = ":root, .light, [data-theme]"
const DARK_SELECTOR = ".dark, .dark [data-theme]:not(.light):not(.dark .light *)"

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"))
const jsonFiles = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(dir, f)) : []
const rel = (file) => path.relative(src, file)

/** Flatten a DTCG tree into [{ path, token }] (depth-first, source order). */
function flatten(node, trail = [], acc = []) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue
    if (value && typeof value === "object" && "$value" in value) {
      acc.push({ path: [...trail, key], token: value })
    } else if (value && typeof value === "object") {
      flatten(value, [...trail, key], acc)
    }
  }
  return acc
}

// ── Tier 3: component.json plus one file per component area ──────────────────────────────────
// A file in tokens/component/ adds knobs, and may re-declare a knob that component.json already
// holds (the area that restyles a component owns its knobs from then on); the build says so.
// Two area files may not declare the same knob.
function componentTokens() {
  const base = path.join(src, "component.json")
  const byPath = new Map()
  const notes = []
  for (const { path: p, token } of flatten(readJson(base))) byPath.set(p.join("."), { path: p, token, file: base })
  for (const file of jsonFiles(path.join(src, "component"))) {
    for (const { path: p, token } of flatten(readJson(file))) {
      const dotted = p.join(".")
      const prior = byPath.get(dotted)
      if (prior && prior.file !== base) {
        throw new Error(`component knob {${dotted}} is declared in both ${rel(prior.file)} and ${rel(file)}`)
      }
      if (prior) notes.push(`${rel(file)} re-declares {${dotted}} from component.json`)
      // Keep the knob's original place in the output when it is re-declared.
      byPath.set(dotted, { path: p, token, file })
    }
  }
  return { tokens: [...byPath.values()], notes }
}

const component = componentTokens()
const globalJson = readJson(path.join(src, "global.json"))
const semanticJson = readJson(path.join(src, "semantic.json"))
const tiers = [
  { name: "global", prefix: "g-", tokens: flatten(globalJson) },
  { name: "semantic", prefix: "", tokens: flatten(semanticJson) },
  { name: "component", prefix: "c-", tokens: component.tokens },
]

// Reference index: "neutral.0" → "--g-neutral-0". Later tiers can shadow earlier ones only
// if a path collides, which the naming scheme (prefixes) is designed to avoid.
const byPath = new Map()
for (const tier of tiers) {
  for (const { path: p } of tier.tokens) {
    const dotted = p.join(".")
    const css = `--${tier.prefix}${p.join("-")}`
    if (byPath.has(dotted)) throw new Error(`duplicate token path across tiers: ${dotted}`)
    byPath.set(dotted, css)
  }
}

/** "400ms" | "0.4s" → milliseconds. */
function toMs(value, from) {
  const m = /^([\d.]+)(ms|s)$/.exec(String(value))
  if (!m) throw new Error(`${from}: expected a duration in ms or s, got ${JSON.stringify(value)}`)
  return Number(m[1]) * (m[2] === "s" ? 1000 : 1)
}

/** A spring token → a CSS linear() curve over its sibling `<name>-duration` token. */
function springCss(tier, p, token, from) {
  const { stiffness, damping, mass = 1 } = token.$value
  if (!(stiffness > 0) || !(damping > 0) || !(mass > 0)) {
    throw new Error(`${from}: a spring needs positive stiffness, damping and mass`)
  }
  const siblingPath = [...p.slice(0, -1), `${p.at(-1)}-duration`].join(".")
  const sibling = tier.tokens.find((t) => t.path.join(".") === siblingPath)
  if (!sibling) throw new Error(`${from}: spring needs a sibling duration token {${siblingPath}}`)
  return springToLinear({ stiffness, damping, mass }, toMs(sibling.token.$value, siblingPath))
}

function resolveRef(ref, from) {
  const css = byPath.get(ref)
  if (!css) throw new Error(`${from}: unresolved reference {${ref}}`)
  return `var(${css})`
}

/** A DTCG value → a CSS value string. */
function toCss(value, type, from) {
  if (typeof value === "string") {
    return value.replace(/\{([^}]+)\}/g, (_, ref) => resolveRef(ref, from))
  }
  if (typeof value === "number") return String(value)
  if (Array.isArray(value)) {
    if (type === "cubicBezier") return `cubic-bezier(${value.join(", ")})`
    if (type === "fontFamily") return value.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(", ")
    throw new Error(`${from}: unsupported array value for type ${type}`)
  }
  throw new Error(`${from}: unsupported value ${JSON.stringify(value)}`)
}

const flat = {}
const blocks = { light: [], dark: [], theme: [] }

for (const tier of tiers) {
  const light = []
  const dark = []
  for (const { path: p, token } of tier.tokens) {
    const css = byPath.get(p.join("."))
    const type = token.$type
    const themeOnly = tier.name === "semantic" && type === "fontFamily"
    const isSpring = type === "spring" && typeof token.$value === "object"
    const value = isSpring ? springCss(tier, p, token, css) : toCss(token.$value, type, css)
    const darkRaw = token.$extensions?.[MODES_KEY]?.dark
    const darkValue = darkRaw === undefined ? undefined : toCss(darkRaw, type, css)

    flat[css] = {
      tier: tier.name,
      path: p.join("."),
      type,
      value,
      ...(darkValue !== undefined && { dark: darkValue }),
      ...(isSpring && { spring: { mass: 1, ...token.$value } }),
      ...(token.$description && { description: token.$description }),
    }

    if (themeOnly) {
      // Fonts are Tailwind theme variables, not root variables: Tailwind owns --font-*.
      blocks.theme.push(`  ${css}: ${value};`)
      continue
    }
    light.push(`  ${css}: ${value};`)
    // A colour above tier 1 is declared on both grounds (see the header). Anything else is
    // declared in dark only when it has a dark value of its own.
    const onBothGrounds = tier.name !== "global" && type === "color"
    if (darkValue !== undefined || onBothGrounds) dark.push(`  ${css}: ${darkValue ?? value};`)

    if (tier.name === "semantic" && type === "color") {
      blocks.theme.push(`  --color-${p.join("-")}: var(${css});`)
    }
  }
  blocks.light.push({ tier: tier.name, lines: light })
  if (dark.length) blocks.dark.push({ tier: tier.name, lines: dark })
}

// ── The app axis: tokens/themes/<app>.json ───────────────────────────────────────────────────
// Each file re-declares the theme slots of global.json, all of them and nothing else, as raw
// values. The default app's file must equal the defaults, so `data-theme="<default>"` and no
// attribute are the same thing.
const slotPaths = tiers[0].tokens.filter((t) => t.path[0] === "theme").map((t) => t.path.join("."))
const defaultApp = globalJson.theme?.$extensions?.[DEFAULT_APP_KEY]
if (!slotPaths.length || !defaultApp) throw new Error("global.json: expected a `theme` group that names its default app")

const apps = jsonFiles(path.join(src, "themes"))
  .map((file) => {
    const json = readJson(file)
    const meta = json.$extensions?.[APP_KEY]
    const name = path.basename(file, ".json")
    if (!meta || meta.name !== name) throw new Error(`${rel(file)}: $extensions["${APP_KEY}"].name must be "${name}"`)
    const tokens = flatten(json)
    const paths = tokens.map((t) => t.path.join("."))
    const missing = slotPaths.filter((p) => !paths.includes(p))
    const extra = paths.filter((p) => !slotPaths.includes(p))
    if (missing.length) throw new Error(`${rel(file)}: missing theme slots: ${missing.join(", ")}`)
    if (extra.length) throw new Error(`${rel(file)}: holds tokens that are not theme slots: ${extra.join(", ")}`)
    const lines = []
    const values = {}
    for (const { path: p, token } of tokens) {
      const css = byPath.get(p.join("."))
      if (typeof token.$value !== "string" || /[{]|var\(/.test(token.$value)) {
        throw new Error(`${rel(file)} ${p.join(".")}: a theme slot holds a raw value, not a reference`)
      }
      lines.push(`  ${css}: ${token.$value};`)
      values[css] = token.$value
    }
    return { name, order: meta.order ?? Infinity, figmaModes: meta.figmaModes, lines, values }
  })
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))

const defaultTheme = apps.find((a) => a.name === defaultApp)
if (!defaultTheme) throw new Error(`global.json names the default app "${defaultApp}", but tokens/themes/${defaultApp}.json is missing`)
for (const [css, value] of Object.entries(defaultTheme.values)) {
  if (flat[css].value !== value) {
    throw new Error(`${css}: the default in global.json (${flat[css].value}) differs from tokens/themes/${defaultApp}.json (${value})`)
  }
}

// ── Type roles: tokens/type.json ─────────────────────────────────────────────────────────────
const round = (n) => +n.toFixed(5)
function pxToRem(value, from) {
  const m = /^(-?[\d.]+)px$/.exec(String(value))
  if (!m) throw new Error(`${from}: expected px, got ${JSON.stringify(value)}`)
  return `${round(Number(m[1]) / REM_PX)}rem`
}
const typeLines = []
const typeRoles = {}
for (const { path: p, token } of flatten(readJson(path.join(src, "type.json")))) {
  const from = `type.json ${p.join(".")}`
  if (token.$type !== "typography") throw new Error(`${from}: expected $type "typography"`)
  const v = token.$value
  if (!/^-?[\d.]+em$/.test(String(v.letterSpacing))) throw new Error(`${from}: letterSpacing must be in em, got ${JSON.stringify(v.letterSpacing)}`)
  const parts = {
    family: { type: "fontFamily", value: toCss(v.fontFamily, "fontFamily", from) },
    weight: { type: "fontWeight", value: String(v.fontWeight) },
    size: { type: "dimension", value: pxToRem(v.fontSize, from), px: parseFloat(v.fontSize) },
    leading: { type: "dimension", value: pxToRem(v.lineHeight, from), px: parseFloat(v.lineHeight) },
    tracking: { type: "dimension", value: v.letterSpacing },
  }
  const base = `--${p.join("-")}`
  const role = p.slice(1).join("-")
  typeRoles[role] = { ...(token.$extensions?.[TYPE_KEY] ?? {}) }
  for (const [part, { type, value, px }] of Object.entries(parts)) {
    const css = `${base}-${part}`
    if (flat[css]) throw new Error(`${from}: ${css} is already a token`)
    flat[css] = {
      tier: "type",
      path: [...p, part].join("."),
      type,
      value,
      ...(px !== undefined && { px }),
      ...(token.$description && { description: token.$description }),
    }
    typeLines.push(`  ${css}: ${value};`)
    typeRoles[role][part] = value
  }
}

// ── The Tailwind theme map ───────────────────────────────────────────────────────────────────
const theme = semanticJson.$extensions?.[THEME_KEY] ?? {}
// Radius scale for Tailwind (rounded-sm … rounded-4xl) as multiples of --radius.
for (const [step, factor] of Object.entries(theme.radius ?? {})) {
  blocks.theme.push(
    factor === 1 ? `  --radius-${step}: var(--radius);` : `  --radius-${step}: calc(var(--radius) * ${factor});`
  )
}
// Named sizes for Tailwind's spacing and sizing utilities (h-control, size-control, min-h-touch-min).
for (const [name, value] of Object.entries(theme.spacing ?? {})) {
  blocks.theme.push(`  --spacing-${name}: ${toCss(value, "dimension", `unicron.theme spacing.${name}`)};`)
}

// Motion: Tailwind's default transition (what `transition`, `transition-colors`, `transition-all`
// use when no duration or curve is given) runs on the motion roles, not Tailwind's 150ms ease.
blocks.theme.push(
  "  --default-transition-duration: var(--motion-fast);",
  "  --default-transition-timing-function: var(--motion-ease);",
  "  --ease-standard: var(--motion-ease);",
  // The other curves and the two default springs as utilities: ease-enter, ease-exit, ease-move,
  // ease-emphasis, ease-spring-settle, ease-spring-firm. Durations stay as duration-(--motion-*).
  "  --ease-enter: var(--motion-ease-enter);",
  "  --ease-exit: var(--motion-ease-exit);",
  "  --ease-move: var(--motion-ease-move);",
  "  --ease-emphasis: var(--motion-ease-emphasis);",
  "  --ease-spring-settle: var(--motion-spring-settle);",
  "  --ease-spring-firm: var(--motion-spring-firm);"
)

// ── Write ────────────────────────────────────────────────────────────────────────────────────
const titles = {
  global: "Tier 1 · Global primitives (--g-*)",
  semantic: "Tier 2 · Semantic roles (--*)",
  component: "Tier 3 · Component knobs (--c-*)",
}
const block = (title, selector, lines) => `/* ── ${title} ── */\n${selector} {\n${lines.join("\n")}\n}\n\n`

// (No glob in this comment: a `*` followed by `/` would end it early and break the first rule.)
let css = `/* Generated by @unicron/tokens (scripts/build.mjs) from the JSON sources in tokens/ — do not edit. */\n\n`
for (const { tier, lines } of blocks.light) {
  if (tier === "global") {
    // Tier 1 has no ground. The app axis follows it: one block of theme slots per app.
    css += block(`${titles.global} · theme slots default to ${defaultApp}`, ":root", lines)
    for (const app of apps) css += block(`Tier 1 · App theme: ${app.name} (--g-theme-*)`, `[data-theme="${app.name}"]`, app.lines)
    css += block("Type roles (--type-*)", ":root", typeLines)
    continue
  }
  const dark = blocks.dark.find((b) => b.tier === tier)
  css += block(`${titles[tier]} · light (stone)`, LIGHT_SELECTOR, lines)
  if (dark) css += block(`${titles[tier]} · dark (graphite)`, DARK_SELECTOR, dark.lines)
}
css += `/* ── Tailwind v4 theme map: exposes tier 2 as utilities (bg-surface-ground, text-text-label, bg-background, rounded-lg, h-control …) ── */\n@theme inline {\n${blocks.theme.join("\n")}\n}\n`

fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, "tokens.css"), css)
fs.writeFileSync(
  path.join(out, "tokens.json"),
  JSON.stringify(
    {
      $generated: "@unicron/tokens scripts/build.mjs",
      defaultApp,
      // Each app's theme slots, keyed like `tokens`. An app's value replaces the token's `value`.
      themes: Object.fromEntries(apps.map((a) => [a.name, a.values])),
      // The type roles, grouped: { body: { family, weight, size, leading, tracking }, … }.
      type: typeRoles,
      tokens: flat,
    },
    null,
    2
  ) + "\n"
)

for (const note of component.notes) console.log(`  note: ${note}`)
const counts = tiers.map((t) => `${t.name} ${t.tokens.length}`).join(", ")
console.log(
  `✓ tokens built: ${counts}, type roles ${Object.keys(typeRoles).length}, app themes ${apps.length} (${apps.map((a) => a.name).join(", ")}; default ${defaultApp}) → dist/tokens.css, dist/tokens.json`
)
