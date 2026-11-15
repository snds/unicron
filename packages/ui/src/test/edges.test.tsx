// The stylesheet's edges and rules (src/styles/index.css): edge-t and edge-b (contract 5.1b #56)
// draw the same 2px primary edge as edge-l along the top and the bottom, each in a layer of its
// own, so every edge and every rule on one element composes into one box-shadow and none adds
// height. Unit tests cannot see computed styles (css: false), so this reads the stylesheet; the
// playground's Edges view (apps/playground/src/views/edges.tsx) shows them drawn.
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const css = readFileSync(resolve(__dirname, "../styles/index.css"), "utf8")

/** The body of `@utility <name> { … }` (the utilities hold no nested braces). */
function utility(name: string) {
  const match = new RegExp(`@utility ${name} \\{([^}]*)\\}`).exec(css)
  expect(match, `@utility ${name}`).not.toBeNull()
  return match![1]!
}

/** The layers of a box-shadow list, in order: `var(--rule-t)` → `--rule-t`. */
function layers(body: string) {
  const list = /box-shadow:([^;]*);/.exec(body)?.[1] ?? ""
  return [...list.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
}

const RULE_LAYERS = ["--rule-edge", "--rule-edge-t", "--rule-edge-b", "--rule-box", "--rule-t", "--rule-r", "--rule-b", "--rule-l"]
const UTILITIES = ["rule-t", "rule-r", "rule-b", "rule-l", "rule-box", "rule-box-emphasis", "edge-l", "edge-t", "edge-b"]

describe("edge-t and edge-b", () => {
  it("draw the 2px primary edge along the top and the bottom, as an inset shadow", () => {
    expect(utility("edge-t")).toContain("--rule-edge-t: inset 0 var(--stroke-emphasis) 0 0 var(--edge-color, var(--primary-fill));")
    expect(utility("edge-b")).toContain("--rule-edge-b: inset 0 calc(var(--stroke-emphasis) * -1) 0 0 var(--edge-color, var(--primary-fill));")
    // edge-l is unchanged: the same colour rule on the left.
    expect(utility("edge-l")).toContain("--rule-edge: inset var(--stroke-emphasis) 0 0 0 var(--edge-color, var(--primary-fill));")
  })

  it("never draw a border, so they add no height", () => {
    for (const name of ["edge-t", "edge-b"]) expect(utility(name)).not.toMatch(/\bborder\b|outline/)
  })

  it("each has its own layer, registered so it never inherits and is off by default", () => {
    for (const layer of ["--rule-edge-t", "--rule-edge-b"]) {
      const property = new RegExp(`@property ${layer} \\{([^}]*)\\}`).exec(css)?.[1] ?? ""
      expect(property, layer).toContain("inherits: false;")
      expect(property, layer).toContain("initial-value: inset 0 0 0 0 transparent;")
    }
  })
})

describe("every rule and edge composes with the others", () => {
  it("each utility writes the same list of layers, with both new edges in it", () => {
    for (const name of UTILITIES) {
      const own = layers(utility(name))
      expect(own.filter((layer) => layer.startsWith("--rule-")), name).toEqual(RULE_LAYERS)
    }
  })

  it("the unlayered rule that keeps a state's ring beside the rules carries the edges too", () => {
    const unlayered = /:where\(\[class\*="rule-"\], \[class\*="edge-"\]\) \{([^}]*)\}/.exec(css)?.[1] ?? ""
    expect(layers(unlayered).filter((layer) => layer.startsWith("--rule-"))).toEqual(RULE_LAYERS)
  })
})
