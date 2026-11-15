// Reads dist/tokens.css the way a browser would cascade it, for scripts/contrast.mjs and
// scripts/figma-parity.mjs. The numbers those scripts judge are the ones a browser renders, so
// they read the built CSS, not the JSON sources.
//
// The file has two axes (docs/02-tokens.md → Two axes):
//   app     [data-theme="<app>"] re-declares the 28 theme slots (--g-theme-*); none = the defaults
//   ground  `:root, .light, …` holds the stone (light) roles; `.dark, …` the graphite (dark) roles
// A mode is one app on one ground, named as Figma names it: "vale / graphite".

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
export function modeVars(parsed, app, ground) {
  if (app !== null && !parsed.themes[app]) throw new Error(`no [data-theme="${app}"] block in dist/tokens.css`)
  return new Map([
    ...parsed.root,
    ...(app === null ? [] : parsed.themes[app]),
    ...parsed.light,
    ...(ground === "graphite" ? parsed.dark : []),
  ])
}

/** Every mode the file holds, in build order: [{ name: "vale / graphite", app, ground, vars }]. */
export function allModes(parsed) {
  return Object.keys(parsed.themes).flatMap((app) =>
    GROUNDS.map((ground) => ({ name: `${app} / ${ground}`, app, ground, vars: modeVars(parsed, app, ground) }))
  )
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
