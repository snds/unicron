#!/usr/bin/env node
// `pnpm typecheck` for this package: every script parses. It walks scripts/ and src/, so a new
// file (a recipe in scripts/recipes/, a helper in scripts/lib/) is checked without being listed.

import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.name.endsWith(".mjs")) acc.push(full)
  }
  return acc
}

const files = [...walk(path.join(root, "scripts")), ...walk(path.join(root, "src"))]
let failed = 0
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" })
  if (result.status !== 0) failed++
}
if (failed) {
  console.error(`✗ syntax: ${failed} of ${files.length} scripts do not parse`)
  process.exit(1)
}
console.log(`✓ syntax: ${files.length} scripts parse`)
