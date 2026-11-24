#!/usr/bin/env node
// Figma parity: every built value that Figma also holds must equal Figma's.
//
// The reference is tokens/figma/theme-2026-11-24.json, a checked-in snapshot of the read-out of the
// Figma file (scripts/figma-snapshot.mjs writes it). This script reads what the build made,
// dist/tokens.css, resolves it as a browser would, and compares:
//
//   - every role but the five accent roles (surfaces, lines, inks, status, counts, labels, charts,
//     needs-you, critical, scrim): shared by every app since 2.0, so the same in every Figma mode of
//     a ground, with no data-theme
//   - the five accent roles a theme sets, with no data-theme, against Figma's `Default` mode.
//     Figma has no Default mode, so these are reported as a known gap, not failed.
//   - the five apps' themes the playground carries as fixtures (apps/playground/src/app-themes/),
//     laid over the build, in their 10 Figma modes: every role, and each slot's hex. Each app owns
//     its theme; these files are the playground's copies, so they must still be exactly Figma's.
//   - the type roles: family, weight, size, line height, letter spacing, case. A role marked
//     `"figma": "pending"` (mono-row, 1.1) is not in Figma yet, and one marked `"figma": "retired"`
//     is in Figma's Retired folder: both reported, not failed.
//   - the size variables, and the radius scale (each step, and Tailwind's keys for it)
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
import { modeVars, parseTokensCss, readTheme, resolveValue } from "./lib/css.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const tokensDir = path.join(here, "..", "tokens")
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"))
const snapshot = readJson(path.join(tokensDir, "figma", "theme-2026-11-24.json"))
const built = readJson(path.join(here, "..", "dist", "tokens.json"))
const parsed = parseTokensCss()

const differences = []
const differ = (where, got, want) => differences.push(`${where}: built ${got}, Figma ${want}`)
const same = (where, got, want) => {
  if (got !== want) differ(where, JSON.stringify(got), JSON.stringify(want))
}

// Which theme slot holds a role's value. The other roles are shared by every app (global.json).
const SLOT_OF = {
  "primary/fill": "primary-fill", "primary/on-fill": "primary-on-fill", "primary/text": "primary-text",
  "primary/soft": "primary-soft", "primary/display": "primary-display",
}
const cssName = (figmaName) => `--${figmaName.replace(/\//g, "-")}`

const gaps = []
const DEFAULT_MODE = "Default"

// ── Modes ────────────────────────────────────────────────────────────────────────────────────
const slotNames = built.themeSlots
const fixtureDir = path.join(here, "..", "..", "..", "apps", "playground", "src", "app-themes")
const fixtures = fs.existsSync(fixtureDir)
  ? fs.readdirSync(fixtureDir).filter((f) => f.endsWith(".json") && !f.endsWith(".exceptions.json")).map((f) => {
      const json = readJson(path.join(fixtureDir, f))
      return { file: `apps/playground/src/app-themes/${f}`, json, ...readTheme(path.join(fixtureDir, f), slotNames) }
    })
  : []
const appModes = snapshot.modes.filter((m) => !m.startsWith(`${DEFAULT_MODE} /`))
same("the fixtures' modes", fixtures.flatMap((t) => ["graphite", "stone"].map((g) => `${t.name} / ${g}`)).sort().join(", "), [...appModes].sort().join(", "))

/** A role in one mode → { hex: "#RRGGBB", alpha } as a browser resolves it. */
function builtColor(name, vars) {
  const raw = vars.get(name)
  if (raw === undefined) return null
  const lab = parseColor(resolveValue(raw, vars))
  return { hex: hex(toSrgb(lab).rgb).toUpperCase(), alpha: lab.alpha }
}
let colorsCompared = 0
function compareRole(where, name, vars, want, onMiss = differ) {
  const got = builtColor(name, vars)
  colorsCompared++
  if (!got) return differences.push(`${where}: ${name} is not in the built CSS`)
  if (got.hex !== want.hex || Math.abs(got.alpha - want.alpha) > 0.6 / 255) {
    onMiss(where, `${got.hex} @ ${got.alpha}`, `${want.hex} @ ${want.alpha}`)
  }
}

// ── Roles every theme shares, and the default theme ──────────────────────────────────────────
const hasDefault = snapshot.modes.includes(`${DEFAULT_MODE} / graphite`)
for (const [role, { modes }] of Object.entries(snapshot.roles)) {
  for (const ground of ["graphite", "stone"]) {
    const vars = modeVars(parsed, null, ground)
    if (!SLOT_OF[role]) {
      // Shared: the same in every Figma mode of this ground.
      for (const mode of appModes.filter((m) => m.endsWith(`/ ${ground}`))) compareRole(`${role} with no data-theme (${ground}), against ${mode}`, cssName(role), vars, modes[mode])
    } else if (hasDefault) {
      compareRole(`${role} with no data-theme (${ground})`, cssName(role), vars, modes[`${DEFAULT_MODE} / ${ground}`])
    } else {
      gaps.push(`${role} (${ground})`)
    }
  }
}

// ── The fixtures: the four apps' themes, laid over the build ─────────────────────────────────
let slotsCompared = 0
for (const theme of fixtures) {
  for (const [role, { modes }] of Object.entries(snapshot.roles)) {
    for (const ground of ["graphite", "stone"]) {
      const mode = `${theme.name} / ${ground}`
      if (!modes[mode]) continue // already reported under "the fixtures' modes"
      compareRole(`${role} in ${mode} (${theme.file})`, cssName(role), modeVars(parsed, theme.name, ground, theme.slots), modes[mode])
    }
  }
  for (const [role, slot] of Object.entries(SLOT_OF)) {
    for (const ground of ["graphite", "stone"]) {
      const token = theme.json.theme?.[ground]?.[slot]
      const want = snapshot.roles[role].modes[`${theme.name} / ${ground}`]
      const where = `${theme.file} theme.${ground}.${slot}`
      slotsCompared++
      if (!token || !want) {
        differences.push(`${where}: missing`)
        continue
      }
      const alpha = want.alpha === 1 ? "" : Math.round(want.alpha * 255).toString(16).padStart(2, "0").toUpperCase()
      same(where, token.$value, `${want.hex}${alpha}`)
    }
  }
  const figmaModes = theme.json.$extensions?.["unicron.app"]?.figmaModes ?? {}
  for (const ground of ["graphite", "stone"]) same(`${theme.file} figmaModes.${ground}`, figmaModes[ground], `${theme.name} / ${ground}`)
}

// ── Type roles ───────────────────────────────────────────────────────────────────────────────
const typeName = (figmaName) => figmaName.replace(/\//g, "-")
const pendingType = Object.keys(built.type).filter((role) => built.type[role].figma === "pending")
const retiredType = Object.keys(built.type).filter((role) => built.type[role].figma === "retired")
for (const role of retiredType) gaps.push(`retired type role ${role}`)
for (const role of pendingType) {
  if (Object.keys(snapshot.type).map(typeName).includes(role)) differences.push(`type ${role}: Figma has it now; take "figma": "pending" off it in tokens/type.json`)
  else gaps.push(`type role ${role}`)
}
same("type roles", Object.keys(built.type).filter((role) => !pendingType.includes(role) && !retiredType.includes(role)).sort().join(", "), Object.keys(snapshot.type).map(typeName).sort().join(", "))
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
for (const [figmaName, { px: want }] of Object.entries(snapshot.size)) {
  same(`${figmaName} (px)`, px(`--${figmaName.replace("/", "-")}`), want)
}
same("size/control as Tailwind's --spacing-control (px)", px("--spacing-control", themeVars), snapshot.size["size/control"].px)
same("size/touch-min as Tailwind's --spacing-touch-min (px)", px("--spacing-touch-min", themeVars), snapshot.size["size/touch-min"].px)

// The radius scale: each step a role, and Tailwind's keys (a plain @theme block, literal values).
const plainTheme = new Map([...fs.readFileSync(path.join(here, "..", "dist", "tokens.css"), "utf8").matchAll(/\n@theme \{\n([\s\S]*?)\n\}/g)].flatMap((m) => [...m[1].matchAll(/(--[\w-]+): ([^;]+);/g)].map((d) => [d[1], d[2]])))
const remPx = (value) => (value?.endsWith("rem") ? parseFloat(value) * 16 : parseFloat(value))
for (const [figmaName, { px: want }] of Object.entries(snapshot.radius)) {
  const step = figmaName.split("/")[1]
  if (step === "none") continue // Tailwind's own rounded-none
  same(`${figmaName} (px)`, px(`--radius-${step}`), want)
}
same("radius/control as Tailwind's bare rounded (px)", remPx(plainTheme.get("--radius")), snapshot.radius["radius/control"].px)
for (const [step, figmaStep] of [["xs", "xs"], ["sm", "control"], ["md", "md"], ["lg", "lg"], ["xl", "xl"]]) {
  same(`radius/${figmaStep} as Tailwind's rounded-${step} (px)`, remPx(plainTheme.get(`--radius-${step}`)), snapshot.radius[`radius/${figmaStep}`].px)
}

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
  console.error(`✗ figma parity: ${differences.length} difference${differences.length === 1 ? "" : "s"} from tokens/figma/theme-2026-11-24.json (Figma, ${snapshot.source.extracted})`)
  for (const d of differences) console.error(`  ${d}`)
  process.exit(1)
}
if (gaps.length) {
  console.log(`figma parity: known gaps, reported and not failed (Figma has no Default mode in Unicron / Theme, no style for a role added in 1.1, and a Retired folder of styles): ${gaps.join(", ")}`)
}
console.log(
  `✓ figma parity: the shared roles on both grounds, ${fixtures.length} app themes (playground fixtures) × ${Object.keys(snapshot.roles).length} roles in their ${appModes.length} modes (${colorsCompared} colours), ` +
    `${slotsCompared} fixture slots, ${Object.keys(snapshot.type).length} type roles, ` +
    `${Object.keys(snapshot.size).length} sizes, ${Object.keys(snapshot.radius).length} radii, ${Object.keys(snapshot.space).length} spacing steps on the ${TAILWIND_UNIT_PX}px unit — all equal Figma (read ${snapshot.source.extracted})`
)
