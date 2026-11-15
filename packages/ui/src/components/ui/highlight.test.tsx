import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Highlight, highlightParts } from "./highlight"

describe("highlightParts", () => {
  it("cuts at every match, case aside, and joins back to the text exactly", () => {
    const parts = highlightParts("Add baseline drift check: Drift", "drift")
    expect(parts.filter((p) => p.match).map((p) => p.text)).toEqual(["drift", "Drift"])
    expect(parts.map((p) => p.text).join("")).toBe("Add baseline drift check: Drift")
  })

  it("matches accents aside, and the longest of several words first", () => {
    expect(highlightParts("Café Roseville", "cafe").find((p) => p.match)?.text).toBe("Café")
    const parts = highlightParts("baseline drift check", ["drift", "drift check"])
    expect(parts.filter((p) => p.match).map((p) => p.text)).toEqual(["drift check"])
  })

  it("an empty query matches nothing; special characters are literal", () => {
    expect(highlightParts("Mira Chen", "  ")).toEqual([{ text: "Mira Chen", match: false }])
    expect(highlightParts("a (b) c", "(b)").find((p) => p.match)?.text).toBe("(b)")
  })
})

describe("Highlight (contract 5.1b #45)", () => {
  it("marks each match with primary-soft behind it and the text's own colour", () => {
    const { container } = render(
      <p>
        <Highlight text="Visual QA: baseline drift check" query="drift" />
      </p>
    )
    const marks = container.querySelectorAll("mark")
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent("drift")
    expect(marks[0]).toHaveAttribute("data-slot", "highlight")
    expect(marks[0].className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-primary-soft", "[color:inherit]"]))
    expect(container.querySelector("p")).toHaveTextContent("Visual QA: baseline drift check")
  })

  it("on a selected row (itself primary-soft) the match also takes the primary edge under it", () => {
    render(<Highlight>drift</Highlight>)
    expect(screen.getByText("drift").className).toContain("in-[[data-selected]]:shadow-[inset_0_calc(var(--stroke-emphasis)*-1)_0_var(--primary-fill)]")
  })

  it("marks its children as given", () => {
    render(<Highlight>harness/visual-qa</Highlight>)
    expect(screen.getByText("harness/visual-qa").tagName).toBe("MARK")
  })
})
