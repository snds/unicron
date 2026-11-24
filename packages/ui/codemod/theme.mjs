// `unicron-codemod theme`: a 1.x app theme → the 2.0 theme (the accent only).
//
// 2.0 shares the neutrals, so a theme declares 10 slots: primary-fill, primary-on-fill,
// primary-text, primary-soft and primary-display, per ground. This removes the other nine
// slots per ground (ground, raised, rule, grid-dot, faint, label, secondary, body, live)
// from CSS declarations (`--g-theme-<ground>-<slot>: …;`) and from theme JSON files
// (`{ "graphite": { "ground": … } }`, the shape apps keep beside their CSS).
//
// It never guesses. A read of a removed slot or of a removed ramp (`var(--g-neutral-…)`,
// `--g-blue-…`, `--g-coral-…`, `--g-green-…`, `--g-amber-…`, `--g-red-…`, `--g-white-alpha-…`)
// is listed with its line, not rewritten: the right 2.0 role depends on what it draws.

export const RETIRED_SLOTS = ["ground", "raised", "rule", "grid-dot", "faint", "label", "secondary", "body", "live"]
export const GROUNDS = ["graphite", "stone"]
export const REMOVED_RAMPS = ["neutral", "blue", "coral", "green", "amber", "red", "white-alpha"]

const SLOT = RETIRED_SLOTS.join("|")
const GROUND = GROUNDS.join("|")
// A whole declaration line of a retired slot, with its own newline.
const DECLARATION = new RegExp(`^[ \\t]*--g-theme-(?:${GROUND})-(?:${SLOT})[ \\t]*:[^;]*;[ \\t]*(?:\\r?\\n)?`, "gm")
const SLOT_READ = new RegExp(`var\\(\\s*--g-theme-(?:${GROUND})-(?:${SLOT})\\b`, "g")
const RAMP_READ = new RegExp(`--g-(?:${REMOVED_RAMPS.join("|")})-[a-z0-9-]+`, "g")

function lineOf(source, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (source.charCodeAt(i) === 10) line++
  return line
}

/** Rewrite one CSS file. Returns { output, removed, reads }. */
export function transformThemeCss(source) {
  const reads = []
  for (const re of [SLOT_READ, RAMP_READ]) {
    for (const m of source.matchAll(re)) reads.push({ line: lineOf(source, m.index), text: m[0].replace(/^var\(\s*/, "") })
  }
  reads.sort((a, b) => a.line - b.line)
  let removed = 0
  const output = source.replace(DECLARATION, () => {
    removed++
    return ""
  })
  return { output, removed, reads }
}

/**
 * Rewrite one theme JSON file: a ground key holding slot keys. Anything else is left alone.
 * Returns { output, removed } (output === source when nothing matched).
 */
export function transformThemeJson(source) {
  let data
  try {
    data = JSON.parse(source)
  } catch {
    return { output: source, removed: 0 }
  }
  let removed = 0
  const visit = (node) => {
    if (!node || typeof node !== "object") return
    for (const [key, value] of Object.entries(node)) {
      if (GROUNDS.includes(key) && value && typeof value === "object" && !Array.isArray(value)) {
        for (const slot of RETIRED_SLOTS) {
          if (slot in value) {
            delete value[slot]
            removed++
          }
        }
      } else visit(value)
    }
  }
  visit(data)
  if (!removed) return { output: source, removed }
  const indent = /^\{\r?\n([ \t]+)/.exec(source)?.[1] ?? "  "
  return { output: JSON.stringify(data, null, indent) + (source.endsWith("\n") ? "\n" : ""), removed }
}
