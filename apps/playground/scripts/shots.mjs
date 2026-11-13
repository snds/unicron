#!/usr/bin/env node
// Screenshots of playground views, in every theme, ground and screen size you ask for.
//
//   pnpm build                                                   (this script builds nothing)
//   node apps/playground/scripts/shots.mjs <out-dir> [options]
//
// Each picture is written to <out-dir>/<view>__<theme>-<ground>__<width>x<height>.png, for example
//   foundations__vale-stone__390x844.png
//
// Options (lists are comma-separated):
//   --views <a,b>        which views; a view is a file in src/views          default: every view
//   --themes <a,b>       warpcore, vale, lockdown, synapse                   default: all four
//   --grounds <a,b>      graphite (dark), stone (light)                      default: both
//   --modes <a-b,c-d>    exact pairs instead of every theme × ground, as Figma names its modes:
//                        --modes vale-stone,warpcore-graphite
//   --sizes <WxH,WxH>    screen sizes in CSS pixels                          default: 1440x900,390x844
//   --viewport           capture the screen only, not the whole page         default: whole page
//   --element <selector> capture only the first element that matches, e.g. '[data-slot="button"]'
//   --chrome             keep the playground's own bar in the picture        default: hidden
//   --scale <n>          device pixel ratio                                  default: 1
//   --no-touch           do not treat sizes under 600 wide as a touch phone  default: they are
//   --wait <selector>    also wait for this selector before each picture
//   --css <file>         add this stylesheet to every page before the picture
//   --jobs <n>           pages open at once                                  default: 4
//   --base-url <url>     use a playground that is already served; start no server
//   --timeout <ms>       per picture                                         default: 30000
//
// Examples:
//   node apps/playground/scripts/shots.mjs shots
//   node apps/playground/scripts/shots.mjs shots --views list-row,button --modes vale-stone,warpcore-graphite
//   PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium node apps/playground/scripts/shots.mjs /tmp/shots --sizes 390x844
//
// What it does: serves apps/playground/dist with `vite preview` on a free port, opens each
// address (?view=…&theme=…&ground=…&chrome=0), waits until the view has mounted, the theme is on
// <html>, the fonts have loaded (document.fonts.ready) and the layout has settled, then takes the
// picture with animations finished and the caret hidden. A picture that fails is reported and the
// rest still run; the exit code is 1 if any failed.
//
// The browser: Playwright's own Chromium, or the one at PW_EXECUTABLE_PATH when that is set (a
// sandbox whose installed build is not the one this Playwright version asks for).
import { spawn } from "node:child_process"
import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import { chromium } from "@playwright/test"

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const THEMES = ["warpcore", "vale", "lockdown", "synapse"]
const GROUNDS = ["graphite", "stone"]
const FLAGS = new Set(["viewport", "chrome", "no-touch", "help"])
const VALUES = new Set(["views", "themes", "grounds", "modes", "sizes", "element", "scale", "wait", "css", "jobs", "base-url", "timeout"])

/** With a message: say what is wrong and stop. Without one: print the notes at the top of this file. */
function usage(message) {
  if (message) {
    console.error(`shots: ${message}\nRun it with --help for the options.`)
    process.exit(2)
  }
  const header = fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n")
  const end = header.findIndex((line, i) => i > 0 && !line.startsWith("//"))
  console.log(header.slice(1, end).map((line) => line.replace(/^\/\/ ?/, "")).join("\n"))
  process.exit(0)
}

function parseArgs(argv) {
  const options = {}
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith("--")) {
      positional.push(arg)
      continue
    }
    const [name, inline] = arg.slice(2).split(/=(.*)/s)
    if (FLAGS.has(name)) options[name] = true
    else if (VALUES.has(name)) {
      const value = inline ?? argv[++i]
      if (value === undefined) usage(`--${name} needs a value`)
      options[name] = value
    } else usage(`unknown option --${name}`)
  }
  return { options, positional }
}

const list = (value) => value.split(",").map((item) => item.trim()).filter(Boolean)

function oneOf(name, values, allowed) {
  for (const value of values) if (!allowed.includes(value)) usage(`--${name}: "${value}" is not one of ${allowed.join(", ")}`)
  return values
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })
}

async function reachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return response.ok
  } catch {
    return false
  }
}

/** Serve the built playground; resolves with its address and a function that stops it. */
async function serve() {
  if (!fs.existsSync(path.join(app, "dist", "index.html"))) {
    console.error("shots: apps/playground/dist is missing. Run `pnpm build` first; this script builds nothing.")
    process.exit(2)
  }
  const port = await freePort()
  const vite = path.join(app, "node_modules", "vite", "bin", "vite.js")
  const child = spawn(process.execPath, [vite, "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], {
    cwd: app,
    stdio: ["ignore", "pipe", "pipe"],
  })
  let log = ""
  child.stdout.on("data", (chunk) => (log += chunk))
  child.stderr.on("data", (chunk) => (log += chunk))
  let exited = false
  child.once("exit", () => (exited = true))
  const stop = () => {
    if (!exited) child.kill("SIGTERM")
  }
  const url = `http://127.0.0.1:${port}`
  for (let waited = 0; waited < 20000; waited += 200) {
    if (exited) break
    if (await reachable(url)) return { url, stop }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  stop()
  console.error(`shots: vite preview did not start.\n${log}`)
  process.exit(2)
}

/** Everything that must be true before the picture is the picture. Runs in the page. */
async function settle(page, { view, theme, ground, wait, timeout }) {
  await page.waitForFunction(
    ({ view, theme, ground }) => {
      const root = document.documentElement
      const main = document.querySelector('[data-slot="playground-view"]')
      if (!main || main.getAttribute("data-view") !== view) return false
      const state = main.getAttribute("data-view-state")
      if (state === "error" || state === "missing") return state
      return state === "ready" && root.dataset.theme === theme && root.classList.contains("dark") === (ground === "graphite")
    },
    { view, theme, ground },
    { timeout }
  ).then(async (handle) => {
    const state = await handle.jsonValue()
    if (state === "missing") throw new Error(`there is no view "${view}" in this build (is dist up to date?)`)
    if (state === "error") {
      const message = await page.locator('[data-slot="playground-view"] [role="alert"]').innerText().catch(() => "")
      throw new Error(`the view threw while rendering: ${message.replace(/\s+/g, " ").trim()}`)
    }
  })
  if (wait) await page.waitForSelector(wait, { state: "visible", timeout })
  await page.evaluate(async () => {
    // Fonts that the page asks for load when text first needs them, so ask again until none is pending.
    for (let i = 0; i < 20; i++) {
      await document.fonts.ready
      if (document.fonts.status === "loaded" && ![...document.fonts].some((face) => face.status === "loading")) break
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    await Promise.all([...document.images].filter((image) => !image.complete).map((image) => image.decode().catch(() => {})))
    // Two frames: one for the layout the fonts changed, one for anything that measured it.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
}

async function main() {
  const { options, positional } = parseArgs(process.argv.slice(2))
  if (options.help) usage()
  if (positional.length !== 1) usage("give one output directory")
  const out = path.resolve(positional[0])

  const known = fs.existsSync(path.join(app, "src", "views"))
    ? fs.readdirSync(path.join(app, "src", "views")).filter((file) => /^[^_].*\.tsx$/.test(file) && !/\.test\.tsx$/.test(file)).map((file) => file.replace(/\.tsx$/, "")).sort()
    : []
  const views = options.views ? list(options.views) : known
  if (views.length === 0) usage("no views: none given and none found in src/views")
  const themes = oneOf("themes", options.themes ? list(options.themes) : THEMES, THEMES)
  const grounds = oneOf("grounds", options.grounds ? list(options.grounds) : GROUNDS, GROUNDS)
  if (options.modes && (options.themes || options.grounds)) usage("give --modes, or --themes and --grounds, not both")
  const modes = options.modes
    ? list(options.modes).map((mode) => {
        const match = /^([a-z]+)[-/]([a-z]+)$/.exec(mode)
        if (!match || !THEMES.includes(match[1]) || !GROUNDS.includes(match[2])) usage(`--modes: "${mode}" is not <theme>-<ground>, such as vale-stone`)
        return { theme: match[1], ground: match[2] }
      })
    : themes.flatMap((theme) => grounds.map((ground) => ({ theme, ground })))
  const sizes = list(options.sizes ?? "1440x900,390x844").map((size) => {
    const match = /^(\d+)x(\d+)$/.exec(size)
    if (!match) usage(`--sizes: "${size}" is not WIDTHxHEIGHT`)
    return { width: Number(match[1]), height: Number(match[2]) }
  })
  const scale = Number(options.scale ?? 1)
  const jobs = Math.max(1, Number(options.jobs ?? 4))
  const timeout = Number(options.timeout ?? 30000)
  if (![scale, jobs, timeout].every(Number.isFinite)) usage("--scale, --jobs and --timeout take numbers")
  const css = options.css ? fs.readFileSync(path.resolve(options.css), "utf8") : null

  fs.mkdirSync(out, { recursive: true })
  const server = options["base-url"] ? { url: options["base-url"].replace(/\/$/, ""), stop() {} } : await serve()
  const browser = await chromium.launch(process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {})
  const stop = async () => {
    await browser.close().catch(() => {})
    server.stop()
  }
  process.once("SIGINT", () => void stop().then(() => process.exit(130)))

  const shots = []
  for (const size of sizes) for (const view of views) for (const { theme, ground } of modes) shots.push({ size, view, theme, ground })
  console.log(`shots: ${shots.length} pictures (${views.length} views × ${modes.length} modes × ${sizes.length} sizes) → ${out}`)

  const failures = []
  let next = 0
  async function worker() {
    while (next < shots.length) {
      const { size, view, theme, ground } = shots[next++]
      const name = `${view}__${theme}-${ground}__${size.width}x${size.height}.png`
      const phone = !options["no-touch"] && size.width < 600
      // One context per picture: the ground is the color scheme the page starts in, so the first
      // paint is already right, and nothing is left over from the picture before.
      const context = await browser.newContext({
        viewport: size,
        deviceScaleFactor: scale,
        colorScheme: ground === "graphite" ? "dark" : "light",
        isMobile: phone,
        hasTouch: phone,
      })
      const page = await context.newPage()
      const problems = []
      page.on("pageerror", (error) => problems.push(error.message))
      try {
        const query = new URLSearchParams({ view, theme, ground })
        if (!options.chrome) query.set("chrome", "0")
        await page.goto(`${server.url}/?${query}`, { waitUntil: "load", timeout })
        if (css) await page.addStyleTag({ content: css })
        await settle(page, { view, theme, ground, wait: options.wait, timeout })
        const picture = { path: path.join(out, name), animations: "disabled", caret: "hide", timeout }
        if (options.element) await page.locator(options.element).first().screenshot(picture)
        else await page.screenshot({ ...picture, fullPage: !options.viewport })
        console.log(`  ✓ ${name}${problems.length ? `  (page errors: ${problems.join(" | ")})` : ""}`)
      } catch (error) {
        const reason = String(error?.message ?? error).split("\n")[0]
        failures.push({ name, reason })
        console.log(`  ✗ ${name}  ${reason}`)
      } finally {
        await context.close().catch(() => {})
      }
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(jobs, shots.length) }, worker))
  } finally {
    await stop()
  }

  if (failures.length) {
    console.error(`shots: ${failures.length} of ${shots.length} failed`)
    for (const { name, reason } of failures) console.error(`  ${name}: ${reason}`)
    process.exit(1)
  }
  console.log(`shots: ${shots.length} written`)
}

await main()
