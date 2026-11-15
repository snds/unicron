#!/usr/bin/env node
// Writes tokens/figma/theme-2026-11.json from a Figma read-out (figma-tokens.json).
//
// The read-out is made outside this repo, by read-only Plugin API scripts against the Figma file
// "Unicron explorations" (file key ibZp32eAXdv9lPID6AMSF7). This script keeps only what the
// tokens package builds: the 21 theme roles in the 8 modes, the 23 text styles, and the space,
// radius and size numbers. scripts/figma-parity.mjs then holds every built value to the snapshot.
//
// Run it only when Figma has changed and a new read-out exists:
//   node scripts/figma-snapshot.mjs <path/to/figma-tokens.json>
// Then fix the sources (tokens/themes/*.json, tokens/global.json, tokens/type.json) until
// `pnpm --filter @unicron/tokens test` passes again. The snapshot is never edited by hand.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const outFile = path.join(here, "..", "tokens", "figma", "theme-2026-11.json")

const input = process.argv[2]
if (!input) {
  console.error("usage: node scripts/figma-snapshot.mjs <path/to/figma-tokens.json>")
  process.exit(1)
}
const readout = JSON.parse(fs.readFileSync(input, "utf8"))
const collection = (name) => {
  const found = readout.collections.find((c) => c.name === name)
  if (!found) throw new Error(`the read-out has no collection named "${name}"`)
  return found
}

const primitives = collection("Unicron / Primitives")
const theme = collection("Unicron / Theme")
const space = collection("Unicron / Space")
const primitiveId = new Map(primitives.variables.map((v) => [v.name, v.id]))

const modes = theme.modes.map((m) => m.name)
const roles = {}
for (const variable of theme.variables) {
  const byMode = {}
  for (const mode of modes) {
    const v = variable.valuesByMode[mode]
    byMode[mode] = {
      hex: v.hex.toUpperCase(),
      alpha: v.alpha,
      ...(v.alias && { primitive: v.alias, primitiveId: primitiveId.get(v.alias) }),
    }
  }
  roles[variable.name] = {
    id: variable.id,
    ...(variable.description && { description: variable.description }),
    modes: byMode,
  }
}

const type = {}
for (const style of readout.textStyles) {
  if (style.lineHeight.unit !== "PIXELS") throw new Error(`${style.name}: line height is not in pixels`)
  if (style.letterSpacing.unit !== "PERCENT") throw new Error(`${style.name}: letter spacing is not a percent`)
  type[style.role] = {
    id: style.id,
    family: style.fontFamily,
    style: style.fontStyle,
    weight: style.fontWeight,
    size: style.fontSize,
    lineHeight: style.lineHeight.value,
    letterSpacingPercent: style.letterSpacing.value,
    case: style.textCase,
  }
}

const numbers = { space: {}, radius: {}, size: {} }
for (const variable of space.variables) {
  const group = variable.name.split("/")[0]
  if (!numbers[group]) throw new Error(`unexpected variable group in Unicron / Space: ${variable.name}`)
  numbers[group][variable.name] = { id: variable.id, px: Object.values(variable.valuesByMode)[0] }
}

const snapshot = {
  $description:
    "Snapshot of the Figma read-out: the theme roles in all 8 modes, the 23 type roles, and the space, radius and size numbers. Written by scripts/figma-snapshot.mjs; never edited by hand. scripts/figma-parity.mjs (run by `pnpm test`) fails when a built value differs from it.",
  source: {
    file: "ibZp32eAXdv9lPID6AMSF7",
    name: "Unicron explorations",
    extracted: readout.$meta.extracted,
    method: readout.$meta.method,
  },
  modes,
  defaultMode: theme.modes.find((m) => m.modeId === theme.defaultModeId).name,
  roles,
  type,
  ...numbers,
}

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2) + "\n")
console.log(
  `✓ figma snapshot: ${Object.keys(roles).length} roles × ${modes.length} modes, ${Object.keys(type).length} type roles, ` +
    `${Object.keys(numbers.space).length} space, ${Object.keys(numbers.radius).length} radius, ${Object.keys(numbers.size).length} size → ${path.relative(process.cwd(), outFile)}`
)
