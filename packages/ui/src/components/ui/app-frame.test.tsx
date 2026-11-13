import { readFileSync } from "node:fs"
import { join } from "node:path"
import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppFrame, AppFrameDetail, AppFrameHeader, AppFrameMain, AppFrameNav, AppFrameNavItem, AppFramePivot, AppFramePivotEnd, AppFrameSidebar, FoldPanes } from "./app-frame"
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

describe("AppFrameDetail", () => {
  const stubFold = (matchesBook: boolean, sizes: number[]) => {
    window.matchMedia = ((query: string) => ({
      matches: matchesBook && query.includes("horizontal-viewport-segments"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    ;(window as unknown as { viewport?: { segments: { width: number }[] } }).viewport = { segments: sizes.map((width) => ({ width })) }
  }
  const mounts = vi.fn()
  function Content() {
    React.useEffect(() => {
      mounts()
    }, [])
    return <p>The content</p>
  }
  const show = (open: boolean, onOpenChange = () => {}) => (
    <AppFrame>
      <AppFrameMain>
        <AppFrameDetail open={open} onOpenChange={onOpenChange} title="Details" detail={<p>The details</p>}>
          <Content />
        </AppFrameDetail>
      </AppFrameMain>
    </AppFrame>
  )

  beforeEach(() => {
    mounts.mockClear()
    stubFold(false, [])
  })

  it("sits beside the content on a laptop, and goes when closed, leaving the content mounted", () => {
    setViewport(1440, 900)
    const { rerender } = render(show(false))
    expect(screen.queryByText("The details")).not.toBeInTheDocument()
    rerender(show(true))
    expect(screen.getByRole("complementary", { name: "Details" })).toHaveTextContent("The details")
    expect(screen.getByRole("separator", { name: "Resize Details" })).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    rerender(show(false))
    expect(screen.queryByText("The details")).not.toBeInTheDocument()
    expect(screen.getByText("The content")).toBeInTheDocument()
    expect(mounts).toHaveBeenCalledTimes(1)
  })

  it("closes from its own button", () => {
    setViewport(1440, 900)
    const onOpenChange = vi.fn()
    render(show(true, onOpenChange))
    fireEvent.click(screen.getByRole("button", { name: "Close Details" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it.each([
    ["a phone", 390, 844],
    ["a phone on its side", 844, 390],
    ["an iPad upright", 820, 1180],
  ])("slides over on %s", (_, width, height) => {
    setViewport(width, height)
    render(show(true))
    expect(screen.getByRole("dialog", { name: "Details" })).toHaveTextContent("The details")
    expect(screen.queryByRole("separator")).not.toBeInTheDocument()
  })

  it("takes the far side of a book-pose fold, whether or not it's open, with nothing to close", () => {
    stubFold(true, [330, 330])
    setViewport(669, 867)
    render(show(false))
    expect(screen.getByRole("complementary", { name: "Details" })).toHaveTextContent("The details")
    expect(screen.queryByRole("button", { name: "Close Details" })).not.toBeInTheDocument()
    expect(screen.queryByRole("separator")).not.toBeInTheDocument()
  })
})

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

  it("uses the measured height, because 100vh can run off the screen in a home-screen app", () => {
    setViewport(390, 793)
    render(<AppFrame data-testid="frame" />)
    expect(screen.getByTestId("frame").style.getPropertyValue("--viewport-page-height")).toBe("793px")
    expect(css).not.toMatch(/--app-frame-height:\s*100vh/)
  })

  it("says where the nav goes", () => {
    setViewport(844, 390)
    render(<AppFrame data-testid="frame" />)
    expect(screen.getByTestId("frame")).toHaveAttribute("data-nav", "rail")
  })

  it("has no keyboard state when no keyboard is up", () => {
    setViewport(390, 844)
    render(<AppFrame data-testid="frame" />)
    const frame = screen.getByTestId("frame")
    expect(frame).not.toHaveAttribute("data-keyboard")
    expect(frame).toHaveAttribute("data-room", "full")
  })
})

describe("the columns", () => {
  it("names the pivot, marks where you are, and holds the list beside the content", () => {
    render(
      <AppFrame>
        <AppFramePivot aria-label="Places">
          <AppFrameNavItem icon="home" label="Home" current />
          <AppFramePivotEnd>
            <button type="button">Settings</button>
          </AppFramePivotEnd>
        </AppFramePivot>
        <AppFrameSidebar aria-label="Conversations">List</AppFrameSidebar>
        <AppFrameMain>Content</AppFrameMain>
      </AppFrame>
    )
    expect(screen.getByRole("navigation", { name: "Places" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("complementary", { name: "Conversations" })).toHaveTextContent("List")
  })

  it("has a place in the frame's grid for each", () => {
    for (const area of ["pivot", "sidebar", "header", "main"]) expect(css).toContain(`grid-area: ${area};`)
  })
})

describe("AppFrameMain", () => {
  it("can let content run under the nav", () => {
    render(<AppFrameMain bleed data-testid="main" />)
    expect(screen.getByTestId("main")).toHaveAttribute("data-bleed")
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
    // 1.0: the value is the `ui` role (15px, Figma 32:48); on a touch screen it is the body size,
    // 16px, so iOS does not zoom into the field when it takes focus.
    render(<Field aria-label="field" />)
    const { className } = screen.getByLabelText("field")
    expect(className).toContain("type-ui")
    expect(className).toContain("pointer-coarse:text-(length:--type-body-size)")
    expect(className).not.toMatch(/(^|\s)md:text-sm/)
  })
})
