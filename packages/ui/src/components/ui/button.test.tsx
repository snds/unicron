import { readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { buttonVariants } from "./button"

const VARIANTS = ["default", "secondary", "outline", "ghost", "ghost-muted", "destructive", "ghost-destructive", "link"] as const
const classesOf = (props: Parameters<typeof buttonVariants>[0]) => buttonVariants(props).split(/\s+/)

// A link drawn as a button takes buttonVariants' classes straight into className, with no merge of
// its own. Unmerged, the base's border-transparent and the outline's border-border both landed,
// and the transparent one won in light mode: the link had no edge beside a real button.
describe("buttonVariants", () => {
  it("merges its classes, so the variant's border colour is the only one", () => {
    const classes = buttonVariants({ variant: "outline" }).split(/\s+/)
    expect(classes).toContain("border-border")
    expect(classes).not.toContain("border-transparent")
  })

  it("keeps a caller's class over the variant's", () => {
    const classes = buttonVariants({ variant: "outline", className: "border-input" }).split(/\s+/)
    expect(classes).toContain("border-input")
    expect(classes).not.toContain("border-border")
  })
})

describe("Button focus and invalid rings (VQA 2026-10-28)", () => {
  it("the destructive variant uses the shared ring, not a faint red one (1.43:1 in light)", () => {
    const classes = classesOf({ variant: "destructive" })
    expect(classes).toContain("focus-visible:ring-ring/50")
    expect(classes.some((c) => c.startsWith("focus-visible:ring-destructive"))).toBe(false)
    expect(classes.some((c) => c.startsWith("dark:focus-visible:ring-destructive"))).toBe(false)
  })

  it("every invalid ring in the primitives is drawn at the alpha the contrast gate measures", () => {
    // scripts/contrast.mjs gates aria-invalid:ring-destructive/60 (light) and /50 (dark) at 3:1.
    const dir = import.meta.dirname
    const found = readdirSync(dir)
      .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
      .flatMap((f) => readFileSync(resolve(dir, f), "utf8").match(/\S*ring-destructive\/\d+/g) ?? [])
    expect(found.length).toBeGreaterThan(0)
    for (const cls of found) {
      expect(cls).toMatch(/aria-invalid/)
      expect(cls).toMatch(cls.startsWith("dark:") ? /\/50$/ : /\/60$/)
    }
  })
})

describe("Button states (VQA 2026-10-28)", () => {
  it.each(VARIANTS)("%s has a pressed fill or ink that differs from its hover", (variant) => {
    const classes = classesOf({ variant })
    const hover = classes.filter((c) => /^hover:(bg|text)-/.test(c)).map((c) => c.slice("hover:".length))
    const active = classes.filter((c) => /^active:(bg|text)-/.test(c)).map((c) => c.slice("active:".length))
    expect(active.length).toBeGreaterThan(0)
    for (const a of active) expect(hover).not.toContain(a)
  })

  it("ghost-destructive hovers on its own tint, so the hover shows on a muted footer", () => {
    const classes = classesOf({ variant: "ghost-destructive" })
    expect(classes).toContain("hover:bg-destructive/10")
    expect(classes).not.toContain("hover:bg-muted")
  })

  it("an inline text action is underlined at rest", () => {
    expect(classesOf({ variant: "link", size: "inline" })).toContain("underline")
  })

  it("transitions on the motion roles, not transition-all on Tailwind's curve", () => {
    const classes = classesOf({})
    expect(classes).not.toContain("transition-all")
    expect(classes.some((c) => c.startsWith("transition-["))).toBe(true)
  })
})
