// The view registry. Every file in ./views/*.tsx is a view, reachable as ?view=<file name>.
// Nothing else registers one: add a file, and it is in the picker and in scripts/shots.mjs.
// Not views: a file whose name starts with "_" (parts that views share), a *.test.tsx, and
// anything in a folder under ./views.
//
// A view file exports one React component. Any of these is found, in this order:
//   export default function …        the default export
//   export function View() …         a named export called View
//   export function ListRowView() …  the file name in PascalCase, with or without "View"
//   the first exported component     (a function whose name starts with a capital)
//
// Views load on demand, one chunk each, so a view that fails to load breaks only its own page.
import { lazy, type ComponentType, type LazyExoticComponent } from "react"

type ViewModule = Record<string, unknown>

export interface PlaygroundView {
  /** The file name without its extension; the value of ?view=. */
  id: string
  /** The id in sentence case: "list-row" → "List row". */
  title: string
  Component: LazyExoticComponent<ComponentType>
}

/** The view shown when the address names none. */
export const DEFAULT_VIEW = "foundations"

const modules = import.meta.glob<ViewModule>(["./views/*.tsx", "!./views/_*.tsx", "!./views/*.test.tsx"])

function isComponent(value: unknown): value is ComponentType {
  if (typeof value === "function") return true
  // memo(), forwardRef() and lazy() return objects.
  return typeof value === "object" && value !== null && "$$typeof" in value
}

function pascal(id: string) {
  return id.replace(/(^|[-_.])(\w)/g, (_, __, letter: string) => letter.toUpperCase())
}

function pick(module: ViewModule, id: string): ComponentType {
  const name = pascal(id)
  for (const key of ["default", "View", `${name}View`, name]) {
    if (isComponent(module[key])) return module[key]
  }
  for (const [key, value] of Object.entries(module)) {
    if (/^[A-Z]/.test(key) && isComponent(value)) return value
  }
  throw new Error(`views/${id}.tsx exports no component. Export one as default, or by name.`)
}

function title(id: string) {
  const words = id.replace(/[-_.]+/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export const views: readonly PlaygroundView[] = Object.entries(modules)
  .map(([path, load]) => {
    const id = path.replace(/^.*\/([^/]+)\.tsx$/, "$1")
    return { id, title: title(id), Component: lazy(async () => ({ default: pick(await load(), id) })) }
  })
  // Foundations first: everything else is built from it. The rest by name.
  .sort((a, z) => Number(z.id === DEFAULT_VIEW) - Number(a.id === DEFAULT_VIEW) || a.id.localeCompare(z.id))

export function findView(id: string): PlaygroundView | undefined {
  return views.find((view) => view.id === id)
}
