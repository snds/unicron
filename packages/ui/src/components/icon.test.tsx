import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MATERIAL_SYMBOLS_VERSION, iconData } from "../icons/data.gen"
import { iconNames, isIconName, parseIconMarkup, registerIcons } from "../icons/registry"
import { Icon, type IconName } from "./icon"

// An app adds its own names like this (against "@unicron/ui" or "@unicron/ui/icon").
declare module "./icon" {
  interface UnicronIconRegistry {
    "test--forward": true
    "test--unsafe": true
  }
}

const names = JSON.parse(readFileSync(resolve(__dirname, "../icons/names.json"), "utf8")) as Record<string, string[] | string>
const drawings = JSON.parse(readFileSync(resolve(__dirname, "../icons/drawings.json"), "utf8")) as Record<string, string>
const map = JSON.parse(readFileSync(resolve(__dirname, "../../codemod/material-to-carbon.json"), "utf8")) as Record<string, unknown>
const svg = (container: HTMLElement) => container.querySelector("svg[data-slot=icon]") as SVGSVGElement

describe("Icon", () => {
  it("draws Material Symbols Rounded, scaled onto the 32 grid, as inline SVG in the current color", () => {
    const { container } = render(<Icon name="arrow--right" />)
    const icon = svg(container)
    expect(icon).toHaveAttribute("viewBox", "0 0 32 32")
    expect(icon).toHaveAttribute("fill", "currentColor")
    expect(icon).toHaveAttribute("data-icon-name", "arrow--right")
    // Material's 960 grid (y from -960) lands on the 32 grid.
    expect(icon.querySelector("g")?.getAttribute("transform")).toBe("matrix(.0333333 0 0 .0333333 0 32)")
    expect(drawings["arrow--right"]).toBe("arrow_forward")
    expect(icon.querySelector("g > path")?.getAttribute("d")).toMatch(/^M/)
    // No icon font: nothing is text, and nothing names a font.
    expect(icon.querySelector("text")).toBeNull()
    expect(icon.textContent).toBe("")
    expect(icon.outerHTML).not.toMatch(/font|style=/)
  })

  it("has no fill prop, and nothing a caller passes overrides the current color", () => {
    // @ts-expect-error -- `fill` is gone in 1.0: a filled glyph is a name of its own (star--filled).
    const typed = <Icon name="star" fill />
    expect(typed.props.name).toBe("star")
    const untyped = { fill: "red" } as Record<string, unknown>
    const { container } = render(<Icon name="star" {...untyped} />)
    expect(svg(container)).toHaveAttribute("fill", "currentColor")
  })

  it("is 20 px by default, 16 px at sm, or the number given", () => {
    const size = (ui: React.ReactElement) => {
      const icon = svg(render(ui).container)
      return [icon.getAttribute("width"), icon.getAttribute("height")]
    }
    expect(size(<Icon name="add" />)).toEqual(["20", "20"])
    expect(size(<Icon name="add" size="md" />)).toEqual(["20", "20"])
    expect(size(<Icon name="add" size="sm" />)).toEqual(["16", "16"])
    expect(size(<Icon name="add" size={32} />)).toEqual(["32", "32"])
  })

  // The size is an attribute, never a class: a control's `[&_svg:not([class*='size-'])]:size-4`
  // and a caller's own size class must both still apply.
  it("sizes with attributes, so any CSS size rule still wins", () => {
    const { container } = render(<Icon name="add" className="size-6" />)
    expect(svg(container).getAttribute("class")).toBe("shrink-0 size-6")
    expect(svg(render(<Icon name="add" />).container).getAttribute("class")).not.toMatch(/size-|w-|h-/)
  })

  it("is decorative without a label, and named with one", () => {
    const { container, rerender } = render(<Icon name="home" />)
    expect(svg(container)).toHaveAttribute("aria-hidden", "true")
    expect(svg(container)).not.toHaveAttribute("role")
    rerender(<Icon name="home" label="Home" />)
    expect(svg(container)).toHaveAttribute("aria-label", "Home")
    expect(svg(container)).toHaveAttribute("role", "img")
    expect(svg(container)).not.toHaveAttribute("aria-hidden")
  })

  it("takes a tone, and passes svg props through", () => {
    const { container } = render(<Icon name="trash-can" tone="destructive" data-icon="inline-start" />)
    expect(svg(container).getAttribute("class")).toContain("text-destructive")
    expect(svg(container)).toHaveAttribute("data-icon", "inline-start")
  })

  it("draws a name it does not know as an empty box of the same size, and marks it", () => {
    const { container } = render(<Icon name={"not-an-icon" as IconName} />)
    expect(svg(container)).toHaveAttribute("data-icon-missing")
    expect(svg(container)).toHaveAttribute("width", "20")
    expect(svg(container).childElementCount).toBe(0)
    expect(svg(render(<Icon name="add" />).container)).not.toHaveAttribute("data-icon-missing")
  })
})

describe("the curated set", () => {
  const curated = Object.keys(iconData)

  it("holds Figma's 57 icons, every target of the Material map, and nothing twice", () => {
    expect(names.figma).toHaveLength(57)
    const listed = Object.entries(names).flatMap(([group, list]) => (group.startsWith("$") ? [] : (list as string[])))
    expect(new Set(listed).size).toBe(listed.length)
    expect([...listed].sort()).toEqual([...curated].sort())
    for (const name of names.figma as string[]) expect(curated, name).toContain(name)
    for (const [material, carbon] of Object.entries(map)) {
      if (!material.startsWith("_") && carbon !== null) expect(curated, `${material} → ${String(carbon)}`).toContain(carbon)
    }
  })

  it("has no sparkle icons", () => {
    expect(curated.filter((name) => /magic|wand|sparkle|ai-generate|ai-label/.test(name))).toEqual([])
  })

  it("says which Material Symbols it came from, and names a drawing for every icon and nothing else", () => {
    expect(MATERIAL_SYMBOLS_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    const drawn = Object.keys(drawings).filter((name) => !name.startsWith("$"))
    expect(drawn.sort()).toEqual([...curated].sort())
    // The 2.0 noun map (Figma): an agent is smart_toy, a skill school, a tool build, a tag label.
    expect([drawings.bot, drawings["skill-level"], drawings.tools, drawings.tag]).toEqual(["smart_toy", "school", "build", "label"])
  })

  // The build script and the component each hold the list of elements and attributes they
  // accept. If they drift, an icon would lose part of its drawing without an error.
  it("draws every icon whole: no element and no attribute is dropped", () => {
    for (const name of curated) {
      const markup = iconData[name as keyof typeof iconData]
      const { container } = render(<svg>{parseIconMarkup(markup)}</svg>)
      const drawn = container.querySelector("svg")!
      expect(drawn.querySelectorAll("*").length, name).toBe(markup.match(/<[a-z]/g)?.length)
      expect(drawn.querySelectorAll("*").length, name).toBeGreaterThan(0)
      const written = [...markup.matchAll(/\s([\w:-]+)="/g)].length
      const kept = [...drawn.querySelectorAll("*")].reduce((sum, element) => sum + element.attributes.length, 0)
      expect(kept, name).toBe(written)
    }
  })

  it("knows a curated name from any other string", () => {
    expect(isIconName("chevron--down")).toBe(true)
    expect(isIconName("keyboard_arrow_down")).toBe(false)
    expect(isIconName("toString")).toBe(false)
  })
})

describe("registerIcons", () => {
  it("adds an app's own glyph under its own name", () => {
    expect(isIconName("test--forward")).toBe(false)
    registerIcons({ "test--forward": '<path d="M4 15h20v2H4z"/><circle cx="26" cy="16" r="2"/>' })
    expect(isIconName("test--forward")).toBe(true)
    const { container } = render(<Icon name="test--forward" />)
    expect(svg(container)).not.toHaveAttribute("data-icon-missing")
    expect(svg(container).querySelector("path")).toHaveAttribute("d", "M4 15h20v2H4z")
    expect(svg(container).querySelector("circle")).toHaveAttribute("r", "2")
  })

  it("keeps groups and their transforms", () => {
    const { container } = render(<svg>{parseIconMarkup('<g transform="rotate(45 16 16)"><rect x="4" y="4" width="8" height="8" rx="1"/></g>')}</svg>)
    const group = container.querySelector("g")!
    expect(group).toHaveAttribute("transform", "rotate(45 16 16)")
    expect(group.querySelector("rect")).toHaveAttribute("width", "8")
  })

  // Markup is parsed into elements, never injected, so a glyph cannot carry script or style.
  it("drops anything that is not a plain shape", () => {
    registerIcons({
      "test--unsafe":
        '<script>alert(1)</script><style>svg{display:none}</style><foreignObject><div>x</div></foreignObject>' +
        '<image href="https://example.com/x.png"/><path d="M0 0h32v32H0z" onclick="alert(1)" style="fill:red" class="x" constructor="y" __proto__="z"/>' +
        '<a href="javascript:alert(1)"><path d="M1 1h2v2H1z"/></a>',
    })
    const { container } = render(<Icon name="test--unsafe" />)
    const icon = svg(container)
    expect([...icon.querySelectorAll("*")].map((element) => element.tagName)).toEqual(["path"])
    expect(icon.querySelector("path")!.getAttributeNames()).toEqual(["d"])
    expect(icon.outerHTML).not.toMatch(/script|style=|onclick|href|foreignObject|javascript/)
  })

  it("lists every name it can draw, the app's own among them", () => {
    const all = iconNames()
    expect(all).toContain("arrow--right")
    expect(all).toContain("test--forward")
    expect(all).toEqual([...all].sort())
    expect(all.length).toBeGreaterThan(Object.keys(iconData).length)
  })

  it("lets a registered glyph stand in for a curated name", () => {
    const before = render(<Icon name="flag" />).container.innerHTML
    registerIcons({ flag: '<path d="M2 2h4v28H2z"/>' })
    const after = render(<Icon name="flag" />).container
    expect(after.innerHTML).not.toBe(before)
    expect(svg(after).querySelector("path")).toHaveAttribute("d", "M2 2h4v28H2z")
  })
})
