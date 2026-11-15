import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { test } from "node:test"

import { distPathFrom, sourcesCss } from "./unicron-sources.mjs"

const sources = {
  button: ["components/ui/button.js", "components/ui/spinner.js", "lib/utils.js"],
  dialog: ["components/ui/button.js", "components/ui/dialog.js", "components/ui/spinner.js", "lib/utils.js"],
  "tab-bar": ["components/ui/tab-bar.js", "lib/utils.js"],
  "security/code-display": ["components/security/code-display.js", "components/ui/button.js", "lib/utils.js"],
}

test("it imports the lean sheet, scans the package's components, and leaves out every file the named modules do not reach", () => {
  const css = sourcesCss({ modules: ["button"], sources, rel: "../node_modules/@unicron/ui/dist" })
  const lines = css.split("\n")
  assert.ok(lines.includes('@import "@unicron/ui/styles/lean.css";'))
  assert.ok(lines.includes('@source "../node_modules/@unicron/ui/dist/components";'))
  assert.ok(lines.includes('@source "../node_modules/@unicron/ui/dist/lib";'))
  const left = lines.filter((line) => line.startsWith("@source not"))
  assert.deepEqual(left, [
    '@source not "../node_modules/@unicron/ui/dist/components/security/code-display.*";',
    '@source not "../node_modules/@unicron/ui/dist/components/ui/dialog.*";',
    '@source not "../node_modules/@unicron/ui/dist/components/ui/tab-bar.*";',
  ])
})

test("a module brings the files it imports: nothing a named module reaches is left out", () => {
  const css = sourcesCss({ modules: ["dialog", "security/code-display"], sources, rel: "x/dist" })
  for (const file of [...sources.dialog, ...sources["security/code-display"]]) {
    assert.ok(!css.includes(`@source not "x/dist/${file.replace(/\.js$/, "")}.*";`), file)
  }
  assert.ok(css.includes('@source not "x/dist/components/ui/tab-bar.*";'))
})

test("every module named: nothing is left out", () => {
  const css = sourcesCss({ modules: Object.keys(sources), sources, rel: "x/dist" })
  assert.equal(css.split("\n").filter((line) => line.startsWith("@source not")).length, 0)
})

test("a name that is not a module stops it, and says which", () => {
  assert.throws(() => sourcesCss({ modules: ["button", "buton"], sources, rel: "x/dist" }), /not a module of @unicron\/ui: buton/)
})

test("the path goes through the app's own node_modules when the package is installed there", () => {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), "unicron-sources-"))
  try {
    fs.mkdirSync(path.join(app, "node_modules", "@unicron", "ui", "dist"), { recursive: true })
    fs.mkdirSync(path.join(app, "src", "styles"), { recursive: true })
    assert.equal(distPathFrom(path.join(app, "src", "styles"), "/elsewhere/ui"), "../../node_modules/@unicron/ui/dist")
  } finally {
    fs.rmSync(app, { recursive: true, force: true })
  }
})
