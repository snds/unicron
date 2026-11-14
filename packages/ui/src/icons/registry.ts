// Owned module (not generated): the icon registry behind <Icon>. It holds the curated Carbon set
// (data.gen.ts) and any glyph an app adds with registerIcons(), and turns markup into elements.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 18:738; no app PR, no DSA record)
import { createElement, type ReactNode } from "react"

import { iconData, type CoreIconName } from "./data.gen"

export type { CoreIconName }

/**
 * Names an app adds with `registerIcons()`. Empty here; an app extends it so its own names
 * type-check as `IconName`:
 *
 * ```ts
 * declare module "@unicron/ui" {
 *   interface UnicronIconRegistry {
 *     "vale--forward": true
 *   }
 * }
 * ```
 *
 * `"@unicron/ui/icon"` works as the module name too. Only the keys matter; the values are not read.
 */
export interface UnicronIconRegistry {}

/** A name `<Icon>` can draw: the curated Carbon set, plus what the app registered. */
export type IconName = CoreIconName | Extract<keyof UnicronIconRegistry, string>

const registered = new Map<string, string>()
const parsed = new Map<string, ReactNode[]>()

/**
 * Add app-only glyphs. Each value is the inner markup of an `<svg viewBox="0 0 32 32">`, drawn as
 * filled shapes in the current color (Carbon's grid: 2 px lines on 32). Call it once, before the
 * first render. The curated set is the home for an icon; register one only when Carbon has none.
 *
 * A registered name wins over a curated one, so an app's glyph stays the same if the curated set
 * later gains that name. Markup is read, never injected: only `path`, `circle`, `rect` and `g`
 * with plain drawing attributes are kept.
 */
export function registerIcons(icons: Record<string, string>): void {
  for (const [name, markup] of Object.entries(icons)) {
    registered.set(name, markup)
    parsed.delete(name)
  }
}

/** Whether `<Icon>` can draw this name. For names that arrive as data (a stored template, a server). */
export function isIconName(name: string): name is IconName {
  return registered.has(name) || Object.hasOwn(iconData, name)
}

/** Every name `<Icon>` can draw right now, in order: the curated set and what the app registered. For a picker. */
export function iconNames(): IconName[] {
  return [...new Set([...Object.keys(iconData), ...registered.keys()])].sort() as IconName[]
}

// Keep in step with scripts/build-icons.mjs (icon.test.tsx checks every curated icon survives parsing).
const ELEMENTS = new Set(["path", "circle", "rect", "g"])
// SVG attribute → the React prop that writes it.
const ATTRIBUTES = new Map([
  ...["d", "cx", "cy", "r", "x", "y", "width", "height", "rx", "ry", "transform", "fill", "opacity", "data-icon-path"].map((name) => [name, name] as const),
  ["fill-rule", "fillRule"],
  ["clip-rule", "clipRule"],
  ["stroke-width", "strokeWidth"],
])
const TAG = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g
const ATTRIBUTE = /([\w:-]+)="([^"]*)"/g

/**
 * Markup → elements, without innerHTML. An unknown element is skipped with everything inside it;
 * an unknown attribute is dropped. So a registered glyph can carry nothing that runs or styles.
 */
export function parseIconMarkup(markup: string): ReactNode[] {
  type Open = { element: string; props: Record<string, string>; children: ReactNode[] }
  const top: ReactNode[] = []
  const open: Open[] = []
  const into = () => open[open.length - 1]?.children ?? top
  const close = (node: Open) => {
    const siblings = into()
    siblings.push(createElement(node.element, { key: siblings.length, ...node.props }, ...node.children))
  }
  let skipping = 0
  for (const [, closing, element, attributes, selfClosing] of markup.matchAll(TAG)) {
    if (closing) {
      if (skipping > 0) skipping--
      else if (open.length) close(open.pop()!)
      continue
    }
    if (skipping > 0 || !ELEMENTS.has(element!)) {
      if (!selfClosing) skipping++
      continue
    }
    const props: Record<string, string> = {}
    for (const [, attribute, value] of attributes!.matchAll(ATTRIBUTE)) {
      const prop = ATTRIBUTES.get(attribute!)
      if (prop) props[prop] = value!
    }
    const node: Open = { element: element!, props, children: [] }
    if (selfClosing) close(node)
    else open.push(node)
  }
  // Anything left open is closed at the end, as a browser would.
  while (open.length) close(open.pop()!)
  return top
}

/** The drawing for a name, parsed once. `null` when nothing is registered under it. */
export function iconNodes(name: string): ReactNode[] | null {
  const cached = parsed.get(name)
  if (cached) return cached
  const markup = registered.get(name) ?? (Object.hasOwn(iconData, name) ? iconData[name as CoreIconName] : undefined)
  if (markup === undefined) return null
  const nodes = parseIconMarkup(markup)
  parsed.set(name, nodes)
  return nodes
}
