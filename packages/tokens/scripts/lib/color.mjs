// Colour math shared by scripts/contrast.mjs and scripts/figma-parity.mjs.
//
// Internal form: OKLab + alpha. Conversions follow CSS Color 4 (Björn Ottosson's matrices).
// A literal sRGB colour (#hex, rgb()) keeps its exact 8-bit channels beside the OKLab form, so it
// comes back out as the same hex it went in as: Figma's values are sRGB hex, and the parity check
// compares them to the digit.

const deg = Math.PI / 180

export const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
export const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

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

/** Gamma sRGB (0..255) → OKLab { L, a, b }. */
export function srgbToOklab(rgb) {
  const [r, g, b] = rgb.map((c) => linear(c / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

/** OKLCH lightness of an sRGB colour (0..255). */
export const oklabL = (rgb) => srgbToOklab(rgb).L

/** OKLab → OKLCH { L, C, h } (h in degrees, 0..360). */
export function oklabToOklch({ L, a, b }) {
  const h = (Math.atan2(b, a) / deg + 360) % 360
  return { L, C: Math.hypot(a, b), h }
}

/** OKLab → gamma sRGB in 0..255 (floats). Flags a gamut clamp. A literal sRGB colour returns its own channels. */
export function toSrgb(lab) {
  if (lab.rgb) return { rgb: lab.rgb, clipped: false }
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
export function splitArgs(s) {
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

const fromSrgb = (rgb, alpha) => ({ ...srgbToOklab(rgb), alpha, rgb })

/** A literal CSS colour → { L, a, b, alpha } in OKLab (plus `rgb` when it was written in sRGB). */
export function parseColor(str) {
  const s = str.trim()
  if (s === "transparent") return { L: 0, a: 0, b: 0, alpha: 0 }
  let m
  if ((m = s.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i))) {
    let h = m[1]
    if (h.length <= 4) h = [...h].map((c) => c + c).join("")
    const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
    return fromSrgb(rgb, h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1)
  }
  // Modern syntax only: rgb(20 22 24 / 0.64). The tokens write nothing else.
  if ((m = s.match(/^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/))) {
    return fromSrgb([m[1], m[2], m[3]].map(Number), m[4] === undefined ? 1 : parseNumber(m[4]))
  }
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
    // oklab mixing here; the tokens mix in oklab, and the recipes only mix towards a near-neutral.
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
export function composite(fg, fgAlpha, bg) {
  return fg.map((c, i) => c * fgAlpha + bg[i] * (1 - fgAlpha))
}

export const to8 = (rgb) => rgb.map((c) => Math.round(c))
export const hex = (rgb) => "#" + to8(rgb).map((c) => c.toString(16).padStart(2, "0")).join("")

function wcagLuminance(rgb) {
  const [r, g, b] = rgb.map((c) => linear(c / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function wcagRatio(a, b) {
  const la = wcagLuminance(a)
  const lb = wcagLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** How far apart two sRGB colours are: OKLab distance (ΔEOK), and the hue angle between them. */
export function difference(a, b) {
  const A = srgbToOklab(a)
  const B = srgbToOklab(b)
  const ha = oklabToOklch(A)
  const hb = oklabToOklch(B)
  const dh = Math.abs(ha.h - hb.h)
  return {
    dE: Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b),
    dL: Math.abs(A.L - B.L),
    dH: Math.min(dh, 360 - dh),
  }
}
