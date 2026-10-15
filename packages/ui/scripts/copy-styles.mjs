#!/usr/bin/env node
// tsc emits only TypeScript. The stylesheet ships from dist/ too (src/ is not in the published
// tarball), so copy src/styles → dist/styles after tsc. The relative `@source "../components"`
// inside index.css resolves the same way from either location (src/components or dist/components).
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const from = path.join(root, "src", "styles")
const to = path.join(root, "dist", "styles")
fs.rmSync(to, { recursive: true, force: true })
fs.cpSync(from, to, { recursive: true })
console.log(`✓ copied ${path.relative(root, from)} → ${path.relative(root, to)}`)
