#!/usr/bin/env node
// Token lint: the two mechanical rules behind docs/06-contributing.md → "Token lint".
//
//   (a) Tiers 2 and 3 (tokens/semantic.json, tokens/component.json) alias, they do not invent.
//       Every colour there — `$value` and every `$extensions["unicron.modes"].*` value — must be
//       a `{reference}` (or a composition such as `color-mix(in oklab, {ref} 45%, transparent)`
//       whose colours are all references). No hex / rgb() / hsl() / oklch() / oklab() literals,
//       no named colours except `transparent` and `currentcolor`, no raw `var(--…)` (that
//       bypasses the token graph; write `{name}` and let the builder emit the var()).
//       Every semantic token of any type must be a bare `{reference}`.
//       A reference may point at its own tier or a lower one, never a higher one.
//       Non-colour component knobs (sizes, axis numbers) may hold a literal: tier 3 exists to
//       hold per-component sizes (see component.json → $description).
//   (b) Primitives (packages/ui/src) carry no colour literals: no hex, rgb(), hsl(), oklch(),
//       oklab() in any .ts/.tsx/.css file. Tailwind arbitrary values that reference a token,
//       e.g. `bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]`, are fine.
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
const TIERS = [
  { name: "global", rank: 1, file: "global.json" },
  { name: "semantic", rank: 2, file: "semantic.json" },
  { name: "component", rank: 3, file: "component.json" },
]
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
const tiers = TIERS.map((t) => {
  const json = JSON.parse(fs.readFileSync(path.join(tokensRoot, "tokens", t.file), "utf8"))
  return { ...t, tokens: flatten(json) }
})
const rankByPath = new Map()
for (const tier of tiers) for (const { path: p } of tier.tokens) rankByPath.set(p.join("."), tier.rank)

function checkValue(tier, dotted, label, value, type) {
  if (typeof value !== "string") {
    // numbers and arrays are literals by construction
    if (tier.rank === 2) fail(`${tier.file} ${dotted}`, `${label} must be a {reference}, got ${JSON.stringify(value)}`)
    return
  }
  const refs = [...value.matchAll(REF)].map((m) => m[1])
  for (const ref of refs) {
    const rank = rankByPath.get(ref)
    if (rank === undefined) fail(`${tier.file} ${dotted}`, `${label} references {${ref}}, which does not exist`)
    else if (rank > tier.rank) fail(`${tier.file} ${dotted}`, `${label} references {${ref}} from a higher tier (${TIERS[rank - 1].name})`)
  }
  const rest = value.replace(REF, "")
  const bareRef = refs.length === 1 && rest.trim() === ""

  if (type === "color") {
    const literal = rest.match(COLOR_LITERAL)
    if (literal) fail(`${tier.file} ${dotted}`, `${label} contains a raw colour literal (${literal[0]}…); alias a lower-tier token instead`)
    if (/var\(/.test(rest)) fail(`${tier.file} ${dotted}`, `${label} uses var(--…); write a {reference} so the token graph stays whole`)
    const named = rest.replace(/\btransparent\b|\bcurrentcolor\b/gi, "").match(NAMED_COLOR)
    if (named) fail(`${tier.file} ${dotted}`, `${label} contains the named colour "${named[0]}"`)
    if (refs.length === 0) fail(`${tier.file} ${dotted}`, `${label} is a colour with no {reference}: "${value}"`)
    return
  }
  if (tier.rank === 2 && !bareRef) fail(`${tier.file} ${dotted}`, `${label} must be a bare {reference} in the semantic tier, got "${value}"`)
}

let checked = 0
for (const tier of tiers) {
  if (tier.rank === 1) continue
  for (const { path: p, token } of tier.tokens) {
    const dotted = p.join(".")
    checked++
    checkValue(tier, dotted, "$value", token.$value, token.$type)
    for (const [mode, v] of Object.entries(token.$extensions?.[MODES_KEY] ?? {})) {
      checkValue(tier, dotted, `${mode} mode`, v, token.$type)
    }
  }
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

if (errors.length) {
  console.error(`✗ token lint: ${errors.length} violation${errors.length === 1 ? "" : "s"}`)
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}
console.log(`✓ token lint: ${checked} tier-2/3 tokens alias lower tiers; ${files.length} files in packages/ui/src carry no colour literals`)
