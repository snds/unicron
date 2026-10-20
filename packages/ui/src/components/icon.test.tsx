import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Icon } from "./icon"

describe("Icon", () => {
  // WebKit centres SVG text by the unjoined letters' width before the ligature forms, so a
  // text-anchor="middle" icon lands outside its box in Safari and every Mac app's web view.
  it("anchors the glyph at the left edge, never centred by text-anchor", () => {
    const { container } = render(<Icon name="home" />)
    const text = container.querySelector("svg[data-slot=icon] text")
    expect(text).not.toBeNull()
    expect(text?.getAttribute("x")).toBe("0")
    expect(text?.getAttribute("text-anchor")).toBeNull()
    expect(text?.textContent).toBe("home")
  })

  it("is decorative without a label, and named with one", () => {
    const { container, rerender } = render(<Icon name="home" />)
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true")
    rerender(<Icon name="home" label="Home" />)
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("Home")
    expect(container.querySelector("svg")?.getAttribute("role")).toBe("img")
  })
})
