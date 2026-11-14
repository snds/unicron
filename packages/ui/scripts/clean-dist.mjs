#!/usr/bin/env node
// Empties dist/ before tsc writes it. tsc never removes what it wrote on an earlier run, so a file
// that left the build (a test that used to be compiled, a renamed module) stayed in dist and went
// into the tarball: `files` ships the whole folder.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist")
fs.rmSync(dist, { recursive: true, force: true })
console.log("✓ emptied dist")
