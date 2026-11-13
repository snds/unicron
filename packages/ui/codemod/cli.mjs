#!/usr/bin/env node
// unicron-codemod: one-time source rewrites that ship with a breaking @unicron/ui release.
// Node built-ins only, so `npx unicron-codemod` runs anywhere @unicron/ui is installed.
//
//   unicron-codemod icons <dir> [--dry] [--ext tsx,ts,jsx,js] [--force] [--json]
//                              [--map extra.json] [--tag Icon,MyIcon] [--type IconName]

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { sharedTypeAliases, transformIcons } from "./icons.mjs"
import { LexError } from "./lex.mjs"

const USAGE = `unicron-codemod icons <dir> [options]

Renames Material Symbols icon names to Carbon names (@unicron/ui 1.0) in every source file under <dir>.
It rewrites string literals in icon positions only, keeps the formatting, and never guesses.
On <Icon> and <IconButton> it turns fill into the glyph's filled name where Carbon has one
(name={on ? "pin--filled" : "pin"}), and lists every fill, weight, grade and opticalSize it leaves.
Run it once, on a clean tree, then let the type checker find the rest.

  --dry              change nothing; print what would change
  --ext <list>       file extensions to read (default: tsx,ts,jsx,js)
  --map <file>       a JSON file of extra or overriding entries: { "material_name": "carbon--name" | null }
  --tag <list>       elements whose name= is an icon name (default: Icon)
  --type <list>      type names that mean "an icon name" (default: IconName,CoreIconName)
  --force            run even though Carbon names are already in place (a second pass is not safe)
  --verbose          also list every plain word that is an icon name in both sets (mostly ordinary words)
  --json             print the report as JSON
  -h, --help         this text

It reads these as icon positions: name= on <Icon>; attributes and properties called icon, iconName
or glyph, or ending in Icon or Glyph; variables and functions named that way; and anything typed
IconName (a value, a list, a Record, a tuple slot, a function's return).
The full map, and the names with no Carbon match, are in MAPPING.md beside this file.`

const here = path.dirname(fileURLToPath(import.meta.url))
const SKIP = new Set(["node_modules", "dist", "build", "target", "coverage", "out"])

function fail(message) {
  console.error(`unicron-codemod: ${message}`)
  process.exit(1)
}

function parse(argv) {
  const options = { dry: false, force: false, json: false, verbose: false, ext: ["tsx", "ts", "jsx", "js"], tags: ["Icon"], types: ["IconName", "CoreIconName"], map: null, positional: [] }
  const list = (flag, value) => (value ? value.split(",").map((s) => s.trim().replace(/^\./, "")).filter(Boolean) : fail(`${flag} needs a value`))
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const [flag, inline] = arg.startsWith("--") && arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, undefined]
    const value = () => inline ?? argv[++i]
    if (flag === "--dry" || flag === "--dry-run") options.dry = true
    else if (flag === "--force") options.force = true
    else if (flag === "--json") options.json = true
    else if (flag === "--verbose") options.verbose = true
    else if (flag === "--ext") options.ext = list(flag, value())
    else if (flag === "--tag") options.tags = list(flag, value())
    else if (flag === "--type") options.types = list(flag, value())
    else if (flag === "--map") options.map = value() ?? fail("--map needs a file")
    else if (flag === "-h" || flag === "--help") options.help = true
    else if (flag.startsWith("-")) fail(`unknown option ${flag}\n\n${USAGE}`)
    else options.positional.push(arg)
  }
  return options
}

function walk(dir, extensions, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (entry.name.startsWith(".") || SKIP.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, extensions, found)
    else if (entry.isFile() && extensions.has(path.extname(entry.name).slice(1)) && !entry.name.endsWith(".d.ts")) found.push(full)
  }
  return found
}

/** Read the map shipped beside this file, with any --map file laid over it. */
export function loadMap(extraFile) {
  const shipped = JSON.parse(fs.readFileSync(path.join(here, "material-to-carbon.json"), "utf8"))
  const extra = extraFile ? JSON.parse(fs.readFileSync(extraFile, "utf8")) : {}
  const map = {}
  for (const source of [shipped, extra]) for (const [key, value] of Object.entries(source)) if (!key.startsWith("_")) map[key] = value
  const carbonNames = new Set(shipped._curated ?? [])
  for (const value of Object.values(map)) if (value) carbonNames.add(value)
  // Material names that are also Carbon names with a different drawing: the type checker accepts
  // them, so a use left behind draws the wrong icon without an error.
  const sameWord = new Set(Object.keys(map).filter((name) => carbonNames.has(name) && map[name] !== name))
  return { map, notes: { ...shipped._notes, ...extra._notes }, carbonNames, sameWord, carbon: shipped._carbon }
}

/** Run the icons codemod over a folder. Returns the report; writes files unless `dry`. */
export function runIcons(dir, options = {}) {
  const { dry = false, force = false, ext = ["tsx", "ts", "jsx", "js"], tags, types, map: extraMap = null } = options
  const { map, notes, carbonNames, sameWord, carbon } = loadMap(extraMap)
  const root = path.resolve(dir)
  const files = fs.statSync(root).isDirectory() ? walk(root, new Set(ext)) : [root]
  const report = { dir: root, dry, carbon, files: files.length, changed: [], rewrites: [], unchanged: [], unmapped: [], unknown: [], left: [], likely: [], sameWord: [], filled: [], removedProps: [], alreadyCarbon: [], unreadable: [], refused: false, written: 0 }
  const pending = []
  const sources = files.map((file) => ({ file, source: fs.readFileSync(file, "utf8"), jsx: !/\.[mc]?ts$/.test(file) }))
  const sharedAliases = sharedTypeAliases(sources, types)
  for (const { file, source, jsx } of sources) {
    const rel = path.relative(root, file) || path.basename(file)
    let result
    try {
      result = transformIcons(source, { map, notes, carbonNames, sameWord, tags, types, jsx, sharedAliases })
    } catch (error) {
      if (!(error instanceof LexError)) throw error
      report.unreadable.push({ file: rel, reason: error.message })
      continue
    }
    const tag = (list) => list.map((entry) => ({ file: rel, ...entry }))
    report.rewrites.push(...tag(result.rewrites))
    report.unchanged.push(...tag(result.unchanged))
    report.unmapped.push(...tag(result.unmapped))
    report.unknown.push(...tag(result.unknown))
    report.left.push(...tag(result.left))
    report.likely.push(...tag(result.likely))
    report.sameWord.push(...tag(result.sameWord))
    report.filled.push(...tag(result.filled))
    report.removedProps.push(...tag(result.removedProps))
    report.alreadyCarbon.push(...tag(result.carbon))
    if (result.output !== source) {
      report.changed.push(rel)
      pending.push([file, result.output])
    }
  }
  // Carbon names already in icon positions mean this tree was migrated before. A second pass
  // would rename the names both sets share, so stop unless told otherwise.
  if (report.alreadyCarbon.length && !force) report.refused = true
  if (!dry && !report.refused) {
    for (const [file, output] of pending) fs.writeFileSync(file, output)
    report.written = pending.length
  }
  return report
}

function print(report, { verbose = false } = {}) {
  const out = []
  const n = (count, one, many = `${one}s`) => `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`
  const at = (entry) => `${entry.file}:${entry.line}:${entry.column}`
  out.push(`unicron-codemod icons: ${report.dir}${report.dry ? "  (dry run: nothing written)" : ""}`)
  out.push(`  Material Symbols → ${report.carbon}`)
  out.push("")
  if (report.refused) {
    out.push(`STOPPED. ${n(report.alreadyCarbon.length, "icon position")} already ${report.alreadyCarbon.length === 1 ? "holds a Carbon name" : "hold Carbon names"}, so this tree looks migrated.`)
    out.push("A second pass is not safe: names that exist in both sets would be renamed again")
    out.push("(error → warning, then warning → warning--alt). Nothing was written.")
    out.push("First few:")
    for (const entry of report.alreadyCarbon.slice(0, 5)) out.push(`  ${at(entry)}  "${entry.name}"`)
    out.push("If this tree really is half done, pass --force and read the diff with care.")
    out.push("")
  }
  out.push(`${n(report.files, "file")} read`)
  out.push(`${n(report.rewrites.length, "site")} ${report.dry || report.refused ? "to rewrite" : "rewritten"} in ${n(report.changed.length, "file")}`)
  out.push(`${n(report.unchanged.length, "site")} left as written (the Carbon name is the same word)`)
  const section = (title, list, line) => {
    if (!list.length) return
    out.push("")
    out.push(`${title}: ${n(list.length, "site")}`)
    for (const entry of list) out.push(`  ${line(entry)}`)
  }
  section("`fill` became the glyph's filled name", report.filled, (e) => `${at(e)}  <${e.tag} ${e.name}> now ${e.to}`)
  section("Props gone in 1.0 (fill, weight, grade, opticalSize), fix by hand", report.removedProps, (e) => `${at(e)}  <${e.tag} ${e.name}>  ${e.hint}  ${e.text}`)
  section("No Carbon match, fix by hand", report.unmapped, (e) => `${at(e)}  "${e.name}"${e.note ? `  ${e.note}` : ""}`)
  section("Not a name in the map or the curated set, check by hand", report.unknown, (e) => `${at(e)}  "${e.name}"`)
  const to = (e) => (e.to === null ? "no Carbon match" : e.to === e.name ? "same name in Carbon" : `would be "${e.to}"`)
  section("A Material name outside an icon position, left alone (change it by hand if it is an icon)", report.left, (e) => `${at(e)}  "${e.name}" (${to(e)})  ${e.text}`)
  section("A plain word in the same place as one of those, left alone (probably an icon too)", report.likely, (e) => `${at(e)}  "${e.name}" (${to(e)}${e.silent ? "; the type checker will NOT catch this one" : ""})  ${e.text}`)
  if (report.sameWord.length) {
    out.push("")
    out.push(`${n(report.sameWord.length, "other use")} of a word that is an icon name in both sets (${[...new Set(report.sameWord.map((e) => e.name))].sort().join(", ")}) left alone.`)
    out.push("They are probably ordinary words. If one is an icon, it now draws a different icon and the type checker will not say so.")
    if (verbose) for (const e of report.sameWord) out.push(`  ${at(e)}  "${e.name}" (${to(e)})  ${e.text}`)
    else out.push("List them with --verbose.")
  }
  if (report.unreadable.length) {
    out.push("")
    out.push(`Could not read, left alone: ${n(report.unreadable.length, "file")}`)
    for (const entry of report.unreadable) out.push(`  ${entry.file}  ${entry.reason}`)
  }
  out.push("")
  out.push(report.refused ? "Nothing written." : report.dry ? "Dry run. Run again without --dry to write." : `Wrote ${n(report.written, "file")}. Now run the type checker: IconName no longer accepts Material names.`)
  console.log(out.join("\n"))
}

function main() {
  const options = parse(process.argv.slice(2))
  const [command, dir, ...rest] = options.positional
  if (options.help || !command) {
    console.log(USAGE)
    process.exit(options.help ? 0 : 1)
  }
  if (command !== "icons") fail(`unknown command "${command}". The one command is: icons\n\n${USAGE}`)
  if (!dir || rest.length) fail(`icons takes one folder\n\n${USAGE}`)
  if (!fs.existsSync(dir)) fail(`${dir} does not exist`)
  const report = runIcons(dir, options)
  if (options.json) console.log(JSON.stringify(report, null, 2))
  else print(report, options)
  process.exit(report.refused ? 2 : 0)
}

// Run when called as a program (also through the npm bin link), not when imported by a test.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main()
