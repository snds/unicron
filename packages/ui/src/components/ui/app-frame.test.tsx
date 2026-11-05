import { readFileSync } from "node:fs"
import { join } from "node:path"
import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { AppFrame, AppFrameHeader, AppFrameMain, AppFrameNav, AppFrameNavItem, FoldPanes } from "./app-frame"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { SHORT_HEIGHT } from "../use-viewport"

const css = readFileSync(join(__dirname, "../../styles/index.css"), "utf8")

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

describe("AppFrame", () => {
  it("names its nav items, and marks only the current one", () => {
    render(
      <AppFrame>
        <AppFrameHeader>Bar</AppFrameHeader>
        <AppFrameMain>Content</AppFrameMain>
        <AppFrameNav aria-label="Places">
          <AppFrameNavItem icon="home" label="Home" current />
          <AppFrameNavItem icon="search" label="Search" />
        </AppFrameNav>
      </AppFrame>
    )
    expect(screen.getByRole("navigation", { name: "Places" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("button", { name: "Search" })).not.toHaveAttribute("aria-current")
  })

  it("puts the page back if a rotation left it scrolled", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
    setViewport(844, 390)
    render(<AppFrame />)
    Object.defineProperty(window, "scrollY", { configurable: true, value: 72 })
    setViewport(390, 844)
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 })
    scrollTo.mockRestore()
  })

  it("has no keyboard state when no keyboard is up", () => {
    setViewport(390, 844)
    render(<AppFrame data-testid="frame" />)
    const frame = screen.getByTestId("frame")
    expect(frame).not.toHaveAttribute("data-keyboard")
    expect(frame).toHaveAttribute("data-room", "full")
  })
})

describe("FoldPanes", () => {
  it("says how it splits", () => {
    render(<FoldPanes split="rows" data-testid="panes" />)
    expect(screen.getByTestId("panes")).toHaveAttribute("data-split", "rows")
  })
})

describe("the stylesheet", () => {
  it("draws the same line as the hook for a short screen", () => {
    expect(css).toContain("@custom-variant short (@media (orientation: landscape) and (max-height: 479.98px))")
    expect(SHORT_HEIGHT).toBe(480)
  })

  it("stops the page scrolling only under an AppFrame, so other pages keep theirs", () => {
    expect(css).toMatch(/:has\(\[data-slot="app-frame"\]\)/)
  })
})

// iOS zooms the whole page into a focused field under 16px, and doesn't zoom back out.
describe("text fields on touch", () => {
  it.each([
    ["Input", Input],
    ["Textarea", Textarea],
  ] as const)("%s only drops under 16px with a mouse", (_, Field) => {
    render(<Field aria-label="field" />)
    const { className } = screen.getByLabelText("field")
    expect(className).toContain("text-base")
    expect(className).toContain("pointer-fine:md:text-sm")
    expect(className).not.toMatch(/(^|\s)md:text-sm/)
  })
})
