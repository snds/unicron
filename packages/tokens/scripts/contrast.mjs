#!/usr/bin/env node
// Contrast gate: every pair the primitives render, judged by what it is for. APCA first, WCAG 2
// reported alongside (docs/02-tokens.md → Contrast).
//
// The method is Emphasis Engine's (snds/emphasis-engine, docs/architecture.md): measure outcomes,
// not variables. A recipe is a pair as a component paints it, through its own opacity modifiers
// and mixes (`bg-input/30`, `ring-ring/50`, `hover:bg-primary/80`), over the stack it sits on.
// Its element kind sets its floor. A role is then pointed at the weakest ramp step that clears
// every recipe it paints; a role with no passing step gets a new tier-1 step.
//
// What it reads: dist/tokens.css (run scripts/build.mjs first; `pnpm test` does). It resolves
// each role's light value from the `:root` blocks and its dark value from the `.dark` blocks,
// following var() chains across all three tiers, so the numbers are the ones a browser renders.
//
// Colour math is done here: oklch() / oklab() / color-mix(in oklab, …) → OKLab → linear sRGB →
// gamma sRGB. An out-of-gamut colour is clamped per channel and the row says "gamut-clamped".
// Translucent layers are composited over the layer below in gamma sRGB, as browsers blend.
//
// APCA Lc comes from the reference `apca-w3` package (devDependency; licensed for checking web
// content). Nothing from it is copied here. WCAG 2 ratio and OKLCH ΔL are computed below.
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

// ── Floors, by element kind ──────────────────────────────────────────────────────────────────
// From Emphasis Engine's intent contract (snds/emphasis-engine, src/engine/intent.ts): a floor
// belongs to what a paint is for, not to a role or a system. Text is judged by APCA first, by use
// as APCA Bronze does:
// - Reading text (primary and secondary text: body, descriptions, placeholders, shortcut keys,
//   inactive tabs) needs Lc 75, Bronze's mark for text under 16px; Unicron's body is 14px. A
//   recipe drawn at 16px or more says `large` and needs Lc 60.
// - A short label on a fill or a tint (buttons, badges, status fills) needs Lc 60, the engine's
//   floor and APCA's minimum for content text. Lc 75 is reported (★) as the target.
// Non-text keeps the engine's WCAG 1.4.11 ratio: APCA has no calibrated target for 1px lines and
// rings. WCAG 2's ratio is printed for every pair as the fallback.
const BRONZE = 75 // reading text under 16px (APCA Bronze)
const TEXT = 60 // text at 16px and above; labels on fills and tints
const KINDS = {
  "text-primary": { metric: "lc", min: BRONZE, reading: true },
  "text-secondary": { metric: "lc", min: BRONZE, reading: true },
  "text-on-tint": { metric: "lc", min: TEXT },
  "on-solid": { metric: "lc", min: TEXT },
  solid: { metric: "lc", min: 30, rule: "Lc 30 against the page" },
  "border-control": { metric: "ratio", min: 3, rule: "3:1 (WCAG 1.4.11)" },
  focus: { metric: "ratio", min: 3, rule: "3:1 as drawn (WCAG 1.4.11)" },
  // Reported, not gated: what a surface, a state or a separator measures, in OKLCH lightness.
  "border-decorative": { metric: "dL" },
  state: { metric: "dL" },
  surface: { metric: "dL" },
}
const TEXT_KINDS = new Set(["text-primary", "text-secondary", "text-on-tint", "on-solid"])

// ── Recipes ──────────────────────────────────────────────────────────────────────────────────
// Every pair the primitives render, read from packages/ui/src: the paint, the stack it sits on
// (bottom first), and what it is for. A paint is a role, a role at an opacity (Tailwind's `/30`
// is color-mix towards transparent), or a two-role mix. Measured as a browser draws it: each
// layer composited over the one below, then the paint over the top. The table follows Emphasis
// Engine's shadcn profile (its probe verified those recipes against the same base-nova source)
// plus the pairs that probe found the profile was missing.
const r = (role, alpha) => ({ role, alpha })
const mix = (a, b, k) => ({ mix: [a, b], k })
const RECIPES = [
  // Surfaces
  { id: "card", source: "card: bg-card", kind: "surface", paint: r("card"), over: [r("background")] },
  { id: "muted", source: "tabs list, toggle on: bg-muted", kind: "surface", paint: r("muted"), over: [r("card")] },
  { id: "accent", source: "select item: bg-accent", kind: "surface", paint: r("accent"), over: [r("popover")] },
  { id: "secondary", source: "button, badge: bg-secondary", kind: "surface", paint: r("secondary"), over: [r("card")] },
  { id: "sidebar", source: "sidebar: bg-sidebar", kind: "surface", paint: r("sidebar"), over: [r("background")] },

  // Primary text
  { id: "fg-page", source: "text-foreground", kind: "text-primary", paint: r("foreground"), over: [r("background")] },
  { id: "fg-card", source: "text-card-foreground", kind: "text-primary", paint: r("card-foreground"), over: [r("card")] },
  { id: "fg-popover", source: "text-popover-foreground", kind: "text-primary", paint: r("popover-foreground"), over: [r("popover")] },
  { id: "fg-muted", source: "ghost: hover:bg-muted hover:text-foreground", kind: "text-primary", paint: r("foreground"), over: [r("card"), r("muted")] },
  { id: "fg-accent", source: "select item: bg-accent text-accent-foreground", kind: "text-primary", paint: r("accent-foreground"), over: [r("popover"), r("accent")] },
  { id: "fg-highlight", source: "menu item: data-highlighted:bg-foreground/10", kind: "text-primary", paint: r("foreground"), over: [r("popover"), r("foreground", 0.1)] },
  { id: "fg-secondary", source: "button, badge secondary: text-secondary-foreground", kind: "text-primary", paint: r("secondary-foreground"), over: [r("card"), r("secondary")] },
  { id: "fg-secondary-hover", source: "secondary: hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]", kind: "text-primary", paint: r("secondary-foreground"), over: [r("card"), mix("secondary", "foreground", 0.05)] },
  { id: "fg-sidebar", source: "sidebar: text-sidebar-foreground", kind: "text-primary", paint: r("sidebar-foreground"), over: [r("sidebar")] },
  { id: "fg-sidebar-accent", source: "sidebar item: bg-sidebar-accent", kind: "text-primary", paint: r("sidebar-accent-foreground"), over: [r("sidebar"), r("sidebar-accent")] },

  // Secondary text: descriptions, placeholders, shortcut keys, inactive tabs
  ...["background", "card", "popover", "sidebar"].map((bg) => ({
    id: `mfg-${bg}`, source: "text-muted-foreground; placeholder:text-muted-foreground", kind: "text-secondary", paint: r("muted-foreground"), over: [r(bg)],
  })),
  // On a fill or a tint, secondary text is a short label (a key, a tab's name, a highlighted row's
  // hint), held to Lc 60 like any label on a tint. Holding it to reading text's Lc 75 on the fill
  // pushed the role a whole level up everywhere else, until secondary read almost as primary.
  { id: "mfg-muted", source: "kbd: bg-muted text-muted-foreground; inactive tab on the tabs list", kind: "text-on-tint", paint: r("muted-foreground"), over: [r("card"), r("muted")] },
  { id: "mfg-accent", source: "item hover: bg-accent with secondary text", kind: "text-on-tint", paint: r("muted-foreground"), over: [r("popover"), r("accent")] },
  { id: "destr-text-card", source: "alert, field error: text-destructive", kind: "text-secondary", paint: r("destructive"), over: [r("card")] },
  { id: "destr-text-page", source: "field error: text-destructive", kind: "text-secondary", paint: r("destructive"), over: [r("background")] },
  { id: "protected-page", source: "protected value: text-protected", kind: "text-secondary", paint: r("protected"), over: [r("background")] },
  { id: "destr-text-accent", source: "text-destructive on a selected or highlighted row (bg-accent)", kind: "text-secondary", paint: r("destructive"), over: [r("popover"), r("accent")] },
  { id: "destr-text-muted", source: "text-destructive on bg-muted", kind: "text-secondary", paint: r("destructive"), over: [r("card"), r("muted")] },

  // Text on a tint
  { id: "destr-label-light", source: "button, badge destructive: bg-destructive/10 text-destructive", kind: "text-on-tint", modes: ["light"], paint: r("destructive"), over: [r("card"), r("destructive", 0.1)] },
  { id: "destr-label-hover-light", source: "destructive: hover:bg-destructive/20", kind: "text-on-tint", modes: ["light"], paint: r("destructive"), over: [r("card"), r("destructive", 0.2)] },
  { id: "destr-label-dark", source: "destructive: dark:bg-destructive/20", kind: "text-on-tint", modes: ["dark"], paint: r("destructive"), over: [r("card"), r("destructive", 0.2)] },

  // Labels on solids
  { id: "pfg", source: "button default: bg-primary text-primary-foreground", kind: "on-solid", paint: r("primary-foreground"), over: [r("card"), r("primary")] },
  { id: "pfg-hover", source: "button default: hover:bg-primary/80", kind: "on-solid", paint: r("primary-foreground"), over: [r("card"), r("primary", 0.8)] },
  { id: "spfg", source: "sidebar: bg-sidebar-primary text-sidebar-primary-foreground", kind: "on-solid", paint: r("sidebar-primary-foreground"), over: [r("sidebar"), r("sidebar-primary")] },
  { id: "warning-fg", source: "warning fill: text-warning-foreground", kind: "on-solid", paint: r("warning-foreground"), over: [r("background"), r("warning")] },
  { id: "info-fg", source: "info fill: text-info-foreground", kind: "on-solid", paint: r("info-foreground"), over: [r("background"), r("info")] },
  { id: "protected-fg", source: "protected fill: text-protected-foreground", kind: "on-solid", paint: r("protected-foreground"), over: [r("background"), r("protected")] },

  // Solids
  { id: "primary-page", source: "bg-primary", kind: "solid", paint: r("primary"), over: [r("background")] },
  { id: "primary-card", source: "bg-primary on a card", kind: "solid", paint: r("primary"), over: [r("card")] },
  // Status fills are solids too: the fill, not only its label, has to show against what it sits on.
  ...["warning", "info"].flatMap((fill) =>
    ["background", "sidebar"].map((bg) => ({
      id: `${fill}-on-${bg}`, source: `bg-${fill} on bg-${bg}`, kind: "solid", paint: r(fill), over: [r(bg)],
    })).concat([{ id: `${fill}-on-accent`, source: `bg-${fill} on a selected row`, kind: "solid", paint: r(fill), over: [r("popover"), r("accent")] }])
  ),

  // Control borders: a field has to be findable
  { id: "input-card", source: "input, select, textarea, checkbox: border-input", kind: "border-control", paint: r("input"), over: [r("card")] },
  { id: "input-page", source: "border-input", kind: "border-control", paint: r("input"), over: [r("background")] },
  { id: "input-popover", source: "fields in a popover or dialog: border-input", kind: "border-control", paint: r("input"), over: [r("popover")] },

  // Focus, as the primitives draw it: ring-ring/50 around the control
  ...["background", "card", "popover", "sidebar"].map((bg) => ({
    id: `ring-${bg}`, source: "focus-visible:ring-ring/50, outline-ring/50", kind: "focus", paint: r("ring", 0.5), over: [r(bg)],
  })),
  { id: "ring-muted", source: "tabs: focus-visible:ring-ring/50 on bg-muted", kind: "focus", paint: r("ring", 0.5), over: [r("card"), r("muted")] },

  // States (reported): a hover or a fill has to differ from rest
  { id: "muted-50", source: "table row, dark ghost: hover:bg-muted/50", kind: "state", paint: r("muted", 0.5), over: [r("card")] },
  { id: "outline-rest", source: "dark:bg-input/30", kind: "state", modes: ["dark"], paint: r("input", 0.3), over: [r("card")] },
  { id: "outline-hover", source: "dark:hover:bg-input/50", kind: "state", modes: ["dark"], paint: r("input", 0.5), over: [r("card")] },
  { id: "switch-off", source: "switch: data-unchecked:bg-input (dark: /80)", kind: "state", paint: r("input"), over: [r("card")] },
  { id: "primary-hover", source: "hover:bg-primary/80 against rest", kind: "state", paint: r("primary", 0.8), over: [r("card")] },
  { id: "destr-tint", source: "bg-destructive/10 (dark /20)", kind: "state", paint: r("destructive", 0.1), over: [r("card")] },
  { id: "item-highlight", source: "data-highlighted:bg-foreground/10", kind: "state", paint: r("foreground", 0.1), over: [r("popover")] },

  // Accent hues as text. Apps assign the hues (tier 1, not roles) and also draw them as text: an
  // area's name, a status word, a link. 500 and 400 are fills; text uses 600 in light and 300 in
  // dark, held to reading text on every neutral surface an app puts it on.
  // Red's text steps are 700 and 200: drawn at more chroma, its 600 and 300 sit a point short on a
  // selected row (they stay in tier 1, unchanged, for anything that points at them).
  ...["blue", "coral", "green", "amber", "red"].flatMap((hue) => [
    ...["0", "50", "100"].map((step) => ({
      id: `${hue}-text-on-${step}`, source: `${hue}.${hue === "red" ? 700 : 600} as text on neutral.${step}`, kind: "text-secondary", modes: ["light"], paint: r(`g-${hue}-${hue === "red" ? 700 : 600}`), over: [r(`g-neutral-${step}`)],
    })),
    ...["950", "900", "800"].map((step) => ({
      id: `${hue}-text-on-${step}`, source: `${hue}.${hue === "red" ? 200 : 300} as text on neutral.${step}`, kind: "text-secondary", modes: ["dark"], paint: r(`g-${hue}-${hue === "red" ? 200 : 300}`), over: [r(`g-neutral-${step}`)],
    })),
  ]),

  // Separators (reported)
  { id: "border-card", source: "border-border", kind: "border-decorative", paint: r("border"), over: [r("card")] },
  { id: "border-page", source: "border-border", kind: "border-decorative", paint: r("border"), over: [r("background")] },
  { id: "card-edge", source: "card: ring-1 ring-foreground/10", kind: "border-decorative", paint: r("foreground", 0.1), over: [r("background")] },
]

// mode:recipe id → why it is waived. A waiver that starts passing fails the run, so it is removed.
const WAIVED = new Map([])

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
/** A role, as a literal CSS colour, in one mode. */
function roleCss(role, mode) {
  const raw = modes[mode].get(`--${role}`)
  if (raw === undefined) throw new Error(`--${role} is not a tier-2 role (${mode})`)
  return resolve(raw, mode)
}

/** A paint → { rgb (0..255), alpha, clipped }. */
function paintColor(p, mode) {
  const css = p.mix
    ? `color-mix(in oklch, ${roleCss(p.mix[0], mode)}, ${roleCss(p.mix[1], mode)} ${p.k * 100}%)`
    : roleCss(p.role, mode)
  const lab = parseColor(css)
  const { rgb, clipped } = toSrgb(lab)
  return { rgb, alpha: lab.alpha * (p.alpha ?? 1), clipped }
}

/** The stack, bottom first, flattened to one opaque colour. A translucent base sits on the page. */
function flatten(stack, mode) {
  let clipped = false
  let base = paintColor(stack[0], mode)
  clipped ||= base.clipped
  let rgb = base.rgb
  if (base.alpha < 1) rgb = composite(base.rgb, base.alpha, paintColor({ role: "background" }, mode).rgb)
  for (const layer of stack.slice(1)) {
    const c = paintColor(layer, mode)
    clipped ||= c.clipped
    rgb = composite(c.rgb, c.alpha, rgb)
  }
  return { rgb, clipped }
}

/** OKLCH lightness of an sRGB colour (0..255). */
function oklabL(rgb) {
  const [r, g, b] = rgb.map((c) => linear(c / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
}

const label = (p) => (p.mix ? `mix(${p.mix[0]},${p.mix[1]} ${p.k * 100}%)` : p.alpha !== undefined ? `${p.role}/${p.alpha * 100}` : p.role)

const rows = []
let failures = 0
for (const mode of ["light", "dark"]) {
  for (const rec of RECIPES) {
    if (rec.modes && !rec.modes.includes(mode)) continue
    const kind = KINDS[rec.kind]
    if (!kind) throw new Error(`${rec.id}: unknown element kind ${rec.kind}`)
    const under = flatten(rec.over, mode)
    const p = paintColor(rec.paint, mode)
    const drawn = to8(composite(p.rgb, p.alpha, under.rgb))
    const bg = to8(under.rgb)
    const lc = Math.abs(APCAcontrast(sRGBtoY(drawn), sRGBtoY(bg)))
    const ratio = wcagRatio(drawn, bg)
    const dL = Math.abs(oklabL(drawn) - oklabL(bg))
    const floor = kind.min === undefined ? null : kind.reading && rec.large ? TEXT : kind.min
    const value = kind.metric === "lc" ? lc : kind.metric === "ratio" ? ratio : dL
    const meets = floor === null || value >= floor
    const waiver = WAIVED.get(`${mode}:${rec.id}`)
    if (waiver && meets) {
      console.error(`✗ contrast: ${mode} ${rec.id} now clears its floor — remove its WAIVED entry`)
      failures++
    }
    if (!meets && !waiver) failures++
    rows.push({
      mode,
      id: rec.id,
      kind: rec.kind,
      metric: kind.metric,
      paint: label(rec.paint),
      on: rec.over.map(label).join(">"),
      fgHex: hex(drawn),
      bgHex: hex(bg),
      lc,
      ratio,
      dL,
      floor,
      status: floor === null ? "info" : !meets ? (waiver ? "WAIVED" : "FAIL") : TEXT_KINDS.has(rec.kind) && lc >= BRONZE && !kind.reading ? "pass ★" : "pass",
      note: [rec.source, waiver, p.clipped || under.clipped ? "gamut-clamped" : null].filter(Boolean).join("; "),
    })
  }
}

// ── Emphasis levels ──────────────────────────────────────────────────────────────────────────
// A floor only says how faint a role may get. Emphasis Engine also places each text role at a
// level (src/engine/intent.ts: primary text at text level 5, secondary at level 3), and the levels
// have to read apart, or secondary text reads as primary and a screen's hierarchy flattens. So
// primary and secondary text sit at least Lc 20 apart on every surface they share.
const LEVEL_GAP = 20
const LEVEL_PAIRS = [["fg-page", "mfg-background"], ["fg-card", "mfg-card"], ["fg-popover", "mfg-popover"], ["fg-sidebar", "mfg-sidebar"]]
const gaps = []
for (const mode of ["light", "dark"]) {
  for (const [hi, lo] of LEVEL_PAIRS) {
    const a = rows.find((r) => r.mode === mode && r.id === hi)
    const b = rows.find((r) => r.mode === mode && r.id === lo)
    if (!a || !b) throw new Error(`levels: ${mode} ${hi} or ${lo} isn't measured`)
    const gap = a.lc - b.lc
    if (gap < LEVEL_GAP) failures++
    gaps.push({ mode, hi, lo, a: a.lc, b: b.lc, gap, meets: gap >= LEVEL_GAP })
  }
}

// ── Print ────────────────────────────────────────────────────────────────────────────────────
const pad = (s, n, right = false) => (right ? String(s).padStart(n) : String(s).padEnd(n))
const measure = (r) =>
  r.metric === "lc" ? `Lc ${r.lc.toFixed(1)}` : r.metric === "ratio" ? `${r.ratio.toFixed(2)}:1` : `ΔL ${r.dL.toFixed(3)}`
const floorText = (r) => (r.floor === null ? "—" : r.metric === "lc" ? `Lc ${r.floor}` : `${r.floor}:1`)
const header = `${pad("mode", 5)} ${pad("recipe", 24)} ${pad("kind", 17)} ${pad("drawn", 8)} ${pad("on", 8)} ${pad("measure", 10, true)} ${pad("floor", 6, true)} ${pad("WCAG", 8, true)} ${pad("APCA", 8, true)}  ${pad("", 6)} source`
console.log(header)
console.log("-".repeat(header.length))
for (const r of rows) {
  console.log(
    `${pad(r.mode, 5)} ${pad(r.id, 24)} ${pad(r.kind, 17)} ${pad(r.fgHex, 8)} ${pad(r.bgHex, 8)} ${pad(measure(r), 10, true)} ${pad(floorText(r), 6, true)} ${pad(`${r.ratio.toFixed(2)}:1`, 8, true)} ${pad(`Lc ${r.lc.toFixed(0)}`, 8, true)}  ${pad(r.status, 6)} ${r.note}`
  )
}
console.log("-".repeat(header.length))
console.log(
  `floors by element kind: reading text Lc ${BRONZE} (APCA Bronze, under 16px) · labels on fills and tints Lc ${TEXT}, ★ = Lc ${BRONZE} · ` +
    `solid Lc 30 against the page · control border and focus 3:1 as drawn (WCAG 1.4.11) · surfaces, states, separators: OKLCH ΔL, reported`
)

console.log(`emphasis levels: primary text over secondary text, at least Lc ${LEVEL_GAP} apart on the same surface`)
for (const g of gaps) {
  console.log(`${pad(g.mode, 5)} ${pad(`${g.hi} / ${g.lo}`, 32)} Lc ${g.a.toFixed(1)} over Lc ${g.b.toFixed(1)}: ${g.gap.toFixed(1)} apart  ${g.meets ? "pass" : "FAIL"}`)
}

const gatedRows = rows.filter((r) => r.status !== "info")
const waivedRows = rows.filter((r) => r.status === "WAIVED")
if (failures) {
  console.error(`✗ contrast: ${failures} misses (recipes under their floor, or emphasis levels too close)`)
  process.exit(1)
}
console.log(
  `✓ contrast: ${gatedRows.length - waivedRows.length} gated recipes clear their floor` +
    ` (${waivedRows.length} waived, ${rows.length - gatedRows.length} reported only)`
)
