#!/usr/bin/env node
// Contrast gate for the tier-2 roles. APCA first, WCAG 2 reported alongside.
//
// Rule (docs/02-tokens.md → Contrast): a role pair is judged by APCA Lc; WCAG 2.x is the
// fallback floor, printed next to it but never gated on. Floors: Lc 60 body text, Lc 45
// large or bold text, Lc 30 non-text UI (focus ring, control boundary). Lc 75 (APCA Bronze
// for text under 16px) is reported as a flag so a small-text role can be read off the table.
//
// What it reads: dist/tokens.css (run scripts/build.mjs first; `pnpm test` does). It resolves
// each role's light value from the `:root` blocks and its dark value from the `.dark` blocks,
// following var() chains across all three tiers, so the numbers are the ones a browser renders.
//
// Colour math is done here: oklch() / oklab() / color-mix(in oklab, …) → OKLab → linear sRGB →
// gamma sRGB. An out-of-gamut colour is clamped per channel and the row says "gamut-clamped";
// CSS chroma-reduction mapping moves these ramps by under 1 Lc. Translucent colours are
// composited over the surface in gamma sRGB, as browsers blend. The focus ring is evaluated at
// the 50% alpha the primitives draw it with (`outline-ring/50`, `focus-visible:ring-ring/50`).
//
// APCA Lc comes from the reference `apca-w3` package (devDependency; licensed for checking web
// content). Nothing from it is copied here. WCAG 2 ratio is computed below.
//
// Run: pnpm --filter @unicron/tokens contrast · exit 1 on any APCA floor miss.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { APCAcontrast, sRGBtoY } from "apca-w3"

const here = path.dirname(fileURLToPath(import.meta.url))
const cssPath = path.join(here, "..", "dist", "tokens.css")
if (!fs.existsSync(cssPath)) {
  console.error("contrast: dist/tokens.css is missing — run `node scripts/build.mjs` first")
  process.exit(1)
}
const css = fs.readFileSync(cssPath, "utf8")

// ── Floors ───────────────────────────────────────────────────────────────────────────────────
const TEXT = 60 // body text
const LARGE = 45 // large or bold text (≥ 24px, or ≥ 18.7px bold)
const UI = 30 // non-text UI: focus ring, control boundary
const BRONZE = 75 // APCA Bronze for text under 16px, reported as a flag

// How the primitives draw a role, when it is not drawn solid.
const RING_ALPHA = 0.5

// ── The table ────────────────────────────────────────────────────────────────────────────────
// [foreground role, background role, floor, note, alpha]. `alpha` composites the foreground at
// that opacity over the background before measuring. `floor: null` rows are reported, not gated:
// `border` and `input` are hairlines in this system (shadcn draws them at neutral.200 / 10%
// white); whether a control boundary has to clear Lc 30 on its own is a separate decision.
//
// WAIVED pairs miss their floor today and are printed as such instead of failing. Each needs a
// ramp step the global tier does not have (a status fill cannot be fixed at tier 2 alone), so
// they are a follow-up to #6, not part of it. A waiver that starts passing fails the run, so it
// gets removed rather than rotting.
const TEXT_SURFACES = ["background", "card", "popover", "sidebar", "accent", "muted", "secondary"]
const PAIRS = [
  ...TEXT_SURFACES.map((bg) => ["foreground", bg, TEXT]),
  ...TEXT_SURFACES.map((bg) => ["muted-foreground", bg, TEXT, "secondary text; ★ is the small-text mark"]),
  ["card-foreground", "card", TEXT],
  ["popover-foreground", "popover", TEXT],
  ["sidebar-foreground", "sidebar", TEXT],
  ["sidebar-foreground", "sidebar-accent", TEXT],
  ["sidebar-accent-foreground", "sidebar-accent", TEXT],
  ["accent-foreground", "accent", TEXT],
  ["secondary-foreground", "secondary", TEXT],
  ["primary-foreground", "primary", TEXT],
  ["sidebar-primary-foreground", "sidebar-primary", TEXT],
  // Status roles: `destructive` is drawn as 14px text (`text-destructive` on buttons, badges and
  // field errors) on the page surfaces; the others are fills under their own `-foreground`.
  ["destructive", "background", TEXT, "status ink"],
  ["destructive", "card", TEXT, "status ink"],
  ["warning-foreground", "warning", TEXT],
  ["info-foreground", "info", TEXT],
  ["protected-foreground", "protected", TEXT],
  ["protected", "background", TEXT],
  // Non-text UI. The ring is measured as drawn: 50% over the surface.
  ...["background", "card", "sidebar", "accent"].map((bg) => ["ring", bg, UI, "at 50% alpha", RING_ALPHA]),
  ...["background", "card", "sidebar", "accent"].map((bg) => ["sidebar-ring", bg, UI, "at 50% alpha", RING_ALPHA]),
  ...["background", "card", "sidebar", "accent"].map((bg) => ["border", bg, null, "hairline; reported only"]),
  ...["background", "card"].map((bg) => ["input", bg, null, "hairline; reported only"]),
].map(([fg, bg, floor, note, alpha]) => ({ fg, bg, floor, note, alpha }))

// mode:foreground:background → why it is waived. Remove the entry once the pair passes.
const WAIVED = new Map([
  ["light:warning-foreground:warning", "neutral.950 on amber.500 is Lc 59; amber.500 needs a darker-text step or a lighter fill"],
  ["dark:info-foreground:info", "neutral.950 on blue.400 is Lc 52; white on it is Lc 57; dark needs its own info fill"],
  ["dark:destructive:background", "red.400 as text on neutral.950 is Lc 47; no lighter red step exists"],
  ["dark:destructive:card", "red.400 as text on neutral.900 is Lc 47; no lighter red step exists"],
])

// ── Resolve the CSS ──────────────────────────────────────────────────────────────────────────
function declarations(selector) {
  const map = new Map()
  const re = new RegExp(`(?:^|\\n)${selector.replace(".", "\\.")} \\{\\n([\\s\\S]*?)\\n\\}`, "g")
  for (const block of css.matchAll(re)) {
    for (const line of block[1].split("\n")) {
      const m = line.match(/^\s*(--[\w-]+):\s*(.+);\s*$/)
      if (m) map.set(m[1], m[2])
    }
  }
  return map
}
const light = declarations(":root")
const darkOnly = declarations(".dark")
const modes = {
  light,
  dark: new Map([...light, ...darkOnly]),
}

/** `var(--a)` chains → a literal CSS colour string, in one mode. */
function resolve(value, mode, seen = new Set()) {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name) => {
    if (seen.has(name)) throw new Error(`circular reference at ${name}`)
    const next = modes[mode].get(name)
    if (next === undefined) throw new Error(`${name} is not defined (${mode})`)
    return resolve(next, mode, new Set([...seen, name]))
  })
}

// ── Colour math ──────────────────────────────────────────────────────────────────────────────
// Internal form: OKLab + alpha. Conversions follow CSS Color 4 (Björn Ottosson's matrices).
const deg = Math.PI / 180

function oklchToOklab(L, C, h) {
  return { L, a: C * Math.cos(h * deg), b: C * Math.sin(h * deg) }
}

function oklabToLinearSrgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

/** OKLab → gamma sRGB in 0..255 (floats). Flags a gamut clamp. */
function toSrgb(lab) {
  const lin = oklabToLinearSrgb(lab)
  const clipped = lin.some((c) => c < -1e-6 || c > 1 + 1e-6)
  return { rgb: lin.map((c) => gamma(Math.min(1, Math.max(0, c))) * 255), clipped }
}

function parseNumber(token, scale = 1) {
  if (token === "none") return 0
  if (token.endsWith("%")) return (parseFloat(token) / 100) * scale
  return parseFloat(token)
}

/** Split a CSS argument list on top-level commas. */
function splitArgs(s) {
  const out = []
  let depth = 0
  let cur = ""
  for (const ch of s) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      out.push(cur.trim())
      cur = ""
    } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

/** A literal CSS colour → { L, a, b, alpha } in OKLab. */
function parseColor(str) {
  const s = str.trim()
  if (s === "transparent") return { L: 0, a: 0, b: 0, alpha: 0 }
  let m
  if ((m = s.match(/^oklch\(\s*([^\s/]+)\s+([^\s/]+)\s+([^\s/)]+)\s*(?:\/\s*([^\s)]+))?\s*\)$/))) {
    const L = parseNumber(m[1])
    const C = parseNumber(m[2], 0.4)
    const h = parseNumber(m[3])
    const alpha = m[4] === undefined ? 1 : parseNumber(m[4])
    return { ...oklchToOklab(L, C, h), alpha }
  }
  if ((m = s.match(/^oklab\(\s*([^\s/]+)\s+([^\s/]+)\s+([^\s/)]+)\s*(?:\/\s*([^\s)]+))?\s*\)$/))) {
    const alpha = m[4] === undefined ? 1 : parseNumber(m[4])
    return { L: parseNumber(m[1]), a: parseNumber(m[2], 0.4), b: parseNumber(m[3], 0.4), alpha }
  }
  if ((m = s.match(/^color-mix\(\s*in\s+(oklab|oklch)\s*,(.*)\)$/s))) {
    const [c1, c2] = splitArgs(m[2])
    if (!c1 || !c2) throw new Error(`color-mix needs two colours: ${s}`)
    const part = (arg) => {
      const pm = arg.match(/^(.*?)\s+([\d.]+)%$/s)
      return pm ? { color: parseColor(pm[1]), p: parseFloat(pm[2]) / 100 } : { color: parseColor(arg), p: undefined }
    }
    let { color: A, p: p1 } = part(c1)
    let { color: B, p: p2 } = part(c2)
    if (p1 === undefined && p2 === undefined) p1 = p2 = 0.5
    else if (p1 === undefined) p1 = 1 - p2
    else if (p2 === undefined) p2 = 1 - p1
    const sum = p1 + p2
    const alphaMultiplier = sum < 1 ? sum : 1
    p1 /= sum
    p2 /= sum
    // Premultiplied interpolation (CSS Color 5 §2.1). Hue-polar mixing in oklch is treated as
    // oklab mixing here; the tokens only mix towards `transparent`, where it is the same thing.
    const wA = A.alpha * p1
    const wB = B.alpha * p2
    const alpha = wA + wB
    if (alpha === 0) return { L: 0, a: 0, b: 0, alpha: 0 }
    return {
      L: (A.L * wA + B.L * wB) / alpha,
      a: (A.a * wA + B.a * wB) / alpha,
      b: (A.b * wA + B.b * wB) / alpha,
      alpha: alpha * alphaMultiplier,
    }
  }
  throw new Error(`cannot parse colour: ${s}`)
}

/** Composite a (possibly translucent) foreground over an opaque background, in gamma sRGB. */
function composite(fg, fgAlpha, bg) {
  return fg.map((c, i) => c * fgAlpha + bg[i] * (1 - fgAlpha))
}

const to8 = (rgb) => rgb.map((c) => Math.round(c))
const hex = (rgb) => "#" + to8(rgb).map((c) => c.toString(16).padStart(2, "0")).join("")

function wcagLuminance(rgb) {
  const [r, g, b] = rgb.map((c) => linear(c / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function wcagRatio(a, b) {
  const la = wcagLuminance(a)
  const lb = wcagLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

// ── Measure ──────────────────────────────────────────────────────────────────────────────────
/** A role → { rgb (0..255, opaque), alpha, clipped } in one mode. Translucent roles keep alpha. */
function roleColor(role, mode) {
  const raw = modes[mode].get(`--${role}`)
  if (raw === undefined) throw new Error(`--${role} is not a tier-2 role (${mode})`)
  const lab = parseColor(resolve(raw, mode))
  const { rgb, clipped } = toSrgb(lab)
  return { rgb, alpha: lab.alpha, clipped, css: resolve(raw, mode) }
}

/** An opaque surface: a translucent background role is flattened over `background` first. */
function surface(role, mode) {
  const c = roleColor(role, mode)
  if (c.alpha >= 1) return c
  const page = roleColor("background", mode)
  return { ...c, rgb: composite(c.rgb, c.alpha, page.rgb), alpha: 1 }
}

const rows = []
let failures = 0
for (const mode of ["light", "dark"]) {
  for (const { fg, bg, floor, note, alpha } of PAIRS) {
    const f = roleColor(fg, mode)
    const b = surface(bg, mode)
    const fgAlpha = alpha ?? f.alpha
    const drawn = to8(composite(f.rgb, fgAlpha, b.rgb))
    const bgRgb = to8(b.rgb)
    const lc = Math.abs(APCAcontrast(sRGBtoY(drawn), sRGBtoY(bgRgb)))
    const wcag = wcagRatio(drawn, bgRgb)
    const gated = floor !== null
    const waiver = WAIVED.get(`${mode}:${fg}:${bg}`)
    const meets = !gated || lc >= floor
    if (waiver && meets) {
      console.error(`✗ contrast: ${mode} ${fg} on ${bg} now clears Lc ${floor} — remove its WAIVED entry`)
      failures++
    }
    const pass = meets || Boolean(waiver)
    if (!pass) failures++
    rows.push({
      mode,
      fg,
      bg,
      fgHex: hex(drawn),
      bgHex: hex(bgRgb),
      lc,
      floor,
      wcag,
      bronze: lc >= BRONZE,
      status: !gated ? "info" : meets ? "pass" : waiver ? "WAIVED" : "FAIL",
      note: [note, waiver, f.clipped || b.clipped ? "gamut-clamped" : null].filter(Boolean).join("; "),
    })
  }
}

// ── Print ────────────────────────────────────────────────────────────────────────────────────
const pad = (s, n, right = false) => (right ? String(s).padStart(n) : String(s).padEnd(n))
const header = `${pad("mode", 5)} ${pad("foreground", 27)} ${pad("on", 15)} ${pad("drawn", 8)} ${pad("surface", 8)} ${pad("Lc", 6, true)} ${pad("floor", 5, true)} ${pad("WCAG", 7, true)}  ${pad("", 6)} note`
console.log(header)
console.log("-".repeat(header.length))
for (const r of rows) {
  const lc = r.lc.toFixed(1)
  const floor = r.floor === null ? "—" : String(r.floor)
  const wcag = `${r.wcag.toFixed(2)}:1`
  const flag = r.status === "pass" && r.bronze ? "pass ★" : r.status
  console.log(
    `${pad(r.mode, 5)} ${pad(r.fg, 27)} ${pad(r.bg, 15)} ${pad(r.fgHex, 8)} ${pad(r.bgHex, 8)} ${pad(lc, 6, true)} ${pad(floor, 5, true)} ${pad(wcag, 7, true)}  ${pad(flag, 6)} ${r.note}`
  )
}
console.log("-".repeat(header.length))
console.log(`floors: text Lc ${TEXT} · large/bold Lc ${LARGE} · non-text UI Lc ${UI} · ★ = Lc ≥ ${BRONZE} (Bronze, text under 16px) · WCAG 2 shown, not gated`)

const gatedRows = rows.filter((r) => r.status !== "info")
const waivedRows = rows.filter((r) => r.status === "WAIVED")
if (failures) {
  console.error(`✗ contrast: ${failures} of ${gatedRows.length} gated pairs under their APCA floor`)
  process.exit(1)
}
console.log(
  `✓ contrast: ${gatedRows.length - waivedRows.length} gated pairs clear their APCA floor` +
    ` (${waivedRows.length} waived, ${rows.length - gatedRows.length} reported only)`
)
