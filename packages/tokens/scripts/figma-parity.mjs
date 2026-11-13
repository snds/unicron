#!/usr/bin/env node
// Figma parity: every built value that Figma also holds must equal Figma's.
//
// The reference is tokens/figma/theme-2026-11.json, a checked-in snapshot of the read-out of the
// Figma file (scripts/figma-snapshot.mjs writes it). This script reads what the build made,
// dist/tokens.css, resolves it as a browser would in each of the 8 modes, and compares:
//
//   - the 21 theme roles, in every mode: the sRGB hex and the alpha
//   - the defaults (no data-theme) against Figma's default app
//   - each source slot: its hex, and the Figma variable id written in its $description
//   - the 23 type roles: family, weight, size, line height, letter spacing, case
//   - size/control, size/touch-min, radius/control
//   - the spacing values, against Tailwind's 4px unit (spacing has no tokens of its own)
//
// It fails on any difference. A value is changed in Figma first; then a new read-out, a new
// snapshot, and the sources follow.
//
// Run: pnpm --filter @unicron/tokens parity (also part of `pnpm test`).

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { hex, parseColor, toSrgb } from "./lib/color.mjs"
import { modeVars, parseTokensCss, resolveValue } from "./lib/css.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const tokensDir = path.join(here, "..", "tokens")
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"))
const snapshot = readJson(path.join(tokensDir, "figma", "theme-2026-11.json"))
const built = readJson(path.join(here, "..", "dist", "tokens.json"))
const parsed = parseTokensCss()

const differences = []
const differ = (where, got, want) => differences.push(`${where}: built ${got}, Figma ${want}`)
const same = (where, got, want) => {
  if (got !== want) differ(where, JSON.stringify(got), JSON.stringify(want))
}

// Which theme slot holds a role's value. The other roles are shared by every app (global.json).
const SLOT_OF = {
  "surface/ground": "ground", "surface/raised": "raised", "line/rule": "rule", "line/grid-dot": "grid-dot",
  "text/faint": "faint", "text/label": "label", "text/secondary": "secondary", "text/body": "body",
  "primary/fill": "primary-fill", "primary/on-fill": "primary-on-fill", "primary/text": "primary-text",
  "primary/soft": "primary-soft", "primary/display": "primary-display", "secondary/live": "live",
}
const cssName = (figmaName) => `--${figmaName.replace(/\//g, "-")}`
const modeParts = (mode) => {
  const [app, ground] = mode.split(" / ")
  return { app, ground }
}

// ── Modes ────────────────────────────────────────────────────────────────────────────────────
const builtModes = Object.keys(parsed.themes).flatMap((app) => ["graphite", "stone"].map((ground) => `${app} / ${ground}`))
same("modes", builtModes.join(", "), snapshot.modes.join(", "))
same("default app", built.defaultApp, modeParts(snapshot.defaultMode).app)

// ── Theme roles, as built, in every mode ─────────────────────────────────────────────────────
/** A role in one mode → { hex: "#RRGGBB", alpha } as a browser resolves it. */
function builtColor(name, vars) {
  const raw = vars.get(name)
  if (raw === undefined) return null
  const lab = parseColor(resolveValue(raw, vars))
  return { hex: hex(toSrgb(lab).rgb).toUpperCase(), alpha: lab.alpha }
}
let colorsCompared = 0
function compareRole(where, name, vars, want) {
  const got = builtColor(name, vars)
  colorsCompared++
  if (!got) return differences.push(`${where}: ${name} is not in the built CSS`)
  if (got.hex !== want.hex || Math.abs(got.alpha - want.alpha) > 1e-6) {
    differ(where, `${got.hex} @ ${got.alpha}`, `${want.hex} @ ${want.alpha}`)
  }
}
for (const [role, { modes }] of Object.entries(snapshot.roles)) {
  for (const [mode, want] of Object.entries(modes)) {
    const { app, ground } = modeParts(mode)
    if (!parsed.themes[app]) continue // already reported under "modes"
    compareRole(`${role} in ${mode}`, cssName(role), modeVars(parsed, app, ground), want)
  }
  // No data-theme attribute: Figma's default app, on both grounds.
  const defaultApp = modeParts(snapshot.defaultMode).app
  for (const ground of ["graphite", "stone"]) {
    compareRole(`${role} with no data-theme (${ground})`, cssName(role), modeVars(parsed, null, ground), modes[`${defaultApp} / ${ground}`])
  }
}

// ── Theme slots, at the source ───────────────────────────────────────────────────────────────
// Each slot is one Figma primitive: its hex, and its variable id in the description.
let slotsCompared = 0
function compareSlots(file, json, app) {
  for (const [role, slot] of Object.entries(SLOT_OF)) {
    for (const ground of ["graphite", "stone"]) {
      const token = json.theme?.[ground]?.[slot]
      const want = snapshot.roles[role].modes[`${app} / ${ground}`]
      const where = `${file} theme.${ground}.${slot}`
      slotsCompared++
      if (!token) {
        differences.push(`${where}: missing`)
        continue
      }
      same(where, token.$value, want.hex)
      if (!String(token.$description ?? "").includes(`${want.primitiveId} `)) {
        differences.push(`${where}: $description must name ${want.primitiveId} (${want.primitive}), the primitive Figma's ${role} points at in ${app} / ${ground}`)
      }
    }
  }
}
for (const app of Object.keys(built.themes)) {
  const file = `themes/${app}.json`
  const json = readJson(path.join(tokensDir, file))
  compareSlots(file, json, app)
  const figmaModes = json.$extensions?.["unicron.app"]?.figmaModes ?? {}
  for (const ground of ["graphite", "stone"]) same(`${file} figmaModes.${ground}`, figmaModes[ground], `${app} / ${ground}`)
}
compareSlots("global.json", readJson(path.join(tokensDir, "global.json")), built.defaultApp)

// ── Type roles ───────────────────────────────────────────────────────────────────────────────
const typeName = (figmaName) => figmaName.replace(/\//g, "-")
same("type roles", Object.keys(built.type).join(", "), Object.keys(snapshot.type).map(typeName).join(", "))
const rootVars = modeVars(parsed, null, "stone")
const number = (value, unit) => {
  const m = new RegExp(`^(-?[\\d.]+)${unit}$`).exec(String(value))
  return m ? Number(m[1]) : NaN
}
for (const [figmaName, want] of Object.entries(snapshot.type)) {
  const role = typeName(figmaName)
  const part = (name) => rootVars.get(`--type-${role}-${name}`)
  if (part("size") === undefined) {
    differences.push(`type ${figmaName}: --type-${role}-* is not in the built CSS`)
    continue
  }
  // The stack opens with the variable font, then the family as Figma names it.
  const stack = resolveValue(part("family"), rootVars).split(",").map((f) => f.trim().replace(/^"|"$/g, ""))
  same(`type ${figmaName} family`, stack.slice(0, 2).join(", "), `${want.family} Variable, ${want.family}`)
  same(`type ${figmaName} weight`, Number(part("weight")), want.weight)
  same(`type ${figmaName} size (px)`, number(part("size"), "rem") * 16, want.size)
  same(`type ${figmaName} line height (px)`, number(part("leading"), "rem") * 16, want.lineHeight)
  same(`type ${figmaName} letter spacing (%)`, +(number(part("tracking"), "em") * 100).toFixed(4), want.letterSpacingPercent)
  same(`type ${figmaName} case`, built.type[role]?.case ?? "as typed", want.case === "UPPER" ? "upper" : "as typed")
}

// ── Size and radius ──────────────────────────────────────────────────────────────────────────
const px = (name, vars = rootVars) => {
  const value = resolveValue(vars.get(name) ?? "", vars)
  const m = /^([\d.]+)(rem|px)$/.exec(value)
  return m ? Number(m[1]) * (m[2] === "rem" ? 16 : 1) : NaN
}
const themeVars = new Map([...rootVars, ...parsed.theme])
same("size/control (px)", px("--size-control"), snapshot.size["size/control"].px)
same("size/touch-min (px)", px("--size-touch-min"), snapshot.size["size/touch-min"].px)
same("size/control as Tailwind's --spacing-control (px)", px("--spacing-control", themeVars), snapshot.size["size/control"].px)
same("size/touch-min as Tailwind's --spacing-touch-min (px)", px("--spacing-touch-min", themeVars), snapshot.size["size/touch-min"].px)
same("size variables", Object.keys(snapshot.size).join(", "), "size/control, size/touch-min")

same("radius/control (px)", px("--radius"), snapshot.radius["radius/control"].px)
for (const [name] of parsed.theme) {
  if (name.startsWith("--radius-")) same(`radius/control as Tailwind's ${name} (px)`, px(name, themeVars), snapshot.radius["radius/control"].px)
}
// radius/none and radius/round are Tailwind's own rounded-none and rounded-full: nothing is built
// for them, so only the Figma side is held still.
same("radius/none (px; Tailwind's rounded-none)", 0, snapshot.radius["radius/none"].px)
same("radius/round (px; Tailwind's rounded-full)", 999, snapshot.radius["radius/round"].px)
same("radius variables", Object.keys(snapshot.radius).join(", "), "radius/none, radius/control, radius/round")

// ── Spacing ──────────────────────────────────────────────────────────────────────────────────
// Spacing has no tokens: Tailwind's unit (0.25rem = 4px) is Figma's space/004, and a class such as
// `gap-3` is space/012. So each Figma step must be its own name in px, and a whole or half
// multiple of 4. The half steps (2, 6, 10, 14) are for inside a component only.
const TAILWIND_UNIT_PX = 4
for (const [name, { px: value }] of Object.entries(snapshot.space)) {
  same(`${name} (px, from its name)`, Number(name.split("/")[1]), value)
  const units = value / TAILWIND_UNIT_PX
  if (!Number.isInteger(units * 2)) differences.push(`${name}: ${value}px is not a whole or half multiple of Tailwind's ${TAILWIND_UNIT_PX}px unit`)
}

if (differences.length) {
  console.error(`✗ figma parity: ${differences.length} difference${differences.length === 1 ? "" : "s"} from tokens/figma/theme-2026-11.json (Figma, ${snapshot.source.extracted})`)
  for (const d of differences) console.error(`  ${d}`)
  process.exit(1)
}
console.log(
  `✓ figma parity: ${Object.keys(snapshot.roles).length} roles × ${snapshot.modes.length} modes and the defaults (${colorsCompared} colours), ` +
    `${slotsCompared} source slots with their Figma ids, ${Object.keys(snapshot.type).length} type roles, ` +
    `${Object.keys(snapshot.size).length} sizes, the radius, ${Object.keys(snapshot.space).length} spacing steps on the ${TAILWIND_UNIT_PX}px unit — all equal Figma (read ${snapshot.source.extracted})`
)
