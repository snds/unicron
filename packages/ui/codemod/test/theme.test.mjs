// Tests for `unicron-codemod theme`. Run with: node --test "codemod/**/*.test.mjs"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { after, describe, it } from "node:test"

import { runTheme } from "../cli.mjs"
import { transformThemeCss, transformThemeJson } from "../theme.mjs"

const CSS = `[data-theme="acme"] {
  --g-theme-graphite-ground: #18191D;
  --g-theme-graphite-live: #1EC5E4;
  --g-theme-graphite-primary-fill: #5146EE;
  --g-theme-stone-body: #151618;
  --g-theme-stone-primary-soft: #D5DDFF;
}
.x { color: var(--g-theme-stone-label); border-color: var(--g-neutral-300); }
`

describe("theme codemod", () => {
  it("removes the 9 shared slots per ground and keeps the accent", () => {
    const { output, removed, reads } = transformThemeCss(CSS)
    assert.equal(removed, 3)
    assert.match(output, /--g-theme-graphite-primary-fill: #5146EE;/)
    assert.match(output, /--g-theme-stone-primary-soft: #D5DDFF;/)
    assert.doesNotMatch(output, /graphite-ground|graphite-live|stone-body:/)
    assert.deepEqual(reads.map((r) => r.text), ["--g-theme-stone-label", "--g-neutral-300"])
    assert.match(output, /var\(--g-neutral-300\)/, "reads are listed, never rewritten")
  })

  it("is idempotent", () => {
    const once = transformThemeCss(CSS).output
    assert.equal(transformThemeCss(once).removed, 0)
  })

  it("trims theme JSON by ground and leaves other JSON alone", () => {
    const json = JSON.stringify({ name: "acme", graphite: { ground: "#000", "primary-fill": "#111" }, stone: { body: "#222", "primary-text": "#333" } }, null, 2) + "\n"
    const { output, removed } = transformThemeJson(json)
    assert.equal(removed, 2)
    assert.deepEqual(JSON.parse(output), { name: "acme", graphite: { "primary-fill": "#111" }, stone: { "primary-text": "#333" } })
    assert.equal(transformThemeJson('{"body": 1}').removed, 0)
  })

  it("writes files unless dry", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "unicron-theme-"))
    after(() => fs.rmSync(dir, { recursive: true, force: true }))
    fs.writeFileSync(path.join(dir, "theme.css"), CSS)
    const dry = runTheme(dir, { dry: true })
    assert.equal(dry.written, 0)
    assert.equal(fs.readFileSync(path.join(dir, "theme.css"), "utf8"), CSS)
    const real = runTheme(dir)
    assert.equal(real.written, 1)
    assert.equal(real.files[0].removed, 3)
  })
})
