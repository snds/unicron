#!/usr/bin/env node
// Builds dist/tokens.css and dist/tokens.json from the DTCG sources in tokens/.
//
// Three tiers, three files, three CSS prefixes:
//   tokens/global.json     → --g-*   raw values, theme-agnostic
//   tokens/semantic.json   → --*     roles (the shadcn contract); light = $value, dark = $extensions["unicron.modes"].dark
//   tokens/component.json  → --c-*   per-component knobs that alias semantic tokens
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

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, "..")
const src = path.join(root, "tokens")
const out = path.join(root, "dist")

const TIERS = [
  { name: "global", file: "global.json", prefix: "g-" },
  { name: "semantic", file: "semantic.json", prefix: "" },
  { name: "component", file: "component.json", prefix: "c-" },
]
const MODES_KEY = "unicron.modes"
const THEME_KEY = "unicron.theme"

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

const tiers = TIERS.map((t) => {
  const json = JSON.parse(fs.readFileSync(path.join(src, t.file), "utf8"))
  const tokens = flatten(json)
  return { ...t, json, tokens }
})

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
    const value = toCss(token.$value, type, css)
    const darkRaw = token.$extensions?.[MODES_KEY]?.dark
    const darkValue = darkRaw === undefined ? undefined : toCss(darkRaw, type, css)

    flat[css] = {
      tier: tier.name,
      path: p.join("."),
      type,
      value,
      ...(darkValue !== undefined && { dark: darkValue }),
      ...(token.$description && { description: token.$description }),
    }

    if (themeOnly) {
      // Fonts are Tailwind theme variables, not root variables: Tailwind owns --font-*.
      blocks.theme.push(`  ${css}: ${value};`)
      continue
    }
    light.push(`  ${css}: ${value};`)
    if (darkValue !== undefined) dark.push(`  ${css}: ${darkValue};`)

    if (tier.name === "semantic" && type === "color") {
      blocks.theme.push(`  --color-${p.join("-")}: var(${css});`)
    }
  }
  blocks.light.push({ tier: tier.name, lines: light })
  if (dark.length) blocks.dark.push({ tier: tier.name, lines: dark })
}

// Radius scale for Tailwind (rounded-sm … rounded-4xl) as multiples of --radius.
const theme = tiers.find((t) => t.name === "semantic").json.$extensions?.[THEME_KEY] ?? {}
for (const [step, factor] of Object.entries(theme.radius ?? {})) {
  blocks.theme.push(
    factor === 1 ? `  --radius-${step}: var(--radius);` : `  --radius-${step}: calc(var(--radius) * ${factor});`
  )
}

const titles = {
  global: "Tier 1 · Global primitives (--g-*)",
  semantic: "Tier 2 · Semantic roles (--*)",
  component: "Tier 3 · Component knobs (--c-*)",
}

let css = `/* Generated by @unicron/tokens (scripts/build.mjs) from tokens/*.json — do not edit. */\n\n`
for (const { tier, lines } of blocks.light) {
  const dark = blocks.dark.find((b) => b.tier === tier)
  css += `/* ── ${titles[tier]}${dark ? " · light" : ""} ── */\n:root {\n${lines.join("\n")}\n}\n\n`
  if (dark) css += `/* ── ${titles[tier]} · dark ── */\n.dark {\n${dark.lines.join("\n")}\n}\n\n`
}
css += `/* ── Tailwind v4 theme map: exposes tier 2 as utilities (bg-background, text-muted-foreground, rounded-lg …) ── */\n@theme inline {\n${blocks.theme.join("\n")}\n}\n`

fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, "tokens.css"), css)
fs.writeFileSync(
  path.join(out, "tokens.json"),
  JSON.stringify({ $generated: "@unicron/tokens scripts/build.mjs", tokens: flat }, null, 2) + "\n"
)

const counts = tiers.map((t) => `${t.name} ${t.tokens.length}`).join(", ")
console.log(`✓ tokens built: ${counts} → dist/tokens.css, dist/tokens.json`)
