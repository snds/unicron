// Reads dist/tokens.css the way a browser would cascade it, for scripts/contrast.mjs and
// scripts/figma-parity.mjs. The numbers those scripts judge are the ones a browser renders, so
// they read the built CSS, not the JSON sources.
//
// The file has two axes (docs/02-tokens.md → Two axes):
//   theme   the 10 theme slots (--g-theme-*) on :root hold the Unicron default. An app's theme is
//           its own [data-theme="<app>"] block of the same slots, in the app's layer; the contrast
//           tool lays one over the defaults (readTheme, below) to measure it.
//   ground  `:root, .light, …` holds the stone (light) roles; `.dark, …` the graphite (dark) roles
// A mode is one theme on one ground, named as Figma names it: "vale / graphite", "default / stone".

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
export const cssPath = path.join(here, "..", "..", "dist", "tokens.css")

export const GROUNDS = ["graphite", "stone"]

export function readBuiltCss() {
  if (!fs.existsSync(cssPath)) {
    console.error("dist/tokens.css is missing — run `node scripts/build.mjs` first")
    process.exit(1)
  }
  return fs.readFileSync(cssPath, "utf8")
}

/** Every `selector { declarations }` block of custom properties, in source order. */
function ruleBlocks(css) {
  const blocks = []
  for (const m of css.matchAll(/(?:^|\n)([^\n{}/@][^\n{}]*?) \{\n([\s\S]*?)\n\}/g)) {
    const declarations = new Map()
    for (const line of m[2].split("\n")) {
      const d = line.match(/^\s*(--[\w-]+):\s*(.+);\s*$/)
      if (d) declarations.set(d[1], d[2])
    }
    blocks.push({ selector: m[1].trim(), declarations })
  }
  return blocks
}

/**
 * The built CSS, sorted by what each block is for:
 *   root    `:root` only (tier 1 and the type roles)
 *   light   blocks whose selector list starts `:root, .light` (tiers 2 and 3, stone)
 *   dark    blocks whose selector list starts `.dark` (tiers 2 and 3, graphite)
 *   themes  { app: Map } from `[data-theme="app"]`
 *   theme   the `@theme inline` block, and the plain `@theme` block that holds only --radius
 *           (Tailwind's key for the bare `rounded`, which shares the role's name)
 */
export function parseTokensCss(css = readBuiltCss()) {
  const out = { root: new Map(), light: new Map(), dark: new Map(), themes: {}, theme: new Map() }
  const add = (target, map) => {
    for (const [k, v] of map) target.set(k, v)
  }
  for (const { selector, declarations } of ruleBlocks(css)) {
    const app = /^\[data-theme="([\w-]+)"\]$/.exec(selector)?.[1]
    if (app) add((out.themes[app] ??= new Map()), declarations)
    else if (selector === ":root") add(out.root, declarations)
    else if (selector.startsWith(":root, .light")) add(out.light, declarations)
    else if (selector.startsWith(".dark")) add(out.dark, declarations)
    else throw new Error(`dist/tokens.css: unexpected block "${selector}"`)
  }
  const themeBlocks = [...css.matchAll(/\n@theme(?: inline)? \{\n([\s\S]*?)\n\}/g)].map((m) => m[1])
  for (const line of themeBlocks.join("\n").split("\n")) {
    const d = line.match(/^\s*(--[\w-]+):\s*(.+);\s*$/)
    if (d) out.theme.set(d[1], d[2])
  }
  return out
}

/** The custom properties an element sees in one mode: `app` (or null for no data-theme) on `ground`. */
export function modeVars(parsed, app, ground, slots = null) {
  if (app !== null && !slots && !parsed.themes[app]) throw new Error(`no [data-theme="${app}"] block in dist/tokens.css`)
  return new Map([
    ...parsed.root,
    ...(app === null ? [] : (slots ?? parsed.themes[app])),
    ...parsed.light,
    ...(ground === "graphite" ? parsed.dark : []),
  ])
}

/**
 * The modes to measure, both grounds of each: the Unicron default (no data-theme) when `themes`
 * is empty, otherwise each theme given ({ name, slots: Map of --g-theme-* → value }).
 */
export function allModes(parsed, themes = []) {
  if (!themes.length) return GROUNDS.map((ground) => ({ name: `default / ${ground}`, app: null, ground, vars: modeVars(parsed, null, ground) }))
  return themes.flatMap((theme) =>
    GROUNDS.map((ground) => ({ name: `${theme.name} / ${ground}`, app: theme.name, ground, vars: modeVars(parsed, theme.name, ground, theme.slots) }))
  )
}

// ── An app's theme, read from its own file ───────────────────────────────────────────────────
const SLOT = /^--g-theme-(graphite|stone)-([a-z-]+)$/

/**
 * An app's theme: a DTCG JSON file shaped like global.json's `theme` group
 * ({ theme: { graphite: { ground: { $value } … }, stone: { … } } }), or a CSS file that declares the
 * slots (`[data-theme="acme"] { --g-theme-graphite-ground: #…; … }`). Every one of `slotNames`
 * must be there, and nothing else that looks like a slot. Returns { name, slots, file }.
 */
export function readTheme(file, slotNames) {
  const text = fs.readFileSync(file, "utf8")
  const base = path.basename(file).replace(/\.(json|css)$/, "")
  const slots = new Map()
  let name = base
  if (file.endsWith(".json")) {
    const json = JSON.parse(text)
    name = json.$extensions?.["unicron.app"]?.name ?? base
    for (const ground of GROUNDS) {
      for (const [slot, token] of Object.entries(json.theme?.[ground] ?? {})) {
        if (slot.startsWith("$")) continue
        slots.set(`--g-theme-${ground}-${slot}`, String(token?.$value ?? token))
      }
    }
  } else if (file.endsWith(".css")) {
    const bare = text.replace(/\/\*[\s\S]*?\*\//g, "")
    name = /\[data-theme="([\w-]+)"\]/.exec(bare)?.[1] ?? base
    for (const m of bare.matchAll(/(--g-theme-[\w-]+)\s*:\s*([^;]+);/g)) slots.set(m[1], m[2].trim())
  } else {
    throw new Error(`${file}: a theme is a .json or a .css file`)
  }
  const missing = slotNames.filter((n) => !slots.has(n))
  const extra = [...slots.keys()].filter((n) => !slotNames.includes(n) || !SLOT.test(n))
  if (missing.length) throw new Error(`${file}: missing theme slots: ${missing.join(", ")}`)
  if (extra.length) throw new Error(`${file}: not theme slots: ${extra.join(", ")}`)
  for (const [n, v] of slots) {
    if (/var\(|\{/.test(v)) throw new Error(`${file} ${n}: a theme slot holds a raw colour, not a reference (${v})`)
  }
  // Keep the core's slot order, so a theme reads the same however its file is laid out.
  return { name, file, slots: new Map(slotNames.map((n) => [n, slots.get(n)])) }
}

/** `var(--a)` chains → a literal CSS value, in one mode's variables. */
export function resolveValue(value, vars, seen = new Set()) {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name) => {
    if (seen.has(name)) throw new Error(`circular reference at ${name}`)
    const next = vars.get(name)
    if (next === undefined) throw new Error(`${name} is not defined`)
    return resolveValue(next, vars, new Set([...seen, name]))
  })
}
