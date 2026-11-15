// Tests for `unicron-codemod icons`. Run with: node --test "codemod/**/*.test.mjs"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { after, describe, it } from "node:test"
import { fileURLToPath } from "node:url"

import { loadMap, runIcons } from "../cli.mjs"
import { transformIcons } from "../icons.mjs"
import { lex } from "../lex.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => fs.readFileSync(path.join(here, "fixtures", name), "utf8")
const shipped = loadMap()
const run = (source, options = {}) => transformIcons(source, { ...shipped, ...options })
const names = (list) => list.map((entry) => entry.name)

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "unicron-codemod-"))
after(() => fs.rmSync(temp, { recursive: true, force: true }))
/** A scratch folder holding the fixtures under their real extensions. */
function tree(files) {
  const dir = fs.mkdtempSync(path.join(temp, "tree-"))
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), content)
  }
  return dir
}
const cli = (...args) => spawnSync(process.execPath, [path.join(here, "..", "cli.mjs"), ...args], { encoding: "utf8" })

describe("the map", () => {
  it("maps every name to a curated Carbon name, or to null with a note", () => {
    const raw = JSON.parse(fs.readFileSync(path.join(here, "..", "material-to-carbon.json"), "utf8"))
    for (const [name, to] of Object.entries(shipped.map)) {
      if (to === null) assert.ok(raw._notes[name], `${name} maps to null and needs a note`)
      else assert.ok(shipped.carbonNames.has(to), `${name} → ${to} is not in the curated set`)
    }
  })

  it("has no sparkle icons", () => {
    for (const to of Object.values(shipped.map)) assert.doesNotMatch(to ?? "", /magic|wand|sparkle|ai-generate|ai-label/)
    assert.equal(shipped.map.wand_stars, "bot")
  })

  it("knows which words are icon names in both sets with a different drawing", () => {
    for (const word of ["error", "warning", "pin", "rule"]) assert.ok(shipped.sameWord.has(word), word)
    assert.ok(!shipped.sameWord.has("close"))
  })
})

describe("JSX attributes", () => {
  const result = run(fixture("jsx.tsx.txt"))

  it("rewrites name= on Icon and icon-ish attributes, and nothing else", () => {
    assert.equal(result.output, fixture("jsx.expected.tsx.txt"))
  })

  it("rewrites both branches of a conditional, never the condition", () => {
    const { output } = run(`<Icon name={kind === "folder" ? "folder_open" : "description"} />`)
    assert.equal(output, `<Icon name={kind === "folder" ? "folder--open" : "document"} />`)
  })

  it("keeps the quote style and the spacing", () => {
    assert.equal(run(`<Icon name='mail'/>`).output, `<Icon name='email'/>`)
    assert.equal(run("<Icon\n  name = {  `mail`  }\n/>").output, "<Icon\n  name = {  `email`  }\n/>")
    assert.equal(run(`<>\r\n\t<Icon name="mail" />\r\n\t<Icon name="inbox" />\r\n</>\r\n`).output, `<>\r\n\t<Icon name="email" />\r\n\t<Icon name="email" />\r\n</>\r\n`)
  })

  it("reports a name with no Carbon match and leaves it", () => {
    assert.deepEqual(names(result.unmapped), ["forward", "progress_activity"])
    assert.match(result.unmapped[0].note, /no forward arrow/)
    assert.deepEqual([result.unmapped[0].line, result.unmapped[0].column], [27, 18])
    assert.match(result.output, /name="forward"/)
  })

  it("lists a Material name outside an icon position, with its line", () => {
    assert.deepEqual(result.left.map((e) => [e.name, e.line, e.to]), [["content_copy", 32, "copy"]])
  })

  it("counts names that are the same word in Carbon as unchanged", () => {
    assert.deepEqual(names(result.unchanged).sort(), ["close", "help", "home", "search"])
  })

  it("takes other tags when told to", () => {
    assert.equal(run(`<Glyph name="content_copy" />`, { tags: ["Icon", "Glyph"] }).output, `<Glyph name="copy" />`)
  })
})

describe("props that are gone in 1.0", () => {
  it("turns fill into the glyph's filled name, bare or behind a state", () => {
    assert.equal(run(`<Icon name="keep" fill={current.pinned} size="sm" />`).output, `<Icon name={current.pinned ? "pin--filled" : "pin"} size="sm" />`)
    assert.equal(run(`<Icon name="star" fill label="favourite" />`).output, `<Icon name="star--filled" label="favourite" />`)
    assert.equal(run(`<Icon name='check_circle' fill={true} />`).output, `<Icon name='checkmark--filled' />`)
    assert.equal(run(`<IconButton icon="star" aria-pressed={active} fill={active} />`).output, `<IconButton icon={active ? "star--filled" : "star"} aria-pressed={active} />`)
    assert.equal(run(`<Icon\n  name="notifications"\n  fill={armed && !pinned}\n/>`).output, `<Icon\n  name={(armed && !pinned) ? "notification--filled" : "notification"}\n/>`)
    assert.equal(run(`<Icon name="keep" fill={false} />`).output, `<Icon name="pin" />`)
    const { filled } = run(`<Icon name="keep" fill={current.pinned} />`)
    assert.deepEqual(filled.map((e) => [e.line, e.name, e.to]), [[1, "keep", "current.pinned ? pin--filled : pin"]])
  })

  it("lists every fill, weight, grade and opticalSize it cannot turn into a name, and leaves them", () => {
    const source = [
      `<>`,
      `<Icon name="mail" fill={armed} weight={300} grade={0} opticalSize={20} />`,
      `<Icon name={kind} fill={current} />`,
      `<Icon name="keep" fill="red" />`,
      `<IconButton icon="mail" weight={300} />`,
      `<Avatar fill />`,
      `</>`,
    ].join("\n")
    const result = run(source)
    assert.deepEqual(result.removedProps.map((e) => [e.line, e.tag, e.name]), [
      [2, "Icon", "fill"], [2, "Icon", "weight"], [2, "Icon", "grade"], [2, "Icon", "opticalSize"],
      [3, "Icon", "fill"],
      [4, "Icon", "fill"],
    ])
    assert.match(result.removedProps[0].hint, /"email" has no filled form/)
    assert.match(result.removedProps[4].hint, /not a literal/)
    assert.match(result.removedProps[5].hint, /a paint, not a state/)
    assert.match(result.output, /fill=\{armed\} weight=\{300\} grade=\{0\} opticalSize=\{20\}/)
    assert.match(result.output, /<Avatar fill \/>/)
  })

  it("says so in the command's report", () => {
    const dir = tree({ "a.tsx": `export const A = () => <><Icon name="keep" fill={on} /><Icon name="mail" weight={300} /></>\n` })
    const result = cli("icons", dir, "--dry")
    assert.equal(result.status, 0)
    assert.match(result.stdout, /`fill` became the glyph's filled name: 1 site\n  a\.tsx:1:\d+  <Icon keep> now on \? pin--filled : pin/)
    assert.match(result.stdout, /Props gone in 1\.0 \(fill, weight, grade, opticalSize\), fix by hand: 1 site\n  a\.tsx:1:\d+  <Icon weight>/)
  })
})

describe("maps, lists, tuples and functions", () => {
  const result = run(fixture("maps.ts.txt"), { jsx: false })

  it("rewrites the values of icon maps and nothing else", () => {
    assert.equal(result.output, fixture("maps.expected.ts.txt"))
  })

  it("leaves nothing to report in that file", () => {
    assert.deepEqual([result.unmapped, result.left, result.likely], [[], [], []])
  })

  it("reads a Record's values, not its keys", () => {
    const { output } = run(`const X: Record<string, IconName> = { mail: "mail", "delete": "delete" }`)
    assert.equal(output, `const X: Record<string, IconName> = { mail: "email", "delete": "trash-can" }`)
  })

  it("rewrites only the icon slot of a tuple", () => {
    const { output } = run(`const V: Array<[View, IconName]> = [["delete", "delete"], ["mail", "mail"]]`)
    assert.equal(output, `const V: Array<[View, IconName]> = [["delete", "trash-can"], ["mail", "email"]]`)
  })

  it("rewrites icon: and iconName: properties, and a type member's literals", () => {
    assert.equal(run(`const a = { icon: "mail", iconName: open ? "lock_open" : "lock", kind: "mail" }`).output, `const a = { icon: "email", iconName: open ? "unlocked" : "locked", kind: "mail" }`)
    assert.equal(run(`type T = { icon?: "check_circle" | "error"; kind: "error" }`).output, `type T = { icon?: "checkmark--outline" | "warning"; kind: "error" }`)
  })

  it("does not take a branch of ?: for a property", () => {
    const source = `const v = cond ? !icon : "search_off"\nconst w = cond ? closeIcon : "search_off"`
    assert.equal(run(source).output, source)
  })
})

describe("ordinary words", () => {
  it("leaves a file of them byte for byte the same", () => {
    const source = fixture("words.tsx.txt")
    const result = run(source)
    assert.equal(result.output, source)
    assert.deepEqual([result.rewrites, result.unmapped, result.left, result.likely], [[], [], [], []])
  })

  it("does not touch type=, role=, a case label, a comparison, an argument or a key", () => {
    for (const source of [
      `<input type="search" name="search" />`,
      `<form role="search" />`,
      `switch (a) { case "close": break }`,
      `if (action === "add") go()`,
      `t("delete")`,
      `const o = { search: 1, "close": 2 }`,
      `const s = "add"`,
      `import add from "add"`,
      `// <Icon name="mail" />`,
      `const text = \`icon="mail"\``,
    ]) {
      assert.equal(run(source).output, source, source)
    }
  })
})

describe("names it cannot place", () => {
  const result = run(fixture("channels.ts.txt"), { jsx: false })

  it("changes nothing", () => {
    assert.equal(result.output, fixture("channels.ts.txt"))
  })

  it("lists the Material names that can only be icons", () => {
    assert.deepEqual(result.left.map((e) => [e.name, e.line]), [["play_arrow", 6], ["health_and_safety", 14]])
  })

  it("lists the plain words that travel the same way, and flags the ones the type checker will miss", () => {
    assert.deepEqual(
      result.likely.map((e) => [e.name, e.line, e.silent]),
      [["block", 7, false], ["reply", 7, false], ["error", 8, true], ["close", 9, false], ["security", 13, false], ["warning", 15, true]]
    )
  })

  it("keeps the rest as a count, not a list", () => {
    assert.deepEqual(result.sameWord.map((e) => [e.name, e.line]), [["error", 10]])
  })
})

describe("the tokenizer", () => {
  const strings = (source, options) => lex(source, options).filter((t) => t.t === "str").map((t) => t.v)

  it("reads JSX text, comments, templates and regular expressions without mistaking them for strings", () => {
    assert.deepEqual(strings(`<p title="a">Don't "quote" {x ? 'b' : "c"} it's</p>`), ["a", "b", "c"])
    assert.deepEqual(strings(`// 'a'\n/* "b" */ const c = "d" // "e"`), ["d"])
    assert.deepEqual(strings("const a = `x ${y ? 'b' : `c`} z`"), ["b", "c"])
    assert.deepEqual(strings(`const r = /['"]/g, s = a / b / "c"`), ["c"])
    assert.deepEqual(strings(`const w = 1 / Math.max(1, degree[a]! / 3) + i++ / 2 + "d"; if (!/"/.test(w)) f("e")`), ["d", "e"])
    assert.deepEqual(strings(`const f = <T,>(x: T) => "a"; const g = a < b ? "c" : "d"`), ["a", "c", "d"])
    assert.deepEqual(strings(`const x = <const T>(y: T) => "a"`, { jsx: false }), ["a"])
  })

  it("pairs brackets", () => {
    const tokens = lex(`f(a, [b, { c: (d) }])`)
    const open = tokens.findIndex((t) => t.v === "(")
    assert.equal(tokens[tokens[open].m].v, ")")
    assert.equal(tokens[open].m, tokens.length - 1)
  })
})

describe("the command", () => {
  it("with --dry, prints what would change and writes nothing", () => {
    const dir = tree({ "a.tsx": fixture("jsx.tsx.txt"), "lib/b.ts": fixture("maps.ts.txt") })
    const out = cli("icons", dir, "--dry")
    assert.equal(out.status, 0, out.stderr)
    assert.match(out.stdout, /dry run: nothing written/)
    assert.match(out.stdout, /2 files read/)
    assert.match(out.stdout, /a\.tsx:27:18 {2}"forward"/)
    assert.match(out.stdout, /a\.tsx:32:19 {2}"content_copy" \(would be "copy"\)/)
    assert.equal(fs.readFileSync(path.join(dir, "a.tsx"), "utf8"), fixture("jsx.tsx.txt"))
  })

  it("writes the files, and refuses a second pass", () => {
    const dir = tree({ "a.tsx": fixture("jsx.tsx.txt"), "lib/b.ts": fixture("maps.ts.txt"), "words.tsx": fixture("words.tsx.txt") })
    const first = cli("icons", dir)
    assert.equal(first.status, 0, first.stderr)
    assert.match(first.stdout, /Wrote 2 files/)
    assert.equal(fs.readFileSync(path.join(dir, "a.tsx"), "utf8"), fixture("jsx.expected.tsx.txt"))
    assert.equal(fs.readFileSync(path.join(dir, "lib/b.ts"), "utf8"), fixture("maps.expected.ts.txt"))
    assert.equal(fs.readFileSync(path.join(dir, "words.tsx"), "utf8"), fixture("words.tsx.txt"))

    // "warning" is now the Carbon name for what was "error". A second pass would make it "warning--alt".
    const second = cli("icons", dir)
    assert.equal(second.status, 2)
    assert.match(second.stdout, /STOPPED/)
    assert.equal(fs.readFileSync(path.join(dir, "lib/b.ts"), "utf8"), fixture("maps.expected.ts.txt"))
  })

  it("reads only the extensions asked for, and skips node_modules and dist", () => {
    const dir = tree({
      "a.tsx": `<Icon name="mail" />`,
      "b.jsx": `<Icon name="mail" />`,
      "c.md": `<Icon name="mail" />`,
      "node_modules/x/d.tsx": `<Icon name="mail" />`,
      "dist/e.js": `h(Icon, { name: "mail" })`,
      "types.d.ts": `declare const icon = "mail"`,
    })
    const report = runIcons(dir, { ext: ["tsx"] })
    assert.deepEqual(report.changed, ["a.tsx"])
    assert.equal(fs.readFileSync(path.join(dir, "b.jsx"), "utf8"), `<Icon name="mail" />`)
    assert.deepEqual(runIcons(dir, { dry: true }).changed, ["b.jsx"])
  })

  it("follows a tuple type declared once in another file, and not one declared twice", () => {
    const use = (type) => `import type { ${type} } from "./types"\nexport const ROWS: ReadonlyArray<${type}> = [["delete", "delete", "Deleted"]]\n`
    const dir = tree({
      "types.ts": `export type Screen = readonly [Area, IconName, string]\nexport type Twice = readonly [Area, IconName, string]\n`,
      "other.ts": `type Twice = [string, string, string]\n`,
      "a.ts": use("Screen"),
      "b.ts": use("Twice"),
    })
    runIcons(dir)
    assert.equal(fs.readFileSync(path.join(dir, "a.ts"), "utf8"), use("Screen").replace(`"delete", "delete"`, `"delete", "trash-can"`))
    assert.equal(fs.readFileSync(path.join(dir, "b.ts"), "utf8"), use("Twice"))
  })

  it("takes extra entries from --map", () => {
    const dir = tree({ "a.tsx": `<p><Icon name="forward" /><Icon name="pets" /></p>`, "extra.json": JSON.stringify({ forward: "vale--forward", pets: null, _notes: { pets: "No pets." } }) })
    const report = runIcons(dir, { map: path.join(dir, "extra.json") })
    assert.equal(fs.readFileSync(path.join(dir, "a.tsx"), "utf8"), `<p><Icon name="vale--forward" /><Icon name="pets" /></p>`)
    assert.deepEqual(report.unmapped.map((e) => [e.name, e.note]), [["pets", "No pets."]])
  })

  it("leaves a file it cannot read and says which", () => {
    const dir = tree({ "broken.tsx": `const a = "never closed\n<Icon name="mail" />`, "ok.tsx": `<Icon name="mail" />` })
    const report = runIcons(dir)
    assert.deepEqual(report.unreadable.map((e) => e.file), ["broken.tsx"])
    assert.deepEqual(report.changed, ["ok.tsx"])
  })

  it("explains itself when called wrong", () => {
    assert.equal(cli().status, 1)
    assert.equal(cli("--help").status, 0)
    assert.match(cli("--help").stdout, /unicron-codemod icons <dir>/)
    assert.equal(cli("icons", path.join(temp, "nowhere")).status, 1)
    assert.equal(cli("colors", temp).status, 1)
  })
})
