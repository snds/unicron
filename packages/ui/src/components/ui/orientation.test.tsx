import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { render } from "@testing-library/react"

import { Separator } from "./separator"
import { Tabs, TabsList, TabsTrigger } from "./tabs"

// The generated components style orientation with `data-horizontal:` / `data-vertical:`. Base UI
// only sets data-orientation, so those classes need the custom variants in index.css; without
// them the line tab's marker, separators and scroll bars drew at zero size.
const css = readFileSync(join(__dirname, "../../styles/index.css"), "utf8")
const ui = __dirname
const users = readdirSync(ui)
  .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
  .filter((f) => /data-(horizontal|vertical)\b/.test(readFileSync(join(ui, f), "utf8")))

describe("orientation variants", () => {
  it.each(["horizontal", "vertical"])("index.css maps data-%s to data-orientation", (o) => {
    const rule = new RegExp(`@custom-variant data-${o}\\s*\\{\\s*&:where\\(\\[data-orientation="${o}"\\]\\)`)
    expect(css).toMatch(rule)
  })

  it.each(["open", "closed", "checked", "unchecked", "disabled", "active"])("index.css defines data-%s as shadcn does", (s) => {
    expect(css).toMatch(new RegExp(`@custom-variant data-${s}\\s*\\{[^}]*\\[data-${s}\\]:not\\(\\[data-${s}="false"\\]\\)`))
  })

  it("data-selected matches cmdk's \"true\" only, so items it marks \"false\" aren't drawn selected", () => {
    expect(css).toMatch(/@custom-variant data-selected\s*\{\s*&:where\(\[data-selected="true"\]\)/)
  })

  it("is needed: components use the variants", () => {
    expect(users).toEqual(expect.arrayContaining(["separator.tsx", "tabs.tsx"]))
  })

  it("Base UI marks the orientation the variants read", () => {
    const { container } = render(
      <>
        <Separator />
        <Tabs defaultValue="a">
          <TabsList variant="line">
            <TabsTrigger value="a">A</TabsTrigger>
          </TabsList>
        </Tabs>
      </>,
    )
    expect(container.querySelector('[data-slot="separator"]')).toHaveAttribute("data-orientation", "horizontal")
    expect(container.querySelector('[data-slot="tabs"]')).toHaveAttribute("data-orientation", "horizontal")
    const trigger = container.querySelector('[data-slot="tabs-trigger"]')
    expect(trigger).toHaveAttribute("data-active")
    // Hover previews the line marker; the selected tab keeps it solid.
    expect(trigger?.className).toContain("group-data-[variant=line]/tabs-list:not-data-active:hover:after:opacity-40")
  })
})
