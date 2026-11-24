#!/usr/bin/env node
// Builds dist/tokens.css and dist/tokens.json from the DTCG sources in tokens/.
//
// Three tiers, three CSS prefixes:
//   tokens/global.json          → --g-*   raw values. Includes the 10 theme slots (--g-theme-*: the accent
//                                         only, since 2.0), with Unicron's own default accent.
//   tokens/semantic.json        → --*     roles: Figma's theme roles, with the shadcn contract as
//                                         aliases of them. light = $value, dark = $extensions["unicron.modes"].dark
//   tokens/component.json       → --c-*   per-component knobs that alias semantic tokens
//   + tokens/component/*.json             the same tier, one file per component area, merged in
//
// Two axes (docs/02-tokens.md → Two axes):
//   theme   the 10 theme slots (the accent). The core ships one generic default (global.json); an app declares
//           its own in its own layer, as `[data-theme="<app>"] { --g-theme-…: …; }` (Unicron 1:
//           no app's theme lives in the core). docs/05-consuming.md → Declare your app's theme.
//   ground  graphite (dark) and stone (light). Tier 2 reads the stone slot in light and the
//           graphite slot in dark.
// Every colour of tiers 2 and 3 is written in both ground blocks, even when its expression is the
// same in both: a custom property keeps the value it computed where it was declared, so an alias
// (`--background: var(--surface-ground)`) has to be declared again wherever its target changes.
// For the same reason both ground blocks also match [data-theme]: a box an app themes re-reads its
// slots on either ground, though the core declares no [data-theme="…"] block of its own.
//
// Type roles: tokens/type.json holds 23 typography composites. Each becomes five variables,
// --type-<role>-family, -weight, -size, -leading, -tracking (px → rem for size and leading).
//
// Springs (`$type: "spring"`, `$value: { stiffness, damping, mass }`, tier 1) have no CSS form of
// their own. Each is sampled into a `linear()` easing curve that runs over its sibling
// `<name>-duration` token; the raw numbers stay in tokens.json (`spring`) for JS.
//
// References use DTCG syntax: "{neutral.0}" (global), "{foreground}" (semantic), "{scrim.sheet}" (component).
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
const TYPE_KEY = "unicron.type"
const REM_PX = 16

// The two ground blocks. A box takes the ground of its nearest `.dark` or `.light` box, and
// `:root` is stone. A `.dark` or `.light` box declares the roles itself, so ground boxes nest to
// any depth. [data-theme] is in both blocks so a themed box re-reads its own slots, and a themed
// box with no ground class of its own finds its nearest ground by selector: dark when it sits in
// `.dark` with no `.light` between, or in `.dark .light .dark` with no `.light` after that, and so
// on, GROUND_DEPTH dark boxes deep (dark, light, dark, light, dark). @unicron/ui's `dark:` variant
// has the same reach. Deeper than that, give the themed box its own `dark` or `light` class.
const GROUND_DEPTH = 3
const alternations = (n) => Array.from({ length: n }, () => ".dark .light").join(" ")
const LIGHT_SELECTOR = ":root, .light, [data-theme]"
const DARK_SELECTOR = [
  ".dark",
  ...Array.from({ length: GROUND_DEPTH }, (_, k) => `${k ? `${alternations(k)} ` : ""}.dark [data-theme]:not(.light):not(${alternations(k + 1)} *)`),
].join(", ")

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
const plainFonts = []

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
      // The plain sheet has no Tailwind, so there they are root variables after all.
      plainFonts.push(`  ${css}: ${value};`)
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

// ── The theme axis: the 10 slots of global.json → theme ─────────────────────────────────────
// The core holds only its own default. Each slot is a raw value, so an app's layer can replace it
// under [data-theme="<app>"] and every role and knob above follows.
const slotTokens = tiers[0].tokens.filter((t) => t.path[0] === "theme")
if (slotTokens.length !== 10) throw new Error(`global.json: expected 10 theme slots (the accent, Unicron 2.0), found ${slotTokens.length}`)
for (const { path: p, token } of slotTokens) {
  if (typeof token.$value !== "string" || /[{]|var\(/.test(token.$value)) {
    throw new Error(`global.json ${p.join(".")}: a theme slot holds a raw value, not a reference`)
  }
}
const themeSlots = slotTokens.map((t) => byPath.get(t.path.join(".")))
if (fs.existsSync(path.join(src, "themes"))) throw new Error("tokens/themes/ is gone since 1.1: an app's theme lives in the app (Unicron 1)")

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
// The radius scale and the two shadows for Tailwind (rounded-xs … rounded-4xl, shadow-popover,
// shadow-dialog). Their theme keys share names with roles (--radius-md is both), and in the inline
// block a key that reads its own name would read itself. So they go in the plain @theme block below
// as the literal values the roles resolve to: Tailwind writes `border-radius: var(--radius-md)` and
// `box-shadow: var(--shadow-popover)` (with its own shadow plumbing), which read the roles.
/** "{radius-md}" → the literal it resolves to, through every alias. */
function literal(ref, from) {
  let value = ref
  for (let i = 0; i < 8 && typeof value === "string" && /^\{[^}]+\}$/.test(value); i++) {
    const dotted = value.slice(1, -1)
    const found = tiers.flatMap((t) => t.tokens).find((t) => t.path.join(".") === dotted)
    if (!found) throw new Error(`${from}: unresolved reference ${value}`)
    value = found.token.$value
  }
  return value
}
const plainTheme = []
for (const [step, ref] of Object.entries(theme.radius ?? {})) plainTheme.push(`  --radius-${step}: ${literal(ref, `unicron.theme radius.${step}`)};`)
for (const [name, ref] of Object.entries(theme.shadow ?? {})) plainTheme.push(`  --shadow-${name}: ${literal(ref, `unicron.theme shadow.${name}`)};`)
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
    // Tier 1 has no ground. Its theme slots hold Unicron's default theme; an app's layer replaces
    // them under its own [data-theme].
    css += block(`${titles.global} · theme slots hold the Unicron default`, ":root", lines)
    css += block("Type roles (--type-*)", ":root", typeLines)
    continue
  }
  const dark = blocks.dark.find((b) => b.tier === tier)
  css += block(`${titles[tier]} · light (stone)`, LIGHT_SELECTOR, lines)
  if (dark) css += block(`${titles[tier]} · dark (graphite)`, DARK_SELECTOR, dark.lines)
}
css += `/* ── Tailwind v4 theme map: exposes tier 2 as utilities (bg-surface-ground, text-text-label, bg-background, rounded-lg, h-control …) ── */\n@theme inline {\n${blocks.theme.join("\n")}\n}\n`
// Tailwind's bare `rounded` reads the theme key --radius, which has the same name as the radius
// role. In the inline block it would read itself, so it sits in a plain @theme block: Tailwind
// then writes `border-radius: var(--radius)`, the role, as every other step does, and declares
// the key on its theme layer with the role's own value (where the role is not declared, as in a
// shadow root, the corner still resolves).
css += `/* ── Tailwind v4 theme keys named like roles (bare \`rounded\`, the radius scale, the shadows), so not inline ── */\n@theme {\n  --radius: ${literal("{radius}", "--radius")};\n${plainTheme.join("\n")}\n}\n`

// ── The plain sheet: dist/plain.css (@unicron/tokens/plain.css) ───────────────────────────────
// For a page with no Tailwind that may load nothing it does not own: the browser extension's
// in-page frames (Lockdown B2 and B3; contract 5.1b #54). The same custom properties as
// tokens.css, every tier in every mode, as flat rules: no @theme, no nested style rule, no
// @import, no url(), no font file. A page whose policy is only `style-src 'self'` can link it.
// The page uses the roles by their own names (var(--surface-raised)); Tailwind's --color-* names
// are not here. The font roles, which tokens.css hands to Tailwind, are root variables here.
// Grounds differ from tokens.css in one way (Unicron 14): a root with no ground class follows the
// browser's light or dark setting, with no script. `class="stone"` forces stone and
// `class="graphite"` forces graphite; `light` and `dark` still work as before, and so does the old
// `system` class (it is now the same as no class). A themed box inside a root that follows the
// browser re-reads its slots, one level deep, as it does inside `.dark`.
// scripts/check.mjs holds the file to all of this.
const PLAIN_LIGHT_SELECTOR = `${LIGHT_SELECTOR}, .stone`
const PLAIN_DARK_SELECTOR = `${DARK_SELECTOR}, .graphite, .graphite [data-theme]:not(.light):not(.stone):not(.graphite .light *):not(.graphite .stone *)`
const FORCED = ":not(.light):not(.stone):not(.dark):not(.graphite)"
const SYSTEM_SELECTOR = `:root${FORCED}, :root${FORCED} [data-theme]:not(.light):not(.stone):not(:root .light *):not(:root .stone *)`
let plain = `/* Generated by @unicron/tokens (scripts/build.mjs) from the JSON sources in tokens/ — do not edit.
   The plain sheet: every role and knob in both grounds as custom properties, for a page with no
   Tailwind (an extension frame). No @theme, no nested style rule, no @import, no url(): it loads
   under a policy of style-src 'self' alone. Grounds: with no class the root follows the browser's
   prefers-color-scheme; the class stone (or light) forces stone, graphite (or dark) forces
   graphite. An app's theme: its own [data-theme] block of the 10 accent slots, on the root or a box. */\n\n`
for (const { tier, lines } of blocks.light) {
  if (tier === "global") {
    plain += block(`${titles.global} · theme slots hold the Unicron default`, ":root", lines)
    plain += block("Type roles (--type-*)", ":root", typeLines)
    plain += block("Font roles (--font-*; Tailwind theme variables in tokens.css)", ":root", plainFonts)
    continue
  }
  const dark = blocks.dark.find((b) => b.tier === tier)
  plain += block(`${titles[tier]} · light (stone)`, PLAIN_LIGHT_SELECTOR, lines)
  if (dark) plain += block(`${titles[tier]} · dark (graphite)`, PLAIN_DARK_SELECTOR, dark.lines)
}
const indent = (text) => text.replace(/^(?=.)/gm, "  ")
plain += `/* ── A root with no ground class follows the browser: the dark (graphite) blocks again, while it prefers dark ── */\n@media (prefers-color-scheme: dark) {\n`
plain += blocks.dark.map(({ tier, lines }) => indent(`/* ${titles[tier]} · system, dark */\n${SYSTEM_SELECTOR} {\n${lines.join("\n")}\n}\n`)).join("\n")
plain += "}\n"

fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, "tokens.css"), css)
fs.writeFileSync(path.join(out, "plain.css"), plain)
fs.writeFileSync(
  path.join(out, "tokens.json"),
  JSON.stringify(
    {
      $generated: "@unicron/tokens scripts/build.mjs",
      // The 10 theme slots an app declares under its own [data-theme] (their default values are in
      // `tokens`). The contrast tool (bin unicron-contrast) measures an app's theme by them.
      themeSlots,
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
  `✓ tokens built: ${counts}, type roles ${Object.keys(typeRoles).length}, ${themeSlots.length} theme slots (the Unicron default; apps declare their own) → dist/tokens.css, dist/plain.css, dist/tokens.json`
)
