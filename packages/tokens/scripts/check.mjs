#!/usr/bin/env node
// Round-trip check: the emitted CSS must carry the full shadcn/ui semantic contract
// (the core set Mailbird's tokens.css defines), and must NOT carry app roles — those live
// in a consumer's extension layer (examples/app-extension.css), never in the core.

import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const css = fs.readFileSync(path.join(here, "..", "dist", "tokens.css"), "utf8")

const CORE = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "border", "input", "ring", "radius",
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
]
const DARK_SWAPPED = CORE.filter((n) => !n.startsWith("sidebar-") && n !== "radius")
const APP_ONLY = ["--vertical-", "--unread", "--surface-chrome", "--surface-canvas", "--surface-selected", "--tint-"]
const THEME = ["--font-sans", "--font-heading", "--radius-sm", "--radius-lg", "--radius-4xl"]

const [, lightBlock, darkBlock, themeBlock] = [
  null,
  css.match(/Tier 2[^\n]*light[^\n]*\n:root \{([\s\S]*?)\n\}/)?.[1],
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
for (const prefix of APP_ONLY) assert.ok(!css.includes(prefix), `${prefix}* is an app role and must not be in the core`)
assert.ok(!/\{[a-z][\w.-]*\}/.test(css), "unresolved DTCG reference leaked into CSS")

console.log(`✓ round-trip: ${CORE.length} core semantic tokens present in light, ${DARK_SWAPPED.length} swapped in dark, theme map complete, no app roles`)
