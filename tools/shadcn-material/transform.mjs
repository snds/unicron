#!/usr/bin/env node
// Converts shadcn registry sources (Base UI base + a style file such as Nova)
// into project components that use unicron's <Icon> (IBM Carbon) instead of Lucide.
//
// Why this exists: the shadcn CLI only offers lucide/tabler/hugeicons/phosphor/
// remixicon, and it fetches pre-transformed code from ui.shadcn.com. This script
// does the same transform locally, from a checkout of github.com/shadcn-ui/ui,
// so the output is reproducible and reviewable.
//
// The folder is still called shadcn-material: it first swapped Lucide for Material
// Symbols, and every generated file's first line names "the shadcn-material transform".
// Since unicron 1.0 the icons are Carbon (icon-map.json).
//
// Usage (from the unicron root; see tools/shadcn-material/README.md):
//   node tools/shadcn-material/transform.mjs [--alias-mode package|app] <shadcn-checkout> <out-dir> [component ...]
//   (style defaults to nova; override with SHADCN_STYLE=vega etc.)
//
// --alias-mode package (the default here) writes the package-relative imports
// @unicron/ui uses: src/components/ui/*.tsx, src/components/icon.tsx, src/lib/*,
// src/hooks/*. --alias-mode app writes an app's `@/…` alias imports, for an app
// that generates a primitive of its own.
//
// Vendored from snds/mailbird tools/shadcn-material (where it was first written),
// so unicron regenerates its primitives without a Mailbird checkout.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
let aliasMode = "package"
const at = args.findIndex((a) => a === "--alias-mode" || a.startsWith("--alias-mode="))
if (at >= 0) {
  const inline = args[at].split("=")[1]
  aliasMode = inline ?? args[at + 1]
  args.splice(at, inline === undefined ? 2 : 1)
}
const [checkout, outDir, ...requested] = args
if (!checkout || !outDir || !["app", "package"].includes(aliasMode)) {
  console.error("usage: transform.mjs [--alias-mode package|app] <shadcn-checkout> <out-dir> [component ...]")
  process.exit(1)
}

// Where each kind of import points, from a file in components/ui/.
const ALIASES = {
  app: { utils: "@/lib/utils", ui: "@/components/ui/", hooks: "@/hooks/", lib: "@/lib/", icon: "@/components/icon" },
  package: { utils: "../../lib/utils", ui: "./", hooks: "../../hooks/", lib: "../../lib/", icon: "../icon" },
}[aliasMode]

const style = process.env.SHADCN_STYLE ?? "nova"
const registry = path.join(checkout, "apps/v4/registry")
const uiDir = path.join(registry, "bases/base/ui")
const { $description: _iconMapDoc, ...iconMap } = JSON.parse(fs.readFileSync(path.join(here, "icon-map.json"), "utf8"))
// The curated icon set. An icon the transform emits must be in it, or <Icon> cannot draw it.
const namesFile = path.join(here, "..", "..", "packages", "ui", "src", "icons", "names.json")
const curated = new Set(
  Object.entries(JSON.parse(fs.readFileSync(namesFile, "utf8")))
    .filter(([group]) => !group.startsWith("$"))
    .flatMap(([, names]) => names)
)
// Per-file edits applied after the style is inlined (see overrides.json). This is how a change
// to a generated primitive survives `pnpm regen`: put it here, not only in the output file.
const { $description: _overridesDoc, ...overrides } = JSON.parse(fs.readFileSync(path.join(here, "overrides.json"), "utf8"))

// 1. Style file → { "cn-button-variant-default": "bg-primary ..." }
const css = fs.readFileSync(path.join(registry, `styles/style-${style}.css`), "utf8")
const styleMap = new Map()
for (const m of css.matchAll(/\.(cn-[\w-]+)\s*\{\s*@apply\s+([^;]+);\s*\}/g)) {
  styleMap.set(m[1], m[2].trim().replace(/\s+/g, " "))
}

const unresolved = new Set()

function inlineStyleTokens(src) {
  // Only touch string literals so identifiers are never rewritten.
  return src.replace(/(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g, (whole, q, body) => {
    if (!/\bcn-[\w-]+/.test(body)) return whole
    const replaced = body
      .split(/(\s+)/)
      .map((tok) => {
        if (!/^cn-[\w-]+$/.test(tok)) return tok
        if (styleMap.has(tok)) return styleMap.get(tok)
        unresolved.add(tok)
        return "" // Marker classes with no style rules are dropped, as the registry does.
      })
      .join("")
      .replace(/\s{2,}/g, " ")
      .trim()
    return q + replaced + q
  })
}

function swapIcons(src, file) {
  let icons = 0
  const elements = new Map()
  const out = src.replace(/<IconPlaceholder\b([\s\S]*?)\/>/g, (_, attrs) => {
    const lucide = attrs.match(/lucide="([^"]+)"/)?.[1]
    const to = iconMap[lucide]
    if (!to) throw new Error(`${file}: no Carbon icon mapped for lucide "${lucide}" (edit icon-map.json)`)
    const rest = attrs
      .replace(/\s*(lucide|tabler|hugeicons|phosphor|remixicon)="[^"]*"/g, "")
      .trim()
    if (typeof to === "object") {
      // The icon is replaced by a component (the spinner). That component's own file is hand-owned.
      if (file === `${to.from}.tsx`) throw new Error(`${file}: ${to.element} is hand-owned in unicron (an SVG arc, not an icon); do not regenerate it`)
      elements.set(to.element, to.from)
      return `<${to.element}${rest ? " " + rest : ""} />`
    }
    if (!curated.has(to)) throw new Error(`${file}: "${to}" (for lucide "${lucide}") is not in packages/ui/src/icons/names.json. Add it there and run \`pnpm --filter @unicron/ui icons:build\`.`)
    icons++
    // name goes last so a spread of svg props (which can carry `name`) can't override it.
    return `<Icon${rest ? " " + rest : ""} name="${to}" />`
  })
  if (!icons && !elements.size) return out
  // A component that is just an icon types its props as svg props; Icon's props are those plus its own.
  const iconOnly = icons > 0 && out.includes('React.ComponentProps<"svg">')
  const imports = [
    ...(icons ? [iconOnly ? `import { Icon, type IconProps } from "${ALIASES.icon}"\n` : `import { Icon } from "${ALIASES.icon}"\n`] : []),
    ...[...elements].sort().map(([element, from]) => `import { ${element} } from "${ALIASES.ui}${from}"\n`),
  ]
  return (iconOnly ? out.replaceAll('React.ComponentProps<"svg">', 'Omit<IconProps, "name">') : out).replace(
    /import \{ IconPlaceholder \} from "[^"]+"\n/,
    imports.join("")
  )
}

function applyOverrides(src, file) {
  const entry = overrides[file]
  if (!entry) return { src, why: null }
  let out = src
  for (const { from, to } of entry.replace) {
    if (!out.includes(from)) throw new Error(`${file}: override "${from}" not found in the generated source (upstream changed; update overrides.json)`)
    out = out.split(from).join(to)
  }
  return { src: out, why: entry.why }
}

function rewriteImports(src) {
  return src
    .replace(/from "cn"/g, `from "${ALIASES.utils}"`)
    .replace(/@\/registry\/bases\/base\/ui\//g, ALIASES.ui)
    .replace(/@\/registry\/bases\/base\/hooks\//g, ALIASES.hooks)
    .replace(/@\/registry\/bases\/base\/lib\//g, ALIASES.lib)
}

const files = requested.length
  ? requested.map((n) => `${n}.tsx`)
  : fs.readdirSync(uiDir).filter((f) => f.endsWith(".tsx"))

fs.mkdirSync(outDir, { recursive: true })
for (const file of files) {
  let src = fs.readFileSync(path.join(uiDir, file), "utf8")
  src = swapIcons(src, file)
  src = inlineStyleTokens(src)
  const overridden = applyOverrides(src, file)
  src = rewriteImports(overridden.src)
  // Icon swaps can leave the React namespace import unused (noUnusedLocals).
  if (!/\bReact\./.test(src.replace(/import \* as React from "react"\n/, ""))) {
    src = src.replace(/import \* as React from "react"\n/, "")
  }
  const header =
    aliasMode === "package"
      ? `// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: ${style}). See README → Regenerating components.\n// Edit freely — this is owned source, like any shadcn component.\n`
      : `// Generated by tools/shadcn-material from shadcn/ui (MIT), base: Base UI, style: ${style}.\n// Edit freely — this is owned source, like any shadcn component.\n`
  const provenance = overridden.why ? `// Overrides (tools/shadcn-material/overrides.json): ${overridden.why}\n` : ""
  fs.writeFileSync(path.join(outDir, file), header + provenance + src)
  console.log(`✓ ${file}`)
}

if (unresolved.size) console.log(`dropped marker classes: ${[...unresolved].sort().join(", ")}`)
