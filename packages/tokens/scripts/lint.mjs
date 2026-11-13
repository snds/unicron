#!/usr/bin/env node
// Token lint: the mechanical rules behind docs/06-contributing.md → "Token lint".
//
//   (a) Tiers 2 and 3 (tokens/semantic.json, tokens/component.json and every file in
//       tokens/component/) alias, they do not invent.
//       Every colour there — `$value` and every `$extensions["unicron.modes"].*` value — must be
//       a `{reference}` (or a composition such as `color-mix(in oklab, {ref} 45%, transparent)`
//       whose colours are all references). No hex / rgb() / hsl() / oklch() / oklab() literals,
//       no named colours except `transparent` and `currentcolor`, no raw `var(--…)` (that
//       bypasses the token graph; write `{name}` and let the builder emit the var()).
//       Every semantic token of any type must be a bare `{reference}`.
//       A reference may point at its own tier or a lower one, never a higher one.
//       Non-colour component knobs (sizes, axis numbers) may hold a literal: tier 3 exists to
//       hold per-component sizes (see component.json → $description).
//       A component knob that times a motion (its name ends in `-duration`) is the exception:
//       it must be a `{reference}` to a motion role, so no component invents its own speed.
//       Timers that are behaviour, not motion (`lifetime`, `arm-delay`, `expiring-at`), may
//       stay literal.
//       No role points at the legacy neutral ramp (`{neutral.*}`, `{white-alpha.*}`): it is not
//       themed. success, warning and info keep their accent ramps, labels included.
//       A component knob's colour reads a role, never tier 1: `{needs-you-fill}` (the role), not
//       `{needs-you.fill}` (the raw value).
//       Two files in tokens/component/ may not declare the same knob.
//       A component knob for a corner (a dimension whose name ends in `-radius`) is the one 2px
//       corner: it must be the bare reference `{radius}`, so no component draws a rounder part.
//   (t) Theme files (tokens/themes/<app>.json) hold the theme slots of global.json, all of them
//       and nothing else: a raw six-digit hex each, with the Figma variable id in `$description`.
//       The defaults in global.json follow the same rule.
//   (y) Type roles (tokens/type.json) are typography composites: the family is a `{font.*}`
//       reference; size and line height are px, the line height a multiple of 4; letter spacing
//       is em; the weight is one of the four the fonts ship.
//   (b) Primitives (packages/ui/src) carry no colour literals: no hex, rgb(), hsl(), oklch(),
//       oklab() in any .ts/.tsx/.css file. Tailwind arbitrary values that reference a token,
//       e.g. `bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]`, are fine.
//   (c) Primitives carry no motion literals either (tests excluded): no Tailwind `duration-200`,
//       `delay-150`, `duration-[200ms]`, `ease-in`, `ease-out`, `ease-in-out`; no `cubic-bezier()`
//       or `linear()`; no raw time in a `transition` or `animation` declaration; no tier 1 motion
//       variable (`--g-duration-*`, `--g-ease-*`, `--g-spring-*`, `--g-stagger-*`, `--g-press-*`);
//       and no `transition-all`, which animates whatever happens to change. Write a motion role:
//       `duration-(--motion-base)`, `ease-exit`, `var(--motion-ease-move)`. `ease-linear` is
//       allowed: it is for a value that tracks a real quantity (a countdown, a progress bar).
//
// Run: pnpm lint:tokens (root) · exit 1 with every violation listed, 0 when clean.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const tokensRoot = path.resolve(here, "..")
const repoRoot = path.resolve(tokensRoot, "..", "..")
const uiSrc = path.join(repoRoot, "packages", "ui", "src")

const MODES_KEY = "unicron.modes"
const jsonFiles = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(path.basename(dir), f)) : []
const TIERS = [
  { name: "global", rank: 1, files: ["global.json"] },
  { name: "semantic", rank: 2, files: ["semantic.json"] },
  { name: "component", rank: 3, files: ["component.json", ...jsonFiles(path.join(tokensRoot, "tokens", "component"))] },
]
const readTokens = (file) => JSON.parse(fs.readFileSync(path.join(tokensRoot, "tokens", file), "utf8"))
const REF = /\{([^}]+)\}/g
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/g
const NAMED_COLOR =
  /\b(?:black|white|red|green|blue|gray|grey|silver|yellow|orange|purple|pink|brown|cyan|magenta|teal|navy|maroon|olive|lime|aqua|fuchsia)\b/i

const errors = []
const fail = (where, msg) => errors.push(`${where}: ${msg}`)

/** Flatten a DTCG tree into [{ path, token }] (same walk as build.mjs). */
function flatten(node, trail = [], acc = []) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue
    if (value && typeof value === "object" && "$value" in value) acc.push({ path: [...trail, key], token: value })
    else if (value && typeof value === "object") flatten(value, [...trail, key], acc)
  }
  return acc
}

// ── (a) tier rules ────────────────────────────────────────────────────────────────────────────
const tiers = TIERS.map((t) => ({
  ...t,
  tokens: t.files.flatMap((file) => flatten(readTokens(file)).map((entry) => ({ ...entry, file }))),
}))
const rankByPath = new Map()
const typeByPath = new Map()
for (const tier of tiers) {
  for (const { path: p, token } of tier.tokens) {
    rankByPath.set(p.join("."), tier.rank)
    typeByPath.set(p.join("."), token.$type)
  }
}
// A file in tokens/component/ may re-declare a knob of component.json (it owns that component from
// then on, and the build says so). Two of those files may not declare the same knob.
{
  const owner = new Map()
  for (const { path: p, file } of tiers[2].tokens) {
    if (file === "component.json") continue
    const dotted = p.join(".")
    if (owner.has(dotted)) fail(`${file} ${dotted}`, `also declared in ${owner.get(dotted)}; one area owns a knob`)
    owner.set(dotted, file)
  }
}

const LEGACY_RAMP = /^(neutral|white-alpha)\./
const KEEPS_RAMP = /^(success|warning|info)(-|$)/

function checkValue(tier, file, dotted, label, value, type) {
  if (typeof value !== "string") {
    // numbers and arrays are literals by construction
    if (tier.rank === 2) fail(`${file} ${dotted}`, `${label} must be a {reference}, got ${JSON.stringify(value)}`)
    return
  }
  const refs = [...value.matchAll(REF)].map((m) => m[1])
  for (const ref of refs) {
    const rank = rankByPath.get(ref)
    if (rank === undefined) fail(`${file} ${dotted}`, `${label} references {${ref}}, which does not exist`)
    else if (rank > tier.rank) fail(`${file} ${dotted}`, `${label} references {${ref}} from a higher tier (${TIERS[rank - 1].name})`)
  }
  const rest = value.replace(REF, "")
  const bareRef = refs.length === 1 && rest.trim() === ""

  if (type === "color") {
    const literal = rest.match(COLOR_LITERAL)
    if (literal) fail(`${file} ${dotted}`, `${label} contains a raw colour literal (${literal[0]}…); alias a lower-tier token instead`)
    if (/var\(/.test(rest)) fail(`${file} ${dotted}`, `${label} uses var(--…); write a {reference} so the token graph stays whole`)
    const named = rest.replace(/\btransparent\b|\bcurrentcolor\b/gi, "").match(NAMED_COLOR)
    if (named) fail(`${file} ${dotted}`, `${label} contains the named colour "${named[0]}"`)
    if (refs.length === 0) fail(`${file} ${dotted}`, `${label} is a colour with no {reference}: "${value}"`)
    for (const ref of refs) {
      if (LEGACY_RAMP.test(ref) && !(tier.rank === 2 && KEEPS_RAMP.test(dotted))) {
        fail(`${file} ${dotted}`, `${label} references {${ref}}: the legacy neutral ramp is not themed; point at a role (text-body, surface-raised, line-rule …)`)
      } else if (tier.rank === 3 && rankByPath.get(ref) === 1) {
        fail(`${file} ${dotted}`, `${label} references {${ref}}, a tier 1 value; a component knob's colour reads a role`)
      }
    }
    return
  }
  if (tier.rank === 3 && label === "$value" && /-duration$/.test(dotted) && !bareRef) {
    fail(`${file} ${dotted}`, `a motion duration must be a {reference} to a motion role (e.g. {motion-base}), got "${value}"`)
  }
  if (tier.rank === 3 && label === "$value" && /-radius$/.test(dotted) && !(bareRef && refs[0] === "radius")) {
    fail(`${file} ${dotted}`, `a corner knob must be {radius}, the one 2px corner (contract §1.6), got "${value}"`)
  }
  if (tier.rank === 2 && !bareRef) fail(`${file} ${dotted}`, `${label} must be a bare {reference} in the semantic tier, got "${value}"`)
}

let checked = 0
for (const tier of tiers) {
  if (tier.rank === 1) continue
  for (const { path: p, token, file } of tier.tokens) {
    const dotted = p.join(".")
    checked++
    checkValue(tier, file, dotted, "$value", token.$value, token.$type)
    for (const [mode, v] of Object.entries(token.$extensions?.[MODES_KEY] ?? {})) {
      checkValue(tier, file, dotted, `${mode} mode`, v, token.$type)
    }
  }
}

// ── (t) theme files ───────────────────────────────────────────────────────────────────────────
// The app axis is tier 1: raw values, one per Figma primitive. A slot is a six-digit hex, written
// as Figma writes it, and says which Figma variable it came from.
const HEX = /^#[0-9A-F]{6}$/
const FIGMA_ID = /VariableID:\d+:\d+/
function checkSlot(file, dotted, token) {
  if (token.$type !== "color") fail(`${file} ${dotted}`, `a theme slot is a colour, got $type ${JSON.stringify(token.$type)}`)
  if (typeof token.$value !== "string" || !HEX.test(token.$value)) {
    fail(`${file} ${dotted}`, `a theme slot is a raw six-digit hex in capitals, as Figma writes it; got ${JSON.stringify(token.$value)}`)
  }
  if (!FIGMA_ID.test(token.$description ?? "")) fail(`${file} ${dotted}`, "$description must name the Figma variable the value came from (VariableID:…)")
}
const defaultSlots = tiers[0].tokens.filter((t) => t.path[0] === "theme")
const slotPaths = defaultSlots.map((t) => t.path.join("."))
for (const { path: p, token } of defaultSlots) checkSlot("global.json", p.join("."), token)
const themeFiles = jsonFiles(path.join(tokensRoot, "tokens", "themes"))
if (!themeFiles.length) fail("tokens/themes", "no app theme files found")
for (const file of themeFiles) {
  const json = readTokens(file)
  const app = path.basename(file, ".json")
  if (json.$extensions?.["unicron.app"]?.name !== app) fail(file, `$extensions["unicron.app"].name must be "${app}", the file's own name`)
  const slots = flatten(json)
  const paths = slots.map((t) => t.path.join("."))
  for (const missing of slotPaths.filter((q) => !paths.includes(q))) fail(file, `missing theme slot ${missing}`)
  for (const { path: q, token } of slots) {
    const dotted = q.join(".")
    if (!slotPaths.includes(dotted)) fail(`${file} ${dotted}`, "not a theme slot of global.json; a theme file holds the slots and nothing else")
    else checkSlot(file, dotted, token)
  }
}

// ── (y) type roles ────────────────────────────────────────────────────────────────────────────
const TYPE_KEYS = ["fontFamily", "fontWeight", "fontSize", "lineHeight", "letterSpacing"]
const typeTokens = flatten(readTokens("type.json"))
for (const { path: p, token } of typeTokens) {
  const where = `type.json ${p.join(".")}`
  const v = token.$value
  if (p[0] !== "type" || p.length !== 2) fail(where, "a type role sits directly under `type`, so its variables are --type-<role>-…")
  if (token.$type !== "typography" || !v || typeof v !== "object") {
    fail(where, "a type role is a typography composite")
    continue
  }
  const keys = Object.keys(v)
  if (keys.length !== TYPE_KEYS.length || TYPE_KEYS.some((k) => !keys.includes(k))) fail(where, `$value holds exactly ${TYPE_KEYS.join(", ")}`)
  const family = /^\{([^}]+)\}$/.exec(String(v.fontFamily))?.[1]
  if (!family || rankByPath.get(family) !== 1 || typeByPath.get(family) !== "fontFamily") {
    fail(where, `fontFamily must be a {reference} to a tier 1 font ({font.sans}, {font.mono}), got ${JSON.stringify(v.fontFamily)}`)
  }
  if (![400, 500, 600, 700].includes(v.fontWeight)) fail(where, `fontWeight must be 400, 500, 600 or 700 (the weights the fonts ship), got ${JSON.stringify(v.fontWeight)}`)
  if (!/^[\d.]+px$/.test(String(v.fontSize))) fail(where, `fontSize must be in px, as Figma holds it; got ${JSON.stringify(v.fontSize)}`)
  const leading = /^([\d.]+)px$/.exec(String(v.lineHeight))?.[1]
  if (leading === undefined) fail(where, `lineHeight must be in px, as Figma holds it; got ${JSON.stringify(v.lineHeight)}`)
  else if (Number(leading) % 4 !== 0) fail(where, `lineHeight ${v.lineHeight} is off the 4px grid`)
  if (!/^-?[\d.]+em$/.test(String(v.letterSpacing))) fail(where, `letterSpacing must be in em (Figma's percent ÷ 100); got ${JSON.stringify(v.letterSpacing)}`)
}

// ── (b) no colour literals in primitives ──────────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (/\.(tsx?|css)$/.test(entry.name)) acc.push(full)
  }
  return acc
}
const files = walk(uiSrc)
for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split("\n")
  lines.forEach((line, i) => {
    const hits = line.match(COLOR_LITERAL)
    if (!hits) return
    const rel = path.relative(repoRoot, file)
    fail(`${rel}:${i + 1}`, `raw colour literal ${hits.join(", ")} — bind to a token (var(--…) / a semantic utility class) instead`)
  })
}

// ── (c) no motion literals in primitives ──────────────────────────────────────────────────────
const MOTION_RULES = [
  [/(?<![\w-])(?:duration|delay)-(?:\d+|\[\d[^\]]*\])(?![\w-])/g, "a raw duration; write duration-(--motion-…)"],
  [/(?<![\w-])ease-(?:in-out|in|out)(?![\w-])/g, "a generic curve; use a motion role (ease-enter, ease-exit, ease-move, var(--motion-ease-…))"],
  [/cubic-bezier\(|(?<![\w-])linear\(/g, "a hand-written curve; curves are tokens (var(--motion-ease-…), var(--motion-spring-…))"],
  [/--g-(?:duration|ease|spring|stagger|press)-[\w-]+/g, "a tier 1 motion value; use its --motion-* role"],
  [/(?<![\w-])transition-all(?![\w-])/g, "transition-all animates anything that changes; name the properties"],
]
const TIMED_DECLARATION = /(?:transition|animation)(?:-duration|-delay)?["']?\s*:/i
const RAW_TIME = /(?<![\w.(-])\d*\.?\d+m?s\b/g
let motionFiles = 0
for (const file of files) {
  if (/\.test\.tsx?$/.test(file) || file.includes(`${path.sep}test${path.sep}`)) continue
  motionFiles++
  const rel = path.relative(repoRoot, file)
  fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    for (const [pattern, why] of MOTION_RULES) {
      for (const hit of line.match(pattern) ?? []) fail(`${rel}:${i + 1}`, `motion literal ${hit} — ${why}`)
    }
    if (TIMED_DECLARATION.test(line)) {
      for (const hit of line.match(RAW_TIME) ?? []) fail(`${rel}:${i + 1}`, `motion literal ${hit} in a transition or animation; use a --motion-* role`)
    }
  })
}

if (errors.length) {
  console.error(`✗ token lint: ${errors.length} violation${errors.length === 1 ? "" : "s"}`)
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}
console.log(
  `✓ token lint: ${checked} tier-2/3 tokens alias lower tiers (${TIERS[2].files.length} component file${TIERS[2].files.length === 1 ? "" : "s"}); ` +
    `${themeFiles.length} theme files hold the ${slotPaths.length} slots; ${typeTokens.length} type roles; ` +
    `${files.length} files in packages/ui/src carry no colour literals, ${motionFiles} carry no motion literals`
)
