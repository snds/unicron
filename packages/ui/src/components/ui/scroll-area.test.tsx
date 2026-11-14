import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ScrollArea } from "./scroll-area"

describe("ScrollArea", () => {
  it("hides the native bar with the stylesheet's own utility (a strict CSP blocks Base UI's inline style)", () => {
    const { container } = render(
      <ScrollArea className="h-20">
        <p>Mira Chen // 09:14</p>
      </ScrollArea>
    )
    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')!
    expect(viewport.className).toContain("no-scrollbar")
    expect(viewport.className).not.toContain("outline-none")
  })

  it("adds no <style> tag to the page: a strict style-src refuses one and reports it", () => {
    render(
      <ScrollArea className="h-20">
        <p>Mira Chen // 09:14</p>
      </ScrollArea>
    )
    // Base UI's root adds one (in <head>) unless it is told not to.
    expect(document.querySelectorAll("style")).toHaveLength(0)
  })
})
